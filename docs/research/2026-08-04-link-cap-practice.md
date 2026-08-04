---
date: 2026-08-04
topic: How many automatic links per item do comparable systems create? (Task 262's cap question — and the semantic-index bug the survey uncovered)
source: Code-level survey of 20+ systems (primary sources; local clones re-verified against upstream for Memora/MemOS) + direct measurement of this repo's own index
tags: [task-262, task-261, linking, related, cap, D-421, prior-art]
---

# Link-cap practice — how many `related:` links per fact

**Why this note exists:** Task 262 adds automatic write-time linking. The cap (how many links one fact gets) was going to be picked by feel — I proposed 3 with no evidence. This is the check. **The headline is that the cap turned out to be the least important thing the survey found** — see §4.

## 1. Observed values

### Write-time — links actually persisted per item

| System | N | Where | Overflow / tie rule |
|---|---|---|---|
| **Memora** (MSR) | **1–3** cue anchors | `src/memora/core/cue_index_generator.py:113` (prompt-level) | Prompt rule #4 "Distinct Facets" — cues must not overlap in meaning |
| **mem0** | **no numeric cap**; candidate pool `top_k=10` | `mem0/memory/main.py:899`; `configs/prompts.py:694-701` | A precision rule instead of a count: *"Do NOT link memories that merely share a vague theme."* All 9 few-shot examples show exactly **1** link |
| **captain-claw** | **6** per turn | `flight_deck/being_mind.py:80`, applied at `:138` | Truncate; dangling endpoints refused |
| **Amplenote** `/related` | **10** | [help page](https://www.amplenote.com/help/ample_agent_pro_quick_start_usage) | Not published |
| **smart-linker** (lemannrus) | **5** + threshold **0.75** | `src/settings.ts` DEFAULT_SETTINGS | Threshold first, then top-N |
| **smart-linker** (erunay) | **10** + threshold 0.12 | `main.js:94` | Same |
| **graphiti / cognee / sift-kg** | **none** | — | Unbounded LLM extraction; controlled by dedup + temporal invalidation |
| **zenbrain** | **none** | `packages/algorithms/src/sleep-consolidation.ts:28` | Weight-threshold pruning (`WEAK_CONNECTION_THRESHOLD: 0.2`) — prune, don't cap |
| **MemOS / MemoryOS / Letta** | n/a | — | No live per-node relational edges (MemOS's `RELATED` is an inert enum at `graph_dbs/item.py:22`, re-verified upstream) |

### Read-time — display / traversal breadth (consistently larger, and a different number)

Obsidian Smart Connections **20** (`src/collections/connections_lists.js:40`, no threshold) · sift-kg viewer **25** (`viewer/app.js:1215`) · basic-memory `max_related` **10** (`mcp/tools/build_context.py:176`) · cognee `max_edges_per_entity` **10** (`retrieval/hybrid_retriever.py:40`) · graphiti **10** (`search/search_config.py:29`) · Memora frontier top-**4** @ θ0.85 (`memory_expander.py:39-40`) · **Wikipedia production 3** (extension default 5 — configured *down*, [InitialiseSettings.php](https://noc.wikimedia.org/conf/highlight.php?file=InitialiseSettings.php)) · Jetpack 3 · YARPP 4 · Zendesk 5 · Algolia DocSearch 5 · sklearn 5 · LangChain 4 · LlamaIndex 2 · ES/Qdrant/Weaviate/Chroma 10.

### Diminishing returns — the direct answer to "does more stop helping?"

- **Beierle/Beel, IJDL 21:231–246 (2020)** — 3.4M live impressions, set sizes 1–15: CTR falls 0.41% → 0.09%; clicks-per-set and time-to-first-click **inflect at 5–6**. Their survey: **74% of digital libraries show 3–5; none above 10, none below 3.**
- **Bollen et al., RecSys '10** — 20 high-quality items give **no satisfaction gain over 5**.
- Don't lean on Miller's 7±2 (Cowan 2001 puts real capacity at 3–5, and neither applies to a persistent re-scannable list).

### Graph density — argues *up*, and it's a trap

ER connectivity wants ⟨k⟩ ≈ ln(2321) = 7.7; Watts–Strogatz wants more. But those are *random* graphs; similarity graphs are clustered (46–60% mutual, measured). Meanwhile Edge et al. (Microsoft GraphRAG) cut a hairball from 50 edges/node to **5.0** for usability, and Serrano et al. (PNAS 2009) showed a disparity filter keeping **17% of edges retained 80% of the weight** (⟨k⟩ 22 → 5.7). Real PKM vaults measure 0.45–8 links/note; Luhmann's own Zettelkasten: **0.83 and 0.45**.

## 2. Our own numbers (measured, not estimated)

- **2,321 facts; 174 `related:` edges** (161 resolved, 13 dangling). Out-degree 1→16 files, 2→63, 3→8, 4→2 — **mean 1.96, median 2, max 4**. In-degree max 5.
- **There is no cap in the write path today** (`remember-core.mjs:72-76` passes `links` through unfiltered) — so that distribution is *revealed preference*: given free rein, the writer chose 2 and never exceeded 4.
- **Neighbour-similarity curve** (all embeddings, full pairwise): median k-th neighbour 0.868 (k=1) → 0.821 (k=2) → 0.808 (k=3) → 0.799 → … → 0.774 (k=12). Random-pair baseline mean 0.639, **p99 0.773**. The only sharp drop is k=1→2; **by k≈12 the median neighbour is statistically indistinguishable from a random pair.**
- **A threshold alone does not work**: at θ0.80 the median fact has 3 neighbours but the p90 fact has 52, and 19% have none. A count cap must be the primary control.
- Projected at **cap 3 / floor 0.78**: 4,002 undirected edges, ⟨k⟩ 3.45, max degree 29, 11.5% isolated. At cap 5: 6,081 edges, ⟨k⟩ 5.24.

## 3. Recommendation

**Cap 3 out-links per fact; in-degree uncapped; floor derived at index time.**

1. It matches our own uncapped writer (median 2, p95 3) — it constrains the pathological case, not normal behaviour.
2. It sits in the independently-converged human band (Wikipedia prod 3, Jetpack 3, Memora 1–3, Beel's 74%-show-3-to-5).
3. Our own curve says neighbour 4 is within 0.01 of neighbour 12 — past 3 you buy noise; cap 5 costs 52% more edges for it.
4. **The floor must be computed, not hardcoded.** 0.78 is meaningful only because this corpus's random-pair p99 measured 0.773 under `bge-base-en-v1.5` (an uncentered model with a high similarity floor). Swap the embedder and the constant is meaningless.

Three design points the survey settles: cap **out**-links only (keeps hubs discoverable — max total degree stays 29); separate **write-cap from browse-breadth** (get breadth at read time by unioning out-links + backlinks + live similarity in `cmk links`, which costs nothing at write time); and keep the 174 existing hand-written edges a **distinct type** so derivation never evicts a deliberate link. Ties: highest similarity, then deterministic id tiebreak (the rebuildable-index constraint, ADR-0002/0023).

## 4. What the survey actually found — the blocker

**The cap is not the risk. Precision is, and the vector index was corrupt.**

Spot-checking top-6 neighbours for 5 random facts returned mostly *unrelated* results at similarities of 0.83–0.88 — e.g. "never overwrite backup dirs" → "all 8 capture-hook bins pass projectRoot" at 0.885. That led to the measurement that opened **Task 261**: 360 of 2,332 vec rows carry a byte-identical embedding belonging to a different fact, because the vec table is keyed by an auto-assigned `observations.rowid` that reindex reassigns.

**Auto-linking on that surface would have written ~4,000 links, a large fraction of them wrong, into the tier whose entire value is trustworthiness.** Task 262 is therefore blocked on Task 261 — fix the index, then measure neighbour precision on a labelled sample, then apply the cap. Cap 3 will still be the right answer; it just was never the decision that determined whether linking works.

## Could not verify

**supermemory** (no published number) · **Zep hosted** (graphiti is the open core; hosted behaviour unpublished, docs URL 404s) · **Mem.ai, Napkin, Roam, Heptabase, Capacities, Tana, Anytype** (closed source; Napkin's least-recently-seen rotation is secondhand) · **Reflect** (the 6 / θ0.7 figures are from Reflect Open, an MIT rebuild — the hosted app's AI backlinking is separately unbounded) · **Melançon 2006**, the on-point density survey (HAL/ACM both blocked; only the secondary "densities usually < 10" citation) · no empirical study exists of average Wikipedia "See also" length. Ghoniem et al.'s density figures are internally inconsistent as published — their result constrains *size at high density*, not sparse graphs; do not cite it as a density threshold.
