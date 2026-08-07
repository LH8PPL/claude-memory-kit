# Research break 2026-08-07 — two papers, two repos (MRAgent · Zero-Mem · mnemory · KiroCrew)

> **Dated research record.** Four items the user brought to a deliberate research break, examined the same day: two arXiv papers (read in full from the PDFs in the user's wiki `raw/`) and two GitHub repos (cloned to `C:\tmp\research-clones\` and examined from code, per the D-374 clones-are-a-cache rule — the findings below are the distillation). Actionable outcomes are listed at the end; the note is the durable artifact, the clones are disposable.

---

## 1. MRAgent — "Memory is Reconstructed, Not Retrieved" (arXiv 2606.06036, NUS, ICML 2026)

**Claim.** One-shot retrieval — top-k similarity OR fixed N-hop graph expansion — is *structurally* incapable of multi-hop recall, and they prove it (Theorem 4.1: passive retrieval policies are a strict subset of active ones for any budget T ≥ 2). Their system: a Cue→Tag→Content heterogeneous memory graph, where an LLM runs a *reconstruction loop* — retrieve, reason over the evidence, derive new cues (their example: inferring "July" as a temporal anchor), retrieve again, stop when sufficient. ~2–3 turns average.

**Numbers.** LongMemEval overall LLM-judge 72.95 vs 54.92 best baseline (Mem0/MemoryOS/LangMem/A-Mem cluster at 52–55); 86.76 with Claude driving retrieval. Token cost *lower* than every baseline (118k vs Mem0 245k, LangMem 3,268k) — construction stays light, retrieval is targeted.

**Read for the kit.**

- **The strongest external validation of the two-layer recall design to date.** Our MCP surface (`mk_search` / `mk_expand` / `mk_links` / `mk_get` / `mk_timeline`) *is* their traversal-operator set; the host agent (Claude in the session) runs their reconstruction loop for free — we never pay for a separate reasoning model because we live inside one. Snapshot injection = the passive layer; the tools = the active layer. The paper benchmarks exactly this split.
- **The loop needs edges to walk, and ours is 4% linked.** The theorem is the sharpest argument yet that Task 262 is load-bearing: an unlinked memory caps the agent at the passive tier the proof says is strictly weaker.
- Honest tension: they advocate deferring relation-building to retrieval time — but they still extract cues + tags per episode at write time (LLM-based). That write-time layer ≈ Task 262's deterministic linking.
- Their admitted limitations: no consolidation/forgetting, monotonic growth, latency grows with traversal depth. (We have the consolidation story they lack.)

## 2. Zero-Mem — zero-token memory operations (arXiv 2607.29377, PolyU)

**Claim.** Memory operations should invoke **zero** LLM calls. Construction: spaCy NER builds an entity–context co-occurrence graph (edge weight = normalized occurrence frequency) + adjacency edges, alongside a temporal hierarchy (turn→window→episode→local span). Retrieval: BM25 + dense (BGE-M3) dual signals, personalized PageRank propagation, deterministic query-profile routing between the relational and temporal views, deterministic evidence calibration. Only the final-QA reader is an LLM.

**Numbers.** Beats the generative-memory systems (Mem0, A-Mem, MemoryOS, LightMem, SimpleMem, GAM) on LoCoMo and HotpotQA up to 448K-token contexts; memory-op latency −57.6% vs the fastest baseline; zero memory-op tokens vs LightMem's 0.87M.

**Read for the kit.** Benchmark-backed endorsement of four settled decisions:

1. Raw traces as provenance-bearing source of record → our transcripts tier.
2. Derived, non-generative, rebuildable indexes → ADR-0002 (and the D-421/Task-261 fix's worldview).
3. BM25 + dense hybrid → our FTS5 + semantic exactly.
4. **Deterministic, zero-LLM linking → ADR-0023 Path A**, ratified for Task 262 days before reading this. When we chose deterministic over LLM-judged linking it was a judgment call; Zero-Mem is evidence it doesn't cost answer quality.

**Steal candidate:** entity co-occurrence as a **third edge source** for 262 (beyond embedding-similarity and token-Jaccard) — model-free. spaCy is out (zero-dependency constraint), but a deterministic term-overlap variant is the same family.

## 3. The synthesis — where the kit sits between the two papers

The papers *disagree*: MRAgent puts the LLM inside retrieval; Zero-Mem bans it from everything except the final answer. The kit occupies the point where both are right at once: **Zero-Mem-style construction (deterministic, cheap, provenance-first — committed) + MRAgent-style recall (the host agent actively traverses via MCP tools — built).** Neither paper can have both, because neither lives inside a coding agent that already pays for the reasoner. The one missing piece for that position to be real is the edge layer — Task 262.

Both papers benchmark on **LoCoMo + LongMemEval**; their shared question taxonomy (single-hop / multi-hop / temporal / preference) is a ready-made category structure for 262's sub-task-1 benchmark (the ADR-0023 trigger). Caveat: these are conversational-assistant benchmarks, not coding-agent project memory — transfer plausible, unproven.

## 4. mnemory (github.com/fpytloun/mnemory) — clone examined

**What it is.** A self-hosted, **multi-user memory service**: Python/FastAPI + Qdrant + S3 artifacts, 17 MCP tools + REST, JWT auth, Prometheus/Grafana. Home turf is Open WebUI chat-assistant personalization. Serious engineering: 245 commits since 2026-02, 19 releases, 1,349 tests, a LoCoMo harness with published scores (73.2). Single author.

**The graph finding (the headline).** The dense-looking graph in its UI has **no link model at all** — edges are a 15-line client-side loop (`mnemory/ui/static/js/graph.js:204-219`) drawing an edge between any two memories sharing ≥1 category, weight = overlap count. Categories come from a closed LLM-assigned vocabulary of ~13 buckets, so collisions are near-guaranteed and every category forms a clique. Density is an artifact of coarse controlled vocabulary, not link inference. The one semantic link they store (`derived_from` consolidation provenance) is never rendered.

**Feature deltas that matter.** They have and we lack: TTL decay + reinforcement-on-access (lazy, query-time, restore-on-access — `mnemory/ttl.py`), raw→consolidated two-layer with LLM re-synthesis, an artifacts tier, multi-query AI search. We have and they lack: in-repo git-native storage, zero-infra operation (they require an OpenAI-compatible key + server), write-time poison screening (theirs is post-hoc fsck), human-in-loop conflict queue (theirs auto-resolves), audit log/tombstones/decision journal, read-only viewer guarantee (theirs is full CRUD with an admin user-switcher), Windows support (their Claude Code hooks are bash+jq).

**Verdict.** Different species — competes with mem0/Zep/Memobase, not with us. Convergent evolution on the middle (MCP tools, Stop-hook capture, hybrid search) mildly validates both.

## 5. KiroCrew (github.com/kirodotdev/KiroCrew) — clone examined; org verified official (Amazon copyright in NOTICE, same org as the Kiro IDE repo)

**What it is.** NOT a crew-orchestration framework — a **persistent personal AI dev workspace** on kiro-cli: gateway + React dashboard + Slack/Discord/Telegram/WeCom channels + heartbeats + cron + SKILL.md skills + subagent spawning + a self-improvement app kit. Architecturally an OpenClaw/Clawdbot-alike, built independently (no fork lineage in THIRD-PARTY-NOTICES). Velocity is the shock: **1,684 commits, ~31,000 test functions, 83 contributors, signed desktop apps — in nine weeks**, visibly AI-built (agent committer identity, Claude-review workflows, AGENTS.md-as-router).

**The memory core is the kit's thesis, vendor-shipped.** `~/.kiro/crew/workspace/memory/` holds `preferences.md` + `projects.md` + `history/{date}.md` (markdown), plus semantic KV / episodic vectors / lessons layers, an explicit `learn_add` tool, dual-trigger consolidation (30 messages → wholesale-replace prefs/projects; 3h idle → append history), a graduated decay ladder (0–13d full → 14–60d first-entry-per-day → 61–180d date+count → 365d prune), FTS5 keyword index, in-process Qwen3 embeddings with no egress, and memory modes (persistent / incognito / temporary).

**The moat holds.** Their memory is user-home-scoped, machine-local, Kiro-only, and the consolidator *wholesale-replaces* the markdown. Nothing travels with `git clone`; no per-fact provenance, no append-only journal, no trust tiers, no conflict queue, no write-time poison screen. Every axis of the kit's identity is untouched. **Named trigger filed (D-428): if KiroCrew or kiro-cli ships a committed in-repo memory tier, re-assess positioning immediately.**

**For the Kiro adapter:** their `agent.py` (2,200+ lines of programmatic kiro-cli agent-config ownership) is now the freshest primary source on the agent-spec shape — `deny_unknown_fields`, PascalCase hook events, `mcpServers` merge semantics, `skill://` discovery, and the `tools` capability field (the exact class of the 2026-06-24 cut-blocker in CLAUDE.md's verification rules).

**Best steals:** corruption-vs-lock discrimination in FTS self-heal ("database is locked" is transient contention, NOT corruption — must never trigger delete-and-rebuild; directly relevant to our index self-heal / HC-15 family), the decay ladder, caps interpolated into the consolidator's LLM prompt (their version of our composition discipline), memory modes, and automated memory-recall eval scenarios (`eval/scenarios/memory_recall_basic.json`).

### 5b. KiroCrew's learning loop — deep-dive (read directly from the clone, same day)

The "self-learning" banner resolves to FOUR distinct loops; conflating them undersells the design:

1. **The lesson loop (behavioral learning — the SYSTEM-MAP §6 region).** Lessons ("always use pytest") have FOUR write sources (`memory-skills-hooks.md` §Lessons): (a) explicit `learn_add` — immediate, confidence 1.0; (b) **the task runner ON FAILURE** — a step fails → LLM extracts a lesson → `write_lesson(source="task_runner")` — failure-driven durable learning, the loop closed from error to rule; (c) consolidation extracts *implicit corrections* — the user corrected the agent without saying "remember"; (d) dashboard/CLI. Every write goes through ONE path (`write_lesson()`) with a three-tier dedup ladder — substring → topic-overlap (>50% keyword overlap, newer replaces older) → embedding cosine >0.85 (longer text wins) — plus allowlist validation, injection scanning, and audit logging. Injection back: a `[Learned corrections]` block capped at 50, whose header wording — "ALWAYS follow these. They override default behavior." — is what makes a lesson beat a contradicting preference: **priority by framing, not by ordering**. A six-layer conflict ladder sits under it (lessons 1.0 > semantic user-explicit > semantic auto ≥0.8 > consolidated markdown > episodic > history), and supersession does write-through invalidation (`_retire_stale_episodic()` tombstones episodic rows that quote a superseded value).
2. **The consolidation loop** (30-message and 3h-idle triggers) — experience → durable memory, covered above.
3. **Session-autonomy loops** (`self-nudge-loop` / `goal-loop` skills + `AutoNudgeService`): a long-lived session re-nudged on idle, driven by anchor files (`north_star.md` / `roadmap.md` / `tasks.md`, or `GOAL.md` + a kanban board + a Definition-of-Done that ends the loop). Work loops, not learn loops — but the anchor-file pattern ("the agent re-reads GOAL.md every cycle; everything else is session state") is the memory-injection philosophy applied to autonomy.
4. **`auto_improvement` (code self-improvement app).** Measure-FIRST: build a metric → **prove it can detect a known win (a canary) before optimizing anything** — "if the canary fails, the harness cannot measure and the run halts rather than optimizing noise" — then propose candidates in parallel worktrees, gate deterministically (build/tests/edit-allowlist), A/B-measure by median, keep only what clears a noise band (max(2σ, floor)), emit draft PRs. Design thesis, verbatim: *"a measurement system that happens to write code, not a code-writing system that happens to measure"* — and *"the agent proposes; it never grades its own work."* The agent is explicitly treated as adversarial toward the metric.

**Kit-relevant reads:** (i) loop 1 is the most complete shipped behavioral-learn-loop in the corpus — a reference shape for our SYSTEM-MAP §6 blank region (machine-local and provenance-thin, but the CAPTURE-SOURCE taxonomy — explicit / failure-driven / implicit-correction — is the part our design lacks; our Task-250 whisper is failure-driven for HEALTH, not for behavioral lessons); (ii) **the canary discipline transfers directly to Task 262 sub-task 1**: before measuring whether linking improves recall, prove the benchmark detects a KNOWN win (e.g. a hand-linked subset must beat its unlinked twin) — otherwise the A/B measures noise; (iii) their injection scanning + audit logging on the lesson write path means the earlier "no write-time screen" contrast with mnemory needs nuance — KiroCrew DOES screen at write; the missing pieces vs us remain provenance files, append-only journal, human-in-loop conflicts, and committed storage.

---

## Actionable outcomes

| # | Outcome | Where it lands |
| --- | --- | --- |
| 1 | **Co-occurrence edge layer for the viewer graph** — computed at render (shared type/topic), toggleable, zero storage; fixes "4% linked looks empty" while 262 builds real links. Precedent: mnemory `graph.js:204-219`. ~1 day. | Rider option for Task 262 / viewer follow-up — annotated on 262's entry |
| 2 | **Entity/term co-occurrence as a third deterministic edge source** (Zero-Mem's construction), alongside embedding-similarity and token-Jaccard | Task 262 design input |
| 3 | **Benchmark taxonomy** single-hop / multi-hop / temporal / preference (LoCoMo + LongMemEval) for 262's sub-task-1 benchmark | Task 262 sub-task 1 |
| 4 | **KiroCrew watch-trigger**: committed in-repo tier ⇒ re-assess positioning | D-428 (named trigger, sweep-visible) |
| 5 | **Kiro adapter primary source refresh**: KiroCrew `agent.py` for agent-spec semantics | Task 196 tail / next Kiro-surface task |
| 6 | **Corruption-vs-lock discrimination** for index self-heal | Next index-health task (composes with HC-15) |
| 7 | **Reinforcement-on-access + lazy TTL** (mnemory) — design read before the next consolidation-adjacent task; the no-cron shape fits ADR-0002 and our D-298 cron history | Consolidation backlog input |
