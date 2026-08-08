# Memory lifecycle map — intent vs. code reality (every edge where memory can be lost, duplicated, or blocked)

> **Why this file exists.** The 2026-06-04 cut-gate run kept surfacing the same
> class of bug one at a time: *a designed invariant the code doesn't actually
> enforce — surfacing as silent data loss, duplication, or a blocked write at a
> composition boundary.* `design.md` describes **intent**; this map pins intent
> against **code reality** at every stage a piece of memory passes through, so the
> whole class is visible at once instead of discovered conversation-by-conversation.
> Built by reading the code at each edge on **2026-06-04** (commit after D-54).
> When you change a lifecycle module, update the matching row in the SAME batch.

Legend: ✓ intent matches code · ✗ gap (design says X, code does Y) · ~ partial / logged-but-lossy · ? unverified (needs an audit pass).

---

## The flow (one fact's journey)

```
                      ┌─ user states it ──────────────┐
                      │                                │
  conversation turn ──┤                                ▼
                      │                   auto-extract (Haiku, Stop hook)
                      │                     │ trust routing:
                      │                     ├─ HIGH   → MEMORY.md (Active Threads)
                      │                     ├─ MEDIUM → queues/review.md  (waits for you)
                      │                     └─ LOW    → DISCARDED (no trace)
                      │
                      └─ explicit: cmk remember
                            ├─ terse → MEMORY.md bullet
                            └─ rich  → context/memory/<type>_<slug>.md (fact file)

  MEMORY.md (2500B cap) ──95%──> consolidate(): drop L/M >14d (HARD-DELETE)
       │                                          high-trust NEVER dropped
       │                          still over cap → CAP_EXCEEDED (write REJECTED)
       │
       └─ (graduation: durable → fact file) ……… UNBUILT

  fact files ──reindex──> .index/ (FTS5) ──> cmk search
  scratchpads ──seed-strip, per-tier cap, tail-drop──> inject (10KB) ──> session

  SESSIONS (parallel diary):
  turn ─L1 mask─> transcripts/{date}.live.md (gitignored) ─L3 judge─> transcripts/{date}.md (screened, durable, never pruned)
  turn ─buffer──> now.md ─compress(Haiku)─> today-{date}.md ─(truncate now.md)
  today (≤7d) ─distill(per-day)─> today-{date}.distilled.md (gitignored) ─assemble─> recent.md (4096B cap, drop-oldest-first)
  today (>7d) ─curate─> archive.md (4096B) ─then UNLINK the today file

  IMPORT (Task 225 — pre-kit history enters the same diary):
  ~/.claude/projects/<slug>/<uuid>.jsonl ─extract─> transcripts/imported/<uuid>.md (gitignored raw floor, never indexed)
        └─summarize(backend, privacy-in-prompt) ─L1 mask + screen(216)─> today-{date}.md (same day-file writer, provenance marker)
  imported-sessions.md (committed ledger) = the resume/idempotency artifact (survives curate's rotation of the day files)
```

---

## Write-path step: linking (Task 262)

Every fact-file write now has one more step between "the body is screened" and "the file is written": the incoming body is scored against the live **same-tier** fact corpus and, above a floor **derived from that corpus**, up to **3** `related:` slugs are put on the new fact's frontmatter. A near-duplicate is *not* linked — it becomes a merge proposal in `queues/conflicts.md` — and below the floor nothing happens.

```
  writeFact: <private> strip → Poison_Guard → PII mask
                 │
                 ├─ LINKING (Task 262, flag: memory.link_facts, default on)
                 │    score vs live same-tier facts (jaccard | cached cosine)
                 │      ├─ >= near-dup ceiling → conflict queue proposal (NOT a link)
                 │      ├─ >= derived floor    → related: [≤3 slugs]  + audit `auto-linked`
                 │      └─ below floor         → nothing
                 │    (no index / no floor / any failure → write UNLINKED — capture > linking)
                 ▼
  context/memory/<type>_<slug>.md  ──reindex──> edges table ──> cmk links / expand
```

Three properties that matter to the lifecycle:

- **The write path is backward-only.** A fact can only link to what the index already held when it was written, so a fresh corpus links sparsely and gets denser as it grows.
- **`cmk autolink` is the symmetric catch-up** over facts written before the mechanism existed — bounded, resumable, and idempotent, with the resume point derived from the artifacts (`related:` in the markdown, or a `link_eval` row in the rebuildable index).
- **The floor is recomputed at index time**, so it tracks the corpus rather than freezing a number from whenever the feature shipped.

See design §9.7. The AFTER measurement (research note, 2026-08-08) shows the automatic edges do **not** yet match hand-placed ones on the Task-262 fixture — the mechanism ships, the default-on posture is under review.

---

## Write-path variant: the extraction fallback (Task 242)

The capture edge has a second, degraded path. When automatic extraction fails for **any** reason, a deterministic no-LLM pass over the user's turn produces candidates instead of the turn being dropped. It joins the same lifecycle at the **routing** step rather than bypassing it: medium-trust candidates go to `queues/review.md` exactly as medium-trust LLM candidates do, and every write still passes Poison_Guard. The only lifecycle difference is provenance — these carry `write: auto-extract-fallback`, so a later curation pass (and the learn-loop) can tell a heuristic capture from a real extraction. Content is constrained to mission context; kit-operational noise is filtered before any write. See design §6.4b.

## Repair path: memory that already left the flow (Task 248)

Two edges of this map could, before v0.6.3, drop a fact **outside** the lifecycle entirely — not lost, but unreachable by every downstream stage:

- **Write → wrong tier.** Pre-v0.6.2 the capture hooks resolved the project root as the agent's raw cwd, so a subdirectory cwd forked a [[Stray tier]] and the fact entered a `context/` nobody reads. The write succeeded; every later edge (index → recall) ran against a different tier. Task 246 closed the fork; **Task 248 pulls the stranded facts back onto the flow** — `cmk install` copies them into the root tier byte-identically (ids + `created_at` preserved), collision-skipping anything already here (including tombstones, so a `forget` is never undone), then reindexes. The husk stays; the user deletes it.
- **Fact file → index.** A fact whose frontmatter has no valid id is skipped by `index-rebuild` **without a checkpoint**, so it is re-read and re-skipped on every boot — invisible to recall forever, at a recurring cost (D-394). Task 248 repairs it in the same pass: the id is recomputed from the body (ids are content-addressed, so this is deterministic), or the file is quarantined bytes-intact if it can't be.

Both are ✓ **repair**, not new lifecycle stages: they re-enter the fact at the `reindex` edge, and neither ever deletes. See design §13.2.

**A third drop-out on the same edge, closed by PREVENTION rather than repair (Task 257, D-403).** `Fact file → index` had a second way to fail: a leading UTF-8 BOM (a Windows editor / PowerShell 5.1 `Set-Content -Encoding utf8` hand-edit) made `frontmatter.parse` read the file as "no frontmatter", so the fact dropped out of **every** downstream stage — index, recall, snapshot, `INDEX.md`/`MAP.md`, edges — while sitting untouched in the tier. Unlike the two above this one needed no repair pass: the parser now tolerates the BOM (design §4, "The input boundary"), which puts the fact back on the flow the moment the fix lands, and `format` never re-emits it, so the file heals on its next legitimate rewrite. It also closes a **write-edge** hazard the same blindness created — `writeFact`'s "refusing overwrite" collision guard could not see a BOM'd file, so a later capture landing on the same `<type>_<slug>.md` overwrote it.

## Edge-by-edge: intent vs. code

| # | Edge | Trust gate | Cap | Dedup | On evict/overflow | Intent vs code |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **capture → route** (auto-extract) | H→mem, M→review queue, L→discard; assistant-origin demoted 1 level | — | within-call, **canonical-ID (literal only)** | **LOW discarded → `low_trust_discarded` trace in extract.log** | ✅ G6 fixed (Task 92, D-67): drop logs excerpt+reason; literal dedup still misses rewordings (G5) |
| 2 | **explicit `cmk remember`** | terse→bullet, rich→fact file | bullet hits MEMORY.md cap | fact: by-ID; bullet: scratchpad | n/a | ✗ **no cross-store dedup** → bullet + fact file double-capture (G3) |
| 3 | **route → MEMORY.md** (appendScratchpadBullet) | high only (from auto-extract) | **2500B**, trigger 95% | none at append | consolidate, then CAP_EXCEEDED | ✗ no append-time content dedup |
| 4 | **MEMORY.md consolidate()** | drops **L/M only** | runs only on cap-trip | none | **HARD-DELETE, no tombstone** | ✗ violates §6.5 tombstone rule (G2) |
| 5 | **MEMORY.md → fact file (graduation)** | high-trust only | cap-pressure trigger | cross-store by content-id (writeFact) | bullet removed from hot index | ✓ **BUILT — cap-pressure safety valve, transactional** (Task 91, shipped PR #113) — project MEMORY.md only, search-only (recall = Task 75); user-tier graduation still deferred |
| 6 | **high-trust supersede** | high ≥ high = "supersede" | — | — | **"continues to normal append"** | ✗ stale highs coexist forever (G4; design line 1956 admits "drops by AGE not VALIDITY") |
| 7 | **fact file store** (write-fact) | — | **none** | by-ID, refuse-overwrite on id-mismatch; reindex after | n/a | ~ correct dedup, but **unbounded** (disk-only, search-only) (G10) |
| 8 | **fact/scratchpad → index** (FTS5) | — | — | — | — | ✓ index can be transiently stale (consolidate() doesn't reindex), but `cmk search`/`mk_search` run **`reindexBoot` (mtime+sha1 diff) BEFORE querying** → no user-visible stale hit (G9 verified NOT a gap, 2026-06-04) |
| 9 | **inject snapshot** (inject-context) | seed-strip (zero-sha1) | **10KB total + per-tier** | by bullet-ID | **importance-ordered `## ` section-drop** (lowest-value first; logs NDJSON) | ✅ G7 fixed (Task 93, D-66): drops lowest aggregate-trust/oldest section first, not tail. _Total-cap fallback still tier-tail (v-next)._ |
| 10 | **turn → transcript** (capture-turn → live buffer → L3 judge → committed) | — | **none** | — | — | ✓ durable, **never pruned** (the recovery backstop). **Task 148 (ADR-0019): no longer verbatim** — each turn is L1-masked (email/phone/username) into the gitignored `{date}.live.md`, then the async L3 privacy judge screens it into the committed `{date}.md` (fail-closed: judge down → stays in the buffer, never an unscreened commit). |
| 10b | **capture/fact write → L1 privacy mask** (pii-patterns) | — | — | — | — | ✅ Task 148.1/148.2 (ADR-0019): every commit-eligible write (transcript turn, `cmk remember`/`mk_remember`, fact body/title) is masked BEFORE hash/dedup/disk; each redaction → gitignored `redactions.log` (recoverable). Kill-switch `privacy.screen: off`. |
| 10c | **fact candidate → sensitivity route** (auto-extract) | — | — | — | **`drop` → `sensitivity_drop` (no text); `local-only` → gitignored `context.local/private.md`** | ✅ Task 148.5 (ADR-0019): the classifier's privacy axis diverts sensitive facts off the committed tier (and off the review queue) — `commit` is the default; an unrecognized value routes `local-only`, never a silent commit. |
| 10b | **git history → today** (backfill.mjs, Task 174, v0.6.1) | a day with commits but NO session log — the capture path missed it entirely (crash, hook misfire, a day worked in another tool) | bounded: a `windowDays` lookback + `maxPerRun` slice, so a long-neglected repo cannot stall the cron (ADR-0020) | idempotent — a day already backfilled is not a gap | **writes `today-{date}.md` from that day's commits**, stamped `BACKFILL_MARKER` so a reconstruction is never passed off as a captured session | ✓ honest by construction — a REAL log always wins (re-checked immediately before write); a failed summarize writes NOTHING rather than a half-truth |
| 11 | **now.md → today** (compress-session — fired by THREE triggers: `SessionEnd`, the SessionStart-lazy roll, and `PreCompact` (Task 235, v0.6.1 — the only one that fires DURING a long session; `SessionEnd` fires only on a clean window-close, so a marathon session had no in-session trigger at all)) | — | — | — | **truncate now.md to 0** after Haiku summary | ~ raw turns dropped from now.md (survive in transcript); summary lossy (Task 84 hallucination class). **Task 148 (review I1): the committed `today-{date}.md` is privacy-screened** — the compress prompt keeps names/PII out of the summary + the OUTPUT is L1-masked before the committed write (now.md itself carries L1-masked prose; tool output never enters now.md). |
| 12 | **today >7d → archive** (weekly-curate) | — | **archive 4096B, recent 4096B** | Haiku semantic + deterministic | **UNLINK the today file** | ~ session history >7d = lossy-Haiku into a 4KB cap + **source deleted** (G8) |
| 13 | **queues** (review / conflicts / persona-review) | — | **none** | by-ID (persona) | — | ~ leave only via user action; **never auto-pruned**, unbounded (G10) |
| 14 | **forget → tombstone** (forget.mjs) | — | — | — | **moveFactToTombstone** (deleted_at, recoverable) | ✓ correct — the contrast that makes edge #4 inconsistent |
| 15 | **user tier** (USER/HABITS/LESSONS) | recurrence-gated (Task 151: recurrence ≥3 OR confidence=high) | per-file 1375/1800/1800 | by-ID | same consolidate() (high never dropped) | ✓ **DEMOTE-NOT-EVICT (Task 151.4, v0.4.3)** — at cap the persona **condenses in place** (drops no bullet), never graduates a promoted trait out to un-injected `fragments/`; the file may grow past the inject budget (load-cap, not write-cap) and the importance-aware load-cap keeps the high-trust slice injected. _Fixes the old graduation-absent write-lock (Hole B) that stranded promoted traits at cold-open._ |
| 16 | **declared expiry** (expiry-sweep.mjs + search filter; Task 66.3, v0.4.4) | any trust — the WRITER declared the end (`--expires` / `mk_remember expires` / auto-extract `expires:` for stated dates only) | — | — | **read-time: hidden from search** (`--include-expired` reveals, human-only like tombstones) **+ weekly-curate sweep: tombstone via forget()** (audited `expiry-sweep`, recoverable) | ✓ correct by construction — reuses edge #14's tombstone path, never hard-deletes; DISTINCT from edge #4's staleness drop (declared-validity-end vs age; an expiry never renews on access). D-258 |
| 17 | **temporal supersede** (temporal-sweep.mjs → validity-window.mjs; Tasks 66.4+66.2 v0.4.4, **cadence widened Task 198 v0.4.5**) | State-shape facts only; verdict by a batched Haiku judge (10/10 twice on the real corpus, D-259). **Runs at EVERY Haiku site — SessionEnd + SessionStart-lazy + weekly backstop (Task 198/D-266)**, not weekly-only, so a stale pair closes by the NEXT session boundary (was ≤7 days). Candidates: FTS OR-query, or **title-embedding KNN θ=0.80 when semantic/hybrid (198.2)** | MAX 20 pairs/sweep (overflow counted, re-derived next pass — never silent); idle = no-new-facts short-circuit → zero Haiku | DUPLICATE verdict → `recurrence_count` bump (the 151 signal) | **SUPERSEDES → close the older window** (`ended_at` = newer `created_at`, event-time; `status: completed`; move to archive/superseded/ — edge #14-style, never delete) + trust dampen (151.8) + a one-line SessionStart mention | ✓ **closes G4** (stale highs coexisting forever — the D-166 Bug-2 class): the drop-by-age-not-validity gap now has a validity mechanism, tightened to per-session so the misleading window is a boundary not a week; COEXIST pairs stay untouched (D-221 closed negative — latest-wins, no tension-holding) |
| 18 | **recall-log** (recall-log.mjs; Task 190, v0.5.0) | every inject + search appends `{source, ids}` — zero-result queries log too (a MISS is a judge signal) | best-effort append, never throws (hook safety) | — | gitignored `.locks`-class diagnostic — IDs + query only, never bodies | ✓ correct by design — attribution plumbing, not memory; losing the log loses only attribution, never a durable fact |
| 19 | **expectation → judgment evidence** (expectations.mjs → judgment.mjs; Task 191, v0.5.0) | pre-registered `PREDICTION:` lines resolve to append-only `judgment_*.md` evidence entries | — | one judgment file per method-slug (evidence accretes, never rewritten) | judgments NEVER rank or auto-pick — provisional → corroborated/contested; a HIT/MISS/REVERSAL cycle → contested → surfaced to the user | ✓ correct — the earned-not-asserted posture (ADR-0017; the §5 scale-floor honored) |
| 20 | **outcome signal → search rank** (trust-signal.mjs → search.mjs blend; Task 194, v0.5.3) | every APPLIED signal increments `signal_count` (the feedback counter); the facts-scope search rank blends `bm25 × (1 + λ·(trust_score − 0.5))` ONLY at `signal_count ≥ 3` — evidence-gated; judgments (`judgment_*.md`) never blend; restatement/recurrence deliberately never counts as evidence | rank adjustment bounded ±22.5% (λ = 0.5) — separates ties, never leapfrogs a strong match | — | a dampened row is **re-ranked, never dropped** (demote-not-evict at the result list); overlay posture (D-237): full reindex resets score + counter — the gate then honestly says "no evidence" | ✓ closes the learn-loop's last edge (MEASURE→RETRIEVE, ADR-0017 Phase 2); inject UNTOUCHED (enum-ordered, §20.3 — structurally pinned) |
| 21 | **survival gate → prune queue** (trust-signal.mjs → prune-queue.mjs; Task 194, v0.5.3) | an applied dampen on an ALREADY-floored fact ("floored + still failing") routes a prune-candidate to `context/queues/prune-review.md` — automatic, audited, idempotent (preservational queue = never re-nag) | — | by-ID against the whole queue (pending + resolved) | **NEVER silent-delete** — resolution is the user's: `convert` (→ typed `anti-pattern` warning, retained + injected via bullet/§ Anti-patterns), `forget` (edge #14 tombstone; shape-aware — bullets via memoryWrite remove), `keep` (vouched, dismissed for good) | ✓ ExpeL prune-at-zero, demote-not-evict flavored; the anti-pattern conversion keeps the failure as a cautionary example (Memento/REMEMBERER) |
| 22 | **state → recall serialization** (state-label.mjs; Task 209, v0.5.3; label upgraded Task 232, v0.6.3) | every fact reaching Claude (search / get / snapshot) carries its temporal state where ≠ current — `[superseded by P-XXXX]` (Task 232 names the successor) / `[expired]` / `[retracted]`, a PURE projection of superseded_by / expires_at / deleted_at (no LLM, no DB on inject) + a one-line envelope instruction when a labeled row is present | — | — | LABELS only — never re-ranks, never mutates; current facts stay unlabeled (zero noise; a stateless snapshot is byte-identical) | ✓ closes the A-TMA "ghost memory" QA gap: the kit stored state but never told Claude at recall time; the bank/retrieval/QA diagnostic lives in HEALTH-CHECKS.md |
| 23 | **query state view → retrieval bias** (query-state-view.mjs; Task 211, v0.5.3) | a rule-based classifier (hint catalogs + negation guard, zero LLM) tags each facts-scope query current/historical/transition/neutral; historical/transition auto-include expired rows + strip the consumed hint words from the FTS query; historical buckets labeled rows FIRST (stable partition, not a score change) | — | — | READ-time routing only — never mutates; current/neutral byte-identical to the default pipeline (incl. explicit `--include-expired`) | ✓ the retrieval-side half of the A-TMA pair (edge #22 is the QA side): a history question now REACHES the history without flags; §16.18's 7-mode classifier stays deferred — this is the 4-view cut its evidence un-deferred |
| 20 | **judge → trust delta** (judge-signals.mjs → trust-signal.mjs; Task 192, v0.5.0) | 4 deterministic detectors (tool-result ±, correction −, re-ask −, silent-success weak-+); watermarked so signals measure evidence, not turn cadence | — | — | all deltas route through edge #21's screen — no direct-mutation path | ✓ correct — no LLM self-grading in the loop (the self-judge-circularity line) |
| 21 | **feedback-screen** (feedback-screen.mjs; Task 193, v0.5.0) | rate-limit per fact + burst-hold on systemic events (a broken suite can't tank every fact at once) | trust floor 0.05 — decay can NEVER delete | — | quarantined/rate-limited deltas logged; every delta audited | ✓ correct — the loop's own Poison_Guard, built BEFORE the judge could emit a signal (ADR-0017 Phase-1 ordering) |
| 24 | **redact — the compliance scrub** (redact.mjs; Task 96, ADR-0022, v0.5.5) | human-explicit only (`cmk redact <id> --pattern`) — scrubs a leaked span from live + tombstone + superseded + scratchpad bullet + indexes, frontmatter-aware, in-band reindex | — | idempotent (0 occurrences on re-run is success) | **SPAN-replace, never delete** — the fact + a secret-free audit entry survive; git history untouched (rotate-first + filter-repo advisory printed; ADR-0022) | ✓ the only edge that can touch an ARCHIVE copy's content — deliberately: a tombstone preserving a secret verbatim is the compliance gap it exists to close |
| 25 | **purge --hard — the irreversible delete** (redact.mjs; Task 96, ADR-0022, v0.5.5) | human-explicit only, double-flagged (`--hard --yes`), CLI-only/never-MCP (§6.5) | — | — | **the ONE sanctioned hard-delete**: live + every archive copy + bullet lines + index rows gone, NO tombstone; audit survives | ✓ the deliberate exception that proves edge #14's rule — every other delete tombstones; this one is the documented compliance escalation |
| 26 | **deletion propagation — the cascade check + forward filter** (deletion-propagation.mjs; Task 210, D-308, v0.5.5) | for each tombstoned fact, verify the retraction reached every DERIVED surface (index + `recent.md`/`archive.md`/`today-*.distilled.md`; raw `today-*.md` sources excluded — no scrub reaches them, they age out via the roll); a `daily-distill` FORWARD filter span-replaces already-tombstoned content (at bank AND at assembly) before writing a new summary | bounded (DEFAULT_MAX_FACTS); truncation surfaced on both exits | check is report-only (report-first: HC-12 names survivors, scrub routes to edge #24/#25 or a re-distill) | **REPORT, never edit** on the check side; the forward filter SPAN-REPLACES tombstoned spans in a fresh summary with `[deleted]` (live facts + citations on the same bullet survive — counted in the distill log, never silent) | ✓ closes the derived-layer cousin of G2 — edge #14 tombstones the fact but nothing verified the cascade to summaries distilled BEFORE the forget (the Always-On survey's #1 field gap). The forward path closes the window going forward; the check surfaces the legacy survivals a scrub still owes |
| 27 | **markdown edges → relational recall** (graph-index.mjs; Task 232, ADR-0023, D-392, v0.6.3) | at reindex, `related:` frontmatter + `[[slug]]` wikilinks + the `superseded_by` chain (incl. `archive/superseded/` predecessors) build a rebuildable `edges(src, dst, type, dst_resolved)` table — drops + rebuilds byte-stable from markdown alone (ADR-0002), wholesale (cross-file slug resolution), zero LLM | — | derived from markdown; the source-of-truth edges stay in the fact files | READ-only recall axis (`cmk links` / `mk_links`): backlinks + supersession-chain CTE + `related` surfaced on `get`; never mutates a fact | ✓ ACTIVATES the two edge kinds the kit already WROTE but never traversed (D-219) — the fourth adjacency axis (relational) beside expand/timeline/decisions; the DEFER (LLM edge derivation) + REJECT (graph-DB) halves of ADR-0023 stay out |
| 28 | **recall-trigger hybrid → pointer + advertisement** (capture-prompt.mjs `buildMemoryHint` + inject-context.mjs `buildExistenceAdvertisement`; Task 233, ADR-0024, D-362, v0.6.3) | the per-prompt hint upgrades from a static line to a REAL FTS5 OR-query over the prompt's content terms (≥20-char gate, zero LLM) — top hit clears the bm25 floor (−0.5, conservative per octopoda-OS) → ≤3 index lines (`id·title·date`, never bodies) + skill pointer; below → static. Snapshot gains ONE existence-advertisement line (fact count + scopes + last-write recency), computed WITHOUT the index-db (§20.3 pin) | hint opens the EXISTING index only (never reindexes on the hot path; never creates the DB); advertisement reserved out of the snapshot cap (§7.1.2) | — | READ-only recall SURFACE — never mutates; FAIL-OPEN (any error → the static hint, never a blocked prompt); advertisement byte-stable when memory unchanged (prefix-cache). Skill fires + hint form logged to recall.log (ADR-0024 fire-rate telemetry) | ✓ closes the D-40/D-153 under-fire risk while KEEPING judgment-pulled as the deep spine (the model still decides to search — the hint + advertisement just tell it what's there); the PreToolUse:Read 4th surface stays deferred until this slice's fire-rate is measured |
| 29 | **injection mode → snapshot shape** (inject-context.mjs `injectionModeForSource`; Task 253, design §20.9, v0.6.x) | the SessionStart payload's `source` (primary-source verified: `startup`/`resume`/`clear`/`compact`/`fork`) selects the shape — **`resume` only** swaps the STATIC tier bulk for one byte-stable pointer line (the transcript replay already carries it); preamble + existence advertisement + volatile action lines (temporal mention, commit proposal) still inject | pointer variant measured against `capBytes` and DISCARDED for the (always cap-honoring) full snapshot if it wouldn't fit (§7.1.2) | — | nothing is evicted — the bulk is not dropped, it is **already in context**; `compact` deliberately keeps the FULL snapshot (compaction SUMMARIZES prior history, so re-anchoring is right), and every other/unknown/absent source falls open to full | ✓ pure token economy on the READ surface — zero durable state touched (over-mutation-guarded); byte cost + mode land on `recall.log` per session (the Task-253 injection meter) so the saving is measured, not asserted |

---

## Consolidated gaps (the class, with severity + task home)

| Gap | What | Severity | Home |
| --- | --- | --- | --- |
| **G1** | ~~Graduation unbuilt → write-lock~~ — **project MEMORY.md graduation SHIPPED** (Task 91, PR #113; cap-pressure safety valve, transactional, search-only); user-tier graduation still deferred | shipped | Task 91 (#113) |
| **G2** | consolidate() hard-deletes L/M >14d, no tombstone (violates §6.5) | High | Task 91.2 (filed). _Its derived-layer cousin — a tombstoned fact surviving in a distilled summary — is closed by **Task 210** (edge #26): forward filter + HC-12 report._ |
| **G3** | No cross-store dedup → bullet + fact-file double-capture | High | Task 91.1 (filed) |
| **G4** | high-trust "supersede" just appends → stale highs coexist forever (drop-by-age-not-validity) | Med (v0.3) | F-D + temporal-validity §16.18 |
| **G5** | within-call dedup is literal canonical-ID; reworded restatements slip | Med (v0.3) | F-D (semantic dedup) |
| **G6** | LOW-trust discarded at capture with no trace/log of the content | Med | ✅ **Task 92** (shipped 2026-06-05, D-67) — `low_trust_discarded` excerpt+reason trace to extract.log (log-only); extract.log gitignored (raw un-screened excerpts). |
| **G7** | inject tail-section-drop omits real facts (logged) by tail-order, not importance | Med | ✅ **Task 93** (shipped 2026-06-05, D-66) — `truncateTierToBudget` evicts lowest-value section first (trust→recency→tail tiebreak); strict generalization of tail-drop. _Follow-up: total-cap fallback still drops whole tiers persona-first (v-next)._ |
| **G8** | session >7d: lossy-Haiku into 4KB archive **and source today-file deleted**; a durable fact never extracted to a fact file is gone from active memory after 7d (recoverable only via manual `cmk transcripts extract`). **SOFTENED lossy→lossy-but-TRACEABLE (Task 213, D-308, v0.5.1):** `recent.md`'s per-day `## <date>` headers (Task 204) + each `## Week of` section's deterministic `<!-- source_days: […] -->` tag now keep every consolidated claim pointing back to the raw session dates it came from (the raw transcript tier, ADR-0010, is where they resolve). The 4KB compression is still lossy; the PROVENANCE is no longer. | Med | relates Task 80 (under-capture) + Task 84 (compression) + Task 213 (provenance) |
| **G9** | ~~stale search hit after consolidate~~ — **NOT a gap (verified 2026-06-04):** `cmk search`/`mk_search` run `reindexBoot` (mtime+sha1) before every query → self-heals | — | resolved, no fix needed |
| **G10** | fact-file store + queues grow unbounded (no cap/prune) | Low | disk-only; v0.2.x housekeeping |

---

## What's actually SOUND (so the map isn't all red)

- **Explicit `forget` tombstones** (recoverable) — the right pattern; edge #4 should copy it.
- **Transcripts are a verbatim, never-pruned backstop** — nothing is truly unrecoverable as long as the transcript survives; the gaps are about *active* memory, not the raw archive.
- **Fact-file dedup by content-ID + reindex-on-write** (Task 85) — the fact store stays index-consistent on the write path.
- **Sessions caps compose** (archive/recent 4096B, per-tier inject budgets sum to the snapshot cap — the PR-25 structural fix).
- **Poison_Guard + home-path sanitization + the auto-judged privacy screen** gate every write path (not a lifecycle-loss concern, but worth noting the write edges are screened). Poison_Guard catches *secrets*; the Task-148 privacy screen (L1 patterns + L3 judge, edges 10/10b/10c) catches *personal/sensitive content* so nothing private reaches a committed tier — the transcript is screened before commit, and sensitive facts route local-only or drop. Since Task 216 (D-320) "every write path" includes the LLM-summary/promotion **side doors**: curate/distill input+output, transcript promotion (secrets-only, withhold-not-defer), the persona-review queue, and trust increases — via the shared `screenBeforeCommittedWrite()` (design §6.7.1). One lifecycle nuance: a poison-guard hold keeps content in its SOURCE tier (day files / live buffer) rather than losing it — recovery is "fix the source, the next pass proceeds."

---

## How to use this map

1. **Before adding a lifecycle invariant** (Task 91 graduation, any future cap/prune), find the rows it composes with and verify the cross-surface behavior — per the CLAUDE.md "Composition verification" rule. Graduation (edge #5) composes with #3/#4/#7/#8 — fill those `?`/`✗` before building.
2. **When you fix a gap**, flip its row ✗→✓ and note the commit, in the same batch.
3. **All `?` rows resolved as of 2026-06-04** (G9 verified not-a-gap). Fixed: G1 (Task 91 + 94, blocker), **G6 (Task 92, D-67, 2026-06-05)**, **G7 (Task 93, D-66, 2026-06-05)**. G4/G5/G8/G10 tracked under F-D / Task 80 / Task 84 / v0.2.x housekeeping.

_Verification status: read from code 2026-06-04. Relates: D-54 (graduation), design §6.x/§7.1/§8/§6.5, Task 91, F-D, Task 80, Task 84, D-38._
