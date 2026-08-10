---
id: P-MYDY3DXF
type: project
title: A+C-Core Design Pivot (Memsearch-Anchored, B Dropped)
created_at: 2026-06-18T20:21:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1cffc0790d7167930c30e8e6d2d306689a0a150eb7ff126a70e9854f174f8dbd
related: [overflow-handling-caveat-single-buffer-vs-memsearch-s-many-f, context-buffer-stabilization-19-systems-classified-by-approa, task-161-decision-d-173-bound-compaction-input]
---

Revision from A+B+C+D (four mechanisms) to A+C as core + D deferred + B dropped.

**A (input char-cap):** PROMOTED to primary. 80k byte cap right before Haiku call, from memsearch's `MAX_PROMPT_CHARS`. This is the load-bearing mechanism, not backstop.

**C (keep-recent window):** PROMOTED to primary. Keep recent portion verbatim during compress (memsearch's `max_files=12` pattern, adapted to single `now.md`).

**B (mid-session size-triggered compaction):** DROPPED. Mature systems (memsearch) stay spiral-proof without it — window + cap at compress-time is sufficient. Removes a moving part (size checks in hot append path, new mid-session trigger).

**D (shrink-retry on timeout):** DEMOTED to defense-in-depth, possibly deferrable. With A capping input, should rarely fire.

**Rationale:** memsearch is the most analogous system (Claude Code memory plugin, Haiku-compressing server); it does A+C only, cleanly. Simpler design, fewer moving parts, grounded in one verified source.

**Why:** 19-system union was overengineered; anchoring on the two most-similar systems (memsearch + Letta) reveals the core is just input-cap + recent-window, not four mechanisms.

**How to apply:** Rewrite §8.2.5 + D-173 to reflect A+C as primary load-bearing, B dropped, D optional. Resolve overflow-handling rule (see next fact) before committing.
