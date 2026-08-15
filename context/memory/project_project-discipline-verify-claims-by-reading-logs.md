---
id: P-FK3U45RA
type: project
title: Project Discipline — Verify Claims by Reading Logs
created_at: 2026-07-01T12:20:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8025c03122043771f8479009c2c0cc602782ab70bd6082db0308e369f95747cb
related: [sonarcloud-typescript-analyzer-exit-code-quirk, ci-authority-convention, claude-md-ci-validator-binding-rule]
---

Core discipline (recorded as `D-250`): When a tool reports status (exit code, gate color), verify by reading full logs first.

- **The lesson:** "it re-ran green" ≠ "I checked the error"
- A green exit code can mask a crash the tool merely tolerated
- The difference is discovered only by reading logs, not trusting exit codes

**Why:** Prevents false confidence and bugs masked by tool quirks. Enforces honest diagnostics instead of assuming exit codes are authoritative.

**How to apply:** After any CI gate flips, especially red→green on re-run, read logs before declaring victory. Critical for advisory tools where exit codes may not reflect actual success.
