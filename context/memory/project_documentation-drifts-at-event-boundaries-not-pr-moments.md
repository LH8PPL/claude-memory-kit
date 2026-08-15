---
id: P-AJY64N9L
type: project
shape: Timeless
title: Documentation Drifts at Event Boundaries, Not PR Moments
created_at: 2026-07-22T14:25:35Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e1390fc3d27e7d8614f7c5e0195de8b8aec34ed15551126dd3efdbe67a4338b9
related: [doc-update-release-boundary-rule, multi-surface-documentation-architecture, catch-task-changelog-version-mismatches-pre-release]
---

Documentation updates have two distinct moments:
- **Per-change level**: caught by PR review walks (README, QUICKSTART, CONTRIBUTING, CHANGELOG, CLI.md, MCP.md, HEALTH-CHECKS, design/reference docs)
- **Event level**: driven by releases and lane decisions; these events typically have no associated PR

The recurring gap: RELEASE-PLAN.md (which records "which version ships what" and lane state) drifts because its update moment is an event, not a code change. This gap has surfaced four times; in v0.6.2, it wasn't updated until the user's doc-completeness check surfaced it.

**Why:** Standard doc walks are PR-driven and catch per-change updates. Release cuts and lane decisions happen outside the PR process, leaving event-level docs unowned.

**How to apply:** D-249's hygiene lane should formalize a release-level documentation check: ensure RELEASE-PLAN.md is updated when versioning/shipping state changes. Integrate this into release commit creation, not as a post-hoc verification.
