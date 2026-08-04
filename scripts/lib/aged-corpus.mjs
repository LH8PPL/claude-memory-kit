// The AGED-CORPUS harness (Task 261 / D-421 — the class, not the bug).
//
// WHY THIS EXISTS. Every live-verify script in this repo, and the cut-gate's
// own semantic-recall stage, does the same thing: `mkdtemp` → `cmk install` →
// write a handful of facts → build the index ONCE → assert. That is a FRESH
// corpus, and a fresh corpus hides a whole class of defect, because on a first
// build every derived table is assigned in insert order and therefore lines up
// with its source by luck rather than by contract. D-421 is the proof: the
// semantic index held another fact's embedding for 86.7% of the corpus while
// the cut-gate's semantic stage passed legitimately — it had never aged an
// index, and neither had anything else we run.
//
// So this harness verifies the shape our testing never did:
//
//     build → MUTATE → rebuild → assert     (× N cycles)
//
// The mutation phase drives the operations that, in a real corpus's life,
// reassign row numbers or move rows between surfaces — facts written, facts
// forgotten, facts superseded, facts expired, a fact file removed outright, an
// incremental reindex and a full one. Only then does it assert. A defect that
// needs a second build to appear cannot hide from it.
//
// REUSABLE BY DESIGN. Nothing here is about vectors. `createAgedSandbox` +
// `ageCorpus` are the seam; the caller supplies what to assert through
// `afterCycle`. `verifyVectorInvariant` is one such assertion (Task 261's), and
// other live-verify scripts should add their own rather than fork the harness.
//
// WHAT IS REAL AND WHAT IS STUBBED, stated plainly:
//   - The AGING is entirely real — the actual `cmk` bin from THIS checkout, as
//     a subprocess, against a throwaway project with an isolated user tier.
//     That is the half where row numbers get reassigned, so that is the half
//     that must not be simulated.
//   - The EMBEDDING is stubbed by default (a deterministic content-addressed
//     fake), because the invariant under test is a MAPPING property: does slot
//     X hold fact X's vector? That is true or false independent of what the
//     vectors mean, and requiring a 110 MB ONNX model to check it would make
//     the gate skippable — which is exactly how this class shipped.
//     A real-embedder pass is a separate, opt-in check in the live-verify
//     script (semantic MEANING is what needs the real model; mapping is not).
//   - There is deliberately NO production env-var that swaps in a fake
//     embedder. A flag that makes the kit write meaningless vectors into a
//     content-addressed, durable cache is a footgun aimed at real memory; the
//     stub is injected in-process through the existing `extractorImpl` DI seam
//     instead, and never exists on a user's machine.

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir, platform } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const IS_WIN = platform() === 'win32';
const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DEV_BIN_DIR = join(REPO_ROOT, 'packages', 'cli', 'bin');

const BIN_NAMES = [
  'cmk', 'cmk-daily-distill', 'cmk-weekly-curate', 'cmk-compress-lazy',
  'cmk-inject-context', 'cmk-capture-prompt', 'cmk-observe-edit',
  'cmk-capture-turn', 'cmk-compress-session',
];

/** Point the bare bin names at the DEV tree, so the harness tests THIS checkout. */
function writeShims(binDir) {
  mkdirSync(binDir, { recursive: true });
  for (const name of BIN_NAMES) {
    const target = join(DEV_BIN_DIR, `${name}.mjs`);
    if (IS_WIN) {
      writeFileSync(join(binDir, `${name}.cmd`), `@echo off\r\nnode "${target}" %*\r\n`, 'utf8');
    } else {
      const p = join(binDir, name);
      writeFileSync(p, `#!/bin/sh\nexec node "${target}" "$@"\n`, 'utf8');
      chmodSync(p, 0o755);
    }
  }
}

/**
 * A throwaway project + isolated user tier + PATH shims onto the dev bins.
 * Nothing it does can reach the caller's real memory: MEMORY_KIT_USER_DIR is
 * redirected, the project is a fresh tmpdir, and no cron/publish path is used.
 */
export function createAgedSandbox({ prefix = 'cmk-aged-' } = {}) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const binDir = join(root, 'shimbin');
  const userDir = join(root, 'userdir');
  const projectRoot = join(root, 'project');
  mkdirSync(userDir, { recursive: true });
  mkdirSync(projectRoot, { recursive: true });
  writeShims(binDir);
  const env = {
    ...process.env,
    PATH: binDir + delimiter + process.env.PATH,
    Path: binDir + delimiter + (process.env.Path ?? process.env.PATH),
    MEMORY_KIT_USER_DIR: userDir,
    CMK_SKIP_UPDATE_CHECK: '1',
  };

  /** Run the REAL cmk bin as a subprocess in the sandbox project. */
  function cmk(args, { allowFail = false, timeout = 120_000 } = {}) {
    const r = spawnSync(process.execPath, [join(DEV_BIN_DIR, 'cmk.mjs'), ...args], {
      cwd: projectRoot,
      env,
      encoding: 'utf8',
      timeout,
    });
    if (!allowFail && r.status !== 0) {
      throw new Error(
        `cmk ${args.join(' ')} exited ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
      );
    }
    return r;
  }

  function cleanup() {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      /* the OS reclaims tmpdir; never fail a run on cleanup */
    }
  }

  return { root, binDir, userDir, projectRoot, env, cmk, cleanup };
}

/** Install the kit for real. Hooks off — the harness drives every step itself. */
export function installKit(sandbox) {
  sandbox.cmk(['install', '--no-hooks'], { allowFail: true });
}

/** Live (non-tombstoned, non-superseded) observations, read from the real index. */
export function liveObservations(projectRoot) {
  // Imported lazily so a caller that only wants the sandbox never pays for the
  // native sqlite binding.
  const { openIndexDbSync } = agedDeps();
  const db = openIndexDbSync({ projectRoot });
  try {
    return db
      .prepare(
        'SELECT id, body, source_file FROM observations WHERE deleted_at IS NULL AND superseded_by IS NULL ORDER BY id',
      )
      .all();
  } finally {
    db.close();
  }
}

let _deps = null;
function agedDeps() {
  if (_deps) return _deps;
  throw new Error('aged-corpus: call loadAgedDeps() before using the index-reading helpers');
}

/**
 * Load the kit modules the harness needs. Async + explicit so the sandbox
 * helpers stay importable in contexts that never touch the index.
 */
export async function loadAgedDeps() {
  if (_deps) return _deps;
  const [indexDb, semantic, fm] = await Promise.all([
    import('../../packages/cli/src/index-db.mjs'),
    import('../../packages/cli/src/semantic-backend.mjs'),
    import('../../packages/cli/src/frontmatter.mjs'),
  ]);
  _deps = {
    openIndexDbSync: indexDb.openIndexDb,
    semantic,
    frontmatter: fm,
  };
  return _deps;
}

/**
 * A deterministic, content-addressed stub embedder: distinct text → distinct
 * normalized vector, identical text → byte-identical vector. That is the only
 * property the MAPPING invariant depends on.
 */
export function makeStubExtractor({ dims = 8 } = {}) {
  const calls = [];
  const vec = (text) => {
    const h = createHash('sha256').update(String(text), 'utf8').digest();
    const v = [];
    for (let i = 0; i < dims; i++) v.push((h[i % h.length] + 1) / 256);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    return v.map((x) => x / norm);
  };
  const fn = async (input) => {
    const texts = Array.isArray(input) ? input : [input];
    calls.push(texts.length);
    return { tolist: () => texts.map(vec) };
  };
  fn.dims = dims;
  fn.vectorFor = vec;
  fn.embedCount = () => calls.reduce((a, b) => a + b, 0);
  fn.resetCount = () => calls.splice(0, calls.length);
  return fn;
}

const SEED_BODIES = [
  'Never overwrite an existing backup directory; create a new one per run.',
  'The caching layer is Valkey, with a 5ms p99 read SLA on hot keys.',
  'Deploys run through GitHub Actions to Fly.io on merge to main.',
  'The snapshot builder must not import the sqlite index module.',
  'Release notes are generated from the CHANGELOG, never hand-written.',
  'Tombstones live under context/memory/tombstones and are never deleted.',
  'Background jobs must persist partial progress so a kill at 80% resumes.',
  'Every user-facing shell command must work on Windows as well as POSIX.',
];

/**
 * THE HARNESS: build → mutate → rebuild → assert, N times.
 *
 * Each cycle drives the REAL `cmk` bin through the operations that reassign row
 * numbers or move rows between surfaces in a real corpus's life:
 *
 *   1. WRITE     `cmk remember` (rich) — new facts, new rows
 *   2. EXPIRE    `cmk remember --expires <past>` — a row that stops being live
 *   3. FORGET    `cmk forget --yes` — a row that moves to the tombstone surface
 *   4. SUPERSEDE `superseded_by` written into a fact's frontmatter (the shape
 *                the temporal sweep produces; there is no user-facing verb, so
 *                the on-disk form is the honest stand-in)
 *   5. UNLINK    a fact file removed outright (the hand-`rm` a user does)
 *   6. REINDEX   `cmk reindex --boot` — the incremental / per-path pass
 *   7. REBUILD   `cmk reindex --full` — the pass that DROPs and re-numbers
 *
 * `afterCycle({cycle, projectRoot, sandbox, phase})` is where the caller
 * asserts. It is invoked after the incremental pass AND after the full rebuild,
 * because the two reach different code and a defect may live in either.
 */
export async function ageCorpus({
  sandbox,
  cycles = 3,
  factsPerCycle = 4,
  afterCycle = async () => {},
  log = () => {},
}) {
  await loadAgedDeps();
  const { frontmatter } = _deps;
  let written = 0;

  for (let cycle = 1; cycle <= cycles; cycle++) {
    // 1. WRITE — real captures through the real bin.
    for (let i = 0; i < factsPerCycle; i++) {
      const body = `${SEED_BODIES[written % SEED_BODIES.length]} (cycle ${cycle}, note ${i})`;
      sandbox.cmk([
        'remember', body,
        '--title', `Aged fact c${cycle} n${i}`,
        '--why', `Recorded during aging cycle ${cycle} so the corpus has real history.`,
        '--type', 'project',
      ]);
      written += 1;
    }

    // 2. EXPIRE — a live row that stops being live without being deleted.
    sandbox.cmk([
      'remember', `A time-boxed note that lapsed during cycle ${cycle}.`,
      '--title', `Expiring note c${cycle}`,
      '--why', 'Exercises the expired-but-present branch of the live set.',
      '--type', 'project',
      '--expires', '2020-01-01',
    ], { allowFail: true });

    const live = liveObservations(sandbox.projectRoot);
    if (live.length >= 4) {
      // 3. FORGET — moves a fact to the tombstone surface.
      sandbox.cmk(['forget', live[0].id, '--yes', '--reason', `aged cycle ${cycle}`], {
        allowFail: true,
      });

      // 4. SUPERSEDE — the on-disk shape the temporal sweep writes.
      const target = live[1];
      const successor = live[2];
      const factPath = join(sandbox.projectRoot, target.source_file);
      try {
        const raw = readFileSync(factPath, 'utf8');
        const parsed = frontmatter.parse(raw);
        if (parsed?.frontmatter) {
          parsed.frontmatter.superseded_by = successor.id;
          writeFileSync(factPath, frontmatter.format(parsed), 'utf8');
        }
      } catch {
        /* not every live row is a fact file (scratchpad bullets aren't) — skip */
      }

      // 5. UNLINK — the hand-`rm` of a fact file, which shifts everything after it.
      try {
        const victim = live[3];
        if (victim.source_file.includes('memory')) {
          rmSync(join(sandbox.projectRoot, victim.source_file));
        }
      } catch {
        /* best-effort */
      }
    }

    // 6. INCREMENTAL — the per-path delete/insert route.
    sandbox.cmk(['reindex', '--boot']);
    await afterCycle({ cycle, phase: 'boot', sandbox, projectRoot: sandbox.projectRoot });

    // 7. FULL REBUILD — the route that DROPs the tables and re-numbers every row.
    sandbox.cmk(['reindex', '--full']);
    await afterCycle({ cycle, phase: 'full', sandbox, projectRoot: sandbox.projectRoot });

    log(`cycle ${cycle}/${cycles} aged: ${liveObservations(sandbox.projectRoot).length} live rows`);
  }
  return { cycles, written };
}

/**
 * THE LOAD-BEARING INVARIANT (Task 261 / D-421).
 *
 * For every live observation, the vector stored at its vec key must equal
 * `embedding_cache[sha256(model + "\n" + body)]`. One assertion, and it catches
 * every variant of the family: a re-numbered rowid, a recycled slot, a stale
 * skip-guard, a torn write.
 *
 * Syncs first (so the assertion runs against a CURRENT index, not a lagging
 * one), then verifies two ways: the kit's own `verifyVectorMapping` at the
 * table level, and a behavioural probe that queries with each fact's own body
 * and requires that fact back at rank 1.
 */
export async function verifyVectorInvariant({
  projectRoot,
  extractor,
  modelId = 'aged-harness-stub',
  probeLimit = 25,
}) {
  await loadAgedDeps();
  const { openIndexDbSync, semantic } = _deps;
  const db = openIndexDbSync({ projectRoot });
  try {
    await semantic.loadSqliteVec(db);
    const sync = await semantic.syncSemanticIndex({
      db, modelId, dims: extractor.dims, extractorImpl: extractor,
    });
    if (!sync.ok) return { ok: false, reason: `sync-failed: ${sync.reason}`, mismatches: [] };

    // The table-level half is CONDITIONAL on purpose: `verifyVectorMapping`
    // arrived with the Task 261 fix, so a build predating it has nothing to
    // call. The harness must still be runnable against such a build — that is
    // precisely how you demonstrate the aged path goes red where the fresh path
    // passes. The behavioural half below needs nothing newer than
    // `prepareSemanticBackend` and carries the assertion on its own.
    const verified =
      typeof semantic.verifyVectorMapping === 'function'
        ? await semantic.verifyVectorMapping({ db, modelId, scope: 'facts', sample: 10_000 })
        : { ok: true, checked: 0, mismatches: [], unavailable: 'verifyVectorMapping' };

    // Behavioural half: query with a fact's OWN body; it must come back first.
    //
    // EXPIRED rows are excluded on purpose. Their vector must still be correct
    // (the table-level check above covers them), but search HIDES them by
    // contract — `semanticRowPassesFilters` drops anything past `expires_at` —
    // so asking for one back would be asserting the opposite of the spec. The
    // aging deliberately creates expired facts, so this is load-bearing.
    const nowMs = Date.now();
    const live = db
      .prepare(
        `SELECT id, body FROM observations
          WHERE deleted_at IS NULL AND superseded_by IS NULL
            AND (expires_at IS NULL OR expires_at > ?)
          ORDER BY id LIMIT ?`,
      )
      .all(nowMs, probeLimit);
    const misrecalled = [];
    for (const f of live) {
      if (!f.body?.trim()) continue;
      // syncIndex:false — the sync above already ran; re-syncing the whole
      // corpus per probe would be O(corpus) per fact (the P-5VJJUEES class).
      // It also puts the `syncIndex:false` read path under test, which is the
      // one that reads vec_map without having just written it.
      const prep = await semantic.prepareSemanticBackend({
        db, query: f.body, modelId, dims: extractor.dims, extractorImpl: extractor,
        syncIndex: false,
      });
      if (!prep.ok) {
        misrecalled.push({ id: f.id, got: `prepare-failed:${prep.reason}` });
        continue;
      }
      const top = prep.backend({ limit: 1 })[0];
      if (!top || top.id !== f.id || top.score < 0.999) {
        misrecalled.push({
          id: f.id,
          body: f.body.slice(0, 60),
          got: top?.id ?? '(no hit)',
          gotBody: (top?.snippet ?? '').slice(0, 60),
          score: top?.score ?? null,
        });
      }
    }

    return {
      ok: verified.ok && misrecalled.length === 0,
      checked: verified.checked,
      mismatches: verified.mismatches,
      probed: live.length,
      misrecalled,
      sync,
    };
  } finally {
    db.close();
  }
}
