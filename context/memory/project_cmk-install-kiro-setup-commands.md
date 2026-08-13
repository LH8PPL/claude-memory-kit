---
id: P-KWQJTEFG
type: project
shape: Timeless
title: CMK Install + Kiro Setup Commands
created_at: 2026-07-09T07:54:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6c03d737c73ebf6d5a341bc40671fab98cb251be526d7342d34962071ee8c9b8
related: [kiro-cli-integration-test-gate-and-reinstall, d-303-test-environment-confirmed-ready, gate-testing-isolated-throwaway-folders]
---

Working bootstrap sequence for Kiro IDE gate testing:
  - `mkdir C:\Temp\kiro-ide-gate<N>`
  - `cd C:\Temp\kiro-ide-gate<N>`
  - `git init`
  - `cmk install --with-semantic --ide kiro`
  - `cmk doctor` (to verify hooks + backend)
  - **Restart Kiro** to load repacked hooks

After restart, the folder is ready for a live chat session.

**Why:** The user is iterating on a D-303 proof for auto-extract; clean, reproducible gate setup saves re-discovery.

**How to apply:** Use this sequence when setting up a new test environment. Gate10 is preferred over gate2 (which had pre-existing state).
