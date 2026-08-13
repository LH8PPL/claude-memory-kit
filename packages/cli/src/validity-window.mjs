// validity-window.mjs — the Task 66.2 close-open arithmetic (design §16.18
// layer 2; detection-input pivoted per D-259).
//
// graphiti's resolve_edge_contradictions contract, markdown-native: when a
// newer fact supersedes an older fact's CURRENT-STATE claim, the OLDER window
// closes at the NEWER fact's created_at — EVENT-TIME decides the boundary,
// never the wall clock and never the LLM (which only classified the pair; see
// temporal-sweep.mjs). The older fact is annotated (ended_at / status:
// completed / superseded_by) and moved to archive/superseded/ — the SAME
// lifecycle merge-facts uses, so resolveFact/`cmk get` semantics are
// unchanged: old ids never die, nothing is deleted, as-of history stays
// readable in the archive.
//
// Uses shared modules per CLAUDE.md: tier-paths, frontmatter, audit-log,
// result-shapes, reindex, trust-signal (the supersession dampen, 151.8/151.12).

import {
  mkdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { ID_PATTERN } from './tier-paths.mjs';
import { parse, format } from './frontmatter.mjs';
import { appendAuditEntry, nowIso, REASON_CODES, asIsoString } from './audit-log.mjs';
import { eachLiveFact, archiveWritePath } from './fact-store.mjs';
import { ERROR_CATEGORIES, errorResult, notFoundResult } from './result-shapes.mjs';
import { resolveFact } from './forget.mjs';
import { reindex } from './reindex.mjs';
import { applyTrustSignal } from './trust-signal.mjs';
import { openIndexDb } from './index-db.mjs';

function findLiveFact(id, { projectRoot, userDir }) {
  for (const fact of eachLiveFact({ projectRoot, userDir })) {
    if (fact.frontmatter.id === id) return fact;
  }
  return null;
}

/**
 * Close the OLDER fact's validity window because the NEWER fact supersedes
 * its current-state claim (a judged SUPERSEDES verdict, or an explicit call).
 *
 * @param {object} opts
 * @param {string} opts.olderId   the fact whose window closes
 * @param {string} opts.newerId   the fact whose created_at is the close boundary
 * @param {string} opts.projectRoot
 * @param {string} [opts.userDir]
 * @param {string} [opts.now]     audit timestamp (NOT the window boundary)
 * @param {string} [opts.judgedBy]  provenance of the verdict (e.g. 'temporal-sweep'); audited
 * @returns {{action:'superseded',olderId,newerId,endedAt,archivePath}
 *          |{action:'skipped',reason:'already-superseded'}
 *          |{action:'not-found'|'error', ...}}
 */
export function resolveTemporalSupersede({
  olderId,
  newerId,
  projectRoot,
  userDir,
  now,
  judgedBy,
} = {}) {
  const errors = [];
  if (!olderId || !ID_PATTERN.test(olderId)) errors.push('olderId: required, kit citation-ID format');
  if (!newerId || !ID_PATTERN.test(newerId)) errors.push('newerId: required, kit citation-ID format');
  if (olderId && newerId && olderId === newerId) errors.push('olderId and newerId must differ');
  if (errors.length > 0) {
    return errorResult({ category: ERROR_CATEGORIES.SCHEMA, errors });
  }

  const older = findLiveFact(olderId, { projectRoot, userDir });
  if (!older) {
    // Distinguish "already superseded" (idempotent re-apply from a re-judged
    // queue pair — a no-op, not an error) from a genuinely unknown id.
    const resolved = resolveFact({ id: olderId, projectRoot, userDir });
    if (resolved?.state === 'superseded') {
      return { action: 'skipped', reason: 'already-superseded', olderId, newerId };
    }
    return notFoundResult({ errors: [`no live fact for olderId ${olderId}`] });
  }
  const newer = findLiveFact(newerId, { projectRoot, userDir });
  if (!newer) {
    return notFoundResult({ errors: [`no live fact for newerId ${newerId}`] });
  }

  // EVENT-TIME direction guard: the window boundary is the newer fact's
  // created_at; an inverted pair would close the wrong window. The caller
  // (temporal-sweep) orders by created_at — this is the defensive backstop.
  const olderMs = Date.parse(asIsoString(older.frontmatter.created_at));
  const newerMs = Date.parse(asIsoString(newer.frontmatter.created_at));
  if (!Number.isFinite(olderMs) || !Number.isFinite(newerMs) || olderMs >= newerMs) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: [
        `direction: olderId (${asIsoString(older.frontmatter.created_at)}) must predate newerId (${asIsoString(newer.frontmatter.created_at)}) — the window closes at the newer fact's created_at`,
      ],
    });
  }
  const endedAt = asIsoString(newer.frontmatter.created_at);

  // Annotate + archive (the merge-facts supersede lifecycle, plus the window
  // fields). Original key order preserved; the window fields append.
  const supersededDir = join(older.factDir, 'archive', 'superseded');
  mkdirSync(supersededDir, { recursive: true });
  // Task 281: escaped spelling — see fact-store's archive-filename note.
  const archivePath = archiveWritePath(supersededDir, older.id);
  const updated = { ...(older.frontmatter ?? {}) };
  updated.ended_at = endedAt;
  updated.status = 'completed';
  updated.superseded_by = newerId;
  writeFileSync(archivePath, format({ frontmatter: updated, body: older.body }), 'utf8');
  unlinkSync(older.path);

  const ts = now ?? nowIso();
  appendAuditEntry(older.tierRoot, {
    ts,
    action: 'temporal_supersede',
    tier: older.tier,
    id: olderId,
    reasonCode: REASON_CODES.TEMPORAL_SUPERSEDE,
    paths: { before: older.path, archive: archivePath },
    extra: { supersededBy: newerId, endedAt, ...(judgedBy ? { judgedBy } : {}) },
  });

  // Supersession dampens the closed fact's trust_score (the 151.8 passive
  // signal; same best-effort contract as the merge path 151.12).
  try {
    const sigDb = openIndexDb({ projectRoot });
    try {
      applyTrustSignal({ projectRoot, id: olderId, event: 'dampen', db: sigDb });
    } finally {
      sigDb.close();
    }
  } catch {
    // best-effort — the close is already durable on disk.
  }

  // Drop the closed fact from search (best-effort; reindexBoot self-heals).
  try {
    reindex({ tier: older.tier, projectRoot, userDir, warn: () => {} });
  } catch {
    // best-effort
  }

  return { action: 'superseded', olderId, newerId, endedAt, archivePath };
}
