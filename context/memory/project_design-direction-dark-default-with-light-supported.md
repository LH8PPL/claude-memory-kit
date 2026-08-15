---
id: P-7GVXWaUW
aliases: [P-7GVXWaUW]
type: project
shape: State
title: 'Design Direction: Dark-Default-with-Light-Supported'
created_at: 2026-08-07T21:21:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c5c0b7388aeab20e3054fba16c2d1f3c84fdce62dbc0602a9693c86f3c5bc32d
related: [dark-theme-port-workflow-initiated]
---

User chose dark-default-with-light-supported approach (vs dark-only alternative).
- Keeps documented OS-light contract, preserves AA test surface
- Reuses dark token system and surface treatment from pass-3 file
- Retains all five prior review fixes
- Contract-first docs revision: D-432

**Why:** Balances dark appearance preference with accessibility contracts; avoids dark-only's contract deletion and narrowed test scope

**How to apply:** Apply to reviewed page going forward; guide all theme and surface treatment decisions
