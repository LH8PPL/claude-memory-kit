---
id: P-VALD4GBG
type: project
shape: Plan
title: Task 250 — Failure-Driven Nudge Implementation
created_at: 2026-07-22T13:48:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b42e146a3899e48ceb9d951f5c2b26f351db4a63f6d020069f5a771761bade31
related: [doctor-health-nudge-corrected-design-2026-07-22-supersedes-t, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, d-343-disposition-cmk-install-scaffold-refresh-bug-task-230]
---

**Implementation Details:**
- Modify `buildMemoryHint` in `capture-prompt.mjs` to add nudge check
- Nudge reads kit's own error logs (`extract.log`, spawn-error entries)
- Fires only on fresh failure (self-cleaning: later success clears signal)
- Message: "a kit op failed — use the troubleshooting skill"

**Skill Pattern:**
- Scaffold like `memory-write`/`memory-search` skills
- Teaches `cmk doctor` + repair workflow

**Status:** Design confirmed 2026-07-22, pending outward research + grill before implementation

**Why:** Concrete implementation anchors; ensures future work aligns with design decision confirmed this session

**How to apply:** Reference when starting Task 250 to ground implementation; use skill patterns to maintain consistency with existing kit skills
