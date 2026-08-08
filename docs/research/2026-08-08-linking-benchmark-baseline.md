---
date: 2026-08-08
topic: The relational-recall benchmark, its canary, and the PRE-LINKING baseline (Task 262 sub-task 1 — the measurement ADR-0023's deferral trigger requires)
source: New harness (scripts/bench-linking.mjs) run against a committed fixture corpus; every number below produced by `npm run bench:linking -- --semantic` on this checkout
tags: [task-262, adr-0023, linking, benchmark, recall, canary, D-429]
---

# Linking benchmark — the instrument, the canary, and the BEFORE numbers

**What this note is.** ADR-0023 DEFERRED LLM edge derivation behind a *named trigger*: extend
the Task-99 benchmark with a relational question type, and let the numbers — not an argument —
decide. Task 262 resolves that DEFER by firing the trigger. This is the instrument plus the
BEFORE half of the before/after. Write-time linking ships behind a flag next, so the AFTER half
runs on the same build, the same fixture, and the same script.

**The one-line result.** The trigger's condition is **met**: the kit's shipped default recall
answers **1.000** of the flat-answerable questions and **0.444** of the relational ones. Adding
correct `related:` edges takes the relational half to **0.889** with no loss on the flat half.

---

## 1. The instrument

[`scripts/bench-linking.mjs`](../../scripts/bench-linking.mjs) · `npm run bench:linking` ·
fixtures in [`fixtures/link-bench/`](../../fixtures/link-bench/) · tests in
[`tests/bench-linking.test.js`](../../tests/bench-linking.test.js).

It extends Task 99's harness rather than replacing it — metrics (`recallAtK` / `ndcgAtK` /
`aggregate`), the RRF fusion, the agentic rung and now the corpus seeder are imported from
[`bench-recall.mjs`](../../scripts/bench-recall.mjs), which grew two optional entry fields
(`related`, `supersededBy`) that are no-ops for the Task-99 fixture.

### 1.1 The question taxonomy

LoCoMo + LongMemEval's shared categories, the ones both papers in the
[2026-08-07 research break](2026-08-07-research-break-two-papers-two-repos.md) benchmark on.
Two of the four are **controls**, which is the part that makes the measurement trustworthy:

| qtype | n | Role | Reachable via |
| --- | --- | --- | --- |
| `single-hop` | 5 | CONTROL — must not regress | flat search |
| `preference` | 3 | CONTROL — the same, on the user tier | flat search |
| `temporal` | 4 | CONTROL — link-INDEPENDENT | `superseded_by` (survives the unlinked twin) |
| `multi-hop` | 9 | **the measured type** | `related:` only |

The `temporal` control is the load-bearing one. It is answerable by graph traversal but **not**
by `related:` edges, so if a margin shows up there too, the benchmark is measuring
traversal-in-general rather than linking. That is the false positive a naive linked-vs-unlinked
A/B cannot see.

### 1.2 The corpus

54 committed entries (50 fact files + 4 scratchpad bullets), hand-authored, deterministic, seeded
through the kit's REAL write paths (`writeFact` / `appendScratchpadBullet`) into a sandbox and
indexed by the REAL `reindexFull`. 11 facts carry `related:` (13 edges, out-degree ≤ 3 per the
[link-cap research](2026-08-04-link-cap-practice.md) verdict); 5 carry `superseded_by` (3 chains,
one of length 3).

**The load-bearing fixture property**, stated plainly because every conclusion below rests on it:
a `multi-hop` answer body shares **no distinctive term with its query**. It is reachable only by
following a `related:` edge out of the fact the query does match. Six of the nine are that strict
(`reach: link-only`); three are deliberately softer (`reach: partial`, the answer shares some
query vocabulary) so the margin is a graded measurement and not a 0 → 1 step.

### 1.3 Fresh AND aged

Every measurement runs twice. The aged run drives the **real `cmk` bins as subprocesses**
(`install` → 8 drift `remember`s → an expiring one → 2 `forget`s → a frontmatter supersession →
a file `rm` → `reindex --boot` → `reindex --full`) before it measures — the Task-261 / D-421
discipline, because a fresh corpus numbers every derived table in insert order and therefore
agrees with its source by luck.

Every mutation targets a drift fact the harness wrote itself, never a labelled one, and the report
carries `mutatedLabelledKeys` + `unresolvedKeys` as the receipt. A benchmark whose ground truth the
aging ate would report a recall collapse that is really a fixture bug — a confidently wrong number,
which is worse than no number.

---

## 2. THE CANARY — proof the instrument can detect a known win

KiroCrew's `auto_improvement` discipline (D-429): *build a metric, then prove it can detect a known
win before optimizing anything; if the canary fails, the harness cannot measure and the run halts
rather than optimizing noise.* Applied here: the hand-linked corpus must beat its byte-identical
unlinked twin on `multi-hop` R@5 by more than a declared floor.

```
pipeline=graph@d2 fresh · metric=r@5 on multi-hop
  hand-linked  : 0.778
  unlinked twin: 0.333
  MARGIN       : 0.444   (floor 0.300)  -> PASS

controls        linked  unlinked  delta
  single-hop     0.800    0.800    0.000
  temporal       0.750    1.000   -0.250   <-- LOST (dilution)
  preference     1.000    1.000    0.000
  DILUTION COST: -0.250
```

**The floor is 0.30 and is not round-by-accident.** The multi-hop set has 9 questions, so one
question is worth 0.111; a 0.30 floor demands the linked run recover at least **three more
answers** than the unlinked one — past any single-question wobble, and well under the ~0.7 the
constructed set could produce, so it detects rather than restates. `npm run bench:linking` **exits
non-zero and refuses to print a baseline** if the canary fails.

**No control gained.** The margin is attributable to `related:` links, not to traversal.

---

## 3. THE BASELINE — pre-linking

`npm run bench:linking -- --semantic`. Five rungs. `unlinked` is the honest stand-in for today's
real corpus (4.0% of facts linked); `linked` is the **ceiling** — what recall looks like if the
right edges exist.

### 3.1 R@5 by question type

| variant | pipeline | age | overall | single-hop | **multi-hop** | temporal | preference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| unlinked | keyword | fresh | 0.000 | 0.000 | **0.000** | 0.000 | 0.000 |
| unlinked | agentic | fresh | 0.476 | 0.800 | **0.333** | 0.000 | 1.000 |
| unlinked | graph | fresh | 0.667 | 0.800 | **0.333** | 1.000 | 1.000 |
| unlinked | hybrid | fresh | 0.667 | 1.000 | **0.444** | 0.500 | 1.000 |
| unlinked | graph-hybrid | fresh | 0.667 | 1.000 | **0.444** | 0.500 | 1.000 |
| linked | keyword | fresh | 0.000 | 0.000 | **0.000** | 0.000 | 0.000 |
| linked | agentic | fresh | 0.476 | 0.800 | **0.333** | 0.000 | 1.000 |
| linked | graph | fresh | 0.810 | 0.800 | **0.778** | 0.750 | 1.000 |
| linked | hybrid | fresh | 0.667 | 1.000 | **0.444** | 0.500 | 1.000 |
| linked | graph-hybrid | fresh | 0.857 | 1.000 | **0.889** | 0.500 | 1.000 |
| unlinked | keyword | aged | 0.000 | 0.000 | **0.000** | 0.000 | 0.000 |
| unlinked | agentic | aged | 0.476 | 0.800 | **0.333** | 0.000 | 1.000 |
| unlinked | graph | aged | 0.667 | 0.800 | **0.333** | 1.000 | 1.000 |
| unlinked | hybrid | aged | 0.714 | 1.000 | **0.556** | 0.500 | 1.000 |
| unlinked | graph-hybrid | aged | 0.667 | 1.000 | **0.444** | 0.500 | 1.000 |
| linked | keyword | aged | 0.000 | 0.000 | **0.000** | 0.000 | 0.000 |
| linked | agentic | aged | 0.476 | 0.800 | **0.333** | 0.000 | 1.000 |
| linked | graph | aged | 0.810 | 0.800 | **0.778** | 0.750 | 1.000 |
| linked | hybrid | aged | 0.714 | 1.000 | **0.556** | 0.500 | 1.000 |
| linked | graph-hybrid | aged | 0.810 | 1.000 | **0.778** | 0.500 | 1.000 |

### 3.2 Overall R@10 / NDCG@10 (fresh)

| variant | pipeline | R@5 | R@10 | NDCG@10 |
| --- | --- | --- | --- | --- |
| unlinked | keyword | 0.000 | 0.000 | 0.000 |
| unlinked | agentic | 0.476 | 0.476 | 0.399 |
| unlinked | graph | 0.667 | 0.667 | 0.507 |
| unlinked | hybrid | 0.667 | 0.810 | 0.576 |
| unlinked | graph-hybrid | 0.667 | 0.762 | 0.555 |
| linked | graph | 0.810 | 0.905 | 0.611 |
| linked | hybrid | 0.667 | 0.810 | 0.576 |
| linked | graph-hybrid | 0.857 | 0.905 | 0.705 |

---

## 4. What the numbers say

**(a) ADR-0023's deferral trigger is MET.** Its condition was "if flat hybrid + the agentic ladder
scores materially below the exact/paraphrase qtypes on [the relational type]". Flat hybrid scores
**1.000 on single-hop and preference, 0.444 on multi-hop** — a 0.556 gap on the kit's own default
recall mode. The agentic ladder is worse (0.333), not better. Flat recall does not answer
relational questions on this corpus, and no amount of query reformulation reaches a fact whose text
shares nothing with the question.

**(b) The edges are worth what the papers claim, IF they exist.** `graph-hybrid` on the linked
corpus: multi-hop **0.444 → 0.889**, overall **0.667 → 0.857**, NDCG@10 **0.576 → 0.705** — with
single-hop and preference both unchanged at 1.000. This is MRAgent's theorem in miniature: the
active layer is strictly stronger, but only where there is an edge to walk.

**(c) Traversal over an unlinked corpus buys nothing** (`unlinked/hybrid` 0.444 = 
`unlinked/graph-hybrid` 0.444; at R@10 it is slightly *worse*, 0.810 → 0.762). The traversal
machinery shipped in Task 232 is already there; what is missing is edges. That is Task 262's
whole premise, now measured rather than asserted.

**(d) One-shot keyword search answers ZERO of 21 natural-language questions.** Not a benchmark
artifact — `prepareFtsQuery` preserves implicit-AND between terms, and this was verified live
against the real bin:

```text
cmk search "what replaced RabbitMQ"     ->  cmk search: no results
cmk search "RabbitMQ"                   ->  1 result(s) (mode=keyword)
```

A user typing a question at `cmk search` in the default keyword mode gets nothing back.

Corroborated on a fixture this task did not author: `npm run bench:recall` (Task 99's own corpus,
keyword pipeline) scores **exact 1.000 / paraphrase 0.000**, missing 14 of its 17 questions
entirely. The published 0.941 headline for that benchmark is the *hybrid* pipeline; the keyword
floor underneath it has always been this low. That is out of scope for Task 262 and is **filed
here as a finding, not fixed** — it is the strongest argument in this note for something other
than linking.

**(e) THE COST — a traversal budget spent on a weak seed is a budget not spent on the answer.**
The temporal control LOST 0.25 in the linked twin under `graph` (keyword-seeded). Traced to a
specific mechanism: for *"what came after Solr"*, the agentic ladder's junk sub-query `after`
makes `auth-idle-timeout` the rank-0 seed; its `related:` neighbours are expanded first and push
the correct supersession answer out of the top 5. Adding **correct** links made a question the
unlinked corpus answered unanswerable.

**This gets worse as link coverage rises, which is exactly what Task 262 is about to do to a
2,300-fact corpus** — where every seed will have neighbours, not 11 of 54.

**The mitigation is visible in the same table:** the cost is **zero** on `graph-hybrid`
(temporal 0.500 linked = 0.500 unlinked). It is a function of **seed quality**, not of traversal.
Better seeds → no dilution. Two design inputs for sub-task 2 follow: (i) seed relational expansion
from hybrid, never from the keyword ladder alone; (ii) the "post-retrieval filtering" technique
already flagged as missing in D-226 — re-score expanded candidates against the live query — is the
principled fix, and this benchmark can now measure whether it earns its cost.

**(f) The deterministic rungs are aging-invariant; the semantic rungs are not.** `keyword`,
`agentic` and `graph` score **identically** fresh and aged. The hybrid rungs move by one question
(multi-hop 0.444 → 0.556). This is not instability and not a D-421 recurrence: the aged corpus
literally contains 9 more facts, which changes the vector neighbourhood, while the keyword rungs
never match those facts at all. The protocol consequence is real though — **the AFTER measurement
must compare fresh-to-fresh and aged-to-aged**, never across.

---

## 5. Limits — what this does NOT show

- **The linked column is a CEILING, not a prediction.** The multi-hop questions are constructed so
  their answers are link-only-reachable, and the links were placed by hand at exactly the right
  places. That is what makes the canary a real detector; it also means "0.889" is *"if the right
  edge exists"*. Whether write-time linking produces the right edges is a different question and
  it is the one sub-task 2's re-measurement answers. If the AFTER run lands well below 0.889, that
  is the auto-linker missing edges, not the benchmark being wrong.
- **54 entries, 21 questions.** One multi-hop question is worth 0.111, one temporal question 0.25.
  Differences smaller than that are not differences. The corpus is two orders of magnitude below
  the real one, and precision effects (wrong links, hub facts) scale with corpus size in ways this
  cannot see.
- **A fictional corpus.** Fact text is modelled on the shape of this repo's own facts but the
  subject matter is invented, so nothing here measures how the linker behaves on the real
  vocabulary — dense `D-nnn` / `Task nnn` anchor citations especially, which the `cites` edge type
  already mines and which this fixture deliberately does not contain.
- **No precision metric.** Everything above is recall. A linker that links everything to everything
  would score well here. The cap-3 policy is the defence, and it is not what this measures.
- **These are conversational-assistant benchmark categories** applied to coding-agent project
  memory. The taxonomy transfer is plausible, unproven — the same caveat the 2026-08-07 note states.

## 6. Reproducing

```bash
npm run bench:linking                    # canary, then the deterministic matrix (fresh + aged)
npm run bench:linking -- --semantic      # adds the hybrid rungs (needs the local ONNX embedder)
npm run bench:linking -- --canary-only   # the sensitivity proof alone
npm run bench:linking -- --aged=false    # skip the aged half (faster; NOT the gate)
```

Reports land in `.bench-logs/<stamp>_*.json` (gitignored); the `_summary.json` carries the canary
verdict plus every matrix row. Deterministic rungs reproduce exactly; hybrid rungs depend on the
embedder build.
