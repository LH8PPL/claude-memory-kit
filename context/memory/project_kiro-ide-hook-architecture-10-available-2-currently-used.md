---
id: P-A4JSRQYE
type: project
title: Kiro IDE Hook Architecture — 10 Available, 2 Currently Used
created_at: 2026-06-25T06:43:04Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cd32e2ddf3227dde6d00804655abde5fc1ba694c3fda9d46214ff861ad1a6305
related: [discovery-kiro-ide-exposes-10-available-prhd66cf, task-50-cross-agent-seam-target-kiro-cli-agent-hooks-agentsp, kit-status-after-cut-gate-core-merged-and-proven]
---

Kiro IDE exposes 10 hooks total: Pre Tool Use, File Save, and 8 others (not yet leveraged by kit). Pre Tool Use + File Save are key for implementing remaining observe-edit + prompt-capture parity legs in both CLI and IDE.

**Why:** Kiro's full hook surface is now understood; reveals capacity for remaining features without architectural surprises.

**How to apply:** When building observe-edit + prompt-capture, plan to use Pre Tool Use + File Save hooks in Kiro IDE alongside CLI-equivalent triggers.
