---
id: P-YZHN6DP6
type: project
title: Nested-claude Spawn Timeout in Test Harness
created_at: 2026-06-18T14:18:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 007048c78e6ed37ad2a1c9358b130e6aafac887fae188d16f126aadcabb1052c
related: [nested-claude-invocations-from-inside-an-ya74axrj, avoid-test-folder-contamination-during-agent-sessions, 5-test-scorecard-gates-w1-through-d6]
---

Calling `claude --print` from within an active Claude Code session can hang/timeout at 50s. This affected D6 (SessionStart self-heal compression) in this test run but is environmental to the nested harness, not a kit logic defect. Non-nested invocations work fine.

**Why:** D6 gate failed with `haiku_timeout`, but the failure pattern (timing out when called from inside Claude Code) repeats across multiple test attempts. Points to harness artifact, not kit bug.

**How to apply:** Validate D6 cleanly by running compress spawns outside an active Claude Code session. In real user SessionStart (not nested), the `claude --print` call will have a clean environment. Accept nested-harness timeouts as environmental noise.
