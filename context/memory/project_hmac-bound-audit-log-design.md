---
id: P-4AN6G5FK
aliases: [P-4AN6G5FK]
type: project
shape: Timeless
title: HMAC-Bound Audit Log Design
created_at: 2026-08-07T19:38:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0eb287646d7c2e2b5032094197d6d047ff333ab3ef6df7a133b4773b4ef045c8
---

KiroCrew's snapshot/restore deliberately does NOT export audit HMAC key; key regenerates on restore so audit entries remain bound to originating host. Cmk currently uses plain NDJSON (no tamper evidence).

**Why:** Better security posture; prevents cross-host replay and offline tampering.

**How to apply:** If cmk hardens audit logging, adopt HMAC binding instead of plain export.
