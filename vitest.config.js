import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{js,mjs,ts}'],
    // 30s (was 10s under vitest 2). vitest 4 has higher per-op + worker
    // overhead, so several I/O-heavy + subprocess-spawning tests that sat just
    // under 10s on v2 now need more headroom (esp. on slower filesystems /
    // under --coverage). A genuine hang still blows 30s. Pathologically-heavy
    // individual tests carry their own larger per-test timeout.
    testTimeout: 30_000,
    // …and the SAME ceiling for setup/teardown hooks, which vitest otherwise
    // leaves at its 10s default (Task 252 detour — the D-406 named trigger:
    // "if this setup-phase class hits a PR where the gate DOES bind,
    // root-causing it becomes a blocking detour"). It bound, so it was
    // root-caused: the recurring "beforeEach failed in one test of an otherwise
    // green file, with an unhelpful `STACK_TRACE_ERROR` in the json" class is a
    // HOOK TIMEOUT. Evidence: the failing `cli-backfill` test measured 11 283 ms
    // — just past the 10s hook default — while every sibling sharing that hook
    // ran in 1.7-4.9 s; forcing `--hookTimeout=1` reproduces the identical
    // serialized error and stack frames. The hooks in question do real work
    // (mkdtemp + `git init` + 2x `git config` = three subprocess spawns), so
    // under full-suite load they legitimately cross 10s — which is exactly the
    // reasoning that raised testTimeout above, never applied to hooks. That is
    // also why the class hit a DIFFERENT file each time it was observed
    // (index-rebuild / capture-turn / lazy-compress / MCP-server): all
    // subprocess-heavy setups. A genuine hung hook still fails, at 30s.
    hookTimeout: 30_000,
    // Always-on logging (maintainer directive 2026-06-05, D-68): every vitest
    // run keeps the console `default` reporter AND writes a structured json
    // result file, so a failing run is never undiagnosable. The json reporter
    // is a side channel — it doesn't change console output, TTY detection, or
    // timing (unlike a stdout tee). The outputFile lives at test.outputFile (NOT
    // baked into the reporter tuple) so the CLI `--outputFile.json=<path>` that
    // `npm run stress` passes OVERRIDES it per run (unique path under
    // .stress-logs/); standalone runs land in .test-logs/last-run.json. Both
    // dirs are gitignored.
    reporters: ['default', 'json'],
    outputFile: { json: '.test-logs/last-run.json' },
    coverage: {
      provider: 'v8',
      // Cover the kit's actual source. Exclude thin bin wrappers (spawn-tested,
      // not unit-covered), dev tooling, fixtures, and generated/runtime dirs.
      include: ['packages/cli/src/**', 'packages/canonicalize/src/**'],
      exclude: [
        '**/node_modules/**',
        '**/bin/**',
        'scripts/**',
        'tests/**',
        'fixtures/**',
        '**/*.config.{js,mjs,ts}',
      ],
      reporter: ['text-summary', 'text', 'lcov'],
      // Thresholds are a RATCHET, not a wall: set just below current coverage
      // so the bar can't silently regress, and raise it as coverage improves.
      // (Numbers from the first measured run — Task 54.)
      //
      // branches: 70 -> 69 on the vitest 2 -> 4 bump (2026-06-02). This is a
      // MEASUREMENT re-baseline, NOT a coverage regression: vitest 4's v8
      // provider counts branches more granularly (AST-aware remapping), so the
      // SAME code that read >=70% branches under v2 reads ~69.3% under v4. Only
      // `branches` moved — lines/functions/statements still pass at 70 under v4,
      // which is the tell that the code didn't regress, the ruler changed. Kept
      // just below the v4-measured value so it still catches a real regression.
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 69,
      },
    },
  },
});
