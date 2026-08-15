---
id: P-E2GNU77L
type: project
title: Composition Bug Pattern in claude-memory-kit
created_at: 2026-06-11T08:52:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ec7a63534805492711d0a9080a523f73ab84011b
related: [d-303-blocker-closing-via-live-kiro-re-test]
---

Unit tests passed green through ~10 releases, but integration (composition) tests failed silently because:
- `capture-turn` appends turns to `now.md` buffer
- `auto-extract` previously re-read `now.md` during dedup phase
- State divergence between capture and extract phases: each individually correct, jointly broken

Real-world failure: gate8 showed `observation_count: 1` (suppressed) while suites passed.

Fix applied (D-122 PR):
- Snapshot dedup context *inside* turn file (`DEDUP_CONTEXT:` section) before buffering
- Extractor reads only captured snapshot, never re-reads volatile `now.md`
- Volatile buffers excluded from corpus validation to prevent validation-race signals
- New composition pins and 5× stress gates added to catch integration divergence early

**Why:** Composition failures hide in unit-green suites; requires end-to-end Stop-hook chain testing (capture → detached spawn → live extraction) to surface

**How to apply:** Future capture-turn or auto-extract changes must verify composition behavior via stress gates; catch divergence before release
