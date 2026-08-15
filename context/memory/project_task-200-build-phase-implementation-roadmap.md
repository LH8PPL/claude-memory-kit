---
id: P-3TFR24VQ
type: project
shape: Plan
title: Task 200 Build Phase — Implementation Roadmap
created_at: 2026-07-04T10:25:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 38134ed6112fb0aa14fc6655d9e730ccff3d32cae58ab0adc0da2ceafccd35bd
related: [live-test-harness-cannot-detect-missing-cli-dependency, v0-4-5-agent-relative-llm-backend-feature, kit-compatibility-requirement-clarified]
---

Concrete build steps (in order):
  - Rename `HaikuViaAnthropicApi` → `HaikuViaClaudeCli` (fix misleading class name)
  - Add `KiroCliBackend` (zero implementation unknowns; prioritize this first)
  - Add `CursorAgentBackend` (requires live-probe step during implementation)
  - Add selection factory keyed on installed agent (detect which backend is available)
  - Fix doctor check: surface dead/missing backends instead of silent no-op (the root bug)
  - Make `live-test.mjs` agent-parametric so harness can test Claude-free path
  
  Start with Kiro (fully specced); Cursor will need live-probe when ready.

**Why:** Unblocks v0.4.5 release; silent no-op when backend unavailable is the core bug Task 200 fixes

**How to apply:** Follow this sequencing; remember Kiro has zero unknowns (do first), Cursor needs live-probe during its implementation step
