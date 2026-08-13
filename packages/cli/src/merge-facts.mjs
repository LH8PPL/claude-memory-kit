// Fact consolidation (Task 10, refactored in cleanup-layer-2-cross-module-drift).
// Single public boundary: mergeFacts(opts) → result. See design §3.4.
//
// Uses shared modules: tier-paths, frontmatter, audit-log, result-shapes.
// Composes writeFact() to create the new merged fact, then moves A + B into
// archive/superseded/ with superseded_by injected. See CLAUDE.md "Shared
// modules" rule.

import {
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  VALID_TIERS,
  ID_PATTERN,
  resolveTierRoot,
  resolveFactDir,
} from './tier-paths.mjs';
import { parse, format } from './frontmatter.mjs';
import { eachFactIn, archiveWritePath } from './fact-store.mjs';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import { ERROR_CATEGORIES, errorResult, notFoundResult } from './result-shapes.mjs';
import { writeFact } from './write-fact.mjs';
import { reindex } from './reindex.mjs';
import { applyTrustSignal } from './trust-signal.mjs';
import { openIndexDb } from './index-db.mjs';

function findLiveFactById(factDir, id) {
  for (const fact of eachFactIn(factDir)) {
    if (fact.frontmatter.id === id && !fact.frontmatter.deleted_at) {
      return { id, path: fact.path, frontmatter: fact.frontmatter, body: fact.body };
    }
  }
  return null;
}

// Task 66.3 (finding 7): the earliest parent expires_at, normalized to the
// kit's strict ISO string form (js-yaml keeps ISO strings as strings under
// CORE_SCHEMA; the Date branch guards non-kit parsers). Returns undefined
// when neither parent expires — writeFact then writes no expiry.
function earliestExpiresAt(fmA, fmB) {
  const vals = [fmA?.expires_at, fmB?.expires_at]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => (v instanceof Date ? v.toISOString() : String(v)))
    .filter((v) => Number.isFinite(Date.parse(v)));
  if (vals.length === 0) return undefined;
  return vals.sort((a, b) => Date.parse(a) - Date.parse(b))[0];
}

function moveToSuperseded(match, supersededBy) {
  const supersededDir = join(match.factDir, 'archive', 'superseded');
  mkdirSync(supersededDir, { recursive: true });
  // Task 281: escaped spelling — see fact-store's archive-filename note.
  const newPath = archiveWritePath(supersededDir, match.id);
  const { frontmatter, body } = parse(readFileSync(match.path, 'utf8'));
  const updated = {
    superseded_by: supersededBy,
    ...(frontmatter ?? {}),
  };
  writeFileSync(newPath, format({ frontmatter: updated, body }), 'utf8');
  unlinkSync(match.path);
  return newPath;
}

export function mergeFacts(opts = {}) {
  const {
    idA,
    idB,
    mergedBody,
    mergedTitle,
    mergedSlug,
    mergedType,
    writeSource,
    trust,
    sourceFile,
    sourceLine,
    sourceSha1,
    mergedTags,
    projectRoot,
    userDir,
    now,
  } = opts;

  const errors = [];
  if (!idA || !ID_PATTERN.test(idA)) errors.push('idA: must be a valid citation ID');
  if (!idB || !ID_PATTERN.test(idB)) errors.push('idB: must be a valid citation ID');
  if (idA && idB && idA === idB) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: [`idA and idB are the same (${idA}); cannot merge a fact with itself`],
    });
  }
  if (!mergedBody || typeof mergedBody !== 'string' || !mergedBody.length) {
    errors.push('mergedBody: required, non-empty string');
  }
  if (!mergedTitle || typeof mergedTitle !== 'string') {
    errors.push('mergedTitle: required, non-empty string');
  }
  // Layer-2 review S4: removed the redundant `mergedSlug` truthy check. The
  // downstream writeFact owns all slug validation (pattern + presence).
  // Inconsistent layering disappears; bad slugs surface from writeFact with
  // a clear schema error.
  //
  // Layer-2 review S3: writeSource is now REQUIRED (no compressor default).
  // Compressor was the most-suspicious default — Task 23 auto-extract and
  // Task 24 memory-write are NOT compressor-driven. Forcing the caller to
  // pick avoids accidentally tagging human-curated merges as 'compressor'.
  if (!writeSource || typeof writeSource !== 'string') {
    errors.push('writeSource: required (no default). Pick one of user-explicit/auto-extract/compressor/manual-edit/imported.');
  }
  if (errors.length > 0) {
    return errorResult({ category: ERROR_CATEGORIES.SCHEMA, errors });
  }

  const tierA = idA[0];
  const tierB = idB[0];
  if (tierA !== tierB) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: [
        `cross-tier merge not supported: idA tier (${tierA}) ≠ idB tier (${tierB}). Promote one side to the same tier first.`,
      ],
    });
  }
  const tier = tierA;
  if (!VALID_TIERS.has(tier)) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: [`invalid tier prefix on ids: ${tier}`],
    });
  }

  const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
  const factDir = resolveFactDir(tier, tierRoot);

  const matchA = findLiveFactById(factDir, idA);
  const matchB = findLiveFactById(factDir, idB);
  if (!matchA || !matchB) {
    const missing = [];
    if (!matchA) missing.push(idA);
    if (!matchB) missing.push(idB);
    return notFoundResult({
      errors: [`no live fact found for ${missing.join(', ')}`],
    });
  }
  matchA.factDir = factDir;
  matchB.factDir = factDir;

  const typeC =
    mergedType ?? matchA.frontmatter.type ?? matchB.frontmatter.type;

  const writeResult = writeFact({
    tier,
    type: typeC,
    // Task 66.1: a merge never RESETS temporal classification — inherit from
    // the primary parent (same fallback order as type). Both absent (pre-66
    // facts) → undefined → writeFact's State default.
    shape: matchA.frontmatter.shape ?? matchB.frontmatter.shape,
    // Task 66.3 (skill-review finding 7): same principle for the declared
    // validity end — merging an expiring fact must not silently mint a
    // PERMANENT one. The EARLIEST parent expiry wins (the merged claim can't
    // outlive the shortest-lived thing it asserts).
    expiresAt: earliestExpiresAt(matchA.frontmatter, matchB.frontmatter),
    slug: mergedSlug,
    title: mergedTitle,
    body: mergedBody,
    writeSource,
    trust: trust ?? 'high',
    sourceFile: sourceFile ?? matchA.frontmatter.source_file ?? 'merge',
    sourceLine: sourceLine ?? 1,
    sourceSha1: sourceSha1 ?? matchA.frontmatter.source_sha1 ?? 'merged',
    mergedFrom: [idA, idB],
    tags: mergedTags,
    projectRoot,
    userDir,
    // A merge emits its own richer `merged`/CURATED_MERGE audit below — suppress
    // writeFact's default `created` entry so the merge logs exactly one event
    // (Task 123.A opt-out).
    audit: false,
  });
  if (writeResult.action === 'error') {
    return errorResult({
      category: writeResult.errorCategory,
      errors: writeResult.errors,
    });
  }
  // PR-1 blocker B1 fix preserved: writeFact dedup'd to an existing unrelated
  // fact → return collision error rather than silently retargeting A and B.
  if (writeResult.action !== 'created') {
    return errorResult({
      category: ERROR_CATEGORIES.COLLISION,
      errors: [
        `merged body collides with existing fact ${writeResult.id} (writeFact returned ${writeResult.action}${writeResult.skipReason ? ': ' + writeResult.skipReason : ''}); choose a different mergedBody`,
      ],
    });
  }

  const supersededA = moveToSuperseded(matchA, writeResult.id);
  const supersededB = moveToSuperseded(matchB, writeResult.id);

  // Task 124 (the D-112 class): writeFact refreshed INDEX.md when C was
  // created — but A and B left the fact dir AFTER that, so the index kept
  // both as dangling lines until a manual `cmk reindex`. The writer owns
  // the derived view on the removal side too. Best-effort, same contract
  // as writeFact's: the merge is already durable on disk.
  try {
    reindex({ tier, projectRoot, userDir, warn: () => {} });
  } catch {
    // index rebuild is best-effort; the merge already succeeded
  }

  // Task 151.12 — a merge SUPERSEDES the two originals → DAMPEN their trust_score
  // (the supersession passive signal; 151.8 wired the replace path, this closes
  // the merge-path gap). Best-effort overlay — never breaks the merge; a superseded
  // fact's row may already be filtered, in which case applyTrustSignal no-ops.
  // Share ONE index-db handle across the two dampens (avoid open/close per id).
  try {
    const sigDb = openIndexDb({ projectRoot });
    try {
      applyTrustSignal({ projectRoot, id: idA, event: 'dampen', db: sigDb });
      applyTrustSignal({ projectRoot, id: idB, event: 'dampen', db: sigDb });
    } finally {
      sigDb.close();
    }
  } catch {
    // best-effort: the trust dampen must never break the merge.
  }

  const ts = now ?? nowIso();
  appendAuditEntry(tierRoot, {
    ts,
    action: 'merged',
    tier,
    id: writeResult.id,
    reasonCode: REASON_CODES.CURATED_MERGE,
    paths: {
      after: writeResult.path,
      archive: [supersededA, supersededB],
    },
    extra: { mergedFrom: [idA, idB] },
  });

  return {
    action: 'merged',
    id: writeResult.id,
    tier,
    path: writeResult.path,
    supersededPaths: [supersededA, supersededB],
  };
}
