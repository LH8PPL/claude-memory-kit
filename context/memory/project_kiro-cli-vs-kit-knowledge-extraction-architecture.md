---
id: P-J595J32R
type: project
shape: Relationship
title: 'Kiro-CLI vs. Kit: Knowledge Extraction Architecture'
created_at: 2026-07-06T17:31:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0f176ea54dbcfbece1ab9babc58b864272678efe1a71b5ebd552833967ae9264
related: [kiro-cli-vs-kit-activation-pattern-design, zero-server-local-first-is-the-kit-s-deliberate-design, two-tier-backend-architecture-for-headless-llm-invocation]
---

- **kiro-cli's approach:** extraction happens inline within the interactive turn, no separate backend
- **Kit's approach:** separate headless backend with LLM calls for compression/extraction (BK1–BK4)
- **Tradeoff:** inline extraction is simpler and zero-infra; separate backend enables async and cross-platform portability (Kiro, Cursor, without API keys)

**Why:** Another real-world solution to agent learning. Justifies the kit's architectural choice to separate the backend as a deliberate trade-off for async/portability.

**How to apply:** Reference when discussing future learning-agent architecture iterations; use as validation that the "separate backend" approach has real trade-offs against simpler alternatives.
