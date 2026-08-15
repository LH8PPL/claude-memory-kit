---
id: P-U6Qa2BJZ
type: project
title: Now-Roll Self-Heal (v0.4.1 Headline Feature)
created_at: 2026-06-26T15:47:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7ebf9e05d0b381ff381aadd362ad9ce368c6767b5d40712b8db6d13054f111c4
related: [cmk-version-bumping-convention, pre-session-1-gate-procedure-v0-4-1, global-install-auto-recreates-user-tier-directory]
---

The now-roll feature auto-detects and self-heals `claude --print` format changes across releases.

Both test scenarios PASS:
- Detects format drift when `claude --print` output structure changes
- Auto-runs recovery without manual intervention
- Verified against real, unmodified `claude --print` output (not mocked)

**Why:** Claude releases change output format; the kit must detect and adapt automatically to avoid breaking memory extraction in live sessions

**How to apply:** After any Claude version bump, if extraction starts failing, NR1 self-heal will trigger; monitor logs for "now-roll" recovery messages
