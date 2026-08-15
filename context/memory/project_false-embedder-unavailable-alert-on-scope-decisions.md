---
id: P-TC9TUMaM
type: project
shape: State
title: False "Embedder Unavailable" Alert on --scope decisions
created_at: 2026-07-08T13:54:56Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e84c2448603f34ce817307cf9ff6c920eba971e3acef029b6b3b55a0e809a451
related: [misleading-embedder-unavailable-note-fires-on-keyword-only-s, v0-3-3-bug-semantic-backend-attempted-for-keyword-only-decis, decisions-scope-semantic-fallback-warning-task-156-bug]
---

When `--scope decisions` is searched (keyword-only by design), the code mistakes this for an embedder failure and prints "the embedder is unavailable — run `cmk install --with-semantic`." In reality, semantic search works fine and the embedder loads correctly. The fix is ~5 lines (silent degradation to keyword search, no misleading note). Pre-existing since v0.3.3, cosmetic severity.

**Why:** This false alarm fires on the cold-open (showcase moment), giving new users the false impression that their setup is broken when everything actually works.

**How to apply:** Scope decision pending: fix before v0.5.0 tag (small, high-impact for showcase) vs lane to v0.5.1 (don't squeeze in before tag).
