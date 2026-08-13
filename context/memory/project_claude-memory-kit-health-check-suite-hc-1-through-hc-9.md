---
id: P-Y4SVHUKL
type: project
title: 'Claude-Memory-Kit: Health Check Suite (HC-1 through HC-9)'
created_at: 2026-06-22T18:34:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0f0544e3915f15efe47dd7bc8c6df29ff3e572804bfb444defddf3f4b48359ba
related: [fresh-cmk-install-expected-cmk-doctor-baseline, cmk-health-check-status-2026-06-20, fresh-cmk-install-health-baseline-cmk-0-4-5-with-semantic]
---

The kit includes 9 health checks validating completeness and health:
- **HC-1:** Stop + SessionStart hooks registered (Kiro IDE wiring check)
- **HC-2:** Daily distill freshness (≤2 days) [SKIP until distill runs]
- **HC-3:** Transcripts firing (≤3 days) [SKIP until Claude Code turns exist]
- **HC-4:** INDEX.md matches context/memory/ files (memory index integrity)
- **HC-5:** Cron jobs registered (optional; lazy-on-read fallback available)
- **HC-6:** Native Anthropic Auto Memory status (kit-only projects report "not active")
- **HC-7:** No stale lock files
- **HC-8:** Native bindings present (better-sqlite3, embedder — npm 12 readiness)
- **HC-9:** Project scaffold version (checks CLAUDE.md; may SKIP on Kiro projects without checked-in CLAUDE.md; not a blocker)

Output format: `N pass · 0 fail · M skip (timeMs)`. Run with `cmk doctor` at SessionStart or on-demand.

**Why:** Health checks surface misconfigurations, missing setup, and version skew. They gate readiness and help triage failures.

**How to apply:** After `cmk install`, run `cmk doctor` and fix any FAILs. SKIPs are normal for features not yet active. Use HC-1 PASS to confirm IDE wiring; HC-8 PASS to confirm semantic hybrid mode (if installed with --with-semantic).
