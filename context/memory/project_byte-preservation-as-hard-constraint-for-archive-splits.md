---
id: P-3BGLYSBJ
type: project
shape: Timeless
title: Byte-Preservation as Hard Constraint for Archive Splits
created_at: 2026-07-27T21:53:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4d17ee6bb2aa668ca0bfdf00d05cb2836d6f9f7531279569635de33401bbb46a
---

Archive split operations require byte-preservation as a hard constraint. Three boundaries must be selected and validated to maintain exact byte integrity.

**Why:** Downstream validators depend on byte-exact archive state. Any divergence breaks validator integrity.

**How to apply:** Gate all archive split work with the full validator suite. Ensure byte-for-byte preservation across all split boundaries.
