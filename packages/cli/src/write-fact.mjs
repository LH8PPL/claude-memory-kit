// Per-fact archive writer (Task 7, refactored in cleanup-layer-2-cross-module-drift).
// Single public boundary: writeFact(opts) → result. See design §2.2 + §4.
//
// Uses shared modules: tier-paths (path resolution), frontmatter (js-yaml
// serialize), audit-log (canonical NDJSON), result-shapes (errorCategory enum).
// See CLAUDE.md "Shared modules" rule.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { generateId } from '@lh8ppl/cmk-canonicalize';
import { VALID_TIERS, resolveTierRoot, resolveFactDir, ID_PATTERN } from './tier-paths.mjs';
import { parse, format } from './frontmatter.mjs';
import { eachFactIn } from './fact-store.mjs';
import { reindex } from './reindex.mjs';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import { ERROR_CATEGORIES, errorResult } from './result-shapes.mjs';
import { sanitizeHomePaths } from './sanitize.mjs';
import { sanitizePrivacyTags } from './privacy.mjs';
import { maskPii, localUsernames, resolvePrivacyScreen } from './pii-patterns.mjs';
import { appendRedactions } from './redactions-log.mjs';
import { checkPoisonGuard, logPoisonGuardRejection } from './poison-guard.mjs';
// Task 250 (D-412) — the INDEX-drift half of the health log. writeFact is the
// ONE boundary every fact create flows through, so it is where "is the INDEX
// still in step with the archive?" is actually knowable as an EVENT.
import { appendHealthTransition, HEALTH_CODES } from './health-log.mjs';
// Task 262 (ADR-0023 / D-433) — write-time linking. The `related` option has
// been accepted here since Task 7 and nothing ever passed it; this is the
// module that passes it.
import { autoLinkFact, recordAutoLinkSideEffects, linkingEnabled } from './link-facts.mjs';
import { openIndexDb } from './index-db.mjs';

// Task 191 (ADR-0017 Phase 1b): 'judgment' is a LOOP-BORN type — written by
// judgment.mjs (earned method-preferences with an evidence log), never by the
// remember/mk_remember dictation surfaces (their type enums deliberately
// exclude it; a judgment must be EARNED, not asserted).
const VALID_TYPES = new Set(['user', 'feedback', 'project', 'reference', 'judgment']);
const VALID_WRITE_SOURCES = new Set([
  'user-explicit',
  'auto-extract',
  'compressor',
  'manual-edit',
  'imported',
]);
const VALID_TRUST = new Set(['high', 'medium', 'low']);
// Task 66.1 (design §16.18): what KIND of truth the fact asserts. Case-
// sensitive — one canonical spelling on disk. Optional at the call boundary;
// written explicitly (default State) so every new fact file self-describes.
// The temporal machinery keys on it: validity windows (66.2) touch only
// State, the expiry sweep (66.3) any shape, contradiction-catch (66.4) State.
const VALID_SHAPES = new Set([
  'State',
  'Event',
  'Plan',
  'Relationship',
  'Preference',
  'Absence',
  'Timeless',
]);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;
// Task 66.3 (design §16.18 / D-258): a DECLARED validity end — the writer
// knows at write time the fact has a shelf life ("demo scheduled Friday").
// ISO 8601 date or datetime, strict shape (not merely Date-parseable — a
// locale form like `08/01/2026` is ambiguous across machines and rejected).
// Semantics: expires_at is the FIRST moment the fact no longer holds
// (now >= expires_at → expired), matching the exclusive ended_at convention.
// Enforcement (read-filter + sweep) lands with the same task; mem0/graphiti
// precedent: expired facts HIDE from retrieval, they are never hard-deleted.
const EXPIRES_AT_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

// Layer-2 review: PR-1 rejected \n / \r / : in scalar frontmatter fields as
// a minimum fix for the naive serializer (finding B2). PR-2's frontmatter.mjs
// (js-yaml CORE_SCHEMA) quotes those chars properly. The B2 restriction is
// LIFTED here — titles/sourceFile/sourceSha1 may contain newlines, colons,
// and other YAML-special chars; they round-trip correctly via parse/format.
// Round-trip tests in cli-write-fact.test.js (`B2 relaxation`) prove it.

function validateOptions(opts) {
  const errors = [];
  if (!opts.tier || !VALID_TIERS.has(opts.tier)) {
    errors.push("tier: must be 'U', 'P', or 'L'");
  }
  if (!opts.type || !VALID_TYPES.has(opts.type)) {
    errors.push('type: must be one of user/feedback/project/reference');
  }
  if (
    !opts.slug ||
    typeof opts.slug !== 'string' ||
    !SLUG_PATTERN.test(opts.slug)
  ) {
    errors.push(
      'slug: must start with alphanumeric and contain only [A-Za-z0-9_-]',
    );
  }
  if (!opts.title || typeof opts.title !== 'string' || !opts.title.trim()) {
    errors.push('title: required, non-empty string');
  }
  if (opts.body == null || typeof opts.body !== 'string' || !opts.body.length) {
    errors.push('body: required, non-empty string');
  }
  if (!opts.writeSource || !VALID_WRITE_SOURCES.has(opts.writeSource)) {
    errors.push(
      'writeSource: must be one of user-explicit/auto-extract/compressor/manual-edit/imported',
    );
  }
  if (!opts.trust || !VALID_TRUST.has(opts.trust)) {
    errors.push('trust: must be one of high/medium/low');
  }
  if (opts.shape !== undefined && !VALID_SHAPES.has(opts.shape)) {
    errors.push(
      'shape: must be one of State/Event/Plan/Relationship/Preference/Absence/Timeless (case-sensitive)',
    );
  }
  if (opts.judgment !== undefined) {
    if (opts.type !== 'judgment') {
      errors.push('judgment: only valid with type "judgment"');
    } else {
      const j = opts.judgment;
      for (const f of ['claim', 'baseline', 'prefer', 'over']) {
        if (!j[f] || typeof j[f] !== 'string') errors.push(`judgment.${f}: required, non-empty string`);
      }
      if (!['provisional', 'corroborated', 'contested', 'retracted'].includes(j.status ?? 'provisional')) {
        errors.push('judgment.status: provisional|corroborated|contested|retracted');
      }
    }
  } else if (opts.type === 'judgment') {
    errors.push('type "judgment" requires the judgment block (claim/baseline/prefer/over)');
  }
  if (opts.expiresAt !== undefined) {
    if (
      typeof opts.expiresAt !== 'string' ||
      !EXPIRES_AT_PATTERN.test(opts.expiresAt) ||
      Number.isNaN(Date.parse(opts.expiresAt))
    ) {
      errors.push(
        'expiresAt: must be an ISO 8601 date (YYYY-MM-DD) or datetime (e.g. 2026-08-01T12:00:00Z)',
      );
    }
  }
  if (
    !opts.sourceFile ||
    typeof opts.sourceFile !== 'string' ||
    !opts.sourceFile.length
  ) {
    errors.push('sourceFile: required, non-empty string');
  }
  if (
    typeof opts.sourceLine !== 'number' ||
    !Number.isInteger(opts.sourceLine) ||
    opts.sourceLine < 1
  ) {
    errors.push('sourceLine: required, positive integer');
  }
  if (
    !opts.sourceSha1 ||
    typeof opts.sourceSha1 !== 'string' ||
    !opts.sourceSha1.length
  ) {
    errors.push('sourceSha1: required, non-empty string');
  }
  return errors;
}

function buildFrontmatterObject(opts, computed) {
  // Key order matters for visual diff stability — insertion order = on-disk order.
  const fm = {
    id: computed.id,
    // Task 270 (D-427): the id the caller SUPPLIED, when it was unusable and we
    // derived a real one instead. Same field name + position the memory-recovery
    // repair path writes (`applyIdRepair`), so a repaired-at-write fact and a
    // repaired-at-install fact leave identical forensics on disk.
    ...(computed.idRepaired ? { legacy_id: computed.legacyId } : {}),
    // Task 254 (Obsidian vault view — shape a, forward-only): the fact's own id
    // as an Obsidian `aliases`, so a `[[P-XXXX]]` id reference (the kit's
    // cross-reference currency — used across fact bodies + the `superseded_by`
    // FK + the generated vault map) resolves to this file in Obsidian. Files are
    // named `<type>_<slug>.md`, so `[[id]]` would not resolve without it. Purely
    // additive: no kit reader consumes `aliases` (verified caller-map — reindex/
    // graph-index/read-core/search read id/type/title/related/superseded_by only).
    aliases: [computed.id],
    type: opts.type,
    // Task 66.1 (design §16.18): temporal shape, default State. Written
    // explicitly so the file self-describes; readers treat ABSENCE (all
    // pre-66 facts) as State too — same default, two eras.
    shape: opts.shape ?? 'State',
    title: opts.title,
    created_at: computed.createdAt,
    write_source: opts.writeSource,
    trust: opts.trust,
    // Task 191 (ADR-0017 Phase 1b): the judgment schema fields — present only
    // on type:'judgment' facts (the earned method-preference shape: claim vs
    // BASELINE, replication count, direction-consistency, decay). decays_after
    // ALSO rides expiresAt (set by judgment.mjs) so the 66.1 expiry machinery
    // hides a decayed judgment from search with zero new plumbing.
    ...(opts.judgment !== undefined
      ? {
          claim: opts.judgment.claim,
          baseline: opts.judgment.baseline,
          prefer: opts.judgment.prefer,
          over: opts.judgment.over,
          status: opts.judgment.status ?? 'provisional',
          n_episodes: opts.judgment.nEpisodes ?? 1,
          direction_consistent: opts.judgment.directionConsistent ?? true,
          confounds: opts.judgment.confounds ?? [],
          outcome_horizon: opts.judgment.outcomeHorizon ?? 'short',
          decays_after: opts.judgment.decaysAfter,
        }
      : {}),
    // Task 151.1 (ADR-0016 / design §20.1): the capped-recurrence promotion
    // signal. Starts at 1 on create; the duplicate-hit path bumps it when the
    // SAME canonical fact re-surfaces (same content-hash id). A promotion fact,
    // so it lives in committed frontmatter (diffable) — unlike trust_score,
    // which moves on every recall and lives in the rebuildable index (D-218).
    recurrence_count: computed.recurrenceCount ?? 1,
    source_file: opts.sourceFile,
    source_line: opts.sourceLine,
    source_sha1: opts.sourceSha1,
  };
  if (opts.mergedFrom) fm.merged_from = opts.mergedFrom;
  if (opts.supersededBy) fm.superseded_by = opts.supersededBy;
  // Task 66.3: declared validity end, verbatim (validated in validateOptions).
  if (opts.expiresAt) fm.expires_at = opts.expiresAt;
  if (opts.tags) fm.tags = opts.tags;
  if (opts.related) fm.related = opts.related;
  if (opts.isPrivate === true) fm.private = true;
  return fm;
}

// Per Layer-2 review M2: filter INDEX.md from the dedup scan. Pre-fix the
// inline scanner here didn't exclude INDEX.md; harmless in practice (it has no
// `id:` matching real ids) but inconsistent with reindex/forget — the exact
// drift the shared walker (Task 241) now makes structurally impossible.
//
// `eachFactIn`, not `eachLiveFact`: the dedup scan must find a TOMBSTONED fact
// too, or a write could re-issue an id that is already spoken for.
function findExistingFactById(factDir, id) {
  for (const fact of eachFactIn(factDir)) {
    if (fact.frontmatter.id === id) return fact.path;
  }
  return null;
}

function readExistingFactId(path) {
  if (!existsSync(path)) return null;
  const { frontmatter } = parse(readFileSync(path, 'utf8'));
  return frontmatter?.id ?? null;
}

// Task 151.1 (ADR-0016 / design §20.1): a duplicate write = the SAME canonical
// fact re-surfaced → bump its `recurrence_count` in place. Only the bumped fact
// is touched (the over-mutation guard). Returns the new count, or null if the
// file can't be read/parsed (best-effort: a re-surface bump must never turn a
// successful no-op into an error).
function bumpRecurrence(path) {
  try {
    const { frontmatter, body } = parse(readFileSync(path, 'utf8'));
    if (!frontmatter) return null;
    const current = Number.isInteger(frontmatter.recurrence_count)
      ? frontmatter.recurrence_count
      : 1; // pre-151 facts have no field → treat as 1, this re-surface makes 2
    const next = current + 1;
    frontmatter.recurrence_count = next;
    writeFileSync(path, format({ frontmatter, body }), 'utf8');
    return next;
  } catch {
    return null;
  }
}

// Task 66.4 (D-259): a judged DUPLICATE verdict is the SAME restatement signal
// as a duplicate write — expose the bump BY ID for the temporal-sweep path.
// Same audit shape as writeFact's duplicate branch; same durable-by-seed
// contract (151.8: the committed count is the signal, no overlay write).
export function bumpFactRecurrence({ id, projectRoot, userDir, now, source } = {}) {
  if (!id || typeof id !== 'string') {
    return errorResult({ category: ERROR_CATEGORIES.SCHEMA, errors: ['id: required'] });
  }
  const tiers = [];
  if (projectRoot) tiers.push('P', 'L');
  if (userDir) tiers.push('U');
  for (const tier of tiers) {
    const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
    const factDir = resolveFactDir(tier, tierRoot);
    const path = findExistingFactById(factDir, id);
    if (!path) continue;
    const recurrenceCount = bumpRecurrence(path);
    if (recurrenceCount == null) {
      return errorResult({
        category: ERROR_CATEGORIES.SCHEMA,
        errors: [`could not bump recurrence for ${id} (unreadable frontmatter)`],
      });
    }
    appendAuditEntry(tierRoot, {
      ts: now ?? nowIso(),
      action: 'recurrence',
      tier,
      id,
      reasonCode: REASON_CODES.RECURRENCE,
      extra: { recurrenceCount, ...(source ? { source } : {}) },
      paths: { before: path },
    });
    return { action: 'bumped', id, recurrenceCount, path };
  }
  return { action: 'not-found', id };
}

/**
 * Task 262 — run the write-time linker for one create, or return null.
 *
 * Returns null (link nothing) for every one of: the flag is off, the caller
 * already supplied `related`, the caller opted out (`autoLink: false` — the
 * fixture-seeding and backfill paths), or ANY failure at all. It is
 * deliberately impossible for this function to throw: it is called from the
 * middle of a successful capture.
 *
 * `_linkFn` is the test seam (parity with `_reindexFn`); `linkSimilarity` is the
 * prepared SEMANTIC backend an async caller may inject (the Task-143
 * prepareNearDupGuard shape — the async model work happens in a caller that can
 * afford it, and a plain sync `similarityFn` is what crosses into this path).
 */
function maybeAutoLink({ opts, factOpts, id, createdAt }) {
  try {
    if (opts.autoLink === false) return null;
    if (opts.related !== undefined) return null; // an explicit `related` wins
    if (!opts.projectRoot) return null; // no project → no index → nothing to link against
    if (!linkingEnabled({ projectRoot: opts.projectRoot })) return null;
    const linkFn = opts._linkFn ?? autoLinkFact;
    const db = openIndexDb({ projectRoot: opts.projectRoot });
    try {
      return linkFn({
        db,
        projectRoot: opts.projectRoot,
        userDir: opts.userDir,
        tier: opts.tier,
        id,
        text: factOpts.body,
        mode: 'write',
        similarity: opts.linkSimilarity ?? null,
        now: createdAt,
      });
    } finally {
      try {
        db.close();
      } catch {
        /* best-effort */
      }
    }
  } catch {
    // Capture > linking, always. A linking failure is never a capture failure.
    return null;
  }
}

/**
 * Task 270 (D-427 the bug; D-443 the decision) — THE ID BOUNDARY. Decide the fact's id from what the caller
 * supplied, never trusting it blind.
 *
 * The bug this closes: `opts.id ?? generateId(...)` took a caller's id on faith,
 * so an id outside the kit's base32 alphabet (the live finding: `P-5678ABCD`,
 * where `8` is one of the six excluded ambiguous chars) was ACCEPTED, returned
 * `action:'created'`, and landed a real file — which `index-rebuild`'s
 * `parseObservationsFromFactFile` then skipped as 'invalid or missing id'. The
 * write path said yes, every DB-backed read path said no such fact, and no
 * error fired anywhere between them. The only symptom was a count off by one.
 *
 * REGENERATE, NOT REJECT — decided after caller-mapping every explicit-id
 * caller, and the map is what settles it:
 *   · `graduation.mjs:graduateOne` is the ONLY production caller that passes an
 *     explicit id. Its `BULLET_RE` is deliberately loose (`[PUL]-[A-Za-z0-9]+`)
 *     and its comment delegates alphabet validity to "the writer's concern" —
 *     i.e. to here. That is the separately-correct-jointly-broken seam.
 *   · A REJECT on that path is strictly worse than the bug: `graduateOne`
 *     erroring makes the caller keep the bullet, but `graduateForCapRelief`'s
 *     feasibility gate has already committed to graduating it to get under cap,
 *     so the write fails CAP_EXCEEDED — one legacy bad-alphabet bullet would
 *     wedge MEMORY.md at its cap permanently. A reject that breaks the cap-relief
 *     path is exactly the "reject that breaks restore" the task warned about.
 *   · Regeneration reuses the mechanism the REPAIR path (D-394) already chose
 *     for this very shape — `classifyFactId` returns 'repairable' for a
 *     non-ID_PATTERN id with a non-empty body and derives `generateId(tier,
 *     body)`. Write and repair now agree instead of diverging.
 *   · It is a no-op for every currently-working caller: regeneration fires only
 *     when the supplied id FAILS ID_PATTERN, so no valid path changes behavior.
 *
 * The substitution is never silent — the caller sees `idRepaired`/`previousId`,
 * the file keeps a `legacy_id` breadcrumb (the same field `applyIdRepair`
 * writes), and an audit entry records it.
 *
 * M4: `idRepaired` is an explicit BOOLEAN, never the truthiness of `legacyId`.
 * A caller passing `id: ''` supplied a real (and unusable) value, and an empty
 * string is falsy — gating the never-silent trio on `legacyId` alone would have
 * made that one case silent, which is the exact property this function exists
 * to guarantee. Absent (`undefined`/`null`) is the ONLY "caller supplied
 * nothing" state.
 *
 * @returns {{id: string, legacyId: string|null, idRepaired: boolean}}
 */
function resolveFactId(supplied, tier, body) {
  if (supplied === undefined || supplied === null) {
    return { id: generateId(tier, body), legacyId: null, idRepaired: false };
  }
  if (typeof supplied === 'string' && ID_PATTERN.test(supplied)) {
    return { id: supplied, legacyId: null, idRepaired: false };
  }
  // Anything else — wrong alphabet, wrong length, wrong type entirely — is an
  // id no read path could ever resolve. Derive the real one; keep the original
  // visible rather than discarding it.
  return { id: generateId(tier, body), legacyId: String(supplied), idRepaired: true };
}

export function writeFact(opts = {}) {
  const errors = validateOptions(opts);
  if (errors.length > 0) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors,
      id: null,
      path: null,
    });
  }

  // Privacy (write-path fix #1): abstract absolute home-dir paths to `~` in
  // committed/shared tiers (P/U) so a fact never ships the local username
  // and stays portable. Local tier (L) keeps machine-specific paths verbatim
  // — that's its purpose. The id hashes the SANITIZED body, so dedup keys on
  // what actually lands on disk.
  let { body, title } = opts;
  // Privacy: strip <private>…</private> FIRST, on EVERY tier (cut-gate
  // v0.3.1 finding — the tag was honored only by the UserPromptSubmit hook,
  // so a fact written via cmk remember/mk_remember/import kept the secret).
  // Runs before home-path sanitization, Poison_Guard, and id-generation, so
  // the redacted body is what gets screened, hashed (dedup keys on what
  // lands), and written.
  body = sanitizePrivacyTags(body);
  title = sanitizePrivacyTags(title);

  // Poison_Guard (write-path fix #1): fact files previously bypassed the
  // secret/poison screen that scratchpad writes get via memoryWrite. Screen
  // BOTH title and body (D-312 — the title was a Poison_Guard side door:
  // `--title "ghp_…"` / mk_remember title param landed a secret verbatim in the
  // committed frontmatter + INDEX.md, since title only got privacy/PII masking,
  // never the secret/injection screen). Concatenate so one screen covers both;
  // a rejection in either field blocks the write.
  // ORDER is load-bearing (Task 231 / D-337 — screen-then-mask): the guard
  // runs AFTER sanitizePrivacyTags (<private> content is removed by the
  // user's explicit request — never reject content that won't land; the C5
  // contract) but BEFORE maskPii (maskPii STRIPS invisible/zero-width/bidi
  // codepoints, which destroyed the guard's evidence — the Task-70.4
  // invisible-unicode screen was unreachable under the default privacy
  // screen). Screen first; mask only what passed.
  const guard = checkPoisonGuard(`${title ?? ''}\n${body}`);
  if (guard.rejected) {
    // Best-effort log; guard on projectRoot so a U-tier write with no
    // project context can't turn a clean rejection into a crash.
    if (guard.pattern_id !== 'schema' && opts.projectRoot) {
      logPoisonGuardRejection({
        projectRoot: opts.projectRoot,
        ts: opts.createdAt ?? nowIso(),
        pattern_id: guard.pattern_id,
        source_file: `write-fact:${opts.type}_${opts.slug}`,
        source_line: 1,
        redacted_excerpt: guard.redacted_excerpt,
      });
    }
    return errorResult({
      category: ERROR_CATEGORIES.POISON_GUARD,
      errors: [`Poison_Guard rejected write: pattern_id=${guard.pattern_id}`],
      pattern_id: guard.pattern_id,
      redacted_excerpt: guard.redacted_excerpt,
      id: null,
      path: null,
    });
  }

  if (opts.tier === 'P' || opts.tier === 'U') {
    // L1 PII layer (Task 148.2, design §6.10): maskPii covers emails/phones/
    // usernames AND home-paths (delegates to sanitizeHomePaths), BEFORE
    // id-generation/dedup/disk. Originals go only to the gitignored
    // redactions.log; the privacy.screen kill-switch reverts to the
    // pre-148 home-path-only gate. Runs AFTER the Poison_Guard screen
    // (Task 231 / D-337 — see the ordering note above the guard).
    if (resolvePrivacyScreen({ projectRoot: opts.projectRoot }) === 'on') {
      const usernames = localUsernames();
      const maskedBody = maskPii(body, { usernames });
      const maskedTitle = maskPii(title, { usernames });
      body = maskedBody.text;
      title = maskedTitle.text;
      appendRedactions(opts.projectRoot, {
        source: `write-fact:${opts.tier}`,
        layer: 'L1',
        redactions: [...maskedBody.redactions, ...maskedTitle.redactions],
      });
    } else {
      body = sanitizeHomePaths(body);
      title = sanitizeHomePaths(title);
    }
  }

  // Use the sanitized body/title for id, frontmatter, and the file body.
  const factOpts = { ...opts, body, title };
  const { id, legacyId, idRepaired } = resolveFactId(opts.id, opts.tier, body);
  const createdAt = opts.createdAt ?? nowIso();
  const tierRoot = resolveTierRoot(opts);
  const factDir = resolveFactDir(opts.tier, tierRoot);
  const filename = `${opts.type}_${opts.slug}.md`;
  const path = join(factDir, filename);

  // Task 270 (D-443/D-444), Door 5 — I2: the repair is audited HERE, at the
  // decision point, not on the `created` path. The id substitution is a fact
  // about the WRITE ATTEMPT and is equally true when the write then dedups or
  // collides; auditing it only on the create path meant the three early returns
  // below escaped the never-silent invariant that D-443 and design §3.3.1
  // declare absolute. Deliberately NOT gated on `opts.audit` — that flag exists
  // to suppress a redundant `created` entry, never a data-integrity event.
  if (idRepaired) {
    try {
      appendAuditEntry(tierRoot, {
        ts: createdAt,
        action: 'fact-id-repaired',
        tier: opts.tier,
        id,
        reasonCode: REASON_CODES.FACT_ID_REPAIRED,
        paths: { after: path },
        extra: { previousId: legacyId, at: 'write-fact' },
      });
    } catch {
      // best-effort; the substitution still rides the returned result
    }
  }
  // Every exit from here on carries the repair trio when a repair happened.
  const repairFields = idRepaired ? { idRepaired: true, previousId: legacyId } : {};

  const existingIdAtPath = readExistingFactId(path);
  if (existingIdAtPath !== null) {
    if (existingIdAtPath === id) {
      // Task 151.1: the same canonical fact re-surfaced → bump recurrence_count.
      const recurrenceCount = bumpRecurrence(path);
      appendAuditEntry(tierRoot, {
        ts: createdAt,
        action: 'recurrence',
        tier: opts.tier,
        id,
        reasonCode: REASON_CODES.RECURRENCE,
        extra: { recurrenceCount },
        paths: { before: path },
      });
      // Task 151.8 (research fix): the re-surface RESTATEMENT signal is NOT a
      // fragile overlay delta — `bumpRecurrence` just wrote the new recurrence_count
      // to the committed file, and `initTrustScore` folds a CAPPED recurrence term
      // into the seed, so the next reindex reconstructs a HIGHER trust_score from
      // the durable count (MemoryOS/MemOS/honcho: the count IS a score term). No
      // overlay write here — it would only be reseeded away by the reindex that the
      // file change triggers. Durable-by-construction.
      return { action: 'skipped', skipReason: 'duplicate', id, path, recurrenceCount, ...repairFields };
    }
    return errorResult({
      category: ERROR_CATEGORIES.COLLISION,
      errors: [
        `File exists at ${path} with different id ${existingIdAtPath}; refusing overwrite`,
      ],
      id,
      path,
      ...repairFields,
    });
  }

  const elsewhere = findExistingFactById(factDir, id);
  if (elsewhere) {
    // Task 151.1: re-surface via a different slug → bump the ORIGINAL fact.
    const recurrenceCount = bumpRecurrence(elsewhere);
    appendAuditEntry(tierRoot, {
      ts: createdAt,
      action: 'recurrence',
      tier: opts.tier,
      id,
      reasonCode: REASON_CODES.DUPLICATE_ELSEWHERE,
      extra: { recurrenceCount },
      paths: { before: elsewhere, after: path },
    });
    // Task 151.8 (research fix): restatement reinforcement is DURABLE via the seed
    // (initTrustScore folds the committed recurrence_count), not a doomed overlay —
    // the bump rewrote the file, so any overlay write would be reseeded away. See
    // the same-id branch above.
    return {
      action: 'skipped',
      skipReason: 'duplicate-elsewhere',
      id,
      path,
      duplicateAt: elsewhere,
      recurrenceCount,
      ...repairFields,
    };
  }

  // Task 262 (ADR-0023 / D-433) — WRITE-TIME LINKING, opportunistically attached
  // to the one boundary every fact create already flows through. `related` has
  // been an accepted option since Task 7 and nothing ever passed it; this is
  // what passes it. Computed BEFORE the file is written, against an index that
  // by definition does not yet contain this fact (so a self-link is impossible).
  //
  // Three invariants, all load-bearing:
  //   - CAPTURE > LINKING. Every failure mode (no index, no derived floor, a
  //     locked db, a throwing backend) degrades to "write the fact unlinked";
  //     the backfill catches it later. A capture is never blocked or failed.
  //   - AN EXPLICIT `related` WINS. A caller that passed links is stating them;
  //     the linker never overwrites a human/tool decision.
  //   - LINKING IS METADATA. It touches `related:` and nothing else — the body
  //     is neither reordered nor rewritten, and Poison_Guard has already
  //     screened it above, unchanged.
  const linkDecision = maybeAutoLink({ opts, factOpts, id, createdAt });
  if (linkDecision?.related?.length) factOpts.related = linkDecision.related;

  mkdirSync(factDir, { recursive: true });
  const frontmatter = buildFrontmatterObject(factOpts, { id, createdAt, legacyId, idRepaired });
  writeFileSync(path, format({ frontmatter, body: `\n${factOpts.body}\n` }), 'utf8');
  // Door 5, AFTER the file lands: an audit line always describes a link that
  // exists on disk.
  if (linkDecision) {
    recordAutoLinkSideEffects({
      tierRoot, tier: opts.tier, id, text: factOpts.body,
      decision: linkDecision, projectRoot: opts.projectRoot, userDir: opts.userDir,
      now: createdAt,
    });
  }

  // Keep INDEX.md consistent on every create — the index is a derived view of
  // the fact files, so the writer owns keeping it current. Without this, a fresh
  // `cmk remember` left INDEX.md stale until a manual `cmk reindex`, and
  // `cmk doctor` HC-5 failed from the first capture (Task 85; live-test-7
  // 2026-06-03 — "users should get it working from the start"). Best-effort: the
  // fact is already durably on disk, so an index-rebuild hiccup must not turn a
  // successful capture into an error — the next reindex/search self-heals.
  //
  // D-152: the failure is OBSERVABLE, not silently swallowed. A detached
  // auto-extract child whose reindex was killed mid-rebuild (hook ceiling) used
  // to leave INDEX.md lagging with ZERO trace — so a stale committed INDEX was
  // undiagnosable (the user caught a 5-fact lag in the cut-gate). On throw we
  // now record an INDEX_REBUILD_FAILED audit entry; HC-4 still detects the drift
  // and `cmk reindex` corrects it. The `_reindexFn` seam is test-only.
  const doReindex = opts._reindexFn ?? reindex;
  try {
    doReindex({ tier: opts.tier, projectRoot: opts.projectRoot, userDir: opts.userDir, warn: () => {} });
    // Task 250: the success-side `ok` is NOT appended here — `reindex()` itself
    // owns it now (review finding B1), so every route that rebuilds the INDEX
    // clears the warning, including the `cmk reindex` the whisper prescribes.
    // Appending here too would double-write on the real path for no signal.
  } catch (reindexErr) {
    // Task 250: DETERMINISTIC — a stale INDEX does not un-stale itself; it
    // stays behind until something rebuilds it. So one strike is enough, and
    // the only thing that clears it is a rebuild that actually succeeded.
    //
    // The TRANSITION form, even though a fail is never suppressed: it also
    // UPDATES the shared per-process memory that `reindex()`'s `ok` consults.
    // Using the plain append here would leave that memory reading `ok` from an
    // earlier rebuild in the same process, so the next successful reindex would
    // be suppressed as a repeat — and the warning this line just raised could
    // never clear. Same stuck-warning class as review finding B1, one level in.
    appendHealthTransition(opts.projectRoot, {
      class: HEALTH_CODES.INDEX_DRIFT,
      outcome: 'fail',
      detail: 'index-rebuild-failed',
    });
    // index rebuild is best-effort; capture already succeeded — but leave a
    // trace so a lagging committed INDEX is diagnosable, never silent.
    try {
      appendAuditEntry(tierRoot, {
        ts: createdAt,
        action: 'index-rebuild-failed',
        tier: opts.tier,
        id,
        reasonCode: REASON_CODES.INDEX_REBUILD_FAILED,
        paths: { after: path },
        extra: { error: String(reindexErr?.message ?? reindexErr) },
      });
    } catch {
      // even the audit append is best-effort; the fact is already on disk
    }
  }

  // Default create-audit (Task 123.A / D-103). writeFact is the single boundary
  // every fact create flows through, so it owns the operational audit entry —
  // the prior "caller's responsibility" design left 3 of 4 create paths
  // (auto-extract, explicit-remember, graduation) silently unaudited (cut-gate7:
  // 6 creates → 0 audit lines). Callers that emit a richer-semantic audit for
  // the same write (merge-facts → `merged`/CURATED_MERGE) pass `audit:false` to
  // avoid a redundant `created` entry. Best-effort: a successful capture must
  // not be turned into an error by an audit-log hiccup.
  if (opts.audit !== false) {
    try {
      appendAuditEntry(tierRoot, {
        ts: createdAt,
        action: 'created',
        tier: opts.tier,
        id,
        reasonCode: REASON_CODES.FACT_CREATED,
        paths: { after: path },
        extra: { writeSource: factOpts.writeSource, trust: factOpts.trust },
      });
    } catch {
      // audit append is best-effort; the fact is already durably on disk
    }
  }

  return { action: 'created', id, path, ...repairFields };
}
