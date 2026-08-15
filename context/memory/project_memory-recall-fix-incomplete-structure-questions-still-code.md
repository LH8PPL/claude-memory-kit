---
id: P-JP9PYX7R
type: project
title: Memory-Recall Fix Incomplete — Structure Questions Still Code-Crawl
created_at: 2026-06-14T12:52:47Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 668481721bddcdbac0589c3e3f48948e2bfb48bef2110ca8dd08282796ee960a
related: [claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, deciding-experiment-that-gates-v0-3-1, session-2-validation-gates-cut-gate15]
---

Test 3 ("where does business logic live and why") showed the assistant still performed a Glob+Read code crawl rather than leading with memory, despite D-153 changes (skill description, per-prompt hint, CLAUDE.md preamble). The fix addresses what the *instructions* say; live re-test post-merge will determine whether the *model behavior* changed.

**Why:** The user is systematically verifying whether a fix actually produces the intended behavior. Unit tests pass, but they verify well-formedness, not live behavior — especially important for LLM-sensitive recall.

**How to apply:** After merge, re-run the 2 failing prompts ("how is this structured", "where does business logic live") in the deployed version to confirm the skill fires and leads with memory.
