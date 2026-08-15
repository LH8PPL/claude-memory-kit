---
id: P-QG473UUX
type: project
shape: Timeless
title: Versioning Rule D-24 — MINOR Carries One Differentiator
created_at: 2026-07-20T12:33:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b6140a015c57663b55efc420972947cfbc95c697226c81ca5ce95239b2973a05
related: [patch-release-strategy, versioning-policy-d-24-differentiators-per-release-level, post-fix-integration-workflow]
---

- **MINOR versions** = exactly one differentiator (a user-facing wow feature)
- **PATCH versions** = polish, fixes, and follow-ups to the current MINOR; no new differentiators

**Why:** A headline feature buried in a patch gets no visibility (nobody reads patch release notes). Each MINOR deserves clear, focused marketing and user attention.

**How to apply:** When planning a release, determine whether a feature is a new differentiator. If yes, it waits for the next MINOR (possibly by design, if dependencies exist). If no, it fits in the current PATCH cycle.
