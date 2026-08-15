---
id: P-UCG4RKNL
type: project
title: Two post-v0.3.2 bugs index corruption and stale snapshot for v0.3.3
created_at: 2026-06-16T14:14:11Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 6912b802d077452443de287cc648666a26fe77288e8f9e32ac24fdb8392e872a
related: [decisions-md-is-write-only-for-ai-recall-not-in-any-recall-d, design-correction-project-flag-is-outside-chat-not-model-in, correction-kiro-capture-prompt-wiring-is-present-not-missing]
---

TWO BUGS found 2026-06-16 post-v0.3.2-publish (the kit's OWN cross-session-amnesia, on itself) — TO FIX IN v0.3.3. BUG 1 (index corruption): `cmk reindex --full` CRASHES with "UNIQUE constraint failed: observations.id" at replaceObservationsForFile (index-rebuild.mjs:328); `cmk search` returns no-results (falls back to stale index). ROOT CAUSE: DELETE_OBSERVATIONS_FOR_PATH_SQL deletes observations by source_file PATH only, but TWO different fact files in context/memory/ carry the SAME observation id, so inserting file A's id collides with file B's already-inserted id. Need to find the cross-file frontmatter-id duplicate (a dedup/id-generation collision — two captures got the same content-addressed id) and the fix is likely: dedup ids at write OR make reindex tolerant (skip/replace on id-conflict, not crash). BUG 2 (stale snapshot — THE 'we are at v0.2.0' class): the injected SessionStart snapshot's ## Decisions block still says 'v0.3.1 shipped... v0.3.2 deferred pending perf bake-off' — it does NOT know v0.3.2 shipped today. ROOT CAUSE: that text lives in context/sessions/recent.md + today-2026-06-15.md (the COMPRESSED rollups, a day old, predating v0.3.2 ship); the rolling-window compression never re-summarized after shipping, so the snapshot confidently states day-old state as current. Together they're the trap: snapshot stale AND search broken = both recall layers fail, a new session thinks we're mid-v0.3.2. v0.3.2 CODE is fine (already shipped correctly) — these are data/recall-health bugs. The user chose DEEP-DIVE root cause first. NEXT STEP when resumed: (1) finish finding the colliding frontmatter id (background task bwwdf4qa7 was running: per-file first id: line, sort, uniq -d); (2) decide reindex-tolerance-vs-dedup fix; (3) fix the compression-staleness gap (recent.md must re-roll after major events / the inject should prefer fresher granular facts over a stale rollup). Also clean THIS repo's data so the user's next session is correct (update recent.md/MEMORY decisions to 'v0.3.2 shipped, v0.3.3 next').

**Why:** Context is about to auto-compact (2% left); these two bugs ARE the cross-session-amnesia failure the kit exists to prevent, found on the kit itself right after shipping v0.3.2. Must be durable so the next session (which may itself hit the stale snapshot) can pick up the diagnosis and fix, not re-investigate.

**How to apply:** v0.3.3 scope additions: fix the reindex id-collision crash (Bug 1) + the snapshot-staleness gap (Bug 2). Both are recall-health, not v0.3.2 code regressions. Resume by finishing the colliding-id hunt, then fix reindex tolerance + compression re-roll. Clean this repo's recent.md/MEMORY ## Decisions to say v0.3.2 shipped so the user's immediate next session is correct.
