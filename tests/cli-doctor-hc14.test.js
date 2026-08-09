// @doors: 1, 2
// Door 2: the check READS the health log; it writes nothing, and the
//   over-mutation guard pins that the log is byte-unchanged by a doctor run.
// Door 3 N/A: no subprocess — the probes doctor spawns belong to other checks.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: doctor reports through its result object, not an NDJSON log.

// Tests for Task 250 (D-412) — HC-14, the doctor's view of the health log.
//
// WHY THIS CHECK EXISTS AT ALL, given the whisper already reports the same
// failures: the whisper reaches the MODEL on the next prompt; HC-14 reaches the
// USER when they go looking. Someone who suspects their memory is broken runs
// doctor — and before this check, doctor could report thirteen passes while the
// kit's own failure log recorded a week of dead extraction, because every
// existing check probes CONFIGURATION (are the hooks registered, is the INDEX
// consistent) and none of them look at OUTCOMES. That is the D-298 / HC-10
// false-green class, one level up.
//
// THE INVARIANT THAT KEEPS THE TWO HONEST: HC-14 must not re-derive the
// thresholds. It calls the same `activeWarnings` the whisper calls, so doctor
// and the whisper can never disagree about whether something is broken — a
// second copy of "2 consecutive fails, 7-day window" would drift on the first
// tuning change and produce exactly the "doctor says fine, the AI says broken"
// confusion the user would then have to adjudicate.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runDoctor } from '../packages/cli/src/doctor.mjs';
import { install } from '../packages/cli/src/install.mjs';
import { HEALTH_CODES, HEALTH_FRESHNESS_MS, healthLogPath } from '../packages/cli/src/health-log.mjs';

let sandbox;
let projectRoot;
let userDir;

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-hc14-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  mkdirSync(projectRoot, { recursive: true });
  await install({ projectRoot, userTier: userDir, noHooks: true });
});
afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

const NOW = '2026-08-01T12:00:00Z';
const NOW_MS = Date.parse(NOW);

function seedHealth(entries) {
  mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
  writeFileSync(healthLogPath(projectRoot), entries.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
}

function fails(cls, n, agoMs = 60_000) {
  const out = [];
  for (let i = n; i >= 1; i--) {
    out.push({ ts: new Date(NOW_MS - agoMs - i * 1000).toISOString(), schema: 1, class: cls, outcome: 'fail' });
  }
  return out;
}

/** Doctor with the network probes pinned off — HC-14 is the subject here. */
const doctor = () => runDoctor({ projectRoot, userDir, now: NOW, registryFetcher: async () => null });
const hc14 = async () => (await doctor()).checks.find((c) => c.id === 'HC-14');

describe('HC-14 — active kit health warnings', () => {
  it('PASSes when the health log records no active failure', async () => {
    const c = await hc14();
    expect(c).toBeDefined();
    expect(c.status).toBe('pass');
    expect(c).not.toHaveProperty('recoveryCommand'); // nothing to repair
  });

  it('PASSes when the log is missing entirely (a project that has never failed)', async () => {
    rmSync(healthLogPath(projectRoot), { force: true });
    expect((await hc14()).status).toBe('pass');
  });

  it('WARNs on an active warning, naming the code', async () => {
    seedHealth(fails(HEALTH_CODES.EXTRACT_FAILING, 2));
    const c = await hc14();
    expect(c.status).toBe('warn');
    expect(c.message).toContain(HEALTH_CODES.EXTRACT_FAILING);
  });

  it('offers NO repair command when the only action is `cmk doctor` — the command just run', async () => {
    // The line is printed BY doctor, so "→ repair: cmk doctor" is a loop. Most
    // codes' primaryAction is exactly that (correct in the WHISPER, where the
    // model has not run doctor; circular here). The message's pointer to the
    // troubleshooting skill is the real next step.
    seedHealth(fails(HEALTH_CODES.EXTRACT_FAILING, 2));
    const c = await hc14();
    expect(c).not.toHaveProperty('recoveryCommand');
    expect(c.message).toMatch(/troubleshooting/);
  });

  it('DOES offer a repair command when it is a real next step (`cmk reindex`)', async () => {
    seedHealth(fails(HEALTH_CODES.INDEX_DRIFT, 1));
    expect((await hc14()).recoveryCommand).toBe('cmk reindex');
  });

  // Task 47.0 — the integration that gives §8.6.5's console-only signal a home.
  // Nothing in HC-14 knows what a scheduled task is: register-crons records the
  // outcome, HC-14 reports it. That is the whole point of the registry seam, and
  // this test is what proves the two halves actually meet.
  it('surfaces a failed scheduler-settings repair on ONE strike, with the re-register recovery', async () => {
    seedHealth(fails(HEALTH_CODES.CRON_SETTINGS_UNAPPLIED, 1));
    const c = await hc14();
    expect(c.status).toBe('warn');
    expect(c.message).toContain(HEALTH_CODES.CRON_SETTINGS_UNAPPLIED);
    expect(c.recoveryCommand).toBe('cmk register-crons');
  });

  it('a later successful registration CLEARS it — self-clean is structural, not a cleanup step', async () => {
    seedHealth([
      ...fails(HEALTH_CODES.CRON_SETTINGS_UNAPPLIED, 1, 120_000),
      { ts: new Date(NOW_MS - 60_000).toISOString(), schema: 1, class: HEALTH_CODES.CRON_SETTINGS_UNAPPLIED, outcome: 'ok' },
    ]);
    expect((await hc14()).status).toBe('pass');
  });

  it('surfaces the actionable command even when a doctor-only code outranks it', async () => {
    // extract-failing is more severe and sorts first, but its action is the
    // circular one — the repair line should still carry index-drift's.
    seedHealth([...fails(HEALTH_CODES.EXTRACT_FAILING, 2), ...fails(HEALTH_CODES.INDEX_DRIFT, 1)]);
    const c = await hc14();
    expect(c.message).toContain(HEALTH_CODES.EXTRACT_FAILING);
    expect(c.recoveryCommand).toBe('cmk reindex');
  });

  it('is ADVISORY — a warning never makes doctor exit non-zero', async () => {
    seedHealth(fails(HEALTH_CODES.EXTRACT_FAILING, 2));
    const r = await doctor();
    // Only `fail` drives the exit code (subcommands.mjs formatDoctorReport).
    // A kit whose extraction hiccuped twice must not turn every CI doctor run
    // red — the whisper is the actionable channel, this is the visible one.
    expect(r.checks.find((c) => c.id === 'HC-14').status).toBe('warn');
  });

  it('does NOT warn on a single stochastic blip — the same threshold as the whisper', async () => {
    seedHealth(fails(HEALTH_CODES.EXTRACT_FAILING, 1));
    expect((await hc14()).status).toBe('pass');
  });

  it('DOES warn on one strike of a deterministic class', async () => {
    seedHealth(fails(HEALTH_CODES.AGENT_CLI_MISSING, 1));
    const c = await hc14();
    expect(c.status).toBe('warn');
    expect(c.message).toContain(HEALTH_CODES.AGENT_CLI_MISSING);
  });

  it('does NOT warn on stale evidence (past the 7-day window)', async () => {
    seedHealth(fails(HEALTH_CODES.EXTRACT_FAILING, 2, HEALTH_FRESHNESS_MS + 1000));
    expect((await hc14()).status).toBe('pass');
  });

  it('clears once a success lands — no reset command needed', async () => {
    seedHealth(fails(HEALTH_CODES.EXTRACT_FAILING, 2));
    expect((await hc14()).status).toBe('warn');
    seedHealth([
      ...fails(HEALTH_CODES.EXTRACT_FAILING, 2),
      { ts: new Date(NOW_MS - 1000).toISOString(), schema: 1, class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'ok' },
    ]);
    expect((await hc14()).status).toBe('pass');
  });

  it('reports the cascade ROOT only — one root cause, one line (not N symptoms)', async () => {
    seedHealth([
      ...fails(HEALTH_CODES.AGENT_CLI_MISSING, 1),
      ...fails(HEALTH_CODES.EXTRACT_FAILING, 2),
    ]);
    const c = await hc14();
    expect(c.status).toBe('warn');
    expect(c.message).toContain(HEALTH_CODES.AGENT_CLI_MISSING);
    expect(c.message).not.toContain(HEALTH_CODES.EXTRACT_FAILING);
  });

  it('lists every INDEPENDENT active warning, so doctor is not narrower than the log', async () => {
    seedHealth([
      ...fails(HEALTH_CODES.INJECT_FAILING, 2),
      ...fails(HEALTH_CODES.INDEX_DRIFT, 1),
    ]);
    const c = await hc14();
    expect(c.message).toContain(HEALTH_CODES.INJECT_FAILING);
    expect(c.message).toContain(HEALTH_CODES.INDEX_DRIFT);
  });

  it('points at the troubleshooting skill, which holds the actual repair steps', async () => {
    seedHealth(fails(HEALTH_CODES.EXTRACT_FAILING, 2));
    expect((await hc14()).message).toMatch(/troubleshooting/);
  });

  it('SKIPs rather than PASSes when the log cannot be read — an unrun check is not a verified one', async () => {
    rmSync(healthLogPath(projectRoot), { force: true });
    mkdirSync(healthLogPath(projectRoot), { recursive: true }); // a DIRECTORY
    const c = await hc14();
    // The health-log reader is fail-open by contract, so a broken log reads as
    // "no evidence". That is correct for the WHISPER (never nag on a broken
    // diagnostic) and would be a false green HERE — doctor's whole job is to
    // tell the truth about what it could and could not verify.
    expect(c.status).toBe('skip');
  });

  it('OVER-MUTATION GUARD: running doctor leaves the health log byte-identical', async () => {
    const seeded = fails(HEALTH_CODES.EXTRACT_FAILING, 2);
    seedHealth(seeded);
    const before = readFileSync(healthLogPath(projectRoot), 'utf8');
    await doctor();
    expect(readFileSync(healthLogPath(projectRoot), 'utf8')).toBe(before);
  });
});
