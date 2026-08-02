// fact-store.mjs — the ONE walk over the granular fact archive (Task 241 / D-368).
//
// WHY THIS MODULE EXISTS. A measured clone audit over all 125 `src/*.mjs`
// modules found the fact-store walk reimplemented in **14 places**: four
// byte-identical listers under two names (`listLiveFactFiles` / `listFactFiles`),
// a 14-line walk-parse-skip clone across `temporal-sweep` ↔ `validity-window`
// differing only in its final predicate, and inline `readdir` loops everywhere
// else. Meanwhile `tier-paths.mjs` already exported `resolveFactDir` — the
// natural home was there the whole time.
//
// (D-368's scan reported NINE, because it keyed on the literal
// `entry.name === 'INDEX.md'`. Five more spelled the same walk differently:
// `decisions-journal` / `digest` / `memory-health` / `import-claude-md` iterate
// `readdirSync(dir)` as plain strings, and `doctor`'s HC-4 writes
// `n !== 'INDEX.md'`. A grep for one spelling of an idiom measures the spelling,
// not the idiom — D-385.)
//
// The risk that created is concrete, not stylistic: a NEW skip rule (another
// sidecar filename, a tombstone convention, a `judgment_*` exclusion) had to be
// remembered in fourteen places. That exact drift already produced a bug once — the
// Layer-2 review found INDEX.md unfiltered in one writer's dedup scan while
// every other walker excluded it (see `write-fact.mjs`'s M2 note). This module
// is the shared home the CLAUDE.md shared-modules table prescribes for the
// class, alongside tier-paths / frontmatter / audit-log / result-shapes.
//
// THE SPLIT. Callers supply ONLY their predicate:
//   listMarkdownFiles(dir, {exclude}) — the primitive; any .md collection
//   listFactFiles(factDir)            — fact files, INDEX.md excluded
//   tiersFor({projectRoot, userDir})  — which tiers a walk covers
//   eachFactIn(factDir, ctx)          — parsed facts in ONE dir
//   eachFact({projectRoot, userDir})  — parsed facts across the tiers
//   eachLiveFact({...})               — the above, minus tombstoned facts
//
// `eachLiveFact` is deliberately NOT the only door: `trust` and `write-fact`
// must see tombstoned facts (trust overrides apply to them; the dedup scan must
// find them to avoid re-issuing an id), so they take `eachFactIn`. Encoding
// "live" as a separate generator keeps that difference visible instead of
// hiding it behind an options flag nobody reads.
//
// WHAT DELIBERATELY DID NOT MIGRATE (checked + rejected — a scanner cannot see
// these contracts, so they are recorded here rather than re-proposed each sweep):
//   · `judgment.mjs::readJudgments` — walks the SAME directory for a DIFFERENT
//     collection (`judgment_*.md`). It requires only a parseable frontmatter
//     OBJECT, not an `id`, so `eachFactIn` would silently drop judgment files
//     that legitimately have none.
//   · `lazy-compress.mjs` — an existence PROBE (`.some(name => …)`) that
//     short-circuits on the first matching dirent with no stat and no parse, as
//     its own comment states. `listFactFiles` materializes and sorts the whole
//     directory, so migrating it would be a deliberate perf regression.
//   · `forget.mjs::scrubAllScratchpads` — walks the TIER ROOT for scratchpads.
//     It takes `listMarkdownFiles` (the primitive) with its own exclusion set,
//     which is the honest relationship: shared mechanics, separate collection.
//   · `import-claude-md.mjs` — takes the LISTER only. Its dedup set is
//     deliberately permissive and indexes id-less fact files too.
//   · `redact.mjs::countRemainingElsewhere` — walks the fact dir RECURSIVELY
//     (into `archive/tombstones/`, `archive/superseded/`) and INTENTIONALLY does
//     not skip `INDEX.md`: it counts residual pattern occurrences everywhere, so
//     excluding the index would under-report a leak.
//   · sessions / transcripts / tombstones / locks / queues walks — different
//     collections that merely share the `.md` suffix.
//
// ONE TRADE WORTH NAMING. The five string-form walks previously used a bare
// `readdirSync(dir)` with a suffix filter and NO `isFile()` check; they now get
// one. That is the intended fix (a directory named `x.md` was readable as a
// fact) — but it is a trade, not a free win: `Dirent.isFile()` is a pure `d_type`
// check with no stat fallback, so on a filesystem that reports `DT_UNKNOWN`
// (some FUSE mounts, XFS without `ftype=1`) it is false for EVERY entry and
// those sites would see zero facts. Not reachable on Windows, ext4, btrfs or
// APFS, and the other nine sites already carried this exposure — recorded so the
// next reader knows it was weighed rather than missed.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolveTierRoot, resolveFactDir } from './tier-paths.mjs';
import { parse } from './frontmatter.mjs';
import { compareCodeUnits } from './audit-log.mjs';

// Task 8's pointer index — a GENERATED file that lives beside the facts it
// lists. Every fact walk must skip it or it re-enters as a pseudo-fact.
export const INDEX_FILENAME = 'INDEX.md';

// Task 254's Obsidian vault map — a SECOND generated sidecar that lives beside
// the facts (rendered by vault-map.mjs, written by reindex.mjs). It has no `id`
// frontmatter, so eachFactIn already drops it — but reindex's lister-based walk
// would otherwise warn "missing frontmatter" for it, so it joins INDEX.md in the
// default exclude. redact/forget pass their OWN exclude sets and are unaffected
// (redact deliberately scans everything, incl. the map, for residual leaks).
export const MAP_FILENAME = 'MAP.md';

/**
 * List the `.md` files directly inside `dir`, excluding generated/non-fact
 * names. Missing dir → `[]` (every caller treated a missing fact dir as empty).
 *
 * Sorted with the explicit code-unit comparator (sonar S2871): `reindex` already
 * required it because these filenames order a COMMITTED INDEX.md, where
 * locale-dependent collation would make one corpus produce different diffs on
 * different machines. Sorting ALL walks costs nothing and removes a dependency
 * on `readdirSync` order, which is unspecified across platforms.
 *
 * @param {string} dir
 * @param {object} [opts]
 * @param {string[]} [opts.exclude=[INDEX_FILENAME, MAP_FILENAME]] filenames to skip
 * @returns {string[]} filenames (not paths), sorted
 */
export function listMarkdownFiles(dir, { exclude = [INDEX_FILENAME, MAP_FILENAME] } = {}) {
  if (!existsSync(dir)) return [];
  const skip = new Set(exclude);
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.md')) continue;
    if (skip.has(entry.name)) continue;
    out.push(entry.name);
  }
  return out.sort(compareCodeUnits);
}

/** The fact-file lister: `<tier>/memory/*.md` (or `U/fragments/*.md`), no INDEX.md. */
export function listFactFiles(factDir) {
  return listMarkdownFiles(factDir);
}

/**
 * Which tiers a fact walk covers: P + L always (both live under projectRoot),
 * U only when a userDir is supplied. A library-level `homedir()` reach here
 * would make any test that omits userDir touch the REAL user tier (the D-69
 * class), so the absence of userDir means "don't walk U" — never "guess it".
 */
export function tiersFor({ projectRoot, userDir }) {
  const tiers = [];
  if (projectRoot) tiers.push('P', 'L');
  if (userDir) tiers.push('U');
  return tiers;
}

/**
 * Yield every parsed fact in ONE fact dir.
 *
 * Skips silently on: unreadable file, unparseable frontmatter, or missing `id`.
 * That matches what all 6 inline walks did — a corrupt neighbour is never one
 * caller's problem to report. A caller that needs to COUNT or WARN about
 * malformed input (reindex warns; expiry-sweep counts malformed `expires_at`)
 * keeps that in its own predicate, where the message can be specific.
 *
 * Note the dropped `statSync(p).isFile()` re-check several callers ran: the
 * loop already `continue`s on `!entry.isFile()`, so a dirent that reached the
 * stat could only be a regular file. It was dead code, not a guard.
 *
 * @param {string} factDir
 * @param {object} [ctx] extra fields merged into each yielded fact (tier, tierRoot)
 * @yields {{id, filename, path, factDir, frontmatter, body}}
 */
export function* eachFactIn(factDir, ctx = {}) {
  for (const filename of listFactFiles(factDir)) {
    const path = join(factDir, filename);
    let frontmatter;
    let body;
    try {
      ({ frontmatter, body } = parse(readFileSync(path, 'utf8')));
    } catch {
      continue;
    }
    if (!frontmatter?.id) continue;
    yield {
      ...ctx,
      id: frontmatter.id,
      filename,
      path,
      factDir,
      frontmatter,
      body: body ?? '',
    };
  }
}

/**
 * Yield every parsed fact across the tiers, tombstoned ones INCLUDED.
 * Each yielded fact carries `tier` + `tierRoot` on top of `eachFactIn`'s fields.
 *
 * @param {object} opts
 * @param {string} [opts.projectRoot]
 * @param {string} [opts.userDir]
 * @param {string[]} [opts.tiers] explicit tier list (defaults to `tiersFor`)
 */
export function* eachFact({ projectRoot, userDir, tiers } = {}) {
  for (const tier of tiers ?? tiersFor({ projectRoot, userDir })) {
    const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
    const factDir = resolveFactDir(tier, tierRoot);
    if (!existsSync(factDir)) continue;
    yield* eachFactIn(factDir, { tier, tierRoot });
  }
}

/** `eachFact`, minus tombstoned facts — the shape most callers want. */
export function* eachLiveFact(opts = {}) {
  for (const fact of eachFact(opts)) {
    if (fact.frontmatter.deleted_at) continue;
    yield fact;
  }
}

/** Where a superseded fact is MOVED to, relative to its tier's fact dir. */
export const SUPERSEDED_SUBDIR = ['archive', 'superseded'];

/**
 * Yield every SUPERSEDED fact — the ones the kit moved out of the top-level
 * walk into `<factDir>/archive/superseded/<id>.md` when a successor replaced
 * them (write-fact's supersession path).
 *
 * A separate generator rather than a flag on `eachFact` for the same reason
 * `eachLiveFact` is separate: these facts are deliberately NOT in the live
 * corpus (they are not indexed, they do not answer searches), and a caller that
 * wants them is asking a different question — "how did this get here?" — not a
 * broader version of "what do we know?". Making that visible in the call keeps
 * a future contributor from folding history into a recall path by accident.
 *
 * Two readers today: `graph-index`'s supersession edges (the chain's backward
 * pointers live only here) and Task 255's viewer, whose graph must draw the
 * predecessor and whose fact page must open it.
 */
export function* eachSupersededFact({ projectRoot, userDir, tiers } = {}) {
  for (const tier of tiers ?? tiersFor({ projectRoot, userDir })) {
    const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
    const dir = join(resolveFactDir(tier, tierRoot), ...SUPERSEDED_SUBDIR);
    if (!existsSync(dir)) continue;
    yield* eachFactIn(dir, { tier, tierRoot, superseded: true });
  }
}
