// Canonical audit-log writer for every kit module that mutates state.
// Per the Layer-2 review's I4 finding, the three writers (writeFact-skipped,
// forget, merge-facts) had been writing to the same <tierRoot>/.locks/audit.log
// in three different schemas — `path` vs `originalPath` vs `newPath`; `reason`
// overloaded as enum vs free-text; `tier` missing from writeFact entries.
//
// This module is the single sanctioned audit-log writer. New writers (Task 24
// memory-write, Task 15 trust override, etc.) MUST import appendAuditEntry
// from here. See CLAUDE.md "Shared modules" rule.
//
// Schema v1 (canonical):
//   {
//     ts: ISO 8601 UTC,
//     schema: 1,
//     action: enum string,
//     tier: 'P' | 'L' | 'U',
//     id: citation ID of the affected fact,
//     reasonCode: enum string (machine-parseable),
//     reasonText?: free-form string (human-readable, optional),
//     paths?: { before?, after?, archive? } where each value is string|string[],
//     extra?: object (action-specific extension fields)
//   }

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const AUDIT_LOG_SCHEMA_VERSION = 1;

// Enum of reasonCode values seen in v0.1. New writers may add codes here as
// they come online; the rule is one canonical machine-parseable token per
// kind of audit event (not a free-text reason field).
export const REASON_CODES = Object.freeze({
  FACT_CREATED: 'fact-created', // writeFact: a new fact file was written (Task 123.A — the default create audit; callers emitting a richer code opt out via audit:false)
  DUPLICATE: 'duplicate', // writeFact: same path + same id
  DUPLICATE_ELSEWHERE: 'duplicate-elsewhere', // writeFact: different path + same id
  RECURRENCE: 'recurrence', // writeFact: a duplicate write = the same canonical fact re-surfaced → recurrence_count bumped (Task 151.1, ADR-0016 — the capped-recurrence promotion signal)
  INDEX_REBUILD_FAILED: 'index-rebuild-failed', // writeFact: the fact landed on disk but the best-effort INDEX.md rebuild threw (e.g. a detached auto-extract child killed mid-rebuild). Surfaces what was previously a SILENTLY swallowed catch (D-152) so a lagging committed INDEX is diagnosable; the next reindex/cmk reindex self-heals. ALSO emitted by `cmk autolink` (Task 262 / D-447) when its in-band post-run `reindexBoot` throws — the same event kind (durable write landed, best-effort index refresh failed), so it shares the code rather than minting a near-duplicate; `extra.error` carries the reason and consumers disambiguate on `action`.
  BACKFILL_INCOMPLETE: 'backfill-incomplete', // `cmk autolink` (Task 262 / D-447): the to-completion loop ended in a state it could not make progress from — `extra.stopped` is 'stalled' (a batch reported work remaining but considered nothing, or `remaining` failed to fall) or 'batch-cap' (more batches than the first batch's own arithmetic allows for). NOT written for a REFUSAL (a degenerate or underivable floor): nothing went wrong there, the corpus simply is not linkable yet. This is the artifact behind the CLI's "if this repeats please report it".
  AUTO_LINKED: 'auto-linked', // write-time linking (Task 262, ADR-0023): the new fact's `related:` frontmatter was auto-populated. `extra` carries the backend, the DERIVED floor, and one {id, slug, score, band} per applied edge — the observability the flag's A/B measurement reads.
  USER_REQUESTED: 'user-requested', // forget: user-initiated tombstone
  CURATED_MERGE: 'curated-merge', // mergeFacts: explicit merge of A + B → C
  TEMPORAL_SUPERSEDE: 'temporal-supersede', // validity-window: a newer fact superseded an older CURRENT-STATE claim → window closed at the newer created_at (Task 66.2, D-259)
  SCRATCHPAD_APPEND: 'scratchpad-append', // scratchpad: appendScratchpadBullet (Task 12)
  SCRATCHPAD_GRADUATED: 'scratchpad-graduated', // graduation: high-trust bullet moved out to a fact file under cap pressure (Task 91.1)
  SCRATCHPAD_EVICTED: 'scratchpad-evicted', // consolidate: stale low/medium bullet dropped under cap pressure, archived to memory/archive/evicted-bullets.md (Task 91.2)
  TRUST_CHANGE: 'trust-change', // trust: overrideTrust (Task 15)
  TRUST_SIGNAL_REINFORCE: 'reinforce', // trust-signal: a screened passive reinforce applied a trust_score delta (Task 193)
  TRUST_SIGNAL_DAMPEN: 'dampen', // trust-signal: a screened passive dampen applied a trust_score delta (Task 193)
  CONFLICT_QUEUED: 'conflict-queued', // conflict-queue: new write contradicts existing higher-trust fact, routed to queues/conflicts.md (Task 25, design §6.8)
  CONFLICT_RESOLVED: 'conflict-resolved', // conflict-queue: user resolved a pending conflict via cmk queue conflicts (keep-old / keep-new / merge-both)
  REVIEW_PROMOTED: 'review-promoted', // review-queue: user promoted a medium-trust auto-extract to MEMORY.md (Task 26, design §6.2)
  REVIEW_DISCARDED: 'review-discarded', // review-queue: user discarded a medium-trust auto-extract via cmk queue review
  IMPORT_APPLIED: 'import-applied', // import-anthropic-memory: bullet applied to project MEMORY.md with write_source:imported (Task 38). ALSO emitted by import-sessions (Task 225, action:'import-session') — consumers disambiguate on `action`.
  IMPORT_SKIPPED_DUPLICATE: 'import-skipped-duplicate', // import-anthropic-memory: candidate canonicalize-matched existing fact, skipped (Task 38)
  IMPORT_SCREENED: 'import-screened', // import-sessions: a session's summary was rejected by screenBeforeCommittedWrite — recorded (ledger status:screened) so re-runs don't re-buy the summary (Task 225)
  IMPORT_SKIPPED_EMPTY: 'import-skipped-empty', // import-sessions: session had zero text turns after the extract filter; ledgered so re-runs skip it without a backend call (Task 225)
  REPAIR_HOOKS_APPLIED: 'repair-hooks-applied', // cmk repair --hooks: settings.json updated with canonical kit hooks (Task 39)
  REPAIR_HOOKS_NOOP: 'repair-hooks-noop', // cmk repair --hooks: settings.json already canonical, no-op (Task 39)
  INSTALL_HOOKS_WIRED: 'install-hooks-wired', // cmk install: settings.json wired with npm-route hooks (Task 49). NOTE: no NOOP counterpart — install audits only on change, to keep re-runs byte-idempotent (the audit.log is append-only).
  REPAIR_LOCK_REMOVED: 'repair-lock-removed', // cmk repair --locks: stale lock unlinked (Task 39)
  PERSONA_PROMOTED: 'persona-promoted', // auto-persona: cross-project doctrine auto-promoted into a user-tier scratchpad at trust:medium (Task 45, design §16.16)
  PERSONA_SUPERSEDED: 'persona-superseded', // auto-persona: a promoted persona fact auto-superseded a contradicting existing one (Task 45.6, reuses Task 25 conflict detection)
  PERSONA_SECTION_CREATED: 'persona-section-created', // auto-persona: a new `## ` section was created on a user-tier scratchpad to land a candidate (Task 64 / F2)
  PERSONA_IMPORTED: 'persona-imported', // persona-portability: a user-tier persona bundle was imported onto this machine (Task 72)
  POISON_GUARD_REJECTED: 'poison-guard-rejected', // Task 216 (D-320): a durable write was dropped by screenBeforeCommittedWrite at a site with no project-scoped poison-guard.log (e.g. the user-tier persona-review queue) — the redacted audit entry is the observability trail so the drop is never silent
  STRAY_TIER_RECOVERED: 'stray-tier-recovered', // memory-recovery (Task 248): a fact file stranded in a pre-246 orphaned `context/` tier was copied BYTE-IDENTICALLY into the root tier. `paths.before` is the husk copy (never deleted — ADR-0018/D-193), `paths.after` the recovered file
  FACT_ID_REPAIRED: 'fact-id-repaired', // memory-recovery (Task 248 / D-394): a fact file whose frontmatter had a missing or non-ID_PATTERN id got its content-addressed id written back, ending the per-boot re-scan that index-rebuild's un-checkpointed skip caused. `extra.previousId` carries the old value (also kept in-file as `legacy_id`)
  FACT_QUARANTINED: 'fact-quarantined', // memory-recovery (Task 248 / D-394): a fact file whose id was NOT derivable (unparseable frontmatter / no body to hash) was MOVED bytes-intact to memory/archive/quarantine/. Never deleted, never silently dropped; the synthetic id is used because the file by definition has none
});

/**
 * Deterministic string ordering (sonar S2871 wants an explicit comparator).
 *
 * Deliberately NOT `localeCompare`, despite that being the rule's suggestion:
 * the callers sort ISO-8601 day keys (backfill's resume order, archive
 * provenance) and the filenames that order INDEX.md — a COMMITTED file. Locale
 * collation is machine-dependent, so the same corpus could produce different
 * output (and different diffs) on different machines. Code-unit order is
 * identical everywhere, and on ISO dates it IS chronological order.
 *
 * Shared rather than copied into each caller: three sites needed it, which is
 * exactly the drift the shared-module discipline exists to prevent.
 */
export function compareCodeUnits(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Normalize a frontmatter timestamp to the kit's strict ISO string form.
 *
 * The kit's `frontmatter.mjs` uses js-yaml CORE_SCHEMA, which deliberately does
 * NOT resolve timestamps — an ISO value stays a string. The Date branch guards
 * files touched by a NON-kit YAML parser (a hand-edit through an editor plugin),
 * not our own writes. `null`/`undefined` → `''` so `Date.parse` fails cleanly
 * rather than throwing.
 *
 * Shared per Task 241: byte-identical in temporal-sweep + validity-window, and
 * the latter's own comment admitted it was copied ("same as expiry-sweep.mjs").
 */
export function asIsoString(v) {
  if (v instanceof Date) return v.toISOString();
  return v == null ? '' : String(v);
}

/**
 * The `YYYY-MM-DD` day key from an ISO timestamp — the day-file/session naming
 * convention across the capture + compress path.
 *
 * Shared per Task 241: three functionally-identical copies (capture-prompt,
 * capture-turn, compress-session). The two capture sites used the tolerant
 * `String(iso).slice(0,10)`; compress-session used `ts.slice(0,10)`, which THREW
 * on a non-string. Consolidating naively on the tolerant form looked like a pure
 * widening and was not: `compress-session` feeds this straight into a FILENAME
 * (`today-${date}.md`), and `String(new Date(…)).slice(0,10)` yields
 * `'Tue Jul 21'` — a perfectly legal filename on both platforms. The crash WAS
 * the guard, so dropping it would have turned a loud failure into a silently
 * misnamed day file, which is the worst outcome for a memory tier.
 *
 * So the type check is explicit and applies to all three callers. Every one of
 * them passes `nowIso()` or a fixture string today, and the capture hooks catch
 * and fail open, so a throw here degrades to "this turn was not captured" rather
 * than to a corrupt day file. (Skill-review M2, Task 241.)
 */
export function dateFromIso(iso) {
  if (typeof iso !== 'string') {
    throw new TypeError(
      `dateFromIso: expected an ISO string, got ${iso === null ? 'null' : typeof iso}`,
    );
  }
  return iso.slice(0, 10);
}

function auditLogPath(tierRoot) {
  return join(tierRoot, '.locks', 'audit.log');
}

export function appendAuditEntry(tierRoot, entry) {
  // Required-field validation. Throw immediately on caller error; this catches
  // schema drift at write time rather than at log-parse time later.
  for (const field of ['action', 'tier', 'id', 'reasonCode']) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
      throw new Error(
        `audit-log: missing required field "${field}" in entry ${JSON.stringify(entry)}`,
      );
    }
  }

  const canonical = {
    ts: entry.ts ?? nowIso(),
    schema: AUDIT_LOG_SCHEMA_VERSION,
    action: entry.action,
    tier: entry.tier,
    id: entry.id,
    reasonCode: entry.reasonCode,
  };
  if (entry.reasonText !== undefined) canonical.reasonText = entry.reasonText;
  if (entry.paths !== undefined) canonical.paths = entry.paths;
  // Field name is `extra` (singular). Caller convention across the kit
  // (memory-write, conflict-queue, etc.); plural `extras` is a common
  // typo — caught in tests but worth naming here so future modules
  // pick the right key.
  if (entry.extra !== undefined) canonical.extra = entry.extra;

  const locksDir = join(tierRoot, '.locks');
  mkdirSync(locksDir, { recursive: true });
  appendFileSync(
    auditLogPath(tierRoot),
    JSON.stringify(canonical) + '\n',
    'utf8',
  );
}

// Convenience reader, useful for tests + future cmk doctor + cmk queue
// commands. Returns [] if the log doesn't exist yet.
export function readAuditLog(tierRoot) {
  const path = auditLogPath(tierRoot);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}
