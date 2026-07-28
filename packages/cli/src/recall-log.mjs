// recall-log.mjs — which memory IDs surfaced each turn (Task 190, ADR-0017
// Phase 1a, D-252). The learn-loop's ATTRIBUTION primitive: every downstream
// signal (Task 192's tool-result ±, user-correction −, re-ask −) needs to know
// which memories were in play before it can credit or blame one. Precedent:
// memclaw's `related_ids` (the 2026-07-01 learn-loop survey).
//
// Shape: an NDJSON log at <projectRoot>/context/.locks/recall.log — the
// .locks tier is already gitignored (run-time transient state, same class as
// audit.log). One line per surfacing event:
//
//   { session, ts, source: 'inject'|'search'|'hint', ids: [...], query?,
//     form?('static'|'evidence'), origin?('skill'), toolPolicy?,
//     bytes?, mode?('full'|'pointer') }
//
// The optional form/origin/toolPolicy fields (Task 233) are the skill-fire
// telemetry: `form` on a 'hint' entry says which hint fired per prompt;
// `origin` on a 'search' entry marks a skill-driven recall; `toolPolicy`
// records the harness tool-loading population. Downstream 191/192 consumers
// filter on `source` ('search'/'inject'), so a 'hint' entry is inert to them.
//
// IDs + query only — never fact bodies. The `query` field IS user-typed text,
// so this is not content-free — the posture holding it is the file's class:
// a gitignored `.locks` local diagnostic (same as extract.log's turn
// snippets), never a committed tier, so Poison_Guard doesn't gate it. Append
// is BEST-EFFORT: it runs inside the SessionStart hook and the search hot
// path, so it must never throw (a broken diagnostic must not break injection
// — the same posture as audit-log.mjs).
//
// Writers: injectContext (source:'inject', the snapshot's surviving citation
// ids, with the hook payload's session_id) and search() (source:'search',
// the returned ids — gated on the caller passing projectRoot, so bare/legacy
// calls stay pure). NOTE for Task 191/192 consumers: production `search`
// entries carry `session: null` — the CLI/MCP callers have no hook payload;
// join inject↔search by timestamp window, never assume the field is set.
// Reader: readRecallLog — Task 191/192 resolve expectations against it.
// Rotation: none at runtime (the audit.log posture — design §16.13 covers
// both when it ships); growth is ~1 line/session-start + 1/search.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function recallLogPath(projectRoot) {
  return join(projectRoot, 'context', '.locks', 'recall.log');
}

/**
 * Append one surfacing event. Best-effort: returns { ok:false } on any
 * filesystem failure instead of throwing (hook-path safety).
 *
 * @param {string} projectRoot
 * @param {object} entry
 * @param {string|null} [entry.session] - hook payload session_id when known.
 * @param {string} entry.source - 'inject' | 'search' | 'hint'.
 * @param {string[]} [entry.ids] - the observation ids that surfaced.
 * @param {string} [entry.query] - the search/hint query text.
 * @param {string} [entry.form] - hint form ('static' | 'evidence'), source:'hint' only (Task 233).
 * @param {string} [entry.origin] - recall origin tag ('skill' | …), source:'search' only (Task 233 skill-fire telemetry).
 * @param {boolean} [entry.error] - source:'hint' only: the evidence query errored (≠ a genuine no-match) (Task 233).
 * @param {string} [entry.toolPolicy] - harness tool-loading policy; defaults to $CMK_HARNESS_TOOL_POLICY when set (P-DXPCKAUU).
 * @param {number} [entry.bytes] - source:'inject' only: injected snapshot bytes (Task 253 meter).
 * @param {string} [entry.mode] - source:'inject' only: 'full' | 'pointer' (Task 253 source-aware split).
 * @returns {{ ok: boolean }}
 */
export function appendRecallEntry(
  projectRoot,
  { session = null, source, ids = [], query, form, origin, error, toolPolicy, bytes, mode } = {},
) {
  try {
    const line = {
      session,
      ts: new Date().toISOString(),
      source,
      ids,
    };
    if (query !== undefined) line.query = query;
    // Task 233 — skill-invocation telemetry (Door 5): the fire-rate the
    // ADR-0024 success criterion measures is derivable from these fields.
    // `form` distinguishes a static from an evidence-bearing hint fire;
    // `origin` marks a skill-originated search (via `cmk search --source
    // skill` / `mk_search {source:'skill'}`). Both are added ONLY when the
    // caller sets them, so an ordinary inject/search entry stays byte-shape
    // identical to the pre-233 record (no reader breakage).
    if (form !== undefined) line.form = form;
    if (origin !== undefined) line.origin = origin;
    if (error !== undefined) line.error = error;
    // The harness tool-loading policy dimension (P-DXPCKAUU: deferred-tools
    // harnesses are a different population). Recorded when trivially available
    // — the caller passes it, or the cut-gate exports CMK_HARNESS_TOOL_POLICY.
    const resolvedPolicy = toolPolicy ?? process.env.CMK_HARNESS_TOOL_POLICY;
    if (resolvedPolicy) line.toolPolicy = resolvedPolicy;
    // Task 253 — the injection meter's durable half: byte cost + injection mode
    // per SessionStart. Added ONLY when the caller sets them, so a 'search' /
    // 'hint' entry stays byte-shape identical to the pre-253 record.
    if (bytes !== undefined) line.bytes = bytes;
    if (mode !== undefined) line.mode = mode;
    const path = recallLogPath(projectRoot);
    mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
    appendFileSync(path, `${JSON.stringify(line)}\n`, 'utf8');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Read the log back, oldest first. Corrupt lines are skipped (an interrupted
 * append must not poison the whole log). Optional session filter.
 *
 * @param {string} projectRoot
 * @param {object} [opts]
 * @param {string} [opts.session] - return only this session's entries.
 * @returns {Array<object>}
 */
export function readRecallLog(projectRoot, { session } = {}) {
  const path = recallLogPath(projectRoot);
  if (!existsSync(path)) return [];
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return [];
  }
  const entries = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch {
      // corrupt/partial line — skip, keep reading.
    }
  }
  if (session !== undefined) return entries.filter((e) => e.session === session);
  return entries;
}
