// @doors: 1, 2, 5
// Door 3 N/A: no subprocess — health-log.mjs is a pure file append + bounded tail read.
// Door 4 N/A: no message queue.

// Tests for Task 250 — the health log + the Warnable-shaped failure registry
// (D-412, the ratified 8-point design; the Tailscale Warnable borrow from the
// 2026-07-29 self-healing-CLI-repair-UX research note).
//
// Boundary under test: health-log.mjs's public contract —
//   appendHealthEntry(projectRoot, {class, outcome, detail})  (Door 2 + Door 5)
//   computeActiveWarnings(entries, {now})                     (the PURE semantics)
//   activeWarnings(projectRoot, {now})                        (the reader wrapper)
//
// The semantics are the load-bearing half, and they are all EDGE semantics —
// so every one of them is pinned AT its boundary (the budget-pair discipline,
// design §17.10 / D-124):
//   - deterministic class fires at exactly 1 strike
//   - stochastic class does NOT fire at 1, DOES fire at exactly 2
//   - an `ok` between two fails resets the streak
//   - freshness: a fail exactly AT the 7-day window is active; one ms over is not
//   - the tail-read byte budget: entries pushed past HEALTH_TAIL_BYTES are unread
//   - dependsOn cascade: an active upstream code suppresses its downstream codes
//
// Everything is best-effort by module contract (this runs on the per-prompt hot
// path): a broken health log must degrade to "healthy", never to a thrown hook.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  HEALTH_CODES,
  HEALTH_REGISTRY,
  HEALTH_TAIL_BYTES,
  HEALTH_FRESHNESS_MS,
  HEALTH_LOG_SCHEMA_VERSION,
  DETAIL_TOKEN_PATTERN,
  INVALID_DETAIL,
  SEVERITY_RANK,
  healthLogPath,
  appendHealthEntry,
  readHealthTail,
  computeActiveWarnings,
  activeWarnings,
  appendHealthTransition,
  _resetHealthTransitionState,
} from '../packages/cli/src/health-log.mjs';

const DAY = 24 * 60 * 60 * 1000;
const NOW = '2026-08-01T12:00:00Z';
const NOW_MS = Date.parse(NOW);

let root;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'cmk-health-'));
  // Every fixture is an INSTALLED project: `appendHealthEntry` refuses to write
  // (and refuses to create anything) without the install marker, so a bare
  // tmpdir would silently exercise the no-op path instead of the writer.
  mkdirSync(join(root, 'context'), { recursive: true });
  writeFileSync(join(root, 'context', 'MEMORY.md'), '# MEMORY\n', 'utf8'); // the install marker (M2)
  _resetHealthTransitionState(); // the module-level map must not leak across cases
});
afterEach(() => {
  try {
    rmSync(root, { recursive: true, force: true });
  } catch {
    /* Windows may hold a handle; the OS reclaims tmpdir */
  }
});

/** An NDJSON entry the way an instrumented site writes one. */
function entry(cls, outcome, agoMs, extra = {}) {
  return {
    ts: new Date(NOW_MS - agoMs).toISOString(),
    schema: HEALTH_LOG_SCHEMA_VERSION,
    class: cls,
    outcome,
    ...extra,
  };
}

/** Seed the log file directly (bypassing the writer) for reader-side tests. */
function seedLog(lines) {
  mkdirSync(join(root, 'context', '.locks'), { recursive: true });
  writeFileSync(
    healthLogPath(root),
    lines.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n') + '\n',
    'utf8',
  );
}

// --- the registry itself (the extension point — Task 258 enters here) --------

describe('the Warnable-shaped registry', () => {
  it('gives every wave-1 code the full Warnable shape', () => {
    const codes = Object.values(HEALTH_CODES);
    expect(codes.length).toBeGreaterThanOrEqual(6);
    for (const code of codes) {
      const w = HEALTH_REGISTRY[code];
      expect(w, `registry entry for ${code}`).toBeTruthy();
      expect(w.code).toBe(code);
      expect(typeof w.title).toBe('string');
      expect(w.title.length).toBeGreaterThan(0);
      expect(['memory-off', 'degraded', 'advisory']).toContain(w.severity);
      expect(Array.isArray(w.dependsOn)).toBe(true);
      expect(typeof w.primaryAction).toBe('string');
      expect(['silent', 'confirm', 'advise']).toContain(w.fixClass);
      expect([1, 2]).toContain(w.strikeThreshold);
      expect(typeof w.deterministic).toBe('boolean');
    }
  });

  it('binds strikeThreshold to determinism (D-412 point 2: deterministic → 1, stochastic → 2)', () => {
    for (const w of Object.values(HEALTH_REGISTRY)) {
      expect(w.strikeThreshold, `${w.code} threshold`).toBe(w.deterministic ? 1 : 2);
    }
  });

  it('resolves every dependsOn edge to a real registry code (no dangling cascade)', () => {
    for (const w of Object.values(HEALTH_REGISTRY)) {
      for (const dep of w.dependsOn) {
        expect(HEALTH_REGISTRY[dep], `${w.code} dependsOn ${dep}`).toBeTruthy();
        expect(dep).not.toBe(w.code); // no self-suppression
      }
    }
  });

  it('ranks severities memory-off > degraded > advisory', () => {
    expect(SEVERITY_RANK['memory-off']).toBeGreaterThan(SEVERITY_RANK.degraded);
    expect(SEVERITY_RANK.degraded).toBeGreaterThan(SEVERITY_RANK.advisory);
  });
});

// --- Door 2 + Door 5: the append -------------------------------------------

describe('appendHealthEntry (Door 2 state + Door 5 observability)', () => {
  it('appends one NDJSON line per outcome at context/.locks/health.log', () => {
    const r1 = appendHealthEntry(root, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'fail', detail: 'haiku_timeout' });
    const r2 = appendHealthEntry(root, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'ok' });
    expect(r1).toEqual({ ok: true });
    expect(r2).toEqual({ ok: true });

    const path = healthLogPath(root);
    expect(path).toBe(join(root, 'context', '.locks', 'health.log'));
    const lines = readFileSync(path, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.class).toBe(HEALTH_CODES.EXTRACT_FAILING);
    expect(first.outcome).toBe('fail');
    expect(first.detail).toBe('haiku_timeout');
    expect(first.schema).toBe(HEALTH_LOG_SCHEMA_VERSION);
    expect(typeof first.ts).toBe('string');
    expect(Number.isFinite(Date.parse(first.ts))).toBe(true);

    const second = JSON.parse(lines[1]);
    expect(second.outcome).toBe('ok');
    // `detail` is omitted, not written as null — the line stays minimal.
    expect(second).not.toHaveProperty('detail');
  });

  it('is best-effort: an unknown class, a bad outcome, or an unwritable root returns {ok:false} and never throws', () => {
    expect(appendHealthEntry(root, { class: 'not-a-registered-code', outcome: 'fail' })).toEqual({ ok: false });
    expect(appendHealthEntry(root, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'maybe' })).toEqual({ ok: false });
    expect(appendHealthEntry(undefined, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'fail' })).toEqual({ ok: false });
    expect(appendHealthEntry(root, undefined)).toEqual({ ok: false });
    // none of the rejects created a file
    expect(existsSync(healthLogPath(root))).toBe(false);
  });

  it('M2: a repo with a coincidental context/ dir but NO install marker is still a no-op', () => {
    // `context/` is a perfectly ordinary directory name; the install marker
    // (`context/MEMORY.md`, scaffolded on every project) is the honest
    // is-the-kit-here test. Bare-directory detection would drop a health log
    // into somebody's unrelated docs folder.
    const other = mkdtempSync(join(tmpdir(), 'cmk-other-'));
    try {
      mkdirSync(join(other, 'context'), { recursive: true });
      expect(appendHealthEntry(other, { class: HEALTH_CODES.INJECT_FAILING, outcome: 'ok' })).toEqual({ ok: false });
      expect(existsSync(join(other, 'context', '.locks'))).toBe(false);
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  it('I2: a non-token `detail` is REPLACED, never written through and never thrown on', () => {
    // The prose said "NEVER user content"; nothing enforced it, so the first
    // site to pass `err.message` would have put stderr — which can carry a
    // prompt, a path, or a secret — into a file the whisper reads.
    const leaky = 'ENOENT: spawn C:/Users/somebody/secret-project/claude.cmd failed\nstack...';
    expect(appendHealthEntry(root, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'fail', detail: leaky })).toEqual({
      ok: true,
    });
    const [e] = readHealthTail(root);
    expect(e.detail).toBe(INVALID_DETAIL);
    expect(e.detail).not.toContain('somebody');
    expect(e.outcome).toBe('fail'); // the EVENT survives; only the reason is dropped
  });

  it('I2: the real machine tokens the kit passes all pass the guard unchanged', () => {
    for (const token of ['haiku_timeout', 'spawn-enoent', 'auto-extract-missing', 'mk_timeline', 'index-rebuild-failed']) {
      expect(DETAIL_TOKEN_PATTERN.test(token), `${token} must be a valid detail token`).toBe(true);
    }
  });

  it('NEVER scaffolds a memory tier: a root with no context/ is a no-op, not a new directory', () => {
    // The health log is a diagnostic ABOUT a kit installation, so there is
    // nothing to diagnose where the kit is not installed. This is not a nicety:
    // the instrumented sites run on ordinary hook paths in arbitrary
    // directories, and a `mkdirSync(recursive)` on the way to writing the log
    // would silently create `context/` in a non-kit repo — exactly what the
    // Task-190 non-kit-project gate forbids, and how a diagnostic ends up
    // changing state it has no business touching.
    const bare = mkdtempSync(join(tmpdir(), 'cmk-bare-'));
    try {
      expect(appendHealthEntry(bare, { class: HEALTH_CODES.INJECT_FAILING, outcome: 'ok' })).toEqual({ ok: false });
      expect(existsSync(join(bare, 'context'))).toBe(false);
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });

  it('creates .locks INSIDE an existing context/, so a real project never has to pre-make it', () => {
    // The fixture has context/ but no .locks/ — the state a freshly-installed
    // project is in before its first lock/audit write.
    expect(existsSync(join(root, 'context', '.locks'))).toBe(false);
    expect(appendHealthEntry(root, { class: HEALTH_CODES.INJECT_FAILING, outcome: 'ok' })).toEqual({ ok: true });
    expect(existsSync(healthLogPath(root))).toBe(true);
  });

  it('OVER-MUTATION GUARD: appending one class leaves every other class\'s entries byte-untouched', () => {
    const seeded = [
      entry(HEALTH_CODES.INJECT_FAILING, 'fail', 1000),
      entry(HEALTH_CODES.MCP_TOOL_FAILING, 'ok', 900),
      entry(HEALTH_CODES.INDEX_DRIFT, 'fail', 800),
    ];
    seedLog(seeded);
    const before = readFileSync(healthLogPath(root), 'utf8');

    appendHealthEntry(root, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'fail' });

    const after = readFileSync(healthLogPath(root), 'utf8');
    expect(after.startsWith(before)).toBe(true); // append-only: the prefix is identical
    const lines = after.trim().split('\n');
    expect(lines).toHaveLength(4);
    // the three pre-existing records survive verbatim, in order
    expect(lines.slice(0, 3).map((l) => JSON.parse(l).class)).toEqual([
      HEALTH_CODES.INJECT_FAILING,
      HEALTH_CODES.MCP_TOOL_FAILING,
      HEALTH_CODES.INDEX_DRIFT,
    ]);
  });
});

// --- B2: transition logging, and the budget × cadence composition -----------

describe('appendHealthTransition — the high-cadence sites (review finding B2)', () => {
  it('writes ONE baseline ok per process, then suppresses the repeats', () => {
    for (let i = 0; i < 50; i++) {
      appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    }
    expect(readHealthTail(root)).toHaveLength(1);
  });

  it('NEVER suppresses a fail — consecutive fails stay adjacent, so streaks are exact', () => {
    appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'fail' });
    appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'fail' });
    expect(readHealthTail(root).map((e) => e.outcome)).toEqual(['ok', 'fail', 'fail']);
    expect(activeWarnings(root, {}).map((w) => w.code)).toEqual([HEALTH_CODES.MCP_TOOL_FAILING]);
  });

  it('the RESET ok always lands — the transition that clears a warning is never the one dropped', () => {
    // This is the property that makes the optimization safe. Suppressing the
    // first ok after a fail would strand a warning permanently — the exact
    // stuck-warning class the design claims is structurally impossible.
    appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'fail' });
    appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'fail' });
    expect(activeWarnings(root, {})).toHaveLength(1);
    appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    expect(activeWarnings(root, {})).toEqual([]);
  });

  it('tracks each class independently — a chatty class cannot mask a quiet one', () => {
    appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    appendHealthTransition(root, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'ok' });
    for (let i = 0; i < 20; i++) {
      appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    }
    appendHealthTransition(root, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'fail' });
    expect(readHealthTail(root).map((e) => [e.class, e.outcome])).toEqual([
      [HEALTH_CODES.MCP_TOOL_FAILING, 'ok'],
      [HEALTH_CODES.INDEX_DRIFT, 'ok'],
      [HEALTH_CODES.INDEX_DRIFT, 'fail'],
    ]);
  });

  it('a refused append does not poison the memory — the next call still tries', () => {
    const bare = mkdtempSync(join(tmpdir(), 'cmk-bare-t-'));
    try {
      expect(appendHealthTransition(bare, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'ok' })).toEqual({ ok: false });
      // the same class, now on a real project, must still write its baseline
      expect(appendHealthTransition(root, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'ok' })).toEqual({ ok: true });
      expect(readHealthTail(root)).toHaveLength(1);
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });
});

describe('COMPOSITION: the tail budget × writer cadence (review finding B2)', () => {
  it('a sparse 2-strike streak SURVIVES hundreds of high-cadence appends from other classes', () => {
    // THE BUG THIS PINS: the tail is bounded and SHARED. With a plain `ok` per
    // MCP tool call and per fact write, ~186 entries of chatter evicted a real
    // inject-failing streak before the whisper ever read it — the sparse class
    // was structurally unreachable, which is worse than noisy, because the
    // feature silently did not work for exactly the failures it was built for.
    appendHealthEntry(root, { class: HEALTH_CODES.INJECT_FAILING, outcome: 'fail' });
    appendHealthEntry(root, { class: HEALTH_CODES.INJECT_FAILING, outcome: 'fail' });

    // Now simulate a busy session: 400 tool calls + 200 fact writes, all healthy.
    for (let i = 0; i < 400; i++) {
      appendHealthTransition(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    }
    for (let i = 0; i < 200; i++) {
      appendHealthTransition(root, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'ok' });
    }

    expect(activeWarnings(root, {}).map((w) => w.code)).toEqual([HEALTH_CODES.INJECT_FAILING]);
  });

  it('and the raised tail budget covers a burst even WITHOUT transition suppression', () => {
    // Defence-in-depth for a future site that appends directly: 600 plain
    // entries must still fit inside HEALTH_TAIL_BYTES alongside the streak.
    appendHealthEntry(root, { class: HEALTH_CODES.INJECT_FAILING, outcome: 'fail' });
    appendHealthEntry(root, { class: HEALTH_CODES.INJECT_FAILING, outcome: 'fail' });
    for (let i = 0; i < 600; i++) {
      appendHealthEntry(root, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    }
    expect(activeWarnings(root, {}).map((w) => w.code)).toEqual([HEALTH_CODES.INJECT_FAILING]);
  });
});

// --- Door 1: the streak / freshness / cascade semantics, at their EDGES -----

describe('computeActiveWarnings — streak semantics', () => {
  it('AT-CAP deterministic: a deterministic class fires on exactly 1 strike', () => {
    const w = computeActiveWarnings([entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', 1000)], { now: NOW });
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.AGENT_CLI_MISSING]);
    expect(w[0].strikes).toBe(1);
    expect(HEALTH_REGISTRY[HEALTH_CODES.AGENT_CLI_MISSING].deterministic).toBe(true);
  });

  it('UNDER-CAP stochastic: a single blip does NOT fire (the noise threshold)', () => {
    const w = computeActiveWarnings([entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 1000)], { now: NOW });
    expect(w).toEqual([]);
  });

  it('AT-CAP stochastic: exactly 2 consecutive same-class fails DO fire', () => {
    const w = computeActiveWarnings(
      [entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 2000), entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 1000)],
      { now: NOW },
    );
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.EXTRACT_FAILING]);
    expect(w[0].strikes).toBe(2);
  });

  it('a success RESETS the streak — fail, fail, ok, fail is one strike, not three', () => {
    const w = computeActiveWarnings(
      [
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 4000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 3000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'ok', 2000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 1000),
      ],
      { now: NOW },
    );
    expect(w).toEqual([]);
  });

  it('SELF-CLEAN: a trailing success clears an already-firing class (the Tailscale #19241 stuck-warning trap)', () => {
    const fails = [
      entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 3000),
      entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 2000),
    ];
    expect(computeActiveWarnings(fails, { now: NOW })).toHaveLength(1);
    expect(computeActiveWarnings([...fails, entry(HEALTH_CODES.EXTRACT_FAILING, 'ok', 1000)], { now: NOW })).toEqual([]);
  });

  it('streaks are PER-CLASS: another class\'s success never resets this one', () => {
    const w = computeActiveWarnings(
      [
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 4000),
        entry(HEALTH_CODES.INJECT_FAILING, 'ok', 3000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 2000),
      ],
      { now: NOW },
    );
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.EXTRACT_FAILING]);
  });

  it('reports the streak start (brokenSince) so the whisper can be dated', () => {
    const oldest = entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 3000);
    const w = computeActiveWarnings([oldest, entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 1000)], { now: NOW });
    expect(w[0].brokenSince).toBe(oldest.ts);
  });
});

describe('computeActiveWarnings — the 7-day freshness window', () => {
  it('AT-CAP: evidence exactly HEALTH_FRESHNESS_MS old is still active', () => {
    const w = computeActiveWarnings([entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', HEALTH_FRESHNESS_MS)], { now: NOW });
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.AGENT_CLI_MISSING]);
  });

  it('OVER-CAP: evidence one millisecond past the window is stale — no warning', () => {
    const w = computeActiveWarnings([entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', HEALTH_FRESHNESS_MS + 1)], { now: NOW });
    expect(w).toEqual([]);
  });

  it('OVER-CAP (realistic): an 8-day-old failure streak does not whisper', () => {
    const w = computeActiveWarnings(
      [
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 8 * DAY + 1000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 8 * DAY),
      ],
      { now: NOW },
    );
    expect(w).toEqual([]);
  });

  it('freshness keys on the NEWEST fail — an old streak that is still failing today stays active', () => {
    const w = computeActiveWarnings(
      [
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 30 * DAY),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 1000),
      ],
      { now: NOW },
    );
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.EXTRACT_FAILING]);
    expect(w[0].strikes).toBe(2);
  });
});

describe('computeActiveWarnings — dependsOn cascade suppression', () => {
  it('an active upstream code suppresses its downstream codes (one root cause, one whisper)', () => {
    const w = computeActiveWarnings(
      [
        entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', 3000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 2000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 1000),
      ],
      { now: NOW },
    );
    expect(HEALTH_REGISTRY[HEALTH_CODES.EXTRACT_FAILING].dependsOn).toContain(HEALTH_CODES.AGENT_CLI_MISSING);
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.AGENT_CLI_MISSING]);
  });

  it('a HEALTHY upstream leaves the downstream warning standing', () => {
    const w = computeActiveWarnings(
      [
        entry(HEALTH_CODES.AGENT_CLI_MISSING, 'ok', 3000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 2000),
        entry(HEALTH_CODES.EXTRACT_FAILING, 'fail', 1000),
      ],
      { now: NOW },
    );
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.EXTRACT_FAILING]);
  });

  it('sorts the surviving warnings by severity, most severe first', () => {
    const w = computeActiveWarnings(
      [
        entry(HEALTH_CODES.INDEX_DRIFT, 'fail', 3000),
        entry(HEALTH_CODES.INJECT_FAILING, 'fail', 2500),
        entry(HEALTH_CODES.INJECT_FAILING, 'fail', 2000),
      ],
      { now: NOW },
    );
    const ranks = w.map((x) => SEVERITY_RANK[x.severity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
  });
});

describe('computeActiveWarnings — malformed + unknown input', () => {
  it('skips malformed lines, unknown classes, and undated entries without throwing', () => {
    const w = computeActiveWarnings(
      [
        { class: HEALTH_CODES.AGENT_CLI_MISSING, outcome: 'fail' }, // no ts
        { ts: new Date(NOW_MS - 1000).toISOString(), class: 'a-future-versions-code', outcome: 'fail' },
        { ts: 'not-a-date', class: HEALTH_CODES.AGENT_CLI_MISSING, outcome: 'fail' },
        null,
        'nonsense',
        entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', 1000),
      ],
      { now: NOW },
    );
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.AGENT_CLI_MISSING]);
    expect(w[0].strikes).toBe(1);
  });

  it('an empty log is healthy', () => {
    expect(computeActiveWarnings([], { now: NOW })).toEqual([]);
    expect(computeActiveWarnings(undefined, { now: NOW })).toEqual([]);
  });

  it('an unparseable `now` returns [] rather than THROWING (the pure function must not be the thing that breaks)', () => {
    const live = [entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', 1000)];
    expect(() => computeActiveWarnings(live, { now: 'not-a-timestamp' })).not.toThrow();
    expect(computeActiveWarnings(live, { now: 'not-a-timestamp' })).toEqual([]);
  });

  it('accepts a Date or an epoch number for `now`, not only an ISO string', () => {
    const live = [entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', 1000)];
    expect(computeActiveWarnings(live, { now: new Date(NOW_MS) }).map((w) => w.code)).toEqual([
      HEALTH_CODES.AGENT_CLI_MISSING,
    ]);
    expect(computeActiveWarnings(live, { now: NOW_MS }).map((w) => w.code)).toEqual([
      HEALTH_CODES.AGENT_CLI_MISSING,
    ]);
  });
});

// --- the reader wrapper + the tail-read byte budget --------------------------

describe('readHealthTail + activeWarnings (the reader wrapper)', () => {
  it('a missing log reads as healthy — never an error', () => {
    expect(readHealthTail(root)).toEqual([]);
    expect(activeWarnings(root, { now: NOW })).toEqual([]);
  });

  it('an unreadable log reads as healthy (fail-open on the hot path)', () => {
    mkdirSync(healthLogPath(root), { recursive: true }); // a DIRECTORY where the log should be
    expect(readHealthTail(root)).toEqual([]);
    expect(activeWarnings(root, { now: NOW })).toEqual([]);
  });

  it('skips corrupt/partial NDJSON lines and keeps reading', () => {
    seedLog([
      entry(HEALTH_CODES.AGENT_CLI_MISSING, 'ok', 3000),
      '{"class":"agent-cli-missing","outcome":"fai', // an interrupted append
      entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', 1000),
    ]);
    const read = readHealthTail(root);
    expect(read).toHaveLength(2);
    expect(activeWarnings(root, { now: NOW }).map((x) => x.code)).toEqual([HEALTH_CODES.AGENT_CLI_MISSING]);
  });

  it('AT-CAP tail budget: a log at exactly HEALTH_TAIL_BYTES is read whole', () => {
    const rows = [];
    let bytes = 0;
    // pad each row so the total lands just under the budget
    while (true) {
      const row = JSON.stringify(entry(HEALTH_CODES.INJECT_FAILING, 'ok', 1000, { detail: 'x'.repeat(80) })) + '\n';
      if (bytes + row.length > HEALTH_TAIL_BYTES) break;
      rows.push(row.trimEnd());
      bytes += row.length;
    }
    seedLog(rows);
    expect(bytes).toBeLessThanOrEqual(HEALTH_TAIL_BYTES);
    expect(readHealthTail(root)).toHaveLength(rows.length);
  });

  it('OVER-CAP tail budget: entries pushed past HEALTH_TAIL_BYTES are not read, and the partial head line is dropped', () => {
    const filler = [];
    let bytes = 0;
    // The OLDEST entry is the interesting one: a deterministic fail buried far
    // beyond the tail budget must NOT surface (bounded read, by design).
    filler.push(entry(HEALTH_CODES.AGENT_CLI_MISSING, 'fail', 5000));
    while (bytes <= HEALTH_TAIL_BYTES * 2) {
      const e = entry(HEALTH_CODES.INJECT_FAILING, 'ok', 1000, { detail: 'y'.repeat(120) });
      filler.push(e);
      bytes += JSON.stringify(e).length + 1;
    }
    seedLog(filler);

    const read = readHealthTail(root);
    expect(read.length).toBeGreaterThan(0);
    expect(read.length).toBeLessThan(filler.length); // the budget bit
    // every surviving line parsed cleanly — the truncated head line was dropped
    expect(read.every((e) => e && typeof e.class === 'string')).toBe(true);
    expect(read.some((e) => e.class === HEALTH_CODES.AGENT_CLI_MISSING)).toBe(false);
    expect(activeWarnings(root, { now: NOW })).toEqual([]);
  });

  it('round-trips the real writer: two appended fails surface as one active warning', () => {
    appendHealthEntry(root, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'fail', detail: 'haiku_failed' });
    appendHealthEntry(root, { class: HEALTH_CODES.EXTRACT_FAILING, outcome: 'fail', detail: 'haiku_timeout' });
    const w = activeWarnings(root, {}); // real clock — the entries were just written
    expect(w.map((x) => x.code)).toEqual([HEALTH_CODES.EXTRACT_FAILING]);
    expect(w[0].primaryAction).toBe(HEALTH_REGISTRY[HEALTH_CODES.EXTRACT_FAILING].primaryAction);
    expect(w[0].title).toBe(HEALTH_REGISTRY[HEALTH_CODES.EXTRACT_FAILING].title);
    expect(w[0].fixClass).toBe(HEALTH_REGISTRY[HEALTH_CODES.EXTRACT_FAILING].fixClass);
  });
});
