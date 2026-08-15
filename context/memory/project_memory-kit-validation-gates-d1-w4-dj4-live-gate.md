---
id: P-7KRR6B6E
type: project
title: Memory Kit Validation Gates (D1–W4 + DJ4 Live Gate)
created_at: 2026-06-17T21:19:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f6364c84175be19fa8c3e6bb889e28e4316c3647421540727d2a36c20fb4f3c3
related: [session-2-validation-gates-cut-gate15, three-session-release-validation-methodology, dj4-live-test-prerequisites]
---

The user validates memory-kit recall through an ordered ladder of behavioral gates:
- **D1 (Warm-up Recall)**: Ask for standing cross-project rules + project structure; PASS = both recalled from memory without re-derivation; 5+ rules + architecture named correctly.
- **W1 (Explicit Decision Recall, in-chat)**: Ask "what did we decide about X?"; PASS = `memory-search` skill fires on its own (not manual code crawl); summary includes citation ids (e.g., `P-XXXXXXXX`); mid-session repeat (~20 turns later) skill persists.
- **W2 (Paraphrase Recall, Terminal)**: Run `cmk search` with zero keyword overlap to original facts; PASS = right facts found; result line includes `mode=hybrid`.
- **W3/W4 (Further validation)**: Transcripts + raw-record reach (detailed pass criteria TBD).
- **DJ4 (Decision-History "Live Gate")**: Ask "what did we reject?" or "what changed?"; PASS = Claude reaches for `--scope decisions` (or `mk_search {scope:"decisions"}`) and surfaces decision *evolution* (what was superseded, why it changed) — not just current state.

**Why:** Each gate tests a distinct recall layer (rule search, decision recall, paraphrase matching, decision history); passing all gates confirms end-to-end function. DJ4 specifically validates that decision-history (DECISIONS.md) recall fires in *live* sessions, not just at design time — a headline v0.3.3 feature.

**How to apply:** Use this ladder for future memory-kit validation work; each gate has observable pass criteria (skill fires on own, citations present, finds right facts, reaches for scope). A failing gate pinpoints which recall layer needs repair.
