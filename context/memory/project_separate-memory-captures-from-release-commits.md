---
id: P-aLPJJGFL
type: project
title: Separate Memory Captures from Release Commits
created_at: 2026-06-11T07:29:18Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9f944445807f313e6994c74540fc8545f8a08a3e
related: [release-process-for-claude-memory-kit, release-git-choreography-memory-release-tag-in-order, memory-review-discipline-before-commit]
---

Keep memory/capture commits (context/ changes, session logs, hook captures) in a separate commit from release commits (CHANGELOG.md, package.json version bumps). Release commits contain only the version-bump content, preserving clean audit trail.

**Why:** Release commits should show only what went into the release — when auditing `release: vX.Y.Z` later, the commit should be uncluttered and reviewable as a pure version bump. Accumulated memory captures muddy that history.

**How to apply:** Create two sequential commits during release: first "memory: session captures (...)", then "release: vX.Y.Z"; then push both.
