---
id: P-aB42P3SF
type: project
shape: Plan
title: Cursor Gate v0.5.0 Test Procedure
created_at: 2026-07-09T16:37:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 68ba3f333800c7d0e516d08ee1e6f96ea9d35bfebba906920205aa9acd6a1353
related: [cursor-gate-test-path-procedure-v0-5-0-release, kiro-ide-hook-testing-multi-step-gate-sequence, d-197-end-to-end-live-re-test-workflow]
---

Test folder: `C:\Temp\cursor-gate-v050d` (fresh, pre-scaffolded)

Steps:
1. Fully quit Cursor + reopen (picks up newly-repacked global cmk binary)
2. Open test folder
3. Send one build turn (e.g., "Create a minimal FastAPI server with /health endpoint")
4. Verify: `now.md` should fill with turn content

Gate-pass signal: `now.md` filling = proof that auto-extract hook and `/c:/` path fix (D-305, normalizeCursorRoot) work in live Cursor environment. If good, proceed with full S1→S2→S3 build arc, then tag v0.5.0.

**Why:** Isolated end-to-end test of the D-305 fix in the real Cursor environment (Cursor is the third and final gate before release). now.md is the smoking-gun proof the hook executed.

**How to apply:** Execute steps in order; assistant stays outside folder and verifies now.md fills. Pass gate → continue build arc. Fail gate → debug binary repacking or hook setup.
