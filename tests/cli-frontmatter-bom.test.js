// @doors: 1, 2, 3, 5
// Door 1 (Response): frontmatter.parse's return shape on BOM'd input — the
//   frontmatter object is populated (not null), parseError is absent, and NO
//   returned field re-exposes the BOM to callers on ANY branch. Plus the
//   downstream response shapes: reindex's entry list, search's hits, the
//   graph's edge rows, and generateId's BOM-insensitivity.
// Door 2 (State): the whole point — what lands on disk. INDEX.md + MAP.md list
//   the BOM'd fact; a legitimate rewrite drops the BOM from the file; non-BOM
//   files stay BYTE-IDENTICAL (the no-behavior-change constraint); the
//   over-mutation guard (rewrite one, N-1 neighbours untouched).
// Door 3 (External calls): the REAL `cmk reindex --full` + `cmk search` bins
//   driven as subprocesses against the COMMITTED real-payload fixture
//   (fixtures/bom/, captured from Windows PowerShell 5.1 `Set-Content
//   -Encoding utf8`) — the live-test rule. An in-process call cannot see the
//   bin wiring, and a synthesised string cannot see what a real producer emits.
// Door 3.5 N/A: no LLM spawn anywhere on the parse/reindex/search path.
// Door 4 N/A: no message-queue surface.
// Door 5 (Observability): reindex's warning channel — a BOM'd fact must NOT
//   emit a `skipped — no YAML frontmatter` warning (the warning that WOULD have
//   been the only trace of the silent disappearance, had anyone been reading).

// Task 257 — `frontmatter.parse` was BOM-blind, so a `﻿`-prefixed fact file
// was invisible to the ENTIRE kit (D-403; found by Task 248's live test).
//
// The bug: parse's `^---` anchor did not tolerate a leading U+FEFF, so a fact
// file hand-edited in a Windows editor (PowerShell 5.1 `Set-Content -Encoding
// utf8` emits BOM + CRLF) parsed as "no frontmatter" — dropped by reindex,
// recall, every fact walk, INDEX/MAP and the edge builder. The fact silently
// ceased to exist while sitting untouched in the tier. This is the D-306
// input-boundary class one level in, and the sibling of D-126 (the CRLF
// blindness the same regex already learned to tolerate) — hence the combined
// BOM+CRLF cases below.
//
// Boundary-test discipline: these test the PUBLIC contracts — parse/format,
// reindex, reindexFull+search, rebuildEdges, parseObservationsFromScratchpad —
// never the internal regex.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateId } from '@lh8ppl/cmk-canonicalize';
import { parse, format } from '../packages/cli/src/frontmatter.mjs';
import { install } from '../packages/cli/src/install.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { reindex } from '../packages/cli/src/reindex.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import {
  reindexFull,
  parseObservationsFromScratchpad,
} from '../packages/cli/src/index-rebuild.mjs';
import { search } from '../packages/cli/src/search.mjs';
import { overrideTrust } from '../packages/cli/src/trust.mjs';
import { eachFactIn } from '../packages/cli/src/fact-store.mjs';
import { classifyFactId } from '../packages/cli/src/memory-recovery.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CMK_BIN = join(REPO, 'packages', 'cli', 'bin', 'cmk.mjs');
const FIXTURE = join(REPO, 'fixtures', 'bom', 'project_bom-hand-edited.md');

const BOM = '﻿';

// Real base32 ids (kit alphabet excludes 0/O/1/l/I/8), copied from
// fixtures/canonicalize-vectors.json.
const BOMMED = 'P-WJCLLKH6'; // the id inside the committed fixture
const NEIGHBOUR_A = 'P-ZGHBQBGS';
const NEIGHBOUR_B = 'P-RQEULVDC';
const CO_CITER = 'P-3Ea74VJA';

let sandbox;
let projectRoot;
let userDir;

function factText({ id, title, body }) {
  return [
    '---',
    `id: ${id}`,
    'type: project',
    `title: ${title}`,
    'created_at: 2026-07-25T10:00:00Z',
    'write_source: manual-edit',
    'trust: medium',
    'source: context/memory/x.md',
    'source_line: 1',
    'sha1: 0123456789abcdef0123456789abcdef01234567',
    '---',
    '',
    body,
    '',
  ].join('\n');
}

function seedFact({ id, slug, title, body }) {
  const r = writeFact({
    projectRoot,
    tier: 'P',
    type: 'project',
    slug,
    title: title ?? slug,
    body: body ?? `fact ${slug}`,
    writeSource: 'user-explicit',
    trust: 'high',
    sourceFile: 'MEMORY.md',
    sourceLine: 1,
    sourceSha1: 'a'.repeat(40),
    id,
  });
  if (r.action === 'error') throw new Error(`seedFact failed: ${(r.errors ?? []).join('; ')}`);
  return r.path;
}

/** Prepend a UTF-8 BOM to an existing file, leaving every other byte alone. */
function bomify(path) {
  const raw = readFileSync(path, 'utf8');
  writeFileSync(path, BOM + raw, 'utf8');
  return path;
}

const factDir = () => join(projectRoot, 'context', 'memory');

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-fm-bom-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  await install({ projectRoot, userTier: userDir });
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

// ====================================================================
// The committed real-payload fixture (the live-test rule, Door 3 input)
// ====================================================================

describe('the committed real-payload fixture', () => {
  it('still carries BOM + CRLF on disk (guards the .gitattributes -text rule)', () => {
    expect(existsSync(FIXTURE)).toBe(true);
    const bytes = readFileSync(FIXTURE);
    // EF BB BF — the UTF-8 BOM as PowerShell 5.1 `Set-Content -Encoding utf8`
    // emits it. If `*.md text eol=lf` ever reclaims this path, the CRLF half of
    // the payload silently disappears and this assertion is what says so.
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = bytes.toString('utf8');
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect((text.match(/\r\n/g) ?? []).length).toBeGreaterThan(5);
    expect(/(?<!\r)\n/.test(text)).toBe(false); // CRLF throughout, no bare LF
  });
});

// ====================================================================
// Door 1 — parse's contract on BOM'd input
// ====================================================================

describe('frontmatter.parse — BOM tolerance (Door 1)', () => {
  it('parses frontmatter from a BOM-prefixed file', () => {
    const text = BOM + factText({ id: BOMMED, title: 'Bommed', body: 'body here' });
    const { frontmatter, body, parseError } = parse(text);
    expect(parseError).toBeUndefined();
    expect(frontmatter).toMatchObject({ id: BOMMED, type: 'project', title: 'Bommed' });
    expect(body).toContain('body here');
  });

  it('parses BOM + CRLF combined (the real PowerShell 5.1 payload shape)', () => {
    const raw = readFileSync(FIXTURE, 'utf8');
    const { frontmatter, body, parseError } = parse(raw);
    expect(parseError).toBeUndefined();
    expect(frontmatter.id).toBe(BOMMED);
    expect(frontmatter.title).toBe('Hand-edited fact carrying a UTF-8 BOM');
    expect(body).toContain('[[bom-neighbour]]');
    expect(body).toContain('D-403');
  });

  it('never re-exposes the BOM on the frontmatter branch', () => {
    const text = BOM + factText({ id: BOMMED, title: 'Bommed', body: 'body here' });
    const { frontmatter, body } = parse(text);
    expect(body.charCodeAt(0)).not.toBe(0xfeff);
    expect(body.includes(BOM)).toBe(false);
    expect(JSON.stringify(frontmatter).includes(BOM)).toBe(false);
  });

  it('never re-exposes the BOM on the NO-frontmatter branch either', () => {
    const { frontmatter, body } = parse(`${BOM}# Just markdown\n\nno frontmatter here\n`);
    expect(frontmatter).toBeNull();
    expect(body).toBe('# Just markdown\n\nno frontmatter here\n');
    expect(body.includes(BOM)).toBe(false);
  });

  // NB: hyphenate as "YAML parse-error". Camel-casing it right after "YAML"
  // yields a substring validate-test-ids reads as a malformed fact id
  // (`[PUL]-` + 8 alphanumerics), and the honest fix is the wording, not a
  // suppression marker on a line that holds no id at all.
  it('never re-exposes the BOM on the YAML parse-error branch', () => {
    const bad = `${BOM}---\nid: [unclosed\n---\nbody\n`;
    const { frontmatter, body, parseError } = parse(bad);
    expect(frontmatter).toBeNull();
    expect(parseError).toBeTruthy();
    expect(body.includes(BOM)).toBe(false);
  });

  it('never re-exposes the BOM on the not-a-mapping branch', () => {
    const scalar = `${BOM}---\njust a string\n---\nbody\n`;
    const { frontmatter, body, parseError } = parse(scalar);
    expect(frontmatter).toBeNull();
    expect(parseError).toBe('frontmatter is not a mapping');
    expect(body.includes(BOM)).toBe(false);
  });

  it('preserves a NON-leading BOM in the body verbatim (only the leading one is a byte-order mark)', () => {
    const text = BOM + factText({ id: BOMMED, title: 'Bommed', body: `mid${BOM}body` });
    const { body } = parse(text);
    expect(body).toContain(`mid${BOM}body`);
  });

  it('strips exactly ONE leading BOM (the canonical read-json.stripBom semantics)', () => {
    // Deliberate contract pin, not an oversight: parse delegates to the ONE
    // canonical stripBom so the kit has a single BOM policy. A doubled BOM is
    // not a shape any real producer emits, and silently swallowing an arbitrary
    // run of them would diverge from every other kit BOM site.
    const { frontmatter } = parse(BOM + BOM + factText({ id: BOMMED, title: 'X', body: 'b' }));
    expect(frontmatter).toBeNull();
  });
});

// ====================================================================
// Door 1/2 — format never emits a BOM; the round-trip heals the file
// ====================================================================

describe('frontmatter.format — never emits a BOM (Door 1)', () => {
  it('a parse -> format round-trip of a BOM\'d file drops the BOM', () => {
    const clean = factText({ id: BOMMED, title: 'Bommed', body: 'body here' });
    const out = format(parse(BOM + clean));
    expect(out.charCodeAt(0)).not.toBe(0xfeff);
    expect(out.startsWith('---\n')).toBe(true);
  });

  it('the round-trip output is IDENTICAL for the BOM\'d and clean twins', () => {
    const clean = factText({ id: BOMMED, title: 'Bommed', body: 'body here' });
    expect(format(parse(BOM + clean))).toBe(format(parse(clean)));
  });

  it('the no-frontmatter round-trip also drops the BOM', () => {
    const out = format(parse(`${BOM}# plain\n\ntext\n`));
    expect(out).toBe('# plain\n\ntext\n');
  });

  it('drops a leading BOM a CALLER put in the body (the invariant is total)', () => {
    expect(format({ frontmatter: null, body: `${BOM}# plain\n` })).toBe('# plain\n');
    const withFm = format({ frontmatter: { id: BOMMED }, body: `${BOM}body\n` });
    expect(withFm.charCodeAt(0)).not.toBe(0xfeff);
    expect(withFm).toBe(`---\nid: ${BOMMED}\n---\nbody\n`);
  });
});

// ====================================================================
// Door 2 — the no-behavior-change constraint for non-BOM input
// ====================================================================

describe('non-BOM input is untouched (Door 2 — the regression net)', () => {
  const cases = [
    ['plain frontmatter', factText({ id: NEIGHBOUR_A, title: 'A', body: 'b' })],
    ['CRLF frontmatter (D-126)', factText({ id: NEIGHBOUR_A, title: 'A', body: 'b' }).replace(/\n/g, '\r\n')],
    ['no frontmatter', '# heading\n\nbody\n'],
    ['empty string', ''],
    ['bare --- rule only', '---\n'],
    ['frontmatter with a colon value', '---\ntitle: a: b\n---\nbody\n'],
  ];

  for (const [label, text] of cases) {
    it(`${label} — parse output unchanged`, () => {
      const r = parse(text);
      // The identity that matters most: for a non-frontmatter input the body is
      // the ORIGINAL string, reference-equal in value to the input.
      if (r.frontmatter === null && !r.parseError) expect(r.body).toBe(text);
      // And nothing anywhere gained or lost a BOM.
      expect(JSON.stringify(r).includes(BOM)).toBe(false);
    });
  }

  it('parse of a non-string returns the documented empty shape', () => {
    expect(parse(undefined)).toEqual({ frontmatter: null, body: '' });
    expect(parse(42)).toEqual({ frontmatter: null, body: '' });
  });

  it('a clean fact file rewritten through parse->format is byte-identical', () => {
    const path = seedFact({ id: NEIGHBOUR_A, slug: 'clean-twin' });
    const before = readFileSync(path, 'utf8');
    const after = format(parse(before));
    expect(after).toBe(before);
  });
});

// ====================================================================
// Door 1/2/5 — reindex sees the BOM'd fact
// ====================================================================

describe('reindex sees a BOM\'d fact (Doors 1, 2, 5)', () => {
  it('lists it in INDEX.md and emits NO skip warning', () => {
    seedFact({ id: NEIGHBOUR_A, slug: 'alpha' });
    const bommed = seedFact({ id: BOMMED, slug: 'bommed', title: 'Bommed fact' });
    bomify(bommed);

    const warnings = [];
    reindex({ tier: 'P', projectRoot, userDir, warn: (m) => warnings.push(m) });

    const index = readFileSync(join(factDir(), 'INDEX.md'), 'utf8');
    expect(index).toContain(BOMMED);
    expect(index).toContain(NEIGHBOUR_A);
    // Door 5: the silent-disappearance trace that must NOT be there.
    expect(warnings).toEqual([]);
  });

  it('renders it into the vault MAP.md', () => {
    const bommed = seedFact({ id: BOMMED, slug: 'bommed', title: 'Bommed fact' });
    bomify(bommed);
    reindex({ tier: 'P', projectRoot, userDir, warn: () => {} });
    const map = readFileSync(join(factDir(), 'MAP.md'), 'utf8');
    expect(map).toContain('bommed');
  });

  it('is yielded by the shared fact-store walk', () => {
    const bommed = seedFact({ id: BOMMED, slug: 'bommed' });
    bomify(bommed);
    const ids = [...eachFactIn(factDir())].map((f) => f.id);
    expect(ids).toContain(BOMMED);
  });

  it('INDEX.md content is identical whether or not the fact carries a BOM', () => {
    seedFact({ id: NEIGHBOUR_A, slug: 'alpha' });
    const bommed = seedFact({ id: BOMMED, slug: 'bommed', title: 'Bommed fact' });
    reindex({ tier: 'P', projectRoot, userDir, warn: () => {} });
    const cleanIndex = readFileSync(join(factDir(), 'INDEX.md'), 'utf8');

    bomify(bommed);
    reindex({ tier: 'P', projectRoot, userDir, warn: () => {} });
    expect(readFileSync(join(factDir(), 'INDEX.md'), 'utf8')).toBe(cleanIndex);
  });
});

// ====================================================================
// Door 1/2 — search + graph edges
// ====================================================================

describe('a BOM\'d fact is searchable and linkable (Doors 1, 2)', () => {
  let db;
  afterEach(() => db?.close());

  it('is returned by an FTS keyword search', () => {
    const bommed = seedFact({
      id: BOMMED,
      slug: 'bommed',
      body: 'the deployment pipeline uses pnpm workspaces',
    });
    bomify(bommed);
    db = openIndexDb({ projectRoot });
    reindexFull({ projectRoot, userDir, db });

    const r = search({ db, query: 'pnpm', projectRoot });
    expect(r.action).toBe('found');
    expect(r.results.map((x) => x.id)).toContain(BOMMED);
  });

  it('its [[wikilink]] and cited anchor become edges', () => {
    seedFact({ id: NEIGHBOUR_A, slug: 'bom-neighbour' });
    // A second citer: `cites` edges need MIN_CITERS anchors before they land.
    seedFact({ id: CO_CITER, slug: 'co-citer', body: 'also references D-403 here' });
    const bommed = seedFact({
      id: BOMMED,
      slug: 'bommed',
      body: 'links to [[bom-neighbour]] and cites D-403',
    });
    bomify(bommed);

    db = openIndexDb({ projectRoot });
    reindexFull({ projectRoot, userDir, db });

    const link = db
      .prepare("SELECT * FROM edges WHERE src = ? AND type = 'link'")
      .get(BOMMED);
    expect(link).toMatchObject({ src: BOMMED, dst: NEIGHBOUR_A, dst_resolved: 1 });

    const cites = db
      .prepare("SELECT * FROM edges WHERE src = ? AND type = 'cites'")
      .all(BOMMED)
      .map((r) => r.dst);
    expect(cites).toContain('anchor:D-403');
  });
});

// ====================================================================
// Door 2 — the write path heals the file; over-mutation guard
// ====================================================================

describe('a legitimate rewrite drops the BOM (Door 2)', () => {
  it('overrideTrust rewrites the BOM\'d fact without the BOM, body intact', () => {
    const bommed = seedFact({ id: BOMMED, slug: 'bommed', body: 'a durable body line' });
    bomify(bommed);
    const r = overrideTrust({ id: BOMMED, level: 'low', projectRoot, userDir, actor: 'user' });
    expect(r.action).not.toBe('error');

    const after = readFileSync(bommed, 'utf8');
    expect(after.charCodeAt(0)).not.toBe(0xfeff);
    expect(after.startsWith('---\n')).toBe(true);
    expect(after).toContain('trust: low');
    expect(after).toContain('a durable body line');
  });

  it('over-mutation: healing one BOM\'d fact leaves its N-1 neighbours byte-identical', () => {
    const a = seedFact({ id: NEIGHBOUR_A, slug: 'alpha' });
    const b = seedFact({ id: NEIGHBOUR_B, slug: 'bravo' });
    const bommed = seedFact({ id: BOMMED, slug: 'bommed' });
    bomify(bommed);
    // Neighbour A is ALSO BOM'd: healing the target must not heal (or touch)
    // an unrelated file just because it shares the defect.
    bomify(a);

    const beforeA = readFileSync(a);
    const beforeB = readFileSync(b);

    overrideTrust({ id: BOMMED, level: 'low', projectRoot, userDir, actor: 'user' });

    expect(readFileSync(a).equals(beforeA)).toBe(true);
    expect(readFileSync(b).equals(beforeB)).toBe(true);
  });
});

// ====================================================================
// Door 1/2 — the write-path collision guard no longer goes blind
// ====================================================================

describe('writeFact\'s collision guard sees a BOM\'d file (Doors 1, 2)', () => {
  // The sharpest consequence of the blindness, found by the caller map rather
  // than by the symptom: writeFact refuses to overwrite a file that already
  // exists at `<type>_<slug>.md` with a DIFFERENT id — but that guard is
  // `readExistingFactId(path) !== null`, which read a BOM'd neighbour as
  // "no frontmatter" → null → guard skipped → `writeFileSync` CLOBBERED a real
  // fact. The dedup scan (findExistingFactById → eachFactIn → parse) was blind
  // to the same file, so nothing else caught it either. A hand-edit in a Windows
  // editor was enough to make the next `cmk remember` destroy the fact.
  it('refuses to overwrite a BOM\'d fact that holds the same filename', () => {
    const path = seedFact({ id: BOMMED, slug: 'bommed', body: 'the ORIGINAL body' });
    bomify(path);

    const r = writeFact({
      projectRoot,
      tier: 'P',
      type: 'project',
      slug: 'bommed', // same file: project_bommed.md
      title: 'A different fact that slugs the same',
      body: 'a completely different body',
      writeSource: 'user-explicit',
      trust: 'high',
      sourceFile: 'MEMORY.md',
      sourceLine: 1,
      sourceSha1: 'b'.repeat(40),
      id: NEIGHBOUR_A, // a DIFFERENT id
    });

    expect(r.action).toBe('error');
    expect(r.errorCategory).toBe('collision');
    // Door 2 — the part that matters: the original bytes survived.
    expect(readFileSync(path, 'utf8')).toContain('the ORIGINAL body');
  });

  it('bumps recurrence instead of duplicating when the BOM\'d file holds the SAME id', () => {
    const path = seedFact({ id: BOMMED, slug: 'bommed', body: 'the ORIGINAL body' });
    bomify(path);

    const r = writeFact({
      projectRoot,
      tier: 'P',
      type: 'project',
      slug: 'bommed',
      title: 'same fact re-surfaced',
      body: 'restated',
      writeSource: 'user-explicit',
      trust: 'high',
      sourceFile: 'MEMORY.md',
      sourceLine: 1,
      sourceSha1: 'b'.repeat(40),
      id: BOMMED,
    });

    expect(r).toMatchObject({ action: 'skipped', skipReason: 'duplicate', id: BOMMED });
    expect(r.recurrenceCount).toBe(2);
    const after = readFileSync(path, 'utf8');
    expect(after).toContain('the ORIGINAL body'); // body preserved by the bump
    expect(after.charCodeAt(0)).not.toBe(0xfeff); // and the bump healed the BOM
  });
});

// ====================================================================
// Door 2 — the scratchpad reader
// ====================================================================

describe('a BOM\'d scratchpad still parses (Door 2)', () => {
  const bulletPair = [
    '- (P-ZGHBQBGS) the api gateway runs on port 8443',
    '  <!-- source: MEMORY.md, source_line: 3, sha1: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, write: user-explicit, trust: high, at: 2026-07-25T10:00:00Z -->',
  ].join('\n');

  it('indexes a bullet under a heading that is the BOM\'d FIRST line', () => {
    const content = `${BOM}## Environment Notes\n\n${bulletPair}\n`;
    const { observations } = parseObservationsFromScratchpad({
      path: join(projectRoot, 'context', 'MEMORY.md'),
      content,
      tier: 'P',
      projectRoot,
    });
    expect(observations).toHaveLength(1);
    expect(observations[0].id).toBe(NEIGHBOUR_A);
    // The heading must still be found — a BOM'd `## ` line went blind before.
    expect(observations[0].heading_path).toBe('MEMORY.md > Environment Notes');
  });

  it('indexes a bullet that is itself the BOM\'d first line', () => {
    const content = `${BOM}${bulletPair}\n`;
    const { observations } = parseObservationsFromScratchpad({
      path: join(projectRoot, 'context', 'MEMORY.md'),
      content,
      tier: 'P',
      projectRoot,
    });
    expect(observations).toHaveLength(1);
    expect(observations[0].id).toBe(NEIGHBOUR_A);
  });

  it('the content sha1 still tracks the RAW bytes (adding a BOM IS a change)', () => {
    const base = `## Environment Notes\n\n${bulletPair}\n`;
    const clean = parseObservationsFromScratchpad({
      path: join(projectRoot, 'context', 'MEMORY.md'),
      content: base,
      tier: 'P',
      projectRoot,
    });
    const bommed = parseObservationsFromScratchpad({
      path: join(projectRoot, 'context', 'MEMORY.md'),
      content: BOM + base,
      tier: 'P',
      projectRoot,
    });
    expect(bommed.sha1).not.toBe(clean.sha1);
    // ...while the parsed observations are otherwise identical.
    expect(bommed.observations.map((o) => o.id)).toEqual(clean.observations.map((o) => o.id));
    expect(bommed.observations[0].source_line).toBe(clean.observations[0].source_line);
  });
});

// ====================================================================
// Door 1 — id derivation is BOM-insensitive (the hash-stability ruling)
// ====================================================================

describe('id derivation is BOM-insensitive (Door 1)', () => {
  it('a BOM\'d fact and its clean twin derive the SAME id', () => {
    expect(generateId('P', `${BOM}we standardized on pnpm`)).toBe(
      generateId('P', 'we standardized on pnpm'),
    );
  });

  it('holds for a bullet-shaped input too (the marker strip runs after)', () => {
    expect(generateId('P', `${BOM}- we standardized on pnpm`)).toBe(
      generateId('P', '- we standardized on pnpm'),
    );
  });
});

// ====================================================================
// Interaction with Task 248's repair path
// ====================================================================

describe('Task 248 memory-recovery interaction', () => {
  it('a BOM\'d fact with a VALID id still classifies as valid (no repair needed)', () => {
    const text = BOM + factText({ id: BOMMED, title: 'Bommed', body: 'body' });
    expect(classifyFactId(text, 'P')).toEqual({ kind: 'valid', id: BOMMED });
  });

  it('classification is unchanged for the clean twin (no double-strip drift)', () => {
    const clean = factText({ id: BOMMED, title: 'Bommed', body: 'body' });
    expect(classifyFactId(BOM + clean, 'P')).toEqual(classifyFactId(clean, 'P'));
  });
});

// ====================================================================
// Door 3 — the REAL bins against the committed fixture
// ====================================================================

describe('Door 3 — real bins against the committed real-payload fixture', () => {
  it('cmk reindex --full then cmk search finds the BOM+CRLF fact', () => {
    // The neighbour the fixture wikilinks to, so the edge resolves.
    seedFact({ id: NEIGHBOUR_A, slug: 'bom-neighbour' });
    copyFileSync(FIXTURE, join(factDir(), 'project_bom-hand-edited.md'));

    const env = { ...process.env, MEMORY_KIT_USER_DIR: userDir };
    const reindexRun = spawnSync(process.execPath, [CMK_BIN, 'reindex', '--full'], {
      cwd: projectRoot,
      env,
      encoding: 'utf8',
    });
    expect(reindexRun.status).toBe(0);

    const searchRun = spawnSync(process.execPath, [CMK_BIN, 'search', 'BOM'], {
      cwd: projectRoot,
      env,
      encoding: 'utf8',
    });
    expect(searchRun.status).toBe(0);
    expect(searchRun.stdout).toContain(BOMMED);
  });
});
