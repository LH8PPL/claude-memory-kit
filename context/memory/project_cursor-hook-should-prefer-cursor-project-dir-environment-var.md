---
id: P-PJ5HR9aD
type: project
shape: State
title: Cursor-hook should prefer CURSOR_PROJECT_DIR environment variable for path resolution
created_at: 2026-07-09T17:34:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7bf87b486a6efe089c65110782bd92fbfa4d725f9e0de539c1bcd9641ed93b5d
related: [windows-ebusy-when-updating-cmk-during-claude-code-runtime, kiro-cli-env-passing-limitation, kiro-cli-spawns-mcp-in-cmd-exe-wrapper-claude-code-spawns-he]
---

The cursor-hook currently resolves the project root via `workspace_roots`. Research and Cursor staff guidance indicate that `CURSOR_PROJECT_DIR` (environment variable) is documented, always-present, and reliable across platforms. This sidesteps Windows path-format edge cases that can cause the `workspace_roots` normalization to fail.

Recommended fix: Prefer `process.env.CURSOR_PROJECT_DIR` as the primary project root; fall back to `workspace_roots` (with normalize) only if the env var is absent.

**Why:** Previous debugging found Windows path normalization issues with `workspace_roots`; the env var is the documented, staff-recommended workaround for this platform-specific fragility.

**How to apply:** In cursor-hook code, check for `CURSOR_PROJECT_DIR` first before attempting `workspace_roots` path resolution.
