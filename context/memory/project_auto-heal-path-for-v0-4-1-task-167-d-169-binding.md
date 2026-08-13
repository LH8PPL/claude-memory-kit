---
id: P-PY2TL4GZ
type: project
title: Auto-Heal Path for v0.4.1 (Task 167) — D-169 Binding
created_at: 2026-06-25T13:53:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c0d63dc7bbe4d0a4dc6f084a67e0675d57be0a11d3a77d9c5e00127ebb1d97d8
related: [task-167-testing-agent-run-unit-live-agent-loop-user-does-no, a-health-check-behind-a-command-does-not-surface-a-silent-fa, lazy-on-sessionstart-roll-doesn-t-fire-on-size-bloated-now-m]
---

The fix for Task 167 must be fully automatic with zero user action. D-169 (automatic-path rule) is BINDING.

**Mechanism:**
- Trigger: `cmk-inject-context` fires on SessionStart (already automatic, no user action).
- Healing: Tasks 167.A (cron-liveness gate) + 167.B (size-triggered roll + cooldown) drain bloated `now.md` silently across one or two normal session starts.

**Test gate constraint:**
- Proof-of-automaticity tests CANNOT run `cmk compress` before measuring recovery — only SessionStart allowed.
- This proves the shipped fix is automatic, not accidentally reliant on manual setup.

**Task 167.C (cmk doctor):**
- Diagnostic safety net only. Surfaces symptom if auto-heal fails; frames any command as optional override.

**Why:** User's question exposed a gap in initial 167.C spec (manual command violated D-169). Redesign ensures shipped path is automatic.

**How to apply:** Implement gate tests measuring `now.md` deflation across clean SessionStarts only (no manual commands). This proves automaticity before shipping v0.4.1.
