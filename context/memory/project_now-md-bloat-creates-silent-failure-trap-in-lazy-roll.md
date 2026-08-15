---
id: P-Ma5V7DXV
type: project
title: now.md Bloat Creates Silent-Failure Trap in Lazy Roll
created_at: 2026-06-25T13:44:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 55a50e30e661a03db664189b37943427ab5fd399643603e93dbee97c6fb104d6
related: [task-167-lazy-roll-robustness-extension-v0-4-x, auto-heal-path-for-v0-4-1-task-167-d-169-binding, now-md-bloat-root-cause-was-cron-active-short-circuit-not-ti]
---

The lazy `now.md` → `today` roll mechanism (Task 105) has a failure mode at scale:
- **Symptom:** When `now.md` grows to ~400 KB, the roll silently fails (times out, cooldown-skips, or fails without error)
- **Trap:** Once bloated, `now.md` never self-heals; the lazy roll never succeeds again
- **Recovery:** `cmk-compress-session` manual command restores health (410 KB → 1.4 KB in observed case)
- **Root cause:** The bloated state exceeds the roll's timeout/resource budget; cooldown mechanism prevents retry; no fallback self-repair kicks in

**Why:** Future sessions may encounter stale injected context because the roll failed silently. Diagnosing this requires understanding the trap; recovery requires knowing about the manual command. This is critical for session health troubleshooting.

**How to apply:** If session startup shows stale injected context, check `now.md` size. If >100 KB, run `cmk-compress-session` before assuming other bugs. Task 167 (v0.4.x) will prevent this trap by adding size-triggered roll + bounded compression.
