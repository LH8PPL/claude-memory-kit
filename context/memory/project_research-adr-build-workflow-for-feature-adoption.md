---
id: P-R3X4TBLZ
type: project
title: Research→ADR→Build Workflow for Feature Adoption
created_at: 2026-06-28T19:23:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2be7ce382639f5afe610afd531961cecd1bf6f601481551a18c81c9273a88871
related: [patch-release-strategy, v0-3-3-bug-semantic-backend-attempted-for-keyword-only-decis, d-157-rule-version-assignment-at-shipment]
---

When evaluating competing projects for mechanism adoption:

1. **Research Phase**: Deep code review (README → docs → code → gap analysis)
2. **Assessment**: Is it on-thesis? Already ahead? Genuinely novel?
3. **Task Filing**: Research/ADR tasks only (not build), with version scoping (v0.4.x)
4. **Decision**: Each research task leads to ADR that decides ADOPT/DEFER/REJECT
5. **Build**: Build tasks spawn only after ADOPT decision

**Task Deduplication**: Check "do we have a task?" before creating — no duplicate work across sessions.

**Why:** Prevents premature build commitment; makes design decisions explicit; keeps research findings organized in release planning

**How to apply:** Apply when researching competing projects; distinguish research/ADR tasks from build tasks when filing
