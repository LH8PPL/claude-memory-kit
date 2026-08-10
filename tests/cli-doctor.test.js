// @doors: 1, 2, 5
// Door 3 N/A: doctor no longer spawns a subprocess — the memsearch checks
//   (HC-1/HC-7, the only spawns) were removed in Task 120; all 7 checks are
//   in-process file ops.
// Door 4 N/A: no message-queue interaction.

// Tests for Task 37 — `cmk doctor` health checks HC-1..HC-7 (T-031).
// Per tasks.md 37.6:
//   1. All 7 HCs run in order; report line per check (PASS / FAIL / SKIP)
//   2. Full run completes within 5s on 10k-observation fixture
//   3. Failed HC (e.g., HC-1 missing hook): repair command surfaced
//   4. HC-6 active: log shows active:true + file count + last_modified
//   5. HC-6 inactive: log shows active:false
//   6. HC-7 stale lock present: report includes the lock's recoveryCommand
//   (the original memsearch install-requiring case is gone with Task 120)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { runDoctor } from '../packages/cli/src/doctor.mjs';
import { generateId } from '../packages/canonicalize/src/index.mjs';
import { install } from '../packages/cli/src/install.mjs';
import { markCronRegistered } from '../packages/cli/src/lazy-compress.mjs';

let sandbox;
let projectRoot;
let userDir;

async function makeFixture() {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-doctor-test-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  // noHooks: scaffold-only. As of Task 49 `install` wires hooks into
  // .claude/settings.json by default; the HC-1 unit tests below want to
  // control the settings.json shape themselves (absent / empty / flat /
  // nested), so the fixture must NOT pre-write hooks. The install→doctor
  // integration (hooks ON → HC-1 pass) is its own test below.
  await install({ projectRoot, userTier: userDir, noHooks: true });
}

function seedRecentMd(ageMs) {
  const dir = join(projectRoot, 'context', 'sessions');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'recent.md');
  writeFileSync(path, '## Decisions\n- something\n', 'utf8');
  if (ageMs !== undefined) {
    const t = (Date.now() - ageMs) / 1000;
    utimesSync(path, t, t);
  }
}

function seedTranscript(name, ageMs) {
  const dir = join(projectRoot, 'context', 'transcripts');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  writeFileSync(path, '# transcript\n', 'utf8');
  if (ageMs !== undefined) {
    const t = (Date.now() - ageMs) / 1000;
    utimesSync(path, t, t);
  }
}

function seedSettingsJson(content) {
  const dir = join(projectRoot, '.claude');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(content), 'utf8');
}

// A `--ide kiro` install: the kit's hooks live in .kiro/hooks/*.kiro.hook,
// NOT .claude/settings.json. Used by the HC-1 Kiro-aware tests below.
function seedKiroHooks({ capture = true, inject = true } = {}) {
  const dir = join(projectRoot, '.kiro', 'hooks');
  mkdirSync(dir, { recursive: true });
  if (capture) {
    writeFileSync(
      join(dir, 'cmk-capture.kiro.hook'),
      JSON.stringify({ when: { type: 'agentStop' }, then: { type: 'runCommand', command: 'cmd.exe /c cmk hook stop' } }),
      'utf8',
    );
  }
  if (inject) {
    writeFileSync(
      join(dir, 'cmk-inject.kiro.hook'),
      JSON.stringify({ when: { type: 'promptSubmit' }, then: { type: 'runCommand', command: 'cmd.exe /c cmk hook promptSubmit' } }),
      'utf8',
    );
  }
}

beforeEach(async () => {
  await makeFixture();
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('Task 37 — runDoctor (cmk doctor health checks)', () => {
  describe('Validation (Door 1)', () => {
    it('rejects missing projectRoot', async () => {
      const r = await runDoctor({ userDir });
      expect(r.action).toBe('error');
      expect(r.errors).toEqual(expect.arrayContaining(['projectRoot is required']));
    });
  });

  describe('37.6 #1 — all 9 HCs run in order; pass/fail/skip per check', () => {
    // Contract update Task 141a: HC-8 (native bindings / npm 12 readiness).
    // Contract update Task 162: HC-9 (version-drift / update-path, D-176) joined.
    // Contract update Task 200: HC-11 (backend CLI present, D-272/D-277) joined —
    // count + order extended, intent preserved.
    // Contract update Task 210: HC-12 (deletion propagation, D-308) joined.
    // Contract update Task 248: HC-13 (stray-tier backstop, D-389/D-394) joined.
    // Contract update Task 250: HC-14 (active health warnings, D-412) joined.
    // Contract update Task 261: HC-15 (semantic vector mapping, D-421) joined.
    // Contract update Task 270: HC-16 (fact reachability, D-427) joined.
    it('emits exactly 16 checks with id HC-1..HC-16 in order', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      expect(r.action).toBe('completed');
      expect(r.checks.length).toBe(16);
      const ids = r.checks.map((c) => c.id);
      expect(ids).toEqual([
        'HC-1', 'HC-2', 'HC-3', 'HC-4', 'HC-5', 'HC-6', 'HC-7', 'HC-8', 'HC-9', 'HC-10', 'HC-11', 'HC-12', 'HC-13',
        'HC-14', 'HC-15', 'HC-16',
      ]);
      // Every check has the canonical shape. `warn` joined the status enum in
      // Task 245 (advisory: repair shown, exit code untouched) and HC-13 uses it.
      for (const c of r.checks) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('status');
        expect(c).toHaveProperty('message');
        expect(['pass', 'warn', 'fail', 'skip']).toContain(c.status);
      }
    });
  });

  // Task 270 (D-427). HC-16 answers a question no other check asks: did the
  // fact make it INTO the index at all? HC-4 compares INDEX.md's entry COUNT
  // against the file count (the committed markdown surface, not the DB), and
  // HC-15 audits whether an INDEXED fact's vector is its own. Between them sat
  // the population this task found: a fact file that is durably on disk, that
  // no DB-backed route can see, and that nothing counted as missing.
  describe('HC-16 — every fact on disk is reachable in the index (Task 270 / D-427)', () => {
    // The exact shape of the live finding: an id outside the base32 alphabet.
    const BAD_ID = 'P-5678ABCD'; // validate-test-ids: ignore

    function seedRawFact(slug, frontmatterLines, body = 'a durable fact body') {
      const dir = join(projectRoot, 'context', 'memory');
      mkdirSync(dir, { recursive: true });
      const p = join(dir, `${slug}.md`);
      writeFileSync(p, `---\n${frontmatterLines.join('\n')}\n---\n\n${body}\n`, 'utf8');
      return p;
    }

    const goodFrontmatter = (id) => [
      `id: ${id}`,
      'type: project',
      'title: A fact',
      'created_at: 2026-08-06T10:00:00Z',
      'write_source: user-explicit',
      'trust: high',
      'source_file: t',
      'source_line: 1',
      'source_sha1: abc',
    ];

    it('PASSes on a project whose facts all carry valid ids', async () => {
      const { writeFact } = await import('../packages/cli/src/write-fact.mjs');
      writeFact({
        tier: 'P', type: 'project', slug: 'reachable', title: 'Reachable',
        body: 'this fact is perfectly normal', writeSource: 'user-explicit', trust: 'high',
        sourceFile: 't', sourceLine: 1, sourceSha1: 'abc', projectRoot,
      });
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('pass');
      expect(hc16.message).toContain('indexable');
    });

    it('FAILs and names a fact whose id fails ID_PATTERN — the D-427 orphan shape', async () => {
      seedRawFact('project_orphan', goodFrontmatter(BAD_ID));
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('fail');
      // Names the FILE, so the user can find it without knowing the mechanism.
      expect(hc16.message).toContain('project_orphan.md');
      // `cmk install` is what runs the id repair (recoverMemory) — the reindex
      // it would otherwise suggest cannot fix an id the parser rejects.
      expect(hc16.recoveryCommand).toBe('cmk install');
    });

    it('FAILs on a fact with NO id at all (the same unreachable population)', async () => {
      seedRawFact('project_noid', goodFrontmatter('').filter((l) => !l.startsWith('id:')));
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('fail');
      expect(hc16.message).toContain('project_noid.md');
    });

    it('SKIPs when there are no fact files yet — never a FAIL on an empty project', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('skip');
    });

    // REGRESSION GUARD for a false alarm this check shipped with and the live
    // probe caught (Task 270). The SQLite index is rebuilt LAZILY on read, so a
    // freshly-written fact legitimately has no `observations` row until the next
    // search. An earlier draft asserted DB membership and therefore FAILED on a
    // healthy project — install → remember → search → remember reported the
    // second fact as "INVISIBLE … indistinguishable from a lost one" when the
    // very next search surfaced it fine. A check that cries wolf on the normal
    // steady state is worse than no check, so the verdict now comes from the
    // index PARSER (can this ever be indexed?), never from index membership.
    it('does NOT fail a valid fact that is merely not in the index yet (lazy-index steady state)', async () => {
      const { writeFact } = await import('../packages/cli/src/write-fact.mjs');
      writeFact({
        tier: 'P', type: 'project', slug: 'freshly-written', title: 'Fresh',
        body: 'written just now and never searched for', writeSource: 'user-explicit',
        trust: 'high', sourceFile: 't', sourceLine: 1, sourceSha1: 'abc', projectRoot,
      });
      // Deliberately no search / no reindex --full: this is the state a project
      // is in immediately after every single capture.
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('pass');
    });

    // B1 — HC-16 scans the USER tier too, and its recovery must actually reach
    // it. `cmk persona import` writes the whole bundle (`fragments/` included)
    // with plain writeFileSync, bypassing writeFact's id boundary, so a bundle
    // exported from a pre-boundary corpus can carry an unusable id onto a
    // different machine. Before D-446 `recoverMemory` repaired ['P','L'] only,
    // so HC-16 would flag such a fact, prescribe `cmk install`, install would
    // repair nothing, and doctor would fail forever — the non-convergent loop
    // HC-16's own contract refuses to create.
    it('FAILs a bad-id fact in the USER tier (the persona-import population)', async () => {
      const fragments = join(userDir, 'fragments');
      mkdirSync(fragments, { recursive: true });
      writeFileSync(
        join(fragments, 'user_imported-persona-fact.md'),
        `---\n${goodFrontmatter(BAD_ID).join('\n')}\n---\n\na fact that rode in on a persona bundle\n`,
        'utf8',
      );
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('fail');
      expect(hc16.message).toContain('user_imported-persona-fact.md');
      expect(hc16.recoveryCommand).toBe('cmk install');
    });

    it('and the prescribed `cmk install` recovery actually repairs it (no fail-forever loop)', async () => {
      const fragments = join(userDir, 'fragments');
      mkdirSync(fragments, { recursive: true });
      const p = join(fragments, 'user_imported-persona-fact.md');
      writeFileSync(
        p,
        `---\n${goodFrontmatter(BAD_ID).join('\n')}\n---\n\na fact that rode in on a persona bundle\n`,
        'utf8',
      );
      const { recoverMemory } = await import('../packages/cli/src/memory-recovery.mjs');
      const report = recoverMemory({ projectRoot, userDir });
      expect(report.action).toBe('completed');
      expect(report.repaired.map((x) => x.tier)).toContain('U');

      // The convergence assertion: the very next doctor run passes.
      const after = await runDoctor({ projectRoot, userDir });
      expect(after.checks.find((c) => c.id === 'HC-16').status).toBe('pass');
      expect(readFileSync(p, 'utf8')).toContain('legacy_id:');
    });

    // The >5 truncation branch — an unexercised format path is where a crash
    // hides on the day it finally matters.
    it('truncates the named list at 5 and counts the remainder', async () => {
      for (let i = 0; i < 7; i++) {
        seedRawFact(`project_bad${i}`, goodFrontmatter(BAD_ID), `body number ${i}`);
      }
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('fail');
      expect(hc16.message).toContain('7 of 7');
      expect(hc16.message).toContain('(+2 more)');
      // exactly five named
      expect((hc16.message.match(/project_bad\d\.md/g) || [])).toHaveLength(5);
    });

    // A valid id is not sufficient — index-rebuild also skips a fact missing the
    // provenance trio, and those never self-heal either.
    it('FAILs a fact with a valid id but missing write_source/trust/created_at', async () => {
      seedRawFact('project_thin', [
        `id: ${generateId('P', 'thin fact body')}`,
        'type: project',
        'title: Thin',
      ]);
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('fail');
      expect(hc16.message).toContain('project_thin.md');
      // NOT the id-repair recovery — `cmk install` cannot fix a missing field.
      expect(hc16.recoveryCommand).toBeUndefined();
    });

    // The over-mutation guard's read-only sibling: a check that reports one bad
    // fact must not misreport its healthy neighbours.
    it('counts only the unreachable fact, leaving valid neighbours out of the tally', async () => {
      const { writeFact } = await import('../packages/cli/src/write-fact.mjs');
      for (const slug of ['n_one', 'n_two', 'n_three']) {
        writeFact({
          tier: 'P', type: 'project', slug, title: slug,
          body: `body for ${slug}`, writeSource: 'user-explicit', trust: 'high',
          sourceFile: 't', sourceLine: 1, sourceSha1: 'abc', projectRoot,
        });
      }
      seedRawFact('project_orphan', goodFrontmatter(BAD_ID));
      const r = await runDoctor({ projectRoot, userDir });
      const hc16 = r.checks.find((c) => c.id === 'HC-16');
      expect(hc16.status).toBe('fail');
      expect(hc16.message).toMatch(/\b1\b/);
      expect(hc16.message).not.toContain('n_one');
      expect(hc16.message).not.toContain('n_two');
      expect(hc16.message).not.toContain('n_three');
    });
  });

  // I3 — the D-377 "41st location" class, applied to CODE strings.
  // `validate-docs --only counts` resolves count claims in living DOCS against
  // the live registry, but it cannot see a string literal inside a .mjs — and
  // that is exactly where two stale claims were found (`cmk --help` saying
  // "HC-1..HC-15", a viewer comment saying "all 14 doctor checks"). A prose rule
  // would rot the same way, so the count claim that remains in code is pinned
  // here against what runDoctor ACTUALLY returns. The viewer comment was made
  // count-free instead — the cheapest fix for a number nobody needs.
  describe('I3 — code-string HC counts track the live registry', () => {
    it('the `cmk doctor` --help description names the real highest HC number', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const highest = Math.max(...r.checks.map((c) => Number(c.id.replace('HC-', ''))));
      const src = readFileSync(
        join(process.cwd(), 'packages', 'cli', 'src', 'subcommands.mjs'),
        'utf8',
      );
      const claim = src.match(/run health checks HC-1\.\.HC-(\d+)/);
      expect(claim, 'the doctor --help description should carry an HC range').not.toBeNull();
      expect(Number(claim[1])).toBe(highest);
    });

    // D-446 / the B1 live probe. `runDoctorCli` hardcoded
    // `join(homedir(), '.core-memory-kit')`, which ignores MEMORY_KIT_USER_DIR —
    // the kit's own sandbox/override mechanism. So every USER-TIER check (HC-16's
    // new arm, HC-7's stale locks) audited a different directory than the one
    // `cmk install` repairs. The probe caught it exactly: install fixed the
    // planted U-tier orphan while doctor reported "no fact files yet".
    //
    // Scoped deliberately to the doctor entry point, which is what this task
    // touched. 17 OTHER sites in subcommands.mjs still hardcode the same join —
    // a pre-existing shared-module violation, reported rather than swept here.
    it('the doctor CLI resolves the user tier through the SHARED resolver, not an inline homedir join', () => {
      const src = readFileSync(
        join(process.cwd(), 'packages', 'cli', 'src', 'subcommands.mjs'),
        'utf8',
      );
      const body = src.slice(
        src.indexOf('async function runDoctorCli('),
        src.indexOf('async function runDoctorCli(') + 1200,
      );
      expect(body).toContain('defaultUserDir()');
      expect(body).not.toContain("join(homedir(), '.core-memory-kit')");
    });

    it('no kit source file claims a stale literal doctor-check COUNT', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const live = r.checks.length;
      const srcDir = join(process.cwd(), 'packages', 'cli', 'src');
      const stale = [];
      for (const f of readdirSync(srcDir).filter((f) => f.endsWith('.mjs'))) {
        for (const m of readFileSync(join(srcDir, f), 'utf8').matchAll(
          /\b(\d{1,3})\s+doctor checks\b/g,
        )) {
          if (Number(m[1]) !== live) stale.push(`${f}: "${m[0]}" (live is ${live})`);
        }
      }
      expect(stale).toEqual([]);
    });
  });

  describe('HC-10 — scheduled compaction liveness (Task 167 / D-207, informational)', () => {
    it('SKIPs when no cron is registered (the default — the lazy roll covers it)', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const hc10 = r.checks.find((c) => c.id === 'HC-10');
      expect(hc10).toBeDefined();
      expect(hc10.status).toBe('skip');
    });

    it('FLAGS a dead cron (stale heartbeat) — informational, never prescribes a manual heal', async () => {
      const { recordCronHeartbeat, cronHeartbeatPath } = await import('../packages/cli/src/compaction-state.mjs');
      const { utimesSync } = await import('node:fs');
      recordCronHeartbeat({ projectRoot });
      // Age the heartbeat past the 48h TTL.
      const hb = cronHeartbeatPath(projectRoot);
      const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      utimesSync(hb, old, old);

      const r = await runDoctor({ projectRoot, userDir });
      const hc10 = r.checks.find((c) => c.id === 'HC-10');
      expect(hc10.status).toBe('fail');
      // Informational: tells the user it self-heals; NEVER a "run cmk compress" chore.
      expect(hc10.message.toLowerCase()).toContain('self-heal');
      expect(hc10).not.toHaveProperty('recoveryCommand');
    });

    it('PASSES on a live cron (fresh heartbeat)', async () => {
      const { recordCronHeartbeat } = await import('../packages/cli/src/compaction-state.mjs');
      recordCronHeartbeat({ projectRoot }); // fresh
      const r = await runDoctor({ projectRoot, userDir });
      const hc10 = r.checks.find((c) => c.id === 'HC-10');
      expect(hc10.status).toBe('pass');
    });

    // Task 203 (D-298) — "watch the watchmen": the false-green fix. A FRESH
    // heartbeat + a STALE recent.md is the starvation tell (the cron fires +
    // heartbeats, then is killed before the distill completes). HC-10 must
    // report this as FAIL, not paper over it with the heartbeat alone. This
    // test seeds the exact broken state HC-10 reported PASS on for 5 days.
    it('FAILS on a fresh heartbeat but a STALE recent.md — the starvation false-green (D-298)', async () => {
      const { recordCronHeartbeat } = await import('../packages/cli/src/compaction-state.mjs');
      const { utimesSync, writeFileSync, mkdirSync } = await import('node:fs');
      const { join } = await import('node:path');
      recordCronHeartbeat({ projectRoot }); // heartbeat FRESH (cron fired)
      // recent.md exists but is 5 days old (the distill work never completed).
      const sessions = join(projectRoot, 'context', 'sessions');
      mkdirSync(sessions, { recursive: true });
      const recentPath = join(sessions, 'recent.md');
      writeFileSync(recentPath, '## Decisions\n- stale\n', 'utf8');
      const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      utimesSync(recentPath, old, old);

      const r = await runDoctor({ projectRoot, userDir });
      const hc10 = r.checks.find((c) => c.id === 'HC-10');
      expect(hc10.status).toBe('fail'); // NOT the old false-green PASS
      // The message must name the fresh-heartbeat-stale-output tell so the user
      // isn't reassured by the heartbeat.
      expect(hc10.message.toLowerCase()).toContain('fresh');
      expect(hc10.message).toContain('recent.md');
      expect(hc10.recoveryCommand).toBe('cmk daily-distill');
    });
  });

  describe('HC-11 — backend CLI present (Task 200 / D-272/D-277)', () => {
    // The beforeEach install() writes .claude/settings.json → detectInstallKind
    // returns claude-code → HC-11 probes for the `claude` CLI. Inject the probe so
    // the test never spawns a real binary.
    it('PASSES when the backend agent CLI is present (probe reports present)', async () => {
      const backendCliProbe = () => ({ agent: 'claude', bin: 'claude', present: true });
      const r = await runDoctor({ projectRoot, userDir, backendCliProbe });
      const hc11 = r.checks.find((c) => c.id === 'HC-11');
      expect(hc11).toBeDefined();
      expect(hc11.status).toBe('pass');
      expect(hc11.message).toMatch(/claude/i);
    });

    it('FAILS with a helpful message when the backend CLI is missing (the D-270 degrade)', async () => {
      const backendCliProbe = () => ({
        agent: 'kiro',
        bin: 'kiro-cli',
        present: false,
        reason: 'kiro-cli not found on PATH',
      });
      const r = await runDoctor({ projectRoot, userDir, backendCliProbe });
      const hc11 = r.checks.find((c) => c.id === 'HC-11');
      expect(hc11.status).toBe('fail');
      // Names the missing CLI + says the automatic features are degraded, NOT broken.
      expect(hc11.message).toMatch(/kiro-cli/);
      expect(hc11.message.toLowerCase()).toMatch(/automatic|compress|extract|memor/);
      // Honest degrade: capture/search/recall still work (file-only), so the
      // message must not imply total failure.
      expect(hc11.message.toLowerCase()).not.toMatch(/broken|crashed|fatal/);
    });
  });

  describe('HC-9 — version drift (Task 162 / D-176)', () => {
    it('PASSES on a freshly-installed project (project marker == installed binary)', async () => {
      // The beforeEach install() stamps the CURRENT kit version into CLAUDE.md, so a
      // doctor run with the real binary version sees no drift.
      const r = await runDoctor({ projectRoot, userDir });
      const hc9 = r.checks.find((c) => c.id === 'HC-9');
      expect(hc9.status).toBe('pass');
    });

    it('FAILS with "cmk install" when the installed binary is NEWER than the project marker', async () => {
      // Simulate the user having updated the global cli (binary 99.0.0) without
      // re-running install in this (older-stamped) project — the D-172 drift case.
      const r = await runDoctor({ projectRoot, userDir, kitVersion: '99.0.0' });
      const hc9 = r.checks.find((c) => c.id === 'HC-9');
      expect(hc9.status).toBe('fail');
      expect(hc9.recoveryCommand).toBe('cmk install');
      expect(hc9.message).toMatch(/99\.0\.0/);
    });
  });

  describe('37.6 #2 — full run completes promptly (regression guard, not a production-timing measurement)', () => {
    it('finishes well inside a non-pathological ceiling', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      // The production NFR is ~5s (design §5/§14). doctor is now pure in-process
      // file ops (the memsearch subprocess spawns were removed in Task 120), so
      // it's fast — but this test runs alongside 700+ concurrent vitest files
      // (and under `npm run stress`, 5× back-to-back), and an absolute `< 5000`
      // wall-clock assertion flaked at 5028ms under that load (2026-05-31) on an
      // inherently load-variable measurement. We assert a 10s "not pathological"
      // ceiling instead: it still catches a real regression (a hung HC) without
      // flaking on test-harness concurrency noise.
      expect(r.duration_ms).toBeLessThan(10_000);
    });
  });

  describe('37.6 #3 — failed HC surfaces the repair command', () => {
    it('HC-1 missing settings.json → fail with `cmk repair --hooks`', async () => {
      // install() doesn't drop .claude/settings.json in the test
      // sandbox, so HC-1 fails by default.
      const r = await runDoctor({ projectRoot, userDir });
      const c2 = r.checks.find((c) => c.id === 'HC-1');
      expect(c2.status).toBe('fail');
      expect(c2.recoveryCommand).toBe('cmk repair --hooks');
    });

    it('HC-1 settings.json with missing hooks → fail with repair', async () => {
      seedSettingsJson({ hooks: { Stop: [] } }); // intentionally empty
      const r = await runDoctor({ projectRoot, userDir });
      const c2 = r.checks.find((c) => c.id === 'HC-1');
      expect(c2.status).toBe('fail');
      expect(c2.message).toMatch(/missing hook references/);
    });

    it('HC-1 settings.json with all hooks (flat form) → pass', async () => {
      seedSettingsJson({
        hooks: {
          SessionStart: [{ command: 'cmk-inject-context' }],
          Stop: [{ command: 'cmk-capture-turn' }],
          SessionEnd: [{ command: 'cmk-compress-session' }],
          PreCompact: [{ command: 'cmk-precompact' }],
        },
      });
      const r = await runDoctor({ projectRoot, userDir });
      const c2 = r.checks.find((c) => c.id === 'HC-1');
      expect(c2.status).toBe('pass');
    });

    it('HC-1 settings.json with NESTED-form hooks (the real cmk install / repair shape) → pass', async () => {
      // Regression for the install→doctor composition bug found in Task 49:
      // cmk install + cmk repair --hooks write the canonical nested
      // Anthropic shape `{hooks:[{type,command}]}`, but HC-1 used to only
      // inspect a top-level `e.command`, so it reported fail on hooks the
      // kit itself just wrote. HC-1 now traverses `e.hooks[]`.
      seedSettingsJson({
        hooks: {
          SessionStart: [{ hooks: [{ type: 'command', command: 'cmk-inject-context', timeout: 30 }] }],
          Stop: [{ hooks: [{ type: 'command', command: 'cmk-capture-turn', timeout: 30 }] }],
          SessionEnd: [{ hooks: [{ type: 'command', command: 'cmk-compress-session', timeout: 60 }] }],
          PreCompact: [{ hooks: [{ type: 'command', command: 'cmk-precompact', timeout: 10 }] }],
        },
      });
      const r = await runDoctor({ projectRoot, userDir });
      const c2 = r.checks.find((c) => c.id === 'HC-1');
      expect(c2.status).toBe('pass');
    });

    it('integration: cmk install (hooks ON) → cmk doctor → HC-1 passes', async () => {
      // The full composition: a default `cmk install` wires hooks, and a
      // subsequent `cmk doctor` must report HC-1 pass (not send the user
      // chasing `cmk repair --hooks` on hooks that are already correct).
      const freshSandbox = mkdtempSync(join(tmpdir(), 'cmk-doctor-int-'));
      try {
        const proj = join(freshSandbox, 'proj');
        const usr = join(freshSandbox, 'user');
        await install({ projectRoot: proj, userTier: usr }); // hooks ON (default)
        const r = await runDoctor({ projectRoot: proj, userDir: usr });
        const c2 = r.checks.find((c) => c.id === 'HC-1');
        expect(c2.status).toBe('pass');
      } finally {
        rmSync(freshSandbox, { recursive: true, force: true });
      }
    });

    it('B1 fix: HC-1 detects hook in WRONG event array as fail (not false-pass)', async () => {
      // Skill-review B1: previous substring-on-stringify implementation
      // false-pass'd on hooks wired to wrong events OR mentioned in
      // descriptions/TODOs. This test pins the actual structural walk.
      seedSettingsJson({
        // All three hook names appear, but in the WRONG event arrays.
        hooks: {
          SessionStart: [{ command: 'cmk-compress-session' }], // wrong
          Stop: [{ command: 'cmk-inject-context' }], // wrong
          SessionEnd: [{ command: 'cmk-capture-turn' }], // wrong
        },
      });
      const r = await runDoctor({ projectRoot, userDir });
      const c2 = r.checks.find((c) => c.id === 'HC-1');
      expect(c2.status).toBe('fail');
      // The message should call out missing hooks per their CORRECT event
      expect(c2.message).toMatch(/SessionStart\.cmk-inject-context/);
      expect(c2.message).toMatch(/Stop\.cmk-capture-turn/);
      expect(c2.message).toMatch(/SessionEnd\.cmk-compress-session/);
    });

    it('B1 fix: HC-1 does NOT false-pass on TODO text mentioning the hook names', async () => {
      seedSettingsJson({
        description: 'TODO: wire cmk-inject-context cmk-capture-turn cmk-compress-session',
        hooks: { SessionStart: [], Stop: [], SessionEnd: [] },
      });
      const r = await runDoctor({ projectRoot, userDir });
      const c2 = r.checks.find((c) => c.id === 'HC-1');
      expect(c2.status).toBe('fail');
    });

    // ── HC-1 is agent-aware (v0.4.0 / Task 50 — the cut-gate-kiro live-test find) ──
    // A `--ide kiro` install wires capture/inject through TWO surfaces: the IDE
    // hooks (.kiro/hooks/*.kiro.hook) AND/OR the CLI agent (~/.aws/amazonq/cli-
    // agents/). HC-1 used to hard-check .claude/settings.json → false-FAILed on
    // EVERY Kiro install (D-185). The first fix checked only the IDE hooks →
    // false-FAILed a kiro-cli-only install (D-186). HC-1 now PASSes if EITHER
    // surface is present and FAILs only when NEITHER is.
    //
    // A cmk-owned `.kiro/steering/cmk.md` marks the project as a Kiro install;
    // the `awsDir` override sandboxes the CLI-agent (~/.aws) probe.
    describe('HC-1 — agent-aware (Kiro install)', () => {
      let kiroSandbox;
      let kiroAwsDir;

      function seedKiroMarker() {
        // the cmk-owned steering file → detectInstallKind returns 'kiro'
        const dir = join(projectRoot, '.kiro', 'steering');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'cmk.md'), '---\ninclusion: always\n---\n', 'utf8');
      }
      function seedCliAgent() {
        // a cmk-owned agent at the REAL kiro-cli location ~/.kiro/agents/cmk.json
        // (D-198). Ownership marker lives in `description` (a valid field), NOT a
        // top-level `managedBy` (which kiro-cli `agent validate` rejects).
        const dir = join(kiroAwsDir, 'agents');
        mkdirSync(dir, { recursive: true });
        writeFileSync(
          join(dir, 'cmk.json'),
          JSON.stringify({ name: 'cmk', description: 'core-memory-kit … [core-memory-kit]' }),
          'utf8',
        );
      }

      beforeEach(() => {
        kiroSandbox = mkdtempSync(join(tmpdir(), 'cmk-doctor-kiro-aws-'));
        kiroAwsDir = join(kiroSandbox, 'aws'); // empty by default → no CLI agent
      });
      afterEach(() => {
        rmSync(kiroSandbox, { recursive: true, force: true });
      });

      it('IDE-hooks install (both .kiro.hook present) → HC-1 PASS', async () => {
        seedKiroMarker();
        seedKiroHooks(); // both cmk-capture + cmk-inject
        const r = await runDoctor({ projectRoot, userDir, awsDir: kiroAwsDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        expect(c1.status).toBe('pass'); // NOT a Claude-Code-shaped fail
        expect(c1.message).toMatch(/IDE hooks/);
      });

      it('kiro-cli-only install (NO IDE hooks, but a cmk CLI agent in ~/.aws) → HC-1 PASS (D-186)', async () => {
        seedKiroMarker();
        // NO seedKiroHooks — the IDE surface is absent
        seedCliAgent(); // the kiro-cli surface IS present
        const r = await runDoctor({ projectRoot, userDir, awsDir: kiroAwsDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        expect(c1.status).toBe('pass'); // the regression the first fix would have FAILed
        expect(c1.message).toMatch(/CLI agent/);
      });

      it('a partial IDE install (only one hook) still PASSes if the CLI agent is present', async () => {
        seedKiroMarker();
        seedKiroHooks({ capture: true, inject: false });
        seedCliAgent();
        const r = await runDoctor({ projectRoot, userDir, awsDir: kiroAwsDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        expect(c1.status).toBe('pass'); // either-surface capability check
      });

      it('NEITHER surface (Kiro marker but no hooks, no CLI agent) → HC-1 FAIL naming both, --ide kiro repair', async () => {
        seedKiroMarker();
        // no IDE hooks, no CLI agent (empty kiroAwsDir)
        const r = await runDoctor({ projectRoot, userDir, awsDir: kiroAwsDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        expect(c1.status).toBe('fail');
        expect(c1.message).toMatch(/\.kiro\/hooks/); // names the IDE surface
        expect(c1.message).toMatch(/\.kiro\/agents/); // AND the CLI surface (D-198)
        expect(c1.recoveryCommand).not.toBe('cmk repair --hooks'); // not the Claude hint
        expect(c1.recoveryCommand).toMatch(/--ide kiro/);
      });

      it('a stray .kiro/ WITHOUT the cmk marker does NOT flip to Kiro (I2)', async () => {
        // some other tool's .kiro/ dir, no cmk.md steering marker
        mkdirSync(join(projectRoot, '.kiro', 'random'), { recursive: true });
        const r = await runDoctor({ projectRoot, userDir, awsDir: kiroAwsDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        // stays on the Claude-Code path (no .claude/settings.json → Claude fail)
        expect(c1.recoveryCommand).toBe('cmk repair --hooks');
      });

      it('a Claude-Code install is unaffected (no .kiro marker) — still checks .claude/settings.json', async () => {
        const r = await runDoctor({ projectRoot, userDir, awsDir: kiroAwsDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        expect(c1.status).toBe('fail');
        expect(c1.recoveryCommand).toBe('cmk repair --hooks'); // unchanged for Claude Code
      });
    });

    // ── HC-1 is agent-aware for Cursor too (Task 196 — the same D-185 class:
    // a Cursor-only install has no .claude/settings.json, so the Claude-shaped
    // check would false-FAIL every Cursor install with the wrong repair hint).
    // The cmk-owned `.cursor/rules/core-memory-kit.mdc` marks the project as a
    // Cursor install; the hooks surface is `.cursor/hooks.json` carrying the
    // `cmk cursor-hook` dispatcher on the inject + capture events.
    describe('HC-1 — agent-aware (Cursor install, Task 196)', () => {
      function seedCursorMarker() {
        const dir = join(projectRoot, '.cursor', 'rules');
        mkdirSync(dir, { recursive: true });
        writeFileSync(
          join(dir, 'core-memory-kit.mdc'),
          '---\nalwaysApply: true\n---\n\n<!-- core-memory-kit:start -->\nx\n<!-- core-memory-kit:end -->\n',
          'utf8',
        );
      }
      function seedCursorHooks() {
        writeFileSync(
          join(projectRoot, '.cursor', 'hooks.json'),
          JSON.stringify({
            version: 1,
            hooks: {
              sessionStart: [{ command: 'cmd.exe /c cmk cursor-hook' }],
              afterAgentResponse: [{ command: 'cmd.exe /c cmk cursor-hook' }],
            },
          }),
          'utf8',
        );
      }

      it('a wired Cursor install (marker + hooks.json with the dispatcher) → HC-1 PASS', async () => {
        seedCursorMarker();
        seedCursorHooks();
        const r = await runDoctor({ projectRoot, userDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        expect(c1.status).toBe('pass');
        expect(c1.message).toMatch(/cursor/i);
      });

      it('Cursor marker but no hooks.json → HC-1 FAIL with the --ide cursor repair (not the Claude hint)', async () => {
        seedCursorMarker();
        const r = await runDoctor({ projectRoot, userDir });
        const c1 = r.checks.find((c) => c.id === 'HC-1');
        expect(c1.status).toBe('fail');
        expect(c1.recoveryCommand).toMatch(/--ide cursor/);
      });
    });

    // v0.2.0 severity fix: on a FRESH project (nothing distilled yet), a
    // never-built recent.md is "not yet", not a failure — SKIP (lazy-on-read
    // builds it once there's session content). A STALE recent.md is still FAIL.
    it('HC-3 missing recent.md (fresh project) → skip, no repair command', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const c3 = r.checks.find((c) => c.id === 'HC-2');
      expect(c3.status).toBe('skip');
      expect(c3.recoveryCommand).toBeUndefined();
    });

    it('HC-3 fresh recent.md → pass', async () => {
      seedRecentMd(60_000); // 1 minute old
      const r = await runDoctor({ projectRoot, userDir });
      const c3 = r.checks.find((c) => c.id === 'HC-2');
      expect(c3.status).toBe('pass');
    });

    it('HC-3 stale recent.md (>2d) → fail (still a real signal)', async () => {
      seedRecentMd(3 * 24 * 60 * 60 * 1000); // 3 days old
      const r = await runDoctor({ projectRoot, userDir });
      const c3 = r.checks.find((c) => c.id === 'HC-2');
      expect(c3.status).toBe('fail');
      expect(c3.recoveryCommand).toBe('cmk daily-distill');
    });

    // v0.2.0 severity fix: no transcripts yet (fresh project) → SKIP, not FAIL.
    it('HC-4 no transcripts (fresh project) → skip', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const c4 = r.checks.find((c) => c.id === 'HC-3');
      expect(c4.status).toBe('skip');
    });

    it('HC-4 transcripts EXIST but all stale (>3d) → fail (hook may have stopped)', async () => {
      seedTranscript('2026-05-20.md', 5 * 24 * 60 * 60 * 1000); // 5 days old
      const r = await runDoctor({ projectRoot, userDir });
      const c4 = r.checks.find((c) => c.id === 'HC-3');
      expect(c4.status).toBe('fail');
      expect(c4.recoveryCommand).toBeTruthy();
    });

    it('HC-4 transcript within 3d → pass', async () => {
      seedTranscript('2026-05-28.md', 60_000);
      const r = await runDoctor({ projectRoot, userDir });
      const c4 = r.checks.find((c) => c.id === 'HC-3');
      expect(c4.status).toBe('pass');
      expect(c4.message).toMatch(/1 transcript/);
    });

    // v0.2.0 severity fix: cron is optional (lazy-on-read fallback), so its
    // absence is SKIP, not FAIL — a healthy fresh install shouldn't read as broken.
    it('HC-6 no cron sentinel → skip (optional; fallback active)', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const c6 = r.checks.find((c) => c.id === 'HC-5');
      expect(c6.status).toBe('skip');
      expect(c6.message).toMatch(/register-crons/); // command still surfaced, as info
    });

    // Task 47 (D-354) CHANGED THIS CONTRACT ON PURPOSE, and the old assertion
    // is preserved here as a comment rather than deleted, because the change is
    // the whole point of the task: this test used to read
    //
    //     markCronRegistered(...) → expect(HC-5.status).toBe('pass')
    //
    // i.e. "the sentinel the kit wrote is present, therefore cron is healthy" —
    // exactly the reasoning that let a scheduled task point at a dead package
    // path for four nights while HC-5 stayed green. The sentinel now decides
    // only whether cron is IN USE; the health verdict comes from the host.
    //
    // It also has to inject the probe. Without one, this test's result depends
    // on whether the machine running the suite happens to have a real
    // `cmk-daily-distill` task registered — which is how it first failed.
    it('HC-5 sentinel present + the host confirms the registration → pass', async () => {
      markCronRegistered({ projectRoot });
      const r = await runDoctor({
        projectRoot,
        userDir,
        schedulerProbe: () => ({ verdict: 'ok', targetPath: '/x/cmk-daily-distill.mjs', problems: [] }),
      });
      const c6 = r.checks.find((c) => c.id === 'HC-5');
      expect(c6.status).toBe('pass');
    });
  });

  describe('37.6 #4 + #5 — HC-6 native Anthropic Auto Memory detection logs structured entry', () => {
    it('writes single-line JSON snapshot to .locks/native-memory-status.log with active:false when no Anthropic dir exists', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const c8 = r.checks.find((c) => c.id === 'HC-6');
      expect(c8.status).toBe('pass');
      const logPath = join(projectRoot, 'context', '.locks', 'native-memory-status.log');
      expect(existsSync(logPath)).toBe(true);
      const entry = JSON.parse(readFileSync(logPath, 'utf8').trim().split('\n')[0]);
      // For a freshly-installed test sandbox, Anthropic's slug-dir for
      // this path won't exist → active:false.
      expect(entry.active).toBe(false);
      expect(entry.file_count).toBe(0);
    });

    it('Task 60: when autoMemoryEnabled:false is set, HC-6 reports DISABLED + records setting_state (the opt-out is discoverable here)', async () => {
      // Write the committable opt-out into the project settings.json.
      const claudeDir = join(projectRoot, '.claude');
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(join(claudeDir, 'settings.json'), JSON.stringify({ autoMemoryEnabled: false }, null, 2), 'utf8');

      const r = await runDoctor({ projectRoot, userDir });
      const c8 = r.checks.find((c) => c.id === 'HC-6');
      expect(c8.status).toBe('pass');
      expect(c8.message).toMatch(/disabled/i);
      expect(c8.message).toMatch(/sole memory layer/i);

      // Door 4 — the snapshot log records the setting state.
      const logPath = join(projectRoot, 'context', '.locks', 'native-memory-status.log');
      const entry = JSON.parse(readFileSync(logPath, 'utf8').trim().split('\n')[0]);
      expect(entry.setting_state).toBe('disabled');
    });
  });

  describe('37.6 #6 — HC-7 stale locks surface recoveryCommand', () => {
    it('reports stale lock with recoveryCommand when a stale .lock file exists', async () => {
      // Seed a stale lock: pid 999999 (unlikely to be alive)
      const locksDir = join(projectRoot, 'context', '.locks');
      mkdirSync(locksDir, { recursive: true });
      const lockPath = join(locksDir, 'auto-extract.lock');
      writeFileSync(lockPath, '999999\n', 'utf8');
      const r = await runDoctor({ projectRoot, userDir });
      const c9 = r.checks.find((c) => c.id === 'HC-7');
      expect(c9.status).toBe('fail');
      expect(c9.recoveryCommand).toBeTruthy();
      // The lock-discipline emits a platform-aware recoveryCommand
      // (rm on POSIX, Remove-Item on Windows). Just check it's
      // non-empty and references the lock path.
      expect(c9.recoveryCommand).toContain('auto-extract.lock');
    });

    it('passes when no stale locks present', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      const c9 = r.checks.find((c) => c.id === 'HC-7');
      expect(c9.status).toBe('pass');
    });
  });

  describe('no health check requires an installer (memsearch removed, Task 120)', () => {
    it('no check carries requiresInstall — the only install-gated check was memsearch', async () => {
      const r = await runDoctor({ projectRoot, userDir });
      for (const c of r.checks) {
        expect(c.requiresInstall).toBeFalsy();
      }
    });
  });

  describe('HC-4 INDEX.md consistency', () => {
    it('PASS on a freshly-scaffolded project (real INDEX.md template, 0 facts) — Task 85 regression guard', async () => {
      // projectRoot is install()'d in beforeEach, so context/memory/INDEX.md is
      // the REAL scaffold template — which contains an example markdown link
      // `[Title](filename.md)` inside an HTML comment. A too-broad HC-4 regex
      // matches that and false-fails "stale in INDEX" on a clean install. This
      // test exercises the actual scaffold (the hand-written fixtures below do
      // not), which is how the skill-review caught the regression.
      const r = await runDoctor({ projectRoot, userDir });
      const c5 = r.checks.find((c) => c.id === 'HC-4');
      expect(c5.status).toBe('pass');
    });

    it('skip when context/memory/ doesn\'t exist', async () => {
      // install() creates context/memory/ — let's remove it explicitly
      rmSync(join(projectRoot, 'context', 'memory'), { recursive: true, force: true });
      const r = await runDoctor({ projectRoot, userDir });
      const c5 = r.checks.find((c) => c.id === 'HC-4');
      expect(c5.status).toBe('skip');
    });

    // NOTE (Task 85): these fixtures use the kit's REAL fact-file naming
    // `<type>_<slug>.md` (e.g. feedback_layered.md), NOT `<id>.md`. The
    // earlier tests fixtured `P-AAAAAAAA.md` — a name the kit never generates —
    // which is exactly why HC-5's old id-shaped regex passed CI yet false-failed
    // on every real fact file (surfaced live-test-7 2026-06-03). The INDEX line
    // form matches `cmk reindex`'s formatIndexLine: `[slug](type_slug.md)`.
    it('fail when INDEX.md is missing but memory/ has fact files', async () => {
      const memoryDir = join(projectRoot, 'context', 'memory');
      mkdirSync(memoryDir, { recursive: true });
      writeFileSync(join(memoryDir, 'feedback_layered.md'), '---\nid: P-Q7K2M9XR\n---\n\nfact\n', 'utf8');
      // No INDEX.md
      const r = await runDoctor({ projectRoot, userDir });
      const c5 = r.checks.find((c) => c.id === 'HC-4');
      expect(c5.status).toBe('fail');
      expect(c5.recoveryCommand).toBe('cmk reindex');
    });

    it('pass when INDEX.md references all fact files (real <type>_<slug>.md naming)', async () => {
      const memoryDir = join(projectRoot, 'context', 'memory');
      mkdirSync(memoryDir, { recursive: true });
      writeFileSync(join(memoryDir, 'feedback_layered.md'), '---\nid: P-Q7K2M9XR\n---\n\nfact\n', 'utf8');
      writeFileSync(
        join(memoryDir, 'INDEX.md'),
        '# Granular memory index — Project (P)\n\n## Files\n\n- (P-Q7K2M9XR) [feedback] [layered](feedback_layered.md) — a hook\n',
        'utf8',
      );
      const r = await runDoctor({ projectRoot, userDir });
      const c5 = r.checks.find((c) => c.id === 'HC-4');
      expect(c5.status).toBe('pass');
    });

    it('fail when INDEX.md is stale (references a deleted fact file)', async () => {
      const memoryDir = join(projectRoot, 'context', 'memory');
      mkdirSync(memoryDir, { recursive: true });
      writeFileSync(
        join(memoryDir, 'INDEX.md'),
        '# Granular memory index — Project (P)\n\n## Files\n\n- (P-Q7K2M9XR) [feedback] [gone](feedback_gone.md) — a hook\n',
        'utf8',
      );
      const r = await runDoctor({ projectRoot, userDir });
      const c5 = r.checks.find((c) => c.id === 'HC-4');
      expect(c5.status).toBe('fail');
      expect(c5.message).toMatch(/stale in INDEX/);
    });
  });
});
