---
id: P-W6VHUWM7
type: project
shape: Timeless
title: Idiomatic Timeout Composition Pattern (50s/120s)
created_at: 2026-07-08T16:48:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 93895619c02e03ddd6930b6c5b3c732bc1b7727ed1046605439e26cc28b83fab
related: [sessionend-timeout-composition, log-sink-injection-pattern-across-install-uninstall, decisions-md-feature-using-standing-journal-design-pattern]
---

The codebase uses a 50s/120s timeout composition as the canonical design pattern, documented in §16.42. This pattern appears across promote sites: detached children inherit the 120s ceiling-free default; SessionEnd sites pass explicit 50s. Composition has been verified in both directions.

**Why:** This is the standing design pattern for timeout decisions; adhering to it ensures consistency and correctness across timeout-related changes.

**How to apply:** When modifying timeout logic (especially at SessionEnd or promote sites), consult §16.42 and follow the 50s/120s composition pattern as the idiomatic approach.
