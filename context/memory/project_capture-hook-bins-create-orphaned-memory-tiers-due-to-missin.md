---
id: P-CX2AV7CS
type: project
shape: State
title: Capture-hook bins create orphaned memory tiers due to missing root discovery
created_at: 2026-07-21T15:08:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f4361125bef4f49e8cf2549e3b64da7a99fd7512f2a58dab7848f616b4e33c67
related: [orphaned-memory-tier-at-packages-cli-context-2026-06-18-thro, orphaned-memory-tier-bug-246-and-recovery-strategy, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre]
---

All 8 capture-hook bins pass `projectRoot: process.cwd()` without:
- Root-discovery walk
- `CLAUDE_PROJECT_DIR` precedence

When agent's cwd is a subdirectory, this creates an orphaned memory tier there instead of routing to project root. The project already has `resolveMcpProjectRoot` implementing the correct behavior.

**Why:** Discovered when Task-241 staging found `context/` in `packages/cli/src/` with facts accumulated since 2026-06-18, none mirrored to root tier. The gitignore-per-path approach (`gitignore:111`, 2026-06-13) only treated the symptom at one location.

**How to apply:** Point all 8 bins at existing `discoverRootUpward` resolver (v0.6.2). Add `doctor` check to detect and warn on stray `context/` dirs below root.
