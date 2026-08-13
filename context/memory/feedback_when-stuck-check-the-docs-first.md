---
id: P-WCDUAF25
type: feedback
title: When stuck check the docs first
created_at: 2026-06-15T19:08:40Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 01cfc4e95a3712fa982e6c727755e953a34d54c20288b2a0daa7b380c819eb0a
related: [user-runs-full-stack-semantic-and-crons, consult-the-user-before-shipping-a-fix-mid-live-diagnosis, system-written-grants-file-as-specification]
---

When stuck or unsure how something works (a failing bench, an unexpected API behavior, a library quirk), CHECK THE DOCS first — the kit's own docs (specs/design.md, CLAUDE.md, docs/), the library's official docs (SQLite/sqlite-vec/node:sqlite/etc.), or the primary source — instead of flailing with trial-and-error guesses. The user 2026-06-15: "if you have problems with something and dont know what to do check the docs."

**Why:** The user noticed me debugging the bench-storage harness by trial-and-error (testing query-syntax variants in throwaway scripts) instead of consulting the sqlite-vec / node:sqlite docs. Checking docs first is faster and more reliable than guessing, and it aligns with the existing primary-source-verification discipline applied to debugging, not just to claims.

**How to apply:** When a command/test/library behaves unexpectedly or I don't know the right API/syntax: before iterating on guesses, read the relevant docs — kit docs (design.md/CLAUDE.md/docs/), the library's official documentation (e.g. sqlite-vec README, node:sqlite API docs), or the primary source. Apply the same did-you-check-the-primary-source rule to debugging that already applies to factual claims.
