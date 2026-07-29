// PreCompact capture (Task 235, D-364/D-376) — the THIRD now→today roll trigger.
//
// WHY THIS EXISTS (the premise, sharpened — D-376)
// -----------------------------------------------
// It is NOT that context is lost at compaction. `capture-turn` appends every
// completed turn to `now.md`, so the buffer is already durable on disk before
// PreCompact fires. Compaction discards the CONTEXT WINDOW, not the file.
//
// The real gap is that the now→today ROLL has only two triggers, and neither
// fires during a long session:
//
//   - SessionEnd        — Claude Code fires it ONLY on a clean window-close, so
//                         a marathon session that is never cleanly closed never
//                         rolls (the Task-105/D-75 class — the v0.4.0 dogfood
//                         grew now.md to 410 KB exactly this way).
//   - SessionStart-lazy — fires at the start of the NEXT session: too late to
//                         help the session compacting right now.
//
// PreCompact is the only roll trigger that fires DURING a marathon session, and
// a compaction is a reliable signal that the session IS one. That is the value:
// bound now.md and consolidate the buffer at the moment we know it matters.
//
// WHY NOT runLazyCompress
// -----------------------
// It looks like the natural reuse, but its `cron-active` gate is a SessionStart
// concern: "a cron ran recently, it will handle staleness eventually." Eventually
// is 23:00. A compaction at 14:00 on a cron-registered repo would do nothing at
// all. So this composes DIRECTLY on `compressSession` — the same now→today roll
// the SessionEnd hook runs, cron-independent (reuse the pipeline, not the gate).
//
// THE NEVER-BLOCK CONTRACT
// ------------------------
// Primary-source verified 2026-07-20 (code.claude.com/docs/en/hooks): a
// PreCompact hook CAN block compaction via `{"decision":"block"}` or exit 2, and
// its default timeout is 600s. The kit must NEVER use either. Blocking a user's
// compaction to bank memory would hold the session hostage; the posture is
// fail-open everywhere. The bin emits no `decision` and always exits 0.
//
// WHY THE WORK IS DETACHED
// ------------------------
// Nothing here is urgent (the buffer is already on disk), so an inline LLM
// compress would buy nothing and cost 20-80s of visible latency at every
// compaction (the D-179 measurements). The hook gates cheaply, spawns a detached
// worker, and returns — the same posture as capture-turn → auto-extract and
// inject-context → compress-lazy.
//
// Idea borrowed from ECC's `scripts/hooks/pre-compact.js` (D-364; re-read at
// their HEAD 2026-07-20 per the D-375 unconditional rule). What we took: hook
// the event at all, always exit 0, and never leave the event unlogged. What we
// deliberately did NOT take: their synchronous inline LLM call (they make the
// user wait) and their transcript-derived summary (we reuse our own shipped
// compress path rather than forking a second summarizer).

import { existsSync, readFileSync, statSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { nowIso } from './audit-log.mjs';
import { ERROR_CATEGORIES, errorResult } from './result-shapes.mjs';
import { DEFAULT_COOLDOWN_MS, isCooldownActive } from './cooldown.mjs';
import { compressSession } from './compress-session.mjs';
import { CEILING_FREE_TIMEOUT_MS, CEILING_FREE_BACKOFF_MS } from './compress-retry.mjs';

const SESSIONS_REL = ['context', 'sessions'];
const NOW_MD_REL = ['context', 'sessions', 'now.md'];

// Above this size a buffer cannot plausibly be whitespace-only, so the gate
// skips the read entirely. Deliberately generous — the cost of being wrong is
// one spawned worker that immediately no-ops, not a lost roll.
const WHITESPACE_PROBE_MAX = 8192;

/** NDJSON trail for both legs (hook + worker). Door 5. */
export const PRECOMPACT_LOG_REL = Object.freeze(['context', '.locks', 'precompact.log']);

/**
 * Append one NDJSON line. Best-effort: observability must never be the thing
 * that breaks a fail-open hook.
 *
 * @param {{projectRoot: string, entry: object}} a
 */
export function appendPreCompactLog({ projectRoot, entry }) {
  if (!projectRoot) return;
  try {
    mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
    appendFileSync(join(projectRoot, ...PRECOMPACT_LOG_REL), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // best-effort
  }
}

/**
 * Pure spawn descriptor for the detached PreCompact worker (Task 253(c)).
 *
 * Lives in src/ — not inline in the bin — for two reasons: it makes the Door-3
 * contract unit-assertable without a real spawn (the lazyCompressSpawnDescriptor
 * precedent), and the npm bin and the plugin bin are TWINS that were each
 * carrying their own copy of the options object, which is how twins drift.
 *
 * cwd is the OS temp dir, never the working tree: this child outlives the hook
 * by design, and a live process holds a handle on its cwd — on Windows that
 * blocks a later delete/move of the project (the stale-handle race; borrowed as
 * a named technique from obsidian-mind's detached re-index spawn, 2026-07-21
 * note, borrow candidate 6). The worker never read the cwd — it takes its root
 * from argv[2] and CMK_PROJECT_DIR, both set here. Without a root to hand over
 * it INHERITS instead, because the worker's own last-resort fallback is
 * `process.cwd()` and pointing that at tmpdir would be worse than inheriting.
 *
 * @param {object} a
 * @param {string} a.workerPath - absolute path to cmk-precompact-worker.mjs.
 * @param {string} a.projectRoot
 * @param {'auto'|'manual'} a.trigger
 * @returns {{command: string, args: string[], options: object}}
 */
export function precompactWorkerSpawnDescriptor({ workerPath, projectRoot, trigger } = {}) {
  const hasRoot = typeof projectRoot === 'string' && projectRoot !== '';
  return {
    command: process.execPath,
    args: [workerPath, projectRoot],
    options: {
      detached: true,
      stdio: 'ignore',
      cwd: hasRoot ? tmpdir() : undefined,
      windowsHide: true,
      env: { ...process.env, CMK_PROJECT_DIR: projectRoot, CMK_PRECOMPACT_TRIGGER: trigger },
    },
  };
}

/**
 * The cheap inline gate — runs in the HOOK process, before any spawn, so a
 * no-op compaction costs one stat and one small read rather than a detached
 * node process plus an LLM call.
 *
 * Emptiness must match `compressSession`'s own `buffer.trim() === ''` check so
 * the spawn verdict and the actual roll agree (else we'd spawn a worker for a
 * roll that immediately skips — the same coupling detectStaleness documents).
 *
 * @param {object} a
 * @param {string} a.projectRoot
 * @param {string} [a.now]
 * @param {number} [a.cooldownMs]
 * @returns {{run: boolean, reason: string}}
 */
export function shouldPreCompact({ projectRoot, now, cooldownMs = DEFAULT_COOLDOWN_MS } = {}) {
  try {
    if (!projectRoot) return { run: false, reason: 'no-project-root' };
    if (!existsSync(join(projectRoot, ...SESSIONS_REL))) {
      return { run: false, reason: 'no-context-dir' };
    }
    const nowPath = join(projectRoot, ...NOW_MD_REL);
    if (!existsSync(nowPath)) return { run: false, reason: 'empty-buffer' };
    // Size-first, so the HOOK path never does an unbounded read. now.md is the
    // one kit file with no write-side cap (that is what this task exists to
    // bound — the v0.4.0 dogfood reached 410 KB), so reading it whole just to
    // ask "is it blank?" is the wrong shape for a gate under a 10s ceiling.
    //   0 bytes                → empty, no read
    //   > WHITESPACE_PROBE_MAX → certainly not whitespace-only, no read
    //   in between             → read and trim, matching compressSession's own
    //                            `buffer.trim() === ''` check exactly (the gate
    //                            and the roll must agree or we spawn a worker
    //                            for a roll that immediately skips)
    const size = statSync(nowPath).size;
    if (size === 0) return { run: false, reason: 'empty-buffer' };
    if (size <= WHITESPACE_PROBE_MAX && readFileSync(nowPath, 'utf8').trim() === '') {
      return { run: false, reason: 'empty-buffer' };
    }
    // The shared 120s Haiku marker. Two jobs here: it keeps a compaction from
    // spending budget the auto-extract subagent just spent, AND it is the FIRST
    // of the two double-fire guards (see runPreCompact).
    if (isCooldownActive({ projectRoot, now: now ?? nowIso(), cooldownMs })) {
      return { run: false, reason: 'cooldown' };
    }
    return { run: true, reason: 'stale-now' };
  } catch {
    // Fail-open: a gate that throws would wedge the hook it is meant to protect.
    return { run: false, reason: 'gate-error' };
  }
}

/**
 * Roll `now.md` → `today-{date}.md` at the compaction boundary.
 *
 * DOUBLE-FIRE (PreCompact → SessionEnd) — what actually protects what. The two
 * guards are NOT interchangeable, and an earlier version of this comment claimed
 * they were (skill-review, 2026-07-20):
 *
 *   SEQUENTIAL (the common case — a compaction, then a session-end seconds
 *   later). Both guards apply: the cooldown marker is hot (touchCooldownMarker
 *   fires on compressSession's SUCCESS path) AND the buffer is already drained.
 *
 *   CONCURRENT (two rollers whose gate-checks both land before either finishes
 *   its Haiku call — e.g. this detached worker racing a SessionEnd). **The
 *   cooldown provides ZERO protection here**: the marker is only touched after a
 *   successful compress, so both rollers read "not in cooldown" and proceed. The
 *   ONLY thing standing between them is `claimNowBuffer`'s atomic rename
 *   (§16.27 / Task 106) — one `renameSync` on now.md wins, the loser gets ENOENT,
 *   treats it as an empty buffer, and returns skipped BEFORE calling the backend.
 *
 * So: the cooldown is a BUDGET guard, not a concurrency guard. The atomic claim
 * is the mutex, and it is the same one compressSession already relies on for the
 * SessionEnd-vs-SessionStart-lazy race — this path reuses it rather than adding
 * a second mechanism. Pinned by the concurrent test in cli-precompact.test.js;
 * if that claim is ever weakened, this path loses its only real protection.
 *
 * Never throws. Returns a result shape; the caller is a detached worker whose
 * only job is to run this and exit.
 *
 * @param {object} a
 * @param {string}  a.projectRoot
 * @param {object}  a.backend      CompressorBackend
 * @param {string} [a.now]
 * @param {string} [a.trigger]     'auto' | 'manual' (from the hook payload)
 * @param {number} [a.cooldownMs]
 * @returns {Promise<object>}
 */
export async function runPreCompact({
  projectRoot,
  backend,
  now,
  trigger = 'auto',
  cooldownMs = DEFAULT_COOLDOWN_MS,
} = {}) {
  const ts = now ?? nowIso();
  const t0 = Date.now();

  const logAndReturn = (result, extra = {}) => {
    appendPreCompactLog({
      projectRoot,
      entry: {
        ts,
        scope: 'precompact',
        trigger,
        action: result?.action ?? 'unknown',
        duration_ms: Date.now() - t0,
        ...(result?.errorCategory ? { error_category: result.errorCategory } : {}),
        ...(result?.error_category ? { error_category: result.error_category } : {}),
        ...extra,
      },
    });
    return { ...result, duration_ms: Date.now() - t0 };
  };

  if (!projectRoot) {
    return errorResult({
      category: ERROR_CATEGORIES.MISSING_PROJECT_ROOT,
      errors: ['projectRoot is required'],
      duration_ms: Date.now() - t0,
    });
  }
  if (!backend || typeof backend.compress !== 'function') {
    return logAndReturn(
      errorResult({
        category: ERROR_CATEGORIES.MISSING_BACKEND,
        errors: ['backend (CompressorBackend) is required'],
        duration_ms: Date.now() - t0,
      }),
    );
  }

  // Re-check the gate here, not just in the hook: the worker is detached, so an
  // arbitrary gap (and a competing SessionEnd roll) can land between the two.
  const gate = shouldPreCompact({ projectRoot, now: ts, cooldownMs });
  if (!gate.run) {
    return logAndReturn({ action: 'skipped', reason: gate.reason }, { reason: gate.reason });
  }

  let result;
  try {
    result = await compressSession({
      projectRoot,
      backend,
      now: ts,
      // Already past the gate above — don't let the inner call re-gate on the
      // same marker (the runLazyCompress idiom).
      cooldownMs: 0,
      // Ceiling-free: this runs in a DETACHED worker with no hook ceiling, so it
      // takes the generous budget + the one retry, with the 5s backoff that lands
      // a retry AFTER a slow-Haiku window (D-92/F-2 + D-179).
      maxAttempts: 2,
      timeoutMs: CEILING_FREE_TIMEOUT_MS,
      baseBackoffMs: CEILING_FREE_BACKOFF_MS,
    });
  } catch (err) {
    // compressSession's contract is never-throw, but a detached worker must not
    // die silently on an unexpected crash — that would lose the log line too.
    return logAndReturn({ action: 'error', reason: 'compress-crashed', error: err?.message ?? String(err) });
  }

  return logAndReturn(result);
}
