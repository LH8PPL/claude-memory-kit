---
id: P-9TJHaTBG
type: project
title: Gate Testing Decision — Quick vs. Comprehensive Path
created_at: 2026-06-25T08:48:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9277c84cbe521a7b880620f2aaeb5f64a5fcbbecd4fc3c907e4896486b07c9ce
related: [kiro-cli-dual-emit-architecture, cmk-install-kiro-setup-commands, kiro-cli-integration-test-gate-and-reinstall]
---

Option A (stay on IDE 0.12.333): quick, no install needed, runs legacy KH1/KH2. Option B (upgrade to 1.0.52): comprehensive, live-verifies v1 IDE work built this session (50.N.3 + D-203). A skips v1 verification; B fully validates what was built.

**Why:** This session added v1 IDE integration; gate testing should verify it or explicitly acknowledge it unverified

**How to apply:** Recommend comprehensive path when new IDE features were built; use quick path only for smoke tests of stable code
