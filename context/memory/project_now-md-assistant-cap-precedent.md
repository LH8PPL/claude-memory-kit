---
id: P-PAKDAWVL
type: project
title: NOW_MD_ASSISTANT_CAP Precedent
created_at: 2026-06-18T20:31:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e8d57c17f8ddbfd95c132b7d8b6e11137e8c3888b35d5ad3337a750228237b6e
related: [compression-spiral-bug-at-three-identical-call-sites, durable-tiers-enable-safe-buffer-trimming, cmk-install-skips-existing-files-cannot-repair-stale-skills]
---

The kit already bounds assistant turn size via `NOW_MD_ASSISTANT_CAP` in capture-turn, before turns land in `now.md`. The gap is it doesn't bound (a) user turn size, (b) the number of turns, or (c) input to the three compress call sites (compress-session, daily-distill, weekly-curate).

**Why:** Shows the kit isn't starting from zero on input bounding — the precedent already exists. The solution should extend this pattern rather than invent a new mechanism.

**How to apply:** When designing bounds, reference `NOW_MD_ASSISTANT_CAP` and extend its approach; reuse the kit's own precedent.
