---
id: P-AAUZJ9UU
type: project
shape: State
title: 'Task 96 — cmk redact/purge --hard, merged PR #295'
created_at: 2026-07-16T08:18:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bb603f592dbf46d52bc466ebb700354af8e0a4a516229b16711f6bb1b5bde02e
related: [task-205-complete-mcp-server-install-dll-lock-fix, task-completion-workflow-code-test-doc-review-live-test-merg, fixed-bugs-in-task-50-kiro-console-flash-branch]
---

**Status:** Merged and live (CI green)
**Scope:** ADR-0022 implementation
- cmk redact: remove secrets from memory facts
- cmk purge --hard: delete facts entirely with cascade verification
**Validation:**
- Live testing caught titled-borne secrets surviving in committed filenames
- Skill review found gaps: L-tier scratchpads (incl. `private.md`), committed `DECISIONS.md` journal, purge audit path echo
- All gaps fixed at root
- Test suite: 30 tests, stress 5/5, zero residuals verified

**Why:** Reference point for completed feature; demonstrates project's multi-layer review + live-test approach catching real edge cases (secrets in filenames).

**How to apply:** When understanding deletion/redaction scope or referring to secret-handling capabilities, cite PR #295 as the authoritative implementation.
