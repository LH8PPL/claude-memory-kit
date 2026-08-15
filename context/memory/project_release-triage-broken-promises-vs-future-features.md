---
id: P-XFKJ6QTV
type: project
title: 'Release Triage: Broken Promises vs Future Features'
created_at: 2026-07-01T08:32:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4d2d8d8333028351f10cd6e5b60c466ad5861a7cd4a731bf5a851df10296620d
related: [shipping-principle-fix-core-promise-gaps-before-release, tag-ready-criterion-core-features-pass-known-issues-cleanly, v0-3-3-bug-semantic-backend-attempted-for-keyword-only-decis]
---

The project uses a three-tier triage for each release milestone:
- **Broken core promise + small fix** (e.g., issue 182 searchability in v0.4.3) → Fix immediately. Core promises are non-negotiable; cheap fixes get folded into the current release.
- **New capability + large scope** (e.g., issue 184 cross-project search) → Defer to next release. Not a broken promise, just a future enhancement.
- **Open research or unsettled tradeoff** (e.g., issue 181 friction-vs-adherence) → Defer. Needs design time, not a rush fix.

**Why:** Prevents shipping false headlines (broken core promises) while protecting against scope creep from features that look important but aren't load-bearing. A small, verified fix to an existing promise is worth doing before tag; everything else belongs in the next cycle.

**How to apply:** Before each release milestone, classify each issue. Fix only small issues that break core promises. Audit the headline before tagging—"does search find your persona?"—and if the fix is <2 hours, do it.
