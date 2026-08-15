---
id: P-EVZ5BUYa
type: project
title: 'Two-Phase Release: Commit/Gate, Then Tag/Publish'
created_at: 2026-06-21T14:41:46Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b410d9fcc48bca0f10f1c81e4b532f03472c07df390d2aef3764e168c6d0cf49
related: [publish-trigger-is-git-tag-push-not-branch-commit, release-workflow-tag-timing-after-gates, release-workflow-npm-script-git]
---

- **Phase 1 (commit/gate):** `git add`, `git commit -m "release: vX.Y.Z"`, `git push origin main` → lands version bump on main, does NOT trigger publish
- **Phase 2 (publish):** `git tag vX.Y.Z`, `git push origin vX.Y.Z` → fires `publish.yml` workflow → npm publish
- **Publish trigger:** only pushing a git tag (v* pattern) triggers publish; branch commits do not
- **Caveat:** release script may suggest `git push origin HEAD --tags` (bundled), but avoid this; use explicit separate commands to preserve the gate

**Why:** Safety model — allows full testing and gate checks (§0a/§0b/§0c) before npm goes live; prevents accidental releases

**How to apply:** Always follow gate sequentially: commit/push main, test artifact, verify ★ checks, then (only if all pass) deliberately push tag as final publish action
