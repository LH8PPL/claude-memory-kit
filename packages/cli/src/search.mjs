// `cmk search` query engine (Task 30, T-026).
//
// Composes on top of:
//   - index-db.mjs       (Task 28) — observations + observations_fts schema
//   - index-rebuild.mjs  (Task 29) — populates the index
//   - result-shapes.mjs  — ERROR_CATEGORIES, errorResult
//
// Three search modes per design §9.3:
//
//   keyword   FTS5 BM25 over the body / heading_path / write_source columns.
//             ~100ms for 10k bullets. Always available — the keyword
//             backend ships in v0.1.0 with no extra install.
//
//   semantic  the Layer-5b semantic backend (Task 65: sqlite-vec + local ONNX embedder; the embedded
//             vector backend is a future release; the DI seam below is the
//             drop-in point). Until then this mode errors with
//             ERROR_CATEGORIES.SEMANTIC_UNAVAILABLE when the caller
//             requests it without injecting a semantic backend. NO silent
//             fallback to keyword — design §9.3's explicit "exit 2 when
//             not installed" contract.
//
//   hybrid    Reciprocal-rank fusion of keyword + semantic, 0.5/0.5
//             weight per design §9.3. Requires the semantic backend.
//             Errors the same way when semantic is unavailable.
//
// Filter flags (per tasks.md 30.4):
//   minTrust:           'low' | 'medium' | 'high'  — uses ordinal compare
//   tier:               'U' | 'P' | 'L'            — exact match
//   since:              ISO 8601 string             — `created_at >= since`
//   limit:              positive integer            — default 20
//   includeTombstoned:  boolean                     — default false
//                       (default WHERE excludes rows with deleted_at IS NOT NULL)
//   includeExpired:     boolean                     — default false (Task 66.3)
//                       (default WHERE hides rows past their expires_at; the
//                       mem0 show_expired parity — hidden, never deleted)
//   now:                ISO 8601 string             — expiry clock injection
//                       (tests / deterministic runs; defaults to wall clock)
//
// Public boundary:
//   search({db, query, mode?, minTrust?, tier?, since?, limit?,
//           includeTombstoned?, includeExpired?, now?, semanticBackend?})
//   → { action: 'found', mode, results: [{id, snippet, source_file,
//                                          source_line, trust, score}] }
//   → errorResult({category, errors}) on semantic-unavailable / schema-error
//
// `semanticBackend` is a dependency-injection hook for testing the
// hybrid + semantic paths. Production callers (the `cmk search` CLI in
// subcommands.mjs) pass undefined; v0.1.x lands the real backend.

import { ERROR_CATEGORIES, errorResult } from './result-shapes.mjs';
import { readDecisionsJournal } from './decisions-journal.mjs';
import { appendRecallEntry } from './recall-log.mjs';
import { VALID_TIERS } from './tier-paths.mjs';
import { stateFieldFor } from './state-label.mjs';
import { classifyQueryStateView, VALID_STATE_VIEWS, STATE_VIEWS } from './query-state-view.mjs';

export const SEARCH_MODES = Object.freeze({
  KEYWORD: 'keyword',
  SEMANTIC: 'semantic',
  HYBRID: 'hybrid',
});

export const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 1000;

/**
 * The engine's own ceiling on how many ranked rows one call can return.
 *
 * Exported (Task 269) because a PAGING consumer has to know how deep the ranking
 * it is slicing actually goes: the viewer pages a search by asking for
 * `offset + limit` rows and slicing, so its reachable depth IS this number. A
 * copied literal there would silently drift the day this one moves, and the
 * symptom would be a pager that claims a page it cannot serve.
 */
export const SEARCH_MAX_LIMIT = MAX_LIMIT;

// Task 233: the bounded set of recall-origin tags the recall log accepts on a
// `search` entry (skill-fire telemetry). Bounded to keep log cardinality small
// — the CLI (`--source`) coerces unknown values to undefined against this set,
// and the MCP `mk_search` mirrors it as a zod enum. Extend both when adding an
// origin.
export const RECALL_ORIGINS = Object.freeze(['skill']);

// Task 104.2 (D-117) — search scopes. 'facts' = the curated observation
// index (L1, the default). 'transcripts' = the SEPARATE raw-transcript
// chunk index (the L3 last-resort tier) — reached ONLY when explicitly
// asked, so raw history never pollutes curated results.
// Task 156 (D-168) — 'decisions' = the append-only decision journal
// (context/DECISIONS.md). Deliberately NOT FTS-indexed (a derived view,
// skipped like INDEX.md), so this scope scans the markdown file directly. It
// is the recall path for decision-HISTORY / "what did we reject / why did X
// change" queries — the journal carries the retract/supersede trail the flat
// fact store no longer holds. Keyword-only (the journal is not embedded).
export const SEARCH_SCOPES = Object.freeze({
  FACTS: 'facts',
  TRANSCRIPTS: 'transcripts',
  DECISIONS: 'decisions',
});

const TRUST_ORDINAL = Object.freeze({
  low: 1,
  medium: 2,
  high: 3,
});

// Reciprocal-rank fusion constant per design §9.3 (k=60 is the
// standard RRF default from the IR literature; smaller k weights the
// top results more heavily).
const RRF_K = 60;

// --- Task 194: the confidence-gated trust blend (ADR-0017 Phase 2) -----
//
// `BM25 ⊕ λ·trust_score` — the single edit that turns trust_score from
// decorative into load-bearing (the field-wide "inert socket" anti-pattern,
// fixed). Shape: Memoria's retrieval-integrated multiplier
// (`final_score *= (1 + w·(useful − …)).clamp(0.5, 2.0)` — the 2026-07-01
// failure-learning survey's cleanest oracle-free template), adapted to FTS5's
// NEGATIVE-better bm25 rank: a multiplier > 1 pushes the rank more negative
// (better), < 1 shrinks it toward 0 (worse). Multiplicative = scale-invariant
// against corpus-dependent BM25 magnitudes.
//
// CONFIDENCE-GATED: the trust term applies ONLY when the fact carries real
// outcome EVIDENCE — signal_count (the index's feedback counter, incremented
// per APPLIED signal in applyTrustSignal) ≥ BLEND_MIN_SIGNALS. A score nobody
// has tested never moves rank; and because recurrence/restatement lives in
// the initTrustScore SEED (never in signal_count), restatement can't buy
// ranking boosts — the ADR-0017 open seam, resolved.
//
// FACTS ONLY, judgments NEVER rank (ADR-0017 Decision #1): a judgment file
// (writeFact convention: judgment_*.md) is excluded by source_file — the
// checkable rule judgment.mjs's header promises. Inject is UNTOUCHED (§20.3's
// hot path stays enum-ordered — the blend lives here, where the DB is
// already open).

// λ: the max fractional rank adjustment per unit of trust distance. With
// trust_score ∈ [0.05, 0.95] and neutral 0.5, the adjustment is bounded at
// ±λ·0.45 = ±22.5% of the BM25 rank — enough to separate ties and near-ties,
// never enough to let a weak match leapfrog a strong one (well inside
// Memoria's [0.5, 2.0] clamp).
export const BLEND_LAMBDA = 0.5;
// The evidence threshold: 3 applied outcome signals — the kit's existing
// "three occurrences = a pattern" constant (the recurrence promotion gate,
// ADR-0016 §20.1) applied to the loop's evidence.
export const BLEND_MIN_SIGNALS = 3;
// The no-op point: a score at the init default neither boosts nor dampens.
export const BLEND_NEUTRAL = 0.5;

const JUDGMENT_FILE_RE = /(^|[\\/])judgment_[^\\/]*\.md$/;

/**
 * Blend one fact's trust_score into its BM25 rank (pure; exported for
 * isolated unit tests like reciprocalRankFusion).
 *
 * @param {object} o
 * @param {number} o.score        the FTS5 bm25 rank (≤ 0; more negative = better)
 * @param {number} [o.trustScore]  the fact's evolved trust_score [0.05, 0.95]
 * @param {number} [o.signalCount] applied outcome-signal count (the evidence)
 * @param {string} [o.sourceFile]  the row's source_file (judgment exclusion)
 * @returns {number} the blended score (== score when the gate is closed)
 */
export function blendTrustScore({ score, trustScore, signalCount, sourceFile } = {}) {
  if (!Number.isFinite(score)) return score;
  if (!Number.isFinite(trustScore)) return score;
  if (!Number.isFinite(signalCount) || signalCount < BLEND_MIN_SIGNALS) return score;
  if (sourceFile && JUDGMENT_FILE_RE.test(sourceFile)) return score;
  return score * (1 + BLEND_LAMBDA * (trustScore - BLEND_NEUTRAL));
}

// Oversample factor for the keyword fetch when blending: a boosted row just
// past the raw-BM25 cutoff must be able to enter the top-N, and a dampened
// row must SINK, not vanish (re-ranked, never dropped — the demote-not-evict
// posture at the result-list level). ±22.5% max adjustment makes crossings a
// near-boundary phenomenon; 3× is generous.
const BLEND_OVERSAMPLE = 3;

// --- Validation -------------------------------------------------------

function validateInput(opts) {
  const errors = [];
  if (!opts.db || typeof opts.db.prepare !== 'function') {
    errors.push('db: required, better-sqlite3 Database instance');
  }
  if (
    typeof opts.query !== 'string' ||
    opts.query.trim().length === 0
  ) {
    errors.push('query: required, non-empty string');
  }
  const mode = opts.mode ?? SEARCH_MODES.KEYWORD;
  if (
    mode !== SEARCH_MODES.KEYWORD &&
    mode !== SEARCH_MODES.SEMANTIC &&
    mode !== SEARCH_MODES.HYBRID
  ) {
    errors.push(`mode: must be one of keyword/semantic/hybrid (got ${JSON.stringify(mode)})`);
  }
  if (opts.minTrust !== undefined && !TRUST_ORDINAL[opts.minTrust]) {
    errors.push(`minTrust: must be one of low/medium/high (got ${JSON.stringify(opts.minTrust)})`);
  }
  if (opts.tier !== undefined && !VALID_TIERS.has(opts.tier)) {
    errors.push(`tier: must be one of U/P/L (got ${JSON.stringify(opts.tier)})`);
  }
  if (opts.since !== undefined) {
    const t = Date.parse(opts.since);
    if (!Number.isFinite(t)) {
      errors.push(`since: must be an ISO 8601 date string (got ${JSON.stringify(opts.since)})`);
    }
  }
  if (opts.limit !== undefined) {
    if (
      !Number.isInteger(opts.limit) ||
      opts.limit <= 0 ||
      opts.limit > MAX_LIMIT
    ) {
      errors.push(`limit: must be a positive integer ≤ ${MAX_LIMIT}`);
    }
  }
  const scope = opts.scope ?? SEARCH_SCOPES.FACTS;
  if (
    scope !== SEARCH_SCOPES.FACTS &&
    scope !== SEARCH_SCOPES.TRANSCRIPTS &&
    scope !== SEARCH_SCOPES.DECISIONS
  ) {
    errors.push(`scope: must be one of facts/transcripts/decisions (got ${JSON.stringify(scope)})`);
  }
  // Task 211: the state-view OVERRIDE (the automatic path needs no flag —
  // this exists for explicit control only). Closed enum; fact-scope only —
  // an explicit override on the transcripts/decisions scopes is rejected like
  // the other fact-only filters (the explicit-vs-configured honesty rule;
  // AUTOMATIC classification simply doesn't run outside the facts scope).
  if (opts.stateView !== undefined) {
    if (!VALID_STATE_VIEWS.has(opts.stateView)) {
      errors.push(
        `stateView: must be one of current/historical/transition/neutral (got ${JSON.stringify(opts.stateView)})`,
      );
    } else if (scope !== SEARCH_SCOPES.FACTS) {
      errors.push(`stateView: not supported under the ${scope} scope (state views apply to facts)`);
    }
  }
  if (scope === SEARCH_SCOPES.TRANSCRIPTS) {
    // Chunks carry no tier/trust/created_at — rejecting these is more honest
    // than silently ignoring them (the explicit-vs-configured asymmetry rule).
    for (const [key, label] of [
      ['tier', 'tier'],
      ['minTrust', 'minTrust'],
      ['since', 'since'],
    ]) {
      if (opts[key] !== undefined) {
        errors.push(`${label}: not supported under the transcripts scope (raw chunks carry no ${label})`);
      }
    }
  }
  if (scope === SEARCH_SCOPES.DECISIONS) {
    // The journal is a flat markdown file, not the index: it carries no
    // tier/trust/created_at columns and isn't embedded. Reject those filters +
    // semantic/hybrid modes (same explicit-vs-configured honesty as transcripts).
    for (const [key, label] of [
      ['tier', 'tier'],
      ['minTrust', 'minTrust'],
      ['since', 'since'],
    ]) {
      if (opts[key] !== undefined) {
        errors.push(`${label}: not supported under the decisions scope (journal entries carry no ${label})`);
      }
    }
    if (mode !== SEARCH_MODES.KEYWORD) {
      errors.push(`mode: only keyword is supported under the decisions scope (the journal is not embedded)`);
    }
    if (typeof opts.projectRoot !== 'string' || opts.projectRoot.length === 0) {
      errors.push('projectRoot: required for the decisions scope (to locate context/DECISIONS.md)');
    }
  }
  return { errors, mode, scope };
}

// --- FTS5 query sanitization (Task 153) -------------------------------
//
// FTS5's MATCH grammar (sqlite.org/fts5 §3) treats many characters a user
// would type in a natural query as operators or syntax errors:
//   - a bareword may ONLY contain letters / digits / underscore / non-ASCII;
//     a `.`, `-`, `:`, `+`, `^`, `(`, etc. in a bareword is a SYNTAX ERROR.
//   - `AND` / `OR` / `NOT` (case-sensitive) are reserved boolean operators.
// So `cmk search v0.3` crashed (`v0` then `.3` → `.` violates the bareword
// grammar), and `cmk search user-explicit` parsed `-` as a column-exclude.
//
// The SQLite-sanctioned fix is to double-quote the offending token: inside a
// quoted string the tokenizer treats `.`/`-`/`:` as separators, so `"v0.3"`
// tokenizes to `v0` + `3` and matches the literal content. We quote
// PER-TOKEN (not the whole query) so a plain multi-word query keeps its
// implicit-AND semantics (better recall) rather than collapsing to a strict
// adjacency phrase. A token the user already quoted is left untouched.
//
// Validated against the FTS5 spec AND basic-memory's real implementation
// (the kit's closest FTS5 + markdown-native design analog). Full rationale:
// docs/research/2026-06-15-fts5-query-preparation-cross-system.md.

// A bareword that FTS5 accepts as-is: letters, digits, underscore, non-ASCII.
// Anything else in the token means it must be quoted to be a literal.
const FTS5_BAREWORD_RE = /^[\p{L}\p{N}_]+$/u;
const FTS5_RESERVED_WORDS = new Set(['AND', 'OR', 'NOT']);

// Quote a single token for literal FTS5 matching, escaping embedded `"`
// SQL-style (double it) per the spec. Used only when the token isn't a safe
// bareword.
function quoteFtsToken(token) {
  return `"${token.replace(/"/g, '""')}"`;
}

/**
 * Transform a raw user query into an FTS5-safe MATCH string.
 *
 * Per-token: a safe bareword passes through untouched (preserving
 * implicit-AND between words); a token with FTS5-special characters or a
 * bare reserved word (AND/OR/NOT) is double-quoted (literal). A token the
 * user already wrapped in `"…"` is preserved verbatim — explicit phrase
 * search still works for power users.
 *
 * Exported for isolated unit testing (like reciprocalRankFusion).
 *
 * @param {string} raw the user's query
 * @returns {string} an FTS5-safe MATCH expression ('' for empty input)
 */
export function prepareFtsQuery(raw) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed === '') return '';

  return tokenizeQuery(trimmed)
    .map((token) => {
      // Already a user-quoted phrase (`"…"`, possibly multi-word): leave it
      // exactly as typed — explicit phrase search still works for power users.
      if (token.length >= 2 && token.startsWith('"') && token.endsWith('"')) {
        return token;
      }
      // Safe bareword that isn't a reserved operator: pass through.
      if (FTS5_BAREWORD_RE.test(token) && !FTS5_RESERVED_WORDS.has(token)) {
        return token;
      }
      // Everything else (special chars, or a bare AND/OR/NOT): quote literal.
      return quoteFtsToken(token);
    })
    .join(' ');
}

// Split a query into tokens, keeping a double-quoted span (which may contain
// spaces, e.g. `"thin routes"`) as ONE token. A naive whitespace split would
// tear `"thin routes"` into `"thin` + `routes"` and corrupt the quoting.
// Unbalanced trailing quote: the final quoted run extends to end-of-string.
function tokenizeQuery(query) {
  const tokens = [];
  let i = 0;
  while (i < query.length) {
    if (/\s/.test(query[i])) {
      i += 1;
      continue;
    }
    if (query[i] === '"') {
      // A `"` at a token boundary opens a phrase span: consume up to and
      // including the closing quote (or end-of-string if unbalanced).
      let j = i + 1;
      while (j < query.length && query[j] !== '"') j += 1;
      const end = j < query.length ? j + 1 : query.length;
      tokens.push(query.slice(i, end));
      i = end;
    } else {
      // A run of non-space characters. A `"` that appears MID-run (e.g.
      // `he"llo`) is part of this token, NOT a phrase delimiter — it'll be
      // escaped + quoted as a literal by prepareFtsQuery. Only whitespace
      // ends the run.
      let j = i;
      while (j < query.length && !/\s/.test(query[j])) j += 1;
      tokens.push(query.slice(i, j));
      i = j;
    }
  }
  return tokens;
}

// --- Keyword (FTS5 BM25) backend --------------------------------------

const KEYWORD_BASE_SQL = `
SELECT
  o.id AS id,
  o.body AS body,
  o.heading_path AS heading_path,
  o.source_file AS source_file,
  o.source_line AS source_line,
  o.tier AS tier,
  o.trust AS trust,
  o.trust_score AS trust_score,
  o.signal_count AS signal_count,
  o.created_at AS created_at,
  o.deleted_at AS deleted_at,
  o.superseded_by AS superseded_by,
  o.expires_at AS expires_at,
  observations_fts.rank AS score,
  snippet(observations_fts, 0, '<b>', '</b>', '...', 16) AS snippet
FROM observations_fts
JOIN observations o ON o.rowid = observations_fts.rowid
WHERE observations_fts MATCH @query
`;

/**
 * The row filters every keyword read shares — the WHERE past `MATCH`, and the
 * bound params that go with it.
 *
 * ONE owner on purpose: `buildKeywordSql` (the ranked page) and
 * `countKeywordMatches` (the unlimited denominator) must apply the same tier /
 * trust / age / tombstone / expiry rules, or a UI ends up printing "showing 50
 * of N" where N counts a different population than the 50.
 */
function keywordFilters(opts) {
  const clauses = [];
  const params = { query: prepareFtsQuery(opts.query) };
  if (opts.tier !== undefined) {
    clauses.push('o.tier = @tier');
    params.tier = opts.tier;
  }
  if (opts.minTrust !== undefined) {
    // SQLite has no enum-ordinal builtin; CASE WHEN translates the
    // string trust to its numeric rank, then compares.
    clauses.push(`
      CASE o.trust
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
        ELSE 0
      END >= @min_trust_ord
    `);
    params.min_trust_ord = TRUST_ORDINAL[opts.minTrust];
  }
  if (opts.since !== undefined) {
    clauses.push('o.created_at >= @since_ms');
    params.since_ms = Date.parse(opts.since);
  }
  if (!opts.includeTombstoned) {
    clauses.push('o.deleted_at IS NULL');
  }
  // Task 66.3 (D-258): expired facts are HIDDEN at read time, never deleted —
  // the mem0 show_expired parity (`includeExpired: true` reveals). Exclusive
  // end: expires_at == now is already expired. `now` is injectable for tests;
  // NULL expires_at (permanent facts + all scratchpad bullets) always passes.
  if (!opts.includeExpired) {
    clauses.push('(o.expires_at IS NULL OR o.expires_at > @now_ms)');
    params.now_ms = opts.now ? Date.parse(opts.now) : Date.now();
  }
  return { clauses, params };
}

function buildKeywordSql(opts) {
  const { clauses, params } = keywordFilters(opts);
  const where = clauses.length > 0 ? ' AND ' + clauses.join(' AND ') : '';
  const sql =
    KEYWORD_BASE_SQL + where + ' ORDER BY observations_fts.rank LIMIT @limit';
  // Task 194: fetch an oversampled candidate window — the blend re-ranks in
  // JS, then slices back to the requested limit (see BLEND_OVERSAMPLE).
  const requested = opts.limit ?? DEFAULT_LIMIT;
  params.limit = Math.min(requested * BLEND_OVERSAMPLE, MAX_LIMIT);
  return { sql, params, requested };
}

/**
 * How many facts the keyword search MATCHES, with no limit and no oversample —
 * the honest denominator behind a "showing the first N of M" line.
 *
 * It lives here, next to the query it counts, because it must stay identical to
 * what `search()` would have returned unlimited: the same FTS expression
 * (`prepareFtsQuery`), the same filters (`keywordFilters`), and the same Task-211
 * state-view rewrite (`applyStateView` — a historical query strips its hint
 * words and includes expired rows, so a caller-side COUNT of the RAW query can
 * legitimately come out SMALLER than the page it is meant to be the total of).
 *
 * Ranking is irrelevant to a count, so the trust blend and the enrichment do
 * not run — this is one aggregate query, not a second search.
 *
 * @param {object} opts `{db, query, scope?, tier?, minTrust?, since?, includeTombstoned?, includeExpired?, stateView?, now?}`
 * @returns {number} matching rows across the whole corpus
 */
export function countKeywordMatches(opts = {}) {
  const { opts: effective } = applyStateView(opts, opts.scope ?? SEARCH_SCOPES.FACTS);
  const { clauses, params } = keywordFilters(effective);
  const where = clauses.length > 0 ? ' AND ' + clauses.join(' AND ') : '';
  const sql =
    `SELECT COUNT(*) AS n
     FROM observations_fts
     JOIN observations o ON o.rowid = observations_fts.rowid
     WHERE observations_fts MATCH @query` + where;
  try {
    return opts.db.prepare(sql).get(params).n;
  } catch (err) {
    if (
      err?.code === 'SQLITE_ERROR' ||
      /fts5:|no such column:/i.test(err?.message ?? '')
    ) {
      throw new FTS5ParseError(err, opts.query);
    }
    throw err;
  }
}

// FTS5 parse errors aren't validation errors — they're query-syntax
// errors thrown by SQLite when the user's query violates FTS5 grammar
// (e.g., `"user-explicit"` parses as `user AND NOT explicit` because
// `-` is the NOT operator; `"AND"` / `"OR"` are reserved; `"foo:bar"`
// treats `foo` as a column name and crashes if no such column exists).
// The kit's `cmk search "user-explicit"` is a realistic user query —
// the kit's own `write_source` enum value uses that exact string —
// so the error must surface as a clean schema-error result, NOT as an
// uncaught SqliteError stack trace. Surfaced by the Task 30 code-review
// as Important finding I1.
class FTS5ParseError extends Error {
  constructor(originalError, query) {
    super(`FTS5 parse error on query ${JSON.stringify(query)}: ${originalError.message}`);
    this.name = 'FTS5ParseError';
    this.originalError = originalError;
  }
}

function runKeywordSearch(db, opts) {
  const { sql, params, requested } = buildKeywordSql(opts);
  let rows;
  try {
    rows = db.prepare(sql).all(params);
  } catch (err) {
    // FTS5's parser surfaces grammar violations as SqliteError. Recognize
    // the documented FTS5-specific messages and re-throw as our typed
    // class so the caller (`search()`) can translate to a schema-error
    // result with a user-friendly hint.
    if (
      err?.code === 'SQLITE_ERROR' ||
      /fts5:|no such column:/i.test(err?.message ?? '')
    ) {
      throw new FTS5ParseError(err, opts.query);
    }
    throw err;
  }
  // Task 194: the confidence-gated trust blend, then back to the requested
  // window. The sort is STABLE (JS spec), so gate-closed rows keep their SQL
  // (BM25) order exactly — the blend only moves rows whose scores it changed.
  // Task 209: each row also carries its temporal STATE where ≠ current-active
  // (the A-TMA label projection — deterministic, labels-not-reranks; current
  // rows carry NO state key at all, the zero-noise contract).
  return rows
    .map((r) => ({
      id: r.id,
      snippet: r.snippet ?? r.body,
      source_file: r.source_file,
      source_line: r.source_line,
      tier: r.tier,
      trust: r.trust,
      score: blendTrustScore({
        score: r.score,
        trustScore: r.trust_score,
        signalCount: r.signal_count,
        sourceFile: r.source_file,
      }),
      ...stateFieldFor(r, opts.now),
      // Task 232 (ADR-0023): carry the successor id on a superseded row so the
      // render can name it (`[superseded by P-XXXX]`). Only present when set —
      // a current fact has null superseded_by — so zero noise on healthy rows.
      ...(r.superseded_by ? { superseded_by: r.superseded_by } : {}),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, requested);
}

// Task 227: epoch-ms → ISO yyyy-mm-dd (UTC), null-safe — the citation date.
function isoDateFromEpochMs(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return null;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// Task 227: a transcript/sessions hit's date lives in its FILE NAME
// (today-2026-06-07.md / 2026-05-21.md). Undated files (recent.md,
// archive.md) return null — their sections carry their own date headings.
const SOURCE_DATE_RE = /(\d{4}-\d{2}-\d{2})/;
function dateFromSourceFileName(sourceFile) {
  const m = SOURCE_DATE_RE.exec(String(sourceFile ?? '').split('/').pop() ?? '');
  return m ? m[1] : null;
}

/**
 * Task 227 (D-358): stamp the WHEN + WHERE citation halves onto facts-scope
 * results IN PLACE — `date` (from the row's created_at) + `heading` (its
 * heading_path). Runs after the mode branch so keyword, semantic, and
 * hybrid-fused rows are all covered (the semantic backend's row shape lacks
 * these fields). One batched lookup, bounded by the result window; a row
 * whose id isn't in the observations table (defensive) keeps nulls.
 * Exported for isolated unit-testing of the semantic/hybrid path without an
 * embedder.
 */
/**
 * Task 227: the transcripts-scope half of the same contract — stamp `date`
 * from the day-file name onto rows that arrived without one (the semantic
 * transcript backend's row shape). Idempotent over already-stamped keyword
 * rows. Exported for isolated unit-testing without an embedder.
 */
export function enrichTranscriptDates(results) {
  for (const r of results) {
    if (r) r.date = r.date ?? dateFromSourceFileName(r.source_file);
  }
  return results;
}

export function enrichFactCitations(db, results) {
  if (results.length === 0) return results;
  const placeholders = results.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT id, created_at, heading_path FROM observations WHERE id IN (${placeholders})`)
    .all(...results.map((r) => r.id));
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const r of results) {
    const meta = byId.get(r.id);
    r.date = meta ? isoDateFromEpochMs(meta.created_at) : (r.date ?? null);
    r.heading = meta ? (meta.heading_path ?? null) : (r.heading ?? null);
  }
  return results;
}

// --- Transcript-scope keyword backend (Task 104.2, the L3 raw tier) ----

const TRANSCRIPT_KEYWORD_SQL = `
SELECT
  t.source_file AS source_file,
  t.source_line AS source_line,
  t.heading AS heading,
  transcript_chunks_fts.rank AS score,
  snippet(transcript_chunks_fts, 0, '<b>', '</b>', '...', 16) AS snippet
FROM transcript_chunks_fts
JOIN transcript_chunks t ON t.rowid = transcript_chunks_fts.rowid
WHERE transcript_chunks_fts MATCH @query
ORDER BY transcript_chunks_fts.rank
LIMIT @limit
`;

// Synthetic, readable id for a raw chunk (chunks are locations, not curated
// facts — no [PUL]-XXXXXXXX identity). Also the RRF fusion key in hybrid
// mode and the drill-back handle the memory-search skill surfaces.
function transcriptHitId(row) {
  return `T:${row.source_file}:${row.source_line}`;
}

function runTranscriptKeywordSearch(db, opts) {
  let rows;
  try {
    rows = db
      .prepare(TRANSCRIPT_KEYWORD_SQL)
      .all({ query: prepareFtsQuery(opts.query), limit: opts.limit ?? DEFAULT_LIMIT });
  } catch (err) {
    if (err?.code === 'SQLITE_ERROR' || /fts5:|no such column:/i.test(err?.message ?? '')) {
      throw new FTS5ParseError(err, opts.query);
    }
    throw err;
  }
  return rows.map((r) => ({
    id: transcriptHitId(r),
    // Raw turns contain newlines (dialogue + Tools blocks) — flatten so the
    // one-line-per-hit output contract holds across scopes.
    snippet: flattenSnippet(r.snippet),
    source_file: r.source_file,
    source_line: r.source_line,
    heading: r.heading,
    // Task 227: the WHEN half — derived from the day-file name.
    date: dateFromSourceFileName(r.source_file),
    score: r.score,
  }));
}

const TRANSCRIPT_SNIPPET_MAX = 240;

function flattenSnippet(s) {
  const flat = String(s ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > TRANSCRIPT_SNIPPET_MAX ? flat.slice(0, TRANSCRIPT_SNIPPET_MAX) + '…' : flat;
}

// --- Decisions-scope keyword backend (Task 156, the decision journal) ---

// The journal entry shape (decisions-journal.mjs buildDecisionEntry):
//   <!-- decision:P-XXXXXXXX -->
//   ### <title>                       (a retracted entry carries _(retracted DATE)_)
//   **When:** <date> · **Fact:** `<id>`
//   **Why:** <why>                    (optional)
// Entries are separated by the machine marker; we match the query as a
// case-insensitive substring over the entry text, and report the retract marker
// so recall can answer "did this change / what did we reject".
//
// Task 255: the SPLITTING + retract-detection rules moved to their format's
// owner, `decisions-journal.mjs::parseDecisionsJournal` — the module that
// WRITES the journal is the module that reads it, and the viewer's
// `/api/decisions` route would otherwise have been the third hand-rolled copy
// of the same subtleties (line-start-only markers; strip the plumbing before
// matching, or every search for "decision" matches every marker comment; the
// retract tag counts only on the line directly under the `## ` heading). This
// backend keeps what is genuinely ITS OWN: the match, the snippet, the ranking.
const DECISIONS_SNIPPET_MAX = 240;

/**
 * WHAT MATCHES a journal query — the ONE definition of it (Task 269).
 *
 * Extracted from `runDecisionsKeywordSearch` when the viewer's `/api/decisions`
 * grew a `?q=`: a UI that searched the journal by its own rule would be a
 * SECOND search engine over the same file, and the two would answer differently
 * the first time either was touched. The CLI (`cmk search --scope decisions`),
 * `mk_search` and the viewer all match through this function.
 *
 * The JOURNAL POSITION rides along because it is meaning, not bookkeeping: the
 * journal is chronological, so an entry's index is the only ordering the
 * decisions scope has (its `score` is that index — see the caller). A plain
 * `filter()` would throw it away and the caller would have to re-derive it with
 * an `indexOf`, which is both O(n²) and wrong on a journal with a repeated id.
 *
 * @param {Array<object>} entries `readDecisionsJournal` output
 * @param {string} query case-insensitive substring; empty/absent matches ALL
 * @returns {Array<{entry: object, index: number}>} matches, in journal order
 */
export function matchDecisionEntries(entries, query) {
  const list = Array.isArray(entries) ? entries : [];
  const needle = String(query ?? '').trim().toLowerCase();
  const out = [];
  for (let index = 0; index < list.length; index++) {
    if (needle && !String(list[index].cleaned ?? '').toLowerCase().includes(needle)) continue;
    out.push({ entry: list[index], index });
  }
  return out;
}

function runDecisionsKeywordSearch(_db, opts) {
  const entries = readDecisionsJournal(opts.projectRoot); // no journal → []
  const hits = [];
  for (const { entry, index } of matchDecisionEntries(entries, opts.query)) {
    hits.push({
      id: entry.id,
      snippet: flattenSnippet(entry.cleaned).slice(0, DECISIONS_SNIPPET_MAX),
      source_file: 'context/DECISIONS.md',
      source_line: entry.sourceLine,
      retracted: entry.retracted,
      // `score` is POSITIONAL (the entry index), NOT an FTS relevance rank —
      // the journal is chronological, so a lower score = an earlier decision.
      // Don't fuse/sort this against the facts/transcripts scopes' rank scores.
      score: index,
    });
    // NB: `limit` is a CHRONOLOGICAL head, not a relevance top-N — it returns
    // the first N matches in journal (oldest→newest) order, so a strongly
    // relevant decision far down a long journal can be cut. Acceptable: the
    // journal is bounded and chronological by design (M1, deliberate).
    if (hits.length >= (opts.limit ?? DEFAULT_LIMIT)) break;
  }
  return hits;
}

// --- Reciprocal-rank fusion (hybrid mode) -----------------------------

/**
 * Reciprocal-rank fusion of two ranked result lists into one. Design
 * §9.3 specifies 0.5/0.5 weight; standard RRF formula is
 *   fused_score(d) = sum over backends b of: weight_b / (k + rank_b(d))
 * where rank starts at 1 for the top hit. Documents missing from one
 * backend contribute 0 from that backend.
 *
 * Exported for direct unit-test in isolation (the production search()
 * call composes this with the keyword + semantic backends).
 */
export function reciprocalRankFusion({
  keywordResults,
  semanticResults,
  keywordWeight = 0.5,
  semanticWeight = 0.5,
  k = RRF_K,
}) {
  const scores = new Map(); // id → fused score
  const byId = new Map(); // id → result object (first-seen wins for snippet/source)

  keywordResults.forEach((r, i) => {
    const rank = i + 1;
    const inc = keywordWeight / (k + rank);
    scores.set(r.id, (scores.get(r.id) ?? 0) + inc);
    if (!byId.has(r.id)) byId.set(r.id, r);
  });
  semanticResults.forEach((r, i) => {
    const rank = i + 1;
    const inc = semanticWeight / (k + rank);
    scores.set(r.id, (scores.get(r.id) ?? 0) + inc);
    if (!byId.has(r.id)) byId.set(r.id, r);
  });

  const fused = [...scores.entries()]
    .map(([id, score]) => ({ ...byId.get(id), score }))
    .sort((a, b) => b.score - a.score);
  return fused;
}

/**
 * Task 211: the query STATE-VIEW gate (facts scope only).
 *
 * Classify what temporal view the query asks for (rule-based, zero-LLM —
 * query-state-view.mjs); an explicit `opts.stateView` override wins. On a
 * historical/transition view, expired rows are auto-included (the whole point:
 * a history question must reach the history — no manual flag), and Task 209's
 * projection labels them. The hint words are view METADATA the classifier
 * consumed — they are stripped from the FTS query, because implicit-AND would
 * otherwise demand the literal hint appear in fact bodies. current/neutral
 * leave EVERYTHING byte-identical to the pre-211 pipeline, including a caller's
 * explicit `includeExpired` opt-in.
 *
 * Extracted so `search()` and `countKeywordMatches()` cannot disagree about
 * which query was actually run.
 */
function applyStateView(opts, scope) {
  if (scope !== SEARCH_SCOPES.FACTS) return { stateView: null, opts };
  const classified = classifyQueryStateView(opts.query);
  const stateView = opts.stateView ?? classified.view;
  if (stateView === STATE_VIEWS.HISTORICAL || stateView === STATE_VIEWS.TRANSITION) {
    return {
      stateView,
      opts: { ...opts, includeExpired: true, query: classified.contentQuery },
    };
  }
  return { stateView, opts };
}

// --- Public boundary --------------------------------------------------

export function search(opts = {}) {
  const { errors, mode, scope } = validateInput(opts);
  if (errors.length > 0) {
    return errorResult({ category: ERROR_CATEGORIES.SCHEMA, errors });
  }
  // Scope dispatch (Task 104.2): the transcripts scope swaps the keyword
  // backend; semantic/hybrid use the caller-prepared backend exactly like
  // the facts scope (prepareSemanticBackend({scope}) embeds the right table).
  let keywordBackend = runKeywordSearch;
  if (scope === SEARCH_SCOPES.TRANSCRIPTS) keywordBackend = runTranscriptKeywordSearch;
  else if (scope === SEARCH_SCOPES.DECISIONS) keywordBackend = runDecisionsKeywordSearch;

  // Semantic + hybrid require an injected backend. Production v0.1.0
  // passes undefined → error with the not-yet-shipped hint. A future
  // release wires the real Layer-5b backend via the semanticBackend seam.
  if (mode === SEARCH_MODES.SEMANTIC || mode === SEARCH_MODES.HYBRID) {
    if (typeof opts.semanticBackend !== 'function') {
      return errorResult({
        category: ERROR_CATEGORIES.SEMANTIC_UNAVAILABLE,
        errors: [
          'no semantic backend provided — semantic/hybrid need the embedded Layer-5b backend prepared by the caller ' +
            '(the CLI/MCP do this automatically when the optional @huggingface/transformers embedder is installed). ' +
            'Use --mode=keyword for the always-available FTS5 search.',
        ],
      });
    }
  }

  // ── Task 211: the query STATE-VIEW gate (facts scope only) ─────────────
  // The rule, and why it only touches the stateful views, is on applyStateView
  // — which `countKeywordMatches` shares, so the count and the page can never
  // be answering two different queries.
  const { stateView, opts: effectiveOpts } = applyStateView(opts, scope);

  let results;
  try {
    if (mode === SEARCH_MODES.KEYWORD) {
      results = keywordBackend(effectiveOpts.db, effectiveOpts);
    } else if (mode === SEARCH_MODES.SEMANTIC) {
      // The semantic backend is an injected callable returning the same
      // shape as the scope's keyword backend (facts: {id, snippet,
      // source_file, source_line, tier, trust, score}; transcripts: the
      // synthetic-T:-id shape without tier/trust).
      results = effectiveOpts.semanticBackend(effectiveOpts);
    } else {
      // hybrid: run both backends + fuse.
      const keywordResults = keywordBackend(effectiveOpts.db, effectiveOpts);
      const semanticResults = effectiveOpts.semanticBackend(effectiveOpts);
      const fused = reciprocalRankFusion({
        keywordResults,
        semanticResults,
      });
      results = fused.slice(0, effectiveOpts.limit ?? DEFAULT_LIMIT);
    }
  } catch (err) {
    if (err instanceof FTS5ParseError) {
      return errorResult({
        category: ERROR_CATEGORIES.SCHEMA,
        errors: [
          `query: FTS5 parse error — ${err.originalError.message}. ` +
            'Try wrapping the query in double quotes for phrase mode ' +
            '(e.g., `cmk search \'"user-explicit"\'`).',
        ],
      });
    }
    throw err;
  }

  // Task 227 (D-358): the citation date + heading are enriched HERE, after
  // the mode branch, so keyword, semantic, AND hybrid-fused rows all carry
  // them — the semantic backend returns its own row shape without these
  // fields, and the first cut (fields on the keyword mapper only) printed
  // "—" on every hybrid hit in the live-test. One owner, all modes — and
  // BOTH scopes (the skill review caught the same class left open on the
  // transcripts-scope semantic path).
  const enrichScope = opts.scope ?? SEARCH_SCOPES.FACTS;
  if (enrichScope === SEARCH_SCOPES.FACTS) {
    enrichFactCitations(opts.db, results);
  } else if (enrichScope === SEARCH_SCOPES.TRANSCRIPTS) {
    enrichTranscriptDates(results);
  }

  // Task 211: on the HISTORICAL view, bucket stateful (labeled) rows FIRST —
  // a deterministic, STABLE pre-rank partition (never a score blend; §20.3
  // untouched; within each bucket the BM25/blend order is preserved exactly).
  // The history question's answer IS the old state, so it leads. Transition
  // keeps the natural order — that answer needs both states side by side,
  // and the Task-209 labels distinguish them.
  if (stateView === STATE_VIEWS.HISTORICAL) {
    results = [...results.filter((r) => r.state), ...results.filter((r) => !r.state)];
  }

  // Task 190 (RECALL-LOG, ADR-0017 Phase 1a): record which ids this query
  // surfaced — the attribution primitive for the learn-loop's re-ask/recall-miss
  // signals (zero-result queries are logged too; a MISS is itself a signal).
  // Gated on the caller passing projectRoot: the agent-facing callers (the CLI
  // runSearch + the MCP mk_search) pass it; bare/legacy calls stay pure.
  // appendRecallEntry is best-effort — it never throws into the search path.
  if (opts.projectRoot) {
    appendRecallEntry(opts.projectRoot, {
      session: opts.sessionId ?? null,
      source: 'search',
      query: opts.query,
      ids: results.map((r) => r.id),
      // Task 233: the recall ORIGIN tag (e.g. 'skill' from `cmk search
      // --source skill` / `mk_search {source:'skill'}`) — added only when set,
      // so a plain search entry stays byte-shape identical. Lets the ADR-0024
      // fire-rate be measured (skill-driven searches vs all searches).
      origin: opts.recallOrigin,
    });
  }

  // Task 211: surface the detected view ONLY when it changed retrieval
  // (historical/transition) — the envelope tells Claude WHY old rows appear;
  // current/neutral stay envelope-identical to pre-211 (zero noise).
  if (stateView === STATE_VIEWS.HISTORICAL || stateView === STATE_VIEWS.TRANSITION) {
    return { action: 'found', mode, scope, state_view: stateView, results };
  }
  return { action: 'found', mode, scope, results };
}
