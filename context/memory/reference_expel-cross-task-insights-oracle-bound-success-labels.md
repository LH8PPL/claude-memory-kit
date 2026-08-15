---
id: P-EXPELQRV
type: reference
title: ExpeL cross-task insights — oracle-bound success labels
created_at: 2026-07-01T00:00:00Z
write_source: manual-repair
trust: medium
tags: [research, learn-loop, earned-judgment, oracle-free, expel, cross-task-insight]
source: 'ExpeL: LLM Agents Are Experiential Learners (arXiv 2308.10144)'
verified: primary-source (ar5iv HTML, 2026-07-01)
related: [skillrevise-earns-better-skill-via-benchmark-verifier-oracle]
---

# ExpeL cross-task insights — earns "A>B" but is ORACLE-BOUND

Re-read of ExpeL (arXiv 2308.10144) for the DEEP question: *how does memory come to KNOW method A > method B, oracle-free?* — not the settled outcome-signal survey.

## The mechanism (verbatim schema)

- **Insight = a natural-language rule** with an integer **importance count**. Operators the LLM ("operator") applies: **ADD / EDIT / UPVOTE / DOWNVOTE**.
  - "A newly added insight will have an **initial importance count of two**… increment if subsequent operators UPVOTE or EDIT are applied… decrement when DOWNVOTE is applied. **If an insight's importance count reaches zero, it will be removed.**"
  - EDIT counts as an upvote (increments). No REMOVE op — removal is only the automatic count==0 prune. No max cap stated.
- **Two extraction modes over experience pool ℬ** (holds ALL train trajectories, both succeed+fail):
  1. **Compare mode**: "compare a **failed** trajectory with a **successful** trajectory for the **same task**" → "do X not Y" contrast rule.
  2. **All-success mode**: "identify patterns within a set of **successful** trajectories from **different tasks**" (L-sized chunks).
- **Inference**: task spec augmented with `concat(ι₁,ι₂,…)` — the full insight list injected as extra instructions (+ kNN retrieval of raw past trajectories, separately).

## The honest crux — earning is ORACLE-BOUND

The success/fail LABEL that drives the whole contrast comes from the **benchmark environment's ground-truth completion signal**, NOT observation:
- "if the agent **succeeds**, it moves on… if it **fails**, it self-reflects."
- Success = "**exact matching** for HotpotQA and FEVER, **completing the task in time** for ALFWorld, **purchasing the item that matches all attributes** for WebShop." → an answer key / task-completion oracle per benchmark.

So "method A > method B" is earned by: **oracle says A-traj succeeded + B-traj failed → LLM writes a contrast rule**. The comparative judgment is real, but it **rests on a gold success label the kit does NOT have at conversation time**. NOT transferable to cmk as-is.

## What the votes actually are (and are NOT)

The UPVOTE/DOWNVOTE count is **cross-trajectory corroboration**, not an oracle: an insight survives if it keeps getting re-derived/agreed-with across many success/fail pairs, and auto-prunes at 0 if contradicted. This part IS oracle-free — it's peer-corroboration of a *rule* over the pool. **But the pairs it votes over were labeled by the oracle.** The vote robustifies against "even successful trajectories can be suboptimal and mislead" — it filters LLM extraction noise, it does NOT manufacture the success signal.

## Transferable slice for cmk (the salvageable idea)

1. **Count-gates-survival** (auto-prune at 0) — the answer to the field-wide "inert utility field" anti-pattern (letta `Step.feedback`, MemOS `usefulness_score`, our own `trust_score` computed-not-ranked). ExpeL is the counter-example where the number is load-bearing. This maps onto cmk's trust_score → make it gate survival, ADR-0017(c).
2. **The contrast-rule SHAPE** `<situation, do-X-not-Y, why>` is a good judgment schema — but cmk would have to source the success/fail label oracle-free (self-reported outcome / user-correction / cmk-forget), i.e. swap ExpeL's benchmark oracle for the passive signal portfolio. That swap is the whole open problem; ExpeL does not solve it.

**Verdict: earned-comparative-judgment = REAL but ORACLE-BOUND. The vote-corroboration + prune-at-0 mechanic is oracle-free and portable; the success/fail labeling that feeds it is not.**
