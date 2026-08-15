---
id: P-VV7LEV7M
type: project
shape: Plan
title: v0.5.2 Release Scope and Workflow
created_at: 2026-07-12T18:55:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9fb240bab4fdf8d1febf6c15b764e643a73bde879b0bd1dc275edefb2ff34069
related: [v0-4-6-release-roadmap, v0-5-2-code-complete-pr-286-pending-ci-merge, resume-2026-07-03-post-v044-memora]
---

**Scope (committed to RELEASE-PLAN, D-325, tasks.md header):**
- Task 196: Cursor adapter (ships; Task 208 interactive gate pending token refresh)
- Codex adapter
- Task 165: Kiro-surface fix
- Task 218: MCP index freshness

**Excluded (off-theme):**
- Tasks 223, 224 (privacy judge / server-side; Task 224 is SonarCloud web-UI fix, confirmed non-blocker)

**Startup workflow (when user approves):**
1. Branch off fresh main
2. Read Task-50 seam + cross-agent research note (per read-docs-first rule)
3. Build `defineAgentProfile` Cursor data declaration
4. Implement Codex adapter, Task 165, Task 218
5. Build Task 208 interactive Cursor gate; flag for user's live run once tokens refresh (~2026-07-24)

**Why:** One-theme batching honors differentiator rule; scope committed to source-of-truth docs; workflow prevents context-switch churn

**How to apply:** When user approves start, follow workflow step-by-step; Task 208 gate waits on user token refresh, not a build blocker
