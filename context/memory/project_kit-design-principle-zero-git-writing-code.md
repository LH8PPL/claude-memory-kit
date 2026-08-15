---
id: P-TAFZMXTD
type: project
title: 'Kit Design Principle: Zero Git-Writing Code'
created_at: 2026-07-02T18:00:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ce91f1d352402a4e4360d6c34a4a5afb9fae42ee3518d2f7ab368089f1a36987
related: [cmk-view-task-255-architecture-and-constraints, use-c-temp-or-c-tmp-for-test-scratch-never-the-repo-or-home, kit-delete-guardrail-false-positive-on-commit-messages]
---

The claude-memory-kit ships with zero code that writes to git. All commits and pushes are user-initiated or delegated to external tooling.

**Why:** Prevents accidental or unintended commits; ensures user retains full control over git history; aligns with the kit's design philosophy as a passive memory layer.

**How to apply:** When designing kit features or fixes, avoid adding any git-writing operations or commit automation.
