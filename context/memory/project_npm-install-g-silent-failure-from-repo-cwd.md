---
id: P-K79HDTZS
type: project
shape: State
title: '`npm install -g` Silent Failure From Repo Cwd'
created_at: 2026-07-21T12:51:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1e29cc5a9294d3a69987d3e34fa8740288375739ef75916a54052b91739c6f31
related: [npm-install-g-silent-failure-when-run-from-repo-directory, windows-ebusy-when-updating-cmk-during-claude-code-runtime, rebuilding-the-global-cmk-binary-after-code-changes]
---

Running `npm install -g core-memory-kit@latest` from inside the project root exits 0 but silently leaves the old version installed. Only works from a neutral cwd. Discovered by post-execution verification (`cmk version`), not by exit code.

**Why:** Users following install docs from their project root will silently get stale versions. This needs to be fixed before v0.6.2 release.

**How to apply:** Before v0.6.2 ships, investigate root cause (npm quirk vs. project setup issue) and audit/update install instructions if needed.
