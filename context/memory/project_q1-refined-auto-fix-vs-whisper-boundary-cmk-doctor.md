---
id: P-EDWTFJ3Q
type: project
shape: Plan
title: 'Q1 Refined: Auto-fix vs Whisper Boundary (cmk doctor)'
created_at: 2026-08-01T12:39:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1ea9147cc9674b3390b90ceb398e2deebedb8ce5a46e323ff35692a7e4dc67b3
related: [research-complete-self-healing-cli-repair-ux-task-250, silent-failure-fixes-vs-whisper-policy, troubleshooting-skill-architecture-shape-b-confirmed]
---

Updated design recommendation informed by completed research (Task 250):

**Auto-fix applies only to:**
- Kit-owned state (stale locks, index drift, kit's own scaffold)
- Reversible, idempotent, cheap operations
- Piggybacked on ops already running (unattended runs)
- Self-verifying: the next run of the failed operation succeeds

**Whisper/advise for everything else:**
- User-owned or environmental factors (missing agent CLI, broken hooks, API/billing failures)
- Unknown failure classes

**Status:** Awaiting user ratification. Alternative stricter boundary: auto-fix only for checks already named in cmk doctor's health-check repair registry.

**Why:** All mature CLI tools converge on this boundary (git, Claude Code, npm doctor, brew, flutter, Nx CI, Tailscale). Nx adds verification-as-precondition; Tailscale's Warnables model is production-grade design for the nudge registry.

**How to apply:** Once ratified, use to scope which health checks auto-fix vs whisper-only. Implement repair registry accordingly.
