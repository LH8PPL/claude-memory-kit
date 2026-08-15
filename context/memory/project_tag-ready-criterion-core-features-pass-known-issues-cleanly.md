---
id: P-VZF4U3TP
type: project
title: 'Tag-ready criterion: core features pass; known issues cleanly deferred'
created_at: 2026-06-18T15:42:09Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cabb15d42bdf04d7fa41eb17271079f8f17a6017cb1cd3bc11b8df68ec7e6ffb
related: [d-157-rule-version-assignment-at-shipment, catch-task-changelog-version-mismatches-pre-release, shipping-principle-fix-core-promise-gaps-before-release]
---

A version is tag-ready when all features it ships pass end-to-end, even if known issues exist in experimental features or pre-scoped future work. Example: v0.3.3 is tag-ready despite Task 161 (haiku_timeout in F-4 daily-distill and compression family) because that issue is cleanly filed and scoped to v0.3.4, not blocking v0.3.3's shipped features.

**Why:** Allows shipping working features while deferring known architectural issues to future releases without false urgency or version coupling.

**How to apply:** Before tagging, verify: (a) do the features in THIS release scope work end-to-end? (b) are known failures already filed and assigned to future work? (c) if both yes, tag. Use this model to unblock shipping.
