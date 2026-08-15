---
id: P-PHDPCC2W
type: project
title: Rebuild Artifact After Bug Fix (Without Re-cutting Release)
created_at: 2026-06-21T16:02:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e1096496384ce79cf2d2faceba70d6b2a8d0252df209b2939089d6364ff11b59
related: [rebuilding-the-global-cmk-binary-after-code-changes, re-pack-verify-workflow-for-cut-gate-testing, rebuild-global-cmk-cli-binary-release-process]
---

When a bug fix merges into the release branch after `npm run release`, rebuild the global artifact without re-running the release steps:

**Skip §0a** (release cut) — version already 0.4.0; re-running would attempt 0.5.0 or error.

**Re-run §0b** (rebuild artifact):
- `cd C:\Projects\claude-memory-kit\packages\cli && npm pack`
- `npm uninstall -g @lh8ppl/claude-memory-kit && npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz`
- Verify: `cmk --version` (still 0.4.0, now with fix)

**Skip §0c** (backup) — folder already exists; re-running would error.

**Partial §1 re-run**: Skip mkdir/git init/cmk install (already complete). Re-run only the failing check (e.g., `cmk doctor` in gate project) with the rebuilt binary.

**Why:** Global `cmk` is the pre-fix binary. Bug fixes are content-only; version stays unchanged. The binary must be re-packed and re-installed.

**How to apply:** After merge + `git pull`, execute this sequence. Then resume gate from the next checkpoint (KH1/KH2).
