---
id: P-9HK3PZVK
type: project
title: Recall Skill Validation Contract
created_at: 2026-06-14T16:33:38Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 53b47f98880ec0c9cdc1ec0e333ac855ba173f5ec34b96428658dfe915d4ca7b
related: [memory-kit-validation-gates-d1-w4-dj4-live-gate, dj4-live-test-prerequisites, task-completion-workflow-code-test-doc-review-live-test-merg]
---

- **Should fire**: Intent-based recall questions about decisions, architecture, rationale — answers live in memory regardless of phrasing. Examples: *"Why is everything spread out?"*, *"What did we worry about with history mutation?"*
- **Should NOT fire**: Live-code reads (*"What's on line 40?"*), session-only context (*"What did you change?"*) — read code or use conversation instead
- **Validation approach**: Test both contract directions — two should-NOT-fire cases + one should-fire esoteric recall. Then stop; don't iterate endlessly.
- **Next step**: Run the three proposed edge-case tests; if all pass, commit v2 and log for v0.4 systematic evaluation-suite (the recall-eval follow-up)

**Why:** The skill has two failure modes (over-fire wastes cycles, under-fire misses memory). Testing both ensures usability. Systematic eval in v0.4 is more rigorous than endless hand-trials.

**How to apply:** Complete the three edge-case tests. Commit v2 after passing. Use this contract-testing approach for future recall-skill validation.
