---
id: P-FZ3XFLAB
type: project
title: CMK_DISABLE_SEMANTIC Environment Variable
created_at: 2026-06-13T08:38:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ef23c6de1994e5f810db5efd0126c34373ce59fd
related: [global-install-auto-recreates-user-tier-directory, log-sink-injection-pattern-across-install-uninstall, stress-gate-required-before-pr-for-spawn-hook-boundary-chang]
---

Environment variable `CMK_DISABLE_SEMANTIC` controls whether semantic similarity processing runs. Functions like `prepareSemanticSimilarity()` must check this flag and skip processing when disabled, for consistency across deployments.

**Why:** Allows disabling expensive optional features (semantic similarity) in certain deployments or test scenarios.

**How to apply:** When implementing semantic similarity code, check this env var early and skip if set.
