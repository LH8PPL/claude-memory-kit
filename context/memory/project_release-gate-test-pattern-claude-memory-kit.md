---
id: P-5ZRXEHUW
type: project
title: Release Gate-Test Pattern (claude-memory-kit)
created_at: 2026-06-18T19:24:04Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8603ff3a1c71e113099196caaddd7d5f6eb3e5b374fd7fc865e0a6e9687ccdac
related: [version-0-3-3-release-cut-gate16-test-session-state, live-test-gate-structure-and-blocker-findings, release-workflow-cold-open-testing-discipline]
---

Releases require end-to-end gate tests before tag/publish:
- Install on fresh environment (cold-open, brand-new project context)
- Full feature sweep (all new features exercised end-to-end)
- UX/behavior bugs caught and fixed *before* shipping
- Unknowns documented as deferred tasks for the next version (not shipped as rough edges)

v0.3.3 validation: cold-open E1 proved the differentiator; headline UX bug (decisions-scope warning) caught, fixed, verified via real install; Tasks 161–162 cleanly deferred.

**Why:** Prevents shipping half-baked features; ensures solid user experience and builds user trust in kit quality.

**How to apply:** Apply this gate before each release tag; use cold-open (fresh project) to stress-test key differentiators; defer unknowns transparently.
