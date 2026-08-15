# Research run 2026-08-15 — atomic · RepoSwarm · AutoRAG · Repowise

> **Dated research record.** Four repos the user brought to a research run, cloned to `C:\tmp\research-clones\` and examined from code the same day (per the D-374 clones-are-a-cache rule — this note is the distillation). The completeness lesson from the 2026-08-07 run (first passes under-report) was baked into the briefs this time: every agent enumerated the full CLI/tool/config/docs/test surface *before* concluding. Actionable outcomes at the end; converted to backlog same-day per the D-429 discipline (a steal-list in a note is rot).

---

## 1. atomic (kenforthewin) — adjacent-species competitor at ONE seam

A polished, near-solo **personal knowledge base** in Rust: markdown "atoms" in SQLite/Postgres, auto-chunk/embed/tag, semantic edges + wikilinks, cited wiki synthesis with incremental LLM update, chat-RAG, 16 MCP tools, Tauri/iOS/extension/Obsidian clients, a paid cloud. 1,103 commits in 8.5 months, 147 releases, ~93% one author.

**The seam:** its `create_atom` MCP description is verbatim agent-memory positioning ("Remember something new… across conversations — user preferences, decisions, project context"). The mechanics don't back the pitch for coding agents: **no auto-capture** (the model must remember to remember), **no session injection**, **zero memory lifecycle** (no trust/decay/forget/tombstones/supersession — atoms accrete forever), **no write screening** (an MCP call persists a leaked key), server-bound storage a `git clone` carries nothing of. Ahead of us only downstream of storage: synthesis (cited wikis, scheduled cited reports), canvas, client breadth.

**The strategic find:** they named **LongMemEval** as their memory benchmark and shipped only a scaffold with "planned metrics" (`crates/atomic-bench/src/suites/memory_longitudinal.rs`). We have a runnable-benchmark culture — a real LongMemEval harness in cmk claims ground they announced.

**Steals:** `since_days` recency param on search (the tool description teaches the model when to use it); the anchored-edit MCP contract (exact-once anchor text, whole op atomic); the named `EMBEDDING_SPACE_KEYS` invariant (settings whose change invalidates the vector space ⇒ re-embed — a doctor-shaped check); task-ledger failure disposition (environmental failures defer WITHOUT consuming retry budget); the "substrate, not orchestrator" automation rationale (their `docs/plans/automations-vision.md`) as citable prior art for our own automation ADRs.

## 2. RepoSwarm — curiosity, dormant

Org-fleet **batch architecture-doc generator**: Temporal workflows clone every repo in a portfolio, run a prompt sequence per repo type, commit `.arch.md` files to a central hub. Real code (282 test functions), real design — and dormant since 2026-03, ~2 authors, hackathon origin. Different species; overlap ≈ zero.

**The one steal:** **prompt-version-keyed derived-artifact invalidation** — every prompt file carries `version=X` on line 1; the cache key is `(repo, step, commit, prompt_version)`, so a prompt edit invalidates exactly that step's derived output (`src/utils/storage_keys.py:32-61`). Trigger-shaped for us: version-stamp the compressor/distill/extract prompts so a prompt change invalidates only its derived artifacts.

## 3. AutoRAG (Marker-Inc-Korea) — the measurement goldmine

**Repo-level surprise:** HEAD pivoted to "AutoRAG 2.0," a TypeScript librarian agent; the RAG-AutoML optimizer lives in `legacy/`, maintenance mode. (The optimizer-species topping out into an agent pivot is itself a data point.) 962 commits, 29 contributors, 69 releases, 5,036 stars; their paper is arXiv:2410.20878 (NOT read this pass — comparative win-claims live there, unverified).

**What it is:** greedy node-by-node grid search over RAG pipeline configs against a QA parquet; winner's output feeds the next node. **Overfitting is guarded by docs prose only** — all weight sweeps tune on the supplied eval set. Our canary/holdout discipline is stronger and must wrap anything adopted.

**The zoo (enumerated):** BM25 with 7 tokenizer variants · 6 vector backends · **2 fusion methods** — RRF with `rrf_k` SWEPT 4–80 (not the borrowed 60) and convex-combination with w swept 0–1 across **4 normalizations incl. `dbsf` (mean±3σ — corpus-derived, our ethos)** · **4 query-expansion modules, all LLM-based** (pass / HyDE / multi-query keeping the original at index 0 / Visconde decomposition with a "needs no decomposition" escape), judged ONLY extrinsically by downstream retrieval metrics · **17 rerankers + `pass_reranker`** (the no-op is always a formal candidate — the framework's stance: reranking is a per-corpus empirical question) · passage filters incl. percentile cutoffs (survive score-distribution shifts the way absolute thresholds don't) · token-overlap metrics for ID-destroying transforms · `normalize_mean` multi-metric winner selection + latency as a hard pre-filter.

**The big transfer — QA-fixture auto-generation from a corpus** (`legacy/autorag/data/qa/`): sample passages → **`retrieval_gt` = the sampled passage's id by construction** (ground truth for free) → typed question prompts (factoid / concept-completion / two-hop) → two hard-won quality filters: **don't-know filtering** and the **passage-dependency filter** (drop questions unanswerable without already holding the passage — "what is the highest score according to the table?" — auto-generated questions of that shape poison a retrieval benchmark). Maps 1:1 onto cmk fixture-building: sample fact files, fact id = ground truth, filter the cmk-flavored poison ("what does this decision say?").

**Task-278 shape transfer:** the no-op always a candidate; expansions judged only extrinsically on the fixture set; variant-SETS fused (multi-query/decompose return lists and retrieval unions them) — the cmk-native analogue is OR-over-variants instead of implicit-AND.

**D-360 reopen pointer:** flashrank + openvino are the CPU-cheap cross-encoder class (no API, no GPU); comparative win-rates in the paper, verify before citing.

## 4. Repowise — the most serious direct competitor found in the whole research program

**"Codebase intelligence layer for AI coding agents."** 1,202 commits in 5 months, ~10 contributors, 58 releases to v0.19.x, PyPI, **944 test files / 11,170 test functions**, published benchmarks **including the rows they lose**, PR bot, open-core AGPL business, 46-doc tree. Local-first, deterministic-first SQLite index (FTS5 + in-SQLite vectors, RRF hybrid — our stack, independently), five layers: dependency graph (18 langs), git behavioral signals, generated wiki, code health (49 detectors, defect-validated), and **an architectural-decisions layer that is a direct, well-executed attack on our core thesis:**

- **Reads the same `~/.claude/projects/*.jsonl` transcripts we do**, byte-offset cursors per file — our Task-148 watermark pattern, independently arrived at. `HarnessAdapter` contract (`discover()` + `normalize()`) for other harnesses; their Claude Code schema-gotcha catalog (usage dedup by `message.id` — raw summing overcounts 2.6×; `isSidechain`/`isMeta`/`isCompactSummary`; interrupt markers) is worth mining alone.
- **Mines the same signals** — pushback leads, decision verbs + causal markers, 3× repeated failures — deterministic gates first, then ONE batched LLM call (≤60 candidates) where **every extracted field must quote the transcript verbatim or the candidate is dropped**, then **observation-counted promotion** (2 distinct sessions, or 1 direct user correction). Sticky dismissed-tombstones never re-proposed.
- **Injects at the same moments** — session start scored against the *likely working set* (dirty files, branch diff, previous session's edits), 1-hop graph expansion, relevance × confidence × freshness, **hard ~400-token cap, floor-gated**; edit-time one-line notices, once per session per decision.
- **The efficacy loop — the organ our SYSTEM-MAP §6 marks honestly blank, shipped:** every injected decision id is recorded; the next update replays the transcript and classifies whether the agent **acted on or contradicted** the guidance within an N-tool-call window (`core/sessions/efficacy.py`), reported by `repowise hook stats`. Deliberately separate from staleness (override = judgment about the record; staleness = measurement of the code).
- **Freshness discipline:** every MCP response carries a `_meta` staleness envelope (`index_age_days`, `indexed_commit`, `stale_warning` only when a *served target* actually diverged — calibrated to fire rarely so agents keep trusting it). **Decision `staleness_score` = fraction of the record's linked files committed-to since capture** — and they *deliberately removed* age/commit-volume/message heuristics as overfitted (free negative research for us).
- Security-conscious: `.repowise/` pickle caches HMAC-sealed against attacker-writable-repo CWE-502.

**The structural weakness is exactly our moat:** `.repowise/` is **gitignored local SQLite** — a teammate's fresh clone starts from zero and reindexes; mined decisions stage per-machine; **no cross-project tier**; decisions are post-hoc mined *proposals*, not in-the-loop captures with trust tiers, Poison_Guard screening, and a tombstone/supersession audit trail. Their computed-intelligence layers (graph/health/risk/dead-code) are a **complement cmk should never build**.

**RepoSwarm vs Repowise:** same marketing phrase, nearly disjoint niches — org-portfolio batch LLM documentation vs per-repo live deterministic agent context. No shared lineage.

---

## Actionable outcomes (converted to backlog same-day, D-453)

| # | Outcome | Home |
| --- | --- | --- |
| 1 | **The efficacy loop** — record injected fact ids, replay the transcript, classify acted/contradicted; the learn-loop's missing organ, now with a shipped reference (`efficacy.py`) | **Task 282** (v0.7) |
| 2 | **Recall staleness honesty** — a `_meta`-style envelope on `mk_*` responses (snapshot age, facts-written-since, rarely-firing warning) + atomic's `since_days` temporal filter on search | **Task 283** (v0.7) |
| 3 | **Deterministic fact staleness** = fraction of linked files/facts changed since capture — composes with the new `related:` edges; age-heuristics-overfit recorded as their negative lesson | **Task 284** (v0.7) |
| 4 | **QA-fixture auto-generation** — sample facts → gt-by-construction → typed questions → passage-dependency + don't-know filters; plus a runnable LongMemEval harness (the ground atomic announced and never shipped) | **Task 285** (v0.7; serves 99/263/278) |
| 5 | **Fusion sweep** — rrf_k swept per-corpus (kills our one borrowed constant, k=60) + CC/dbsf raced against RRF on the existing benchmark, wrapped in OUR canary/holdout discipline (their in-sample hazard stays outside) | **Task 286** (v0.7) |
| 6 | **Verbatim-quote grounding gate** for auto-extract — an extraction that can't quote its transcript source verbatim is dropped | **Task 287** (v0.7) |
| 7 | Task 278 design inputs: no-op-always-a-candidate, extrinsic-only eval on the fixture set, OR-over-variant-sets | 278 annotation |
| 8 | D-360 reranker-reopen pointer: flashrank/openvino CPU-cheap class; win-claims live in arXiv:2410.20878, verify first | 264/D-360 orbit — recorded here |
| 9 | HarnessAdapter contract + the Claude Code transcript gotcha catalog | Task 196 annotation |
| 10 | Prompt-version-keyed derived-artifact invalidation (RepoSwarm) | named trigger: next time a distill/extract prompt change invalidates stale derived artifacts confusingly |
| 11 | **Repowise watch-trigger (D-453):** if Repowise ships a committed/in-repo decisions tier or a cross-project tier, re-assess positioning immediately | D-453, sweep-visible |
| 12 | atomic's anchored-edit MCP contract + `EMBEDDING_SPACE_KEYS` invariant + ledger failure-disposition | recorded here; ride their surfaces' next tasks |
