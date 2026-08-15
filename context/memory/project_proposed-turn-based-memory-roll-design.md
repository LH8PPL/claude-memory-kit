---
id: P-M9J9M9LZ
type: project
title: Proposed Turn-Based Memory Roll Design
created_at: 2026-06-18T20:23:01Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f0c8866ba1abbb96e966879650ddb90dd6d704553839cef12a2a0aadbc785678
related: [now-md-assistant-cap-precedent, a-c-core-design-pivot-memsearch-anchored-b-dropped]
---

- Cap `now.md` at N turns (e.g., 10–15, similar to MemoryOS's `deque(maxlen)`)
- When `now.md` reaches N turns, raw-append oldest turn to `today-*.md` (pure I/O, no LLM)
- Compress `today-*.md` on existing daily-distill cadence
- Char-cap before Haiku becomes backstop on `today-*.md`, not hot-path mechanism
- Kills unbounded growth structurally: small `now.md` cannot spiral to 470KB

**Why:** Kit uses single-file model, unlike memsearch/Letta/MemoryOS; using existing rolling window more frequently (per turn, not per session) fits actual architecture better than borrowing cap-the-buffer pattern.

**How to apply:** Before locking, verify (1) daily-distill won't spiral on big `today-*.md`; (2) raw-turn snapshots in SessionStart inject don't bloat budget; (3) empirically tune N. Assistant recommends reading compress-session/daily-distill code first (Option 2) before committing.
