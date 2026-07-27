---
id: P-DUQRU7SK
type: project
shape: Timeless
title: One-Strip-Everywhere Implementation Pattern
created_at: 2026-07-27T08:19:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f3a874541bb376840f4fb4e7b57b7f94d449e8c460ecc7cfb559a13ccced2dcc
---

Use single-strip logic consistently throughout. Double-strip causes asymmetry and silently loses visibility of corrupted/mangled files. Corrupt files should be quarantined-and-reported (visible), not hidden.

**Why:** Visibility of problems is better than silent failure; single-strip avoids losing problem files and enables proper error reporting

**How to apply:** When implementing strip/clean logic, default to single-strip everywhere. Let mangled files surface and be reported rather than staying hidden.
