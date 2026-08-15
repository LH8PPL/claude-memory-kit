---
id: P-ATGKYNMX
type: project
title: SonarCloud TypeScript Analyzer Exit Code Quirk
created_at: 2026-07-01T12:20:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 71414f84c78e73b7a4b81b202ec086cb6a06f58c9ae99baa0b8596e7b963dbb4
related: [project-discipline-verify-claims-by-reading-logs, mcp-serve-is-long-lived-restart-after-rebuild-or-you-test-st, gate-verification-system-architecture]
---

SonarCloud's TypeScript analyzer can crash internally (e.g., "Debug Failure: No error for last overload signature" in `server.cjs:getResolvedSignature`) while linting specific files.

- **Attempt 1:** Analyzer crashes → SonarCloud aborts → red gate (exit code fails)
- **Re-run:** Same crash occurs but is tolerated (file skipped) → green gate (exit code succeeds)
- **The trap:** Green exit code does not mean linting succeeded; it may have skipped files due to internal crash

**Why:** CI gates become unreliable. Green re-runs can mask real failures, creating false confidence. This issue blocked v0.4.3.

**How to apply:** When SonarCloud flips red→green on re-run, always read full logs before trusting. Exit code is not authoritative. Task 187 filed to resolve (exclude problematic file or await upstream SonarJS fix).
