---
id: P-D7aTRN9U
type: project
title: 'v0.3.1 Release: Final Workflow'
created_at: 2026-06-14T07:22:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e176ad0f689a52e9fe1125bd5bc912aca378e29e
related: [release-workflow-for-claude-memory-kit, v0-4-5-release-workflow, release-workflow-for-lh8ppl-claude-memory-kit]
---

**Complete (gates verified):**
- Stress testing: 5/5 runs passed ✅
- All PRs merged to main with two-pass code review ✅

**Remaining steps:**
1. MCP tools in-session test: `mk_search`, `mk_remember --why`, `mk_get`, `mk_queue_list`
2. Task 143: near-dup paraphrase → conflict-queue routing
3. Execute `npm run release -- patch`
4. Review generated diff
5. Push v0.3.1 tag

**Why:** This is the fully mapped workflow for v0.3.1 release; provides a template for subsequent releases and ensures no steps are skipped.

**How to apply:** Follow these steps in sequence; confirm success before advancing. Step 5 (tag push) triggers automated CHANGELOG finalization, version bump, and CI publish.
