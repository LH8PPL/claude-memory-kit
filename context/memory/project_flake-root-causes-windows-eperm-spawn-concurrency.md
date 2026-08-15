---
id: P-Z5TZW33W
type: project
title: Flake Root Causes — Windows-EPERM / Spawn-Concurrency
created_at: 2026-06-21T13:51:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: da0c0994f1d5477097a810b820e1378d559e2a73b52370217f07ce386df754c9
related: [windows-temp-dir-teardown-causes-eperm-in-test-cleanup, windows-rmsync-cleanup-flake-workaround, ci-authority-convention]
---

Two non-product flakes identified and root-caused:
- pack-completeness: `npm pack` spawn retry issue
- capture-turn teardown: best-effort cleanup race

Root cause class: Windows-EPERM / spawn-concurrency

**Why:** Prevents false CI negatives; establishes these as environmental quirks, not code defects.

**How to apply:** If similar flakes recur, check Windows spawn-concurrency; consider retry hardening or cleanup ordering if frequency rises.
