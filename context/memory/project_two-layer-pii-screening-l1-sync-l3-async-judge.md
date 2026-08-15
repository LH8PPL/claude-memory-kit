---
id: P-Q7CHYKL3
type: project
shape: State
title: 'Two-Layer PII Screening: L1 Sync + L3 Async Judge'
created_at: 2026-07-07T20:23:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 91a1df3cd9a1a037faf86ac6b4a041d6205b4d4ca7b893f11adb21616c52f524
related: [task-148-auto-judged-privacy-layered-screen-architecture]
---

**L1 — deterministic pattern layer** (sync, ~2ms):
- Extends Poison_Guard; masks in place before write/hash/dedup
- Categories: email, phone, home-path/username
- Stable placeholders: `«EMAIL»`, `«PHONE»`, `~` for paths
- Audit trail: category+offsets only (never matched text)

**L3 — Haiku async judge**:
- Transcripts: staged in gitignored `.tmp` → judge → promoted to committed `transcripts/{date}.md` + `now.md`
- Facts: auto-classifier tags `sensitivity: commit|local-only|drop` → sensitive facts to `context.local/`
- Explicit (`cmk remember`): L1-only; user `<private>` tag overrides

**Fail-closed**: Haiku down → turn stays staged, retried next turn. L1 always runs.

**Why:** Prevents PII in memory, audit, disk. Tier-routing quarantine (novel vs. memclaw) structurally stronger than query-time filtering. Recoverable on error.

**How to apply:** Implement L1 sync first (before hash in Poison_Guard); then L3 async child with retry logic. Set up `.tmp` staging and `context.local/` tier.
