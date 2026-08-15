---
id: P-MZ4PZMS7
type: project
shape: State
title: v0.5.0 Release — Feature Complete, L3 Promotion Gate Pending
created_at: 2026-07-08T14:23:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6dd0b9eac01e55dbc549fdd3bfe2b4e2933c2e9aac4336ce99f0e8e5de3d43d3
related: [resume-fix-l3-promote-timeout-wip-at-4e33935-then-v0-5-0-tag, e2-privacy-screen-verification-test, resume-v0-5-0-tag-blocked-only-on-the-cursor-gate-everything]
---

All cut-gate issues resolved and merged:
- Learn-loop (Tasks 190-193) shipped
- Privacy screen (Task 148) shipped with 3-reviewer hardening
- D-300 cold-open embedder false-positive note fixed

Verification status:
- E1 (wedge): PASS — exemplary; user's project habits immediately recognized (uv/ruff/venv)
- E2 (privacy containment): PASS — L1 real-time name masking confirmed, git add correctly blocks unscreened transcripts
- E2 (privacy promotion): PENDING — need live demonstration of L3 judge masking real names to «NAME» markers in committed session transcript

Queued for v0.5.1:
- Distill starvation defect
- Incremental-resumable principle defect

**Why:** Release is one gate away from tagging. Next session needs exact status to know what remains and what's next.

**How to apply:** To close L3 gate: trigger promotion (user choice: continue existing session OR fresh cold-open), verify committed date.md shows masked names, tag v0.5.0, then begin v0.5.1 defect work.
