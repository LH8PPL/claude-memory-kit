---
id: P-JYH2P5QC
type: project
title: DECISIONS.md is write-only for AI recall — not in any recall directive or test
created_at: 2026-06-16T11:31:41Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 3431def435c649fda9521730eb98d86f6b39b5ef8a5f855ba6bf5d351cd23784
related: [automatic-recall-never-reads-tombstones-recovery-is-human-on, task-156-decisions-md-recall-is-v0-3-3-the-next-version-firm, cmk-permission-prompt-only-on-cd-compound-d-80-edge]
---

GAP found 2026-06-16: DECISIONS.md (the Task 147 decision journal) is NOT in any AI recall path and has NO cut-gate query test. Evidence: (1) the injected CLAUDE.md 'Recalling memory' directive + the memory-search skill point the AI to only 3 surfaces — `cmk search`/`mk_search` (FTS5/semantic index over context/memory/*.md), the granular fact files, and the ~/.claude-memory-kit persona. DECISIONS.md is referenced in ZERO recall directives. (2) DECISIONS.md is a derived view NOT indexed by cmk reindex (skipped like INDEX.md), so mk_search never returns a journal hit. (3) The cut-gate has DJ1/DJ2/DJ3 (journal is WRITTEN correctly) but NO stage testing the AI RECALLING from it. Net: the journal is currently write-only for AI recall — good for a HUMAN (chronological trail in the file + PR diff) but the AI's auto-recall doesn't consult it. The single-decision case ('what did we decide on Kamal') still works via fact-file search (the fact carries the Why); the journal's UNIQUE value — chronological evolution + retracted/superseded trail + 'what did we reject' — is invisible to recall. DESIGN QUESTION (not a v0.3.2 blocker): should AI recall consult DECISIONS.md, and for which queries? Likely: keep fact-file search for 'what did we decide about X'; add a directive + recall step (e.g. read DECISIONS.md, or `cmk digest --decisions`) for 'how did decisions evolve / what did we reject / decision history' queries. If adopted, add a cut-gate stage that tests recalling decision-history from DECISIONS.md.

**Why:** Task 147 built DECISIONS.md as a human-readable decision journal, but the AI's recall directives were never updated to consult it, and it's not indexed for search — so the journal's unique value (decision evolution, retracted/rejected decisions) is unreachable by automatic recall. This is the same class as the tombstone gap: a surface exists but recall doesn't reach it. Surfaced by the user asking 'when I mention Kamal, where do you look, and when would you go to DECISIONS.md?' — answer: never, today.

**How to apply:** Decide whether AI recall should consult DECISIONS.md and for which query class. Recommended: single-decision recall stays on fact-file search (works, carries Why); add a recall directive + memory-search-skill step for decision-HISTORY/evolution/'what did we reject' queries pointing at DECISIONS.md (read it directly, or a digest --decisions view). If adopted, add a cut-gate stage testing decision-history recall. Not a v0.3.2 blocker — slot as a v0.3.3/v0.4 recall-design task alongside the tombstone --include-tombstoned work.
