---
id: P-H9ACD2B4
type: project
shape: Timeless
title: Notification Doctrine — Non-Actionable Repeating Failures
created_at: 2026-07-20T09:45:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9154739b45045b3cc27cbf8f4d03764c7fc6bddbc4fbb070928979a83b75ac27
related: [task-245-diagnosis-deferred-until-reproducible, when-an-automatic-path-fails-build-a-fallback-mechanic-that, memory-tiers-contain-only-mission-context]
---

Do not emit per-session warnings about failure modes the user cannot cause or cure. Reserve the notification channel for state changes and actionable remedies only.

**Why:** Repeating non-actionable reports train teams to ignore notifications and degrade signal-to-noise on real incidents.

**How to apply:** When designing failure reporting, ask "can the user fix this?" If not, design the system to self-heal first; report only if healing fails and a real action exists.
