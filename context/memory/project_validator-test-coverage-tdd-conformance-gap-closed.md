---
id: P-NTY7KNC7
type: project
shape: State
title: Validator Test Coverage – TDD Conformance Gap Closed
created_at: 2026-07-21T14:26:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3ed79ccfefed9c03348948f04d14a89aeea5bd363d0de249aac5085e07839426
related: [stress-test-gating-rule-for-pr-approval, claude-md-ci-validator-binding-rule, the-fact-store-walk-is-duplicated-across-10-modules-with-no]
---

`scripts/validate-node-pin.mjs` was first new validator with no `tests/scripts-validate-*.test.js` counterpart. Module exports `findLiteralPins`/`checkNodePins` explicitly for testability; manual verification during review (planted bad value, confirmed failure, reverted) was not repeatable or CI-gated.

**Added**: 10 test cases covering happy path and allowlist-emptying regression.

**Why:** Project CLAUDE.md rule: "write the test first... never change the test to make it pass." Task 240 shipped untested, violating the rule.

**How to apply:** Any new `validate-*.mjs` script must ship with corresponding test file before merge. Tests are the safety net for future allowlist/pattern edits.
