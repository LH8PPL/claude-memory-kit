---
id: P-6WEYN2TM
type: project
title: Compression Spiral Bug at Three Identical Call Sites
created_at: 2026-06-18T20:31:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a7ff6fe76082634382430229c75abc7b0260e15acc905a2238038ca9541b3a2f
related: [now-md-assistant-cap-precedent, mcp-prompt-root-cause-agent-config-kiro-cli-mismatch, two-pass-fix-discipline]
---

The timeout/truncation bug affects compress-session, daily-distill, and weekly-curate identically. All three call `backend.compress(input, timeoutMs: 50_000)` with no input bound. Daily-distill reads 7 days of `today-*.md` whole into input. A per-`now.md` fix doesn't solve it — the bug repeats at the daily-distill site.

**Why:** The bug is systemic at three sites, not localized to one verb. Per-verb or per-buffer fixes are incomplete; the root issue is unbound input to backend.compress.

**How to apply:** Fix at the CompressorBackend.compress boundary (or a shared helper the three verbs call before backend.compress) to fix all three from one place.
