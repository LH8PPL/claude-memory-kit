---
id: P-LF5GNVaZ
type: project
title: CI Triggering Capability
created_at: 2026-06-16T04:42:38Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 474abcb4c2a1c12d0b94112cbae71ba37c687af35dcf90813c8118ec7d34ecb3
related: [release-trigger-tag-push-publishes, v0-3-2-release-scope-and-141b-gate]
---

- Assistant can trigger workflows with `gh workflow run` (e.g., `gh workflow run "Bench (storage bake-off)"`).
- Previously assumed user had to trigger manually via Actions → Run workflow.
- CLI approach is faster and enables tighter feedback loops than manual UI clicks.

**Why:** Assistant was over-cautious about automation scope. This capability exists and is faster than asking user to click.

**How to apply:** For tight feedback loops (perf validation, bake-offs): trigger CI workflows via CLI instead of asking user to click. Reserve user actions for outward-facing steps (tag push, publish).
