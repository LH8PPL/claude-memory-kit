// The append-only decision journal — context/DECISIONS.md (Task 147, D-161).
//
// A chronological, human-readable page of every decision + its why. The VIEW
// the kit was missing: decisions are captured as facts but scattered across N
// per-fact files with no chronological decision page (cmk search is pull, not
// browse; MEMORY.md is bounded + rolls). This is the squad `decisions.md` /
// our own DECISION-LOG.md equivalent, made automatic.
//
// LIFECYCLE — APPEND-ONLY, never regenerated, never parked (D-161):
//   - This is NOT a derived view like INDEX.md. Regenerating from live facts
//     would silently ERASE superseded/forgotten decisions — rewriting history
//     to look like the current state was always obvious (the exact failure the
//     decision-trail-preservation rule exists to prevent).
//   - A decision journal is unbounded by design: old decisions are the MOST
//     valuable part (they explain why the codebase is shaped as it is), so the
//     MEMORY.md rolling-window must NOT apply.
//   - Mechanics: new decision → appended; tombstoned → its entry MARKED
//     retracted IN PLACE (never removed); every pre-existing entry survives
//     every update.
//
// The update is triggered like a derived view (runs where reindex runs, so the
// journal stays current) but its WRITE LOGIC is append-only — the file is the
// accumulator, the facts are only the trigger. Each entry carries a stable
// machine marker `<!-- decision:P-XXXXXXXX -->` so the updater knows which ids
// are already journaled + which entries to annotate, without parsing prose
// (and so a human can freely add their own prose between entries — preserved).
//
// v0.3.2 scope: explicit signals only (capture appends; forget marks retracted;
// explicit supersession annotates). AUTOMATIC semantic contradiction-detection
// is deferred to F-D / Task 95.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eachFactIn } from './fact-store.mjs';
import { ID_PATTERN } from './tier-paths.mjs';
import { trimTrailingNewlines } from './managed-block.mjs';

export const DECISIONS_HEADER =
  '# Decisions\n\n' +
  '> Append-only decision journal — every decision the kit captured, in order, with its why.\n' +
  '> Maintained by core-memory-kit (`cmk digest`). Superseded/retracted entries stay (the trail is the point).';

// Only this fact type is a "decision" in the kit taxonomy (the project/state
// category — what project-memory's decisions.md and our DECISION-LOG track).
const DECISION_TYPE = 'project';

const markerFor = (id) => `<!-- decision:${id} -->`;
const RETRACT_TAG = '_(retracted';

/** The yyyy-mm-dd slice of an ISO timestamp, or the raw value if unparseable. */
function dateOnly(iso) {
  if (typeof iso !== 'string') return 'unknown-date';
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : iso;
}

/**
 * Render ONE journal entry for a decision fact. The machine marker lets the
 * updater dedup + annotate; the human-readable lines are Title / date / Why / id.
 *
 * @param {{id:string,title:string,createdAt?:string,why?:string|null}} f
 * @returns {string} the entry block (no trailing newline)
 */
export function buildDecisionEntry(f) {
  const date = dateOnly(f.createdAt);
  // Blank lines around the `###` heading so the committed journal is lint-clean
  // markdown (markdownlint MD022 "blanks-around-headings"). The HTML marker, the
  // heading, and the When/Why block are each separated by a blank line — the
  // generated memory passes a strict linter by construction, not by exemption.
  const lines = [
    markerFor(f.id),
    '',
    `## ${f.title}`,
    '',
    `**When:** ${date} · **Fact:** \`${f.id}\``,
  ];
  if (f.why && String(f.why).trim()) {
    lines.push(`**Why:** ${String(f.why).trim()}`);
  }
  return lines.join('\n');
}

// The kit's id matcher, DERIVED from the canonical ID_PATTERN (tier-paths.mjs)
// so the base32 alphabet lives in exactly ONE place and can't drift. The
// original bug: this module hardcoded `[A-Z2-9]` (uppercase only), but the real
// alphabet includes a lowercase `a` — so any id containing `a` never matched
// "already journaled" → re-appended on EVERY digest run (the cut-gate find).
// Strip the `^…$` anchors to embed the pattern inside larger regexes.
const ID_CHARS = ID_PATTERN.source.replace(/^\^/, '').replace(/\$$/, '');

/** ids already present in the journal body (by their machine marker). */
function journaledIds(content) {
  const ids = new Set();
  const re = new RegExp(`<!-- decision:(${ID_CHARS}) -->`, 'g');
  let m;
  while ((m = re.exec(content)) !== null) ids.add(m[1]);
  return ids;
}

/**
 * Append-only journal update (D-161). Pure: content in → content out.
 *
 * @param {object} a
 * @param {string}   a.existingContent  current DECISIONS.md (‘’ if absent)
 * @param {Array}    a.facts            live decision-class facts ({id,type,title,createdAt,why})
 * @param {Set<string>} a.tombstonedIds ids whose fact has been forgotten
 * @param {string}   a.now             ISO timestamp for retraction stamps
 * @returns {string} the new DECISIONS.md content
 */
export function updateDecisionsJournal({ existingContent = '', facts = [], tombstonedIds = new Set(), now }) {
  let content = existingContent.trim() === '' ? DECISIONS_HEADER + '\n' : existingContent;
  const already = journaledIds(content);

  // 1) Append entries for decision-class facts not yet journaled.
  const newEntries = [];
  for (const f of facts) {
    if (f.type !== DECISION_TYPE) continue; // only decisions
    if (already.has(f.id)) continue; // already journaled — never duplicate
    newEntries.push(buildDecisionEntry(f));
    already.add(f.id);
  }
  if (newEntries.length > 0) {
    if (!content.endsWith('\n')) content += '\n';
    content += '\n' + newEntries.join('\n\n') + '\n';
  }

  // 2) Mark retracted (in place) any journaled entry whose fact is now
  //    tombstoned and not already marked. Never removes the entry.
  const stamp = dateOnly(now);
  for (const id of tombstonedIds) {
    const marker = markerFor(id);
    const idx = content.indexOf(marker);
    if (idx === -1) continue; // not journaled — nothing to retract
    // Bound the search to THIS entry's span — up to the next decision marker
    // (or end-of-file). Prevents a malformed/hand-edited entry with no heading
    // from attaching the retraction note to the NEXT entry's heading.
    const nextMarker = content.indexOf('<!-- decision:', idx + marker.length);
    const spanEnd = nextMarker === -1 ? content.length : nextMarker;
    // Find this entry's heading line (the `## …` after the marker, within span).
    // Anchor on a line-start `## ` (newline-prefixed) so body text containing
    // `##` can't be mistaken for the heading. buildDecisionEntry emits the
    // heading on its own line right after the marker + a blank line.
    const headingNl = content.indexOf('\n## ', idx);
    const headingStart = headingNl === -1 ? -1 : headingNl + 1;
    if (headingStart === -1 || headingStart >= spanEnd) continue;
    const headingEnd = content.indexOf('\n', headingStart);
    if (headingEnd === -1) continue;
    // Already retracted? (the note sits right after the heading)
    const afterHeading = content.slice(headingEnd + 1, headingEnd + 1 + RETRACT_TAG.length);
    if (afterHeading === RETRACT_TAG) continue;
    const note = `${RETRACT_TAG} ${stamp})_`;
    content = content.slice(0, headingEnd + 1) + note + '\n' + content.slice(headingEnd + 1);
  }

  if (!content.endsWith('\n')) content += '\n';
  return content;
}

/**
 * Migrate an OLD-format journal (pre-Task-164.1: `### title` headings with no
 * blank lines around them) to the lint-clean shape buildDecisionEntry now emits
 * (`## title` with a blank line above + below). Append-only-safe: every entry +
 * its content is preserved; only the heading level + surrounding blank lines
 * change. Idempotent (already-clean content returns unchanged) and CRLF-tolerant
 * (re-emits `\n`). Line-based (no backtracking regex — the ReDoS-safe discipline).
 *
 * The retraction tag (`_(retracted …)_`) sits on the line directly under the
 * heading; it stays there (the blank-below goes AFTER the tag, matching the
 * updateDecisionsJournal inserter).
 *
 * @param {string} content the DECISIONS.md content
 * @returns {string} the normalized content (idempotent)
 */
export function normalizeDecisionsJournal(content) {
  if (typeof content !== 'string' || content === '') return content;
  const lines = content.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    // A decision entry begins with the machine marker. Normalize the heading
    // that follows it (skipping any blank lines already present).
    if (/^<!-- decision:/.test(line)) {
      out.push(line);
      // ensure exactly one blank line after the marker
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j += 1; // skip existing blanks
      out.push('');
      // the heading line (### or ## title) — demote ### -> ##
      if (j < lines.length && /^#{2,3}\s/.test(lines[j])) {
        const headingText = lines[j].replace(/^#{2,3}\s+/, '');
        out.push(`## ${headingText}`);
        let k = j + 1;
        // an optional retraction tag stays directly under the heading
        if (k < lines.length && lines[k].trim().startsWith('_(retracted')) {
          out.push(lines[k]);
          k += 1;
        }
        // ensure exactly one blank line below the heading (or heading+tag)
        while (k < lines.length && lines[k].trim() === '') k += 1; // collapse existing blanks
        out.push('');
        i = k - 1; // continue after the blank we just normalized
      } else {
        // malformed entry (marker with no heading) — leave the rest as-is
        i = j - 1;
      }
      continue;
    }
    out.push(line);
  }
  // collapse any accidental >1 trailing blank, keep a single trailing newline
  let result = out.join('\n');
  result = trimTrailingNewlines(result) + '\n';
  return result;
}

// --- The READER (Task 255) ------------------------------------------------
//
// The journal has exactly one FORMAT, so it gets exactly one PARSER. This
// module is where the format is written (buildDecisionEntry above), so it is
// where reading it belongs — the shared-module discipline applied to a shape
// that had already been re-derived once: `search.mjs`'s `--scope decisions`
// backend grew its own marker-splitter, and the viewer's `/api/decisions` would
// have been the third copy of the same seven subtle rules (line-start-only
// markers, strip-the-plumbing-before-matching, the retraction tag sits on the
// line UNDER the heading and only there). Both consumers now take this one.
//
// Deliberately kept as SPANS over the raw text rather than a re-render: the
// journal is append-only and hand-editable (§the D-161 contract — a human may
// write prose between entries), so a parser that reconstructs entries would
// quietly drop whatever it did not model. Every entry carries its raw `block`.

/** Entry-boundary marker. Intentionally looser than ID_PATTERN — it matches
 *  what the WRITER emits, so a legacy/hand-edited id still forms a boundary
 *  rather than silently merging two entries into one. */
const ENTRY_MARKER_RE = /<!--\s*decision:([PUL]-[^\s]+)\s*-->/g;
const MARKER_STRIP_RE = /<!--\s*decision:[PUL]-[^\s]+\s*-->/g;
const WHEN_RE = /\*\*When:\*\*\s*([^\s·]+)/;
const FACT_RE = /\*\*Fact:\*\*\s*`([^`]+)`/;
const WHY_LINE_RE = /(?:^|\n)[ \t]*\*\*Why:\*\*[ \t]*([^\n]+)/;

/**
 * Parse `DECISIONS.md` into its ordered entries. Pure; journal order (oldest
 * first) is preserved because the journal IS the chronology.
 *
 * @param {string} content
 * @returns {Array<{id,title,when,factId,why,retracted,sourceLine,block,cleaned}>}
 */
export function parseDecisionsJournal(content) {
  if (typeof content !== 'string' || content === '') return [];

  // A marker is a boundary ONLY at line start: a marker QUOTED inside a Why or
  // a body (a meta-decision about the journal format, or one entry citing
  // another's marker) must not false-split the entry.
  const markers = [];
  let m;
  ENTRY_MARKER_RE.lastIndex = 0;
  while ((m = ENTRY_MARKER_RE.exec(content)) !== null) {
    if (m.index === 0 || content[m.index - 1] === '\n') {
      markers.push({ id: m[1], start: m.index });
    }
  }

  const entries = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].start;
    const end = i + 1 < markers.length ? markers[i + 1].start : content.length;
    const block = content.slice(start, end);
    // Strip the PLUMBING before anything reads the entry as prose: the marker
    // comment (whose literal text contains "decision", which otherwise matches
    // every search for that word) and the heading hashes.
    const cleaned = block.replace(MARKER_STRIP_RE, '').replace(/^#{1,6}\s+/gm, '');

    // The heading is a line-start `## ` (the block opens with the marker, so
    // the heading is never at block offset 0 — match `\n## `).
    const headingNl = block.indexOf('\n## ');
    let title = null;
    let retracted = false;
    if (headingNl !== -1) {
      const lineEnd = block.indexOf('\n', headingNl + 1);
      title = block.slice(headingNl + 4, lineEnd === -1 ? block.length : lineEnd).trim();
      // The retraction tag sits on its OWN line directly under the heading (the
      // updateDecisionsJournal inserter's contract) — scoping the check there is
      // what stops an entry whose Why merely MENTIONS "_(retracted" from being
      // mislabeled.
      const afterHeading = lineEnd === -1 ? '' : block.slice(lineEnd + 1);
      retracted = afterHeading.startsWith(RETRACT_TAG);
    }

    const whenMatch = WHEN_RE.exec(block);
    const factMatch = FACT_RE.exec(block);
    const whyMatch = WHY_LINE_RE.exec(block);
    entries.push({
      id: markers[i].id,
      title,
      when: whenMatch ? whenMatch[1] : null,
      factId: factMatch ? factMatch[1] : markers[i].id,
      why: whyMatch ? whyMatch[1].trim() : null,
      retracted,
      // 1-based line of the marker — the drill-back into DECISIONS.md.
      sourceLine: content.slice(0, start).split('\n').length,
      block,
      cleaned,
    });
  }
  return entries;
}

/** `parseDecisionsJournal` over the project's journal file. Missing file → [] —
 *  a project that has captured no decisions yet is empty, not broken. */
export function readDecisionsJournal(projectRoot) {
  const file = join(projectRoot, 'context', 'DECISIONS.md');
  if (!existsSync(file)) return [];
  return parseDecisionsJournal(readFileSync(file, 'utf8'));
}

// --- File-IO orchestration (the impure shell over the pure core) ----------

// Leading indent is [ \t]* (NOT \s*) so it can't match the newline the
// (?:^|\n) anchor already consumed — that overlap is the backtracking
// ambiguity SonarCloud flags as ReDoS. Disjoint character classes = linear.
const RICH_WHY_RE = /(?:^|\n)[ \t]*\*\*Why:\*\*[ \t]*([^\n]+)/;

/** Read decision-class facts (type:project) from the project tier. */
function readProjectDecisionFacts(projectRoot) {
  const dir = join(projectRoot, 'context', 'memory');
  const out = [];
  // The shared fact walk (Task 241) — it already skips unreadable/unparseable
  // files and INDEX.md, the class this loop used to handle with its own
  // try/catch (reindex/HC-4 own reporting that; the journal just skips).
  for (const { id, frontmatter, body } of eachFactIn(dir)) {
    if (frontmatter.type !== DECISION_TYPE) continue;
    if (frontmatter.deleted_at) continue;
    const whyMatch = body.match(RICH_WHY_RE);
    out.push({
      id,
      type: frontmatter.type,
      title: frontmatter.title ?? id,
      createdAt: frontmatter.created_at ?? null,
      why: whyMatch ? whyMatch[1].trim() : null,
    });
  }
  // Stable chronological order (oldest first) so appends read like a timeline.
  out.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  return out;
}

/** ids of forgotten facts (tombstone archive). */
function readTombstonedIds(projectRoot) {
  const ids = new Set();
  const dir = join(projectRoot, 'context', 'memory', 'archive', 'tombstones');
  if (!existsSync(dir)) return ids;
  for (const name of readdirSync(dir)) {
    const m = name.match(new RegExp(`^(${ID_CHARS})\\.md$`));
    if (m) ids.add(m[1]);
  }
  return ids;
}

/**
 * Read → append-only update → write context/DECISIONS.md. Idempotent: a run
 * with nothing new is a no-op write (same bytes). Best-effort: never throws
 * into the caller (a journal failure must not break a capture/read path).
 *
 * @returns {{written:boolean, path:string, appended:number}|{written:false,error:string}}
 */
export function syncDecisionsJournal({ projectRoot, now } = {}) {
  try {
    const path = join(projectRoot, 'context', 'DECISIONS.md');
    const existingContent = existsSync(path) ? readFileSync(path, 'utf8') : '';
    const facts = readProjectDecisionFacts(projectRoot);
    const tombstonedIds = readTombstonedIds(projectRoot);
    const before = existingContent;
    const next = updateDecisionsJournal({
      existingContent,
      facts,
      tombstonedIds,
      now: now ?? new Date().toISOString(),
    });
    if (next !== before) {
      writeFileSync(path, next, 'utf8');
      return { written: true, path, appended: next.length - before.length };
    }
    return { written: false, path, appended: 0 };
  } catch (err) {
    return { written: false, error: err?.message ?? String(err) };
  }
}
