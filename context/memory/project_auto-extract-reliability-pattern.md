---
id: P-THKPG6TZ
type: project
shape: Timeless
title: Auto-Extract Reliability Pattern
created_at: 2026-07-20T09:42:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2140b36154794f9cd35853b36b8ee41e224ebd71e3ad2c600f446dd5262c1cee
related: [d6-fail-safe-behavior-on-compress-timeout, memory-system-captures-work-in-real-time, task-242-auto-extract-silent-failures-self-heal-first-design]
---

Auto-extract frequently times out under load (observed: 7 timeouts to 1 success in a sampling window) but recovers automatically and silently once load drops. No manual retry or fix required; the system self-corrects across sessions.

**Why:** Prevents false conclusions about tool failure — timeouts don't mean permanent breakage; they often resolve in the next session when system resources free up.

**How to apply:** If auto-extract appears to have captured nothing in a session, don't assume it's broken. Check again after load decreases or in the next session.
