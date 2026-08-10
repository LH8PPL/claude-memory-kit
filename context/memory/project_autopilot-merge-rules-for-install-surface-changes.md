---
id: P-SC3W3ZDV
type: project
title: Autopilot merge rules for install-surface changes
created_at: 2026-06-15T18:37:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a15e1507886435ee7288f246c7f4bca89a413425fe3edb14e462cf73935121ea
related: [onnxruntime-node-postinstall-cdn-timeout, sonarcloud-d-341-known-server-side-crash, autopilot-stop-condition-for-install-surface-decisions]
---

The project uses an "autopilot" CI/CD system that auto-merges most code PRs when CI passes. PRs that modify the user-facing install surface (e.g., node:sqlite migration, loadExtension behavior) are surfaced to the user for explicit approval rather than auto-merged.

**Why:** Future sessions need to know which changes require user approval and which proceed automatically, to avoid unintended ship-surface deployments.

**How to apply:** When planning or reviewing PRs, check if the change affects user install/setup behavior; if yes, ensure it's routed to user approval, not auto-merge.
