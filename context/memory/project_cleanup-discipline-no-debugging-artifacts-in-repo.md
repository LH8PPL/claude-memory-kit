---
id: P-HNLZNY3L
type: project
shape: Timeless
title: 'Cleanup Discipline: No Debugging Artifacts in Repo'
created_at: 2026-07-07T18:18:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3862c48ac5815d12c97ab3d0a03fb992e494a3c3eab47cf857872cada67110cf
related: [memory-tier-flushing-rules, direct-to-main-approval-by-campaign-rules, cmk-install-auto-updates-managed-block-version-stamps]
---

Throwaway debugging scripts and temporary files (e.g., `sync-probe-tmp.mjs`, `warm.mjs`) must not be committed to the repo. When introduced during investigation or iteration, they must be deleted before final commit. The kit enforces this as "Phase-6 cleanup discipline."

**Why:** Keeps the repository clean and focused; prevents temporary exploration code from becoming committed artifacts.

**How to apply:** After investigation work, scan the repo for throwaway scripts and delete them before committing. Verify `git status` is clean.
