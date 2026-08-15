---
id: P-64M9a7VM
type: project
title: Release Testing Procedure (cut-gate.md)
created_at: 2026-06-30T20:25:46Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1f8448774b11e37ea46bb6bf94ef0e34a5401a1bede055945c830b053a9ca095
related: [release-workflow-with-cut-gate-testing, publish-trigger-is-git-tag-push-not-branch-commit, release-workflow-full-sequence-for-v0-4-3-and-future-cuts]
---

Authoritative release test script at `docs/process/cut-gate.md` with three phases:
- **Section 0**: Cut release locally, build real tarball (no publish)
- **Sections 1–9**: Run all ★ checks, including new PR1–PR5 (§4d) for v0.4.3 persona-promotion features
- **Verdict section**: Final tag push only after all ★ checks pass
Assumes caller is on `main` after merge (or test from branch first, then merge).

**Why:** Self-contained release procedure guards against publishing incomplete/untested builds; centralized source of truth for release workflow.

**How to apply:** When preparing a release, enter `docs/process/cut-gate.md` and follow top-to-bottom. Stop if any ★ check fails. Only proceed to final tag push after all checks pass.
