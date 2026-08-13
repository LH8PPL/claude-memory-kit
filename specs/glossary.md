# Glossary — core-memory-kit v0.1.0

**Status**: Draft · **Date started**: 2026-05-23

This file is the **canonical definition** of every domain term used in [`requirements.md`](requirements.md), [`design.md`](design.md), and [`tasks.md`](tasks.md). When two docs disagree on what a term means, **this file wins**.

Reference this file in PRs and ADRs as `[GLOSSARY: <term>]`.

---

## How to read this glossary

- **Term**: the canonical name.
- **One-line definition**: what it is, terse.
- **Where it lives**: file path or module if the term names a concrete artifact.
- **Cross-refs**: related terms in this file, in `[[brackets]]`.
- **Spec source**: which FR / § / ADR defines it.

When in doubt, **add a term here** instead of inventing a new synonym in another doc.

---

## Architecture

### Tier

One of three storage scopes the kit reads from at session start. Defines **who owns the memory** and **how durable it is**.

| Tier | Path | Owned by | Travels with `git clone`? |
| --- | --- | --- | --- |
| **User tier** | `~/.core-memory-kit/` (overridable via `$MEMORY_KIT_USER_DIR`) | The human, across all projects | No (machine-local) |
| **Project tier** | `<repo>/context/` | The team, committed to git | **Yes** |
| **Local tier** | `<repo>/context.local/` | The current machine for this project | No (gitignored) |

Cross-refs: [[Frozen snapshot]], [[Precedence model]], [[Tier prefix]]. Spec: FR-1, FR-4, FR-5; design §1.1.

### Tier prefix

The single-letter prefix in a [[Citation ID]] indicating which [[Tier]] owns the observation:

- `U-` → user tier
- `P-` → project tier
- `L-` → local tier

Cross-refs: [[Citation ID]], [[Tier]]. Spec: §3.1.

### Precedence model

Git-config-style rule for resolving conflicts between [[Tier]]s at session start: **most-specific tier wins per observation; settings deep-merge**. Order from highest to lowest priority: local → project → user.

Cross-refs: [[Tier]], [[Frozen snapshot]], [[Shadowed_by log]]. Spec: design §1.1, §7.

### Frozen snapshot

The ≤10 KB block of memory text injected into Claude's context window at session start. Assembled by the [[SessionStart hook]] from the three [[Tier]]s in [[Precedence model]] order. Called "frozen" because it's read once and never mutated mid-session (preserves prefix cache).

Cross-refs: [[SessionStart hook]], [[Context_Payload]], [[additionalContext]]. Spec: FR-7; design §1.4.

### Context_Payload

Synonym for the [[Frozen snapshot]] when emphasizing its structural shape (which sections, which order). The hook's emitted JSON has the snapshot in `hookSpecificOutput.additionalContext`.

Cross-refs: [[Frozen snapshot]], [[additionalContext]]. Spec: design §1.4, §7.1.

### Injection mode

Which SHAPE of the [[Frozen snapshot]] a session start emits, selected from the hook payload's `source` field: **full** (the whole snapshot — `startup`, `clear`, `compact`, `fork`, and any unknown/absent value) or **pointer** (`resume` only — the static tier bulk is replaced by one line saying the snapshot is unchanged and already in context, because a resumed session's transcript replay already carries it). Volatile content (the existence advertisement, the temporal mention, the commit proposal) and the authority preamble inject in BOTH modes. `compact` is deliberately full: compaction summarizes prior history rather than preserving it.

Cross-refs: [[Frozen snapshot]], [[SessionStart hook]], [[Injection-size meter]]. Spec: design §20.9.

### Injection-size meter

The trailing `· snapshot <N> B` on the session-start status line (tagged `(pointer)` in pointer [[Injection mode]]) reporting the byte cost of what was just injected. Rides `systemMessage` — the user-display channel — so it costs the model no tokens and leaves the snapshot byte-identical. The same number is recorded per session on the [[Recall-log]]'s `inject` entry as `bytes` + `mode`.

Cross-refs: [[Frozen snapshot]], [[Injection mode]], [[Recall-log]]. Spec: design §20.9.

---

## Files & schemas

### Scratchpad

A bounded markdown file the kit reads at session start and (optionally) writes to during the session. Each scratchpad has a documented character cap and three fixed sections. Examples: `SOUL.md`, `MEMORY.md`, `USER.md`, `HABITS.md`, `LESSONS.md`.

Cross-refs: [[Bullet]], [[Char cap]], [[Provenance frontmatter]], [[Section sign]]. Spec: FR-3; design §2.1.

### Bullet

A single fact stored as one line in a [[Scratchpad]], immediately followed by a [[Provenance frontmatter]] HTML comment. Each bullet has a [[Citation ID]] at the front.

Cross-refs: [[Scratchpad]], [[Citation ID]], [[Provenance frontmatter]]. Spec: design §2.1.

### Char cap

The maximum byte size of a [[Scratchpad]] file, counted via `wc -c` and including frontmatter/comments. When a write would exceed cap, the kit consolidates before writing. Caps are configurable via `<repo>/context/settings.json` and `~/.core-memory-kit/settings.json`.

Cross-refs: [[Scratchpad]], [[Consolidation]]. Spec: FR-3; design §2.1.

### Consolidation

The cap-enforcement workflow inside the [[Memory-write skill]] (action `add`): merge similar [[Bullet]]s, drop stale entries (>14 days, no recent reference), THEN apply the new write. Different from [[Compression]] which is the rolling-window pipeline.

Cross-refs: [[Char cap]], [[Memory-write skill]]. Spec: design §2.1.

### Fact file

A markdown file in the granular archive (`<tier>/memory/<type>_<slug>.md`) holding one durable fact with full YAML frontmatter (id, type, title, provenance, tags, etc.).

Cross-refs: [[Granular archive]], [[Provenance frontmatter]], [[Type taxonomy]]. Spec: FR-1; design §2.2.

### Granular archive

The collection of one-fact-per-file [[Fact file]]s under `context/memory/` (project tier) and `~/.core-memory-kit/fragments/` (user tier). The [[INDEX]] file is the pointer index over this collection.

**Canonical walker**: all traversal of this collection goes through [`packages/cli/src/fact-store.mjs`](../packages/cli/src/fact-store.mjs) — `listFactFiles` for names, `eachFactIn` / `eachFact` / `eachLiveFact` for parsed facts. Don't roll your own `readdir` loop: the skip rules (INDEX.md, non-files, unparseable frontmatter, tombstones) belong in one place, and they were reimplemented in 14 sites before Task 241. See design §1.3 + CLAUDE.md "Shared modules" rule.

Cross-refs: [[Fact file]], [[INDEX]], [[Pointer index]]. Spec: FR-1, FR-29; design §2.2.

### INDEX

A markdown file (`memory/INDEX.md` or `fragments/INDEX.md`) listing every non-tombstoned [[Fact file]] as one line: `- ({id}) [type] [title](filename.md) — <hook>`. It is a [[Pointer index]], not content-direct.

Cross-refs: [[Granular archive]], [[Pointer index]]. Spec: FR-1, FR-7; design §2.3.

### Pointer index

A markdown file whose entries link out to other files rather than containing content directly. Used because the token budget at session start is bounded: a pointer index of ~200 lines is ~30 KB max; content-direct would blow the budget immediately.

Cross-refs: [[INDEX]]. Spec: design §2.3.

### Provenance frontmatter

The metadata immediately attached to every observation: `id`, `source_file`, `source_line`, `source_sha1`, `write_source`, `trust`, `created_at`, plus optional `merged_from` / `superseded_by` / `deleted_at` / `private` / `shape` (see [[Fact shape]]). Stored as YAML in [[Fact file]]s and as inline HTML comment in [[Scratchpad]]s.

**Canonical reader/writer**: all reads and writes go through [`packages/cli/src/frontmatter.mjs`](../packages/cli/src/frontmatter.mjs) — the single js-yaml–backed `serialize`/`parse` pair. Don't roll your own parser; values containing `\n` / `:` / `"` round-trip correctly only via this module. See design §4 + CLAUDE.md "Shared modules" rule.

Cross-refs: [[Citation ID]], [[Trust]], [[Write source]], [[Audit log]]. Spec: FR-29; design §4.

### Type taxonomy

The four categories a [[Fact file]] can have: `user_*`, `feedback_*`, `project_*`, `reference_*`. Filename prefix mirrors the type.

Spec: design §2.2.

### Working memory

The field's term (cognitive-science lineage — IBM/Weaviate/MLM taxonomy) for an agent's CURRENT-session live state. In the kit: the bounded `MEMORY.md` [[Scratchpad]] (active threads, environment notes, pending decisions) + the `sessions/now.md` pre-roll buffer. Nothing is truncated away: the scratchpad cap-manages with graduation-not-truncation ([[Consolidation]], design §19), and `now.md` drains via the [[Rolling window]] roll (design §8) — together the answer to the taxonomy's "re-asking = over-trimmed working memory" pitfall. Distinct from the kit's own [[Type taxonomy]] (fact PURPOSE) and [[Fact shape]] (fact TIME) — the four memory TYPES classify storage surfaces, not facts. (Task 229, D-326.)

### Semantic memory

The field's term for durable FACTS — decisions, preferences, configuration, knowledge. In the kit: the [[Granular archive]] (`context/memory/`, typed per the [[Type taxonomy]], with Why/How rationale) + `USER.md`. Write-time validation (dedup + the conflict queue + [[Poison_Guard]]) answers the "corrupted semantic memory" pitfall; [[Validity window]]s + state labels keep it TRUE as it ages. (Task 229, D-326.)

### Episodic memory

The field's term for WHAT HAPPENED, WHEN — the event record. In the kit: the rolling session window (`today-*.md` → `recent.md` → `archive.md`) + the verbatim transcripts tier (ADR-0010 floor) + the [[Bootstrap import]]ed history. Facts and events live in SEPARATE stores — the answer to the "contradictory retrieval" pitfall — and every recall hit cites its date ([[Recall ladder]], Task 227). (Task 229, D-326.)

### Procedural memory

The field's term for HOW TO WORK — habits, methods, distilled lessons. In the kit: the user-tier `HABITS.md`/`LESSONS.md` (cross-project via [[Auto-persona]]/`cmk lessons promote`), the [[Learn-loop]]'s judgment records, and the scaffolded skills. The distill chain keeps LESSONS, not replays, and the learn-loop's utility scores make procedure that keeps working rank higher — the answer to the "procedural memory that never improves" pitfall. (Task 229, D-326.)

### Fact shape

What KIND of truth a fact asserts — the temporal classification (Task 66.1, from Chandra's "Beyond the Log" taxonomy): `State` (ongoing condition), `Event` (happened once), `Plan` (future-dated), `Relationship`, `Preference`, `Absence` (a negative fact — "user does NOT do X"), `Timeless`. Optional `shape` field in [[Provenance frontmatter]]; written explicitly (default `State`) on new facts, absence on pre-66 facts also reads as `State`. Orthogonal to [[Type taxonomy]] (type = what the fact is FOR; shape = how it relates to TIME). The temporal machinery keys on it: validity windows (66.2) touch only `State`, the expiry sweep (66.3) any shape, contradiction-catch (66.4) `State`.

Spec: design §16.18 + §4.

### Section sign

The `§` character. Used in cross-references to design.md sections (`design §6.7`). NOT used as a delimiter in our markdown format — Hermes uses it; we use plain markdown bullets.

Spec: design §2.1.

---

## IDs & citations

### Citation ID

A content-addressed identifier of the form `<tier_prefix>-<base32(SHA-256(canonical_text))[:8]>`. Examples: `P-A8FN3MQ2`, `U-9F2D7T1S`, `L-K3P5R8Q2`. Same canonical text → same ID, anywhere in the world.

Cross-refs: [[Canonical text]], [[Tier prefix]], [[Session anchor]]. Spec: FR-14; design §3.

### Canonical text

The result of `canonicalize(bullet_text)`: trim → collapse whitespace → ASCII lowercase → strip citation backrefs → strip bullet marker → strip trailing punctuation → strip HTML comments. **Deterministic across Node and Python implementations.**

Cross-refs: [[Citation ID]]. Spec: design §3.2.

### Session anchor

A BibTeX-style human-mnemonic identifier for a session: `S-2026Q2-001`. Used as a temporal marker, NOT content-addressed (sessions are temporal, mnemonic IDs are more useful for humans browsing).

Cross-refs: [[Citation ID]]. Spec: design §3.1.

### Backref

The `(P-XXXXXXXX)` prefix appearing at the start of a [[Bullet]]. The [[Canonical text]] rules strip backrefs before hashing — so adding or removing a backref produces no ID change.

Cross-refs: [[Citation ID]], [[Canonical text]]. Spec: design §3.2.

---

## Hooks & lifecycle

### Hook

A shell command Claude Code invokes at specific lifecycle events. The kit registers 8: `SessionStart` (inject the snapshot), `UserPromptSubmit` (capture the prompt), `PostToolUse` (observe edits), `Stop` (capture the turn + spawn auto-extract), `SessionEnd` (compress the session), `PreCompact` (roll the buffer at a compaction boundary — Task 235), `PreToolUse` (the memory delete-guardrail, D-192), and `PermissionRequest` (the prompt-free auto-approver, Task 172). _(`Setup` was dropped pre-v0.1.0 — it is not in Anthropic's documented common-events set and no bin ships for it.)_

Cross-refs: [[SessionStart hook]], [[stop_hook_active guard]]. Spec: FR-9; design §5.

### SessionStart hook

The hook that fires when a new Claude Code session begins. Reads all 3 [[Tier]]s, assembles the [[Frozen snapshot]], emits as [[additionalContext]] JSON. Budget: 500 ms (per NFR-1).

Cross-refs: [[Frozen snapshot]], [[additionalContext]]. Spec: FR-9; design §5.2.

### Stop hook

The hook that fires at the end of each assistant turn. Appends transcript, spawns the [[Auto-extract subagent]] detached, returns within 50 ms.

Cross-refs: [[Auto-extract subagent]], [[stop_hook_active guard]]. Spec: FR-9, FR-10; design §5.2.

### `stop_hook_active` guard

A recursion-prevention check at the top of the Stop hook handler. When Anthropic's hook payload contains `stop_hook_active: true` (meaning this Stop fire was triggered by a previous block decision), the handler exits immediately to avoid an infinite loop.

Cross-refs: [[Stop hook]]. Spec: design §5.2.1.

### additionalContext

The JSON field a hook emits to push text into Claude's context window: `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}`. Defined by Anthropic's hook protocol.

Cross-refs: [[Frozen snapshot]]. Spec: design §1.4, §5.2.

---

## Subagents & skills

### Auto-extract subagent

The detached subprocess spawned by the [[Stop hook]] that runs the installed agent's own CLI (via the [[CompressorBackend]] factory `makeBackend` — `claude --print` on Claude Code, `kiro-cli chat` on Kiro, `cursor-agent -p` on Cursor, `codex exec` on Codex; Task 200) against the just-captured transcript turn, asks the model to identify durable facts, and routes the results through the [[Memory-write skill]] or the [[Review queue]] per [[Trust]] level. (Before v0.4.5 this always shelled out to a hardcoded `claude` binary — the D-270 gap.)

Cross-refs: [[Stop hook]], [[Memory-write skill]], [[Six writing triggers]], [[Trust]]. Spec: FR-10, FR-12; design §6.1.

### Memory-write skill

A Claude Code skill auto-triggered by phrases like "remember this", "update memory", "forget about X". Three actions: `add` (new fact), `replace` (update existing), `remove` (tombstone). Every write goes through [[Poison_Guard]] first.

Cross-refs: [[Auto-extract subagent]], [[Poison_Guard]], [[Trigger phrase]]. Spec: FR-10, FR-11; design §6.3.

### Six writing triggers

The six patterns the [[Auto-extract subagent]] is instructed to save (verbatim from Hermes Agent): user corrections; discovered preferences; environment facts; project conventions; completed complex workflows; tool quirks/workarounds.

Cross-refs: [[Auto-extract subagent]]. Spec: design §6.4.

### Trigger phrase

A natural-language pattern the [[Memory-write skill]] auto-detects in user prompts to infer the action: e.g., "remember this", "for next time" → `add`; "update memory: X is now Y" → `replace`; "forget about X" → `remove`.

Cross-refs: [[Memory-write skill]]. Spec: FR-11; design §6.3.

### Auto-persona

System-derived synthesis of user-tier scratchpads (`USER.md`, `HABITS.md`, `LESSONS.md`) from accumulated granular-archive facts. Synthesized via the [[CompressorBackend]] (Haiku per design §8.3).

**Shipped posture — optimistic auto-promote** (PR #83, → v0.2; the 2026-05-30 pivot, decision-log D-4): the [[CompressorBackend]] classifies each project-tier fact as cross-project doctrine or not; **high-confidence doctrine auto-promotes into the user tier at `trust: medium` with NO manual accept step** (written *through* [[memoryWrite]], so it inherits home-path sanitization, [[Poison_Guard]], dedup, cap, and audit). It **auto-supersedes** a same-or-lower-trust persona fact on contradiction (no duplicate), and **never overwrites** a `trust: high` hand-curated entry (those route to the conflict queue). Low/medium-confidence candidates route to the auto-drained review queue. Triggered automatically by the weekly-curate pass (Design B), which **scaffolds the user tier first** if absent.

**Original manual design (pre-2026-05-30, preserved as decision-trail):** two modes — **stage** (proposals → `<userDir>/queues/persona-review.md` for `cmk persona accept|reject <id>`) and **auto-apply** (opt-in). Superseded by the optimistic posture above per the user's "i want it to be automatic"; the `cmk persona generate` / `accept` / `reject` manual surface is a deferred 45 follow-up, not the default path.

Replaces the hand-curated user-tier failure mode the kit was originally going to ship with (design §16.16; self-test finding #2). See [[Task 45]] in tasks.md.

### Auto-drain

The v0.2 Phase 2 behavior (decision-log D-6) where the daily-distill + weekly-curate maintenance passes resolve the [[Review queue]] and [[Conflict queue]] **automatically**, with no manual `cmk queue review|conflicts` step. Optimistic resolvers (`packages/cli/src/auto-drain.mjs`): review-queue entries → **promote** (trust the medium-trust capture; a later contradicting fact auto-supersedes, and the 14-day medium-trust staleness drop cleans noise); conflict-queue entries → **keep-old** (the only writes that reach the conflict queue are lower-trust than the existing fact they contradict, so keep-old protects the established/hand-curated fact and discards the lower-trust contradiction). The manual `cmk queue *` verbs still work for explicit control. Per the user's "i dont want to do anything, i want it to be automatic."

Cross-refs: [[Auto-extract subagent]], [[Memory-write skill]], [[Trust]], [[Review queue]]. Spec: design §16.16; tasks.md Task 45.

---

## Quality gates

### Trust

A three-level confidence rating on each observation: `high` / `medium` / `low`. Default by [[Write source]]: user-explicit + manual-edit → high; auto-extract + imported → medium; compressor → low. Manual override via `cmk trust <id>`.

Cross-refs: [[Write source]], [[Review queue]], [[Conflict queue]], [[Trust score]]. Spec: FR-29; design §4.

### Trust score

An **evolving** per-fact float (`0.05`–`0.95`) stored in the **rebuildable index** (`observations.trust_score`), never in committed frontmatter (a moving value = git-diff noise). Distinct from [[Trust]] (the coarse committed enum): the score seeds from source + recurrence, then moves from passive outcomes — a contradiction/supersession dampens it, a restatement raises it — with no command to run. A protection/floor signal (never reaches zero → demote-not-evict), NOT a sweep-ranking driver — and since v0.5.3 (Task 194) ALSO a **search-ranking term**, but only through the confidence-gated [[Search blend]] (evidence ≥ 3 outcome signals; inject and the sweep stay enum-based). Task 151 Move 3 (folds Task 97).

Cross-refs: [[Trust]], [[Recurrence gate]], [[Demote-not-evict]], [[Search blend]]. Spec: design §20.2 + §20.7; ADR-0016.

### Recurrence gate

The v0.4.3 promotion mechanism (Task 151 Move 1): a cross-project trait earns [[Auto-persona]] promotion by **recurrence**, not phrasing. `recurrence_count` (frontmatter int) increments when the same canonical fact re-surfaces; the classifier **cites** the facts a trait was synthesized from and the kit **sums** their real recurrence (`cite-and-sum`) — the LLM groups, code counts. A trait promotes at recurrence ≥ 3 OR the explicit-imperative fast-path (`confidence: high`). Replaces the old form-based `PERSONA_CONFIDENCE_RULE`.

Cross-refs: [[Auto-persona]], [[Trust score]], [[Demote-not-evict]]. Spec: design §20.1; ADR-0016.

### Demote-not-evict

The v0.4.3 cap-relief rule for the user-tier persona (Task 151 Move 2, fixes the cold-open "Hole B"): when `USER`/`HABITS`/`LESSONS.md` outgrow the inject budget, they **condense in place** (mechanical trim, drops no bullet) rather than graduating a promoted trait out to un-injected `fragments/` (which stranded it). The file may grow past the inject budget (load-cap, not write-cap); the importance-aware snapshot load-cap keeps the high-trust slice injected.

Cross-refs: [[Recurrence gate]], [[Trust score]], [[Graduation]]. Spec: design §20.3; ADR-0016.

### Learn-loop

The kit's target architecture (ADR-0017, Accepted 2026-07-02): the cycle ACQUIRE → RETRIEVE → act → JUDGE → MEASURE → CURATE → back to RETRIEVE, closed **across session boundaries** — a session is a bounded agent run, and the kit is the cross-session runtime the loop runs on (feedback on this session's recalls arrives in the *next* session). The last edge — MEASURE's signal (trust_score) reaching retrieval ranking — **closed 2026-07-13 (Task 194, v0.5.3)** via the confidence-gated [[Search blend]] + [[Survival gate]]; the loop is now end-to-end. The full anatomy: [SYSTEM-MAP §6](../docs/SYSTEM-MAP.md).

Cross-refs: [[Judge]], [[Recall-log]], [[Feedback-screen]], [[Judgment]], [[Trust score]]. Spec: SYSTEM-MAP §1/§6; ADR-0017.

### Judge

The learn-loop organ that turns a turn's OUTCOME into a verdict for MEASURE — and the **per-host adapter**: the loop is universal, only the judge changes with the host (Claude Code = hooks catching tool-results/corrections/re-asks; an agent host = a monitor ≈ an oracle). Signals form a PORTFOLIO — automatic-first, human-optional, both-polarity. Distinct from an *oracle* (a ground-truth answer key), which a session host lacks.

Cross-refs: [[Learn-loop]], [[Oracle-free]]. Spec: SYSTEM-MAP §3/§4; ADR-0017 Decision #2.

### Oracle-free

A learning signal that needs NO ground-truth verdict (benchmark answer key, unit-test pass, monitor-cleared, gold label). The decisive transferability test from the 2026-07-01 field survey: ~12 of 14 failure-learning systems are oracle-GATED (their loop cannot fire without a benchmark) — only the oracle-free minority (memclaw, Memoria, A-MemGuard, SkillOpt's fallback tier) are real precedents for the kit. Orthogonal to automatic-vs-human: the target quadrant is **oracle-free AND automatic**.

Cross-refs: [[Judge]], [[Learn-loop]]. Spec: the [failure-learning survey](../docs/research/2026-07-01-failure-learning-field-survey.md); ADR-0017 Evidence.

### Recall-log

The learn-loop's attribution primitive (Task 190, Phase 1a): a gitignored per-session NDJSON log of WHICH memory IDs were injected/searched each turn. Without it no outcome signal can find its target memory — every downstream organ depends on it. Precedent: memclaw's `related_ids`.

Cross-refs: [[Learn-loop]], [[Judge]]. Spec: SYSTEM-MAP §6; ADR-0017 Decision #6; Task 190.

### Judgment

A fact **type** distinct from a plain fact: an EARNED comparative claim about method ("for task-shape T, A over B") that carries how much it actually knows — `status: provisional|corroborated|contested|retracted`, `n_episodes` (read as replication), `direction_consistent`, `confounds`, a decay date, and an append-only evidence log (HIT/MISS/REVERSAL). Born from expectation pre-registration (Task 191); **never enters ranking** (the comparative-judgment study: verified A>B is structurally unsolved at single-user scale — a judgment surfaces with its confidence visible instead). A cycle (A>B, B>C, C>A) flips it to `contested` and asks the user — detecting "there is no single better" is itself an earned judgment.

Cross-refs: [[Learn-loop]], [[Trust score]] (the FACT-utility sibling — the two objects are never conflated). Spec: the [comparative-judgment study](../docs/research/2026-07-01-comparative-judgment-earned-method-preference.md); ADR-0017 Decision #1; Task 191.

### Feedback-screen

Poison_Guard for the LOOP (Task 193, a build prerequisite): feedback is a second input channel that mutates utilities, and nothing screened it — a systemically-wrong judge (a broken test suite reddening everything for a week) would dampen GOOD memories without touching a file. The screen: rate-limit per fact, burst-hold (a mostly-negative day = a systemic event → quarantine, don't apply), every Δ audit-logged, floor 0.05 (never delete by decay). No utility-mutating signal ships without it.

Cross-refs: [[Learn-loop]], [[Judge]], [[Poison_Guard]]. Spec: SYSTEM-MAP §6; ADR-0017 Decision #4; Task 193.

### Anti-pattern memory

A fact whose JOB is negative: "avoid this / do not retry this route." A repeatedly-failing fact CONVERTS to this type instead of being deleted (demote-not-evict extended to the loop) and is injected as a warning — failures have positive value as cautionary examples (Memento/REMEMBERER retained-exemplar + Negative-Knowledge's dead-end veto, three independent precedents). **Built (Task 194, v0.5.3):** the `convert` resolution of the [[Survival gate]]'s prune queue — a bullet is rewritten in place as `⚠️ AVOID …` (injected where it lived); a fact file is retyped `type: anti-pattern` (a conversion-ONLY type — writeFact can't dictate it) + a warning bullet lands in MEMORY.md § Anti-patterns.

Cross-refs: [[Learn-loop]], [[Demote-not-evict]], [[Judgment]], [[Survival gate]]. Spec: SYSTEM-MAP §6; design §20.7; ADR-0017 Decision #5; Task 194.

### State label

The deterministic temporal-state marker recall serialization attaches to a NON-current fact (Task 209, v0.5.3 — A-TMA's QA-level mechanism): `[superseded — kept for history]` / `[expired]` / `[retracted]`, projected from already-known metadata (`superseded_by` / `expires_at` / `deleted_at`) by a pure function — no LLM, no DB on the inject path. Applied wherever facts reach Claude (search results + `get` + the snapshot), with a one-line envelope instruction ("unlabeled = current") emitted only when a labeled row is present. LABELS, never re-ranks (§20.3 intact); current facts stay unlabeled — zero noise. Evidence: A-TMA Case Study 1 — identical retrieved evidence flips from wrong to correct answer on labels alone.

Cross-refs: [[Trust score]], [[Search blend]], [[Tombstone]]. Spec: design §9.3; `state-label.mjs`; the HEALTH-CHECKS "When recall goes wrong" taxonomy; D-308.

### Memory-health dashboard

The behavioral PROCESS report (`cmk stats memory-health`, Task 212 — AutoMem's Figure-4 indicator set): writes-per-search, empty-search rate (with the recovered-by-retry split), redundant-write rate, repeated identical searches, and snapshot cap pressure — each with a trend arrow vs the prior window, aggregated from logs the kit already writes (recall.log / audit.log / truncation.log; no new capture, no LLM). REPORT-ONLY in v1 (observe before alarming — the D-169 no-ritual line) and the [[Search blend]]'s tuning instrumentation. Distinct from the Task-144 doctor memory-health SECTION, which is content quality over the fact archive (stale/duplicates/queues).

Cross-refs: [[Search blend]], [[Recall-log]], [[Audit log]]. Spec: design §20.7 (tuning-instrumentation note); `memory-stats.mjs`; D-308/D-333.

### Query state view

The retrieval-side sibling of the [[State label]] (Task 211, v0.5.3 — A-TMA's rule-based 4-view profiler; the cheap cut of §16.18's deferred 7-mode classifier): a zero-LLM classifier (hint catalogs + a negation guard — "not what we used before" reads as current) tags each facts-scope query **current / historical / transition / neutral**. Historical/transition auto-include expired rows (a history question must reach the history — no flag) and strip the consumed hint words from the FTS query; historical additionally buckets labeled rows FIRST (a stable deterministic partition — never a score change; §20.3 and the [[Search blend]] untouched). Current/neutral are byte-identical to the default pipeline. `--state-view`/`state_view` are overrides only; the detected view rides the envelope when it changed retrieval.

Cross-refs: [[State label]], [[Search blend]]. Spec: design §9.3 + §16.18 (the narrowed deferral); `query-state-view.mjs`; D-308/D-332.

### Search blend

The confidence-gated ranking term that turned [[Trust score]] from decorative into load-bearing (Task 194, v0.5.3 — ADR-0017 Phase 2, the loop's last edge): the facts-scope keyword rank becomes `bm25 × (1 + λ·(trust_score − 0.5))`, applied ONLY when the fact carries ≥ 3 APPLIED outcome signals (`observations.signal_count`, the feedback counter — restatement/recurrence deliberately never counts, so re-saying a thing can't buy rank). Judgments never blend (`judgment_*.md` excluded); hybrid inherits via RRF; a dampened row is re-ranked, never dropped; **inject is untouched** (enum-ordered — the §20.3 hot-path rule, structurally pinned). Shape: Memoria's retrieval multiplier on FTS5's negative-better rank.

Cross-refs: [[Trust score]], [[Learn-loop]], [[Judgment]], [[Survival gate]]. Spec: design §9.3 + §20.7 + the §20.3 amendment; ADR-0017 Decision #3.

### Survival gate

ExpeL's prune-at-zero, demote-not-evict flavored (Task 194, v0.5.3): an applied dampen landing on a fact ALREADY at the trust floor ("floored + still failing" — the score can't sink further) routes a prune-CANDIDATE to `context/queues/prune-review.md` — automatically, audit-logged, NEVER a silent delete. The queue is preservational (resolved entries keep their `resolution:` marker = the never-re-nag memory). Resolution via `cmk queue prune` / `mk_queue_resolve`: `convert` (→ [[Anti-pattern memory]]) / `forget` (safe tombstone) / `keep` (user vouches — dismissed for good) / `skip`.

Cross-refs: [[Learn-loop]], [[Anti-pattern memory]], [[Trust score]], [[Review queue]], [[Conflict queue]]. Spec: design §20.7; SYSTEM-MAP §6 CURATE panel; ADR-0017 Decision #3.

### Write source

The enum field on every observation recording how it was written: `user-explicit` / `auto-extract` / `compressor` / `manual-edit` / `imported`.

Cross-refs: [[Trust]]. Spec: design §4.

### Poison_Guard

The pre-write regex filter inside the [[Memory-write skill]] that rejects writes containing secrets (API keys, tokens, PEM headers) or prompt-injection phrases ("ignore previous instructions"). Rejected writes are logged with a redacted excerpt to `.locks/poison-guard.log`.

Since Task 216 (D-320) the same catalog also screens the **side doors** around that chokepoint via the shared `screenBeforeCommittedWrite()` helper: LLM-summarized output (weekly-curate/daily-distill, input pre-screened before the Haiku call too), transcript promotion (secrets-only scope — a verbatim record is never injected into context), the persona-review queue, and trust INCREASES (`overrideTrust` re-screens content against the current catalog before blessing it upward).

Cross-refs: [[Memory-write skill]], [[Privacy screen]]. Spec: design §6.7 + §6.7.1.

### Privacy screen

The two-layer PII/sensitivity screen that keeps personal content out of committed memory (distinct from [[Poison_Guard]], which catches *secrets*). **L1** is a deterministic pattern pass ([`pii-patterns.mjs`](../packages/cli/src/pii-patterns.mjs)) that masks emails / phone numbers / the OS username with stable placeholders (`«EMAIL»`, `«PHONE»`, `«USER»`) at every commit-eligible write, before hash/dedup/disk. **L3** is an async Haiku judge (adapted from Anthropic's PII-purifier prompt) that catches names, addresses, and health details in prose. Toggle with `privacy.screen: on|off` in settings; every redaction is recorded to the gitignored [[redactions.log]] for recovery.

Cross-refs: [[Poison_Guard]], [[Transcript live buffer]], [[Sensitivity axis]], [[redactions.log]], [[`<private>` tag]]. Spec: ADR-0019, design §6.10.

### Transcript live buffer

A gitignored `context/transcripts/{date}.live.md` file that hooks append each (L1-masked) turn to. Entries are promoted to the committed `context/transcripts/{date}.md` only *after* the L3 [[Privacy screen]] judge screens them — with a crash-safe byte-offset watermark (`marker-after`), a reject-gate (refusal/empty/shrunk output defers), and fail-closed behavior (judge unavailable → turns stay in the buffer, retried next turn / at SessionEnd). A [[Poison_Guard]] SECRET hit on the judged batch is permanent, so it **withholds** rather than defers: a content-free marker lands in the committed file, the watermark advances, and the raw text stays in the live buffer (Task 216, D-320). Never indexed for search.

Cross-refs: [[Privacy screen]], [[Stop hook]], [[Auto-extract subagent]]. Spec: ADR-0019, design §6.10.

### Sensitivity axis

The per-candidate privacy routing the [[Auto-extract subagent]] classifier emits: `commit` (default → the normal tier), `local-only` (useful but sensitive → gitignored `context.local/private.md`, never a committed surface — including the [[Review queue]]), or `drop` (not saved; logged as `sensitivity_drop` without the text). An unrecognized value routes `local-only`, never `commit`.

Cross-refs: [[Privacy screen]], [[Tier]], [[Auto-extract subagent]], [[`<private>` tag]]. Spec: ADR-0019, design §6.10.

### redactions.log

A gitignored, machine-local NDJSON log at `context/.locks/redactions.log` recording every L1/L3 redaction (`original → placeholder`) — the ONE place the original text survives, so a [[Privacy screen]] false positive is locally recoverable. Surfaced in `cmk doctor` memory-health.

Cross-refs: [[Privacy screen]]. Spec: design §6.10.

### Review queue

A staging file at `context/queues/review.md` where [[Auto-extract subagent]] routes `medium`-[[Trust]] candidates. User reviews via `cmk queue review` and promotes (→ canonical) or discards.

Cross-refs: [[Auto-extract subagent]], [[Trust]], [[Conflict queue]]. Spec: design §6.2.

### Conflict queue

A staging file at `context/queues/conflicts.md` where the [[Memory-write skill]] routes writes that conflict with existing higher-trust observations (similarity > 0.85 + content differs + new.trust < existing.trust). User resolves via `cmk queue conflicts` with `keep-old` / `keep-new` / `merge-both`.

Cross-refs: [[Trust]], [[Review queue]]. Spec: design §6.8.

### Tombstone

A deleted-but-preserved [[Fact file]] moved to `<tier>/memory/archive/tombstones/` under its [[Archive filename]] with `deleted_at`, `deleted_reason`, `deleted_by` added to frontmatter. The original ID still resolves (returns content + "deleted on Y" annotation). Mirrors git revert (don't rewrite history), not git rebase.

Cross-refs: [[Forget]], [[Archive filename]]. Spec: design §6.5.

### Forget

The user-level action that produces a [[Tombstone]]. Triggered by `cmk forget <id>` or by the [[Memory-write skill]]'s `remove` action. Always prompts for confirmation. Never silently deletes.

Cross-refs: [[Tombstone]], [[Memory-write skill]]. Spec: design §6.5.

### Redact

The compliance scrub (Task 96, ADR-0022): `cmk redact <id> --pattern <secret>` removes a leaked secret/PII span from **every app-layer copy** of a fact — the live file, its [[Tombstone]]/[[Superseded]] archive copies, the scratchpad bullet, the search indexes — replacing each occurrence with `[redacted: reason date]`. The fact survives (redact ≠ delete); the audit entry never carries the secret. Per-fact, idempotent, CLI-only (never an MCP tool). Git history is NOT touched — the command prints the rotate-first + `filter-repo` advisory instead (the kit never rewrites history; the human owns git).

Cross-refs: [[Purge]], [[Tombstone]], [[Audit log]]. Spec: design §6.5; ADR-0022; SECURITY.md runbook.

### Purge

The irreversible whole-fact delete (Task 96, ADR-0022): `cmk purge --hard <id> --yes` removes a fact from live + every archive copy + scratchpad bullets + indexes with **no tombstone** — the compliance escalation beyond [[Forget]]. Requires both flags; explicit-human-only, never an MCP tool (the §6.5 separate-destructive-path contract). A secret-free audit entry survives.

Cross-refs: [[Redact]], [[Forget]], [[Tombstone]]. Spec: design §6.5; ADR-0022.

### Recall ladder

The tiered recall discipline codified in the memory-search skill (Task 226, D-326): **search the index → expand the hit's neighborhood → (optionally) timeline across time → fetch full bodies → LAST RESORT: the session record** — stop at the shallowest rung that answers. The **expand rung** (`cmk expand` / `mk_expand`) is the middle rung the kit long implied but never built: a hit's enclosing heading section from its SOURCE file (sibling bullets, the surrounding day-file entry), bounded by a per-expand char cap — file-adjacent context, where `mk_timeline` is time-adjacent context. Works on both hit-id shapes (`P-XXXXXXXX` fact ids and `T:<file>:<line>` transcript-chunk ids).

Cross-refs: [[Bootstrap import]], [[Provenance frontmatter]]. Spec: design §9.4; the memory-search skill; D-326/D-356.

### Bootstrap import

The `cmk import-sessions` pipeline (Task 225, the v0.6.0 headline): existing Claude Code session history (`~/.claude/projects/<slug>/<uuid>.jsonl`) is discovered, extracted to a gitignored raw floor (`context/transcripts/imported/`), summarized per-session through the agent backend into the [[Rolling window]] day-file shape "as if captured live" (privacy instruction in the same call, L1 mask + the Task-216 screen before the committed write), and made searchable immediately. Idempotent + resumable via the committed **import ledger** (`context/sessions/imported-sessions.md`) — the artifact-derived resume point that survives weekly-curate's rotation of the day files; a re-run imports only new sessions. Deliberately NOT a run-once sentinel (rejected: can't recover a killed run, can't catch up later).

Cross-refs: [[Rolling window]], [[Poison_Guard]], [[Provenance frontmatter]]. Spec: design §22; ADR-0010, ADR-0019, ADR-0020; D-326/D-355.

### Re-curation pass

The kit's offline-consolidation organ (Task 95; the "dream" pass — designed 2026-07-18, D-352, build lanes after v0.6.0): a batched, roll-scheduled pass that reads **raw transcripts + the fact corpus + scratchpads** and produces re-curation ops — merge duplicates, resolve contradictions latest-wins (event-time decides, never the LLM), surface cross-session insights, prune resolved scratchpad threads. Three stages: deterministic dedup floor → ONE batched LLM call proposing `{add, update, supersede, none}` ops → code-validated application under the **op-class split**: non-destructive ops auto-apply inside a screened envelope; lossy/generative ops land as an adopt-or-discard diff in a review queue. Inputs are never modified; the source tier prunes only after adoption. Absorbs F-D (semantic dedup), Task 55's insight-surfacing remainder, and Task 68 (thread pruning).

Cross-refs: [[Validity window]], [[Temporal sweep]], [[Tombstone]], [[Poison_Guard]]. Spec: design §21; D-352/D-353; the [Task-95 synthesis](../docs/research/2026-07-18-task-95-design-input-synthesis.md).

### Validity window

The time span a `State`-shaped fact's claim held true: `created_at` (open) → `ended_at` (close), with `status: completed` and a [[Superseded]] link once closed. The window closes at the SUPERSEDING fact's `created_at` — event-time decides the boundary, never the wall clock and never the LLM (which only classifies the pair; see [[Temporal sweep]]). Closed facts move to `archive/superseded/` — never deleted; point-in-time history stays readable. Task 66.2, D-259.

Cross-refs: [[Fact shape]], [[Temporal sweep]], [[Superseded]]. Spec: design §16.18.

### Temporal sweep

The weekly judged contradiction-catch (Task 66.4, D-259 — the corpus-measured design): for each fact written since the last pass, same-subject candidates are retrieved with the kit's own search (quoted-token FTS5 OR-query), and ONE batched Haiku call classifies each pair — SUPERSEDES (close the older [[Validity window]]), DUPLICATE (bump `recurrence_count` — the restatement signal), COEXIST (drop). Runs in weekly-curate's Haiku cycle; marker-incremental; a judge failure re-derives the pairs next pass. The next SessionStart injects a one-line mention of what was resolved.

Cross-refs: [[Validity window]], [[Recurrence gate]], [[Trust score]]. Spec: design §16.18; research: the 2026-07-02 bake-off note.

### Declared expiry

A validity end the WRITER states at capture time — the `expires_at` field in [[Provenance frontmatter]] (`cmk remember --expires`, `mk_remember expires`, or auto-extract for a date the turn itself states). The first moment the fact no longer holds (exclusive end). Once past: hidden from search by default (`--include-expired` reveals — human-only, like [[Tombstone]] recovery) and tombstoned by the weekly-curate sweep (audited, recoverable — never hard-deleted). Distinct from staleness aging (the 14-day [[Consolidation]] drop): a declared end never renews on access. Task 66.3, D-258.

Cross-refs: [[Tombstone]], [[Fact shape]], [[Provenance frontmatter]]. Spec: design §16.18 + §4.

### Superseded

A [[Fact file]] replaced by a newer one (via [[Consolidation]] merge or `replace` action). Original is moved to `<tier>/memory/archive/superseded/` under its [[Archive filename]], with `superseded_by: <new_id>` added. Both old + new IDs resolve forever.

Cross-refs: [[Consolidation]], [[Merge]], [[Archive filename]]. Spec: design §3.4.

### Merge

The operation that combines two [[Fact file]]s `A` and `B` into a new `C` with `C.frontmatter.merged_from = [A, B]` and `A.frontmatter.superseded_by = C` (same for B). Used by the weekly curator and by manual `cmk merge`.

Cross-refs: [[Superseded]], [[Citation ID]]. Spec: design §3.4.

### Shadowed_by log

The append-only log at `context/.locks/shadowed_by.log` capturing every event where the [[Precedence model]] picked one tier's observation over another tier's same-ID observation. Format: NDJSON, one line per shadowing event.

Cross-refs: [[Precedence model]]. Spec: design §7.1.

### Audit log

The append-only NDJSON log at `<tierRoot>/.locks/audit.log` capturing every mutating operation across the kit: `writeFact` skips (duplicate / duplicate-elsewhere), `forget` tombstones, `mergeFacts` merges, and (Layer 4+) `memory-write` and trust overrides. Canonical schema v1: `{ts, schema: 1, action, tier, id, reasonCode, reasonText?, paths: {before?, after?, archive?}, extra?}`.

**Canonical writer**: all writers use `appendAuditEntry(tierRoot, entry)` from [`packages/cli/src/audit-log.mjs`](../packages/cli/src/audit-log.mjs). Don't append directly. Schema-version field defends against future migrations.

Cross-refs: [[Result shape]], [[Tombstone]], [[Merge]]. Spec: design §6.1 + §1.3.

### Result shape

The canonical return-shape contract for every cmk public boundary. Write-side boundaries return:

- **`{action, id, path, ...extras}`** on success, where `action ∈ {created, skipped, tombstoned, merged, cancelled}`
- **`{action: 'error', errorCategory, errors, ...}`** on validation/runtime failure
- **`{action: 'not-found', errors}`** on lookup failure

Where `errorCategory ∈ {schema, collision, not-found, concurrent_run}` — defined in [`packages/cli/src/result-shapes.mjs`](../packages/cli/src/result-shapes.mjs). Read-side boundaries (`resolveFact`) use a `state` field (`{live, tombstoned, superseded, not-found}`) instead of `action`.

Cross-refs: [[Audit log]]. Spec: design §1.3.

---

## Compression & rolling-window

### Rolling-window compression

The four-layer pipeline that distills session activity into progressively smaller, more durable summaries: `sessions/now.md` → `today-{date}.md` → `recent.md` → `archive.md`. Each layer is compressed from the layer below.

Cross-refs: [[Compression]], [[CompressorBackend]], [[Lazy compression]]. Spec: FR-19, FR-20; design §8.1.

### Compression

The specific operation of running a [[CompressorBackend]] (e.g., Haiku) over a transcript or session file to produce a shorter summary. Preserves [[Citation ID]]s verbatim. Cooldown: 120 s minimum between Haiku calls.

Cross-refs: [[Rolling-window compression]], [[CompressorBackend]]. Spec: FR-20; design §8.

### CompressorBackend

The pluggable interface for running the automatic engine's LLM call (defined in v0.1 per ADR-0008, made multi-impl in v0.4.5 by Task 200). One implementation **per agent**, selected by `makeBackend({projectRoot})` on the installed-for agent (or the `backend.agent` split-brain override): `HaikuViaAnthropicApi` (Claude Code — `claude --print`), `KiroCliBackend` (Kiro — `kiro-cli chat`), `CursorAgentBackend` (Cursor — `cursor-agent -p`), `CodexExecBackend` (Codex — `codex exec --json`). Each runs off the user's existing agent login (no API key). This is what lets the automatic engine work for a Cursor-only / Kiro-only user (closing the D-270 gap). A future cloud-API-key backend (`BedrockHaiku`, `LocalLlama`) remains a candidate per ADR-0008 but is not shipped.

Cross-refs: [[Compression]]. Spec: ADR-0008; design §8.3.

### Lazy compression

The [[SessionStart hook]]-triggered fallback when cron is unavailable. Detects stale compression outputs via mtime checks, spawns `cmk compress --lazy` detached. Non-blocking — current session uses whatever state existed at SessionStart; next session gets the freshly compressed state.

Cross-refs: [[Rolling-window compression]], [[SessionStart hook]]. Spec: design §8.2.1.

---

## CLI & tools

### `cmk`

The Node binary that ships with the kit. Subcommands per design §12. Implementation: `@lh8ppl/core-memory-kit` npm package.

Spec: FR-22, FR-23; design §12.

### `cmk roll`

The manual force-roll command that invokes the same compression internals as the [[SessionEnd hook]]/cron but on user demand. Flags: `--scope now|today|recent`.

Cross-refs: [[Rolling-window compression]]. Spec: design §12; T-033.

### Backfill

A reconstructed `sessions/today-{date}.md` for a day that has **git commits but no session log** — the capture path missed it entirely (a crashed session, a misfired hook, or a day worked in another tool and only committed). `daily-distill` sweeps for these gaps and rebuilds the day from its commit messages; `cmk backfill` is the manual override. Every reconstruction carries a marker so it is never mistaken for a captured session, and a real log is **never** overwritten (real > reconstructed, always). Distinct from [[Distillation]], which compresses what the kit DID observe. Introduced Task 174 (v0.6.1) after a probe found 37.5% of this repo's own working days had commits and no record.

### `cmk doctor`

The diagnostic command that runs all 16 health checks (HC-1..HC-16) and prints a structured report with documented self-repair commands for any failures.

Cross-refs: [[Health check]]. Spec: design §14; T-031.

### `cmk import-anthropic-memory`

The explicit bridge command that merges useful bullets from Anthropic's auto-memory location (`~/.claude/projects/<slug>/memory/MEMORY.md`) into the project tier with `write_source: imported`, `trust: medium`. Always user-confirmed, never automatic.

Cross-refs: [[Coexistence (Option D)]]. Spec: design §11.2.

### MCP server

The local subprocess that exposes 6 tools (`mk_search`, `mk_get`, `mk_timeline`, `mk_cite`, `mk_remember`, `mk_recent_activity`) to Claude Code via stdio JSON-RPC. Transport: **stdio** (per MCP spec).

Cross-refs: [[MCP tool]]. Spec: FR-26; design §10.

### MCP tool

One of the 6 callable functions exposed by the [[MCP server]]. Each tool has a documented input schema, output shape, and response size.

Spec: design §10.

### Health check (HC)

One of 16 yes/no diagnostics run by [[`cmk doctor`]]. Each has a documented self-repair path. HC-1..HC-16 cover hooks/distill/transcripts/INDEX/cron; HC-6 detects whether Anthropic's native Auto Memory is active; HC-7 checks for stale lock files; HC-13 is the advisory [[Stray tier]] backstop; HC-14 is the advisory active-kit-health-warnings backstop; HC-16 catches a fact on disk that can never be indexed (unusable id / unparseable frontmatter), the invisible-but-durable population; HC-15 audits that each fact's semantic vector really is its own (design §9.3.2). (The two memsearch checks were removed in Task 120.)

Spec: design §14.

### Health log

The kit's own append-only failure record, at `context/.locks/health.log` (NDJSON, the gitignored run-time-state tier — same class as the [[Audit log]]). One line per instrumented operation: `{ts, schema, class, outcome: 'ok'|'fail', detail?}`. Instrumented ops append **both** outcomes, because the `ok` is what clears a warning. Event-driven only — nothing probes the environment to fill it. It carries no derived state: the set of currently-active warnings is computed from its tail on every read.

Cross-refs: [[Failure code]], [[Health whisper]], [[Audit log]]. Spec: design §23.2; D-412.

### Failure code

The stable identifier for one class of kit failure — `agent-cli-missing`, `extract-failing`, `inject-failing`, `precompact-failing`, `index-drift`, `mcp-tool-failing`, `cron-settings-unapplied`. It is the key that ties the three surfaces together: the instrumented op writes it to the [[Health log]], the [[Health whisper]] names it, HC-14 reports it, and the `troubleshooting` skill's repair book is sectioned by it. A code is **active** only when its evidence clears the [[Strike threshold]] and is under 7 days old.

Cross-refs: [[Health log]], [[Warnable registry]], [[Health whisper]]. Spec: design §23.2.

### Warnable registry

The frozen table of [[Failure code]]s and their properties, borrowed in shape from Tailscale's `Warnable` struct: `code`, `title`, `severity` (`memory-off` | `degraded` | `advisory`), `dependsOn` (cascade suppression — an active upstream code hides its downstream codes, so one root cause produces one warning), `primaryAction` (the exact repair command), `fixClass` (`silent` | `confirm` | `advise` — how much authority the troubleshooting skill has to apply the fix), `deterministic`, and [[Strike threshold]]. It is the extension point: a new failure class is a registry entry plus its instrumented site plus a repair-book section.

Cross-refs: [[Failure code]], [[Strike threshold]]. Spec: design §23.2; the [self-healing-CLI-repair-UX note](../docs/research/2026-07-29-self-healing-cli-repair-ux.md).

### Strike threshold

The noise gate on the [[Health whisper]]: how many **consecutive** `fail` outcomes for one [[Failure code]], with no `ok` between them, before it is treated as real. **Derived** from whether the failure can transiently recover on its own — a `deterministic` failure (a missing binary is missing until someone installs it) fires on **1**; a stochastic one (a spawn timeout, an API blip) needs **2**. A success resets the streak, which is what makes the warning self-clean with no state to reset.

Cross-refs: [[Health whisper]], [[Warnable registry]]. Spec: design §23.2; D-412.

### Health whisper

The one-line warning the UserPromptSubmit hook injects (as `additionalContext`, model-facing) while a [[Failure code]] is active: the failure, a pointer to the `troubleshooting` skill, and the exact fix command. **Stateless** — present on every prompt while the failure is active and gone the moment a success lands, with no "already warned" record anywhere. Computed independently of the per-prompt recall hint that shares the same hook output, so it still fires on a two-character prompt or a project with no archive — the shapes a broken kit actually has. At severity `memory-off` a user-visible `systemMessage` line is added alongside it.

Cross-refs: [[Failure code]], [[Strike threshold]], [[Health log]], [[Health check (HC)]]. Spec: design §23.3; D-412.

---

## Privacy & safety

### `<private>` tag

An inline tag (`<private>...</private>`) used in user prompts to mark content that must never be written to disk in any form. Stripped at hook level (UserPromptSubmit + Stop); replaced with `[private content redacted]`.

Cross-refs: [[`<retain>` tag]], [[`private: true` flag]]. Spec: FR-15; design §6.6.

### `<retain>` tag

An inline tag (`<retain>...</retain>`) used in user prompts to force-keep content the [[Auto-extract subagent]] might otherwise skip. Tags themselves are stripped from saved content.

Cross-refs: [[`<private>` tag]]. Spec: FR-15; design §6.6.

### `private: true` flag

A per-[[Fact file]] frontmatter boolean. When `true`: fact exists on disk, is searchable, but is excluded from the [[Frozen snapshot]] and from cross-project promotion. Different from `<private>` tag, which redacts at the *transcript level* before any write.

Cross-refs: [[`<private>` tag]]. Spec: design §6.6.

---

## Coexistence with Anthropic Auto Memory

### Coexistence (Option D)

The strategy in which our kit and Anthropic's native Auto Memory **both run**, both write (to different locations), and both load into Claude's context at session start. Ours is canonical (committed to git, audited); theirs is supplementary (machine-local capture).

Cross-refs: [[Native Auto Memory]]. Spec: ADR-0011; design §1.2, §11.

### Native Auto Memory

Anthropic's built-in memory feature (Claude Code v2.1.59+) that writes to `~/.claude/projects/<slug>/memory/`. NOT disabled by the kit. Detected by HC-6.

Cross-refs: [[Coexistence (Option D)]]. Spec: ADR-0011; design §11.

---

## Test & engineering discipline

### TDD (Test-Driven Development)

The workflow used for v0.1.0 implementation: **write the test first**, let the agent implement, verify, repeat. Small cycles. Test sub-tasks live inside each task in [`tasks.md`](tasks.md). All tests are run by the agent (Claude), not the human.

Cross-refs: [[Checkpoint]], [[Boundary testing]]. Spec: tasks.md intro.

### Boundary testing

Testing the **public interface** of a module, not its internal helpers. Per Ousterhout's "A Philosophy of Software Design": deep modules expose simple interfaces; tests target those interfaces so they survive refactors. Example: test `writeFact()` contract (file created, frontmatter correct, error category on schema violation), NOT the private `_parseFrontmatter()` helper.

Cross-refs: [[TDD]]. Spec: tasks.md intro.

### Checkpoint

A non-implementation task that gates progress between layers in [`tasks.md`](tasks.md). The agent runs the full test suite and confirms zero failures before moving to the next layer.

Cross-refs: [[TDD]]. Spec: tasks.md.

---

## Where this glossary IS NOT the source

- **FR / NFR specifications**: [`requirements.md`](requirements.md).
- **Architectural decisions with full rationale**: [`docs/adr/`](../docs/adr/).
- **Step-by-step build sheet**: [`tasks.md`](tasks.md).
- **HOW the system works**: [`design.md`](design.md).

This file is a **definitional reference only**. When you need the *why*, follow the spec-source link on each term.

## Judgment

An EARNED method-preference record (`context/memory/judgment_<slug>.md`, `type: judgment`) — distinct from a fact: a fact asserts, a judgment COMPARES ("for task-shape T, prefer A over B") and carries its baseline, replication count (`n_episodes`), direction-consistency, confounds, decay date, and an append-only evidence log of HIT/MISS/REVERSAL outcomes resolved from pre-registered expectations (`PREDICTION:` lines). Honesty rules: misses LOCK (a MISS/REVERSAL flips it `contested` and later HITs cannot re-promote), hits only NUDGE (`corroborated` needs >= 3 consistent episodes), preference cycles mark every judgment on the cycle `contested`, and judgments must NEVER enter score-blended ranking (Task 194's blend is facts-only BY CONTRACT - today, pre-194, they surface in plain keyword search like any fact; the observations table carries no type column, so 194's filter keys on the judgment_ source-file prefix). Born from the learn-loop (Tasks 191/192), never from dictation — `cmk remember`/`mk_remember` cannot write this type. Task 191, ADR-0017 Phase 1b.

## Stale-replay guard

The caveat line the session-start snapshot appends under its **work-state** headings (`Active Threads`, `Pending Decisions`) — *"work-state as last captured — may already be done; verify before acting, never re-run"*. It separates **durable knowledge** (authoritative) from **transient work-state** (a snapshot of intent), so the injected memory's "memory wins" authority cannot be read as licence to re-run work that already shipped. Labelling, never deletion — work-state stays useful for resumption. See design §7.1.4; Task 234, D-364.

## Extraction fallback

The deterministic, LLM-free capture path that runs when automatic extraction fails for **any** reason (timeout, error, or an unrecognized category). It keeps durable statements from the user's own turn so capture degrades to *partial* rather than zero. Deliberately conservative: **mission context only** (never the kit's own operational noise), exclude-on-doubt, routed by trust through the normal review queue, and written with its own `auto-extract-fallback` provenance so a heuristic capture is never mistaken for a real extraction — or for something the user said. See design §6.4b; Task 242, D-369.

## Anchor citation

A structured reference the kit itself defines, mentioned in a [[Fact file]] BODY: a decision (`D-nnn`), task (`Task nnn`), ADR (`ADR-nnnn`), requirement (`FR-nn`/`NFR-nn`), or bare kit fact id (`[PUL]-XXXXXXXX`). At reindex the kit parses that citation lattice (code fences stripped so literals never count) into `cites` [[Edges table]] rows — a **capped star**: each anchor is one hub node, each citing fact one spoke (a 50-fact group costs 50 edges, linear — never all-pairs). A doc-anchor becomes an `anchor:`-namespaced non-file node (`anchor:D-361`, `dst_resolved: 0`); a cited fact id is a direct fact→fact edge. Two noise guards keep only real hubs: a **single-citer floor** (`MIN_ANCHOR_CITERS`, doc-anchor cited by ≥2 distinct facts) and a **document-frequency ceiling** (`ANCHOR_DF_CEILING_RATIO`, drop an anchor cited by >half the corpus as a stopword); fact-id citations are exempt (a direct edge is always signal). Queryable — `cmk links D-361` answers "what cites D-361" — and rendered as browsable hubs in the `## Cited anchors` section of the [[Vault map (`MAP.md`)]]. See design §9.5.1; Task 256, ADR-0023 (ACTIVATE slice), D-400.

## Edges table

The kit's **relational adjacency** index — a rebuildable `edges(src, dst, type, dst_resolved)` table in the SQLite cache, built at reindex from the markdown the kit already writes: `related:` frontmatter (`type: related`), `[[slug]]` body wikilinks (`type: link`), the `superseded_by` chain (`type: superseded_by`), and body **[[Anchor citation]]s** (`type: cites` — Task 256). `src`/`dst` are kit ids (a `related`/`link` `dst` falls back to the raw slug with `dst_resolved: 0` when it points at no live fact; a `cites` `dst` is either a cited fact id or an `anchor:`-namespaced doc-anchor node). Rebuilt byte-stable from markdown alone (ADR-0002), zero LLM, no third index class. It powers the **relational axis** — the fourth beside `expand` (source-file), `timeline` (time), and `--scope decisions` (evolution) — answering the graph-only shapes flat search can't: **backlinks** (what points AT a fact), **supersession chains** (what replaced what, in order), and **what cites an anchor** (which facts reference D-361). Queried via `cmk links` / `mk_links`. See design §9.5 / §9.5.1; Task 232, Task 256, ADR-0023, D-392, D-400.

## Vault map (`MAP.md`)

The **generated map note** that makes the memory tier browsable in [Obsidian](https://obsidian.md). `context/memory/` is already markdown, so Obsidian opens it as a **vault** (search, backlinks, graph) — but the kit's own edges don't resolve there on their own (fact files are `<type>_<slug>.md`; the edges reference bare slugs/ids). `MAP.md` renders every fact as a resolvable `[[<type>_<slug>]]` wikilink, grouped by type, with its `related`/`link` set and supersession rendered as links, plus a `## Cited anchors` section clustering facts under the decision/task/ADR anchors they cite ([[Anchor citation]], Task 256) — so the **whole** corpus graph lights up from one note, without rewriting any fact file. Generated by [`vault-map.mjs`](../packages/cli/src/vault-map.mjs) at reindex (beside `INDEX.md`), byte-stable, best-effort, zero LLM — a pure export-format over the same markdown (ADR-0002). Paired with a forward-only `aliases: [<id>]` on new facts so `[[P-XXXX]]` id references resolve too. Generated + rewritten on every reindex → **do not hand-edit** (edits are overwritten; edit facts, not the map). The cheap **companion** to the kit's own viewer (Task 255), not a replacement — Obsidian can't show trust tiers, conflict queues, or doctor status. See design §9.6, [`docs/OBSIDIAN.md`](../docs/OBSIDIAN.md); Task 254, D-397.

## Stray tier

An **orphaned `context/` (or `context.local/`) tier sitting below the project root** — a second, unread copy of the memory layout that a pre-v0.6.2 capture bug (D-389) forked whenever the agent's working directory was a subdirectory of the project. It holds REAL facts nobody reads: every recall surface looks at the ROOT tier, so `cmk doctor` stayed green over it. Distinguished from a template scaffold by **live state** — a fact file, a populated `INDEX.md`, a non-empty `sessions/now.md`, or another populated surface. Task 246 closed the source (`resolveHookProjectRoot`); Task 248 added the recovery: `cmk install` copies a stray's facts into the root tier byte-identically (ids + `created_at` preserved — see [[Faithful relocation]]), skips collisions, leaves the husk untouched with a platform-correct delete hint, and `cmk doctor` **HC-13** names any that remain as an advisory WARN. See design §13.2; [[Health check (HC)]].

## Faithful relocation

The rule that moving a fact between tiers **copies its bytes, never re-captures its content** — `id` and `created_at` survive exactly. A re-capture would stamp today's date on an old fact and, because ids are content-addressed ([[Citation ID]]), re-key it — producing a different fact wearing the same words and silently rewriting the memory's history. Applies to [[Stray tier]] recovery (Task 248) and to every archive move (`archive/tombstones/`, `archive/superseded/`). Recorded as `P-9W7XDMCA`.

## Memory viewer (`cmk view`)

The kit's own **read-only browser UI** over the memory it manages, and the counterpart to the [[Vault map (`MAP.md`)]] Obsidian companion — this one renders the *kit-semantic* surfaces Obsidian structurally cannot: trust tiers, supersession as a direction, health warnings, the decision journal. **Ephemeral by design** (the datasette lifecycle, deliberately not the resident-daemon shape the field's viewers use): `cmk view` binds a free port on **127.0.0.1 only** — non-loopback is refused, because it serves the user tier over plain HTTP with no authentication and there is no auth mode to enable — serves five views until Ctrl-C, and leaves nothing running. **Read-only STRUCTURALLY**: no mutating route is mounted at all (not auth-gated — absent, ADR-0018), so anything other than `GET`/`HEAD` is `405`; the answer to "delete it from here" is the copy-able `cmk forget` / `cmk trust` command beside every fact. **API-first**: HTML and JSON answer from the same route (`/facts`, `/facts.json`, `/api/facts`, or `Accept: application/json`), so the server doubles as the kit's local read API. Zero new dependencies — node's `http`, one committed HTML file, the existing FTS index. **Live refresh shipped in Task 259** (design §24.1.3): a `text/event-stream` at `/events` — still a GET, so the read-only guarantee is untouched — pushes a notification when a 2 s `statSync` poll over a fixed artifact list sees the tier change, and the page re-reads the current view without moving the reader's query, tier filter or page. No watcher was written (`fs.watch`/chokidar was evaluated and rejected on D-329's measured event loss), no dependency was added, and no CSP change was needed (`connect-src 'self'` already governed it). The manual Refresh and the [[Freshness label]] both survive it — the server is ephemeral, so the stream can end for good, and the page says so. See design §24; Task 255, Task 259, D-121, D-397, D-414, D-450.

## Freshness label

The per-view "**as of HH:MM**" stamp in the [[Memory viewer (`cmk view`)]] — every view states where its data came from and how stale it is, instead of implying it is live. Borrowed from PAI/Pulse's `TabFreshness` (the 2026-08-02 viewer survey). **Original rationale (wave 1, Task 255):** the viewer had *no* filesystem watch and no server-sent events — a deliberate exclusion, the one platform-sensitive moving part, deferred to Task 259 — so a page left open WAS stale, and the honest move was to say so and offer a Refresh rather than let the user assume otherwise. **Since Task 259 (2026-08-09, D-450) the label carries a second half and the same job:** it now also states whether the page is still being told about changes — `live` while the stream is connected, *"memory changed — Refresh to see them"* on the graph (which does not auto-redraw under the reader's cursor), and *"live off (server stopped — restart `cmk view` and reload)"* once the stream has given up. The reason it still exists is unchanged and is now sharper: the viewer is ephemeral, so the stream CAN end permanently (the next `cmk view` binds a different port), and a page that has stopped updating must say so. Silent staleness — a page that looks live and is a photograph — is the failure this label exists to make impossible. Same discipline as the kit's other honest-degrade surfaces: state the limit, don't paper over it.

## Quarantine

The holding area — `context/memory/archive/quarantine/` — for a fact-shaped file the kit **cannot** repair: unparseable frontmatter, or no body from which to derive a content-addressed id. The file is MOVED there with its bytes intact and reported; it is never deleted and never silently dropped (D-394). It sits under `archive/` beside `tombstones/` and `superseded/` because all three are "not a live fact, still kept" — and because every fact walk skips subdirectories while `cmk redact` still scans them, so a quarantined file stays inside a leak scrub's reach. The repairable case is handled instead: the id is recomputed from the body and written back, every other byte preserved. See design §13.2.

## Archive filename

The name an archived [[Fact file]] gets on disk — a **derivation of** its [[Citation ID]], not the id verbatim. Files under `archive/tombstones/` and `archive/superseded/` are named by escaping **both** members of the alphabet's one case-pair: `a` → `_a` and `A` → `_b`. For the ~60% of ids containing neither character the derived name IS `<id>.md`.

It exists because the alphabet keeps both `A` and `a` (design §3.1), so two valid distinct ids differing only in case map to ONE path on a **case-insensitive filesystem** (Windows, macOS default) — collapsing two [[Tombstone]] files into one and destroying the first. That is a durability failure, not a cosmetic one: the install-time recovery census reads the tombstone archive to avoid resurrecting a forgotten fact, so a destroyed tombstone can **undo a [[Forget]]**. Escaping both members buys two properties: the map is **injective under case folding** (no two ids share a derived name) *and* the derived namespace is **disjoint from every legacy raw name** (so writing into a pre-Task-281 corpus can never land on another id's existing file). Escaping only `a` gives the first but not the second. Because a collision a pre-fix version already wrote cannot be undone by naming alone, every archive resolution additionally **verifies the file's own frontmatter id**: a file claiming a different id reads as not-found rather than as the wrong fact, and is never unlinked by a purge aimed at its neighbour.

The derivation lives in ONE helper (`fact-store.mjs`) that every write / read / purge / parse site shares; reads fall back to the legacy raw-id spelling so existing corpora keep working with no migration, and archive files are never renamed after the fact. The alternative — dropping `a` from the alphabet — was rejected because it would not fix ids already minted (D-451).

Cross-refs: [[Tombstone]], [[Superseded]], [[Citation ID]], [[Quarantine]]. Spec: design §6.5 + §3.1.
