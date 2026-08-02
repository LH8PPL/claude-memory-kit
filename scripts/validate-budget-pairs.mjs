#!/usr/bin/env node
// validate-budget-pairs.mjs — every documented numeric budget has an
// at-cap + over-cap test pair, or a written suppression
// (Task 137.4 — the D-124 class made structural).
//
// The class: the extraction output cap (maxOutputBytes) was documented and
// enforced, but no test sat AT and OVER the boundary — so the hard-slice
// clipping a rich fact mid-word shipped, and a 9-char corrupted stub
// reached disk. Budgets fail at their EDGES; happy-path tests never visit
// them.
//
// Enforcement is registry-driven: BUDGET_REGISTRY below names every
// documented budget, its source-of-truth reference, and the test file +
// at-cap/over-cap patterns proving the boundary pair exists — OR a
// `suppressed: '<reason>'` making the gap visible instead of silent.
// Adding a budget without boundary tests forces a registry decision.
//
// Relation to validate-composition.mjs: that validator covers CLAUDE.md's
// composition INSTANCES (narrative → artifact); this one covers numeric
// BUDGET boundaries (cap → at/over test pair). The task entry's original
// "folds into validate-composition" wording predates that validator
// shipping with its narrower scope.
//
// Run: `node scripts/validate-budget-pairs.mjs`
// Wired into `npm test` as a pre-test step.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = process.env.CMK_VALIDATOR_ROOT
  ? resolve(process.env.CMK_VALIDATOR_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The documented budgets. Patterns are plain substrings matched against the
 * test file's text (comments count — they anchor intent; the test body's
 * quality is the review's job, the validator catches structural omission).
 */
export const BUDGET_REGISTRY = [
  {
    name: 'stale-global update check timeout (UPDATE_CHECK_TIMEOUT_MS=2500 — doctor must never hang on an unreachable registry)',
    sourceRef: 'design section HC-9 stale-global half / Task 245 (D-388)',
    testFile: 'tests/cli-update-check.test.js',
    atCapPattern: 'at-cap',
    overCapPattern: 'over-cap',
  },
  {
    name: 'feedback-screen rate-limit (RATE_LIMIT_PER_FACT_PER_DAY=5, per-fact daily trust-delta cap)',
    sourceRef: 'design section 20.2 / Task 193 (ADR-0017 Phase 1d)',
    testFile: 'tests/cli-feedback-screen.test.js',
    atCapPattern: 'RATE_LIMIT_PER_FACT_PER_DAY',
    overCapPattern: 'rate-limited',
  },
  {
    name: 'feedback-screen burst-hold (BURST_MIN_SIGNALS=10 + BURST_NEGATIVE_FRACTION=0.8, storm quarantine)',
    sourceRef: 'design section 20.2 / Task 193 (ADR-0017 Phase 1d)',
    testFile: 'tests/cli-feedback-screen.test.js',
    atCapPattern: 'BURST_MIN_SIGNALS',
    overCapPattern: 'quarantined',
  },
  {
    name: 'extraction-output-cap (maxOutputBytes 8192, clipped-fact drop)',
    sourceRef: 'design §6.4 / D-124 (Task 136)',
    testFile: 'tests/cli-auto-extract.test.js',
    atCapPattern: 'maxOutputBytes',
    overCapPattern: 'clipped_facts_dropped',
  },
  {
    name: 'scratchpad per-file cap (max_chars consolidate-on-over-cap)',
    sourceRef: 'design §7.1 cap-coordination',
    testFile: 'tests/cli-scratchpad.test.js',
    atCapPattern: 'max_chars',
    overCapPattern: 'consolidat',
  },
  {
    name: 'tool-activity block caps (300-char snippets / 4000-char block)',
    sourceRef: 'design §19 / D-117 (Task 104.1)',
    testFile: 'tests/cli-turn-tools.test.js',
    atCapPattern: 'truncat',
    overCapPattern: 'caps each result snippet',
  },
  {
    name: 'semantic embed batch caps (EMBED_BATCH_SIZE=16 items / EMBED_BATCH_CHARS=8000 chars per ONNX forward pass — P-5VJJUEES 8.8GB freeze guard)',
    sourceRef: 'semantic-backend.mjs planEmbedBatches / P-5VJJUEES (the 2026-07-07 memory-leak fix)',
    testFile: 'tests/cli-semantic-backend.test.js',
    // at-cap: batches never exceed the item-count budget; over-cap: a body
    // larger than the char budget forms its own solo batch (the padding-blowup case).
    atCapPattern: 'EMBED_BATCH_SIZE',
    overCapPattern: 'EMBED_BATCH_CHARS',
  },
  {
    name: 'transcript-promote judge budget (site-aware: PII_JUDGE_TIMEOUT_MS=120s ceiling-free default for the detached child; PII_JUDGE_SESSIONEND_TIMEOUT_MS=50s at the SessionEnd site × PROMOTE_MAX_FILES_PER_RUN=2 — inside the 50s-under-60s ceiling — P-AAHW235S/D-179)',
    sourceRef: 'design §6.10 / §8.5 (Task 148.8 + P-AAHW235S, ADR-0019)',
    testFile: 'tests/cli-transcript-screen.test.js',
    // at-cap: the per-run file bound holds (2 judged, 3rd waits); over-cap:
    // the detached-child default is the ceiling-free 120s (the 20s bug fix).
    atCapPattern: 'PROMOTE_MAX_FILES_PER_RUN',
    overCapPattern: 'PII_JUDGE_TIMEOUT_MS).toBe(120_000',
  },
  {
    name: 'snapshot Σ-caps + authority-preamble reserve (≤14,500 B since 148.5; was 13,000)',
    sourceRef: 'design §7.1.2',
    suppressed:
      'enforced structurally on every npm test by validate-template assertion 3 (Σ caps + preamble reserve ≤ cap, gate-bite verified) — a runtime test pair would duplicate the validator',
  },
  {
    name: 'commit-proposal git timeout (400ms, silent degrade)',
    sourceRef: 'design §7.1.3 / ADR-0018 (Task 150)',
    suppressed:
      'the over-cap behavior (a hung git killed at the timeout → empty proposal) needs a controllable slow git binary — impractical as a unit pair; the degrade path is covered by the git-failure branch tests (non-git / spawn-error → silence) and the timeout is the composition guard reviewed under NFR-1 (skill-review I1: 400ms inside the 500ms hook budget)',
  },
  {
    name: 'volatile reserved lines (temporal mention 66.4 + commit proposal 150) vs the snapshot cap',
    sourceRef: 'design §7.1.3',
    suppressed:
      'both lines are RESERVED out of the caller cap (snapshot ≤ capBytes pinned by the tightened cap-composition tests incl. the three-reserve joint test in cli-inject-context.test.js); the template-sizing edge (Σ legal caps + reserves > the snapshot cap → graceful section-drop with a truncation.log event) is the DOCUMENTED accepted trade-off in §7.1.3 with a named re-open trigger',
  },
  {
    name: 'stray-tier scan depth (MAX_SCAN_DEPTH=4 — the maximum INTERMEDIATE directories between the project root and a recoverable stray tier; Task 248)',
    sourceRef: 'design §13.2 / Task 248 (D-389/D-394)',
    testFile: 'tests/cli-memory-recovery.test.js',
    // at-cap: a tier with exactly MAX_SCAN_DEPTH intermediate dirs IS found —
    // the side that was missing, and the side an off-by-one silently ate;
    // over-cap: one level deeper is not walked into.
    atCapPattern: 'AT-CAP: a tier with exactly MAX_SCAN_DEPTH',
    overCapPattern: 'OVER-CAP: a tier one level deeper',
  },
  {
    name: 'recall-hint bm25 score floor (HINT_BM25_SCORE_FLOOR — the top hit must clear the floor to inject index lines; below → static hint; Task 233)',
    sourceRef: 'design §20.8 / ADR-0024 (the octopoda-OS conservative-floor calibration)',
    testFile: 'tests/cli-capture-prompt.test.js',
    // at-cap: a score exactly at the floor clears; over-cap: a score just past
    // the floor (less relevant) falls back to the static hint.
    atCapPattern: 'HINT_BM25_SCORE_FLOOR',
    overCapPattern: 'below the bm25 floor',
  },
  {
    name: 'anchor single-citer floor (MIN_ANCHOR_CITERS=2 — a doc-anchor cited by fewer distinct facts forms no co-citation cluster; skipped)',
    sourceRef: 'design §9.5.1 / Task 256 (D-400)',
    testFile: 'tests/cli-anchor-edges.test.js',
    atCapPattern: 'cited by exactly 2 facts is KEPT',
    overCapPattern: 'cited by only 1 fact is SKIPPED',
  },
  {
    name: 'anchor document-frequency ceiling (ANCHOR_DF_CEILING_RATIO=0.5, effective = max(MIN_ANCHOR_CITERS, floor(N*0.5)) — a doc-anchor cited by more than half the corpus is a stopword hub; dropped; small-corpus floor unbreaks N=2/3)',
    sourceRef: 'design §9.5.1 / Task 256 (D-400)',
    testFile: 'tests/cli-anchor-edges.test.js',
    atCapPattern: 'cited by exactly half the corpus is KEPT',
    overCapPattern: 'cited by more than half the corpus is dropped',
  },
  {
    name: 'viewer facts page size (VIEWER_DEFAULT_LIMIT=50 rows, VIEWER_MAX_LIMIT=200 hard ceiling — an over-cap `?limit=` CLAMPS and reports `clamped:true` rather than 400ing a browse URL)',
    sourceRef: 'design §24.1 / Task 255 (D-414)',
    testFile: 'tests/cli-viewer.test.js',
    atCapPattern: 'AT-CAP limit is honored',
    overCapPattern: 'OVER-CAP clamps and says so',
  },
  {
    name: 'viewer graph node budget (`?limit=` over LIVE facts, newest-first; anchor hubs + archived-superseded predecessors ride on top and are counted separately; over-cap sets truncated:true)',
    sourceRef: 'design §24.1 / Task 255 (D-414)',
    testFile: 'tests/cli-viewer.test.js',
    atCapPattern: 'AT-CAP: a limit of exactly the corpus size',
    overCapPattern: 'OVER-CAP by one',
  },
  {
    name: 'anchor render cap (MAP_ANCHOR_CITERS_SHOWN=20 — MAP.md lists at most this many citers per anchor then "… and N more"; render-only, edges table unaffected)',
    sourceRef: 'design §9.5.1 / Task 256 (D-400)',
    testFile: 'tests/cli-vault-map.test.js',
    atCapPattern: 'at-cap: exactly MAP_ANCHOR_CITERS_SHOWN citers',
    overCapPattern: 'over-cap: 21 citers',
  },
  {
    name: 'health-warning freshness window (HEALTH_FRESHNESS_MS=7d — evidence older than this never whispers, keyed on the NEWEST fail; Task 250)',
    sourceRef: 'design §23.2 / D-412 point 2',
    testFile: 'tests/cli-health-log.test.js',
    // at-cap: a fail exactly AT the window is still active; over-cap: one
    // millisecond past it is stale. The off-by-one here decides whether a
    // fortnight-old failure greets the user on a project they just came back to.
    atCapPattern: 'AT-CAP: evidence exactly HEALTH_FRESHNESS_MS old',
    overCapPattern: 'OVER-CAP: evidence one millisecond past the window',
  },
  {
    name: 'health-log tail-read budget (HEALTH_TAIL_BYTES=16384 — the per-prompt hot path reads a bounded tail, never the whole log; Task 250)',
    sourceRef: 'design §23.2 / D-412 point 4',
    testFile: 'tests/cli-health-log.test.js',
    // at-cap: a log at exactly the budget is read whole; over-cap: entries
    // pushed past it are NOT read (and the partial head line is dropped rather
    // than mis-parsed — the failure mode a naive slice ships).
    atCapPattern: 'AT-CAP tail budget',
    overCapPattern: 'OVER-CAP tail budget',
  },
  {
    name: 'health-warning strike threshold (deterministic=1 / stochastic=2 consecutive same-class fails, no success between — the noise gate; Task 250)',
    sourceRef: 'design §23.2 / D-412 point 2',
    testFile: 'tests/cli-health-log.test.js',
    // NOTE the direction: this budget fires ABOVE its boundary, so the pair is
    // at-threshold (fires) + below-threshold (silent). The silent side is the
    // one that matters — it is the whole noise threshold, and a happy-path test
    // never visits it.
    atCapPattern: 'AT-CAP stochastic: exactly 2 consecutive same-class fails DO fire',
    overCapPattern: 'UNDER-CAP stochastic: a single blip does NOT fire',
  },
  {
    name: 'health-whisper byte cap (WHISPER_MAX_BYTES=320 — the per-prompt cost paid on EVERY prompt while a failure is active; Task 250)',
    sourceRef: 'design §23.3 / D-412 point 3',
    testFile: 'tests/cli-health-whisper.test.js',
    // at-cap: a whisper exactly at the budget is emitted whole; over-cap: a
    // longer one is clipped WITHOUT losing the actionable tail (the skill
    // pointer + the fix command), because "something broke" alone is worse than
    // silence. A third case pins that the clip never splits a codepoint.
    atCapPattern: 'AT-CAP byte budget',
    overCapPattern: 'OVER-CAP byte budget',
  },
  {
    name: 'index-db busy_timeout (5000ms bounded wait before SQLITE_BUSY; Task 219)',
    sourceRef: 'design §16.34 / §16.35 (D-321)',
    suppressed:
      'the at-cap/under-cap side IS tested (tests/cli-index-db-busy-timeout.test.js: a real second process holds the write lock; the parent waits + lands, with the pragma value pinned); the over-cap side (a lock held >5s so SQLITE_BUSY finally surfaces) would need a >5s-holding child in the suite — too slow as a unit pair; the contract is the pragma pin + the driver-verified 5000ms default (D-321)',
  },
];

/**
 * Pure check. `readFile(path) → text | null` is injected for tests.
 *
 * @param {Array<object>} registry
 * @param {(path: string) => string | null} readFile
 */
export function checkBudgetPairs(registry, readFile) {
  const errors = [];
  for (const entry of registry) {
    if ('suppressed' in entry) {
      if (!entry.suppressed || !String(entry.suppressed).trim()) {
        errors.push(`budget '${entry.name}': suppression needs a reason — bare suppression is the silent gap this validator exists to kill`);
      }
      continue;
    }
    const text = readFile(entry.testFile);
    if (text == null) {
      errors.push(`budget '${entry.name}': test file not found at ${entry.testFile}`);
      continue;
    }
    if (!text.includes(entry.atCapPattern)) {
      errors.push(
        `budget '${entry.name}': ${entry.testFile} carries no at-cap pattern ('${entry.atCapPattern}') — ` +
          `the boundary's fits-exactly side is unpinned (${entry.sourceRef})`,
      );
    }
    if (!text.includes(entry.overCapPattern)) {
      errors.push(
        `budget '${entry.name}': ${entry.testFile} carries no over-cap pattern ('${entry.overCapPattern}') — ` +
          `the boundary's exceeds side is unpinned (${entry.sourceRef})`,
      );
    }
  }
  return errors;
}

/** The real-tree runner (also used by the test's live-invariant case). */
export function checkBudgetPairsOnRepo() {
  return checkBudgetPairs(BUDGET_REGISTRY, (rel) => {
    const p = join(REPO, rel);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  });
}

function runCli() {
  const errors = checkBudgetPairsOnRepo();
  if (errors.length > 0) {
    console.error('validate-budget-pairs: FAIL');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  const suppressed = BUDGET_REGISTRY.filter((e) => 'suppressed' in e).length;
  console.log(
    `validate-budget-pairs: OK — ${BUDGET_REGISTRY.length} documented budget(s): ${BUDGET_REGISTRY.length - suppressed} with at/over-cap test pairs, ${suppressed} suppressed with reasons`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
