---
id: P-XK4aDSCY
type: project
title: DJ4 Verification Prompts (DECISIONS.md Recall Gate)
created_at: 2026-06-17T07:36:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1418af5227c0a6046c2dc9075b3226f98fb9dac1ce3212efc51e98c2217a665d
related: [decisions-md-cut-gate-structure-dj1-dj4, dj4-live-test-prerequisites, memory-kit-validation-gates-d1-w4-dj4-live-gate]
---

Three ready-to-paste prompts for testing DJ4 in live Claude sessions:

**Prompt A (evolution):** "We've gone back and forth on the data store — what did we actually decide, and did it ever change?"

**Prompt B (rejection history):** "Did we ever consider and reject anything for the store? What and why?"

**Prompt C (direct history):** "Show me the decision history for the store — including anything we reversed."

Each tests whether Claude invokes `mk_search --scope decisions` to surface retracted/superseded decisions from the journal.

**PASS:** Claude runs the scope directive and surfaces retracted decisions.  
**FAIL:** Claude answers only from live facts; never queries the journal.

**Prerequisite:** Create a retracted decision via terminal steps (`remember → digest → forget → digest`).

**Why:** DJ4 is a behavioral gate that cannot be auto-tested. These prompts operationalize the manual verification step, making it repeatable and executable.

**How to apply:** Before tagging v0.3.3, run prerequisite terminal steps, then paste one prompt into a Claude Code session and verify the scope directive appears in the search call.
