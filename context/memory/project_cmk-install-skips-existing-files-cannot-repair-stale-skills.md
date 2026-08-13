---
id: P-QYG695RG
type: project
shape: Timeless
title: '`cmk install` Skips Existing Files, Cannot Repair Stale Skills'
created_at: 2026-07-15T19:04:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f55b094bb1e96120dad6a6e2b3e2ffdf10d27401fb97b85dedc84c0ab2545037
related: [d-343-kit-lacks-mechanism-to-repair-stale-scaffolded-skills, cmk-install-skip-existing-behavior-and-update-implications, empirical-test-proves-cmk-install-skips-stale-skills-d-343-c]
---

The kit's install command skips files that already exist (install.mjs:214). This means a scaffolded skill that becomes stale after a template update cannot be fixed via `cmk install` — the command won't overwrite it. The fix requires manual replacement (`cp` from template) or kit-level mechanism (currently absent, see D-343).

**Why:** Explains why assistant reached for manual `cp` instead of `cmk install`, and identifies a real mechanism gap in the kit.

**How to apply:** When fixing stale scaffolded skills, use manual copy from template; propose `cmk repair --skills` or similar as a forward fix (D-343).
