---
id: P-2A7SCPHW
type: project
shape: Event
title: 'Task 205 Complete: MCP Server Install DLL Lock Fix'
created_at: 2026-07-11T08:04:10Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f665b6fac7fff4ab358afd6c332a74b02e366c8bdc1cc8055dc324fd14d64f6e
related: [task-96-cmk-redact-purge-hard-merged-pr-295, task-159-multi-stage-verification-gate, task-completion-workflow-code-test-doc-review-live-test-merg]
---

Fixed `cmk install` breaking when targeting its own running MCP server. Work completed:
- Diagnosis: bin boundary constraint + dependency-free recovery module
- Testing: unit tests + live-spawn probe against real running server
- Live-probe discovery: matcher missed real quoted command line (`"mcp" "serve"`) — third real-payload instance
- Genuine captured payload committed as test fixture
- Skill review found gap: PIDs without command lines allowed blind kill consent
- Both issues fixed and tested before gate run
- Awaiting test suite + stress report results before PR commit

**Why:** Live probes caught payload issue unit tests missed; skill review caught consent-flow gap; demonstrates effectiveness of multi-layer validation before merge

**How to apply:** Apply live-probe testing for MCP-related work in Task 206+; use captured real payloads as test fixtures; validate consent flows in skill review
