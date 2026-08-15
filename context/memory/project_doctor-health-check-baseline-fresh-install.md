---
id: P-AUF4MDTR
type: project
title: Doctor Health Check Baseline (Fresh Install)
created_at: 2026-06-16T09:06:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 815628f1abef18a3eb8d5c29463de7489bb8ad5b61a46a98b4a92de5af6fce1b
related: [claude-memory-kit-cmk-doctor-baseline-pre-first-turn, fresh-cmk-install-health-baseline-cmk-0-4-5-with-semantic, fresh-cmk-install-expected-cmk-doctor-baseline]
---

On a fresh install of claude-memory-kit (no prior sessions, distills, transcripts, or cron jobs), `cmk doctor` should report:
- **5 pass**
- **0 fail**
- **3 skip** (expected: no distill log, no transcripts, no cron jobs exist yet)

This baseline indicates HC-8 health on a fresh system.

**Why:** Distinguishes expected vs. actual health issues early in setup validation.

**How to apply:** If fresh install doctor shows 5p/0f/3s, it passes the health gate (G1 in the cut-gate). If it shows failures or unexpected skips, investigate.
