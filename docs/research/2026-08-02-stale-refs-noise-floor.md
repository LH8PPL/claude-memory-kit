---
date: 2026-08-02
topic: Task 258's precondition — measuring the stale-refs scan's false-positive noise floor on the real corpus (result: REJECT the feature)
source: Direct measurement against this repo's own dogfood memory tier (2,160 fact files + MEMORY.md)
tags: [task-258, stale-refs, noise-floor, measurement, D-410, D-416, rejected-with-evidence]
---

# Task 258 noise-floor measurement — the scan has no signal on a real corpus

**Why this note exists:** Task 258 (a deterministic "does this fact's file reference still resolve" scan, borrowed from the awrshift name-twin — the one axis where a shape-class peer led us, D-410) carried an explicit precondition: **measure the false-positive rate on OUR corpus before wiring anything**, because our memory is dense with `§`-refs, ADR ids, version ranges and code fences that a naive scan drowns in. This is that measurement. It was run at the point Task 258's trigger fired (Task 250 shipped, its registry being the intended entry point).

**Result: the feature is REJECTED on evidence.** Not deferred — measured, and the measurement says there is nothing worth surfacing.

## Method

Two passes over the snapshot-injected surface (`context/memory/*.md` fact files + `context/MEMORY.md`), 2,160 files:

1. **Naive**: a path-shaped-token regex, fenced code blocks stripped, each token resolved against the repo root plus three plausible bases (`packages/cli/`, `docs/`, `specs/`).
2. **Refined**: adds the skip-list a real implementation would ship (the awrshift borrow's stated non-obvious value) — known file extensions only (kills version ranges), skip `.kiro/.cursor/.vscode/.claude` (scaffolded into OTHER projects, correctly absent here), skip `src|lib|app|internal|cmd|pkg` roots (third-party trees from research notes), inline-code spans stripped as well as fences.

Scripts + raw output banked in the session scratchpad (disposable; the numbers below are the durable record).

## Numbers

| Pass | Refs considered | Resolved | Unresolved | FP-or-stale rate |
| --- | --- | --- | --- | --- |
| Naive | 334 | 170 | 164 | **49.1%** |
| With skip-list | 151 | 92 | 59 | **39.1%** |

The skip-list removes half the volume and barely moves the rate — the residue is not the class a skip-list can reach.

## What the 43 surviving unique tokens actually are (hand-classified, all of them)

- **Slash-as-"or" prose (~20)** — `MEMORY.md/SOUL.md`, `README/CLI.md/MCP.md`, `HABITS/LESSONS/USER.md`, `DECISION-LOG/CHANGELOG/cut-gate/tasks.md`, `audit.log/extract.log/DECISIONS.md`, `9/16-in-MEMORY.md`. English, not paths. **Unfixable by a path scanner** — the slash is a conjunction, and our writing style is full of it.
- **Other repos' files (~12)** — `letta/constants.py`, `EhrAgent/ehragent/medagent.py`, `storage/store.rs`, `orm/block.py`, `service/scoring.rs`. Facts *about* researched projects. Correctly absent from our tree; a scan cannot know which repo a fact is describing.
- **Tier-relative shorthand (~8)** — `transcript/now.md`, `registry/now.md`, `archive/evicted-bullets.md`, `queues/review.md`. Resolve under a tier root, not the repo root. A multi-root resolver could catch some, at the cost of new false NEGATIVES elsewhere.
- **Genuinely-gone files (2)** — `scripts/validate-references.mjs`, `scripts/validate-doc-registry.mjs`. Real misses, and **correct to be gone**: Task 186 consolidated the four doc validators into `validate-docs.mjs`. A whisper here reports a deliberate refactor we made months ago and already documented.

## The verdict, against Task 250's own bar

Honest yield: **2 hits out of 151 checked, both benign, at a 39% false-positive rate.** Task 250's ratified actionability rule (D-412) exists precisely to keep non-actionable noise out of the whisper channel — a signal that cries wolf 39 times to report an intentional rename twice fails that bar by an order of magnitude. Wiring it would degrade the whisper channel we just built.

**Decision (D-416): Task 258 is CLOSED — rejected with evidence, not deferred.** The awrshift borrow was a genuinely good idea for THEIR corpus (dated prose bullets, few cross-references); ours is reference-dense in a way that inverts the economics. The decision-trail rule keeps the original idea visible: if the corpus shape ever changes materially (e.g. facts start carrying structured `source_file:` frontmatter instead of prose paths, which would let a scan check a FIELD rather than guess at prose), the idea is worth re-measuring — that is the named re-open condition, and it requires a schema change we have not planned.

**What this measurement is also evidence FOR:** the kit's facts reference the world in prose, not in structured fields. Any future feature that wants to reason about "what does this fact point at" needs the reference captured at WRITE time, not recovered by regex at read time. That is a schema question (a `refs:` frontmatter list), not a scanner question — recorded here so the next person reaching for a scanner reads this first.
