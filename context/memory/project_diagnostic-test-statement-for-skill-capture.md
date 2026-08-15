---
id: P-TBUDHYTT
type: project
title: Diagnostic Test Statement for Skill Capture
created_at: 2026-06-26T20:33:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3760ee6752054dd2cb5a466f2a4397395498c97c4ec1c11466b0390b82da7ab7
related: [diagnostic-test-allow-list-vs-workspace-trust, cc-update-does-not-fix-mcp-prompt-task-171-validated, two-sub-test-method-for-isolating-skill-permission-gating]
---

Before running full Session 1, execute a single-rule diagnostic test:
- **Test input:** "always run ruff before committing"
- **Action:** Type in Claude Code chat, then click "Yes, allow for this project" when skill prompt appears
- **Scope:** Single rule only; NOT the full multi-rule Session 1 (which includes FastAPI build)

**Why:** Isolates skill-permission behavior from other Session 1 elements. Prevents test contamination: if prompt-free capture works for one rule, full Session 1 can proceed cleanly.

**How to apply:** Execute in folder `cut-gate-v041d`. Inspect settings.json snapshots before/after allowing. If clean, fix kit and run full Session 1 next.
