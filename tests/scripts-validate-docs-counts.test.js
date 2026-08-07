// @doors: 1
// Door 1 (Response): the pure extract/check functions return claims + errors.
// Door 2 N/A: a validator reads; it writes nothing to disk.
// Door 3 N/A: no subprocess — the family imports the live registries directly.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: reporting is the validator's stdout + exit code, not an NDJSON
//   log. The end-to-end reporting contract (FAIL names the line + both numbers,
//   exit 1 on drift / 0 when clean) is pinned by the `--only counts` subprocess
//   smoke at the bottom of THIS file — skill-review caught the earlier header
//   crediting a test in scripts-validate-docs.test.js that did not exist.
//
// Task 236 (D-364) — the `counts` family: prose count-claims can't drift.
//
// THE DRIFT CLASS: sentences like "12 MCP tools" / "41 CLI verbs" are
// hand-maintained numbers about collections the code owns. We have hand-fixed
// them ~6 times across v0.4–v0.6, always after someone noticed.
//
// WHY A GENERIC SCAN, NOT A LOCATION LIST (the prior-art finding, D-375 triage):
// ECC ships this exact gate — and it hand-enumerates 40 doc locations, each with
// its own file + regex. Their `WORKING-CONTEXT.md` is in NONE of them, which is
// precisely the file measured 4 months stale (claiming 47/79/181 while their
// tree held 67/94/278). Their gate runs green in CI and the staleness ships
// anyway: it checked 40 places and the drift happened in the 41st. Drift lands
// wherever you did not enumerate — so we SCAN, and a new doc is covered the day
// it is written rather than the day someone remembers to register it.

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractCountClaims,
  checkCounts,
  isFrozenRecord,
  COUNT_COLLECTIONS,
} from '../scripts/validate-docs.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('Task 236 — extracting count claims from prose', () => {
  it('finds a digit claim about a kit-owned collection', () => {
    const got = extractCountClaims('The kit ships 12 MCP tools today.');
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ n: 12, collection: 'mcpTools' });
  });

  it('finds a spelled-out claim (the mcp-server.mjs header says "Twelve tools")', () => {
    const got = extractCountClaims('Twelve MCP tools are registered.');
    expect(got[0]).toMatchObject({ n: 12, collection: 'mcpTools' });
  });

  it('recognises every collection the kit owns', () => {
    const text = [
      'there are 41 CLI verbs',
      'the 12 health checks run in order',
      'we ship 5 agent profiles',
    ].join('\n');
    const found = extractCountClaims(text).map((c) => c.collection).sort();
    expect(found).toEqual(['agentProfiles', 'cliVerbs', 'healthChecks']);
  });

  it('reports the LINE of each claim so a failure is navigable', () => {
    const got = extractCountClaims('intro\n\nthe kit has 12 MCP tools\n');
    expect(got[0].line).toBe(3);
  });

  it('ignores numbers that are not about a kit collection (no false positives)', () => {
    const text = [
      'the 60s hook ceiling',
      'we cloned 14 repos',
      'a 10 KB snapshot',
      '3 tiers of memory',
      'Node 20 and Node 24',
    ].join('\n');
    expect(extractCountClaims(text)).toEqual([]);
  });

  it('does not fire on a VERSION that happens to precede a collection word', () => {
    // "v0.6.0 adds MCP tools" has no count — the number is a version.
    expect(extractCountClaims('v0.6.0 adds MCP tools')).toEqual([]);
  });

  it('does not fire on IDENTIFIER-shaped numbers (found by running it for real)', () => {
    // Every one of these is from the kit's own corpus. A task/issue/PR number
    // adjacent to a collection noun is an identifier, not a count — and this
    // class produced absurd readings like "5873 MCP tools" before it was fixed.
    const text = [
      'Task 108 added MCP tools to the surface',
      'kirodotdev/Kiro#5873 for MCP tools is closed',
      'issue 4672 covers MCP tools',
      'PR 313 touched 0 CLI verbs',           // "PR 313" is an id; "0 CLI verbs" is real
      'see #226 for MCP tools',
    ].join('\n');
    const claims = extractCountClaims(text);
    expect(claims.map((c) => c.n)).not.toContain(108);
    expect(claims.map((c) => c.n)).not.toContain(5873);
    expect(claims.map((c) => c.n)).not.toContain(4672);
    expect(claims.map((c) => c.n)).not.toContain(226);
  });
});

describe('Task 236 — the gate BITES (the load-bearing half)', () => {
  const live = { mcpTools: 12, cliVerbs: 41, healthChecks: 12, agentProfiles: 5 };

  it('FAILS on a stale count — a wrong number is an error, not a warning', () => {
    const docs = [{ path: 'README.md', text: 'the kit ships 9 MCP tools' }];
    const errors = checkCounts({ docs, live });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/README\.md/);
    expect(errors[0]).toMatch(/9/);
    expect(errors[0]).toMatch(/12/);
  });

  it('PASSES a correct count', () => {
    const docs = [{ path: 'README.md', text: 'the kit ships 12 MCP tools' }];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('catches drift in a doc NOBODY registered — the ECC failure mode', () => {
    // The whole point of scanning: this doc is not on any hand-maintained list.
    const docs = [{ path: 'docs/SOME-NEW-DOC.md', text: 'all 7 health checks pass' }];
    const errors = checkCounts({ docs, live });
    expect(errors, 'a doc nobody enumerated must still be checked').toHaveLength(1);
    expect(errors[0]).toMatch(/SOME-NEW-DOC/);
  });

  it('reports EVERY drifted claim, not just the first', () => {
    const docs = [
      { path: 'README.md', text: 'we have 9 MCP tools and 3 agent profiles' },
    ];
    expect(checkCounts({ docs, live })).toHaveLength(2);
  });
});

describe('Task 236 — frozen records are exempt (history is not drift)', () => {
  const live = { mcpTools: 12, cliVerbs: 41, healthChecks: 12, agentProfiles: 5 };

  it('a release note legitimately naming an OLD count does NOT fail', () => {
    // CHANGELOG / DECISION-LOG / research notes / ADRs record a moment in time.
    // "Updating" them to match today's code would be a bug (the D-249 rule).
    const docs = [
      { path: 'CHANGELOG.md', text: 'v0.4.0 shipped 9 MCP tools' },
      { path: 'docs/journey/DECISION-LOG.md', text: 'at the time there were 8 CLI verbs' },
      { path: 'docs/research/2026-01-01-note.md', text: 'the kit had 4 health checks then' },
      { path: 'docs/adr/0001-something.md', text: '3 agent profiles existed' },
    ];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('the MEMORY TIER is a frozen record too — captured facts are history', () => {
    // Found by running the family for real: `context/` is the kit's own memory,
    // and a fact saying "v0.3.5 verified all 9 health checks pass" is CORRECTLY
    // recorded history. Editing one to match today's code would corrupt the
    // memory the kit exists to keep — the same reason docs/research is exempt.
    const docs = [
      { path: 'context/memory/project_v0-3-5-verified.md', text: 'all 9 health checks pass' },
      { path: 'context/DECISIONS.md', text: 'shipped with 11 MCP tools' },
      { path: 'context/transcripts/2026-06-15.md', text: 'the 31 CLI verbs today' },
      { path: 'context.local/machine-paths.md', text: '3 agent profiles here' },
    ];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('the external-project catalog is exempt — those counts are somebody else\'s', () => {
    // Also found by running it for real: the collection nouns are not
    // kit-exclusive. Every count in SOURCES.md describes another project's
    // surface ("14 MCP tools" = theirs), so the doc can only produce noise.
    const docs = [{
      path: 'docs/SOURCES.md',
      text: '- **someproject** — a server exposing 14 MCP tools and ~40 CLI verbs',
    }];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('an inline suppression marker exempts one deliberate line', () => {
    const docs = [{
      path: 'README.md',
      text: 'historically 9 MCP tools <!-- validate-docs: ignore -->',
    }];
    expect(checkCounts({ docs, live })).toEqual([]);
  });
});

describe('Task 236 — skill-review regressions', () => {
  const live = { mcpTools: 12, cliVerbs: 41, healthChecks: 12, agentProfiles: 5 };

  it('a SINGULAR noun modifying another word is not a count claim', () => {
    // "6 MCP tool descriptions" is not a claim that 6 tools exist — a real
    // count of 6 would say "tools". Bare singulars fired on this shape and
    // would have failed the build on correct prose.
    const docs = [
      { path: 'docs/CLI.md', text: 'This release touched 6 MCP tool descriptions.' },
      { path: 'docs/CLI.md', text: 'We auto-register 1 MCP tool automatically on install.' },
      { path: 'docs/CLI.md', text: 'each health check prints 3 health check lines' },
    ];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('DELIBERATELY does not match singulars at all — the cost of that conservatism', () => {
    // Restricting singulars to a count of one was tried and still could not
    // separate "auto-register 1 MCP tool automatically" (incidental) from
    // "ships 1 agent profile" (a real claim). No cheap rule distinguishes them,
    // so the family accepts the miss rather than risk failing correct prose.
    // This test PINS the trade-off so it is a decision, not an accident.
    const docs = [{ path: 'README.md', text: 'the kit ships 1 agent profile' }];
    expect(checkCounts({ docs, live }), 'a singular claim is knowingly unchecked').toEqual([]);
  });

  it('LIVE cut-gate checklists are NOT frozen — only the dated guides are', () => {
    // The exemption that hid real drift: docs/process/ holds BOTH dated
    // point-in-time guides AND checklists re-run every cut. Blanket-exempting
    // the directory reproduced the ECC failure inside the fix for it.
    expect(isFrozenRecord('docs/process/cut-gate-kiro.md')).toBe(false);
    expect(isFrozenRecord('docs/process/cut-gate.md')).toBe(false);
    expect(isFrozenRecord('docs/process/v0.2.0-self-test-guide.md')).toBe(true);
    expect(isFrozenRecord('docs/process/v0.1.1-scenario-test.md')).toBe(true);
  });

  it('Task 249: specs/tasks-archive.md is FROZEN, its live source tasks.md is NOT', () => {
    // `specs/` is the Spine, so it is deliberately NOT a record prefix — which
    // left the completed-task archive (Task 249) policed as live prose the day
    // it appeared. Its entries are shipped-task retrospectives verbatim, thick
    // with counts that were true on their ship date ("HC-1..HC-9", "6 tools"),
    // so it needs its own entry. The debt Task 247 flagged; paid here.
    expect(isFrozenRecord('specs/tasks-archive.md')).toBe(true);
    expect(isFrozenRecord('specs/tasks.md'), 'the LIVE plan stays checked').toBe(false);
    expect(isFrozenRecord('specs/design.md')).toBe(false);
    // Named individually, NOT by a `specs/*-archive.md` glob — a future specs/
    // archive must be a deliberate addition, never an accidental exemption.
    expect(isFrozenRecord('specs/requirements-archive.md')).toBe(false);
  });

  it('Task 249: a historical count inside the task archive does not fail the build', () => {
    const live = { mcpTools: 12, cliVerbs: 41, healthChecks: 12, agentProfiles: 5 };
    const docs = [
      { path: 'specs/tasks-archive.md', text: 'Task 37 shipped `cmk doctor` with 9 health checks.' },
      { path: 'docs/journey/build-log-archive-pre-v0.5.md', text: 'back then there were 8 CLI verbs' },
      { path: 'docs/journey/DECISION-LOG-archive-pre-v0.5.md', text: 'v0.4.0 shipped 9 MCP tools' },
    ];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('backticked and hyphenated-adjective claims are still caught', () => {
    expect(extractCountClaims('the kit ships `9 MCP tools`')[0]).toMatchObject({ n: 9 });
    expect(extractCountClaims('there are 9 kit-owned MCP tools')[0]).toMatchObject({ n: 9 });
  });
});

describe('Task 236 — Door 5: the end-to-end reporting contract', () => {
  it('exits 1 and names the drift; exits 0 when clean', () => {
    const repo = mkdtempSync(join(tmpdir(), 'cmk-counts-e2e-'));
    try {
      const doc = join(repo, 'GUIDE.md');
      writeFileSync(doc, 'the kit ships 999 MCP tools\n', 'utf8');
      const bad = spawnSync(
        process.execPath,
        [join(REPO_ROOT, 'scripts', 'validate-docs.mjs'), '--only', 'counts'],
        { encoding: 'utf8', timeout: 60_000, env: { ...process.env, CMK_VALIDATOR_ROOT: repo } },
      );
      expect(bad.status, 'drift must exit non-zero').toBe(1);
      expect(bad.stderr).toMatch(/GUIDE\.md/);
      expect(bad.stderr).toMatch(/999/);

      writeFileSync(doc, 'the kit ships plenty of MCP tools\n', 'utf8');
      const good = spawnSync(
        process.execPath,
        [join(REPO_ROOT, 'scripts', 'validate-docs.mjs'), '--only', 'counts'],
        { encoding: 'utf8', timeout: 60_000, env: { ...process.env, CMK_VALIDATOR_ROOT: repo } },
      );
      expect(good.status, 'clean must exit zero').toBe(0);
      expect(good.stdout).toMatch(/counts:/);
    } finally {
      rmSync(repo, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });
});

describe('Task 236 — a nested repo COPY is not this repo (the worktree fix)', () => {
  // An agent worktree under `.claude/worktrees/` is a second checkout of this
  // repo at a DIFFERENT commit. Scanning it reports its prose as drift against
  // the primary checkout's live registry — findings for docs nobody should
  // edit, at a commit nobody is on — and a LOCKED worktree made `npm test`
  // unrunnable here (2026-08-08). The first fix hardcoded that one path; this
  // pins the general property, because a vendored clone or a `git clone` a
  // contributor happens to leave in the tree is the same second copy.
  //
  // Driven through the REAL script, because the skip lives in the walk: a unit
  // test of the check function would prove the predicate and not the pruning.
  const run = (root) =>
    spawnSync(
      process.execPath,
      [join(REPO_ROOT, 'scripts', 'validate-docs.mjs'), '--only', 'counts'],
      { encoding: 'utf8', timeout: 60_000, env: { ...process.env, CMK_VALIDATOR_ROOT: root } },
    );

  // A worktree's `.git` is a FILE (`gitdir: …`); a clone's is a directory.
  // Both mean "a repo starts here", so both must prune.
  for (const [shape, plant] of [
    ['a worktree (.git FILE)', (d) => writeFileSync(join(d, '.git'), 'gitdir: /elsewhere\n', 'utf8')],
    ['a clone (.git DIR)', (d) => mkdirSync(join(d, '.git'))],
  ]) {
    it(`skips ${shape} — its prose is correct at its own commit`, () => {
      const repo = mkdtempSync(join(tmpdir(), 'cmk-worktree-'));
      try {
        const copy = join(repo, 'vendor', 'second-copy');
        mkdirSync(copy, { recursive: true });
        plant(copy);
        writeFileSync(join(copy, 'GUIDE.md'), 'the kit ships 777 MCP tools\n', 'utf8');

        // Direction 1: the copy alone is invisible — a clean tree stays clean.
        const clean = run(repo);
        expect(clean.status, `${clean.stdout}\n${clean.stderr}`).toBe(0);
        expect(`${clean.stdout}${clean.stderr}`).not.toMatch(/777/);

        // Direction 2 (the load-bearing half): the SAME stale doc OUTSIDE the
        // copy still fails, so the skip prunes a repo copy and not the scan.
        writeFileSync(join(repo, 'GUIDE.md'), 'the kit ships 999 MCP tools\n', 'utf8');
        const dirty = run(repo);
        expect(dirty.status).toBe(1);
        expect(dirty.stderr).toMatch(/GUIDE\.md/);
        expect(dirty.stderr).toMatch(/999/);
        // …and still only the one finding — the copy did not join in.
        expect(dirty.stderr).not.toMatch(/777/);
      } finally {
        rmSync(repo, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
      }
    });
  }

  it('prunes at the COPY, not at its parent — siblings of a copy are still scanned', () => {
    // `vendor/` holds the copy; a doc that is `vendor/`'s own must not vanish
    // with it. A skip that walked up one level would be silent about real drift.
    const repo = mkdtempSync(join(tmpdir(), 'cmk-worktree-sib-'));
    try {
      const copy = join(repo, 'vendor', 'second-copy');
      mkdirSync(copy, { recursive: true });
      writeFileSync(join(copy, '.git'), 'gitdir: /elsewhere\n', 'utf8');
      writeFileSync(join(copy, 'GUIDE.md'), 'the kit ships 777 MCP tools\n', 'utf8');
      writeFileSync(join(repo, 'vendor', 'NOTES.md'), 'the kit ships 888 MCP tools\n', 'utf8');

      const r = run(repo);
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/NOTES\.md/);
      expect(r.stderr).toMatch(/888/);
      expect(r.stderr).not.toMatch(/777/);
    } finally {
      rmSync(repo, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });
});

describe('Task 236 — the collection registry', () => {
  it('every collection declares how to resolve its LIVE count', () => {
    for (const [name, cfg] of Object.entries(COUNT_COLLECTIONS)) {
      expect(Array.isArray(cfg.nouns), `${name} needs nouns`).toBe(true);
      expect(cfg.nouns.length, `${name} needs at least one noun`).toBeGreaterThan(0);
    }
  });

  it('covers the four collections the kit hand-maintains counts for', () => {
    expect(Object.keys(COUNT_COLLECTIONS).sort()).toEqual([
      'agentProfiles', 'cliVerbs', 'healthChecks', 'mcpTools',
    ]);
  });
});

describe('Task 236 — the HC range notation is a count claim in disguise', () => {
  const live = { mcpTools: 12, cliVerbs: 41, healthChecks: 12, agentProfiles: 5 };

  it('catches a stale HC-1..HC-N range (how the cut-gate guides actually phrase it)', () => {
    const docs = [{ path: 'docs/process/cut-gate.md', text: 'doctor emits 11 checks (HC-1..HC-11)' }];
    const errors = checkCounts({ docs, live });
    expect(errors, 'the bare noun "checks" is too generic to match — the RANGE is not').toHaveLength(1);
    expect(errors[0]).toMatch(/HC-1\.\.HC-11/);
  });

  it('accepts a current range', () => {
    const docs = [{ path: 'README.md', text: 'all checks (HC-1..HC-12) pass' }];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('skips the two docs that narrate build history inline', () => {
    // A shipped [x] entry naming HC-1..HC-9 is what existed then. Both files
    // would need ~15 inline markers apiece to say what one exemption says.
    const docs = [
      { path: 'specs/tasks.md', text: '- [x] 137. doctor had HC-1..HC-9 at the time' },
      { path: 'specs/design.md', text: 'the original set was HC-1..HC-5' },
    ];
    expect(checkCounts({ docs, live })).toEqual([]);
  });

  it('a memory tier at ANY depth is frozen, not just the repo root', () => {
    expect(isFrozenRecord('packages/cli/context/transcripts/2026-06-19.md')).toBe(true);
    expect(isFrozenRecord('context/memory/x.md')).toBe(true);
  });
});
