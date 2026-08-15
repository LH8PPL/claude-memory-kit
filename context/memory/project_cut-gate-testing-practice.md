---
id: P-DYPWAPD5
type: project
title: Cut-Gate Testing Practice
created_at: 2026-06-19T18:05:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d28572a4470b99fa047d0f766e49d9b89d6d661ee261e1c64afd87369c183fbf
related: [live-cut-gate-requirement-unit-green-works-on-real-input, tag-ready-criterion-core-features-pass-known-issues-cleanly, release-gate-cut-gate-guide-must-pass-before-tagging]
---

A "cut-gate" is a full in-chat test session run before tagging a release. It exercises the entire build in a real-world context, catching integration issues and regressions that isolated sandbox tests miss.
- v0.3.3 was cut after a cut-gate, which discovered the F-4/timeout issue that became Task 161
- v0.3.4's individual changes were live-tested separately, but no full cut-gate was run on the whole release together

**Why:** Real sessions expose integration issues, edge cases, and interactions that sandbox tests cannot. Task 161's compression-retry behavior only surfaced in actual use, not in isolated test suites.

**How to apply:** For critical or major-change releases, run a cut-gate (full session test) before pushing the release tag. For minor/stable releases, thorough per-change verification may be acceptable, but the safer pattern is always a full cut-gate.
