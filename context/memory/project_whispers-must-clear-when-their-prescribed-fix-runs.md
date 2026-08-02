---
id: P-GRC5M9WA
type: project
shape: Timeless
title: Whispers Must Clear When Their Prescribed Fix Runs
created_at: 2026-08-01T18:25:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1b80ee7ba1e27ceadae2c4bb5ee5d3c1292e36bcdf72858a6b8fc7e8648b0517
---

When a whisper prescribes a command to fix a problem (e.g., "run `cmk reindex`"), executing that command must clear the whisper. Failing to do so means users see repeated warnings even after applying the recommended fix, destroying trust in the diagnostic system. Root cause of B1: the clearing logic was not part of the command's success path. Fix: move the `ok` write into the command's core success path, not into a parent caller. E2E test: whisper present → run fix → whisper gone.

**Why:** Diagnostic-to-fix pipelines lose credibility if the fix doesn't clear the warning. Repeated alerts erode user trust.

**How to apply:** When shipping a whisper + fix pair, ensure the fix command's own success path includes the corresponding clear/ok operation. Test end-to-end before shipping.
