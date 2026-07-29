# awrshift/claude-memory-kit — code dive (the name-twin)

**Date:** 2026-07-29 ·
**Topic:** deep CODE-read of the name-collision project that triggered our rename (ADR-0021) — our closest twin in the markdown/local/hook class ·
**Source:** <https://github.com/awrshift/claude-memory-kit> @ `a23ed45` (2026-07-17, v5.1.0), shallow clone, all 1 334 lines of shipped code read ·
**Tags:** prior-art · name-collision · hooks · capture-mechanism · staleness · curation · privacy-gap · packaging ·
**Method (D-364):** every claim below is marked **CODE** (file:line read), **README** (doc claim, not code-backed), or **PARTIAL**. Nothing is asserted from resemblance. ·
**Prior context:** [`2026-06-29-curation-cluster-code-study.md`](2026-06-29-curation-cluster-code-study.md) already settled the recurrence question for our class — this note does **not** re-litigate it, it only records where awrshift lands on the same axis.

---

## Headline

They solved a **different half of the same problem, and solved one thing genuinely better than us.**
Their whole system is a **discipline harness** — hooks that *coerce the agent into curating*, plus a
human-confirmed promotion ritual — with **zero durable-write machinery**: no ids, no dedup, no
schema, no search, no conflict handling, no secret screening, no tests, no CI. Where we built a
*storage system with hooks on top*, they built *hooks with a markdown file underneath*.

**The one thing to steal: `stale-refs.py`** — a free, deterministic detector for the failure class
we have named repeatedly (a memory entry that looks current but points at a file that moved) and
never structurally checked. Everything else is either behind us or a deliberate non-goal.

## Vitals + license posture

| | |
|---|---|
| **License** | **MIT** (`LICENSE:1-3`, © Serhii Kravchenko) → **reuse posture: techniques-with-attribution.** We may port mechanisms and even adapt code, with credit in `SOURCES.md` + the borrowing file's header. No copyleft constraint. |
| **Stars / forks / watchers** | 27 / 7 / 2 (GitHub API, 2026-07-29) |
| **Created → last push** | 2026-03-26 → **2026-07-17** (12 days before this dive) |
| **Cadence** | 53 commits in ~16 weeks; bursty release-shaped (v3.1 → v3.2 → v4.0 → v4.1 → v4.2 → v5.0 → v5.1), each burst a same-day cluster. Two contributor identities, both the same maintainer. One external PR merged (`1b098d0`, the 3-cap overflow). |
| **Size** | 178 MB repo, of which ~170 MB is `.github/assets/` PNG revision history (their own README tells you to `--depth 1` because of it). **Shipped code: 1 334 lines** — 5 hooks + 4 scripts. Everything else is markdown. |
| **Live or snapshot?** | **Live** — actively maintained, and the v5.1.0 changelog is a genuine four-pass self-audit that fixed five real bugs in their own kit. Small audience, one operator, no CI, no tests, no issue traffic (1 open issue). Live but *solo and unverified*. |
| **Shape** | A **GitHub template repo you clone as your workspace**, not a package. Claude Code only. Zero dependencies (python3 + bash). |

**Naming note:** they are the *incumbent* on the name (created 2026-03-26; their v3 line predates
our v0.1). Independent of the merits, ADR-0021's rename decision reads correct on the dates alone.

---

## Priority 1 — Capture mechanism

**Verdict: genuinely different, partly better than I expected, and the honest read is "coerced trigger + hope-grade write."**

Five hooks, wired in `.claude/settings.json:20-64` (**CODE**):

| Hook | Event | Mechanism | Grade |
|---|---|---|---|
| `session-start.py` | SessionStart | injects context via `hookSpecificOutput.additionalContext` (`:311-319`) | real |
| `periodic-save.sh` | Stop | **`{"decision":"block"}`** every N human turns (`:85-90`) | **coerced trigger** |
| `pre-compact.sh` | PreCompact | **`{"decision":"block"}`** unless MEMORY.md is fresh + under caps (`:52-57`) | **coerced trigger** |
| `protect-tests.sh` | PreToolUse(Edit\|Write) | **`exit 2`** on test-file edits (`:36-40`) | **hard block** |
| `session-end.sh` | SessionEnd | timestamp log only, *explicitly no auto-flush* (`:5-8`) | inert |

**The interesting move (CODE, `periodic-save.sh:78-90`):** the Stop hook counts *real human turns*
in the JSONL transcript and, every 50, returns `decision: block` with a reason that instructs the
agent to write MEMORY.md + a handoff + the backlog. It doesn't *do* the write — it **refuses to let
the agent stop** until it has. Same for PreCompact (`:34-39`): if `MEMORY.md` mtime is < 120 s old
**and** under all three caps, compaction proceeds; otherwise it blocks with a dynamic reason
naming the line count and staleness.

**Verified against the primary source:** both are legitimate per Anthropic's hook contract —
`code.claude.com/docs/en/hooks.md` lists `decision: "block"` + `reason` as supported top-level
output for **Stop/SubagentStop** *and* **PreCompact/PostCompact**. So the README's "physically
blocks compaction until state is saved" is **true, not marketing**.

**But two honest limits:**

1. **The write itself is hope-grade.** The hook coerces the *turn*; a model that emits a
   plausible "saved ✅" and writes nothing satisfies the block on the next Stop. There is no
   verification that anything landed — no audit log, no post-write assertion, no
   diff check. This is exactly the fabricated-tool-success class our CLAUDE.md kiro-cli
   precedent names.
2. **Their anti-loop guard rides an undocumented field.** `periodic-save.sh:21-29` reads
   `stop_hook_active` from the Stop payload to avoid re-blocking. That field is **not in
   Anthropic's documented Stop input list** (verified against the hooks doc this session) — it's
   reverse-engineered. It works today; it is not contract. *(Side finding for us: our own
   `design.md` §5.2.1 cites `stop_hook_active` as verified payload. Same undocumented field.
   Worth a separate check — flagged to the lead, not fixed here.)*

**Also:** `protect-tests.sh` is our CLAUDE.md prose rule *"fix the code, not the test"* implemented
as a `PreToolUse` **exit 2** hard block on editing any existing `test_*.py` / `*_test.py` /
`tests/` / `*.test.*` / `*.spec.*` file — with `.md`/`.txt` exempted and new-file `Write` allowed
(`:22-29`). That is a prose→enforcement graduation we have talked about and not built.

**vs us:** our Stop hook fires **every turn** and spawns a detached extractor that does the write
itself, deterministically, through Poison_Guard + dedup + audit log. Ours is structurally stronger
at the write. Theirs is stronger at the *ritual*: they coerce at the two moments where context is
actually about to be lost (compaction, long-session drift), and we do not use `decision: block`
anywhere. **Harness-over-harness posture: they have no such posture** — they *are* a Claude Code
config, so they take the harness at face value and use its native blocking. Nothing to borrow on
posture; something to consider on the two coercion moments.

## Priority 2 — Memory schema / format

**Verdict: structurally poorer than ours everywhere except one convention. Nothing to borrow on schema; one thing to respect on caps.**

The hot tier is `.claude/memory/MEMORY.md`, and the entire record format is (**CODE**,
`MEMORY-TEMPLATE.md:21-27`):

```
- [2026-04-24] user prefers plain prose for status updates, not dense tables
```

A `[YYYY-MM-DD]`-prefixed one-line bullet. That is the whole schema.

- **No ids.** Nothing addressable; nothing citable; `mk_cite`/`mk_get` have no analogue.
- **No frontmatter on hot memory** (concepts get YAML — `knowledge/index.md:28-38`: `title`,
  `status: canonical|draft|archived`, `created`, `updated`, `compiled-from: [dates]`, `tags`).
- **No dedup, no conflict detection, no trust/confidence field.** Grepped the tree: zero hits.
- **No provenance beyond the date**, except `compiled-from: [dates]` on a promoted concept
  article and `promoted-from:` in the rule scaffold (`_example.md.disabled:6`) — both
  agent-authored prose, not machine-maintained.
- **Typed records: no. Prose: yes** — with a *layer-typed* file system instead (hot bullet →
  concept article → rule), which is a coarser version of our `type:` field.

**The one real idea — the date tag is load-bearing, and they say so in enforcement language.**
`CLAUDE.md:14-33` + `ARCHITECTURE.md:141-143`: *"If you write a memory entry without a date —
you've broken the system."* It's the only key their curation ritual has (grep for "3+ distinct
dates"), so they elevated it to an invariant. We have richer provenance and don't need this — but
their corollary is sharp and we have no equivalent (**CODE**, `CLAUDE.md:29-31`): *"a stored fact
about the OUTSIDE world (a price, an open ticket, 'the client is waiting') older than ~7 days is a
hypothesis — re-check it before acting on it."* That is a **staleness class our schema does not
distinguish**: we have no internal/external-fact split and no re-verify prompt.

**The three caps (CODE, `session-start.py:45-47`, enforced `:95-104`)** — 180 lines / 32 KiB /
3 000 chars-per-line, all env-tunable. The third cap is the earned one: their changelog records a
real production `MEMORY.md` that packed **51.5 KB into 152 lines** — under a 180-line cap and
already unreadable. *Line count alone lies.* Our snapshot budget is byte-based, so we are not
exposed to their exact bug — but we do have **line-count caps in the scratchpad tier**, and the
"a single giant line passes every check" shape is one we have not tested for.

## Priority 3 — Recall / injection

**Verdict: we are ahead on every axis except one honest design lesson about staleness.**

`session-start.py` builds one string and returns it as `additionalContext` (**CODE**, `:261-319`):

1. **Discipline nudges, only when they fire** — the cap trip (`:84-115`) and the stale-ref hit
   (`:118-147`). Prepended *before* everything else so the agent sees them first.
2. **Session stats** — MEMORY.md size vs all three caps + a `!! STALE` marker at ≥5 days
   (`:194`), projects/experiments listing with a ⚠ at 30 days open (`:216`), git branch + short
   status.
3. **The newest handoff**, capped at 6 000 chars with an explicit `…(truncated — read the full
   file on demand)` marker (`:295-296`).
4. **`knowledge/index.md`** — the pointer layer to deep memory.

Budget: **20 000 chars**, env-overridable via `CMK_INJECT_BUDGET` (`:38-39`); the `add_section`
closure decrements a running `remaining` and truncates the section that crosses it, dropping the
rest (`:267-278`). Note their env prefix is literally **`CMK_*`** — a second collision surface
with our env namespace, worth knowing.

- **Search: none.** They *removed* their `/memory-query` command in v5.1 as "never earned its
  subprocess — just ask the agent" (`CHANGELOG.md`, Removed). Recall is: injected snapshot, plus
  the agent grepping `context/handoffs/` and `knowledge/concepts/` on demand. **No FTS, no
  embeddings, no ranking, no MCP tools.** Against our ADR-0024 stack (snapshot + hint + skill +
  FTS/vec) this is a full generation behind, and deliberately so.
- **Staleness handling: better-shaped than ours in one specific way** — and this is the note's
  second-best finding after `stale-refs.py`. `ARCHITECTURE.md:207-223` (**CODE-adjacent: the
  design record, and the code matches**) documents why they killed their rolling
  "next-session-prompt" file: *a stale rolling file is byte-identical in appearance to a fresh
  one* — one production instance carried phantom "open" items for **35 days**. Their fix is
  structural, not a warning: **immutable per-session handoffs, `<topic>-YYYY-MM-DD.md`, and the
  hook always injects the newest.** A note that states its own date in its own filename cannot
  impersonate today's.

  **This applies to us.** `context/sessions/now.md` and `recent.md` are rolling files with exactly
  this property — and D-298 (the 5-nights-killed cron that left `recent.md` 5 days stale while it
  still *read* as current) is **the same failure they are describing**, in our tree. We fixed the
  cron; we did not fix the *looks-current* property. They also injected an age marker into the
  render (`human_age()` + `!! STALE` at ≥5 days) — cheap, and we don't do it.

## Priority 4 — Curation / lifecycle

**Verdict: a human-gated ritual where we have machinery. Deliberately less capable; one hygiene idea worth noting.**

The promotion pipeline (**CODE**, `close-session/SKILL.md:16-24` + `ARCHITECTURE.md:170-194`):

```
conversation → MEMORY.md dated bullet → (same pattern on 3+ DISTINCT dates)
   → agent proposes 2-4 candidates at /close-session
   → USER SAYS "YES"
   → knowledge/concepts/<topic>.md  (facts + rationale)
      OR .claude/rules/<name>.md    (mechanical, only if stable 6+ months)
   → raw bullets PRUNED from MEMORY.md
```

- **Recurrence threshold = 3 distinct dates** — same number as the cluster study's convergence,
  reached independently. But it is **not computed**: the agent eyeballs the dated bullets at
  `/close-session`. No counter field, no arithmetic gate. On the D-229/D-230 axis they are a
  **pure-LLM-judgment system with a human veto** — squarely in the "our shape-class punts on
  auto-promotion" bucket that study already established. *(Recorded, not re-litigated.)*
- **They explicitly rejected automating it** (`ARCHITECTURE.md:196-205`): an `experiences/`
  staging layer + a `promote-patterns.py` background detector were built and **killed** — reasons
  given: cross-session semantic matching is unreliable without a persistent process, the scaffold
  had zero entries after a day, and automation threatened their "user only talks" invariant. That
  is honest negative evidence from a peer, and it is the *opposite* of our D-169 conclusion (a
  capability that needs a human to run it isn't automatic). Worth keeping as the counter-case.
- **Supersession: none.** No `superseded_by`, no tombstones, no archive. **Deletion is real** —
  "promoted or absorbed entries get PRUNED." Their only safety net is `git checkout`
  (`README.md:148`) — and for the hot tier that net **does not exist**, because `MEMORY.md` is
  gitignored (`.gitignore:24-26`). Their own FAQ admits it: *"gitignored, so git can't restore
  those"* (`README.md:221-223`). Against our never-delete + `archive/superseded/` + tombstones
  stack this is a straight loss, and it is the sharpest single contrast in the dive.
- **Expiry: advisory only.** Experiments open >30 days get a ⚠ in the injection
  (`session-start.py:216`); `MEMORY.md` unedited ≥5 days gets `!! STALE` (`:194`). Nothing acts.
- **The one hygiene idea we lack:** `aggregate_usage.py` (opt-in, 322 lines, **CODE**) parses
  `~/.claude/projects/<encoded>/**/*.jsonl` and reports **hot files** (Read count, 30 d) vs **cold
  candidates** (0 reads in 30 d) — i.e. *"what can I archive?"* answered from real access data
  rather than guessed. Two design details are the good part: it **blacklists mechanical reads**
  (`usage_config.py:9-15` — MEMORY.md / CLAUDE.md / index.md are hook-loaded, so reading them is
  orientation, not use) and it **collapses bursts** (>3 calls on the same target within 10 min →
  3, `aggregate_usage.py:104-131`), so it measures deliberate use. And it is honest about itself
  (`:218-219`): *"⚠ Frequency ≠ value. A cold concept may be foundational, just rarely re-read.
  Use the cold list as ONE input to a proposal, not an auto-delete trigger."* — which is precisely
  the value-blind-sweep anti-pattern the cluster study flagged in MemoryOS/MemOS, correctly
  refused.

## Priority 5 — Privacy / screening

**Verdict: confirmed gap. Zero screening of any kind. Our differentiator holds, unambiguously.**

Grepped the entire tree for `secret|api[_-]?key|token|redact|sanitiz|PII|password|credential|scrub`
across `*.py *.sh *.md *.json`: **not one hit is a screening mechanism.** Every match is either the
word "private" in a gitignore comment or unrelated prose (**CODE** — exhaustive grep).

Their entire privacy story is **gitignore**:

- `.gitignore:24-26` — `MEMORY.md` untracked (added only in **v5.1.0**, 12 days ago).
- `.gitignore:28-31` — `context/handoffs/*.md` untracked.
- `knowledge/concepts/` and `.claude/rules/` **are tracked by design** (`README.md:196-198`).

So: **no secret detection, no home-path abstraction, no `<private>` stripping, no injection
screening, no poison guard, no pre-write scan of any kind.** An agent that captures an API key
into a promoted concept article commits it.

Two things in their history are worth recording because they *demonstrate* the gap rather than
just imply it (**CODE**, `CHANGELOG.md`):

- v5.1.0: *"**`MEMORY.md` is now actually gitignored.** The README claimed 'handoffs and memory
  are gitignored by default' — only handoffs were. Your hot memory (client names, decisions,
  preferences) **would have been committed and pushed with the repo**."* — a real privacy defect
  that shipped, undetected, for versions, in a public template, and was found only by a manual
  audit. A validator would have caught it on every run.
- v5.1.0 also scrubbed **the maintainers' own private client/project paths** out of
  `stale-refs.py`'s hardcoded `EXTERNAL_ROOTS` and out of a `protect-tests.sh` comment ("poker
  tests, lead-gen tests"). That is our name-privacy failure class, in their tree, caught by eye.

**We are ahead here by a wide margin, and it is the cleanest "why our kit exists" contrast in the
whole dive.** It also validates `validate-maintainer-name-confined.mjs` as a class of guard, not
just a repo quirk — the peer with no such guard leaked exactly what it prevents.

## Priority 6 — The "kit" packaging / DX

**Verdict: their install story is genuinely better than ours for a non-technical user; their multi-project story is worse; cross-agent is absent.**

- **Install (README):** `git clone --depth 1 … my-projects && cd my-projects && claude`. That is
  it. **The repo IS the workspace** — you don't install a tool into a project, you clone a project
  that has memory. Zero npm, zero node, zero global binary, zero `install` verb, nothing to
  register. First run self-heals `MEMORY.md` from `MEMORY-TEMPLATE.md`
  (`session-start.py:73-81`, **CODE**) so a fresh clone has a working private tier with no setup.
  Uninstall = delete the folder.
- **Onboarding — the borrowable bit.** `/tour` (**CODE**, `tour/SKILL.md`) is a scripted 9-stop
  walkthrough that opens **the user's own actual files** at each stop and says one or two
  sentences about what that layer is for — with explicit anti-lecture rules (*"show the first
  5-10 lines so user sees the format, not the content"*, *"don't skip stops based on emptiness —
  empty folders are part of the story"*). **We have a `tour` skill too**, so this is convergence,
  not a gap — but their stop-by-stop script with the compress-to-5-minutes fallback is a tighter
  artifact than a description.
- **Multi-project: strictly weaker.** "Multi-project" means **subdirectories** (`projects/<name>/`)
  inside one clone, switched by *saying* "we're working on X" (`ARCHITECTURE.md:268-282`) — plus
  "one clone per client" at the top level (`README.md:24-27`). There is **no user tier**: nothing
  is shared across clones, so a lesson learned on client A is invisible on client B. Our
  P/L/U precedence + `cmk lessons promote` has no counterpart.
- **Cross-agent: none.** Claude Code only. No AGENTS.md, no Cursor/Kiro/Codex adapter, **no MCP
  server** — despite `mcp` being one of their GitHub topic tags (topic-tag inflation; grepped, no
  MCP anywhere in the tree).
- **No tests, no CI, no `.github/workflows/`.** 1 334 lines of bash+python shipped to users with
  zero automated verification — and their v5.1.0 audit found **five real bugs** in it by hand
  (tool-results miscounted as human turns so the 50-turn checkpoint fired several times too often;
  the PreCompact fresh-gate checking only 1 of 3 caps; every wikilink flagged broken by `lint.py`;
  a transcript-dir encoding bug on paths containing dots; the privacy defect above). Every one is
  a class our prerun validators or a unit test would catch. **This is the strongest empirical
  argument for our test/validator investment I have seen in a peer repo** — same architecture
  class, no gates, five latent bugs found by a manual pass, unknown number remaining.

## Priority 7 — Anything genuinely novel (the honest sweep)

1. **`stale-refs.py` (130 lines, CODE) — the real find.** A deterministic scan of the
   *always-loaded* memory layer (`CLAUDE.md` + `MEMORY.md`, plus concepts/rules by default) for
   **file-path references that no longer resolve on disk**. Regex-extracts path-shaped tokens with
   a curated extension list (`:46-51`), skips URLs / template placeholders (`YYYY`, `<…>`) /
   `tmp/` / bare domains (`:67-79`), and resolves each candidate against: doc-relative, `~`,
   repo-exact, repo-nested-suffix, `$HOME`, sibling-repo, and a user-declared `EXTERNAL_ROOTS`
   list (`:82-99`). Unresolved → reported with line numbers. **Free (no LLM), advisory (always
   `exit 0`), never auto-deletes**, and the session-start hook runs it and prepends the hit list
   to the injection (`session-start.py:118-147`). Their framing (`stale-refs.py:5-12`): *"the #1
   empirical failure of LLM memory systems is stale beliefs — memory keeps asserting facts that
   have since changed, and that actively hurts vs. running fresh."*
2. **`protect-tests.sh` — a prose rule as a `PreToolUse` exit-2 block.** Our *"fix the code, not
   the test"* rule, mechanically enforced by the harness rather than by review.
3. **Three-cap overflow with the max-line-length cap** — the insight that *line count alone lies*,
   earned from a real 51.5 KB / 152-line file.
4. **Immutable dated handoffs instead of a rolling status file** — a stale artifact that *looks
   current* is defeated by making the artifact state its own date in its own name.
5. **Usage telemetry from the harness's own transcripts** (`aggregate_usage.py`) with
   mechanical-read filtering + burst collapse, and the explicit "frequency ≠ value" caveat.
6. **Convergent-evolution finding, not a borrow:** their opt-in orchestration layer ships two
   rules that are near-verbatim independent restatements of ours —
   `orchestrator-fact-check.md` (*"a report is INPUT, never a source of record… 'tests green' in a
   subagent report is a claim, not a result… anything >7 days old is a hypothesis… never count
   votes, adjudicate on merits"*) is our "did you check?" + D-364 discipline, and
   `decisions-log.md` (numbered `D-001…` append-only ledger, index table + ≤4-line entries,
   corrections appended never rewritten, archive-by-phase at a ~250-line soft cap) is our
   `DECISION-LOG.md` + decision-trail-preservation rule. Two independent operators at ~1 000
   sessions each landed on the same two artifacts. That is **external validation of our process
   design**, and the cleanest form of it: not a citation of us, an independent rediscovery.

---

## Relevance to core-memory-kit

### BORROW

| # | What | Rides | Why |
|---|---|---|---|
| **B1** | **Stale-reference detection** — port the *mechanism* (not the file): scan the tier that is actually injected (`MEMORY.md`, `USER.md`, `DECISIONS.md`, `context/memory/*.md`) for path-shaped tokens that no longer resolve; report as a `cmk doctor` health check (**HC-*, new**) + a session-start hint. Free, deterministic, advisory-only, never auto-deletes. Their skip-list and multi-root resolver (`stale-refs.py:67-99`) are the non-obvious part — a naive version drowns in false positives on URLs, placeholders and bare domains. | **New task** (a `doctor` check + optional hint; ~half-day). Composes with the existing hint surface. | We have **no** structural check that a stored fact still describes the world. It is the one failure class where a peer in our exact shape-class is ahead of us, it costs no LLM call, and it is exactly the "prose rule with a deterministic shape → write the validator" move our CLAUDE.md prescribes. **Highest-value item in this dive.** |
| **B2** | **The self-dating-artifact principle** applied to our rolling files — make `now.md` / `recent.md` *carry and render their own as-of date*, and have the injection stamp an age (`updated 5 days ago !! STALE`) rather than presenting content undated. Their reasoning is the payload; the code is trivial. | **Rides Task 66 / the recall-surface work** (or a small standalone). | D-298 is literally their 35-day-phantom bug in our tree: we fixed the *cron that caused it*, not the *property that hid it*. A rolling file that renders undated is indistinguishable from a fresh one — for the model as much as the user. |
| **B3** | **A max-line-length cap** alongside our byte/line caps on the scratchpad tiers, and a test for the "one giant line" shape. | **Rides the cap-coordination surface** (design §7.1) — small addition to the existing validator/test set. | Cheap; closes a documented real-world bloat shape (51.5 KB in 152 lines) we have not tested for. Composition-verification class: two caps that are each correct and jointly blind. |
| **B4** | **The external-fact staleness corollary** — *"a stored fact about the outside world older than ~N days is a hypothesis; re-check before acting."* Adopt as a memory-write/recall convention, ideally as a `type:`-adjacent distinction (internal/decided vs external/observed) so recall can prompt re-verification. | **Rides the schema/trust surface** (Task 97/151 lineage). | Our trust model moves on evidence events; it has no notion that *some facts decay by calendar simply because the world moved*. Their one-line rule captures it, and our typed schema can hold it where their bullet cannot. |
| **B5** | **`protect-tests` as a `PreToolUse` guard** for our own repo — block `Edit` on existing test files, allow `Write` of new ones, exempt `.md`/`.txt`. | **Repo hygiene** (sits beside `cmk-guard-memory`, the D-193 delete-guardrail — same pattern, same wiring). | "Fix the code, not the test" is a binding CLAUDE.md rule enforced only by review. This is the prose→enforcement graduation, and we already have the guardrail infrastructure. |
| **B6** *(consider)* | **Two coercion moments via `decision: block`** — PreCompact ("flush before you lose it") and a long-session checkpoint. Documented-supported for both events (verified against Anthropic's hooks doc). | **Research/decide, no lane** — trigger: *if a cut-gate or live-verify run ever shows a compaction boundary losing uncaptured state.* | We capture every turn, so the *marginal* value is low and the interruption cost is real — this is not a clear win, and blocking the user's agent is a posture change. Recording it as a named option with a named trigger, per D-248, rather than laning it. |

### REJECT / we're ahead

| What | Why |
|---|---|
| Their schema (dated prose bullet, no ids/dedup/trust/provenance) | Ours is strictly richer. Nothing to take. |
| Their recall (no search at all — they *deleted* their query command) | ADR-0024's stack is a generation ahead. Their removal rationale ("just ask the agent") is a small-corpus artifact; it does not survive our corpus size. |
| Their curation (human-confirmed ritual, no counters, no supersession, **hard prune with no archive on a gitignored file**) | Straight loss vs never-delete + `archive/superseded/` + tombstones. Their pruned hot-tier bullet is unrecoverable — git can't restore an untracked file. |
| Their rejection of automated promotion (`experiences/` + `promote-patterns.py` killed) | Keep as **counter-evidence**, do not adopt. It contradicts D-169; their kill reasons (unreliable cross-session matching, empty scaffold after one day) are real but were argued against a *semantic-signature* detector, not against our arithmetic recurrence gate. Different mechanism, so the precedent doesn't transfer. |
| Their privacy model (gitignore only) | We are the differentiator. Their v5.1 changelog *documents the defect* this design produces. |
| Their multi-project model (subdirs + one-clone-per-client, no user tier) | No cross-project learning at all. Our P/L/U + `lessons promote` is the answer they don't have. |
| Their packaging shape (repo-as-workspace) | Cleaner install, but it only works because the kit *is* the project. Incompatible with our "add memory to an existing repo" premise — a real trade, not a miss. |
| Their engineering posture (no tests, no CI) | The five hand-found bugs in v5.1.0 are the argument for ours. |

### Also worth surfacing (not a borrow)

- **Env-namespace collision:** their tunables are `CMK_INJECT_BUDGET`, `CMK_MEMORY_LINE_CAP`,
  `CMK_MEMORY_BYTE_CAP`, `CMK_MEMORY_MAXLINE_CAP` (`session-start.py:39-47`). **`CMK_*` is our
  prefix too** (`CMK_SKIP_LIVE_HAIKU`, `CMK_DOORS_STRICT`, `CMK_STRESS_LOG`, …). No current
  overlap in the specific names, but a user running both kits shares one environment. ADR-0021
  renamed the *project*; the *env prefix* collision is a separate, still-open surface worth a
  deliberate decision.
- **Path collision:** they also use a top-level **`context/`** directory (`context/handoffs/`).
  If a user ever layers both kits in one repo, the directories merge. Low probability, cheap to
  note.
- **Our `stop_hook_active` citation** (`design.md` §5.2.1) rests on the same undocumented field
  they use. Anthropic's hooks doc does **not** list it among Stop inputs (verified this session).
  Not this note's task to fix — flagged for the lead as an internal-verification item.

---

## What I could not verify

- **Runtime behavior of any hook.** Nothing was executed — no `claude` session run, no hook
  fired, no `decision: block` observed in practice. Everything is a read of the source plus the
  Anthropic hook contract. In particular: whether their PreCompact block *actually* results in the
  agent writing before compaction proceeds (the coerced-turn → real-write link) is **unverified in
  practice** — I verified only that the block is contractually supported.
- **The `stop_hook_active` field's real behavior.** Confirmed absent from the docs; not confirmed
  absent from the payload. Their guard may work perfectly.
- **Their production claims.** "1 000+ sessions / 12 months / one operator", the 51.5 KB-in-152-lines
  incident, and the 35-day phantom-NSP incident are **README/CHANGELOG-only**. They are plausible
  and specific (specificity is weak evidence of authenticity), but there is no artifact in the repo
  that corroborates any of them. The *design responses* to those incidents are code-verified; the
  *incidents* are not.
- **Whether `stale-refs.py`'s regex holds on a large real corpus.** Read, reasoned about, never
  run against our tree. Its false-positive rate on our docs (heavy with `§`-refs, ADR ids, code
  fences, and inline paths) is **unknown and is the main risk to B1** — a check that cries wolf
  gets ignored. Any B1 implementation must start by running the mechanism against our actual
  `context/` + docs and measuring the noise floor before wiring it to a hint.
- **Adoption reality.** 27 stars / 7 forks / 2 watchers / 1 open issue tells us little about
  whether anyone but the maintainer runs it. No usage telemetry, no discussions, no issue traffic.
- **The `.kit/advanced/orchestration-layer/` agents** (`executor`, `recon`, `idea-validator`) were
  read only at the rules level, not the agent-prompt level — out of scope for a memory dive, and
  they are prompt markdown rather than mechanism.
