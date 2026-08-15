---
id: P-6NLDRFYV
type: project
title: DECISIONS.md Cut-Gate Structure (DJ1–DJ4)
created_at: 2026-06-17T07:33:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 40d4a11c4e171f1acf025ef4870e57b415a0b891b9e9cc47798259cabeb9486f
related: [dj4-verification-prompts-decisions-md-recall-gate, use-the-memory-write-skill-not-the-cli, fix-for-scope-decisions-warning-bug-in-memory-search]
---

DECISIONS.md testing is organized as four sequential cut-gate stages:
- **DJ1** (write): `cmk digest` renders and creates DECISIONS.md from `type:project` facts
- **DJ2** (write): append-only enforcement; forgotten decisions marked `_(retracted)_` (never deleted)
- **DJ3** (write): fact-type filter; only `type:project` journaled (feedback/reference excluded)
- **DJ4** (recall): full chain test — `remember → digest → search --scope decisions` returns found decision; after forget, still returns same decision marked `(retracted)`

DJ4 splits into two verification halves:
- **Mechanism (CLI)**: hard PASS criterion; fully testable via command execution in `cli-search.test.js`
- **Behavior (in-chat)**: whether Claude *chooses* `--scope decisions` when asked a history question; manual human-eyeball check only (automated tests cannot assert user-agent behavior)

**Why:** Ensures DECISIONS.md recall is reliable across the full lifecycle (create, digest, forget, recall-as-retracted). The mechanism/behavior split acknowledges what can vs cannot be auto-tested.

**How to apply:** When releasing DECISIONS.md features or running cut-gate, follow all four stages. DJ4's manual check is part of the human cut-gate checklist (not CI); automated unit tests verify the CLI mechanism.
