// Rich-fact body + slug shaping — the single source of truth for HOW a rich
// fact's file body and filename slug are built (Task 103).
//
// Extracted from subcommands.mjs so the TWO rich-capture paths build identical
// fact files (the shared-modules / no-drift rule, CLAUDE.md §1.3):
//   1. explicit  — `cmk remember --why/--how` → runRememberRich (subcommands.mjs)
//   2. automatic — the Stop-hook auto-extract synthesizing rich facts on the
//                  native-immune path (auto-extract.mjs, Task 103)
// Both call writeFact() with a body produced here, so an auto-extracted fact
// reads the same as an explicitly-captured one.

/**
 * Build a slug for a rich fact's filename from its title.
 *
 * Collapse every run of non-alphanumerics to a single '-' (so dashes are never
 * doubled), cap at 60 chars, then trim a leading/trailing dash without a regex
 * quantifier (static analysis flags trailing `-+$` as ReDoS-prone; a single
 * dash is all that can remain after the collapse, so string ops suffice).
 *
 * @param {string} s - the source text (typically the fact title).
 * @returns {string} a `[a-z0-9][a-z0-9_-]*`-safe slug, or 'fact' if empty.
 */
export function slugifyFact(s) {
  let base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  if (base.startsWith('-')) base = base.slice(1);
  if (base.endsWith('-')) base = base.slice(0, -1);
  return base || 'fact';
}

/**
 * Assemble the rich fact body in the v0.1.1 shape: headline + Why + How.
 * The headline/body may itself be multi-line markdown (a structured breakdown);
 * Why/How are appended as labelled blocks only when present.
 *
 * @param {object} opts
 * @param {string} opts.text - the headline / body (may be multi-line markdown).
 * @param {string} [opts.why] - the rationale → `**Why:**` block.
 * @param {string} [opts.how] - how to apply → `**How to apply:**` block.
 * @returns {string} the assembled markdown body for writeFact().
 */
export function buildRichFactBody({ text, why, how }) {
  const parts = [String(text).trim()];
  if (why && String(why).trim()) parts.push(`**Why:** ${String(why).trim()}`);
  if (how && String(how).trim()) parts.push(`**How to apply:** ${String(how).trim()}`);
  return parts.join('\n\n');
}

// The inverse of buildRichFactBody. It lives HERE, beside the writer, because
// the two are one contract: change the label and both move together. Task 255's
// fact-detail view is the first reader that needs the parts back out.
//
// MARKER regexes only — no content capture. The old shape captured the block
// body with a lazy `[\s\S]*?` bounded by a lookahead, which re-scans the tail
// at every position: polynomial backtracking on a body an LLM wrote (the
// Sonar super-linear flag, and it was right). The markers alone are anchored
// and unambiguous (linear); the CONTENT is sliced between marker positions in
// plain code below, which cannot backtrack at all.
const WHY_MARKER_RE = /(?:^|\n)[ \t]*\*\*Why:\*\*[ \t]*/;
const HOW_MARKER_RE = /(?:^|\n)[ \t]*\*\*How to apply:\*\*[ \t]*/;

// Where a marker's block STARTS (after the marker) and where the marker line
// itself begins (for headline slicing) — or null when absent.
function findMarker(text, re) {
  const m = re.exec(text);
  if (!m) return null;
  const lineStart = m.index + (m[0].startsWith('\n') ? 1 : 0);
  return { lineStart, contentStart: m.index + m[0].length };
}

/**
 * Split a fact body back into its headline + Why + How parts.
 *
 * A body that carries neither block (the terse capture path, an imported fact,
 * a scratchpad bullet) returns the whole text as `headline` with both blocks
 * null — the common case, and never an error: a plain fact is not malformed.
 *
 * @param {string} body
 * @returns {{headline: string, why: string|null, how: string|null}}
 */
export function parseRichFactBody(body) {
  const text = typeof body === 'string' ? body : '';
  const why = findMarker(text, WHY_MARKER_RE);
  const how = findMarker(text, HOW_MARKER_RE);
  // Each block runs from its marker to the OTHER block's line (when the other
  // block comes later) or to the end — the same bounds the old lookaheads
  // expressed, now as two comparisons.
  const whyEnd = how && why && how.lineStart > why.lineStart ? how.lineStart : text.length;
  const howEnd = why && how && why.lineStart > how.lineStart ? why.lineStart : text.length;
  const firstLineStart = Math.min(why?.lineStart ?? Infinity, how?.lineStart ?? Infinity);
  return {
    headline: (Number.isFinite(firstLineStart) ? text.slice(0, firstLineStart) : text).trim(),
    why: why ? text.slice(why.contentStart, whyEnd).trim() || null : null,
    how: how ? text.slice(how.contentStart, howEnd).trim() || null : null,
  };
}
