---
id: P-22VAP6JX
type: project
title: Lazy Re-Embedding on Model Upgrades
created_at: 2026-06-11T22:15:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5901896684cacc30a6ab8835baecf086a1ca3919
related: [test-repo-1455-facts-activated-semantic-mode-today]
---

When embedding models change, mark facts stale rather than immediately recomputing.
- Affected facts flagged in migration; embeddings left as-is
- Re-embedding happens on-demand during next retrieval for those facts

**Why:** Deferral scales to large deployments; feasible once transcript chunks reach thousands

**How to apply:** Add stale-flag system; during search, detect and re-embed on-demand
