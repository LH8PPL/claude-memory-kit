---
id: P-UBMTG4BL
type: project
title: Tool Quirk - cmk pack Uses Committed Tree Version
created_at: 2026-07-02T18:55:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c61e9c95148641c71dbd6a8d7b4aff6298805064827aa457365610d4a73e36dd
related: [release-cut-sequencing-and-prerequisites-v0-4-4-pattern, cmk-version-bumping-convention, release-workflow-multi-gate-process-0a-0c]
---

"`cmk pack` reads the committed tree (e.g., committed package.json), not the working directory. Version in tarball is determined by what was committed at the release step. Example: release commit 209e2aa commits package.json with `0.4.4`, so the tarball reports 0.4.4. Use `cmk --version` after install to verify."

**Why:** Build tool reads committed state, not uncommitted changes. Non-obvious and can cause version mismatches if release commit has not yet reached main.

**How to apply:** Ensure version bump is part of the release commit. Verify with `cmk --version` after installing the packed tarball. If mismatch, verify release commit is on main branch.
