---
date: 2026-07-27
topic: BrainAPI (Lumen-Labs/brainapi2) code dive — agent-swarm graph extraction, traceable-path retrieval claims
source: Shallow clone + code read of github.com/Lumen-Labs/brainapi2 (v2.14.x); IDEAS-ONLY (PolyForm SB license)
tags: [prior-art, graph, extraction, agent-swarm, adr-0023, task-95]
---

# BrainAPI code dive — what the swarm and the "traceable path" actually are

## License posture (binding for this note)

BrainAPI ships under **PolyForm Small Business License 1.0.0** (`LICENSE:3`) — **not** a
permissive license. This dive is **IDEAS-ONLY**: no code, prompt text, or verbatim prose from
that repo is copied into the kit or into this note. Mechanisms are described in my own words;
quoted fragments are ≤1 line and appear only as evidence for a specific claim, with
`file:line` attribution. Nothing here authorizes reuse of their implementation. Their code was
**read statically only** — nothing was executed.

Clone: `git clone --depth 1` at commit `af5c778`, version `2.14.2-dev` (`pyproject.toml:3`).
~33k LOC Python across `src/`, plus a Rust MCP bridge, a Node TUI, and a web console.

**Method (the D-364 rule):** every claim below is tagged **CODE-VERIFIED** (file + line +
function), **README-ONLY** (asserted upstream, no supporting code found), or **PARTIAL** (real
code exists but does materially less than the claim). The field's pattern — "graph" flagships
shipping no real graph (mem0 / MemOS / Letta / obsidian-mind, per the
[graph-memory code sweep](2026-07-19-graph-memory-code-sweep.md)) — was tested explicitly.

---

## Headline verdict

**BrainAPI is not a fake graph.** It is the first system in our corpus whose "graph" claim
survives contact with the code: real nodes, real typed edges, a real second store, and a real
multi-hop query. That distinguishes it sharply from the mem0/MemOS/Letta class.

**But its two loudest claims are both overstated in the same direction — the code does the
narrow version of the marketing.**

| Claim (README) | Verdict | One-line reason |
|---|---|---|
| "A swarm of agents reads it" | **PARTIAL** | 1 of 4 is a real agent loop; 2 are single LLM calls; 3 further agent files are empty stubs |
| Janitor "checks… tells the Architect exactly what to fix… looping until it's clean" | **PARTIAL — real, but not a gate** | Rejected relationships are **written to the graph before** the rejection is reported |
| "A reasoned, walkable path… not a nearest-neighbour guess" | **FAILS AS STATED** | Vector search *is* the entry point; the "path" is a **fixed 2-hop pattern match**, and zero path-finding algorithms exist in the repo |
| "Append-only… nothing is deleted… events are never merged away" | **CONTRADICTED** | Nodes `MERGE` on **name** and `SET`-overwrite; `DELETE` exists; the consolidator holds removal tools |
| Event-centric model | **REAL** (and the genuinely good idea) | Event-hub reification is real in code and is what makes the 2-hop query meaningful |
| Provenance trail | **WEAKER THAN OURS** | Graph nodes and edges carry **no** pointer to the source text at all |

---

## 1. The agent swarm — what each agent actually is

**Pipeline entry.** `ingest_data` (Celery task, `src/workers/tasks/ingestion.py:269`) →
Observations (`:346`) → `enrich_kg_from_input` (`:369`) → Scout → Architect → consolidation
(`src/core/saving/auto_kg.py:63-193`).

### Scout — CODE-VERIFIED as a single structured LLM call, not an agent

`ScoutAgent._get_tools` returns an empty list (`src/core/agents/scout_agent.py:118-128`). It is
one prompted call with a Pydantic output schema (`_ScoutAgentResponse`, `:69-74`), wrapped in a
thread + timeout + tenacity retry (`:446-478`). Two prompt variants, `granular` and `coarse`
(`:138-151`), selected by `PIPELINE_MODE`. **No loop, no tools, no graph access despite being
constructed with kg/vector/embeddings adapters.** Calling it an agent is generous; it is an
extraction prompt.

### Observations — CODE-VERIFIED as a 47-line single call, and it does *not* do what the README says

`src/core/agents/observations_agent.py` is 47 lines total: one `generate_text` call, JSON-parsed
(`:32-47`). Two gaps against the README:

1. **Not "alongside."** The README diagram shows it running in parallel with Scout. In code it
   runs **sequentially in the same Celery task**, strictly before graph enrichment
   (`ingestion.py:346` then `:369`). No concurrency primitive between them.
2. **"Taking previously known context into account" is not wired.** `observe()` accepts a
   `context` parameter (`observations_agent.py:27`), but the only production caller passes
   `text` and `observate_for` only (`ingestion.py:346-353`) — `context` is always `None`. The
   feature exists in the signature and nowhere else.

**Observations never reach the graph.** They are written to a document collection keyed by
`resource_id` → text chunk (`ingestion.py:355-364`; `src/lib/mongo/client.py:51-56`). The README
diagram's `Observer --> Graph` edge does not exist in code.

### Architect — CODE-VERIFIED as the one real agent

`ArchitectAgent.run_tooler` (`src/core/agents/architect_agent.py:1295`) is the production path
(the only one `auto_kg.py` calls, `:95` and `:127`). It is a genuine tool-calling loop with four
tools (create-relationship, check-used-entities, get-remaining-entities, mark-entities-used —
`src/core/agents/tools/architect_agent/`). This is the real work of the system.

Bounding is weak: `recursion_limit: 100` is passed (`:1418`), but under the default
`AGENTIC_ARCHITECTURE="custom"` (`src/config.py:547-548`) the custom loop never reads it — the
loop is `while True:` (`src/core/agents/core/invoke_loop.py:141`), and the only iteration
instrumentation publishes a warning event without raising
(`src/lib/tracing/tracker.py:250-266`). The real backstop is wall-clock (`timeout=3600`,
`:1301`) and Celery's 24h task limit (`src/workers/app.py:102`).

### Three agent files are empty stubs — CODE-VERIFIED

`validator_agent.py`, `temporal_agent.py`, and `chat_agent.py` each contain **only a file-header
docstring and no code** (9 lines each). A file named `temporal_agent.py` with zero
implementation is worth noting given the event-centric positioning.

### Sequential or queued?

**Both, awkwardly — CODE-VERIFIED.** Relationship persistence is dispatched to Celery
(`process_architect_relationships.delay`, `ArchitectAgentCreateRelationshipTool.py:582`), but the
top-level flow then **busy-waits on a Redis counter**, polling every 2s up to 300s
(`auto_kg.py:157-176`) before queueing consolidation. A worker blocks on `time.sleep` waiting for
other workers. This is a queue used as a fan-out, then rejoined synchronously.

### Cost per document

Per-ingest token accounting and a printed dollar estimate exist (`auto_kg.py:195-216`), including
a cost-per-character line. The model is `llm_small_adapter` for **every** agent — Scout,
Architect, Janitor, and the consolidator executor — resolving to Vertex AI
`gemini-3-flash-preview` by default (`src/lib/llm/client_small.py:73`; `.env.example:12`). No
absolute cost figure is published in the repo; the instrumentation is there but no measured
numbers ship. **README-ONLY** on any specific cost.

---

## 2. Is the "validation" step real, or a rename?

**It is a real adversarial second opinion — and it is NOT a gate. CODE-VERIFIED.** This is the
most interesting finding in the pipeline half.

The atomic Janitor is a genuine second LLM call with graph-read tools (schema, entity search,
relationship search, read query — `src/core/agents/janitor_agent.py:134-158`), invoked from
inside the Architect's create-relationship tool
(`ArchitectAgentCreateRelationshipTool.py:407-415`). It returns three lists
(`src/constants/agents.py:119-124`): `fixed_relationships` (it corrected them itself),
`wrong_relationships` (it rejected them), and `required_new_nodes`.

**The ordering defeats it.** Inside one tool call:

1. Every input relationship **without** a matching corrected twin is appended to the output set
   (`:494-546` — the `have_similar_relation` test, which is false precisely for rejected
   relationships, since the Janitor's own prompt contract puts corrections in
   `fixed_relationships` and *only* unfixable ones in `wrong_relationships`,
   `src/constants/prompts/janitor_agent.py:167`).
2. That output set is dispatched to the graph-write task (`:582`).
3. **Then** `wrong_relationships` is checked and an `ERROR` is returned to the Architect
   (`:610-624`).

So a relationship the Janitor judged wrong is **queued for the graph before the judgment is
reported**. The Architect's "fix" is a subsequent append. Combined with §3 below (no delete on
this path, `deprecated` never filtered at read), the rejected edge remains retrievable forever.

Two further limits: the Janitor is skipped entirely when `mode == "coarse"`
(`architect_agent.py:640`) — i.e. the whole `lightweight` pipeline has **no validation at all**;
and the corrective loop is not an explicit bounded loop in the production path — it is emergent
LLM behavior in response to an error-shaped tool result. The explicit
`max_janitor_iterations = 3` bound exists only in `run_structured` (`:1224`), which nothing calls.

**Verdict: not a rename — the checking is real and the schema is thoughtfully designed. But it
is advisory-after-write, not validation-before-write.** The distinction matters for us: the
architecture reads as a gate and behaves as a logger.

---

## 3. The graph itself

**Real store — CODE-VERIFIED.** Pluggable across three backends (`src/config.py:522-524`):
Neo4j (code default; the shipped compose runs **Neo4j Enterprise**,
`example-docker-compose.yaml:55`), PostgreSQL + NetworkX
(`src/lib/postgresql/networkx_client.py`, `graph_store.py:70` — `nx.MultiDiGraph`), plus Mongo /
Milvus / pgvector for documents and vectors. The graph adapter interface is genuinely broad — 30+
methods (`src/adapters/interfaces/graph.py`).

**Typed edges — CODE-VERIFIED, but the type vocabulary is unbounded.** Edge type is the
LLM-chosen predicate name, interpolated directly into the Cypher relationship type
(`src/lib/neo4j/client.py:343`). There is no ontology, no closed label set, no validation of the
type against a schema. `Predicate` carries `name`, `description`, `direction`, `amount`,
`level`, `flow_key`, `deprecated` (`src/constants/kg.py:61-104`). So: typed, but the types are
free-form generated text — the drift hazard ADR-0023 rejects in its `REJECT` clause.

**"Append-only" is contradicted — CODE-VERIFIED, three ways:**

1. **Nodes upsert on `name`.** `identification_dict = {"name": node.name}` then `MERGE`
   (`neo4j/client.py:227`, `:276`), with `SET` overwriting `description`, `happened_at`,
   `last_updated`, `polarity` (`:248-262`). Two distinct events sharing a name **collapse into
   one node and the earlier description is destroyed** — the exact opposite of the README's
   "every new action is appended as its own event node rather than overwriting."
2. **Hard deletes exist** (`DELETE r`, `:1918`, `:1937`), and the graph consolidator is handed
   node- and relationship-removal tools (`src/core/agents/kg_agent.py:513-546`).
3. **Soft deprecation is cosmetic.** `deprecate_relationship` sets `r.deprecated = true`
   (`:1139`), and the flag is read back into the model (`:1035`) — but **no read query anywhere
   filters on it**. Deprecated edges are returned by every retrieval path.

---

## 4. The retrieval claim — tested hardest

**There is no path-finding in this repository. CODE-VERIFIED by exhaustive grep:** zero matches
for `shortestPath`, `allShortestPaths`, `dijkstra`, `all_paths`, or any NetworkX path algorithm
across `src/`. The only variable-length Cypher in the codebase is a neighborhood expansion from a
start node (`neo4j/client.py:418-422`).

### What `/retrieve/context` — the headline endpoint — actually does

`get_context` (`src/services/api/controllers/retrieve.py:384-472`), the endpoint whose response
field is literally named `triples` and which the README captions as "the graph path used to
derive this":

1. spaCy NER splits the query into candidate entity strings (`:400`).
2. For the whole text **and each extracted token**: embed → **vector search over node embeddings**
   (`:409-413`).
3. Feed the vector hits' UUIDs to `get_event_centric_neighbors` (`:414`).
4. Return the resulting 5-tuples as `triples` (`:462-471`).

The graph step is one Cypher statement (`neo4j/client.py:1658-1661`), and it is a **fixed two-hop
pattern match**:

```
MATCH (n)-[r]-(m)-[r2]-(b)
WHERE n['uuid'] IN [...]
AND r2['flow_key'] = r['flow_key']
```

Consequences, all CODE-VERIFIED:

- **Depth is always exactly 2.** Not variable, not goal-directed, not searched. The returned
  "path" is always a 5-element tuple because the query shape says so.
- **No `LIMIT` clause.** The result set is unbounded at the database; bounding happens by
  accident in Python (below).
- **`flow_key` confines the walk to a single extraction call.** `flow_key` is a `uuid4` minted
  once per Architect create-relationship **tool invocation**
  (`ArchitectAgentCreateRelationshipTool.py:207`, applied at `:464` and `:545`). The join
  condition `r2.flow_key = r.flow_key` therefore requires **both hops to have been created by the
  same LLM tool call**. Multi-hop retrieval **cannot cross documents, or even cross batches within
  one document**. The README's framing — asking something "it was never explicitly told" — is
  structurally limited to inferences within one extraction call.
- **Only the first neighbor is kept.** The loop at `retrieve.py:418` appends one tuple and
  `return`s unconditionally inside the first iteration (`:427`). Whatever the database returns
  first, unordered and unscored, is the answer. There is **no ranking of candidate paths at all**.

### The one genuine traversal primitive

The MCP `traverse_graph` tool is real bounded N-hop expansion — recursive flatten with depth
tracking, `via_uuid` parent links, and type/label/direction filters, capped by
`MAX_TRAVERSE_DEPTH = 5` / `MAX_TRAVERSE_HOPS = 100` (`src/core/search/traverse.py:7-108`). This
is honest, well-bounded code. But it is **neighborhood expansion from a caller-supplied start
node** — no target, no goal test, no scoring, no path selection. It is `expand`, not `find path`.

### Verdict

**"Traceable walkable path, not nearest-neighbour" — FAILS AS STATED.** Nearest-neighbour is the
entry point on every retrieval path in the system, including the MCP `search_semantically` tool.
What sits on top is a fixed two-hop pattern expansion joined on a batch key.

**The fair version:** this is *vector search with real structural expansion* — meaningfully more
than mem0's score-boost or MemOS's commented-out relational path, because the edges genuinely
exist and are genuinely walked. It is meaningfully less than a reasoned path search, because
nothing searches, nothing scores, and nothing may leave the originating extraction batch. Calling
it "graph garnish" would be unfair; calling it a walkable path is unearned. It is **a two-hop
neighborhood, presented as a path.**

---

## 5. Event-centric model vs our fact/observation model

**The reification idea is real and is the best thing in the repo.** Actions become first-class
`EVENT` nodes rather than edge labels: `actor —MADE→ event —TARGETED→ target`, with context
attached via a third edge. It is real in the extraction prompts
(`src/constants/prompts/architect_agent.py`), real in the schema (`labels: List[str]` on `Node`),
and it is precisely what makes the 2-hop query above return something semantically coherent
rather than an arbitrary neighbor. **Reifying the action is what buys the extra hop.**

**The temporal layer, however, is broken in a way worth recording — CODE-VERIFIED.**

- `happened_at` is `Optional[str]` — a free-form string with no validation
  (`src/constants/kg.py:39-42`).
- The Scout prompt mandates day-first `DD/MM/YYYY` (`src/constants/prompts/scout_agent.py:151`,
  repeated at `:169`, `:188`).
- The **only** consumer that reads it semantically calls `datetime.fromisoformat`
  (`src/core/search/entity_info.py:232`) — which cannot parse a day-first format.
- The failure is swallowed: `except Exception: days_ago = 0` (`:234-236`), and `days_ago = 0`
  yields `recency = 1.0` (`:237`).

**Net effect: every dated event scores as though it happened today, and the recency term in the
synergy ranking is a constant.** The temporal signal is written on every ingest and silently
discarded at the only place it is scored. Nothing in the 14-file test suite covers it.

**Comparison to us — we are ahead here, not behind.** No bi-temporal split (no valid-time vs
ingest-time), no expiry, no supersession chain to walk, no ordering by event time anywhere
(`ORDER BY` appears once in the Neo4j client, on a generic property). Our Task 66 design
(timestamps-union + supersession + expiry) is a strictly richer temporal model than what ships
here, and our `deprecated`-equivalent actually filters.

---

## 6. Provenance and traceability

**This is where BrainAPI is clearly weaker than the kit. CODE-VERIFIED.**

**Graph nodes and edges carry no source pointer.** Grep for `resource_id`, `provenance`,
`source_chunk`, `origin_id`, `derived_from` across `src/constants/kg.py`, `src/adapters/graph.py`,
and `src/lib/neo4j/client.py` returns **nothing**. `resource_id` exists on exactly two things:
the vector metadata (`ingestion.py:331`) and Observations (`:360`) — neither of which is a graph
element.

So the "provenance trail" is structural only: the returned tuple shows *which nodes and edges*
were involved, never *which document produced them*. You cannot ask "where did this edge come
from," and no amount of traversal will tell you.

The `historical_context` field returned alongside the triples reinforces this: it is the **last N
text chunks by recency** (`retrieve.py:430-453`), not the chunks that produced the returned
triples. It is adjacent context, presented next to a trace, which reads as provenance and is not.

There is **no audit log**, **no trust tier**, and **no confidence score** on any graph element.

**Against our stack:** our `cites` edges, trust tiers, `.locks/audit.log`, and per-fact
`source:` frontmatter each answer a question BrainAPI's model cannot express. The one thing they
have that we do not is that their trace is *structural* — the answer's shape is the evidence —
whereas ours is *referential*. That contrast is worth holding, but their side has the weaker
guarantee.

---

## 7. The Janitor as a maintenance agent

**Not a maintenance agent. CODE-VERIFIED.** Despite the name and the README framing, there is no
standalone maintenance job: **no Celery `beat_schedule`, no cron, no API route** (`src/workers/app.py:63-109`
defines queues and routes but no beat schedule; the repo's only scheduler is for backups).

It runs **only inside ingestion**, triggered synchronously per ingest when
`RUN_GRAPH_CONSOLIDATOR` is true (`auto_kg.py:145`, default true `src/config.py:535-536`), and it
**only ever sees the current session's relationships**, loaded from a Redis key
(`ingestion.py:924`). It never audits the graph at large. Pre-existing duplicates, or duplicates
across two sessions that never co-occur, are never examined and there is no way to ask it to
sweep.

**It cannot write.** All four of its tools are read-only
(`janitor_agent.py:134-158`); the file named `JanitorAgentExecuteGraphOperationTool.py` is a bare
`pass` subclass of the read-only tool and is neither exported nor used. It emits **English task
strings** (`GraphConsolidatorOutput.tasks: List[str]`, `src/constants/agents.py:127-128`), which a
*different* agent holding the write tools (`kg_agent.py:479`, `:513-546`) free-interprets into
graph mutations. There is no structured operation format, no dry-run, and no approval step — the
code comments the gap itself at
`src/core/layers/graph_consolidation/graph_consolidation.py:125-126`.

Its two modes also contradict each other: the atomic prompt forbids merging event nodes
(`prompts/janitor_agent.py:216`) while the consolidator prompt instructs merging semantically
equal ones (`:99`).

### Against our ADR-0020 (resumable long jobs) — they fail it, instructively

- **Input bounded:** partially. Relationship batches of 20
  (`graph_consolidation.py:53`, `:80-83`); vector search `k=3`; read-merge cap 20. Reasonable.
- **Iterations bounded:** no (the dead `recursion_limit` above).
- **Resumable: no.** Batch progress lives in local variables (`:93`). The Redis relationship set
  and pending counter are deleted **only on full success** (`ingestion.py:964-965`), so a crash
  strands them. Per-task failures are swallowed and skipped (`:141-146`) with no dead-letter and
  no retry.
- **Idempotent re-run: no.** With `task_acks_late=True` (`workers/app.py:93`), a worker loss
  redelivers and restarts from batch zero — **re-applying natural-language mutations that are not
  idempotent.**

This is a clean textbook instance of the ADR-0020 anti-pattern, and a good one to cite: killed at
80%, it persists nothing, and on redelivery it re-applies. Our `daily-distill` /
transcript-promote shape is the correct answer to exactly this.

---

## 8. MCP surface — and the Task 233 problem

**Five tools, all read-only** (`src/services/mcp/main.py`): `traverse_graph` (`:231`),
`search_memory` (`:272`, raw query passthrough), `search_semantically` (`:303`),
`list_brains` (`:328`), and `get_search_operation_instructions` (`:168`). Transport is streamable
HTTP, stateless (`:65`, `:82`); stdio only via a separate Rust bridge or, per the README, a
third-party npx adapter.

**There is no write tool.** No `remember`, no `ingest`. An agent connected over MCP can read the
brain but must use a separate REST integration to record anything. For an "AI memory for agents"
positioning, that is a structural hole.

**There is no nudge mechanism — and this is the Task 233 datum.** Verified absent: `FastMCP` is
constructed without `instructions=` (`:65-80`, `:82`); zero `mcp.prompt` / `mcp.resource`
registrations; no sampling hook, no system-prompt injection, no tool-result trailer. The one file
containing real directive text (`src/services/mcp/prompt.py:62-79`) is referenced **only by
tests** (`tests/test_chatbot_mcp_prompt.py`) and targets an internal text-JSON tool protocol, not
the MCP wire.

Their only recall-guidance surface is `get_search_operation_instructions` — a **pull-based
manual**: it describes the recommended search workflow, but the model only sees it if it already
decided to consult memory. That is strictly weaker than our gated cheap-index pointer hint
(ADR-0024 / Task 233), because it cannot fire on the turn where the model didn't think to look.

**Security note, since it bears on whether any of this is borrowable:** `search_memory` is
described as read-only but nothing enforces it on the default backend. PostgreSQL paths validate
(`src/lib/postgresql/read_query.py:14-26`, enforced at `graph_store.py:362`); the **Neo4j path
passes the string straight to the driver** (`src/lib/neo4j/client.py:50-55`) with no Cypher
equivalent. Since Neo4j is the code default (`config.py:524`) and the shipped compose runs it, the
default deployment exposes destructive Cypher to any token holder. Additionally the PAT check uses
non-constant-time `==` and re-reads all brains per call (`src/services/mcp/utils.py:16-33`), and
the OAuth consent form has no CSRF token (`main.py:108-119`).

---

## 9. Operational reality check — the positioning datum

| Dimension | BrainAPI | The kit |
|---|---|---|
| Services to run | **10 containers** in the shipped compose (nginx, redis, neo4j, etcd, minio, milvus, mongo, api, worker, mcp) | **Zero** — markdown + SQLite in-repo |
| Declared memory | **~22 GB** of `mem_limit` across the compose | Process-local |
| Database license | **Neo4j Enterprise**, requiring license acceptance (`example-docker-compose.yaml:55,67`) | None |
| Broker | Redis mandatory (Celery); no alternative default | None |
| LLM | Cloud effectively required — the small-model client is **hardcoded to Vertex AI** (`src/lib/llm/client_small.py:57-67`) | Optional Haiku; local ONNX embedder |
| Local/offline | Documented but **disclaimed by the repo itself** (`.env.example:149` notes tool-calling incompatibility), corroborated by a whole malformed-tool-call recovery scaffold in `invoke_loop.py:296-312` | Fully local path is the default |
| Build cost | 11 spaCy models + 2 sentence-transformers baked into the image, unconditionally (`src/constants/spacy_models.py:1-13`) | ~258 MB optional embedder |
| GPU | Not required (CPU torch wheels, `Dockerfile:28-33`) | Not required |

**Leanest supported footprint is much better than the compose suggests** — and notably,
`.env.example:143-145` already ships the lean combination (`networkx` + `postgresql` +
`postgresql`), which **contradicts the compose file**. That collapses Neo4j + Milvus + etcd +
MinIO + Mongo into one PostgreSQL, giving a practical floor of PostgreSQL + Redis + API + worker.
No compose file for that configuration is provided.

**Test maturity:** 14 test files, covering plugins, tracing, MCP OAuth, spaCy fixes, and
refactors. **None** test extraction quality, graph writes, consolidation, or retrieval
correctness. There is no evaluation harness and no benchmark of any kind in the repo.

---

## Relevance to the kit

### ADR-0023 — does anything here clear the DEFER re-open bar? **No. Not close.**

The bar is explicit and numeric ([ADR-0023](../adr/0023-graph-recall-activate-edges-defer-derivation.md)
clause 2): *extend the Task-99 benchmark with a relational/multi-hop qtype from the real corpus;
if flat hybrid + the agentic ladder scores **materially below** the exact/paraphrase qtypes, then
evaluate `cues:` first — numbers decide (D-109).*

**BrainAPI supplies no numbers.** No evaluation harness, no LoCoMo run, no retrieval-quality test,
no published comparison against a flat baseline. It cannot move a numbers-gated trigger, and I
want to be strict about that: a cool mechanism is not evidence, and the trigger was written
precisely to stop mechanism-admiration from re-opening a settled deferral. **The DEFER stands
unchanged.**

Worse for the re-open case, the dive is mild **counter**-evidence. Their multi-hop retrieval is
confined to a single extraction call by `flow_key`, unranked, and depth-fixed at 2 — so even the
field's most credible graph implementation does not demonstrate a relational win our hybrid
baseline (R@5 0.941 / paraphrase 1.000) is losing. And their unbounded LLM-generated edge-type
vocabulary is a live instance of exactly the drift hazard ADR-0023's REJECT clause names.

**What it legitimately informs (design input for when the trigger *does* fire):** if `cues:`
derivation is ever evaluated, the **event-hub reification** is the mechanism worth understanding.
BrainAPI's extra hop is not bought by better search — it is bought by *making the action a node*.
That reframes the `cues:` question from "what edges connect these facts" to "is there an implicit
event both facts point at." Conceptually useful; not a trigger.

### Task 95 (curation engine) — one strong lesson, mostly cautionary

Their consolidation pass is the closest analogue to Task 95, and it fails in three ways we should
design against explicitly:

1. **Propose-then-execute across an LLM/LLM boundary with natural language as the interface**
   (`graph_consolidation.py:103-140`) — no structured op format, no dry-run, no approval. Their
   own code comments the missing review step. **Our conflict-queue "reviewable, not silent" posture
   is the right call, and this is fresh evidence for it.**
2. **Session-scoped input only** — it can never sweep the accumulated corpus, which is the entire
   point of a curation engine. Task 95 must operate over the landed corpus, not the current turn's
   writes.
3. **Not resumable, not idempotent** — the ADR-0020 anti-pattern in full (§7 above).

The one genuinely good idea: their atomic validator returns a **three-way** verdict —
*corrected-by-me*, *rejected*, *needs-a-new-node* — rather than a binary accept/reject. The third
branch (the validator may declare that a missing entity must exist for the assertion to be
well-formed) is a shape our conflict queue does not have and might want. That is a **borrow
candidate at the conceptual level** (see below).

### Task 66 (temporal) — we are ahead; one concrete anti-pattern to test against

Nothing to borrow. Their model is a single free-form `happened_at` string with no bi-temporal
split, no expiry, no supersession walk. The `DD/MM/YYYY`-written / `fromisoformat`-read /
`except: pass` chain (§5) is a **perfect regression-test target for Task 66**: a temporal field
that is written on every capture, parsed by exactly one consumer, and silently degrades to a
constant when the formats disagree — with no test covering it. When Task 66 lands, it should have
an explicit test that a malformed or foreign-format timestamp **fails loudly or is normalized at
write**, never silently scores as "now."

### Task 233 (recall nudge) — confirmation that nobody has solved this

BrainAPI has our exact problem and has not solved it: five MCP tools, no server `instructions`, no
prompts/resources, and a **pull-based** instructions tool that only helps a model already
inclined to look. This is another data point for ADR-0024's tally — the field converges on
judgment-pulled recall not because it is optimal but because the MCP surface offers no good push.
Our gated cheap-index pointer hint remains ahead of what ships here.

### No-server positioning — strengthened

Ten containers, ~22 GB, Neo4j Enterprise, a hardcoded Vertex dependency for the model every agent
uses, and a documented-broken local path, in exchange for a two-hop unranked neighborhood
retrieval. **The capability delta over our markdown + SQLite does not remotely justify the
operational delta.** This is the sharpest server-cost comparison in the corpus so far, and it
belongs in the positioning argument alongside the D-64 no-server class.

---

## Borrow candidates (ideas only, license-clean)

All three are **concepts**, independently implementable; no code, prompt text, or schema is taken.

1. **Reify the action, not just the relation** — *conceptual, parked behind ADR-0023's trigger.*
   The insight worth keeping: making an action a first-class node is what makes a second hop
   semantically meaningful. If `cues:` is ever evaluated, the question to ask is "is there an
   implicit event these facts share," not "what edges connect them." **Not actionable now** — the
   DEFER trigger governs.
2. **A three-way validator verdict for the conflict queue** — *candidate input to Task 95.*
   Rather than accept/reject, allow a third outcome: *this assertion is well-formed only if a
   missing entity exists.* Their pipeline uses it to let the checker request node creation. Our
   analogue would be a queue entry that names a prerequisite rather than a conflict. Worth
   evaluating when Task 95 is designed; not a task today.
3. **Per-ingest cost accounting printed at the boundary** — *cheap, unglamorous, genuinely good.*
   They compute tokens and dollars per document, including cost-per-character
   (`auto_kg.py:195-216`). Our auto-extract Haiku path has a token cost nobody sees. A per-capture
   cost line in the extract log would make the budget conversation empirical. **Smallest, most
   immediately useful idea in the repo.**

## Reject candidates

| Rejected | Reason |
|---|---|
| The whole architecture | 10 services and Neo4j Enterprise for two-hop unranked expansion; ADR-0002 + the D-64 no-server class settle it |
| LLM-generated free-form edge types | Unbounded type vocabulary interpolated straight into the query — the exact drift ADR-0023's REJECT clause names |
| `flow_key`-style batch-scoped traversal | Confines multi-hop to one extraction call; would reproduce their cross-document blindness |
| Natural-language handoff between a proposing and an executing agent | Unstructured, unvalidated, non-idempotent; our reviewable conflict queue is strictly better |
| Validation that reports after writing | Reads as a gate, behaves as a logger — worse than no gate, because it implies a guarantee it does not provide |
| Their append-only framing | The claim is contradicted by `MERGE`-on-name, `SET`-overwrite, and real deletes; our supersession/tombstone model is the honest version |

---

## What I could not verify

- **Retrieval quality.** No benchmark exists in the repo and the code was not executed, so I
  cannot say how well the two-hop expansion answers real questions — only what it structurally
  can and cannot reach. My claims are about mechanism and reachability, not accuracy.
- **Cost per document as a number.** The instrumentation is real; no measured figures ship.
- **Whether `flow_key` chaining is broader at runtime than it reads.** My conclusion that
  traversal cannot cross extraction calls follows from the join condition plus per-tool-call key
  generation. If the Architect emits many relationships in one tool call, the reachable subgraph
  is correspondingly larger. I could not measure typical batch size without running it.
- **The `lightweight` path end-to-end.** I traced that it skips the Janitor entirely
  (`architect_agent.py:640`) but did not read its full divergence.
- **The TUI, console, Rust MCP bridge, and plugin registry.** Out of scope; the npm/PyPI packages
  were not fetched. The `brainapi-tui` install path is **README-ONLY** here.
- **Whether the cloud product matches this repo.** BrainAPI Cloud may run a different or newer
  pipeline; this dive describes `2.14.2-dev` at commit `af5c778` only.
- **The PostgreSQL/NetworkX backend in depth.** I confirmed API parity on the event-centric query
  (`networkx_client.py:950-973`) but read the Neo4j implementation as the reference, since it is
  the code default.
