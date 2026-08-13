// @doors: 1, 3
// Door 2 N/A: validator reads markdown files + writes to stdout/stderr; no kit-state mutation.
// Door 4 N/A: no message-queue interaction.
// Door 5 N/A: no NDJSON observability surface.
//
// Self-test for scripts/validate-references.mjs.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDecisionIds } from '../scripts/validate-docs.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), '..');
// Task 186 consolidation: the references family now lives in the one
// manifest-driven validate-docs.mjs; this suite is its behavior lock.
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate-docs.mjs');

function makeSandbox() {
  const sandbox = mkdtempSync(join(tmpdir(), 'cmk-refs-test-'));
  mkdirSync(join(sandbox, 'docs', 'adr'), { recursive: true });
  mkdirSync(join(sandbox, 'specs'), { recursive: true });
  return sandbox;
}

function runValidator(sandbox) {
  const r = spawnSync(process.execPath, [VALIDATOR, '--only', 'references'], {
    cwd: sandbox,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, CMK_VALIDATOR_ROOT: sandbox },
  });
  return { exitCode: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('validate-references', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = makeSandbox();
  });
  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  it('passes on an empty corpus', () => {
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(0);
  });

  it('FAILS on a broken [label](path) link', () => {
    writeFileSync(
      join(sandbox, 'index.md'),
      '# Top\n\nSee [missing](does-not-exist.md).\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/broken link target: does-not-exist\.md/);
  });

  it('passes when a [label](path) link resolves', () => {
    writeFileSync(join(sandbox, 'index.md'), '# Top\n\nSee [target](other.md).\n');
    writeFileSync(join(sandbox, 'other.md'), '# Other\n');
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(0);
  });

  it('FAILS on a broken ADR-NNNN reference', () => {
    writeFileSync(join(sandbox, 'index.md'), '# Top\n\nSee ADR-0099.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/ADR-0099 has no file/);
  });

  it('skips link-shaped tokens inside fenced code blocks (D1-IMP-A)', () => {
    writeFileSync(
      join(sandbox, 'index.md'),
      '# Top\n\nExample:\n\n```\n[link](does-not-exist.md)\n```\n\nThat was inside a fence.\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(0);
  });

  it('skips link-shaped tokens inside inline-code spans', () => {
    writeFileSync(
      join(sandbox, 'index.md'),
      '# Top\n\nFor example, `[link](does-not-exist.md)` is illustrative.\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(0);
  });

  it('honors the same-line suppression marker', () => {
    writeFileSync(
      join(sandbox, 'index.md'),
      '# Top\n\nReserved: ADR-0099. <!-- validate-references: ignore -->\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(0);
  });
});

// ====================================================================
// The `dnnn` sub-check (Task 247) — D-nnn decision-log citations
// ====================================================================
//
// The gap it closes: every OTHER internal-reference class the family owns
// (ADR-NNNN / FR-N / NFR-N / Task N / §N.N / file links) resolves against a
// real anchor; `D-nnn` — the most-cited reference in the corpus — was on the
// honour system. The target failure is the FORWARD reference: a `D-406` cited
// in tasks.md while the log stops at D-405.
//
// These locks live in THIS file (not scripts-validate-docs.test.js) because
// this is the `references` family's behavior-lock suite — the consolidation
// file's own header scopes it to the one-entry/`--only`/manifest contract and
// points family behavior here. The consolidation file's real-repo Door-3 test
// asserts the dnnn summary token, so the entry-level coverage is pinned too.

describe('validate-references — D-nnn decision-log citations (Task 247)', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = makeSandbox();
    mkdirSync(join(sandbox, 'docs', 'journey'), { recursive: true });
  });
  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  const writeLog = (body) =>
    writeFileSync(join(sandbox, 'docs', 'journey', 'DECISION-LOG.md'), body);

  // Every heading/lead shape the REAL log uses, one line each.
  const SAMPLE_LOG = [
    '# Decision log — running paper trail',
    '',
    '## 2026-07-27 — D-405 · DECISION — the current heading shape',
    '',
    '## 2026-07-20 — D-375: DECISION — the older colon heading shape',
    '',
    '- **⚙️ DECISION (2026-06-14) — D-150: the bold list-item lead shape**',
    '',
    '- **✅ FIX + RESOLUTION of D-149 (2026-06-27) — D-213: an id that is NOT first in its lead**',
    '',
    '- **D-1 DECISION — the earliest shape, id at the very start of the lead**',
    '',
    '- **📝 NOTE (2026-07-02) — D-253a: the SUB-LETTERED shape (D-203b..n / D-258a are real ids)**',
    '',
  ].join('\n');

  it('FAILS on a dangling D-nnn in a living doc, naming the file and line', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(
      join(sandbox, 'specs', 'planted.md'),
      '# Planted\n\nA line of prose.\n\nSee D-9999 for the rationale.\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(1);
    expect(r.stderr).toMatch(/specs\/planted\.md:5/);
    expect(r.stderr).toMatch(/D-9999 has no entry/);
  });

  it('the FORWARD-reference case: one past the log head FAILS', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(join(sandbox, 'specs', 'ahead.md'), '# Ahead\n\nLaned per D-406.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/D-406 has no entry/);
  });

  it('passes when every D-nnn resolves — including an id that is not first in its lead', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(
      join(sandbox, 'specs', 'ok.md'),
      '# OK\n\nPer D-405, D-375, D-150, D-213 and D-1.\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('reports EVERY dangling id on a line and leaves the resolving ones alone', () => {
    // The over-mutation analogue for a scanner: seed a line with 5 citations,
    // 2 of them bad, and assert exactly those 2 are named — no swallowed
    // second match (regex `lastIndex` correctness) and no collateral report
    // against the 3 that resolve.
    writeLog(SAMPLE_LOG);
    writeFileSync(
      join(sandbox, 'specs', 'mixed.md'),
      '# Mixed\n\nPer D-405, D-9999, D-150, D-9998 and D-1.\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/D-9999 has no entry/);
    expect(r.stderr).toMatch(/D-9998 has no entry/);
    expect(r.stderr).not.toMatch(/D-405 has no entry/);
    expect(r.stderr).not.toMatch(/D-150 has no entry/);
    expect(r.stderr).not.toMatch(/D-1 has no entry/);
    expect(r.stderr).toMatch(/FAIL — 2 issue\(s\)/);
  });

  it('the dnnn check does not mask the family\'s other id classes', () => {
    // A dangling D-nnn and a dangling ADR on the same corpus must BOTH be
    // reported — the new sub-check is additive, not a short-circuit.
    writeLog(SAMPLE_LOG);
    writeFileSync(join(sandbox, 'specs', 'both.md'), '# Both\n\nSee ADR-0099 and D-9999.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/ADR-0099 has no file/);
    expect(r.stderr).toMatch(/D-9999 has no entry/);
  });

  // ── Slash continuations. `D-270/271/277` is THREE citations; validating only
  // the head silently exempted every tail in the corpus (~60 of them).

  it('a SLASH-CONTINUATION tail is validated, not just the head', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(join(sandbox, 'specs', 'tail.md'), '# Tail\n\nPer D-405/9999.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(1);
    expect(r.stderr).toMatch(/D-9999 has no entry/);
    expect(r.stderr).not.toMatch(/D-405 has no entry/);
  });

  it('an all-resolving slash continuation passes', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(join(sandbox, 'specs', 'tails-ok.md'), '# OK\n\nPer D-405/375/150 and D-1.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  // ── Sub-lettered ids. The log really anchors them (D-203b..n, D-253a,
  // D-258a) and CLAUDE.md really cites D-253a, so BOTH sides carry `[a-z]?`.

  it('a SUB-LETTERED id resolves when the log anchors it, and fails when it does not', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(join(sandbox, 'specs', 'sub.md'), '# Sub\n\nPer D-253a.\n');
    expect(runValidator(sandbox).exitCode).toBe(0);
    writeFileSync(join(sandbox, 'specs', 'sub-bad.md'), '# Sub bad\n\nPer D-405z.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/D-405z has no entry/);
  });

  // ── The Task-249 composition: the anchor source is a GLOB, so an archive
  // split keeps pre-split anchors resolvable.

  it('an ARCHIVED log (DECISION-LOG-archive-*.md) still supplies anchors', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(
      join(sandbox, 'docs', 'journey', 'DECISION-LOG-archive-pre-v0.5.md'),
      '# Decision log — archive\n\n## 2026-01-02 — D-77 · DECISION — a pre-split entry\n',
    );
    writeFileSync(join(sandbox, 'specs', 'cites-old.md'), '# Old\n\nPer D-77 and D-405.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toMatch(/from 2 sources/);
  });

  it('WITHOUT the archive present, the same pre-split citation FAILS (the glob is load-bearing)', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(join(sandbox, 'specs', 'cites-old.md'), '# Old\n\nPer D-77.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/D-77 has no entry/);
  });

  it('an ARCHIVED tasks file (specs/tasks-archive.md) still supplies Task ids', () => {
    // Task 249 splits tasks.md the same way; `Task N` gets the same glob.
    writeLog(SAMPLE_LOG);
    writeFileSync(join(sandbox, 'specs', 'tasks-archive.md'), '# Archive\n\n- [x] 999. a shipped task\n');
    writeFileSync(join(sandbox, 'specs', 'cites-task.md'), '# Cites\n\nPer Task 999.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('a lead shape INSIDE A FENCE mints no anchor (parse side matches scan side)', () => {
    writeLog(
      `${SAMPLE_LOG}\n\nAn illustration of the heading shape:\n\n\`\`\`\n## 2026-01-01 — D-8888 · DECISION — an EXAMPLE, not an entry\n\`\`\`\n`,
    );
    writeFileSync(join(sandbox, 'specs', 'cites-fenced.md'), '# Cites\n\nPer D-8888 and D-405.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/D-8888 has no entry/);
    expect(r.stderr).not.toMatch(/D-405 has no entry/);
  });

  it('a FROZEN RECORD may cite a D-nnn that does not resolve (history, not drift)', () => {
    writeLog(SAMPLE_LOG);
    // docs/journey/ is a frozen record for citation purposes: build-log.md and
    // the DECISION-LOG itself are append-only chronological records, so an old
    // entry's citation is history. The log is the ANCHOR AUTHORITY, never a
    // citation source policed against itself.
    writeFileSync(join(sandbox, 'docs', 'journey', 'build-log.md'), '# Build log\n\nSee D-9999.\n');
    writeFileSync(join(sandbox, 'CHANGELOG.md'), '# Changelog\n\nShipped per D-9999.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('the DECISION-LOG itself is not policed against its own anchors', () => {
    writeLog(`${SAMPLE_LOG}\n\nA prose citation to D-9999 inside the record.\n`);
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('honors the same-line suppression marker on a D-nnn', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(
      join(sandbox, 'specs', 'reserved.md'),
      '# Reserved\n\nReserved for D-9999. <!-- validate-docs: ignore -->\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('skips D-nnn inside fenced code blocks and inline-code spans', () => {
    writeLog(SAMPLE_LOG);
    writeFileSync(
      join(sandbox, 'specs', 'fenced.md'),
      '# Fenced\n\n```\nD-9999\n```\n\nAnd inline `D-9998` too.\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('is SKIPPED (not fail-open-silently) when the DECISION-LOG is absent', () => {
    // A sandbox/fixture root has no log; reporting one missing FILE as N
    // citation errors would be noise. Deletion of the real log is caught by
    // the registry family's direction 2 (it is a backticked manifest entry).
    writeFileSync(join(sandbox, 'specs', 'nolog.md'), '# No log\n\nSee D-9999.\n');
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  // ====================================================================
  // The ANCHOR side: no two entries may claim the same id (v0.6.6 sweep)
  // ====================================================================
  //
  // The citation check above asks "does this id RESOLVE?" and is structurally
  // blind to the duplicate: two entries shipped as D-439 (Task 264's hygiene
  // entry, Task 265's scheduler entry) a day apart, and every citation to
  // either one resolved cleanly for a week. That is worse than a dangling
  // reference — a dangling one fails loudly, an ambiguous one reads as correct
  // while pointing at whichever entry the reader lands on first.

  it('FAILS when two entry headings claim the same id, naming BOTH line numbers', () => {
    writeLog(
      [
        '# Decision log',
        '',
        '## 2026-08-08 — D-500 · FIX — the first claimant',
        '',
        'Body.',
        '',
        '## 2026-08-08 — D-500 · FIX — the second, which has to move',
        '',
      ].join('\n'),
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(1);
    expect(r.stderr).toMatch(/D-500 is already claimed/);
    // Reported against the SECOND site (the one that must renumber), naming
    // the first so the reader can see both without opening the file.
    expect(r.stderr).toMatch(/DECISION-LOG\.md:7:/);
    expect(r.stderr).toMatch(/docs\/journey\/DECISION-LOG\.md:3/);
  });

  it('catches a duplicate SPLIT ACROSS the live log and its archive', () => {
    // The union is what citations resolve against, so the uniqueness question
    // is a union question — a per-file check would miss the split case that
    // the Task-249 archive boundary makes possible.
    writeLog('# Decision log\n\n## 2026-08-08 — D-501 · FIX — in the live log\n');
    writeFileSync(
      join(sandbox, 'docs', 'journey', 'DECISION-LOG-archive-pre-v0.5.md'),
      '# Archive\n\n## 2026-01-02 — D-501 · DECISION — in the archive\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/D-501 is already claimed/);
  });

  it('passes on a log whose entry ids are unique, and says so in the summary', () => {
    writeLog(SAMPLE_LOG);
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toMatch(/ids unique/);
  });

  // ── The false-positive edges. Each of these repeats an id in a HEADING and
  // must NOT fail: the check compares only the entry-id SLOT (first em dash,
  // then the `·`/`:` separator), because a false positive here fails the build
  // on correct history.

  it('a heading that CITES another entry alongside its own id is not a duplicate', () => {
    writeLog(
      [
        '# Decision log',
        '',
        '## 2026-08-09 — D-443 · FIX — the path covered the D-427 orphan all along',
        '',
        '## 2026-08-08 — D-427 · BUG — the orphan itself',
        '',
      ].join('\n'),
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('an older archive shape that REPORTS on its own decision is not a duplicate', () => {
    // Two real archive entries have this shape (`D-266 SHIPPED: …`, `D-270
    // RESEARCH DONE: …`) — an id followed by a WORD, not by the type
    // separator. They report on a decision that already has its own entry, so
    // a looser "first D-token in the heading" rule would indict frozen history.
    writeLog('# Decision log\n\n## 2026-07-04 — D-266 · DECISION — the decision itself\n');
    writeFileSync(
      join(sandbox, 'docs', 'journey', 'DECISION-LOG-archive-pre-v0.5.md'),
      '# Archive\n\n## 2026-07-04 — D-266 SHIPPED: Task 198 merged (the D-266 decision executed)\n',
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('a duplicate id inside a FENCE is an example, not a second claim', () => {
    writeLog(
      [
        '# Decision log',
        '',
        '## 2026-08-08 — D-502 · FIX — the only real entry',
        '',
        'The heading shape looks like this:',
        '',
        '```',
        '## 2026-08-08 — D-502 · FIX — an illustration',
        '```',
        '',
      ].join('\n'),
    );
    const r = runValidator(sandbox);
    expect(r.exitCode, r.stdout + r.stderr).toBe(0);
  });

  it('reports the indexed D-entry count in the family summary', () => {
    writeLog(SAMPLE_LOG);
    const r = runValidator(sandbox);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/D-entr(y|ies) indexed/);
  });
});

describe('parseDecisionIds — the heading/lead shapes the real log uses', () => {
  it('indexes every shape, and does not index a bare prose citation', () => {
    const ids = parseDecisionIds(
      [
        '# Decision log',
        '## 2026-07-27 — D-405 · DECISION — separator is a middot',
        '## 2026-07-20 — D-375: DECISION — separator is a colon',
        '- **⚙️ DECISION (2026-06-14) — D-150: bold list-item lead**',
        '- **✅ FIX + RESOLUTION of D-149 (2026-06-27) — D-213: id not first in lead**',
        '- **D-1 DECISION — id at the very start**',
        '- **📝 NOTE — D-253a: the sub-lettered shape**',
        '- **⚙️ DECISION — D-185/186/187: a slash continuation in a lead**',
        '',
        'Prose body citing D-9999, which must NOT become an anchor.',
        '_Relates D-9998._',
        '',
        '```',
        '## 2026-01-01 — D-8888 · DECISION — a fenced EXAMPLE, not an entry',
        '```',
        '',
        '- **⚙️ DECISION — `D-7777` inside an inline-code span is illustrative**',
      ].join('\n'),
    );
    expect([...ids].sort()).toEqual(
      ['1', '149', '150', '185', '186', '187', '213', '253a', '375', '405'].sort(),
    );
  });

  it('the REAL log GLOB indexes the corpus (and the two Task-247 backfills resolve)', () => {
    // INPUT CHANGED by Task 249, contract UNCHANGED and now stronger.
    // 247 deliberately made the validator's anchor source a GLOB
    // (`docs/journey/DECISION-LOG*.md`, parsed per-file and unioned) so that
    // 249's archive split would not dangle every pre-split citation. 249 then
    // split the log at D-306. This test read ONE file, so after the split it
    // was measuring half the corpus and asserting on ids (D-1, D-132, D-168,
    // D-213) that had legitimately moved to the archive — the fixture went
    // stale, not the contract. It now feeds the same glob the validator does.
    const logDir = join(REPO_ROOT, 'docs', 'journey');
    const sources = readdirSync(logDir)
      .filter((f) => f.startsWith('DECISION-LOG') && f.endsWith('.md'))
      .sort();
    expect(sources.length, 'the log is a glob, not a file (Task 247/249)').toBeGreaterThanOrEqual(2);

    const ids = new Set();
    for (const f of sources) {
      for (const id of parseDecisionIds(readFileSync(join(logDir, f), 'utf8'))) ids.add(id);
    }
    expect(ids.size).toBeGreaterThan(300);
    for (const id of ['1', '132', '168', '213', '405', '253a', '258a', '203c']) {
      expect(ids.has(id), `D-${id} must be indexed from the real log glob`).toBe(true);
    }
  });

  it('Task 249: the split is a UNION — each half supplies its own ids, neither alone is enough', () => {
    // The load-bearing half of the archive split: an old citation resolves from
    // the ARCHIVE and a recent one from the LIVE log, so neither file may be
    // dropped from the glob without breaking real citations.
    const logDir = join(REPO_ROOT, 'docs', 'journey');
    const live = parseDecisionIds(readFileSync(join(logDir, 'DECISION-LOG.md'), 'utf8'));
    const archived = parseDecisionIds(
      readFileSync(join(logDir, 'DECISION-LOG-archive-pre-v0.5.md'), 'utf8'),
    );
    // D-307 is the v0.5.0 tag decision — the stated boundary.
    expect(live.has('307'), 'D-307 (the v0.5.0 cut) stays LIVE').toBe(true);
    expect(live.has('406'), 'the newest entry stays LIVE').toBe(true);
    expect(live.has('1'), 'D-1 moved to the archive').toBe(false);
    expect(archived.has('306'), 'D-306 is the newest ARCHIVED entry').toBe(true);
    expect(archived.has('1'), 'D-1 is in the archive').toBe(true);
    expect(archived.has('307'), 'D-307 did not get archived').toBe(false);
  });
});
