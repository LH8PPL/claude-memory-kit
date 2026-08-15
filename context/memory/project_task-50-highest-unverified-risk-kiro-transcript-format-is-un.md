---
id: P-RT2G5VAY
type: project
title: 'Task 50 highest unverified risk: Kiro transcript format is UNKNOWN. The kit''s ex'
created_at: 2026-06-20T14:28:03Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: cd0adc02c41ab7db0faf166d009ff48d5dbed747c3fc38bfdff98652b28ef7f4
related: [kiro-transcript-format-resolved-verified-on-a-real-kiro-inst, task-50-cross-agent-seam-target-kiro-cli-agent-hooks-agentsp, kiro-cli-env-passing-limitation]
---

Task 50 highest unverified risk: Kiro transcript format is UNKNOWN. The kit's extract/compress path hardcodes Claude-Code touchpoints (~/.claude/projects/<slug>/<session>.jsonl, env -u CLAUDECODE); porting to Kiro requires parameterizing these per-agent and kiro.dev primary docs do NOT cover Kiro's transcript-on-disk shape. Must be discovered LIVE at build time.

**Why:** The transcript layer is the one part of the Claude-Code integration that is deeply host-coupled and was NOT verifiable from docs; it gates the capture half of the kit's model on Kiro.

**How to apply:** At Task 50 build, open a real Kiro CLI session and inspect where/how it stores turn transcripts BEFORE claiming the capture path works; record live result in the Task 50 DECISION-LOG entry; do not mark verified until exercised.
