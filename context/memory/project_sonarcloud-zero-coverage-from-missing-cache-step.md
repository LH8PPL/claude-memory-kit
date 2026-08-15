---
id: P-ENQSa3T9
type: project
title: SonarCloud Zero-Coverage From Missing Cache Step
created_at: 2026-06-15T04:40:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 759dd424b45b80b722afc8822f752963578623dc6e97a25b9382a14a510fbf30
related: [sonarcloud-coverage-job-rate-limited-by-hf-hub-cache-miss, sonarcloud-project-key-rename-coordination]
---

- **Root cause**: The SonarCloud job in `ci.yml` was missing the `actions/cache@v5` step for HF-model downloads.
- **Failure mode**: Without cache, HF-model fetches are rate-limited, fail, semantic tests abort before writing lcov → SonarCloud receives zero coverage report → gate fails.
- **Fix**: Add `actions/cache@v5` to SonarCloud job, mirroring the cache config in the main CI job.
- **Additional fix**: ReDoS hotspot in `auto-persona.mjs:438` (logged as D-155).

**Why:** Failure cascade was non-obvious and blocked the v0.3.1 gate; worth capturing for future SonarCloud troubleshooting.

**How to apply:** When SonarCloud reports zero new coverage unexpectedly, check if the job is missing the cache step. Sync it with the main job's cache config.
