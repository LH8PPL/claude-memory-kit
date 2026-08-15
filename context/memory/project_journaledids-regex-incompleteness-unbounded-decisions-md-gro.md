---
id: P-aD27LQ3H
type: project
title: journaledIds Regex Incompleteness — Unbounded DECISIONS.md Growth (DJ2)
created_at: 2026-06-16T10:22:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1332d943cfaeb9d1fa10b4d2474f0e4d7a6babd7e636ff2f3fe26f3dc4879f35
related: [test-anti-pattern-setup-commands-masking-automation, dj4-live-test-prerequisites, mcp-serve-is-long-lived-restart-after-rebuild-or-you-test-st]
---

**The bug:** The `journaledIds` regex was `[A-Z2-9]` (uppercase-only), but the kit's base32 id alphabet includes lowercase letters.

**Impact:** Decision facts with lowercase ids (e.g., containing `a`) were re-appended to `DECISIONS.md` on every `cmk digest` run, causing unbounded journal growth.

**Root cause:** Test fixtures used only uppercase ids, masking the bug in both the dedup regex and the tombstone-id reader.

**The fix:** Regex updated to match the kit's full base32 alphabet. Both dedup regex and tombstone-id reader corrected. Regression test added with lowercase-`a` id.

**Verification:** Idempotency confirmed; 11/11 tests pass.

**Why:** Regression-test gap—fixtures didn't exercise the real alphabet. Ship-blocker for v0.3.2 (digest/journaling is a headline feature). Fix lands on main before tag.

**How to apply:** When testing id-processing code, ensure test fixtures exercise the FULL id alphabet (base32 with both cases), not just convenient subsets. Add regression tests for boundary/edge characters.
