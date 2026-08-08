// graph-index.mjs — the relational adjacency axis (Task 232, ADR-0023 ACTIVATE
// slice / D-392).
//
// The kit already WROTE two edge kinds it never traversed: `related:`
// frontmatter (+ `[[slug]]` body wikilinks) and the `superseded_by` FK. Until
// now they were invisible — not indexed, not returned by `mk_get`, targets not
// in the FTS body — so backlinks ("what points AT this fact") and supersession
// chains ("what replaced what, in order") were genuinely unanswerable, and the
// model had no reinforcement loop to write MORE edges (a write-only capability).
//
// This module ACTIVATES them into the `edges(src, dst, type, dst_resolved)`
// table (schema: index-db.mjs). Two responsibilities:
//   1. rebuildEdges() — the deterministic, byte-stable rebuild FROM the markdown
//      (ADR-0002: markdown is the only source of truth; the table drops +
//      rebuilds exactly like the FTS mirror). Zero LLM, zero drift.
//   2. the query helpers the read surface (read-core.buildLinks + getObservations)
//      and `cmk links` / `mk_links` compose over — pure DB reads, no file IO.
//
// SHARED-MODULE DISCIPLINE (CLAUDE.md): the fact walk goes through
// fact-store.eachFact (never a hand-rolled readdir), frontmatter parsing is
// already done by that walker, and path/id concerns stay in tier-paths.

import { eachFact, eachSupersededFact } from './fact-store.mjs';
import { ID_PATTERN } from './tier-paths.mjs';

// Fact filenames are `<type>_<slug>.md`; `related:` values + `[[slug]]` body
// wikilinks reference the bare SLUG (slugifyFact output — only [a-z0-9-], never
// `_`). Strip a known type prefix to recover the slug the reference resolves to.
const FACT_TYPE_PREFIX = /^(user|feedback|project|reference|judgment)_/;

/** Recover the reference-slug for a fact filename (`feedback_foo-bar.md` → `foo-bar`). */
export function slugForFactFilename(filename) {
  return String(filename).replace(/\.md$/i, '').replace(FACT_TYPE_PREFIX, '');
}

// `[[wikilink]]` body references. The inner MUST be slug-shaped (slugifyFact
// output: starts alphanumeric, then [a-z0-9_-]) so shell/regex noise that
// happens to double-bracket is never mistaken for a link — `[[ -f "$x" ]]` (bash
// test) and `[[:digit:]]` (POSIX class) both fail the leading-alnum requirement.
// Tolerant of surrounding whitespace (`[[ foo ]]`); a pipe alias
// (`[[slug|label]]`) keeps only the slug half (the write side stores bare slugs).
const WIKILINK_RE = /\[\[\s*([a-z0-9][a-z0-9_-]*)\s*(?:\|[^\]]*)?\]\]/gi;

// Fenced code blocks (``` … ``` / ~~~ … ~~~) and inline code spans (`…`) are
// NOT link context (the Obsidian convention) — `arr[[i]]` inside code is array
// indexing, not a wikilink. Strip them before extracting so code samples in a
// fact body never mint edges. Fenced first (may span lines), then inline.
function stripCode(text) {
  return String(text ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ');
}

/** Extract the distinct `[[slug]]` references from a fact body, in first-seen order. */
export function extractWikilinks(body) {
  const out = [];
  const seen = new Set();
  for (const m of stripCode(body).matchAll(WIKILINK_RE)) {
    const slug = m[1].trim();
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}

// --- Anchor co-citation (Task 256, ADR-0023 ACTIVATE slice / D-400) ----------
//
// Fact bodies densely cite structured anchors the kit itself defines — decision
// ids (`D-nnn`), tasks (`Task nnn`), ADRs (`ADR-nnnn`), requirements
// (`FR-nn`/`NFR-nn`) — plus bare kit fact ids (`[PUL]-XXXXXXXX`). None of that
// lattice was parsed. This extracts it into `cites` edges (fact → anchor) as a
// CAPPED STAR: each anchor is one hub node, each citing fact one spoke, so a
// 50-fact group costs 50 edges (linear) — never the C(50,2)=1,225 all-pairs
// co-occurrence Task 232 skipped as O(n²). The cap answers 232's objection
// rather than overruling it (D-400).
//
// Two node kinds share the `cites` type, disambiguated by an `anchor:` prefix:
//   - a DOC-ANCHOR (D/Task/ADR/FR/NFR) is a NON-FILE node → dst = `anchor:D-361`,
//     dst_resolved = 0. The prefix keeps it unambiguously distinct from a fact id
//     in `cmk links` output AND keeps id-backlink queries (dst_resolved = 1) from
//     ever matching an anchor.
//   - a cited FACT id is a real node → dst = the bare id, dst_resolved = 1 when
//     that fact exists in the corpus, 0 when it dangles (a direct fact→fact edge,
//     exactly like a `link`).
//
// Two noise guards, applied to DOC-ANCHOR hubs ONLY (a fact-id citation is a
// direct edge — always relational signal, never a corpus-wide stopword — so it
// is exempt from both):
//   - MIN_ANCHOR_CITERS — an anchor cited by fewer than this many DISTINCT facts
//     forms no co-citation cluster (a lone leaf that clutters the Obsidian graph
//     without densifying it); skipped.
//   - ANCHOR_DF_CEILING_RATIO — an anchor cited by MORE than this fraction of the
//     whole corpus is a degenerate stopword hub; skipped (the obsidian-mind
//     cluster-detector precedent: a token in >half the corpus is noise, not
//     signal). Named constants so the thresholds are one place to tune.
export const MIN_ANCHOR_CITERS = 2;
export const ANCHOR_DF_CEILING_RATIO = 0.5;

// Anchor token matchers (global). Each `expand(match)` yields one OR MORE
// canonical `anchor:` nodes, because the corpus writes these anchors in plural,
// range, and slash-continuation shorthand — not only the bare singular form:
//
//   - `Task 232` / `Tasks 28-35` / `Task 28-35` — the plural `Tasks` and a
//     range. A RANGE emits its ENDPOINTS ONLY (`Task-28` + `Task-35`); the
//     interior isn't literally cited, so expanding it would fabricate edges.
//   - `FR-28/29/30` / `NFR-1/2` / `D-40/153` — slash-continuation shorthand
//     where trailing bare numbers inherit the prefix → one node each. (The
//     `D-40/D-153` form where each part carries its OWN prefix already yields
//     two nodes via a re-scan — pinned by test — so the slash group is only for
//     the bare-continuation case.)
//   - `ADR-0023` — 4-digit, singular only (files are `00NN`; no plural/range).
//
// NFR is matched by its own pattern before FR; `\bFR-` cannot match inside
// `NFR-` (the `N` before `F` is a word char → no `\b` there), so FR never steals
// an NFR token. The trailing `\b` (after the last digit group) keeps a
// possessive (`Task 232's`) matching while a glued suffix (`D-361x`,
// `v0.6.3`) does not.
function slashNodes(prefix, head, tail) {
  const nums = [head];
  if (tail) for (const n of tail.split('/')) if (n) nums.push(n);
  return nums.map((n) => `anchor:${prefix}-${n}`);
}
function rangeNodes(prefix, a, b) {
  return b ? [`anchor:${prefix}-${a}`, `anchor:${prefix}-${b}`] : [`anchor:${prefix}-${a}`];
}
const ANCHOR_MATCHERS = [
  { re: /\bD-(\d+)((?:\/\d+)*)\b/g, expand: (m) => slashNodes('D', m[1], m[2]) },
  { re: /\bTasks?[\s-]+(\d+)(?:\s*-\s*(\d+))?\b/g, expand: (m) => rangeNodes('Task', m[1], m[2]) },
  { re: /\bADR-(\d{4})\b/g, expand: (m) => [`anchor:ADR-${m[1]}`] },
  { re: /\bNFR-(\d+)((?:\/\d+)*)\b/g, expand: (m) => slashNodes('NFR', m[1], m[2]) },
  { re: /\bFR-(\d+)((?:\/\d+)*)\b/g, expand: (m) => slashNodes('FR', m[1], m[2]) },
];

// Bare kit fact ids cited in a body (the ID_PATTERN body, global). Same alphabet
// as tier-paths.ID_PATTERN (base32, no 0/O/1/l/I/8).
const FACT_ID_G = /\b[PUL]-[2345679ABCDEFGHJKLMNPQRSTUVWXYZa]{8}\b/g;

/**
 * Extract the distinct anchor citations from a fact body, in first-seen order.
 * Code fences + inline code are stripped first (a literal `D-361` example must
 * never mint an edge). Doc-anchors return their canonical `anchor:` node(s) —
 * one match can yield several (plural/range/slash shorthand); a cited fact id
 * returns the bare id (no prefix — it is a real node).
 */
export function extractAnchors(body) {
  const text = stripCode(body);
  const found = []; // { index, order, node }
  for (const { re, expand } of ANCHOR_MATCHERS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      let order = 0;
      for (const node of expand(m)) found.push({ index: m.index, order: order++, node });
    }
  }
  FACT_ID_G.lastIndex = 0;
  let fm;
  while ((fm = FACT_ID_G.exec(text)) !== null) found.push({ index: fm.index, order: 0, node: fm[0] });
  // First-seen order: by body position, then sub-order within a single match
  // (so `FR-28/29/30` stays 28,29,30). Stable.
  found.sort((a, b) => a.index - b.index || a.order - b.order);
  const seen = new Set();
  const out = [];
  for (const { node } of found) {
    if (!seen.has(node)) {
      seen.add(node);
      out.push(node);
    }
  }
  return out;
}

/**
 * Normalize a `cmk links` / `mk_links` query input to a graph node: a valid
 * fact id passes through unchanged; an anchor token (`D-361`, `Task 232`,
 * `Task-232`, `ADR-0023`, `FR-13`, `NFR-9`) maps to its canonical `anchor:`
 * node; anything else returns null (the caller emits the schema-error shape,
 * never a crash). The whole input must BE the token (anchored match), so a
 * sentence or a malformed `D-361x` is rejected. A range/slash query resolves to
 * its FIRST node (querying `Tasks 28-35` answers for Task-28).
 */
export function anchorNodeForToken(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (ID_PATTERN.test(s)) return s;
  for (const { re, expand } of ANCHOR_MATCHERS) {
    re.lastIndex = 0;
    const m = re.exec(s);
    if (m && m.index === 0 && m[0].length === s.length) return expand(m)[0];
  }
  return null;
}

/**
 * The shared anchor-citation aggregation + guard boundary (used by both
 * rebuildEdges and vault-map's `## Cited anchors` rendering, so the two never
 * drift). Pure over a parsed-fact list.
 *
 * @param {Array<{id:string, filename?:string, body:string}>} facts
 * @param {object} [opts]
 * @param {number} [opts.minAnchorCiters]  distinct-citer floor (default MIN_ANCHOR_CITERS)
 * @param {number} [opts.ceilingRatio]     df-ceiling fraction (default ANCHOR_DF_CEILING_RATIO)
 * @returns {{perFact: Array<{id,filename,tokens:string[]}>,
 *            anchorCiters: Map<string, Set<string>>,
 *            qualifying: Set<string>, ceiling: number}}
 */
export function computeCitations(
  facts,
  { minAnchorCiters = MIN_ANCHOR_CITERS, ceilingRatio = ANCHOR_DF_CEILING_RATIO } = {},
) {
  const perFact = [];
  const anchorCiters = new Map(); // anchor node → Set<distinct citing fact id>
  for (const f of facts) {
    const tokens = extractAnchors(f.body);
    perFact.push({ id: f.id, filename: f.filename, tokens });
    for (const t of tokens) {
      if (!t.startsWith('anchor:')) continue;
      let set = anchorCiters.get(t);
      if (!set) {
        set = new Set();
        anchorCiters.set(t, set);
      }
      set.add(f.id);
    }
  }
  // The df-ceiling never drops below the single-citer floor: floor(N * 0.5) is 1
  // for N ∈ {2, 3}, which is BELOW MIN_ANCHOR_CITERS (2), so a 2-or-3-fact corpus
  // could otherwise NEVER form a doc-anchor edge (`df >= 2 && df <= 1` is
  // vacuously false). `Math.max(minAnchorCiters, …)` is behavior-identical for
  // N ≥ 4 (floor already ≥ 2) and unbreaks the tiny-corpus case.
  const ceiling = Math.max(minAnchorCiters, Math.floor(facts.length * ceilingRatio));
  const qualifying = new Set();
  for (const [t, citers] of anchorCiters) {
    const df = citers.size;
    if (df >= minAnchorCiters && df <= ceiling) qualifying.add(t);
  }
  return { perFact, anchorCiters, qualifying, ceiling };
}

// Normalize a `related:` frontmatter value to a slug list. The writer stores an
// ARRAY of bare slugs, but tolerate a comma-string (a hand-edited fact file).
// Exported (Task 254) so vault-map.mjs renders the SAME relation set the edges
// table is built from, rather than re-rolling the normalization.
export function relatedSlugs(related) {
  if (Array.isArray(related)) return related.map((s) => String(s).trim()).filter(Boolean);
  if (typeof related === 'string') return related.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

// Superseded facts are MOVED to <factDir>/archive/superseded/<id>.md (they leave
// the top-level walk), so the chain's backward pointers live only there. Read
// each archived file's frontmatter for its id + superseded_by. Best-effort per
// file: a malformed archive entry is skipped, never fatal to the rebuild.
// Task 255: the WALK now comes from fact-store's `eachSupersededFact` (the
// shared archive generator — the viewer needed the same walk to draw the
// predecessor node, and two copies of "where superseded facts live" is exactly
// the drift fact-store.mjs exists to stop). What stays here is the only part
// that is this module's own: which of those facts yields a usable EDGE.
function readArchivedSupersededEdges({ projectRoot, userDir }) {
  const out = [];
  for (const { id: src, frontmatter } of eachSupersededFact({ projectRoot, userDir })) {
    const dst = frontmatter?.superseded_by;
    if (ID_PATTERN.test(src) && typeof dst === 'string' && ID_PATTERN.test(dst)) {
      out.push({ src, dst });
    }
  }
  return out;
}

/**
 * Deterministically rebuild the ENTIRE edges table from the markdown fact
 * corpus. Wholesale (not incremental) on purpose: `related`/`[[slug]]`
 * resolution is cross-file — a newly-written fact can resolve a link another
 * fact wrote earlier — so a per-file update could leave a stale danling flag.
 * Rebuilding from the sorted fact walk makes the result a pure function of the
 * on-disk markdown (byte-stable: two rebuilds over the same corpus produce
 * identical rows).
 *
 * Edge kinds emitted per source fact:
 *   - `related`        one per `related:` frontmatter slug
 *   - `link`           one per `[[slug]]` body wikilink
 *   - `superseded_by`  one for the `superseded_by` frontmatter id (already an id)
 *
 * `related`/`link` targets resolve slug→id via the corpus slug map; an
 * unresolved slug is kept verbatim with dst_resolved = 0 (a dangling link stays
 * visible on the `out` side without polluting backlink-by-id queries).
 * Self-edges (src === dst) are dropped.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {object} opts
 * @param {string} [opts.projectRoot]
 * @param {string} [opts.userDir]
 * @returns {{ edgeCount: number }}
 */
export function rebuildEdges(db, { projectRoot, userDir } = {}) {
  // One walk of the fact corpus: collect every fact with its refs, and build the
  // slug→id resolution map in the same pass.
  const facts = [];
  const slugToId = new Map();
  for (const fact of eachFact({ projectRoot, userDir })) {
    const { id, filename, frontmatter, body } = fact;
    facts.push({ id, frontmatter, body });
    // Resolution keys: filename-derived slug (the canonical one), and the
    // frontmatter title when it differs (some facts store title === slug, but a
    // link could reference either). First writer of a key wins; ties resolve to
    // the same id in practice, so precedence is immaterial.
    const slug = slugForFactFilename(filename);
    if (slug && !slugToId.has(slug)) slugToId.set(slug, id);
    const title = frontmatter?.title;
    if (typeof title === 'string' && title.trim() && !slugToId.has(title.trim())) {
      slugToId.set(title.trim(), id);
    }
  }

  // Build the edge set, deduped on (src,dst,type) via a Map keyed on the tuple.
  const edges = new Map();
  const addEdge = (src, dstRaw, type) => {
    let dst = dstRaw;
    let resolved = 1;
    if (type === 'related' || type === 'link') {
      const id = slugToId.get(dstRaw);
      if (id) {
        dst = id;
      } else {
        resolved = 0; // dangling link — keep the raw slug
      }
    }
    if (!dst || src === dst) return; // drop empty + self-edges
    // NUL joins the key parts, written as an ESCAPE and never as a raw byte
    // (a literal NUL is invisible in every editor and makes grep classify the
    // whole file as binary — Task 264(a), the second instance of that class):
    // `dst` may still be an unresolved wikilink slug, which can carry spaces
    // and punctuation, so the separator must be a character no part can hold.
    edges.set(`${src}\u0000${dst}\u0000${type}`, { src, dst, type, dst_resolved: resolved });
  };

  for (const { id, frontmatter, body } of facts) {
    for (const slug of relatedSlugs(frontmatter?.related)) addEdge(id, slug, 'related');
    for (const slug of extractWikilinks(body)) addEdge(id, slug, 'link');
  }

  // Task 256 (D-400): anchor co-citation `cites` edges — the capped star. Each
  // qualifying DOC-ANCHOR gets one edge per distinct citing fact (linear); each
  // cited FACT id gets a direct fact→fact edge (exempt from the guards). The
  // (src,dst,'cites') dedup + the self-edge drop in addCites keep it a star.
  const idSet = new Set(facts.map((f) => f.id));
  const addCites = (src, dst, resolved) => {
    if (!dst || src === dst) return; // drop empty + self-citation
    edges.set(`${src} ${dst} cites`, { src, dst, type: 'cites', dst_resolved: resolved });
  };
  const { perFact, qualifying } = computeCitations(facts);
  for (const { id, tokens } of perFact) {
    for (const token of tokens) {
      if (token.startsWith('anchor:')) {
        if (qualifying.has(token)) addCites(id, token, 0); // non-file hub node
      } else {
        addCites(id, token, idSet.has(token) ? 1 : 0); // cited fact id
      }
    }
  }

  // superseded_by edges come from TWO places, unioned (dedup is automatic via
  // the (src,dst,type) key):
  //   1. the OBSERVATIONS column — any INDEXED fact/bullet carrying superseded_by
  //      (the scratchpad-bullet path; future-proofs an in-place superseded fact).
  //   2. the archive/superseded/ fact FILES — the real home of the chain: when a
  //      fact is superseded it is MOVED there (merge-facts / D-308), taking its
  //      superseded_by frontmatter out of the top-level walk. Without reading
  //      these the chain is unwalkable (the live successor carries no backward
  //      pointer). Each archived file is <id>.md with id: + superseded_by:.
  for (const row of db
    .prepare('SELECT id AS src, superseded_by AS dst FROM observations WHERE superseded_by IS NOT NULL')
    .all()) {
    if (typeof row.dst === 'string' && ID_PATTERN.test(row.dst)) addEdge(row.src, row.dst, 'superseded_by');
  }
  for (const { src, dst } of readArchivedSupersededEdges({ projectRoot, userDir })) {
    addEdge(src, dst, 'superseded_by');
  }

  // Deterministic insert order (src, dst, type) so a byte-stable dump matches
  // across rebuilds. PRIMARY KEY already dedups, but sorting removes any
  // dependence on Map iteration / walk order for the on-disk row order.
  const rows = [...edges.values()].sort(
    (a, b) => a.src.localeCompare(b.src) || a.dst.localeCompare(b.dst) || a.type.localeCompare(b.type),
  );

  const insert = db.prepare(
    'INSERT OR IGNORE INTO edges (src, dst, type, dst_resolved) VALUES (@src, @dst, @type, @dst_resolved)',
  );
  const setSentinel = db.prepare(
    "INSERT INTO meta (key, value) VALUES ('edges_built_at', @ts) " +
      'ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM edges').run();
    for (const r of rows) insert.run(r);
    // Sentinel written in the SAME txn as the rebuild (single-writer): a crash
    // mid-rebuild rolls back both, so the flag never claims a build that didn't
    // land. Its PRESENCE — not the row count — is what tells the boot path the
    // edges have been built at least once (an empty result on a link-free corpus
    // is a legitimate build, not a cold index).
    setSentinel.run({ ts: String(Date.now()) });
  });
  txn();
  return { edgeCount: rows.length };
}

/**
 * Whether the edges table has been built at least once (the meta sentinel is
 * present). Distinguishes a pre-232 / never-built index (migrate once) from a
 * built-but-legitimately-empty one (a corpus with no links — never re-walk).
 */
export function edgesBuilt(db) {
  try {
    return db.prepare("SELECT 1 FROM meta WHERE key = 'edges_built_at' LIMIT 1").get() !== undefined;
  } catch {
    return false; // meta table absent on a very old index → treat as never built
  }
}

// --- Query helpers (pure DB reads) -----------------------------------------

const RELATION_TYPES = "('related', 'link')";

/**
 * The out-neighbours of `id` — the facts this fact points at (its `related` +
 * `[[link]]` targets). Returns the target refs (resolved ids first, then
 * dangling slugs), deterministically ordered. This is what `mk_get`/`cmk get`
 * surface as the fact's `related` list.
 */
export function relatedRefsFor(db, id) {
  // DISTINCT dst: a fact can reference the same target via BOTH `related:`
  // frontmatter AND a `[[wikilink]]` (two edge rows, types `related` + `link`);
  // the surfaced `related` list should name each target once.
  return db
    .prepare(
      `SELECT dst, MAX(dst_resolved) AS dst_resolved FROM edges
       WHERE src = ? AND type IN ${RELATION_TYPES}
       GROUP BY dst
       ORDER BY dst_resolved DESC, dst ASC`,
    )
    .all(id)
    .map((r) => r.dst);
}

/**
 * Breadth-bounded link traversal from `id`, up to `depth` hops, in the requested
 * direction(s). Uses a recursive CTE so the walk happens in SQLite. Returns rows
 * `{ from_id, to_id, type, dst_resolved, depth, direction }`, deduped on the
 * edge + direction, deterministically ordered.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} id
 * @param {object} [opts]
 * @param {number} [opts.depth=1]
 * @param {'in'|'out'|'both'} [opts.direction='both']
 */
export function traverseLinks(db, id, { depth = 1, direction = 'both' } = {}) {
  const d = Math.max(1, Math.min(Number(depth) || 1, 20));
  const dirs = direction === 'both' ? ['out', 'in'] : [direction];
  const out = [];
  const seen = new Set();
  for (const dir of dirs) {
    // Recursive CTE: seed with `id`'s direct neighbours (depth 1), then walk
    // outward following the SAME direction, bounded by depth. The `edge_key`
    // guards against cycles re-adding an edge.
    const nextExpr = dir === 'in' ? 'e.src' : 'e.dst';
    const matchCol = dir === 'in' ? 'e.dst' : 'e.src';
    const rows = db
      .prepare(
        `WITH RECURSIVE walk(node, from_id, to_id, type, dst_resolved, depth) AS (
           SELECT ${nextExpr}, e.src, e.dst, e.type, e.dst_resolved, 1
             FROM edges e WHERE ${matchCol} = @id
           UNION
           SELECT ${nextExpr}, e.src, e.dst, e.type, e.dst_resolved, w.depth + 1
             FROM edges e JOIN walk w ON ${matchCol} = w.node
            WHERE w.depth < @depth
         )
         SELECT from_id, to_id, type, dst_resolved, MIN(depth) AS depth
           FROM walk GROUP BY from_id, to_id, type
           ORDER BY depth ASC, type ASC, from_id ASC, to_id ASC`,
      )
      .all({ id, depth: d });
    for (const r of rows) {
      const key = `${dir}\u0000${r.from_id}\u0000${r.to_id}\u0000${r.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...r, direction: dir });
    }
  }
  return out;
}

/**
 * The supersession chain containing `id`, walked in BOTH directions over
 * `superseded_by` edges and returned oldest→newest. A fact A with
 * `superseded_by: C` is an edge A→C ("A was replaced BY C"), so forward = the
 * successor, backward = the predecessor. Returns `[id]` for a fact with no
 * supersession edges (it is its own trivial chain of length 1); `null` never —
 * callers key on `.length > 1` to decide whether to show a chain.
 *
 * Deterministic: each side is walked to its terminus, then concatenated
 * predecessors → id → successors.
 */
export function supersessionChain(db, id) {
  // Walk backward: predecessors (facts superseded, transitively, by `id`).
  // `depth` = hops from `id`; nearest predecessor first (ORDER BY depth ASC).
  const back = db
    .prepare(
      `WITH RECURSIVE chain(node, depth) AS (
         SELECT src, 1 FROM edges WHERE type = 'superseded_by' AND dst = @id
         UNION
         SELECT e.src, c.depth + 1 FROM edges e JOIN chain c ON e.dst = c.node
          WHERE e.type = 'superseded_by'
       )
       SELECT node FROM chain ORDER BY depth ASC`,
    )
    .all({ id })
    .map((r) => r.node);
  // Walk forward: successors (facts that transitively supersede `id`).
  const fwd = db
    .prepare(
      `WITH RECURSIVE chain(node, depth) AS (
         SELECT dst, 1 FROM edges WHERE type = 'superseded_by' AND src = @id
         UNION
         SELECT e.dst, c.depth + 1 FROM edges e JOIN chain c ON e.src = c.node
          WHERE e.type = 'superseded_by'
       )
       SELECT node FROM chain ORDER BY depth ASC`,
    )
    .all({ id })
    .map((r) => r.node);

  // Order the two sides. superseded_by forms a linear chain per fact, so a
  // topological order is: predecessors (each superseded by the next) → id →
  // successors. Predecessors are discovered nearest-first, so reverse them to
  // put the oldest first; successors are already nearest-first (oldest of the
  // successors first). Dedup defensively against a pathological cycle.
  const ordered = [...back.reverse(), id, ...fwd];
  const seen = new Set();
  return ordered.filter((n) => (seen.has(n) ? false : (seen.add(n), true)));
}
