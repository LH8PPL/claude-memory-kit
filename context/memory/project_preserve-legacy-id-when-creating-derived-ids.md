---
id: P-P2X5HVVK
type: project
shape: Timeless
title: Preserve Legacy ID When Creating Derived IDs
created_at: 2026-07-25T09:18:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e9a568b800924ec4e1ec0ac7582b3270bf438e5a5b8e19b491057ef457928b65
---

When a malformed fact is repaired and a new deterministic id is computed (e.g., content-addressed), preserve the original id in a `legacy_id` field. Example: malformed fact `P-RES031CG` gets a derived id with `legacy_id: P-RES031CG` stored in the repaired record.

**Why:** Enables traceability between old and new ids; user recognizes which facts were repaired. Important for audit trails and diagnosing why a fact was re-indexed.

**How to apply:** When writing id-repair logic, add the `legacy_id` field to any fact receiving a new computed id. Preserve it through serialization.
