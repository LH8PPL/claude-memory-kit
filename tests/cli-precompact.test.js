// @doors: 1, 2, 3, 5
// Door 1 (Response): shouldPreCompact / runPreCompact return {action, reason, ...}.
// Door 2 (State): now.md drains into today-{date}.md — the roll actually banked.
// Door 3 (External calls): the REAL hook bin is driven as a subprocess; its
//   never-block stdout contract + the detached worker spawn are asserted.
// Door 4 N/A: no message-queue surface in the kit.
// Door 5 (Observability): every path appends one NDJSON line to precompact.log.
//
// Task 235 (D-364) — PreCompact capture.
//
// THE GAP, stated precisely (the task's premise, SHARPENED here — see D-376):
// it is NOT that context is lost at compaction. capture-turn already appends
// every completed turn to now.md, so the buffer is durable on disk before
// PreCompact ever fires. The real gap is that the now→today ROLL has only two
// triggers, and NEITHER fires during a long session:
//
//   - SessionEnd  — Claude Code fires it ONLY on a clean window-close, so a
//                   marathon session that is never cleanly closed never rolls
//                   (the Task-105/D-75 class; the v0.4.0 dogfood grew now.md
//                   to 410 KB exactly this way).
//   - SessionStart-lazy — fires at the START of the NEXT session, i.e. too
//                   late to help the session that is compacting right now.
//
// PreCompact is the THIRD roll trigger, and the only one that fires DURING a
// marathon session. That is the whole value: it bounds now.md and consolidates
// the buffer at the one moment we know the session is long.
//
// THE NEVER-BLOCK CONTRACT (primary-source verified 2026-07-20 against
// code.claude.com/docs/en/hooks): a PreCompact hook CAN block compaction —
// `{"decision": "block"}` or exit 2. The kit must NEVER do that. Blocking a
// user's compaction to bank memory would be the kit holding the session
// hostage; the whole posture is fail-open. So the bin emits no `decision` and
// always exits 0, and this file pins that both ways.
//
// WHY THE WORK IS DETACHED: nothing here is urgent (the buffer is already on
// disk), so making the user wait on an LLM compress at every compaction would
// buy nothing and cost seconds of visible latency. The hook gates cheaply,
// spawns a detached worker, and returns — the same posture as
// capture-turn → auto-extract and inject-context → compress-lazy.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  shouldPreCompact,
  runPreCompact,
  precompactWorkerSpawnDescriptor,
  PRECOMPACT_LOG_REL,
} from '../packages/cli/src/precompact.mjs';
import { MockHaikuBackend } from '../packages/cli/src/compressor.mjs';
import { touchCooldownMarker } from '../packages/cli/src/cooldown.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOOK_BIN = join(REPO_ROOT, 'packages', 'cli', 'bin', 'cmk-precompact.mjs');

let sandbox;
let projectRoot;

function sessionsDir() {
  return join(projectRoot, 'context', 'sessions');
}

function seedNow(body) {
  writeFileSync(join(sessionsDir(), 'now.md'), body, 'utf8');
}

function readNow() {
  const p = join(sessionsDir(), 'now.md');
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function todayFiles() {
  return readdirSync(sessionsDir()).filter((f) => /^today-\d{4}-\d{2}-\d{2}\.md$/.test(f));
}

function logLines() {
  const p = join(projectRoot, ...PRECOMPACT_LOG_REL);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function backendReturning(summary) {
  return new MockHaikuBackend({
    responses: [
      { outputText: summary, inputTokens: 100, outputTokens: 30, costUSD: 0.0002, preservedIds: [] },
    ],
  });
}

/** A realistic PreCompact payload — the exact documented field set. */
function payload({ trigger = 'auto' } = {}) {
  return JSON.stringify({
    session_id: 'sess-abc123',
    transcript_path: join(sandbox, 'transcript.jsonl'),
    cwd: projectRoot,
    permission_mode: 'default',
    hook_event_name: 'PreCompact',
    trigger,
  });
}

function runHookBin(input, extraEnv = {}) {
  return spawnSync(process.execPath, [HOOK_BIN], {
    input,
    encoding: 'utf8',
    timeout: 20_000,
    env: { ...process.env, CMK_PROJECT_DIR: projectRoot, ...extraEnv },
  });
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-precompact-'));
  projectRoot = join(sandbox, 'proj');
  mkdirSync(join(projectRoot, 'context', 'sessions'), { recursive: true });
  mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
  // The install marker — the Task-250 health log refuses to write without it,
  // so a bare tier would silently exercise the no-op path (M2).
  writeFileSync(join(projectRoot, 'context', 'MEMORY.md'), '# MEMORY\n', 'utf8');
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

describe('Task 235 — the cheap inline gate', () => {
  it('runs when now.md carries buffered turns (the marathon-session case)', () => {
    seedNow('## 2026-07-20T10:00:00Z — turn\nreal content\n');
    const r = shouldPreCompact({ projectRoot });
    expect(r.run).toBe(true);
  });

  it('SKIPS an empty buffer — nothing to roll, so no LLM call is worth spending', () => {
    seedNow('   \n\n  ');
    expect(shouldPreCompact({ projectRoot })).toMatchObject({ run: false, reason: 'empty-buffer' });
  });

  it('SKIPS a missing now.md entirely', () => {
    expect(shouldPreCompact({ projectRoot })).toMatchObject({ run: false, reason: 'empty-buffer' });
  });

  it('SKIPS when the shared Haiku cooldown is active (budget already spent)', () => {
    seedNow('## turn\ncontent\n');
    touchCooldownMarker({ projectRoot });
    expect(shouldPreCompact({ projectRoot })).toMatchObject({ run: false, reason: 'cooldown' });
  });

  it('SKIPS a project with no context/sessions dir (kit not installed here)', () => {
    const bare = join(sandbox, 'bare');
    mkdirSync(bare, { recursive: true });
    expect(shouldPreCompact({ projectRoot: bare })).toMatchObject({ run: false, reason: 'no-context-dir' });
  });

  it('a LARGE buffer is gated without reading it whole (hot-path bound)', () => {
    // now.md is the one kit file with no write-side cap — bounding it is what
    // this task exists for — so the gate must not read it whole just to ask
    // "is it blank?". Above the probe size the answer is decided on stat alone.
    seedNow('x'.repeat(200_000));
    expect(shouldPreCompact({ projectRoot })).toMatchObject({ run: true });
  });

  it('a whitespace-only buffer UNDER the probe size is still detected as empty', () => {
    // The read still happens below the threshold, so the gate agrees with
    // compressSession's own `buffer.trim() === ''` check exactly.
    seedNow('\n\n   \t\n  ');
    expect(shouldPreCompact({ projectRoot })).toMatchObject({ run: false, reason: 'empty-buffer' });
  });

  it('never throws on a garbage projectRoot (fail-open — a gate must not wedge a hook)', () => {
    expect(() => shouldPreCompact({})).not.toThrow();
    expect(shouldPreCompact({}).run).toBe(false);
  });
});

describe('Task 235 — the roll actually banks', () => {
  it('drains now.md into today-{date}.md (Door 2 — the whole point)', async () => {
    seedNow('## 2026-07-20T10:00:00Z — turn\nwe chose Postgres for staging\n');
    const r = await runPreCompact({
      projectRoot,
      backend: backendReturning('## Decisions\n- chose Postgres for staging\n'),
    });

    expect(r.action).not.toBe('error');
    expect(todayFiles().length, 'a day file must be written').toBe(1);
    const banked = readFileSync(join(sessionsDir(), todayFiles()[0]), 'utf8');
    expect(banked).toContain('Postgres');
    expect((readNow() ?? '').trim(), 'now.md must be drained after a successful roll').toBe('');
  });

  it('a backend failure leaves now.md INTACT — the buffer is never lost to a failed roll', async () => {
    const buffer = '## 2026-07-20T10:00:00Z — turn\nirreplaceable content\n';
    seedNow(buffer);
    const r = await runPreCompact({
      projectRoot,
      backend: new MockHaikuBackend({ throwError: new Error('haiku down') }),
    });

    expect(r.action).toBe('error');
    expect(readNow(), 'a failed compress must restore the buffer verbatim').toBe(buffer);
    expect(todayFiles(), 'no day file on failure — never a half-truth on disk').toEqual([]);
  });

  it('is fail-open: a missing backend returns an error result, it does NOT throw', async () => {
    seedNow('## turn\ncontent\n');
    await expect(runPreCompact({ projectRoot })).resolves.toBeDefined();
  });
});

describe('Task 235 — the double-fire guard (PreCompact → SessionEnd)', () => {
  it('CONCURRENT rollers: only ONE compresses — the atomic claim is the real mutex', async () => {
    // The guard that matters, pinned honestly (skill-review, 2026-07-20). An
    // earlier docstring claimed the cooldown marker and the drained buffer were
    // two INDEPENDENT guards. They are not: touchCooldownMarker fires only on
    // compressSession's SUCCESS path, so two rollers whose gate-checks both land
    // before either finishes its Haiku call BOTH read "not in cooldown". The
    // only thing between them is claimNowBuffer's atomic rename (§16.27) — one
    // renameSync wins, the loser sees ENOENT and skips before calling the
    // backend. The sequential test below cannot see this; it awaits the first
    // roll, so the marker is already hot and the buffer already drained.
    seedNow('## 2026-07-20T10:00:00Z — turn\ncontested buffer\n');
    const backend = new MockHaikuBackend({
      responses: [
        { outputText: '## Decisions\n- roller A\n', inputTokens: 100, outputTokens: 30, costUSD: 0.0002, preservedIds: [] },
        { outputText: '## Decisions\n- roller B\n', inputTokens: 100, outputTokens: 30, costUSD: 0.0002, preservedIds: [] },
      ],
    });

    // Deliberately NOT awaited in sequence — both gate-check before either lands.
    const [a, b] = await Promise.all([
      runPreCompact({ projectRoot, backend }),
      runPreCompact({ projectRoot, backend }),
    ]);

    expect(backend.calls.length, 'exactly one roller may reach the backend').toBe(1);
    expect(todayFiles().length, 'exactly one day file').toBe(1);
    // One compressed, one skipped — never two compressions, never two errors.
    const actions = [a.action, b.action].sort();
    expect(actions.filter((x) => x === 'compressed')).toHaveLength(1);
  });


  it('a second run right after a successful roll does NOT double-write', async () => {
    seedNow('## 2026-07-20T10:00:00Z — turn\nfirst content\n');
    await runPreCompact({ projectRoot, backend: backendReturning('## Decisions\n- first\n') });

    const after = readFileSync(join(sessionsDir(), todayFiles()[0]), 'utf8');

    // The SessionEnd hook fires seconds later. It must find nothing to do —
    // both because now.md is drained AND because the cooldown marker is hot.
    const second = await runPreCompact({
      projectRoot,
      backend: backendReturning('## Decisions\n- SHOULD NOT APPEAR\n'),
    });

    expect(second.action).toBe('skipped');
    expect(todayFiles().length, 'still exactly one day file').toBe(1);
    expect(readFileSync(join(sessionsDir(), todayFiles()[0]), 'utf8')).toBe(after);
    expect(after).not.toContain('SHOULD NOT APPEAR');
  });
});

describe('Task 235 — Door 5: every path is observable', () => {
  it('logs one NDJSON line on a successful roll, carrying the trigger', async () => {
    seedNow('## turn\ncontent\n');
    await runPreCompact({
      projectRoot,
      backend: backendReturning('## Decisions\n- x\n'),
      trigger: 'manual',
    });
    const lines = logLines();
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatchObject({ scope: 'precompact', trigger: 'manual' });
    expect(typeof lines[0].duration_ms).toBe('number');
  });

  it('logs the SKIP reason too — a silent no-op is undiagnosable', async () => {
    seedNow('  ');
    await runPreCompact({ projectRoot, backend: backendReturning('unused') });
    expect(logLines()[0]).toMatchObject({ action: 'skipped', reason: 'empty-buffer' });
  });

  it('logs the FAILURE with its error category', async () => {
    seedNow('## turn\ncontent\n');
    await runPreCompact({
      projectRoot,
      backend: new MockHaikuBackend({ throwError: new Error('haiku down') }),
    });
    expect(logLines()[0]).toMatchObject({ action: 'error' });
  });
});

describe('Task 235 — the REAL hook bin (Door 3)', () => {
  it('NEVER blocks compaction: exit 0, and no `decision` field in stdout', () => {
    seedNow('## turn\ncontent\n');
    const r = runHookBin(payload({ trigger: 'auto' }));

    expect(r.status, `stderr: ${r.stderr}`).toBe(0);
    const out = JSON.parse(r.stdout.trim());
    // The load-bearing assertion: `decision: "block"` would hold the user's
    // compaction hostage. The kit must never emit it, on any path.
    expect(out).not.toHaveProperty('decision');
    expect(out.continue).toBe(true);
  });

  it('still exits 0 and emits valid JSON when the payload is GARBAGE (fail-open)', () => {
    seedNow('## turn\ncontent\n');
    const r = runHookBin('not json at all{{{');
    expect(r.status).toBe(0);
    expect(() => JSON.parse(r.stdout.trim())).not.toThrow();
    expect(JSON.parse(r.stdout.trim())).not.toHaveProperty('decision');
  });

  it('exits 0 on an EMPTY payload and on a project with no kit installed', () => {
    const bare = join(sandbox, 'nokit');
    mkdirSync(bare, { recursive: true });
    const r = spawnSync(process.execPath, [HOOK_BIN], {
      input: '',
      encoding: 'utf8',
      timeout: 20_000,
      env: { ...process.env, CMK_PROJECT_DIR: bare },
    });
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout.trim())).not.toHaveProperty('decision');
  });

  it('records the compaction event + the spawn decision (the audit trail)', () => {
    seedNow('## turn\nreal buffered content\n');
    runHookBin(payload({ trigger: 'manual' }));

    const lines = logLines();
    expect(lines.length, 'the hook itself logs, before any worker runs').toBeGreaterThanOrEqual(1);
    const hookLine = lines.find((l) => l.scope === 'precompact-hook');
    expect(hookLine, 'the hook leg must be observable').toBeTruthy();
    expect(hookLine).toMatchObject({ trigger: 'manual', spawned: true });
  });

  it('does NOT spawn a worker when the gate says skip (no wasted LLM budget)', () => {
    seedNow('   '); // empty buffer → nothing to roll
    runHookBin(payload());
    const hookLine = logLines().find((l) => l.scope === 'precompact-hook');
    expect(hookLine).toMatchObject({ spawned: false, reason: 'empty-buffer' });
  });

  // Task 253(c) — the detached worker's cwd is the OS temp dir, never the
  // working tree. The worker outlives the hook, so its cwd handle would
  // otherwise pin the project directory (Windows stale-handle race). It reads
  // its root from argv[2] + CMK_PROJECT_DIR, so it never needed the cwd.
  it('Door 3 — the detached worker descriptor pins cwd to tmpdir(), root carried by argv + env', () => {
    const d = precompactWorkerSpawnDescriptor({
      workerPath: '/w/cmk-precompact-worker.mjs',
      projectRoot: '/proj',
      trigger: 'manual',
    });
    expect(d.command).toBe(process.execPath);
    expect(d.args).toEqual(['/w/cmk-precompact-worker.mjs', '/proj']);
    expect(d.options.cwd).toBe(tmpdir());
    expect(d.options.detached).toBe(true);
    expect(d.options.stdio).toBe('ignore');
    expect(d.options.windowsHide).toBe(true);
    expect(d.options.env.CMK_PROJECT_DIR).toBe('/proj');
    expect(d.options.env.CMK_PRECOMPACT_TRIGGER).toBe('manual');
  });

  it('Door 3 — with NO project root the worker INHERITS cwd (never tmpdir): the child would otherwise scaffold memory in the temp dir', () => {
    // The guard is load-bearing, not ceremony: the worker's last-resort root is
    // `process.cwd()`, so pinning tmpdir without a root to hand over would make
    // it write a memory tree into the temp directory.
    for (const projectRoot of [undefined, '', null]) {
      const d = precompactWorkerSpawnDescriptor({
        workerPath: '/w/cmk-precompact-worker.mjs',
        projectRoot,
        trigger: 'auto',
      });
      expect(d.options.cwd, `projectRoot=${JSON.stringify(projectRoot)}`).toBeUndefined();
    }
  });

  it('Door 3 — BOTH hook bins (npm + plugin) spawn through the shared descriptor (no twin drift)', () => {
    for (const rel of ['packages/cli/bin/cmk-precompact.mjs', 'plugin/bin/cmk-precompact.mjs']) {
      const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
      expect(src, rel).toContain('precompactWorkerSpawnDescriptor');
      // The old inline options object must be gone — a second copy is exactly
      // how the two bins drift apart.
      expect(src, rel).not.toMatch(/detached:\s*true,\s*\n\s*stdio:/);
    }
  });

  it('RETURNS FAST — the user is never made to wait on memory work', () => {
    seedNow('## turn\ncontent\n');
    const t0 = Date.now();
    runHookBin(payload());
    // Generous bound: this asserts "does not run the LLM inline", not a
    // stopwatch. An inline compress would be 20-80s (D-179 measurements).
    expect(Date.now() - t0).toBeLessThan(10_000);
  });
});

// --- Task 250: the precompact half of the health log (Door 5) -----------------
// The precompact worker is DETACHED and writes its result only to a stderr
// nobody reads (stdio:'ignore'), so a crashed worker is invisible unless
// something durable records it. The health entry is that record -- and it rides
// the SAME funnel as the precompact log, so the two can never disagree.
describe('Task 250 -- runPreCompact appends health outcomes (Door 5)', () => {
  function readHealth() {
    const p = join(projectRoot, 'context', '.locks', 'health.log');
    if (!existsSync(p)) return [];
    return readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  }

  it('a successful roll appends precompact-failing:ok', async () => {
    seedNow('## 2026-08-01T10:00:00Z — turn\nwe chose Postgres for staging\n');
    const r = await runPreCompact({
      projectRoot,
      backend: backendReturning('## Decisions\n- chose Postgres for staging\n'),
    });
    expect(r.action).not.toBe('error');
    const health = readHealth();
    expect(health).toHaveLength(1);
    expect(health[0]).toMatchObject({ class: 'precompact-failing', outcome: 'ok', schema: 1 });
  });

  it('a backend failure appends precompact-failing:fail', async () => {
    seedNow('## 2026-08-01T10:00:00Z — turn\nirreplaceable content\n');
    const r = await runPreCompact({
      projectRoot,
      backend: new MockHaikuBackend({ throwError: new Error('haiku down') }),
    });
    expect(r.action).toBe('error');
    const health = readHealth();
    expect(health).toHaveLength(1);
    expect(health[0]).toMatchObject({ class: 'precompact-failing', outcome: 'fail' });
  });

  it('a gate SKIP appends nothing -- a run that never happened is not evidence', async () => {
    seedNow('   '); // empty buffer -> the gate skips before any backend call
    const r = await runPreCompact({ projectRoot, backend: backendReturning('x') });
    expect(r.action).toBe('skipped');
    expect(readHealth()).toEqual([]);
  });

  it('OVER-MUTATION GUARD: the health append leaves precompact.log own entry intact', async () => {
    seedNow('## 2026-08-01T10:00:00Z — turn\ncontent worth banking\n');
    await runPreCompact({ projectRoot, backend: backendReturning('## Decisions\n- something\n') });
    expect(logLines().filter((e) => e.scope === 'precompact')).toHaveLength(1);
  });
});
