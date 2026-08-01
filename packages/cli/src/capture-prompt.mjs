// UserPromptSubmit hook real handler (Task 19, T-016). Second Layer 4
// module — fires on every user prompt, sanitizes the privacy tags
// before any disk write, and appends to the daily transcript file.
//
// Public boundary: capturePrompt({payload, projectRoot, now}) → result.
// The bin wrapper deals with stdin parsing + protocol JSON; this
// module is pure-function-ish: takes the parsed payload + project
// root, produces the transcript file as a side effect.
//
// Privacy contract (FR-15, design §6.6):
//   - <private>...</private> blocks are REPLACED with the literal
//     "[private content redacted]" placeholder. The original content
//     never touches any disk path under the project.
//   - <retain>...</retain> blocks are preserved VERBATIM (including the
//     tags). The Stop hook + auto-extract subagent downstream uses
//     these tags as force-save signals; stripping them here would
//     break that contract.
//
// Transcript format:
//   ## <ISO timestamp> — user
//
//   <sanitized prompt body>
//
// One heading per turn so downstream tools can scan by ## markers
// (matches claude-remember's compaction strategy).

import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sanitizePrivacyTags } from './privacy.mjs';
import { maskPii, localUsernames, resolvePrivacyScreen } from './pii-patterns.mjs';
import { appendRedactions } from './redactions-log.mjs';
import { liveTranscriptPath } from './transcript-screen.mjs';
import { judgeUserPrompt } from './judge-signals.mjs';
import { dateFromIso } from './audit-log.mjs';
import { openIndexDb, getIndexDbPath } from './index-db.mjs';
import { prepareFtsQuery, enrichFactCitations } from './search.mjs';
import { appendRecallEntry } from './recall-log.mjs';
// Task 250 (D-412) — the failure-driven health whisper reads (never writes) the
// health log from this hot path. Bounded tail read, fail-open.
import { activeWarnings } from './health-log.mjs';

// Task 75.2 — the per-prompt "memory available" recall nudge (memsearch's
// UserPromptSubmit hint, D-115's 75.2 half). The SessionStart snapshot +
// its authority preamble cover the session OPEN; this keeps the agent
// aware MID-session (after the snapshot scrolls into history) that a deep,
// searchable archive exists behind the bounded snapshot. Conditions keep
// it noise-free: substantive prompts only (≥10 chars — "ok"/"go" never pay
// the hint; memsearch's heuristic) and only when there IS an archive to
// recall from (a granular INDEX.md). One line — the per-prompt token cost
// stays negligible, and it rides the EXISTING hook (no extra spawn).
const HINT_MIN_PROMPT_CHARS = 10;

// Task 233 (ADR-0024): the evidence-query gate. A prompt this long or longer
// pays a REAL FTS5 query over its terms; shorter (but still ≥ MIN) prompts get
// the static line without the query cost. The pro-workflow "cheap-index
// pointer" borrow — a natural-language question ("what did we decide about X?")
// clears 20 chars; a terse "deploy target?" doesn't and stays static.
const HINT_QUERY_MIN_CHARS = 20;

// The bm25 SCORE FLOOR — the WORST acceptable top-hit rank for injecting index
// lines (the graphiti `reranker_min_score` pattern). FTS5's bm25 rank is
// NEGATIVE-better, so a hit clears the floor when `score <= FLOOR`.
//
// Chosen CONSERVATIVELY (lenient) per the octopoda-OS calibration warning
// (their 0.80 floor filtered 5/7 relevant facts; lowered to 0.45). MEASURED on
// this kit's FTS5: bm25 magnitude is CORPUS-DEPENDENT (it scales with IDF) — on
// a realistic ~50-doc corpus a genuine OR-term match scores −4 to −12, while a
// weak single-common-term match sits near 0; on a 2-doc corpus even a real
// match is ~−1e-6 (near-zero IDF). So −0.5 rejects only the near-zero degenerate
// matches on a real corpus while letting genuine matches through — the pointer
// is advisory + low-cost, so a marginal false-positive is cheaper than a
// filtered-out true match. Named + TUNABLE (never magic); a real-corpus
// calibration pass may adjust it with the recall.log fire-rate evidence.
export const HINT_BM25_SCORE_FLOOR = -0.5;

// At most this many index lines in an evidence hint — id · title · date, never
// bodies (the per-prompt token cost stays tiny).
const HINT_MAX_INDEX_LINES = 3;

// The hint query is RECALL-oriented, not precision-oriented. A whole natural-
// language prompt fed to FTS5's implicit-AND matches almost nothing (the doc
// must contain every word, verbs and all — "what did we DECIDE about X" ANDs to
// zero), so the hint extracts CONTENT terms and joins them with OR: a pointer
// wants "any strong term match," and the bm25 floor then filters the weak
// single-common-term hits. (This is deliberately different semantics from
// `cmk search`'s per-token implicit-AND — a user's explicit search wants
// precision; the ambient hint wants recall. The bm25 floor is what keeps OR
// from surfacing noise.) At most this many terms bound the query cost.
const HINT_MAX_QUERY_TERMS = 8;

// Cap the `query` field logged to recall.log (the extracted, screened terms —
// never the raw prompt). Bounds the NDJSON line length AND is a second belt on
// top of the privacy screen: even screened text is length-bounded on disk.
const HINT_LOG_QUERY_MAX = 200;

// A small English stopword set — the words that carry no recall signal and,
// under OR, would match nearly everything. Kept tiny + inline (no dependency).
const HINT_STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'was', 'were', 'our', 'you', 'your', 'his', 'her',
  'its', 'their', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'with', 'from', 'about', 'into', 'over', 'did', 'does', 'done', 'have', 'has',
  'had', 'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
  'we', 'us', 'me', 'my', 'is', 'be', 'been', 'being', 'do', 'to', 'of', 'in', 'on',
  'at', 'by', 'or', 'as', 'it', 'an', 'a', 'so', 'if', 'but', 'not', 'no', 'yes',
  'how', 'why', 'when', 'where', 'get', 'got', 'use', 'used', 'using', 'decide',
  'decided', 'think', 'know', 'want', 'need', 'like', 'tell', 'show', 'make',
]);

// Extract the recall terms from a prompt: content words ≥ 3 chars, minus
// stopwords, deduped, capped. Returns [] when nothing usable (→ static hint).
function hintTerms(prompt) {
  const seen = new Set();
  const terms = [];
  for (const raw of String(prompt).toLowerCase().split(/[^\p{L}\p{N}_]+/u)) {
    if (raw.length < 3 || HINT_STOPWORDS.has(raw) || seen.has(raw)) continue;
    seen.add(raw);
    terms.push(raw);
    if (terms.length >= HINT_MAX_QUERY_TERMS) break;
  }
  return terms;
}

// The recall-oriented keyword query: OR over the content terms, live rows only
// (not tombstoned, not expired). Minimal read (id + rank) — the citation date +
// heading are enriched via the shared enrichFactCitations. Deliberately a
// separate, narrow query shape from search.mjs's precision backend (OR-recall
// vs per-token AND); it does not blend trust (a pointer needs relevance, not
// the loop's ranking) and does not log a recall entry (the hint logs its own).
const HINT_KEYWORD_SQL = `
SELECT o.id AS id, observations_fts.rank AS score
FROM observations_fts
JOIN observations o ON o.rowid = observations_fts.rowid
WHERE observations_fts MATCH @q
  AND o.deleted_at IS NULL
  AND (o.expires_at IS NULL OR o.expires_at > @now)
ORDER BY observations_fts.rank
LIMIT @limit
`;

// The static fallback — byte-IDENTICAL to the pre-233 wording. The exact text
// is pinned by a STATIC_MEMORY_HINT boundary test (tests/cli-capture-prompt.js);
// do not reword. (Separately, the SKILL.md description matches on the looser
// `[core-memory-kit] Memory available` shape — a different string — and HC-9
// guards SKILL-scaffold version-drift, not this line.)
export const STATIC_MEMORY_HINT =
  '[core-memory-kit] Recorded memory available beyond the session snapshot — ' +
  'use the memory-search skill when the answer may already be recorded (prior decisions, history, conventions, ' +
  'project structure/architecture, where things live). Recall it; do not re-read the code to reconstruct it.';

/**
 * Does a top-hit's FTS5 bm25 rank clear the pointer-hint floor? Pure + exported
 * for the boundary budget pair (FTS5 bm25 is negative-better: a lower score is
 * more relevant, so a hit qualifies when `score <= HINT_BM25_SCORE_FLOOR`).
 *
 * @param {number} score the top hit's bm25 rank
 * @returns {boolean}
 */
export function clearsBm25Floor(score) {
  return Number.isFinite(score) && score <= HINT_BM25_SCORE_FLOOR;
}

// Parse an id → title map from the granular INDEX.md (the reindex format:
// `- (P-XXXXXXXX) [tier] [Title](file.md) — snippet`). The title is the human
// label we surface in an index line — NOT the fact body (never bodies). Cheap:
// one linear scan over a file we already read for the archive gate.
const INDEX_TITLE_RE = /^- \(([PUL]-[A-Za-z0-9]{8})\) \[[^\]]*\] \[([^\]]+)\]/;
function parseIndexTitles(indexContent) {
  const titles = new Map();
  for (const line of String(indexContent ?? '').split('\n')) {
    const m = INDEX_TITLE_RE.exec(line);
    if (m) titles.set(m[1], m[2].trim());
  }
  return titles;
}

// Format one evidence index line: `- id · title · date` (date omitted when the
// hit has none). NEVER the body.
function formatIndexLine({ id, title, date }) {
  return `- ${id} · ${title}${date ? ` · ${date}` : ''}`;
}

function buildEvidenceHintText(lines) {
  return (
    '[core-memory-kit] Recorded memory may already answer this — indexed fact(s) matching your prompt:\n' +
    lines.map(formatIndexLine).join('\n') +
    '\nRecall with the memory-search skill (or `cmk get <id>`) — do not re-read the code to reconstruct it.'
  );
}

// Run the real FTS5 query over the pre-extracted (SCREENED) terms and, when the
// top hit clears the bm25 floor, return up to HINT_MAX_INDEX_LINES
// {id, title, date}. Best-effort: opens the EXISTING index only (never
// reindexes — this is the every-prompt hot path; a slightly-stale index just
// misses a pointer, which degrades to the static hint), and returns null on any
// miss so the caller falls back. The index DB is opened here (NOT the
// §20.3-pinned inject path — the ADR sanctions a real FTS5 query in the
// per-prompt hook). `terms` are already privacy-screened by the caller — no raw
// prompt text reaches the query.
function queryHintEvidence({ projectRoot, terms, indexContent, now }) {
  const dbPath = getIndexDbPath(projectRoot);
  // Don't CREATE an index on the hot path — a project that never searched has
  // no DB yet; the static hint is correct until the first real search builds it.
  if (!existsSync(dbPath)) return null;
  if (!terms || terms.length === 0) return null;
  const match = terms.map((t) => prepareFtsQuery(t)).join(' OR ');
  let db;
  try {
    db = openIndexDb({ projectRoot });
    const rows = db
      .prepare(HINT_KEYWORD_SQL)
      .all({ q: match, now: now ? Date.parse(now) : Date.now(), limit: HINT_MAX_INDEX_LINES });
    if (rows.length === 0) return null;
    if (!clearsBm25Floor(rows[0].score)) return null;
    enrichFactCitations(db, rows); // shared owner: stamps r.date + r.heading
    const titles = parseIndexTitles(indexContent);
    const lines = rows.slice(0, HINT_MAX_INDEX_LINES).map((h) => ({
      id: h.id,
      title: titles.get(h.id) ?? h.heading ?? '(untitled)',
      date: h.date ?? null,
    }));
    return { lines, ids: lines.map((l) => l.id) };
  } finally {
    try {
      db?.close();
    } catch {
      /* best-effort close */
    }
  }
}

// Record the hint fire — the Door-5 telemetry the ADR-0024 fire-rate criterion
// needs. `query` is the SCREENED, extracted terms (never the raw prompt) — see
// buildMemoryHint. `error` distinguishes an errored evidence query from a
// genuine no-match in the fire-rate data (added only when true). Best-effort: a
// broken diagnostic must NEVER break the prompt hook.
function logHintFire({ projectRoot, sessionId, form, ids, query, error }) {
  try {
    appendRecallEntry(projectRoot, {
      session: sessionId ?? null,
      source: 'hint',
      form,
      ids,
      query,
      error: error || undefined,
    });
  } catch {
    /* the recall log is best-effort — never break the prompt hook */
  }
}

/**
 * The per-prompt recall hint (memsearch's UserPromptSubmit nudge, upgraded per
 * ADR-0024). Below MIN chars, or with no granular archive → null (no fire).
 * Otherwise a hint FIRES: a prompt ≥ HINT_QUERY_MIN_CHARS runs a real FTS5
 * query and, when the top hit clears the bm25 floor, injects ≤3 INDEX LINES
 * (id · title · date, never bodies) + the skill pointer; below the query gate
 * or the floor → the byte-identical static hint. Zero LLM/embedding. FAIL-OPEN:
 * ANY error degrades to the static hint — never a crash, never a blocked prompt
 * (this runs on EVERY user prompt).
 *
 * PRIVACY (FR-15 / design §6.6): the prompt is SCREENED at the top — private
 * blocks stripped + PII masked — BEFORE any use, so neither the FTS query nor
 * the recall log ever sees raw prompt text. The logged `query` is the extracted,
 * screened terms, capped — never the full prompt.
 *
 * @param {object} opts
 * @param {string} opts.projectRoot
 * @param {string} opts.prompt
 * @param {string|null} [opts.sessionId] hook payload session_id (telemetry attribution)
 * @returns {string|null}
 */
export function buildMemoryHint({ projectRoot, prompt, sessionId } = {}) {
  if (typeof prompt !== 'string' || prompt.trim().length < HINT_MIN_PROMPT_CHARS) {
    return null;
  }
  let indexContent;
  try {
    const indexPath = join(projectRoot, 'context', 'memory', 'INDEX.md');
    if (!existsSync(indexPath)) return null;
    // `cmk install` scaffolds INDEX.md on every project, so existence alone
    // is always true post-install (skill-review finding). Require at least
    // one real entry — a fresh, empty project must not advertise recorded
    // memory it does not have. Entry lines start "- (" (the reindex format).
    indexContent = readFileSync(indexPath, 'utf8');
    if (!indexContent.includes('\n- (')) return null;
  } catch {
    return null;
  }
  // PRIVACY SCREEN (FR-15): strip <private> blocks + mask PII BEFORE any use.
  // Private terms must not reach the FTS query OR the log. If screening throws,
  // fall to empty text (→ static hint, empty logged query) — never risk raw text.
  let screened;
  try {
    screened = maskPii(sanitizePrivacyTags(prompt), { usernames: localUsernames() }).text;
  } catch {
    screened = '';
  }
  const terms = hintTerms(screened);
  // The ONLY prompt-derived text that reaches disk: the screened terms, capped.
  const loggedQuery = terms.join(' ').slice(0, HINT_LOG_QUERY_MAX);

  // Archive present + substantive prompt → a hint WILL fire. Default: static.
  let form = 'static';
  let ids = [];
  let text = STATIC_MEMORY_HINT;
  let errored = false;
  if (screened.trim().length >= HINT_QUERY_MIN_CHARS && terms.length > 0) {
    try {
      const ev = queryHintEvidence({ projectRoot, terms, indexContent });
      if (ev && ev.lines.length > 0) {
        form = 'evidence';
        ids = ev.ids;
        text = buildEvidenceHintText(ev.lines);
      }
    } catch (err) {
      // FAIL-OPEN: any evidence-path error (missing index, sqlite failure) →
      // the static hint. Never crash; never block the prompt. Distinguish it
      // from a genuine no-match in the telemetry (finding 2) + one stderr line
      // (the bin's existing non-fatal pattern).
      errored = true;
      try {
        process.stderr.write(`cmk-capture-prompt: hint evidence query failed: ${err?.message ?? err}\n`);
      } catch {
        /* stderr unavailable — the log's error flag still records it */
      }
    }
  }
  logHintFire({ projectRoot, sessionId, form, ids, query: loggedQuery, error: errored });
  return text;
}

// --- Task 250 (D-412): the failure-driven health whisper ---------------------
//
// The kit's hardest silent-failure problem, and the thing that makes this
// different from `cmk doctor`: users do not run doctor (U-U5PPSG7Y), and every
// hook path fails OPEN by design, so a broken capture presents as "nothing
// happened" for as long as it takes someone to notice. The whisper tells the
// AGENT — which is right there, on every prompt, and can act.
//
// THE ONE STRUCTURAL RULE HERE: the whisper must NOT inherit `buildMemoryHint`'s
// gates. That function returns null below 10 prompt characters and on a project
// with no granular archive — both correct for a RECALL nudge and both wrong for
// a FAILURE nudge, because "go" is exactly what a user types while their capture
// is broken, and an empty archive is exactly what a project whose extraction has
// never once succeeded looks like. So the health read is independent, and the
// two results are merged into the one output string the hook may emit.

/**
 * The whisper's byte budget. It is paid on EVERY prompt for as long as
 * something is broken, so it is bounded rather than trusted to stay short —
 * and the truncation protects the ACTIONABLE tail (skill pointer + fix
 * command), because a whisper that says "something broke" and nothing else is
 * worse than no whisper at all.
 */
export const WHISPER_MAX_BYTES = 320;

const WHISPER_PREFIX = '⚠ [core-memory-kit] ';
const WHISPER_SUFFIX_TEMPLATE = (action) =>
  ` — load the troubleshooting skill to diagnose; fix: \`${action}\``;

/** Truncate to a byte budget without ever splitting a codepoint. */
function clipToBytes(text, maxBytes) {
  if (Buffer.byteLength(text, 'utf8') <= maxBytes) return text;
  // Walk by CODE POINT (Array.from, not slice) so surrogate pairs and combining
  // marks stay intact — a half-emitted codepoint renders as U+FFFD.
  const chars = Array.from(text);
  let out = '';
  for (const ch of chars) {
    if (Buffer.byteLength(out + ch + '…', 'utf8') > maxBytes) break;
    out += ch;
  }
  return out + '…';
}

/**
 * Render the active warnings as ONE line, or null when nothing is wrong.
 *
 * Multiple actives collapse to the most severe plus a count (D-412 point 3):
 * the whisper competes for the model's attention with the user's actual prompt,
 * so it gets one line no matter how many things are broken. The dependsOn
 * cascade has already collapsed same-root failures upstream, so a count > 1
 * here means genuinely independent problems.
 *
 * PURE — no filesystem, no clock. `warnings` is the sorted output of
 * `activeWarnings` (most severe first).
 */
export function formatHealthWhisper(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return null;
  const top = warnings[0];
  const more = warnings.length - 1;
  const suffix = WHISPER_SUFFIX_TEMPLATE(top.primaryAction);
  const countPart = more > 0 ? ` (+${more} more kit issue${more === 1 ? '' : 's'})` : '';
  const full = `${WHISPER_PREFIX}${top.title}${countPart}${suffix}`;
  if (Buffer.byteLength(full, 'utf8') <= WHISPER_MAX_BYTES) return full;
  // Over budget: clip the TITLE only, so the pointer + the fix command survive.
  const fixedBytes = Buffer.byteLength(WHISPER_PREFIX + countPart + suffix, 'utf8');
  return `${WHISPER_PREFIX}${clipToBytes(top.title, Math.max(0, WHISPER_MAX_BYTES - fixedBytes))}${countPart}${suffix}`;
}

/**
 * The USER-visible line — emitted ONLY at severity `memory-off` (D-412 point 6).
 *
 * The channel split is deliberate and asymmetric. `additionalContext` is
 * model-facing and costs the user no interruption, so the whisper lives there
 * for every severity. `systemMessage` is shown to the human, and interrupting
 * someone deserves a real threshold: `memory-off` means the kit is effectively
 * not capturing, and staying quiet about THAT loses sessions the user believes
 * are being saved. Anything less severe stays model-only.
 */
export function formatMemoryOffMessage(warnings) {
  if (!Array.isArray(warnings)) return null;
  const off = warnings.find((w) => w.severity === 'memory-off');
  if (!off) return null;
  return `[core-memory-kit] Memory capture is OFF — ${off.title}. Fix: \`${off.primaryAction}\``;
}

/**
 * The UserPromptSubmit hook's whole output, in one call.
 *
 * @returns {{additionalContext: string|null, systemMessage: string|null}}
 *   `additionalContext` = the whisper (when broken) + the recall hint (when it
 *   fires), whisper first; `systemMessage` = the human-facing line at
 *   `memory-off` only. Both null when there is nothing to say.
 *
 * FAIL-OPEN, twice over: an error in the health read leaves the hint intact,
 * and an error in the hint leaves the whisper intact. Neither can suppress the
 * other, because the failure the whisper reports is often the same failure that
 * broke the hint.
 *
 * PRIVACY: no prompt-derived text enters the whisper at any point — it is built
 * purely from the registry (kit-authored strings) and the log's outcome counts.
 * The hint keeps its own FR-15 screen for the text it does touch.
 */
export function buildPromptHookOutput({ projectRoot, prompt, sessionId, now } = {}) {
  let warnings = [];
  try {
    warnings = activeWarnings(projectRoot, { now });
  } catch {
    warnings = []; // a broken diagnostic must never cost the user their hint
  }
  let whisper = null;
  let systemMessage = null;
  try {
    whisper = formatHealthWhisper(warnings);
    systemMessage = formatMemoryOffMessage(warnings);
  } catch {
    whisper = null;
    systemMessage = null;
  }

  let hint = null;
  try {
    hint = buildMemoryHint({ projectRoot, prompt, sessionId });
  } catch {
    hint = null; // never let a hint failure swallow a live failure report
  }

  const parts = [whisper, hint].filter(Boolean);
  return {
    // The whisper LEADS: it is the thing that changes what the agent should do
    // next, and the hint is advice about a system that may currently be broken.
    additionalContext: parts.length > 0 ? parts.join('\n\n') : null,
    systemMessage,
  };
}

export function capturePrompt({ payload, projectRoot, now } = {}) {
  if (!payload || typeof payload !== 'object') {
    return { action: 'noop', reason: 'no-payload' };
  }
  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  if (prompt === '') {
    return { action: 'noop', reason: 'empty-prompt' };
  }

  const ts = now ?? new Date().toISOString();
  const date = dateFromIso(ts);
  const transcriptsDir = join(projectRoot, 'context', 'transcripts');
  const transcriptPath = join(transcriptsDir, `${date}.md`);

  let sanitized = sanitizePrivacyTags(prompt);

  // Task 148.2b/148.3 (ADR-0019, design §6.10): L1 mask + live-buffer split —
  // the user prompt gets the same treatment as the assistant turn. Screen ON:
  // masked, appended to the gitignored live buffer (promoted screened later);
  // OFF: pre-148 direct committed append.
  const screenOn = resolvePrivacyScreen({ projectRoot }) === 'on';
  if (screenOn) {
    const m = maskPii(sanitized, { usernames: localUsernames() });
    sanitized = m.text;
    appendRedactions(projectRoot, {
      source: 'capture-prompt',
      layer: 'L1',
      redactions: m.redactions,
    });
  }
  const effectiveTranscriptPath = screenOn
    ? liveTranscriptPath(projectRoot, date)
    : transcriptPath;
  const entry = `## ${ts} — user\n\n${sanitized}\n\n`;

  if (!existsSync(transcriptsDir)) {
    mkdirSync(transcriptsDir, { recursive: true });
  }
  appendFileSync(effectiveTranscriptPath, entry, 'utf8');

  // Task 192 (ADR-0017 Phase 1c): the USER-CORRECTION detector rides the
  // prompt hook — a correction in the user's opening words dampens the prior
  // window's surfaced ids (through the 193 screen) and resolves pending
  // expectations MISS/REVERSAL. Best-effort by module contract.
  try {
    judgeUserPrompt({ projectRoot, session: payload?.session_id, prompt: sanitized });
  } catch {
    /* the judge must never break the prompt hook */
  }

  return { action: 'appended', transcriptPath: effectiveTranscriptPath };
}
