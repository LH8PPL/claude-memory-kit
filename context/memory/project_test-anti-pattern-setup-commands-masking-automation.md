---
id: P-6ZS6ZAL6
type: project
title: Test Anti-pattern — Setup Commands Masking Automation
created_at: 2026-06-18T05:33:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 225ac560e2de44383954acaa21732dd4f3da5b4d7ddf80a6d1a38f80e03491d0
related: [task-done-goal-explicitness-rule, project-dogfooding-principle-use-kit-s-own-mechanisms, silent-auto-drain-optional-warmth-design-pattern]
---

Tests that run a manual setup command (e.g., cmk digest, cmk reindex) before asserting a behavior can hide the absence of an automatic hook.
  
  The test passes (because the manual command ran), but real users encounter the missing automation (because no hook runs it automatically).

**Why:** D-169: DECISIONS.md auto-population was fully tested but every test started with manual `cmk digest`. The feature worked in tests, failed in real use.

**How to apply:** When a test setup runs a manual command, ask: "Is this supposed to be automatic? Where's the hook that will actually trigger it?"
