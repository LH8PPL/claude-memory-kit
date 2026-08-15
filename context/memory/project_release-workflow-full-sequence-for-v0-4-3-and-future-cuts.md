---
id: P-GAAY4WKJ
type: project
title: 'Release Workflow: Full Sequence for v0.4.3 and Future Cuts'
created_at: 2026-06-30T20:29:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7c5a213913fada845b4b083d7f1b986140f4dd53570bce90f187bebc4237b45a
related: [release-workflow-and-commands-for-production, release-command-sequence-for-npm-packages, release-workflow-with-cut-gate-testing]
---

**Step 1: Merge feature branch to main**
- `git checkout main && git pull`
- `gh pr create --base main --head task-151-recurrence-promotion --title "[151] persona-promotion redesign + v0.4.3" --fill`
- `gh pr merge --squash --delete-branch`
- `git pull`

**Step 2: Cut release locally (bumps version)**
- `npm run release -- minor`
- Review diff (only CHANGELOG + version bump)
- `git add CHANGELOG.md packages\cli\package.json`
- `git commit -m "release: v0.4.3"`
- `git push origin main` (normal push, NOT publish yet)

**Step 3: Build and install the tarball**
- `cd packages\cli && npm pack` → produces `lh8ppl-claude-memory-kit-0.4.3.tgz`
- `npm uninstall -g @lh8ppl/claude-memory-kit`
- `npm install -g .\lh8ppl-claude-memory-kit-0.4.3.tgz`
- Verify: `cmk --version` should show 0.4.3

**Step 4: Run cut-gate validation (docs\process\cut-gate.md)**
- Backup `~\.claude-memory-kit` first: `Move-Item $env:USERPROFILE\.claude-memory-kit C:\cut-gate-backups\user-tier_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')`
- Follow all checks in cut-gate.md (new §4d / PR1–PR5 test Task 151 persona features)
- All ★ checks must pass

**Step 5: Publish (only if Step 4 passes)**
- `git tag v0.4.3`
- `git push origin v0.4.3` ← this triggers npm publish + GitHub Release

**Critical**: Nothing publishes to npm/GitHub until Step 5's final tag push.

**Why:** This is the canonical release workflow. It ensures features are validated via cut-gate before any publication. The backup prevents test writes from corrupting real user memory.

**How to apply:** For future releases (0.4.4+), follow these same steps in order, only changing the feature branch name, version number, and PR title. The workflow is reusable across all releases.
