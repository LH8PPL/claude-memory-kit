---
id: P-HH76WYCR
aliases: [P-HH76WYCR]
type: project
shape: Timeless
title: 'Versioning Policy (D-24): Differentiators per Release Level'
created_at: 2026-08-03T13:52:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 341250b63a3e217e7c0b711dcaf7df285f0ce0da17814703effdc3e0eefcb5e0
---

One differentiator per minor version; each minor bump introduces one major new feature or capability. Patch = polish only: fixes, refinements, and visual improvements to existing features (no new capabilities, no new verbs). Example: visual pass on viewer UI (Task 260) is polish, classified as patch-level (v0.6.5); team layer work reserved for v0.7.0 (next minor).

**Why:** Provides clear decision tree for version bumping; prevents version inflation from incremental refinements

**How to apply:** Classify new work as capability (minor bump) or polish (patch bump) using this rule before committing to a version number
