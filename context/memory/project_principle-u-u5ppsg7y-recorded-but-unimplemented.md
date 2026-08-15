---
id: P-TPRU57DD
type: project
shape: State
title: Principle U-U5PPSG7Y recorded but unimplemented
created_at: 2026-07-22T13:24:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7eb20a9a3ef446f134ec63bd2752cf1a6d18884694c6ecb2cba7b72e5198a9cd
related: [doctor-is-reactive-only-memory-write-search-are-automatic, d-343-disposition-cmk-install-scaffold-refresh-bug-task-230, resume-fact-convention-capturing-uncommitted-code-intent]
---

Kit's documented lesson U-U5PPSG7Y states: "users will not run doctor commands; failures must surface automatically." The principle is archived in the project's memory but has never been mechanically implemented. Doctor remains reactive-only, contradicting this recorded intent.

**Why:** This gap is a known design debt. It directly conflicts with an existing, documented design principle, making it clear scope for v0.6.3 work alongside the reframed task 248.

**How to apply:** Reference this principle as the north star when choosing the design fork for auto-surfacing doctor. Use it to justify why doctor failures must surface automatically rather than waiting for user action.
