---
id: P-NZE35AKR
type: project
title: Local Tarball Testing Path (Pre-Publish Gate)
created_at: 2026-06-20T12:24:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3eb48061ecbd70d7ca3d3f74ad26970bc2e0abf95a609f0d0d3ec528529f2026
related: [established-testing-path-in-cut-gate-md-lsjg9nck, global-cli-rebuild-and-reinstall-workflow, version-0-3-3-release-cut-gate16-test-session-state]
---

Before publishing to npm, validate via `npm pack` → uninstall global → `npm install -g ./tarball.tgz` → verify with health checks. This avoids premature npm publish and tests against the real packaged artifact.

**Why:** Catches bugs before they reach npm; reduces risk of bad versions going public; aligns with established cut-gate.md pattern, proven effective for v0.3.5.

**How to apply:** Treat cut-gate.md testing workflow as the primary verification gate; consult it before suggesting publish-first alternatives.
