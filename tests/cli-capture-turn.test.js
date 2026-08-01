// @doors: 1, 2, 3, 4, 5
// Door 4 (Message queues): capture-turn writes the both-turns temp file `.extract-<ts>.tmp` containing USER_TURN: / ASSISTANT_TURN: markers — the kit's queue-of-one IPC surface for the detached auto-extract child (design §17.1 named exception #1). Tests assert the temp-file shape + the spawn args carrying the path.
// Door 5 (Observability): on spawn-failed path, capture-turn now writes an NDJSON entry to `<projectRoot>/context/sessions/{date}.extract.log` with `phase: 'spawn'` + `error_category: 'spawn_failed'` + the failure reason (Task 23.14.3, closes PR-A class-1 audit deferral, 2026-05-27).

// Tests for Task 21 — cmk-capture-turn Stop hook + stop_hook_active
// guard + spawn auto-extract (T-018).
// Per tasks.md 21.6:
//   - Test payload with stop_hook_active:true: hook exits 0;
//     auto-extract lock file NOT created (proves no spawn)
//   - Test stop_hook_active:false: lock file created; transcript
//     appended
//   - Test stop_hook_active absent: same as false
//   - Test hook returns within 50 ms even when spawned subagent is slow
//   - Test transcript captures <retain>important</retain> verbatim;
//     <private>secret</private> replaced
//   - Test parent kill: spawn stub subagent that writes sentinel
//     after 2s; kill parent at 100 ms; assert sentinel appears after
//     2 s (detach proof)
//
// Boundary-test discipline:
//   - captureTurn() is the deep boundary: payload + projectRoot in,
//     transcript-on-disk + detached-child-spawned out.
//   - Auto-extract is stubbed via autoExtractPath arg: tests inject a
//     trivial node script that creates a lock-file sentinel so we can
//     assert "did a spawn happen" without depending on Task 23.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  utimesSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  captureTurn,
  sweepStaleTurnFiles,
  autoExtractSpawnDescriptor,
} from '../packages/cli/src/capture-turn.mjs';
import { redactionsLogPath } from '../packages/cli/src/redactions-log.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..');
const BIN_PATH = join(REPO_ROOT, 'plugin', 'bin', 'cmk-capture-turn' + '.mjs');

function makeFixture() {
  const sandbox = mkdtempSync(join(tmpdir(), 'cmk-capture-turn-test-'));
  const projectRoot = join(sandbox, 'proj');
  mkdirSync(projectRoot, { recursive: true });
  return { sandbox, projectRoot };
}

// A node-runnable stub that mimics the future auto-extract subagent:
// reads its turnFile arg (sanity), writes a lock-file sentinel, sleeps
// optionally, then exits. Used to prove the spawn happened without
// dragging in Task 23's real subagent.
function writeAutoExtractStub(sandbox, { sleepMs = 0, sentinel = 'LOCK' } = {}) {
  const path = join(sandbox, 'stub-auto-extract.mjs');
  const lockFile = join(sandbox, 'auto-extract.lock');
  const body = `
import { writeFileSync } from 'node:fs';
const turnFile = process.argv[2] ?? '';
const lockFile = ${JSON.stringify(lockFile)};
const sleepMs = ${sleepMs};
const sentinel = ${JSON.stringify(sentinel)};
if (sleepMs > 0) {
  setTimeout(() => writeFileSync(lockFile, sentinel + ':' + turnFile, 'utf8'), sleepMs);
} else {
  writeFileSync(lockFile, sentinel + ':' + turnFile, 'utf8');
}
`;
  writeFileSync(path, body, 'utf8');
  return { path, lockFile };
}

// timeoutMs default is generous because these polls wait on a DETACHED node
// child (the auto-extract stub) to cold-start + run + write its lockFile. Under
// `npm run stress` (5 full suites in parallel) the machine is heavily loaded and a
// node cold-start can take several seconds, so a tight 3s window flaked — the
// exact "known cli-capture-turn flake" that PRs #22/#23 wrongly DISCLAIMED instead
// of fixing (CLAUDE.md lazy-framing anti-pattern). The predicate still returns the
// instant the file appears, so this never slows a healthy run — only the saturated
// worst case waits longer. (Task 111 stress gate surfaced run-5; root cause was
// spawn-latency-under-load, not a captureTurn bug — r.spawned was already true.)
async function pollFor(predicate, { timeoutMs = 12_000, intervalMs = 50 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  return predicate();
}

// Stronger predicate for the detached-stub pattern: the lockFile
// must EXIST AND have NON-ZERO SIZE. existsSync alone returns true
// as soon as the detached child opened the file descriptor, but the
// child's writeFileSync content may not yet be visible to the parent
// on Windows (visibility race between create and content-flush).
// Surfaced as "expected '' to contain 'DETACH_PROOF'" in 2/5 stress
// runs during Task 24 full-suite validation. Pin the wait on the
// actual content landing.
async function pollForFileWithContent(path, opts) {
  return pollFor(
    () => existsSync(path) && statSync(path).size > 0,
    opts,
  );
}

describe('Task 21 — captureTurn() boundary', () => {
  let sandbox;
  let projectRoot;

  beforeEach(() => {
    const f = makeFixture();
    sandbox = f.sandbox;
    projectRoot = f.projectRoot;
  });

  afterEach(async () => {
    // A spawned auto-extract stub may still be writing inside the
    // sandbox when this test finishes — Windows holds locks on open
    // files, so rmSync would EPERM. Give children a beat to drain
    // before tearing down. Best-effort: if cleanup still fails after
    // the poll, swallow it (next beforeEach mkdtemp will be a fresh
    // path anyway).
    await new Promise((res) => setTimeout(res, 300));
    try {
      rmSync(sandbox, { recursive: true, force: true });
    } catch {
      // Background child still has a handle open — leave the tmp dir
      // for the OS to clean. Doesn't affect the test outcome.
    }
  });

  describe('stop_hook_active recursion guard (21.1)', () => {
    it('payload with stop_hook_active:true: action:noop, no transcript, no spawn', async () => {
      const stub = writeAutoExtractStub(sandbox);
      const r = captureTurn({
        payload: {
          stop_hook_active: true,
          assistant_message: 'this should be ignored',
        },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('noop');
      expect(r.reason).toBe('stop-hook-active');
      expect(r.spawned).toBe(false);

      // Give the stub a beat to run if (incorrectly) spawned
      await new Promise((res) => setTimeout(res, 200));
      expect(existsSync(stub.lockFile)).toBe(false);
      expect(existsSync(join(projectRoot, 'context', 'transcripts'))).toBe(false);
    });

    it('payload with stop_hook_active:false: spawn happens, transcript written', async () => {
      const stub = writeAutoExtractStub(sandbox);
      const r = captureTurn({
        payload: {
          stop_hook_active: false,
          assistant_message: 'normal completion',
        },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('captured');
      expect(r.spawned).toBe(true);

      await pollForFileWithContent(stub.lockFile);
      expect(existsSync(stub.lockFile)).toBe(true);
      expect(existsSync(r.transcriptPath)).toBe(true);
    });

    it('payload without stop_hook_active: same as false (spawn happens)', async () => {
      const stub = writeAutoExtractStub(sandbox);
      const r = captureTurn({
        payload: { assistant_message: 'no flag set' },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('captured');
      expect(r.spawned).toBe(true);

      await pollForFileWithContent(stub.lockFile);
      expect(existsSync(stub.lockFile)).toBe(true);
    });
  });

  describe('transcript append (21.2)', () => {
    it('appends with ## <ts> — assistant heading', async () => {
      const stub = writeAutoExtractStub(sandbox);
      const r = captureTurn({
        payload: { assistant_message: 'hello there' },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:30:00Z',
      });
      const text = readFileSync(r.transcriptPath, 'utf8');
      expect(text).toMatch(/##\s+2026-05-25T10:30:00Z\s+—\s+assistant/);
      expect(text).toContain('hello there');
    });

    it('<private>secret</private> replaced; <retain>important</retain> preserved verbatim', () => {
      const stub = writeAutoExtractStub(sandbox);
      const r = captureTurn({
        payload: {
          assistant_message:
            'safe text <private>SECRET_TURN_SENTINEL</private> middle <retain>important</retain> end',
        },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:00:00Z',
      });
      const text = readFileSync(r.transcriptPath, 'utf8');
      expect(text).not.toContain('SECRET_TURN_SENTINEL');
      expect(text).toContain('[private content redacted]');
      expect(text).toContain('<retain>important</retain>');
    });

    it('extracts turn text from documented alternative payload fields', () => {
      const stub = writeAutoExtractStub(sandbox);
      // last_assistant_message fallback (older Claude Code payload shape)
      const r = captureTurn({
        payload: { last_assistant_message: 'older-payload-marker' },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('captured');
      const text = readFileSync(r.transcriptPath, 'utf8');
      expect(text).toContain('older-payload-marker');
    });

    it('payload with no turn text: action:noop', () => {
      const stub = writeAutoExtractStub(sandbox);
      const r = captureTurn({
        payload: {},
        projectRoot,
        autoExtractPath: stub.path,
      });
      expect(r.action).toBe('noop');
      expect(r.reason).toBe('no-turn-text');
      expect(r.spawned).toBe(false);
    });
  });

  describe('detached spawn (21.3 + 21.4 + 21.5)', () => {
    // The Stop hook must NOT block on the auto-extract child (design §5.1
    // gives a 30s envelope, NFR-1 budgets ~50ms for the in-process work).
    // We test this LOAD-INDEPENDENTLY: the stub child sleeps before writing
    // its lock, so at the instant captureTurn() returns the lock must not
    // exist yet — if the parent had awaited the child, it would already be
    // there. (The earlier formulation asserted an absolute wall-clock bound
    // `elapsed < 250ms`; that flaked under machine load — 371ms in a stress
    // run — without indicating any regression, because it tested a relative
    // property with an absolute threshold. Replaced 2026-05-31.)
    it('captureTurn() returns without blocking on the spawned subagent (detach)', async () => {
      const sleepMs = 2000;
      const stub = writeAutoExtractStub(sandbox, { sleepMs });
      const t0 = Date.now();
      const r = captureTurn({
        payload: { assistant_message: 'parent returns fast' },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:00:00Z',
      });
      const elapsed = Date.now() - t0;
      expect(r.action).toBe('captured');
      expect(r.spawned).toBe(true);
      // Primary (load-independent): the parent returned BEFORE the child's
      // post-sleep lock write, so it did not block on the child. The child
      // opens the lock file only after `sleepMs`, so existsSync can't trip
      // on the fd-open-before-content-flush race either.
      expect(existsSync(stub.lockFile)).toBe(false);
      // Backstop: even a heavily-loaded detached spawn() returns far below
      // the child's sleep; a full await would show ~sleepMs.
      expect(elapsed).toBeLessThan(sleepMs);
      // Door 3 (external calls): the assertions above could pass if spawn
      // silently failed (`r.spawned` is set BEFORE the child exit). Pin that
      // the spawned child actually ran by polling for its sentinel content.
      // Wide poll window: child cold-start (~0.5-1.5s on Windows) + sleepMs.
      await pollForFileWithContent(stub.lockFile, { timeoutMs: 20000 });
      expect(readFileSync(stub.lockFile, 'utf8')).toContain('LOCK');
    });

    // Task 253(c) — the fire-and-forget child's cwd is the OS temp dir, never
    // the project tree. A detached child that outlives its parent keeps a
    // handle on its cwd; on Windows that handle blocks a later delete/move of
    // the directory (the stale-handle race the kit's own teardown EPERMs are
    // an instance of). The child does not READ cwd — it resolves its root from
    // CMK_PROJECT_DIR (asserted below), so nothing depends on inheriting it.
    it('Door 3 — the detached auto-extract descriptor pins cwd to tmpdir() and passes the root by env', () => {
      const d = autoExtractSpawnDescriptor('/auto.mjs', '/turn.tmp', projectRoot);
      expect(d.command).toBe('node');
      expect(d.args).toEqual(['/auto.mjs', '/turn.tmp']);
      expect(d.options.cwd).toBe(tmpdir());
      expect(d.options.detached).toBe(true);
      expect(d.options.stdio).toBe('ignore');
      expect(d.options.windowsHide).toBe(true);
      expect(d.options.env.CMK_PROJECT_DIR).toBe(projectRoot);
    });

    it('Door 3 — with NO project root the child INHERITS cwd (never tmpdir): it would otherwise extract into the temp dir', () => {
      // cmk-auto-extract falls back to `process.cwd()` when CMK_PROJECT_DIR is
      // absent, so tmpdir-without-a-root would point capture at the temp dir.
      for (const root of [undefined, '', null]) {
        const d = autoExtractSpawnDescriptor('/auto.mjs', '/turn.tmp', root);
        expect(d.options.cwd, `projectRoot=${JSON.stringify(root)}`).toBeUndefined();
      }
    });

    it('Door 3 — the REAL detached child runs with cwd = tmpdir(), not the project root', async () => {
      // The end-to-end half: the stub reports its own process.cwd().
      const cwdProbe = join(sandbox, 'child-cwd.txt');
      const stubPath = join(sandbox, 'stub-cwd-probe.mjs');
      writeFileSync(
        stubPath,
        `import { writeFileSync } from 'node:fs';\n` +
          `writeFileSync(${JSON.stringify(cwdProbe)}, process.cwd(), 'utf8');\n`,
        'utf8',
      );
      const r = captureTurn({
        payload: { assistant_message: 'cwd probe' },
        projectRoot,
        autoExtractPath: stubPath,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.spawned).toBe(true);
      await pollForFileWithContent(cwdProbe, { timeoutMs: 20000 });
      const childCwd = realpathSync(readFileSync(cwdProbe, 'utf8').trim());
      expect(childCwd).toBe(realpathSync(tmpdir()));
      expect(childCwd).not.toBe(realpathSync(projectRoot));
    });

    it('autoExtractPath missing: spawned:false, but transcript still appended', () => {
      const r = captureTurn({
        payload: { assistant_message: 'still-transcribe' },
        projectRoot,
        autoExtractPath: join(sandbox, 'this-script-does-not-exist.mjs'),
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('captured');
      expect(r.spawned).toBe(false);
      expect(r.reason).toBe('auto-extract-missing');
      expect(existsSync(r.transcriptPath)).toBe(true);
    });

    it('autoExtractPath not provided: spawned:false, transcript still appended', () => {
      const r = captureTurn({
        payload: { assistant_message: 'no path given' },
        projectRoot,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('captured');
      expect(r.spawned).toBe(false);
      expect(existsSync(r.transcriptPath)).toBe(true);
    });

    it('writes a turn buffer file for the subagent under .extract-*.tmp', async () => {
      const stub = writeAutoExtractStub(sandbox);
      const r = captureTurn({
        payload: { assistant_message: 'expect tmp file' },
        projectRoot,
        autoExtractPath: stub.path,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.turnFile).toMatch(/[\/\\]\.extract-\d+\.tmp$/);
      // Initially exists (the stub may delete it after reading; the
      // contract is "file exists at spawn time")
      // Wait briefly for spawn to run + then check the stub got the turnFile arg
      await pollForFileWithContent(stub.lockFile);
      const lockContent = readFileSync(stub.lockFile, 'utf8');
      expect(lockContent).toContain('.extract-');
    });
  });

  // ----------------------------------------------------------------
  // Bi-turn temp file shape (design §6.4 amendment, 2026-05-26).
  // capture-turn assembles BOTH the prior user prompt + the
  // just-captured assistant turn into the temp file with
  // USER_TURN: / ASSISTANT_TURN: markers, so auto-extract can apply
  // origin-aware trust routing.
  // ----------------------------------------------------------------
  describe('bi-turn temp file (design §6.4 amendment)', () => {
    it('temp file contains USER_TURN: and ASSISTANT_TURN: markers with both bodies', () => {
      // Pre-populate today's transcript with a user entry (as
      // capture-prompt would have done on the UserPromptSubmit that
      // triggered this assistant turn).
      const transcriptPath = join(projectRoot, 'context', 'transcripts', '2026-05-25.live.md');
      require('node:fs').mkdirSync(require('node:path').dirname(transcriptPath), { recursive: true });
      writeFileSync(
        transcriptPath,
        '## 2026-05-25T10:00:00Z — user\n\nI prefer pnpm not npm\n\n',
        'utf8',
      );

      const r = captureTurn({
        payload: { assistant_message: 'Got it.' },
        projectRoot,
        now: '2026-05-25T10:00:01Z',
        // No autoExtractPath → no spawn → temp file just persists
      });
      expect(r.action).toBe('captured');
      expect(existsSync(r.turnFile)).toBe(true);
      const body = readFileSync(r.turnFile, 'utf8');
      expect(body).toContain('USER_TURN:');
      expect(body).toContain('ASSISTANT_TURN:');
      expect(body).toContain('I prefer pnpm not npm');
      expect(body).toContain('Got it.');
      // Order: USER_TURN before ASSISTANT_TURN
      expect(body.indexOf('USER_TURN:')).toBeLessThan(body.indexOf('ASSISTANT_TURN:'));
      // User body sits between the markers
      const userIdx = body.indexOf('I prefer pnpm not npm');
      const asstMarkerIdx = body.indexOf('ASSISTANT_TURN:');
      expect(userIdx).toBeLessThan(asstMarkerIdx);
    });

    it('no prior user entry in transcript → USER_TURN section is empty but the markers still appear', () => {
      // Transcript is empty (or only contains the just-appended
      // assistant entry from THIS captureTurn call). readLastUserTurnFromTranscript
      // finds no `— user` heading and returns ''.
      const r = captureTurn({
        payload: { assistant_message: 'standalone assistant message' },
        projectRoot,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('captured');
      const body = readFileSync(r.turnFile, 'utf8');
      expect(body).toContain('USER_TURN:');
      expect(body).toContain('ASSISTANT_TURN:');
      expect(body).toContain('standalone assistant message');
      // USER_TURN body is empty: between the marker and the next
      // ASSISTANT_TURN: line, only blank lines.
      const userTurnStart = body.indexOf('USER_TURN:') + 'USER_TURN:'.length;
      const asstTurnStart = body.indexOf('ASSISTANT_TURN:');
      const userBody = body.slice(userTurnStart, asstTurnStart).trim();
      expect(userBody).toBe('');
    });

    it('payload.user_message populates USER_TURN even when the transcript has NO prior user entry (the Kiro-IDE fix — P-TQSG9PCA)', () => {
      // On Kiro IDE 1.0, capture-prompt's USER_PROMPT env var arrives EMPTY (a
      // Kiro platform bug: GitHub #9619/#6188), so no `## — user` entry is ever
      // written to the transcript → readLastUserTurnFromTranscript returns '' →
      // auto-extract's bi-turn extraction can't see the user's stated preference
      // and returns nothing_durable. The Kiro Stop hook DOES recover the user
      // turn from Kiro's own transcript (readKiroTurn → user_message in the
      // payload); captureTurn must USE that payload.user_message as the user
      // turn, falling back to the transcript scan only when it's absent.
      const r = captureTurn({
        payload: {
          assistant_message: 'Understood, I will use httpx.',
          user_message: 'I always use httpx for HTTP calls, never requests.',
        },
        projectRoot,
        now: '2026-05-25T10:00:00Z',
      });
      expect(r.action).toBe('captured');
      const body = readFileSync(r.turnFile, 'utf8');
      // The USER_TURN section carries the payload's user_message (not empty).
      expect(body).toContain('I always use httpx for HTTP calls, never requests.');
      const userTurnStart = body.indexOf('USER_TURN:') + 'USER_TURN:'.length;
      const asstTurnStart = body.indexOf('ASSISTANT_TURN:');
      const userBody = body.slice(userTurnStart, asstTurnStart).trim();
      expect(userBody).toContain('httpx');
      // And now.md gets a `— user` heading with the preference, so the
      // SessionEnd compressor + auto-extract see the bi-turn.
      const nowMd = readFileSync(join(projectRoot, 'context', 'sessions', 'now.md'), 'utf8');
      expect(nowMd).toContain('— user');
      expect(nowMd).toContain('httpx');
      // B1 (code-review, D-303): the transcript-of-record ALSO gets the user
      // entry — on Kiro, capture-prompt never wrote it (empty USER_PROMPT), so
      // captureTurn must, in `## user → ## assistant` order, or the L3-promoted
      // committed transcript loses every Kiro user turn.
      const transcript = readFileSync(r.transcriptPath, 'utf8');
      expect(transcript).toContain('— user');
      expect(transcript).toContain('httpx');
      expect(transcript.indexOf('— user')).toBeLessThan(transcript.indexOf('— assistant'));
    });

    it('payload.user_message is L1-masked before it reaches now.md / the turn-file (Door 2 — the Kiro raw-turn privacy gap)', () => {
      // readKiroTurn returns the user turn RAW (no privacy pass), unlike the
      // transcript fallback which capture-prompt already masked. So the payload
      // branch MUST run the same L1 mask the assistant turn does — otherwise a
      // Kiro user turn with an email/phone/home-path lands unmasked in the
      // committed now.md buffer + the auto-extract turn-file. Screen defaults ON.
      // NB: a real (non-allowlisted) domain — example.com is allowlisted by
      // maskPii and would pass through unmasked, defeating the test.
      const r = captureTurn({
        payload: {
          assistant_message: 'Noted.',
          user_message: 'ping me at jane.doe@acme-corp.io about the deploy',
        },
        projectRoot,
        now: '2026-05-25T10:02:00Z',
      });
      expect(r.action).toBe('captured');
      const body = readFileSync(r.turnFile, 'utf8');
      const nowMd = readFileSync(join(projectRoot, 'context', 'sessions', 'now.md'), 'utf8');
      const transcript = readFileSync(r.transcriptPath, 'utf8');
      // The raw email must NOT appear in ANY sink; the masked placeholder does.
      // Three sinks: the turn-file, now.md, and the transcript-of-record (B1).
      expect(body).not.toContain('jane.doe@acme-corp.io');
      expect(nowMd).not.toContain('jane.doe@acme-corp.io');
      expect(transcript).not.toContain('jane.doe@acme-corp.io');
      expect(body).toContain('«EMAIL»'); // maskPii stable placeholder token
      expect(transcript).toContain('«EMAIL»');
      // Door 5 (M2, code-review): the recovery original lands in redactions.log
      // under the NEW `capture-turn:user` source tag — so a false-positive mask
      // is recoverable and the new source is observable.
      const rlog = readFileSync(redactionsLogPath(projectRoot), 'utf8');
      expect(rlog).toContain('capture-turn:user');
      expect(rlog).toContain('jane.doe@acme-corp.io');
    });

    it('transcript user entry still wins when present (payload.user_message absent — Claude-Code path unchanged)', () => {
      // Regression guard: the Claude-Code path (capture-prompt wrote the user
      // entry, no payload.user_message) must be untouched by the Kiro fix.
      const transcriptPath = join(projectRoot, 'context', 'transcripts', '2026-05-25.live.md');
      require('node:fs').mkdirSync(require('node:path').dirname(transcriptPath), { recursive: true });
      writeFileSync(
        transcriptPath,
        '## 2026-05-25T10:00:00Z — user\n\ntranscript-sourced user turn\n\n',
        'utf8',
      );
      const r = captureTurn({
        payload: { assistant_message: 'ok' }, // NO user_message
        projectRoot,
        now: '2026-05-25T10:00:01Z',
      });
      const body = readFileSync(r.turnFile, 'utf8');
      expect(body).toContain('transcript-sourced user turn');
      // Over-mutation guard (B1): on the Claude path capture-prompt already
      // wrote the `## — user` entry — captureTurn must NOT double-write it.
      // Exactly one user heading remains in the transcript-of-record.
      const transcript = readFileSync(r.transcriptPath, 'utf8');
      expect(transcript.match(/— user/g)?.length).toBe(1);
    });

    it('most recent user entry is selected when transcript has multiple user entries', () => {
      const transcriptPath = join(projectRoot, 'context', 'transcripts', '2026-05-25.live.md');
      require('node:fs').mkdirSync(require('node:path').dirname(transcriptPath), { recursive: true });
      // Two user entries; the second is the immediate predecessor.
      writeFileSync(
        transcriptPath,
        [
          '## 2026-05-25T09:00:00Z — user',
          '',
          'first older prompt',
          '',
          '## 2026-05-25T09:05:00Z — assistant',
          '',
          'older response',
          '',
          '## 2026-05-25T10:00:00Z — user',
          '',
          'the most recent prompt',
          '',
        ].join('\n'),
        'utf8',
      );
      const r = captureTurn({
        payload: { assistant_message: 'reply' },
        projectRoot,
        now: '2026-05-25T10:00:01Z',
      });
      const body = readFileSync(r.turnFile, 'utf8');
      expect(body).toContain('the most recent prompt');
      expect(body).not.toContain('first older prompt');
    });
  });

  // Door 5 (observability) — PR-A class-1 audit deferral closed in Task 23.14.3.
  // When the auto-extract spawn does NOT succeed (no path, missing path, or
  // node-side spawn throw), capture-turn writes an NDJSON entry to
  // sessions/{date}.extract.log with phase: 'spawn'.
  // Task 104.1 — the assistant transcript entry is enriched with the turn's
  // TOOL ACTIVITY read from the Stop payload's transcript_path (Anthropic's
  // live session JSONL). Best-effort by contract: a missing/bogus path or a
  // shifted format degrades to a text-only entry, never a capture failure.
  describe('transcript enrichment — tool activity from transcript_path (Task 104.1)', () => {
    const jsonlFixture = (sandbox) => {
      const p = join(sandbox, 'session.jsonl');
      const lines = [
        JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'check the git status' }] } }),
        JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'git status' } }] } }),
        JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'On branch main <private>hunter2</private>' }] } }),
      ];
      writeFileSync(p, lines.join('\n') + '\n', 'utf8');
      return p;
    };

    it('appends a Tools block under the assistant entry (Door 2), privacy-sanitized', () => {
      const transcriptPath = jsonlFixture(sandbox);
      const r = captureTurn({
        payload: {
          assistant_message: 'the tree is clean',
          transcript_path: transcriptPath,
        },
        projectRoot,
        now: '2026-06-10T12:00:00Z',
      });
      expect(r.action).toBe('captured');
      const text = readFileSync(r.transcriptPath, 'utf8');
      expect(text).toContain('**Tools:**');
      expect(text).toContain('Bash(git status)');
      expect(text).toContain('On branch main');
      // <private> content inside a tool result must never reach disk.
      expect(text).not.toContain('hunter2');
      expect(text).toContain('[private content redacted]');
    });

    it('missing/bogus transcript_path → text-only entry, capture unaffected', () => {
      const r = captureTurn({
        payload: {
          assistant_message: 'no enrichment available',
          transcript_path: join(sandbox, 'does-not-exist.jsonl'),
        },
        projectRoot,
        now: '2026-06-10T12:00:00Z',
      });
      expect(r.action).toBe('captured');
      const text = readFileSync(r.transcriptPath, 'utf8');
      expect(text).toContain('no enrichment available');
      expect(text).not.toContain('**Tools:**');
    });

    it('the now.md session buffer stays TEXT-ONLY (tool noise must not feed the compressor)', () => {
      const transcriptPath = jsonlFixture(sandbox);
      captureTurn({
        payload: { assistant_message: 'the tree is clean', transcript_path: transcriptPath },
        projectRoot,
        now: '2026-06-10T12:00:00Z',
      });
      const nowMd = readFileSync(join(projectRoot, 'context', 'sessions', 'now.md'), 'utf8');
      expect(nowMd).toContain('the tree is clean');
      expect(nowMd).not.toContain('**Tools:**');
    });
  });

  // Task 250 (D-412) — the health log's capture-chain half. A spawn that never
  // happened means the turn was written to the transcript but NOTHING will
  // extract it, which is the silent-failure class the whisper exists for.
  //
  // Deliberately ONE-SIDED: a successful spawn appends NOTHING. Spawning is not
  // extracting — the detached child may still fail — so an `ok` here would
  // clear a genuine extraction failure streak on every subsequent turn and make
  // the warning structurally unreachable. The child owns its own `ok`.
  describe('Task 250 — spawn failures append extract-failing (Door 5)', () => {
    function readHealth() {
      const p = join(projectRoot, 'context', '.locks', 'health.log');
      if (!existsSync(p)) return [];
      return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    }

    it('a missing auto-extract script appends extract-failing:fail with the reason as detail', () => {
      captureTurn({
        payload: { assistant_message: 'turn body' },
        projectRoot,
        now: '2026-05-27T09:00:00Z',
        autoExtractPath: join(sandbox, 'does-not-exist.mjs'),
      });
      const health = readHealth();
      expect(health).toHaveLength(1);
      expect(health[0]).toMatchObject({
        class: 'extract-failing',
        outcome: 'fail',
        detail: 'auto-extract-missing',
        schema: 1,
      });
    });

    it('a null auto-extract path appends extract-failing:fail', () => {
      captureTurn({
        payload: { assistant_message: 'turn body' },
        projectRoot,
        now: '2026-05-27T09:01:00Z',
        autoExtractPath: null,
      });
      expect(readHealth().map((e) => [e.class, e.outcome, e.detail])).toEqual([
        ['extract-failing', 'fail', 'no-auto-extract-path'],
      ]);
    });

    it('a SUCCESSFUL spawn appends NOTHING — spawning is not extracting', () => {
      const stubScript = join(sandbox, 'noop-health.mjs');
      writeFileSync(stubScript, 'process.exit(0);\n');
      const r = captureTurn({
        payload: { assistant_message: 'turn body' },
        projectRoot,
        now: '2026-05-27T09:02:00Z',
        autoExtractPath: stubScript,
      });
      expect(r.spawned).toBe(true);
      expect(readHealth()).toEqual([]);
    });

    it('OVER-MUTATION GUARD: the health append leaves extract.log untouched', () => {
      captureTurn({
        payload: { assistant_message: 'turn body' },
        projectRoot,
        now: '2026-05-27T09:03:00Z',
        autoExtractPath: null,
      });
      // the pre-existing Door-5 surface still gets its own, separate entry
      const logPath = join(projectRoot, 'context', 'sessions', '2026-05-27.extract.log');
      const entries = readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
      expect(entries.filter((e) => e.phase === 'spawn')).toHaveLength(1);
    });
  });

  describe('spawn-failed observability (Task 23.14.3)', () => {
    it('writes a phase:spawn extract.log entry when autoExtractPath is null', () => {
      const r = captureTurn({
        payload: { assistant_message: 'turn body' },
        projectRoot,
        now: '2026-05-27T08:00:00Z',
        autoExtractPath: null,
      });
      expect(r.spawned).toBe(false);
      expect(r.reason).toBe('no-auto-extract-path');
      const logPath = join(projectRoot, 'context', 'sessions', '2026-05-27.extract.log');
      expect(existsSync(logPath)).toBe(true);
      const entries = readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        ts: '2026-05-27T08:00:00Z',
        phase: 'spawn',
        success: false,
        error_category: 'spawn_failed',
        reason: 'no-auto-extract-path',
      });
    });

    it('writes a phase:spawn entry when autoExtractPath does not exist', () => {
      const r = captureTurn({
        payload: { assistant_message: 'turn body' },
        projectRoot,
        now: '2026-05-27T08:01:00Z',
        autoExtractPath: join(sandbox, 'does-not-exist.mjs'),
      });
      expect(r.spawned).toBe(false);
      expect(r.reason).toBe('auto-extract-missing');
      const logPath = join(projectRoot, 'context', 'sessions', '2026-05-27.extract.log');
      const entries = readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
      const last = entries[entries.length - 1];
      expect(last).toMatchObject({
        phase: 'spawn',
        success: false,
        error_category: 'spawn_failed',
        reason: 'auto-extract-missing',
      });
    });

    it('does NOT write a spawn-phase entry when the spawn succeeds', () => {
      const stubScript = join(sandbox, 'noop.mjs');
      writeFileSync(stubScript, 'process.exit(0);\n');
      const r = captureTurn({
        payload: { assistant_message: 'turn body' },
        projectRoot,
        now: '2026-05-27T08:02:00Z',
        autoExtractPath: stubScript,
      });
      expect(r.spawned).toBe(true);
      const logPath = join(projectRoot, 'context', 'sessions', '2026-05-27.extract.log');
      // The log file might not exist at all if no prior spawn-failed
      // entry was written; if it does, none of its entries should have
      // ts:2026-05-27T08:02:00Z + phase:'spawn'.
      if (existsSync(logPath)) {
        const entries = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
        const matching = entries.filter(
          (e) => e.ts === '2026-05-27T08:02:00Z' && e.phase === 'spawn',
        );
        expect(matching).toHaveLength(0);
      }
    });
  });
});

describe('Task 21 — bin/cmk-capture-turn (hook handler — node bin)', () => {
  let sandbox;
  let projectRoot;

  beforeEach(() => {
    const f = makeFixture();
    sandbox = f.sandbox;
    projectRoot = f.projectRoot;
  });

  afterEach(async () => {
    // Same defensive cleanup as the boundary-tests describe — detached
    // children may still hold sandbox handles on Windows; give them a
    // beat then swallow EPERM if rmSync still races them.
    await new Promise((res) => setTimeout(res, 500));
    try {
      rmSync(sandbox, { recursive: true, force: true });
    } catch {
      // Background child still has a handle open; leave the temp dir
      // for the OS to clean. Doesn't affect the test outcome.
    }
  });

  it('exits 0 with continue:true on a valid Stop payload', () => {
    const r = spawnSync(process.execPath, [BIN_PATH], {
      input: JSON.stringify({
        hook_event_name: 'Stop',
        assistant_message: 'bin wrapper smoke',
        stop_hook_active: false,
      }),
      encoding: 'utf8',
      cwd: projectRoot,
    });
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed).toMatchObject({ continue: true });
  });

  it('writes the transcript to context/transcripts/<today>.md', () => {
    spawnSync(process.execPath, [BIN_PATH], {
      input: JSON.stringify({
        assistant_message: 'wrapper-turn-marker',
        stop_hook_active: false,
      }),
      encoding: 'utf8',
      cwd: projectRoot,
    });
    const dir = join(projectRoot, 'context', 'transcripts');
    expect(existsSync(dir)).toBe(true);
    const files = readdirSync(dir).filter((n) => n.endsWith('.md'));
    expect(files.length).toBe(1);
    const text = readFileSync(join(dir, files[0]), 'utf8');
    expect(text).toContain('wrapper-turn-marker');
  });

  it('CMK_AUTO_EXTRACT_PATH env var drives the spawn; sentinel lands after parent exit (detach proof)', async () => {
    // Stub auto-extract: waits 600ms then writes a sentinel. The
    // detach contract we care about is: the SENTINEL must not exist
    // at the moment the parent returns (because the child is still
    // sleeping). It DOES appear shortly after. The wall-clock duration
    // of the parent itself is not asserted because Windows + node's
    // detached + unref + Git Bash combination has variable behavior
    // around waiting on detached children's pipes — see the in-process
    // boundary tests above for the actual NFR-1 assertion on
    // captureTurn() proper.
    const stub = writeAutoExtractStub(sandbox, { sleepMs: 600, sentinel: 'DETACH_PROOF' });

    const r = spawnSync(process.execPath, [BIN_PATH], {
      input: JSON.stringify({
        assistant_message: 'detach proof',
        stop_hook_active: false,
      }),
      encoding: 'utf8',
      cwd: projectRoot,
      env: { ...process.env, CMK_AUTO_EXTRACT_PATH: stub.path },
    });
    expect(r.status).toBe(0);

    // The sentinel may or may not have landed by now depending on
    // scheduler timing — what matters is that it eventually lands AND
    // its content matches what the stub wrote (proves spawn invoked
    // the stub with the right argv).
    //
    // 20s poll window: the detached child has to clear bash startup
    // (~500-1000ms on Windows) + node cold-start (~500-1500ms) +
    // 600ms stub sleep + writeFile. Under full-suite concurrency on
    // Windows those add up well past 4000ms (the previous bound,
    // which PR #22 and #23 documented as a "known cli-capture-turn
    // flake" without fixing). 20s is two orders of magnitude below
    // the design §5.1 hook timeout (30s) so any case where the
    // sentinel genuinely never lands still fails fast.
    await pollForFileWithContent(stub.lockFile, { timeoutMs: 20000 });
    expect(existsSync(stub.lockFile)).toBe(true);
    expect(readFileSync(stub.lockFile, 'utf8')).toContain('DETACH_PROOF');
  });

  it('stop_hook_active:true short-circuits: no transcript, no spawn', async () => {
    const stub = writeAutoExtractStub(sandbox);
    const r = spawnSync(process.execPath, [BIN_PATH], {
      input: JSON.stringify({
        assistant_message: 'should-not-be-saved',
        stop_hook_active: true,
      }),
      encoding: 'utf8',
      cwd: projectRoot,
      env: { ...process.env, CMK_AUTO_EXTRACT_PATH: stub.path },
    });
    expect(r.status).toBe(0);
    await new Promise((res) => setTimeout(res, 300));
    expect(existsSync(stub.lockFile)).toBe(false);
    expect(existsSync(join(projectRoot, 'context', 'transcripts'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Task 87 — capture-turn buffers the CONVERSATION into now.md for compression
// (the real Task 84 root). Before this, now.md was fed ONLY by observe-edit's
// file-write lines ([ts] Write file=X lines=N), so the SessionEnd compressor
// summarized a list of filenames → hallucinated a framework ("Flask app: app.py").
// Now the dialogue itself reaches the compression buffer, so the summary reflects
// what was DISCUSSED, not what files were written.
// ---------------------------------------------------------------------------

describe('Task 87 — conversation buffered to now.md', () => {
  let sandbox;
  let projectRoot;

  beforeEach(() => {
    const f = makeFixture();
    sandbox = f.sandbox;
    projectRoot = f.projectRoot;
  });

  afterEach(async () => {
    await new Promise((res) => setTimeout(res, 300));
    try {
      rmSync(sandbox, { recursive: true, force: true });
    } catch {
      // detached child may still hold a handle — leave for the OS.
    }
  });

  const NOW_MD = (root) => join(root, 'context', 'sessions', 'now.md');

  /** Seed the prior user turn the way capture-prompt (UserPromptSubmit) would. */
  function seedUserTurn(root, { ts, body }) {
    const dir = join(root, 'context', 'transcripts');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${ts.slice(0, 10)}.live.md`), `## ${ts} — user\n\n${body}\n\n`, 'utf8');
  }

  it('appends BOTH the user and assistant turn text to now.md (Door 2)', () => {
    const stub = writeAutoExtractStub(sandbox);
    seedUserTurn(projectRoot, { ts: '2026-05-25T10:00:00Z', body: 'build a PDF converter with Docling, not Flask' });

    const r = captureTurn({
      payload: { assistant_message: 'Created convert.py using Docling DocumentConverter' },
      projectRoot,
      autoExtractPath: stub.path,
      now: '2026-05-25T10:01:00Z',
    });
    expect(r.action).toBe('captured');

    const buf = readFileSync(NOW_MD(projectRoot), 'utf8');
    // The DIALOGUE reaches the buffer — the thing the compressor summarizes.
    expect(buf).toMatch(/build a PDF converter with Docling/);
    expect(buf).toMatch(/Created convert\.py using Docling/);
    // And it carries the speaker attribution so the compressor reads it as a turn.
    expect(buf).toMatch(/—\s*user/);
    expect(buf).toMatch(/—\s*assistant/);
  });

  it('APPENDS to now.md without clobbering prior buffered content (over-mutation guard)', () => {
    const stub = writeAutoExtractStub(sandbox);
    mkdirSync(join(projectRoot, 'context', 'sessions'), { recursive: true });
    writeFileSync(NOW_MD(projectRoot), 'PRIOR-BUFFER-CONTENT\n', 'utf8');
    seedUserTurn(projectRoot, { ts: '2026-05-25T11:00:00Z', body: 'second turn question' });

    captureTurn({
      payload: { assistant_message: 'second turn answer' },
      projectRoot,
      autoExtractPath: stub.path,
      now: '2026-05-25T11:01:00Z',
    });

    const buf = readFileSync(NOW_MD(projectRoot), 'utf8');
    expect(buf).toMatch(/PRIOR-BUFFER-CONTENT/); // prior content preserved
    expect(buf).toMatch(/second turn question/);
    expect(buf).toMatch(/second turn answer/);
  });

  it('still buffers the assistant turn when no prior user turn exists (no crash)', () => {
    const stub = writeAutoExtractStub(sandbox);
    const r = captureTurn({
      payload: { assistant_message: 'standalone assistant turn' },
      projectRoot,
      autoExtractPath: stub.path,
      now: '2026-05-25T12:00:00Z',
    });
    expect(r.action).toBe('captured');
    const buf = readFileSync(NOW_MD(projectRoot), 'utf8');
    expect(buf).toMatch(/standalone assistant turn/);
  });

  it('caps the assistant contribution but keeps the FULL user turn (skill-review I1)', () => {
    const stub = writeAutoExtractStub(sandbox);
    const longAssistant = 'A'.repeat(9000); // far over the 4000 cap
    const longUserDecision =
      'from now on always use uv, never pip — ' + 'context '.repeat(800) + ' END-OF-USER-RULE';
    seedUserTurn(projectRoot, { ts: '2026-05-25T14:00:00Z', body: longUserDecision });

    captureTurn({
      payload: { assistant_message: longAssistant },
      projectRoot,
      autoExtractPath: stub.path,
      now: '2026-05-25T14:01:00Z',
    });

    const buf = readFileSync(NOW_MD(projectRoot), 'utf8');
    // Assistant turn is bounded (cap + marker), so one verbose response can't bloat now.md.
    expect(buf).toMatch(/assistant turn truncated for the session buffer/);
    expect(buf.match(/A+/)[0].length).toBeLessThanOrEqual(4000);
    // The USER turn is preserved IN FULL — the standing rule must never be truncated.
    expect(buf).toMatch(/from now on always use uv, never pip/);
    expect(buf).toMatch(/END-OF-USER-RULE/);
  });

  it('does NOT write now.md on the stop_hook_active short-circuit', () => {
    const r = captureTurn({
      payload: { stop_hook_active: true, assistant_message: 'should not capture' },
      projectRoot,
      now: '2026-05-25T13:00:00Z',
    });
    expect(r.action).toBe('noop');
    expect(existsSync(NOW_MD(projectRoot))).toBe(false);
  });
});

describe('Task 123.E — orphaned .extract-*.tmp cleanup (D-103 finding E)', () => {
  let sandbox;
  let projectRoot;
  let transcriptsDir;

  beforeEach(() => {
    const f = makeFixture();
    sandbox = f.sandbox;
    projectRoot = f.projectRoot;
    transcriptsDir = join(projectRoot, 'context', 'transcripts');
    mkdirSync(transcriptsDir, { recursive: true });
  });

  afterEach(async () => {
    await new Promise((res) => setTimeout(res, 300));
    try {
      rmSync(sandbox, { recursive: true, force: true });
    } catch {
      // background child may hold a handle on Windows; OS will reap the tmp
    }
  });

  const tmpName = (ts) => join(transcriptsDir, `.extract-${ts}.tmp`);

  describe('sweepStaleTurnFiles', () => {
    it('removes a stale turn-file but KEEPS a fresh one (over-mutation guard)', () => {
      const stale = tmpName(1);
      const fresh = tmpName(2);
      writeFileSync(stale, 'old turn body', 'utf8');
      writeFileSync(fresh, 'fresh turn body', 'utf8');
      // Backdate the stale one well past the threshold; leave the fresh one as-is.
      const old = Date.now() / 1000 - 30 * 60; // 30 min ago (sec for utimes)
      utimesSync(stale, old, old);

      const swept = sweepStaleTurnFiles(transcriptsDir);

      expect(swept).toBe(1);
      expect(existsSync(stale)).toBe(false); // orphan gone
      expect(existsSync(fresh)).toBe(true); // live run untouched
    });

    it('never touches a file younger than the threshold (cannot race an in-flight child)', () => {
      const fresh = tmpName(3);
      writeFileSync(fresh, 'in-flight turn', 'utf8');
      // now slightly after mtime → age ~0, far under the 10-min threshold
      expect(sweepStaleTurnFiles(transcriptsDir)).toBe(0);
      expect(existsSync(fresh)).toBe(true);
    });

    it('ignores non-turn files and a missing dir (best-effort, no throw)', () => {
      writeFileSync(join(transcriptsDir, '2026-06-09.md'), 'a real transcript', 'utf8');
      const old = Date.now() / 1000 - 30 * 60;
      utimesSync(join(transcriptsDir, '2026-06-09.md'), old, old);
      expect(sweepStaleTurnFiles(transcriptsDir)).toBe(0); // .md is not a turn-file
      expect(existsSync(join(transcriptsDir, '2026-06-09.md'))).toBe(true);
      expect(() => sweepStaleTurnFiles(join(sandbox, 'no-such-dir'))).not.toThrow();
    });
  });

  describe('the sweep is wired into captureTurn (entry janitor)', () => {
    it('reaps a pre-existing STALE orphan on entry, but leaves THIS turn-file for the child', () => {
      // Simulate an orphan left by a prior killed child / failed spawn.
      const orphan = join(transcriptsDir, '.extract-stale.tmp');
      writeFileSync(orphan, 'leftover from a dead child', 'utf8');
      const old = Date.now() / 1000 - 30 * 60; // 30 min ago
      utimesSync(orphan, old, old);

      const r = captureTurn({
        payload: { assistant_message: 'a normal turn' },
        projectRoot,
        now: '2026-05-25T10:00:00Z',
        // no autoExtractPath → no spawn → THIS turn-file persists for auto-extract
      });

      expect(r.action).toBe('captured');
      expect(existsSync(orphan)).toBe(false); // the stale orphan was reaped on entry
      expect(existsSync(r.turnFile)).toBe(true); // the fresh turn-file is handed off, not deleted
    });
  });
});

// ---------------------------------------------------------------------------
// Task 132 (D-122) — the turn file carries the dedup snapshot, taken BEFORE
// the current turn is appended to now.md. See cli-auto-extract.test.js for
// the consumer-side composition pin.
// ---------------------------------------------------------------------------

describe('Task 132 — turn file carries the pre-append dedup snapshot', () => {
  let sandbox;
  let projectRoot;

  beforeEach(() => {
    const f = makeFixture();
    sandbox = f.sandbox;
    projectRoot = f.projectRoot;
  });

  afterEach(async () => {
    // The detached stub child can still hold the dir on Windows for a
    // beat — async backoff instead of failing the test on cleanup
    // (EPERM; the PR #22/#23 Windows flake class, handled not disclaimed).
    // Under 5x-stress concurrency the hold can outlast the retry budget, so
    // the FINAL attempt is best-effort: a temp-dir cleanup EPERM is OS-level
    // flakiness AFTER the test body already passed — the OS reaps %TEMP%
    // anyway, and throwing here would turn a clean test into a phantom fail.
    for (let i = 0; i < 10; i++) {
      try {
        rmSync(sandbox, { recursive: true, force: true });
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    try {
      rmSync(sandbox, { recursive: true, force: true });
    } catch {
      /* best-effort: leave it for the OS temp reaper rather than fail a passed test */
    }
  });

  it('DEDUP_CONTEXT = the PREVIOUS now.md entry, never the current turn', () => {
    const sessionsDir = join(projectRoot, 'context', 'sessions');
    mkdirSync(sessionsDir, { recursive: true });
    writeFileSync(
      join(sessionsDir, 'now.md'),
      '## 2026-06-11T07:00:00Z — assistant\n\nthe PREVIOUS turn about valkey\n',
      'utf8',
    );
    const stub = writeAutoExtractStub(sandbox);
    const r = captureTurn({
      payload: { assistant_message: 'the CURRENT turn about deploys' },
      projectRoot,
      autoExtractPath: stub.path,
      now: '2026-06-11T08:00:00Z',
    });
    const turnBody = readFileSync(r.turnFile, 'utf8');
    expect(turnBody).toContain('DEDUP_CONTEXT:');
    expect(turnBody).toContain('the PREVIOUS turn about valkey');
    // The snapshot is pre-append: the current turn appears ONLY in the
    // ASSISTANT_TURN section, not the dedup section.
    const dedupSection = turnBody.split('USER_TURN:')[0];
    expect(dedupSection).not.toContain('the CURRENT turn about deploys');
    // And now.md itself DID get the current turn appended (Task 87 intact).
    const nowMd = readFileSync(join(sessionsDir, 'now.md'), 'utf8');
    expect(nowMd).toContain('the CURRENT turn about deploys');
  });

  it('fresh session (no now.md): DEDUP_CONTEXT section is present and empty', () => {
    const stub = writeAutoExtractStub(sandbox);
    const r = captureTurn({
      payload: { assistant_message: 'first turn of the session' },
      projectRoot,
      autoExtractPath: stub.path,
      now: '2026-06-11T08:00:00Z',
    });
    const turnBody = readFileSync(r.turnFile, 'utf8');
    expect(turnBody).toMatch(/^DEDUP_CONTEXT:\s*\n\s*\nUSER_TURN:/);
  });
});

// Skill-review I1 (Task 132): a now.md entry that itself contains line-start
// section markers (this repo's sessions discuss the turn-file format) must
// not be able to corrupt the turn-file parse — markers inside the dedup
// snapshot are neutralized.
describe('Task 132 — dedup snapshot neutralizes embedded section markers (I1)', () => {
  let sandbox;
  let projectRoot;

  beforeEach(() => {
    const f = makeFixture();
    sandbox = f.sandbox;
    projectRoot = f.projectRoot;
  });

  afterEach(async () => {
    for (let i = 0; i < 10; i++) {
      try {
        rmSync(sandbox, { recursive: true, force: true });
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    // Final attempt is SWALLOWED, not thrown: on Windows under full-suite load
    // a detached auto-extract child can still hold the sandbox as its cwd after
    // the 1.5s retry window, so rmSync throws EPERM — a TEMP-DIR cleanup race,
    // never a test outcome. The OS reclaims the temp dir later. Surfacing it as
    // a failure was the documented cli-capture-turn full-suite-concurrency flake
    // (CLAUDE.md lazy-framing instance #2); this guards the one unprotected line.
    try {
      rmSync(sandbox, { recursive: true, force: true });
    } catch {
      // best-effort temp cleanup — a leaked temp dir is not a failing test
    }
  });

  it('a line-start USER_TURN: inside the previous entry cannot hijack the parse', () => {
    const sessionsDir = join(projectRoot, 'context', 'sessions');
    mkdirSync(sessionsDir, { recursive: true });
    writeFileSync(
      join(sessionsDir, 'now.md'),
      '## 2026-06-11T07:00:00Z — assistant\n\nthe turn file format is:\nUSER_TURN:\nembedded marker content\n',
      'utf8',
    );
    const stub = writeAutoExtractStub(sandbox);
    const r = captureTurn({
      payload: { assistant_message: 'the real assistant turn' },
      projectRoot,
      autoExtractPath: stub.path,
      now: '2026-06-11T08:00:00Z',
    });
    const turnBody = readFileSync(r.turnFile, 'utf8');
    // Exactly ONE line-start USER_TURN: marker survives — the real one.
    const markers = turnBody.match(/^[ \t]*USER_TURN:/gm) ?? [];
    expect(markers).toHaveLength(1);
    expect(turnBody).toContain('· USER_TURN:'); // the embedded one, neutralized
    expect(turnBody).toContain('the real assistant turn');
  });
});
