// Canonical frontmatter serializer/parser. Single js-yaml-backed pair that
// every kit module uses to read and write per-fact frontmatter + scratchpad
// HTML-comment provenance (Layer 3+ will join).
//
// Per the Layer-2 review's I2 finding, the previous code had THREE different
// naive parsers across four modules (split-on-first-colon read; verbatim
// stringify write). Output and input weren't symmetric: booleans round-tripped
// as strings, arrays didn't round-trip at all, strings with `:` truncated on
// read. js-yaml fixes all of these AND lifts the B2 minimum-fix restriction
// that PR-1 added — values with `\n` / `\r` / `:` are now quoted properly.
//
// Public surface:
//   parse(text) → {frontmatter, body, parseError?}
//     - text: full file contents (with or without `---` markers)
//     - a single leading UTF-8 BOM is stripped before anything else, and is
//       never re-exposed on ANY return branch (see the BOM note below)
//     - returns frontmatter as a typed object (string/number/bool/array/etc.)
//     - returns body as the markdown after the closing `---\n` (or empty)
//     - if no frontmatter block: frontmatter is null, body is the full text
//     - if YAML parse fails: frontmatter is null, parseError carries the message
//
//   format({frontmatter, body}) → text
//     - frontmatter: typed object; key order preserved per insertion
//     - body: markdown; written verbatim after the closing `---\n`
//     - if frontmatter is null/empty: just returns body
//     - output NEVER starts with a BOM (see the BOM note below)
//
// ── BOM tolerance (Task 257 / D-403) ────────────────────────────────────────
// Windows editors and `Set-Content -Encoding utf8` on Windows PowerShell 5.1
// prepend a UTF-8 BOM (U+FEFF / EF BB BF). The `^---` anchor below does not
// match through one, so a hand-edited fact file parsed as "no frontmatter" and
// was then dropped by reindex, recall, INDEX/MAP, the edge builder and every
// fact walk — the fact silently ceased to exist while sitting untouched in the
// tier. Same class as D-126 (the CRLF blindness this regex already tolerates),
// same class as D-306/D-187 (the config-read BOM). Found by Task 248's live
// test; deliberately fixed HERE, at the ONE shared parser, rather than at each
// of the 20 call sites.
//
// Two invariants make the fix total rather than partial:
//   1. `parse` strips BEFORE the match and uses the stripped text on EVERY
//      branch, so no caller can receive a BOM back and re-persist it — not via
//      `body` on the no-frontmatter branch, not via the parseError branches.
//   2. `format` never emits a leading BOM. Together with (1) this means a
//      BOM'd file HEALS on its next legitimate rewrite (trust override, redact,
//      merge, supersede): parse drops it, format doesn't re-add it.
// The strip delegates to read-json.mjs's `stripBom` — the ONE canonical BOM
// helper — so the kit has a single BOM policy: exactly ONE leading BOM. A
// doubled BOM is not a shape any real producer emits, and quietly swallowing an
// arbitrary run of them would diverge from every other BOM site in the kit.
//
// Id/hash stability: canonicalize() is ALREADY BOM-insensitive on the Node side
// (JS `\s` includes U+FEFF per ECMA-262 WhiteSpace, so the whitespace-collapse
// + trim stages absorb a leading BOM), so a BOM'd fact and its clean twin derive
// the SAME id and dedupe against each other. That is pinned by test, not
// assumed. Content sha1s deliberately stay over the RAW file bytes — adding or
// removing a BOM IS a file change and must invalidate a change-detection key.
//
// js-yaml schema: CORE_SCHEMA (no implicit timestamp/Date conversion;
// ISO strings stay as strings). Output uses flowLevel: 1 — top-level
// mapping is block style; nested arrays render as `[a, b]` (matches the
// pre-refactor visual format).

import yaml from 'js-yaml';
import { stripBom } from './read-json.mjs';

const DUMP_OPTIONS = Object.freeze({
  schema: yaml.CORE_SCHEMA,
  flowLevel: 1,
  lineWidth: -1, // no line wrapping
  noRefs: true, // never emit YAML anchors / refs
  sortKeys: false, // preserve insertion order
});

const LOAD_OPTIONS = Object.freeze({
  schema: yaml.CORE_SCHEMA,
});

export function parse(text) {
  if (typeof text !== 'string') return { frontmatter: null, body: '' };
  // Task 257 (D-403): strip a leading BOM BEFORE the match, and use `src` — not
  // `text` — on every branch below, so the BOM is never handed back to a caller
  // that would re-persist it. No-op for the 99.9% of files that lack one, so
  // non-BOM output is byte-identical to pre-257.
  const src = stripBom(text);
  // Task 139 (D-126): \r? tolerance — a Windows clone with autocrlf=true
  // rewrites committed memory files to CRLF, and a strict-\n boundary made
  // every fact file invisible (cut-gate9 H1: clone reindex found 0 facts).
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { frontmatter: null, body: src };
  let frontmatter;
  try {
    frontmatter = yaml.load(m[1], LOAD_OPTIONS);
  } catch (e) {
    return { frontmatter: null, body: src, parseError: e.message };
  }
  if (frontmatter === undefined || frontmatter === null) {
    return { frontmatter: null, body: m[2] ?? '' };
  }
  if (typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    return {
      frontmatter: null,
      body: src,
      parseError: 'frontmatter is not a mapping',
    };
  }
  return { frontmatter, body: m[2] ?? '' };
}

export function format({ frontmatter, body }) {
  // Task 257: the never-emit-a-BOM invariant is TOTAL, not merely "parse never
  // hands one back" — a caller that constructs a body itself must not be able
  // to write a file the kit's own parser would have to tolerate. Identity for
  // any body without a leading BOM.
  const text = typeof body === 'string' ? stripBom(body) : (body ?? '');
  if (!frontmatter || (typeof frontmatter === 'object' && Object.keys(frontmatter).length === 0)) {
    return text;
  }
  const yamlBody = yaml.dump(frontmatter, DUMP_OPTIONS);
  return `---\n${yamlBody}---\n${text}`;
}
