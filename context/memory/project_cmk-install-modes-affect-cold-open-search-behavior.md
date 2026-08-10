---
id: P-AaTGXLHE
type: project
title: cmk install modes affect cold-open search behavior
created_at: 2026-06-14T20:01:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 535954ecab741c49670a3c02df0799dacb7f081a9e9d982c5114be1e89b11730
related: [test-repo-1455-facts-activated-semantic-mode-today, sonarcloud-coverage-job-rate-limited-by-hf-hub-cache-miss, false-embedder-unavailable-alert-on-scope-decisions]
---

`cmk install` with `--with-semantic` vs keyword-only have distinct effects on test reproducibility:
- **Persona injection (wedge)**: independent of mode
- **Memory-search recall** (used during cold-opens): affected by mode
- Keyword-only can cause paraphrased searches to miss facts that semantic mode finds

**Why:** Testing fixes under different configurations than the original bug report creates false-negative risk (test appears to fail when fix is actually working)

**How to apply:** When re-running cold-opens to validate fixes, use the same `cmk install` mode as the original runs that surfaced the issue
