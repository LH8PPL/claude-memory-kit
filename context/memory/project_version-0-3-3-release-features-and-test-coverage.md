---
id: P-LCZ6Q27C
type: project
title: Version 0.3.3 Release Features and Test Coverage
created_at: 2026-06-17T08:20:24Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fcbe25dc627b8afb2e980758032655ce03fafeb4a19729ed2fc34cdb03a71312
related: [v0-3-3-release-staging-state, cut-gate-testing-structure-terminal-vs-live-session-gates, cut-gate-16-setup-terminal-tests-complete]
---

v0.3.3 ships: (1) Digest + decision-journal (gates DJ1–DJ4, §4c), (2) Tombstone-recovery + agent-stays-blind (gates F-7b, §7), (3) Conversational MCP surface (gates M0–M3, §4b), (4) Recall ladder (gates W1–W4, §5). **Verified:** sections 0–1 passed all terminal gates. **Pending:** sections 2–9 live-session behavioral tests before final tag.

**Why:** Next session needs exact test coverage before final release; live gates are blocking for 0.3.3 tag

**How to apply:** Open Claude Code session and run §2–§9 gates to verify all features work before cutting release tag
