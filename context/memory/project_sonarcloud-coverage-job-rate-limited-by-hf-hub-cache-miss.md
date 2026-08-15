---
id: P-6LJZ69M5
type: project
title: SonarCloud Coverage Job Rate-Limited by HF Hub Cache Miss
created_at: 2026-06-15T04:22:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 604d75169ed704314e6567201e8c1e51ac8a2d2bd60c98eaaf03dd7e529c556c
related: [sonarcloud-zero-coverage-from-missing-cache-step, regression-test-pinning-on-bug-fixes, stress-testing-omitted-for-pure-read-cli-changes]
---

- **Problem**: test:coverage job in SonarCloud workflow gets rate-limited by Hugging Face Hub when run without HF-model cache, causing semantic tests to fail, vitest to abort, and lcov (coverage report) not to be written.
- **Symptom**: new_coverage metric appears as 0% even though no code regression occurred
- **Root cause**: SonarCloud was the only workflow running test:coverage without the HF-model cache (actions/cache@v5 step)
- **Fix**: Add the same actions/cache@v5 step that ci.yml already uses for other jobs

**Why:** HF Hub rate-limiting on shared API keys is a hidden failure mode in CI; without caching, coverage jobs fail silently. The fix is mechanical (copy the cache step), but the root cause is non-obvious.

**How to apply:** If coverage metrics drop to 0% with no code changes, check whether the affected CI workflow is missing the HF-model cache setup step.
