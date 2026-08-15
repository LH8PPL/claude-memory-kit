---
id: P-X9ZB69LH
type: project
title: Stress runner and incremental JSON handling
created_at: 2026-06-14T07:09:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2f5786af31fa1ab9ef4c6e7b5898c735a41eec5c
related: [stress-test-configuration-constraints, no-disclaimed-flakes-rule, cmk-hook-capture-fails-during-stress-gate]
---

Stress runner writes JSON output incrementally and files may be mid-write/unreadable. Do not attempt to parse them directly; the stress runner itself parses and prints failing test names on completion, exiting non-zero on any failure. Trust the completion notification.

**Why:** Avoids wasted debugging effort on partial/corrupt JSON; runner handles it internally.

**How to apply:** When monitoring stress runs, ignore unreadable JSON files; wait for the runner's completion notification instead.
