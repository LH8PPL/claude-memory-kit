---
id: P-CG4aK6TB
type: project
shape: State
title: 'Task 243 (2026-07-21) SUPERSEDED the bench-storage allowlist constraint: the LIT'
created_at: 2026-07-21T18:13:43Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 0df7e37b609acc312159f1b25c5cf01215bf2650f4051629f444999a8fbd50d6
related: [task-240-resolution-bench-storage-allowlist-entry, stale-memory-entries-tombstoned-via-cmk-remember, d-384-regression-test-uses-conditional-composition-invariant]
---

Task 243 (2026-07-21) SUPERSEDED the bench-storage allowlist constraint: the LITERAL_ALLOWLIST in validate-node-pin.mjs is EMPTY again and bench-storage.yml reads node-version-file .nvmrc like every workflow. The old fact 'the entry must NOT be emptied' (P-A3LFDBR9) described the D-384 world where .nvmrc was 20, below node:sqlite's 22.5 floor. Task 243 raised .nvmrc to 22 (better-sqlite3 v13 engines floor; Node 20 EOL), so the crash reason evaporated and D-383's join-the-pin argument won. Do NOT restore the allowlist entry.

**Why:** A stale memory saying 'do not remove this entry' would make a future session treat the now-correct empty allowlist as a regression and re-add a divergence whose reason no longer exists.

**How to apply:** The invariant is CONDITIONAL and lives in tests/scripts-validate-node-pin.test.js: .nvmrc major >= 22 means bench-storage must be ON the pin and the allowlist empty; < 22 means the entry is required. Trust the test, not the old fact.
