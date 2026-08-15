---
id: P-XAVLD63M
type: project
title: Production Code Must Go Through PR/CI
created_at: 2026-06-13T12:20:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d0af0a1bf527e9a9ab0c9324908bdbd8d289f8d9
related: [direct-to-main-approval-by-campaign-rules, production-code-changes-need-a-pr-never-direct-to-main, multi-layer-gating-before-main-merge]
---

All production code changes (including edits to production source files like `install.mjs`) must go through the PR/branch/CI cycle. Direct-to-main is reserved exclusively for docs, scaffold, and meta materials (housekeeping, configuration). The `.gitattributes` commit this session violated this — it touched production code but bypassed the PR gate.

**Why:** PR/CI ensures code review, confirmed-green test suite before merge, and cross-platform CI validation. CI matrix catches Windows/macOS issues that local runs may miss.

**How to apply:** When shipping, create a branch → PR → CI for all production code. Reserve direct-to-main only for non-code materials (READMEs, config, housekeeping notes).
