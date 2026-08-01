// health-log.mjs — the kit's own failure-event store + the Warnable-shaped
// failure registry (Task 250, D-412; design §23).
//
// WHY THIS EXISTS. The kit fails SILENTLY by design: every hook path is
// fail-open (a broken capture must never break the user's prompt), so a
// wedged agent CLI, a repeatedly-timing-out extraction, or a crashed
// precompact worker all present as "nothing happened." Users do not run
// `cmk doctor` (U-U5PPSG7Y), so a silent failure can cost weeks of memory
// before anyone notices. This module is the evidence store that lets the
// per-prompt hook WHISPER the failure to the agent working alongside it.
//
// THE SHAPE (ratified 2026-07-29, D-412 — the grill's 8 points):
//   - ONE append-only NDJSON log at <projectRoot>/context/.locks/health.log
//     (the gitignored run-time-state tier — same class as audit.log /
//     recall.log / poison-guard.log). Instrumented ops append BOTH outcomes,
//     `ok` and `fail`; a success is what CLEARS a warning, so it must be
//     recorded as deliberately as a failure.
//   - EVENT-DRIVEN ONLY. Nothing here probes the environment. A deterministic
//     condition (the agent CLI is missing) enters the log when a real op hits
//     it — never by the hot path going looking. This is what keeps the
//     per-prompt read to one bounded file tail.
//   - NO SIDECAR STATE. The active-warning set is DERIVED from the log tail on
//     every read (ADR-0002: state is derived from artifacts, never mirrored
//     into a second writable file). A Warnables-style read-modify-write state
//     map was explicitly REJECTED at the grill as the two-writer hazard — and
//     Tailscale's own stuck-warning bug (#19241) is what statefulness invites.
//     Self-clean is STRUCTURAL here: fix the thing → the next run appends `ok`
//     → the streak resets → the whisper is gone. Nothing has to clean up.
//
// THE REGISTRY is the Tailscale `Warnable` struct, kit-shaped (the borrow is
// recorded in docs/research/2026-07-29-self-healing-cli-repair-ux.md §3):
// `code` (stable id, the key the troubleshooting skill's repair book is
// sectioned by), `title` (the one line a human/agent reads), `severity`,
// `dependsOn` (cascade dedup — one root cause, one whisper), `primaryAction`
// (the exact command), `fixClass` (how the skill may apply the fix), plus the
// kit's two additions: `deterministic` + `strikeThreshold` (the noise gate,
// Tailscale's `TimeToVisible` in strikes rather than seconds — the kit's
// failures are discrete events, not a continuously-observable condition).
//
// EXTENDING IT (D-412 point 8): a new failure class is a registry entry + the
// instrumented site that appends its two outcomes + a repair-book section in
// the troubleshooting skill. Task 258's `stale-refs` scan enters here as an
// `advisory` once its noise floor is measured — the registry is the seam.
//
// EVERYTHING IS BEST-EFFORT. Both the writer and the reader run on hook paths.
// `appendHealthEntry` returns `{ok:false}` rather than throwing;
// `activeWarnings` returns `[]` on any read/parse failure. A broken health log
// degrades to "healthy", never to a broken hook — the same posture as
// audit-log.mjs and recall-log.mjs.

import { closeSync, existsSync, mkdirSync, openSync, appendFileSync, fstatSync, readSync } from 'node:fs';
import { join } from 'node:path';

export const HEALTH_LOG_SCHEMA_VERSION = 1;

/** Valid `outcome` values. Anything else is a caller bug and is rejected. */
export const HEALTH_OUTCOMES = Object.freeze(['ok', 'fail']);

/**
 * How much of the log tail the hot path reads. The whisper is a per-prompt
 * cost, so the read is BOUNDED rather than whole-file: 16 KB is ~100-200
 * entries, far more than any live streak needs, and it is a single positional
 * read. The trade is deliberate and stated: evidence older than the tail
 * window is invisible to the whisper. That is correct behavior, not a gap —
 * a failure whose last 16 KB of subsequent activity contains no trace of it
 * is not a CURRENT failure.
 */
export const HEALTH_TAIL_BYTES = 16_384;

/**
 * The freshness window (D-412 point 2). Evidence older than this never
 * whispers, however long the streak: a project resumed after a fortnight must
 * not be greeted by a warning about a failure that may long since have been
 * fixed by an environment change nobody logged. Keyed on the NEWEST fail in
 * the streak — "is it still broken NOW", not "when did it start".
 */
export const HEALTH_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

/** Severity ordering — drives "multiple active → highest severity + count". */
export const SEVERITY_RANK = Object.freeze({
  'memory-off': 3, // the kit is effectively not capturing; silence loses sessions
  degraded: 2, // a real capability is down, but memory is still accruing
  advisory: 1, // worth knowing, nothing is broken
});

/** Stable failure codes. These are the troubleshooting skill's section keys. */
export const HEALTH_CODES = Object.freeze({
  AGENT_CLI_MISSING: 'agent-cli-missing',
  EXTRACT_FAILING: 'extract-failing',
  INJECT_FAILING: 'inject-failing',
  PRECOMPACT_FAILING: 'precompact-failing',
  INDEX_DRIFT: 'index-drift',
  MCP_TOOL_FAILING: 'mcp-tool-failing',
});

/**
 * The wave-1 registry (D-412 point 7).
 *
 * `deterministic` is the load-bearing field and it means exactly one thing:
 * CAN THIS CONDITION TRANSIENTLY RECOVER ON ITS OWN? A missing binary cannot
 * (it is missing until someone installs it) → 1 strike. A spawn timeout can
 * (the machine was busy) → 2 consecutive strikes with no success between.
 * `strikeThreshold` is therefore derived, not independently chosen, and a test
 * pins the two together so they can never drift apart.
 *
 * `fixClass` follows the observed industry split (the research note's §1
 * table) and tells the troubleshooting skill how much authority it has:
 *   'silent'  — kit-owned, idempotent, reversible; the skill may just run it.
 *   'confirm' — touches user-owned state; PROPOSE it, one-tap approve (ADR-0018).
 *   'advise'  — expensive or outside the kit's authority; print the command.
 * Per D-412 point 1, an unknown class defaults to the cautious end. There is
 * no auto-fix path in this module: nothing here repairs anything, it only
 * records and reports.
 */
export const HEALTH_REGISTRY = Object.freeze({
  [HEALTH_CODES.AGENT_CLI_MISSING]: Object.freeze({
    code: HEALTH_CODES.AGENT_CLI_MISSING,
    title: "the agent's backend CLI could not be launched (automatic capture is off)",
    severity: 'memory-off',
    dependsOn: Object.freeze([]),
    primaryAction: 'cmk doctor',
    fixClass: 'advise', // installing someone's agent CLI is outside the kit's authority
    strikeThreshold: 1,
    deterministic: true,
  }),
  [HEALTH_CODES.EXTRACT_FAILING]: Object.freeze({
    code: HEALTH_CODES.EXTRACT_FAILING,
    title: 'auto-extract keeps failing; turns are not being captured',
    severity: 'memory-off',
    dependsOn: Object.freeze([HEALTH_CODES.AGENT_CLI_MISSING]),
    primaryAction: 'cmk doctor',
    fixClass: 'advise',
    strikeThreshold: 2,
    deterministic: false, // Haiku timeouts / API blips genuinely recover
  }),
  [HEALTH_CODES.INJECT_FAILING]: Object.freeze({
    code: HEALTH_CODES.INJECT_FAILING,
    title: 'the session-start memory snapshot is failing; recall may be incomplete',
    severity: 'degraded',
    dependsOn: Object.freeze([]),
    primaryAction: 'cmk doctor',
    fixClass: 'advise',
    strikeThreshold: 2,
    deterministic: false,
  }),
  [HEALTH_CODES.PRECOMPACT_FAILING]: Object.freeze({
    code: HEALTH_CODES.PRECOMPACT_FAILING,
    title: 'the pre-compaction capture keeps failing; long sessions may lose work',
    severity: 'degraded',
    dependsOn: Object.freeze([HEALTH_CODES.AGENT_CLI_MISSING]),
    primaryAction: 'cmk doctor',
    fixClass: 'advise',
    strikeThreshold: 2,
    deterministic: false,
  }),
  [HEALTH_CODES.INDEX_DRIFT]: Object.freeze({
    code: HEALTH_CODES.INDEX_DRIFT,
    title: 'the memory INDEX is behind the fact archive; recall may miss recent facts',
    severity: 'advisory',
    dependsOn: Object.freeze([]),
    primaryAction: 'cmk reindex',
    fixClass: 'silent', // kit-owned, idempotent, rebuilds a derived view
    strikeThreshold: 1,
    deterministic: true, // a stale INDEX stays stale until something rebuilds it
  }),
  [HEALTH_CODES.MCP_TOOL_FAILING]: Object.freeze({
    code: HEALTH_CODES.MCP_TOOL_FAILING,
    title: 'the cmk MCP memory tools keep erroring; use the cmk CLI meanwhile',
    severity: 'degraded',
    dependsOn: Object.freeze([]),
    primaryAction: 'cmk doctor',
    fixClass: 'advise',
    strikeThreshold: 2,
    deterministic: false,
  }),
});

/**
 * Is this error "the binary isn't there" rather than "the call went wrong"?
 *
 * THE one discriminator the whole noise gate rests on: a missing executable
 * cannot transiently recover, so it whispers on the first strike, while a
 * timeout or an API error must not nag on a single blip. Shared here rather
 * than re-sniffed at each instrumented site (the shared-module discipline) —
 * three call sites need exactly this judgement and a drifted copy would put
 * two failure classes on different thresholds for the same root cause.
 *
 * Node surfaces a failed exec as `code: 'ENOENT'` on the async `error` event
 * (which is how the compressor's `child.on('error')` rejects it). The message
 * fallback covers an error that crossed a boundary which dropped the property
 * — a wrapped/serialized rejection.
 */
export function isBinaryMissingError(err) {
  if (!err) return false;
  if (err.code === 'ENOENT') return true;
  const msg = typeof err.message === 'string' ? err.message : String(err);
  return /\bENOENT\b/.test(msg);
}

/** `<projectRoot>/context/.locks/health.log` — the gitignored run-state tier. */
export function healthLogPath(projectRoot) {
  return join(projectRoot, 'context', '.locks', 'health.log');
}

/**
 * Append one outcome. Instrumented sites call this on BOTH the success and the
 * failure path — an `ok` is what clears a warning, so it is not optional.
 *
 * Rejects an unregistered class or a non-`ok`/`fail` outcome rather than
 * writing it: an unreadable class would sit in the log forever contributing
 * nothing, and the reader would have to guess its semantics.
 *
 * @param {string} projectRoot
 * @param {object} entry
 * @param {string} entry.class - a HEALTH_CODES value.
 * @param {'ok'|'fail'} entry.outcome
 * @param {string} [entry.detail] - short machine-ish reason (an error category, a code). NEVER user content.
 * @returns {{ok: boolean}} best-effort; never throws.
 */
export function appendHealthEntry(projectRoot, { class: cls, outcome, detail } = {}) {
  try {
    if (typeof projectRoot !== 'string' || projectRoot === '') return { ok: false };
    if (!HEALTH_REGISTRY[cls]) return { ok: false };
    if (!HEALTH_OUTCOMES.includes(outcome)) return { ok: false };
    // NEVER SCAFFOLD A MEMORY TIER. The instrumented sites run on ordinary hook
    // paths in arbitrary directories, so a recursive mkdir on the way to the log
    // would silently create `context/` in a repo that never installed the kit —
    // the Task-190 non-kit-project gate, and precisely the shape of a diagnostic
    // changing state it has no business touching. The health log describes a kit
    // INSTALLATION; where there is none there is nothing to describe.
    if (!existsSync(join(projectRoot, 'context'))) return { ok: false };
    const line = {
      ts: new Date().toISOString(),
      schema: HEALTH_LOG_SCHEMA_VERSION,
      class: cls,
      outcome,
    };
    // Omitted rather than null-written: the line is appended on every
    // instrumented op, so it stays minimal on the success path.
    if (detail !== undefined && detail !== null && detail !== '') line.detail = String(detail).slice(0, 200);
    mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
    appendFileSync(healthLogPath(projectRoot), `${JSON.stringify(line)}\n`, 'utf8');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Read the last `maxBytes` of the log as parsed entries, oldest first.
 *
 * Bounded by construction: one positional read of the file's tail, never the
 * whole file. When the read was truncated, the FIRST line is discarded — it is
 * a byte-slice of some earlier record and would either fail to parse or, worse,
 * parse into something wrong.
 *
 * Corrupt lines (an interrupted append) are skipped, matching the recall-log
 * posture: one bad line must not poison the log.
 *
 * @returns {Array<object>} [] on any failure — a missing, unreadable, or
 * garbage log reads as "no evidence", i.e. healthy.
 */
export function readHealthTail(projectRoot, { maxBytes = HEALTH_TAIL_BYTES } = {}) {
  let fd;
  try {
    const path = healthLogPath(projectRoot);
    if (!existsSync(path)) return [];
    fd = openSync(path, 'r');
    const size = fstatSync(fd).size;
    if (size === 0) return [];
    const length = Math.min(size, maxBytes);
    const start = size - length;
    const buf = Buffer.allocUnsafe(length);
    const read = readSync(fd, buf, 0, length, start);
    let text = buf.toString('utf8', 0, read);
    // Truncated read → the head line is a fragment of an earlier record.
    if (start > 0) {
      const nl = text.indexOf('\n');
      text = nl === -1 ? '' : text.slice(nl + 1);
    }
    const out = [];
    for (const raw of text.split('\n')) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') out.push(parsed);
      } catch {
        // interrupted/partial append — skip, keep reading.
      }
    }
    return out;
  } catch {
    return [];
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        /* best-effort close */
      }
    }
  }
}

/**
 * THE SEMANTICS (D-412 points 2 + 3), as a PURE function over log entries.
 *
 * Pure on purpose: every edge here (the strike boundary, the freshness
 * boundary, the cascade) is testable without a filesystem, and the hot-path
 * wrapper below is then a thin reader. No environment probing happens at any
 * point — the verdict is a function of what the log already says.
 *
 * Per class, newest-backwards:
 *   1. count CONSECUTIVE `fail` entries; the first `ok` stops the count
 *      (a success resets the streak — that IS the self-clean mechanism);
 *   2. the streak must reach the class's `strikeThreshold`
 *      (deterministic → 1, stochastic → 2);
 *   3. the NEWEST fail must be within HEALTH_FRESHNESS_MS of `now`.
 * Then cascade: a warning whose `dependsOn` names an ACTIVE code is dropped,
 * so one root cause produces one whisper.
 *
 * @param {Array<object>} entries - as returned by readHealthTail.
 * @param {object} [opts]
 * @param {string|number|Date} [opts.now]
 * @returns {Array<{code,title,severity,primaryAction,fixClass,strikes,brokenSince}>}
 *          most-severe first.
 */
export function computeActiveWarnings(entries, { now } = {}) {
  // Parsed defensively rather than via `new Date(now).toISOString()`, which
  // THROWS a RangeError on an unparseable value — in a module whose entire
  // contract is "a broken diagnostic degrades to healthy", the one pure function
  // must not be the thing that throws.
  let nowMs;
  if (now === undefined || now === null) nowMs = Date.now();
  else if (now instanceof Date) nowMs = now.getTime();
  else if (typeof now === 'number') nowMs = now;
  else nowMs = Date.parse(String(now));
  if (!Array.isArray(entries) || entries.length === 0 || !Number.isFinite(nowMs)) return [];

  // Bucket the well-formed, registry-known, dated entries per class.
  const byClass = new Map();
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    if (!HEALTH_REGISTRY[e.class]) continue; // unknown/newer code — ignore, don't guess
    if (!HEALTH_OUTCOMES.includes(e.outcome)) continue;
    const ms = typeof e.ts === 'string' ? Date.parse(e.ts) : NaN;
    if (!Number.isFinite(ms)) continue;
    if (!byClass.has(e.class)) byClass.set(e.class, []);
    byClass.get(e.class).push({ ms, ts: e.ts, outcome: e.outcome });
  }

  const candidates = [];
  for (const [code, rows] of byClass) {
    // `ts` is the truth, not file order — an out-of-order append (two writers,
    // clock skew) must not silently invert a streak.
    rows.sort((a, b) => a.ms - b.ms);
    let strikes = 0;
    let brokenSince = null;
    let newestFailMs = null;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].outcome !== 'fail') break; // the first success ends the streak
      strikes += 1;
      brokenSince = rows[i].ts;
      if (newestFailMs === null) newestFailMs = rows[i].ms;
    }
    const w = HEALTH_REGISTRY[code];
    if (strikes < w.strikeThreshold) continue;
    if (newestFailMs === null || nowMs - newestFailMs > HEALTH_FRESHNESS_MS) continue;
    candidates.push({
      code: w.code,
      title: w.title,
      severity: w.severity,
      primaryAction: w.primaryAction,
      fixClass: w.fixClass,
      strikes,
      brokenSince,
    });
  }

  // Cascade dedup — computed against the pre-cascade active set, so a chain
  // (A suppresses B suppresses C) collapses to its ROOT in one pass rather
  // than depending on iteration order.
  const active = new Set(candidates.map((c) => c.code));
  const surviving = candidates.filter((c) => !HEALTH_REGISTRY[c.code].dependsOn.some((dep) => active.has(dep)));

  surviving.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
  );
  return surviving;
}

/**
 * The hot-path wrapper: read the bounded tail, compute the verdict.
 * Fail-open — any error reads as healthy.
 */
export function activeWarnings(projectRoot, { now, maxBytes } = {}) {
  try {
    return computeActiveWarnings(readHealthTail(projectRoot, { maxBytes }), { now });
  } catch {
    return [];
  }
}
