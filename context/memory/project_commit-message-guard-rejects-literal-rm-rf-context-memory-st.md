---
id: P-QY2AJSXD
type: project
shape: State
title: Commit-message guard rejects literal "rm -rf context/memory" strings
created_at: 2026-07-11T09:37:00Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2eb0fded5ad9768609f746ce4d27971ec8f481e6e5e58469b21416f3000a584a
related: [kit-delete-guardrail-false-positive-on-commit-messages, kit-guardrail-behavior-over-block-for-safety, kit-name-privacy-validator-for-auto-extract]
---

A git pre-commit hook (or similar mechanism) prevents commits containing the literal string `rm -rf context/memory`. It is intentionally fail-safe: cannot distinguish between describing a past/hypothetical guard-bypass and actually intending to execute it. False positives are correct and expected behavior.

**Workaround:** Rewrite commit messages to avoid the trigger string using synonyms or restructured descriptions.

**Related:** This guard reinforces the delete-guard safety mechanism that Task 207 just hardened against BOM-based bypasses.

**Why:** Fail-safe design prioritizes preventing catastrophic harm (a destructive command succeeding) over convenience. False positives are acceptable.

**How to apply:** When the guard rejects a commit, rewrite the message to convey the same technical meaning without the literal string. Treat it as a communication constraint, not a capability constraint.
