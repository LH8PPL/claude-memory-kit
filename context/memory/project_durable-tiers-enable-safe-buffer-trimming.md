---
id: P-6M26BR9S
type: project
title: Durable Tiers Enable Safe Buffer Trimming
created_at: 2026-06-18T20:31:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5ddc0e4618e961f7b35adbd3a3202c2fb501d20b06f73b3a12a3a904e0dc075f
related: [now-md-assistant-cap-precedent, archive-registration-in-documentation-map-md, memory-auto-injection-on-session-start]
---

`now.md` and `today-*.md` are *derived* buffers over durable tiers. The durable record is `context/transcripts/{date}.md` (written first by capture-turn), and the tiered archive (recent.md, archive.md). Trimming old turns from derived buffers doesn't lose data — the transcript is the authoritative copy.

**Why:** When bounding input to compression, the "where does overflow go?" concern dissolves. Old content can be safely trimmed from derived buffers because it's already in the durable record.

**How to apply:** Use this insight to justify aggressive trimming of `now.md`/`today-*.md` without data-loss concern. Transcript layer is the fallback.
