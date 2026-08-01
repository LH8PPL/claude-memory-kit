// @doors: 1, 2, 3, 5
// Door 1: buildPromptHookOutput returns {additionalContext, systemMessage}.
// Door 2: none of this mutates memory state — asserted by the over-mutation
//   guard (the health log is READ here; the hint's recall-log append is the
//   only write, and it must stay exactly as it was).
// Door 3: the REAL cmk-capture-prompt bin is driven as a subprocess with a
//   realistic UserPromptSubmit stdin payload (the D-169 automatic-path
//   criterion: the whisper must appear with NO manual command run).
// Door 4 N/A: no message-queue surface.
// Door 5: the recall-log hint entry must be unaffected by the whisper.

// Tests for Task 250 (D-412 points 3 + 6) — the per-prompt health whisper.
//
// THE PROPERTY THAT MATTERS MOST, and the one the composition invites you to
// get wrong: THE WHISPER MUST NOT INHERIT THE HINT'S GATES. `buildMemoryHint`
// returns null for a prompt under 10 characters and for a project with no
// granular archive — both entirely reasonable for a RECALL nudge, and both
// catastrophic for a FAILURE nudge. "go" is exactly the prompt a user types
// while their capture is silently broken, and a project whose extraction has
// never once succeeded is exactly the project with an empty archive. So the
// health check is computed independently and merged into the one output string.
//
// The whisper is STATELESS by design (D-412 point 3): no "did I already say
// this" sidecar. It is present on every prompt while the failure is active and
// gone the moment a success lands — the Tailscale present-only-when-broken
// model, whose stuck-warning bug (#19241) is what statefulness invites.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPromptHookOutput,
  formatHealthWhisper,
  formatMemoryOffMessage,
  WHISPER_MAX_BYTES,
} from '../packages/cli/src/capture-prompt.mjs';
import { HEALTH_CODES, HEALTH_FRESHNESS_MS } from '../packages/cli/src/health-log.mjs';
import { readRecallLog } from '../packages/cli/src/recall-log.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BIN = join(REPO_ROOT, 'packages', 'cli', 'bin', 'cmk-capture-prompt.mjs');
const NOW = '2026-08-01T12:00:00Z';
const NOW_MS = Date.parse(NOW);

let sandbox;
let projectRoot;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-whisper-'));
  projectRoot = join(sandbox, 'proj');
  mkdirSync(join(projectRoot, 'context', 'memory'), { recursive: true });
  mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
});
afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

/** Seed a health.log with `n` consecutive fails for `cls`, `agoMs` old. */
function seedFails(cls, n, agoMs = 60_000) {
  const lines = [];
  for (let i = n; i >= 1; i--) {
    lines.push(
      JSON.stringify({
        ts: new Date(NOW_MS - agoMs - i * 1000).toISOString(),
        schema: 1,
        class: cls,
        outcome: 'fail',
      }),
    );
  }
  writeFileSync(join(projectRoot, 'context', '.locks', 'health.log'), lines.join('\n') + '\n', 'utf8');
}

function seedSuccess(cls) {
  writeFileSync(
    join(projectRoot, 'context', '.locks', 'health.log'),
    JSON.stringify({ ts: new Date(NOW_MS - 1000).toISOString(), schema: 1, class: cls, outcome: 'ok' }) + '\n',
    { encoding: 'utf8', flag: 'a' },
  );
}

const seedIndex = () =>
  writeFileSync(
    join(projectRoot, 'context', 'memory', 'INDEX.md'),
    '# Granular memory index\n\n## Files\n\n- (P-AAAAAAAA) [project] [x](project_x.md) — y\n',
    'utf8',
  );

const SUBSTANTIVE = 'what did we decide about the deploy target?';

// --- the pure formatters -----------------------------------------------------

describe('formatHealthWhisper (pure)', () => {
  const w = (over = {}) => ({
    code: HEALTH_CODES.EXTRACT_FAILING,
    title: 'auto-extract keeps failing',
    severity: 'memory-off',
    primaryAction: 'cmk doctor',
    fixClass: 'advise',
    strikes: 2,
    ...over,
  });

  it('names the failure, the troubleshooting skill, and the exact fix — on ONE line', () => {
    const line = formatHealthWhisper([w()]);
    expect(line).toContain('core-memory-kit');
    expect(line).toContain('auto-extract keeps failing');
    expect(line).toContain('troubleshooting');
    expect(line).toContain('cmk doctor');
    expect(line).not.toMatch(/\n/);
  });

  it('collapses multiple actives to the MOST SEVERE plus a count — still one line', () => {
    const line = formatHealthWhisper([
      w({ code: HEALTH_CODES.EXTRACT_FAILING, title: 'the severe one', severity: 'memory-off' }),
      w({ code: HEALTH_CODES.INJECT_FAILING, title: 'the lesser one', severity: 'degraded' }),
      w({ code: HEALTH_CODES.INDEX_DRIFT, title: 'the least one', severity: 'advisory' }),
    ]);
    expect(line).toContain('the severe one');
    expect(line).not.toContain('the lesser one');
    expect(line).toMatch(/\+2 more/);
    expect(line).not.toMatch(/\n/);
  });

  it('no active warnings → null (present-only-when-broken)', () => {
    expect(formatHealthWhisper([])).toBe(null);
    expect(formatHealthWhisper(undefined)).toBe(null);
  });

  it('AT-CAP byte budget: a whisper exactly at WHISPER_MAX_BYTES is emitted whole', () => {
    // Pad the title so the rendered line lands exactly on the budget.
    let title = 'x';
    let line = formatHealthWhisper([w({ title })]);
    while (Buffer.byteLength(line, 'utf8') < WHISPER_MAX_BYTES) {
      title += 'x';
      line = formatHealthWhisper([w({ title })]);
    }
    expect(Buffer.byteLength(line, 'utf8')).toBe(WHISPER_MAX_BYTES);
    expect(line).not.toContain('…'); // nothing was cut
  });

  it('OVER-CAP byte budget: a longer whisper is truncated to the budget, never past it', () => {
    const line = formatHealthWhisper([w({ title: 'y'.repeat(4000) })]);
    expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(WHISPER_MAX_BYTES);
    // The truncation must not eat the actionable tail — a whisper that says
    // "something broke" and nothing else is worse than no whisper.
    expect(line).toContain('troubleshooting');
    expect(line).toContain('cmk doctor');
  });

  it('multi-byte characters never split mid-codepoint at the cap', () => {
    const line = formatHealthWhisper([w({ title: '→'.repeat(2000) })]);
    expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(WHISPER_MAX_BYTES);
    expect(line).not.toContain('�'); // no replacement character
  });
});

describe('formatMemoryOffMessage (pure)', () => {
  it('emits a user-visible line ONLY at severity memory-off', () => {
    const off = formatMemoryOffMessage([
      { code: 'x', title: 'capture is dead', severity: 'memory-off', primaryAction: 'cmk doctor' },
    ]);
    expect(off).toContain('core-memory-kit');
    expect(off).toContain('cmk doctor');
    expect(off).not.toMatch(/\n/);
  });

  it('degraded and advisory stay MODEL-ONLY — no user-facing interruption', () => {
    expect(
      formatMemoryOffMessage([{ code: 'x', title: 't', severity: 'degraded', primaryAction: 'cmk doctor' }]),
    ).toBe(null);
    expect(
      formatMemoryOffMessage([{ code: 'x', title: 't', severity: 'advisory', primaryAction: 'cmk reindex' }]),
    ).toBe(null);
    expect(formatMemoryOffMessage([])).toBe(null);
  });
});

// --- the composed boundary ---------------------------------------------------

describe('buildPromptHookOutput — the whisper does NOT inherit the hint gates', () => {
  it('fires on a 2-char prompt, where the memory hint is null by design', () => {
    seedIndex();
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2);
    const out = buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW });
    expect(out.additionalContext).toBeTruthy();
    expect(out.additionalContext).toContain('troubleshooting');
    // the recall hint is genuinely absent — this is the whisper alone
    expect(out.additionalContext).not.toContain('memory-search');
  });

  it('fires on a project with NO granular archive — the very shape a broken install has', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2); // no INDEX.md at all
    const out = buildPromptHookOutput({ projectRoot, prompt: SUBSTANTIVE, now: NOW });
    expect(out.additionalContext).toContain('troubleshooting');
  });

  it('when BOTH fire, the whisper leads and the hint follows in ONE string', () => {
    seedIndex();
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2);
    const out = buildPromptHookOutput({ projectRoot, prompt: SUBSTANTIVE, now: NOW });
    expect(out.additionalContext).toContain('troubleshooting');
    expect(out.additionalContext).toContain('memory-search');
    expect(out.additionalContext.indexOf('troubleshooting')).toBeLessThan(
      out.additionalContext.indexOf('memory-search'),
    );
  });

  it('a healthy project emits exactly what it emitted before Task 250', () => {
    seedIndex();
    const out = buildPromptHookOutput({ projectRoot, prompt: SUBSTANTIVE, now: NOW });
    expect(out.additionalContext).toContain('memory-search');
    expect(out.additionalContext).not.toContain('troubleshooting');
    expect(out.systemMessage).toBe(null);
  });

  it('a fully healthy, non-substantive prompt emits nothing at all', () => {
    const out = buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW });
    expect(out).toEqual({ additionalContext: null, systemMessage: null });
  });

  it('does NOT fire on a single stochastic blip (the noise threshold, end to end)', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 1);
    expect(buildPromptHookOutput({ projectRoot, prompt: SUBSTANTIVE, now: NOW }).additionalContext).toBe(null);
  });

  it('DOES fire on the first strike of a deterministic class', () => {
    seedFails(HEALTH_CODES.AGENT_CLI_MISSING, 1);
    expect(buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW }).additionalContext).toContain(
      'troubleshooting',
    );
  });

  it('does NOT fire on 8-day-old evidence (stale — it may long since be fixed)', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2, HEALTH_FRESHNESS_MS + 24 * 60 * 60 * 1000);
    expect(buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW }).additionalContext).toBe(null);
  });

  it('SELF-CLEAN: one success after the streak and the whisper is gone — no command, no state', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 3);
    expect(buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW }).additionalContext).toBeTruthy();
    seedSuccess(HEALTH_CODES.EXTRACT_FAILING);
    expect(buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW }).additionalContext).toBe(null);
  });

  it('memory-off ALSO emits the user-visible systemMessage; degraded does not', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2); // memory-off
    expect(buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW }).systemMessage).toContain(
      'core-memory-kit',
    );
    rmSync(join(projectRoot, 'context', '.locks', 'health.log'));
    seedFails(HEALTH_CODES.INJECT_FAILING, 2); // degraded
    const out = buildPromptHookOutput({ projectRoot, prompt: 'go', now: NOW });
    expect(out.additionalContext).toContain('troubleshooting');
    expect(out.systemMessage).toBe(null);
  });

  it('FAIL-OPEN: an unreadable health log degrades to no whisper, never to a throw', () => {
    seedIndex();
    rmSync(join(projectRoot, 'context', '.locks', 'health.log'), { force: true });
    mkdirSync(join(projectRoot, 'context', '.locks', 'health.log'), { recursive: true });
    const out = buildPromptHookOutput({ projectRoot, prompt: SUBSTANTIVE, now: NOW });
    expect(out.additionalContext).toContain('memory-search'); // the hint still works
    expect(out.additionalContext).not.toContain('troubleshooting');
  });

  it('FAIL-OPEN: a broken HINT never suppresses the whisper (the two are independent)', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2);
    mkdirSync(join(projectRoot, 'context', 'memory', 'INDEX.md'), { recursive: true }); // unreadable INDEX
    expect(buildPromptHookOutput({ projectRoot, prompt: SUBSTANTIVE, now: NOW }).additionalContext).toContain(
      'troubleshooting',
    );
  });

  it('PRIVACY: no prompt text reaches the whisper, however alarming the prompt', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2);
    const secret = 'my password is hunter2 and my token is sk-ant-SENTINELVALUE';
    const out = buildPromptHookOutput({ projectRoot, prompt: secret, now: NOW });
    expect(out.additionalContext).not.toContain('hunter2');
    expect(out.additionalContext).not.toContain('SENTINELVALUE');
  });

  it('OVER-MUTATION GUARD: the whisper adds no recall-log entry of its own', () => {
    seedIndex();
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2);
    buildPromptHookOutput({ projectRoot, prompt: SUBSTANTIVE, now: NOW });
    const entries = readRecallLog(projectRoot);
    expect(entries).toHaveLength(1); // exactly the hint's own fire, unchanged
    expect(entries[0].source).toBe('hint');
  });
});

// --- Door 3: the REAL bin, no manual command (the D-169 automatic-path rung) --

describe('the REAL cmk-capture-prompt bin surfaces the whisper (Door 3)', () => {
  function runBin(prompt) {
    return spawnSync(process.execPath, [BIN], {
      input: JSON.stringify({
        session_id: 'sess-whisper-1',
        hook_event_name: 'UserPromptSubmit',
        cwd: projectRoot,
        prompt,
      }),
      encoding: 'utf8',
      timeout: 20_000,
      env: { ...process.env, CMK_PROJECT_DIR: projectRoot },
    });
  }

  it('a seeded failure streak appears in the bin stdout as additionalContext — no command run', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2, 1000);
    const r = runBin('go');
    expect(r.status).toBe(0); // a hook that errors would interrupt the user mid-prompt
    const out = JSON.parse(r.stdout);
    expect(out.continue).toBe(true);
    expect(out.hookSpecificOutput.hookEventName).toBe('UserPromptSubmit');
    expect(out.hookSpecificOutput.additionalContext).toContain('troubleshooting');
    expect(out.hookSpecificOutput.additionalContext).toContain('cmk doctor');
  });

  it('the memory-off systemMessage rides the same stdout object as a sibling field', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2, 1000);
    const out = JSON.parse(runBin('go').stdout);
    expect(typeof out.systemMessage).toBe('string');
    expect(out.systemMessage).toContain('core-memory-kit');
    // both channels in ONE valid JSON object — the model channel and the human
    // channel are siblings, never nested inside each other.
    expect(out.hookSpecificOutput.additionalContext).not.toContain(out.systemMessage);
  });

  it('a HEALTHY project bin run emits no whisper and no systemMessage', () => {
    seedIndex();
    const out = JSON.parse(runBin(SUBSTANTIVE).stdout);
    expect(out.continue).toBe(true);
    expect(out.hookSpecificOutput?.additionalContext ?? '').not.toContain('troubleshooting');
    expect(out.systemMessage).toBeUndefined();
  });

  it('the bin still captures the prompt to the transcript while whispering', () => {
    seedFails(HEALTH_CODES.EXTRACT_FAILING, 2, 1000);
    runBin('a prompt worth keeping');
    const dir = join(projectRoot, 'context', 'transcripts');
    expect(existsSync(dir)).toBe(true);
    // Read WHATEVER landed: with the L1 privacy screen on, the prompt goes to
    // the gitignored live buffer (`{date}.live.md`) rather than the committed
    // day file (design §6.10 / ADR-0019). The capture is the contract here, not
    // which of the two tiers it landed in.
    const written = readdirSync(dir)
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n');
    expect(written).toContain('a prompt worth keeping');
  });
});
