---
id: P-LPXY5A7U
type: project
shape: Timeless
title: Autopilot Grant Practice
created_at: 2026-07-15T20:14:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 300dac5b4604ad9aa11acb05db47f1bdd6b93c0d816c69398dbae189e5b02065
related: [stress-gate-required-before-pr-for-spawn-hook-boundary-chang, release-trigger-tag-push-publishes, release-handoff-pr-creation-vs-merge]
---

Autopilot merging is not enabled by default. It requires explicit user authorization:
- Per-PR: user says "automerge" when the PR is ready
- Per-batch: user grants autopilot for an entire task batch (e.g., "grant autopilot for v0.5.5: 230 → 96 → 210")

The assistant should not assume grants carry over between sessions or batches.

**Why:** Merging code is a high-blast-radius decision that requires explicit user authorization. Prevents accidental deployments.

**How to apply:** Before opening a PR, ask the user for authorization. Note: no standing autopilot grant exists for this session; request user decision before proceeding.
