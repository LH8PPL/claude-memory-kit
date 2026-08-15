---
id: P-LLZZSBP3
type: project
title: Release Workflow and Commands for Production
created_at: 2026-06-30T15:14:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a8bd5f7b17fef733103fe7efa5ec500d586e6991f166aea5d386694ea63e440b
related: [release-workflow-full-sequence-for-v0-4-3-and-future-cuts, release-command-sequence-for-npm-packages, release-workflow-with-cut-gate-testing]
---

Release process is user-driven (assistant does not self-merge/publish) in three phases:

**Phase 1: Merge to main via gh CLI**
- `git checkout main && git pull`
- `gh pr create --base main --head <branch> --title "[<task>] <description> (v<version>)" --fill`
- `gh pr merge --squash --delete-branch`
- `git pull`

**Phase 2: Cut release via npm (canonical method — never hand-edit)**
- `npm run release -- minor` — finalizes [Unreleased] → [version], bumps package.json
- `git add -A && git commit -m "release: v<version>"`
- `git push`

**Phase 3: Tag push (triggers CI publish)**
- `git push origin v<version>` — triggers publish.yml for npm + GitHub Release

**Conventions:** Branch: `task-{N}-{slug}`. PR title: `[<task>] <description> (v<version>)`.

**Why:** Multi-step release with specific tooling; npm script is canonical (prevents hand-edits). Tag push triggers automated CI. Stress test must pass 5/5 before merge.

**How to apply:** When ready to release, follow phases 1–3 in sequence. Use exact commands; do not hand-edit package.json or manually finalize CHANGELOG — npm script is authoritative.
