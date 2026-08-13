// Subcommand registry for cmk.
//
// Single source of truth for every verb the CLI accepts. Each entry
// describes one verb + (optionally) its sub-verbs. v0.1.0 implements
// verbs incrementally — each task in tasks.md replaces one stub with
// a real action. Verbs still on stub print a "not yet implemented in
// v0.1.0 milestone N" notice (N = the tasks.md task that lights it up).
//
// The `milestone` field references the tasks.md parent task that will
// implement the subcommand. Use "v0.1.x" for verbs deferred past v0.1
// (per design §12 but not in the v0.1.0 critical path).
//
// Adding a new verb? Append to `subcommands` below — the test suite
// asserts exactly what's exported here, so coverage stays automatic.

import { install as installAction, initUserTier as initUserTierAction } from './install.mjs';
import { formatRecoveryReport } from './memory-recovery.mjs';
import { installAgent, uninstallAgent } from './install-agent.mjs';
import { installKiro, uninstallKiro } from './install-kiro.mjs';
import { getAgentProfile, listAgentProfiles } from './agent-profiles.mjs';
import { agentCliOnPath, KNOWN_BACKEND_AGENTS } from './agent-cli.mjs';
import { resolveBackendAgent, makeBackend } from './make-backend.mjs';
import { detectInstallKind } from './install-kind.mjs';
import { runKiroHook } from './kiro-hook-bin.mjs';
import { dispatchCursorHook } from './cursor-hook-dispatch.mjs';
import { dispatchCodexHook } from './codex-hook-dispatch.mjs';
import { readKiroTurn } from './kiro-transcript.mjs';
import { injectContext } from './inject-context.mjs';
import { captureTurn } from './capture-turn.mjs';
import { capturePrompt } from './capture-prompt.mjs';
import { observeEdit } from './observe-edit.mjs';
import { decideGuard } from './guard-memory.mjs';
import { removeClaudeMdBlock } from './claude-md.mjs';
import { reindex as reindexAction } from './reindex.mjs';
import { openIndexDb } from './index-db.mjs';
import { resolveDefaultSearchMode } from './semantic-backend.mjs';
import { reindexBoot, reindexFull } from './index-rebuild.mjs';
import { search as searchAction, SEARCH_MODES, RECALL_ORIGINS } from './search.mjs';
import { STATE_INSTRUCTION, stateLabelText } from './state-label.mjs';
import { computeMemoryStats, renderMemoryStats } from './memory-stats.mjs';
import { memoryWrite } from './memory-write.mjs';
import { runMcpServer } from './mcp-server.mjs';
import { dailyDistill } from './daily-distill.mjs';
import { weeklyCurate } from './weekly-curate.mjs';
import { autoPersona } from './auto-persona.mjs';
import { exportPersona, importPersona } from './persona-portability.mjs';
import { setNativeAutoMemory, nativeMemoryInstallNote } from './native-memory.mjs';
import { rememberRich, richFactTitle, nonProjectTierNote, prepareNearDupGuard } from './remember-core.mjs';
import { getObservations, citeLink, buildTimeline, recentActivity, expandObservation, buildLinks } from './read-core.mjs';
import { readHookStdin } from './read-hook-stdin.mjs';
import { stripBom } from './read-json.mjs';
import { runLazyCompress } from './lazy-compress.mjs';
import { runDoctor } from './doctor.mjs';
import { importAnthropicMemory } from './import-anthropic-memory.mjs';
import { configGet, configSet, configShowOrigin } from './config-core.mjs';
import { importClaudeMd } from './import-claude-md.mjs';
import { extractTranscript, discoverSessions, harnessSlugForPath } from './transcripts.mjs';
import { importSessions, DEFAULT_MAX_SESSIONS } from './import-sessions.mjs';
import { buildTour } from './tour.mjs';
import { runRepair } from './repair.mjs';
import { startViewer } from './viewer.mjs';
import { runRoll, ROLL_SCOPES } from './roll.mjs';
import { lessonsPromote } from './lessons-promote.mjs';
import {
  markCronRegistered,
  unmarkCronRegistered,
} from './lazy-compress.mjs';
import { appendHealthEntry, HEALTH_CODES } from './health-log.mjs';
import { planRepairs, runRepairs } from './doctor-repair.mjs';
import {
  registerCron,
  unregisterCron,
  CRON_ENTRY_NAME,
  WEEKLY_ENTRY_NAME,
  DEFAULT_WEEKLY_SCHEDULE,
} from './register-crons.mjs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const __filename_subcommands = fileURLToPath(import.meta.url);
const __dirname_subcommands = dirname(__filename_subcommands);
import { homedir } from 'node:os';
import { forget as forgetAction } from './forget.mjs';
import { redactFact, purgeHard, gitAdvisory } from './redact.mjs';
import { overrideTrust as overrideTrustAction } from './trust.mjs';
import { resolveConflictQueue, mergeScratchpadBullets } from './conflict-queue.mjs';
import { resolveReviewQueue } from './review-queue.mjs';
import { resolvePruneQueue } from './prune-queue.mjs';
import { createInterface } from 'node:readline';
import { spawnSync } from 'node:child_process';
import { checkKitBinding } from './native-binding.mjs';
import { resolve as resolvePath, join, basename } from 'node:path';
import { resolveMcpProjectRoot, normalizeProjectPath } from './tier-paths.mjs';
import { findRunningKitMcpServers, stopMcpServers } from './mcp-procs.mjs';

/**
 * Resolve the cmk-auto-extract.mjs bin path so the KIRO stop hook's captureTurn
 * can spawn the detached auto-extract child (D-200). Mirrors the Claude Code bin's
 * resolution (env override → sibling bin/): without this, runHook called
 * captureTurn with no autoExtractPath and the in-module default is null, so
 * spawnAutoExtract short-circuits 'no-auto-extract-path' — capture writes the
 * transcript but NEVER extracts facts → no wedge promotion. The CLI's runHook
 * lives in src/, so the bin is a `../bin/` sibling. A missing bin → null → no
 * spawn (fail-safe for a never-crash hook); spawnAutoExtract logs the reason.
 * @param {Record<string,string|undefined>} [env=process.env]
 * @returns {string|null} absolute path to the bin, or null if it can't be found
 */
export function resolveKiroAutoExtractPath(env = process.env) {
  if (env.CMK_AUTO_EXTRACT_PATH && env.CMK_AUTO_EXTRACT_PATH.trim() !== '') {
    return env.CMK_AUTO_EXTRACT_PATH;
  }
  const sibling = join(__dirname_subcommands, '..', 'bin', 'cmk-auto-extract.mjs');
  return existsSync(sibling) ? sibling : null;
}

const NOTICE_PREFIX = 'not yet implemented';

/**
 * The install summary line for the Task-46 semantic outcome (Task 125.4:
 * pure + exported so the branches are testable without running install).
 * Returns null when there is nothing to print: an `error` action already
 * surfaces through result.errors, and the opt-in tip is suppressed under
 * --no-hooks (scaffold-only installs).
 */
export function formatSemanticSummary(semantic, { noHooks = false } = {}) {
  if (semantic?.action === 'enabled') {
    const w = semantic.warmed;
    return (
      '  Semantic recall ENABLED — `cmk search` now defaults to hybrid here.' +
      (w?.ok
        ? ` Model cached (${Math.round(w.ms / 1000)}s).`
        : ' Model downloads on first search.')
    );
  }
  if (semantic?.action === 'disabled') {
    return '  Semantic recall pinned OFF for this project (search.default_mode=keyword).';
  }
  if (semantic?.action === 'skipped' && !noHooks) {
    return '  Tip: `cmk install --with-semantic` adds local semantic recall (ask in your own words; one-time ~260 MB, no API calls).';
  }
  return null;
}

/**
 * Real `cmk install` action — wired in Task 3, extended in Task 4 with
 * --force passed through to the CLAUDE.md downgrade guard. Reads CLI
 * options/flags, dispatches to the install module, prints a one-line
 * summary, and reports the CLAUDE.md action (created / appended /
 * replaced / upgraded / downgrade-blocked / forced-downgrade / unchanged).
 */
// Task 141a (D-129): the install-time binding ask. npm 12 blocks
// better-sqlite3's binding build on a fresh `npm install -g` — the user's
// 2026-06-12 steer: ask AT INSTALL, never leave it to a secondary command.
// Interactive consent is required because the fix is itself an
// `npm install -g` (the design §14 ask-before-install rule); non-interactive
// runs print the command instead. All deps injectable for tests.
async function offerBindingFix(nativeBinding, options, { log, logError }) {
  if (!nativeBinding || nativeBinding.ok) return;
  const remedy = nativeBinding.remedy;
  logError(
    `  warning: better-sqlite3's native binding is unavailable (${nativeBinding.reason}).`,
  );
  logError(
    '  Most common cause: npm 12 blocks dependency install scripts by default (a Node major upgrade is the other). Search/reindex cannot work until the binding is rebuilt.',
  );
  // An explicit askImpl implies a consent channel exists (the test seam /
  // programmatic caller); only the readline default needs a real TTY.
  const interactive =
    options?.interactive ?? (options?.askImpl ? true : process.stdin.isTTY === true);
  const askFn =
    options?.askImpl ??
    (interactive
      ? (question) =>
          new Promise((resolveAnswer) => {
            const rl = createInterface({ input: process.stdin, output: process.stdout });
            rl.question(question, (answer) => {
              rl.close();
              resolveAnswer(answer);
            });
          })
      : null);
  if (!interactive || !askFn) {
    logError(`  Fix it any time with: ${remedy}`);
    return;
  }
  const answer = String(await askFn(`  Fix it now by running \`${remedy}\`? [Y/n] `))
    .trim()
    .toLowerCase();
  const yes = answer === '' || answer === 'y' || answer === 'yes';
  if (!yes) {
    log(`  Skipped. Fix it any time with: ${remedy}`);
    return;
  }
  const fixRunner =
    options?.fixRunner ??
    ((cmd) =>
      // Constant command under shell:true (npm is npm.cmd on Windows); the
      // 10-min ceiling mirrors buildDefaultNpmRunner's spawn discipline.
      spawnSync(cmd, { stdio: 'inherit', shell: true, timeout: 600_000 }));
  const r = fixRunner(remedy);
  const reProbe = options?.reProbe ?? checkKitBinding;
  const after = r.status === 0 ? reProbe() : { ok: false };
  if (after.ok) {
    log('  Binding rebuilt — search is ready.');
  } else {
    logError(`  The binding is still unavailable — run it manually later: ${remedy}`);
  }
}

// Task 200 (D-272/D-277): the first-touch backend-CLI check. `cmk install`
// wires the kit for an agent whose OWN CLI runs the automatic LLM call — so if
// that CLI isn't on PATH, the automatic features silently no-op (the D-270 bug).
// This warns AT INSTALL (the moment the gap is actionable), before the user ever
// wonders why nothing summarizes. Honest degrade: the file-only surfaces still
// work; only the automatic LLM steps wait on the CLI. Shared by the claude +
// per-agent install paths. `backendCliProbe` injectable so tests don't spawn.
// Task 205 (D-302): a best-effort heads-up when the kit's own MCP servers are
// running. Windows-only surface: a running `cmk mcp serve` holds a lock on the
// kit's native DLLs (vec0.dll / better_sqlite3.node), so a FUTURE
// `npm install -g` upgrade during the lock can HALF-BREAK the global (the
// half-install.mjs class). This `cmk install` itself is safe — the note exists
// so the user learns the hazard + gets a one-tap stop when interactive (the
// servers reconnect automatically on the host's next MCP tool call — the
// documented manual kill, automated). Best-effort by construction: a failed
// process scan is silent (the preflight is an optimization, never a gate).
export async function warnRunningMcpServers(options, { log } = {}) {
  // NEVER-THROW (stress-gate catch, D-315): the preflight is an optimization —
  // an exploding scan, ask, or stop must never break `cmk install` (the
  // binding-fix tests pass a THROWING askImpl sentinel; pre-guard, that
  // sentinel detonated out of runInstall on the dev machine).
  try {
    const emit = log ?? console.log;
    const platform = options?.mcpProcsPlatform ?? process.platform;
    if (platform !== 'win32') return; // the DLL-lock hazard is Windows-only
    // INTERACTIVE-ONLY, gated BEFORE the process scan (self-review finding): the
    // preflight's whole purpose is teaching a human the hazard + the one-tap stop
    // — in CI / tests / scripted installs nobody reads it, and the real CIM scan
    // would add ~1s + nondeterministic output to every hermetic runInstall call
    // (this dev machine genuinely runs a kit server — the scan would FIND it).
    const interactive =
      options?.interactive ?? (options?.askImpl ? true : process.stdin.isTTY === true);
    if (!interactive) return;
    // HERMETICITY GUARD (stress-gate catch, D-315): `askImpl` is a SHARED seam —
    // the binding-fix tests pass one (sometimes a throwing sentinel) with no
    // intent to authorize THIS feature's real-system process scan; on this dev
    // machine the scan then found the genuinely-running server and asked the
    // throwing sentinel (a nondeterministic, environment-dependent failure the
    // stress gate caught on run 3+). Never touch the REAL system unless a real
    // TTY is present OR the caller injected this feature's OWN find seam.
    const find = options?.findMcpServers;
    if (!find && process.stdin.isTTY !== true) return;
    const { servers } = (find ?? findRunningKitMcpServers)();
    if (!servers || servers.length === 0) return;
    const pids = servers.map((s) => s.pid);
    // Task 222 (D-302 follow-up, v0.5.1 cut-gate — the user's "why do I need all
    // this?"): a plain `cmk install` is SILENT here. The DLL-lock hazard this
    // warns about is `npm install -g`-only (a command the kit can't hook), so a
    // project install can never cause it, the interactive stop's answer is
    // always N, AND the verbose per-PID + lecture output is pure noise on the
    // common path. The full warning + stop-offer print ONLY when a caller opts
    // in via `offerStop` (a real upgrade context — a future `cmk update` / a
    // doctor path); `cmk doctor` is the right home for the passive heads-up.
    if (!options?.offerStop) return;
    emit(
      `  note: ${servers.length} kit MCP server${servers.length > 1 ? 's are' : ' is'} running:`,
    );
    // Show WHAT each pid is (skill-review D-314: the matcher intentionally
    // over-matches rare lookalikes, so the user must be able to SEE what a
    // confirmed stop would kill — pids alone aren't informed consent).
    for (const s of servers) {
      const cmd = String(s.commandLine ?? '').trim();
      emit(`    pid ${s.pid} — ${cmd.length > 100 ? cmd.slice(0, 100) + '…' : cmd || '(command line unavailable)'}`);
    }
    emit(
      '  Fine for normal use — but stop them before upgrading the global package',
    );
    emit(
      '  (npm install -g @lh8ppl/core-memory-kit), or the upgrade can half-break on locked files.',
    );
    const askFn =
      options?.askImpl ??
      ((question) =>
        new Promise((resolveAnswer) => {
          const rl = createInterface({ input: process.stdin, output: process.stdout });
          rl.question(question, (answer) => {
            rl.close();
            resolveAnswer(answer);
          });
        }));
    // Default NO — stopping other processes is the opt-in direction (contrast the
    // binding fix's default-yes: that repairs THIS install; this touches the host).
    const answer = String(
      await askFn('  Stop them now? They reconnect automatically next tool call. [y/N] '),
    )
      .trim()
      .toLowerCase();
    if (answer !== 'y' && answer !== 'yes') return;
    const stop = options?.stopMcpServers ?? stopMcpServers;
    const results = stop(pids);
    const ok = results.filter((r) => r.stopped).length;
    emit(`  stopped ${ok}/${pids.length} server${pids.length > 1 ? 's' : ''}.`);
  } catch {
    // best-effort by contract — a preflight failure never breaks install.
  }
}

export function warnMissingBackendCli(agent, { log, backendCliProbe } = {}) {
  const emit = log ?? console.log;
  const probe = backendCliProbe ?? ((a) => agentCliOnPath(a));
  const r = probe(agent);
  if (r.present) return; // silent on success — the happy path prints nothing extra
  emit(
    `  Heads-up: the ${agent} CLI (${r.bin}) isn't on your PATH yet` +
      `${r.reason ? ` — ${r.reason}` : ''}.`,
  );
  emit(
    `  Capture, search, recall and the delete-guard work now, but automatic` +
      ` compression / extraction / persona wait until you install it.`,
  );
}

// Task 201 (D-277): apply a `--backend <agent>` split-brain override at install
// time — sugar over `cmk config set backend.agent <agent>` (both write the SAME
// key; the flag is the front-door). Validated against KNOWN_BACKEND_AGENTS.
// Returns {ok} / {ok:false} / {skipped} so the install path can report + degrade.
// Pure validation of a `--backend <agent>` value — NO side effects (no write, no
// exit code). Returns {skipped} (no flag → follow --ide), {ok, agent} (valid, the
// normalized agent), or {ok:false, error} (unknown). Used to FAIL-FAST at the top
// of an install (before the scaffold runs), mirroring how `--ide` is validated
// before scaffolding — a typo'd flag rejects immediately, never after doing the work.
export function validateBackendFlag(rawAgent) {
  if (rawAgent == null || String(rawAgent).trim() === '') return { skipped: true };
  const agent = String(rawAgent) === 'claude-code' ? 'claude' : String(rawAgent);
  if (!KNOWN_BACKEND_AGENTS.includes(agent)) {
    return { ok: false, error: `unknown --backend '${rawAgent}'. Supported: ${KNOWN_BACKEND_AGENTS.join(', ')}.` };
  }
  return { ok: true, agent };
}

// Persist the (already-validated) `--backend` override to the project tier, after
// the scaffold has created context/. Sugar over `cmk config set backend.agent`.
// Re-validates defensively (callers that skip the early gate still get correctness).
export function applyBackendOverride(rawAgent, { projectRoot, log, logError } = {}) {
  const emit = log ?? console.log;
  const emitErr = logError ?? console.error;
  const v = validateBackendFlag(rawAgent);
  if (v.skipped) return { skipped: true }; // no --backend → the backend follows --ide (Task 200 default)
  if (!v.ok) {
    emitErr(`cmk install: ${v.error}`);
    process.exitCode = 2;
    return { ok: false };
  }
  const r = configSet('backend.agent', v.agent, { projectRoot, tier: 'project' });
  if (!r.ok) {
    emitErr(`cmk install --backend: ${r.error}`);
    process.exitCode = 2;
    return { ok: false };
  }
  emit(`  Automatic memory will run through the ${v.agent} CLI (backend.agent=${v.agent}).`);
  return { ok: true, agent: v.agent };
}

// Exported for tests (Task 141a) — dep-injectable (cwd / userTier / log /
// logError / bindingProbe / askImpl / fixRunner / reProbe / interactive) on
// the runImportClaudeMd pattern. Defaults unchanged for production.
export async function runInstall(options /* , command */) {
  const log = options?.log ?? console.log;
  const logError = options?.logError ?? console.error;
  // commander maps `--no-hooks` to options.hooks === false.
  const noHooks = !!(options && options.hooks === false);
  const verbose = !!(options && options.verbose);

  // Task 201: FAIL-FAST on a bad --backend value BEFORE any scaffold runs (mirrors
  // how --ide is validated up front). A typo'd --backend must reject immediately,
  // not leave a fully-scaffolded project + exit 2. Applies to BOTH the claude path
  // and the --ide route below (validated once here). The actual write happens
  // after the scaffold (applyBackendOverride).
  const backendCheck = validateBackendFlag(options?.backend);
  if (backendCheck.ok === false) {
    logError(`cmk install: ${backendCheck.error}`);
    process.exitCode = 2;
    return;
  }

  // Task 205 (D-302): PREFLIGHT — the running-MCP-server heads-up (the Windows
  // DLL-lock hazard for future `npm install -g` upgrades). At the TOP so BOTH
  // the claude path and every --ide agent path get it (the hazard is identical
  // — any agent's host spawns `cmk mcp serve`). Best-effort + win32-only inside.
  // Task 222 (D-302 follow-up): NO `offerStop` here — a plain `cmk install`
  // INFORMS but never prompts (the hazard is upgrade-only; a project install
  // can't cause it, so the stop's answer would always be N). The actionable
  // stop-offer is reserved for a future upgrade context that opts in.
  await warnRunningMcpServers(options, { log });

  // Task 50.F — cross-agent routing. Default is claude-code (the existing path,
  // untouched). For another agent, scaffold the agent-neutral project tier via
  // installAction with hooks OFF (the Claude-Code hook wiring doesn't apply), then
  // wire THAT agent's legs (hooks + MCP + instruction file) via installAgent.
  const ide = (options && options.ide) || 'claude-code';
  if (ide !== 'claude-code') {
    return runInstallForAgent({ ide, options, log, logError });
  }

  const result = await installAction({
    force: !!(options && options.force),
    noHooks,
    // Task 46: two flags, 3-state semantics (enable / pin-off / untouched).
    // commander maps `--no-semantic` to options.semantic === false (the
    // same negation pattern as --no-hooks above); `--with-semantic` maps
    // to options.withSemantic.
    withSemantic: !!(options && options.withSemantic),
    noSemantic: !!(options && options.semantic === false),
    projectRoot: options?.cwd,
    userTier: options?.userTier,
    bindingProbe: options?.bindingProbe,
  });

  // Outcome over inventory (self-test UX finding): state the resulting state +
  // next action, not a file tally. The old "scaffolded 5, skipped 4 existing"
  // read like a problem on a FRESH folder — the "skipped" are the cross-project
  // user tier at ~/.core-memory-kit/ (OUTSIDE this folder), already on disk.
  // The full per-tier breakdown is --verbose only.
  const projectName = basename(result.projectRoot);
  const wired =
    result.hooks.action === 'wired' || result.hooks.action === 'unchanged';
  const broughtSomethingNew =
    result.created.length > 0 ||
    result.gitignore.action === 'created' ||
    result.claudeMd.action === 'created';

  // Task 230: a kit-owned scaffold refresh is never silent — name it in the
  // human-facing line (the result's `refreshed` array is the machine surface).
  const refreshedNote =
    (result.refreshed?.length ?? 0) > 0
      ? `, ${result.refreshed.length} kit file(s) refreshed to this version`
      : '';
  if (broughtSomethingNew) {
    log(
      `cmk install: ${projectName} ready — context/ scaffolded${
        wired ? ', hooks wired' : ''
      }${refreshedNote}.`,
    );
  } else {
    log(
      `cmk install: ${projectName} already set up (your memory preserved)${
        wired ? ', hooks refreshed' : ''
      }${refreshedNote}.`,
    );
  }
  if (wired) {
    log(
      '  Restart Claude Code to activate. Complete install — no separate /plugin step needed.',
    );
  }
  // Task 60 / ADR-0011 heads-up: the kit coexists with Claude Code's native
  // Auto Memory by default; surface the one-command opt-out (null when already
  // opted out, so we don't nag).
  const nativeNote = nativeMemoryInstallNote(result.projectRoot);
  if (nativeNote) log(nativeNote);
  // Task 46: semantic-recall outcome (pure formatter, Task 125.4 — testable
  // without spawning install; the error case returns null because enableSemantic
  // errors already land in result.errors and print through the error path).
  const semanticLine = formatSemanticSummary(result.semantic, { noHooks });
  if (semanticLine) log(semanticLine);
  if (verbose) {
    log(
      `  files: ${result.created.length} created, ${result.skipped.length} already present` +
        (result.skipped.length
          ? ' (incl. the cross-project user tier at ~/.core-memory-kit/, outside this folder)'
          : ''),
    );
    log(
      `  .gitignore=${result.gitignore.action} · CLAUDE.md=${result.claudeMd.action} · hooks=${result.hooks.action}`,
    );
  }

  // Task 248: the auto-recovery report. Silent unless this run actually
  // recovered/repaired something (formatRecoveryReport owns that rule), so a
  // re-install over an already-recovered husk prints nothing.
  for (const line of formatRecoveryReport(result.recovery)) log(line);

  if (result.claudeMd.action === 'downgrade-blocked') {
    logError(
      `  warning: CLAUDE.md already has a newer kit block (v${result.claudeMd.oldVersion}). ` +
        `Re-run with --force to downgrade.`
    );
  }

  if (result.errors.length > 0) {
    for (const e of result.errors) logError(`  error: ${e.path}: ${e.error}`);
    process.exitCode = 1;
  }

  // Task 201 (D-277): a `--backend <agent>` split-brain override — set the config
  // key so the automatic engine routes through that agent instead of the
  // installed-for one. Then warn about the EFFECTIVE backend agent's CLI.
  const overrideResult = applyBackendOverride(options?.backend, {
    projectRoot: result.projectRoot, log, logError,
  });
  const effectiveBackend =
    overrideResult.ok && overrideResult.agent ? overrideResult.agent : 'claude';
  // Task 200 (D-272): first-touch backend-CLI heads-up for the effective backend.
  warnMissingBackendCli(effectiveBackend, { log, backendCliProbe: options?.backendCliProbe });

  // Task 225: the day-one-memory offer — existing harness history detected →
  // ONE question, default-skip. Before the binding ask, which stays LAST
  // (Task 141a: the tail of install output is what gets read).
  await offerImportSessions(options, { projectRoot: result.projectRoot, log });

  // Task 141a: the binding ask comes LAST — it's the one thing the user may
  // still need to act on, and the tail of install output is what gets read.
  await offerBindingFix(result.nativeBinding, options, { log, logError });
}

/**
 * Task 50.F — `cmk install --ide <agent>` for a non-Claude-Code agent.
 * Scaffolds the agent-neutral project tier (context/, CLAUDE.md block, gitignore —
 * via installAction with hooks off, since the Claude-Code hook wiring doesn't
 * apply), then wires THAT agent's legs (hooks + MCP + instruction file) via
 * installAgent. One step — no second command (the user-friendly criterion).
 */
async function runInstallForAgent({ ide, options, log, logError }) {
  const profile = getAgentProfile(ide);
  if (!profile) {
    const known = listAgentProfiles().map((p) => p.name).join(', ');
    logError(`cmk install: unknown --ide '${ide}'. Supported: ${known}.`);
    process.exitCode = 2;
    return;
  }

  // 1) agent-neutral scaffold (context/ + the kit's own CLAUDE.md block live
  //    regardless of agent). Hooks OFF — the agent's hooks are wired in step 2.
  //    skipClaudeFiles: `.claude/skills/` + `CLAUDE.md` are Claude-Code-specific;
  //    a non-CC agent gets its instructions from its own surface (Kiro →
  //    .kiro/skills/ + .kiro/steering/ + AGENTS.md), so we must not leave dead
  //    Claude files on the project (D-188). An EXISTING Claude install's files
  //    are untouched — we just don't create fresh ones.
  const scaffold = await installAction({
    force: !!(options && options.force),
    noHooks: true,
    withSemantic: !!(options && options.withSemantic),
    noSemantic: !!(options && options.semantic === false),
    projectRoot: options?.cwd,
    userTier: options?.userTier,
    bindingProbe: options?.bindingProbe,
    spawnNpm: options?.spawnNpm,
    warmEmbedder: options?.warmEmbedder,
    skipClaudeFiles: true,
  });

  const projectName = basename(scaffold.projectRoot);

  // Task 248: the auto-recovery report, for the --ide agents too (the recovery
  // runs inside installAction, so every agent path gets it). Rendered here —
  // once — rather than in each agent branch's several return paths.
  for (const line of formatRecoveryReport(scaffold.recovery)) log(line);

  // 2) wire the agent's surfaces. Kiro has its OWN orchestrator (D-182): five
  //    surfaces (MCP + steering + skills + IDE hooks + the CLI agent-config),
  //    not the generic installAgent's Claude-Code-shaped model.
  if (ide === 'kiro') {
    // awsDir: tests/sandboxes pass $MEMORY_KIT_AWS_DIR via options.awsDir to keep
    // the CLI-agent leg out of the real ~/.aws; production leaves it undefined →
    // the real ~/.kiro (where kiro-cli actually reads its agents).
    const r = installKiro({ projectRoot: scaffold.projectRoot, awsDir: options?.awsDir });
    if (r.action === 'error') {
      for (const e of r.errors || []) {
        logError(`  error: Kiro ${e.surface}: ${(e.errors || []).join('; ')}`);
      }
      logError(
        `cmk install: ${projectName} scaffolded but Kiro wiring failed (a config file could not be safely written — see above).`,
      );
      process.exitCode = 1;
      return;
    }
    log(
      `cmk install: ${projectName} ready for Kiro — context/ scaffolded; ${r.surfaces.join(' + ')} wired.`,
    );
    log('  Restart Kiro to activate the hooks (steering + skills + MCP are immediate).');
    // The CLI agent-config (kiro-cli) is automatic only when cmk is the default
    // agent. If the user already has a default, surface the one manual step.
    if (r.cliDefaultAgent === 'skipped-existing') {
      // D-328: the kit won't clobber your own kiro-cli default agent, so it
      // installs a named `cmk` agent instead. On your OTHER default agent the
      // kit's memory still CAPTURES automatically (project `.kiro/hooks/` fire
      // regardless of agent — D-285), but an explicit MCP save may prompt once
      // per session — kiro-cli ignores mcp.json's autoApprove by design (issue
      // #4672, intended), and you can't pre-trust tools for a default agent you
      // didn't author (#4384). The clean fixes, in order of least→most change:
      log('  Note: you already have a Kiro CLI default agent — the kit installed a `cmk` agent instead (yours is untouched).');
      log('        Memory still captures automatically on your agent. For fully prompt-free EXPLICIT saves, either:');
      log('          • make cmk your default:   kiro-cli agent set-default cmk');
      log('          • or trust per session:    /tools trust @cmk   (inside kiro-cli chat)');
    }
    if (scaffold.errors.length > 0) {
      for (const e of scaffold.errors) logError(`  error: ${e.path}: ${e.error}`);
      process.exitCode = 1;
    }
    // Task 201: a --backend override routes automatic memory through a different
    // agent than the installed-for Kiro; warn about the EFFECTIVE backend.
    const kiroOverride = applyBackendOverride(options?.backend, { projectRoot: scaffold.projectRoot, log, logError });
    const kiroBackend = kiroOverride.ok && kiroOverride.agent ? kiroOverride.agent : 'kiro';
    warnMissingBackendCli(kiroBackend, { log, backendCliProbe: options?.backendCliProbe });
    return;
  }

  // Other agents: the generic per-profile installer.
  const wired = installAgent({ projectRoot: scaffold.projectRoot, profile });

  if (wired.action === 'error') {
    for (const e of wired.errors || []) {
      logError(`  error: ${profile.displayName} ${e.leg}: ${(e.errors || []).join('; ')}`);
    }
    // Report which legs DID land (every leg is independently idempotent +
    // touch-only, so a re-run after fixing the flagged file is safe).
    const landed = Object.entries(wired.legs || {})
      .filter(([, action]) => action && action !== 'error')
      .map(([leg]) => leg);
    if (landed.length) {
      logError(`  (${landed.join(' + ')} already wired; re-run after fixing the file above — safe, idempotent.)`);
    }
    logError(
      `cmk install: ${projectName} scaffolded but ${profile.displayName} wiring failed (a config file could not be safely written — see above).`,
    );
    process.exitCode = 1;
    return;
  }

  // Describe what THIS integration type actually wired (instruction-only writes
  // just the instruction file; full agents wire hooks + MCP too).
  const wiredLegs = [
    wired.legs.instruction ? 'instruction file' : null,
    wired.legs.mcp ? 'MCP' : null,
    wired.legs.hooks ? 'hooks' : null,
  ].filter(Boolean);
  log(
    `cmk install: ${projectName} ready for ${profile.displayName} — context/ scaffolded, ${wiredLegs.join(' + ')} wired.`,
  );
  if (profile.integrationType === 'instruction-only') {
    log('  Instruction-file only (no hooks/MCP) — a portable memory-awareness rung for tools that read AGENTS.md.');
  } else {
    log('  Restart the agent to activate. Complete install — one step, no separate command.');
  }
  // Codex specifics (Task 196 tail): (a) hash-based hook trust — non-managed
  // hooks are SKIPPED until reviewed once via /hooks (never claim zero-step);
  // (b) when the codex CLI wasn't reachable (the desktop app bundles it
  // off-PATH), the MCP leg degraded to a printed one-liner.
  if (profile.name === 'codex') {
    log('  One-time step: run /hooks inside Codex once to review + trust the kit\'s hooks (Codex skips untrusted hooks).');
    if (wired.legs.mcp === 'manual' && wired.mcpManualCommand) {
      log(`  MCP: the codex CLI was not reachable — register the kit\'s MCP server yourself:`);
      log(`    ${wired.mcpManualCommand}`);
    }
  }

  if (scaffold.errors.length > 0) {
    for (const e of scaffold.errors) logError(`  error: ${e.path}: ${e.error}`);
    process.exitCode = 1;
  }
  // Task 201: apply a --backend override (routes automatic memory through a
  // different agent than the installed-for one).
  const genOverride = applyBackendOverride(options?.backend, { projectRoot: scaffold.projectRoot, log, logError });
  // Task 200 (D-272): warn about the EFFECTIVE backend CLI. If overridden to a
  // known backend agent, warn about that; else if this agent has its own backend
  // (cursor → cursor-agent), warn about it. Instruction-only agents (agents-md)
  // with no override + no dedicated backend fall back to the runtime default.
  const effective = genOverride.ok && genOverride.agent ? genOverride.agent : ide;
  if (KNOWN_BACKEND_AGENTS.includes(effective)) {
    warnMissingBackendCli(effective, { log, backendCliProbe: options?.backendCliProbe });
  }
}

/**
 * Task 50.J/50.L — `cmk hook <event>` — the Kiro hook entrypoint.
 *
 * Kiro's IDE + CLI hooks call `cmk hook <event>` (agentSpawn / promptSubmit /
 * stop / preToolUse). Unlike Claude Code's hook bins (which read a stdin JSON
 * payload), Kiro passes context via argv + env + cwd + its transcript file
 * (probe-verified, P-CJYGTQYR). runKiroHook adapts that to the kit's cores.
 *
 * ALWAYS exits 0 EXCEPT a deliberate preToolUse BLOCK (exit 2 → the memory
 * delete-guardrail, D-192). A crashed hook still exits 0 (fail-open).
 */
/**
 * Extract the about-to-run TOOL COMMAND from a preToolUse hook payload, for the
 * memory delete-guardrail (D-192).
 *
 * Kiro's `preToolUse` delivers `{ tool_name, tool_input: { command } }` on STDIN
 * — the SAME shape as Claude Code (VERIFIED from the real oh-my-kiro + vibekit
 * preToolUse hooks: `cat | jq '.tool_input.command'`). So the production guard
 * uses the `cmk-guard-memory` bin directly (it reads that stdin); this helper is
 * the forward-compat path if a `cmk hook preToolUse` is ever wired instead. A
 * `.command` fallback covers a flattened payload. No match → '' (fail-open).
 */
export function kiroToolCommand(payload, _cwd) {
  const p = payload || {};
  const cmd = p.tool_input?.command ?? p.command;
  return typeof cmd === 'string' ? cmd : '';
}

export function runHook(event, _options = {}, _command, deps = {}) {
  const log = deps.log ?? ((s) => process.stdout.write(s));
  const logError = deps.logError ?? ((s) => process.stderr.write(`${s}\n`));
  // The Kiro hook payload. Most events (agentSpawn/promptSubmit/stop/preToolUse)
  // get their input from argv + env (USER_PROMPT) + cwd + transcript, NOT stdin —
  // and runHook must NOT blocking-read fd 0 for them (a dangling-open `runCommand`
  // stdin would hang the hook to its timeout — B1, the skill-review catch).
  //
  // postToolUse (50.N.2) is the ONE event whose data (tool_name/tool_input/
  // tool_response) has no env fallback — it arrives as a STDIN JSON payload. We
  // read stdin ONLY for postToolUse, TTY-guarded (readHookStdin returns '' on a
  // TTY). Tests inject `deps.payload` to bypass the read entirely.
  //
  // WHY THIS IS SAFE (the precedent, not a guess): the kit ALREADY ships a
  // stdin-reading hook in the SAME kiro-cli agent config — `cmk-guard-memory`
  // (preToolUse) reads stdin the identical way (readHookStdin → readFileSync(0)).
  // preToolUse and postToolUse are siblings in the same Amazon-Q hook contract,
  // both delivering {tool_name, tool_input, …} on a piped-and-closed stdin. If
  // Kiro left that stdin dangling-open, the already-merged guard would hang on
  // every shell command — it doesn't. So this read rests on the same (verified-by-
  // -contract-shape) assumption the guard already relies on, NOT a new risk.
  // The 50.N.1 B1 fix removed a stdin read for events that have an ENV fallback
  // (the prompt) — postToolUse has none, so the read is necessary here.
  // VERIFICATION (surfaced, not buried): the live stdin-close + payload-shape
  // assumption both this leg AND the preToolUse guard depend on is a BLOCKING
  // cut-gate item (KG-observe, paired with KG-guard) — one real kiro-cli fs_write
  // verifies both. Until that passes live, this leg is "structurally wired,
  // live-unverified" (stated in the PR body + the 50.N.2 task, per the no-disclaimer
  // -ships-latent rule).
  let payload = deps.payload;
  if (payload === undefined) {
    if (event === 'postToolUse') {
      // D-306: BOM-tolerant parse (shared with the Cursor path) — defensive
      // against any agent that prepends a UTF-8 BOM to the piped payload.
      const readStdin = deps.readStdin ?? (() => readHookStdin({ isTTY: process.stdin.isTTY }));
      payload = parseHookStdin(readStdin());
    } else {
      payload = {};
    }
  }
  const r = runKiroHook({
    argv: [event],
    cwd: deps.cwd ?? process.cwd(),
    env: deps.env ?? process.env,
    payload,
    deps: {
      readKiroTurn: deps.readKiroTurn ?? readKiroTurn,
      // injectContext returns {snapshot, hookOutput, …} — the memory text is
      // `.snapshot`. The original wiring read a non-existent `.text` field, so
      // the Kiro inject leg emitted EMPTY in production while every routing
      // test (which fakes inject) passed — found by the Task-196 sandbox
      // live-test, locked by the D-269 integration tests in
      // cli-cursor-hook-bin.test.js. userDir is passed through so
      // cross-project user-tier memory surfaces on Kiro inject too.
      inject: deps.inject ?? ((args) => {
        const r = injectContext({ cwd: args.cwd, ...(args.userDir ? { userDir: args.userDir } : {}) });
        return { ok: true, text: typeof r === 'string' ? r : r?.snapshot ?? '' };
      }),
      // Pass a RESOLVED autoExtractPath so captureTurn can spawn the detached
      // auto-extract child (D-200 — else no extraction, no wedge promotion). The
      // `captureTurn` impl is injectable (deps.captureTurn) so a test can assert
      // the autoExtractPath is forwarded WITHOUT replacing the whole capture dep
      // (replacing `capture` would bypass the very wiring under test).
      capture: deps.capture ?? ((args) => (deps.captureTurn ?? captureTurn)({
        payload: args.payload,
        projectRoot: args.projectRoot,
        autoExtractPath: resolveKiroAutoExtractPath(deps.env ?? process.env),
      })),
      // 50.N.1 — prompt-capture on the prompt-submit events (the <private>-strip
      // + transcript-append half of Claude Code's UserPromptSubmit). Best-effort;
      // the dispatcher swallows a throw so inject still runs.
      capturePrompt: deps.capturePrompt ?? ((args) => capturePrompt({
        payload: args.payload,
        projectRoot: args.projectRoot,
      })),
      // 50.N.2 — postToolUse → observe-edit (the file-edit observation leg). The
      // bin maps Kiro's fs_write → Write before this runs. Best-effort.
      observe: deps.observe ?? ((args) => observeEdit({
        payload: args.payload,
        projectRoot: args.projectRoot,
      })),
      // preToolUse → the memory delete-guardrail (D-192). Reads the about-to-run
      // tool command out of the Kiro payload and returns {block, reason?}.
      guard: deps.guard ?? ((args) => decideGuard(kiroToolCommand(args.payload, args.cwd))),
    },
  });
  if (r.stdout) log(r.stdout);
  if (r.stderr) logError(r.stderr);
  // The always-exit-0 invariant holds for EVERY event EXCEPT a deliberate
  // preToolUse BLOCK (exit 2 → Kiro blocks the tool, D-192). Honor the
  // dispatcher's exitCode (0 for inject/capture/noop/error; 2 only on a guard
  // block) instead of hardcoding 0 — a crashed guard still fails open (the
  // dispatcher's catch returns exitCode 0).
  process.exitCode = typeof r.exitCode === 'number' ? r.exitCode : 0;
}

/**
 * D-305 — normalize a Cursor `workspace_roots[0]`.
 *
 * Cursor on Windows (3.5.17, ground-truth-captured live in the v0.5.0 cut-gate)
 * sends the project root as `/c:/Temp/proj` — a leading slash BEFORE the drive
 * letter, forward-slashed. Fed to `path.join`, that resolves to `\c:\Temp\proj`
 * (a bogus path off the process cwd), so every hook wrote `now.md` to a garbage
 * location and capture silently no-op'd on Windows. Strip a leading slash /
 * backslash run that directly precedes a `<letter>:` drive. Already-valid roots
 * are untouched: `/home/u/proj` (no drive letter → no match), `C:\Temp\proj`
 * and `C:/Temp/proj` (no leading slash → no match).
 *
 * @param {string} root
 * @returns {string}
 */
export function normalizeCursorRoot(root) {
  if (typeof root !== 'string') return root;
  return root.replace(/^[/\\]+([A-Za-z]:)/, '$1');
}

/**
 * D-306 — parse a hook stdin payload, tolerant of a leading UTF-8 BOM.
 *
 * Cursor on Windows (3.5.17, ground-truth-captured live) prepends a UTF-8 BOM
 * (U+FEFF) to the JSON it pipes to a hook command. `JSON.parse` THROWS on the
 * BOM, which silently degraded every Cursor hook to `{}` → unknown event →
 * no-op (exit 0, empty stdout, no capture). Strip a leading BOM (codePoint
 * check, not an invisible literal an editor could drop) before parsing.
 * Returns `{}` for empty/whitespace/unparseable input — the callers treat that
 * as an unknown event (a clean no-op, never a crash).
 *
 * @param {string} raw
 * @returns {object}
 */
export function parseHookStdin(raw) {
  if (typeof raw !== 'string') return {};
  const s = stripBom(raw); // the canonical BOM strip (read-json.mjs) — no drift
  if (s.trim() === '') return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/**
 * Task 196 — `cmk cursor-hook` — the Cursor hook entrypoint.
 *
 * Cursor wires ONE command for every hook event; the payload arrives as JSON on
 * stdin with `hook_event_name` (the router key) + `workspace_roots` (the
 * authoritative project root — Cursor may spawn hooks outside the project dir,
 * so cwd is only the fallback). Responses are Cursor-shaped JSON on stdout
 * (cursor.com/docs/agent/hooks, primary-verified 2026-07-03). ALWAYS exits 0 —
 * deny is expressed via the JSON `permission` field, never an exit code.
 */
export async function runCursorHook(_options = {}, _command, deps = {}) {
  const log = deps.log ?? ((s) => process.stdout.write(s));
  const logError = deps.logError ?? ((s) => process.stderr.write(`${s}\n`));

  // The Cursor payload — JSON on a piped-and-closed stdin (the documented hook
  // protocol). TTY-guarded so a manual `cmk cursor-hook` doesn't hang; malformed
  // JSON degrades to {} (→ unknown event → no-op), never a crash.
  let payload = deps.payload;
  if (payload === undefined) {
    // D-306: parse via the BOM-tolerant reader — Cursor on Windows prepends a
    // UTF-8 BOM that a raw JSON.parse chokes on, silently no-op'ing every hook.
    const readStdin = deps.readStdin ?? (() => readHookStdin({ isTTY: process.stdin.isTTY }));
    payload = parseHookStdin(readStdin());
  }
  const event = typeof payload.hook_event_name === 'string' ? payload.hook_event_name : '';
  const roots = payload.workspace_roots;
  const rawRoot =
    (Array.isArray(roots) && typeof roots[0] === 'string' && roots[0]) ||
    deps.cwd ||
    process.cwd();
  // D-305: Cursor on Windows (3.5.17, ground-truth-captured in the v0.5.0 gate)
  // sends workspace_roots as `/c:/Temp/proj` — a leading slash BEFORE the drive
  // letter. `path.join` on that yields `\c:\Temp\proj\…` (a bogus root off the
  // process cwd), so every hook wrote now.md to a garbage location and capture
  // silently no-op'd on Windows. Strip the leading slash(es) that precede a
  // drive letter; already-valid POSIX (`/home/…`) and Windows (`C:\…`, `C:/…`)
  // roots are untouched (the pattern only matches slash-then-drive-letter).
  const cwd = normalizeCursorRoot(rawRoot);
  const env = deps.env ?? process.env;

  const r = dispatchCursorHook({
    event,
    payload,
    cwd,
    deps: {
      inject: deps.inject ?? ((args) => {
        // injectContext returns {snapshot, …} — see the D-269 note on the Kiro
        // wiring above (the same read-the-wrong-field bug, fixed together).
        const res = injectContext({ cwd: args.cwd, ...(args.userDir ? { userDir: args.userDir } : {}) });
        return { ok: true, text: typeof res === 'string' ? res : res?.snapshot ?? '' };
      }),
      // Forward a RESOLVED auto-extract path so captureTurn can spawn the
      // detached extraction child (the D-200 class — without it, capture
      // appends the transcript but never extracts facts). The resolver is
      // agent-neutral (env override → sibling bin/) despite its Kiro name.
      capture: deps.capture ?? ((args) => (deps.captureTurn ?? captureTurn)({
        payload: args.payload,
        projectRoot: args.projectRoot,
        autoExtractPath: resolveKiroAutoExtractPath(env),
      })),
      capturePrompt: deps.capturePrompt ?? ((args) => capturePrompt({
        payload: args.payload,
        projectRoot: args.projectRoot,
      })),
      observe: deps.observe ?? ((args) => observeEdit({
        payload: args.payload,
        projectRoot: args.projectRoot,
      })),
      // beforeShellExecution → the memory delete-guardrail (D-192). Cursor's
      // payload carries the command at the TOP level ({command, cwd}), not
      // under tool_input.
      guard: deps.guard ?? ((args) => decideGuard(
        typeof args.payload?.command === 'string' ? args.payload.command : '',
      )),
      // sessionEnd → the same compress+persona tasks Claude Code's SessionEnd
      // bin runs. Lazily imported so the heavy compressor stack never loads on
      // the hot per-turn events.
      sessionEnd: deps.sessionEnd ?? (async (args) => {
        const [{ runSessionEndTasks }, { makeBackend }] = await Promise.all([
          import('./session-end-tasks.mjs'),
          import('./make-backend.mjs'),
        ]);
        const userDir = env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
        await runSessionEndTasks({
          projectRoot: args.projectRoot,
          userDir,
          // Task 200: agent-relative backend (picks the installed-for agent's CLI).
          makeBackend: () => makeBackend({ projectRoot: args.projectRoot, userDir }),
        });
      }),
    },
  });

  if (r.stdout) log(r.stdout);
  if (r.stderr) logError(r.stderr);
  // sessionEnd hands back the running async tasks — await them so the process
  // doesn't exit under the work. Fail-open: a rejection is logged, never thrown.
  if (r.pending && typeof r.pending.then === 'function') {
    try {
      await r.pending;
    } catch (err) {
      logError(`cmk cursor-hook ${event}: ${err?.message ?? err}`);
    }
  }
  process.exitCode = 0; // the always-exit-0 invariant (deny rides the JSON, not the exit code)
  return r;
}

/**
 * Task 196 (Codex) — `cmk codex-hook` — the Codex hook entrypoint.
 *
 * Codex wires ONE command for every hook event; the payload arrives as JSON on
 * stdin with `hook_event_name` (the router key) + `cwd` (a common stdin field
 * on every Codex event) + `transcript_path` (the session's rollout jsonl — the
 * Stop-capture source). Responses are Codex's hookSpecificOutput envelopes
 * (learn.chatgpt.com/docs/hooks, primary-verified 2026-07-12). ALWAYS exits 0 —
 * deny rides the JSON `permissionDecision`, never an exit code.
 */
export async function runCodexHook(_options = {}, _command, deps = {}) {
  const log = deps.log ?? ((s) => process.stdout.write(s));
  const logError = deps.logError ?? ((s) => process.stderr.write(`${s}\n`));

  // The Codex payload — JSON on a piped-and-closed stdin. TTY-guarded so a
  // manual `cmk codex-hook` doesn't hang; malformed JSON degrades to {} (→
  // unknown event → no-op), never a crash. Same BOM-tolerant reader as the
  // other agents (the D-306 input-boundary class).
  let payload = deps.payload;
  if (payload === undefined) {
    const readStdin = deps.readStdin ?? (() => readHookStdin({ isTTY: process.stdin.isTTY }));
    payload = parseHookStdin(readStdin());
  }
  const event = typeof payload.hook_event_name === 'string' ? payload.hook_event_name : '';
  // Codex sends `cwd` as a common stdin field on every event (native platform
  // paths — no D-305 slash-drive normalization needed).
  const cwd =
    (typeof payload.cwd === 'string' && payload.cwd) || deps.cwd || process.cwd();
  const env = deps.env ?? process.env;

  const r = dispatchCodexHook({
    event,
    payload,
    cwd,
    env,
    deps: {
      inject: deps.inject ?? ((args) => {
        const res = injectContext({ cwd: args.cwd, ...(args.userDir ? { userDir: args.userDir } : {}) });
        return { ok: true, text: typeof res === 'string' ? res : res?.snapshot ?? '' };
      }),
      // Resolved auto-extract path so captureTurn spawns the detached extraction
      // child (the D-200 class). The resolver is agent-neutral despite its name.
      capture: deps.capture ?? ((args) => (deps.captureTurn ?? captureTurn)({
        payload: args.payload,
        projectRoot: args.projectRoot,
        autoExtractPath: resolveKiroAutoExtractPath(env),
      })),
      capturePrompt: deps.capturePrompt ?? ((args) => capturePrompt({
        payload: args.payload,
        projectRoot: args.projectRoot,
      })),
      observe: deps.observe ?? ((args) => observeEdit({
        payload: args.payload,
        projectRoot: args.projectRoot,
      })),
      // PreToolUse → the memory delete-guardrail (D-192). Codex's payload is
      // Claude-shaped: the shell command lives at tool_input.command.
      guard: deps.guard ?? ((args) => decideGuard(
        typeof args.payload?.tool_input?.command === 'string' ? args.payload.tool_input.command : '',
      )),
    },
  });

  if (r.stdout) log(r.stdout);
  if (r.stderr) logError(r.stderr);
  process.exitCode = 0; // the always-exit-0 invariant (deny rides the JSON, not the exit code)
  return r;
}

/**
 * `cmk uninstall [--ide <agent>]` — remove ONE agent's kit-managed surface,
 * scoped by `--ide` exactly like `cmk install` (D-189). Default (no flag)
 * removes the Claude Code surface (the CLAUDE.md managed block); `--ide kiro`
 * removes the Kiro surface (the .kiro/ managed blocks + skills + IDE hooks + the
 * guarded ~/.aws CLI agent + the AGENTS.md block). BOTH are conservative: they
 * NEVER touch context/, context.local/, the user tier, or .gitignore — the
 * shared brain is sacred. Everything outside the kit's markers is byte-preserved.
 */
export function runUninstall(options /*, command */) {
  const projectRoot = resolvePath((options && options.cwd) || process.cwd());
  const ide = (options && options.ide) || 'claude-code';
  // Injectable log sinks (mirror runInstall) so tests can capture output.
  const log = options?.log ?? console.log;
  const logError = options?.logError ?? console.error;

  if (ide === 'kiro') {
    const r = uninstallKiro({ projectRoot, awsDir: options?.awsDir });
    log(
      `cmk uninstall (kiro): ${r.changed ? 'removed the Kiro managed surface' : 'nothing to remove'} — context/ preserved.`,
    );
    return;
  }
  if (ide !== 'claude-code') {
    // Task 196 — any other registered profile takes the generic per-profile
    // route (mirror of the install routing): remove only that agent's keys +
    // managed block; context/ stays sacred.
    const profile = getAgentProfile(ide);
    if (!profile) {
      const known = listAgentProfiles().map((p) => p.name).join(', ');
      logError(`cmk uninstall: unknown --ide '${ide}'. Supported: ${known}.`);
      process.exitCode = 2;
      return;
    }
    const r = uninstallAgent({ projectRoot, profile });
    log(
      `cmk uninstall (${profile.name}): ${r.changed ? `removed the ${profile.displayName} managed surface` : 'nothing to remove'} — context/ preserved.`,
    );
    return;
  }

  const result = removeClaudeMdBlock({ projectRoot });
  log(`cmk uninstall: CLAUDE.md=${result.action} (${result.path})`);
  if (result.action === 'not-found') {
    log('  (no kit-managed block found; CLAUDE.md left unchanged)');
  } else if (result.action === 'no-file') {
    log('  (no CLAUDE.md to uninstall from)');
  }
}

/**
 * `cmk init-user-tier` — wired in Task 14. User-tier-only install.
 * Scaffolds USER.md, HABITS.md, LESSONS.md, fragments/ at the
 * resolved user-tier path. Does NOT touch project/local tier files
 * or .gitignore or CLAUDE.md (call `cmk install` for that).
 */
function runInitUserTier(/* options, command */) {
  const result = initUserTierAction({});
  console.log(
    `cmk init-user-tier: scaffolded ${result.created.length} file(s)` +
      (result.skipped.length ? `, skipped ${result.skipped.length} existing` : '') +
      ` at ${result.userTier}`,
  );
  if (result.errors.length > 0) {
    for (const e of result.errors) console.error(`  error: ${e.path}: ${e.error}`);
    process.exitCode = 1;
  }
}

/**
 * `cmk trust <id> <level>` — wired in Task 15. Updates the `trust:`
 * field in BOTH the matched fact file (YAML frontmatter) AND any
 * scratchpad bullet with the matching id (HTML-comment provenance).
 * Writes a canonical audit-log entry per design §6.1 + spec 15.3.
 */
function runTrust(id, level /* , options, command */) {
  const projectRoot = resolvePath(process.cwd());
  // Task 218 (D-329 parity): thread the resolved userDir — same as runForget /
  // runLessonsPromote — so a U-tier `cmk trust` reaches the right tier
  // EXPLICITLY, instead of relying on the library-level defaultUserDir()
  // homedir()-reach the tier-paths comment warns against. Matches mk_trust,
  // which already passes userDir.
  const result = overrideTrustAction({ id, level, projectRoot, userDir: resolveUserDir() });
  if (result.action === 'trust-updated') {
    console.log(
      `cmk trust: ${result.id} (${result.tier}) → ${result.level} — updated ${result.updatedLocations.length} location(s)`,
    );
    for (const loc of result.updatedLocations) {
      console.log(`  ${loc.type}: ${loc.path} (was ${loc.priorTrust})`);
    }
    return;
  }
  if (result.action === 'not-found') {
    console.error(`cmk trust: ${result.errors[0]}`);
    process.exitCode = 2;
    return;
  }
  if (result.action === 'error') {
    for (const e of result.errors) console.error(`cmk trust: ${e}`);
    process.exitCode = 2;
  }
}

/**
 * `cmk lessons promote <id> [--to <file>] [--section <title>]` — Task 76.
 *
 * The explicit half of the wedge: carry a project observation across ALL your
 * projects. Routes through the safe promote path (home-path sanitization,
 * Poison_Guard, dedup, audit trail) — never hand-edits the user-tier files.
 */
function runLessonsPromote(id, options = {}) {
  const projectRoot = resolvePath(process.cwd());
  const userDir =
    process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
  const result = lessonsPromote({
    id,
    projectRoot,
    userDir,
    to: options.to,
    section: options.section,
  });
  if (result.action === 'promoted') {
    console.log(`cmk lessons promote: ${result.id} → ${result.target} § ${result.section}`);
    return;
  }
  if (result.action === 'queued') {
    // Exit 3 (not 2): the fact is durably SAVED to the review queue — it didn't
    // fail, it just needs a `cmk queue review` to land in the persona. Distinct
    // from the genuine-error exits (2) so scripts can tell them apart.
    console.error(
      `cmk lessons promote: saved to the user-tier review queue (${result.reason}) — run \`cmk queue review\` to land it`,
    );
    process.exitCode = 3;
    return;
  }
  if (result.action === 'not-found') {
    console.error(`cmk lessons promote: ${result.errors[0]}`);
    process.exitCode = 2;
    return;
  }
  if (result.action === 'error') {
    for (const e of result.errors) console.error(`cmk lessons promote: ${e}`);
    process.exitCode = 2;
  }
}

/**
 * `cmk search` — Task 30. Hybrid keyword + optional semantic.
 *
 * The keyword backend (FTS5 BM25 over the observations index) always
 * ships. Semantic + hybrid modes require the Layer-5b semantic backend,
 * (Task 65: prepared automatically when the optional embedder is installed;
 * absent embedder errors with exit code 2 + an install hint, per the 30.2
 * contract). The `semanticBackend` DI seam
 * is the drop-in point for the future backend.
 *
 * Filter flags (per tasks.md 30.4):
 *   --mode <keyword|semantic|hybrid>   (default keyword)
 *   --min-trust <low|medium|high>
 *   --tier <U|P|L>
 *   --since <ISO date>
 *   --limit <N>                        (default 20)
 *   --include-tombstoned               (default false)
 */
async function runSearch(queryParts, options) {
  // --project <dir> overrides cwd (the kiro-cli fix, Kiro #4579 — no `cd` prefix).
  const projectRoot = options?.project
    ? resolvePath(normalizeProjectPath(options.project))
    : resolvePath(process.cwd());
  const userDir =
    process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
  const query = Array.isArray(queryParts) ? queryParts.join(' ') : queryParts;
  const db = openIndexDb({ projectRoot });
  try {
    // Refresh the index before querying. On a fresh install the FTS5 index
    // is empty (auto-extract writes facts to MEMORY.md but doesn't reindex,
    // and the runtime chokidar watcher isn't running for a one-shot CLI
    // call), so without this `cmk search` returns "no results" for facts
    // that are sitting right there in the scratchpads (self-test finding
    // #0). reindexBoot is incremental — mtime/sha1 diff, only changed files
    // — so it's cheap to run on every search. Degrade gracefully: a reindex
    // failure falls back to whatever's already indexed rather than crashing
    // the query.
    try {
      reindexBoot({ projectRoot, userDir, db });
    } catch (err) {
      console.error(
        `cmk search: index refresh failed (${err?.message ?? err}); ` +
          'searching the existing index. Run `cmk reindex --full` if results look stale.',
      );
    }
    // Task 65: semantic/hybrid prepare the REAL embedded backend (async —
    // search() itself stays sync; the seam gets a sync closure over the
    // pre-embedded query vector). Task 46: an explicit --mode wins;
    // otherwise the project's configured default (context/settings.json
    // search.default_mode, set by `cmk install --with-semantic`), falling
    // back to keyword. Explicit-but-unavailable → exit 2 + hint (the 30.2
    // contract); configured-but-unavailable → graceful keyword fallback
    // (the default must never break every search).
    const explicitMode = options?.mode;
    let mode = explicitMode ?? resolveDefaultSearchMode({ projectRoot });
    // Task 104.2 — the L3 raw tier: `--scope transcripts` searches the
    // separate transcript-chunk index (synthetic T: ids; no tier/trust).
    // Task 156 — `--scope decisions` scans context/DECISIONS.md (the decision
    // journal) for decision-history / "what did we reject" recall.
    const scope = options?.scope ?? 'facts';
    // Task 156 / v0.3.3 cut-gate-16: the `decisions` scope is keyword-only BY
    // DESIGN — it scans the flat `context/DECISIONS.md` journal, which is NOT
    // embedded (no vec table). So it can never go through the semantic backend.
    // Coerce to keyword BEFORE the semantic block, silently — a user who has the
    // hybrid default (from `--with-semantic`) must not see a scary
    // "unknown-scope:decisions" warning (configured default) or hard exit-2
    // (explicit --mode) for using a real, shipped scope. The recall just works.
    if (scope === 'decisions') {
      mode = SEARCH_MODES.KEYWORD;
    }
    let semanticBackend;
    if (mode === SEARCH_MODES.SEMANTIC || mode === SEARCH_MODES.HYBRID) {
      const { prepareSemanticBackend } = await import('./semantic-backend.mjs');
      const prep = await prepareSemanticBackend({ db, query, scope });
      if (!prep.ok && explicitMode) {
        console.error(
          `cmk search: semantic backend unavailable (${prep.reason}).` +
            (prep.hint ? `\n  ${prep.hint}` : ' Use --mode=keyword.'),
        );
        process.exitCode = 2;
        return;
      }
      if (!prep.ok) {
        console.error(
          `cmk search: semantic default unavailable (${prep.reason}) — falling back to keyword.`,
        );
        mode = SEARCH_MODES.KEYWORD;
      } else {
        semanticBackend = prep.backend;
      }
    }
    const r = searchAction({
      db,
      query,
      mode,
      scope,
      projectRoot, // Task 156: the decisions scope reads context/DECISIONS.md
      minTrust: options?.minTrust,
      tier: options?.tier,
      since: options?.since,
      limit: options?.limit !== undefined ? Number(options.limit) : undefined,
      includeTombstoned: options?.includeTombstoned === true,
      // Task 66.3: the expired-recovery opt-in, symmetric with tombstones
      // (mem0 show_expired parity — expired facts hide, never delete).
      includeExpired: options?.includeExpired === true,
      // Task 211: the state-view OVERRIDE only — classification is automatic.
      stateView: options?.stateView,
      // Task 233: the recall-origin tag for skill-fire telemetry. The
      // memory-search skill's first ladder step runs `cmk search --source
      // skill`, so the recall-log records which searches the skill drove —
      // making the ADR-0024 fire-rate measurable (before/after). Coerced
      // against the bounded RECALL_ORIGINS set (mirrors the mk_search zod enum)
      // so an unknown/typo value can't bloat log cardinality.
      recallOrigin: RECALL_ORIGINS.includes(options?.source) ? options.source : undefined,
      semanticBackend,
    });
    if (r.action === 'error') {
      for (const e of r.errors) console.error(`cmk search: ${e}`);
      // Exit 2 per tasks.md 30.2 contract for semantic-unavailable; schema
      // errors are exit 2 by general kit convention too.
      process.exitCode = 2;
      return;
    }
    if (r.results.length === 0) {
      console.log('cmk search: no results');
      return;
    }
    for (const hit of r.results) {
      // Plain-text output suitable for terminal piping. Snippet uses
      // FTS5's <b>...</b> markers; preserved as-is so callers can pipe
      // to a TUI that renders them OR strip via sed. Hits with no tier/trust
      // (raw transcript chunks; decision-journal entries) show the scope's
      // label instead — 'transcript' for the L3 raw tier, 'decision' for the
      // journal (Task 156), plus a `(retracted)` marker so the "what did we
      // reject" trail is visible at a glance.
      let provenance;
      if (hit.tier) provenance = `${hit.tier}/${hit.trust}`;
      else if (r.scope === 'decisions') provenance = hit.retracted ? 'decision (retracted)' : 'decision';
      else provenance = 'transcript';
      // Task 209: a non-current fact carries its state label ahead of the
      // snippet (deterministic projection; current rows print unchanged).
      // Task 232 (ADR-0023): a superseded row NAMES its successor
      // (`[superseded by P-XXXX]`) via stateLabelText.
      const stateTag = hit.state ? `${stateLabelText(hit.state, hit)} ` : '';
      // Task 227: the citation DATE column — "here's WHEN" — between the
      // provenance and the source location; undated rows print a dash.
      console.log(
        `${hit.id}\t${provenance}\t${hit.date ?? '—'}\t${hit.source_file}:${hit.source_line}\t${stateTag}${hit.snippet}`,
      );
    }
    console.log(
      `\ncmk search: ${r.results.length} result(s) (mode=${r.mode}${r.scope && r.scope !== 'facts' ? `, scope=${r.scope}` : ''})`,
    );
    // Task 209: the A-TMA envelope instruction — one line, only when a labeled
    // row is present (zero noise on all-current results).
    if (r.results.some((x) => x.state)) {
      console.log(STATE_INSTRUCTION);
    }
    // Task 211: say WHY old rows appeared when the state-view gate biased
    // retrieval (historical/transition only — neutral/current print nothing).
    if (r.state_view) {
      console.log(
        `state view: ${r.state_view} — expired/superseded history included${r.state_view === 'historical' ? ' and listed first' : ''}`,
      );
    }
  } finally {
    db.close();
  }
}

// --- Read verbs (Task 108b — CLI parity with the MCP read tools) ------
//
// `cmk get` / `timeline` / `cite` / `recent-activity` mirror the MCP tools
// mk_get / mk_timeline / mk_cite / mk_recent_activity by calling the SAME
// shared read cores (read-core.mjs) — identical results from CLI + MCP
// (ADR-0014). cite is pure (no DB); the rest open the index + reindex first
// (same fresh-install freshness guard as `cmk search`).

// `deps` (projectRoot / log / logError) are injection seams: production passes
// nothing (defaults to cwd + console), in-process tests pass a temp projectRoot
// + captured loggers so the glue is covered WITHOUT a subprocess (the D-86
// lesson — real-binary tests don't contribute line coverage). Exported for the
// unit tests.

/** Open the index DB, refresh it (best-effort), run `fn(db)`, always close. */
export function withReadDb(fn, deps = {}) {
  const projectRoot = deps.projectRoot ?? resolvePath(process.cwd());
  const userDir =
    deps.userDir ?? process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
  const logError = deps.logError ?? console.error;
  const db = openIndexDb({ projectRoot });
  try {
    try {
      reindexBoot({ projectRoot, userDir, db });
    } catch (err) {
      logError(`cmk: index refresh failed (${err?.message ?? err}); using the existing index.`);
    }
    return fn(db);
  } finally {
    db.close();
  }
}

export function runGet(ids, options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const list = Array.isArray(ids) ? ids : [ids];
  // Task 155 (D-163): `--include-tombstoned` is the HUMAN-only recovery opt-in.
  // It's a CLI flag ONLY — the MCP mk_get tool never exposes it, so automatic
  // recall stays tombstone-blind. projectRoot is resolved the same way
  // withReadDb does, so the tombstone-file fallback can find the archive.
  const includeTombstoned = options.includeTombstoned === true;
  const projectRoot = deps.projectRoot ?? resolvePath(process.cwd());
  const rows = withReadDb(
    (db) => getObservations(db, list, { includeTombstoned, projectRoot }),
    deps,
  );
  log(JSON.stringify(rows, null, 2));
  // All-missing/invalid → exit 2 (lets a script tell "nothing matched" from a hit).
  if (rows.length > 0 && rows.every((r) => r.error)) process.exitCode = 2;
}

export function runCite(id, _options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;
  const r = citeLink(id);
  if (!r.ok) {
    logError(`cmk cite: ${r.error}`);
    process.exitCode = 2;
    return;
  }
  log(r.link);
}

export function runTimeline(anchor, options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;
  const r = withReadDb(
    (db) =>
      buildTimeline(db, {
        anchor,
        depthBefore: options.before !== undefined ? Number(options.before) : 5,
        depthAfter: options.after !== undefined ? Number(options.after) : 5,
      }),
    deps,
  );
  if (!r.ok) {
    logError(`cmk timeline: ${r.error}`);
    process.exitCode = 2;
    return;
  }
  log(JSON.stringify(r.timeline, null, 2));
}

// Task 226 (D-326) — the EXPAND rung: a hit's source-file neighborhood
// (enclosing heading section, bounded). Shares read-core.expandObservation
// with mk_expand (ADR-0014 parity).
export function runExpand(id, _options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;
  const projectRoot = deps.projectRoot ?? resolvePath(process.cwd());
  const userDir =
    deps.userDir ?? process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
  const r = withReadDb((db) => expandObservation(db, id, { projectRoot, userDir }), deps);
  if (r.error) {
    logError(`cmk expand: ${r.error} (id: ${id})`);
    process.exitCode = 2;
    return;
  }
  const headingLabel = r.heading ? ` — ${r.heading}` : '';
  const boundLabel = r.truncated ? ' (bounded window)' : '';
  log(`${r.source_file}:${r.source_line}${headingLabel}${boundLabel}`);
  log('');
  log(r.content);
}

// Task 232 (ADR-0023 ACTIVATE slice / D-392) — the LINKS rung: the relational
// adjacency axis. Answers backlinks ("what points AT this fact") + supersession
// chains ("what replaced what, in order") — the two graph-only query shapes flat
// hybrid can't. Shares read-core.buildLinks with mk_links (ADR-0014 parity).
export function runLinks(id, options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;
  const direction = options.direction ?? 'both';
  if (!['in', 'out', 'both'].includes(direction)) {
    logError(`cmk links: --direction must be in|out|both (got '${direction}')`);
    process.exitCode = 2;
    return;
  }
  const depth = options.depth !== undefined ? Number(options.depth) : 1;
  const r = withReadDb((db) => buildLinks(db, id, { depth, direction }), deps);
  if (!r.ok) {
    logError(`cmk links: ${r.error} (id: ${id})`);
    process.exitCode = 2;
    return;
  }
  log(JSON.stringify(r, null, 2));
  // No links + not a known observation → exit 2 (script-friendly "nothing here").
  if (!r.found) process.exitCode = 2;
}

// Task 175 (D-215) — `cmk tour`: narrate the user's OWN memory. Tour
// EXPLAINS, doctor CHECKS. Read-only; honest (everything shown is read
// from the real tiers).
export function runTour(_options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const projectRoot = deps.projectRoot ?? resolvePath(process.cwd());
  const userDir =
    deps.userDir ?? process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
  const t = buildTour({ projectRoot, userDir });
  log('cmk tour — your memory, as it actually is on disk\n');
  for (const s of t.sections) {
    log(`## ${s.title}`);
    log(s.body);
    log('');
  }
}

export function runRecentActivity(options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;
  const r = withReadDb(
    (db) =>
      recentActivity(db, {
        window: options.window ?? '24h',
        limit: options.limit !== undefined ? Number(options.limit) : 20,
      }),
    deps,
  );
  if (!r.ok) {
    logError(`cmk recent-activity: ${r.error}`);
    process.exitCode = 2;
    return;
  }
  log(JSON.stringify(r.rows, null, 2));
}

/**
 * `cmk reindex` — three modes.
 *
 *   no flag    Markdown INDEX.md rebuild only (Task 8 behavior). Backward-
 *              compat for callers that haven't adopted the SQLite layer.
 *   --boot     Same as no-flag PLUS SQLite boot diff (Task 29). Reindexes
 *              only the source files whose sha1 differs from the `files`
 *              checkpoint table. Fast on a warm cache.
 *   --full    Same as no-flag PLUS SQLite full rebuild (Task 29). DROPs
 *              observations / observations_fts / files; walks every source
 *              and rebuilds. Recovery path for a corrupted index.
 *
 * Flag semantics per tasks.md 29.1 + 29.3. Markdown INDEX runs in every
 * mode because (a) it's cheap (milliseconds to milliseconds-low-thousands),
 * (b) keeping it always-current avoids users having to think about which
 * index to rebuild when.
 */
/**
 * `cmk remember <text...>` — explicit durable capture (write-path fix #0b).
 *
 * Writes a provenance-tracked bullet to MEMORY.md (the session-start-recalled
 * layer) through the SAME hardened path as auto-extract: Poison_Guard +
 * home-path abstraction (#1) + conflict detection + dedup. This is the entry
 * the scaffolded CLAUDE.md points the agent at INSTEAD of freehand-writing
 * fact files — which produced wrong-schema, unindexable, username-leaking
 * files in the self-test. Guaranteed-correct because it never touches raw
 * frontmatter.
 *
 * Tier: v0.1.0 writes tier P (project MEMORY.md). U/L need per-tier scratchpad
 * routing (same deferral as mk_remember, design §16) — the always-on home-path
 * abstraction is the privacy net regardless of tier.
 */
// Task 63 (F1): a slug derived from the title — lowercased, non-alphanumerics
// collapsed to '-', trimmed, capped. Always passes writeFact's SLUG_PATTERN.
/**
 * `cmk remember --why … --how … --type … --title …` (Task 63 / F1) — RICH
 * capture. Writes a real granular fact file (frontmatter + Why/How/links) via
 * writeFact(), which ALREADY runs home-path sanitization + Poison_Guard + the
 * correct schema. Restores v0.1.1 richness through v0.1.2's safe path. `deps`
 * carries injection seams for testing.
 */
export function runRememberRich(text, options = {}, deps = {}) {
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;

  // Non-P --tier: capture at the project tier (P) + surface the note (don't
  // silently honor it, don't hard-error). ONE shared note across CLI + MCP so
  // the message can't drift (D-102 / Task 121).
  if (options.tier && options.tier !== 'P') {
    log(`cmk remember: ${nonProjectTierNote(options.tier)}`);
  }

  // The write is the shared core (remember-core.rememberRich) — the SAME one the
  // MCP `mk_remember` rich path calls, so both surfaces emit identical fact files
  // (ADR-0014). This wrapper only formats the CLI's messages from the result.
  const r = rememberRich(text, options, deps);

  if (r.action === 'error') {
    // Every rich-path error exits 2 (Task 231 — the bare path always did;
    // the rich path silently exited 0, so a poison rejection or an invalid
    // --shape (D-338) was undetectable by scripts / the PR5 cut-gate probe).
    process.exitCode = 2;
    if (r.errorCategory === 'collision') {
      // M1: a same-title / different-content collision — actionable hint over
      // the raw "refusing overwrite".
      logError(
        `cmk remember: a fact titled "${richFactTitle(text, options)}" already exists with different content. ` +
          `Edit it directly, or capture under a new --title.`,
      );
      return r;
    }
    logError(`cmk remember: ${(r.errors ?? [r.errorCategory ?? 'error']).join('; ')}`);
    return r;
  }
  if (r.action === 'skipped') {
    log(`cmk remember: already captured (${r.skipReason})${r.id ? ` [${r.id}]` : ''}`);
    return r;
  }
  log(`cmk remember: saved rich fact → ${r.path}${r.id ? ` [${r.id}]` : ''}`);
  return r;
}

/**
 * Task 108.2 (108a) — parse a structured fact from the off-shell input channel
 * (`--from-file <path>` or `--json` stdin). PURE + dependency-injected (the CLI
 * passes real fs readers; tests pass fakes) so every parse/validate/allowlist
 * branch is covered IN-PROCESS — the real-binary subprocess tests prove the CLI
 * wiring but don't contribute line coverage.
 *
 * @param {object} options - subcommand options (fromFile/json + the rich flags).
 * @param {object} deps
 * @param {(path:string)=>string} deps.readFile - read a file to a string (throws on error).
 * @param {()=>string} deps.readStdin - read stdin to a string ('' for TTY/empty).
 * @returns {{ok:true,channel:string,fields:object,ignored:string[]}
 *          | {ok:false,channel:string,error:string,ignored:string[]}}
 */
export function parseFactInput(options, { readFile, readStdin } = {}) {
  const channel = options.fromFile ? '--from-file' : '--json';
  // --from-file/--json are self-contained (the JSON is the whole fact); rich /
  // terse flags passed alongside are ignored — surfaced so they aren't dropped silently.
  const ignored = ['why', 'how', 'type', 'title', 'links', 'tier', 'trust', 'section', 'shape', 'expires']
    .filter((k) => options[k] != null)
    .map((k) => '--' + k);
  const fail = (error) => ({ ok: false, channel, error, ignored });

  let raw;
  if (options.fromFile) {
    try {
      raw = readFile(options.fromFile);
    } catch (e) {
      return fail(`${channel} could not read ${options.fromFile}: ${e.message}`);
    }
  } else {
    // '' = interactive TTY or empty pipe (read-hook-stdin returns '' for a TTY).
    raw = readStdin();
    if (!raw || !raw.trim()) {
      return fail('--json expects a JSON object on stdin (pipe it in, or use --from-file).');
    }
  }

  // Bound the input so a pathological file can't burn Poison_Guard regex time
  // (the M1 concern that capped mk_remember). 64 KB is generous for one fact.
  const MAX_INPUT_BYTES = 64 * 1024;
  if (Buffer.byteLength(raw, 'utf8') > MAX_INPUT_BYTES) {
    return fail(`${channel} fact is too large (max ${MAX_INPUT_BYTES / 1024} KB). Split it into smaller facts.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return fail(`${channel} could not parse JSON: ${e.message}`);
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    typeof parsed.text !== 'string' ||
    !parsed.text.trim()
  ) {
    return fail(`${channel} JSON must be an object with a non-empty "text" field.`);
  }

  // Allowlist the honored fields — NEVER forward the raw parsed object. A crafted
  // JSON must not reach a field runRememberRich might read; provenance
  // (write_source / source_file) stays hardcoded user-explicit in runRememberRich.
  return {
    ok: true,
    channel,
    ignored,
    fields: {
      text: parsed.text,
      why: parsed.why,
      how: parsed.how,
      type: parsed.type,
      title: parsed.title,
      links: parsed.links,
      tier: parsed.tier,
      trust: parsed.trust,
      // 66.1/66.3: temporal fields, same pass-through as the flag path
      // (writeFact validates strictly).
      shape: parsed.shape,
      expires: parsed.expires,
    },
  };
}

// Task 143: async since the near-dup guard may embed the incoming text
// (one model call, explicit path only). Commander awaits actions; the
// terse-path tests were updated to await (contract change, intent preserved).
export async function runRemember(textParts, options, deps = {}) {
  // --project <dir> overrides cwd (the kiro-cli fix, Kiro #4579): kiro-cli's
  // command allowlist rejects a `cd … && cmk remember …` prefix, so the kiro-cli
  // agent runs `cmk remember "<fact>" --project "<abs>"` with NO cd. normalize a
  // git-bash `/c/Temp` path the model may emit → `C:/Temp`.
  const projectRoot = options?.project
    ? resolvePath(normalizeProjectPath(options.project))
    : (deps.projectRoot ?? resolvePath(process.cwd()));
  const userDir =
    deps.userDir ?? process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;

  // Task 108.2 (108a) — structured off-shell input. `--from-file`/`--json` carry
  // the fact as a JSON object from a FILE or STDIN, so rich content (backticks,
  // $(), quotes, newlines) never rides the shell command line — the D-81 fix.
  // The parse/validate/allowlist lives in the pure parseFactInput() helper.
  if (options?.fromFile || options?.json) {
    const parsed = parseFactInput(options, {
      readFile: (p) => readFileSync(p, 'utf8'),
      readStdin: () => readHookStdin({ isTTY: process.stdin.isTTY }),
    });
    if (parsed.ignored.length) {
      logError(
        `cmk remember: ${parsed.channel} is self-contained — ignoring ${parsed.ignored.join(', ')} (put these in the JSON instead).`,
      );
    }
    if (!parsed.ok) {
      logError(`cmk remember: ${parsed.error}`);
      process.exitCode = 2;
      return;
    }
    runRememberRich(parsed.fields.text, parsed.fields, { projectRoot, log, logError });
    return;
  }

  const text = Array.isArray(textParts) ? textParts.join(' ') : textParts;
  // Bare `cmk remember` — no positional text and no input channel. The positional
  // arg is optional now (for --from-file/--json), so guard explicitly instead of
  // falling through to a vague empty-text write error.
  if (!text || !String(text).trim()) {
    logError(
      'cmk remember: provide a fact to remember, or use --from-file <json> / --json (stdin).',
    );
    process.exitCode = 2;
    return;
  }
  // Rich mode: any of --why/--how/--type/--title/--links → write a real fact
  // file (the F1 fix) instead of a terse MEMORY.md bullet. M3: --trust and
  // --section are intentionally NOT triggers — --trust is shared by both forms
  // (rich reads it too), and --section is terse-only (a MEMORY.md heading, no
  // meaning for a granular fact file). So `--trust high` alone stays terse.
  // 66.1/66.3: --shape/--expires are rich triggers too — both are fact-FILE
  // frontmatter fields; a terse MEMORY.md bullet has nowhere to carry them
  // (bullets age via consolidation, not declared expiry).
  if (options?.why || options?.how || options?.type || options?.title || options?.links || options?.shape || options?.expires) {
    runRememberRich(text, options, { projectRoot });
    return;
  }
  // Non-P --tier: capture at P + note (consistent with the rich path + the MCP
  // tool — D-102). A fact becomes cross-project via `cmk lessons promote`, not a
  // direct tier write (direct U/L routing is the deferred feature in design §16.40). We do NOT
  // hard-error — losing the capture to an error is worse than landing it at P.
  const requestedTier = options?.tier ?? 'P';
  if (requestedTier !== 'P') {
    log(`cmk remember: ${nonProjectTierNote(requestedTier)}`);
  }
  const tier = 'P';
  const trust = options?.trust ?? 'high';
  const section = options?.section ?? 'Active Threads';
  // Task 143 (D-130): semantic near-dup guard — extra opts only when this
  // project is semantic-configured and the embedder is available; {} keeps
  // the literal pipeline (graceful degradation, never blocks capture).
  const nearDup = await prepareNearDupGuard({ projectRoot, text, ...(deps.nearDupGuard ? { prepareImpl: deps.nearDupGuard.prepareImpl, resolveModeImpl: deps.nearDupGuard.resolveModeImpl } : {}) });
  const r = memoryWrite({
    action: 'add',
    text,
    tier,
    scratchpad: 'MEMORY.md',
    section,
    trust,
    source: 'user-explicit',
    projectRoot,
    userDir,
    ...nearDup,
  });
  if (r.action === 'error') {
    for (const e of r.errors ?? [`error (${r.errorCategory})`]) {
      logError(`cmk remember: ${e}`);
    }
    process.exitCode = 2;
    return;
  }
  if (r.action === 'queued') {
    log(
      `cmk remember: queued for review — a similar or higher-trust fact already covers this. ` +
        `Resolve with \`cmk queue conflicts\` (${r.path}).`,
    );
    return;
  }
  log(
    `cmk remember: saved to P/MEMORY.md (${section})${r.id ? ` [${r.id}]` : ''}`,
  );
}

function runReindex(options /* , command */) {
  const projectRoot = resolvePath(process.cwd());
  const userDir = join(homedir(), '.core-memory-kit');
  const result = reindexAction({ tier: 'P', projectRoot });
  console.log(
    `cmk reindex: tier=${result.tier} facts=${result.factCount} bytes=${result.bytes} (${result.indexPath})`,
  );
  const useBoot = options?.boot === true;
  const useFull = options?.full === true;
  if (!useBoot && !useFull) return;
  if (useBoot && useFull) {
    console.error('cmk reindex: --boot and --full are mutually exclusive');
    process.exitCode = 2;
    return;
  }
  const db = openIndexDb({ projectRoot });
  try {
    const r = useFull
      ? reindexFull({ projectRoot, userDir, db })
      : reindexBoot({ projectRoot, userDir, db });
    if (useFull) {
      console.log(
        `cmk reindex --full: scanned=${r.filesScanned} observations=${r.observationsAffected} duration=${r.durationMs}ms`,
      );
    } else {
      console.log(
        `cmk reindex --boot: scanned=${r.filesScanned} reindexed=${r.filesReindexed} observations=${r.observationsAffected} duration=${r.durationMs}ms`,
      );
    }
    if (r.skipped && r.skipped.length > 0) {
      for (const s of r.skipped) {
        console.error(`  skipped ${s.path}: ${s.reason}`);
      }
    }
  } finally {
    db.close();
  }
}

/**
 * `cmk digest` (Task 147) — print a regenerated, readable render of everything
 * the kit currently knows, AND sync the append-only context/DECISIONS.md
 * journal (the permanent decision ledger; D-161). The digest goes to stdout;
 * the journal is a committed file the sync maintains in place.
 */
async function runDigestCli(options) {
  const projectRoot = resolvePath(process.cwd());
  const { digest } = await import('./digest.mjs');
  const { syncDecisionsJournal } = await import('./decisions-journal.mjs');

  // Keep the permanent decision journal current (append-only; best-effort —
  // a journal hiccup must not break the digest render).
  const sync = syncDecisionsJournal({ projectRoot });

  console.log(digest({ projectRoot }));

  if (sync.written) {
    console.log(`\ncontext/DECISIONS.md updated (+${sync.appended} bytes) — the append-only decision journal.`);
  } else if (sync.error) {
    console.error(`\n(decision journal not updated: ${sync.error})`);
  } else {
    console.log('\ncontext/DECISIONS.md is up to date.');
  }
}

/**
 * `cmk forget <id-or-query>` — wired in Task 9. Tombstones the matching
 * fact (moves it to <tier>/<memory|fragments>/archive/tombstones/<id>.md
 * with deleted_at/deleted_reason/deleted_by frontmatter) and strips any
 * citing bullets from same-tier scratchpads.
 *
 * v0.1 requires --yes — the interactive confirmation prompt is a v0.1.x
 * follow-up (the boundary's `confirm()` callback path is still tested by
 * cli-forget.test.js; the CLI just doesn't wire stdin readline yet).
 */
// Task 96 (ADR-0022) — the compliance scrub. CLI-ONLY by contract: neither
// redact nor purge ships as an MCP tool (§6.5 — the destructive/compliance
// path stays explicit-human; pinned by cli-redact.test.js).
export function runRedact(id, options /* , command */) {
  const projectRoot = options?.project
    ? resolvePath(normalizeProjectPath(options.project))
    : resolvePath(process.cwd());
  if (!options?.pattern) {
    console.error('cmk redact: --pattern <text> is required (the literal secret/PII to scrub).');
    process.exitCode = 2;
    return;
  }
  const result = redactFact({
    id,
    pattern: options.pattern,
    reason: options.reason,
    projectRoot,
    userDir: resolveUserDir(),
  });
  if (result.action !== 'redacted') {
    for (const e of result.errors ?? [`error (${result.errorCategory})`]) {
      console.error(`cmk redact: ${e}`);
    }
    process.exitCode = 2;
    return;
  }
  console.log(
    `cmk redact: redacted ${result.occurrences} occurrence(s) in ${result.files.length} file(s) for ${result.id}.`,
  );
  if (result.renamed) {
    console.log(
      `  renamed the fact file (the title-derived FILENAME carried the secret): now ${result.renamed.to}`,
    );
  }
  if (result.renameSkipped) {
    console.log(
      '  WARNING: the fact FILENAME still carries the secret (a clean target name was not available) — rename the file by hand and run `cmk reindex`.',
    );
  }
  if (result.remainingElsewhere > 0) {
    console.log(
      `  NOTE: the same pattern appears ${result.remainingElsewhere} more time(s) in OTHER facts/scratchpads — redact is per-fact by design; run \`cmk search\` to find and redact them by id.`,
    );
  }
  printGitHistoryNote({ tier: id?.[0], advisory: gitAdvisory({ mode: 'redact' }) });
}

// The git-history follow-up only applies to the COMMITTED tier (P). The U tier
// lives outside the repo and the L tier (context.local/) is gitignored —
// telling those users "git history still contains the text" is false
// (skill-review M13a). Rotation advice holds everywhere.
function printGitHistoryNote({ tier, advisory }) {
  if (tier === 'P') {
    for (const line of advisory) console.log(`  ${line}`);
  } else {
    console.log(
      '  note (ADR-0022): this tier is not committed to git (user/local tier) — no git-history follow-up needed. Still ROTATE a leaked secret: any copy that left this machine is compromised.',
    );
  }
}

export function runPurge(id, options /* , command */) {
  const projectRoot = options?.project
    ? resolvePath(normalizeProjectPath(options.project))
    : resolvePath(process.cwd());
  if (!options?.hard) {
    console.error(
      'cmk purge: only --hard is implemented (the irreversible whole-fact delete). Use `cmk forget` for normal, tombstoned deletion.',
    );
    process.exitCode = 2;
    return;
  }
  if (!options?.yes) {
    console.error(
      'cmk purge --hard: IRREVERSIBLE — no tombstone, no recovery. Re-run with --yes to confirm.',
    );
    process.exitCode = 2;
    return;
  }
  const result = purgeHard({ id, yes: true, projectRoot, userDir: resolveUserDir() });
  if (result.action !== 'purged') {
    for (const e of result.errors ?? [`error (${result.errorCategory})`]) {
      console.error(`cmk purge: ${e}`);
    }
    process.exitCode = 2;
    return;
  }
  console.log(
    `cmk purge: permanently removed ${result.id} (${result.removed.length} file(s), ${result.scratchpadEdits.length} scratchpad edit(s)). No tombstone was kept.`,
  );
  // repo-relative, forward-slash paths for the filter-repo advisory
  const relRemoved = result.removed.map((p) =>
    p.startsWith(projectRoot) ? p.slice(projectRoot.length + 1).replaceAll('\\', '/') : p,
  );
  printGitHistoryNote({ tier: id?.[0], advisory: gitAdvisory({ mode: 'purge', paths: relRemoved }) });
}

function runForget(idOrQuery, options /* , command */) {
  if (!options.yes) {
    console.error(
      'cmk forget: --yes is required in v0.1.0 (interactive confirmation prompt is a v0.1.x follow-up). Re-run with --yes to confirm tombstoning.',
    );
    process.exitCode = 2;
    return;
  }
  const projectRoot = resolvePath(process.cwd());
  const result = forgetAction({
    idOrQuery,
    projectRoot,
    // Pass the resolved userDir (same source as `cmk search`) so forget's
    // in-band reindex covers all three tiers and its orphan-prune fires
    // IMMEDIATELY (Task 110) — without it the prune is skipped here and only
    // self-heals on the next search. Also lets forget tombstone U-tier facts.
    userDir: resolveUserDir(),
    reason: options.reason,
    deletedBy: options.deletedBy,
    yes: true,
  });

  if (result.action === 'tombstoned') {
    console.log(
      `cmk forget: tombstoned ${result.id} (${result.tier}) → ${result.tombstonePath}`,
    );
    if (result.scratchpadEdits.length > 0) {
      const total = result.scratchpadEdits.reduce((n, e) => n + e.removed, 0);
      console.log(
        `  scrubbed ${total} bullet(s) across ${result.scratchpadEdits.length} scratchpad(s)`,
      );
    }
    return;
  }
  if (result.action === 'not-found') {
    console.error(`cmk forget: ${result.errors[0]}`);
    process.exitCode = 2;
    return;
  }
  if (result.action === 'error') {
    for (const e of result.errors) console.error(`cmk forget: ${e}`);
    process.exitCode = 2;
    return;
  }
  // cancelled (won't fire here since we pass yes:true above, but defensive)
  console.log('cmk forget: cancelled');
}

/**
 * Real `cmk queue` dispatcher — Task 25. Routes by sub-verb:
 *   - 'conflicts' → wire to resolveConflictQueue with a readline-based
 *     interactive prompter. merge-both decisions dispatch to mergeFacts.
 *   - 'review' → still stubbed (Task 26 / v0.1.x); print the standard
 *     notice.
 */
/**
 * `cmk mcp <child>` dispatcher (Task 31). Currently one child:
 *   - 'serve' → start the stdio MCP server. Invoked by Claude Code as
 *               a subprocess; runs until stdin closes.
 */
/**
 * `cmk daily-distill` (Task 33) — runs the daily-distill pipeline once.
 * Designed to be invoked by the host scheduler (cron / launchd /
 * schtasks) registered via `cmk register-crons`. Humans normally don't
 * call this directly; they run register-crons once at install time.
 *
 * Always exits 0 — same posture as cmk-compress-session per design §8.6.1.
 */
async function runDailyDistill(/* options */) {
  const projectRoot = resolvePath(process.cwd());
  // Task 200: agent-relative backend factory (lazy-loaded — avoids the dep in
  // unit tests; picks the installed-for agent's CLI).
  const { makeBackend } = await import('./make-backend.mjs');
  try {
    const backend = makeBackend({ projectRoot });
    const r = await dailyDistill({ projectRoot, backend });
    if (r.action === 'error') {
      console.error(
        `cmk daily-distill: error (${r.error_category ?? 'unknown'})${r.errorMessage ? `: ${r.errorMessage}` : ''}`,
      );
    } else {
      console.log(
        `cmk daily-distill: ${r.action}${r.reason ? ` (${r.reason})` : ''}${r.bytesIn ? ` (in: ${r.bytesIn}b, out: ${r.bytesOut}b, days: ${r.sourceDays})` : ''}`,
      );
    }
  } catch (err) {
    console.error(`cmk daily-distill: unexpected error: ${err?.message ?? err}`);
  }
}

/**
 * `cmk weekly-curate` (Task 34) — runs the weekly-curate pipeline once.
 * Designed to be invoked by the host scheduler registered via
 * `cmk register-crons` (which registers both daily + weekly entries
 * by default). Humans normally don't invoke this directly.
 */
async function runWeeklyCurate(/* options */) {
  const projectRoot = resolvePath(process.cwd());
  const { makeBackend } = await import('./make-backend.mjs'); // Task 200: agent-relative
  const { defaultUserDir } = await import('./tier-paths.mjs');
  try {
    const backend = makeBackend({ projectRoot, userDir: defaultUserDir() });
    // Production entry point → the Task-66 sweeps cover the U tier
    // (finding 3); autoPersona keeps its cron-only shape (no userDir).
    const r = await weeklyCurate({ projectRoot, backend, sweepUserDir: defaultUserDir() });
    if (r.action === 'error') {
      console.error(
        `cmk weekly-curate: error (${r.errorCategory ?? 'unknown'})${(r.errors && r.errors.length) ? `: ${r.errors.join('; ')}` : ''}`,
      );
    } else {
      console.log(
        `cmk weekly-curate: ${r.action}${r.reason ? ` (${r.reason})` : ''}${r.archivedDays ? ` (archived: ${r.archivedDays}d, current: ${r.currentDays}d, in: ${r.bytesIn}b, out: ${r.bytesOut}b)` : ''}`,
      );
    }
  } catch (err) {
    console.error(`cmk weekly-curate: unexpected error: ${err?.message ?? err}`);
  }
}

/**
 * `cmk persona generate` (Task 45 follow-up) — run cross-project persona
 * synthesis ON DEMAND. Classifies this project's captured facts, auto-promotes
 * the high-confidence cross-project doctrine into the user tier (trust:medium),
 * and saves the low/medium-confidence candidates to
 * <userDir>/queues/persona-review.md. Same pipeline weekly-curate runs
 * automatically — this is the manual trigger (a deterministic hook for the
 * fresh-session live test, and for users who want to fill the user tier now).
 */
// `opts` is the Commander options object in production (no relevant keys →
// every field falls back to its default). The injection seams (projectRoot,
// userDir, backend, log, logError) keep the wrapper unit-testable without a
// live `claude --print` spawn — see cli-auto-persona.test.js.
export async function runPersonaGenerate(opts = {}) {
  const projectRoot = opts.projectRoot ?? resolvePath(process.cwd());
  const userDir =
    opts.userDir ?? process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
  const log = opts.log ?? console.log;
  const logError = opts.logError ?? console.error;
  try {
    // Task 200: agent-relative backend (the injected opts.backend still wins for
    // tests; production picks the installed-for agent's CLI).
    const backend =
      opts.backend ?? (await import('./make-backend.mjs')).makeBackend({ projectRoot, userDir });
    // Task 111 (F-2): `cmk persona generate` is an explicit one-shot with NO outer
    // hook ceiling (unlike the 60s-bounded SessionEnd path), so it gives the Haiku
    // classifier generous headroom — the whole-project facts sweep is a heavier
    // call than a session summary, and the user is willing to wait for the command
    // they ran. The corpus is byte-capped (PERSONA_CORPUS_BYTES) so this can't run
    // unbounded. Overridable via opts.timeoutMs.
    const r = await autoPersona({ projectRoot, userDir, backend, timeoutMs: opts.timeoutMs ?? 120_000 });
    if (r.action === 'error') {
      const detail = (r.errors && r.errors.length) ? `: ${r.errors.join('; ')}` : '';
      const hint = /did not return within/.test(detail)
        ? ' — the Haiku classifier timed out; this is usually a transient API slowdown. Re-run `cmk persona generate` (the weekly curate pass also retries it automatically).'
        : '';
      logError(`cmk persona generate: error (${r.errorCategory ?? 'unknown'})${detail}${hint}`);
      return;
    }
    const promoted = r.promoted?.length ?? 0;
    const superseded = r.superseded?.length ?? 0;
    const queued = r.queued?.length ?? 0;
    const conflicts = r.conflicts?.length ?? 0;
    log(
      `cmk persona generate: ${r.action}${r.reason ? ` (${r.reason})` : ''} — promoted: ${promoted}, superseded: ${superseded}, queued: ${queued}, conflicts: ${conflicts}`,
    );
    if (queued > 0 && r.reviewQueuePath) {
      log(`  ${queued} lower-confidence candidate(s) saved for review → ${r.reviewQueuePath}`);
    }
  } catch (err) {
    logError(`cmk persona generate: unexpected error: ${err?.message ?? err}`);
  }
}

function resolveUserDir() {
  return process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
}

/**
 * `cmk persona export <file>` (Task 72) — bundle the user-tier persona into one
 * portable file to carry to another of YOUR machines.
 */
export function runPersonaExport(file, options = {}) {
  const outFile = file ?? options.out;
  if (!outFile) {
    console.error('cmk persona export: give an output file, e.g. `cmk persona export persona-bundle.json`');
    process.exitCode = 2;
    return;
  }
  const r = exportPersona({ userDir: resolveUserDir(), outFile });
  if (r.action === 'error') {
    console.error(`cmk persona export: ${r.errors?.join('; ') || r.errorCategory}`);
    process.exitCode = 2;
    return;
  }
  console.log(`cmk persona export: ${r.fileCount} files → ${r.path} (${r.bytes} B)`);
  console.log('  Carry it via your own private channel (USB / private git repo / Dropbox), then `cmk persona import` on the other machine.');
}

/**
 * `cmk persona import <file>` (Task 72) — apply a persona bundle to this
 * machine's user tier. Overwrites; any replaced file is backed up first.
 */
export function runPersonaImport(file, options = {}) {
  const inFile = file ?? options.from;
  if (!inFile) {
    console.error('cmk persona import: give a bundle file, e.g. `cmk persona import persona-bundle.json`');
    process.exitCode = 2;
    return;
  }
  const r = importPersona({ userDir: resolveUserDir(), inFile });
  if (r.action === 'error') {
    console.error(`cmk persona import: ${r.errors?.join('; ') || r.errorCategory}`);
    process.exitCode = 2;
    return;
  }
  const bkp = r.backedUp > 0 ? ` (backed up ${r.backedUp} existing file(s) → ${r.backupPath})` : '';
  console.log(`cmk persona import: ${r.fileCount} files → ${resolveUserDir()}${bkp}${r.reindexed ? ' · search reindexed' : ''}`);
}

/**
 * `cmk disable-native-memory` / `cmk enable-native-memory` (Task 60, ADR-0011)
 * — write `autoMemoryEnabled` into the project's committable
 * `.claude/settings.json`. Default install does NOT touch it (coexist); this
 * is the one-command opt-in/out. `opts` carries injection seams for testing.
 */
export function runSetNativeMemory(enabled, opts = {}) {
  const projectRoot = opts.projectRoot ?? resolvePath(process.cwd());
  const log = opts.log ?? console.log;
  const logError = opts.logError ?? console.error;
  const cmd = enabled ? 'enable-native-memory' : 'disable-native-memory';
  const r = setNativeAutoMemory({ projectRoot, enabled });
  if (r.action === 'error') {
    logError(`cmk ${cmd}: ${(r.errors && r.errors.join('; ')) || 'could not update settings.json'}`);
    return r;
  }
  const verb = enabled ? 'enabled' : 'disabled';
  if (r.action === 'unchanged') {
    log(`cmk ${cmd}: Anthropic native Auto Memory already ${verb} for this project (no change).`);
  } else if (enabled) {
    log('Anthropic native Auto Memory re-enabled for this project — native + kit memory will coexist again.');
    log(`  → ${r.settingsPath}  (reverse with \`cmk disable-native-memory\`)`);
  } else {
    log('Anthropic native Auto Memory disabled for this project — the kit is now the sole memory layer (one lean snapshot at session start).');
    log(`  → ${r.settingsPath}  (committable: travels with \`git clone\`; reverse with \`cmk enable-native-memory\`)`);
  }
  return r;
}

/**
 * `cmk register-crons [--dry-run] [--unregister]` (Task 33) — register
 * the daily-distill cron entry on the current platform.
 *
 * Per design §8.6.2 cross-platform mapping. `--dry-run` prints the
 * command without executing — recommended first run so the user
 * sees what host-config will change before granting permissions.
 */
export function runRegisterCrons(options /* , command */) {
  const dryRun = options?.dryRun === true;
  const unregister = options?.unregister === true;
  // Task 36 B1+B2 fix: emit the FULL cron command as
  //   "<absolute-node-path>" "<absolute-bin-script-path>" "<absolute-project-root>"
  // Rationale (from the layer-wide review):
  //   B1 — Cron / launchd / schtasks have non-kit default cwd ($HOME, /,
  //   C:\Windows\System32). The bin needs projectRoot resolved AT
  //   registration time, not via cwd at fire time.
  //   B2 — Bare bin names ('cmk-daily-distill') don't PATH-resolve under
  //   the scheduler's restricted PATH (/usr/bin:/bin for launchd; varies
  //   for cron). Emitting absolute paths sidesteps PATH entirely.
  // This also bypasses the npm-installed bin shim (.cmd on Windows;
  // symlink on POSIX) — `node <abs-script>` works directly on every
  // platform regardless of how the kit was installed (npm global,
  // npm link, vendored).
  const nodePath = process.execPath;
  const binDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'bin');
  const projectRoot = resolvePath(process.cwd());

  // Helper: quote a path for the platform's cron-line shell.
  // Linux + macOS: double-quote (the cron line is single-quoted around the
  // whole `echo '...'`; double-quotes inside are safe).
  // Windows: registerCron execs schtasks with an args array (no shell), so this
  // double-quoted /TR value is delivered verbatim — no escaping needed (Task 109
  // / D-83). macOS strips these wrapping quotes before building the plist.
  const quote = (s) => `"${s}"`;

  const jobs = [
    {
      label: 'daily-distill',
      command: `${quote(nodePath)} ${quote(join(binDir, 'cmk-daily-distill.mjs'))} ${quote(projectRoot)}`,
      entryName: CRON_ENTRY_NAME,
      schedule: undefined, // registerCron default = daily 23:00
    },
    {
      label: 'weekly-curate',
      command: `${quote(nodePath)} ${quote(join(binDir, 'cmk-weekly-curate.mjs'))} ${quote(projectRoot)}`,
      entryName: WEEKLY_ENTRY_NAME,
      schedule: DEFAULT_WEEKLY_SCHEDULE,
    },
  ];
  let anyError = false;
  let anySuccess = false;
  for (const job of jobs) {
    const r = unregister
      ? unregisterCron({ entryName: job.entryName, dryRun })
      : registerCron({
          command: job.command,
          entryName: job.entryName,
          schedule: job.schedule,
          projectRoot, // Task 215: enables the windowless VBS shim (win32)
          dryRun,
        });
    if (r.action === 'error') {
      anyError = true;
      console.error(
        `cmk register-crons (${job.label}): error — ${(r.errors ?? []).join('; ')}`,
      );
      if (r.error) console.error(`  ${r.error}`);
      if (r.output) console.error(r.output);
      continue;
    }
    anySuccess = true;
    console.log(`cmk register-crons (${job.label}): ${r.action} on ${r.platform}`);
    console.log(`  command: ${r.command}`);
    // Task 265 (D-424): registration on Windows is TWO steps — the schtasks
    // /Create above, then the settings call that decides whether the job ever
    // actually runs (battery + idle-end + catch-up + wake). Showing only the
    // first would make --dry-run a partial account of what the command does.
    if (r.settingsCommand) console.log(`  settings: ${r.settingsCommand}`);
    // A failed settings call leaves a REGISTERED but starving task. Registration
    // legitimately still succeeded (the lazy roll is the guarantee), so this is a
    // warning rather than an error — but it must not be silent, which is the
    // false-green class D-298 was.
    if (r.settingsApplied === false) {
      console.warn(
        `  warning: the task registered, but its scheduler settings could NOT be applied — ` +
        `Windows will refuse to start it on battery and may kill it when you return to the keyboard. ` +
        `Re-run \`cmk register-crons\` (it is idempotent); if it keeps failing, apply the "settings:" ` +
        `command above by hand in an ordinary PowerShell window.`,
      );
    }
    // Task 47.0 (D-439's handover): the console is not a durable surface. The
    // warning above scrolls away, and HC-5 passes on the `cron-registered`
    // sentinel alone — so without this the kit forgets, within one screenful,
    // that it left a registered-but-starving task behind.
    //
    // BOTH outcomes are recorded, not just the failure: an `ok` is what resets
    // the streak, so a user who re-registers successfully stops being warned
    // without anything having to clean up (D-412's structural self-clean). The
    // `undefined` case — a dry run, or any POSIX platform, where there was no
    // settings call to have an outcome — records nothing at all.
    if (typeof r.settingsApplied === 'boolean') {
      appendHealthEntry(projectRoot, {
        class: HEALTH_CODES.CRON_SETTINGS_UNAPPLIED,
        outcome: r.settingsApplied ? 'ok' : 'fail',
        // A machine token, never a message (DETAIL_TOKEN_PATTERN): it names
        // WHICH job, which is the only thing a reader of the log cannot
        // otherwise recover.
        detail: job.entryName,
      });
    }
    if (r.output) console.log(`  output: ${r.output.trim()}`);
  }
  // Task 35.3: maintain the cron-registered sentinel so lazy-compress
  // can short-circuit when cron is active. Skip on --dry-run (no
  // host-scheduler state changed, so kit state shouldn't either).
  //
  // M3 fix (skill-review 2026-05-28): anySuccess gates the sentinel
  // write even on PARTIAL failure (one job registered, the other
  // errored). Correct: at least one cron entry is now active, so
  // detectStaleness SHOULD short-circuit to 'cron-active'. The
  // partial failure surfaces to the user via process.exitCode=2 below
  // — kit state (sentinel) and host-scheduler state (the registered
  // job) stay coherent.
  if (!dryRun) {
    const projectRoot = resolvePath(process.cwd());
    if (unregister) {
      unmarkCronRegistered({ projectRoot });
    } else if (anySuccess) {
      markCronRegistered({ projectRoot });
    }
  }
  if (anyError) process.exitCode = 2;
}

/**
 * `cmk compress --lazy` (Task 35) — runs the lazy-compress pipeline once.
 * Designed to be invoked as a detached subprocess from inject-context.mjs
 * (SessionStart hook) when staleness is detected and cron is NOT active.
 * Humans normally don't invoke this directly.
 */
/**
 * `cmk doctor` (Task 37) — runs the 15 health checks and prints a
 * structured report with repair commands. Per design §14 + tasks.md 37.3.
 *
 * Per NFR-9 + tasks.md 37.5: any recoveryCommand whose underlying
 * action requires a system-level install (pip install / npm install /
 * docker compose up etc.) must NOT be auto-invoked. v0.1.0 surfaces
 * the command to stdout — the user runs it themselves. Auto-repair
 * with --yes is a v0.1.x candidate (design §16).
 */
/**
 * Pure doctor-report formatter (Task 245). Turns the check array into the
 * printed lines + the exit verdict, with no console/process side effects, so
 * the `warn` rendering (advisory: repair shown, exit code untouched) is
 * unit-testable. Only `fail` counts toward `failCount`; `warn` never does.
 *
 * @param {Array<{id,name,status,message,recoveryCommand?,requiresInstall?}>} checks
 * @param {number} durationMs
 * @returns {{lines: string[], counts: Record<string,number>, failCount: number}}
 */
export function formatDoctorReport(checks, durationMs) {
  const counts = { pass: 0, warn: 0, fail: 0, skip: 0 };
  const lines = [];
  for (const c of checks) {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
    const statusLabel = c.status.toUpperCase().padEnd(4);
    lines.push(`[${statusLabel}] ${c.id}: ${c.name}`);
    lines.push(`         ${c.message}`);
    if ((c.status === 'fail' || c.status === 'warn') && c.recoveryCommand) {
      // Repair-command surfaced for the user. Per 37.5 + NFR-9, we do NOT
      // auto-invoke install-requiring repairs — the user copies the command.
      const installNote = c.requiresInstall
        ? ' (REQUIRES INSTALL — review before running)'
        : '';
      lines.push(`         → repair: ${c.recoveryCommand}${installNote}`);
    }
  }
  lines.push('');
  const warnPart = counts.warn > 0 ? ` · ${counts.warn} warn` : '';
  lines.push(
    `Summary: ${counts.pass} pass${warnPart} · ${counts.fail} fail · ${counts.skip} skip (${durationMs}ms)`,
  );
  return { lines, counts, failCount: counts.fail };
}

/**
 * Task 47 — the `--repair` pass, after the report has already been printed.
 *
 * Kept out of runDoctorCli's body so the report path stays readable and so the
 * repair flow can be driven in a test without re-running fifteen health checks.
 * The prompter is created HERE rather than in doctor-repair.mjs: a module that
 * opens stdin cannot be unit-tested, and the seam is the whole reason the
 * consent logic is testable at all (this is Task 47.3's `promptUser`, landing
 * WITH its consumer rather than as the forward-compat hook Task 37 correctly
 * refused to leave lying around).
 */
async function offerRepairs({ checks, projectRoot, options, deps = {} }) {
  const log = deps.log ?? console.log;
  const plan = planRepairs(checks, { knownVerbs: subcommandNames });
  if (plan.length === 0) {
    log('');
    log('Nothing to repair — no failing check carries a recovery command.');
    return;
  }
  const interactive = deps.interactive ?? Boolean(process.stdin.isTTY);
  const assumeYes = options?.yes === true;
  log('');
  log(`--repair: ${plan.length} repair(s) available.`);

  let rl;
  const prompt =
    deps.prompt ??
    (async (q) => {
      if (!rl) {
        const { createInterface } = await import('node:readline/promises');
        rl = createInterface({ input: process.stdin, output: process.stdout });
      }
      return rl.question(q);
    });
  try {
    const { counts, unfinished } = await runRepairs({
      plan,
      projectRoot,
      // process.argv[1] is THIS cmk's entry — repairs run the version the user
      // actually invoked, never whatever `cmk` happens to be on PATH.
      cliEntry: deps.cliEntry ?? process.argv[1],
      interactive,
      assumeYes,
      prompt,
      ...(deps.spawn ? { spawn: deps.spawn } : {}),
      log,
    });
    log('');
    log(
      `Repairs: ${counts.fixed} applied · ${counts.failed} failed · ${counts.declined} declined · ${counts['not-run']} left for you.`,
    );
    // Deliberately does NOT claim the checks now pass. The checks were run
    // BEFORE the repairs; saying "fixed" about a state nobody re-measured is
    // the same false-green this task exists to remove.
    log('Re-run `cmk doctor` to confirm what actually changed.');
    // M7: `--repair` asked for something. If a repair failed, or one was
    // withheld only because nobody could consent, the run did not finish what
    // it was asked to do — and a script must be able to see that even when
    // every underlying check was merely advisory (see runRepairs for the full
    // policy). Never LOWERS an exit code doctor already set.
    if (unfinished > 0) process.exitCode = 1;
  } finally {
    try {
      rl?.close();
    } catch {
      /* best-effort */
    }
  }
}

async function runDoctorCli(options, _command, deps = {}) {
  const projectRoot = resolvePath(process.cwd());
  // Task 270 (D-446): the SHARED resolver, not an inline `homedir()` join —
  // that hardcoded form ignores `MEMORY_KIT_USER_DIR`, so every user-tier check
  // audited the wrong directory whenever the override was set (which is how the
  // kit is sandboxed and tested). Found by the B1 live probe: a planted U-tier
  // orphan was repaired by `cmk install` — which resolves the tier correctly —
  // while `cmk doctor` reported "no fact files yet", so HC-16's whole U-tier
  // arm was invisible from the CLI. HC-7 (stale locks) reads the same tier.
  const { defaultUserDir } = await import('./tier-paths.mjs');
  const userDir = defaultUserDir();
  try {
    const r = await runDoctor({ projectRoot, userDir });
    if (r.action === 'error') {
      console.error(`cmk doctor: error — ${(r.errors ?? []).join('; ')}`);
      process.exitCode = 2;
      return;
    }
    // Render + exit verdict via the pure helper (extracted Task 245 so the
    // `warn` branch is unit-testable without spawning doctor — the reviewer's
    // note that the renderer had no coverage).
    const { lines, failCount } = formatDoctorReport(r.checks, r.duration_ms);
    for (const line of lines) console.log(line);
    if (failCount > 0) process.exitCode = 1;

    // Task 47 — `--repair`. Strictly additive: without the flag this function
    // behaves exactly as it did, which matches every doctor-style CLI surveyed
    // (brew / flutter / npm all report and hand you a command).
    if (options?.repair === true) {
      await offerRepairs({ checks: r.checks, projectRoot, options, deps });
    }

    // Task 144 (D-130): the memory-HEALTH section — content quality, not
    // plumbing. Informational only: read-only, never changes the exit code,
    // best-effort (a content-stat hiccup must not fail a healthy doctor).
    try {
      const { analyzeMemoryHealth, formatMemoryHealth } = await import('./memory-health.mjs');
      console.log('');
      console.log(formatMemoryHealth(analyzeMemoryHealth({ projectRoot })));
    } catch {
      // informational section only — stay silent on failure
    }
  } catch (err) {
    console.error(`cmk doctor: unexpected error: ${err?.message ?? err}`);
    process.exitCode = 2;
  }
}

// Task 255 (design §24 / D-414): `cmk view` — the read-only memory viewer.
//
// The command's whole job is: resolve the roots, hand them to the deep module,
// and then STAY ALIVE. That last part is the only thing worth a comment: the
// action returns a promise that never settles while the server is listening, so
// commander's `parseAsync` does not fall off the end of the process and drop
// the port. The signals bound below are what resolves it.
export async function runView(options, _command, deps = {}) {
  options = options ?? {};
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? console.error;
  const projectRoot = options?.project
    ? resolvePath(normalizeProjectPath(options.project))
    : resolvePath(process.cwd());
  const userDir =
    deps.userDir ?? process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');

  let port = 0;
  if (options?.port !== undefined) {
    port = Number(options.port);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      logError(`cmk view: --port must be an integer 0-65535 (got ${options.port})`);
      process.exitCode = 2;
      return;
    }
  }

  // commander's `--no-open` sets `options.open === false`; absent means true.
  const open = options?.open !== false;

  const r = await (deps.startViewer ?? startViewer)({
    projectRoot,
    userDir,
    host: options?.host ?? '127.0.0.1',
    port,
    open,
    log,
    logError,
    signals: deps.signals ?? ['SIGINT', 'SIGTERM'],
    ...(deps.onShutdown ? { onShutdown: deps.onShutdown } : {}),
  });

  if (r.action === 'error') {
    for (const e of r.errors ?? []) logError(`cmk view: ${e}`);
    process.exitCode = 2;
    return;
  }
  // Hold the process open. The bound SIGINT/SIGTERM handlers close the server
  // and call onShutdown (process.exit by default), so nothing needs to resolve
  // this in production; tests pass their own deps and never reach here.
  if (deps.hold === false) return r;
  await new Promise(() => {});
}

// Task 129 (D-121): `cmk config` — real, replacing the v0.1.0 stub. Dotted-key
// get/set/--show-origin over the per-tier settings.json files. Dep-injectable
// (cwd/userDir/log/logError) on the runImportClaudeMd pattern for testing the
// CLI surface. The pure resolution/mutation lives in config-core.mjs.
const TIER_FLAG_TO_NAME = { local: 'local', project: 'project', user: 'user' };

export function runConfigGet(key, options = {}) {
  const projectRoot = options?.cwd ?? resolvePath(process.cwd());
  const userDir = options?.userDir ?? join(homedir(), '.core-memory-kit');
  const log = options?.log ?? console.log;
  const logError = options?.logError ?? console.error;
  const r = configGet(key, { projectRoot, userDir });
  if (!r.found) {
    logError(`cmk config get: '${key}' is not set in any tier`);
    process.exitCode = 2;
    return r;
  }
  log(typeof r.value === 'string' ? r.value : JSON.stringify(r.value));
  return r;
}

export function runConfigSet(key, value, options = {}) {
  const projectRoot = options?.cwd ?? resolvePath(process.cwd());
  const userDir = options?.userDir ?? join(homedir(), '.core-memory-kit');
  const log = options?.log ?? console.log;
  const logError = options?.logError ?? console.error;
  const tier = TIER_FLAG_TO_NAME[options?.tier ?? 'project'] ?? 'project';
  const r = configSet(key, value, { projectRoot, userDir, tier });
  if (!r.ok) {
    logError(`cmk config set: ${r.error}`);
    process.exitCode = 2;
    return r;
  }
  log(`cmk config set: ${key} = ${value} (${r.tier} tier)`);
  return r;
}

export function runConfigShowOrigin(key, options = {}) {
  const projectRoot = options?.cwd ?? resolvePath(process.cwd());
  const userDir = options?.userDir ?? join(homedir(), '.core-memory-kit');
  const log = options?.log ?? console.log;
  const logError = options?.logError ?? console.error;
  const r = configShowOrigin(key, { projectRoot, userDir });
  if (!r.found) {
    logError(`cmk config --show-origin: '${key}' is not set in any tier`);
    process.exitCode = 2;
    return r;
  }
  for (const e of r.entries) {
    const val = typeof e.value === 'string' ? `"${e.value}"` : JSON.stringify(e.value);
    const note = e.winner ? '' : `   (shadowed by ${e.shadowedBy})`;
    log(`${e.tier.padEnd(8)} ${e.path}   ${val}${note}`);
  }
  return r;
}

// Task 201 (D-277): `cmk config show` — a one-glance INFORMATIONAL readout of the
// project's memory setup. Distinct from `cmk doctor` (health / pass-fail): this
// answers "what IS my config?", never a verdict. It's what makes the split-brain
// backend override LEGIBLE — without it, "which agent runs my automatic memory"
// is invisible. Read-only; never sets a non-zero exit code. `backendCliProbe`
// injectable so tests don't spawn a real binary.
export function runConfigShow(options = {}) {
  const projectRoot = options?.cwd ?? resolvePath(process.cwd());
  const userDir = options?.userDir ?? join(homedir(), '.core-memory-kit');
  const log = options?.log ?? console.log;
  const probe = options?.backendCliProbe ?? ((a) => agentCliOnPath(a));

  const installedFor = detectInstallKind(projectRoot); // 'claude-code' | 'kiro' | 'cursor' | 'codex'
  const { agent: backendAgent, source } = resolveBackendAgent({ projectRoot, userDir });
  const cli = probe(backendAgent);
  const searchMode = resolveDefaultSearchMode({ projectRoot });

  const cliState = cli.present
    ? `${cli.bin} (present)`
    : `${cli.bin} — NOT on PATH${cli.reason ? ` (${cli.reason})` : ''}`;
  const backendLine =
    source === 'override'
      ? `${backendAgent}  ← override (backend.agent), differs from installed-for`
      : `${backendAgent}  (follows the installed-for agent)`;

  log('core-memory-kit — config');
  log(`  installed for:    ${installedFor}`);
  log(`  automatic memory: runs through the ${backendLine}`);
  log(`  backend CLI:      ${cliState}`);
  log(`  semantic search:  ${searchMode}`);
  if (!cli.present) {
    log('  note: the automatic LLM steps (compression / extraction / persona) are');
    log('        skipped until the backend CLI is installed; capture / search /');
    log('        recall / the delete-guard keep working.');
  }
  return { installedFor, backendAgent, source, cliPresent: cli.present, searchMode };
}

// The parent `cmk config` action: handle the --show-origin flag here; the
// get/set children carry their own actions (wired in the registry below).
// Exported for the branch test (the no-subcommand path).
export function runConfigCli(options /* , command */) {
  if (options?.showOrigin) {
    return runConfigShowOrigin(options.showOrigin, options);
  }
  const logError = options?.logError ?? console.error;
  logError(
    'cmk config: specify a subcommand — `get <key>`, `set <key> <value>`, or `--show-origin <key>`.',
  );
  process.exitCode = 2;
}

async function runRepairCli(options /* , command */) {
  const projectRoot = resolvePath(process.cwd());
  const userDir = join(homedir(), '.core-memory-kit');
  // Scope flags: --hooks / --locks / --index / --format → run that one only.
  // --all OR no flag → run all of them.
  const only = (flag) =>
    options?.[flag] &&
    !['hooks', 'locks', 'index', 'format'].filter((f) => f !== flag).some((f) => options?.[f]);
  let scope;
  if (only('hooks')) scope = 'hooks';
  else if (only('locks')) scope = 'locks';
  else if (only('index')) scope = 'index';
  else if (only('format')) scope = 'format';
  else scope = 'all';

  try {
    const r = await runRepair({ projectRoot, userDir, scope });
    if (r.action === 'error') {
      console.error(`cmk repair: error — ${(r.errors ?? []).join('; ')}`);
      process.exitCode = 2;
      return;
    }
    for (const repair of r.repairs) {
      if (repair.error) {
        console.error(`cmk repair (${repair.kind}): error — ${repair.error}`);
        continue;
      }
      const status = repair.changed ? 'fixed' : 'no-op';
      console.log(`cmk repair (${repair.kind}): ${status}`);
      if (repair.kind === 'hooks' && repair.changed) {
        console.log(`  → updated ${repair.settingsPath}`);
        console.log(`  events: ${repair.events.join(', ')}`);
      }
      if (repair.kind === 'locks') {
        if (repair.removed && repair.removed.length > 0) {
          for (const l of repair.removed) console.log(`  removed: ${l.path} (${l.reason})`);
        }
        if (repair.preserved && repair.preserved.length > 0) {
          for (const l of repair.preserved) console.log(`  preserved: ${l.path} (${l.reason})`);
        }
      }
      if (repair.kind === 'index' && repair.changed) {
        console.log(`  → reindex completed`);
      }
    }
    if (r.errors > 0) process.exitCode = 1;
  } catch (err) {
    console.error(`cmk repair: unexpected error: ${err?.message ?? err}`);
    process.exitCode = 2;
  }
}

async function runRollCli(options /* , command */) {
  const projectRoot = resolvePath(process.cwd());
  const scope = options?.scope ?? ROLL_SCOPES.NOW;
  // I2 fix (Task 39 skill-review 2026-05-28): dropped unused userDir
  // computation. runRoll's underlying pipelines (compress-session,
  // daily-distill, weekly-curate) all operate purely on projectRoot —
  // none take userDir. Same forward-compat-rot anti-pattern Task 37 M3
  // + Task 38 I1 already removed.
  const { makeBackend } = await import('./make-backend.mjs'); // Task 200: agent-relative
  try {
    const backend = makeBackend({ projectRoot });
    const r = await runRoll({ projectRoot, scope, backend });
    if (r.action === 'error') {
      console.error(`cmk roll: error — ${(r.errors ?? []).join('; ')}`);
      process.exitCode = 2;
      return;
    }
    const inner = r.result;
    console.log(`cmk roll --scope ${scope} → ${r.delegatedTo}: ${inner?.action ?? 'unknown'}${inner?.reason ? ` (${inner.reason})` : ''}`);
  } catch (err) {
    console.error(`cmk roll: unexpected error: ${err?.message ?? err}`);
    process.exitCode = 2;
  }
}

// Task 114 (F-13): dep-injectable (projectRoot / harnessRoot / log / logError) so
// the real-import CLI path is verifiable on real input WITHOUT touching the user's
// ~/.claude. Defaults are unchanged for production. Returns the core result.
export async function runImportAnthropicMemory(options = {}) {
  const projectRoot = options?.projectRoot ?? resolvePath(process.cwd());
  const log = options?.log ?? console.log;
  const logError = options?.logError ?? console.error;
  const dryRun = options?.dryRun === true;
  const acceptAll = options?.yes === true;
  // options.importFn is a test seam (default = the real core) so the error +
  // catch branches below — unreachable via normal input — are coverable.
  const importFn = options?.importFn ?? importAnthropicMemory;
  try {
    const r = await importFn({ projectRoot, dryRun, acceptAll, harnessRoot: options?.harnessRoot });
    if (r.action === 'error') {
      logError(`cmk import-anthropic-memory: error — ${(r.errors ?? []).join('; ')}`);
      process.exitCode = 2;
      return r;
    }
    if (r.reason === 'no-source') {
      log(`cmk import-anthropic-memory: no Anthropic auto-memory found at ${r.sourcePath}`);
      return r;
    }
    if (r.mode === 'dry-run') {
      log(`cmk import-anthropic-memory: dry-run — ${r.proposals.length} proposal(s), ${r.skipped} duplicate(s) skipped`);
      for (const p of r.proposals) log(`  + ${p.id}: ${p.text}`);
      return r;
    }
    if (r.mode === 'requires-confirmation') {
      log(`cmk import-anthropic-memory: ${r.proposals.length} proposal(s) ready to apply.`);
      log('  Re-run with --yes to apply, or --dry-run to inspect.');
      for (const p of r.proposals) log(`  + ${p.id}: ${p.text}`);
      return r;
    }
    log(`cmk import-anthropic-memory: applied ${r.accepted} proposal(s), skipped ${r.skipped} duplicate(s)`);
    return r;
  } catch (err) {
    logError(`cmk import-anthropic-memory: unexpected error: ${err?.message ?? err}`);
    process.exitCode = 2;
  }
}

// Task 142 (D-130): onboard from an existing rules file. Dep-injectable
// (projectRoot / log / logError / importFn) on the runImportAnthropicMemory
// pattern so the real CLI path is verifiable in a sandbox. `file` is the
// optional positional (commander passes it first), defaulting to CLAUDE.md.
export async function runImportClaudeMd(file, options = {}) {
  const projectRoot = options?.projectRoot ?? resolvePath(process.cwd());
  const log = options?.log ?? console.log;
  const logError = options?.logError ?? console.error;
  const dryRun = options?.dryRun === true;
  const acceptAll = options?.yes === true;
  const importFn = options?.importFn ?? importClaudeMd;
  try {
    const r = await importFn({ projectRoot, file, dryRun, acceptAll });
    if (r.action === 'error') {
      logError(`cmk import-claude-md: error — ${(r.errors ?? []).join('; ')}`);
      process.exitCode = 2;
      return r;
    }
    if (r.reason === 'no-source') {
      log(`cmk import-claude-md: no rules file found at ${r.sourcePath}`);
      return r;
    }
    if (r.reason) {
      // e.g. read-source-failed — completed-with-failure must not print the
      // success-shaped "applied 0" line (skill-review 2026-06-12 finding).
      logError(`cmk import-claude-md: ${r.reason} (${r.sourcePath})`);
      process.exitCode = 2;
      return r;
    }
    const listProposals = () => {
      for (const p of r.proposals) log(`  + [${p.type}] L${p.line}: ${p.text}`);
    };
    if (r.mode === 'dry-run') {
      log(`cmk import-claude-md: dry-run — ${r.proposals.length} proposal(s), ${r.skipped} duplicate(s) skipped`);
      listProposals();
      return r;
    }
    if (r.mode === 'requires-confirmation') {
      log(`cmk import-claude-md: ${r.proposals.length} proposal(s) ready to apply.`);
      log('  Re-run with --yes to apply, or --dry-run to inspect.');
      listProposals();
      return r;
    }
    const rejectedNote = r.rejected > 0 ? `, ${r.rejected} rejected by Poison_Guard` : '';
    const errorNote = r.errors > 0 ? `, ${r.errors} error(s)` : '';
    log(`cmk import-claude-md: applied ${r.accepted} fact(s), skipped ${r.skipped} duplicate(s)${rejectedNote}${errorNote}`);
    return r;
  } catch (err) {
    logError(`cmk import-claude-md: unexpected error: ${err?.message ?? err}`);
    process.exitCode = 2;
  }
}

async function runTranscriptsDispatch(childName, options) {
  if (childName === 'extract') {
    return runTranscriptsExtract(options);
  }
  console.error(`cmk transcripts: ${NOTICE_PREFIX} (unknown sub-verb '${childName}')`);
  process.exitCode = 2;
}

async function runTranscriptsExtract(options) {
  // Discover sessions per the flags + extract each into the output dir.
  const projectRoot = resolvePath(process.cwd());
  const outputDir = options?.output
    ? resolvePath(options.output)
    : join(projectRoot, 'transcripts-extracted');
  const includeThinking = options?.includeThinking === true;
  let sessions;
  try {
    sessions = discoverSessions({
      slug: options?.slug,
      sessionUuidSuffix: options?.session,
      sinceIso: options?.since,
    });
  } catch (err) {
    console.error(`cmk transcripts extract: discovery error: ${err?.message ?? err}`);
    process.exitCode = 2;
    return;
  }
  if (sessions.length === 0) {
    // S1 fix (Task 38 skill-review 2026-05-28): specialize the message
    // for --session-not-found so the user sees the filter that failed.
    if (options?.session) {
      console.error(
        `cmk transcripts extract: no session matching --session ${options.session}`,
      );
      process.exitCode = 2;
      return;
    }
    console.log('cmk transcripts extract: no sessions found matching filter');
    return;
  }
  if (options?.session && sessions.length > 1) {
    console.error(`cmk transcripts extract: ambiguous --session match (${sessions.length} candidates):`);
    for (const s of sessions.slice(0, 10)) {
      console.error(`  ${s.slug}/${s.sessionId}.jsonl`);
    }
    process.exitCode = 2;
    return;
  }
  let totalTurns = 0;
  let totalBytes = 0;
  for (const s of sessions) {
    const outputPath = join(outputDir, s.slug, `${s.sessionId}.md`);
    try {
      const r = extractTranscript({
        inputPath: s.jsonlPath,
        outputPath,
        includeThinking,
      });
      if (r.action === 'error') {
        console.error(`  ${s.sessionId}: error — ${(r.errors ?? []).join('; ')}`);
        continue;
      }
      totalTurns += r.turnsKept;
      totalBytes += r.outputSize;
      console.log(`  ${s.slug}/${s.sessionId}: ${r.turnsKept} turn(s) → ${outputPath}`);
    } catch (err) {
      console.error(`  ${s.sessionId}: unexpected error: ${err?.message ?? err}`);
    }
  }
  console.log(`cmk transcripts extract: processed ${sessions.length} session(s); ${totalTurns} total turns; ${(totalBytes / 1024 / 1024).toFixed(2)} MB written`);
}

// --- cmk import-sessions (Task 225, D-326 — the v0.6.0 headline) ----------
//
// Dep-injectable like runQueueReview (Task 113 pattern): a test injects
// { projectRoot, backend, harnessRoot, prompter, log, logError, now } to
// drive the real pipeline without stdin or a live backend.

// --max / --all / --since flag validation. Returns {ok:false} after
// logging + exit 2, or {ok:true, maxSessions}.
function parseImportFlags(opts, logError) {
  let maxSessions = DEFAULT_MAX_SESSIONS;
  if (opts.all === true) {
    maxSessions = Number.MAX_SAFE_INTEGER;
  } else if (opts.max != null) {
    maxSessions = Number.parseInt(opts.max, 10);
    if (!Number.isFinite(maxSessions) || maxSessions <= 0) {
      logError(`cmk import-sessions: --max must be a positive integer (got "${opts.max}")`);
      process.exitCode = 2;
      return { ok: false };
    }
  }
  // M5: a mistyped --since would otherwise silently disable the filter
  // (NaN comparisons are always false → everything imports).
  if (opts.since != null && Number.isNaN(new Date(opts.since).getTime())) {
    logError(`cmk import-sessions: --since must be an ISO date (got "${opts.since}")`);
    process.exitCode = 2;
    return { ok: false };
  }
  return { ok: true, maxSessions };
}

function importCapLabel(opts, maxSessions) {
  if (opts.all === true) return 'no cap';
  if (maxSessions === DEFAULT_MAX_SESSIONS) return `cap ${DEFAULT_MAX_SESSIONS} — raise with --max/--all`;
  return `cap ${maxSessions}`;
}

function narrateImportPreview(preview, opts, maxSessions, log) {
  const already = preview.alreadyImported > 0 ? ` (${preview.alreadyImported} already imported)` : '';
  const active = preview.skippedActive > 0 ? ` (${preview.skippedActive} still-active, deferred)` : '';
  const cap = importCapLabel(opts, maxSessions);
  log(`cmk import-sessions: found ${preview.discovered} session(s)${already}${active} — ${preview.selected} selected (newest first, ${cap}).`);
}

// One confirmation, default-skip. --yes bypasses; a test injects a prompter;
// non-interactive without either requires the explicit --yes (the kit-wide
// apply-command convention). Returns 'yes' | 'declined' | 'no-tty'.
async function confirmImportRun(opts, log, logError) {
  if (opts.yes === true) return 'yes';
  let prompter = opts.prompter;
  let rl = null;
  if (!prompter && process.stdin.isTTY && process.stdout.isTTY) {
    rl = createInterface({ input: process.stdin, output: process.stdout });
    prompter = (q) => new Promise((res) => rl.question(q, (a) => res(a)));
  }
  if (!prompter) {
    logError('cmk import-sessions: non-interactive session — re-run with --yes to proceed.');
    process.exitCode = 2;
    return 'no-tty';
  }
  try {
    const answer = await prompter('  Proceed? [y/N]: ');
    if (/^y(es)?$/i.test(String(answer).trim())) return 'yes';
    log('cmk import-sessions: skipped — run again anytime; a re-run imports only new sessions.');
    return 'declined';
  } finally {
    if (rl) rl.close();
  }
}

function narrateImportResult(result, log) {
  const days = new Set(result.imported.map((s) => s.date));
  log(`cmk import-sessions: imported ${result.imported.length} session(s) into ${days.size} dated day file(s) under context/sessions/.`);
  if (result.screened_out.length > 0) {
    log(`  ${result.screened_out.length} summary(ies) withheld by the privacy/secret screen (logged; raw extract kept locally).`);
  }
  if (result.failed.length > 0) {
    log(`  ${result.failed.length} session(s) failed at the backend — a re-run imports ONLY the remainder (resumable).`);
    if (result.imported.length === 0) process.exitCode = 1;
  }
  if (result.rawFloorProtected === false) {
    log('  Note: could not verify .gitignore covers context/transcripts/imported/ — raw extracts went to a temp dir instead (summaries imported normally). Run `cmk install` to refresh the managed block.');
  }
  if (result.imported.length > 0) {
    log('  Searchable now: try `cmk search "<topic>"`. Raw transcripts: context/transcripts/imported/ (local-only).');
  }
}

export async function runImportSessions(opts = {}) {
  const projectRoot = opts.projectRoot ?? process.cwd();
  const log = opts.log ?? console.log;
  const logError = opts.logError ?? console.error;

  const flags = parseImportFlags(opts, logError);
  if (!flags.ok) return;
  const { maxSessions } = flags;

  const common = {
    projectRoot,
    harnessRoot: opts.harnessRoot,
    slug: opts.slug,
    allProjects: opts.allProjects === true,
    sinceIso: opts.since,
    maxSessions,
    now: opts.now,
  };
  const backend = opts.backend ?? makeBackend({ projectRoot });

  // Discovery preview first — the honest cost heads-up BEFORE any spend
  // (summarization runs on the user's subscription / API billing).
  const preview = await importSessions({ ...common, backend, dryRun: true });
  if (preview.action === 'error') {
    logError(`cmk import-sessions: ${(preview.errors ?? []).join('; ')}`);
    process.exitCode = 2;
    return preview;
  }
  if (preview.action === 'skipped') {
    log('cmk import-sessions: no matching Claude Code sessions found under ~/.claude/projects/.');
    return preview;
  }
  narrateImportPreview(preview, opts, maxSessions, log);
  if (preview.selected === 0) {
    log('cmk import-sessions: nothing new to import.');
    return preview;
  }
  log(`  This summarizes ${preview.selected} session(s) through your agent backend (one call each) — it uses your subscription/API budget.`);

  if (opts.dryRun === true) {
    for (const p of preview.preview) {
      log(`  ${p.sessionId}  ${p.mtime.slice(0, 10)}  ${(p.jsonlBytes / 1024).toFixed(1)} KB  (${p.slug})`);
    }
    log('cmk import-sessions: dry-run — nothing written.');
    return preview;
  }

  const consent = await confirmImportRun(opts, log, logError);
  if (consent === 'no-tty') return preview;
  if (consent === 'declined') return { action: 'declined' };

  const result = await importSessions({ ...common, backend });
  if (result.action === 'error') {
    logError(`cmk import-sessions: ${(result.errors ?? []).join('; ')}`);
    process.exitCode = 1;
    return result;
  }
  narrateImportResult(result, log);
  return result;
}

// The `cmk install` tail-offer (Task 225's automatic-path criterion): detect
// existing harness history and ask ONE question, default-skip — the user
// never needs to know the command. Best-effort: never fails the install.
export async function offerImportSessions(options, { projectRoot, log }) {
  try {
    const found = discoverSessions({
      slug: harnessSlugForPath(projectRoot),
      harnessRoot: options?.harnessRoot,
    });
    if (found.length === 0) return { action: 'none' };

    let prompter = options?.importPrompter;
    let rl = null;
    if (!prompter && process.stdin.isTTY && process.stdout.isTTY) {
      rl = createInterface({ input: process.stdin, output: process.stdout });
      prompter = (q) => new Promise((res) => rl.question(q, (a) => res(a)));
    }
    if (!prompter) {
      log(
        `  Found ${found.length} existing Claude Code session(s) for this project — bootstrap your memory anytime with: cmk import-sessions`,
      );
      return { action: 'hint' };
    }
    let answer;
    try {
      answer = await prompter(
        `  Found ${found.length} existing Claude Code session(s) for this project. Import them into memory now? (summarizes up to ${DEFAULT_MAX_SESSIONS} newest via your agent backend) [y/N]: `,
      );
    } finally {
      if (rl) rl.close();
    }
    if (!/^y(es)?$/i.test(String(answer).trim())) {
      log('  Skipped — run `cmk import-sessions` anytime.');
      return { action: 'declined' };
    }
    // `importBackend`, not `backend`: runInstall's options.backend is the
    // --backend <agent> override flag (Task 201) — a different thing.
    const backend = options?.importBackend ?? makeBackend({ projectRoot });
    const result = await importSessions({
      projectRoot,
      backend,
      harnessRoot: options?.harnessRoot,
      now: options?.now,
    });
    if (result.action === 'completed') {
      log(
        `  Imported ${result.imported.length} session(s) into dated memory — searchable via \`cmk search\`.`,
      );
    }
    return { action: 'imported', result };
  } catch (err) {
    // Best-effort — never fail the install. But a user who answered "y"
    // must not get silence (M4); the resumable design makes the hint true.
    try {
      log(
        `  Import hit an error (${err?.message ?? err}) — run \`cmk import-sessions\` to resume; finished sessions are kept.`,
      );
    } catch {
      // even the log is best-effort
    }
    return { action: 'error' };
  }
}

async function runCompress(options /* , command */) {
  const lazy = options?.lazy === true;
  if (!lazy) {
    // S1 fix (skill-review 2026-05-28): exit 2 on missing --lazy so
    // scripts can distinguish "command ran" from "command rejected its
    // input". Matches NOTICE_PREFIX convention elsewhere in v0.1.0.
    console.error(
      `cmk compress: ${NOTICE_PREFIX} (the --lazy flag is required for v0.1.0; bare \`cmk compress\` is a v0.1.x candidate — see design §16)`,
    );
    process.exitCode = 2;
    return;
  }
  const projectRoot = resolvePath(process.cwd());
  const { makeBackend } = await import('./make-backend.mjs'); // Task 200: agent-relative
  try {
    const backend = makeBackend({ projectRoot });
    const r = await runLazyCompress({ projectRoot, backend });
    if (r.action === 'error') {
      console.error(
        `cmk compress --lazy: error (${r.errorCategory ?? 'unknown'})${(r.errors && r.errors.length) ? `: ${r.errors.join('; ')}` : ''}`,
      );
    } else {
      console.log(
        `cmk compress --lazy: ${r.action}${r.reason ? ` (${r.reason})` : ''}${r.delegatedTo ? ` → ${r.delegatedTo}` : ''}`,
      );
    }
  } catch (err) {
    console.error(`cmk compress --lazy: unexpected error: ${err?.message ?? err}`);
  }
}

async function runMcpDispatch(childName) {
  if (childName === 'serve') {
    // Which project does this server serve? Claude Code sets CLAUDE_PROJECT_DIR in
    // the spawned server's env; otherwise fall back to the launch cwd (or walk up
    // to the nearest `context/`). The kiro-cli surface does NOT use MCP at all (its
    // agent sets includeMcpJson:false — explicit memory goes through the `cmk
    // remember`/`cmk search` shell commands), so this server is the Claude Code +
    // Kiro IDE path. See resolveMcpProjectRoot in tier-paths.mjs.
    const projectRoot = resolveMcpProjectRoot();
    const userDir = process.env.MEMORY_KIT_USER_DIR ?? join(homedir(), '.core-memory-kit');
    // ALL logs to stderr per design §10.1; stdout is reserved for
    // JSON-RPC messages handled by the SDK's StdioServerTransport.
    // Don't console.log() anything before/during the server's run.
    try {
      await runMcpServer({ projectRoot, userDir });
    } catch (err) {
      console.error(`cmk mcp serve: fatal — ${err?.message ?? err}`);
      process.exitCode = 2;
    }
    return;
  }
  // A bare `cmk mcp` (no sub-verb) reaches here post-Task-129 (the parent
  // action is now wired) — commander passes an options object, not a string.
  const verb = typeof childName === 'string' ? childName : '(none)';
  console.error(`cmk mcp: ${NOTICE_PREFIX} (run \`cmk mcp serve\`; got sub-verb '${verb}')`);
  process.exitCode = 2;
}

async function runQueueDispatch(childName) {
  if (childName === 'conflicts') {
    return runQueueConflicts();
  }
  if (childName === 'review') {
    return runQueueReview();
  }
  if (childName === 'prune') {
    return runQueuePrune();
  }
  // A bare `cmk queue` reaches here post-Task-129 (parent action wired);
  // commander passes an options object, not a string sub-verb.
  const verb = typeof childName === 'string' ? childName : '(none)';
  console.log(`cmk queue: ${NOTICE_PREFIX} (run \`cmk queue review\`, \`cmk queue conflicts\`, or \`cmk queue prune\`; got '${verb}')`);
  process.exitCode = 2;
}

/**
 * Interactive resolver for `cmk queue conflicts`. Walks pending
 * entries one-at-a-time, prints existing + proposed text, asks for
 * one of `keep-old` / `keep-new` / `merge-both` / `skip`. Loops
 * until the queue is empty or the user signals end-of-input.
 *
 * For v0.1.0 this resolves the PROJECT tier's conflicts queue (the
 * canonical kit usage). User-tier / language-tier conflicts queues
 * can be added when the kit's CLI gains explicit `--tier` selection.
 */
// Task 113 (F-9): conflict prompter LOGIC extracted as a factory over `ask`
// (see buildReviewPrompter) so it's unit-testable without stdin.
export function buildConflictPrompter({ ask, log }) {
  const VALID = new Set(['keep-old', 'keep-new', 'merge-both', 'skip']);
  return async ({ proposedId, proposedText, proposedTrust, existingId, existingText, existingTrust, similarity }) => {
    log('');
    log('─── pending conflict ──────────────────────────────────────');
    log(`existing  (${existingId}, trust=${existingTrust}): ${existingText}`);
    log(`proposed  (${proposedId}, trust=${proposedTrust}): ${proposedText}`);
    log(`similarity: ${Number(similarity).toFixed(4)}`);
    let decision = '';
    while (!VALID.has(decision)) {
      const answer = await ask(`  [keep-old / keep-new / merge-both / skip]: `);
      decision = String(answer).trim();
      if (!VALID.has(decision)) {
        log(`  unknown answer "${decision}" — please type one of: keep-old, keep-new, merge-both, skip`);
      }
    }
    return decision;
  };
}

// Task 113 (F-9): dep-injectable (see runQueueReview). Defaults unchanged for prod;
// a test injects { projectRoot, prompter, log, logError } to drive a real keep-old
// / keep-new / merge-both resolution end-to-end without stdin. Returns the result.
export async function runQueueConflicts(opts = {}) {
  const projectRoot = opts.projectRoot ?? process.cwd();
  const log = opts.log ?? console.log;
  const logError = opts.logError ?? console.error;

  let rl = null;
  let prompter = opts.prompter;
  if (!prompter) {
    rl = createInterface({ input: process.stdin, output: process.stdout });
    const askOnce = (q) =>
      new Promise((resolve) => rl.question(q, (answer) => resolve(answer)));
    prompter = buildConflictPrompter({ ask: askOnce, log });
  }

  // merge-both wiring (Task 25b — closes Task 25's cross-layer
  // composition gap). The proposed bullet from the conflict queue
  // wasn't materialized as a Layer-2 per-fact file (it was routed to
  // `queues/conflicts.md` instead of MEMORY.md). So we DON'T call
  // `mergeFacts` (Layer 2); we call `mergeScratchpadBullets` (Layer 3)
  // which operates directly on the scratchpad: combines the two
  // bullet texts, writes a new merged bullet with a fresh canonical
  // ID + provenance citing both sources, and mutates both originals'
  // provenance to inject `superseded_by: <newId>`.
  //
  // For Task 25b's v0.1.0 ship, the merger assumes the kit's default
  // scratchpad (MEMORY.md under `context/`). Section discovery: the
  // queue entry written by `writeConflictEntry` does NOT capture the
  // existing bullet's section heading — the merger receives `section`
  // here as undefined from `resolveConflictQueue` (it doesn't pass
  // through), and `mergeScratchpadBullets` falls back to
  // `discoverSectionAt(lines, matchA.bulletIdx)` to find the heading
  // by walking back from the existing bullet's position. That fallback
  // is the documented contract for v0.1.0. Per-candidate section
  // capture in `writeConflictEntry`'s queue entry is a v0.1.x
  // candidate — see design §6.8 + §16.x notes for the trade-off.
  const mergeFn = async ({
    tier,
    projectRoot,
    userDir,
    proposedId,
    proposedText,
    existingId,
    existingText,
    section,
  }) => {
    // Default scratchpad is MEMORY.md at the project tier. Section
    // comes from the queue entry (which captured it at detect time).
    const scratchpadPath = resolvePath(projectRoot, 'context', 'MEMORY.md');
    const result = mergeScratchpadBullets({
      tier,
      projectRoot,
      userDir,
      scratchpadPath,
      section,
      idA: existingId,
      idB: proposedId,
    });
    if (result.action === 'error') {
      logError(
        `cmk queue conflicts: merge-both for ${existingId} + ${proposedId} failed: ${result.errors.join('; ')}`,
      );
    } else {
      log(`  merge-both → ${existingId} + ${proposedId} merged into ${result.id}`);
    }
  };

  // opts.resolve test seam (default = the real resolver) — see runQueueReview.
  const resolve = opts.resolve ?? resolveConflictQueue;
  try {
    const result = await resolve({
      tier: 'P',
      projectRoot,
      prompter,
      mergeFn,
    });
    if (result.action === 'error') {
      for (const e of result.errors) logError(`cmk queue conflicts: ${e}`);
      process.exitCode = 2;
      return result;
    }
    log('');
    log(
      `cmk queue conflicts: ${result.resolved} resolved (${result.kept_old} kept-old, ${result.kept_new} kept-new, ${result.merged} merged), ${result.skipped} skipped`,
    );
    // Task 262 (I5): entries about FACT FILES are left pending on purpose —
    // this walker only knows how to act on scratchpad bullets. Say so plainly
    // rather than letting them look like they were handled.
    if (result.unsupported > 0) {
      log(
        `  ${result.unsupported} entr${result.unsupported === 1 ? 'y' : 'ies'} left PENDING: they name fact files, ` +
          'which this resolver cannot merge or discard. Nothing was changed for them. ' +
          'Inspect with `cmk get <id>` and act with `cmk forget` / `cmk trust` for now.',
      );
    }
    return result;
  } finally {
    if (rl) rl.close();
  }
}

/**
 * Interactive resolver for `cmk queue review` (Task 26). Walks
 * pending medium-trust auto-extract candidates one-at-a-time, prints
 * the candidate text + provenance, asks for one of `promote` /
 * `discard` / `skip`. Loops until the queue is empty or user signals
 * end-of-input.
 *
 * Resolves the PROJECT tier's review queue (the canonical kit usage).
 */
// Task 113 (F-9): the interactive prompter LOGIC (formatting + the validate-retry
// loop) extracted as a factory over an injectable `ask`, so it's unit-testable
// without a real readline/stdin — only the 2-line createInterface wrapper in the
// runner stays an uncovered shim.
export function buildReviewPrompter({ ask, log }) {
  const VALID = new Set(['promote', 'discard', 'skip']);
  return async ({ id, text, ts, provenance }) => {
    log('');
    log('─── pending review ────────────────────────────────────────');
    log(`id:   ${id}`);
    log(`ts:   ${ts}`);
    log(`text: ${text}`);
    if (provenance) log(`prov: ${provenance.trim()}`);
    let decision = '';
    while (!VALID.has(decision)) {
      const answer = await ask(`  [promote / discard / skip]: `);
      decision = String(answer).trim();
      if (!VALID.has(decision)) {
        log(`  unknown answer "${decision}" — please type one of: promote, discard, skip`);
      }
    }
    return decision;
  };
}

// Task 113 (F-9): dep-injectable so the CLI resolution path is verifiable on REAL
// queued items. Defaults (readline over stdin + cwd + console) are unchanged for
// production; a test injects { projectRoot, prompter, log, logError } to drive a
// real promote/discard end-to-end without stdin. Returns the resolver result.
export async function runQueueReview(opts = {}) {
  const projectRoot = opts.projectRoot ?? process.cwd();
  const log = opts.log ?? console.log;
  const logError = opts.logError ?? console.error;

  // Build the interactive prompter only when the caller didn't inject one — so a
  // test never opens a real readline on stdin.
  let rl = null;
  let prompter = opts.prompter;
  if (!prompter) {
    rl = createInterface({ input: process.stdin, output: process.stdout });
    const askOnce = (q) =>
      new Promise((resolve) => rl.question(q, (answer) => resolve(answer)));
    prompter = buildReviewPrompter({ ask: askOnce, log });
  }

  // opts.resolve is a test seam (default = the real resolver) so the error-
  // handling branches below — unreachable via normal input since tier/prompter
  // are always valid here — are coverable (Task 113).
  const resolve = opts.resolve ?? resolveReviewQueue;
  try {
    const result = await resolve({ tier: 'P', projectRoot, prompter });
    if (result.action === 'error') {
      for (const e of result.errors) logError(`cmk queue review: ${e}`);
      process.exitCode = 2;
      return result;
    }
    log('');
    log(
      `cmk queue review: ${result.promoted} promoted, ${result.discarded} discarded, ${result.skipped} skipped${result.errors && result.errors.length ? `, ${result.errors.length} errored` : ''}`,
    );
    if (result.errors && result.errors.length) {
      for (const err of result.errors) {
        logError(`  error on ${err.id} (${err.decision}): ${err.errors.join('; ')}`);
      }
    }
    return result;
  } finally {
    if (rl) rl.close();
  }
}

/**
 * Interactive resolver for `cmk queue prune` (Task 194 — the survival gate's
 * decision surface). Walks pending floored-and-still-failing candidates,
 * prints the fact + its evidence, asks for one of `convert` (→ typed
 * anti-pattern warning, retained) / `forget` (tombstone) / `keep` (dismiss,
 * never re-queued) / `skip`. Same prompter-factory pattern as review/conflicts
 * (Task 113 F-9): unit-testable without stdin.
 */
export function buildPrunePrompter({ ask, log }) {
  const VALID = new Set(['convert', 'forget', 'keep', 'skip']);
  return async ({ id, text, trustScore, signalCount, detectedAt }) => {
    log('');
    log('─── prune candidate (trust floored + still failing) ───────');
    log(`id:       ${id}`);
    log(`text:     ${text}`);
    log(`evidence: trust_score=${trustScore} after ${signalCount} outcome signals (detected ${detectedAt})`);
    let decision = '';
    while (!VALID.has(decision)) {
      const answer = await ask(`  [convert (→ anti-pattern warning) / forget / keep / skip]: `);
      decision = String(answer).trim();
      if (!VALID.has(decision)) {
        log(`  unknown answer "${decision}" — please type one of: convert, forget, keep, skip`);
      }
    }
    return decision;
  };
}

// Dep-injectable like runQueueReview (Task 113 F-9 pattern): a test injects
// { projectRoot, userDir, prompter, log, logError } to drive real resolutions
// end-to-end without stdin. Returns the resolver result.
export async function runQueuePrune(opts = {}) {
  const projectRoot = opts.projectRoot ?? process.cwd();
  const userDir = opts.userDir ?? resolveUserDir();
  const log = opts.log ?? console.log;
  const logError = opts.logError ?? console.error;

  let rl = null;
  let prompter = opts.prompter;
  if (!prompter) {
    rl = createInterface({ input: process.stdin, output: process.stdout });
    const askOnce = (q) =>
      new Promise((resolve) => rl.question(q, (answer) => resolve(answer)));
    prompter = buildPrunePrompter({ ask: askOnce, log });
  }

  try {
    const result = await resolvePruneQueue({ projectRoot, userDir, prompter });
    if (result.action === 'error') {
      for (const e of result.errors) logError(`cmk queue prune: ${e}`);
      process.exitCode = 2;
      return result;
    }
    log('');
    log(
      `cmk queue prune: ${result.converted} converted to anti-patterns, ${result.forgotten} forgotten, ${result.kept} kept, ${result.skipped} skipped${result.errors && result.errors.length ? `, ${result.errors.length} errored` : ''}`,
    );
    if (result.errors && result.errors.length) {
      for (const err of result.errors) {
        logError(`  error on ${err.id} (${err.decision}): ${err.errors.join('; ')}`);
      }
    }
    return result;
  } finally {
    if (rl) rl.close();
  }
}

/**
 * `cmk stats memory-health [--window <days>]` (Task 212 — the AutoMem
 * Figure-4 behavioral dashboard). REPORT-ONLY: aggregates logs the kit
 * already writes (recall.log / audit.log / truncation.log); no thresholds,
 * no exit-code effect. Distinct from doctor's memory-health section (content
 * quality over the fact archive); this is PROCESS behavior — and the
 * Task-194 blend's tuning instrumentation.
 */
export function runStatsMemoryHealth(options = {}, _command, deps = {}) {
  const log = deps.log ?? console.log;
  const projectRoot = deps.projectRoot ?? resolvePath(process.cwd());
  const windowDays = options.window !== undefined ? Number(options.window) : 7;
  if (!Number.isInteger(windowDays) || windowDays <= 0 || windowDays > 365) {
    (deps.logError ?? console.error)('cmk stats memory-health: --window must be a positive integer ≤ 365');
    process.exitCode = 2;
    return;
  }
  // deps.now: the injected-clock seam (the Task-113 pattern) — without it the
  // CLI surface is untestable against fixed-date fixtures (a fixture seeded
  // relative to a constant ages out of the real-now window as days pass — the
  // 2026-07-18 time-bomb: green July 14-17, red on the 18th; D-351).
  const report = computeMemoryStats({ projectRoot, windowDays, now: deps.now });
  for (const line of renderMemoryStats(report)) log(line);
  return report;
}

async function runStatsDispatch(childName, options) {
  if (childName === 'memory-health') {
    return runStatsMemoryHealth(options);
  }
  const verb = typeof childName === 'string' ? childName : '(none)';
  console.log(`cmk stats: ${NOTICE_PREFIX} (run \`cmk stats memory-health\`; got '${verb}')`);
  process.exitCode = 2;
}

/** Helper: build a stub action that prints the standard notice + exits 0. */
function stub(name, milestone, extra) {
  return function action(/* args, options */) {
    const tail = milestone === 'v0.1.x' ? `${milestone}` : `milestone ${milestone}`;
    const detail = extra ? ` (${extra})` : '';
    console.log(`cmk ${name}: ${NOTICE_PREFIX} (${tail})${detail}`);
    // commander already returns to its caller; explicit exit not needed for
    // stubs and would prevent the test harness from running multiple cases.
  };
}

/**
 * @typedef {Object} ArgSpec
 * @property {string} flags        - commander argument string, e.g. "<id>" or "[query...]"
 * @property {string} description
 *
 * @typedef {Object} OptionSpec
 * @property {string} flags        - commander option flags, e.g. "--dry-run"
 * @property {string} description
 *
 * @typedef {Object} SubcommandChild
 * @property {string} name
 * @property {string} description
 * @property {ArgSpec[]=}    argSpec
 * @property {OptionSpec[]=} optionSpec
 *
 * @typedef {Object} Subcommand
 * @property {string} name
 * @property {string} description
 * @property {string|number} milestone    - tasks.md task number or "v0.1.x"
 * @property {ArgSpec[]=}    argSpec
 * @property {OptionSpec[]=} optionSpec
 * @property {SubcommandChild[]=} children
 * @property {(name?: string, ...rest: any[]) => void} action
 */

/** @type {Subcommand[]} */
// `cmk backfill` (Task 174, D-372) — the MANUAL OVERRIDE for the git-history
// backfill. The automatic path is the sweep on the `daily-distill` cron (D-169:
// the cron is the deliverable, this verb is only for "fill it now").
export async function runBackfillCli(options = {}, _cmd, deps = {}) {
  const projectRoot = deps.projectRoot ?? resolvePath(process.cwd());
  const log = deps.log ?? console.log;
  const { runBackfill, findBackfillGaps } = await import('./backfill.mjs');
  const windowDays = Number(options?.days ?? 14);

  if (options?.dryRun) {
    const gaps = findBackfillGaps({ projectRoot, windowDays });
    if (gaps.length === 0) {
      log('cmk backfill: no gaps — every commit day in the window has a session log.');
      return;
    }
    log(`cmk backfill: ${gaps.length} day(s) with commits but no session log:`);
    for (const g of gaps) log(`  ${g.date}`);
    log('Run `cmk backfill` to reconstruct them from git history.');
    return;
  }

  const backend = deps.backend ?? makeBackend({ projectRoot });
  const r = await runBackfill({ projectRoot, backend, windowDays, maxPerRun: Number(options?.max ?? 3) });
  if (r.backfilled.length === 0 && r.failed.length === 0) {
    log('cmk backfill: nothing to do — no commit day in the window is missing its session log.');
    return;
  }
  if (r.backfilled.length) {
    log(`cmk backfill: reconstructed ${r.backfilled.length} day(s) from git history — ${r.backfilled.join(', ')}`);
    log('  (marked as reconstructed, not captured; a real session log is never overwritten)');
  }
  if (r.failed.length) log(`  ${r.failed.length} day(s) could not be summarized: ${r.failed.join(', ')}`);
  if (r.remaining > 0) log(`  ${r.remaining} more remain — re-run to continue (bounded per run).`);
}

/**
 * `cmk autolink` — Task 262 sub-task 3. Link the facts that already exist.
 *
 * Write-time linking only ever helps facts written from now on; this is the
 * pass over the corpus already on disk. Bounded + resumable per ADR-0020, so
 * a killed run keeps everything it finished, and a re-run continues rather
 * than restarts.
 *
 * `--dry-run` is the default posture for a first look at a real corpus: it
 * reports the band distribution and a sample of proposed edges and writes
 * nothing at all — not the fact files, not the resume markers, not the audit.
 */
export async function runAutolink(options = {}, _cmd, deps = {}) {
  const projectRoot = deps.projectRoot ?? resolvePath(process.cwd());
  const userDir = deps.userDir ?? resolveUserDir();
  const log = deps.log ?? console.log;
  const logError = deps.logError ?? ((s) => process.stderr.write(`${s}
`));
  const {
    linkBackfill,
    linkBackfillToCompletion,
    syncIndexAfterBackfill,
    auditIndexSyncFailure,
    BACKFILL_DEFAULT_MAX,
  } = await import('./link-backfill.mjs');

  const tier = String(options?.tier ?? 'P').toUpperCase();
  // DRY RUN IS THE DEFAULT — writing takes an explicit `--apply`.
  //
  // This is not caution for its own sake; it is an incident (2026-08-08). The
  // scaffold smoke test runs every leaf verb bare from the repo cwd, so the
  // first full-suite run after this verb was registered executed
  // `cmk autolink` against the maintainer's REAL corpus and added `related:`
  // to 177 committed fact files. Nothing was lost (linking only adds
  // frontmatter, and the changes were uncommitted so `git checkout --`
  // restored them exactly) — but a bulk mutation of someone's memory must not
  // be what a verb does when you type its name with no arguments. The test
  // exclusion that stops the smoke run is the local fix; this is the
  // structural one, and it protects every user, not just this repo.
  // A CONTRADICTORY pair must never resolve to the destructive reading. Both
  // flags given → dry run wins, and we say why rather than silently picking.
  if (options?.apply === true && options?.dryRun === true) {
    log('cmk autolink: --apply and --dry-run contradict each other — treating this as a DRY RUN. Re-run with only --apply to write.');
  }
  const dryRun = options?.apply !== true || options?.dryRun === true;

  // `--max` IS THE EXPLICIT BOUNDED SLICE, and it is the only way to get one.
  //
  // Without it the verb runs to completion: the ADR-0020 bound exists so a
  // killed job keeps what it finished, NOT so a human has to re-type the
  // command nine times to link their own corpus ("that is stupid, what would a
  // real user do?" — the live run that found this). Each batch still commits
  // durably exactly as before; the loop only removes the human from the middle
  // of it. `--max` stays for the case the bound is genuinely wanted at the
  // interface: one slice now, the rest later.
  //
  // An unparseable bound is not "no bound". `Number('abc')` is NaN, and
  // `considered >= NaN` is always false — which turned a typo into an
  // UNBOUNDED walk of the whole corpus, the opposite of what the flag is for.
  const rawMax = options?.max;
  const sliced = rawMax !== undefined;
  let max = BACKFILL_DEFAULT_MAX;
  if (sliced) {
    const parsed = Number(rawMax);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      logError(`cmk autolink: --max must be a positive whole number (got ${JSON.stringify(rawMax)})`);
      process.exitCode = 2;
      return { action: 'error', errors: ['--max must be a positive integer'] };
    }
    max = parsed;
  }

  // --semantic scores from the CONTENT-ADDRESSED EMBEDDING CACHE, both sides —
  // never the capture-path scorer, which closes over ONE embedded text and
  // would compare the whole corpus against a single probe (see
  // makeCachedCosineBackend's note). Both facts in a backfill pair are already
  // in the corpus, so this makes zero model calls; it only needs the vectors to
  // exist, which is what the sync below guarantees.
  let similarity = null;
  if (options?.semantic) {
    const { makeCachedCosineBackend } = await import('./link-facts.mjs');
    const { prepareSemanticBackend } = await import('./semantic-backend.mjs');
    const { openIndexDb } = await import('./index-db.mjs');
    const db = openIndexDb({ projectRoot });
    try {
      // Sync first: a cache with no vectors for this corpus degrades every pair
      // to token-Jaccard, which would silently make --semantic a no-op.
      const prep = await prepareSemanticBackend({ db, query: 'link' });
      if (!prep.ok) {
        log(`cmk autolink: --semantic unavailable (${prep.reason}) — scoring with token-Jaccard instead.`);
      } else {
        similarity = makeCachedCosineBackend(db);
        if (!similarity) {
          log('cmk autolink: --semantic requested but no vectors are cached — scoring with token-Jaccard instead.');
        }
      }
    } finally {
      try {
        db.close();
      } catch {
        /* best-effort */
      }
    }
  }

  const verb = dryRun ? 'would link' : 'linked';

  const r = sliced
    ? linkBackfill({ projectRoot, userDir, tier, max, dryRun, similarity })
    : linkBackfillToCompletion({
        projectRoot,
        userDir,
        tier,
        // `deps.batchSize` is the injection seam for tests + the live probe: it
        // changes how the work is DIVIDED, never how much of it gets done.
        batchSize: deps.batchSize ?? BACKFILL_DEFAULT_MAX,
        dryRun,
        similarity,
        // Progress, but only when there is more than one batch to have progress
        // through — a corpus that finishes in one pass just gets its summary.
        onBatch: ({ batch, evaluated, linked, remaining }) => {
          if (batch === 1 && remaining <= 0) return;
          log(
            `  batch ${batch} · ${verb} ${linked} of ${evaluated} considered · ${remaining} to go`,
          );
        },
      });
  if (r.action === 'error') {
    for (const e of r.errors) logError(`cmk autolink: ${e}`);
    process.exitCode = 2;
    return r;
  }

  if (r.floor == null) {
    log(
      'cmk autolink: no linking floor could be derived for this corpus yet — it needs at least a few dozen facts.\n' +
        '  Nothing was linked. This is the honest answer, not a failure.',
    );
    return { ...r, indexSynced: false };
  }

  // THE DEGENERATE FLOOR — REFUSE LOUDLY, AND DO NOT PRETEND TO BE DONE (B1).
  //
  // A floor at/above the near-dup ceiling, or at/below the random-pair median,
  // means the corpus cannot separate a relationship from noise. The backfill has
  // marked NOTHING (so nothing is poisoned and a later run re-decides freely),
  // and the one thing this must never print is "the corpus is fully considered".
  if (r.degenerate) {
    const why =
      r.degenerate === 'floor-above-neardup'
        ? 'the linking threshold came out at or above the near-duplicate ceiling — every pair looks like a duplicate, so there is no "related" band left to fill'
        : 'the linking threshold came out at or below the median of random pairs — the corpus is too uniform for similarity to mean anything here';
    logError(
      `cmk autolink: REFUSED (${r.degenerate}) — ${why}.\n` +
        '  Nothing was linked and nothing was marked as considered, so this run costs you nothing and a later run over a\n' +
        '  grown or more varied corpus will decide again. This is the honest answer, not a partial result.',
    );
    process.exitCode = 1;
    return { ...r, indexSynced: false };
  }

  log(
    `cmk autolink${dryRun ? ' (dry run)' : ''}: considered ${r.evaluated} fact(s) in tier ${r.tier}` +
      `${r.batches > 1 ? ` across ${r.batches} batches` : ''} ` +
      `· ${verb} ${dryRun ? r.wouldLink : r.linked} ` +
      `· ${dryRun ? r.wouldAddEdges : r.edges} edge(s) · backend=${r.backend} floor=${r.floor.toFixed(4)}`,
  );
  // A run that inherited finished work says so — this is what a Ctrl-C'd run
  // looks like from the NEXT invocation, and the honest thing is to name it
  // rather than let the numbers look like the whole corpus was small.
  //
  // "AT LEAST", deliberately: `alreadyDone` is the `link_eval` marker count,
  // which is only ONE of the two resume artifacts. A fact an earlier run
  // actually LINKED leaves the pending walk through its own `related:`
  // frontmatter and is not in this number (the live probe: a 100-fact slice
  // linked 40 and marked 60, so the next run inherited 100 and could only
  // count 60). The marker count cannot be widened to cover the other half
  // either — a fact carrying `related:` may have been linked by hand and never
  // touched by any run. So the number is a floor, and it says so.
  if (r.alreadyDone > 0) {
    log(`  resumed — at least ${r.alreadyDone} fact(s) were finished by an earlier run and were skipped, not redone.`);
  }
  log(
    `  bands — related ${r.bands.related} · near-dup ${r.bands.nearDup} (not linked; a merge is a human call) · nothing ${r.bands.none}`,
  );
  for (const s of r.samples) {
    log(`  ${s.id} ${s.title ?? ''} → ${s.links.map((l) => `${l.slug} (${l.score})`).join(', ')}`);
  }
  if (r.remaining > 0) {
    // Two ways to get here, and they are not the same news:
    //   · `--max` — the user ASKED for a slice, so "re-run" is the answer;
    //   · a loop that stopped early — a state we could not make progress from,
    //     which must be reported as the anomaly it is, never as normal paging.
    if (sliced) {
      log(`  ${r.remaining} fact(s) remain — this was a --max slice; re-run to continue (it resumes where it stopped).`);
    } else {
      // An ANOMALY, not paging: the loop ended in a state it could not make
      // progress from. It is already recorded in the audit log (Door 5), and
      // the exit code is non-zero so a wrapping script can see it too.
      log(
        `  stopped with ${r.remaining} fact(s) still pending (${r.stopped}) — everything finished is durable; ` +
          're-run to continue. This is unexpected: it is recorded as `backfill-incomplete` in\n' +
          '  context/.locks/audit.log, and that entry is what to report if it repeats.',
      );
      process.exitCode = 1;
    }
  } else {
    log('  nothing remains — the corpus is fully considered.');
  }

  // THE FOLLOW-UP COMMAND, RUN FOR YOU. Links that exist only in the markdown
  // are invisible to `cmk links` / `cmk expand` / the viewer graph until the
  // index catches up, and the user was doing that catch-up by hand. It is
  // plumbing; the run owns it (D-85). Best-effort by construction — the
  // markdown is already written and every reader self-heals, so a cold index
  // is a slower path, never a lost link.
  let indexSynced = false;
  let indexSyncError = null;
  if (!dryRun && r.linked > 0) {
    // Announced BEFORE the work, not after: on a real corpus the rebuild is a
    // multi-second pause, and a silent pause immediately after "nothing remains"
    // reads as a hang.
    log('  syncing the search index so the new edges are live…');
    const sync = (deps.syncIndex ?? syncIndexAfterBackfill)({ projectRoot, userDir });
    indexSynced = sync.synced;
    if (sync.synced) {
      // TWO NUMBERS, BOTH LABELLED. `r.edges` is what THIS RUN wrote;
      // `sync.edgeCount` is the whole graph, every edge type (related, body
      // wikilinks, citations, supersession chains). Printing only the second
      // next to the run's own count left an unexplained gap that looked like a
      // bug in the run.
      log(
        `  index synced — this run's ${r.edges} edge(s) are live in \`cmk links\`, \`cmk expand\` and \`cmk view\` ` +
          `(the graph now holds ${sync.edgeCount} edges of all types).`,
      );
    } else {
      // NOT fixed reassurance: say what failed. The links are on disk either
      // way, so this is a slower path and not a loss — but a user debugging why
      // `cmk links` looks empty needs the actual error, and so does the log.
      indexSyncError = sync.error ?? 'unknown error';
      log(
        `  index NOT synced: ${indexSyncError}\n` +
          '  Your links are written and safe — the index rebuilds itself on your next search, or run `cmk reindex --boot` now.',
      );
      auditIndexSyncFailure({
        projectRoot,
        userDir,
        tier,
        error: indexSyncError,
        linked: r.linked,
        edges: r.edges,
      });
    }
  }

  if (dryRun && (r.wouldLink > 0 || r.remaining > 0)) {
    log('  (dry run — nothing was written. Re-run with `--apply` to write these links.)');
  }
  return { ...r, indexSynced, indexSyncError };
}

export const subcommands = [
  {
    name: 'install',
    description: 'cross-OS one-shot install — scaffold 3-tier dirs + inject .gitignore + drop kit CLAUDE.md block + wire Claude Code hooks',
    milestone: 3,
    optionSpec: [
      { flags: '--ide <agent>', description: 'target agent: claude-code (default) | kiro | cursor | codex — wires that agent\'s hooks + MCP + instruction file' },
      { flags: '--backend <agent>', description: 'route the AUTOMATIC memory (compression/extraction) through a DIFFERENT agent\'s CLI than you code in: claude | kiro | cursor | codex. E.g. code in Claude, run the janitor LLM on cheaper kiro-cli. Sets backend.agent; omit to follow --ide.' },
      { flags: '--force', description: 'allow downgrade of an existing newer-version CLAUDE.md block' },
      { flags: '--no-hooks', description: 'scaffold only; do NOT wire hooks into .claude/settings.json' },
      { flags: '--with-semantic', description: 'enable semantic recall: install the local embedder (~260 MB once), default search to hybrid, pre-warm the model' },
      { flags: '--no-semantic', description: 'pin keyword-only search for this project (writes search.default_mode=keyword)' },
      { flags: '--verbose', description: 'show the per-tier created/skipped file breakdown' },
    ],
    action: runInstall,
  },
  {
    name: 'hook',
    description: 'Kiro hook entrypoint — `cmk hook <agentSpawn|promptSubmit|stop>` (inject/capture; called by Kiro IDE + CLI hooks, not by users)',
    milestone: 50,
    argSpec: [{ flags: '<event>', description: 'the Kiro lifecycle event: agentSpawn | promptSubmit | stop' }],
    action: runHook,
  },
  {
    name: 'cursor-hook',
    description: 'Cursor hook entrypoint — reads the Cursor JSON payload on stdin, routes on hook_event_name (inject/capture/observe/guard; called by .cursor/hooks.json, not by users)',
    milestone: 196,
    action: runCursorHook,
  },
  {
    name: 'codex-hook',
    description: 'Codex hook entrypoint — reads the Codex JSON payload on stdin, routes on hook_event_name (inject/capture/observe/guard; called by .codex/hooks.json, not by users)',
    milestone: 196,
    action: runCodexHook,
  },
  {
    name: 'uninstall',
    description: 'remove the kit-managed surface (preserves everything else byte-for-byte; never touches context/)',
    milestone: 4,
    optionSpec: [
      { flags: '--ide <agent>', description: 'which agent to uninstall: claude-code (default) | kiro | cursor | codex — removes only THAT agent\'s managed surface' },
    ],
    action: runUninstall,
  },
  {
    name: 'init-user-tier',
    description: 'scaffold ~/.core-memory-kit/ (honors $MEMORY_KIT_USER_DIR override)',
    milestone: 14,
    action: runInitUserTier,
  },
  {
    name: 'remember',
    description: 'capture a durable fact (Poison_Guard + home-path abstraction). Terse → a MEMORY.md bullet; RICH (--why/--how/--type) → a granular fact file with rationale (the safe way to capture richly).',
    milestone: 24,
    argSpec: [{ flags: '[text...]', description: 'the fact to remember (omit when using --from-file)' }],
    optionSpec: [
      { flags: '--tier <tier>', description: 'P (default; U/L are v0.1.x)' },
      { flags: '--trust <level>', description: 'high | medium | low (default: high)' },
      { flags: '--section <name>', description: 'MEMORY.md section for the terse form (default: Active Threads)' },
      // Rich mode (Task 63 / F1): any of these → write a granular fact file.
      { flags: '--why <text>', description: 'rich: the rationale (becomes the **Why:** block)' },
      { flags: '--how <text>', description: 'rich: how to apply it (becomes the **How to apply:** block)' },
      { flags: '--type <type>', description: 'rich: feedback | project | reference | user (default: feedback)' },
      { flags: '--title <text>', description: 'rich: a short title (also the fact-file slug)' },
      { flags: '--links <a,b>', description: 'rich: related fact names for [[cross-links]]' },
      { flags: '--shape <shape>', description: 'rich: what KIND of truth — State | Event | Plan | Relationship | Preference | Absence | Timeless (default: State)' },
      { flags: '--expires <date>', description: 'rich: declared validity end, ISO date/datetime (e.g. 2026-08-01) — after it the fact hides from search and the weekly sweep tombstones it' },
      { flags: '--from-file <path>', description: 'rich: read the fact as a JSON object from a file — shell-safe (content never touches argv; the safe way to capture backtick/quote-heavy Why/How). JSON keys: text (required), why, how, type, title, links, shape, expires. Self-contained — other flags are ignored.' },
      { flags: '--json', description: 'rich: read the fact as a JSON object from stdin (pipe-safe, shell-safe) — same JSON keys as --from-file' },
      { flags: '--project <dir>', description: 'project root to write to (default: cwd). Used by the kiro-cli agent — kiro-cli rejects a `cd … &&` prefix (Kiro #4579), so it passes the project root explicitly instead.' },
    ],
    action: runRemember,
  },
  {
    name: 'search',
    description: 'search memory — hybrid keyword + optional semantic',
    milestone: 30,
    argSpec: [{ flags: '<query...>', description: 'query terms' }],
    optionSpec: [
      { flags: '--mode <mode>', description: 'keyword | semantic | hybrid (default: keyword; semantic + hybrid use the embedded Layer-5b backend — needs the optional @huggingface/transformers embedder)' },
      { flags: '--scope <scope>', description: 'facts | transcripts (default: facts — curated memory; transcripts = the raw session record, the last-resort recall tier)' },
      { flags: '--min-trust <level>', description: 'low | medium | high' },
      { flags: '--tier <tier>', description: 'U | P | L (filter to a single tier)' },
      { flags: '--since <date>', description: 'ISO date — exclude observations older than this' },
      { flags: '--limit <n>', description: 'max results (default: 20)' },
      { flags: '--include-tombstoned', description: 'include deleted observations in results' },
      { flags: '--include-expired', description: 'include facts past their declared expires_at (hidden by default, never deleted)' },
      { flags: '--state-view <view>', description: 'OVERRIDE the automatic query state-view classification: current | historical | transition | neutral (Task 211 — normally detected from the query, no flag needed)' },
      { flags: '--source <origin>', description: 'recall-origin tag for telemetry (e.g. skill) — records in the recall log which surface drove the search so the memory-search skill fire-rate is measurable (Task 233). Normal user searches omit it.' },
      { flags: '--project <dir>', description: 'project root to search (default: cwd). Used by the kiro-cli agent (no `cd` prefix — Kiro #4579).' },
    ],
    action: runSearch,
  },
  {
    name: 'get',
    description: 'fetch full observation bodies + provenance by ID (parity with the mk_get MCP tool)',
    milestone: 108,
    argSpec: [{ flags: '<ids...>', description: 'one or more citation IDs (e.g. P-S79MJHFN)' }],
    optionSpec: [
      {
        flags: '--include-tombstoned',
        description: 'also recover forgotten (tombstoned) facts from the archive — human-only; the AI never reads tombstones',
      },
    ],
    action: runGet,
  },
  {
    name: 'timeline',
    description: 'sequential context around an anchor observation — N before + N after (mk_timeline parity)',
    milestone: 108,
    argSpec: [{ flags: '<anchor>', description: 'citation ID to anchor the timeline on' }],
    optionSpec: [
      { flags: '--before <n>', description: 'observations before the anchor (default: 5)' },
      { flags: '--after <n>', description: 'observations after the anchor (default: 5)' },
    ],
    action: runTimeline,
  },
  {
    name: 'expand',
    description: "a recall hit's source-file neighborhood — the enclosing heading section, bounded (the recall ladder's middle rung; mk_expand parity)",
    milestone: 226,
    argSpec: [{ flags: '<id>', description: 'a search-hit id — a citation ID (P-XXXXXXXX) or a transcript-chunk id (T:<file>:<line>)' }],
    action: runExpand,
  },
  {
    name: 'links',
    description: 'the relational adjacency axis — a fact\'s backlinks (what points AT it), out-links (its related/[[cross-links]]), and full supersession chain; also accepts an anchor token (D-nnn, Task nnn, ADR-nnnn, FR-nn, NFR-nn) to answer "what cites this anchor" (mk_links parity)',
    milestone: 232,
    argSpec: [{ flags: '<id>', description: 'a citation ID (e.g. P-S79MJHFN) OR an anchor token (e.g. D-361, Task 232, ADR-0023)' }],
    optionSpec: [
      { flags: '--depth <n>', description: 'how many hops to traverse for links/backlinks (default: 1)' },
      { flags: '--direction <dir>', description: 'in (backlinks) | out (references) | both (default: both)' },
    ],
    action: runLinks,
  },
  {
    name: 'cite',
    description: 'render the canonical Markdown citation link for an observation (mk_cite parity)',
    milestone: 108,
    argSpec: [{ flags: '<id>', description: 'citation ID' }],
    action: runCite,
  },
  {
    name: 'recent-activity',
    description: 'list recent observation changes within a time window (mk_recent_activity parity)',
    milestone: 108,
    optionSpec: [
      { flags: '--window <w>', description: '1h | 24h | 7d (default: 24h)' },
      { flags: '--limit <n>', description: 'max results (default: 20)' },
    ],
    action: runRecentActivity,
  },
  {
    name: 'reindex',
    description: 'rebuild the markdown INDEX.md pointer index for the project tier',
    milestone: 8,
    optionSpec: [
      { flags: '--boot', description: 'incremental — re-index only changed files' },
      { flags: '--full', description: 'drop the cache and rebuild from scratch' },
    ],
    action: runReindex,
  },
  {
    name: 'doctor',
    description: 'run health checks HC-1..HC-16; print structured report with self-repair commands',
    milestone: 37,
    optionSpec: [
      {
        flags: '--repair',
        description:
          'after the report, offer to run each failed check\'s recovery command, one at a time [y/N]. Destructive or incomplete recoveries are always printed for you to run yourself, never executed.',
      },
      {
        flags: '--yes',
        description:
          'with --repair: apply the offered repairs without prompting (for scripts and CI). Never covers the ones marked "run this yourself".',
      },
    ],
    action: runDoctorCli,
  },
  {
    name: 'view',
    description: 'open the read-only memory viewer in your browser — facts + search, fact detail, the graph, health, and the decision journal. Ephemeral: binds 127.0.0.1 on a free port and serves until Ctrl-C. Never writes.',
    milestone: 255,
    optionSpec: [
      { flags: '--port <n>', description: 'bind this port instead of a free one (default: an OS-assigned free port)' },
      { flags: '--host <host>', description: 'loopback literal to bind: 127.0.0.1 (default) | localhost | ::1. Non-loopback is refused — the viewer has no authentication.' },
      { flags: '--no-open', description: 'do not launch a browser; just print the URL (CI / remote shells)' },
      { flags: '--project <dir>', description: 'project root to view (default: cwd)' },
    ],
    action: runView,
  },
  {
    name: 'autolink',
    description:
      'populate `related:` on facts that have none — scores each unlinked fact against the corpus and applies up to 3 edges above a floor derived from this corpus. One run does the WHOLE corpus (in resumable batches) and syncs the index when it is done.',
    milestone: 262,
    optionSpec: [
      { flags: '--apply', description: 'actually write the links. WITHOUT it this is a dry run — bare `cmk autolink` never modifies memory.' },
      { flags: '--dry-run', description: 'the default; report what WOULD link (band distribution + sample edges) and write nothing' },
      { flags: '--max <n>', description: 'do a bounded SLICE of n facts and stop, instead of the whole corpus. Without it the run finishes the job; interrupting any run is safe either way and the next one resumes.' },
      { flags: '--tier <tier>', description: 'tier to link within: P (default) | L | U. Links never cross tiers.' },
      { flags: '--semantic', description: 'score with the local embedder instead of token-Jaccard (needs the optional embedder)' },
    ],
    action: runAutolink,
  },
  {
    name: 'backfill',
    description: 'reconstruct session logs for days that have git commits but no session record (the daily cron does this automatically; this is the manual override)',
    milestone: 174,
    optionSpec: [
      { flags: '--dry-run', description: 'list the gap days without reconstructing them' },
      { flags: '--days <n>', description: 'how far back to look (default 14)' },
      { flags: '--max <n>', description: 'max days to reconstruct in one run (default 3)' },
    ],
    action: runBackfillCli,
  },
  {
    name: 'digest',
    description: 'print a readable digest of everything in memory + sync the append-only DECISIONS.md decision journal',
    milestone: 147,
    action: runDigestCli,
  },
  {
    name: 'config',
    description: 'read/write kit settings (context/settings.json) without hand-editing JSON',
    milestone: 129,
    optionSpec: [
      { flags: '--show-origin <key>', description: 'print every tier that defines a setting (winner + shadowed) — the "where did this come from?" debug surface' },
    ],
    children: [
      {
        name: 'get',
        description: 'print the resolved value of a setting (dotted key; local > project > user)',
        argSpec: [{ flags: '<key>', description: 'setting key (dotted path, e.g. search.default_mode)' }],
        action: (key, options) => runConfigGet(key, options),
      },
      {
        name: 'set',
        description: 'set a setting in the project tier (or --local)',
        argSpec: [
          { flags: '<key>', description: 'setting key (dotted path)' },
          { flags: '<value>', description: 'new value (true/false/number coerced; else string)' },
        ],
        optionSpec: [
          { flags: '--local', description: 'write to the local tier (context.local/, gitignored) instead of project' },
        ],
        action: (key, value, options) => runConfigSet(key, value, { tier: options?.local ? 'local' : 'project' }),
      },
      {
        name: 'show',
        description: 'print a one-glance readout of this project\'s memory setup (installed-for agent, active backend agent, backend CLI, semantic mode) — informational, not a health check',
        action: (options) => runConfigShow(options),
      },
    ],
    action: runConfigCli,
  },
  {
    name: 'import-anthropic-memory',
    description: "merge useful bullets from Anthropic's auto-memory into this project's MEMORY.md",
    milestone: 38,
    optionSpec: [
      { flags: '--dry-run', description: 'print proposed additions without modifying files' },
      { flags: '--yes', description: 'apply every proposal without prompting (v0.1.0 requires explicit --yes; interactive y/N is v0.1.x)' },
    ],
    action: runImportAnthropicMemory,
  },
  {
    name: 'import-claude-md',
    description: 'onboard from an existing rules file (CLAUDE.md / .cursorrules / AGENTS.md) — parse it into typed facts through the safe write path',
    milestone: 142,
    argSpec: [
      { flags: '[file]', description: 'rules file to import, relative to the project root (default: CLAUDE.md)' },
    ],
    optionSpec: [
      { flags: '--dry-run', description: 'preview the typed proposals without modifying files' },
      { flags: '--yes', description: 'apply every proposal without prompting (apply requires explicit --yes)' },
    ],
    action: runImportClaudeMd,
  },
  {
    name: 'tour',
    description: "narrate this project's memory — what's captured, where it lives, how to recall it (tour EXPLAINS; `cmk doctor` CHECKS)",
    milestone: 175,
    action: runTour,
  },
  {
    name: 'import-sessions',
    description: 'bootstrap project memory from existing Claude Code session history — summarize, screen, land as dated day files (resumable; a re-run imports only new sessions)',
    milestone: 225,
    optionSpec: [
      { flags: '--slug <slug>', description: 'import a specific harness project slug (default: this project\'s slug)' },
      { flags: '--all-projects', description: 'import sessions from every project slug under ~/.claude/projects/' },
      { flags: '--since <YYYY-MM-DD>', description: 'only sessions with mtime >= this date' },
      { flags: '--max <n>', description: `cap the newest-first selection (default ${DEFAULT_MAX_SESSIONS})` },
      { flags: '--all', description: 'remove the selection cap (import the full history)' },
      { flags: '--dry-run', description: 'preview the selection + cost heads-up, write nothing' },
      { flags: '--yes', description: 'skip the confirmation prompt (required non-interactively)' },
    ],
    action: runImportSessions,
  },
  {
    name: 'transcripts',
    description: "extract clean markdown transcripts from Claude Code session jsonls under ~/.claude/projects/",
    milestone: 38,
    children: [
      {
        name: 'extract',
        description: 'extract one or more session jsonls into clean markdown',
        optionSpec: [
          { flags: '--session <uuid-suffix>', description: 'extract a specific session by uuid suffix (substring match across all slugs)' },
          { flags: '--slug <slug>', description: 'extract all sessions under a specific Anthropic slug' },
          { flags: '--since <YYYY-MM-DD>', description: 'extract only sessions with mtime >= this date' },
          { flags: '--output <dir>', description: 'output directory (default: <cwd>/transcripts-extracted/)' },
          { flags: '--include-thinking', description: 'retain the agent\'s [thinking] blocks (omitted by default)' },
        ],
        action: (options) => runTranscriptsDispatch('extract', options),
      },
    ],
  },
  {
    name: 'trust',
    description: 'manually override the trust level of an observation (fact file or scratchpad bullet)',
    milestone: 15,
    argSpec: [
      { flags: '<id>', description: 'citation ID (e.g. P-S79MJHFN)' },
      { flags: '<level>', description: 'low | medium | high' },
    ],
    action: runTrust,
  },
  {
    name: 'lessons',
    description: 'promote a project-tier observation to the user tier (carry it across all your projects)',
    milestone: 76,
    children: [
      {
        name: 'promote',
        description: 'move a project observation to the user tier through the safe promote path',
        argSpec: [{ flags: '<id>', description: 'citation ID (e.g. P-S79MJHFN)' }],
        optionSpec: [
          { flags: '--to <file>', description: 'target user-tier file: LESSONS.md (default) | HABITS.md | USER.md' },
          { flags: '--section <title>', description: 'landing section (default per-target)' },
        ],
        action: (id, options) => runLessonsPromote(id, options),
      },
    ],
  },
  {
    name: 'queue',
    description: 'review medium-trust auto-extracts and resolve conflicting observations',
    milestone: 25,
    children: [
      { name: 'review', description: 'walk pending medium-trust auto-extracts; promote / discard / skip' },
      { name: 'conflicts', description: 'walk pending conflicts; keep-old / keep-new / merge-both / skip' },
      { name: 'prune', description: 'walk survival-gate candidates (trust floored + still failing); convert (→ anti-pattern) / forget / keep / skip' },
    ],
    action: runQueueDispatch,
  },
  {
    name: 'stats',
    description: 'behavioral reports over the kit’s own activity logs (report-only)',
    milestone: 212,
    children: [
      {
        name: 'memory-health',
        description: 'writes-per-search, empty-search rate, redundant-write rate, repeated searches, snapshot cap pressure — with trend arrows vs the prior window',
        optionSpec: [
          { flags: '--window <days>', description: 'window length in days (default 7; the spec’s 7/30 knob)' },
        ],
        action: (options) => runStatsMemoryHealth(options),
      },
    ],
    action: runStatsDispatch,
  },
  {
    name: 'forget',
    description: 'tombstone an observation (preserves audit trail; never silent delete)',
    milestone: 9,
    argSpec: [{ flags: '<id-or-query>', description: 'citation ID or substring query against canonical text' }],
    optionSpec: [
      { flags: '--yes', description: 'skip the interactive confirmation prompt (required in v0.1.0; interactive prompt is a v0.1.x follow-up)' },
      { flags: '--reason <text>', description: 'deletion reason recorded in the tombstone frontmatter' },
      { flags: '--deleted-by <enum>', description: 'who initiated the deletion (default: user-explicit)' },
    ],
    action: runForget,
  },
  {
    name: 'redact',
    description:
      'compliance scrub (Task 96, ADR-0022): remove a leaked secret/PII span from EVERY app-layer copy of a fact — live file, tombstone/superseded archives, scratchpad bullet, indexes — replacing it with [redacted: reason date]; keeps the fact + a secret-free audit entry, then prints the honest git-history advisory (rotate first; the kit never rewrites history). CLI-only, never an MCP tool',
    milestone: 96,
    argSpec: [{ flags: '<id>', description: 'the fact id (live, tombstoned, or superseded)' }],
    optionSpec: [
      { flags: '--pattern <text>', description: 'the literal secret/PII text to scrub (treated as a literal, not a regex)' },
      { flags: '--reason <text>', description: 'recorded in the redaction marker + audit entry (default: compliance)' },
      { flags: '--project <dir>', description: 'project root (default: cwd)' },
    ],
    action: runRedact,
  },
  {
    name: 'purge',
    description:
      'IRREVERSIBLE whole-fact delete (Task 96, ADR-0022): removes the fact from live + every archive copy + scratchpads + indexes with NO tombstone — the compliance escalation beyond `cmk forget`; keeps a secret-free audit entry + prints the git-history advisory. Explicit-human-only (requires --hard --yes), never an MCP tool (§6.5)',
    milestone: 96,
    argSpec: [{ flags: '<id>', description: 'the fact id (live, tombstoned, or superseded)' }],
    optionSpec: [
      { flags: '--hard', description: 'required — names the irreversible mode (use `cmk forget` for normal, tombstoned deletion)' },
      { flags: '--yes', description: 'required — confirms the irreversible delete' },
      { flags: '--project <dir>', description: 'project root (default: cwd)' },
    ],
    action: runPurge,
  },
  {
    name: 'roll',
    description: 'force-roll the rolling-window pipeline (same internals as SessionEnd / cron)',
    milestone: 39,
    optionSpec: [{ flags: '--scope <scope>', description: 'now (default — task 22 compress-session) | today (task 33 daily-distill) | recent (task 34 weekly-curate)' }],
    action: runRollCli,
  },
  {
    name: 'repair',
    description: 'idempotent self-repair — re-register hooks, reset stale locks, rebuild index, lint-clean memory',
    milestone: 39,
    optionSpec: [
      { flags: '--hooks', description: 're-register hooks from template (merges kit hooks into .claude/settings.json)' },
      { flags: '--locks', description: 'clear stale locks (>1h old by default)' },
      { flags: '--index', description: 'invoke `cmk reindex --full`' },
      { flags: '--format', description: 'migrate committed memory markdown to the lint-clean format (DECISIONS.md headings)' },
      { flags: '--all', description: 'run all repairs in order (default if no scope flag given)' },
    ],
    action: runRepairCli,
  },
  {
    name: 'daily-distill',
    description: 'run the daily-distill pipeline once (invoked by host scheduler; humans normally use `cmk register-crons`)',
    milestone: 33,
    action: runDailyDistill,
  },
  {
    name: 'weekly-curate',
    description: 'run the weekly-curate pipeline once: archive today-*.md older than 7 days, dedup bullets, rebuild recent.md (invoked by host scheduler)',
    milestone: 34,
    action: runWeeklyCurate,
  },
  {
    name: 'persona',
    description: 'cross-project persona — synthesize "how you work everywhere" into the user tier, and carry it across YOUR machines',
    milestone: 45,
    children: [
      {
        name: 'generate',
        description: 'synthesize cross-project doctrine from this project\'s captured facts now: auto-promote high-confidence to the user tier, save the rest to queues/persona-review.md',
        action: runPersonaGenerate,
      },
      {
        name: 'export',
        description: 'export your cross-project persona (the user tier) to one portable bundle file, to carry to another of YOUR machines (the persona stays private — never committed to a project)',
        milestone: 72,
        argSpec: [{ flags: '<file>', description: 'output bundle path, e.g. persona-bundle.json' }],
        action: (file, options) => runPersonaExport(file, options),
      },
      {
        name: 'import',
        description: 'import a persona bundle (from `cmk persona export`) into this machine\'s user tier; any file it replaces is backed up first',
        milestone: 72,
        argSpec: [{ flags: '<file>', description: 'bundle path produced by `cmk persona export`' }],
        action: (file, options) => runPersonaImport(file, options),
      },
    ],
  },
  {
    name: 'disable-native-memory',
    description: 'opt out of Anthropic\'s native Auto Memory for THIS project (writes autoMemoryEnabled:false to the committable .claude/settings.json) so only the kit\'s memory runs — avoids the both-layers context bloat (ADR-0011)',
    milestone: 60,
    action: () => runSetNativeMemory(false),
  },
  {
    name: 'enable-native-memory',
    description: 're-enable Anthropic\'s native Auto Memory for this project (reverses cmk disable-native-memory)',
    milestone: 60,
    action: () => runSetNativeMemory(true),
  },
  {
    name: 'compress',
    description: 'lazy-on-read compression fallback for no-cron environments. Use `--lazy` to delegate to daily-distill or weekly-curate based on staleness (typically invoked detached from the SessionStart hook).',
    milestone: 35,
    optionSpec: [
      { flags: '--lazy', description: 'run the lazy-compress cycle (the v0.1.0 supported invocation)' },
    ],
    action: runCompress,
  },
  {
    name: 'register-crons',
    description: 'register both daily-distill (23:00) and weekly-curate (Sun 09:00) cron jobs with the host scheduler',
    milestone: 33,
    optionSpec: [
      { flags: '--dry-run', description: 'print the platform-detected command without executing' },
      { flags: '--unregister', description: 'remove both daily-distill and weekly-curate entries instead of adding them' },
    ],
    action: runRegisterCrons,
  },
  {
    name: 'mcp',
    description: 'run the MCP server over stdio (invoked by Claude Code, not by humans)',
    milestone: 31,
    children: [
      { name: 'serve', description: 'start the stdio MCP server; JSON-RPC on stdin/stdout' },
    ],
    action: runMcpDispatch,
  },
  {
    name: 'version',
    description: 'print the cmk version (alias for --version)',
    milestone: 'always',
    action: function action() {
      // Print the same bare version string as `cmk --version`, resolved from
      // package.json (the single source). Was a v0.1.0 stub that punted to
      // `cmk --version`; the live test surfaced that as unhelpful friction.
      const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
      const { version } = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
      console.log(version);
    },
  },
];

/** Names list — handy for tests + help-output assertions. */
export const subcommandNames = subcommands.map((s) => s.name);

/** Notice string — exposed so tests can assert it appears in every stub output. */
export const STUB_NOTICE_PREFIX = NOTICE_PREFIX;
