---
id: P-G72M6QBA
type: project
shape: Timeless
title: Kit Name-Privacy Validator for Auto-Extract
created_at: 2026-07-22T16:44:18Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a8b97bf464270b318f7871acc795de7b1945300d8dc26cfcbcb1d21515955c7b
related: [commit-guardrail-blocks-ambiguous-include-exclude-instructio, kit-delete-guardrail-false-positive-on-commit-messages, sensitive-content-policy-for-memory-capture-system]
---

The kit's auto-extract mechanism includes a validator that blocks commits when a captured fact's text includes the user's wiki name or other sensitive project identifiers. When triggered, the fact can be safely purged and re-remembered in a name-clean form, allowing the commit to proceed.

**Why:** Kit memory is committed to git (possibly public). Personal/project names should not leak into public memory without user consent. This validator enforces privacy by design.

**How to apply:** If auto-extract blocks a commit due to name detection, use the kit's safe purge path to delete the offending fact and re-remember it with sensitive identifiers removed.
