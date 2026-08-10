// graduation.mjs — Task 91 (D-54 / D-57). The 3rd MEMORY.md shrink mechanism.
//
// When appendScratchpadBullet() hits cap pressure and consolidate() (stale-drop)
// can't free enough — because high-trust bullets are NEVER dropped — graduation
// moves the OLDEST high-trust bullets OUT of the byte-capped hot index into the
// permanent, indexed fact store (context/memory/<type>_<slug>.md via writeFact),
// so the new write lands instead of returning CAP_EXCEEDED.
//
// Decision A (D-57): SEARCH-ONLY (graduated facts are not injected; reliable
// recall of them is Task 75, v0.3) and PROJECT MEMORY.md ONLY — the caller gates
// the tier/scratchpad so this never fires on user-tier persona scratchpads.
//
// Reuses writeFact(), which gives four lifecycle-edge guarantees for free:
//   - cross-store dedup (content-id keyed → re-graduating the same fact is a
//     no-op `skipped`, not a duplicate file),
//   - home-path sanitization + Poison_Guard (the safe write path),
//   - reindex-on-write (the FTS5/INDEX.md view stays consistent — map edge #8).

import { unlinkSync } from 'node:fs';
import { writeFact } from './write-fact.mjs';
import { reindex } from './reindex.mjs';
import { parseBulletProvenance, isProvenanceCommentLine } from './provenance.mjs';

// Loose enough to match whatever id a bullet carries (graduation moves the
// bullet regardless of id-alphabet validity; that's the writer's concern).
const BULLET_RE = /^- \(([PUL]-[A-Za-z0-9]+)\)\s*(.*)$/;

const VALID_WRITE_SOURCES = new Set([
  'user-explicit',
  'auto-extract',
  'compressor',
  'manual-edit',
  'imported',
]);

function slugify(s) {
  // Collapse non-alphanumerics to single dashes, cap, trim edges (string ops,
  // no trailing-dash quantifier — matches rich-fact.slugifyFact's ReDoS-safe
  // shape).
  let base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  if (base.startsWith('-')) base = base.slice(1);
  if (base.endsWith('-')) base = base.slice(0, -1);
  return base || 'fact';
}

function deriveTitle(text) {
  const t = String(text).trim().slice(0, 80).trim();
  return t || 'graduated fact';
}

// One bullet → one project-tier fact file. writeFact action 'error' means it
// could NOT be stored (collision / poison / schema) → the caller must keep the
// bullet; anything else ('created' or a dedup 'skipped') means it's safely in
// the permanent store → the caller removes the bullet from the hot index.
function graduateOne({ id, text, prov, tier, projectRoot, userDir, now }) {
  // Slug carries a content-derived tail so two distinct facts never collide on
  // `project_<slug>.md`, while the SAME fact re-graduates to the same filename
  // (→ writeFact dedups by id instead of creating a duplicate).
  const slugTail = id.replace(/^[PUL]-/, '').toLowerCase();
  return writeFact({
    tier,
    // User-tier graduated content is cross-project doctrine → 'user'; project
    // (and any other) tier → 'project'. Both are valid fact-file types; this
    // just keeps the on-disk filename + frontmatter semantically honest.
    type: tier === 'U' ? 'user' : 'project',
    slug: `${slugify(text)}-${slugTail}`,
    title: deriveTitle(text),
    body: text,
    writeSource: VALID_WRITE_SOURCES.has(prov.write) ? prov.write : 'manual-edit',
    trust: 'high',
    sourceFile: prov.source || 'MEMORY.md',
    sourceLine: prov.source_line || 1,
    sourceSha1: prov.sha1,
    id, // preserve the citation id across graduation; also the dedup key
    createdAt: prov.at, // keep the original capture time
    projectRoot,
    userDir,
    now,
  });
}

/**
 * Graduate oldest high-trust bullets out of `text` until it fits `capBytes`.
 *
 * @returns {{ text: string, graduated: string[], graduatedFactIds: Record<string,string> }}
 *   the new scratchpad content (graduated bullets removed), the BULLET ids that
 *   graduated, and bulletId → the id the fact file actually received (they differ
 *   when writeFact repaired an unusable bullet id — Task 270 / D-444).
 */
export function graduateForCapRelief({
  text,
  capBytes,
  tier,
  projectRoot,
  userDir,
  now,
}) {
  const lines = text.split('\n');
  const entries = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const m = lines[i].match(BULLET_RE);
    if (!m) continue;
    if (!isProvenanceCommentLine(lines[i + 1])) continue;
    const prov = parseBulletProvenance(lines[i + 1]);
    if (!prov || prov.trust !== 'high' || !prov.at) continue;
    entries.push({ bulletIdx: i, commentIdx: i + 1, id: m[1], text: m[2], prov });
  }
  // Feasibility gate (composition safety): if graduating EVERY eligible bullet
  // still wouldn't get under cap, graduate NOTHING. Otherwise writeFact would
  // persist fact files that the failed-append error path then strands — the
  // bullets stay in the unchanged on-disk MEMORY.md AND now also exist as fact
  // files: the exact double-capture this task exists to kill. Returning early
  // lets CAP_EXCEEDED fire cleanly with zero side effects.
  const bulletBytes = (e) =>
    Buffer.byteLength(`${lines[e.bulletIdx]}\n${lines[e.commentIdx]}\n`, 'utf8');
  const totalGraduatable = entries.reduce((sum, e) => sum + bulletBytes(e), 0);
  const startBytes = Buffer.byteLength(text, 'utf8');
  if (startBytes - totalGraduatable > capBytes) {
    return { text, graduated: [], graduatedFactIds: {} };
  }

  // Oldest first: graduate aged durable facts before recent ones. The just-
  // appended bullet (newest `at`) sorts last and only graduates if still needed.
  entries.sort(
    (a, b) => new Date(a.prov.at).getTime() - new Date(b.prov.at).getTime(),
  );

  const removeIdx = new Set();
  const graduated = [];
  // Task 270 (M5 / D-444): bulletId → the id the fact file ACTUALLY got. These
  // differ exactly when writeFact repaired an unusable bullet id, and that is
  // the case where an audit entry keyed on the bullet id alone names an id no
  // fact file carries — unjoinable at the moment it matters most.
  const graduatedFactIds = {};
  const createdPaths = []; // files writeFact NEWLY created (for transactional rollback)
  let curBytes = Buffer.byteLength(text, 'utf8');
  for (const e of entries) {
    if (curBytes <= capBytes) break;
    const res = graduateOne({
      id: e.id,
      text: e.text,
      prov: e.prov,
      tier,
      projectRoot,
      userDir,
      now,
    });
    if (res.action === 'error') continue; // couldn't store → keep the bullet
    // 'created' made a NEW file (track for rollback); 'skipped' deduped against
    // a pre-existing fact file (don't track — deleting it would lose a real fact).
    if (res.action === 'created' && res.path) createdPaths.push(res.path);
    removeIdx.add(e.bulletIdx);
    removeIdx.add(e.commentIdx);
    graduated.push(e.id);
    if (res.id) graduatedFactIds[e.id] = res.id;
    curBytes -= bulletBytes(e);
  }

  // Transactional guard (composition safety): the feasibility gate assumed every
  // eligible bullet would graduate. If a graduateOne unexpectedly errored
  // (poison/schema on a resident bullet) we may still be over cap — the append
  // will then CAP_EXCEEDED and leave MEMORY.md unchanged, which would STRAND the
  // fact files we created (the bullets stay live AND now exist as facts = the
  // double-capture this task kills). Roll the created files back so the failure
  // path has zero side effects, and let CAP_EXCEEDED fire cleanly.
  if (curBytes > capBytes) {
    for (const p of createdPaths) {
      try {
        unlinkSync(p);
      } catch {
        // best-effort; a leaked fact file is recoverable, a lost bullet is not
      }
    }
    if (createdPaths.length > 0) {
      try {
        reindex({ tier, projectRoot, userDir, warn: () => {} });
      } catch {
        // index rebuild is best-effort; the next reindex/search self-heals
      }
    }
    return { text, graduated: [] };
  }

  if (removeIdx.size === 0) return { text, graduated: [] };
  const out = lines.filter((_, i) => !removeIdx.has(i)).join('\n');
  return { text: out, graduated };
}

/**
 * Mechanical cap relief for the USER-TIER PERSONA (Task 151.4, ADR-0016 §20.3).
 *
 * The persona (USER/HABITS/LESSONS.md) must NEVER graduate its high-trust bullets
 * out to un-injected `fragments/` — that strands a promoted trait so it vanishes
 * at cold-open (Hole B). Instead, reclaim bytes WITHOUT dropping any content:
 *   - trim trailing whitespace per line,
 *   - collapse any run of ≥2 blank lines down to a single blank line.
 * No bullet is ever removed. This is a best-effort byte reclaim (the load-cap-not-
 * write-cap invariant, D-61, already lets the file exceed the inject budget when
 * relief isn't enough; the snapshot load-cap + sweep order (151.5) then keeps the
 * high-trust traits injected). A genuine LLM tighter-rewrite is Task 95 (off the
 * synchronous append hot path — an inline Haiku call here would be a composition +
 * latency hazard). PURE: no I/O. Idempotent (re-condensing tight text is a no-op).
 *
 * @param {string} text  the scratchpad content
 * @returns {string} the condensed content (same bullets, fewer bytes)
 */
export function condenseScratchpadForCapRelief(text) {
  // CRLF-tolerant (Task 139): split on /\r?\n/ so a Windows-authored persona file
  // condenses too — a plain split('\n') would leave a trailing '\r' on every line,
  // making blank-run collapse + trailing-trim silent no-ops. Rejoin with '\n'
  // (LF), matching how consolidate()/writeBullet() already normalize line endings.
  const lines = String(text ?? '').split(/\r?\n/);
  const out = [];
  let blankRun = 0;
  for (const line of lines) {
    const trimmed = line.replace(/[ \t]+$/, ''); // trailing whitespace
    if (trimmed === '') {
      blankRun += 1;
      if (blankRun > 1) continue; // collapse ≥2 blanks → 1
    } else {
      blankRun = 0;
    }
    out.push(trimmed);
  }
  return out.join('\n');
}
