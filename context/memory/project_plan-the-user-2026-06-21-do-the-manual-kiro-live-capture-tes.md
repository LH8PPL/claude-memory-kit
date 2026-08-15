---
id: P-FA4ALL42
type: project
title: 'Plan (the user, 2026-06-21): do the manual Kiro live-capture test ONCE, after AL'
created_at: 2026-06-21T10:42:39Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 41d0c4689ec7ffb4ae3f99b7d851d2a20a1170ee1f02bbe15f57caf4ad0256fc
related: [decision-the-user-2026-06-21-the-kiro-rework-wires-both-ide, solved-the-windows-kiro-hook-command-form-live-verified-2026, kiro-v0-4-0-release-code-complete-pre-release-checkpoints]
---

Plan (the user, 2026-06-21): do the manual Kiro live-capture test ONCE, after ALL v0.4.0 code is done (PR-1 IDE hooks merged + PR-2 CLI agent-config hooks). Batch it — one Kiro session verifies both surfaces (IDE .kiro.hook capture-fires + CLI agent-config + default-agent), rather than testing twice. So PR-2 proceeds now on code; the end-to-end 'a hook captures a real turn' verification is deferred to a single session at v0.4.0 cut. The 8-point live-test checklist (D-182) applies then.

**Why:** The user prefers one consolidated live-test session over two. PR-1 proved the hook RUNS (cmd.exe /c cmk --version → 0.3.5); the capture-fires-end-to-end test waits until PR-2 lands so both IDE + CLI surfaces are verified together at the v0.4.0 cut.

**How to apply:** Build PR-2 (50.L CLI agent-config hooks + guarded default-agent, 50.M tests) now. At v0.4.0 cut, run ONE Kiro session: install the real kit (--ide kiro), restart Kiro, IDE chat turn → verify a fact lands in context/; AND kiro-cli chat with no --agent → verify default-agent resolves + agentSpawn/stop fire. Do NOT claim 'automatic' for either surface until that session passes.
