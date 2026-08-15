---
id: P-9YGaCE66
type: project
title: Post-Merge Clean-Build Verification
created_at: 2026-06-14T04:18:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f14cce9b6c6e65f0b1cd84f490a5bce3be85a30a
related: [release-workflow-cold-open-testing-discipline, claude-memory-kit-v0-4-3-release-workflow, repack-and-reinstall-before-gating-release]
---

- After PR merges, re-install kit fresh from main branch (not dev tree), then re-run the entire CLI cut-gate sweep
- Verify that all created files reflect what actually ships

**Why:** Dev tree may have transient state; only a clean build from main branch proves the product is correct

**How to apply:** After any merge affecting CLI functionality, before tagging/release, re-install kit fresh and re-run full cut-gate sweep
