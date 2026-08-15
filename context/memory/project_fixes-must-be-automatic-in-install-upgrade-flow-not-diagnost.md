---
id: P-7XFB9A3T
type: project
shape: Timeless
title: Fixes Must Be Automatic in Install/Upgrade Flow, Not Diagnostic-Tool-Based
created_at: 2026-07-22T10:54:39Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 56389302c1204b76170c505f0207023df507bf648ae6fe508ea4f8a900d4bd98
related: [task-248-reframed-the-user-s-design-call-2026-07-22-the-pre, bom-d-fact-files-are-invisible-to-scanning, a-health-check-behind-a-command-does-not-surface-a-silent-fa]
---

- Automatic fixes live in `cmk install`/upgrade flow, not in commands users run
- On upgrade: kit auto-detects stray `context/` tiers and recovers their facts into root
- `cmk doctor` is secondary backstop only — reports issues, never the primary fix pathway
- Core principle: users should never need to run commands to fix themselves

**Why:** Aligns with kit philosophy (D-85/D-164/D-169) that the kit self-heals automatically; invisible-until-you-run-a-command fixes are design failures

**How to apply:** For future recovery/cleanup/migration features, build into install/upgrade first; doctor/validation tools are secondary safety nets only
