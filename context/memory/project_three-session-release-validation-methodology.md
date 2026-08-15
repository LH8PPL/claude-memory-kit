---
id: P-JY9ZGT5C
type: project
title: Three-Session Release Validation Methodology
created_at: 2026-06-16T12:03:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9500b979016c4429deda2c9e0a99a0cd441d6abcf0097a228816feea3c95c103
related: [session-2-validation-gates-cut-gate15, session-3-e1-cold-open-test-procedure, e1-cold-open-test-persona-wedge-successful]
---

The release workflow uses three consecutive session/test phases with named validation gates:

**Session 2 (Recall Test):** Start a fresh chat in the existing cut-gate14 window and ask standing questions ("What are my standing cross-project rules?", "Add a /health endpoint"). Watch gates:
- D1/D3 (recall): Assistant names your rules (uv/ruff, type-hints, layered, async) and structure (port 8000) from memory, without code-globbing.
- W1 (recall skill): For "what did we decide about X", fires memory-search skill and cites results (P-ids), not code-crawling.
- D2: /health route lands thin in api/, type-hinted, without re-stating your style.

**Session 3 (Cold-Open Wedge):** Create a brand-new empty folder, run `cmk install`, ask "start a new Python backend, set up the structure". Watch gate:
- E1: Scaffolds layered + uv/ruff without being told (persona transferred from memory).

**Cut:** Tag and push v0.3.2.

**Why:** Validates that memory recall, memory-search skill, and persona transfer are working correctly before release.

**How to apply:** Run Session 2 first. If D1/D3/W1/D2 all pass, proceed to Session 3. If E1 passes, cut the release.
