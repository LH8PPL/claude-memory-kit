// deletion-propagation.mjs — the Task 210 cascade check + forward-path filter
// (D-308; the Always-On survey arXiv 2606.30306's least-implemented invariant:
// "deletion is a cascade through the derivation graph, not a single operation").
//
// Public boundary:
//   checkDeletionPropagation({projectRoot, maxFacts?})
//     → { checked, vacuous, survivals: [{id, surface, path, needle}] }
//     Report-first: for each TOMBSTONED fact, verify the retraction cascaded
//     out of every derived surface — the SQLite/FTS index, recent.md,
//     archive.md, today-*.md (+ banked .distilled.md artifacts). A survival is
//     FLAGGED with its exact location; the scrub itself routes to Task 96's
//     `cmk redact` (a summary line) or a re-distill — this module never edits.
//     `vacuous: true` when there were no tombstones to verify (the survey's
//     AOEP negative-invariant: a no-memory system must not read as "verified").
//
//   screenTombstonedContent(text, {projectRoot, maxFacts?, facts?})
//     → { text, dropped: [{id, needle}], truncated }
//     The FORWARD path: SPAN-REPLACE an already-tombstoned fact's content or
//     citation id with `[deleted]` before a freshly-distilled summary is
//     banked — a new summary never re-includes deleted content, closing the
//     window going forward even before old summaries are cleaned. Span-level
//     (not whole-line): a distilled bullet routinely consolidates MULTIPLE
//     facts, so dropping the line would take live facts + their citations with
//     it (skill-review Blocking). `truncated` mirrors the check's honesty when
//     the tombstone set exceeds maxFacts. Pass a pre-read `facts` to avoid
//     re-reading the archive on every call.
//
// Scope notes (deliberate):
//   - P tier only: the derived surfaces (index, sessions/ summaries) are
//     project-scoped; U/L facts never reach them.
//   - Tombstones only: consolidate()'s hard-dropped L/M bullets leave no
//     tombstone to check against — that is lifecycle-map G2 (Task 91.2),
//     not this check's blind spot to paper over.
//   - Needles are the tombstone's DISTINCTIVE content lines (≥ MIN_NEEDLE
//     chars, whitespace-normalized) — short/boilerplate lines would flag
//     false survivals on every summary.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseFrontmatter } from './frontmatter.mjs';
// Regex-escape a literal needle so it can be matched case-insensitively with
// flexible whitespace (needles are whitespace-normalized; the raw line isn't).
import { escapeRegExp } from './sanitize.mjs';
import { openIndexDb } from './index-db.mjs';
import { archiveIdFromFileName } from './fact-store.mjs';

const SESSIONS_REL = ['context', 'sessions'];
const TOMBSTONES_REL = ['context', 'memory', 'archive', 'tombstones'];

// A needle shorter than this is too generic to prove a survival.
const MIN_NEEDLE = 24;
// Bound the walk (ADR-0020 posture: bounded units per run, never the whole
// corpus unbounded) — 200 tombstones × a handful of needles × a few files is
// still cheap file IO; a store beyond that reports the bound honestly.
const DEFAULT_MAX_FACTS = 200;

const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

// A `[redacted: reason date]` marker (Task 96) normalizes to ≥24 chars but is
// BOILERPLATE — a batch compliance scrub gives many facts the identical marker,
// so using it as a needle false-drops every summary line sharing it. Strip
// markers before measuring/using a line as a needle (skill-review Important #3).
const REDACT_MARKER = /\[redacted:[^\]]*\]/g;
const stripMarkers = (s) => s.replace(REDACT_MARKER, '').replace(/\s+/g, ' ').trim();

/** Read tombstoned facts → [{id, needles:[string]}], bounded. */
function readTombstones({ projectRoot, maxFacts }) {
  const dir = join(projectRoot, ...TOMBSTONES_REL);
  if (!existsSync(dir)) return { facts: [], truncated: false };
  let names;
  try {
    names = readdirSync(dir).filter((n) => n.endsWith('.md'));
  } catch {
    return { facts: [], truncated: false };
  }
  const truncated = names.length > maxFacts;
  const facts = [];
  for (const name of names.slice(0, maxFacts)) {
    try {
      const raw = readFileSync(join(dir, name), 'utf8');
      const { frontmatter, body } = parseFrontmatter(raw);
      // Task 281: the basename fallback decodes through the shared helper, so
      // an escaped name (`_a`) yields the real id rather than a mangled one.
      const id = frontmatter?.id ?? archiveIdFromFileName(name) ?? name.replace(/\.md$/, '');
      const needles = [];
      const title = typeof frontmatter?.title === 'string' ? frontmatter.title : '';
      // strip redact markers before measuring: a marker-only title/line is
      // boilerplate, not distinctive content, and must not become a needle.
      const titleNeedle = stripMarkers(normalize(title));
      if (titleNeedle.length >= MIN_NEEDLE) needles.push(titleNeedle);
      for (const line of (body ?? '').split('\n')) {
        const n = stripMarkers(normalize(line.replace(/^[-*]\s+/, '')));
        // skip label-only rich-fact scaffolding; keep content lines
        if (n.length >= MIN_NEEDLE && !n.startsWith('**why:**') && !n.startsWith('**how')) {
          needles.push(n);
        }
      }
      facts.push({ id, needles });
    } catch {
      /* unreadable tombstone — skip; HC-4/reindex own file integrity */
    }
  }
  return { facts, truncated };
}

/**
 * The DERIVED summary files to scan: recent.md, archive.md, and the banked
 * per-day `.distilled.md` artifacts. Deliberately EXCLUDES the raw
 * `today-YYYY-MM-DD.md` session buffers (skill-review Important #5): those are
 * the SOURCE tier, not a derived surface — daily-distill never rewrites them
 * and `cmk redact` never reaches `sessions/`, so flagging one would be an
 * unfixable FAIL. The raw buffer's content is transient (it rolls into a
 * distilled artifact, then is pruned); a tombstoned fact there ages out via
 * the roll, it doesn't need a scrub.
 */
function listSummaryFiles(projectRoot) {
  const dir = join(projectRoot, ...SESSIONS_REL);
  if (!existsSync(dir)) return [];
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter(
      (n) =>
        n === 'recent.md' ||
        n === 'archive.md' ||
        (n.startsWith('today-') && n.endsWith('.distilled.md')),
    )
    .map((n) => join(dir, n));
}

export function checkDeletionPropagation({ projectRoot, maxFacts = DEFAULT_MAX_FACTS } = {}) {
  const { facts, truncated } = readTombstones({ projectRoot, maxFacts });
  if (facts.length === 0) {
    return { checked: 0, vacuous: true, truncated: false, survivals: [] };
  }

  const survivals = [];

  // Surface 1 — the SQLite/FTS index: a tombstoned fact must have NO row
  // (forget's in-band reindex owns this half of the cascade, Task 110).
  try {
    const db = openIndexDb({ projectRoot });
    try {
      const stmt = db.prepare('SELECT COUNT(*) AS n FROM observations WHERE id = ?');
      for (const f of facts) {
        if (stmt.get(f.id).n > 0) {
          survivals.push({ id: f.id, surface: 'index', path: 'context/.index (observations row)', needle: null });
        }
      }
    } finally {
      db.close();
    }
  } catch {
    /* no index DB yet — nothing derived to survive in */
  }

  // Surface 2 — the distilled summaries: content-match each tombstone's
  // needles (and its bare id — distill preserves citation ids, which makes
  // the id-match precise where content is fuzzy).
  for (const path of listSummaryFiles(projectRoot)) {
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    const norm = normalize(text);
    for (const f of facts) {
      if (text.includes(f.id)) {
        survivals.push({ id: f.id, surface: 'summary', path, needle: f.id });
        continue;
      }
      const hit = f.needles.find((n) => norm.includes(n));
      if (hit) survivals.push({ id: f.id, surface: 'summary', path, needle: hit });
    }
  }

  return { checked: facts.length, vacuous: false, truncated, survivals };
}

// Read the tombstone facts once — for a caller (daily-distill) that screens
// many day-files in one run and shouldn't re-read the archive each time (M2).
export function readTombstoneFacts({ projectRoot, maxFacts = DEFAULT_MAX_FACTS } = {}) {
  return readTombstones({ projectRoot, maxFacts });
}

export function screenTombstonedContent(
  text,
  { projectRoot, maxFacts = DEFAULT_MAX_FACTS, facts: preread, truncated: pretrunc } = {},
) {
  const { facts, truncated } =
    preread !== undefined
      ? { facts: preread, truncated: pretrunc ?? false }
      : readTombstones({ projectRoot, maxFacts });
  if (facts.length === 0 || !text) return { text, dropped: [], truncated };

  // SPAN-replace (not whole-line drop): a distilled bullet often consolidates
  // several facts, so dropping the line would take live facts + their
  // citations with it (skill-review Blocking). Replace only the tombstoned
  // span — the surrounding live content + citation ids survive, mirroring
  // Task 96 redact's scrub-the-span-keep-the-record posture.
  const dropped = [];
  const outLines = text.split('\n').map((line) => {
    let out = line;
    for (const f of facts) {
      // citation id first (exact), then each content needle (case-insensitive)
      if (out.includes(f.id)) {
        out = out.split(f.id).join('[deleted]');
        dropped.push({ id: f.id, needle: f.id });
      }
      for (const n of f.needles) {
        if (!normalize(out).includes(n)) continue;
        // map the normalized-match back to the raw line case-insensitively
        // (needles are whitespace-normalized; the raw line may have runs/casing).
        // Fresh regex per replace — no shared lastIndex state.
        const re = new RegExp(escapeRegExp(n).replace(/ /g, '\\s+'), 'gi');
        const replaced = out.replace(re, '[deleted]');
        if (replaced !== out) {
          out = replaced;
          dropped.push({ id: f.id, needle: n });
        }
      }
    }
    return out;
  });
  if (dropped.length === 0) return { text, dropped, truncated };
  return { text: outLines.join('\n'), dropped, truncated };
}

