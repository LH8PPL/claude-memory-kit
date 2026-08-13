// redact.mjs — the Task 96 compliance scrub (ADR-0022, D-62/D-218).
//
// Public boundary:
//   redactFact({id, pattern, reason?, projectRoot, userDir?, now?})
//     → { action:'redacted', id, occurrences, files, renamed, remainingElsewhere, reindexed }
//       (renamed: {from,to} when a title-borne secret forced a filename
//        rename — see step 1b — else null)
//     | error / not-found result
//   purgeHard({id, yes, projectRoot, userDir?, now?})
//     → { action:'purged', id, removed, scratchpadEdits, reindexed }
//     | error / not-found result
//   gitAdvisory({paths}) → string[]  — the honest ADR-0022 advisory lines the
//     CLI prints after either operation (rotate-first + the exact path-scoped
//     `git filter-repo` command). The kit NEVER executes it.
//
// The ADR-0022 layering:
//   - The kit owns the APP layer completely: the fact file wherever it lives
//     (live / archive/tombstones / archive/superseded), the dual-written
//     scratchpad bullet (span-replaced in place), the INDEX.md + search index
//     (in-band reindex, the forget/D-85 pattern: the action completes with no
//     manual follow-up command).
//   - GIT HISTORY is never touched. A secret that reached history is
//     compromised regardless (clones/forks/CI caches) — rotation is the real
//     remediation; the advisory says so and hands the human the filter-repo
//     command as a documented one-time team operation (SECURITY.md runbook).
//   - `purge --hard` is the ONLY irreversible verb: CLI-only, explicit
//     `yes` required, NEVER an MCP tool (the §6.5 separate-destructive-path
//     contract — pinned by cli-redact.test.js).
//
// PATTERN IS A LITERAL, not a regex: the input is an untrusted secret string;
// treating it as a regex invites ReDoS + accidental mis-scope. Occurrences are
// replaced via split/join (exact bytes).

import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, renameSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { ID_PATTERN, SCRATCHPADS_BY_TIER, resolveTierRoot, resolveFactDir } from './tier-paths.mjs';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import { ERROR_CATEGORIES, errorResult, notFoundResult } from './result-shapes.mjs';
import { resolveFact } from './forget.mjs';
import { parse as parseFrontmatter, format as formatFrontmatter } from './frontmatter.mjs';
import { slugifyFact } from './rich-fact.mjs';
import { openIndexDb } from './index-db.mjs';
import { reindexBoot } from './index-rebuild.mjs';
import { reindex } from './reindex.mjs';
import { archiveVerifiedPaths } from './fact-store.mjs';

// Per-tier scratchpad list, derived from the canonical SCRATCHPADS_BY_TIER
// (shared-modules rule). A hand-rolled union here missed the L-tier pads —
// including context.local/private.md, exactly where the sensitivity screen
// routes secret-adjacent facts (skill-review B1).
const scratchpadsForTier = (tier) => [...(SCRATCHPADS_BY_TIER[tier] ?? [])];

function redactionMarker(reason, date) {
  return `[redacted: ${reason} ${date.slice(0, 10)}]`;
}

function replaceAllLiteral(text, pattern, replacement) {
  const count = text.split(pattern).length - 1;
  return { text: text.split(pattern).join(replacement), count };
}

// Count literal occurrences of `pattern` across a tier's fact store +
// scratchpads + the decision journal, excluding the given absolute paths (the
// just-scrubbed FACT FILE only — scratchpads and the journal are always
// scanned post-edit, so their non-bullet/other-entry occurrences are counted;
// excluding an edited scratchpad wholesale silently hid its stray lines,
// skill-review I7). Read-only — per-fact scope is explicit, never silent.
function countRemainingElsewhere({ tierRoot, tier, factDir, pattern, excludePaths }) {
  const exclude = new Set(excludePaths.map((p) => p.toLowerCase()));
  let remaining = 0;
  const scan = (p) => {
    if (exclude.has(p.toLowerCase())) return;
    try {
      remaining += readFileSync(p, 'utf8').split(pattern).length - 1;
    } catch {
      /* unreadable — skip */
    }
  };
  const walkDir = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walkDir(p);
      else if (entry.name.endsWith('.md')) scan(p);
    }
  };
  walkDir(factDir);
  for (const name of scratchpadsForTier(tier)) scan(join(tierRoot, name));
  if (tier === 'P') scan(join(tierRoot, 'DECISIONS.md'));
  return remaining;
}

// Scrub the pattern from any scratchpad line carrying the fact's id — the
// dual-written bullet. The LINE survives (redact ≠ delete); only the span is
// replaced. Over-mutation-safe: lines without the id are never touched even
// if they contain the pattern (per-fact scope; countRemainingElsewhere
// surfaces those honestly instead).
function scrubScratchpadBullets({ tierRoot, tier, id, pattern, marker }) {
  const edits = [];
  for (const name of scratchpadsForTier(tier)) {
    const p = join(tierRoot, name);
    if (!existsSync(p)) continue;
    const lines = readFileSync(p, 'utf8').split('\n');
    let changed = 0;
    const next = lines.map((line) => {
      if (!line.includes(`(${id})`) || !line.includes(pattern)) return line;
      const r = replaceAllLiteral(line, pattern, marker);
      changed += r.count;
      return r.text;
    });
    if (changed > 0) {
      writeFileSync(p, next.join('\n'), 'utf8');
      edits.push({ path: p, occurrences: changed });
    }
  }
  return edits;
}

// The committed decision journal (context/DECISIONS.md) dual-writes every
// project fact's TITLE + WHY (decisions-journal.mjs) — a scrub that skips it
// leaves the secret in a git-committed file while reporting clean
// (skill-review B2). Span-scrub THIS fact's entry in place, bounded to its
// `<!-- decision:<id> -->` marker span (the retract-marking precedent: the
// journal is append-only against DELETION, not against redaction).
function scrubJournalEntry({ tierRoot, tier, id, pattern, marker }) {
  if (tier !== 'P') return null;
  const p = join(tierRoot, 'DECISIONS.md');
  if (!existsSync(p)) return null;
  const content = readFileSync(p, 'utf8');
  const entryMarker = `<!-- decision:${id} -->`;
  const idx = content.indexOf(entryMarker);
  if (idx === -1) return null; // not journaled
  const nextMarker = content.indexOf('<!-- decision:', idx + entryMarker.length);
  const spanEnd = nextMarker === -1 ? content.length : nextMarker;
  const r = replaceAllLiteral(content.slice(idx, spanEnd), pattern, marker);
  if (r.count === 0) return null;
  writeFileSync(p, content.slice(0, idx) + r.text + content.slice(spanEnd), 'utf8');
  return { path: p, occurrences: r.count };
}

// purge --hard removes the whole journal entry (compliance trumps the
// append-only habit for the one irreversible verb — the entry TEXT is the
// fact's title/Why, exactly what purge exists to erase).
function removeJournalEntry({ tierRoot, tier, id }) {
  if (tier !== 'P') return null;
  const p = join(tierRoot, 'DECISIONS.md');
  if (!existsSync(p)) return null;
  const content = readFileSync(p, 'utf8');
  const entryMarker = `<!-- decision:${id} -->`;
  const idx = content.indexOf(entryMarker);
  if (idx === -1) return null;
  const nextMarker = content.indexOf('<!-- decision:', idx + entryMarker.length);
  const spanEnd = nextMarker === -1 ? content.length : nextMarker;
  writeFileSync(p, (content.slice(0, idx) + content.slice(spanEnd)).replace(/\n{3,}/g, '\n\n'), 'utf8');
  return p;
}

// Scrub string values across audit.log NDJSON — JSON-AWARE (skill-review I6):
// a pattern containing `"` or `\` exists in the raw bytes only in ESCAPED
// form, so a byte-literal replace both misses it and can corrupt structure.
// Parse each line, replace inside string values (deep), re-stringify; an
// unparseable line gets the byte-replace fallback (scrubbed-but-odd beats
// leaked). Best-effort against the lock-free appendFileSync writers (I5):
// after writing, re-read — if a concurrent append landed mid-rewrite, re-run
// the scrub on the grown content (bounded), so no appended entry is lost.
function scrubAuditLog(tierRoot, replacements) {
  const p = join(tierRoot, '.locks', 'audit.log');
  const applyToLine = (line) => {
    if (!line.trim()) return line;
    try {
      const deep = (v) => {
        if (typeof v === 'string') {
          let out = v;
          for (const { find, replace } of replacements) out = out.split(find).join(replace);
          return out;
        }
        if (Array.isArray(v)) return v.map(deep);
        if (v && typeof v === 'object') {
          return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, deep(val)]));
        }
        return v;
      };
      return JSON.stringify(deep(JSON.parse(line)));
    } catch {
      let out = line;
      for (const { find, replace } of replacements) out = out.split(find).join(replace);
      return out;
    }
  };
  try {
    if (!existsSync(p)) return;
    for (let attempt = 0; attempt < 3; attempt++) {
      const log = readFileSync(p, 'utf8');
      const next = log.split('\n').map(applyToLine).join('\n');
      if (next === log) return; // nothing (left) to scrub
      writeFileSync(p, next, 'utf8');
      if (readFileSync(p, 'utf8') === next) return; // no concurrent append raced us
    }
  } catch {
    /* best-effort — a locked/absent log never blocks the file scrub */
  }
}

// In-band index refresh — the forget/D-85 pattern verbatim: INDEX.md rebuild
// (best-effort) + a boot reindex so `cmk search` stops surfacing the secret
// immediately, no manual follow-up. Both are best-effort: the files are
// already scrubbed on disk, and every index reader lazy-heals.
function refreshIndexes({ tier, projectRoot, userDir }) {
  try {
    reindex({ tier, projectRoot, userDir, warn: () => {} });
  } catch {
    /* best-effort */
  }
  let reindexed = false;
  if (projectRoot) {
    try {
      const db = openIndexDb({ projectRoot });
      try {
        reindexBoot({ projectRoot, userDir, db });
        reindexed = true;
      } finally {
        db.close();
      }
    } catch {
      /* best-effort — lazy reindex self-heals */
    }
  }
  return reindexed;
}

export function redactFact({ id, pattern, reason, projectRoot, userDir, now } = {}) {
  const errors = [];
  if (!id || !ID_PATTERN.test(id)) errors.push('id: required, a [PUL]-XXXXXXXX fact id');
  if (!pattern || typeof pattern !== 'string' || !pattern.trim()) {
    errors.push('pattern: required, the literal secret/PII text to scrub');
  }
  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    errors.push('reason: must be a string');
  }
  if (typeof reason === 'string' && /[\r\n]/.test(reason)) {
    // the marker lands inside SINGLE-LINE scratchpad bullets — a newline in
    // it would split a bullet from its provenance comment (skill-review M9)
    errors.push('reason: must be a single line');
  }
  if (errors.length > 0) return errorResult({ category: ERROR_CATEGORIES.SCHEMA, errors });

  const fact = resolveFact({ id, projectRoot, userDir });
  if (fact.state === 'not-found') {
    return notFoundResult({ errors: [`no fact found for id ${id} (live, tombstoned, or superseded)`] });
  }

  const ts = now ?? nowIso();
  const marker = redactionMarker(reason ?? 'compliance', ts);
  const tier = id[0];
  const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
  const factDir = resolveFactDir(tier, tierRoot);

  // 1. The fact file itself — wherever resolveFact found it. FRONTMATTER-AWARE
  //    (a live bug this task's own tests caught): the marker text contains
  //    `[` + `:` — replacing raw bytes inside an unquoted YAML value (e.g. a
  //    title carrying the secret) produces INVALID YAML and the fact becomes
  //    unresolvable. Parse → replace in string fields + body → re-serialize
  //    (js-yaml quotes the marker properly). Raw-replace only as the fallback
  //    for an already-unparseable file (better scrubbed-but-odd than leaked).
  const files = [];
  let occurrences = 0;
  const raw = readFileSync(fact.path, 'utf8');
  let nextContent = null;
  let fileCount = 0;
  let scrubbedTitle = null; // non-null ⇔ the TITLE carried the pattern
  let originalTitle = null;
  let fmType = null;
  try {
    const { frontmatter, body } = parseFrontmatter(raw);
    if (!frontmatter) throw new Error('no frontmatter');
    const fm = { ...frontmatter };
    fmType = typeof fm.type === 'string' ? fm.type : null;
    for (const [k, v] of Object.entries(fm)) {
      if (typeof v === 'string' && v.includes(pattern)) {
        const r = replaceAllLiteral(v, pattern, marker);
        fm[k] = r.text;
        fileCount += r.count;
        if (k === 'title') {
          originalTitle = v;
          scrubbedTitle = r.text;
        }
      }
    }
    const bodyReplaced = replaceAllLiteral(body ?? '', pattern, marker);
    fileCount += bodyReplaced.count;
    if (fileCount > 0) nextContent = formatFrontmatter({ frontmatter: fm, body: bodyReplaced.text });
  } catch {
    const replaced = replaceAllLiteral(raw, pattern, marker);
    fileCount = replaced.count;
    if (fileCount > 0) nextContent = replaced.text;
  }
  if (fileCount > 0) {
    writeFileSync(fact.path, nextContent, 'utf8');
    files.push(fact.path);
    occurrences += fileCount;
  }

  // 1b. FILENAME scrub (live-test finding, 2026-07-16): the filename is
  //     derived from the TITLE (writeFact: `${type}_${slugifyFact(title)}.md`),
  //     so a title-borne secret leaks into the COMMITTED path itself — INDEX
  //     links, search `source_file`, and the audit path echo all repeat it
  //     even after the body scrub. When the title changed on a LIVE fact,
  //     rename to the scrubbed title's slug. Archive copies (tombstones /
  //     superseded) are id-named — resolveFact depends on that; never renamed.
  let finalPath = fact.path;
  let renamed = null;
  let renameSkipped = false;
  if (scrubbedTitle !== null && fact.state === 'live') {
    const typePrefix = fmType ?? basename(fact.path).split('_')[0] ?? 'project';
    const currentBase = basename(fact.path);
    const slugFragment = slugifyFact(pattern);
    // Rename ONLY when the filename is actually contaminated — a clean
    // filename (custom slug, or the secret truncated out of the 60-char cap)
    // must not churn just because the title changed:
    //   (a) the basename carries the secret's slug form directly, OR
    //   (b) the basename is writeFact-canonical for the LEAKED title (covers
    //       a secret the slug cap truncated mid-token, where (a) misses).
    const contaminated =
      (slugFragment.length >= 6 && slugFragment !== 'fact' && currentBase.includes(slugFragment)) ||
      currentBase === `${typePrefix}_${slugifyFact(originalTitle)}.md`;
    let target = join(dirname(fact.path), `${typePrefix}_${slugifyFact(scrubbedTitle)}.md`);
    if (contaminated && target !== fact.path) {
      if (existsSync(target)) {
        // slug collision — suffix with the id's random part (unique per fact)
        target = target.replace(/\.md$/, `-${id.slice(2).toLowerCase()}.md`);
      }
      if (!existsSync(target)) {
        renameSync(fact.path, target);
        renamed = { from: fact.path, to: target };
        finalPath = target;
        files[files.indexOf(fact.path)] = target;
      } else {
        // both candidate names taken — never clobber; surface, don't silence
        renameSkipped = true;
      }
    } else if (contaminated) {
      renameSkipped = true; // contaminated but target === current (degenerate)
    }
  }

  // 1c. Audit-log residuals: entries never carry the pattern itself (see step
  //     3), but a PATH echo (the original created-entry's `paths.after`) can
  //     carry the slugified secret. JSON-aware scrub of both forms BEFORE
  //     appending the redact entry. Erasure beats the append-only habit here:
  //     compliance is exactly the case where the trail itself must stop
  //     repeating the secret.
  {
    const slugForm = slugifyFact(pattern);
    scrubAuditLog(tierRoot, [
      { find: pattern, replace: '[redacted]' },
      ...(slugForm.length >= 6 && slugForm !== 'fact'
        ? [{ find: slugForm, replace: '[redacted]' }]
        : []),
    ]);
  }

  // 1d. The committed decision journal's dual-written entry (title + Why).
  const journalEdit = scrubJournalEntry({ tierRoot, tier, id, pattern, marker });
  if (journalEdit) {
    occurrences += journalEdit.occurrences;
    files.push(journalEdit.path);
  }

  // 2. The dual-written scratchpad bullet(s), span-replaced in place.
  const scratchpadEdits = scrubScratchpadBullets({ tierRoot, tier, id, pattern, marker });
  occurrences += scratchpadEdits.reduce((n, e) => n + e.occurrences, 0);
  files.push(...scratchpadEdits.map((e) => e.path));

  // 3. Audit — the entry NEVER carries the secret (Poison_Guard posture: the
  //    pattern is identified by length only; the marker text is safe).
  appendAuditEntry(tierRoot, {
    ts,
    action: 'redacted',
    tier,
    id,
    reasonCode: REASON_CODES.USER_REQUESTED,
    reasonText: `redacted ${occurrences} occurrence(s) of a ${pattern.length}-char pattern (${reason ?? 'compliance'})${renamed ? ' + renamed the fact file (title-borne slug)' : ''}`,
    // never `before` — on a rename the old path IS the secret-slug leak the
    // 1c scrub just erased from this very log.
    paths: { after: finalPath },
    extra: { occurrences, files: files.length, state: fact.state, renamed: renamed !== null },
  });

  // 4. Indexes — in-band, no manual follow-up (INDEX.md hooks + FTS rows are
  //    derived from the now-scrubbed files).
  const reindexed = refreshIndexes({ tier, projectRoot, userDir });

  // 5. Honest per-fact scope: report (never scrub) occurrences elsewhere.
  //    Exclude only the FACT FILE — edited scratchpads/journal are re-scanned
  //    so their stray (non-bullet, other-entry) occurrences are reported.
  const remainingElsewhere = countRemainingElsewhere({
    tierRoot,
    tier,
    factDir,
    pattern,
    excludePaths: [finalPath],
  });

  return { action: 'redacted', id, occurrences, files, renamed, renameSkipped, remainingElsewhere, reindexed };
}

export function purgeHard({ id, yes, projectRoot, userDir, now } = {}) {
  if (!id || !ID_PATTERN.test(id)) {
    return errorResult({ category: ERROR_CATEGORIES.SCHEMA, errors: ['id: required, a [PUL]-XXXXXXXX fact id'] });
  }
  if (yes !== true) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: ['purge --hard is IRREVERSIBLE — pass --yes to confirm (there is no recovery, not even a tombstone)'],
    });
  }

  const fact = resolveFact({ id, projectRoot, userDir });
  if (fact.state === 'not-found') {
    return notFoundResult({ errors: [`no fact found for id ${id} (live, tombstoned, or superseded)`] });
  }

  const ts = now ?? nowIso();
  const tier = id[0];
  const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
  const factDir = resolveFactDir(tier, tierRoot);

  // Remove the resolved file + any OTHER archive copy under the same id (a
  // purge means gone from every app-layer location, not just the first hit).
  // Task 281: BOTH spellings of each archive name — the derived one written
  // since the fix and the legacy raw-id one in older corpora. A purge that knew
  // only one spelling would leave the other copy on disk, which is exactly the
  // "gone from every app-layer location" contract failing.
  //
  // `archiveVerifiedPaths`, NOT the raw candidate list: on a case-insensitive
  // filesystem a legacy candidate for THIS id can resolve to the file of its
  // case-pair twin, and purge is irreversible with no tombstone — an unverified
  // unlink here destroyed a fact the user never asked to purge. The helper
  // returns only files whose own frontmatter carries this id.
  const candidates = [
    fact.path,
    ...archiveVerifiedPaths(join(factDir, 'archive', 'tombstones'), id),
    ...archiveVerifiedPaths(join(factDir, 'archive', 'superseded'), id),
  ];
  const removed = [];
  for (const p of candidates) {
    if (existsSync(p)) {
      unlinkSync(p);
      removed.push(p);
    }
  }

  // Remove (not redact — purge is whole-fact) any scratchpad bullet lines
  // carrying the id. Other lines untouched.
  const scratchpadEdits = [];
  for (const name of scratchpadsForTier(tier)) {
    const p = join(tierRoot, name);
    if (!existsSync(p)) continue;
    const lines = readFileSync(p, 'utf8').split('\n');
    // Drop the bullet AND its provenance comment line (the line immediately
    // after, when it is the `<!-- source: … -->` companion).
    const keep = [];
    let removedHere = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`(${id})`)) {
        removedHere++;
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('<!--')) i++;
        continue;
      }
      keep.push(lines[i]);
    }
    if (removedHere > 0) {
      writeFileSync(p, keep.join('\n'), 'utf8');
      scratchpadEdits.push({ path: p, removed: removedHere });
    }
  }

  // The committed decision journal's entry for this fact — the entry TEXT is
  // the fact's title/Why, exactly what purge exists to erase (skill-review B2).
  const journalRemoved = removeJournalEntry({ tierRoot, tier, id });

  // Audit-log path echoes (skill-review B3): purge has no pattern, but it DOES
  // know the removed filenames — and a secret-titled fact's FILENAME carries
  // the secret's slug (the redact 1b class). Scrub every removed path + its
  // basename from historical entries before appending the purge entry.
  scrubAuditLog(
    tierRoot,
    removed.flatMap((p) => [
      { find: p, replace: '[purged]' },
      { find: basename(p), replace: '[purged]' },
    ]),
  );

  appendAuditEntry(tierRoot, {
    ts,
    action: 'purged',
    tier,
    id,
    reasonCode: REASON_CODES.USER_REQUESTED,
    reasonText: 'purge --hard: irreversible whole-fact delete (explicit human confirmation)',
    // never the removed path — the FILENAME may carry a secret's slug, and
    // purge can't scrub it later. The id identifies the fact.
    paths: { after: null },
    extra: {
      removed: removed.length,
      scratchpadEdits: scratchpadEdits.length,
      journalRemoved: journalRemoved !== null,
      state: fact.state,
    },
  });

  const reindexed = refreshIndexes({ tier, projectRoot, userDir });

  return { action: 'purged', id, removed, scratchpadEdits, journalRemoved, reindexed };
}

// The ADR-0022 advisory the CLI prints after redact/purge on the COMMITTED
// tier. The kit NEVER executes any of it. Two modes (skill-review I4 — the
// old single advisory printed `--path "context/" --invert-paths`, which
// erases the ENTIRE memory tier's history, not the leaked span):
//   redact → the fact SURVIVES, so history remediation is span-level:
//            --replace-text (the SECURITY.md two-step recipe).
//   purge  → the file is GONE, so a path-scoped --invert-paths on exactly
//            the removed file(s) is the matching history operation.
export function gitAdvisory({ mode = 'redact', paths = [] } = {}) {
  const lines = [
    'git history note (ADR-0022): the scrub covered the kit\'s live store and archives —',
    'GIT HISTORY still contains the original text in old commits.',
    '  1. ROTATE the secret first — history copies (clones, forks, CI caches) are',
    '     compromised regardless of any scrub; rotation is the real remediation.',
  ];
  if (mode === 'purge' && paths.length > 0) {
    lines.push(
      '  2. To purge history too, run the documented ONE-TIME TEAM OPERATION',
      '     (coordinate first — it rewrites history and every clone must re-clone):',
      `       git filter-repo ${paths.map((p) => `--path "${p}"`).join(' ')} --invert-paths --force`,
      '     (path-scoped to the purged file(s) — never the whole context/ tier).',
    );
  } else {
    lines.push(
      '  2. To redact history too, use the documented ONE-TIME TEAM OPERATION',
      '     (coordinate first — it rewrites history and every clone must re-clone):',
      '       git filter-repo --replace-text expressions.txt --force',
      '     where expressions.txt holds the secret, one per line — the SECURITY.md',
      '     runbook has the exact two-step recipe. Span-level: the file survives.',
    );
  }
  lines.push('  The kit never runs this for you — you own your git history.');
  return lines;
}
