---
id: P-GaSTYX4A
type: project
shape: Timeless
title: Wired-but-Dead Observe Legs – Recurring Bug Pattern
created_at: 2026-07-04T05:56:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3d496cf787abf9794671682dfa53bd82d6634fb4e53db871bfeabe5e8cf445c7
related: [hook-inject-capture-tests-faked-dependencies-masking-bugs, test-seam-blindness-injected-fakes-mask-real-world-defaults]
---

- **Problem**: observe-leg handlers that accept event data but drop/ignore it, causing silent no-ops on consumer operations.
- **Examples**: D-269 inject bug, afterFileEdit observe leg (both dropped edit content, handler received 0 lines).
- **Detection method**: Integration tests with realistic above-threshold data (Door-2 pattern) expose the dead code path.
- **Fix**: Ensure observe legs pass event data through to handlers; lock in with integration tests end-to-end, not unit-test isolated.

**Why:** This bug class has recurred in PR review; likely a systematic weakness in how observe legs wire into handler chains.

**How to apply:** When adding observe legs, write an integration test exercising the full data flow with realistic payloads. Don't rely on unit tests that can mock the intermediate drop-off.
