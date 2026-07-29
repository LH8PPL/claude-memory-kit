// SessionStart hook real handler (Task 18, T-015). First Layer 4 module
// with non-trivial behavior; the previous Layer 4 task (#17) only shipped
// hooks.json + stub scripts.
//
// Public boundary: injectContext({cwd, userDir, now, capBytes}) → result.
// Walks the 3 tiers (local/project/user), composes a Frozen snapshot
// ≤ capBytes (default 10 KB per NFR-1 / design §1.4), dedups bullet IDs
// across tiers with most-specific-tier-wins, drops lowest-priority tiers
// on cap overflow, and emits the Anthropic hook `additionalContext` JSON
// shape so Claude Code's plugin loader injects it at session start.
//
// Side-effect log files (written under <projectRoot>/context/.locks/):
//   shadowed_by.log   — NDJSON, one entry per cross-tier ID collision
//   truncation.log    — NDJSON, one entry per cap-overflow truncation pass
// These mirror what cross-tier debug commands (`cmk config --show-origin`,
// future) will read from. The .locks/ dir is created on demand.
//
// Uses shared modules per CLAUDE.md "Shared modules" rule:
//   tier-paths.mjs    — resolveTierRoot, SCRATCHPADS_BY_TIER, ID_PATTERN
//   audit-log.mjs     — nowIso (consistent ISO formatter)

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  appendFileSync,
  statSync,
  openSync,
  readSync,
  closeSync,
} from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { SCRATCHPADS_BY_TIER, resolveTierRoot, ID_PATTERN, discoverRootUpward } from './tier-paths.mjs';
import { nowIso } from './audit-log.mjs';
import { appendRecallEntry } from './recall-log.mjs';
import { detectStaleness, isJournalStale } from './lazy-compress.mjs';
import { isProvenanceCommentLine, parseBulletProvenance } from './provenance.mjs';
// Task 209 — the state-label vocabulary + envelope instruction. state-label.mjs
// is PURE (no DB, no I/O), so this import keeps the §20.3 hot-path contract
// (the cli-search-blend regression test pins index-db/search/trust-score OUT).
import { STATE_LABELS, STATE_INSTRUCTION, hasSupersededLabel } from './state-label.mjs';
import { listConflictQueue } from './conflict-queue.mjs';
import { listReviewQueue } from './review-queue.mjs';
import { parse as parseFactFrontmatter } from './frontmatter.mjs';
import { stripBom } from './read-json.mjs';

// Task 66.4 (D-259): the contradiction-catch demo surface — ONE bounded line
// after the preamble when the weekly temporal sweep closed validity windows
// recently, so the next session KNOWS stale state was auto-resolved ("v0.3.2
// deferred → shipped" never misleads again) without a mid-turn interruption
// (the D-215 heads-up-not-gate posture). Reads the tail of the audit log
// (bounded IO — this is the SessionStart hot path) + the archived facts'
// titles; any read hiccup degrades to no mention, never a crash.
const TEMPORAL_MENTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TEMPORAL_MENTION_MAX_TITLES = 2;
function buildTemporalMention({ projectRoot, ts }) {
  try {
    const auditPath = join(projectRoot, 'context', '.locks', 'audit.log');
    if (!existsSync(auditPath)) return '';
    const nowMs = Date.parse(ts);
    // Positioned 64KB tail read (the shared readAuditTail helper) — NOT a
    // whole-file readFileSync: this runs on the 500ms-budget SessionStart
    // path and audit.log grows with project age (skill-review finding 4;
    // same rationale as the status line's read below).
    const hits = [];
    for (const line of readAuditTail(auditPath).split(/\r?\n/)) {
      if (!line.trim()) continue;
      let e;
      try {
        e = JSON.parse(line);
      } catch {
        continue;
      }
      if (e.action !== 'temporal_supersede') continue;
      const ms = Date.parse(e.ts);
      if (!Number.isFinite(ms) || nowMs - ms > TEMPORAL_MENTION_WINDOW_MS) continue;
      hits.push(e);
    }
    if (hits.length === 0) return '';
    const titles = [];
    // Newest-first: the tail is chronological, so the LAST hits are the most
    // recent closes — the informative ones to name (finding 9).
    for (const e of hits.slice(-TEMPORAL_MENTION_MAX_TITLES).reverse()) {
      const p = e.paths?.archive;
      if (!p || !existsSync(p)) continue;
      try {
        const { frontmatter } = parseFactFrontmatter(readFileSync(p, 'utf8'));
        if (frontmatter?.title) titles.push(`"${String(frontmatter.title).slice(0, 70)}"`);
      } catch {
        // title unavailable — the count still informs
      }
    }
    const named = titles.length > 0 ? ` — e.g. ${titles.join(', ')}` : '';
    const more = hits.length > titles.length && titles.length > 0 ? ` (+${hits.length - titles.length} more)` : '';
    const n = hits.length;
    return (
      `Note: ${n} stale state fact${n === 1 ? '' : 's'} auto-superseded by newer ones this week` +
      `${named}${more}. The memory below is the CURRENT state; closed windows stay readable in memory/archive/superseded/.`
    );
  } catch {
    return '';
  }
}

// Task 150 (ADR-0018): the memory-commit PROPOSAL line — the kit detects
// accrued uncommitted committed-tier memory and tells the MODEL, so Claude
// offers a one-tap commit in conversation; the user's yes executes an
// ordinary agent-run git command under the host permission model. The kit
// itself NEVER runs a git write — this is the reconciliation of "memory
// must actually get committed" (D-235: the user had to say 'commit the
// memories' twice) with the settled no-auto-git position. Detection only:
// `.git` gate (non-git projects skip with zero cost), then a bounded
// `git status --porcelain -- context/` (context.local/ is gitignored by
// design and never counts). Any failure degrades to silence.
// Timeout composition with NFR-1 (skill-review I1): injectContext's whole
// budget is 500ms, and a warm `git status` on a modest repo already measured
// ~450ms — so the git call gets a SHORT leash, not a generous one: a proposal
// that can't be computed fast degrades to silence (the ADR's posture), it
// never gets to spend 3× the hook budget on a line §7.1.3 calls decoration.
const COMMIT_PROPOSAL_GIT_TIMEOUT_MS = 400;
function buildCommitProposal({ projectRoot, gitTimeoutMs }) {
  try {
    if (!existsSync(join(projectRoot, '.git'))) return '';
    // -uall: without it, a fully-UNTRACKED context/ collapses to one
    // `?? context/` line and the count reads "1" for a whole directory —
    // exactly wrong on the most common case (the first-ever commit).
    // --no-optional-locks: plain `git status` may opportunistically refresh
    // .git/index — this flag makes the ADR's "the kit ships no git-writing
    // code path" claim airtight AND avoids contending with a user's
    // concurrent git operation (skill-review I1).
    const r = spawnSync(
      'git',
      ['--no-optional-locks', 'status', '--porcelain', '-uall', '--', 'context/'],
      {
        cwd: projectRoot,
        windowsHide: true,
        // gitTimeoutMs is a TEST-ONLY injection seam (the testSpawnLazy
        // idiom): under 5x-suite stress load a real git exceeds the 400ms
        // production leash and the proposal CORRECTLY degrades to silence —
        // which made presence-asserting tests timing-flaky (stress run
        // caught it). Production callers never pass it.
        timeout: gitTimeoutMs ?? COMMIT_PROPOSAL_GIT_TIMEOUT_MS,
        encoding: 'utf8',
      },
    );
    if (r.status !== 0 || typeof r.stdout !== 'string') return '';
    // Task 206 (D-304): EXCLUDE the pre-roll now.md from both the count and
    // the offer. It is the ONE context/ file the privacy screen has not fully
    // processed yet — L1 masks emails/phones at write, but NAMES await the
    // roll's compressor/L3 pass — so a user accepting the one-tap commit
    // before the roll could ship a raw personal name (proven live in the
    // v0.5.0 Kiro §6/E2 gate: the committed transcript + today-*.md were
    // correctly «NAME»-masked while now.md held the raw name). Its content
    // is never lost: the roll drains it into today-*.md (screened), which a
    // LATER proposal offers. Porcelain paths are forward-slashed on every OS
    // and END the line (incl. a rename's `R old -> new` target), so endsWith
    // is the tight match — a hypothetical now.md.bak stays counted (self-review:
    // includes() would over-exclude it).
    const n = r.stdout
      .split('\n')
      .filter((l) => l.trim())
      .filter((l) => !l.trimEnd().endsWith('context/sessions/now.md')).length;
    if (n === 0) return '';
    return (
      `Note: ${n} memory file(s) under context/ are uncommitted — at a natural moment, ` +
      `offer the user a one-tap commit of their project memory (stage context/ EXCLUDING ` +
      `context/sessions/now.md — it is a pre-screen buffer that must never be committed ` +
      `before its roll — + a short commit); do NOT run any git command before the user ` +
      `approves — only act on their yes (ADR-0018: the kit proposes, the user owns git).`
    );
  } catch {
    return '';
  }
}

// Task 233 (ADR-0024, the Letta existence-advertisement borrow): ONE live
// metadata line telling the model WHAT there is to search before it decides to
// — fact count + available scopes + last-write recency. It is the "you know
// what there is to search" half of the recall-trigger hybrid (the per-prompt
// hint is the "here's what matches" half).
//
// §20.3 IMPORT PIN: this is computed WITHOUT opening the sqlite index — the
// inject path must never import index-db (a structural regression test pins the
// import graph). The three inputs are all read from the always-present markdown
// + logs: the fact COUNT from the granular INDEX.md (the reindex-maintained
// derived view — the same file the per-prompt hint gates on); the SCOPES from
// tier-file presence; the RECENCY from the audit-log tail. Byte-stable when
// memory is unchanged: no `now`-relative rendering (an absolute capture date),
// so two builds over an unchanged corpus produce identical bytes (the snapshot
// is prefix-cache-sensitive). Empty string when there is no granular archive
// (a fresh project has nothing to advertise) — so the pre-233 snapshot shape is
// byte-identical on empty-archive installs.
const ADVERTISEMENT_INDEX_ENTRY_RE = /\n- \([PUL]-[A-Za-z0-9]{8}\)/g;
function buildExistenceAdvertisement({ projectRoot }) {
  try {
    const indexPath = join(projectRoot, 'context', 'memory', 'INDEX.md');
    if (!existsSync(indexPath)) return '';
    const indexContent = readFileSync(indexPath, 'utf8');
    const factCount = (indexContent.match(ADVERTISEMENT_INDEX_ENTRY_RE) ?? []).length;
    if (factCount === 0) return ''; // nothing recorded → nothing to advertise
    const scopes = ['facts'];
    if (existsSync(join(projectRoot, 'context', 'DECISIONS.md'))) scopes.push('decisions');
    if (hasTranscriptTier(projectRoot)) scopes.push('transcripts');
    const recency = latestCaptureDate({ projectRoot });
    return (
      `Searchable memory beyond this snapshot: ${factCount} recorded fact(s) · scopes: ${scopes.join(', ')}` +
      `${recency ? ` · latest capture ${recency}` : ''}. ` +
      'Reach it with the memory-search skill or `cmk search "<topic>"`.'
    );
  } catch {
    return '';
  }
}

// True when a raw-transcript tier exists to search (the `transcripts` scope).
// Presence-only, cheap: a transcripts/ or sessions/ dir holding at least one
// markdown file. Deterministic given the corpus (byte-stable advertisement).
function hasTranscriptTier(projectRoot) {
  for (const sub of ['transcripts', 'sessions']) {
    const dir = join(projectRoot, 'context', sub);
    try {
      if (existsSync(dir) && readdirSync(dir).some((n) => n.endsWith('.md'))) return true;
    } catch {
      /* unreadable dir — treat as absent */
    }
  }
  return false;
}

// The newest capture DATE (yyyy-mm-dd, UTC) from the audit-log tail — a
// `created` fact or an APPLIED import (the same capture definition the status
// line uses). Absolute date → byte-stable when no new capture landed. Null when
// the audit log is absent (a fresh clone: .locks is gitignored) or unreadable,
// in which case the advertisement simply omits the recency clause.
function latestCaptureDate({ projectRoot }) {
  try {
    const auditPath = join(projectRoot, 'context', '.locks', 'audit.log');
    if (!existsSync(auditPath)) return null;
    let newest = -1;
    for (const line of readAuditTail(auditPath).split(/\r?\n/)) {
      if (!line.trim()) continue;
      let e;
      try {
        e = JSON.parse(line);
      } catch {
        continue;
      }
      const isCapture =
        e.action === 'created' || (e.action === 'import' && e.reasonCode === 'import-applied');
      if (!isCapture) continue;
      const ms = Date.parse(e.ts);
      if (Number.isFinite(ms) && ms > newest) newest = ms;
    }
    if (newest < 0) return null;
    return new Date(newest).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

// Positioned read of the LAST 64KB of an audit log — recency lives at the
// end; a months-old multi-MB log read in full would pay for history we
// discard, inside the 500ms SessionStart budget. Drops the (possibly torn)
// first line when starting mid-file. Shared by the temporal mention above
// and the status line (Task 145).
function readAuditTail(auditPath) {
  const size = statSync(auditPath).size;
  const start = Math.max(0, size - STATUS_AUDIT_TAIL_BYTES);
  const buf = Buffer.alloc(size - start);
  const fd = openSync(auditPath, 'r');
  try {
    readSync(fd, buf, 0, buf.length, start);
  } finally {
    closeSync(fd);
  }
  return start > 0 ? buf.toString('utf8').replace(/^[^\n]*\n/, '') : buf.toString('utf8');
}

// Importance ranking for value-ordered inject eviction (Task 93 / design §19.3).
// When a tier exceeds its budget we drop the LOWEST-value sections first, not the
// tail. Trust dominates; recency (newest `at`) breaks ties; a section with no
// resolvable provenance ranks as UNKNOWN (between low and medium) so genuinely
// scored content outranks it.
const TRUST_RANK = Object.freeze({ low: 0, medium: 1, high: 2 });
const UNKNOWN_TRUST_RANK = 0.5; // a bullet whose provenance we can't read
function trustRank(trust) {
  return TRUST_RANK[trust] ?? UNKNOWN_TRUST_RANK;
}
function trustLabel(rank) {
  if (rank >= TRUST_RANK.high) return 'high';
  if (rank >= TRUST_RANK.medium) return 'medium';
  if (rank >= UNKNOWN_TRUST_RANK) return 'unknown';
  return 'low';
}

// 14,500 bytes = sum of all per-file caps (13,775: the 12,275 from Task 12/14
// + private.md's 1,500 from Task 148.5) + 725 bytes of headroom for
// inter-tier markers + future modest growth.
// Coordinated with TIER_BUDGETS below per design §7.1 "Snapshot cap
// coordination rule" (2026-05-26 amendment). Raising this requires
// raising one or more TIER_BUDGETS to consume the new headroom; see
// scripts/validate-template.mjs for the build-time invariant check.
const DEFAULT_CAP_BYTES = 14_500;
const HOOK_EVENT_NAME = 'SessionStart';

// Task 75.0 (D-64 / memory-os Layer-07 "Ground Truth", D-73 near-verbatim):
// injecting memory is insufficient — the agent must be TOLD the injected
// context is authoritative, or it re-derives from code what the snapshot
// already answers (the D-40 cold-open failure). This preamble leads every
// non-empty snapshot. It is code-generated (not template-scaffolded) on
// purpose: always present, never consolidated/evicted/graduated, and
// existing installs pick it up on upgrade with no re-scaffold (avoids the
// Task-73 stale-template class).
//
// §7.1 composition: the preamble + its 2 joining newlines must fit the
// 725-byte slack between Σ TIER_BUDGETS (13,775) and DEFAULT_CAP_BYTES
// (14,500) — worst case 13,775 + len + 2 ≤ 14,500, i.e. len ≤ 723. The
// boundary test pins len ≤ 700. injectContext also subtracts the reserve
// from the cap handed to enforceCap, so custom capBytes stay honored.
export const AUTHORITATIVE_MEMORY_PREAMBLE = [
  '# Injected memory — AUTHORITATIVE (core-memory-kit)',
  '',
  'Ground-truth ranking: (1) terminal/tool output → live system state;',
  '(2) THIS snapshot + `cmk search` → documented knowledge & prior decisions;',
  '(3) official docs → version-specifics; (4) training knowledge → verify against 1-3.',
  '',
  'When injected memory contradicts your assumptions, injected memory wins.',
  'Lead with memory — never re-derive from code what it already answers, and',
  'never treat a question as novel when the answer is already in your prompt.',
  'This snapshot is a bounded hot index; `cmk search "<topic>"` reaches the facts not shown here.',
].join('\n');

// --- Task 253(a): the SOURCE-AWARE INJECTION SPLIT --------------------------
//
// Borrowed as an IDEA from obsidian-mind's `session-start.ts` mode split (the
// 2026-07-21 repo note, borrow candidate 3), reimplemented in kit terms.
//
// Claude Code's SessionStart payload carries `source` — PRIMARY-SOURCE verified
// 2026-07-27 against code.claude.com/docs/en/hooks: "How the session started:
// `startup` for new sessions, `resume` for resumed sessions, `clear` after
// /clear, `compact` after compaction, or `fork` for a new session forked from
// an existing one."
//
// On a RESUME the prior transcript is replayed into the model's context, so the
// snapshot injected at session start is ALREADY there. Re-injecting the static
// tier bulk buys nothing and costs its full byte weight every time. Pointer mode
// replaces that bulk with ONE line and keeps everything volatile.
//
// WHAT STAYS INJECTED in pointer mode (the conservative half — when in doubt,
// keep injecting):
//   - the authority preamble  — the instruction that memory outranks assumption
//     (the D-40 under-fire class); cheap, and re-anchoring it costs ~700 B
//   - the existence advertisement (Task 233) — "what there is to search" is
//     MORE valuable, not less, when the bulk is not in front of the model
//   - the temporal mention + commit proposal — genuinely volatile action lines
//     the resumed session has NOT seen (git dirtiness changes as work happens)
// WHAT IS REPLACED: the tier blocks (`body`) — and with them the state-label
// instruction, which only describes labels living inside that body.
//
// `compact` DELIBERATELY KEEPS THE FULL SNAPSHOT — a narrowing of the borrow.
// Anthropic's docs describe compaction as summarizing older history to free
// space ("Claude Code summarizes older history", docs/en/costs), so the
// pre-compaction snapshot is a SUMMARY, not the verbatim text. Pointing at
// content that may have been summarized away would silently cost the session
// its memory — the one failure this kit exists to prevent. Compaction is
// precisely when re-anchoring is worth its bytes.
//
// Everything else — `startup`, `clear`, `fork`, an unknown value, a missing or
// unparseable payload — gets the full snapshot. Fail-open to today's behavior.
export const POINTER_MODE_SOURCES = Object.freeze(['resume']);

// Byte-stable by construction: no count, no clock, no path. The injected prefix
// of a resumed session must be identical to the last one or the prefix cache
// pays for the difference.
export const SNAPSHOT_POINTER =
  '_Memory snapshot unchanged since session start — already in your context, not re-injected. ' +
  'If you cannot see it, `cmk search "<topic>"` reaches every recorded fact._';

/**
 * Which injection mode a SessionStart `source` selects.
 * Anything not explicitly a pointer source is 'full' (fail-open).
 *
 * @param {unknown} source - the hook payload's `source` field, if any.
 * @returns {'full'|'pointer'}
 */
export function injectionModeForSource(source) {
  return typeof source === 'string' && POINTER_MODE_SOURCES.includes(source)
    ? 'pointer'
    : 'full';
}

// The STALE-REPLAY GUARD (Task 234, D-364). Borrowed from ECC's
// `session-start.js:651-671`, which wraps injected prior-session context in
// "HISTORICAL REFERENCE ONLY — NOT LIVE INSTRUCTIONS" after their issue #1534:
// post-compaction the model re-executed an ARGUMENTS-bearing slash command with
// the last arguments it had seen, duplicating issues, branches and tasks.
//
// The kit is MORE exposed than they were. The preamble above says "injected
// memory wins" and "Lead with memory — never re-derive", with NO line between:
//   - DURABLE KNOWLEDGE  ("we decided X", "the user prefers uv") — authoritative
//   - TRANSIENT WORK-STATE (an `Active Threads` bullet naming a task that
//     shipped days ago) — a snapshot of intent, not a standing instruction
// An agent obeying the preamble literally has license to re-run finished work.
//
// The fix is LABELING, NOT DELETION: work-state is genuinely useful for
// resumption. And it must not weaken the durable-fact authority language —
// the D-40/D-153 under-fire class (re-deriving what memory already answers) is
// the opposite failure, and trading one for the other is no win.
//
// Emitted CONDITIONALLY (the STATE_INSTRUCTION pattern) so a snapshot with no
// work-state section carries no extra bytes and no noise.
export const WORK_STATE_SECTIONS = Object.freeze(['Active Threads', 'Pending Decisions']);

// Appended to a work-state section's own heading line, so the caveat is read
// AT the bullets it governs (and costs the rest of the body zero bytes).
export const WORK_STATE_INSTRUCTION =
  '_(work-state as last captured — may already be done; verify before acting, never re-run)_';

/**
 * Annotate every work-state heading in a snapshot body with the stale-replay
 * caveat. Idempotent (an already-annotated heading is left alone) and a no-op
 * when the body carries no work-state section.
 *
 * @param {string} body the assembled snapshot body
 * @returns {string} the body with work-state headings annotated
 */
/** The heading matcher — ONE definition, shared by the counter and the
 *  annotator so the cap reserve can never diverge from what is inserted. */
function workStateHeadingRe(section) {
  const caveat = WORK_STATE_INSTRUCTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^(##[ \\t]+${section})[ \\t]*\\r?$(?!\\r?\\n${caveat})`, 'gm');
}

/**
 * How many work-state headings `annotateWorkStateHeadings` would annotate.
 * Used to size the cap reserve exactly (skill-review: a fixed 2-slot reserve
 * overflowed on a 3-heading body).
 *
 * @param {string} text
 * @returns {number}
 */
export function countWorkStateHeadings(text) {
  if (!text) return 0;
  let n = 0;
  for (const section of WORK_STATE_SECTIONS) {
    n += (text.match(workStateHeadingRe(section)) ?? []).length;
  }
  return n;
}

export function annotateWorkStateHeadings(body) {
  if (!body) return body;
  let out = body;
  for (const section of WORK_STATE_SECTIONS) {
    // Whole-line match on the heading; tolerate CRLF + trailing spaces. The
    // negative lookahead makes this idempotent — an already-annotated heading
    // (caveat on the FOLLOWING line) is skipped, so a body can be re-annotated
    // without stacking duplicates. Preserve the line's OWN ending (skill-review
    // M2: always inserting '\n' silently converted an annotated CRLF pair to LF).
    out = out.replace(workStateHeadingRe(section), (m, heading) =>
      `${heading}${m.endsWith('\r') ? '\r\n' : '\n'}${WORK_STATE_INSTRUCTION}`,
    );
  }
  return out;
}

// Match any line containing a `(P-XXXXXXXX)`-shaped citation id. Looser
// than ID_PATTERN on purpose — alphabet-validation is the writer's job;
// here we just want to recognize "any line that LOOKS like it carries a
// cited bullet" so we can dedup across tiers.
const ID_TOKEN_RE = /\(([PUL])-([A-Za-z0-9]{8})\)/;

// Tier-discovery + which files contribute to the snapshot for each tier.
// Order matters: this is the iteration order, also the snapshot output
// order (highest-priority first per design §7.1).
const TIER_ORDER = ['L', 'P', 'U'];

const TIER_LABELS = {
  L: 'local',
  P: 'project',
  U: 'user',
};

// Per-tier byte budgets (design §7.1, 2026-05-26 coordination amendment).
// Each tier truncates section-by-section to its own budget BEFORE the
// snapshot's total-cap drop step runs. Each budget = EXACT SUM of
// per-file caps in that tier (Task 12/14):
//
//   L = 4500  (machine-paths.md 1500 + overrides.md 1500 + private.md 1500, Task 148.5)
//   P = 4300  (SOUL.md 1800 + MEMORY.md 2500)
//   U = 4975  (USER.md 1375 + HABITS.md 1800 + LESSONS.md 1800)
//   Σ = 13,775 (fits the 14,500 DEFAULT_CAP_BYTES with 725-byte slack)
//
// This is THE STRUCTURAL FIX from PR-25's user-tier truncation finding.
// Per-file caps were specified independently from snapshot cap and
// per-tier budgets in v0.1.0's initial spec; the sums didn't compose,
// so files at their legal caps blew the snapshot. Now per-tier budgets
// derive from per-file caps; snapshot cap derives from the sum.
// scripts/validate-template.mjs asserts this composition rule on every
// `npm test` run so future per-file-cap changes can't silently break it.
const TIER_BUDGETS = Object.freeze({
  L: 4500,
  P: 4300,
  U: 4975,
});

// Per-tier reading plan. The hook reads the scratchpads allowed at that
// tier (per SCRATCHPADS_BY_TIER) plus — for the project tier — the most
// recent rolling-window day file.
//
// INDEX.md is deliberately NOT in the snapshot (#R, 2026-05-30). It is a
// pointer/reference doc that self-declares "NOT auto-loaded at session
// start" in its own template body — injecting it both violated that
// contract and pushed ~2 KB of reference prose into Claude's context,
// crowding out real facts. It stays on disk for lookup via `cmk search` /
// the granular archive; it is not session-start content.
function plannedFilesForTier(tier, tierRoot) {
  const files = [];
  for (const name of SCRATCHPADS_BY_TIER[tier]) {
    files.push(join(tierRoot, name));
  }
  if (tier === 'P') {
    const sessionsDir = join(tierRoot, 'sessions');
    const latest = latestDaySession(sessionsDir);
    if (latest) files.push(latest);
  }
  return files;
}

function latestDaySession(sessionsDir) {
  if (!existsSync(sessionsDir)) return null;
  const candidates = readdirSync(sessionsDir).filter((n) =>
    /^today-\d{4}-\d{2}-\d{2}\.md$/.test(n),
  );
  if (candidates.length === 0) return null;
  // Explicit CODE-UNIT comparator (S2871) — deliberately NOT localeCompare:
  // ISO-dated names make code-unit order chronological, and picking the
  // latest day-file must be deterministic on every machine/locale.
  candidates.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return join(sessionsDir, candidates[candidates.length - 1]);
}

// Walk up from `cwd` looking for a directory with a `context/` child. The
// kit's project-tier root convention is `<repo>/context/`; the walk-up
// matches `git rev-parse --show-toplevel`'s semantics for nested invocations
// (a hook may fire while Claude Code's cwd is in a sub-package).
// Task 168: discovery walks up to the nearest project root, recognizing EITHER
// tier directory — `context/` (committed) OR `context.local/` (gitignored local)
// — so a local-only project resolves correctly, and STOPPING at the home dir so a
// stray `~/context/` can't hijack discovery from an unrelated subdir. Shares the
// single `discoverRootUpward` implementation with resolveMcpProjectRoot (one
// home-boundary + canonicalize algorithm, no drift across the two walkers).
function discoverProjectRoot(cwd) {
  return discoverRootUpward(cwd, ['context', 'context.local']);
}

function tierDirExists(tier, tierRoot) {
  return existsSync(tierRoot) && statSync(tierRoot).isDirectory();
}

// The all-zero sha1 is the kit's template-seed sentinel: every scaffolded
// placeholder bullet (in machine-paths/overrides/SOUL/USER/HABITS/LESSONS)
// carries `sha1: 0000…0000` + `at: 2020-01-01T…`. A real captured fact
// always has a real content sha1. We use this to distinguish "scaffolding
// the user never replaced" from "a fact worth injecting".
const SEED_SHA1_RE = /sha1:\s*0{40}/;

// All HTML-comment handling below uses STRING SCANNING (indexOf/startsWith),
// never a regex tag-filter. Regex-based HTML-comment stripping is fragile by
// nature (it can't see newlines, leaves partial `<!--`, etc. — flagged by
// CodeQL's js/bad-tag-filter). String scanning is both more robust and not a
// tag-filter, so it sidesteps that whole class.

// True if `line`, ignoring surrounding whitespace, is exactly one self-
// contained HTML comment (`<!-- … -->`) — e.g. a per-bullet provenance line.
function isCommentOnlyLine(line) {
  if (typeof line !== 'string') return false;
  const t = line.trim();
  return t.startsWith('<!--') && t.endsWith('-->') && t.length >= 7;
}

// Remove every self-contained `<!-- … -->` span WITHIN a single line, by
// scanning for delimiter pairs. An unterminated `<!--` (no `-->` on this
// line) is left in place for the multi-line state machine to handle.
function stripInlineComments(line) {
  let out = '';
  let i = 0;
  for (;;) {
    const open = line.indexOf('<!--', i);
    if (open === -1) return out + line.slice(i);
    const close = line.indexOf('-->', open + 4);
    if (close === -1) return out + line.slice(i); // unterminated; leave it
    out += line.slice(i, open);
    i = close + 3;
  }
}

// Is `bulletLine` a placeholder/seed bullet that should NOT be injected?
// Primary signal: a following provenance comment carrying the all-zero seed
// sha1 (every scaffolded template bullet has it; a real captured fact never
// does). Secondary: the `(example)` marker — but ONLY in the template's
// exact `(P-XXXXXXXX) (example) …` shape (right after the citation id), so a
// real fact whose text merely mentions "(example)" is not mis-dropped.
function isSeedBullet(bulletLine, nextLine) {
  if (/^\s*-\s+\([PUL]-[A-Za-z0-9]{8}\)\s+\(example\)/.test(bulletLine)) {
    return true;
  }
  const prov = isCommentOnlyLine(nextLine) ? nextLine : '';
  return SEED_SHA1_RE.test(prov);
}

// Remove HTML comments robustly, including the kit templates' multi-line
// format-explanation headers that ILLUSTRATIVELY embed a single-line
// `<!-- source… -->` example inside the outer `<!-- … -->` block (a naive
// "first <!-- to first -->" pass closes on that inner `-->` and orphans the
// tail). We strip inline comments first (killing the nested one) and only
// then walk the now-cleanly-delimited multi-line blocks. All string-scan.
function stripHtmlComments(text) {
  // Pass 1 — remove every self-contained `<!-- … -->` on a single line.
  const lines = text.split('\n').map(stripInlineComments);
  // Pass 2 — remove multi-line blocks (each now free of any inner `-->`).
  const out = [];
  let inBlock = false;
  for (let line of lines) {
    if (inBlock) {
      const close = line.indexOf('-->');
      if (close === -1) continue; // still inside the block; drop the line
      inBlock = false;
      line = line.slice(close + 3);
    }
    const open = line.indexOf('<!--');
    if (open !== -1) {
      inBlock = true;
      line = line.slice(0, open);
    }
    if (line.trim() !== '' || out.length === 0 || out[out.length - 1] !== '') {
      out.push(line.replace(/[ \t]+$/, ''));
    }
  }
  return out.join('\n');
}

// Clean a scratchpad body for INJECTION (not for on-disk storage — the
// files keep their human-editing headers). Self-test finding #R: the raw
// bodies are ~70% template-comment noise + placeholder seed bullets that
// bury (and crowd out) the real captured facts, so the model concludes
// "no real facts populated yet". This strips:
//   1. placeholder seed bullets (all-zero sha1 / `(example)`) + their
//      provenance comment line, and
//   2. ALL remaining `<!-- -->` comments (multi-line format-explanation
//      headers AND per-bullet provenance — the fact text + its `(P-…)`
//      citation id carry everything the model needs to read & cite).
// Whitespace is normalized so stripped regions don't leave holes.
//
// Known limitation (rare): a captured fact whose TEXT contains a literal
// `<!--`/`-->` (e.g. a note about HTML/templating) has that fragment
// stripped from the INJECTED view. The on-disk fact and the search index
// are unaffected — only the session-start snapshot loses the literal
// comment markers. Accepted as a rare edge vs. the cost of distinguishing
// real comments from comment-shaped fact text.
// Task 209 (A-TMA state labels): prefix a bullet whose PROVENANCE carries
// `superseded_by:` with the fixed [superseded] label — run on the RAW body
// BEFORE cleanScratchpadBody strips the provenance comments (the only place
// the state signal exists in a scratchpad). Pure string scanning, no DB —
// safe on the 500ms inject path (§20.3: this LABELS, it never re-orders).
// Idempotent: an already-labeled bullet is left alone. Superseded is the ONLY
// bullet state: tombstoned bullets are stripped from the file, and bullets
// carry no expires_at (66.3 — facts only).
function labelSupersededBullets(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*-\s/.test(lines[i])) continue;
    // Idempotent: an already-labeled bullet is left alone. Match ONLY the real
    // label forms (bare or the Task-232 successor-named form) so a literal
    // `[superseded` in fact prose never blocks labeling.
    if (hasSupersededLabel(lines[i])) continue;
    const next = lines[i + 1];
    if (!isProvenanceCommentLine(next) || !next.includes('superseded_by:')) continue;
    const m = lines[i].match(/^(\s*-\s+(?:\([PUL]-[A-Za-z0-9]{8}\)\s+)?)(.*)$/);
    if (!m) continue;
    // Task 232 (ADR-0023): name the successor from the provenance comment so the
    // snapshot label points at the current fact (`[superseded by P-XXXX]`); fall
    // back to the bare label when the id is absent/malformed.
    const succ = next.match(/superseded_by:\s*([PUL]-[A-Za-z0-9]{8})/);
    const label = succ ? `[superseded by ${succ[1]}]` : STATE_LABELS.superseded;
    lines[i] = `${m[1]}${label} ${m[2]}`;
  }
  return lines.join('\n');
}

function cleanScratchpadBody(body) {
  // Normalize CRLF so user-edited (Windows) scratchpads don't leave stray
  // \r after comment/seed stripping.
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /^\s*-\s/.test(line) &&
      ID_TOKEN_RE.test(line) &&
      isSeedBullet(line, lines[i + 1])
    ) {
      if (isCommentOnlyLine(lines[i + 1])) i++;
      continue;
    }
    kept.push(line);
  }
  // Step 2 — strip all remaining comments (format headers + real-bullet
  // provenance), then normalize whitespace.
  return stripHtmlComments(kept.join('\n'))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

// After cleaning, does a body carry any real content — i.e. a non-blank
// line that isn't a markdown heading? A body of only headings (every
// bullet was a stripped seed) is pure scaffolding and must NOT contribute
// a tier block (otherwise the model sees an empty "## …" skeleton).
function hasRealContent(cleaned) {
  return cleaned
    .split('\n')
    .some((l) => l.trim() !== '' && !/^#{1,6}\s/.test(l));
}

// Scan a RAW scratchpad body for bullet+provenance pairs, recording each
// cited id's trust + capture time into `valueById`. Run on the raw body
// BEFORE cleanScratchpadBody strips the provenance comments — that's the only
// place the trust/recency signal exists, and the importance-aware truncator
// (truncateTierToBudget) needs it to rank sections by value, not file order.
// Note: this records EVERY bullet+provenance pair, including seed bullets (later
// stripped by cleanScratchpadBody) and ids later removed by cross-tier shadowing.
// Those stale entries are inert — truncateTierToBudget only resolves ids on block
// lines that are actually PRESENT, so an orphaned valueById entry is never used.
function collectBulletValues(body, valueById) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*-\s/.test(lines[i])) continue;
    const m = lines[i].match(ID_TOKEN_RE);
    if (!m) continue;
    if (!isProvenanceCommentLine(lines[i + 1])) continue;
    const prov = parseBulletProvenance(lines[i + 1]);
    if (!prov) continue;
    valueById.set(`${m[1]}-${m[2]}`, { trust: prov.trust, at: prov.at });
  }
}

// Read the snapshot-eligible content for one tier. Returns { text, valueById }.
// `text` is the cleaned, injection-ready block (or '' if the tier contributes
// nothing); `valueById` maps each cited id → {trust, at} parsed from the RAW
// bodies (used by the importance-aware budget truncator). Each file body is
// cleaned for injection (see cleanScratchpadBody); files that reduce to
// scaffolding-only contribute nothing, and a tier whose every file is
// scaffolding-only is excluded entirely (no header, no skeleton).
function readTierBlock(tier, tierRoot) {
  const valueById = new Map();
  if (!tierDirExists(tier, tierRoot)) return { text: '', valueById };
  const sections = [];
  for (const path of plannedFilesForTier(tier, tierRoot)) {
    if (!existsSync(path)) continue;
    let body;
    try {
      // Task 257 (D-403/D-404): strip at the READ boundary, once. A scratchpad
      // is a hand-editable file, and a Windows editor's BOM used to travel
      // VERBATIM from here into the injected snapshot — a raw U+FEFF in the
      // model's context. Worse than cosmetic: `truncateTierToBudget` splits
      // sections on /^##\s/ and `hasRealContent` tests /^#{1,6}\s/, both of
      // which a BOM'd heading LINE fails — so a BOM'd first `## ` section was
      // not a section boundary, fell into the always-kept PREAMBLE, and became
      // UN-DROPPABLE. That inverts the §20.3 value-ordered eviction: the
      // un-droppable low-trust section survives while a high-trust one is
      // evicted to make room for it. Stripping HERE fixes all three downstream
      // readers at once (collectBulletValues, hasRealContent, the truncator),
      // which is why the strip belongs at the read and not in three regexes.
      body = stripBom(readFileSync(path, 'utf8'));
    } catch {
      continue;
    }
    if (body.trim() === '') continue;
    collectBulletValues(body, valueById); // raw body — provenance still present
    // Task 209: label superseded bullets BEFORE the provenance strip erases
    // the state signal (labels-not-reranks; see labelSupersededBullets).
    const cleaned = cleanScratchpadBody(labelSupersededBullets(body));
    if (!hasRealContent(cleaned)) continue;
    sections.push(cleaned);
  }
  if (sections.length === 0) return { text: '', valueById };
  const header = `<!-- cmk: ${TIER_LABELS[tier]} tier (${tier}) -->`;
  // Trailing-newline strip via string scan (NOT a `/\n+$/` regex — the `+$`
  // shape trips the ReDoS heuristic, per CLAUDE.md; string-scan is linear and
  // strips only newlines, faithful to the original intent).
  const joined = [header, ...sections].join('\n\n');
  let end = joined.length;
  while (end > 0 && joined[end - 1] === '\n') end--;
  const text = joined.slice(0, end) + '\n';
  return { text, valueById };
}

// Strip duplicate-ID lines from a tier block. Mutates by returning a new
// string. For each id in `seenIds`, find the line containing the id and
// the immediately-following line (if it looks like an HTML-comment
// provenance) and drop both. Records a shadow event for each id stripped.
function stripShadowedIds(tier, block, seenIds, shadowedEvents, ts) {
  if (!block) return block;
  const lines = block.split('\n');
  const kept = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(ID_TOKEN_RE);
    if (m) {
      const id = `${m[1]}-${m[2]}`;
      const prior = seenIds.get(id);
      if (prior && prior !== tier) {
        // Drop this line + (if next is the indented provenance) the next.
        const next = lines[i + 1];
        const isComment = isProvenanceCommentLine(next);
        // Record the shadowing once per (id, shadowed-tier).
        let event = shadowedEvents.find((e) => e.id === id);
        if (!event) {
          event = {
            ts,
            id,
            winner_tier: prior,
            shadowed_tiers: [],
          };
          shadowedEvents.push(event);
        }
        if (!event.shadowed_tiers.includes(tier)) {
          event.shadowed_tiers.push(tier);
        }
        i += isComment ? 2 : 1;
        continue;
      }
      // First sighting — claim it for this tier.
      if (!prior) seenIds.set(id, tier);
    }
    kept.push(lines[i]);
    i++;
  }
  return kept.join('\n');
}

function writeNdjsonLine(logPath, entry) {
  mkdirSync(join(logPath, '..'), { recursive: true });
  appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
}

// Compute one section's aggregate value from its bullets' provenance.
// aggregate trust = the MAX bullet trust in the section (so a section holding
// ANY high-trust bullet is protected before a section that holds none — the
// §19.3 "never evict a high-trust bullet before a lower one" invariant, at
// section granularity). aggregate recency = the NEWEST `at`. A section with no
// resolvable bullets ranks lowest (value -1) so it drops first.
//
// Known limitation (section-granularity, accepted per §7.1.1 + the Task 93
// "whole sections by aggregate value" sanction): MAX-aggregate protects high-
// trust content, but a LOW-trust bullet bundled in the same section as a high-
// trust one survives, while a standalone MEDIUM-trust section can be dropped
// first — a bullet-level inversion. Note the asymmetry with 94.3 graduation,
// which evicts per-BULLET (oldest-first). Bullet-granular inject eviction is the
// stricter v-next option if this matters; for now it keeps §7.1.1 structural
// shape + costs less re-rendering.
function sectionValue(lines, startIdx, endIdx, valueById) {
  let maxTrust = -1;
  let maxAtMs = -1;
  const ids = [];
  for (let i = startIdx; i < endIdx; i++) {
    if (!/^\s*-\s/.test(lines[i])) continue;
    const m = lines[i].match(ID_TOKEN_RE);
    if (!m) continue;
    const id = `${m[1]}-${m[2]}`;
    ids.push(id);
    const v = valueById.get(id);
    const t = v ? trustRank(v.trust) : UNKNOWN_TRUST_RANK;
    if (t > maxTrust) maxTrust = t;
    const atMs = v && v.at ? Date.parse(v.at) : NaN;
    if (!Number.isNaN(atMs) && atMs > maxAtMs) maxAtMs = atMs;
  }
  return { maxTrust, maxAtMs, ids };
}

// Truncate one tier block to fit its budget by dropping whole `## ` sections,
// LOWEST-VALUE first (Task 93 / design §19.3) — superseding the old tail-order
// drop. Section-granular per design §7.1.1 (structural-shape preservation), but
// the eviction ORDER is now importance-aware: lowest aggregate trust first, then
// oldest, then — as a tiebreak among equal-value sections — later-in-file first.
// That tiebreak makes this a strict generalization of the legacy tail-drop: when
// no provenance is present (every section ranks equal) it drops from the end,
// exactly as before. Returns { text, sectionsDropped, droppedSections, preBytes,
// postBytes }.
//
// Anything BEFORE the first `## ` (file headers, top-level title) is the
// "preamble" and always kept; if the preamble alone exceeds budget it's returned
// unchanged (a config problem, but preferable to dropping the header).
function truncateTierToBudget(blockText, budget, valueById = new Map()) {
  const preBytes = Buffer.byteLength(blockText, 'utf8');
  if (preBytes <= budget) {
    return { text: blockText, sectionsDropped: 0, droppedSections: [], preBytes, postBytes: preBytes };
  }
  const lines = blockText.split('\n');
  const headingIdxs = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) headingIdxs.push(i);
  }
  if (headingIdxs.length === 0) {
    // No sections — nothing to drop. Return as-is.
    return { text: blockText, sectionsDropped: 0, droppedSections: [], preBytes, postBytes: preBytes };
  }
  const firstHeading = headingIdxs[0];
  const sections = headingIdxs.map((startIdx, i) => {
    const endIdx = i + 1 < headingIdxs.length ? headingIdxs[i + 1] : lines.length;
    return {
      origIndex: i,
      startIdx,
      endIdx,
      heading: lines[startIdx].replace(/^##\s+/, '').trim(),
      ...sectionValue(lines, startIdx, endIdx, valueById),
    };
  });
  // Drop order: lowest aggregate trust first → oldest first → later-in-file
  // first (the legacy tail tiebreak, so equal-value blocks still drop from the
  // end). High-value sections are evicted only after everything cheaper is gone.
  // 151.5: this IS the value-ordered sweep (high-trust survives, low-trust drops
  // first) — the inject half of ADR-0016 §20.3. 151.6 re-eval RESOLVED (D-238):
  // KEEP the `maxTrust` enum here — adding an index-db trust_score lookup would put
  // DB I/O on the 500ms inject path + rank on an overlay that resets on full reindex
  // (non-deterministic across repair). The evolved score is a FLOOR/protection
  // signal, not a sweep-ranking driver (rank-by-score = the cautionary bug). §20.3.
  const dropOrder = [...sections].sort(
    (a, b) =>
      a.maxTrust - b.maxTrust ||
      a.maxAtMs - b.maxAtMs ||
      b.origIndex - a.origIndex,
  );
  const dropped = new Set();
  const render = () => {
    const keep = [];
    for (let i = 0; i < firstHeading; i++) keep.push(lines[i]); // preamble
    for (const s of sections) {
      if (dropped.has(s.origIndex)) continue;
      for (let i = s.startIdx; i < s.endIdx; i++) keep.push(lines[i]);
    }
    return keep.join('\n');
  };
  let finalText = render();
  for (const s of dropOrder) {
    if (Buffer.byteLength(finalText, 'utf8') <= budget) break;
    dropped.add(s.origIndex);
    finalText = render();
  }
  const droppedSections = sections
    .filter((s) => dropped.has(s.origIndex))
    .map((s) => ({ heading: s.heading, max_trust: trustLabel(s.maxTrust), ids: s.ids }));
  return {
    text: finalText,
    sectionsDropped: dropped.size,
    droppedSections,
    preBytes,
    postBytes: Buffer.byteLength(finalText, 'utf8'),
  };
}

// Enforce per-tier byte budgets (design §7.1.1) by dropping whole `## `
// sections from each tier block's tail. Each truncation emits a
// tier_truncated_to_budget NDJSON event.
//
// AFTER per-tier truncation, if the SUM of kept tier blocks still
// exceeds the snapshot cap (configuration error: Σ budgets > cap),
// fall back to the legacy whole-tier-drop behavior — drops the
// lowest-priority tier wholesale, logged as a dropped_tiers event.
// This shouldn't fire under the documented budget table (1500+4500+
// 4000 = 10000 ≤ 10240 default cap), but the safety net is cheap.
// `reportCapBytes` (Task 75.0): the CALLER-facing cap for Door-4 events.
// injectContext hands enforceCap a cap reduced by the preamble reserve;
// truncation.log must still report the capBytes the user configured, not
// the internal effective value, or the log reads as nonsense (411 when
// the user set 1024).
function enforceCap(orderedBlocks, capBytes, ts, reportCapBytes = capBytes) {
  const tierEvents = [];
  // Step 1: per-tier budget enforcement (section-granular).
  for (const block of orderedBlocks) {
    const budget = TIER_BUDGETS[block.tier];
    if (typeof budget !== 'number') continue; // unknown tier; pass through
    const r = truncateTierToBudget(block.text, budget, block.valueById);
    if (r.sectionsDropped > 0) {
      tierEvents.push({
        ts,
        event: 'tier_truncated_to_budget',
        tier: block.tier,
        budget,
        pre_bytes: r.preBytes,
        post_bytes: r.postBytes,
        sections_dropped: r.sectionsDropped,
        // Door 4 (Task 93): WHICH sections were evicted + WHY (lowest-value
        // first). dropped_sections carries each evicted section's heading, its
        // aggregate trust, and the cited ids it contained.
        strategy: 'importance-ordered',
        dropped_sections: r.droppedSections,
      });
      block.text = r.text;
    }
  }

  // Step 2: total-cap fallback. Drop whole tier blocks from the tail
  // until under capBytes. Shouldn't fire in normal config; the
  // dropped_tiers shape is preserved for back-compat.
  const dropEvents = [];
  let bytes = orderedBlocks.reduce(
    (sum, b) => sum + Buffer.byteLength(b.text, 'utf8'),
    0,
  );
  while (bytes > capBytes && orderedBlocks.length > 0) {
    const dropped = orderedBlocks.pop();
    bytes -= Buffer.byteLength(dropped.text, 'utf8');
    let event = dropEvents[dropEvents.length - 1];
    if (!event) {
      event = { ts, capBytes: reportCapBytes, dropped_tiers: [] };
      dropEvents.push(event);
    }
    event.dropped_tiers.push(dropped.tier);
  }

  return {
    blocks: orderedBlocks,
    truncationEvents: [...tierEvents, ...dropEvents],
  };
}

/**
 * Detached fire-and-forget spawn of the lazy-compress bin. Per design
 * §8.2.2 — non-blocking, hook returns within its 500ms budget while the
 * child runs ambiently. The bin is PATH-resolved when npm-installed
 * globally (`cmk-compress-lazy` declared in package.json `bin:`).
 *
 * Exposed so injectContext can override via dependency injection in tests
 * (testSpawnLazy parameter) — production callers pass nothing.
 */
/**
 * Resolve the path to `bin/cmk-compress-lazy.mjs` from THIS module's location
 * (`src/` → `../bin/`), honoring the $CMK_COMPRESS_LAZY_PATH override. Returns
 * null if it can't be found (→ the shell:true fallback).
 *
 * Why this exists (the cross-agent console-popup fix): the no-popup spawn (Task
 * 81) only kicks in when `injectContext` receives a real `compressLazyPath` —
 * otherwise `lazyCompressSpawnDescriptor` falls to the `shell:true` `.cmd` shim,
 * which flashes a `node` console window on Windows. The Claude Code bin
 * (`cmk-inject-context.mjs`) passed the path; the Kiro `cmk hook agentSpawn`
 * path did NOT, so a real Kiro user got the popup (the cut-gate-kiro live find).
 * Resolving it HERE (in injectContext's default) fixes EVERY caller — Claude
 * bin, Kiro hook, any future agent — not just the ones that remember to pass it.
 */
export function resolveCompressLazyPath() {
  const fromEnv = process.env.CMK_COMPRESS_LAZY_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  try {
    const here = dirname(fileURLToPath(import.meta.url)); // .../packages/cli/src
    const candidate = join(here, '..', 'bin', 'cmk-compress-lazy.mjs');
    return existsSync(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

/**
 * Pure spawn descriptor for the lazy-compress child (Task 81). Separated so the
 * Door-3 contract (node-direct + windowsHide, no shell, when the path is known)
 * is unit-assertable without a real spawn. Path known + present → `node <path>`
 * directly; otherwise the PATH-resolved `.cmd` bin via shell:true (the corrupt-
 * install fallback that may still flash a console on Windows).
 */
export function lazyCompressSpawnDescriptor(projectRoot, compressLazyPath) {
  const baseEnv = { ...process.env, CMK_PROJECT_DIR: projectRoot };
  // Task 253(c): cwd is the OS temp dir, NEVER the project tree. A detached
  // fire-and-forget child outlives this hook and keeps a handle on its working
  // directory; on Windows that handle blocks a later delete/move/rename of the
  // project (the stale-handle class behind the kit's own EPERM-at-teardown
  // races). The child never READ the cwd — cmk-compress-lazy resolves its root
  // from argv[2] ?? CMK_PROJECT_DIR (set right above) — so nothing depends on
  // inheriting it. Named technique borrowed from obsidian-mind's detached
  // re-index spawn (2026-07-21 note, borrow candidate 6).
  //
  // The guard matters: the child falls back to `process.cwd()` when
  // CMK_PROJECT_DIR is absent, so moving cwd to tmpdir without a root to hand
  // over would point it at the temp dir. No root → inherit, as before.
  const cwd = typeof projectRoot === 'string' && projectRoot !== '' ? tmpdir() : undefined;
  if (compressLazyPath && existsSync(compressLazyPath)) {
    return {
      command: process.execPath,
      args: [compressLazyPath],
      options: { detached: true, stdio: 'ignore', cwd, windowsHide: true, env: baseEnv },
    };
  }
  return {
    command: 'cmk-compress-lazy',
    args: [],
    options: { detached: true, stdio: 'ignore', shell: true, cwd, windowsHide: true, env: baseEnv },
  };
}

function spawnLazyCompress(projectRoot, compressLazyPath) {
  try {
    // The lazy-compress child intentionally outlives this hook process;
    // parent-side timeout is incorrect by design — the child carries its
    // own internal timeout via runLazyCompress → daily-distill /
    // weekly-curate → HaikuViaAnthropicApi.compress({timeoutMs: 50_000}).
    // spawn-discipline: ignore detached-fire-and-forget per design §8.5 — same posture as capture-turn.mjs's auto-extract spawn (Task 23).
    //
    // Task 81 (Windows console-popup fix): spawn `node` DIRECTLY on the
    // resolved .mjs. The legacy `shell:true` path resolved the npm `.cmd`
    // shim via cmd.exe (cmd.exe → cmk-compress-lazy.cmd → node), and on
    // Windows `windowsHide:true` hid only the cmd.exe window — NOT the
    // detached `node` grandchild the shim launched, which flashed a visible
    // console at every SessionStart. `process.execPath` + `windowsHide`
    // suppresses it. The shell:true bin-name spawn survives only as a
    // fallback when the path is unknown (corrupt install) — better the
    // legacy popup than losing compression entirely.
    const { command, args, options } = lazyCompressSpawnDescriptor(
      projectRoot,
      compressLazyPath,
    );
    // spawn-discipline: ignore detached fire-and-forget per design §8.5 — the child carries its own internal timeout (runLazyCompress → compress({timeoutMs})); parent-side timeout is incorrect by design.
    const child = spawn(command, args, options);
    child.unref();
    return { spawned: true, pid: child.pid };
  } catch (err) {
    // M2 fix: emit a Door-4 NDJSON entry on spawn failure (PATH miss,
    // EACCES) so users have observability when lazy-compress can't
    // fire. Without this, the only signal is the lazyTrigger.spawned
    // field on the return struct, which Claude Code's hook subsystem
    // doesn't persist. Best-effort write — if the log directory
    // doesn't exist or is unwritable, silently continue (we don't want
    // the hook to fail because we couldn't log a spawn failure).
    try {
      const locksDir = join(projectRoot, 'context', '.locks');
      mkdirSync(locksDir, { recursive: true });
      appendFileSync(
        join(locksDir, 'lazy-compress.log'),
        JSON.stringify({
          ts: nowIso(),
          scope: 'lazy-compress',
          action: 'spawn-failed',
          reason: 'spawn-failed',
          error: err?.message ?? String(err),
        }) + '\n',
        'utf8',
      );
    } catch {
      // best-effort
    }
    return { spawned: false, reason: 'spawn-failed', error: err?.message ?? String(err) };
  }
}

export function injectContext({
  cwd,
  userDir,
  now,
  capBytes,
  // Task 190: the hook payload's session_id, when the caller (the bin) parsed
  // it — attributes the recall-log entry to a session. Optional; null when
  // unknown (a manual run, an older bin).
  sessionId,
  // Task 253(a): the hook payload's `source` (startup|resume|clear|compact|
  // fork). Selects the injection mode — see POINTER_MODE_SOURCES above. Absent
  // / unknown / non-string → 'full', i.e. exactly the pre-253 behavior.
  source,
  // Test-only injection point per spawn-discipline (the production path
  // uses spawnLazyCompress directly). Tests pass a fake to assert
  // "lazy-compress was/was-not triggered" without touching the host.
  testSpawnLazy,
  // Test-only injection seam for the commit-proposal git call (Task 150):
  // under 5x-suite stress load a real `git status` exceeds the 400ms
  // production leash and the proposal correctly degrades to silence, which
  // made presence-asserting tests timing-flaky. Production callers never
  // pass this.
  testGitTimeoutMs,
  // Resolved path to cmk-compress-lazy.mjs (passed by the bin wrapper, which
  // knows the install layout). Lets spawnLazyCompress run `node <path>`
  // directly instead of the shell:true `.cmd` shim — the Windows
  // console-popup fix (Task 81). Absent → self-resolve from this module's
  // location (resolveCompressLazyPath), so EVERY caller gets the no-popup
  // node-direct spawn — not just the Claude bin that passed it explicitly. A
  // caller may still override (e.g. tests). Only a genuinely-unfindable bin
  // (corrupt install) falls to the shell:true descriptor.
  compressLazyPath = resolveCompressLazyPath(),
} = {}) {
  const ts = now ?? nowIso();
  const cap = typeof capBytes === 'number' ? capBytes : DEFAULT_CAP_BYTES;
  const startCwd = cwd ?? process.cwd();
  const projectRoot = discoverProjectRoot(startCwd);
  const resolvedUserDir =
    userDir ??
    process.env.MEMORY_KIT_USER_DIR ??
    join(homedir(), '.core-memory-kit');

  // 1. Read each tier's block in priority order. readTierBlock also returns a
  // per-tier value map (id → trust/recency) parsed from the raw bodies, which
  // the importance-aware budget truncator uses to evict lowest-value first.
  const rawBlocks = TIER_ORDER.map((tier) => {
    const tierRoot =
      tier === 'U'
        ? resolvedUserDir
        : resolveTierRoot({ tier, projectRoot, userDir: resolvedUserDir });
    const { text, valueById } = readTierBlock(tier, tierRoot);
    return { tier, tierRoot, text, valueById };
  }).filter((b) => b.text !== '');

  // 2. Dedup IDs across tiers (highest-priority first).
  const seenIds = new Map();
  const shadowedEvents = [];
  for (const block of rawBlocks) {
    block.text = stripShadowedIds(
      block.tier,
      block.text,
      seenIds,
      shadowedEvents,
      ts,
    );
  }

  // 3. Cap enforcement: drop whole tier blocks from the tail until within
  // capBytes. Each drop emits one truncation event. The authoritative-memory
  // preamble (Task 75.0) is reserved out of the cap up front so the final
  // snapshot (preamble + blocks) still honors capBytes exactly.
  const preambleReserve =
    rawBlocks.length > 0
      ? Buffer.byteLength(AUTHORITATIVE_MEMORY_PREAMBLE, 'utf8') + 2
      : 0;
  // Task 66.4: the temporal-supersede mention rides between the preamble and
  // the body. Reserved OUT of the cap like the preamble (§7.1 composition —
  // caller capBytes stays exact for the tier blocks); one bounded line, empty
  // string when the last week closed no windows (the common case — and then
  // the snapshot is byte-identical to the pre-66.4 shape).
  const temporalMention = rawBlocks.length > 0 ? buildTemporalMention({ projectRoot, ts }) : '';
  const mentionReserve = temporalMention ? Buffer.byteLength(temporalMention, 'utf8') + 2 : 0;
  // Task 150 (ADR-0018): the memory-commit proposal, same reserved-line
  // contract as the temporal mention — but computed UNCONDITIONALLY (no
  // rawBlocks gate): the proposal reflects git dirtiness of context/, which is
  // independent of whether memory is currently injectable. Gating it on a
  // non-empty snapshot dropped it for the brand-new user whose memory index is
  // still empty but whose FIRST uncommitted context/ files just piled up — the
  // exact moment the proposal is most needed (D-264; skill-review B1: the
  // upstream guard, not the concatenation, was the root cause).
  // buildCommitProposal self-gates on .git existence + a zero dirty-count, so
  // this adds no git spawn for non-git projects.
  const commitProposal = buildCommitProposal({ projectRoot, gitTimeoutMs: testGitTimeoutMs });
  const proposalReserve = commitProposal ? Buffer.byteLength(commitProposal, 'utf8') + 2 : 0;
  // Task 233 (ADR-0024): the existence advertisement — a persistent metadata
  // line that rides the AUTHORITATIVE block (only with a body, alongside the
  // preamble). Reserved out of the cap like the other lines (§7.1.2), so adding
  // it can never push the snapshot past capBytes. Computed WITHOUT the sqlite
  // index (§20.3 pin — see buildExistenceAdvertisement).
  const existenceAd = rawBlocks.length > 0 ? buildExistenceAdvertisement({ projectRoot }) : '';
  const existenceReserve = existenceAd ? Buffer.byteLength(existenceAd, 'utf8') + 2 : 0;
  // Task 209: the one-line state-label instruction (A-TMA's prompt half) —
  // reserved out of the cap like the mention/proposal, but only when a raw
  // block actually carries a label (the zero-noise contract: a label-free
  // snapshot is byte-identical to the pre-209 shape). Reserved from RAW
  // blocks, emitted only if a labeled bullet SURVIVES truncation — a
  // truncated-away label may leave a few bytes of unused headroom, which
  // keeps `snapshot ≤ capBytes` strictly true (§7.1.2).
  // Match ONLY the real label forms (bare `[superseded — …]` or the Task-232
  // successor-named `[superseded by P-XXXX]`) — a literal `[superseded` in fact
  // prose must not reserve the instruction line's budget.
  const rawHasStateLabel = rawBlocks.some((b) => hasSupersededLabel(b.text));
  const stateReserve = rawHasStateLabel ? Buffer.byteLength(STATE_INSTRUCTION, 'utf8') + 2 : 0;
  // Task 234: same reserve discipline — budget the work-state guard BEFORE
  // capping, so adding it can never push the snapshot past capBytes (§7.1.2).
  const rawHasWorkState = rawBlocks.some((b) =>
    WORK_STATE_SECTIONS.some((s) => b.text.includes(`## ${s}`)),
  );
  // Reserve from the ACTUAL number of headings the annotator will match, not a
  // fixed 2 (skill-review, CONFIRMED overflow: 3 matching headings against a
  // 2-slot reserve produced 4021 bytes on a 4000 cap). Counted with the SAME
  // regex the annotator uses, so reserve and effect can never disagree — the
  // earlier substring probe required an exact single space while the regex
  // tolerates `[ \t]+`, making non-canonical headings invisible to the reserve.
  const rawWorkStateHeadings = rawBlocks.reduce(
    (n, b) => n + countWorkStateHeadings(b.text),
    0,
  );
  const workStateReserve =
    rawWorkStateHeadings * (Buffer.byteLength(WORK_STATE_INSTRUCTION, 'utf8') + 2);
  const { blocks: keptBlocks, truncationEvents } = enforceCap(
    rawBlocks,
    Math.max(
      0,
      cap - preambleReserve - mentionReserve - proposalReserve - stateReserve - workStateReserve - existenceReserve,
    ),
    ts,
    cap,
  );

  // 4. Concatenate. The preamble leads every non-empty snapshot; an empty
  // snapshot stays empty of AUTHORITATIVE-MEMORY content (don't claim memory
  // with nothing behind it) — BUT the volatile action lines (temporal mention +
  // commit proposal) must survive an empty body: a brand-new user whose memory
  // index is still empty is exactly who has just accrued their first
  // uncommitted context/ files, and the commit proposal is most needed then
  // (D-264 — the empty-but-dirty first-session case; the same "works-with-state,
  // no-ops-from-empty" class as the wedge bootstrap). These lines are their own
  // action prompts, not a claim of authoritative memory, so they ride even with
  // no body — without the preamble (which WOULD over-claim).
  // Task 234 (the stale-replay guard): annotate work-state headings IN PLACE
  // rather than prepending a block. Two reasons, both load-bearing:
  //   1. The marker must travel WITH the content it describes — a heading the
  //      model reads at the moment it reads the bullets beneath it, not a
  //      preamble paragraph 40 lines earlier that a long snapshot buries.
  //   2. A prepended block pushes the user's real facts DOWN. The Task-18
  //      boundary contract ("the real fact sits near the top of the body")
  //      caught exactly that: my first cut moved the first real fact from ~78
  //      to 346 bytes deep. Annotating the heading costs the body nothing above
  //      the work-state section itself.
  const body = annotateWorkStateHeadings(keptBlocks.map((b) => b.text).join('\n'));
  const volatile = `${temporalMention ? temporalMention + '\n\n' : ''}${commitProposal ? commitProposal + '\n\n' : ''}`;
  // Task 209: emit the instruction only when a labeled bullet actually
  // survived into the final body (see the stateReserve note above). Match ONLY
  // the real label forms (bare + the Task-232 successor-named `[superseded by …]`).
  const stateLine = hasSupersededLabel(body) ? `${STATE_INSTRUCTION}\n\n` : '';
  // Task 233: the existence advertisement rides the AUTHORITATIVE block (with a
  // body only), right after the preamble/state line — a persistent knowledge
  // line, ahead of the volatile action prompts.
  const adLine = existenceAd ? `${existenceAd}\n\n` : '';
  // Task 253(a): pointer mode swaps the STATIC bulk (the tier blocks, and with
  // them the state-label instruction that describes labels inside them) for one
  // pointer line. Everything reserved-and-volatile rides unchanged.
  //
  // `fullSnapshot` is kept alongside the emitted one on purpose: in pointer
  // mode the emission is NOT what the model can see — its memory is in the
  // replayed transcript. Anything answering "what does the model have?" (the
  // status line's fact count, the recall log's attribution ids) must read the
  // FULL text; only the byte meter reads the emission. Deriving both from the
  // emission is exactly the bug the live test caught: a resumed session
  // reported "memory is empty" and logged zero recalled ids.
  //
  // `injectionMode` describes what was EMITTED, never what was requested. The
  // pointer is an optimization that can decline itself (see the size + cap
  // guards below), and a label that reported the request would make the
  // recall-log's pointer-vs-full aggregation — the thing that proves the saving
  // — count emissions that never happened.
  const requestedMode = injectionModeForSource(source);
  let injectionMode = 'full';
  let snapshot;
  let fullSnapshot;
  if (body !== '') {
    snapshot = `${AUTHORITATIVE_MEMORY_PREAMBLE}\n\n${stateLine}${adLine}${volatile}${body}`;
    fullSnapshot = snapshot;
    if (requestedMode === 'pointer') {
      const pointerSnapshot = `${AUTHORITATIVE_MEMORY_PREAMBLE}\n\n${adLine}${volatile}${SNAPSHOT_POINTER}`;
      const pointerBytes = Buffer.byteLength(pointerSnapshot, 'utf8');
      // TWO guards, both mandatory:
      //
      // 1. SIZE — the pointer must actually be SMALLER than the bulk it
      //    replaces. On a small corpus it is not: measured on the real bin, a
      //    one-bullet project emits 673 B on startup but 778 B on resume,
      //    because the preamble + advertisement + pointer line outweigh a
      //    two-line body. That inverts the whole premise for exactly the
      //    fresh-install shape, so the optimization declines itself.
      // 2. CAP — the §7.1.2 contract is absolute. The full snapshot is
      //    cap-honoring by construction; the pointer variant is not derived
      //    from enforceCap, so under a pathological tiny cap it could exceed
      //    it. Keep the full one rather than break `snapshot ≤ capBytes`.
      //
      // Either guard rejecting means a FULL emission — and the label below
      // says so.
      if (pointerBytes <= cap && pointerBytes < Buffer.byteLength(fullSnapshot, 'utf8')) {
        snapshot = pointerSnapshot;
        injectionMode = 'pointer';
      }
    }
  } else if (volatile !== '') {
    // Empty memory, but a temporal mention / commit proposal is pending — emit
    // the action line(s) alone (trailing blank lines trimmed), no preamble.
    // Cap guard (re-review minor): under a pathological tiny cap (< the ~300 B
    // proposal; DEFAULT is 13,000) even the action line alone would break the
    // §7.1.2 "snapshot ≤ capBytes exactly" contract — degrade to empty instead.
    const v = volatile.trimEnd();
    snapshot = Buffer.byteLength(v, 'utf8') <= cap ? v : '';
    fullSnapshot = snapshot;
  } else {
    snapshot = '';
    fullSnapshot = '';
  }

  // 5. Persist side-effect logs under <projectRoot>/context/.locks/. We
  // only write the project-tier .locks file (which is the well-known
  // location for cross-tier debug; mirrors audit.log placement).
  const locksDir = join(projectRoot, 'context', '.locks');
  if (shadowedEvents.length > 0) {
    for (const event of shadowedEvents) {
      writeNdjsonLine(join(locksDir, 'shadowed_by.log'), event);
    }
  }
  if (truncationEvents.length > 0) {
    for (const event of truncationEvents) {
      writeNdjsonLine(join(locksDir, 'truncation.log'), event);
    }
  }

  // 6. Task 35 lazy-compress trigger: cheap (<5ms) staleness check.
  // When non-fresh + non-cron-active, detached-spawn `cmk-compress-lazy`
  // so the hook can return within its 500ms NFR-1 budget while the
  // child does the rollup work cron would have done.
  let lazyTrigger = null;
  try {
    const verdict = detectStaleness({ projectRoot, now: ts });
    // Task 159 (D-169): journal-staleness is an INDEPENDENT spawn trigger — the
    // detached lazy worker syncs DECISIONS.md unconditionally, so a session that's
    // compress-fresh (or cron-active) but has new un-journaled decisions must
    // still spawn, else the journal never renders without a clean SessionEnd
    // (the Task-105/D-75 no-clean-exit class). Cron handles compress but NOT the
    // journal, so cron-active + a stale journal SHOULD spawn (compress skips
    // inside, the journal syncs). It is NOT a competing detectStaleness verdict
    // (one verdict → one compress dispatch; folding journal in would suppress
    // compress work — the separately-correct-jointly-broken class).
    const journalStale = isJournalStale(projectRoot);
    lazyTrigger = { verdict: verdict.action, reason: verdict.reason, journalStale };
    const compressStale =
      verdict.action === 'stale-now' ||
      verdict.action === 'stale-daily' ||
      verdict.action === 'stale-weekly';
    if (compressStale || journalStale) {
      const spawner = typeof testSpawnLazy === 'function' ? testSpawnLazy : spawnLazyCompress;
      const spawnResult = spawner(projectRoot, compressLazyPath);
      lazyTrigger = { ...lazyTrigger, ...spawnResult };
    }
  } catch (err) {
    // detectStaleness / isJournalStale should be defensive; if they throw, log + continue.
    lazyTrigger = { verdict: 'error', error: err?.message ?? String(err) };
  }

  // 7. Emit the Anthropic SessionStart hook output shape (design §5.1 +
  // Anthropic hook protocol). When the snapshot is empty, we still emit
  // the shape so downstream tooling can rely on the field's presence.
  //
  // Task 145 (D-130): `systemMessage` is the USER-DISPLAY channel (the
  // D-116 primary-source check: additionalContext is model-facing,
  // systemMessage is shown to the user) — one status line per session
  // start, zero model-token cost. The trust loop every silent system
  // lacks: when the kit works, the user finally SEES it working.
  //
  // Task 253(b): the status line now ends with the INJECTION-SIZE METER — the
  // byte cost of what was just injected. It rides systemMessage on purpose:
  // the snapshot stays byte-identical (prefix-cache + every byte-stability
  // contract untouched), the model pays zero tokens for it, and there is no
  // self-reference to resolve — it measures `snapshot`, a string it is not part
  // of.
  const hookOutput = {
    systemMessage: buildStatusLine({
      // What the model HAS (fact count) vs what we just SENT (the meter) — see
      // the fullSnapshot note above.
      snapshot: fullSnapshot,
      bytes: Buffer.byteLength(snapshot, 'utf8'),
      projectRoot,
      now: ts,
      mode: injectionMode,
    }),
    hookSpecificOutput: {
      hookEventName: HOOK_EVENT_NAME,
      additionalContext: snapshot,
    },
  };

  // 8. RECALL-LOG (Task 190, ADR-0017 Phase 1a): record which ids actually
  // SURVIVED into the snapshot (post-shadowing, post-truncation — extracting
  // from the FINAL text is what makes the attribution truthful). The matcher
  // is the canonical ID_PATTERN's char class (shared-module discipline — no
  // re-rolled alphabet), de-anchored for global scan + boundary-guarded so a
  // longer token (e.g. `…UP-ABCDEFGH…`) can't shed a false id (skill-review
  // M3). GATED on `context/` existing: the plugin's GLOBAL SessionStart hook
  // fires in EVERY repo, and discoverProjectRoot falls back to cwd — without
  // the gate this would scaffold an untracked context/.locks/ tree in non-kit
  // projects at session start (skill-review I2). Best-effort:
  // appendRecallEntry never throws (a diagnostic must not break injection).
  if (existsSync(join(projectRoot, 'context'))) {
    const idScan = new RegExp(
      `(?<![A-Za-z0-9])${ID_PATTERN.source.replace(/^\^|\$$/g, '')}(?![A-Za-z0-9])`,
      'g',
    );
    // Scanned from the FULL text, not the emission: on a resume those ids ARE
    // in the model's context (replayed transcript), so logging the emission's
    // empty set would tell the learn-loop the session recalled nothing and
    // under-attribute every downstream signal (Task 190/192 consumers).
    const injectedIds = [...new Set(fullSnapshot.match(idScan) ?? [])];
    appendRecallEntry(projectRoot, {
      session: sessionId ?? null,
      source: 'inject',
      ids: injectedIds,
      // Task 253(b) — the meter's Door-5 half: the byte cost of every
      // injection, and (253a) which mode produced it, so the token saving is
      // measurable from the log rather than asserted in prose.
      bytes: Buffer.byteLength(snapshot, 'utf8'),
      mode: injectionMode,
    });
  }

  return {
    snapshot,
    hookOutput,
    shadowedEvents,
    truncationEvents,
    lazyTrigger,
    bytes: Buffer.byteLength(snapshot, 'utf8'),
    injectionMode,
  };
}

// --- Task 145: the session-start status line (user-display) -------------

// Tail-read budget for audit.log: recency lives at the end; reading the
// whole file would grow with project age inside a 500ms-budget hook.
const STATUS_AUDIT_TAIL_BYTES = 64 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;
// Derived from the shared ID_PATTERN (tier-paths.mjs) — strip its ^/$
// anchors and wrap in the `(id)` bullet form. One alphabet, one source.
const SNAPSHOT_ID_RE = new RegExp(`\\((${ID_PATTERN.source.slice(1, -1)})\\)`, 'g');

/**
 * One user-facing line summarizing what the kit just did for this session.
 * Best-effort everywhere: a status line must NEVER turn a working hook into
 * a crash — every data source degrades to its zero independently.
 *
 * @param {object} opts
 * @param {string} opts.snapshot - the composed injection snapshot.
 * @param {string} opts.projectRoot
 * @param {string} [opts.now]
 * @param {Function} [opts.listConflictsImpl] - test seam (default: the real queue lister).
 * @param {Function} [opts.listReviewImpl] - test seam.
 * @param {'full'|'pointer'} [opts.mode] - Task 253(a) injection mode; tagged on
 *   the meter only when it is not the default 'full'.
 * @param {number} [opts.bytes] - Task 253(b): the bytes actually EMITTED, when
 *   that differs from `snapshot` (pointer mode passes the full text for the
 *   fact count and the emitted size here). Defaults to `snapshot`'s length.
 * @returns {string} the status line (always a string, never throws).
 */
export function buildStatusLine({
  snapshot,
  projectRoot,
  now,
  listConflictsImpl,
  listReviewImpl,
  mode,
  bytes,
} = {}) {
  const prefix = 'core-memory-kit:';
  // Task 253(b) — the injection-size meter (obsidian-mind's formatInjectionSize
  // idea, kit-shaped). Appended to EVERY return path below, including the
  // catch: a status line that silently drops the cost is the transparency gap
  // this exists to close. Computed defensively — a meter must never be the
  // reason a hook fails.
  const meter = (() => {
    try {
      const emitted =
        typeof bytes === 'number' ? bytes : Buffer.byteLength(String(snapshot ?? ''), 'utf8');
      return ` · snapshot ${emitted} B${mode === 'pointer' ? ' (pointer)' : ''}`;
    } catch {
      return '';
    }
  })();
  try {
    // 1. Unique injected fact ids — what the model can actually see.
    const ids = new Set();
    for (const m of String(snapshot ?? '').matchAll(SNAPSHOT_ID_RE)) ids.add(m[1]);

    if (ids.size === 0) {
      return `${prefix} memory is empty — capture starts this session${meter}`;
    }
    const parts = [`${ids.size} fact(s) in context`];

    // 2. Captures in the last 24h, from the audit-log tail. A capture is a
    // `created` entry or an APPLIED import — `action: 'import'` alone also
    // covers skipped duplicates (reasonCode import-skipped-duplicate), and
    // counting those would let a re-run import inflate the line by its
    // whole dup count (skill-review finding, 2026-06-12).
    const nowMs = Date.parse(now ?? nowIso());
    let recent = 0;
    try {
      const auditPath = join(projectRoot, 'context', '.locks', 'audit.log');
      if (existsSync(auditPath)) {
        // Positioned read of the LAST 64KB only (the shared readAuditTail
        // helper) — recency lives at the end, and this runs inside the
        // 500ms-budget SessionStart hook.
        const tail = readAuditTail(auditPath);
        for (const line of tail.split(/\r?\n/)) {
          if (!line.trim()) continue;
          try {
            const e = JSON.parse(line);
            const isCapture =
              e.action === 'created' ||
              (e.action === 'import' && e.reasonCode === 'import-applied');
            if (
              isCapture &&
              nowMs - Date.parse(e.ts) <= DAY_MS &&
              nowMs - Date.parse(e.ts) >= 0
            ) {
              recent += 1;
            }
          } catch {
            // torn NDJSON line — skip
          }
        }
      }
    } catch {
      // audit log unreadable — the count degrades to absent
    }
    if (recent > 0) parts.push(`${recent} captured in the last 24h`);

    // 3. Pending curation — only mentioned when non-zero (a quiet queue
    // earns a quiet line).
    let conflicts = 0;
    let review = 0;
    try {
      conflicts = (listConflictsImpl ?? listConflictQueue)({ tier: 'P', projectRoot }).length;
    } catch {
      // queue unreadable — degrade to zero
    }
    try {
      review = (listReviewImpl ?? listReviewQueue)({ tier: 'P', projectRoot }).length;
    } catch {
      // queue unreadable — degrade to zero
    }
    if (conflicts > 0 || review > 0) {
      const q = [];
      if (conflicts > 0) q.push(`${conflicts} conflict(s)`);
      if (review > 0) q.push(`${review} review item(s)`);
      parts.push(`${q.join(' + ')} pending — cmk queue`);
    }

    return `${prefix} ${parts.join(', ')}${meter}`;
  } catch {
    // The line is decoration; the snapshot is the cargo. Never crash.
    return `${prefix} memory loaded${meter}`;
  }
}
