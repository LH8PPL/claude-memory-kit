// `cmk doctor` — health checks HC-1..HC-16 (Task 37, T-031; memsearch HC-1/HC-7 removed in Task 120; HC-8 native bindings added in Task 141a; HC-9 version-drift/update-path added in Task 162 / D-176; HC-13 stray-tier backstop added in Task 248; HC-14 active health warnings added in Task 250 / D-412; HC-15 semantic vector-mapping audit added in Task 261 / D-421; HC-16 fact-reachability added in Task 270 / D-427).
//
// Public boundary:
//   async runDoctor({projectRoot, userDir, now, promptUser?, ...overrides})
//     → {action: 'completed' | 'error', checks: [HCResult], duration_ms}
//
// HCResult shape:
//   {
//     id: 'HC-1' | ... | 'HC-16',
//     name: string,
//     status: 'pass' | 'warn' | 'fail' | 'skip',   // `warn` = advisory (Task 245)
//     message: string,
//     recoveryCommand?: string,   // surfaced on fail
//     requiresInstall?: boolean,  // if true, caller must promptUser first
//   }
//
// Per design §14. Composes on:
//   - cooldown.mjs (HC-2 distill freshness via cooldown marker mtime is
//     NOT used — we read recent.md mtime directly, more accurate)
//   - lazy-compress.mjs::cronSentinelPath (HC-5 cron registration check)
//   - lock-discipline.mjs::detectStaleLocks (HC-7)
//   - platform-commands.mjs — cross-platform repair command emission
//
// Critical rule per design §14 + tasks.md 37.5: any repair requiring
// `pip install` / `npm install` / system-level changes MUST ASK the
// user first. (I1 fix 2026-05-28: previously cited NFR-9 which is
// actually "Memory poisoning defense baseline" per requirements-revisions-proposed.md
// — the ask-before-install rule has no FR/NFR backing today; promoting
// it is a v0.1.x candidate.) runDoctor records `requiresInstall: true`
// on those HCResults and the CLI handler surfaces the command without
// auto-invoking it.

import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { nowIso } from './audit-log.mjs';
import { listFactFiles, tiersFor } from './fact-store.mjs';
// Task 270 (HC-16): the fact-reachability check asks index-rebuild's OWN parser
// whether each file is indexable — so the check can never disagree with the
// thing it is auditing.
import { resolveTierRoot, resolveFactDir } from './tier-paths.mjs';
import { parseObservationsFromFactFile } from './index-rebuild.mjs';
import { detectStaleLocks } from './lock-discipline.mjs';
import { cronSentinelPath } from './lazy-compress.mjs';
// Task 47 (D-354): HC-5 asks the HOST what is registered instead of reading
// back the kit's own sentinel. CRON_ENTRY_NAME / WEEKLY_ENTRY_NAME come from
// register-crons so the check can never look for a name the writer stopped using.
import { CRON_ENTRY_NAME, WEEKLY_ENTRY_NAME } from './register-crons.mjs';
import { readRegisteredJob } from './scheduler-state.mjs';
import { isCompactionNeeded } from './compaction-state.mjs';
import { getNativeAutoMemoryState } from './native-memory.mjs';
import { checkKitBinding, checkEmbedderBinding } from './native-binding.mjs';
import { resolveDefaultSearchMode, verifyVectorMapping, DEFAULT_MODEL_ID } from './semantic-backend.mjs';
// Task 250 (D-412) — HC-14 reads the SAME active-warning computation the
// per-prompt whisper reads, so the two surfaces can never disagree.
import { activeWarnings, healthLogPath } from './health-log.mjs';
import { checkVersionDrift, checkPublishedLatest } from './version-drift.mjs';
import { findManagedBlock, compareVersions } from './claude-md.mjs';
import { getKitVersion, kitOwnedScaffoldDrift } from './install.mjs';
import { checkDeletionPropagation } from './deletion-propagation.mjs';
import { scanStrayTiers } from './memory-recovery.mjs';
import { harnessSlugForPath } from './transcripts.mjs';
import { hasOurCliAgent } from './kiro-cli-agent.mjs';
import { stripBom } from './read-json.mjs';
import { detectInstallKind } from './install-kind.mjs';
import { resolveBackendAgent } from './make-backend.mjs';
import { agentCliOnPath } from './agent-cli.mjs';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TRANSCRIPTS_REL = ['context', 'transcripts'];
const SESSIONS_REL = ['context', 'sessions'];
const RECENT_MD_REL = ['context', 'sessions', 'recent.md'];
const MEMORY_INDEX_REL = ['context', 'memory', 'INDEX.md'];
const MEMORY_DIR_REL = ['context', 'memory'];
const LOCKS_REL = ['context', '.locks'];
const NATIVE_MEMORY_LOG_REL = ['context', '.locks', 'native-memory-status.log'];

// Which agent was this project installed for? A `--ide kiro` install wires
// .kiro/ surfaces (hooks + steering/cmk.md + skills + settings/mcp.json); a
// Claude Code install wires .claude/settings.json. HC-1 must check the RIGHT
// surface — before v0.4.0 it hard-checked .claude/settings.json and false-FAILed
// on every Kiro install (the cut-gate-kiro live-test find, Task 50).
//
// Detection precedence:
//   1. .claude/settings.json present → Claude Code.
//   2. a CMK-OWNED Kiro marker present (.kiro/steering/cmk.md — written by every
//      installKiro run) → Kiro. We key on OUR marker, not a bare `.kiro/` dir, so
//      a stray/unrelated .kiro/ (another tool's, or a partial non-cmk dir) does
//      NOT flip the project to the Kiro path (I2).
//   3. neither → Claude Code (historical default — a not-yet-installed project
//      still reports the Claude-shaped repair hint).
//
// NOTE (I1, deliberate punt): a project installed for BOTH agents (.claude AND a
// cmk .kiro marker) resolves to Claude Code by precedence — HC-1 checks only the
// Claude surface. Dual-install is rare; the single-surface check is intentional
// for v0.4.0, not an oversight. Revisit if dual-install becomes common.
// detectInstallKind moved to install-kind.mjs (Task 200) so makeBackend + install
// can share it without doctor.mjs's heavy import chain. Imported at the top;
// re-exported here for existing importers. Behavior unchanged.

// --- HC-1: Stop + SessionStart hooks registered -----------------------
function hc1Hooks({ projectRoot, awsDir }) {
  // Agent-aware (v0.4.0): a Kiro install keeps its hooks in .kiro/hooks/ (IDE)
  // and/or ~/.kiro/agents/ (kiro-cli), so route to the Kiro check
  // rather than false-failing on a missing .claude/settings.json with a
  // Claude-Code repair hint.
  const installKind = detectInstallKind(projectRoot);
  if (installKind === 'kiro') {
    return hc1KiroHooks({ projectRoot, awsDir });
  }
  if (installKind === 'cursor') {
    return hc1CursorHooks({ projectRoot });
  }
  if (installKind === 'codex') {
    return hc1CodexHooks({ projectRoot });
  }
  // Per design §5 — the Claude Code hooks live in .claude/settings.json
  // alongside its plugin manifest. Required for auto-extract +
  // session-end compression to fire.
  const settingsPath = join(projectRoot, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    return {
      id: 'HC-1',
      name: 'Stop + SessionStart hooks registered',
      status: 'fail',
      message: '.claude/settings.json missing — hooks not wired',
      recoveryCommand: 'cmk repair --hooks',
    };
  }
  let settings;
  try {
    // stripBom: a Windows-editor BOM on .claude/settings.json must not make a
    // valid file read as a parse error → false HC-1 FAIL (D-187).
    settings = JSON.parse(stripBom(readFileSync(settingsPath, 'utf8')));
  } catch (err) {
    return {
      id: 'HC-1',
      name: 'Stop + SessionStart hooks registered',
      status: 'fail',
      message: `.claude/settings.json parse error: ${err?.message ?? err}`,
      recoveryCommand: 'cmk repair --hooks',
    };
  }
  // B1 fix (skill-review 2026-05-28): walk the actual hooks.<Event>[].command
  // structure instead of substring-matching against JSON.stringify(settings).
  // Substring-match false-positives on ANY occurrence (description text,
  // env value, stale TODO comment) and doesn't verify each hook is wired
  // to its CORRECT event array. The walk pins both contracts: hook
  // present + hook in the right event.
  const required = [
    { event: 'SessionStart', command: 'cmk-inject-context' },
    { event: 'Stop', command: 'cmk-capture-turn' },
    { event: 'SessionEnd', command: 'cmk-compress-session' },
    { event: 'PreCompact', command: 'cmk-precompact' },
  ];
  const hooks = settings?.hooks ?? {};
  const missing = [];
  for (const { event, command } of required) {
    const entries = Array.isArray(hooks[event]) ? hooks[event] : [];
    // An entry may be (a) a bare string command, (b) a flat object
    // {command: '...'}, or (c) the canonical Anthropic / kit nested shape
    // {hooks: [{type, command}, ...]}. The kit's own writers (cmk install
    // + cmk repair --hooks via settings-hooks.mjs) emit form (c), so HC-2
    // MUST traverse the nested hooks[] array — otherwise `cmk install`
    // followed by `cmk doctor` reports HC-2 fail on hooks the kit itself
    // just wrote (a separately-correct-jointly-broken composition bug
    // caught while shipping Task 49; pre-Task-49 the doctor test only ever
    // fed form (b), so the gap stayed latent).
    const found = entries.some((e) => {
      if (typeof e === 'string') return e.includes(command);
      if (e && typeof e === 'object') {
        if (typeof e.command === 'string' && e.command.includes(command)) return true;
        if (Array.isArray(e.hooks)) {
          return e.hooks.some(
            (h) => h && typeof h.command === 'string' && h.command.includes(command),
          );
        }
      }
      return false;
    });
    if (!found) missing.push(`${event}.${command}`);
  }
  if (missing.length > 0) {
    return {
      id: 'HC-1',
      name: 'Stop + SessionStart hooks registered',
      status: 'fail',
      message: `missing hook references: ${missing.join(', ')}`,
      recoveryCommand: 'cmk repair --hooks',
    };
  }
  return {
    id: 'HC-1',
    name: 'Stop + SessionStart hooks registered',
    status: 'pass',
    message: 'all kit hooks wired to their correct event arrays in .claude/settings.json',
  };
}

// --- HC-1 (Kiro variant): capture + inject can fire via EITHER Kiro surface ----
// Kiro wires capture/inject through TWO independent surfaces (D-186):
//   • IDE hooks  → .kiro/hooks/{cmk-capture,cmk-inject}.kiro.hook  (the GUI user)
//   • CLI agent  → ~/.kiro/agents/cmk.json with
//                  agentSpawn(inject)+stop(capture) hooks  (the kiro-cli user)
// HC-1 is a CAPABILITY check ("can capture/inject fire?"), not a single-file
// check — so it PASSES if EITHER surface is present, and FAILs only when NEITHER
// is. The original v0.4.0 fix checked only the IDE hooks, which false-FAILed a
// working kiro-cli-only install (the surface lives in ~/.aws, which is also
// machine-local and doesn't travel with a clone) — the same separately-correct-
// jointly-broken class as D-184/D-185, one level down (skill-review B1).
// `awsDir` is injectable so tests can sandbox the ~/.aws probe.
function hc1KiroHooks({ projectRoot, awsDir }) {
  const hooksDir = join(projectRoot, '.kiro', 'hooks');
  const ideHooks = ['cmk-capture.kiro.hook', 'cmk-inject.kiro.hook'];
  const ideMissing = ideHooks.filter((f) => !existsSync(join(hooksDir, f)));
  const ideComplete = ideMissing.length === 0;
  const cliAgent = hasOurCliAgent({ awsDir });

  if (ideComplete || cliAgent) {
    const surfaces = [];
    if (ideComplete) surfaces.push('IDE hooks (.kiro/hooks/)');
    if (cliAgent) surfaces.push('CLI agent (~/.kiro/agents/cmk.json)');
    return {
      id: 'HC-1',
      name: 'Stop + SessionStart hooks registered',
      status: 'pass',
      message: `Kiro capture/inject wired via ${surfaces.join(' + ')}`,
    };
  }

  // Neither surface present → genuinely not wired. Name both so a kiro-cli user
  // isn't pushed at the IDE-only repair.
  return {
    id: 'HC-1',
    name: 'Stop + SessionStart hooks registered',
    status: 'fail',
    message:
      `Kiro install: no capture/inject surface found — neither the IDE hooks ` +
      `(${ideMissing.join(', ')} in .kiro/hooks/) nor a cmk CLI agent in ` +
      `~/.kiro/agents/`,
    recoveryCommand: 'cmk install --ide kiro',
  };
}

// Task 196 — the Cursor surface: `.cursor/hooks.json` carries the
// `cmk cursor-hook` dispatcher on the inject (sessionStart) + capture
// (afterAgentResponse) events. Both are required — inject-only or capture-only
// is a broken memory loop, same standard the Claude check applies.
function hc1CursorHooks({ projectRoot }) {
  const hooksPath = join(projectRoot, '.cursor', 'hooks.json');
  const required = ['sessionStart', 'afterAgentResponse'];
  let missing = required;
  if (existsSync(hooksPath)) {
    try {
      const cfg = JSON.parse(readFileSync(hooksPath, 'utf8'));
      missing = required.filter(
        (ev) => !(cfg?.hooks?.[ev] ?? []).some(
          (h) => typeof h?.command === 'string' && h.command.includes('cmk cursor-hook'),
        ),
      );
    } catch {
      // unparseable hooks.json → treat as not wired (the repair re-runs install,
      // whose refuse-to-clobber will surface the corrupt file to the user)
    }
  }
  if (missing.length === 0) {
    return {
      id: 'HC-1',
      name: 'Stop + SessionStart hooks registered',
      status: 'pass',
      message: 'Cursor capture/inject wired via .cursor/hooks.json (cmk cursor-hook)',
    };
  }
  return {
    id: 'HC-1',
    name: 'Stop + SessionStart hooks registered',
    status: 'fail',
    message: `Cursor install: .cursor/hooks.json is missing the kit dispatcher on: ${missing.join(', ')}`,
    recoveryCommand: 'cmk install --ide cursor',
  };
}

// Task 196 (Codex) — the Codex surface: `.codex/hooks.json` carries the
// `cmk codex-hook` dispatcher on the inject (SessionStart) + capture (Stop)
// events, in Codex's matcher-group nesting ({matcher?, hooks:[{command}]}).
// Both required — inject-only or capture-only is a broken memory loop.
function hc1CodexHooks({ projectRoot }) {
  const hooksPath = join(projectRoot, '.codex', 'hooks.json');
  const required = ['SessionStart', 'Stop'];
  let missing = required;
  if (existsSync(hooksPath)) {
    try {
      const cfg = JSON.parse(readFileSync(hooksPath, 'utf8'));
      missing = required.filter(
        (ev) => !(cfg?.hooks?.[ev] ?? []).some(
          (group) => (group?.hooks ?? []).some(
            (h) => typeof h?.command === 'string' && h.command.includes('cmk codex-hook'),
          ),
        ),
      );
    } catch {
      // unparseable hooks.json → treat as not wired (the repair re-runs install,
      // whose refuse-to-clobber will surface the corrupt file to the user)
    }
  }
  if (missing.length === 0) {
    return {
      id: 'HC-1',
      name: 'Stop + SessionStart hooks registered',
      status: 'pass',
      message: 'Codex capture/inject wired via .codex/hooks.json (cmk codex-hook) — remember the one-time /hooks trust in Codex',
    };
  }
  return {
    id: 'HC-1',
    name: 'Stop + SessionStart hooks registered',
    status: 'fail',
    message: `Codex install: .codex/hooks.json is missing the kit dispatcher on: ${missing.join(', ')}`,
    recoveryCommand: 'cmk install --ide codex',
  };
}

// --- HC-2: distill freshness (≤2 days) --------------------------------
function hc2DistillFreshness({ projectRoot, now }) {
  const recentPath = join(projectRoot, ...RECENT_MD_REL);
  if (!existsSync(recentPath)) {
    // Not a failure: on a fresh project there's nothing distilled yet, and
    // when there is, the lazy-on-read path runs the distill at SessionStart
    // (or `cmk daily-distill`). "Stale recent.md" below IS a real fail; a
    // never-built one is just "not yet" — mirror HC-5's skip-on-fresh.
    return {
      id: 'HC-2',
      name: 'Daily distill is fresh (≤2 days)',
      status: 'skip',
      message: 'recent.md not built yet — nothing to distill. Runs automatically (lazy-on-read at SessionStart, or `cmk daily-distill`) once there is session content.',
    };
  }
  let mtimeMs;
  try {
    mtimeMs = statSync(recentPath).mtimeMs;
  } catch (err) {
    return {
      id: 'HC-2',
      name: 'Daily distill is fresh (≤2 days)',
      status: 'fail',
      message: `recent.md stat error: ${err?.message ?? err}`,
      recoveryCommand: 'cmk daily-distill',
    };
  }
  const nowMs = new Date(now ?? nowIso()).getTime();
  const ageMs = nowMs - mtimeMs;
  if (ageMs > TWO_DAYS_MS) {
    return {
      id: 'HC-2',
      name: 'Daily distill is fresh (≤2 days)',
      status: 'fail',
      message: `recent.md ${Math.round(ageMs / (24 * 60 * 60 * 1000))}d old (cutoff: 2d)`,
      recoveryCommand: 'cmk daily-distill',
    };
  }
  return {
    id: 'HC-2',
    name: 'Daily distill is fresh (≤2 days)',
    status: 'pass',
    message: `recent.md ${Math.round(ageMs / (60 * 60 * 1000))}h old`,
  };
}

// --- HC-3: transcripts firing (≤3 days) -------------------------------
function hc3Transcripts({ projectRoot, now }) {
  const transcriptsDir = join(projectRoot, ...TRANSCRIPTS_REL);
  if (!existsSync(transcriptsDir)) {
    // Fresh project, never had a Claude Code session here → nothing to fire
    // yet. Skip, don't fail (the dir + first transcript appear on the first turn).
    return {
      id: 'HC-3',
      name: 'Transcripts firing (≤3 days)',
      status: 'skip',
      message: 'no transcripts yet — they appear after your first Claude Code turn in this project.',
    };
  }
  const nowMs = new Date(now ?? nowIso()).getTime();
  const cutoffMs = nowMs - THREE_DAYS_MS;
  let totalCount = 0;
  let recentCount = 0;
  for (const name of readdirSync(transcriptsDir)) {
    if (!/\.md$/.test(name)) continue;
    totalCount += 1;
    try {
      const mtimeMs = statSync(join(transcriptsDir, name)).mtimeMs;
      if (mtimeMs >= cutoffMs) recentCount += 1;
    } catch {
      // skip unreadable
    }
  }
  if (totalCount === 0) {
    // Dir exists (scaffolded) but no transcripts captured yet → still "not
    // yet", not a failure.
    return {
      id: 'HC-3',
      name: 'Transcripts firing (≤3 days)',
      status: 'skip',
      message: 'no transcripts yet — they appear after your first Claude Code turn in this project.',
    };
  }
  if (recentCount === 0) {
    // Transcripts EXIST but none recent → the kit was capturing and stopped.
    // That IS a real signal (the Stop hook may not be firing here).
    return {
      id: 'HC-3',
      name: 'Transcripts firing (≤3 days)',
      status: 'fail',
      message: 'transcripts exist but none within 3 days — the Stop hook may have stopped firing (is this project Claude Code\'s primary cwd?)',
      recoveryCommand: 'reopen this project as the primary cwd in Claude Code',
    };
  }
  return {
    id: 'HC-3',
    name: 'Transcripts firing (≤3 days)',
    status: 'pass',
    message: `${recentCount} transcript(s) within 3 days`,
  };
}

// --- HC-4: INDEX.md matches context/memory/ ---------------------------
function hc4IndexConsistency({ projectRoot }) {
  const memoryDir = join(projectRoot, ...MEMORY_DIR_REL);
  const indexPath = join(projectRoot, ...MEMORY_INDEX_REL);
  if (!existsSync(memoryDir)) {
    return {
      id: 'HC-4',
      name: 'INDEX.md matches context/memory/ files',
      status: 'skip',
      message: 'context/memory/ missing — no granular facts to index yet',
    };
  }
  if (!existsSync(indexPath)) {
    return {
      id: 'HC-4',
      name: 'INDEX.md matches context/memory/ files',
      status: 'fail',
      message: 'context/memory/INDEX.md missing',
      recoveryCommand: 'cmk reindex',
    };
  }
  // Count fact files (*.md excluding INDEX.md itself) — the shared fact-file
  // lister (Task 241), so a future skip rule reaches HC-4 automatically instead
  // of leaving it comparing INDEX.md against a differently-filtered set.
  let factFiles;
  try {
    factFiles = listFactFiles(memoryDir);
  } catch (err) {
    return {
      id: 'HC-4',
      name: 'INDEX.md matches context/memory/ files',
      status: 'fail',
      message: `readdir error: ${err?.message ?? err}`,
      recoveryCommand: 'cmk reindex',
    };
  }
  // Read INDEX.md and count entries that look like file references.
  // We expect lines like `- [Description](file.md)` or `- file.md`.
  let indexText;
  try {
    indexText = readFileSync(indexPath, 'utf8');
  } catch (err) {
    return {
      id: 'HC-4',
      name: 'INDEX.md matches context/memory/ files',
      status: 'fail',
      message: `INDEX.md read error: ${err?.message ?? err}`,
      recoveryCommand: 'cmk reindex',
    };
  }
  // Fact-file references in INDEX.md are markdown LINK TARGETS whose filename
  // follows the kit's `<type>_<slug>.md` convention (e.g. feedback_layered.md) —
  // that's what `cmk reindex`'s formatIndexLine writes: `[slug](type_slug.md)`.
  // Match the link target's *.md basename, THEN keep only fact-file-shaped names.
  //
  // Two false-positives this must avoid (both real):
  //   1. id-shaped names — the pre-Task-85 regex matched `[PUL]-XXXXXXXX.md`,
  //      which the kit NEVER generates, so HC-5 false-FAILED "missing" on every
  //      real fact the moment one existed (live-test-7 2026-06-03).
  //   2. non-fact links — a broad `](...md)` match also catches the scaffold's
  //      own example `- [type] [Title](filename.md)` (inside an HTML comment) and
  //      any prose link like `(design.md)`, which would false-FAIL "stale" on a
  //      FRESH install (skill-review 2026-06-03). The `<type>_<slug>` shape
  //      (a `type_` underscore prefix) excludes `filename.md` / `design.md` /
  //      `0001.md` while matching every real fact file.
  const FACT_FILE_RE = /^[a-z]+_[a-z0-9][a-z0-9-]*\.md$/i;
  const indexEntries = new Set();
  const re = /\]\(([^)]+\.md)\)/g;
  let m;
  while ((m = re.exec(indexText)) !== null) {
    const fname = m[1].split(/[\\/]/).pop(); // basename, tolerate ./ or path-prefixed links
    if (fname && fname !== 'INDEX.md' && FACT_FILE_RE.test(fname)) indexEntries.add(fname);
  }
  const factSet = new Set(factFiles);
  const inFactsNotIndex = [...factSet].filter((f) => !indexEntries.has(f));
  const inIndexNotFacts = [...indexEntries].filter((f) => !factSet.has(f));
  if (inFactsNotIndex.length === 0 && inIndexNotFacts.length === 0) {
    return {
      id: 'HC-4',
      name: 'INDEX.md matches context/memory/ files',
      status: 'pass',
      message: `${factFiles.length} fact file(s); INDEX in sync`,
    };
  }
  const parts = [];
  if (inFactsNotIndex.length > 0) parts.push(`missing from INDEX: ${inFactsNotIndex.length}`);
  if (inIndexNotFacts.length > 0) parts.push(`stale in INDEX: ${inIndexNotFacts.length}`);
  return {
    id: 'HC-4',
    name: 'INDEX.md matches context/memory/ files',
    status: 'fail',
    message: parts.join('; '),
    recoveryCommand: 'cmk reindex',
  };
}

// --- HC-5: Cron jobs registered with host scheduler -------------------
//
// Task 47 (D-354) turned this from a SENTINEL check into a REGISTRATION check.
//
// The bug that forced it: the v0.5.4 package rename left the Windows scheduled
// task pointing at an absolute path under the dead package name. The nightly
// distill failed silently for four nights. HC-10 — which watches OUTCOMES —
// caught it. HC-5 reported PASS the whole time, because all it ever read was a
// file the kit itself had written to say "we registered something once." That
// is D-298's heartbeat-not-outcome false green, one check over.
//
// So the sentinel now decides only whether cron is IN USE. Once it is, the
// question is put to the host: does the entry still exist, does the command it
// runs still exist, and (win32) did the §8.6.5 settings actually apply. One
// read answers all three — see scheduler-state.mjs.
//
// THE THREE SEVERITIES ARE DELIBERATE and they differ:
//   • no sentinel                → SKIP. Cron is optional; the lazy-on-read
//     fallback compresses at SessionStart. Flagging an optional,
//     working-by-fallback feature as broken made healthy installs read as sick.
//   • target missing / no entry  → FAIL. The job CANNOT run. This is D-354.
//   • stale settings (win32)     → WARN. The job runs, badly. Cron is an
//     optimization and the lazy roll is the floor, so this must not put a
//     non-zero exit code on an otherwise healthy project — the same posture
//     HC-13/HC-14 take, and the same `advisory` severity the identical
//     condition carries in the health registry.
//   • unreadable                 → SKIP, saying so. An unrun check must never
//     read as verified (the AOEP negative-invariant HC-12 follows).
const HC5_JOBS = [CRON_ENTRY_NAME, WEEKLY_ENTRY_NAME];
const HC5_NAME = 'Cron jobs registered with host scheduler';

function hc5CronRegistered({ projectRoot, schedulerProbe }) {
  if (!existsSync(cronSentinelPath(projectRoot))) {
    return {
      id: 'HC-5',
      name: HC5_NAME,
      status: 'skip',
      message: 'cron not registered (optional) — using the lazy-on-read fallback (compresses at SessionStart). Run `cmk register-crons` for scheduled background compression.',
    };
  }
  const probe = schedulerProbe ?? readRegisteredJob;
  const findings = [];
  for (const entryName of HC5_JOBS) {
    let r;
    try {
      r = probe({ entryName });
    } catch (err) {
      // A probe must never take doctor down, and its failure must never read as
      // health. "Could not tell" is its own answer.
      r = { verdict: 'unreadable', problems: [], detail: `probe error: ${err?.message ?? err}` };
    }
    findings.push({ entryName, ...r });
  }

  const broken = findings.filter((f) => f.verdict === 'target-missing' || f.verdict === 'not-registered');
  if (broken.length > 0) {
    const detail = broken
      .map((f) =>
        f.verdict === 'target-missing'
          ? `${f.entryName} → its registered command is gone (${f.targetPath})`
          : `${f.entryName} → the host scheduler has no such entry (${f.detail})`,
      )
      .join('; ');
    return {
      id: 'HC-5',
      name: HC5_NAME,
      status: 'fail',
      message:
        `${detail}. A scheduled job that points at a path which no longer exists fails silently every night — ` +
        'the usual cause is a package rename or a global reinstall that moved the kit, since registrations use ' +
        'absolute paths on purpose (D-83). `cmk register-crons` re-registers both jobs at their current paths; ' +
        'memory keeps self-healing each session via the lazy roll meanwhile, so nothing is lost.',
      recoveryCommand: 'cmk register-crons',
    };
  }

  const stale = findings.filter((f) => f.verdict === 'settings-stale');
  if (stale.length > 0) {
    const flags = [...new Set(stale.flatMap((f) => (f.problems ?? []).map((p) => p.setting)))];
    return {
      id: 'HC-5',
      name: HC5_NAME,
      status: 'warn',
      message:
        `${stale.map((f) => f.entryName).join(', ')} registered with the pre-v0.6.6 Task Scheduler posture ` +
        `(${flags.join(', ')}) — Windows will refuse to start these jobs on battery and may kill them when you ` +
        'return to the keyboard (§8.6.5). Nothing is lost: the lazy roll still compresses every session. ' +
        '`cmk register-crons` is idempotent and rewrites the flags.',
      recoveryCommand: 'cmk register-crons',
    };
  }

  // M8 — the posture could not be read, so it must not be reported as verified.
  // WARN rather than SKIP: the registration itself WAS checked and is fine, so
  // skipping the whole check would understate what is known; and WARN rather
  // than FAIL because nothing is known to be broken. The message says plainly
  // which half was not verified.
  const unknownSettings = findings.filter((f) => f.verdict === 'settings-unknown');
  if (unknownSettings.length > 0) {
    return {
      id: 'HC-5',
      name: HC5_NAME,
      status: 'warn',
      message:
        `${unknownSettings.map((f) => f.entryName).join(', ')} is registered and its command exists, but the task ` +
        'definition carried no readable settings block — so the scheduler posture that decides whether Windows will ' +
        'actually run it (§8.6.5) could NOT be verified. `cmk register-crons` is idempotent and rewrites those ' +
        'settings, which is the cheapest way to know.',
      recoveryCommand: 'cmk register-crons',
    };
  }

  const unreadable = findings.filter((f) => f.verdict === 'unreadable');
  if (unreadable.length > 0) {
    return {
      id: 'HC-5',
      name: HC5_NAME,
      status: 'skip',
      message:
        `cron is registered, but the host scheduler could not be read, so the registration was NOT verified: ` +
        `${unreadable.map((f) => `${f.entryName} (${f.detail})`).join('; ')}.`,
    };
  }

  return {
    id: 'HC-5',
    name: HC5_NAME,
    status: 'pass',
    message: `both scheduled jobs are registered and their targets exist (${findings.map((f) => f.targetPath).filter(Boolean).join(', ')})`,
  };
}

// --- HC-6: Native Anthropic Auto Memory status -----------------------
function hc6NativeAutoMemory({ projectRoot, now }) {
  // Per ADR-0011 — detect whether Anthropic's native Auto Memory is
  // also active for this project. Non-fatal; informational. Log the
  // result to context/.locks/native-memory-status.log so users can
  // see whether the kit is supplementing or substituting.
  const ts = now ?? nowIso();
  // Anthropic uses the slug pattern `re.sub(r'[^a-zA-Z0-9]', '-', project_dir)`
  // per claude-remember research (SOURCES.md) — the shared rule (Task 225 M6).
  const slug = harnessSlugForPath(projectRoot);
  const anthropicMemoryDir = join(homedir(), '.claude', 'projects', slug, 'memory');
  let entry;
  if (!existsSync(anthropicMemoryDir)) {
    entry = { ts, active: false, last_modified: null, file_count: 0 };
  } else {
    let files = [];
    try {
      files = readdirSync(anthropicMemoryDir).filter((n) => /\.md$/.test(n));
    } catch {
      // unreadable → treat as unknown
      entry = { ts, active: 'unknown', last_modified: null, file_count: 0, reason: 'unreadable' };
    }
    if (!entry) {
      let lastMtime = 0;
      for (const f of files) {
        try {
          const m = statSync(join(anthropicMemoryDir, f)).mtimeMs;
          if (m > lastMtime) lastMtime = m;
        } catch {
          // skip unreadable
        }
      }
      entry = {
        ts,
        active: files.length > 0,
        last_modified: lastMtime > 0 ? new Date(lastMtime).toISOString() : null,
        file_count: files.length,
      };
    }
  }
  // Write the current-state SNAPSHOT (single line, overwritten each
  // run). I2 fix (skill-review 2026-05-28): clarified — earlier
  // comment said "Append the audit entry" but the code uses
  // writeFileSync (overwrite). Snapshot semantics is the right v0.1.0
  // contract because `cmk doctor` is intended for "what's true RIGHT
  // NOW" checks, not trend analysis. Trend logging is a v0.1.x
  // candidate (would require append + rotation or a separate
  // history.ndjson file).
  // ADR-0011 / Task 60: the project's committable `autoMemoryEnabled` setting
  // is what actually governs native memory going forward. Fold it into both
  // the snapshot log (Door 4 observability) and the message so the
  // `cmk disable-native-memory` opt-in is DISCOVERABLE here, not just at install.
  const { state: settingState } = getNativeAutoMemoryState({ projectRoot });
  entry.setting_state = settingState;

  const logPath = join(projectRoot, ...NATIVE_MEMORY_LOG_REL);
  try {
    mkdirSync(join(projectRoot, ...LOCKS_REL), { recursive: true });
    writeFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // best-effort
  }

  let message;
  if (settingState === 'disabled') {
    // The user opted out — native won't write here regardless of any old files.
    message = 'Anthropic auto-memory DISABLED for this project via .claude/settings.json — the kit is the sole memory layer.';
  } else if (entry.active === true) {
    // Native is writing AND not disabled → both layers run (context bloat).
    // Surface the one-command opt-out (the coexistence choice, discoverable late).
    message = `Anthropic auto-memory ACTIVE (${entry.file_count} files; last: ${entry.last_modified ?? 'unknown'}) — running ALONGSIDE the kit (both inject at session start). Run \`cmk disable-native-memory\` to use one lean layer.`;
  } else if (entry.active === false) {
    message = 'Anthropic auto-memory not active for this project (kit is the sole memory source).';
  } else {
    message = 'Anthropic auto-memory state unknown (directory unreadable).';
  }

  return {
    id: 'HC-6',
    name: 'Native Anthropic Auto Memory status detected',
    status: 'pass',
    message,
  };
}

// --- HC-7: Stale lock files -------------------------------------------
function hc7StaleLocks({ projectRoot, userDir }) {
  const stale = detectStaleLocks(projectRoot, { userDir }).filter((r) => r.stale);
  if (stale.length === 0) {
    return {
      id: 'HC-7',
      name: 'No stale lock files',
      status: 'pass',
      message: 'all locks healthy',
    };
  }
  // Surface the first lock's recoveryCommand. M4 fix (skill-review
  // 2026-05-28): when more than one stale lock exists, the message
  // calls out the remaining count so the user knows to re-run.
  const first = stale[0];
  const moreNote = stale.length > 1
    ? ` (+ ${stale.length - 1} more — re-run after cleaning to surface)`
    : '';
  return {
    id: 'HC-7',
    name: 'No stale lock files',
    status: 'fail',
    message: `${stale.length} stale lock(s); first: ${first.path} (${first.reason})${moreNote}`,
    recoveryCommand: first.recoveryCommand,
  };
}

// --- HC-8: native bindings present (npm 12 readiness, Task 141a) -------
// The BACKSTOP, not the primary UX: `cmk install` probes + asks inline
// (the user's 2026-06-12 steer); HC-8 catches the after-the-fact states
// (npm upgraded later, package reinstalled without the allow flag).
// The repair is an `npm install -g` → requiresInstall per the design §14
// ask-before-install rule.
async function hc8NativeBindings({ projectRoot, kitBindingProbe, embedderBindingProbe }) {
  const kitProbe = kitBindingProbe ?? checkKitBinding;
  const kit = kitProbe();
  if (!kit.ok) {
    return {
      id: 'HC-8',
      name: 'Native bindings present (npm 12 readiness)',
      status: 'fail',
      message: `better-sqlite3 native binding unavailable (${kit.reason}) — most common cause: npm 12 blocks dependency install scripts by default, so a fresh install skips the binding build (a Node major upgrade is the other); search/reindex will crash until it is rebuilt`,
      recoveryCommand: kit.remedy,
      requiresInstall: true,
    };
  }
  // The embedder matters only when this project actually defaults to it.
  const mode = resolveDefaultSearchMode({ projectRoot });
  if (mode === 'keyword') {
    return {
      id: 'HC-8',
      name: 'Native bindings present (npm 12 readiness)',
      status: 'pass',
      message: 'better-sqlite3 binding healthy (semantic not configured — embedder not checked)',
    };
  }
  const embedderProbe = embedderBindingProbe ?? checkEmbedderBinding;
  const embedder = await embedderProbe();
  if (!embedder.ok) {
    const state = embedder.installed
      ? `installed but its native binding failed (${embedder.reason}) — npm 12 blocks onnxruntime-node's install script by default`
      : `not installed, but search.default_mode is '${mode}'`;
    return {
      id: 'HC-8',
      name: 'Native bindings present (npm 12 readiness)',
      status: 'fail',
      message: `semantic embedder ${state}; searches degrade to keyword until fixed`,
      recoveryCommand: embedder.remedy,
      requiresInstall: true,
    };
  }
  return {
    id: 'HC-8',
    name: 'Native bindings present (npm 12 readiness)',
    status: 'pass',
    message: `better-sqlite3 binding healthy; embedder import OK (default mode: ${mode}; the deep pipeline check runs at --with-semantic warm)`,
  };
}

/**
 * Run the full health audit (HC-1..HC-16).
 *
 * @param {object} opts
 * @param {string} opts.projectRoot
 * @param {string} [opts.userDir]
 * @param {string} [opts.now]
 * @param {Function} [opts.kitBindingProbe] - HC-8 test seam.
 * @param {Function} [opts.embedderBindingProbe] - HC-8 test seam.
 * @returns {Promise<{action, checks, duration_ms}>}
 *
 * Note: M3 fix (skill-review 2026-05-28) dropped the v0.1.0 `promptUser`
 * forward-compat parameter. It was destructured-then-void-discarded; no
 * caller passes it. When auto-repair with consent ships (v0.1.x), the
 * parameter lands at that PR alongside the actual consent flow — not
 * pre-empted in v0.1.0 to avoid the "forward-compat hooks rot" pattern.
 */
// --- HC-9: project scaffold version matches the installed cmk (Task 162 / D-176) ---
// After `npm i -g @latest`, a project's version-stamped scaffold stays at the OLD
// version until `cmk install` re-runs there (the easily-forgotten per-project step).
// HC-9 reads the project's CLAUDE.md managed-block version + the installed binary
// version and tells the user to re-run `cmk install` when the project is behind.
function hc9VersionDrift({ projectRoot, kitVersion }) {
  const claudeMdPath = join(projectRoot, 'CLAUDE.md');
  let claudeMdText = null;
  try {
    if (existsSync(claudeMdPath)) claudeMdText = readFileSync(claudeMdPath, 'utf8');
  } catch {
    claudeMdText = null; // unreadable → skip (treated as not-installed)
  }
  const markerResult = checkVersionDrift({ claudeMdText, kitVersion });
  if (markerResult.status !== 'pass') return markerResult;

  // Task 230 (D-343): the marker only proves `cmk install` ran at this
  // version — NOT that every kit-owned scaffold file matches the template.
  // The D-343 false-green: marker at v0.5.4, skills still carrying the
  // pre-rename recall trigger. Content-compare the kit-owned scaffold
  // (skills) against the installed binary's template; a drifted file fails
  // HC-9 with the same recovery (`cmk install` now REFRESHES kit-owned files).
  //
  // EXACT-match gate (skill-review Blocking): checkVersionDrift's pass also
  // covers the benign DOWNGRADE (project scaffold NEWER than this binary —
  // an older global cli on another machine). Comparing a newer project's
  // skills against this OLDER binary's template would false-alarm with a
  // wrong message and a recovery that silently downgrades — so the drift
  // check runs only when the marker version equals the binary exactly.
  let sameVersion = false;
  try {
    const block = claudeMdText ? findManagedBlock(claudeMdText) : null;
    sameVersion = !!block?.version && compareVersions(kitVersion, block.version) === 0;
  } catch {
    sameVersion = false;
  }
  if (!sameVersion) return markerResult;

  let drifted = [];
  try {
    drifted = kitOwnedScaffoldDrift({ projectRoot });
  } catch {
    drifted = []; // comparison failure must not take doctor down — marker verdict stands
  }
  if (drifted.length > 0) {
    return {
      ...markerResult,
      status: 'fail',
      message:
        `the CLAUDE.md marker matches the installed cmk (v${kitVersion}), but ${drifted.length} kit-owned scaffold file(s) differ from this version's template: ` +
        `${drifted.join(', ')} — re-run \`cmk install\` to refresh them (user memory is never touched).`,
      recoveryCommand: 'cmk install',
    };
  }
  return markerResult;
}

// --- HC-11: backend CLI present (Task 200 / D-272/D-277) --------------
// The kit's automatic engine (compression / auto-extract / persona / temporal-
// sweep) routes its LLM call through the CLI of the agent this project was
// installed for (or the backend.agent override). If that CLI isn't on PATH, the
// automatic features SILENTLY no-op (the D-270 bug). HC-11 surfaces that: it
// probes the ACTIVE backend agent's CLI (exit-code probe, not mere presence —
// D-274) and FAILS with an honest "automatic features degraded, file-only still
// works" message when it's missing — never a silent no-op. `backendCliProbe`
// injectable so tests don't spawn a real binary.
function hc11BackendCli({ projectRoot, userDir, backendCliProbe }) {
  const { agent, source } = resolveBackendAgent({ projectRoot, userDir });
  const probe = backendCliProbe ?? ((a) => agentCliOnPath(a));
  const r = probe(agent);
  const via = source === 'override' ? ' (set via backend.agent)' : '';
  if (r.present) {
    return {
      id: 'HC-11',
      name: 'Backend LLM CLI is available',
      status: 'pass',
      message: `automatic memory runs through the ${agent} CLI (${r.bin})${via} — present and runnable.`,
    };
  }
  return {
    id: 'HC-11',
    name: 'Backend LLM CLI is available',
    status: 'fail',
    // Honest degrade (D-277): capture/search/recall/guard still work (files +
    // SQLite); only the automatic LLM steps are skipped until the CLI is present.
    message:
      `the ${agent} CLI (${r.bin})${via} is not available${r.reason ? ` — ${r.reason}` : ''}. ` +
      `Capture, search, recall and the delete-guard still work, but automatic compression / extraction / persona are skipped until you install it. ` +
      `Install the ${agent} CLI to enable the automatic memory features.`,
  };
}

// --- HC-10: Scheduled compaction liveness (Task 167 / D-207) ----------
// INFORMATIONAL — memory self-heals automatically every session (the lazy roll
// is the floor, 167.A/D), so a dead cron is a degraded OPTIMIZATION, not data
// loss. NEVER prescribes a manual heal (no recoveryCommand). A DEV/diagnostic
// aid (it surfaced THIS bug class) + a heads-up for a power user. SKIPs when no
// cron is registered (the default) — the lazy roll covers compaction there.
function hc10CompactionLiveness({ projectRoot, now }) {
  const v = isCompactionNeeded({ projectRoot, now });
  // No cron registered (heartbeatAge null) → nothing to check; the lazy roll owns
  // compaction. SKIP (consistent with HC-5's optional-cron posture).
  if (v.heartbeatAge === null) {
    return {
      id: 'HC-10',
      name: 'Scheduled compaction is alive',
      status: 'skip',
      message: 'no scheduled cron registered (optional) — memory self-heals each session via the lazy roll.',
    };
  }
  if (v.cronStale) {
    const days = Math.floor(v.heartbeatAge / (24 * 60 * 60 * 1000));
    return {
      id: 'HC-10',
      name: 'Scheduled compaction is alive',
      status: 'fail',
      // Informational framing — NO recoveryCommand. The kit self-heals; this is a
      // heads-up that the OPTIONAL nightly schedule isn't firing (asleep at 23:00,
      // a registration that didn't take catch-up). Re-running register-crons is a
      // user choice, not a required repair.
      message: `your scheduled compaction looks dead (last ran ~${days}d ago) — memory still self-heals automatically each session, so no action is needed; run \`cmk register-crons\` only if you want the nightly schedule back.`,
    };
  }
  // Task 203 (D-298): the OUTCOME check. A fresh heartbeat means the cron
  // FIRED — but the heartbeat is recorded at/near task START, so it says nothing
  // about whether the distill WORK completed. The starvation bug: the 23:00 cron
  // fires + heartbeats, then is killed (machine asleep) before the ~3.4-min
  // distill finishes — five nights running, heartbeat fresh every night while
  // recent.md went 5 days stale, and HC-10 reported PASS the whole time (the
  // D-169 false-green class — a health check green while the job fails). Fix:
  // cross-check the ARTIFACT (recent.md freshness). Fresh heartbeat + stale
  // recent.md = the cron fires but its work dies — the tell HC-10 must surface,
  // not paper over. (Task 204 makes each killed run bank partial progress, so
  // this should now be self-limiting — but the health check must still catch a
  // cron whose EVERY run dies before banking even one day.)
  const recentPath = join(projectRoot, ...RECENT_MD_REL);
  if (existsSync(recentPath)) {
    let recentAgeMs = null;
    try {
      recentAgeMs = new Date(now ?? nowIso()).getTime() - statSync(recentPath).mtimeMs;
    } catch {
      recentAgeMs = null;
    }
    if (recentAgeMs != null && recentAgeMs > TWO_DAYS_MS) {
      const days = Math.round(recentAgeMs / (24 * 60 * 60 * 1000));
      return {
        id: 'HC-10',
        name: 'Scheduled compaction is alive',
        status: 'fail',
        // The load-bearing message: the heartbeat LIES if read alone. Name the
        // starvation explicitly so the user isn't reassured by a fresh heartbeat.
        // Task 265 (D-439): the named cause used to be "a laptop asleep at
        // 23:00", which WakeToRun already addressed. The dominant cause on
        // Windows is the scheduler's own conditions — a task registered before
        // v0.6.6 refuses to start on battery, stops when you unplug, and is
        // killed when you return to the keyboard. Re-registering rewrites them.
        message: `your scheduled compaction heartbeat is fresh but its output is NOT — recent.md is ~${days}d old (cutoff: 2d). The nightly cron is firing but being KILLED before the distill finishes. On Windows the usual cause is the scheduled task's own conditions: registrations made before v0.6.6 refuse to start on battery, stop when you unplug, and are killed the moment you touch the keyboard. Memory still self-heals each session via the lazy roll, so no data is lost; run \`cmk daily-distill\` to refresh now, and re-run \`cmk register-crons\` — it is idempotent and rewrites those conditions (and keeps the wake-for-the-job flag) on an existing registration.`,
        recoveryCommand: 'cmk daily-distill',
      };
    }
  }
  return {
    id: 'HC-10',
    name: 'Scheduled compaction is alive',
    status: 'pass',
    message: 'scheduled compaction heartbeat is fresh and recent.md is current',
  };
}

// --- HC-12: Deletion propagation (Task 210 / D-308) ---------------------
// A tombstoned fact must be VERIFIABLY gone from every derived surface —
// the Always-On survey's least-implemented invariant ("deletion is a cascade
// through the derivation graph, not a single operation"). Report-first: a
// survival names its exact location; the scrub routes to `cmk redact` (Task
// 96) or a re-distill — doctor never edits. Vacuous (no tombstones) is a
// labeled SKIP, never a silent pass (the AOEP negative-invariant).
function hc12DeletionPropagation({ projectRoot }) {
  const name = 'Tombstoned facts cascaded out of derived surfaces';
  let r;
  try {
    r = checkDeletionPropagation({ projectRoot });
  } catch (err) {
    return { id: 'HC-12', name, status: 'fail', message: `check error: ${err?.message ?? err}` };
  }
  if (r.vacuous) {
    return {
      id: 'HC-12',
      name,
      status: 'skip',
      message: 'no tombstoned facts to verify (vacuously clean — nothing has been forgotten yet)',
    };
  }
  if (r.survivals.length > 0) {
    const detail = r.survivals
      .slice(0, 5)
      .map((s) => `${s.id} survives in ${s.path}${s.surface === 'index' ? '' : ' (content match)'}`)
      .join('; ');
    const more = r.survivals.length > 5 ? ` (+${r.survivals.length - 5} more)` : '';
    // Surface-aware recovery (skill-review Minor): `cmk reindex` fixes an INDEX
    // survival but is a no-op on a SUMMARY survival (it never rewrites
    // sessions/). Since forget already reindexes in-band (Task 110), a real
    // FAIL is almost always a summary survival — point at the fix that works.
    const anyIndex = r.survivals.some((s) => s.surface === 'index');
    const anySummary = r.survivals.some((s) => s.surface === 'summary');
    const recoveryCommand = anyIndex && !anySummary ? 'cmk reindex' : 'cmk redact <id> --pattern "<the leaked text>"';
    return {
      id: 'HC-12',
      name,
      status: 'fail',
      message:
        `${r.survivals.length} deletion survival(s): ${detail}${more} — a forgotten fact still lives in a derived surface. ` +
        (anySummary
          ? 'For a summary survival: `cmk redact <id> --pattern "…"` scrubs the line, or the next distill re-writes it. '
          : '') +
        (anyIndex ? 'For an index survival: `cmk reindex`.' : ''),
      recoveryCommand,
    };
  }
  return {
    id: 'HC-12',
    name,
    status: 'pass',
    message: `${r.checked} tombstoned fact(s) verified gone from the index + distilled summaries${r.truncated ? ' (bounded sample)' : ''}`,
  };
}

// --- HC-13: no stray memory tiers below the project root (Task 248) ----
// The SECONDARY backstop, never the fix. `cmk install` already auto-recovers a
// stray tier's facts (memory-recovery.mjs) — that is the automatic path, and it
// is where the problem is actually solved (the user's call, P-3PWCGWZH:
// "doctor should only be part of the fix, not the actual fix"). This check
// exists for a stray that appears by SOME OTHER route later, and for the husk
// that remains after a recovery: install stays quiet on a re-run (it reports
// only what it actioned), so the standing "this folder can be deleted" reminder
// lives here.
//
// ADVISORY: `warn`, never `fail`. Nothing is broken — a stray tier is frozen,
// safe, and its facts are already recovered; the user just has a folder to
// delete. A `fail` would put a non-zero exit code on a healthy project.
// --- HC-14: no active kit health warnings (Task 250, D-412) ----------------
//
// WHY, given the whisper reports the same failures: the whisper reaches the
// MODEL on the next prompt; this reaches the USER when they go looking. Before
// it, doctor could report thirteen passes while the kit's own failure log held
// a week of dead extraction — because every other check probes CONFIGURATION
// (are the hooks registered, is the INDEX consistent) and none of them looked
// at OUTCOMES. That is the D-298 / HC-10 false-green class, one level up.
//
// IT REUSES `activeWarnings` RATHER THAN RE-DERIVING THE THRESHOLDS. A second
// copy of "2 consecutive fails, 7-day window, dependsOn cascade" would drift on
// the first tuning change and produce "doctor says fine, the AI says broken" —
// leaving the user to adjudicate between two of the kit's own surfaces.
//
// ADVISORY: `warn`, never `fail`. A kit whose extraction hiccuped twice must
// not put a non-zero exit code on an otherwise healthy project; the whisper is
// the actionable channel and this is the visible one.
function hc14HealthWarnings({ projectRoot, now }) {
  const name = 'No active kit health warnings';
  // The `id: 'HC-14'` literal is repeated at every return rather than hoisted
  // into a shorthand `const id`. That is DELIBERATE and it is a contract, not a
  // style preference: `validate-docs --only counts` derives the live health-check
  // count by scanning this directory for the `id: 'HC-N'` object-literal form,
  // so a hoisted-and-shorthanded id makes a real, wired check INVISIBLE to the
  // count gate — which is how a doc could claim 14 checks while the validator
  // insisted there were 13. Every other HC in this file is written the same way.
  const logPath = healthLogPath(projectRoot);
  // `activeWarnings` is FAIL-OPEN by contract — an unreadable log reads as "no
  // evidence". That is right on the per-prompt hot path (never nag because a
  // diagnostic broke) and would be a FALSE GREEN here, where the whole job is
  // to say honestly what could and could not be verified. So doctor probes
  // readability itself and SKIPs rather than passing.
  if (existsSync(logPath)) {
    try {
      // BOTH probes are needed. `openSync` catches a permission/lock failure —
      // but NOT a directory sitting where the log belongs: POSIX rejects that
      // with EISDIR while Windows opens it happily, so an isFile() check is what
      // makes the skip verdict behave the same on both platforms.
      if (!statSync(logPath).isFile()) {
        return { id: 'HC-14', name, status: 'skip', message: 'health log path is not a file' };
      }
      closeSync(openSync(logPath, 'r'));
    } catch (err) {
      return {
        id: 'HC-14',
        name,
        status: 'skip',
        message: `health log unreadable: ${err?.message ?? err}`,
      };
    }
  }
  let warnings;
  try {
    warnings = activeWarnings(projectRoot, { now });
  } catch (err) {
    return {
      id: 'HC-14',
      name,
      status: 'skip',
      message: `health scan unavailable: ${err?.message ?? err}`,
    };
  }
  if (warnings.length === 0) {
    return {
      id: 'HC-14',
      name,
      status: 'pass',
      message: 'no active kit failures recorded in the last 7 days',
    };
  }
  // Codes, not prose: the code is the key the troubleshooting skill's repair
  // book is sectioned by, so naming it is what makes the report actionable.
  // A per-subject class names WHICH subject is affected (I3). "your scheduled
  // jobs are misconfigured" sends the user to inspect both; "cmk-daily-distill"
  // tells them where to look.
  const codes = warnings
    .map((w) => {
      const subjects = w.subjects?.length ? `: ${w.subjects.join(', ')}` : '';
      return `${w.code}${subjects} (${w.severity}, ${w.strikes}x)`;
    })
    .join('; ');
  // A repair command is offered only when it is not the command the user just
  // ran. Most codes' primaryAction is `cmk doctor` — correct in the WHISPER,
  // where the model has not run doctor yet, and circular HERE, where this line
  // is printed BY doctor ("→ repair: cmk doctor"). When the action is a real
  // next step (`cmk reindex`) it is surfaced; otherwise the message's pointer to
  // the troubleshooting skill IS the next step. Emitting nothing beats emitting
  // a loop.
  const action = warnings.find((w) => w.primaryAction !== 'cmk doctor')?.primaryAction;
  return {
    id: 'HC-14',
    name,
    status: 'warn',
    message:
      `${warnings.length} active kit failure${warnings.length === 1 ? '' : 's'}: ${codes} — ` +
      'load the troubleshooting skill for the per-code repair steps',
    ...(action ? { recoveryCommand: action } : {}),
  };
}

function hc13StrayTiers({ projectRoot }) {
  const name = 'No stray memory tiers below the project root';
  let r;
  try {
    r = scanStrayTiers({ projectRoot });
  } catch (err) {
    // A SKIP, not a pass: an unrun check must never read as "verified"
    // (the AOEP negative-invariant HC-12 follows).
    return { id: 'HC-13', name, status: 'skip', message: `stray scan unavailable: ${err?.message ?? err}` };
  }
  if (r.strays.length === 0) {
    return {
      id: 'HC-13',
      name,
      status: 'pass',
      message: 'no orphaned context/ tiers found below the project root',
    };
  }
  const detail = r.strays.slice(0, 5).map((s) => s.tierRoot).join('; ');
  const more = r.strays.length > 5 ? ` (+${r.strays.length - 5} more)` : '';
  return {
    id: 'HC-13',
    name,
    status: 'warn',
    message:
      `${r.strays.length} stray memory tier(s) below the project root: ${detail}${more} — ` +
      `a pre-v0.6.2 capture bug (D-389) could fork an unread context/ tier at a subdirectory cwd. ` +
      `Run \`cmk install\` to relocate any facts still stranded there into this project's tier ` +
      `(ids + dates preserved); the folder itself is yours to delete — the kit never deletes a memory path.`,
    recoveryCommand: 'cmk install',
  };
}

// --- HC-15: semantic vectors belong to the facts they are filed under -------
// Task 261 (D-421). The vec index is keyed by `vec_map`, and a desync there is
// INVISIBLE by construction: every query returns confident, well-scored,
// plausible-looking results — they are simply the wrong facts. The pre-261 bug
// had 86.7% of the dogfood corpus holding an unrelated fact's embedding while
// the whole suite was green and `cmk search` looked like it worked.
//
// So the guard is a cheap sampled audit rather than a heartbeat: take N live
// mapped rows, re-derive each body's content hash, and byte-compare the cached
// vector against what is actually in that row's vec slot. No embedder is
// loaded, no model call is made — the check is one indexed lookup and one blob
// compare per sampled row.
//
// SKIP, never FAIL, when there is nothing to audit: no index, no semantic layer
// (the embedder is optional), or nothing mapped yet. `unverifiable` rows —
// bodies not yet embedded under the current model — are reported, never counted
// as corruption; that is a normal transient state between a write and a sync.
const HC15_SAMPLE = 50;
async function hc15VectorMapping({ projectRoot, sample = HC15_SAMPLE }) {
  const name = 'Semantic vectors match their own facts';
  let openIndexDb;
  let getIndexDbPath;
  try {
    ({ openIndexDb, getIndexDbPath } = await import('./index-db.mjs'));
  } catch (err) {
    return { id: 'HC-15', name, status: 'skip', message: `index unavailable: ${err?.message ?? err}` };
  }
  if (!existsSync(getIndexDbPath(projectRoot))) {
    return { id: 'HC-15', name, status: 'skip', message: 'no search index yet — nothing to verify' };
  }
  let db;
  try {
    db = openIndexDb({ projectRoot });
  } catch (err) {
    return { id: 'HC-15', name, status: 'skip', message: `index not readable: ${err?.message ?? err}` };
  }
  try {
    // Audit against the model the index was BUILT with, not this build's
    // default — a user on a different model would otherwise show every row as
    // unverifiable and the check would say nothing at all.
    let modelId = DEFAULT_MODEL_ID;
    try {
      modelId = db.prepare("SELECT value FROM vec_meta WHERE key = 'model'").get()?.value ?? modelId;
    } catch {
      /* no vec_meta → semantic never used; verifyVectorMapping reports it */
    }
    const r = await verifyVectorMapping({ db, modelId, scope: 'facts', sample });
    if (r.reason === 'semantic-index-absent' || r.reason === 'nothing-mapped') {
      return {
        id: 'HC-15',
        name,
        status: 'skip',
        message: 'semantic search is not in use on this project — no vectors to verify',
      };
    }
    if (r.reason === 'sqlite-vec-unavailable') {
      return {
        id: 'HC-15',
        name,
        status: 'skip',
        message: 'sqlite-vec is not loadable on this machine — semantic search is already degraded to keyword (see HC-8)',
      };
    }
    if (r.mismatches.length > 0) {
      const shown = r.mismatches.slice(0, 5).map((m) => `${m.key1} (${m.reason})`).join('; ');
      const more = r.mismatches.length > 5 ? ` (+${r.mismatches.length - 5} more)` : '';
      return {
        id: 'HC-15',
        name,
        status: 'fail',
        message:
          `${r.mismatches.length} of ${r.checked} sampled facts hold the WRONG vector: ${shown}${more} — ` +
          'semantic search is returning confident answers about the wrong facts. ' +
          '`cmk reindex --full` rebuilds the vector mapping (no re-embedding: the cache is content-addressed, so it is fast and offline).',
        recoveryCommand: 'cmk reindex --full',
      };
    }
    return {
      id: 'HC-15',
      name,
      status: 'pass',
      message:
        `${r.checked} sampled fact(s) verified against their own cached vectors` +
        (r.unverifiable > 0
          ? `; ${r.unverifiable} not yet embedded under the current model (they embed on the next search)`
          : ''),
    };
  } catch (err) {
    return { id: 'HC-15', name, status: 'skip', message: `verification unavailable: ${err?.message ?? err}` };
  } finally {
    try {
      db.close();
    } catch {
      /* best-effort */
    }
  }
}

// --- HC-16: every fact on disk is reachable in the index --------------------
// Task 270 (D-427 the bug; D-445 why this asks the parser and not the database;
// D-446 why the scan covers the USER tier and `cmk install` now repairs it). The gap this fills, stated as the question no other check
// asks: DID THE FACT MAKE IT INTO THE INDEX AT ALL?
//
//   · HC-4  compares INDEX.md's entry count against the file count — the
//     committed MARKDOWN surface, and a count, not a membership test.
//   · HC-15 audits whether an INDEXED fact's vector is its own — it can only
//     see facts that are already in the index.
//   · HC-16 is the membership test between them: a fact file that is durably on
//     disk, that no DB-backed route can see, and that nothing counted as
//     missing. That population is exactly what D-427 found, and its only
//     symptom was a total off by one.
//
// Deliberately composed, not duplicated: this check never re-derives vector
// mapping (HC-15's job) and never counts INDEX.md lines (HC-4's job).
//
// WHAT IT ASKS, AND WHAT IT DELIBERATELY DOES NOT. The question is "would the
// indexer ACCEPT this fact?" — NOT "is this fact in the database right now?",
// and the difference is the whole design. The SQLite index is rebuilt LAZILY on
// read, so a fact written a moment ago and not yet searched has no row, and that
// is the normal, healthy steady state after EVERY write. A membership test
// against `observations` therefore fails on a perfectly healthy project —
// verified live during Task 270: install → remember → search → remember, and the
// second fact read as "INVISIBLE … indistinguishable from a lost one" when the
// very next search surfaces it fine. That check would have taught users to
// ignore this one, which is worse than not having it.
//
// So the verdict comes from `parseObservationsFromFactFile` — the EXACT parser
// `index-rebuild` uses. A file that parser SKIPS can never be indexed by any
// rebuild, however many times you reindex: a bad or missing id (the D-427
// shape), missing `write_source`/`trust`/`created_at`, unparseable frontmatter.
// That is the durable-but-unfindable population. Everything else self-heals on
// the next read and is none of this check's business. Asking the auditee its own
// question is also what keeps the check from ever drifting away from the
// behavior it audits.
//
// Recovery is shape-aware: an unusable ID is what `cmk install` repairs in place
// (content-addressed, D-394); any other skip reason is a malformed file for the
// user to fix. Prescribing `cmk reindex` for either would send them round a loop
// that cannot converge, so this check never does.
//
// SKIP, never FAIL, when there are no fact files to judge.
function hc16FactReachability({ projectRoot, userDir }) {
  const name = 'Every fact on disk is reachable in the index';
  const unreachable = []; // {filename, reason, badId}
  let scanned = 0;

  for (const tier of tiersFor({ projectRoot, userDir })) {
    const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
    const factDir = resolveFactDir(tier, tierRoot);
    if (!existsSync(factDir)) continue;
    let filenames;
    try {
      filenames = listFactFiles(factDir);
    } catch {
      continue; // an unreadable dir is the walker's problem, not a fact verdict
    }
    for (const filename of filenames) {
      scanned += 1;
      const path = join(factDir, filename);
      let verdict;
      try {
        verdict = parseObservationsFromFactFile({
          path,
          content: readFileSync(path, 'utf8'),
          tier,
          projectRoot,
          userDir,
        });
      } catch (err) {
        unreachable.push({ filename, reason: `unreadable: ${err?.message ?? err}`, badId: false });
        continue;
      }
      if (!verdict.skipped) continue;
      // `invalid or missing id` is index-rebuild's own wording for the one shape
      // `cmk install` can repair; anything else is a malformed file.
      unreachable.push({
        filename,
        reason: verdict.skipped,
        badId: /invalid or missing id/i.test(verdict.skipped),
      });
    }
  }

  if (scanned === 0) {
    return { id: 'HC-16', name, status: 'skip', message: 'no fact files yet — nothing to verify' };
  }
  if (unreachable.length === 0) {
    return {
      id: 'HC-16',
      name,
      status: 'pass',
      message: `${scanned} fact file(s) on disk, all indexable`,
    };
  }

  const repairable = unreachable.some((u) => u.badId);
  const shown = unreachable.slice(0, 5).map((u) => `${u.filename} (${u.reason})`).join('; ');
  const more = unreachable.length > 5 ? ` (+${unreachable.length - 5} more)` : '';
  return {
    id: 'HC-16',
    name,
    status: 'fail',
    message:
      `${unreachable.length} of ${scanned} fact file(s) can never be indexed, so they are invisible to search, ` +
      `the viewer and the graph: ${shown}${more} — a durable fact nothing can find is indistinguishable from a ` +
      'lost one. ' +
      (repairable
        ? '`cmk install` repairs an unusable id in place (content-addressed, keeping a legacy_id breadcrumb); a reindex cannot, because the parser rejects the file before indexing it.'
        : 'These files need their frontmatter fixed; a reindex cannot help, because the parser rejects them before indexing.'),
    ...(repairable ? { recoveryCommand: 'cmk install' } : {}),
  };
}

export async function runDoctor({
  projectRoot,
  userDir,
  now,
  kitVersion,
  kitBindingProbe,
  embedderBindingProbe,
  backendCliProbe, // injectable: HC-11 backend-CLI probe (tests avoid a real spawn)
  awsDir, // injectable: sandboxes the HC-1 Kiro CLI-agent (~/.aws) probe in tests
  registryFetcher, // injectable: Task 245 stale-global check (tests avoid a real registry GET)
  vectorSample, // injectable: HC-15 sample size (tests audit the whole fixture)
  schedulerProbe, // injectable: Task 47 HC-5 host-scheduler read (tests never touch a real scheduler)
} = {}) {
  const t0 = Date.now();
  if (!projectRoot) {
    return {
      action: 'error',
      checks: [],
      errors: ['projectRoot is required'],
      duration_ms: Date.now() - t0,
    };
  }
  const ts = now ?? nowIso();
  const resolvedUserDir = userDir ?? join(homedir(), '.core-memory-kit');

  // Run all checks in order.
  const c1 = hc1Hooks({ projectRoot, awsDir });
  const c2 = hc2DistillFreshness({ projectRoot, now: ts });
  const c3 = hc3Transcripts({ projectRoot, now: ts });
  const c4 = hc4IndexConsistency({ projectRoot });
  const c5 = hc5CronRegistered({ projectRoot, schedulerProbe });
  const c6 = hc6NativeAutoMemory({ projectRoot, now: ts });
  const c7 = hc7StaleLocks({ projectRoot, userDir: resolvedUserDir });
  const c8 = await hc8NativeBindings({ projectRoot, kitBindingProbe, embedderBindingProbe });
  // HC-9: kitVersion injectable for tests; defaults to the installed binary's version.
  const resolvedKitVersion = kitVersion ?? getKitVersion();
  let c9 = hc9VersionDrift({ projectRoot, kitVersion: resolvedKitVersion });
  // Task 245 (D-382): the stale-GLOBAL half. Every check above compares against
  // the INSTALLED binary, so a silently-failed `npm i -g` upgrade reads as
  // healthy (an un-upgraded pair is internally consistent — exactly how the
  // PreCompact hook was absent from the kit's own repo for hours after Task
  // 235). Ask the registry what `latest` is; soft by design — skipped in CI /
  // CMK_SKIP_UPDATE_CHECK, silent on any network failure, and it can only
  // ESCALATE pass→warn, never mask a real HC-9 failure.
  // An injected fetcher is an explicit opt-in: it bypasses the CI/VITEST env
  // gate (otherwise the doctor-integration path would be untestable — the same
  // guard that keeps the suite off the network would keep the test off the
  // code). Production passes no fetcher and gets the full gate.
  const published = await checkPublishedLatest({
    installedVersion: resolvedKitVersion,
    fetcher: registryFetcher,
    ...(registryFetcher ? { env: {} } : {}),
  });
  // Escalates pass AND skip — the stale-global fact is about the BINARY, not
  // this project, so "kit not installed here" (skip) still deserves the note.
  // Never fail: a real HC-9 failure's message + recovery must not be replaced
  // by the softer upgrade nag.
  if (published.checked && published.stale && c9.status !== 'fail') {
    // Explicit field copy rather than `...c9`: c9 is a plain sync result, but
    // Sonar's flow analysis (S6544) mis-reads the spread in this post-`await`
    // block as spreading a Promise. Listing the carried fields is unambiguous
    // to reader and analyzer alike — id + name stay, the rest is the warn.
    c9 = {
      id: c9.id,
      name: c9.name,
      status: 'warn',
      message:
        `${c9.message}; but your installed cmk (v${published.installed}) is behind the published ` +
        `v${published.latest} — run \`npm install -g @lh8ppl/core-memory-kit@latest\`` +
        // Skill-review M1: only tell the user to re-stamp THIS project when it
        // actually is a kit project — the skip branch means it deliberately
        // is not, and "cmk install here" would scaffold it unasked.
        (c9.status === 'pass' ? `, then \`cmk install\` here ` : ` `) +
        `(verify with \`cmk version\` after: a quiet npm run can leave the old version in place, D-382)`,
      recoveryCommand: 'npm install -g @lh8ppl/core-memory-kit@latest',
    };
  }
  const c14 = hc14HealthWarnings({ projectRoot, now: ts });
  const c10 = hc10CompactionLiveness({ projectRoot, now: ts });
  const c11 = hc11BackendCli({ projectRoot, userDir: resolvedUserDir, backendCliProbe });
  const c12 = hc12DeletionPropagation({ projectRoot });
  const c13 = hc13StrayTiers({ projectRoot });
  const c15 = await hc15VectorMapping({ projectRoot, sample: vectorSample });
  // Task 270 (D-427): the membership half — HC-15 asks whether an indexed
  // fact's vector is its own; this asks whether the fact is indexed at all.
  const c16 = hc16FactReachability({ projectRoot, userDir: resolvedUserDir });

  return {
    action: 'completed',
    checks: [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16],
    duration_ms: Date.now() - t0,
  };
}
