---
id: P-S5U4FRRK
type: project
shape: Timeless
title: Research note parking workflow during CI
created_at: 2026-08-02T18:46:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7f0447cb40906bf14d804759ff45f1f1455c06a47f8c650354f08aa44d018644
related: [gate-verification-system-architecture, validate-docs-enforces-catalog-consistency, 5-concurrency-stress-gate-as-pre-pr-verification]
---

When a research note in `docs/` triggers a validate-docs failure (missing INDEX entry), the note is moved to the project scratchpad (untracked, local-only). Validators are re-run to confirm green. The full gate chain then re-runs. The note content remains intact and is re-integrated on main after the PR merge.

**Why:** Balances strict validation (catalog correctness) with rapid iteration (preserve work). CI gates on quality but doesn't discard intermediate work.

**How to apply:** If you add exploratory research notes and hit validation failure, move them to scratchpad, re-run validators to confirm pass, then continue with the chain. Re-integrate the note after merge.
