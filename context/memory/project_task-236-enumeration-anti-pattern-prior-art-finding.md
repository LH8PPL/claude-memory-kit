---
id: P-3BTLM525
type: project
shape: State
title: 'Task 236: Enumeration Anti-Pattern (Prior-Art Finding)'
created_at: 2026-07-20T17:28:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a92f480f2c4f9e12d428fc65e306640d26557610091512e3c1fe1fc3792c855a
related: [prior-art-finding-ecc-gate-enumeration-vs-generic-scan]
---

ECC's catalog.js enumerates 40 doc locations for staleness checking; WORKING-CONTEXT.md is in zero of them. This caused the 4-month staleness found in D-364 study (v1.10.0 claimed 47/79/181, v2.0.0 actual 67/94/278). Design lesson: enumeration fails at the one place you didn't enumerate. Task 236 already chose generic scanning; this prior-art finding evidences that choice and rules out the auto-fix-by-location shape.

**Why:** Provides empirical justification for scanning generically rather than hand-enumerating locations.

**How to apply:** Reference when finalizing or justifying Task 236's scanning approach over enumeration.
