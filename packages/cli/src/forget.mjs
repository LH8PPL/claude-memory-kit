// Tombstone-write + tombstone-aware fact resolver (Task 9, refactored in
// cleanup-layer-2-cross-module-drift). Two public boundaries:
//   forget(opts) → result          — user-requested deletion
//   resolveFact(opts) → state      — read-side, knows live/tombstoned/superseded
//
// Uses shared modules: tier-paths, frontmatter, audit-log, result-shapes.
// See design §6.5 + CLAUDE.md "Shared modules" rule.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { canonicalize } from '@lh8ppl/cmk-canonicalize';
import {
  VALID_TIERS,
  ID_PATTERN,
  resolveTierRoot,
  resolveFactDir,
} from './tier-paths.mjs';
import { parse, format } from './frontmatter.mjs';
import {
  INDEX_FILENAME,
  eachFactIn,
  eachLiveFact,
  listMarkdownFiles,
  archiveReadPath,
  archiveWritePath,
} from './fact-store.mjs';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import { ERROR_CATEGORIES, errorResult, notFoundResult } from './result-shapes.mjs';
import { findBulletScratchpad } from './bullet-lookup.mjs';
import { openIndexDb } from './index-db.mjs';
import { reindexBoot } from './index-rebuild.mjs';
import { reindex } from './reindex.mjs';

// Layer-2 review: PR-1 rejected \n / \r / : in the `reason` field as a
// minimum fix for the naive serializer (finding B2). PR-2's frontmatter.mjs
// (js-yaml CORE_SCHEMA) quotes those chars properly. The B2 restriction is
// LIFTED here — reasons may contain newlines, colons, etc. and round-trip
// correctly. Round-trip tests in cli-forget.test.js (`B2 relaxation`) prove it.

function readFactAt(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parse(text);
  return { frontmatter, body, text };
}

function resolveById(id, { projectRoot, userDir }) {
  const tier = id[0];
  if (!VALID_TIERS.has(tier)) return { matches: [] };
  // The id's own prefix names its tier, so this walks exactly one.
  for (const fact of eachLiveFact({ projectRoot, userDir, tiers: [tier] })) {
    if (fact.frontmatter.id === id) {
      return {
        matches: [
          {
            id,
            tier,
            path: fact.path,
            frontmatter: fact.frontmatter,
            body: fact.body,
            tierRoot: fact.tierRoot,
            factDir: fact.factDir,
          },
        ],
      };
    }
  }
  return { matches: [] };
}

function resolveByQuery(query, { projectRoot, userDir }) {
  const canonicalQuery = canonicalize(query);
  if (!canonicalQuery) return { matches: [] };

  const matches = [];
  for (const fact of eachLiveFact({ projectRoot, userDir })) {
    if (canonicalize(fact.body).includes(canonicalQuery)) {
      matches.push({
        id: fact.frontmatter.id,
        tier: fact.tier,
        path: fact.path,
        frontmatter: fact.frontmatter,
        body: fact.body,
        tierRoot: fact.tierRoot,
        factDir: fact.factDir,
      });
    }
  }
  // Layer-2 review M3: sort matches deterministically so ambiguous-error
  // messages list candidate ids in stable order across machines.
  matches.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { matches };
}

function moveFactToTombstone(match, { deletedAt, reason, deletedBy }) {
  const tombDir = join(match.factDir, 'archive', 'tombstones');
  mkdirSync(tombDir, { recursive: true });
  // Task 281: the escaped spelling, so a case-pair of ids cannot collapse to
  // one file on a case-insensitive filesystem and destroy the first tombstone.
  const tombPath = archiveWritePath(tombDir, match.id);
  // Read + parse the original, inject deletion fields at the top of the
  // frontmatter object, write via the canonical formatter. No regex hacks.
  const { frontmatter, body } = parse(readFileSync(match.path, 'utf8'));
  const updated = {
    deleted_at: deletedAt,
    deleted_reason: reason,
    deleted_by: deletedBy,
    ...(frontmatter ?? {}),
  };
  writeFileSync(tombPath, format({ frontmatter: updated, body }), 'utf8');
  unlinkSync(match.path);
  return tombPath;
}

function scrubScratchpadFile(filePath, id) {
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split('\n');
  const removeIdx = new Set();

  for (let i = 0; i < lines.length; i++) {
    if (removeIdx.has(i)) continue;
    const line = lines[i];

    if (line.startsWith('- ') && line.includes(id)) {
      removeIdx.add(i);
      const next = lines[i + 1];
      if (next && /^\s*<!--/.test(next)) {
        removeIdx.add(i + 1);
      }
    } else if (
      /^\s*<!--/.test(line) &&
      line.includes(id) &&
      line.includes('-->')
    ) {
      removeIdx.add(i);
      if (i > 0 && lines[i - 1].startsWith('- ') && !removeIdx.has(i - 1)) {
        removeIdx.add(i - 1);
      }
    }
  }

  if (removeIdx.size === 0) return { changed: false, removed: 0 };

  const bulletsRemoved = [...removeIdx].filter((i) =>
    lines[i].startsWith('- '),
  ).length;
  const out = lines.filter((_, i) => !removeIdx.has(i));
  writeFileSync(filePath, out.join('\n'), 'utf8');
  return { changed: true, removed: bulletsRemoved };
}

// NOT a fact walk — this walks the TIER ROOT for scratchpads, a different
// collection that happens to share the .md + INDEX.md skip. It takes the shared
// `listMarkdownFiles` primitive with its own exclusion set rather than the fact
// walker, so the two stay independently correct.
//
// DECISIONS.md is the APPEND-ONLY decision journal (Task 147 / D-161), NOT a
// scratchpad — forget must NOT strip its id-bearing lines (the marker +
// **Fact:** line). The journal sync marks the entry RETRACTED in place instead
// (preserving the trail). Scrubbing it here would delete the entry's marker and
// break the retract-in-place path (composition bug).
const SCRATCHPAD_WALK_EXCLUDE = [INDEX_FILENAME, 'DECISIONS.md'];

function scrubAllScratchpads(tierRoot, id) {
  const edits = [];
  for (const filename of listMarkdownFiles(tierRoot, { exclude: SCRATCHPAD_WALK_EXCLUDE })) {
    const p = join(tierRoot, filename);
    const r = scrubScratchpadFile(p, id);
    if (r.changed) edits.push({ path: p, removed: r.removed });
  }
  return edits;
}

export function forget(opts = {}) {
  const {
    idOrQuery,
    projectRoot,
    userDir,
    reason,
    deletedBy,
    yes,
    confirm,
    now,
  } = opts;

  if (!idOrQuery || typeof idOrQuery !== 'string') {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: ['idOrQuery: required, non-empty string'],
    });
  }

  // PR-2: B2 restriction on reason is RELAXED (js-yaml quotes strings with
  // \n / \r / :). Only type-check remains.
  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: ['reason: must be a string'],
    });
  }

  const resolved = ID_PATTERN.test(idOrQuery)
    ? resolveById(idOrQuery, { projectRoot, userDir })
    : resolveByQuery(idOrQuery, { projectRoot, userDir });

  if (resolved.matches.length === 0) {
    // If the id is actually a scratchpad BULLET (the `cmk search` id mix-up —
    // search lists bullet ids too, but forget tombstones FACTS), say so instead
    // of the flat "no matching fact".
    const bulletIn = ID_PATTERN.test(idOrQuery)
      ? findBulletScratchpad(idOrQuery, { projectRoot, userDir })
      : null;
    if (bulletIn) {
      return notFoundResult({
        errors: [
          `'${idOrQuery}' is a scratchpad bullet in ${bulletIn}, not a fact — \`cmk forget\` tombstones facts in context/memory/. A high-trust bullet becomes forgettable by this same id once it graduates to a fact (under cap pressure / at session end); a low/medium one ages out via consolidation. To remove it now, edit ${bulletIn} directly.`,
        ],
      });
    }
    return notFoundResult({
      errors: [`no matching fact for "${idOrQuery}"`],
    });
  }
  if (resolved.matches.length > 1) {
    const ids = resolved.matches.map((m) => m.id);
    return errorResult({
      category: ERROR_CATEGORIES.COLLISION,
      errors: [
        `ambiguous query "${idOrQuery}" matched multiple facts: ${ids.join(', ')}`,
      ],
      candidateIds: ids,
    });
  }

  const match = resolved.matches[0];

  if (!yes) {
    if (typeof confirm !== 'function') {
      throw new Error(
        "forget(): must provide either yes: true or a confirm() callback (refusing to silently delete)",
      );
    }
    const proceed = confirm({
      id: match.id,
      tier: match.tier,
      path: match.path,
      title: match.frontmatter?.title,
      body: match.body,
    });
    if (!proceed) {
      return {
        action: 'cancelled',
        id: match.id,
        tier: match.tier,
        originalPath: match.path,
      };
    }
  }

  const deletedAt = now ?? nowIso();
  const tombstoneReason = reason ?? '';
  const tombstoneDeletedBy = deletedBy ?? 'user-explicit';
  const tombstonePath = moveFactToTombstone(match, {
    deletedAt,
    reason: tombstoneReason,
    deletedBy: tombstoneDeletedBy,
  });

  const scratchpadEdits = scrubAllScratchpads(match.tierRoot, match.id);

  appendAuditEntry(match.tierRoot, {
    ts: deletedAt,
    action: 'tombstoned',
    tier: match.tier,
    id: match.id,
    reasonCode: REASON_CODES.USER_REQUESTED,
    reasonText: tombstoneReason || undefined,
    paths: { before: match.path, archive: tombstonePath },
    extra: {
      deletedBy: tombstoneDeletedBy,
      scratchpadEdits: scratchpadEdits.map((e) => ({
        path: e.path,
        removed: e.removed,
      })),
    },
  });

  // Task 124 (D-112): the writer owns the derived view on the DELETE path
  // too — writeFact refreshes INDEX.md on every create (the Task-85 lesson);
  // without this, the tombstoned fact stayed listed in INDEX.md and doctor
  // HC-4 failed until a manual `cmk reindex` (dogfood-found 2026-06-10).
  // Best-effort, same contract as writeFact's: the tombstone is already
  // durable on disk, so an index hiccup must not fail the forget.
  try {
    reindex({ tier: match.tier, projectRoot, userDir, warn: () => {} });
  } catch {
    // index rebuild is best-effort; the tombstone already succeeded
  }

  // Task 110 (F-7 / D-84): reindex the project tier IN-BAND so the just-
  // tombstoned fact stops surfacing in `cmk search` immediately — no manual
  // `cmk reindex`, no forgotten fact resurfacing (D-85: the action completes
  // automatically; the regular user runs no follow-up command). reindexBoot's
  // orphan-prune drops the unlinked fact's index rows and re-reads the scrubbed
  // scratchpads in one pass. Both `cmk forget` (CLI) and `mk_forget` (MCP) call
  // this same forget(), so both surfaces get it. Best-effort: the fact is
  // ALREADY tombstoned + scrubbed on disk, so an index error must not fail the
  // forget — every index reader lazy-reindexes (also orphan-pruning) and self-
  // heals on the next read. A pure user-tier forget (no projectRoot) has no
  // project index to touch and skips this.
  let reindexed = false;
  if (projectRoot) {
    try {
      const db = openIndexDb({ projectRoot });
      try {
        reindexBoot({ projectRoot, userDir, db });
        reindexed = true;
      } finally {
        db.close();
      }
    } catch {
      // best-effort — the on-disk tombstone is authoritative; search self-heals.
    }
  }

  return {
    action: 'tombstoned',
    id: match.id,
    tier: match.tier,
    originalPath: match.path,
    tombstonePath,
    scratchpadEdits,
    reindexed,
  };
}

export function resolveFact({ id, projectRoot, userDir }) {
  if (!id || !ID_PATTERN.test(id)) return { state: 'not-found' };
  const tier = id[0];
  const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
  const factDir = resolveFactDir(tier, tierRoot);

  // `eachFactIn`, not `eachLiveFact`: this resolver REPORTS the state, so it
  // must see a tombstoned fact still sitting in the fact dir and label it
  // rather than skip it.
  for (const fact of eachFactIn(factDir)) {
    if (fact.frontmatter.id === id) {
      return {
        state: fact.frontmatter.deleted_at ? 'tombstoned' : 'live',
        path: fact.path,
        body: fact.body,
        frontmatter: fact.frontmatter,
        deletedAt: fact.frontmatter.deleted_at,
      };
    }
  }

  // Task 281: resolves the escaped spelling, falling back to a LEGACY raw-id
  // file so corpora written before the fix stay readable with no migration.
  const tombPath = archiveReadPath(join(factDir, 'archive', 'tombstones'), id);
  if (tombPath) {
    const { frontmatter, body } = readFactAt(tombPath);
    return {
      state: 'tombstoned',
      path: tombPath,
      body,
      frontmatter,
      deletedAt: frontmatter?.deleted_at,
    };
  }

  const supersededPath = archiveReadPath(join(factDir, 'archive', 'superseded'), id);
  if (supersededPath) {
    const { frontmatter, body } = readFactAt(supersededPath);
    return {
      state: 'superseded',
      path: supersededPath,
      body,
      frontmatter,
      supersededBy: frontmatter?.superseded_by,
    };
  }

  return { state: 'not-found' };
}
