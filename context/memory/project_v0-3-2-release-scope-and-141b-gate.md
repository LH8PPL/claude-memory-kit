---
id: P-5NZCD94Q
type: project
title: v0.3.2 Release Scope and 141b Gate
created_at: 2026-06-16T04:37:25Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a35088b45d4624ecd8c2f80de2a8f90831ac789ca3bb63c1a419b26e0419396a
related: [v0-3-2-release-scope-locked, v0-3-2-release-status, v0-4-5-release-workflow]
---

- **Locked scope:** Tasks 153, 152, 147 + js-yaml security fix + README rewrite + CONTRIBUTING.md (all merged to main)
- **Release gate:** Task 141b (storage bake-off decision) — ships in v0.3.2 only if CI verdict is PASS
- **CI workflow sequence:** PR #190 (bench harness + CI job) must merge to main → user manually triggers "Run workflow" from Actions tab → CI bench runs on quiet runner → verdict (PASS/FAIL/INCONCLUSIVE, target < 3% noise) decides 141b inclusion

**Why:** v0.3.2 scope is locked; 141b is the sole pending decision before release can be cut

**How to apply:** Once #190 merges, user must trigger the CI workflow from Actions tab. Verdict decides 141b and unblocks v0.3.2 release.
