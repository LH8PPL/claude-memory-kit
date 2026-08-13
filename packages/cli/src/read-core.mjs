// Shared read cores (Task 108b / ADR-0014).
//
// The query logic behind the MCP read tools (mk_get / mk_timeline / mk_cite /
// mk_recent_activity), extracted so the CLI read verbs (cmk get / timeline /
// cite / recent-activity) call the SAME logic — identical results from both
// surfaces, one implementation. Pure (db + args in, plain data out); the MCP
// adapter wraps the result in a content envelope, the CLI adapter prints it.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, basename } from 'node:path';
import { ID_PATTERN } from './tier-paths.mjs';
import { archiveReadPath } from './fact-store.mjs';
import { parse as parseFrontmatter } from './frontmatter.mjs';
import { stateFieldFor } from './state-label.mjs';
import { relatedRefsFor, traverseLinks, supersessionChain, anchorNodeForToken } from './graph-index.mjs';

const GET_COLUMNS =
  'id, body, heading_path, source_file, source_line, tier, trust, ' +
  'write_source, created_at, superseded_by, deleted_at, expires_at';

/**
 * Fetch full observation rows by id. An invalid-format or missing id becomes
 * a `{ id, error }` entry (the array stays positionally aligned with `ids`).
 *
 * Task 155 (D-163) — opt-in tombstone recovery. By DEFAULT this is live-only:
 * a forgotten id (its index row pruned by Task 110, the body moved to
 * `context/memory/archive/tombstones/<id>.md`) returns `not found`. The
 * automatic recall surfaces (the SessionStart snapshot, `mk_search`, `mk_get`)
 * MUST stay on this default — a deleted fact must remain invisible to the agent
 * (resurfacing it is the worst memory-product failure). ONLY an explicit
 * HUMAN-driven `cmk get --include-tombstoned` opts in, passing
 * `{ includeTombstoned: true, projectRoot }`; on a live miss it then reads the
 * tombstone file directly and returns its body marked `tombstoned: true`.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.includeTombstoned=false] human-only recovery opt-in
 * @param {string}  [opts.projectRoot] required when includeTombstoned (to find the archive)
 * @param {number|string} [opts.now] state-label clock injection (Task 209; default wall clock)
 */
export function getObservations(db, ids, { includeTombstoned = false, projectRoot, now } = {}) {
  const stmt = db.prepare(`SELECT ${GET_COLUMNS} FROM observations WHERE id = ?`);
  return ids.map((id) => {
    if (!ID_PATTERN.test(id)) return { id, error: 'invalid id format' };
    const row = stmt.get(id);
    // Task 209: rows carry their temporal STATE where ≠ current-active (the
    // A-TMA label projection); current rows carry no state key (zero noise).
    // Task 232 (ADR-0023): surface the fact's `related` out-links (the written
    // edges that were invisible until now) — only when the fact actually carries
    // any, so a plain fact stays noise-free. This is the same graph the
    // `cmk links` verb walks; here it is the depth-1 out-neighbourhood.
    if (row) {
      const related = relatedRefsFor(db, id);
      return {
        ...row,
        ...stateFieldFor(row, now),
        ...(related.length > 0 ? { related } : {}),
      }; // a LIVE hit always wins
    }
    // Live miss. Recovery is opt-in AND needs projectRoot to locate the archive.
    if (includeTombstoned && projectRoot) {
      const recovered = readTombstone(projectRoot, id);
      // A recovered tombstone is by definition retracted — label it so the
      // human-driven recovery output states its currency explicitly.
      if (recovered) return { ...recovered, state: 'retracted' };
    }
    return { id, error: 'not found' };
  });
}

/**
 * Read a tombstoned fact's body + deletion provenance from
 * `<projectRoot>/context/memory/archive/tombstones/<id>.md`. Returns a row-like
 * object marked `tombstoned: true`, or null if no tombstone exists for the id.
 * Read-only; never un-tombstones (that would be a separate `restore` verb).
 */
function readTombstone(projectRoot, id) {
  // SAFETY: `id` is interpolated into the path, but every caller reaches here
  // ONLY after getObservations' `ID_PATTERN.test(id)` gate (anchored
  // /^[PUL]-[base32]{8}$/ — no `.`/`/`/`\`), so it cannot path-traverse out of
  // the tombstones dir. Do NOT call readTombstone before that validation.
  // Task 281: the filename is DERIVED (escaped `a` → `_a`), with a legacy
  // raw-id fallback for corpora written before the fix — see fact-store's
  // archive-filename note. The SAFETY gate above is unchanged and still
  // required: the helper maps `a` only and sanitizes nothing.
  const tombDir = join(projectRoot, 'context', 'memory', 'archive', 'tombstones');
  const tombPath = archiveReadPath(tombDir, id);
  if (!tombPath) return null;
  const { frontmatter, body } = parseFrontmatter(readFileSync(tombPath, 'utf8'));
  const fm = frontmatter ?? {};
  // `tombstoned: true` is the SOLE discriminator for recovered-vs-live — a live
  // row never carries it. Consumers must key off this, NOT off `deleted_at`
  // presence (a live row can carry a null deleted_at too). A malformed/garbled
  // tombstone still returns its raw body + null provenance (graceful degrade —
  // a human recovering is precisely the case where something went wrong).
  return {
    id,
    body: body ?? '',
    heading_path: fm.title ?? null,
    // derived from the RESOLVED path, so it names the file actually read
    // (escaped or legacy) rather than a spelling that may not exist on disk.
    source_file: `context/memory/archive/tombstones/${basename(tombPath)}`,
    source_line: 1, // synthetic — the tombstone file has no meaningful source line
    tier: fm.tier ?? null,
    trust: fm.trust ?? null,
    write_source: fm.write_source ?? null,
    created_at: fm.created_at ?? fm.at ?? null,
    superseded_by: fm.superseded_by ?? null,
    deleted_at: fm.deleted_at ?? null,
    deleted_reason: fm.deleted_reason ?? null,
    deleted_by: fm.deleted_by ?? null,
    tombstoned: true,
  };
}

/** The canonical Markdown citation link for an id. Pure (no DB). */
export function citeLink(id) {
  if (!ID_PATTERN.test(id)) return { ok: false, error: 'id must match ID_PATTERN' };
  return { ok: true, link: `[#${id}](memkit://obs/${id})` };
}

// --- The EXPAND rung (Task 226, D-326) -----------------------------------
//
// The missing middle rung of the recall ladder: a search hit returns the
// matched chunk; answering "what did we decide and why" often needs the
// hit's NEIGHBORHOOD — the rest of its heading section in the SOURCE file.
// mk_timeline is a different axis (created_at-adjacent observations);
// expand is source-file-adjacent content. Bounded by EXPAND_MAX_CHARS —
// never the whole file. Read-only.

export const EXPAND_MAX_CHARS = 4000;

const T_ID_RE = /^T:(.+):(\d+)$/;
const HEADING_RE = /^(#{1,6})\s/;

// Resolve a db-carried source_file against its tier's base dir, refusing
// anything that escapes the base (the db is kit-written, but a hostile
// T:-shaped id is user/model input — same guard class as readTombstone).
function resolveSourceAbs(sourceFile, tier, { projectRoot, userDir }) {
  const base = tier === 'U' ? userDir : projectRoot;
  if (!base || typeof sourceFile !== 'string' || sourceFile === '') return null;
  const abs = resolve(base, sourceFile);
  const rel = relative(base, abs);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null;
  return abs;
}

// The enclosing heading section of a 1-based anchor line: the nearest
// heading at-or-above the anchor, down to the next heading of the same or
// higher level (or EOF). No heading above → from the file start to the
// first heading after the anchor.
function extractSection(lines, anchorLine) {
  const anchorIdx = Math.min(Math.max(anchorLine - 1, 0), lines.length - 1);
  let start = 0;
  let level = 7;
  let heading = null;
  for (let k = anchorIdx; k >= 0; k--) {
    const m = HEADING_RE.exec(lines[k]);
    if (m) {
      start = k;
      level = m[1].length;
      heading = lines[k].trim();
      break;
    }
  }
  let end = lines.length;
  for (let k = (heading ? start + 1 : anchorIdx + 1); k < lines.length; k++) {
    const m = HEADING_RE.exec(lines[k]);
    if (m && m[1].length <= level) {
      end = k;
      break;
    }
  }
  return { start, end, heading, anchorIdx };
}

// Bound an oversized section to a char window CENTERED on the anchor line,
// aligned to line boundaries so the reader never sees a torn line.
function windowSection(lines, { start, end, anchorIdx }, maxChars) {
  const section = lines.slice(start, end);
  const full = section.join('\n');
  if (full.length <= maxChars) return { content: full, truncated: false };

  const anchorInSection = anchorIdx - start;
  let lo = anchorInSection;
  let hi = anchorInSection;
  let budget = maxChars - lines[anchorIdx].length;
  // Grow outward, alternating, until the budget is spent.
  while (budget > 0 && (lo > 0 || hi < section.length - 1)) {
    let grew = false;
    if (lo > 0 && section[lo - 1].length + 1 <= budget) {
      lo -= 1;
      budget -= section[lo].length + 1;
      grew = true;
    }
    if (budget > 0 && hi < section.length - 1 && section[hi + 1].length + 1 <= budget) {
      hi += 1;
      budget -= section[hi].length + 1;
      grew = true;
    }
    if (!grew) break;
  }
  // Hard clamp (skill-review M-finding): a single anchor line larger than
  // maxChars would otherwise exceed the cap on its own.
  let content = section.slice(lo, hi + 1).join('\n');
  if (content.length > maxChars) content = content.slice(0, maxChars);
  return { content, truncated: true };
}

/**
 * Expand a recall hit to its source-file neighborhood: the enclosing
 * heading section, bounded. Accepts BOTH hit-id shapes the search surface
 * returns — a fact/scratchpad observation id (`P-XXXXXXXX`) and a
 * transcript-chunk id (`T:<source_file>:<source_line>`).
 *
 * @returns {{id, source_file, source_line, tier, heading, content, truncated}
 *          | {id, error}}
 */
export function expandObservation(db, id, { projectRoot, userDir, maxChars = EXPAND_MAX_CHARS } = {}) {
  const raw = String(id ?? '');
  let sourceFile;
  let sourceLine;
  let tier = 'P';

  const t = T_ID_RE.exec(raw);
  if (t) {
    sourceFile = t[1];
    sourceLine = Number(t[2]);
    // SECURITY (skill-review Blocking, D-356): a T: id is FREE-FORM,
    // model-suppliable input (mk_expand) — the traversal guard below stops
    // ESCAPES, but the unscreened files INSIDE the project (the gitignored
    // redactions.log with every redaction's plaintext original, the raw
    // imported/ floor, *.live.md, now.md) would otherwise be readable by
    // path. Gate on the transcript-chunk INDEX: only a source_file the
    // indexer actually indexed is expandable — transcript-index.mjs's
    // exclusion set is exactly the unscreened surface, so "never indexed"
    // becomes an enforced read-boundary instead of a description.
    const indexed = db
      .prepare('SELECT 1 FROM transcript_chunks WHERE source_file = ? LIMIT 1')
      .get(sourceFile);
    if (!indexed) return { id: raw, error: 'not an indexed transcript source' };
  } else if (ID_PATTERN.test(raw)) {
    const row = db
      .prepare('SELECT source_file, source_line, tier FROM observations WHERE id = ?')
      .get(raw);
    if (!row) return { id: raw, error: 'not found' };
    sourceFile = row.source_file;
    sourceLine = row.source_line ?? 1;
    tier = row.tier ?? 'P';
  } else {
    return { id: raw, error: 'invalid id format (expected a kit observation id or T:<file>:<line>)' };
  }

  const abs = resolveSourceAbs(sourceFile, tier, { projectRoot, userDir });
  if (!abs) return { id: raw, error: `source path refused: ${sourceFile}` };
  if (!existsSync(abs)) return { id: raw, error: `source file not found: ${sourceFile}` };

  let text;
  try {
    text = readFileSync(abs, 'utf8');
  } catch (err) {
    return { id: raw, error: `source unreadable: ${err?.message ?? err}` };
  }
  const lines = text.split('\n');
  const section = extractSection(lines, sourceLine);
  const { content, truncated } = windowSection(lines, section, maxChars);
  return {
    id: raw,
    source_file: sourceFile,
    source_line: sourceLine,
    tier,
    heading: section.heading,
    content,
    truncated,
  };
}

const TIMELINE_COLUMNS = 'id, body, source_file, source_line, tier, trust, created_at';

/**
 * Sequential context: N observations before the anchor + the anchor + N after,
 * by created_at (id as the tiebreaker so same-millisecond rows stay
 * deterministic). Returns `{ ok:false, error }` for a bad / missing anchor.
 */
export function buildTimeline(db, { anchor, depthBefore = 5, depthAfter = 5 } = {}) {
  if (!ID_PATTERN.test(anchor)) return { ok: false, error: 'anchor must be a valid kit ID' };
  const anchorRow = db
    .prepare('SELECT created_at, tier FROM observations WHERE id = ?')
    .get(anchor);
  if (!anchorRow) return { ok: false, error: 'anchor not found' };
  const beforeRows = db
    .prepare(`
      SELECT ${TIMELINE_COLUMNS} FROM observations
      WHERE created_at < ? AND deleted_at IS NULL
      ORDER BY created_at DESC, id DESC LIMIT ?
    `)
    .all(anchorRow.created_at, depthBefore);
  const anchorFull = db
    .prepare(`SELECT ${TIMELINE_COLUMNS} FROM observations WHERE id = ?`)
    .get(anchor);
  const afterRows = db
    .prepare(`
      SELECT ${TIMELINE_COLUMNS} FROM observations
      WHERE created_at > ? AND deleted_at IS NULL
      ORDER BY created_at ASC, id ASC LIMIT ?
    `)
    .all(anchorRow.created_at, depthAfter);
  return { ok: true, timeline: [...beforeRows.reverse(), anchorFull, ...afterRows] };
}

export const RECENT_WINDOWS = Object.freeze({
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
});

// --- The LINKS axis (Task 232, ADR-0023 ACTIVATE / D-392) ------------------
//
// The relational adjacency axis — the fourth beside `expand` (source-file),
// `timeline` (created_at), and `--scope decisions` (evolution). Answers the two
// genuinely graph-only query shapes the flat hybrid can't: BACKLINKS ("what
// points AT this fact") and SUPERSESSION CHAINS ("what replaced what, in
// order"). Shared CLI/MCP core (ADR-0014): `cmk links` + `mk_links` are thin
// adapters over this.

/**
 * The link neighbourhood of an observation id: its out-links (what it
 * references), backlinks (what references it), and the full supersession chain
 * it participates in. Read-only, pure DB (edges table).
 *
 * Accepts a kit observation id OR an anchor token (Task 256): `D-361`,
 * `Task 232`, `ADR-0023`, `FR-13`, `NFR-9` — normalized to its `anchor:` node,
 * so `cmk links D-361` answers "what cites D-361" (its citers as backlinks; an
 * anchor is a graph sink, so `out` is empty). A token that is neither returns
 * the schema-error shape, never a crash.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} idOrAnchor  a kit observation id or an anchor token
 * @param {object} [opts]
 * @param {number} [opts.depth=1]           traversal depth for out/backlinks
 * @param {'in'|'out'|'both'} [opts.direction='both']
 * @returns {{ok:false, error:string} | {ok:true, id, found, depth, direction,
 *          out?, backlinks?, supersession_chain}}
 */
export function buildLinks(db, idOrAnchor, { depth = 1, direction = 'both' } = {}) {
  const id = anchorNodeForToken(idOrAnchor);
  if (!id) {
    return {
      ok: false,
      error: 'id must be a valid kit ID or anchor token (D-nnn, Task nnn, ADR-nnnn, FR-nn, NFR-nn)',
    };
  }
  const dir = direction === 'in' || direction === 'out' ? direction : 'both';
  const d = Math.max(1, Math.min(Number(depth) || 1, 20));

  // `found` = the id is a known observation OR it appears as any edge endpoint
  // (a dangling target can still have backlinks). This lets `links` answer for a
  // superseded fact whose row is present and for a slug-only reference alike.
  const knownRow = db.prepare('SELECT 1 FROM observations WHERE id = ? LIMIT 1').get(id);
  const anyEdge = db.prepare('SELECT 1 FROM edges WHERE src = ? OR dst = ? LIMIT 1').get(id, id);
  const found = Boolean(knownRow || anyEdge);

  const edges = traverseLinks(db, id, { depth: d, direction: dir });
  const out = edges
    .filter((e) => e.direction === 'out')
    .map((e) => ({ to: e.to_id, type: e.type, resolved: e.dst_resolved === 1, depth: e.depth }));
  const backlinks = edges
    .filter((e) => e.direction === 'in')
    .map((e) => ({ from: e.from_id, type: e.type, depth: e.depth }));
  const chain = supersessionChain(db, id);

  return {
    ok: true,
    id,
    found,
    depth: d,
    direction: dir,
    ...(dir !== 'in' ? { out } : {}),
    ...(dir !== 'out' ? { backlinks } : {}),
    // Only meaningful when the fact actually participates in a supersession
    // chain (length > 1); a lone `[id]` is noise, so null it out.
    supersession_chain: chain.length > 1 ? chain : null,
  };
}

/** Observations changed within a time window, newest first. */
export function recentActivity(db, { window = '24h', limit = 20 } = {}) {
  if (!RECENT_WINDOWS[window]) return { ok: false, error: 'window must be 1h|24h|7d' };
  const cutoff = Date.now() - RECENT_WINDOWS[window];
  const rows = db
    .prepare(`
      SELECT id, body, source_file, source_line, tier, trust, created_at
      FROM observations
      WHERE created_at >= ? AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT ?
    `)
    .all(cutoff, limit);
  return { ok: true, rows };
}
