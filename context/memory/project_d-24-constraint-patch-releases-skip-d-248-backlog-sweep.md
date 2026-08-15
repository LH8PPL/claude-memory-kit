---
id: P-6QV27W3J
type: project
shape: Timeless
title: 'D-24 Constraint: Patch Releases Skip D-248 Backlog Sweep'
created_at: 2026-07-20T20:37:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 09dd5862e9cda4ab6d52ebad4276b32f3c454953b97a4148a5f1720dbcd8f72a
related: [v0-6-2-minor-release-gate-process-d-248-d-267-rule, minor-release-triggers-backlog-sweep, patch-release-strategy]
---

D-24 rule specifies that patch releases (vs. minor or major) do not require or trigger the D-248 backlog sweep. This is described as "the minor-boundary forcing function" — implying backlog sweeps are gated on minor/major boundaries, not patches.

**Why:** This rule shapes release-gate decisions and tells when a release path is "short" (patch) vs. requires additional review (minor/major boundaries)

**How to apply:** When classifying a release type, use this to determine if D-248 backlog sweep applies. For patches, it does not.
