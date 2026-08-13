---
id: P-49BQNG9V
type: project
title: Automatic recall never reads tombstones; recovery is human-only opt-in
created_at: 2026-06-16T11:25:38Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 2c772c5d89067c14dd5b5a0f09b7cb1890d9995c7fe6b169d87d63952c5b0799
related: [decisions-md-is-write-only-for-ai-recall-not-in-any-recall-d, decisions-md-is-append-only-permanent-journal-not-regenerate, read-path-inconsistency-get-lacks-deleted-at-filter]
---

DECISION (2026-06-16): Automatic recall must NOT read TOMBSTONED (cmk forget) facts — forget = invisible to the agent. This is distinct from RETRACTED/SUPERSEDED decisions, which recall SHOULD see (D-161: the decision journal keeps them, the trail is the value). The two 'forget' mechanisms: (1) retract/supersede = decision reversed/replaced, entry KEPT + annotated, stays recallable; (2) tombstone (cmk forget → archive/tombstones/, DB row pruned) = fact DELETED, stays INVISIBLE to all automatic surfaces (session snapshot, mk_search, mk_get, INDEX). Why tombstones stay invisible to auto-recall: an agent confidently recalling a fact the user explicitly deleted is the worst failure mode of a memory system (e.g. forgot 'we use Postgres' after migrating to SQLite → agent re-asserts Postgres). The legit 'did we try and reject X?' negative-knowledge case belongs in retract-in-place in the journal (the right home), NOT the tombstone graveyard; if a user forgot something they wanted as negative knowledge, that's the wrong-verb signal, and the human recovery path covers the oops. Human recovery is EXPLICIT + opt-in only — `cmk get --include-tombstoned` (mirrors the existing `search --include-tombstoned`) and/or `cmk restore <id>`; never an automatic agent behavior. The line: recovery is a HUMAN verb, never automatic. Matches today's behavior (forget prunes the DB row) — no recall-path code change needed; only the opt-in flag is new (slot to v0.3.3/v0.4, not a v0.3.2 blocker).

**Why:** Memory flagged this as an unsettled gap (the journal-vs-digest visibility split was decided in D-161, but whether the snapshot injector / mk_search hard-exclude tombstoned facts was never decided). Settling it: tombstones invisible to auto-recall because confidently-wrong recall (resurfacing a deleted fact) is catastrophic for a memory product; the negative-knowledge case has a better home (retract-in-place). Distinguishes forget (delete) from supersede (evolve) cleanly.

**How to apply:** Keep all automatic recall surfaces (inject-context snapshot, mk_search/cmk search, mk_get/cmk get, INDEX) live-only — never read archive/tombstones/. For changed decisions use supersede (kept + superseded_by) or the DECISIONS.md retract-in-place, NOT forget. Add human-only opt-in recovery: `cmk get --include-tombstoned` mirroring `search --include-tombstoned`, optionally `cmk restore <id>`. Slot the recovery flag to v0.3.3/v0.4. For v0.3.2: fix the cut-gate F-7 text + CLI.md `cmk get` description which wrongly claim get reads tombstones — get is live-only by design.
