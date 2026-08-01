// Auto-extract subagent (Task 23, T-020).
//
// Pattern inspired by claude-remember (https://github.com/Digital-
// Process-Tools/claude-remember, Community License) — see
// docs/research/2026-05-25-claude-remember-code-dive.md and SOURCES.md
// for the absorbed ideas + license posture. Implementation written
// from scratch per design.md §6; no code or prompts copied verbatim.
//
// Spawned detached by Task 21's Stop hook (cmk-capture-turn). Reads
// the just-captured turn pair (user prompt + assistant response) from
// a temp file, asks a sandboxed Haiku to identify durable facts per
// the six writing triggers from design §6.4, then routes each
// candidate by trust:
//   high   → memoryWrite({action:'add', tier:'P', ...}) — same public
//            boundary the user-explicit memory-write Skill uses. The
//            write goes through Poison_Guard (design §6.7) before
//            touching MEMORY.md (Active Threads). Task 24 closed the
//            documented Poison_Guard bypass that Task 23 left open.
//   medium → appended to context/queues/review.md (user reviews via
//            `cmk queue review`).
//   low    → discarded; logged as skipped_reason "nothing_durable".
//
// Bi-turn extraction (2026-05-26 amendment, see design §6.4 +
// docs/journey/2026-05-26-live-test-findings.md): the temp file
// carries BOTH turns with explicit USER_TURN: / ASSISTANT_TURN:
// markers. Haiku tags each candidate with origin (user|assistant);
// assistant-origin candidates demote one trust level (HIGH → MEDIUM,
// MEDIUM → LOW, LOW → discarded) so assistant inferences land in the
// review queue for user confirmation rather than auto-applying. The
// <retain> override beats demotion (force-promotes to HIGH).
// Within-call dedup by canonical-ID keeps the higher-trust candidate
// when the user states a fact and the assistant echoes it.
//
// Public boundary: runAutoExtract({turnFile, projectRoot, haikuBackend,
// now, sessionId}) → result. The bin wrapper at
// plugin/bin/cmk-auto-extract.mjs constructs a real
// HaikuViaAnthropicApi and calls this function with the turn file
// path passed in argv[2] from Task 21's spawn.

import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  writeSync,
  readFileSync,
  unlinkSync,
  appendFileSync,
  writeFileSync,
} from 'node:fs';
import { resolveScratchpadPath } from './tier-paths.mjs';
import { join, dirname } from 'node:path';
import { generateId } from '@lh8ppl/cmk-canonicalize';
import { hashContent } from './content-hash.mjs';
import { memoryWrite } from './memory-write.mjs';
import { extractFallbackCandidates } from './extract-fallback.mjs';
import { writeFact } from './write-fact.mjs';
import { buildRichFactBody, slugifyFact } from './rich-fact.mjs';
import { sanitizeForTitle } from './sanitize.mjs';
import { HaikuTimeoutError } from './compressor.mjs';
import { pidIsAlive } from './lock-discipline.mjs';
import { nowIso } from './audit-log.mjs';
import { ERROR_CATEGORIES } from './result-shapes.mjs';
import { touchCooldownMarker } from './cooldown.mjs';
// Task 250 (D-412) — the failure-driven health nudge's capture-chain evidence.
// This is the ONE site that knows whether the agent's backend CLI actually ran,
// so it owns both the deterministic `agent-cli-missing` and the stochastic
// `extract-failing` classes. Best-effort by module contract (never throws).
import { appendHealthEntry, isBinaryMissingError, HEALTH_CODES } from './health-log.mjs';
// Task 61 — inline cross-project promotion. Reuse auto-persona's classifier
// directive, parser, and promote-to-user-tier path so the SAME per-turn Haiku
// call that extracts project facts ALSO promotes cross-project doctrine to the
// user tier immediately (vs waiting for the weekly auto-persona janitor).
import { parsePersonaCandidates, promoteCandidatesToUserTier, PERSONA_CONFIDENCE_RULE } from './auto-persona.mjs';

const LOCK_FILENAME = 'auto-extract.lock';
const NOW_MD_RELATIVE = ['context', 'sessions', 'now.md'];
const REVIEW_QUEUE_RELATIVE = ['context', 'queues', 'review.md'];
const EXTRACT_LOG_DIR_RELATIVE = ['context', 'sessions'];

// Noise tags absorbed from the code-dive note — generic markers Claude
// Code injects that aren't part of real exchanges and should never
// reach the extraction prompt.
const NOISE_TAG_PATTERNS = [
  /<system-reminder>[\s\S]*?<\/system-reminder>/g,
  /<command-name>[\s\S]*?<\/command-name>/g,
  /<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g,
  /<local-command-stderr>[\s\S]*?<\/local-command-stderr>/g,
  /<local-command-output>[\s\S]*?<\/local-command-output>/g,
];

// Force-save tag from design §6.6 — content wrapped in <retain> is kept
// at trust:high regardless of what Haiku decided.
const RETAIN_RE = /<retain>([\s\S]*?)<\/retain>/g;

// Trust labels Haiku emits in our prompt's response format. Anything
// not matching a label is ignored (resilient against minor format drift).
// Shape: `TRUST_<HIGH|MEDIUM|LOW> <user|assistant>: <text>`
const CANDIDATE_LINE_RE = /^TRUST_(HIGH|MEDIUM|LOW)\s+(user|assistant):\s*(.+)$/i;
const SKIP_LINE_RE = /^\s*SKIP\s*$/i;

// Task 148.5 (ADR-0019, design §6.10) — the sensitivity axis. An optional
// ` | SENSITIVITY: <value>` TAIL on a terse line (and a `sensitivity:` field
// in a BEGIN_FACT block) routes the candidate:
//   commit (default) → the normal route (MEMORY.md / review queue / fact store)
//   local-only       → gitignored context.local/private.md (never a committed surface)
//   drop             → not written anywhere; logged as sensitivity_drop (Door 5)
// An UNRECOGNIZED value maps to local-only, NOT commit — if the model flagged
// the content at all, silently committing it is the one wrong answer (the
// §6.10 "when in doubt, redact" posture applied to routing).
// The `-` is placed last in the class (a literal hyphen, not a range) and the
// trailing `[ \t]*$` uses an explicit horizontal-space class — no `\s*…\s*$`
// ambiguity. Sensitivity values are a small fixed vocabulary (commit / drop /
// local-only), so the letter+hyphen class is exact.
const SENSITIVITY_TAIL_RE = /[ \t]*\|[ \t]*SENSITIVITY:[ \t]*([A-Za-z-]+)[ \t]*$/i;

function normalizeSensitivity(raw) {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === '' || v === 'commit') return 'commit';
  if (v === 'drop') return 'drop';
  return 'local-only';
}

// Demotion map for assistant-origin candidates (design §6.4 amendment).
// HIGH → MEDIUM → LOW → discarded. Discarded candidates never reach the
// router; they're dropped immediately and counted toward
// `skipped_reason: nothing_durable` if everything demotes away.
const ASSISTANT_DEMOTION = Object.freeze({
  high: 'medium',
  medium: 'low',
  low: 'discarded',
});

// Trust ranking for the within-call dedup tiebreak. Higher = stronger.
const TRUST_RANK = Object.freeze({
  high: 3,
  medium: 2,
  low: 1,
  discarded: 0,
});

// Task 92 (G6): max chars of a discarded LOW candidate's text to record in the
// extract.log trace. Enough to identify what was dropped without bloating the
// log; the full turn still lives in transcripts/{date}.md if deeper recovery is
// needed.
const LOW_DISCARD_EXCERPT_MAX = 200;

// --- Lock file primitives -------------------------------------------

function acquireLock(lockPath) {
  mkdirSync(dirname(lockPath), { recursive: true });
  // O_CREAT | O_EXCL: atomic-create-or-fail. The 'wx' flag in Node
  // maps to that combination — exactly the noclobber semantics from
  // claude-remember's bash pattern.
  try {
    const fd = openSync(lockPath, 'wx');
    writeSync(fd, String(process.pid), 0, 'utf8');
    closeSync(fd);
    return { acquired: true };
  } catch (err) {
    if (err.code !== 'EEXIST') {
      return { acquired: false, reason: 'lock-error', error: err };
    }
  }
  // Lock exists. Check if the holding PID is alive.
  let pid = null;
  try {
    pid = parseInt(readFileSync(lockPath, 'utf8').trim(), 10);
  } catch {
    // Lock file unreadable — treat as stale.
  }
  if (pid && pidIsAlive(pid)) {
    return { acquired: false, reason: 'pid-alive', pid };
  }
  // Stale lock. Remove + retry once. (No infinite loop — at most two
  // attempts so an unrelated concurrent kill races doesn't deadlock.)
  try {
    unlinkSync(lockPath);
  } catch (err) {
    // Another process beat us to the cleanup; treat as contention.
    if (err.code !== 'ENOENT') {
      return { acquired: false, reason: 'lock-cleanup-failed', error: err };
    }
  }
  try {
    const fd = openSync(lockPath, 'wx');
    writeSync(fd, String(process.pid), 0, 'utf8');
    closeSync(fd);
    return { acquired: true, recoveredStale: true };
  } catch (err) {
    return { acquired: false, reason: 'lock-error-after-recovery', error: err };
  }
}

// pidIsAlive is consolidated in lock-discipline.mjs — same probe is
// used by cmk doctor HC-9 + this module's stale-recovery path.
// Importing instead of inlining eliminates drift risk (the kit's
// shared-modules rule, CLAUDE.md §1.3).

function releaseLock(lockPath) {
  try {
    unlinkSync(lockPath);
  } catch {
    // Best-effort; if the lock is already gone, fine.
  }
}

// --- Turn-file sanitization -----------------------------------------

function stripNoiseTags(text) {
  let out = text;
  for (const re of NOISE_TAG_PATTERNS) {
    out = out.replace(re, '');
  }
  return out;
}

function extractRetainSegments(text) {
  const segments = [];
  let m;
  RETAIN_RE.lastIndex = 0;
  while ((m = RETAIN_RE.exec(text)) !== null) {
    segments.push(m[1].trim());
  }
  return segments;
}

// --- Dedup context --------------------------------------------------

// Task 132 (D-122): exported for capture-turn, which snapshots the dedup
// context BEFORE appending the current turn to now.md and passes it here
// inside the turn file. Reading now.md from THIS module (after the append)
// was the self-poisoning bug: the "last entry" was the very turn being
// extracted, so Haiku was told "do not re-emit facts already here" about
// its own input → nothing_durable on every organic turn (since Task 87;
// live A/B repro 2026-06-11, cut-gate8).
export function readLastEntryFromNowMd(projectRoot) {
  const nowMd = join(projectRoot, ...NOW_MD_RELATIVE);
  if (!existsSync(nowMd)) return '';
  let body;
  try {
    body = readFileSync(nowMd, 'utf8');
  } catch {
    return '';
  }
  // Find the last `## ` heading and return everything from it to end.
  const lines = body.split('\n');
  let lastHeadingIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^##\s/.test(lines[i])) {
      lastHeadingIdx = i;
      break;
    }
  }
  if (lastHeadingIdx === -1) return '';
  return lines.slice(lastHeadingIdx).join('\n').trim();
}

// --- Turn-file parser (bi-turn) -------------------------------------

// Parse the temp-file format Task 21's capture-turn writes:
//   DEDUP_CONTEXT:          ← Task 132: optional; the last now.md entry
//   <previous entry>          as it stood BEFORE the current turn was
//                             appended (capture-turn snapshots it)
//   USER_TURN:
//   <user body>
//
//   ASSISTANT_TURN:
//   <assistant body>
// Any section may be empty. If no USER_TURN: / ASSISTANT_TURN:
// markers are present, fall back to "the whole file is the assistant
// turn" so old-format temp files (pre-2026-05-26) still work — useful
// when running auto-extract against a turn buffer that pre-dates this
// amendment (unlikely after the rollout, but defensive). A missing
// DEDUP_CONTEXT marker means NO dedup section — never a now.md re-read
// (that re-read was the Task 132 self-poisoning bug).
const USER_TURN_RE = /^[ \t]*USER_TURN:\s*\n([\s\S]*?)(?=^[ \t]*ASSISTANT_TURN:|\Z)/m;
const ASSISTANT_TURN_RE = /^[ \t]*ASSISTANT_TURN:\s*\n([\s\S]*)$/m;
const DEDUP_CONTEXT_RE =
  /^[ \t]*DEDUP_CONTEXT:\s*\n([\s\S]*?)(?=^[ \t]*USER_TURN:|^[ \t]*ASSISTANT_TURN:)/m;

function parseTurnFile(rawTurn) {
  const dedupMatch = rawTurn.match(DEDUP_CONTEXT_RE);
  const userMatch = rawTurn.match(USER_TURN_RE);
  const assistantMatch = rawTurn.match(ASSISTANT_TURN_RE);
  if (!userMatch && !assistantMatch) {
    // Old-format / unlabeled — treat whole content as assistant.
    return { userTurn: '', assistantTurn: rawTurn.trim(), dedupContext: '' };
  }
  return {
    userTurn: (userMatch?.[1] ?? '').trim(),
    assistantTurn: (assistantMatch?.[1] ?? '').trim(),
    dedupContext: (dedupMatch?.[1] ?? '').trim(),
  };
}

// --- Prompt construction --------------------------------------------

// Written from scratch per design §6.4 — no text copied from claude-
// remember's prompts. Output format encodes origin so the routing
// layer can apply the assistant-demotion rule (§6.4 amendment, 2026-05-26).
export function buildExtractionInstructions() {
  return [
    'You are a memory-extraction agent for core-memory-kit.',
    'You read a captured turn pair (the user prompt + the assistant response) and identify durable facts worth saving.',
    '',
    'The user is the authority on facts about themselves and their preferences.',
    'The assistant is inferring or echoing — treat its observations as proposals to confirm later, not as ground truth.',
    '',
    'Save when EITHER turn reveals any of the six writing triggers:',
    '  1. User corrections — "don\'t do that again", "use this instead".',
    '  2. Discovered preferences — patterns across multiple turns.',
    '  3. Setup / configuration facts — concrete setup or configuration values the next session would otherwise have to re-derive to recover (the answer to "what\'s our setup / how is this configured"). **Capture these even when they surface from the WORK itself, not only from a stated preference** — a value recalled from memory is what saves the next session from re-deriving it.',
    '  4. Project conventions — patterns discovered while working in the project (in its files, structure, or materials).',
    '  5. Completed complex workflows — 5+ tool calls; the approach is worth recording.',
    '  6. Tool quirks and workarounds — non-obvious findings.',
    '',
    'Skip: conversational chatter, trivial info, raw data dumps, session-specific ephemera.',
    '',
    'Output format (one candidate per line; tag each with origin = user OR assistant):',
    '  TRUST_HIGH user: <text>          — user clearly stated this; high confidence',
    '  TRUST_MEDIUM user: <text>        — user mentioned this but ambiguously',
    '  TRUST_LOW user: <text>           — barely a signal (rarely emit)',
    '  TRUST_HIGH assistant: <text>     — assistant inferred this with high confidence',
    '  TRUST_MEDIUM assistant: <text>   — assistant\'s weaker inference',
    '  TRUST_LOW assistant: <text>      — barely a signal (rarely emit)',
    '  SKIP                             — emit alone if nothing in either turn is worth saving',
    '',
    'Constraints:',
    '  - Each bullet ≤ 200 chars.',
    '  - No prose around the labels.',
    '  - Do not invent facts; only restate what the turns show.',
    '  - If a previous-entry context is included below, do NOT re-emit facts already in it.',
    '',
    'Note: assistant-origin candidates are auto-demoted one trust level before routing (HIGH → MEDIUM → LOW → discarded). This is intentional — assistant inferences need user review. Emit your honest trust assessment; the routing layer handles demotion.',
    '',
    'SENSITIVITY routing (privacy) — applies to BOTH the terse TRUST_ lines AND the BEGIN_FACT blocks below. The project memory is COMMITTED TO GIT and may be public. Judge each candidate for personal/sensitive content: health details, real names of private individuals, home addresses, family matters, relationship or private grievances, financial specifics.',
    '  - Not sensitive (the default — omit any marker): committed normally.',
    '  - Useful for future work BUT sensitive → append ` | SENSITIVITY: local-only` to the terse line (or add a `sensitivity: local-only` field inside the BEGIN_FACT block). Saved machine-local only, never committed.',
    '  - Sensitive AND not needed for future work → ` | SENSITIVITY: drop` (or `sensitivity: drop`). Not saved at all.',
    '  When in doubt between commit and local-only, choose local-only. Software identifiers (usernames of public accounts, repo names, library authors) are NOT sensitive.',
    '',
    'ALSO — rich fact files (durable project KNOWLEDGE). This is a SEPARATE output from the terse TRUST_ lines. When a turn reveals a durable, substantive piece of project knowledge worth a FULL record — a setup/configuration fact (trigger 3), a project convention (trigger 4), a completed multi-step workflow worth recording (trigger 5), or a tool quirk/workaround (trigger 6) — emit a BEGIN_FACT block (below) INSTEAD OF a terse TRUST_ line for it. Keep terse TRUST_ lines for the LIGHTER signals: user corrections and discovered preferences (triggers 1–2) and active threads. Emit each fact EITHER as a rich BEGIN_FACT block OR as a terse TRUST_ line — NEVER both.',
    'Format (one block per durable fact):',
    '  BEGIN_FACT',
    '  type: project',
    '  shape: <State|Event|Plan|Relationship|Preference|Absence|Timeless — optional; what KIND of truth this is>',
    '  title: <short Title-Case headline, ≤ 80 chars>',
    '  body: <what is true; if it has parts, give a short labelled markdown breakdown over multiple lines, NOT one vague sentence>',
    '  why: <why it is true / why it matters — the rationale a future session needs>',
    '  how: <how the next session should apply it>',
    '  END_FACT',
    '  shape guide: State = an ongoing condition ("we deploy to Cloud Run"); Event = happened once ("we migrated to SQLite on May 3"); Plan = future-dated ("demo scheduled Friday"); Relationship = a relation between entities; Preference = a personalization; Absence = a NEGATIVE fact ("user does NOT want emoji"); Timeless = always true. Omit if unsure — State is the default.',
    '  expires: <YYYY-MM-DD> — OPTIONAL, for Plan/Event facts ONLY, and ONLY when the turn states a concrete date after which the fact no longer holds ("demo on 2026-07-04" → expires: 2026-07-04). NEVER guess or infer a date the turn does not state; when in doubt, omit — a permanent fact is always safer than a wrongly-expiring one.',
    'Rules for BEGIN_FACT blocks:',
    '  - body may span multiple lines (markdown bullets are encouraged when the knowledge has parts — make the saved fact genuinely useful to a future session, at least as detailed as a careful hand-written note). Write it as plain markdown on the lines after `body:` — do NOT use a YAML block scalar (`|` or `>`).',
    '  - title AND body are required; why/how are strongly preferred but optional. type defaults to project.',
    '  - Do NOT invent facts; synthesize only what the turn shows. Never put a secret, token, password, or key in a block.',
    '  - These facts are saved automatically (no review step), so be selective: only genuinely durable knowledge, at most a few per turn.',
    '',
    'ALSO — cross-project doctrine. This is a REQUIRED, PER-FACT pass, separate from the TRUST_ lines above. Re-scan the SAME turn for EVERY fact that expresses how this user works in ALL their projects (tooling habits, how they structure their work, communication / process style — NOT specifics that belong to this ONE project, like a particular value, name, or detail that would not carry to their other projects). **For EACH such cross-project fact, emit its OWN PERSONA CANDIDATE line — one line per fact. If the turn states THREE cross-project rules, emit THREE PERSONA CANDIDATE lines. Never collapse several rules into one line, and never skip a rule because the turn is busy or already has TRUST_ lines.** Format (one line per cross-project fact):',
    '  PERSONA CANDIDATE | target=<HABITS.md|LESSONS.md|USER.md> | section=<Section> | confidence=<high|medium|low> | <one-line restatement>',
    '    - HABITS.md  → sections: Iteration Cadence | Destructive Operations | Communication Style',
    '    - LESSONS.md → sections: Tooling Lessons | Process Lessons | Anti-patterns',
    '    - USER.md    → sections: About | Preferences | Working Style',
    '  PREFER an existing section above — route to the closest fit. Only if NONE genuinely fits may you name a new short Title-Case section (2-4 words, letters/spaces only, e.g. "Architecture Preferences"). Never invent a new section when an existing one fits.',
    PERSONA_CONFIDENCE_RULE,
    '  Emit no PERSONA CANDIDATE line if nothing is cross-project.',
  ].join('\n');
}

function buildExtractionPrompt({ userTurn, assistantTurn, dedupContext }) {
  const sections = [];
  if (dedupContext) {
    sections.push('# Previous entry (do not re-emit facts already here)');
    sections.push(dedupContext);
    sections.push('');
  }
  sections.push('# USER_TURN');
  sections.push(userTurn || '(no user turn captured)');
  sections.push('');
  sections.push('# ASSISTANT_TURN');
  sections.push(assistantTurn || '(no assistant turn captured)');
  return sections.join('\n');
}

// Exported for the live-Haiku smoke (spawn-smoke-auto-extract-rich.test.js),
// which asserts the enriched prompt still elicits parseable terse OR rich
// output from real Haiku. The terse format is the extraction prompt's contract,
// same as parseRichFacts above.
export function parseCandidates(haikuOutput) {
  if (!haikuOutput || typeof haikuOutput !== 'string') return [];
  const lines = haikuOutput.split('\n');
  const candidates = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (SKIP_LINE_RE.test(trimmed)) continue;
    const m = trimmed.match(CANDIDATE_LINE_RE);
    if (!m) continue;
    const trust = m[1].toLowerCase();
    const origin = m[2].toLowerCase();
    let text = m[3].trim();
    // 148.5: peel the optional sensitivity tail off the text BEFORE the text
    // becomes the fact (a literal `| SENSITIVITY:` never belongs in a bullet).
    let sensitivity = 'commit';
    const sm = text.match(SENSITIVITY_TAIL_RE);
    if (sm) {
      sensitivity = normalizeSensitivity(sm[1]);
      text = text.slice(0, sm.index).trim();
    }
    if (text === '') continue;
    candidates.push({ trust, origin, text, sensitivity });
  }
  return candidates;
}

// --- Rich-fact parser (Task 103) ------------------------------------

// Durable project KNOWLEDGE (the six triggers' config / convention / workflow /
// quirk facts) is emitted by Haiku as a fenced block, parsed here into the
// fields writeFact() needs. Lives next to parseCandidates + buildExtraction-
// Instructions — the format and its parser stay together (same as the terse
// TRUST_ surface). See design §6.4.
//
//   BEGIN_FACT
//   type: project
//   title: <short title>
//   body: <summary; MAY continue as markdown bullets on following lines>
//   why: <rationale>
//   how: <how to apply>
//   END_FACT
//
// A field's value continues across lines until the next recognized key or the
// block close — so `body` can hold a multi-line structured breakdown (the
// native-parity bar). type defaults to 'project' when absent/invalid; a block
// missing title OR body is skipped (writeFact requires both).
const RICH_FACT_VALID_TYPES = new Set(['user', 'feedback', 'project', 'reference']);
// Task 66.1 (design §16.18): the 7-value temporal-shape enum, mirrored from
// write-fact.mjs the same way RICH_FACT_VALID_TYPES mirrors its VALID_TYPES.
// The LLM boundary is TOLERANT (case normalized, invalid → omitted so a Haiku
// typo can't kill a capture); writeFact stays strict for programmatic callers.
const RICH_FACT_VALID_SHAPES = new Set([
  'State',
  'Event',
  'Plan',
  'Relationship',
  'Preference',
  'Absence',
  'Timeless',
]);
const RICH_FACT_KEYS = new Set(['type', 'title', 'body', 'why', 'how', 'shape', 'expires', 'sensitivity']);
// Task 66.3: the same strict ISO shape write-fact.mjs enforces — the LLM
// boundary stays tolerant by OMITTING anything else (a bad date must never
// kill a capture), while writeFact would reject it loudly on the explicit path.
const RICH_FACT_EXPIRES_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
// Defensive per-field cap so a runaway block can't write an unbounded fact body.
const RICH_FACT_FIELD_CAP = 4000;

// Match a `key: value` field line. String-based (not a regex) — deterministically
// linear, no backtracking surface. Semantics: the key must be at the START of
// the line (no leading whitespace, mirroring an `^key` anchor), with optional
// whitespace before the colon. Returns {key, value} or null (a continuation /
// non-key line, e.g. a `- bullet:` inside a body).
function matchRichFactKey(line) {
  const idx = line.indexOf(':');
  if (idx <= 0) return null;
  const keyPart = line.slice(0, idx);
  if (keyPart.trimStart().length !== keyPart.length) return null; // leading ws → not a key
  const key = keyPart.trimEnd().toLowerCase();
  if (!RICH_FACT_KEYS.has(key)) return null;
  return { key, value: line.slice(idx + 1).trimStart() };
}

// A YAML block-scalar indicator as a field's entire first-line value (`|`,
// `|-`, `>`, `>+`, `|2`, …). Live Haiku formats a multi-line body as `body: |`
// then indents the content — we must not keep the literal `|` or the indent.
const BLOCK_SCALAR_RE = /^[|>][+-]?\d*$/;

// Normalize a parsed field value: drop a leading block-scalar indicator line,
// then dedent (strip the common leading whitespace the block scalar adds). A
// plain single-line value passes through untouched.
function cleanFieldValue(raw) {
  const lines = (raw ?? '').split('\n');
  if (lines.length && BLOCK_SCALAR_RE.test(lines[0].trim())) lines.shift();
  const indents = lines
    .filter((l) => l.trim() !== '')
    .map((l) => (l.match(/^[ \t]*/)?.[0].length ?? 0));
  const minIndent = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(minIndent)).join('\n').trim();
}

function parseRichFactBlock(blockLines) {
  const fields = {};
  let currentKey = null;
  for (const line of blockLines) {
    const m = matchRichFactKey(line);
    if (m) {
      currentKey = m.key;
      fields[currentKey] = m.value; // first-line value (may be '' or a `|` scalar)
    } else if (currentKey) {
      // Continuation of the current field — multi-line body / why / how.
      fields[currentKey] += '\n' + line;
    }
    // A non-key line before any key is ignored.
  }
  const title = cleanFieldValue(fields.title);
  const body = cleanFieldValue(fields.body);
  if (!title || !body) return null; // writeFact requires both
  let type = cleanFieldValue(fields.type).toLowerCase();
  if (!RICH_FACT_VALID_TYPES.has(type)) type = 'project';
  const why = cleanFieldValue(fields.why);
  const how = cleanFieldValue(fields.how);
  // Normalize Haiku's casing to the canonical spelling ('plan' → 'Plan');
  // anything outside the enum is dropped, not fatal — writeFact defaults State.
  const rawShape = cleanFieldValue(fields.shape);
  const normShape = rawShape
    ? rawShape.charAt(0).toUpperCase() + rawShape.slice(1).toLowerCase()
    : '';
  const shape = RICH_FACT_VALID_SHAPES.has(normShape) ? normShape : undefined;
  // 66.3: a suggested validity end — kept only when it's a strict ISO date
  // Haiku derived from the turn (the prompt forbids guessing); anything else
  // is dropped, not fatal.
  const rawExpires = cleanFieldValue(fields.expires);
  const expires =
    rawExpires && RICH_FACT_EXPIRES_PATTERN.test(rawExpires) && !Number.isNaN(Date.parse(rawExpires))
      ? rawExpires
      : undefined;
  // 148.5: the sensitivity routing field — same tolerant normalization as the
  // terse tail (absent → commit; unrecognized → local-only, never a silent commit).
  const sensitivity = normalizeSensitivity(cleanFieldValue(fields.sensitivity));
  return {
    type,
    sensitivity,
    ...(shape ? { shape } : {}),
    ...(expires ? { expires } : {}),
    title: title.slice(0, RICH_FACT_FIELD_CAP),
    body: body.slice(0, RICH_FACT_FIELD_CAP),
    why: why ? why.slice(0, RICH_FACT_FIELD_CAP) : '',
    how: how ? how.slice(0, RICH_FACT_FIELD_CAP) : '',
  };
}

// Exported for direct unit-testing (cli-rich-fact.test.js) — the BEGIN_FACT
// format is the extraction prompt's contract, pinned independently of a live
// Haiku call.
export function parseRichFacts(haikuOutput, { onClipped } = {}) {
  if (!haikuOutput || typeof haikuOutput !== 'string') return [];
  const lines = haikuOutput.split('\n');
  const facts = [];
  let clipped = 0;
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim().toUpperCase() !== 'BEGIN_FACT') {
      i++;
      continue;
    }
    // Collect block lines until END_FACT, the next BEGIN_FACT (missing close —
    // don't let it swallow the following block), or end-of-output.
    i++;
    const blockLines = [];
    let terminated = false;
    while (i < lines.length) {
      const marker = lines[i].trim().toUpperCase();
      if (marker === 'END_FACT') {
        terminated = true;
        i++;
        break;
      }
      if (marker === 'BEGIN_FACT') {
        // Implicit close by the next block — the body up to here is whole.
        terminated = true;
        break;
      }
      blockLines.push(lines[i]);
      i++;
    }
    // Task 136 (D-124): a block that ran into END-OF-OUTPUT without any
    // terminator is the signature of the compressor's maxOutputBytes slice
    // cutting Haiku's reply mid-fact. Writing it would persist a corrupted
    // stub (cut-gate9's P-BaTM3L42: body "The `clau"). Drop it — losing the
    // clipped fact beats storing a mangled one; the count reaches
    // extract.log via onClipped for observability.
    if (!terminated) {
      clipped++;
      continue;
    }
    const fact = parseRichFactBlock(blockLines);
    if (fact) facts.push(fact);
  }
  if (clipped > 0 && typeof onClipped === 'function') onClipped(clipped);
  return facts;
}

// Demote assistant-origin candidates one trust level. User-origin
// candidates pass through unchanged — they're authoritative.
// Order: must run BEFORE applyRetainOverride so the override beats
// demotion (an assistant-origin candidate inside a <retain> still
// force-promotes to HIGH).
function applyOriginDemotion(candidates) {
  return candidates.map((c) => {
    if (c.origin !== 'assistant') return c;
    const demoted = ASSISTANT_DEMOTION[c.trust] ?? c.trust;
    return { ...c, trust: demoted, demotedFrom: c.trust };
  });
}

// Group by canonical id of text; keep the highest-trust candidate per
// group. Handles the "user states X; assistant echoes X" duplicate
// problem. Note: canonical-id dedup is LITERAL — semantically-similar
// phrasings with different canonical forms slip through here and are
// resolved by Task 25's conflict queue at write time.
function dedupByCanonicalId(candidates) {
  const byId = new Map();
  for (const c of candidates) {
    const id = generateId('P', c.text);
    const existing = byId.get(id);
    if (!existing || (TRUST_RANK[c.trust] ?? 0) > (TRUST_RANK[existing.trust] ?? 0)) {
      byId.set(id, c);
    }
  }
  return [...byId.values()];
}

// Force-promote any candidate whose text overlaps substantively with a
// <retain> segment from the original turn. Per design §6.6: <retain>
// is the force-save signal that overrides Haiku's trust judgment.
//
// Match semantics (deliberately conservative, per code-review B1 fix):
//   - Forward-only: the candidate text must CONTAIN the retain segment.
//     The reverse direction (retain contains candidate) was rejected
//     because it lets a small retain segment promote any candidate that
//     happens to contain a tiny common substring (e.g. <retain>x</retain>
//     would promote anything with an "x").
//   - Minimum length: the matching retain segment must be at least
//     MIN_RETAIN_MATCH_CHARS long. Stops trivially-short retain segments
//     from grabbing unrelated candidates.
const MIN_RETAIN_MATCH_CHARS = 20;

function applyRetainOverride(candidates, retainSegments) {
  if (retainSegments.length === 0) return candidates;
  return candidates.map((c) => {
    const matched = retainSegments.some(
      (seg) => seg.length >= MIN_RETAIN_MATCH_CHARS && c.text.includes(seg),
    );
    return matched ? { ...c, trust: 'high', retainOverride: true } : c;
  });
}

// --- Routing --------------------------------------------------------

// Classifies a memoryWrite result for observation-counting purposes.
//
// Three categories of memoryWrite outcome that auto-extract cares about:
//   - 'memory'   — bullet appended to MEMORY.md (or other scratchpad)
//   - 'conflict' — bullet routed to queues/conflicts.md (the queue-route
//                  in memory-write.doAdd, when new.trust < existing.trust)
//   - 'rejected' — Poison_Guard / schema / cap-exceeded rejection
//
// At trust:high (where auto-extract calls memoryWrite) the queue-route
// is unreachable today: detectConflicts returns action:'supersede' when
// new.trust >= existing.trust. The explicit 'conflict' branch is
// defensive — if a v0.1.x change lowers auto-extract trust or alters
// supersede semantics, a 'queued' return would otherwise be silently
// misclassified as 'rejected'. observation_count counts both 'memory'
// AND 'conflict' since both are successful writes (just to different
// scratchpads).
//
// Exported for direct unit-testing — the queue-route is unreachable
// from the live auto-extract flow today (see above), so pinning the
// discriminator's behavior on each possible action value requires
// calling it with literal inputs.
export function classifyHighTrustWrite(r) {
  if (r?.action === 'appended') return 'memory';
  if (r?.action === 'queued') return 'conflict';
  return 'rejected';
}

function routeHigh({ candidate, projectRoot, ts, sessionId }) {
  // Auto-extract writes go to the project tier's MEMORY.md, Active
  // Threads section via memoryWrite() — the same public boundary the
  // user-explicit Skill uses. This routes the auto-extract write
  // through Poison_Guard (design §6.7), which was the KNOWN GAP
  // documented in Task 23 (rejected secrets / injection patterns
  // now blocked before they reach disk).
  //
  // memoryWrite() composes:
  //   1. Poison_Guard regex filter (rejects secrets + injections,
  //      logs to .locks/poison-guard.log with redacted excerpt).
  //   2. appendScratchpadBullet (cap + dedup + audit + ID derivation).
  //
  // The retain-vs-haiku origin is recorded on the in-memory result
  // struct (candidate.retainOverride), not in provenance — sha1 is a
  // content hash, not an origin marker.
  return memoryWrite({
    action: 'add',
    text: candidate.text,
    tier: 'P',
    scratchpad: 'MEMORY.md',
    section: 'Active Threads',
    source: 'auto-extract',
    sessionId: sessionId ?? 'session',
    trust: 'high',
    projectRoot,
    now: ts,
  });
}

// --- Sensitivity routing (Task 148.5, design §6.10) ------------------

// Seed content for context.local/private.md when the local-only route fires on
// an install scaffolded before 148.5 (or a hand-built context/). Mirrors the
// template/local shape: cap comment + purpose note + the 3 documented sections
// (SCRATCHPAD_DOCUMENTED_SECTIONS['private.md']).
function ensurePrivateScratchpad({ projectRoot, ts }) {
  const path = resolveScratchpadPath({ tier: 'L', scratchpad: 'private.md', projectRoot });
  if (existsSync(path)) return path;
  mkdirSync(dirname(path), { recursive: true });
  const seed = [
    `<!-- Cap: 1500 chars · Last distilled: ${ts.slice(0, 10)} · Last health check: ${ts.slice(0, 10)} -->`,
    '',
    '<!-- private.md = sensitive-but-useful facts the auto-extract sensitivity screen routes local-only (local tier — gitignored, never committed). -->',
    '',
    '# Private notes (local tier)',
    '',
    '## Private Notes',
    '',
    '## Sensitive Context',
    '',
    '## Personal Details',
    '',
  ].join('\n');
  writeFileSync(path, seed, 'utf8');
  return path;
}

// Route a local-only candidate (terse OR condensed rich) to the gitignored
// private.md via the SAME memoryWrite boundary the high-trust path uses —
// Poison_Guard still screens (a secret stays a secret even machine-local),
// caps/dedup/audit apply, ids are L-tier. Trust carries the candidate's own
// level: a medium-trust local-only candidate deliberately BYPASSES the
// committed review queue (queues/review.md would leak the content), trading
// the review step for containment — the gitignored file IS the containment.
function routeLocalOnly({ text, trust, projectRoot, ts, sessionId }) {
  ensurePrivateScratchpad({ projectRoot, ts });
  return memoryWrite({
    action: 'add',
    text,
    tier: 'L',
    scratchpad: 'private.md',
    section: 'Private Notes',
    source: 'auto-extract',
    sessionId: sessionId ?? 'session',
    trust,
    projectRoot,
    now: ts,
  });
}

// Condense a rich fact to a single private.md bullet (the local scratchpad is
// bullets, not fact files — design §6.10 routes local-only to private.md).
// Newlines collapse; generous slice keeps the bullet useful under the 1500-char
// file cap without letting one fact eat the whole pad.
const LOCAL_RICH_BULLET_MAX = 300;
function condenseRichFactForLocal(fact) {
  const title = sanitizeForTitle(fact.title);
  // Collapse any whitespace run to one space (newlines included). A single
  // \s+ class — NOT \s*\n+\s* (whose overlapping quantifiers around \n are a
  // super-linear backtracking surface on untrusted fact bodies).
  const flatBody = fact.body.replace(/\s+/g, ' ').trim();
  return `${title} — ${flatBody}`.slice(0, LOCAL_RICH_BULLET_MAX);
}

function routeMedium({ candidate, projectRoot, ts }) {
  const reviewPath = join(projectRoot, ...REVIEW_QUEUE_RELATIVE);
  mkdirSync(dirname(reviewPath), { recursive: true });
  const id = generateId('P', candidate.text);
  const block = [
    `## ${ts} — auto-extract (medium-trust, pending review)`,
    `- (${id}) ${candidate.text}`,
    `  <!-- proposed_trust: medium, write: auto-extract, at: ${ts} -->`,
    '',
  ].join('\n');
  appendFileSync(reviewPath, block, 'utf8');
  return { action: 'queued', id, path: reviewPath };
}

// Route a rich fact to the project fact store via writeFact() (Task 103).
//
// Direct-to-fact-store (NOT the review queue the terse medium-trust path uses):
// the point of Task 103 is AUTOMATIC native-parity capture — native writes its
// fact files with no approval step, so parity requires the same. The fact store
// is searchable-but-not-full-trust-injected, writeFact screens the body +
// frontmatter (Poison_Guard + home-path sanitize + schema + INDEX/reindex), and
// a later explicit `cmk remember` (trust:high) supersedes. See design §6.4.
//
// CAVEAT (F-V0.3.3-2): writeFact does NOT sanitize the SLUG/filename — the slug
// is `slugifyFact(title)` derived HERE, before writeFact runs. So the title MUST
// be routed through sanitizeForTitle first, or a home path in Haiku's candidate
// title (auto-extract runs every turn, no user action) leaks the username into a
// COMMITTED filename. This was the same bug as cmk remember — the old comment
// here wrongly assumed "writeFact already sanitizes" the whole write.
//
// trust:medium / write_source:auto-extract marks it as a Haiku synthesis
// (proposal-grade), below the explicit-high tier. The body is built by the SAME
// rich-fact.mjs helper the explicit path uses, so an auto-extracted fact reads
// identically to a `cmk remember --why/--how` one.
function routeRichFact({ candidate, projectRoot, ts }) {
  const body = buildRichFactBody({
    text: candidate.body,
    why: candidate.why,
    how: candidate.how,
  });
  // Sanitize the title BEFORE deriving the slug (F-V0.3.3-2) — writeFact won't
  // catch a home path in the slug/filename. One helper, same as cmk remember.
  const title = sanitizeForTitle(candidate.title);
  return writeFact({
    tier: 'P',
    type: candidate.type,
    // Task 66.1/66.3: the parser already normalized/validated shape + expires
    // (invalid → absent); absent → writeFact's State default / no expiry.
    shape: candidate.shape,
    expiresAt: candidate.expires,
    slug: slugifyFact(title),
    title,
    body,
    writeSource: 'auto-extract',
    trust: 'medium',
    sourceFile: 'auto-extract',
    sourceLine: 1,
    // Content fingerprint for the provenance field — NOT a security context.
    // Routes through the shared hashContent (SHA-256, D-149); writeFact dedups
    // by the content-addressed id, this is just source_sha1 metadata.
    sourceSha1: hashContent(body),
    createdAt: ts,
    projectRoot,
  });
}

// --- NDJSON extract.log ---------------------------------------------

function writeExtractLogEntry({ projectRoot, ts, entry }) {
  const date = ts.slice(0, 10);
  const logPath = join(projectRoot, ...EXTRACT_LOG_DIR_RELATIVE, `${date}.extract.log`);
  mkdirSync(dirname(logPath), { recursive: true });
  // `phase: 'extract'` discriminator added 2026-05-27 (PR-D2b) to
  // compose with capture-turn.mjs's `phase: 'spawn'` spawn-failed
  // entries. Both shapes coexist in the same NDJSON file; readers
  // route by `phase`. Pre-D2b entries WITHOUT a `phase` field can be
  // treated as `extract` by convention (the spawn-phase entries only
  // exist post-D2b).
  appendFileSync(logPath, JSON.stringify({ phase: 'extract', ...entry }) + '\n', 'utf8');
  return logPath;
}

// --- Public boundary ------------------------------------------------

export async function runAutoExtract({
  turnFile,
  projectRoot,
  haikuBackend,
  now,
  sessionId,
  userDir, // Task 61: when present, cross-project candidates promote to the user tier inline
  settings,
} = {}) {
  const ts = now ?? nowIso();
  const t0 = Date.now();
  const baseEntry = {
    ts,
    success: false,
    error_category: null,
    observation_count: 0,
    skipped_reason: null,
    duration_ms: 0,
  };

  if (!projectRoot) {
    return {
      action: 'error',
      error_category: ERROR_CATEGORIES.MISSING_PROJECT_ROOT,
      observation_count: 0,
      duration_ms: Date.now() - t0,
      logPath: null,
      candidates: [],
    };
  }
  if (!haikuBackend || typeof haikuBackend.compress !== 'function') {
    return {
      action: 'error',
      error_category: ERROR_CATEGORIES.MISSING_BACKEND,
      observation_count: 0,
      duration_ms: Date.now() - t0,
      logPath: null,
      candidates: [],
    };
  }

  const lockPath = join(projectRoot, 'context', '.locks', LOCK_FILENAME);
  const lock = acquireLock(lockPath);
  if (!lock.acquired) {
    // Per code-review I3: set only error_category here, not
    // skipped_reason — concurrent_run is a transient error (retry on
    // the next Stop event), not a "Haiku said nothing durable" skip.
    const entry = {
      ...baseEntry,
      success: false,
      error_category: ERROR_CATEGORIES.CONCURRENT_RUN,
      duration_ms: Date.now() - t0,
    };
    const logPath = writeExtractLogEntry({ projectRoot, ts, entry });
    // Task 132: this early return bypasses the lock-held finally that
    // normally unlinks the turn file — clean it up here or every
    // concurrent rejection leaks one .extract-*.tmp (cut-gate8 finding).
    try {
      if (turnFile && existsSync(turnFile)) unlinkSync(turnFile);
    } catch {
      // best-effort; the sweepStaleTurnFiles janitor catches stragglers
    }
    return {
      action: 'concurrent',
      error_category: ERROR_CATEGORIES.CONCURRENT_RUN,
      observation_count: 0,
      duration_ms: entry.duration_ms,
      logPath,
      candidates: [],
    };
  }

  try {
    // 1. Read turn file.
    if (!existsSync(turnFile)) {
      const entry = {
        ...baseEntry,
        success: false,
        error_category: ERROR_CATEGORIES.MISSING_TURN,
        duration_ms: Date.now() - t0,
      };
      const logPath = writeExtractLogEntry({ projectRoot, ts, entry });
      return {
        action: 'error',
        error_category: ERROR_CATEGORIES.MISSING_TURN,
        observation_count: 0,
        duration_ms: entry.duration_ms,
        logPath,
        candidates: [],
      };
    }
    const rawTurn = readFileSync(turnFile, 'utf8');
    if (rawTurn.trim() === '') {
      const entry = {
        ...baseEntry,
        success: true,
        skipped_reason: 'empty_turn',
        duration_ms: Date.now() - t0,
      };
      const logPath = writeExtractLogEntry({ projectRoot, ts, entry });
      return {
        action: 'skipped',
        skipped_reason: 'empty_turn',
        observation_count: 0,
        duration_ms: entry.duration_ms,
        logPath,
        candidates: [],
      };
    }

    // 2. Sanitize: strip noise tags + extract <retain> segments
    //    (for the override). Both apply across BOTH turn bodies —
    //    <retain> in either user or assistant turn triggers the
    //    override.
    const retainSegments = extractRetainSegments(rawTurn);
    const sanitized = stripNoiseTags(rawTurn);
    const { userTurn, assistantTurn, dedupContext } = parseTurnFile(sanitized);

    // 3. Dedup context comes from the TURN FILE (Task 132) — capture-turn
    //    snapshotted the last now.md entry BEFORE appending the current
    //    turn. Re-reading now.md here would see the current turn as
    //    "already captured" and suppress every extraction (D-122).
    const instructions = buildExtractionInstructions();
    const promptBody = buildExtractionPrompt({
      userTurn,
      assistantTurn,
      dedupContext,
    });

    // 4. Call Haiku.
    //
    // Subprocess timeout: 90_000 ms (set at the compress() call below — see the
    // detailed note there). This runs in the DETACHED auto-extract child, which
    // has NO Stop-hook ceiling (the parent already returned), so the 90s value
    // is safe and correct — the timeout still guarantees the catch + finally +
    // extract.log write complete before the child exits, so a hung claude
    // --print never leaks the auto-extract.lock or skips the NDJSON log entry.
    // (Corrected 2026-07-10 (D-312): this comment previously stated a stale
    // "25,000 ms under the 30s ceiling" — wrong on both the value AND the
    // ceiling-applies premise; the accurate rationale is at the timeoutMs line.)
    // See design §8.5 for the composition rationale.
    let haikuResult;
    try {
      haikuResult = await haikuBackend.compress({
        input: promptBody,
        instructions,
        // Task 136 (D-124): 8192, was 2000. A dense turn legitimately yields
        // 3-4 rich facts (~700-900 bytes each) + terse/persona lines — the old
        // cap clipped the 3rd fact mid-word and a corrupted stub reached disk
        // (cut-gate9). The parser now also DROPS clipped trailing blocks; the
        // raised budget makes the drop rare instead of routine.
        maxOutputBytes: 8192,
        preserveCitationIds: false,
        // 90s, not 25s: the real `claude --print` extraction (full turn +
        // instructions) consistently exceeded a 25s ceiling on a live machine
        // and was KILLED mid-call (extract.log: success:false, haiku_timeout,
        // duration ≈ 25000ms = hitting the cap, not finishing) → automatic
        // capture + persona promotion (F2) silently never ran. This call is
        // DETACHED (fire-and-forget, never blocks the session), so a generous
        // ceiling is free. Live-test finding (2026-06-01, live-test-4 baseline).
        timeoutMs: 90_000,
      });
      // Touch the cooldown marker after a SUCCESSFUL Haiku call — the
      // "we spent the budget" signal compress-session.mjs reads to skip its
      // own Haiku call within 120s of ours.
      //
      // **Original behavior (pre-Task-167, preserved as decision-trail):** the
      // catch block below ALSO touched the cooldown ("spent the budget,
      // succeeded OR failed"), so a failing Haiku here blocked compress-session
      // for 120s — on the theory that a failure shouldn't let the next caller
      // re-spend the budget on the same broken call.
      // **Task 167.F change (D-207, Q5):** the cooldown now fires on SUCCESS
      // ONLY. A FAILED call did NOT successfully spend the budget — blocking the
      // next NEEDED compress for 120s after a *transient* failure is the wrong
      // gate (it was the SECONDARY cause of the 410 KB now.md bloat: after the
      // dead cron, failed-call cooldowns kept the roll skipped). Correctness >
      // cost — a transient failure must be free to retry.
      touchCooldownMarker({ projectRoot, now: ts });
      // Task 250 (Door 5): the backend call RETURNED — the strongest evidence
      // the kit has that its automatic engine works end-to-end. It clears both
      // the extraction class and the upstream CLI class, and it is the ONLY
      // thing in wave 1 that can clear `agent-cli-missing` (nothing probes for
      // the binary; the design is event-driven, D-412 point 4).
      appendHealthEntry(projectRoot, { class: HEALTH_CODES.AGENT_CLI_MISSING, outcome: 'ok' });
      appendHealthEntry(projectRoot, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'ok' });
    } catch (err) {
      // Task 167.F: do NOT touch the cooldown on failure (see the success-path
      // comment above) — a failed call must not block the next compress's retry.
      // Route on the error TYPE — distinguishes "took too long"
      // (HAIKU_TIMEOUT) from "subprocess exited non-zero"
      // (HAIKU_FAILED). Using `instanceof HaikuTimeoutError`
      // rather than `err.category === 'haiku_timeout'` because the
      // string-comparison contract is fragile: a future error class
      // that happens to set `.category` to a colliding value, or a
      // rename of the string at one end but not the other, would
      // silently misroute. The instanceof check is type-anchored.
      const category = err instanceof HaikuTimeoutError
        ? ERROR_CATEGORIES.HAIKU_TIMEOUT
        : ERROR_CATEGORIES.HAIKU_FAILED;
      // Task 250 (Door 5) — split the failure by whether it CAN recover on its
      // own, because that is exactly what the whisper's noise gate keys on
      // (D-412 point 2). A spawn ENOENT means the agent's CLI is not there: it
      // will not be there next turn either, so it whispers on the FIRST strike.
      // Everything else (a timeout, a 5xx, a rate limit) genuinely recovers and
      // must not nag on a single blip — 2 consecutive, no success between.
      // NOTE the error CATEGORY is the detail, never the message: the message
      // can carry stderr, and this log is a diagnostic, not a transcript.
      appendHealthEntry(
        projectRoot,
        isBinaryMissingError(err)
          ? { class: HEALTH_CODES.AGENT_CLI_MISSING, outcome: 'fail', detail: 'spawn-enoent' }
          : { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'fail', detail: category },
      );
      // Task 242 (D-369) — SELF-HEAL: never let a failed extraction drop the
      // turn whole. Run the deterministic LLM-free fallback so capture degrades
      // to PARTIAL, never to zero. Runs on ANY failure category (timeout,
      // failed, and any future/unrecognized one) — of 295 historical failures
      // only 166 were timeouts, so a timeout-only fallback would leave ~44%
      // still capturing nothing.
      //
      // The fallback is MISSION-CONTEXT-ONLY by construction (see
      // extract-fallback.mjs): it must never launder kit-operational noise into
      // a memory tier, which on a kit-debugging session is most of the turn.
      let fallbackCandidates = [];
      let fallbackWritten = 0;
      const fallbackRejections = [];
      try {
        fallbackCandidates = extractFallbackCandidates({ userTurn });
      } catch {
        fallbackCandidates = []; // the safety net must never break the hook
      }
      for (const candidate of fallbackCandidates) {
        try {
          // Skill-review B2: route by TRUST, exactly like the LLM path — a
          // DUMBER extractor must not get LESS scrutiny. Medium-trust fallback
          // candidates go to the review queue (the same gate `routeMedium`
          // applies to medium-trust LLM candidates), never straight into
          // MEMORY.md. Capture still survives the failure — it lands somewhere
          // recoverable and the user promotes it — which is the task's actual
          // invariant ("never zero"), not "writes to the hot index".
          //
          // NOT routeHigh either: that hardcodes `trust:'high'` +
          // `source:'auto-extract'`, which would launder a keyword heuristic as
          // a real LLM extraction (honest provenance is a done-criterion).
          const r =
            candidate.trust === 'high'
              ? memoryWrite({
                  action: 'add',
                  text: candidate.text,
                  tier: 'P',
                  scratchpad: 'MEMORY.md',
                  section: 'Active Threads',
                  source: candidate.write_source,
                  sessionId: sessionId ?? 'session',
                  trust: candidate.trust,
                  projectRoot,
                  now: ts,
                })
              : routeMedium({ candidate, projectRoot, ts });
          if (r?.action === 'appended' || r?.action === 'queued') fallbackWritten += 1;
        } catch (routeErr) {
          // One bad candidate must not sink the rest — but do NOT swallow it
          // silently (skill-review I5: every other routing path records a
          // rejection). Surface it in the same extract.log entry.
          fallbackRejections.push(routeErr?.message ?? String(routeErr));
        }
      }

      const entry = {
        ...baseEntry,
        success: false,
        error_category: category,
        duration_ms: Date.now() - t0,
        // Observability: the log must show that capture survived the failure,
        // and that it came from the heuristic path — not an LLM extraction.
        fallback_candidates: fallbackCandidates.length,
        fallback_written: fallbackWritten,
        ...(fallbackRejections.length ? { fallback_rejections: fallbackRejections } : {}),
      };
      const logPath = writeExtractLogEntry({ projectRoot, ts, entry });
      return {
        action: 'error',
        error_category: category,
        observation_count: fallbackWritten,
        duration_ms: entry.duration_ms,
        logPath,
        candidates: fallbackCandidates,
        fallbackUsed: fallbackCandidates.length > 0,
        errorMessage: err?.message ?? String(err),
      };
    }

    // 5. Parse → demote assistant-origin → apply <retain> override
    //    → dedup-within-call. Order matters: demotion runs BEFORE
    //    retain so an assistant-origin candidate inside a <retain>
    //    still force-promotes to HIGH; dedup runs last so same-id
    //    candidates collapse to the highest-trust survivor.
    let candidates = parseCandidates(haikuResult.outputText);
    candidates = applyOriginDemotion(candidates);
    candidates = applyRetainOverride(candidates, retainSegments);
    candidates = dedupByCanonicalId(candidates);

    // Task 103 — rich fact synthesis on the native-immune Stop-hook path. The
    // SAME Haiku output may carry BEGIN_FACT blocks (durable project KNOWLEDGE)
    // alongside the terse TRUST_ lines; route them to the fact store via
    // writeFact (richer + searchable). No second LLM call — same outputText.
    let clippedFactsDropped = 0;
    const richFacts = parseRichFacts(haikuResult.outputText, {
      onClipped: (n) => {
        clippedFactsDropped = n;
      },
    });
    // XOR safety net: the prompt asks Haiku to emit a fact as EITHER a rich
    // block OR a terse line, never both. If it does both for the same fact, the
    // rich block wins — drop any terse candidate whose canonical id matches a
    // rich fact's body, so it isn't ALSO written as a MEMORY.md bullet. (Keyed
    // on the rich fact's raw `body` headline vs the terse `text` — the prompt
    // enforces the semantic XOR; this catches the exact-restatement case.)
    if (richFacts.length > 0) {
      const richIds = new Set(richFacts.map((f) => generateId('P', f.body)));
      candidates = candidates.filter((c) => !richIds.has(generateId('P', c.text)));
    }

    // Task 61 — inline cross-project promotion. The SAME Haiku output may
    // carry PERSONA CANDIDATE lines (cross-project doctrine); promote them to
    // the user tier THIS run (vs the weekly auto-persona janitor). No second
    // LLM call — same outputText. Runs BEFORE the project-empty check so a
    // turn that is ONLY cross-project doctrine still promotes.
    let persona = null;
    if (userDir) {
      // Inline persona promotion is SECONDARY to project extraction — a bug in
      // the cross-project path must never take down the primary job (project
      // facts + extract.log). Isolate it: on throw, record the error on the
      // result and continue routing project candidates normally.
      try {
        const personaCandidates = parsePersonaCandidates(haikuResult.outputText);
        if (personaCandidates.length > 0) {
          // Task 78 — the wedge's AUTO half. Only confidence=high candidates
          // clear the promote gate, and (post-Task-78 grading) confidence=high
          // means the user EXPLICITLY STATED a standing rule THIS turn → it is
          // user-attested, so promote at trust:high (durable; won't be clobbered
          // by a later inferred-medium entry). Inferred (medium) candidates still
          // queue to persona-review. The weekly janitor stays at the default
          // medium (45.6) — it synthesizes from accumulated facts, not a fresh
          // statement.
          persona = promoteCandidatesToUserTier({
            candidates: personaCandidates,
            userDir,
            now: ts,
            settings,
            trust: 'high',
            source: 'user-explicit',
          });
        }
      } catch (err) {
        persona = { promoted: [], queued: [], superseded: [], conflicts: [], error: err?.message ?? String(err) };
      }
    }
    const personaLanded =
      !!persona && ((persona.promoted?.length ?? 0) + (persona.superseded?.length ?? 0)) > 0;
    // Door 4 (observability): when the inline persona pass ran, the
    // extract.log entry carries the promotion counts so a later debugger
    // can see cross-project doctrine landed in the user tier without
    // re-running the turn. Empty object when no userDir / no persona pass.
    const personaLogFields = persona
      ? {
          persona_promoted: persona.promoted?.length ?? 0,
          persona_superseded: persona.superseded?.length ?? 0,
          persona_queued: persona.queued?.length ?? 0,
          persona_conflicts: persona.conflicts?.length ?? 0,
          ...(persona.error ? { persona_error: persona.error } : {}),
        }
      : {};

    if (candidates.length === 0 && richFacts.length === 0 && !personaLanded) {
      const entry = {
        ...baseEntry,
        ...personaLogFields,
        rich_facts_written: 0,
        success: true,
        skipped_reason: 'nothing_durable',
        duration_ms: Date.now() - t0,
      };
      const logPath = writeExtractLogEntry({ projectRoot, ts, entry });
      return {
        action: 'skipped',
        skipped_reason: 'nothing_durable',
        observation_count: 0,
        duration_ms: entry.duration_ms,
        logPath,
        candidates: [],
        richFacts: [],
        persona,
      };
    }

    // 6. Route each candidate. Low-trust candidates are discarded.
    //    High-trust candidates go through memoryWrite() which may
    //    REJECT them at the Poison_Guard / schema / cap_exceeded
    //    layer — in that case the candidate is marked
    //    written:'rejected' so it doesn't count toward
    //    observation_count, and `rejected_category` carries the
    //    distinguishing error category so analytics can separate
    //    "secret leak averted" from "scratchpad full" from
    //    "validation failed".
    const writes = [];
    for (const candidate of candidates) {
      // 148.5: sensitivity routing runs BEFORE trust routing — a drop is a drop
      // at any trust, and local-only diverts high AND medium away from every
      // committed surface (MEMORY.md and the review queue alike).
      if (candidate.sensitivity === 'drop') {
        writes.push({ ...candidate, written: 'dropped-sensitivity' });
        // Door 5: observable, but NEVER with the text — the content is
        // sensitive and extract.log may be committed. Category-only entry
        // (deliberately unlike the low_trust_discarded excerpt trace).
        writeExtractLogEntry({
          projectRoot,
          ts,
          entry: {
            event: 'sensitivity_drop',
            skipped_reason: 'sensitivity_drop',
            trust: candidate.trust,
            origin: candidate.origin ?? null,
          },
        });
        continue;
      }
      if (candidate.sensitivity === 'local-only' && candidate.trust !== 'low' && candidate.trust !== 'discarded') {
        const r = routeLocalOnly({
          text: candidate.text,
          trust: candidate.trust,
          projectRoot,
          ts,
          sessionId,
        });
        const written = r?.action === 'appended' ? 'local' : 'rejected';
        const writeRecord = { ...candidate, written, result: r };
        if (written === 'rejected') {
          writeRecord.rejected_category = r?.errorCategory ?? 'unknown';
        }
        writes.push(writeRecord);
        continue;
      }
      if (candidate.trust === 'high') {
        const r = routeHigh({ candidate, projectRoot, ts, sessionId });
        const written = classifyHighTrustWrite(r);
        const writeRecord = { ...candidate, written, result: r };
        if (written === 'rejected') {
          writeRecord.rejected_category = r?.errorCategory ?? 'unknown';
        }
        writes.push(writeRecord);
      } else if (candidate.trust === 'medium') {
        const r = routeMedium({ candidate, projectRoot, ts });
        writes.push({ ...candidate, written: 'review', result: r });
      } else {
        writes.push({ ...candidate, written: 'discarded' });
        // Task 92 (G6): a LOW (or assistant-demoted-to-discarded) candidate is
        // dropped from active memory, but leave a recoverable trace — the
        // excerpt + reason — in extract.log, so a fact Haiku mis-graded LOW (or
        // an assistant-origin fact demoted to LOW) is auditable, not silently
        // vanished (the §6.5 "don't lose without trace" principle at the capture
        // edge; MEDIUM already gets a review queue, LOW got nothing). Log-only
        // by decision (92.1): NOT routed to the review queue — that would flood
        // it with low-signal noise. One discrete NDJSON entry per drop (Door 4).
        // 148.5: a sensitivity-flagged candidate that lands here (LOW/demoted)
        // must NOT leave its text in the excerpt trace — extract.log can be
        // committed. The entry stays (auditable) with the excerpt suppressed.
        const sensitiveDiscard = candidate.sensitivity && candidate.sensitivity !== 'commit';
        writeExtractLogEntry({
          projectRoot,
          ts,
          entry: {
            event: 'low_trust_discarded',
            reason: 'low_trust_discarded',
            trust: candidate.trust,
            demoted_from: candidate.demotedFrom ?? null,
            origin: candidate.origin ?? null,
            ...(sensitiveDiscard
              ? { excerpt_suppressed: 'sensitivity' }
              : {
                  excerpt: candidate.text.slice(0, LOW_DISCARD_EXCERPT_MAX),
                  excerpt_truncated: candidate.text.length > LOW_DISCARD_EXCERPT_MAX,
                }),
          },
        });
      }
    }

    // 6b. Route rich facts to the fact store (Task 103). Each writeFact is
    //     isolated in try/catch — a Poison_Guard / schema / collision rejection
    //     (or an unexpected throw) must NOT take down terse routing or the
    //     persona pass, exactly like the inline persona isolation above. A
    //     'created' counts toward observation_count; a 'skipped' (content
    //     duplicate) is a no-op success that doesn't re-count; anything else is
    //     'rejected' with its category for analytics (Door 4).
    const richWrites = [];
    for (const fact of richFacts) {
      try {
        // 148.5: sensitivity routing before the fact store — same contract as
        // the terse loop. A drop never touches disk (category-only log line);
        // local-only condenses to a private.md bullet instead of a COMMITTED
        // context/memory/ fact file.
        if (fact.sensitivity === 'drop') {
          richWrites.push({ ...fact, written: 'dropped-sensitivity' });
          writeExtractLogEntry({
            projectRoot,
            ts,
            entry: {
              event: 'sensitivity_drop',
              skipped_reason: 'sensitivity_drop',
              surface: 'rich_fact',
            },
          });
          continue;
        }
        if (fact.sensitivity === 'local-only') {
          const r = routeLocalOnly({
            text: condenseRichFactForLocal(fact),
            trust: 'medium', // same proposal-grade trust routeRichFact assigns
            projectRoot,
            ts,
            sessionId,
          });
          const written = r?.action === 'appended' ? 'local' : 'rejected';
          const rec = { ...fact, written, result: r };
          if (written === 'rejected') rec.rejected_category = r?.errorCategory ?? 'unknown';
          richWrites.push(rec);
          continue;
        }
        const r = routeRichFact({ candidate: fact, projectRoot, ts });
        let written;
        if (r?.action === 'created') written = 'fact';
        else if (r?.action === 'skipped') written = 'fact-duplicate';
        else written = 'rejected';
        const rec = { ...fact, written, result: r };
        if (written === 'rejected') {
          rec.rejected_category = r?.errorCategory ?? 'unknown';
          // Trace the drop (§6.5 don't-lose-without-trace), mirroring the terse
          // low-discard trace — a rejected rich fact is otherwise invisible once
          // the detached process exits. TITLE ONLY, never the body: a
          // poison_guard rejection means the body may carry a secret (the
          // redacted excerpt is already in poison-guard.log). One NDJSON entry
          // per rejection (Door 4).
          writeExtractLogEntry({
            projectRoot,
            ts,
            entry: {
              event: 'rich_fact_rejected',
              reason: 'rich_fact_rejected',
              rejected_category: rec.rejected_category,
              title: fact.title.slice(0, LOW_DISCARD_EXCERPT_MAX),
            },
          });
        }
        richWrites.push(rec);
      } catch (err) {
        richWrites.push({
          ...fact,
          written: 'rejected',
          rejected_category: 'exception',
          error: err?.message ?? String(err),
        });
      }
    }
    const richFactsWritten = richWrites.filter(
      (w) => w.written === 'fact' || w.written === 'local',
    ).length;

    const observation_count =
      writes.filter(
        (w) =>
          w.written === 'memory' ||
          w.written === 'review' ||
          w.written === 'conflict' ||
          // 148.5: a local-only landing IS a durable observation — just gitignored.
          w.written === 'local',
      ).length + richFactsWritten;

    // Persona-only turn: no project candidate landed, but cross-project
    // doctrine promoted to the user tier this run. That IS a durable
    // extraction — fall through to the 'extracted' return (observation_count
    // stays 0; `persona` carries the user-tier result + Door 4 log fields).
    if (observation_count === 0 && !personaLanded) {
      const entry = {
        ...baseEntry,
        ...personaLogFields,
        rich_facts_written: richFactsWritten,
        success: true,
        skipped_reason: 'nothing_durable',
        duration_ms: Date.now() - t0,
      };
      const logPath = writeExtractLogEntry({ projectRoot, ts, entry });
      return {
        action: 'skipped',
        skipped_reason: 'nothing_durable',
        observation_count: 0,
        duration_ms: entry.duration_ms,
        logPath,
        candidates: writes,
        richFacts: richWrites,
        persona,
      };
    }

    const entry = {
      ...baseEntry,
      ...personaLogFields,
      rich_facts_written: richFactsWritten,
      // Task 136: only present when the output cap clipped a trailing fact —
      // the signal to consider raising the budget further.
      ...(clippedFactsDropped > 0 ? { clipped_facts_dropped: clippedFactsDropped } : {}),
      success: true,
      observation_count,
      duration_ms: Date.now() - t0,
    };
    const logPath = writeExtractLogEntry({ projectRoot, ts, entry });
    return {
      action: 'extracted',
      observation_count,
      duration_ms: entry.duration_ms,
      logPath,
      candidates: writes,
      richFacts: richWrites,
      persona,
    };
  } finally {
    // Cleanup order: turn-file FIRST (frees disk), lock LAST (releases
    // the mutex so a subsequent invocation can start). Both swallow
    // errors — the lock release is best-effort because EEXIST on Windows
    // can transiently fire if the watcher hasn't released the handle;
    // the turn-file cleanup is best-effort because (a) the missing_turn
    // path means it's already absent, (b) Windows can refuse unlink if
    // a virus scanner has the file briefly open. The next Stop hook
    // overwrites the path, so a leaked turn-file is harmless beyond
    // disk noise.
    if (existsSync(turnFile)) {
      try {
        unlinkSync(turnFile);
      } catch {
        // ignored — see comment above
      }
    }
    releaseLock(lockPath);
  }
}
