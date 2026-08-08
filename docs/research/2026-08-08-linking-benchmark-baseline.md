---
date: 2026-08-08
topic: The relational-recall benchmark, its canary, the PRE-LINKING baseline, and the AFTER measurement of the automatic linker (Task 262 sub-tasks 1 + 4)
source: New harness (scripts/bench-linking.mjs) run against a committed fixture corpus; every number below produced by `npm run bench:linking -- --semantic` on this checkout
tags: [task-262, adr-0023, linking, benchmark, recall, canary, dilution, D-429, D-433]
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

---

## 7. THE AFTER — what the AUTOMATIC linker actually produces

_Added 2026-08-08 (sub-task 4), same fixture, same script, same build. `npm run bench:linking -- --after --semantic`._

**The headline, stated before the tables because it is the finding — and stated for the two
automatic variants SEPARATELY, because they do not say the same thing.** The BACKFILL, which is
the only arm with enough edges to be a fair test, **recovers none of the recall that hand-placed
edges do, and costs the temporal control 0.25.** The WRITE PATH placed 4 edges over 3 of 50 facts
and is **structurally starved on a fixture this size — effectively unmeasured**, not measured-and-
fine. D-433's condition — *"if the graph rung regresses the temporal control beyond the pinned
band, the mechanism (or its seeding) needs tuning before ship — the controls are the judge"* —
**fires on the backfill**.

> **Corrected 2026-08-08 (review finding B1).** An earlier version of this section collapsed both
> automatic variants into a single "automatic 0.333" and reported a **−0.111** regression against
> the unlinked baseline. That was wrong in two ways and both mattered: the 0.333 is the
> **backfill's** number — the write path scores **0.444, identical to unlinked** — and −0.111 is
> **one question** on a 9-question set, which this note's own canary rationale calls
> "single-question wobble" and which is the instrument's resolution floor. The durable claim is
> **"recovers 0% of the available gain"**, which is robust at this resolution; **"−0.111"** is not,
> and has been withdrawn.

### 7.1 Two automatic variants, because two things ship

| variant | how the edges got there | facts linked | edges |
| --- | --- | --- | --- |
| `unlinked` | none — the BEFORE | 0 | 0 |
| `auto-write` | write-time linking, index refreshed between writes | 3 | 4 |
| `auto-backfill` | `cmk autolink` over the finished corpus (semantic) | 14 | 19 |
| `linked` | hand-placed — the CEILING | 11 | 13 |

`auto-write` is structurally starved on a 50-fact corpus and this is **not** a harness artifact:
the write path can only link BACKWARD (a fact sees only what the index already held), and no floor
is derivable at all below `MIN_FLOOR_ITEMS` = 24 facts. So the first half of the corpus links
nothing by design, and the second half sees at most half the corpus. On the real 2,260-fact corpus
this constraint costs almost nothing; on a 50-entry fixture it costs most of the opportunity.

`auto-backfill` is the fair test of edge QUALITY: every fact sees every other, and it placed
**19 edges over 14 facts** against the hand-placed **13 over 11** — comparable density, so what
follows is about *which* edges, not *how many*.

### 7.2 R@5 — BEFORE → AFTER → ceiling

Fresh and aged agree, so both are shown; per §4(f) they are never compared across.

| pipeline | age | unlinked (BEFORE) | auto-write | auto-backfill | linked (CEILING) |
| --- | --- | --- | --- | --- | --- |
| **graph** multi-hop | fresh | 0.333 | **0.222** | **0.222** | 0.778 |
| **graph-hybrid** multi-hop | fresh | 0.444 | 0.444 | **0.333** | 0.889 |
| **graph** multi-hop | aged | 0.333 | **0.222** | **0.222** | 0.778 |
| **graph-hybrid** multi-hop | aged | 0.444 | 0.444 | **0.333** | 0.778 |
| **graph** overall | fresh | 0.667 | 0.619 | 0.571 | 0.810 |
| **graph-hybrid** overall | fresh | 0.667 | 0.667 | 0.619 | 0.857 |

**The controls** (fresh, `graph`): `single-hop` 0.800 and `preference` 1.000 are unmoved by every
variant — no regression there. `temporal` goes 1.000 (unlinked) → 1.000 (auto-write) → **0.750**
(auto-backfill): the dilution cost §4(e) predicted, now reproduced by automatic edges at −0.25,
the same magnitude the hand-placed corpus paid.

**Read per variant, on the kit's real default recall (`graph-hybrid`, fresh multi-hop):**

| variant | vs unlinked BEFORE (0.444) | vs hand-placed CEILING (0.889) | verdict |
| --- | --- | --- | --- |
| `auto-write` | 0.444 — **no change** | recovers **0%** | **unmeasured** — 4 edges over 3 of 50 facts |
| `auto-backfill` | 0.333 — one question down | recovers **0%** | measured, and it does not work |

**What is solid and what is not.** "Recovers 0% of the available gain" is solid for both: the
ceiling is 0.889 and neither arm moves off the baseline toward it. The **one-question deltas
(±0.111) are NOT solid** — one multi-hop question is worth exactly 0.111, which §2 calls
single-question wobble when arguing for the canary floor, and the same standard has to apply when
the result is unflattering. The **temporal control's −0.25 under the backfill IS solid** (one
temporal question is 0.25, but it is a control moving in the direction the dilution mechanism
predicts, corroborated fresh and aged).

**The write path is starved, and that is a property of the fixture, not a finding about the
mechanism.** It can only link BACKWARD (a fact sees only what the index already held) and no floor
is derivable below `MIN_FLOOR_ITEMS` = 24 facts — so on a 50-entry corpus the first half links
nothing by construction and the second half sees at most half the corpus. 4 edges is too few to
move a 9-question metric either way. **This benchmark cannot currently evaluate write-time
linking**; saying so is the honest result, and a fixture large enough to test it is the follow-up.

### 7.3 Why the BACKFILL's edges do not help — and it is not a tuning knob

The fixture's `multi-hop` questions are built so the answer body **shares no distinctive term with
its query** (§1.2). By construction the ground-truth edge connects two facts that are *topically*
related while being *lexically and distributionally* far apart. A similarity-ranked linker — token
overlap OR embedding cosine — selects on exactly the axis those edges are defined to be weak on. It
is not mis-tuned; it is measuring the wrong quantity. Lowering the floor would add more of the same
kind of edge, and §7.2 already shows more edges of that kind making recall worse, not better.

That is a stronger claim than "the numbers came out low," so its limits: this holds **on this
fixture**, whose 9 multi-hop questions were deliberately constructed to be link-only-reachable. A
corpus whose real relationships DO track surface similarity would score differently — and §7.5's
real-corpus sample shows the linker producing edges a human would call correct. What the fixture
establishes is that "related enough to link" and "related enough to answer a multi-hop question"
are different relations, and the deterministic linker only has access to the first.

### 7.4 What this says about ADR-0023

ADR-0023 deferred LLM edge derivation (Memora-style `cues:` first in line) behind the trigger
sub-task 1 fired. Sub-task 4 now adds the other half of the answer, and it survives the B1
correction **because it never rested on the write path**: the BACKFILL is the fair test — every
fact sees every other, it placed 19 edges over 14 facts against the hand-placed 13 over 11, i.e.
comparable density — and at that density it recovers **0%** of the 0.444 → 0.889 headroom. So
**the deterministic, zero-LLM linker was the cheap thing to try first, it is built, it was given a
fair test, and it does not close the gap.** The headroom is real and still unclaimed, and the
measurement points at exactly the candidate the ADR ranked first, for exactly the reason it gave.

What the write path's starved arm changes is only the SCOPE of the claim: this says the
similarity-ranked *edge source* does not close the gap. It does not say anything either way about
whether placing those same edges at capture time would behave differently — that question is
untested here.

### 7.5 What DID work, and is not visible in the table above

Against the **real** dogfood corpus (2,260 facts, token-Jaccard, derived floor **0.1564**), a live
`cmk remember` about backup discipline auto-linked to `never-overwrite-backups` (0.1591) and
`user-follows-new-folder-rule-each-test-g-…` (0.1786) — both edges a human would place. The
dry-run over the whole corpus proposes edges of the same character. So the mechanism produces
*defensible* links on real data; what it does not do is produce the *specific* links that answer
this benchmark's multi-hop questions. Both statements are true and neither cancels the other.

### 7.6 Two real defects the AFTER measurement found

Neither was visible to any unit test; both were found only by running the mechanism end-to-end and
looking at the numbers.

1. **A single prepared semantic scorer is wrong for a backfill.**
   `prepareSemanticSimilarity` embeds ONE incoming text and returns a closure over that vector —
   its `similarityFn(a, b)` ignores `a`. Correct for a capture, catastrophic for a backfill, where
   one prepared scorer would compare every fact in the corpus against whatever probe string
   prepared it, yielding real, plausibly-distributed, meaningless numbers. Fixed by
   `makeCachedCosineBackend` (symmetric, both sides from the cache, zero model calls); pinned by a
   regression test that asserts the score depends on both arguments.
2. **The backfill scored the FILE body while the embedding cache is keyed on the INDEXED body.**
   The indexer trims; the file carries writeFact's surrounding newlines. Every semantic lookup
   missed, every pair silently fell back to token-Jaccard, and those lexical scores were then
   judged against a **semantic** floor of 0.68 — so `--semantic` produced exactly **zero** links
   while reporting a healthy floor and a healthy-looking run. This is the separately-correct-
   jointly-broken class: the cache key was right, the scorer was right, the body was right, and the
   composition was silent.

### 7.7 Reproducing

```bash
npm run bench:linking -- --after              # BEFORE + both auto variants + the ceiling
npm run bench:linking -- --after --semantic   # the same, with the embedder driving BOTH the
                                              # hybrid rungs and the backfill's linker
```
