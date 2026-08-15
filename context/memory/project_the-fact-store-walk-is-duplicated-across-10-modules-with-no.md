---
id: P-KJ32WCUR
type: project
shape: State
title: 'The fact-store walk is duplicated across 10 modules with NO shared walker: the s'
created_at: 2026-07-20T09:16:57Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: dfc7bc6e7cd919704644e06b24cd4a553c73aad8a03fba091e0f7d5a5b1f6925
related: [validator-test-coverage-tdd-conformance-gap-closed]
---

The fact-store walk is duplicated across 10 modules with NO shared walker: the skip-idiom entry.name === 'INDEX.md' appears in 9 files, and listLiveFactFiles/listFactFiles is the SAME byte-identical body under two names in 4 files (forget, merge-facts, reindex, trust). temporal-sweep.mjs:69-93 and validity-window.mjs:42-65 share a 14-line walk-parse-skip clone differing only in the final predicate. tier-paths.mjs already exports resolveFactDir - the natural home. Task 241 (v0.6.2) fixes it.

**Why:** This is the exact class the CLAUDE.md shared-modules table was written for - the Layer-2 review found 4 modules reimplementing the same helpers and the drift had already produced a bug (INDEX.md unfiltered in one writer's dedup scan). Today a new skip rule (new sidecar filename, new tombstone convention, a judgment_* exclusion) must be remembered in 9 separate places.

**How to apply:** Before adding ANY new fact-file skip rule or exclusion, check whether Task 241 has landed. If not, the rule must go in all 9 sites or it will drift. If it has, put it in the one shared walker beside resolveFactDir in tier-paths.mjs. The refactor is pure - zero test edits allowed; a test needing a change means a contract broke.
