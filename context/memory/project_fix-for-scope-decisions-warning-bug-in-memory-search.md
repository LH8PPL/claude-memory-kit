---
id: P-RRENWMU7
type: project
title: Fix for `--scope decisions` Warning Bug in Memory Search
created_at: 2026-06-18T18:34:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b9d56e2af7f64a983bea52ae71026752401f324af2ed0381319e63fca466189f
related: [live-test-gate-structure-and-blocker-findings, v0-3-3-bug-semantic-backend-attempted-for-keyword-only-decis, decisions-scope-semantic-fallback-warning-task-156-bug]
---

**Root cause:** The decisions scope is keyword-only (journal is flat file, not semantically indexed), but the search command was passing it to the semantic backend → "unknown-scope:decisions" warning or exit-2 failure.

**Fix:** Coerce decisions scope to keyword-only BEFORE the semantic block (silent, correct path).

**TDD verification:** 2 failing tests → fix applied → 18/18 green; live CLI verification (exit 0, empty stderr, results correct).

**Documentation:** CHANGELOG entry + DJ4-live cut-gate note (honest two-part status: decision-recall works via skill but may be fact-sourced; journal-specific retracted-trail edge untested).

**Why:** This is a real CLI bug affecting the v0.3.3 cut-gate; the fix and test metrics are durable reference for similar scope-handling issues.

**How to apply:** When fixing scope-specific backend issues, apply the "coerce to keyword before semantic block" pattern; reference this TDD + live-verify approach for CLI bug validation.
