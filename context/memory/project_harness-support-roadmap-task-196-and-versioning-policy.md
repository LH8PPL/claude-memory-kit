---
id: P-KKXDa34P
type: project
title: Harness Support Roadmap (Task 196) and Versioning Policy
created_at: 2026-07-02T07:39:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bd29a13f08332b33fabd6d0b37bb617d7b12d4249411fa7f0ea840255fa2685f
related: [v0-4-x-versioning-roadmap, patch-release-strategy, v0-4-roadmap-kiro-first-editor-integration]
---

The kit is expanding to support multiple harnesses beyond Claude.

**Shipped:**
- Kiro IDE/CLI (v0.4.0)

**Committed next:**
- Cursor

**Ordered tail (on demand or breadth-first after v0.4.4):**
- Codex
- Antigravity
- gemini-cli
- opencode
- [others]

**Versioning policy:** Patch numbers assigned when each harness ships per cadence. Pickup trigger: first breadth slot after v0.4.4 or real user demand.

**Why:** Multiple harnesses require clear roadmap and versioning to avoid ad-hoc decisions and release-pressure coupling.

**How to apply:** When new harness requests arrive, check roadmap and demand; add to ordered tail if not listed. Assign version numbers only when work is committed.
