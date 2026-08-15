---
id: P-TTL9GSJV
type: project
title: Reliable tarball file validation with npm pack --json
created_at: 2026-06-11T11:34:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 65129af03a78166e3386cacf6afd3d88289c187c
related: [ci-authority-convention, validator-pattern-structural-guards-in-test-suite-task-128-r, release-plan-md-authoritative-task-to-lane-map]
---

The human-readable "Tarball Contents" notice in `npm pack` output is elided by npm itself for long listings — not a kit issue.
Use `npm pack --dry-run --json` for reliable file listings; the JSON output is authoritative, the notice is not.

**Why:** Manual `tar -tzf` verification is error-prone. Structural validators need a reliable source of truth that can be asserted at test time.

**How to apply:** When validating tarball contents (e.g., ensuring all templates are bundled), use `npm pack --dry-run --json` as the input source for test-time assertions.
