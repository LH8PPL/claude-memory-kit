---
id: P-GHN4aLTN
type: project
title: Task 156 DECISIONS.md recall is v0.3.3 the next version firm
created_at: 2026-06-16T11:35:57Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 25b6f2262df37a11d4d21ee281beb85b9546eadb157b37202d80bea28da7f8ef
related: [decisions-md-is-write-only-for-ai-recall-not-in-any-recall-d, v0-3-2-published-to-npm-with-provenance, automatic-recall-never-reads-tombstones-recovery-is-human-on]
---

FIRMED 2026-06-16: Task 156 (DECISIONS.md AI-recall) is v0.3.3 — THE NEXT VERSION, not a vague "v0.3.3/v0.4". The user's call: "I hope it's the next one." Rationale: v0.3.2 shipped DECISIONS.md as a headline feature but it's write-only for the AI (not in any recall directive, not indexed) — shipping a headline feature the AI can't recall from is a half-connected state; don't let it sit two minors. v0.3.3 = the completion lane: Task 156 (make the journal AI-recallable: recall directive + memory-search step + cut-gate recall stage; design-first on which queries route to journal vs fact-files) as headline, plus Task 155 (cmk get --include-tombstoned opt-in recovery). NOT pulled into v0.3.2 itself because 156 is design-first (needs the recall-routing design + a new cut-gate stage written/run) — too big to safely inline into a cut that's otherwise ready. v0.3.2 ships as-is (the journal works for HUMANS, its primary stated value); v0.3.3 makes it work for the AI.

**Why:** I initially slotted the DECISIONS.md-recall gap vaguely as "v0.3.3/v0.4"; the user pushed back wanting it to be the NEXT version, not punted. Firming to v0.3.3 because leaving a just-shipped headline feature (the decision journal) un-recallable by the AI across two minor versions is the wrong call — it completes v0.3.2's feature.

**How to apply:** Plan v0.3.3 as the DECISIONS.md-completion + recall-edge lane: Task 156 (journal AI-recall, design-first) headline + Task 155 (tombstone recovery flag). Cut v0.3.2 as-is first (journal works for humans); v0.3.3 next makes the journal AI-recallable. Don't re-defer 156 past v0.3.3 without new evidence.
