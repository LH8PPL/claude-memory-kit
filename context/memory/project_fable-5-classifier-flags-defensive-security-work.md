---
id: P-QZT9Z5DG
type: project
shape: State
title: Fable 5 classifier flags defensive security work
created_at: 2026-07-11T12:49:49Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5a79ca9adcbdc61e4490e58b898b6b8e7dd0900022f2e094454381ad469362a2
related: [fable-5-dual-use-safety-flagging-behavior, cmk-install-auto-updates-managed-block-version-stamps]
---

Fable 5's security keyword filter is intentionally overly-broad and classifies defensive security coding (e.g., building secret guards, poison guards) the same way it classifies attacks. Task 216 (screening content for secrets before committed writes) is vocabulary-dense enough to trigger the filter constantly, causing automatic model swap to Opus 4.8.

**Why:** Predicting and handling model swaps in future security-heavy tasks. The swaps are not errors—they're intentional safeguards, but knowing the trigger helps avoid confusion.

**How to apply:** For security-heavy tasks, either preempt with `/model claude-opus-4-8` to avoid banners, or accept the auto-swaps as normal for this class of work. Nothing is broken; Opus 4.8 handles the work fine.
