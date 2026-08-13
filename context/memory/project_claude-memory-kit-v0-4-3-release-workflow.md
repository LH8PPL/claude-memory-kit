---
id: P-NXDN4FPC
type: project
title: claude-memory-kit v0.4.3 Release Workflow
created_at: 2026-07-01T11:11:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 28f8a450239a3d58e2d33cff45026686450deaf8ce2b8b49d29b2e433a0e57d9
related: [release-workflow-cold-open-testing-discipline, post-merge-clean-build-verification, claude-memory-kit-fix-verification-protocol-v0-4-3]
---

- Develop and test fix on branch (PR #246)
- Submit PR; wait for CI to pass
- Merge to main (via `gh pr merge --squash --delete-branch`)
- Watch CI green on main branch
- Rebuild tarball from main
- Run cold-open test (fresh install in new dir, run test prompt in fresh Claude Code session)
- Only after cold-open succeeds: tag the release

**Why:** Ensures the fix is proven on the actual production commit (main) before publishing, not just in a dev branch.

**How to apply:** Before tagging any release, execute the cold-open workflow. Do not skip to tagging based on PR CI alone.
