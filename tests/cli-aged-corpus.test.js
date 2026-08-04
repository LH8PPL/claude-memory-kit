// @doors: 1, 2, 3
// Door 3: the aging is driven ENTIRELY by real `cmk` subprocesses from this
//   checkout (install / remember / forget / reindex --boot / reindex --full),
//   with an isolated user tier — that is the point of the harness, since the
//   defect class only appears once real commands have re-numbered real rows.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: the harness asserts on the index tables (Door 2) and the search
//   result rows (Door 1); the doctor-facing observability of a desync is
//   asserted in cli-doctor-hc15.test.js.
//
// Task 261 (D-421/D-422) — THE AGED-CORPUS GATE.
//
// Why this file exists, and why it is in the always-on suite rather than only
// in a live-verify script: the bug it guards against shipped past a suite that
// was entirely green, past a cut-gate stage that DOES live-test semantic recall
// with paraphrase queries, and past four live-verify scripts. All of them share
// one property — they build a FRESH corpus. `mkdtemp` → `cmk install` → a few
// facts → ONE index build → assert. On a first build every derived table is
// numbered in insert order and therefore agrees with its source by luck.
//
// We verified fresh state and never aged state. That is the actual gap, and it
// is a class, not a bug.
//
// So this drives the real bins through build → MUTATE → rebuild → assert, twice
// over, and checks the load-bearing invariant after every phase:
//
//     for every live observation, the vector stored at its vec key equals
//     embedding_cache[sha256(model + "\n" + body)]
//
// Verified to go RED on the pre-fix build, and specifically to go red on the
// AGED path while the FRESH path passes — cycle 1 survived, cycle 2's full
// rebuild did not, which is why the harness runs several cycles rather than one.

import { describe, it, expect, afterAll } from 'vitest';
import {
  createAgedSandbox,
  installKit,
  ageCorpus,
  makeStubExtractor,
  verifyVectorInvariant,
  liveObservations,
} from '../scripts/lib/aged-corpus.mjs';

let sandbox = null;
afterAll(() => {
  sandbox?.cleanup();
});

describe('Task 261 — the semantic index survives an AGED corpus, not just a fresh one', () => {
  it('build → mutate → rebuild, twice: every live fact still holds its own vector', async () => {
    sandbox = createAgedSandbox({ prefix: 'cmk-aged-test-' });
    installKit(sandbox);
    const extractor = makeStubExtractor({ dims: 8 });

    // The FRESH baseline — this is the shape every pre-261 gate had, and it
    // passes both before and after the fix. Asserted so the contrast with the
    // aged phases is visible in this file rather than argued for in a comment.
    sandbox.cmk([
      'remember', 'The deployment target is Fly.io, chosen over Render for regional control.',
      '--title', 'Deploy target', '--why', 'Baseline fact for the fresh pass.', '--type', 'project',
    ]);
    sandbox.cmk(['reindex', '--full']);
    const fresh = await verifyVectorInvariant({ projectRoot: sandbox.projectRoot, extractor });
    expect(fresh.mismatches).toEqual([]);
    expect(fresh.misrecalled).toEqual([]);

    // The AGED pass. Each cycle writes facts, expires one, forgets one,
    // supersedes one, removes a fact file outright, then runs BOTH the
    // incremental and the full reindex — asserting after each.
    const phases = [];
    await ageCorpus({
      sandbox,
      cycles: 2,
      factsPerCycle: 3,
      afterCycle: async ({ cycle, phase, projectRoot }) => {
        const r = await verifyVectorInvariant({ projectRoot, extractor });
        phases.push({
          cycle,
          phase,
          mismatches: r.mismatches,
          misrecalled: r.misrecalled,
          checked: r.checked,
        });
      },
    });

    expect(phases).toHaveLength(4); // 2 cycles × (boot, full)
    for (const p of phases) {
      // Table door: no slot holds a foreign vector.
      expect(p.mismatches, `cycle ${p.cycle} after ${p.phase}`).toEqual([]);
      // Response door: every probed fact recalls ITSELF, at rank 1.
      expect(p.misrecalled, `cycle ${p.cycle} after ${p.phase}`).toEqual([]);
      // And the check actually looked at something — a vacuous pass is not a pass.
      expect(p.checked, `cycle ${p.cycle} after ${p.phase}`).toBeGreaterThan(0);
    }

    // The aging must really have aged: rows were added AND removed, and the
    // index was rebuilt from scratch twice.
    expect(liveObservations(sandbox.projectRoot).length).toBeGreaterThan(1);
  }, 600_000);
});
