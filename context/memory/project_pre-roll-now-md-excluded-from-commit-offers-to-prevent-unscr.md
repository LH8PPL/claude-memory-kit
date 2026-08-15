---
id: P-aMG64J6K
type: project
shape: State
title: Pre-roll now.md excluded from commit offers to prevent unscreened-name shipping
created_at: 2026-07-11T08:31:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cc2de41ba8a3093abc2a087212d6f71ebfdd17f4f6bcc3223514b7c1cfa99191
related: [pre-commit-hook-sanitizes-fact-files-for-security, now-md-assistant-cap-precedent, version-snapshot-in-recent-md-guards-against-cross-session-a]
---

The session-start commit offer explicitly excludes `context/now.md` (the pre-roll, unscreened daily file) from:
- The count of files in the offer
- The instruction text shown to the user

This prevents the user from accidentally shipping a raw (unscreened) name when accepting the offer. Separately, the privacy screen processes `now.md` in the background and drains it into the screened daily file, which is then included in the next commit offer.

**Why:** Guarantees personal names are privacy-screened before any commit ships; prevents accidental unscreened context leakage

**How to apply:** When working on commit-offer logic or privacy-screen workflows, remember this exclusion-during-processing pattern as a safety guard
