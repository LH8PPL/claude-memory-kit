---
id: P-Z7HLU4FK
type: feedback
shape: State
title: 'v0.5.4 RENAME resumption checkpoint (2026-07-15): claude-memory-kit renamed to c'
created_at: 2026-07-15T07:20:14Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 836890a61b4d3d5e242ca0e3b7923485e2380829fef7736babc883c81a61aa67
related: [v0-5-4-released-under-renamed-repo-identity, urgent-resume-the-global-cmk-is-half-ins-3evdaurq, resume-v0-4-5-main-is-green-with-the-v0-k9jexew6]
---

v0.5.4 RENAME resumption checkpoint (2026-07-15): claude-memory-kit renamed to core-memory-kit is DONE + release-committed on main (commit d7ceb73), CI green. cmk unchanged. All merged: ADR-0021, 135-file corpus rename, config-dir DIRECT swap to ~/.core-memory-kit (migration dropped - sole user reinstalls), rebrand assets, all 4 cut-gate guides updated. Global @lh8ppl/core-memory-kit@0.5.4 installed; persona moved to ~/.core-memory-kit; 3 projects reinstalled. For the CUT-GATE: ~/.core-memory-kit was moved aside to ~/.core-memory-kit.pre-gate-moved + backed up to /c/cut-gate-backups/23_v0.5.4_rename_cut-gate so the tier is ABSENT for capture-from-zero. The user is about to run cut-gate.md section 1 (Scaffold + read every file) in a fresh C:/Temp/cut-gate23 project. Deterministic half (0-1 + probes) ALREADY PASSED. REMAINING: (1) user drives the live cut-gate 2-9 (optional for a no-feature rename); (2) USER OUTWARD STEPS - tag v0.5.4 to publish, npm deprecate @lh8ppl/claude-memory-kit, rename GitHub repo LH8PPL/claude-memory-kit to core-memory-kit, update SonarCloud project key (all coupled to the repo rename). After repo rename the C:/Projects/claude-memory-kit checkout path + the cut-gate checkout-path refs need updating.

**Why:** context about to auto-compact; the rename is functionally complete but the cut-gate live half + the user's outward publish/repo-rename steps remain
