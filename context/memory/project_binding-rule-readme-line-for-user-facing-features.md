---
id: P-5JA3WDAS
type: project
shape: Timeless
title: Binding Rule – README Line for User-Facing Features
created_at: 2026-07-21T06:59:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7433c9e26385f5e3836ac453e31953546fe3949a9f7fa422e3759f627504a9b5
related: [doc-review-is-pr-body-based-direct-merges-bypass-it, memory-kit-architecture-complementary-kit-and-claude-md, claude-md-checkpoint-4-pre-commit-screening-rule]
---

User-visible capability must receive a README line in the same PR as the merge. This is stated as a binding rule but currently not enforced by automation.

**Why:** Ensures user-facing features are discoverable; surface-level doc review catches gaps early.

**How to apply:** Add this as a PR checklist for feature merges; consider whether to enforce via automation or escalate on bypass.
