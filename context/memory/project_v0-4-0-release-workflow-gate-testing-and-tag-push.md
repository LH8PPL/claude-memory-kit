---
id: P-EYMP4U6F
type: project
title: v0.4.0 Release Workflow — Gate Testing and Tag Push
created_at: 2026-06-22T18:03:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 68b686b53813f36a92fddc76600a5312ff7bc8bbc4bb570152e6eb96839f5270
related: [plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes, post-215-merge-workflow-gate-continuation, release-workflow-with-cut-gate-testing]
---

**State**: v0.4.0 merged, CHANGELOG complete, package.json versioned. NOT tagged/published.

**Gate process** (`docs/process/cut-gate-kiro.md`):
- KH1–KH3: IDE hooks (agentStop capture, promptSubmit inject)
- KC1–KC4: CLI agent-config hooks (agentSpawn inject, stop capture)  
- KG-guard: delete-guardrail preToolUse + blocking
- ⚠️ Open blocker: Kiro matcher regex alternation support (`execute_bash|executeBash|shell`). See I3-live (D-193).

**Roles**: Assistant prepares code & pre-gate checks. User tests Kiro against fresh install, then tags v0.4.0 → auto-publish.

**Why:** Kiro testing needs real IDE/CLI exercise. Tag push is user-controlled public action. Clear boundaries prevent deadlock.

**How to apply:** User walks gate checklist, reports failures. Assistant fixes. Once gate passes (blocker resolved), user tags.
