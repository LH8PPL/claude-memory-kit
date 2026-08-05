#!/usr/bin/env node
// Live-verify: semantic recall, on a FRESH corpus and on an AGED one.
//
// Two gaps this closes, both surfaced by D-421 (Task 261).
//
// GAP 1 — semantic search had NO automated live coverage at all. `cmk search
// --mode semantic` was exercised only by hand, in the cut-gate. Everything
// automated stopped at keyword.
//
// GAP 2 — and this is the one that actually let the bug through: every
// automated live check in this repo builds a FRESH corpus (`mkdtemp` →
// `cmk install` → a few facts → ONE index build → assert). On a first build
// every derived table is assigned in insert order and therefore agrees with its
// source by luck. The cut-gate's semantic stage was passing legitimately while
// 86.7% of the real corpus held the wrong fact's vector, because it had never
// aged an index. We verified fresh state and never aged state.
//
// So this script runs the aged harness (scripts/lib/aged-corpus.mjs) — real
// `cmk` bin, real captures, real forgets, real supersessions, real expiries, a
// real hand-`rm`, a real incremental reindex and a real FULL reindex, three
// cycles — and asserts the load-bearing invariant after EVERY phase:
//
//     for every live observation, the vector stored at its vec key equals
//     embedding_cache[sha256(model + "\n" + body)]
//
// DEFAULT PASS uses the deterministic stub embedder through the existing
// `extractorImpl` DI seam. That is deliberate, not a shortcut: the invariant is
// a MAPPING property (does slot X hold fact X's vector), which is true or false
// regardless of what the vectors mean — and gating it on a 110 MB ONNX model
// would make it skippable, which is precisely how this class shipped green.
//
// REAL-EMBEDDER PASS (`CMK_LIVE_EMBEDDER=1`) additionally drives the REAL
// `cmk search --mode semantic` bin over an aged corpus with the real model and
// asserts that a PARAPHRASE query — zero keyword overlap with the fact it must
// find — returns that fact. That is the half that needs real meaning, and it is
// opt-in for the same reason the other live-verify scripts gate their model
// work: cost and download weight, not confidence.
//
// Run: npm run live-verify:semantic            (stub embedder, always safe)
//      CMK_LIVE_EMBEDDER=1 npm run live-verify:semantic   (+ the real model)

import {
  createAgedSandbox,
  installKit,
  ageCorpus,
  makeStubExtractor,
  verifyVectorInvariant,
  liveObservations,
  loadAgedDeps,
} from './lib/aged-corpus.mjs';

const KEEP = process.argv.includes('--keep');
const VERBOSE = process.argv.includes('--verbose');
const WITH_REAL_EMBEDDER = process.env.CMK_LIVE_EMBEDDER === '1';
const CYCLES = Number(process.env.CMK_AGED_CYCLES) || 3;

const results = [];
function log(...a) {
  console.log('[live-verify:semantic]', ...a);
}
function vlog(...a) {
  if (VERBOSE) log(...a);
}
function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  log(`  ${ok ? 'PASS' : 'FAIL'} — ${label}${ok || !detail ? '' : `\n         ${detail}`}`);
}

function describeFailure(r) {
  const parts = [];
  if (r.reason) parts.push(r.reason);
  if (r.mismatches?.length) {
    parts.push(
      `${r.mismatches.length} slot(s) hold the wrong vector: ` +
        r.mismatches.slice(0, 4).map((m) => `${m.key1}(${m.reason})`).join(', '),
    );
  }
  if (r.misrecalled?.length) {
    parts.push(
      `${r.misrecalled.length} fact(s) do not recall themselves: ` +
        r.misrecalled
          .slice(0, 4)
          .map((m) => `asked for ${m.id} "${m.body ?? ''}" → got ${m.got} "${m.gotBody ?? ''}" @${m.score}`)
          .join(' | '),
    );
  }
  return parts.join('; ');
}

async function main() {
  await loadAgedDeps();
  const sandbox = createAgedSandbox({ prefix: 'cmk-semantic-live-' });
  log(`sandbox: ${sandbox.root}`);
  const extractor = makeStubExtractor({ dims: 8 });

  try {
    installKit(sandbox);
    log('kit installed into the throwaway project (isolated user tier)');

    // ---- 1. THE FRESH BASELINE — what our existing gates already prove -----
    // Kept deliberately, and labelled as the WEAK check, so the contrast with
    // the aged pass is visible in the output rather than argued for in prose.
    sandbox.cmk(['remember', 'The deployment target is Fly.io, chosen over Render for regional control.',
      '--title', 'Deploy target', '--why', 'Baseline fact for the fresh pass.', '--type', 'project']);
    sandbox.cmk(['reindex', '--full']);
    const fresh = await verifyVectorInvariant({ projectRoot: sandbox.projectRoot, extractor });
    check(
      'FRESH corpus: every fact holds its own vector (the check our gates already had)',
      fresh.ok,
      describeFailure(fresh),
    );

    // ---- 2. THE AGED PASS — build → mutate → rebuild → assert, × N ---------
    let agedFailures = 0;
    const phaseReport = [];
    const { cycles } = await ageCorpus({
      sandbox,
      cycles: CYCLES,
      factsPerCycle: 4,
      log: vlog,
      afterCycle: async ({ cycle, phase, projectRoot }) => {
        const r = await verifyVectorInvariant({ projectRoot, extractor });
        // `checked` is the table-level count; on a build that predates
        // `verifyVectorMapping` it is 0 and the behavioural probe carries the
        // assertion, so report the probe count rather than a misleading zero.
        const scope = r.checked > 0 ? `${r.checked} live facts` : `${r.probed} probed facts`;
        phaseReport.push({ cycle, phase, ok: r.ok, scope, detail: describeFailure(r) });
        if (!r.ok) agedFailures += 1;
        vlog(`cycle ${cycle} after ${phase}: ok=${r.ok} checked=${r.checked}`);
      },
    });

    for (const p of phaseReport) {
      check(
        `AGED cycle ${p.cycle} after \`reindex --${p.phase}\`: all ${p.scope} hold their own vector`,
        p.ok,
        p.detail,
      );
    }
    check(
      `the aged corpus survived ${cycles} full build→mutate→rebuild cycles with zero mis-mapped vectors`,
      agedFailures === 0,
      `${agedFailures} phase(s) failed`,
    );

    const finalLive = liveObservations(sandbox.projectRoot);
    check(
      'the aging actually aged something — the corpus grew, shrank and rebuilt',
      finalLive.length > 1,
      `${finalLive.length} live rows after ${cycles} cycles`,
    );

    // ---- 3. OPT-IN: the REAL embedder, the REAL bin, a PARAPHRASE query ----
    if (WITH_REAL_EMBEDDER) {
      log('CMK_LIVE_EMBEDDER=1 — running the real-model pass (first run downloads ~110 MB)');
      // A fact with a distinctive meaning and no keyword overlap with the query
      // that must find it. Written AFTER the aging, into an already-aged index.
      sandbox.cmk([
        'remember',
        'Restic snapshots are pruned with a 7-daily 4-weekly 6-monthly retention policy.',
        '--title', 'Snapshot retention policy',
        '--why', 'The real-embedder probe: recalled by meaning, not by shared words.',
        '--type', 'project',
      ]);
      sandbox.cmk(['reindex', '--full']);
      const r = sandbox.cmk(
        ['search', 'how long do we keep old backups around', '--mode', 'semantic', '--limit', '5'],
        { timeout: 900_000 },
      );
      const out = r.stdout ?? '';
      check(
        'REAL embedder + REAL bin: a paraphrase query with zero keyword overlap finds the fact by meaning',
        /Restic snapshots are pruned/.test(out),
        `first 300 chars: ${out.slice(0, 300)}`,
      );
      // And the same aged index must still pass the mapping invariant when the
      // vectors are real ones, not the stub's.
      const { semantic } = await loadAgedDeps();
      const { openIndexDbSync } = await loadAgedDeps();
      const db = openIndexDbSync({ projectRoot: sandbox.projectRoot });
      try {
        await semantic.loadSqliteVec(db);
        const modelId =
          db.prepare("SELECT value FROM vec_meta WHERE key = 'model'").get()?.value ??
          semantic.DEFAULT_MODEL_ID;
        const v = await semantic.verifyVectorMapping({ db, modelId, scope: 'facts', sample: 10_000 });
        check(
          'REAL embedder on the AGED index: every sampled fact still holds its own vector',
          v.ok,
          describeFailure(v),
        );
      } finally {
        db.close();
      }
    } else {
      log('(real-embedder pass skipped — set CMK_LIVE_EMBEDDER=1 to include it)');
    }
  } finally {
    if (KEEP) log(`--keep set; sandbox preserved at ${sandbox.root}`);
    else sandbox.cleanup();
  }

  console.log('');
  log('================ SEMANTIC LIVE VERIFY ================');
  for (const r of results) log(`  ${r.ok ? 'PASS' : 'FAIL'} — ${r.label}`);
  log('=====================================================');
  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) {
    log(`${results.length}/${results.length} — semantic recall holds on an AGED corpus, not just a fresh one.`);
    process.exit(0);
  }
  log(`${failed.length} check(s) FAILED.`);
  for (const f of failed) log(`  FAILED: ${f.label}\n    ${f.detail}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('[live-verify:semantic] ERROR:', err?.stack ?? err);
  process.exit(2);
});
