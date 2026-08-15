---
id: P-J76QQ3KL
type: project
title: Distinguish Code Gems From Pitch Copy
created_at: 2026-06-29T11:14:29Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 005d516b37a9c33ddee3ee32aa38f1e68f12adda3949833beaee0e9396a894d6
related: [pitch-line-copy-candidates-d-224, article-verdict-pattern-for-task-ingestion, release-plan-md-authoritative-task-to-lane-map]
---

When ingesting references (articles, discussions, etc.), classify captured knowledge into two categories:
- **Code gems**: actionable implementation ideas, technical insights, task notes — store in the task/work system
- **Pitch copy**: positioning language, metaphors, branding candidates — save in decision logs for README/About polish

Both are worth capturing; the distinction determines storage location and future retrieval context.

**Why:** Ensures captured knowledge is routed to the right place the first time, making it findable and actionable for its intended use (execution vs positioning).

**How to apply:** When reviewing links/articles with the user, identify what type of value it yields, and store/tag accordingly. A single reference may simultaneously be both code gems AND pitch copy.
