---
id: P-DSPZ9CAW
type: project
title: Deciding Experiment That Gates v0.3.1
created_at: 2026-06-14T14:19:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f704f1d47ee20a1068ed2b5edfc534e9699c9bfb16079be1ef8bc4f00e87228b
related: [three-session-release-validation-methodology, release-workflow-after-fix-merge, release-workflow-with-destructive-manual-steps]
---

The user designed two test prompts (Task A & B) with explicit pass/fail criteria: **PASS** = skill fires on natural questions OR memory/cmk search leads, does NOT crawl code files. **FAIL** = code is read to answer. Both tests PASSED: memory-search fired, returned the correct archived memory, did not read app/main.py to reconstruct the answer. This proves the recall fix works and v0.3.1 is ready to ship.

**Why:** Live re-test validates the fix against the original problem (crawling code instead of using memory). Removes doubt and gates the tag decision.

**How to apply:** Before tagging v0.3.1, confirm PR #183 merges CI-clean. Session 3 (cold-open test: cmk install + persona-driven scaffold) remains as the final validation gate.
