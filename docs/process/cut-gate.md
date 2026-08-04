# cmk — full test + cut gate

**The single guide to run before tagging a release.** Version-agnostic — reused every cut.

> **Cutting now: `v0.5.4`** — **THE RENAME** (Task 195 / ADR-0021): `claude-memory-kit` → **`core-memory-kit`**. The `cmk` command is UNCHANGED (the name was chosen to keep the initialism); what changed is the outward IDENTITY — the npm package (`@lh8ppl/core-memory-kit`), the GitHub repo (`LH8PPL/core-memory-kit`), the scaffolded instruction filenames (`.cursor/rules/` + `.kiro/steering/core-memory-kit.*`), the managed-block marker (`core-memory-kit:start`), and **the default user-tier dir `~/.core-memory-kit`** (a direct swap — no migration; the sole user reinstalls). `MEMORY_KIT_USER_DIR` still overrides.
> **What this cut most needs to verify is the IDENTITY surfaces, not new behavior** (there are no new features): §0 the tarball packs as `lh8ppl-core-memory-kit-<v>.tgz`; §1 a real install from it scaffolds under the new name, `cmk doctor` clean, HC-9 marker reads `core-memory-kit:start v0.5.4`, and G4's tier read points at **`~/.core-memory-kit`** (already updated in the commands below). **The package-rename install flow** (the real-user path): `npm uninstall -g @lh8ppl/claude-memory-kit` FIRST (it owns the `cmk` shim), then `npm install -g` the new tarball — a plain `-g` over the old package EEXISTs on the shim. The leak/name-privacy screen (a home path → `~`) is the other high-value check.
> This is a **RELEASE** (`npm run release -- 0.5.4`), the v0.5.4 headline — a clean single-purpose rename; the governance batch (96/210) slid to v0.5.5. No new CLI verbs / MCP tools; doctor stays at **11 checks**. Run §0–§1 + the leak/round-trip probes (the identity surfaces); the §2–§9 live-IDE feature ladder re-tests unchanged behavior, so it's optional for a no-feature rename cut (risk-scoped rule). <!-- validate-docs: ignore (point-in-time: the count as it stood at THIS cut — HC-12 shipped v0.5.5, HC-13 v0.6.3; a banner is a record, not a live claim) -->
> _Replace `0.5.4` / `v0.5.4` in the commands below if you reuse this guide for a later cut._
>
> **Prior banner (v0.5.1 cut, kept per the decision-trail rule)** — **the HARDENING patch** (Tasks 203–207, 213–216, 219, 220):
> the rolling-window pipeline is now **incremental + resumable** (ADR-0020 — a killed 23:00 distill keeps every finished day; the D-298 starvation fixed, with per-day provenance headers in `recent.md`),
> **every LLM-summary / promotion side door screens through Poison_Guard** (Task 216 / D-320 — curate/distill input+output, transcript promote, persona queue, trust increases),
> the nightly distill runs **windowless** on Windows (Task 215 — the black-box popup),
> hook payloads parse **BOM-tolerantly** across all 11 bins (Task 207 — the delete-guard fail-open),
> duplicate managed blocks **FOLD** on install / remove-all on uninstall + HC-9 flags them (Task 220 / D-322),
> and HC-10 now checks the **OUTCOME** (a fresh heartbeat can no longer mask a stale `recent.md` — Task 203).
> **The v0.5.1 cut-blocker gates are HG1–HG6 (§4g)** — all CLI-deterministic. Two honest MANUAL flags: the transcript **withhold** marker (LLM-session-driven) and the 23:00 **no-window** firing (overnight observation) — see §4g.
> This is a **PATCH** (`npm run release -- patch`) — reliability + security hardening within the existing paradigm, no new differentiator. No new CLI verbs / MCP tools; doctor stays at **11 checks** (HC-9 + HC-10 behavior extended). <!-- validate-docs: ignore (point-in-time: the count as it stood at THIS cut — HC-12 shipped v0.5.5, HC-13 v0.6.3; a banner is a record, not a live claim) -->
> _Replace `0.5.1` / `v0.5.1` in the commands below if you reuse this guide for a later cut._
>
> **(v0.5.0 note, decision-trail):** the v0.5.0 cut (cross-agent capture — the D-305 `/c:/` path + D-306 BOM fixes) was gated through the PER-AGENT guides — [`cut-gate-kiro.md`](cut-gate-kiro.md) / [`cut-gate-cursor.md`](cut-gate-cursor.md) — not a banner here; the Cursor interactive leg (Task 208) is pending its token-refresh trigger (~2026-07-24).
>
> **Prior banner (v0.4.5 cut, pre-2026-07-11 — kept per the decision-trail rule):** **the AGENT-RELATIVE BACKEND patch** (Task 200 + 201): the automatic engine (compression / auto-extract / persona / temporal-sweep / daily-distill / weekly-curate) now runs the LLM call through the **user's own agent CLI** (`claude --print` / `kiro-cli chat` / `cursor-agent -p`) instead of a hardcoded `claude` binary — closing the **D-270** silent-no-op bug for Cursor-only / Kiro-only users (design §16.50.4).
> **New user surfaces:** `cmk install --backend <agent>` + `cmk config set backend.agent <agent>` (the **split-brain** override — run automatic memory through a DIFFERENT agent than you code in, Task 201/D-277), `cmk config show` (the setup readout), and **`cmk doctor` HC-11** (backend LLM CLI present — exit-code probe, honest degrade when absent). Doctor now has **11 checks (HC-1..HC-11)**. <!-- validate-docs: ignore (point-in-time: the count as it stood at THIS cut — HC-12 shipped v0.5.5, HC-13 v0.6.3; a banner is a record, not a live claim) -->
> **The v0.4.5 cut-blocker gates are BK1–BK4 (§4f).** BK1 (HC-11 present/absent), BK2 (`cmk install --backend` + fail-fast-on-bad-value + effective-backend warn), BK3 (`cmk config show` reflects the override) are **CLI-deterministic**. **BK4 — the automatic engine actually running the compress/auto-extract through a NON-claude agent CLI (kiro-cli / cursor-agent) — is a live cross-agent MANUAL flag** (a Claude-Code-only operator can't always live-test a 2nd agent's CLI; run it where the CLI is present, else flag honestly — see §0). This is a **PATCH** (`npm run release -- 0.4.5`) — within-paradigm plumbing (the backend seam existed since ADR-0008), no new differentiator.
> _Replace `0.4.5` / `v0.4.5` in the commands below if you reuse this guide for a later cut._
>
> **Prior banner (v0.4.4 cut, pre-2026-07-06 — kept per the decision-trail rule):** the TEMPORAL-VALIDITY patch —
> **Task 66** (temporal validity — a `shape` field + a declared `expires_at` + a weekly expiry sweep + a temporal-supersede window-close; design §16.18, D-258/D-259 — the headline) and **Task 150** (the memory-commit proposal — SessionStart *proposes* a `context/` commit, never runs git itself; ADR-0018).
> **The v0.4.4 cut-blocker gates are TV1–TV4 + MC1 (§4e).** TV1/TV2/TV3 + MC1 are CLI-deterministic; **TV4's full sweep verdict is a live-Haiku judge** — run `cmk weekly-curate` on THIS repo's real corpus and confirm sensible verdicts with **no false SUPERSEDES** (the deterministic close-mechanics leg is suite-covered). The **66.3 auto-extract expiry SUGGESTION** (must invent no unstated date) + the **MC1 spoken relay** are LLM-driven MANUAL flags — see §0.
> **141a (the npm-12 install-time ask) already shipped in v0.3.x** (PR #169, D-260) — it is NOT a v0.4.4 item; nothing to test for it here.
> This is a **PATCH** (`npm run release -- patch`) — the recall differentiator shipped at 0.3.0; temporal validity is additive polish within the same paradigm, so patch-level per RELEASE-PLAN.md + the one-differentiator-per-minor rule.
> _The version-agnostic checks below stand every cut; the v0.4.4-specific gates are **TV1–TV4 + MC1**._
> _Replace `0.4.4` / `v0.4.4` in the commands below if you reuse this guide for a later cut._
>
> **Prior banner (v0.3.2 cut, pre-2026-07-02 — kept per the decision-trail rule):** the within-paradigm POLISH patch — **Task 153** (FTS5 query sanitization — `cmk search "v0.3"` / `user-explicit` no longer crash) and **Task 152** (`validate-index-completeness` — dev-tooling). The v0.3.2 cut-blocker was **FQ1**; DJ1–DJ3 ran but were journal-CODE checks held for the v0.3.3 feature framing (D-164). 141b (`node:sqlite`) was REJECTED on perf (D-162).
> **Prior banner (v0.3.1 cut, pre-2026-06-16 — kept per the decision-trail rule):** the within-paradigm sweep (config / import-claude-md / near-dup-at-write / status line / memory-health doctor / Poison_Guard catalog / npm-12 readiness / `.gitattributes`) + four clean-build cut-gate fixes (C5/C6 `<private>` leaks, F-11 repair --index, F-11b index-drift trace). The v0.3.1-specific gates were **C5, C6, F-11, F-11b** — still run them (standing now).
> **Original banner (v0.3.0 cut, pre-2026-06-14 — kept per the decision-trail rule):** RECALL, the wow-#2 release — semantic + hybrid search (Task 65), one-flag enablement (Task 46), the recall trigger (Task 75), the L3 raw tier (Task 104). That was a MINOR (the reserved recall version).

It exercises every kit feature end-to-end on the **real installed artifact**:
install (with MCP-server registration), the memory-write skill, the **MCP tools driven in conversation**,
a staged build with organic capture, explicit-capture probes, free-speech forget/trust,
recall, the cross-project cold-open (the wedge), the full `cmk` CLI, the plugin route,
privacy, and portability — then the tag-push.

---

## How to read this

- **★ = cut-gate check.**
  Every ★ must pass to tag the release.
  The rest is the full feature sweep — run it so nothing ships untested.
- Each check is one line you can tick, followed by the **action** (a code block) and a **PASS:** line.
- Throwaway probes use their own temp dirs and never touch your main run.
- **Time:** ~75–90 min.
- **Prereq:** Python 3.12+ on PATH.

> **★★ The real-input rule (binding — D-84).** A check **PASSES only when it ran on REAL input that exercises the feature** — never "the command didn't crash on trivial input." These are **NOT passes** — mark them `unverified` and re-run for real:
> - "skipped (cooldown)" → clear the cooldown (`cooldownMs:0` / delete the marker) and re-run.
> - an **empty queue** → seed real pending review/conflict items, then resolve.
> - a **dry-run with nothing to do** → create the real source (e.g. a native `MEMORY.md`), then run for real with `--yes`.
> - a **same-day project with nothing > 7d** → age the `today-*.md` fixtures past the window.
>
> The v0.2.2 sweep conflated "ran without error" with "the feature works" and shipped **four** broken/unverified commands — `register-crons` (errored on Windows), `persona generate` (timed out), `weekly-curate`/`queue`/`import-anthropic` (only ever the trivial path). Each had a green-LOOKING trivial path. **If a command can only be run on trivial input here, that's a coverage gap** → it needs an automated REAL-input test in the suite (now present for weekly-curate / queue / import-anthropic — Tasks 112–114; live-verified for register-crons / forget / persona generate / import — D-96/D-97).

**Already green — don't re-do by hand:**
`npm run live-test` drives the deterministic half headlessly on the real tarball.
Trail: [`../journey/live-test-runs/`](../journey/live-test-runs/).

**What you add by hand:**
**R1** (console flash), **R2** (prompt UX), the **conversational MCP + free-speech surface** (§4b — Claude driving the tools in chat; the CLI suite can't cover Claude-in-the-loop), and the **recall feel** — the things automation can't see.

> Supersedes the two older guides ([`v0.2.0-self-test-guide.md`](v0.2.0-self-test-guide.md),
> [`v0.2.0-self-test-guide-pdf.md`](v0.2.0-self-test-guide-pdf.md)) — their checks are folded in below.

---

## New in v0.3.0 — what this run additionally validates

The headline is **RECALL works** — the very gap D3 waved through last cut ("~50/50, the known Task-75 gap") is what this release fixes.
The ladder: authority preamble → auto-invoked `memory-search` skill → semantic/hybrid search → timeline/get → the raw transcript floor.

| Check | Feature | What's new |
| --- | --- | --- |
| **★ G2b** | Task 75.1 | the **`memory-search` recall skill** scaffolds beside memory-write — **read-only** contract, `context: fork` |
| **★ G7** | Task 46 | **`cmk install --with-semantic`** — one flag: embedder installed, model pre-warmed, search **defaults to hybrid** |
| **★ W1** | Tasks 75.0–75.2 | *"what did we decide about X?"* → the skill **auto-fires** (forked) → a **curated, citation-backed summary** — no re-brief, no code-grepping |
| **★ W2** | Tasks 65 + 46 | **paraphrase recall**: a question with ZERO keyword overlap finds the fact (bare `cmk search`, no flags — hybrid by default) |
| **★ W3** | Task 104.1 | transcripts record **what Claude DID** — a `**Tools:**` block under assistant turns |
| **★ W4** | Task 104.2 | **`--scope transcripts`**: an old error message / command is findable in the raw record — the last-resort tier |
| **★ D3** | Task 75 | recall FEEL is now a **GATE, not a judgment call** — leads with memory, never re-derives from code |

**Standing checks (re-run; not new this cut):** the **v0.2.3 conversational surface M0–M3** (Tasks 108/117), the **v0.2.2 rich-auto-capture** headline **B9** (Task 103), and the **§19 retention arc B5–B8 + D5** (Tasks 91–94).
**The table above lists only what's NEW this cut — the body below is the FULL end-to-end sweep (every section, every release; ~70 checks).** Nothing standing was removed; the v0.2.3 additions are §4b, the v0.2.2 headline is B9, the retention arc is B5–B8.

### Also new in v0.3.1 — the polish-patch gates

The v0.3.x feature sweep is covered by the standing sections below (config → **F-11**, `--with-semantic` near-dup → **C** + W2, memory-health → **F-11**, status line → SessionStart, npm-12 → **G1**/HC-8). The v0.3.1-SPECIFIC new gates — all four found by re-running this gate on a clean build:

| Check | Fix | What it verifies |
| --- | --- | --- |
| **★ C5** | #179 | `<private>` stripped on the `cmk remember`/`mk_remember`/import write path (not just the prompt hook) — secret absent from body, title, filename, INDEX |
| **★ C6** | #180 | `<private>` survives an 80-char TITLE trim that severs the closing tag — strip runs before the title is derived |
| **★ F-11b** | #181 | INDEX drift is DETECTED by HC-4 (+ `cmk reindex` heals it); a failed rebuild leaves an audit trace instead of a silent stale committed INDEX |
| **★ F-11** | #178 | `cmk repair --index` runs the REAL reindex (was a silent no-op — masked by mocked tests) |

Plus the SHA-256 fingerprint migration (internal; no probe — the suite + the unchanged on-disk field names cover it).
_Note: `mk_search` now also takes `scope`; the tool count stays **11**. The B5/B7 probes overwrite `settings.json` wholesale — fine in their throwaway dirs (a real project's `search.default_mode` would be lost; don't reuse the probe line outside them)._

### Also new in v0.3.2 — the digest + decision-journal gates

The headline this cut is **`cmk digest` + the standing append-only `context/DECISIONS.md`** (Task 147) — the chronological decision journal the kit was missing. Plus the **FTS5 query crash fix** (Task 153). All four v0.3.2-specific ★ gates run in §4c (digest/journal) and §4 (FTS5):

| Check | Feature | What it verifies |
| --- | --- | --- |
| **★ DJ1** | Task 147 | `cmk digest` prints a readable memory page (facts by type) AND creates `context/DECISIONS.md` from `type:project` decision facts (title + when + Why) |
| **★ DJ2** | Task 147 / D-161 | the journal is **append-only**: a second `cmk digest` doesn't duplicate; a forgotten decision's entry **survives, marked `_(retracted …)_` in place** (never deleted — the trail is the point) |
| **★ DJ3** | Task 147 | only `type:project` facts journal (a `feedback`/`reference` fact does NOT appear in `DECISIONS.md`) |
| **★ FQ1** | Task 153 | `cmk search "v0.3"` / `"user-explicit"` / `"section:search"` return results (or clean "no results"), **never the old `FTS5 parse error` crash** |

_Task 152 (`validate-index-completeness`) is dev-tooling — it runs in `npm test`, no live probe._

### Also new in v0.3.4 — the compression-retry + update-path gates

The v0.3.4 headline is reliability: **the compression timeout fix (bounded transient-only retry, Task 161 / D-175)** and **the update path (docs + a `cmk doctor` drift-check, Task 162 / D-176)**. Two ★ gates, both in §7:

| Check | Feature | What it verifies |
| --- | --- | --- |
| **★ RT1** | Task 161 / D-175 | a transient Haiku failure is RETRIED (ceiling-free paths) and recovers; the retry is observable as `retries: N` in compress.log (161.12); a deterministic failure fails fast (no retry). Run via the injected-flaky-backend probe in §7. |
| **★ VD1** | Task 162 / D-176 | `cmk doctor` HC-9 PASSes on a fresh install; on a project whose CLAUDE.md `:start vX` marker is behind the installed binary, HC-9 FAILs with `→ repair: cmk install`. |

_161.6a (structured `exit_code`/`error_detail` in compress.log) is exercised by RT1's deterministic-failure leg. The update DOCS (README/QUICKSTART §9) are reviewer-read, not a live probe._

### Also new in v0.4.1 — the now.md-roll-at-scale + discovery gates

The v0.4.1 headline is robustness: **the now.md-roll cron-liveness fix (Task 167 / D-206..D-208)** + **project-root discovery hardening (Task 168)**. The core fix is that a registered-but-DEAD cron no longer suppresses the lazy now→today roll, so `now.md` heals every session and never compounds to the 5-day-stale freeze the v0.4.0 dogfood hit.

| Check | Feature | What it verifies |
| --- | --- | --- |
| **★ NR1** | Task 167 / D-206 | A bloated `now.md` + a DEAD cron heartbeat heals automatically — by STARTING A SESSION, no manual command. Run the scripted agent-loop: `npm run live-verify:now-roll` (from the repo, real `claude --print`) → both scenarios PASS (single + multi-session). This is the load-bearing v0.4.1 gate. |
| **★ NR2** | Task 167 / 167.F | HC-10 is informational: `cmk doctor` on a fresh install (no cron) → HC-10 = **SKIP** (not FAIL). It never prescribes a manual heal. |
| **★ NR3** | Task 168 | `cmk mcp serve` / inject discovery does NOT escape into a stray `~/context/`: from a temp dir with no project, the resolver returns its own cwd, never the home dir. (Covered by the suite's regression test; a live spot-check is optional.) |

**The honest note for NR1:** the heal is automatic but ASYNCHRONOUS — the SessionStart hook spawns a DETACHED roll (a real Haiku roll is 18–37 s, > the 30 s hook ceiling, so it can't be synchronous — D-208). `npm run live-verify:now-roll` waits for the detached child, exactly as the next real session would find it. Do NOT expect `now.md` to be drained the instant the hook returns.

### Also new in v0.4.3 — the persona-promotion redesign gates (Task 151 + 70.4)

The v0.4.3 headline is the **persona-promotion redesign** (Task 151, ADR-0016): a cross-project trait earns the user-tier persona by **RECURRENCE**, not by phrasing — and a full persona never **strands** a promoted trait at cold-open. Four moves + two riders (70.4 security, 74 verify-and-lock-in). The new gates (all live-verified in a throwaway sandbox during the v0.4.3 cut):

| Check | Move | What it verifies | Reachability |
| --- | --- | --- | --- |
| **★ PR1** | Move 1 — recurrence gate | a re-stated rich fact bumps `recurrence_count` 1→2 + logs a `recurrence` audit line (the earned promotion signal) | CLI, deterministic |
| **★ PR2** | Move 2 — demote-not-evict | a USER-tier persona over cap **CONDENSES** in place (keeps every bullet) — NEVER graduates to un-injected `fragments/` (the Hole-B cold-open bug) | CLI, deterministic |
| **★ PR3** | Move 3 — evolving trust | a pre-151 index gains the `trust_score` column on `cmk search` — **non-destructive**, no crash (the migration). The score VALUE + evolution is **suite-covered-only** (no CLI/MCP readout by design) | CLI (migration only) |
| **★ PR4** | Move 4 — topic-routing | three no-`--to` `cmk lessons promote` of three differently-shaped facts land in **three DIFFERENT** files (USER/HABITS/LESSONS), not all in LESSONS (fixes Hole C) | CLI, deterministic |
| **★ PR5** | 70.4 — Unicode block | `cmk remember` with a real U+200B (zero-width) → **rejected (exit 2)**, nothing written, Door-4 log line with the span `***`-redacted; an ordinary-space control writes fine | CLI, deterministic |

**Three honest MANUAL flags (LLM-driven — NOT CLI-assertable, the D-84 live-test rule):**

- **The promotion GATE itself** (`cmk persona generate` → a medium trait promotes iff its cited facts' recurrence sums ≥ 3) only fires after a **live Haiku** classification produces `PERSONA CANDIDATE` lines with `source_fact_ids`. PR1 proves the *signal* (the count bumps); the *gate* is a manual live-Haiku session — confirm a recurrence-gated promote shows `(via recurrence-N)` in the audit trail.
- **The optional warmth MENTION** (Move 4): the heads-up rides the `mk_lessons_promote` MCP envelope, but the **CLI swallows it** — and whether Claude actually *speaks* it in conversation is LLM-driven. Confirm in a live MCP session; do not claim verified for the spoken layer.
- **The MCP write path** (`mk_remember`) for the Unicode block — PR5 covers the CLI write path; the MCP tool is driven by Claude in a live session.

**The honest note for PR3:** `trust_score` is an INTERNAL index column with **zero** user-facing readout — no `cmk` command, no MCP tool prints it (`mk_trust` mutates the committed `trust` ENUM, a different field; inject + sweep rank on the enum by design, D-238). PR3 asserts only the COLUMN MIGRATION (the one CLI-observable effect); the score arithmetic + the dampen/reinforce evolution are covered by `cli-trust-score.test.js` + `cli-trust-signal.test.js` (direct-sqlite assertions the suite owns). Do NOT look for a score readout — there isn't one.

### Also new in v0.4.4 — the temporal-validity + memory-commit gates (Task 66 + 150)

The v0.4.4 headline is **temporal validity** (Task 66, design §16.18, ADR-0018-adjacent): a fact now carries a `shape` (what KIND of truth — State / Event / Plan / … , explicit-`State` default) and an optional `expires_at` (a *declared* validity end — the fact hides from search after it and the weekly sweep tombstones it, hide-never-delete per D-163); a `weekly-curate` **temporal sweep** closes stale CURRENT-STATE claims when a newer one supersedes them (event-time decides direction, one batched Haiku judge — D-259). The rider **Task 150** (ADR-0018) makes the kit *propose* a memory commit at SessionStart — it never runs git itself. The new gates (all live-verified in a throwaway sandbox during the v0.4.4 cut):

| Check | Move | What it verifies | Reachability |
| --- | --- | --- | --- |
| **★ TV1** | 66.1 — shape field | a rich `cmk remember --shape Plan` writes `shape: Plan` frontmatter; a plain rich remember defaults to `shape: State`; an invalid `--shape` is rejected | CLI, deterministic |
| **★ TV2** | 66.3 — declared expiry | `cmk remember --expires 2026-08-01` writes `expires_at`; a past-dated fact is HIDDEN from `cmk search` yet resurfaces with `--include-expired` (hide-never-delete) | CLI, deterministic |
| **★ TV3** | 66.3 — expiry sweep | `cmk weekly-curate` tombstones facts past `expires_at` (`deletedBy: expiry-sweep`) and reports `expired_swept: N` — runs even on a cooldown-skip | CLI, deterministic |
| **★ TV4** | 66.2 — temporal supersede | a NEWER State fact that supersedes an OLDER one closes the older's window (`ended_at` / `status: completed` / `superseded_by`) + moves it to `archive/superseded/`; a `temporal-supersede` audit line lands | CLI (deterministic path) + **live-Haiku judge (MANUAL)** |
| **★ MC1** | 150 — commit proposal | SessionStart injects a **model-facing** commit-proposal line when `context/` has uncommitted changes — the kit runs **no git**; it only proposes, and acts solely on the user's yes (ADR-0018) | inject, deterministic |

**Two honest MANUAL flags (LLM-driven — NOT fully CLI-assertable, the D-84 live-test rule):**

- **The temporal sweep's JUDGE** (TV4): the *deterministic* window-close path (`resolveTemporalSupersede`) is CLI-testable, but the sweep's actual SUPERSEDES/DUPLICATE/COEXIST verdict comes from a **live Haiku** batched judge over candidate pairs. TV4's deterministic leg proves the close mechanics; the full `cmk weekly-curate` sweep on THIS repo's real corpus (the v0.3.2/v0.4.x stale state-chains should close with sensible verdicts — **no false SUPERSEDES**) is a manual live-Haiku session, flagged for the cut-gate operator.
- **The 66.3 auto-extract expiry SUGGESTION** — TV2 covers the explicit `--expires` write path; whether **auto-extract** proposes an `expires_at` on a real turn (and, load-bearing, that it invents **no** date the turn doesn't state) is LLM-driven → confirm in a live session, do not claim verified from the CLI.
- **The MC1 spoken relay** — MC1 asserts the proposal LINE is injected; whether Claude actually *speaks* the proposal and waits for the user's yes before running git is LLM-driven → confirm in a live MCP session.

### Also new in v0.4.5 — the agent-relative backend gates (Task 200 + 201)

The v0.4.5 headline is the **agent-relative LLM backend** (Task 200, design §16.50.4, D-270): the automatic engine used to shell out to a hardcoded `claude` binary at 11 sites, so a Cursor-only / Kiro-only user's automatic features *silently no-op'd*. Now `makeBackend` picks the CLI of the agent the project was installed for (`claude --print` / `kiro-cli chat` / `cursor-agent -p`), off the user's existing login (no API key). Task 201 adds the **split-brain override** — run the automatic memory through a DIFFERENT agent than you code in (`cmk install --backend <agent>` / `cmk config set backend.agent <agent>`), made legible by `cmk config show`. New gates:

| Check | Move | What it verifies | Reachability |
| --- | --- | --- | --- |
| **★ BK1** | Task 200 — HC-11 | `cmk doctor` emits **15** checks (HC-1..HC-15); HC-11 PASSes when the effective backend agent's CLI is on PATH, and FAILs with an honest "automatic features degraded, file-only still works" message (never a silent no-op) when it's absent | CLI, deterministic (via the injectable `backendCliProbe` seam or a hidden-binary sandbox) |
| **★ BK2** | Task 201 — `--backend` | `cmk install --backend kiro` (installed-for claude) writes `backend.agent: kiro` to `context/settings.json`, and the install output warns about the **EFFECTIVE** backend CLI (kiro-cli), not the installed-for agent; an invalid `--backend banana` is rejected **fail-fast BEFORE any scaffold** (no half-install) | CLI, deterministic |
| **★ BK3** | Task 201 — `config show` | `cmk config show` prints the installed-for agent, the ACTIVE backend agent (+ whether it's an override), the backend-CLI presence, and the semantic mode — informational, never a non-zero exit | CLI, deterministic |
| **★ BK4** | Task 200 — live cross-agent | the automatic engine (a `cmk compress` / auto-extract cycle) actually **runs the LLM call through a non-`claude` agent CLI** (kiro-cli or cursor-agent) and produces a sane summary | **live cross-agent MANUAL flag** |

**One honest MANUAL flag (the D-84 live-test rule, cross-agent variant):**

- **BK4 — the live cross-agent spawn.** BK1–BK3 are CLI-deterministic on any machine. But whether the automatic engine *actually* compresses through `kiro-cli`/`cursor-agent` (not just resolves to it) can only be live-verified on a machine that HAS that agent's CLI — a Claude-Code-only cut-gate operator can't test it. Run `cmk config set backend.agent kiro` (or `cursor`) on a machine with that CLI, then trigger a real compression (`cmk roll --scope now` on a repo with a session buffer) and confirm a real summary lands — **on the dev machine this was live-verified for both kiro-cli and cursor-agent (D-278/D-280)**; the cut-gate operator flags it honestly if their machine lacks the 2nd CLI, rather than claiming verified.

### Also new in v0.5.1 — the hardening gates (Tasks 203–207, 213–216, 219, 220)

The v0.5.1 headline is **hardening**: the resumable rolling-window pipeline (ADR-0020) and the Poison_Guard side-door closure (D-320).
All six ★ gates are CLI-deterministic and run in **§4g**; the two LLM/overnight surfaces are honest MANUAL flags.

| Check | Feature | What it verifies | Reachability |
| --- | --- | --- | --- |
| **★ HG1** | Task 203/204/213 — resumable distill | `cmk daily-distill` on a multi-day corpus writes a fresh `recent.md` with a **`## <date>` section per source day** (the provenance pointer) + banks per-day `today-<date>.distilled.md` artifacts; a SECOND run reports the days as **resumed-skipped**, not re-billed | CLI + live Haiku |
| **★ HG2** | Task 203 — HC-10 outcome check | a FRESH cron heartbeat + a STALE `recent.md` → HC-10 **FAILs** (pre-v0.5.1 the heartbeat alone read as green — the exact false-green that let `recent.md` go 5 days stale, D-298) | CLI, deterministic |
| **★ HG3** | Task 216 — trust-increase re-screen | `cmk trust <id> high` on a fact whose body carries a secret-shaped token → **rejected (exit 2, `poison_guard`)**, file untouched; `cmk trust <id> low` on the same fact still succeeds (the gate is increase-only) | CLI, deterministic |
| **★ HG4** | Task 216 — distill input pre-screen | a `today-*.md` seeded with a secret-shaped token → `cmk daily-distill` **skips** (`reason: poison-guard`) BEFORE any model call, keeps the old `recent.md`, and logs the redacted rejection with the `:input` stage tag | CLI, deterministic (pre-Haiku) |
| **★ HG5** | Task 207 — BOM fail-closed | a **BOM-prefixed** destructive-command payload piped into `cmk-guard-memory` is still **BLOCKED** (pre-v0.5.1 the BOM broke the JSON parse and the guard failed OPEN) | CLI, deterministic |
| **★ HG6** | Task 220 — duplicate-block fold | a hand-duplicated CLAUDE.md managed block → `cmk doctor` **HC-9 FAILs** naming the duplicate → `cmk install` **folds to ONE block** (user content between preserved) → doctor passes | CLI, deterministic |

**Two honest MANUAL flags (the D-84 live-test rule):**

- **The transcript WITHHOLD marker (Task 216).** A secret pasted in a LIVE session must land in the committed `context/transcripts/<date>.md` as a content-free `<!-- batch withheld: poison-guard … -->` marker — never the secret itself; the raw text stays in the gitignored `.live.md` buffer. The promote path is LLM/session-driven (the PII judge runs first) → confirm in a live session; the CLI suite covers the mechanics.
- **The 23:00 NO-WINDOW firing (Task 215).** HG-adjacent but overnight: after `cmk register-crons`, the scheduled task must fire at 23:00 with **no black console window**. §4g checks the registration SHAPE deterministically (wscript shim + `//B //Nologo`); the actual silent firing is your overnight observation — the dev machine live-verified the shim mechanism (D-319), the scheduled-trigger end-to-end is the operator's.

_Suite-covered, no live probe needed: Task 219 (`busy_timeout` contract pin — the audit premise was corrected, D-321: better-sqlite3 already defaulted to 5000ms; the cross-process concurrent-writer test now guards it), Task 214 (name-guard scans untracked files — dev-tooling, runs in `npm test`), Task 205 (half-install recovery message + MCP-process preflight — live-probed during dev, D-314; **refined by Task 222 / D-323 — a plain `cmk install` is now FULLY SILENT about running kit MCP servers, since the DLL-lock hazard is `npm install -g`-only and the recovery message already covers a real half-break; verify: install with kit MCP servers running prints ONLY the install result, no PID list / no `[y/N]`**), Task 206 (the commit proposal excludes `context/sessions/now.md` — inject-path suite tests)._

---

## 0. Cut the release locally, then build the REAL artifact

**0a — cut the release locally FIRST.** This bumps `package.json` + finalizes the CHANGELOG so the artifact you test below actually reports the NEW version (without this, `npm pack` builds the OLD one). It is a **local commit only** — the tag-push (the outward publish) stays the very last step, after every ★ passes. **This cut: `0.5.0` → `0.5.1` via `-- patch`** (a hardening patch, no new differentiator — the learn-loop minor was already spent on v0.5.0; per the one-differentiator-per-minor rule this is patch-level even though the fixes are user-visible).

```powershell
cd C:\Projects\claude-memory-kit
git checkout main; git pull
npm run release -- 0.5.4             # THIS cut: the rename release (already release-committed 2026-07-15); [Unreleased] → ## [X.Y.Z]; bumps package.json. (Future cuts: `-- patch`/`minor` per RELEASE-PLAN.)
git diff                             # review: ONLY the version bump + CHANGELOG consolidation
git add CHANGELOG.md packages\cli\package.json
git commit -m "release: vX.Y.Z"      # local release commit — do NOT tag yet (that's the last step)
git push origin main
```

**0b — build + install the real artifact.**

```powershell
cd C:\Projects\claude-memory-kit\packages\cli
npm pack                             # → lh8ppl-core-memory-kit-<version>.tgz
npm uninstall -g @lh8ppl/core-memory-kit
# ⚠️ v0.5.4 RENAME-CUT ONE-TIME: on THIS cut the global is still the OLD package,
# so uninstall @lh8ppl/CLAUDE-memory-kit first (it owns the `cmk` shim — a plain
# `-g` over it EEXISTs). From v0.5.4 onward the line above (uninstall the NEW
# package) is correct for every future cut.
# Use the EXPLICIT filename, NOT a *.tgz glob — PowerShell does NOT expand the
# wildcard, so npm gets the literal `*` and fails ENOENT. Substitute the version.
npm install -g .\lh8ppl-core-memory-kit-0.5.4.tgz   # the freshly-packed tarball (substitute the version you just cut)
cmk --version                        # ✅ matches packages/cli/package.json

# BACK UP the user tier, then start clean so capture-from-zero is honest.
# NEVER plain-delete it — MOVE it to a timestamped backup so a real persona is
# always recoverable (the established pattern: gate-noise + any genuine tier go to
# C:\cut-gate-backups\, never the bin). Moving (not copying-then-deleting) leaves
# the live path absent so the gate captures from zero, with the old tier preserved.
$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupRoot = "C:\cut-gate-backups\user-tier_$stamp"
New-Item -ItemType Directory -Force -Path (Split-Path $backupRoot) | Out-Null
if (Test-Path $env:USERPROFILE\.core-memory-kit) {
  Move-Item -Path $env:USERPROFILE\.core-memory-kit -Destination $backupRoot
  Write-Host "user tier backed up → $backupRoot"
}
# Same for the stray ~/context scaffold (test debris) if present — back up, don't bin.
if (Test-Path $env:USERPROFILE\context) {
  Move-Item -Path $env:USERPROFILE\context -Destination "$backupRoot-stray-context"
}
```

> **Restore after the gate** (if you backed up a real tier): `Move-Item $backupRoot $env:USERPROFILE\.core-memory-kit` (move the gate-created one aside first if you want to keep it). The backups live under `C:\cut-gate-backups\` and are never auto-deleted.

- [ ] **G0** — `cmk --version` matches the version in `packages/cli/package.json` _(if it's an older version, you're testing a stale global — re-run the `npm install -g` above against the freshly-packed `.tgz`)_

---

## 1. Scaffold + read every file

Validates scaffold integrity + the Task-69 skill surface.

```powershell
mkdir C:\Temp\cut-gate23; cd C:\Temp\cut-gate23
git init
cmk install --with-semantic          # v0.3.0: the one-flag semantic enablement (G7) — ~260 MB once + the model pre-warm; takes a minute
cmk doctor
code .
```

- [ ] **★ G1 — install + doctor clean.**
      `cmk install` → "ready, hooks wired";
      `cmk doctor` → **0 fail** on a fresh install — **15 checks now** (HC-1..HC-15; the 2 memsearch checks were removed in Task 120, HC-8 native-bindings added in v0.3.1, HC-9 version-drift added in v0.3.4, **HC-10 compaction-liveness added in v0.4.1 (Task 167)**, **HC-11 backend-LLM-CLI-present added in v0.4.5 (Task 200/D-272/D-277)**). HC-9 = PASS on a just-installed project (the scaffold marker matches the binary). **HC-10 = SKIP** on a fresh install with no cron registered (it's informational — memory self-heals each session via the lazy roll; only flags a *registered but dead* cron). **HC-11 = PASS** when the effective backend agent's CLI (`claude` on a Claude-Code install) is on PATH; **FAIL** with an honest degrade message if it's absent (see ★ BK1).
      Type:
        `/hooks` → the 5 `cmk-*` hooks are loaded.

- [ ] **★ G2 — the skill is scaffolded + SAFE.**
      Open:
        `.claude\skills\memory-write\SKILL.md`:
      - `allowed-tools: Bash(cmk remember *) Bash(cmk forget *) Read` — **no `Edit`/`Write`**
      - the **"NEVER hand-edit `context/memory/`"** gate
      - no `packages/cli/src` dev paths

- [ ] **★ G2b — the RECALL skill is scaffolded + READ-ONLY (Task 75.1 — new in v0.3.0).**
      Open:
        `.claude\skills\memory-search\SKILL.md`:
      - `context: fork` (recall runs isolated — raw results never land in your chat)
      - `allowed-tools` grants **only** search/get/timeline/recent (both surfaces) —
        **no** `mk_remember`/`mk_forget`/`mk_trust`, **no** `Edit`/`Write` (a recall path that can't mutate memory)
      - the body's Step 4 names `--scope transcripts` as LAST RESORT

- [ ] **★ G7 — `--with-semantic` enabled hybrid-by-default (Task 46 — new in v0.3.0).**
      The install above printed **"Semantic recall ENABLED — `cmk search` now defaults to hybrid here. Model cached (Ns)."**
      ```powershell
      type context\settings.json        # "search": { "default_mode": "hybrid" }
      ```
      **PASS:** the install line said ENABLED **and** settings.json carries `default_mode: hybrid`.
      _(If npm failed, settings must NOT say hybrid — no half-state; keyword search unaffected.)_

- [ ] **★ G3 — CLAUDE.md is slim.**
      The "Memory write rules" block is a few invariants + a pointer to the skill,
      **not** the old multi-step procedure.

- [ ] **★ G4 — scaffold reads clean (READ EVERY FILE IN ALL THREE TIERS — not a spot-check).**
      A scaffold regression (a leaked username, an unrendered `{{TODAY}}`, malformed
      frontmatter, a real machine path in a committed tier) can hide in a file the
      named checks skip — so **enumerate and read every memory file across all three
      tiers**, not just MEMORY.md/SOUL.md (the user's standing rule, 2026-06-16):
      ```powershell
      # FIRST set the console to UTF-8 — otherwise Get-Content renders the seed
      # files' `·` (U+00B7 middot) and `—` (em-dash) as mojibake (`ֲ·`, `ג€"`) on
      # a default Windows code page, making a CLEAN scaffold LOOK corrupted (the
      # 2026-06-17 v0.3.3 cut-gate false alarm). This is a DISPLAY artifact, not a
      # file problem — the bytes are correct UTF-8.
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      function Read-Tier($dir) {
        if (-not (Test-Path $dir)) { Write-Output "(no $dir)"; return }
        Get-ChildItem -Recurse $dir -File | % { "`n===== $($_.FullName) ====="; [System.IO.File]::ReadAllText($_.FullName) }
      }
      Read-Tier "$env:USERPROFILE\.core-memory-kit"   # User tier (cross-project)
      Read-Tier "context"                                # Project tier (committed)
      Read-Tier "context.local"                          # Local tier (gitignored)
      ```
      _If you DO see `ֲ·` / `ג€"`-style mojibake after the UTF-8 line above, verify the raw bytes before flagging it — `[System.IO.File]::ReadAllBytes(<file>)` then check the char after `chars ` is `U+00B7` (run the codepoint check from the v0.3.3 cut log). A real corruption is a cut-blocker; a console-display artifact is not._
      **PASS — every file must show:**
      - no kit-internal cruft (no `Task 12`, `design §16.16`, dev-speak)
      - no literal `{{TODAY}}` or any other unrendered placeholder (dates are real)
      - **no real username (`C:\Users\<you>` / your name)** anywhere in a COMMITTED tier (user + project) — a public-repo leak is a cut-blocker; `context.local/` (gitignored) may hold real paths but a fresh scaffold shouldn't
      - example bullets clearly marked `(example)` so a user knows to replace them
      - well-formed frontmatter (the seed `2020-01-01` / all-zero sha1 are deliberate sentinels — fine)
      `.claude\settings.json` has the 8 hooks + the `Bash(cmk:*)` allow-list.

- [ ] **★ G6 — `cmk install` registered the MCP server (Task 108 — new in v0.2.3).**
      Install now wires the MCP surface so Claude can run every memory op in chat, prompt-free:
      ```powershell
      type .mcp.json                                       # mcpServers.cmk = { type:"stdio", command:"cmk", args:["mcp","serve"] }
      Select-String .claude\settings.json -Pattern "mcp__cmk"   # the mcp__cmk__* allow-list entry
      ```
      **PASS:** `.mcp.json` names the `cmk` stdio server **and** `settings.json` allow-lists `mcp__cmk__*`.
      _(Pre-v0.2.3 the MCP server existed but you had to register it by hand; capture/forget rode a Bash `cmk` call that could trigger a permission prompt.)_

---

## 2. Session 1 — build it, stating preferences

Build a small real thing across **one** session.
Each stage pairs a **Build** prompt with a **Say it out loud** preference — a real opinion, stated naturally, **never** "remember this".
End each turn normally (the Stop hook fires auto-extract).
Don't start a new session between stages.

**Stage 0 — baseline.**
 *Build:* "Create a minimal Python web chat UI: a FastAPI server with a WebSocket endpoint and a single static `index.html`. 
Plain HTML/JS, no framework. Put the server in `app.py`."
 → "yes, run it" if offered.
 
 *Say:*"always deploy .venv and install all python packages in it."

**Stage 1 — refactor to layers.**
 *Build:* "Refactor this into a layered FastAPI project -  `app/{api,services,repositories,schemas,core}/` and `app/main.py`. 
WebSocket route into `api/`, connection/broadcast logic into a service, Pydantic schemas. 
Keep it on port 8000."

 *Say:* "How I build backends: FastAPI is the delivery layer, not the brain. 
Routes stay thin and orchestrate; logic lives in services; data access in boring repositories; Pydantic schemas are the boundary contracts. 
I'd rather pay the structure cost now than fight it in six months."

**Stage 2 — swap to Claude + typing/TDD rule.**
 *Build:* "Change it to a single-user chat with Claude via the Claude Agent SDK (`claude-agent-sdk`) - a `ClaudeAgentService` wrapping `ClaudeSDKClient`, each WebSocket connection its own session."

 *Say:* "Type hints on every signature - Python 3.12+. 
Comments explain why, not what. 
And tests first: boundary test, watch it fail, then implement."

**Stage 3 — stream + async rule + the universal rule.**
 *Build:* "Stream Claude's output to the browser as it arrives - push JSON frames over the WebSocket; the client appends to the live bubble."

 *Say:* "Async all the way down — nothing blocking in the event loop." 
 **Then state one cross-project rule:** 
 "From now on, in every project I work on, always use `uv` for packages, never `pip`, and always run `ruff` before committing."

**Watch while you build:**

- [ ] **★ R1 — no console flash (Task 81).**
      At every SessionStart, NO black `node` window flashes to the foreground. (Visual.)

- [ ] **★ R2 — no permission prompt on explicit capture (Tasks 79 + 90).**
      When the agent captures explicitly, Claude Code shows
      **neither** "Allow this bash command?" (the `cmk` call)
      **nor** "Use skill /memory-write?" (the skill).
      Both are allow-listed at install.
      _**Known accepted edge (D-80 / §16.57):** if the agent wraps the call as
      `cd "<abs project path>" && cmk remember …`, Claude Code prompts — not because
      of `cmk` (the bare `cmk …` is allow-listed) but because the absolute-path `cd`
      subcommand isn't auto-approved (compounds are checked per-subcommand). This is
      a documented, deliberately-unfixed edge — click Yes and continue; it does NOT
      fail R2 (the bare-`cmk` path is friction-free)._

- [ ] **★ G5 — explicit-skill security check (Task 69).**
      Mid-build, say: *"remember this: my local cache is at C:\Users\<you>\cache\app."*
      Verify:
      - the agent **ran `cmk remember`** (not a hand-edit), and
      - the committed `context\MEMORY.md` / fact file shows `~\cache\app` — **never** your username.
      (A hand-edit or a leaked username = blocker.)

---

## 3. Capture checks — read the files

```powershell
cmk search "layered"; cmk search "type hints"; cmk search "port 8000"
type context\MEMORY.md
dir context\memory; type context\memory\feedback_*.md
```

- [ ] **B1 — auto-capture fires.**
      Your decisions/prefs (layered, Claude SDK, type hints, async, port 8000)
      show up **without** "remember this".

- [ ] **★ B2 — rich capture (F1).**
      Durable preference facts are **rich fact files** (frontmatter + `**Why:**` + `**How to apply:**`),
      not bare one-liners.

- [ ] **★ B9 — auto-extract writes RICH project facts (Task 103 — the v0.2.2 headline).**
      You never ran `cmk remember` in Session 1 — yet durable PROJECT knowledge (the layered
      structure, the Claude-SDK service, the streaming design) landed as **rich fact files**,
      not just terse `MEMORY.md` bullets:
      ```powershell
      dir context\memory\project_*.md
      type context\memory\project_*.md
      ```
      At least one `project_*.md` carries `write_source: auto-extract` + `trust: medium` +
      a `**Why:**`/`**How to apply:**` body. **That's the native-immune rich capture working** —
      a turn that saved to Claude's built-in memory instead would still leave THIS behind.
      _(Pre-Task-103 auto-extract wrote only terse bullets; rich files needed an explicit `cmk remember`.
      If `context\memory\` has NO `write_source: auto-extract` rich file, the headline didn't fire this
      session — investigate before shipping: re-run a knowledge-dense turn; it's a Haiku judgment pass.)_

- [ ] **★ B9b — the capture TREND clears the suppressor threshold (Task 137.5 — the D-122 detection gap).**
      Per-turn outcomes are individually plausible; only the trend exposes a
      systemic suppressor (the dedup self-poisoning shipped ~10 releases of
      individually-normal `nothing_durable` skips). After the session's organic
      turns, run the trend gate over this run's extract logs:
      ```powershell
      npm run trend:extract -- <your-run-project>\context\sessions
      ```
      PASS = `nothing_durable` rate under 80% of judged turns (min sample 5;
      mechanical skips excluded). FAIL = the D-122 fingerprint — check the
      dedup context + the extraction prompt before trusting this build's capture.
      _(Inconclusive on a short session is honest — rerun after more turns, don't wave it.)_

- [ ] **★ B3 — the wedge fills.**
      Type: `%USERPROFILE%\.core-memory-kit\HABITS.md` (+ `USER.md`, `LESSONS.md`)
      → your cross-project style is there (was empty pre-v0.2).

- [ ] **★ B4 — stated rule → `trust: high`, automatically.**
      The uv/ruff rule landed in a user-tier scratchpad on its own (no command),
      provenance `trust: high` + `write: user-explicit`:
      ```powershell
      findstr /S /C:"trust: high" %USERPROFILE%\.core-memory-kit\*.md
      ```

### ★ B5 — Graduation: the write-lock fix (Task 91)

`MEMORY.md` is a byte-capped hot index.
When it fills with high-trust facts, the oldest **graduate** out into `context\memory\*.md`
(the permanent, searchable store) so new writes keep landing instead of erroring `cap_exceeded`.

Deterministic probe — a **throwaway** project (doesn't touch your run);
lower the cap so graduation fires after a few facts:

```powershell
$g = "C:\Temp\grad-check"; Remove-Item -Recurse -Force $g -EA SilentlyContinue
mkdir $g > $null; Set-Location $g; git init | Out-Null; cmk install | Out-Null
# NO BOM — Set-Content -Encoding utf8 writes a BOM that breaks the JSON cap override
[IO.File]::WriteAllText("$g\context\settings.json", '{ "scratchpads": { "MEMORY.md": { "max_chars": 1400 } } }')
1..12 | ForEach-Object { cmk remember "Durable decision $_ the next session must recall to avoid re-deriving it" | Out-Null }
"MEMORY.md  = $((Get-Item context\MEMORY.md).Length) B  (cap 1400 — must stay <= cap)"
"graduated  = $((Get-ChildItem context\memory\project_*.md -EA SilentlyContinue).Count) fact files  (must be > 0)"
"audit grad = $((Select-String context\.locks\audit.log -Pattern '\"action\":\"graduated\"' -EA SilentlyContinue).Count) events"
Set-Location C:\Temp; Remove-Item -Recurse -Force $g -EA SilentlyContinue
```

- [ ] **★ B5 — PASS:**
      - all 12 land (**no `cap_exceeded`**)
      - `MEMORY.md` ≤ cap
      - graduated fact files **> 0**
      - audit graduated events **> 0**
      _(Pre-Task-91 the ~5th `cmk remember` would error and memory would silently write-lock.)_

### ★ B6 — LOW-trust drops leave a trace, and the log stays out of git (Task 92)

A discarded LOW candidate used to vanish with no record.
Now each drop logs a `low_trust_discarded` excerpt to `extract.log` —
which carries raw, un-screened text, so it must never be committed.

```powershell
# The security half (deterministic): the diagnostic log is gitignored.
git -C C:\Temp\cut-gate23 check-ignore context\sessions\probe.extract.log
# The trace half (observational): if any build turn was graded LOW, you'll see it.
findstr /S /C:"low_trust_discarded" C:\Temp\cut-gate23\context\sessions\*.extract.log
```

- [ ] **★ B6 — PASS (must):**
      `check-ignore` prints the path (it's ignored) → the raw excerpt never reaches git.
- [ ] **B6 — Observational:**
      if a turn was graded LOW, its excerpt appears in `extract.log`
      (empty is fine — it means nothing graded LOW this run).

### ★ B7 — Graduation also fires proactively at session-end (Task 94.3)

Reactive graduation fires on a write.
The **proactive** sweep catches a scratchpad that drifts over cap **between** sessions
(e.g. a cap change, or bullets aging) — with no triggering write.
Probe: fill at the default cap, then **lower** the cap so the file is now over,
then run the session-end handler.

```powershell
$s = "C:\Temp\sweep-check"; Remove-Item -Recurse -Force $s -EA SilentlyContinue
mkdir $s > $null; Set-Location $s; git init | Out-Null; cmk install | Out-Null
1..12 | ForEach-Object { cmk remember "Session-end sweep durable fact number $_ worth keeping around" | Out-Null }
# Now DROP the cap below the current size — MEMORY.md is suddenly over budget, with no new write:
[IO.File]::WriteAllText("$s\context\settings.json", '{ "scratchpads": { "MEMORY.md": { "max_chars": 700 } } }')
$before = (Get-Item context\MEMORY.md).Length
# Feed stdin ('{}' | …) — the handler drains its stdin like a real hook. (Since Task 101
# a bare `cmk-compress-session` no longer HANGS on a manual run — it detects the TTY and
# returns — but piping '{}' still mirrors the real hook envelope, so keep it.)
$env:CMK_PROJECT_DIR = $s; '{}' | cmk-compress-session | Out-Null    # the SessionEnd handler (fast — empty buffer skips Haiku)
"MEMORY.md  before = $before B  →  after = $((Get-Item context\MEMORY.md).Length) B  (must drop toward <= 700)"
"sweep grad = $((Select-String context\.locks\audit.log -Pattern '\"trigger\":\"session-end\"' -EA SilentlyContinue).Count) session-end graduated events  (must be > 0)"
Remove-Item Env:\CMK_PROJECT_DIR
Set-Location C:\Temp; Remove-Item -Recurse -Force $s -EA SilentlyContinue
```

- [ ] **★ B7 — PASS:**
      - `MEMORY.md` shrinks toward the new cap
      - audit shows **`"trigger":"session-end"`** graduated events **> 0** (the proactive sweep fired without a write)

### B8 — The user-tier persona graduates too (Task 94.2, observational)

Graduation isn't project-only — the cross-project persona (`USER`/`HABITS`/`LESSONS`)
graduates its overflow into `<user-tier>\fragments\` as well.
It's the **same mechanism** B7 proves deterministically, with the tier gate lifted to P+U,
so this run just watches for it rather than forcing it.
After Session 1 (B3/B4 fill the persona), if any persona scratchpad grew past its cap:

```powershell
dir %USERPROFILE%\.core-memory-kit\fragments
findstr /S /C:"\"tier\":\"U\"" %USERPROFILE%\.core-memory-kit\.locks\audit.log | findstr graduated
```

- [ ] **B8 — PASS (observational):**
      if the persona overflowed, `fragments\` holds the graduated persona facts
      and the user-tier audit shows `graduated` events with `"tier":"U"`.
      Empty is fine — it means the persona stayed under cap this run.
      The graduation path itself is proven by **B7** (same code) and locked by the suite (`cli-load-cap` 94.2).

---

## 4. Explicit capture probes — run in the build terminal

- [ ] **C1 — terse.**
      `cmk remember "We deploy with Kamal to Hetzner, never Vercel."`
      → appears in `context\MEMORY.md`.

- [ ] **C2 — rich (F1).**
      ```powershell
      cmk remember "Reflection beats one-shot generation" --type feedback --title "reflection-loop" --why "iterative critique catches errors a single pass misses" --how "generator then critic then route; cap iterations"
      ```
      → a rich `context\memory\feedback_reflection-loop.md` with Why/How.

- [ ] **C3 — Poison_Guard.**
      `cmk remember "key sk-ant-api03-AAArealishlookinglongtokenvalue00"`
      → **rejected** (exit 2), nothing written anywhere.
      _(The token must be ≥40 chars after `sk-` — the guard's minimum, tuned to real key lengths (~95) without false-positives on short `sk-` words. The pre-2026-06-11 example here ended in a literal `...` and was 27 chars — UNDER the minimum, so it sailed through and landed a fake secret in project memory (the cut-gate16 find): probe strings must actually trip the pattern they test, same class as the D-84 real-input rule.)_

- [ ] **C4 — sanitization.**
      `cmk remember "venv at C:\Users\<you>\proj\.venv"`
      → the file shows `~\…`, **never** your username.

- [ ] **★ C5 — `<private>` stripped on the `cmk remember` write path (Task #179 / v0.3.1).**
      The prompt hook isn't the only privacy boundary — a direct CLI/MCP capture must redact too.
      ```powershell
      cmk remember "deploy host is prod-7 <private>root pw is hunter2-SECRET</private> use the bastion" --type project
      Select-String -Path context\memory\*.md,context\memory\INDEX.md -Pattern "hunter2-SECRET"
      ```
      **PASS:** the search finds **nothing** (secret absent from body, title, filename, AND INDEX); the fact body shows `[private content redacted]`.
      _(Pre-v0.3.1 the tag was honored only by the UserPromptSubmit hook, so `cmk remember`/`mk_remember`/import wrote the secret verbatim — the cut-gate finding.)_

- [ ] **★ C6 — `<private>` survives an 80-char TITLE trim (Task #180 / v0.3.1).**
      The title is derived from the text then trimmed to 80 chars — a trim that severs the closing `</private>` must not leak.
      ```powershell
      cmk remember "note xxxxxxxxxxxxxxxxxxxxxxxx <private>hunterSEKRET and more words here</private> tail" --type project
      Select-String -Path context\memory\*.md,context\memory\INDEX.md -Pattern "hunterSEKRET"
      ```
      **PASS:** nothing found — the strip runs BEFORE the title is derived, so a trimmed title can't carry the secret.
      _(The closing tag falls past char 80 → without the fix the redaction regex misses the broken span and the secret lands in the frontmatter `title:` + INDEX.)_

- [ ] **★ FQ1 — FTS5 query sanitization: dots / hyphens / colons no longer crash (Task 153 — new in v0.3.2).**
      A natural query containing FTS5-special chars used to crash with `FTS5 parse error` — `cmk search "v0.3 queue"` was the live report. Now the query is auto-quoted per-token.
      ```powershell
      cmk remember "v0.3.1 shipped to npm with the recall fix" | Out-Null
      cmk search "v0.3"                  # finds the fact — NOT a crash
      cmk search "v0.3 queue remaining"  # the exact shape that crashed — clean (hit or "no results")
      cmk search "user-explicit"         # the kit's own enum value — clean
      cmk search "section:search"        # a colon — clean (no unknown-column crash)
      ```
      **PASS:** every query returns results or a clean "no results" line + exit 0 — **never** an `FTS5 parse error` / stack trace. Plain multi-word queries still work (implicit-AND preserved).
      _(Pre-v0.3.2 the `.` in `v0.3` violated FTS5's bareword grammar → uncaught crash; `user-explicit` parsed `-` as a NOT operator. The fix per-token-quotes special tokens — the SQLite-sanctioned escape.)_

- [ ] **★ RX1 — `cmk reindex --full` survives a dual-written fact, no UNIQUE crash (Task 157 / D-165 — new in v0.3.3).**
      A rich `cmk remember` dual-writes a fact to BOTH the `MEMORY.md` scratchpad bullet AND its `context/memory/*.md` archive with the same id. Pre-v0.3.3 a full reindex hit `UNIQUE constraint failed: observations.id` and aborted the whole rebuild.
      ```powershell
      cmk remember "Use id-keyed index replacement so reindex is robust" --type project --title "reindex-fix" --why "archive beats scratchpad" | Out-Null
      cmk reindex --full                 # the operation that crashed pre-v0.3.3
      cmk search "reindex-fix"           # the fact resolves to ONE row (no dup)
      ```
      **PASS:** `cmk reindex --full` completes with no `UNIQUE constraint` error + exit 0; the dual-written fact returns as a single hit (archive copy wins). **FAIL:** the reindex crashes or aborts, or the fact returns duplicated.
      _(Pre-v0.3.3 `replaceObservationsForFile` deleted by `source_file` only, so the 2nd source holding the same global-PK id collided. Fixed to id-keyed replacement with archive-beats-scratchpad precedence.)_

---

## 4c. `cmk digest` + the decision journal (Task 147)  ⬅️ the v0.3.2 headline

`cmk digest` prints a readable page of everything in memory AND maintains `context/DECISIONS.md` —
a committed, **append-only** chronological log of every decision (`type:project` fact) + its *why*.
Run these in the build terminal (`C:\Temp\cut-gate23`), after Session 1 has captured some facts.

- [ ] **★ DJ1 — `cmk digest` renders + creates `DECISIONS.md` (Task 147).**
      ```powershell
      cmk remember "We chose FTS5 keyword search for the kit" --type project --title "FTS5 keyword search" --why "Markdown stays the source of truth; the index is regenerable" | Out-Null
      cmk digest                          # prints the digest page to the terminal
      type context\DECISIONS.md
      ```
      **PASS:** `cmk digest` prints a "Memory digest" page grouping facts by type; `context\DECISIONS.md` exists and contains the decision (its title, a `**When:**` date, the `**Why:**`, and the `P-…` fact id).

- [ ] **★ DJ2 — append-only: idempotent + retract-in-place.**
      ```powershell
      cmk digest | Out-Null                                  # 2nd run, nothing new
      type context\DECISIONS.md                              # FTS5 decision appears once
      $id = (Select-String context\DECISIONS.md -Pattern 'P-[A-Z2-9]{8}' | Select-Object -First 1).Matches.Value
      cmk forget $id --yes | Out-Null
      cmk digest | Out-Null
      type context\DECISIONS.md                              # entry survives, now retracted
      ```
      **PASS:** the decision appears exactly once after the 2nd digest; after forget + digest its entry is still present, annotated `_(retracted …)_`, never removed.

- [ ] **★ DJ3 — only `type:project` facts journal.**
      ```powershell
      cmk remember "Keep replies terse" --type feedback --title "terse-replies" | Out-Null
      cmk digest | Out-Null
      Select-String context\DECISIONS.md -Pattern "terse-replies"
      ```
      **PASS:** the `feedback` fact does NOT appear in `DECISIONS.md`. (It still shows in the `cmk digest` page under working-style.)

- [ ] **★ DJ4 — recallable: `--scope decisions` surfaces history incl. retracted.**
      ```powershell
      cmk remember "Use Postgres for the store" --type project --title "store-choice" | Out-Null
      cmk digest | Out-Null
      cmk search "store" --scope decisions
      $id = (Select-String context\DECISIONS.md -Pattern 'P-[2-9A-HJ-NP-Za]{8}' | Select-Object -First 1).Matches.Value
      cmk forget $id --yes | Out-Null ; cmk digest | Out-Null
      cmk search "store" --scope decisions
      ```
      **PASS:** the first search returns the decision (labelled `decision`, clean snippet); after forget + digest the same search still returns it, labelled `decision (retracted)`.

- [ ] **★ DJ4-live — Claude reaches for the journal in chat (behavioral, real session).**
      Setup, in the LIVE project terminal:
      ```powershell
      cmk digest                                               # usually already done — auto-syncs (DJ5); run as fallback
      type context\DECISIONS.md                                # confirm it exists + lists this project's decisions
      ```
      Restart Claude Code (the MCP server is long-lived). Then in a fresh session, ask **naturally** about something that was SUPERSEDED this build. Talk like a forgetful teammate — do NOT say "search the decisions scope" or "what's the decision history":
      - *"weren't we doing `<the old approach>` at some point? what happened to that?"*
      - *"weren't we using `<X>` here? did that change?"*
      - *"did we ever try `<the rejected idea>` — or am I misremembering?"*

      **PASS:** Claude reaches for memory on its own and names the superseded/retracted decision — "yes, we used `<old>`, then moved to `<new>` on `<date>`". It surfaces the *retired* trail, not just the current state.
      **FAIL:** Claude never consults memory, answers only from current code/snapshot, or claims no such history.
      **NOT-A-RESULT:** if `context\DECISIONS.md` doesn't exist, the gate is untested.

      **⚠️ The honest nuance (cut-gate-16, 2026-06-18) — this gate has TWO things to verify, don't conflate them:**
      1. **Decision-history recall works** — confirmed live: the `memory-search` skill, asked a natural "what did we decide about X, did it change?" question, returns the full trail with the rejection reason. ✅ BUT it may answer from the **fact store** (`type:project` facts that ALSO record the decision), NOT necessarily the `--scope decisions` journal scan. A great answer alone does NOT prove the journal path fired.
      2. **The JOURNAL-SPECIFIC value** (the reason the scope exists) is the **retracted/superseded trail the fact store DROPS** — `cmk forget`-ten or `superseded_by`-annotated decisions that live ONLY in `DECISIONS.md`. To prove the journal scope adds value: forget (or supersede) a decision this build, then ask about it naturally — the fact store won't have it, so a correct answer MUST come from the journal. THAT is the unproven edge; target it explicitly.
      _(Fixed v0.3.3: `--scope decisions` under a hybrid default no longer emits `unknown-scope:decisions` / exit-2 — it's keyword-only by design and now coerces silently. If you still see that warning, you're on a pre-fix binary — reinstall.)_

- [ ] **★ DJ5 — the journal auto-populates with no `cmk digest` (v0.3.3).**
      In a throwaway project with the kit installed. **Do NOT run `cmk digest`.**
      ```powershell
      cmk remember "Adopt id-keyed index replacement" --type project --title "index-replace" --why "archive beats scratchpad" | Out-Null
      node <kit>\packages\cli\bin\cmk-compress-session.mjs    # the session-end hook
      Test-Path context\DECISIONS.md                          # expect True
      Select-String context\DECISIONS.md -Pattern "index-replace"   # the journal entry is keyed by --title, not the remember text
      ```
      **PASS:** `context\DECISIONS.md` exists and lists the decision (its `--title`, a `**When:**` date, the `**Why:**`) — no `cmk digest` was run.
      **FAIL:** the file is absent after the hook, or only `cmk digest` can produce it.

      Fallback (no-clean-exit session): delete `context\DECISIONS.md`, capture a decision, run `node <kit>\packages\cli\bin\cmk-compress-lazy.mjs`, re-check `Test-Path` → True.

- [ ] **★ DJ6-live — the journal populated ON ITS OWN, in a real session (v0.3.3 / Task 159; behavioral).**
      The in-chat counterpart to DJ5 — proves the auto-sync works through the real hooks, not just the bin. In a real Claude Code session on the project, make a decision conversationally (don't run any `cmk` command):
      - *"ok let's go with `<some choice>` for `<some thing>` — `<a reason>`."* (let Claude capture it however it does)
      End the session cleanly (close the window), then reopen / start a fresh session and check the file from the terminal: `type context\DECISIONS.md`.
      **PASS:** the decision you made by talking is in `DECISIONS.md` — with NO `cmk digest` and no manual command ever run. The journal kept itself current across the session boundary.
      **FAIL:** the decision isn't journalled, or it only appears after a manual `cmk digest`.
      _(DJ5 proves the mechanism via the bin; this proves the real hook fires it end-to-end — the D-164 "it just works" bar.)_

_(Tombstone recovery + the agent-stays-blind behavioral check live at **F-7b / F-7b-live** in §7 — not duplicated here.)_

---

## 4b. The conversational surface — Claude drives the tools (Tasks 108 + 117)  ⬅️ the v0.2.3 headline (standing)

The regular user **never types `cmk`** — they talk, and Claude runs the MCP tools **prompt-free**.
Run these **in chat** (a real Claude Code session), not the terminal. This is the surface the
CLI suite structurally can't cover (Claude is in the loop).

> ℹ️ **If `mk_*` tools don't resolve on the FIRST turn — it's a Claude Code ToolSearch race, not a kit bug.**
> Claude Code v2.1.x **defers** MCP tool schemas behind ToolSearch (only tool *names* load at session
> start; the model must hydrate a schema before calling the tool — `ENABLE_TOOL_SEARCH`). There is a
> known Claude Code bug ([anthropics/claude-code #42148](https://github.com/anthropics/claude-code/issues/42148),
> [#60052](https://github.com/anthropics/claude-code/issues/60052)): the deferred-tool list is **frozen at
> turn-start**, so if the model tries to resolve a tool before hydration settles it reports *"available
> (deferred) … isn't resolving via ToolSearch"* and falls back to the `cmk` **CLI** (the `memory-write`
> skill's documented graceful degrade — **capture still works, no data lost**). **This is Claude-Code-side,
> not ours** — verified from Claude Code's OWN MCP logs (2026-07-06, v0.4.5 gate, session `6c9763e4`):
> the `cmk` server **connected cleanly in 925 ms at session start with `hasTools:true`** — the connection
> was never the problem; the failure was purely in Claude Code's tool-search/hydration layer AFTER a
> healthy connect. **What to do:** just try again on the **next turn** (a fresh turn re-reads the now-hydrated
> tool list), or accept the CLI-fallback capture. The kit can't force its tools non-deferred — `defer_loading`
> is a Claude-Code/API-side toolset knob, not something a stdio MCP server advertises. _(NOT a
> restart-after-install issue: the logs prove `.mcp.json` loaded and the server connected in that first
> session — a restart is not the fix.)_

- [ ] **★ M0 — the 13 tools are live (Task 108).**
      Say: *"list your cmk MCP tools."*
      → `mk_remember, mk_search, mk_get, mk_timeline, mk_expand, mk_links, mk_cite, mk_recent_activity, mk_trust, mk_lessons_promote, mk_forget, mk_queue_list, mk_queue_resolve` (**13**).
      _(If they don't resolve on the first turn, see the ℹ️ note above — it's the Claude Code #42148 ToolSearch race, not a launch failure. Confirm G6 registered the server, then retry on a fresh turn.)_

- [ ] **★ M1 — capture in chat, prompt-free (Task 108).**
      Say: *"remember our staging environment runs on Fly.io — because it's cheap to spin ephemeral envs up and down."*
      **PASS:** Claude calls **`mk_remember`** (not a Bash command), **no "Allow this command?" prompt**, silent on success.
      _(The "because" makes it a rich **fact** — M2's forget targets facts, not the terse bullets a bare "remember X" makes.)_

- [ ] **★ M2 — "forget X" → two-step, then gone (Tasks 117 + 108b + 110).**
      Say: *"actually, forget the Fly.io staging decision."*
      **PASS, in order:**
      1. The **first** `mk_forget` call returns a **preview + a confirm token** — **nothing deleted yet** (an auto-invoking model can't silently destroy memory).
      2. After you confirm, the **second** call tombstones it.
      3. Say *"where does staging run?"* → **gone** (no Fly.io), with **no manual `cmk reindex`** (forget self-heals search).
      _(Pre-110 a forgotten fact lingered in search until a manual reindex; pre-117 there was no plain-speech path to forget at all.)_

- [ ] **M3 — "trust this / not important" (Task 117).**
      Capture two throwaway facts, then say on one *"that one's important — keep it,"* on the other *"eh, that's not important, I'm not sure about it."*
      **PASS:** Claude calls **`mk_trust`** with `high` for the first and `low` for the second.
      _(The one free-speech gap D-85 named — pre-117 trust could only be changed via the CLI.)_

---

## 4d. The persona-promotion redesign (Task 151 + 70.4)  ⬅️ the v0.4.3 headline

> Each probe below runs in a **throwaway sandbox** (`C:\temp\…` + a sandbox `MEMORY_KIT_USER_DIR`) against the **current-repo** binary (`node packages\cli\bin\cmk.mjs`), never the global `cmk` and never your real `context/` or `~\.core-memory-kit`. All five were live-verified during the v0.4.3 cut.

- [ ] **★ PR1 — a re-stated fact bumps `recurrence_count` (Move 1 — the earned promotion signal).**
      The recurrence path lives ONLY in the **rich** write (`writeFact`), so the remember MUST carry a rich flag (`--why`/`--how`/`--type`/`--title`) — a *bare* `cmk remember "text"` writes an id-less `MEMORY.md` bullet and never bumps. Run the **byte-identical** rich remember **twice**:
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; $bin="$repo\packages\cli\bin\cmk.mjs"
      $sand="C:\temp\cmk-pr1"; $proj="$sand\proj"; Remove-Item -Recurse -Force $sand -EA SilentlyContinue
      New-Item -ItemType Directory -Force "$proj","$sand\user" | Out-Null
      $env:MEMORY_KIT_USER_DIR="$sand\user"; Push-Location $proj; git init | Out-Null
      node $bin remember 'recurrence gate probe fact' --why 'the gate counts re-surfaces' --title 'recurrence gate probe' --type feedback
      node $bin remember 'recurrence gate probe fact' --why 'the gate counts re-surfaces' --title 'recurrence gate probe' --type feedback
      Pop-Location
      $fact="$proj\context\memory\feedback_recurrence-gate-probe.md"
      Select-String -Path $fact -Pattern 'recurrence_count:'                                   # → 2
      (Get-ChildItem "$proj\context\memory" -Filter 'feedback_*.md').Count                     # → 1 (over-mutation guard)
      Select-String -Path "$proj\context\.locks\audit.log" -Pattern '"action":"recurrence".*"recurrenceCount":2'
      ```
      **PASS:** the fact frontmatter shows `recurrence_count: 2`; **exactly one** `feedback_*.md` file exists (the 2nd identical remember did NOT create a fresh file); the audit log has a line with `"action":"recurrence"` + `"recurrenceCount":2`. **FAIL:** count stays 1, OR a second file appears (the id didn't match → the texts weren't byte-identical).
      _(The 2nd remember hits the same content-addressed id → `bumpRecurrence` rewrites the file in place. STDOUT prints only `already captured (duplicate) [P-…]` — the count is observable in the file + audit line ONLY, never echoed. A single remember = `recurrence_count: 1`, zero recurrence audit lines: the trivial-path control.)_

- [ ] **★ PR2 — a USER-tier persona over cap CONDENSES, never strands (Move 2 — the Hole-B fix).**
      Seed `USER.md` with real high-trust bullets past its cap, drop the cap below the on-disk size, then run the real SessionEnd handler. The persona must keep **every** bullet and create **no** `fragments/` fact (the un-injected store that caused the v0.3.1 cold-open bug).
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; $u='C:\temp\cmk-pr2\user'; $p='C:\temp\cmk-pr2\proj'
      Remove-Item -Recurse -Force C:\temp\cmk-pr2 -EA SilentlyContinue
      New-Item -ItemType Directory -Force $u,$p | Out-Null; Set-Location $p; git init | Out-Null
      $env:MEMORY_KIT_USER_DIR=$u; $env:CMK_PROJECT_DIR=$p; $env:CMK_SKIP_LIVE_HAIKU='1'
      node "$repo\packages\cli\bin\cmk.mjs" init-user-tier
      # Fill USER.md § About past cap with REAL high-trust (U-…) bullets that carry condensable slack
      # (trailing whitespace + a ≥2-blank-line run). The locked form is tests/cli-graduate-session.test.js:236.
      # … (seed ~1800 bytes of trust:high bullets into $u\USER.md) …
      $seeded=[regex]::Matches((Get-Content "$u\USER.md" -Raw),'\(U-[A-Za-z0-9]{8}\)')|%{$_.Value}|Sort-Object -Unique
      $before=(Get-Item "$u\USER.md").Length
      $fragBefore=@(Get-ChildItem "$u\fragments" -Filter *.md -EA SilentlyContinue|?{$_.Name -ne 'INDEX.md'}).Count
      [IO.File]::WriteAllText("$u\settings.json",'{ "scratchpads": { "USER.md": { "max_chars": 700 } } }')  # cap BELOW size
      '{}' | node "$repo\packages\cli\bin\cmk-compress-session.mjs" | Out-Null                  # real SessionEnd → sweep → condense (tier U)
      $after=Get-Content "$u\USER.md" -Raw
      $fragAfter=@(Get-ChildItem "$u\fragments" -Filter *.md -EA SilentlyContinue|?{$_.Name -ne 'INDEX.md'}).Count
      ```
      **PASS, all of:** every seeded `(U-…)` id is still in `USER.md` after the sweep (`$seeded | % { $after -match [regex]::Escape($_) }` all `True`); **no new** `fragments/` fact (`$fragAfter -eq $fragBefore`); **zero** `audit.log` lines with `action=graduated` AND `tier=U`. _(Bytes may stay > 700 — load-cap, not write-cap, D-61 — that's EXPECTED, not a failure.)_
      _(**Two traps the gate author hit live, both fixed above:** (1) `init-user-tier` SCAFFOLDS a `fragments/` dir, so `Test-Path fragments` is always True — assert "no NEW fact .md", not "dir absent". (2) the seed bullets MUST be `trust:high` — `consolidate()` drops not-high stale bullets BEFORE condense runs, a D-84 trivial-path trap; and they need condensable slack or condense returns `noop` (bullets still survive, but bytes won't shrink). The ACTUAL persona accrual is LLM-driven — flagged MANUAL as B8; the CONDENSE step here is mechanical/no-LLM, so seeding `USER.md` directly makes it deterministic.)_

- [ ] **★ PR3 — a pre-151 index gains `trust_score` on `cmk search`, non-destructively (Move 3 — the migration).**
      `trust_score` is an internal column with **no** user-facing readout (see the §0 honest note). The only CLI-observable effect is the **migration**: an index built before 151.6 (no column) gets it added in place, the old row survives, and the command doesn't crash.
      ```powershell
      # Seed a genuine PRE-151 memory.db (observations table WITHOUT trust_score + one real row),
      # then run `cmk search` (which opens the DB → migrateAddColumn), then re-open with sqlite and assert.
      # Full runnable seed/verify .mjs in tests/cli-index-db.test.js:392 ("MIGRATION: … gains the column on open").
      node "$repo\packages\cli\bin\cmk.mjs" search "survivor" --project $proj    # exits 0, does NOT crash on the ALTER path
      # PRAGMA table_info(observations) now lists trust_score; row 'P-PRESERVE' body == 'survivor body'
      ```
      **PASS:** `cmk search` exits 0 (no crash on the duplicate-ALTER path); `PRAGMA table_info` lists `trust_score`; the pre-existing row's data is intact (non-destructive). **FAIL:** a crash, or the old row is gone (a destructive rebuild).
      _(Bare `cmk reindex` does NOT trigger this — it returns before opening the SQLite DB. Use `cmk search` or `cmk reindex --boot|--full`. The score VALUE + its dampen/reinforce evolution is **suite-covered-only** — `cli-trust-score.test.js` + `cli-trust-signal.test.js` assert it via direct sqlite; there is no `cmk` command that prints a score.)_

- [ ] **★ PR4 — no-`--to` promotes topic-route across USER/HABITS/LESSONS (Move 4 — the Hole-C fix).**
      Before this, every no-arg `cmk lessons promote` funnelled into LESSONS § Cross-Project Lessons (single-section overflow → eviction). Now an offline router spreads by content. Capture three rich P-facts shaped for each route, promote each with **no `--to`**, and assert **three different** destination files.
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; Remove-Item -Recurse -Force C:\temp\cmk-pr4 -EA SilentlyContinue
      New-Item -ItemType Directory -Force C:\temp\cmk-pr4\user,C:\temp\cmk-pr4\proj | Out-Null
      $env:MEMORY_KIT_USER_DIR='C:\temp\cmk-pr4\user'; $proj='C:\temp\cmk-pr4\proj'
      node "$repo\packages\cli\bin\cmk.mjs" init-user-tier        # REQUIRED — promote does NOT create the user-tier files
      Push-Location $proj; git init | Out-Null
      node "$repo\packages\cli\bin\cmk.mjs" remember 'I prefer tabs over spaces in all my editors' --why 'muscle memory' --type feedback
      node "$repo\packages\cli\bin\cmk.mjs" remember 'I always run the full test suite before I commit anything' --why 'caught breakage' --type feedback
      node "$repo\packages\cli\bin\cmk.mjs" remember 'Learned the hard way that chokidar v5 drops glob patterns' --why 'lost an hour' --type feedback
      # capture the three printed P-ids, then promote each with NO --to:
      node "$repo\packages\cli\bin\cmk.mjs" lessons promote <P-id-1>     # → USER.md § Preferences
      node "$repo\packages\cli\bin\cmk.mjs" lessons promote <P-id-2>     # → HABITS.md § Working Style
      node "$repo\packages\cli\bin\cmk.mjs" lessons promote <P-id-3>     # → LESSONS.md § Tooling Lessons
      Pop-Location
      Select-String -Path C:\temp\cmk-pr4\user\USER.md,C:\temp\cmk-pr4\user\HABITS.md,C:\temp\cmk-pr4\user\LESSONS.md -Pattern 'U-[A-Za-z0-9]{8}'
      ```
      **PASS:** the three no-`--to` promotes print three **distinct** `→ <FILE> § <SECTION>` lines and the `Select-String` finds a reborn `U-…` id in **each of the three different files** — not all in LESSONS. **FAIL:** all three land in LESSONS (the router didn't fire), or a promote exits 3 with `not-promoted-no-file` (you skipped `init-user-tier`).
      _(**Load-bearing setup the mapped probe missed:** `cmk init-user-tier` FIRST — without the scaffolded USER/HABITS/LESSONS.md, every promote routes to the review queue and exits 3. The facts must be RICH (`--why` forces a fact FILE with an id; a terse remember can't be promoted). `routeTopic` is pure/offline — no Haiku — so the routing is deterministic.)_

- [ ] **★ PR5 — `cmk remember` rejects an invisible/zero-width Unicode char (Task 70.4 — the C3 sibling).**
      A hidden-instruction vector: a zero-width char invisible to a reviewer can smuggle text past the eye and ship with `git clone`. Inject a **genuine** U+200B (verify the codepoint rides argv — a 6-char ASCII escape would false-pass) and use the **bare** remember form (the rich path logs the rejection but exits 0 — see note).
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; $cmk="$repo\packages\cli\bin\cmk.mjs"
      $gate='C:\temp\cmk-pr5\proj'; $env:MEMORY_KIT_USER_DIR='C:\temp\cmk-pr5\.user'
      Remove-Item -Recurse -Force C:\temp\cmk-pr5 -EA SilentlyContinue
      New-Item -ItemType Directory -Force $gate,$env:MEMORY_KIT_USER_DIR | Out-Null
      Push-Location $gate; node $cmk install | Out-Null; Pop-Location
      $zwsp=[char]0x200B; $text="a normal looking note${zwsp}with a hidden zero-width space"
      ($text.ToCharArray() | ? { [int][char]$_ -eq 0x200B }).Count          # MUST be 1 (genuine codepoint)
      node $cmk remember $text --project $gate; "REMEMBER_EXIT=$LASTEXITCODE"  # → exit 2
      Get-Content "$gate\context\.locks\poison-guard.log" | Select-Object -Last 1   # Door 4
      node $cmk remember "a normal looking note with a hidden zero-width space" --project $gate; "CLEAN_EXIT=$LASTEXITCODE"  # → 0, writes
      ```
      **PASS:** the zero-width remember **exits 2** with stderr `pattern_id=injection_invisible_unicode`, writes **nothing** (fact-file count unchanged, `MEMORY.md` byte-identical), and appends a `poison-guard.log` NDJSON line with the span `***`-redacted; the ordinary-space control **exits 0 and writes** (the guard discriminates, isn't blanket-rejecting). **FAIL:** exit 0 on the zero-width input, or the control is also rejected.
      _(**Two load-bearing caveats:** (1) use the **bare** form — the RICH path (`--why`/`--type`/…) logs the same rejection but does NOT set exit 2 (it returns without `process.exitCode`); the C3-parallel exit-2 assertion needs bare `cmk remember "<text>"`. (2) pass `--project $gate` — a bare remember resolves projectRoot from cwd, and PowerShell resets cwd each call, so without `--project` the Door-4 log can land in the wrong dir. The MCP `mk_remember` write path is LLM-driven → MANUAL live-test.)_

---

## 4e. Temporal validity + the memory-commit proposal (Task 66 + 150)  ⬅️ the v0.4.4 headline

> Each probe below runs in a **throwaway sandbox** (`C:\temp\…` + a sandbox `MEMORY_KIT_USER_DIR`) against the **current-repo** binary (`node packages\cli\bin\cmk.mjs`), never the global `cmk` and never your real `context/` or `~\.core-memory-kit`.
> The `shape`/`expires_at` path lives ONLY in the **rich** write (`writeFact`), so every remember below carries a rich flag (`--why`/`--type`/`--title`) — a *bare* `cmk remember "text"` writes an id-less `MEMORY.md` bullet and never records `shape`/`expires_at`.

- [ ] **★ TV1 — `--shape` writes the shape field; default is `State`; invalid is rejected (66.1).**
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; $bin="$repo\packages\cli\bin\cmk.mjs"
      $sand='C:\temp\cmk-tv1'; $proj="$sand\proj"; Remove-Item -Recurse -Force $sand -EA SilentlyContinue
      New-Item -ItemType Directory -Force $proj,"$sand\user" | Out-Null
      $env:MEMORY_KIT_USER_DIR="$sand\user"; Push-Location $proj; git init | Out-Null
      node $bin remember 'ship the Cursor adapter next release' --shape Plan --why 'the v0.4.5 lane' --title 'cursor plan' --type project
      node $bin remember 'the store is FTS5 keyword search' --why 'markdown is source of truth' --title 'store shape' --type project
      node $bin remember 'this should not write' --shape Banana --why 'x' --title 'bad shape' --type project; "BAD_EXIT=$LASTEXITCODE"
      Pop-Location
      Select-String -Path "$proj\context\memory\project_cursor-plan.md" -Pattern 'shape: Plan'      # → shape: Plan
      Select-String -Path "$proj\context\memory\project_store-shape.md"  -Pattern 'shape: State'     # → default State
      ```
      **PASS:** the `--shape Plan` fact frontmatter shows `shape: Plan`; the plain rich fact shows `shape: State` (the explicit default); the `--shape Banana` remember is **rejected** (non-zero exit, no `project_bad-shape.md` written). **FAIL:** shape absent, default missing, or the invalid shape wrote a file.

- [ ] **★ TV2 — `--expires` writes `expires_at`; a past-dated fact HIDES from search yet resurfaces with `--include-expired` (66.3, hide-never-delete).**
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; $bin="$repo\packages\cli\bin\cmk.mjs"
      $sand='C:\temp\cmk-tv2'; $proj="$sand\proj"; Remove-Item -Recurse -Force $sand -EA SilentlyContinue
      New-Item -ItemType Directory -Force $proj,"$sand\user" | Out-Null
      $env:MEMORY_KIT_USER_DIR="$sand\user"; Push-Location $proj; git init | Out-Null
      # A FUTURE expiry — writes the field, stays visible:
      node $bin remember 'the beta flag stays on until launch' --shape Plan --expires 2099-01-01 --why 'temporary gate' --title 'beta flag' --type project
      # A PAST expiry — writes the field, hides from default search:
      node $bin remember 'the old migration window closed' --shape Plan --expires 2020-01-01 --why 'one-time' --title 'old window' --type project
      Select-String -Path "$proj\context\memory\project_beta-flag.md" -Pattern 'expires_at:'          # field present
      node $bin search 'migration window' --project $proj                       # → hidden (no hit for the past-expired fact)
      node $bin search 'migration window' --project $proj --include-expired     # → the past-expired fact resurfaces
      Pop-Location
      ```
      **PASS:** both facts carry `expires_at:`; the plain `cmk search` does **not** return the 2020-expired fact but **does** with `--include-expired` (the fact is hidden, never deleted — the file still exists on disk). **FAIL:** the field is missing, the past-expired fact shows in the plain search, or `--include-expired` doesn't resurface it.

- [ ] **★ TV3 — `cmk weekly-curate` tombstones facts past `expires_at` and reports `expired_swept` (66.3 sweep).**
      The expiry sweep runs at curate time (even on a cooldown-skip). Seed a past-expired fact, then run curate for real.
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; $bin="$repo\packages\cli\bin\cmk.mjs"
      $sand='C:\temp\cmk-tv3'; $proj="$sand\proj"; Remove-Item -Recurse -Force $sand -EA SilentlyContinue
      New-Item -ItemType Directory -Force $proj,"$sand\user" | Out-Null
      $env:MEMORY_KIT_USER_DIR="$sand\user"; $env:CMK_SKIP_LIVE_HAIKU='1'
      Push-Location $proj; git init | Out-Null
      node $bin remember 'this validity window already closed' --shape Plan --expires 2020-01-01 --why 'past' --title 'closed window' --type project
      $before=(Get-ChildItem "$proj\context\memory\project_*.md" -EA SilentlyContinue).Count
      node $bin weekly-curate --project $proj                                   # runs the expiry sweep pre-cooldown
      Select-String -Path "$proj\context\.locks\audit.log" -Pattern '"deletedBy":"expiry-sweep"'   # the tombstone signal
      Pop-Location
      ```
      **PASS:** `cmk weekly-curate` reports a non-zero `expired_swept` (in its output/NDJSON) and the audit log carries a `"deletedBy":"expiry-sweep"` line — the past-expired fact is tombstoned (audit trail preserved, not a silent delete). A fact with a FUTURE `expires_at` is **untouched** (over-mutation guard). **FAIL:** the expired fact survives the sweep, or nothing is reported.
      _(The sweep runs BEFORE the cooldown check, so a `(skipped: cooldown)` curate STILL sweeps expiries — that's the design. `CMK_SKIP_LIVE_HAIKU=1` here keeps the run deterministic; the temporal-judge leg is TV4's live flag.)_

- [ ] **★ TV4 — a newer State fact CLOSES an older one's window (66.2 temporal supersede — deterministic leg).**
      The full sweep's SUPERSEDES/DUPLICATE/COEXIST verdict is a **live-Haiku** judge (see §0 MANUAL flag). This gate proves the deterministic **close mechanics** the judge routes into — via the sweep on the real corpus, or (deterministic) by asserting the window-close on a known older/newer pair. On THIS repo, run the real sweep and inspect:
      ```powershell
      # In the LIVE project terminal (real corpus, real Haiku — this is the manual live leg):
      cmk weekly-curate                                        # the temporal sweep runs post-cooldown
      Select-String -Path context\.locks\audit.log -Pattern '"reason":"temporal-supersede"' | Select-Object -Last 5
      dir context\memory\archive\superseded 2>$null            # closed facts move here
      ```
      **PASS:** where a genuinely-superseded CURRENT-STATE claim exists (e.g. a stale v0.3.2 state-chain the newer v0.4.x fact replaced), the sweep closes it — the older fact gains `ended_at` + `status: completed` + `superseded_by`, moves under `archive/superseded/`, and an audit line with `"reason":"temporal-supersede"` lands. **Crucially — NO false SUPERSEDES**: coexisting facts on different points stay untouched (event-time decides direction; the judge frames "is the old state still current"). **FAIL:** a false close (two unrelated facts collapsed), or the direction reversed (a newer fact closed by an older one — the direction guard failed).
      _(The deterministic close path — `resolveTemporalSupersede(olderId, newerId)` — is suite-covered in `cli-validity-window.test.js` + `cli-temporal-sweep.test.js` (13 cases incl. the Door-3.5 prompt pin, overflow two-pass, malformed-rejudge). This gate is the **live** confirmation that the judge's verdicts are sane on real data — the one leg the suite structurally can't reach.)_

- [ ] **★ MC1 — SessionStart PROPOSES a memory commit when `context/` is dirty; the kit runs no git (Task 150, ADR-0018).**
      The kit detects uncommitted `context/` changes and injects a **model-facing** proposal line into the SessionStart context — it never stages or commits anything itself. Probe the injection with a dirty `context/`:
      ```powershell
      $repo='C:\Projects\claude-memory-kit'; $bin="$repo\packages\cli\bin\cmk.mjs"
      $sand='C:\temp\cmk-mc1'; $proj="$sand\proj"; Remove-Item -Recurse -Force $sand -EA SilentlyContinue
      New-Item -ItemType Directory -Force $proj,"$sand\user" | Out-Null
      $env:MEMORY_KIT_USER_DIR="$sand\user"; Push-Location $proj; git init | Out-Null
      node $bin install | Out-Null
      git add -A; git commit -q -m 'scaffold'                    # clean baseline
      node $bin remember 'a durable decision worth committing' --why 'x' --title 'dirty fact' --type project | Out-Null
      # context/ now has an uncommitted change — the proposal should appear in the injected context:
      '{}' | node "$repo\packages\cli\bin\cmk-inject-context.mjs" | Select-String -Pattern 'commit|context/|approve'
      $statusBefore = git status --porcelain -- context/
      Pop-Location
      ```
      **PASS:** the injected context carries a proposal line naming the uncommitted `context/` change and instructing the model to act **only on the user's yes** (it references not running git before approval, per ADR-0018); the kit itself made **no git write** (`$statusBefore` still shows the change uncommitted — the kit proposed, it did not commit). On a **clean** `context/` (commit first, re-inject), **no** proposal line appears. **FAIL:** the kit staged/committed on its own, the line appears when `context/` is clean, or no line appears when it's dirty.
      _(The git probe uses a **400ms leash** inside the 500ms NFR-1 inject budget — on a slow disk the proposal degrades SILENTLY (no line) rather than blowing the budget; that's the documented trade-off, not a failure. The **spoken relay** — Claude actually voicing the proposal and waiting for the yes — is LLM-driven → MANUAL live-MCP confirmation, per §0.)_

---

## 4f. The agent-relative backend + split-brain (Task 200 + 201)  ⬅️ the v0.4.5 headline

The automatic engine now runs through the agent's OWN CLI, and the user can override which agent runs it. BK1–BK3 are CLI-deterministic (run them in the build terminal on any machine); **BK4 is the live cross-agent flag** (needs a 2nd agent's CLI present — see §0).

- **★ BK1 — `cmk doctor` HC-11 (backend LLM CLI present).** On a fresh Claude-Code install, `cmk doctor` reports **15** checks and HC-11 = PASS (the `claude` CLI is on PATH). To prove the FAIL path deterministically, use the injectable probe in a script (`runDoctor({ projectRoot, userDir, backendCliProbe: () => ({ agent: 'kiro', bin: 'kiro-cli', present: false, reason: 'kiro-cli not found on PATH' }) })`) — HC-11 = FAIL with an honest "automatic features degraded, file-only still works" message and **no `recoveryCommand` that implies data loss**.
  **PASS:** 15 checks, HC-11 PASS on a healthy install; the injected-absent probe yields a FAIL that names the missing CLI + says capture/search/recall still work. **FAIL:** doctor reports the wrong number of checks, or HC-11 silently SKIPs when the CLI is absent (the D-270 bug), or the message frames it as broken/fatal.

- **★ BK2 — `cmk install --backend <agent>` (the split-brain override + fail-fast).** In a throwaway dir:
  ```bash
  cmk install --backend kiro          # installed-for claude-code, backend overridden to kiro
  cat context/settings.json           # → { "backend": { "agent": "kiro" } }
  cmk install --backend banana        # → exit 2, "unknown --backend 'banana'. Supported: claude, kiro, cursor.", and NO context/ scaffolded in a FRESH dir (fail-fast BEFORE scaffold)
  ```
  **PASS:** a valid `--backend` writes `backend.agent` + the install line warns about the EFFECTIVE backend CLI (kiro-cli), not the installed-for agent; a bad value exits 2 with the supported list AND leaves no half-install (a fresh dir has no `context/`). **FAIL:** the flag is ignored, the wrong agent is warned about, or a typo leaves a scaffolded-but-exit-2 project.

- **★ BK3 — `cmk config show` (the setup readout).** In the `--backend kiro` project from BK2:
  ```bash
  cmk config show
  ```
  **PASS:** the readout names the **installed-for** agent (`claude-code`), the **active backend** agent (`kiro`) marked as an **override** that differs from installed-for, the backend-CLI presence, and the semantic mode — and exits **0** (informational, never a failure exit). **FAIL:** it doesn't reflect the override, crashes on an odd project state, or exits non-zero.

- **★ BK4 — live cross-agent spawn (MANUAL, per §0).** On a machine that HAS a non-`claude` agent CLI: `cmk config set backend.agent kiro` (or `cursor`), seed a session buffer, then trigger a real compression (`cmk roll --scope now`) and confirm a real Markdown summary lands in `sessions/` (not a refusal, not empty). **This was live-verified on the dev machine for both `kiro-cli` (D-278) and `cursor-agent` (D-280).** The cut-gate operator flags it honestly if their machine lacks the 2nd CLI — never claim verified for a backend you couldn't spawn.

---

## 4g. The hardening gates (Tasks 203–216, 219, 220)  ⬅️ the v0.5.1 headline

All six run in a **throwaway** project.
HG1 needs a live Haiku (real distill); the rest are deterministic.

```powershell
$h = "C:\Temp\hardening-check"; Remove-Item -Recurse -Force $h -EA SilentlyContinue
mkdir $h > $null; Set-Location $h; git init | Out-Null; cmk install | Out-Null
```

- **★ HG1 — resumable distill + per-day provenance (Tasks 203/204/213).**
  Seed two aged day files, distill, then distill AGAIN:
  ```powershell
  '## Decisions' + "`n" + '- picked Postgres over SQLite for the API' | Set-Content context\sessions\today-2026-07-08.md -Encoding utf8
  '## Decisions' + "`n" + '- moved auth to middleware' | Set-Content context\sessions\today-2026-07-09.md -Encoding utf8
  cmk daily-distill                    # live Haiku — a real summary per day
  type context\sessions\recent.md      # a `## 2026-07-08` AND a `## 2026-07-09` section (the provenance pointers)
  dir context\sessions\*.distilled.md  # the per-day banked artifacts (2 files)
  # Clear the shared Haiku cooldown first — else run 2 reports `skipped (cooldown)`,
  # which is NOT a pass (the §0 real-input rule):
  Remove-Item context\.locks\last-haiku-call.ts -EA SilentlyContinue
  cmk daily-distill                    # SECOND run — must SKIP both days (resumed), no re-bill
  ```
  **PASS:** `recent.md` carries one `## <date>` section per source day; two `.distilled.md` artifacts exist; the second run reports the days skipped-resumed (see `skipped_resumed` in `context\.locks\distill.log` — the resumability, observable).
  **FAIL:** one whole-corpus blob with no date sections, or the second run re-distills (re-bills) the same days.

- **★ HG2 — HC-10 checks the OUTCOME, not the heartbeat (Task 203).**
  Fake a fresh heartbeat over a stale `recent.md`:
  ```powershell
  New-Item -ItemType File -Force context\.locks\cron-heartbeat | Out-Null   # "the cron ran"
  (Get-Item context\sessions\recent.md).LastWriteTime = (Get-Date).AddDays(-6)   # ...but the OUTPUT is 6 days old
  cmk doctor
  ```
  **PASS:** HC-10 **FAILs** (fresh heartbeat + stale `recent.md` = the cron runs but produces nothing — the D-298 shape).
  **FAIL:** HC-10 passes/skips — the heartbeat alone bought a green.

- **★ HG3 — a trust INCREASE re-screens the content (Task 216).**
  Hand-seed a "legacy" fact that predates the screen (bypassing the write path on purpose):
  ```powershell
  $fact = @(
    '---',
    'id: P-A2B2C3D4',
    'type: feedback',
    'trust: medium',
    '---',
    '',
    'CI deploys use AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE - rotate quarterly.'
  )
  ($fact -join "`n") | Set-Content context\memory\feedback_legacy-key.md -Encoding utf8
  cmk trust P-A2B2C3D4 high            # must REJECT (exit 2, poison_guard)
  findstr "trust: medium" context\memory\feedback_legacy-key.md    # unchanged
  cmk trust P-A2B2C3D4 low             # a DECREASE still succeeds
  ```
  **PASS:** the increase exits 2 naming the pattern; the file keeps `trust: medium` until the decrease lands `low`.
  **FAIL:** the increase succeeds — old content gets blessed past the current catalog.

- **★ HG4 — the distill INPUT pre-screen (Task 216).**
  A secret in a source day must cost a regex pass, not a model call:
  ```powershell
  'deploy uses AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE today' | Set-Content context\sessions\today-2026-07-10.md -Encoding utf8
  'old but clean' | Set-Content context\sessions\recent.md -Encoding utf8
  Remove-Item context\.locks\last-haiku-call.ts -EA SilentlyContinue   # clear the cooldown (§0)
  cmk daily-distill                    # returns FAST — skipped BEFORE any Haiku call
  type context\sessions\recent.md      # still "old but clean" — never truncated
  findstr "daily-distill" context\.locks\poison-guard.log   # the :input stage tag, redacted
  ```
  **PASS:** `skipped` / `poison-guard`, the old `recent.md` untouched, and the poison-guard log line is REDACTED (`***`, never the token) with the `:input` tag.
  **FAIL:** a model call fires, `recent.md` is clobbered, or the cleartext token appears in any log.
  _Clean up the poisoned day before moving on: `Remove-Item context\sessions\today-2026-07-10.md`._

- **★ HG5 — a BOM'd destructive payload is still BLOCKED (Task 207).**
  Pre-v0.5.1 a UTF-8 BOM broke the guard's JSON parse and it failed OPEN:
  ```powershell
  $payload = '{"tool_name":"Bash","tool_input":{"command":"rm -rf context/memory"}}'
  $env:CMK_PROJECT_DIR = $h
  ([char]0xFEFF + $payload) | cmk-guard-memory
  echo "exit=$LASTEXITCODE"
  Remove-Item Env:\CMK_PROJECT_DIR
  ```
  **PASS:** `exit=2` (the guard's BLOCK exit) on the BOM'd payload — same as the un-BOM'd variant (run it without the `[char]0xFEFF` to compare).
  **FAIL:** `exit=0` on the BOM'd variant — the pre-v0.5.1 fail-open (unparseable input was allowed through).

- **★ HG6 — duplicate managed blocks: HC-9 flags, install FOLDS (Task 220).**
  Duplicate the CLAUDE.md block by hand (the kept-both-sides merge shape):
  ```powershell
  $md = Get-Content CLAUDE.md -Raw
  $start = $md.IndexOf('<!-- core-memory-kit:start')
  $end = $md.IndexOf('<!-- core-memory-kit:end -->') + '<!-- core-memory-kit:end -->'.Length
  $block = $md.Substring($start, $end - $start)
  $md.TrimEnd() + "`n`nuser note BETWEEN blocks`n`n" + $block + "`n" | Set-Content CLAUDE.md -Encoding utf8
  cmk doctor                            # HC-9 must FAIL naming the duplicate
  cmk install                           # folds to ONE block
  (Select-String CLAUDE.md -Pattern "core-memory-kit:start").Count   # = 1
  findstr "BETWEEN" CLAUDE.md           # the user note survived
  cmk doctor                            # HC-9 back to PASS
  ```
  **PASS:** doctor fails on the duplicate → install folds to exactly one block, the user note between the blocks is preserved → doctor passes.
  **FAIL:** doctor stays green on two blocks, or install leaves/orphans the second block, or the user note is lost.

```powershell
Set-Location C:\Temp; Remove-Item -Recurse -Force $h -EA SilentlyContinue
```

**The two MANUAL flags (from the v0.5.1 banner — do NOT claim these verified from the CLI):**

- **Transcript WITHHOLD (Task 216):** in a LIVE session on a real project, paste a secret-shaped token in conversation; after the promote runs, the committed `context\transcripts\<date>.md` must carry `<!-- batch withheld: poison-guard … -->` — never the token; the raw stays in the gitignored `.live.md`.
- **23:00 no-window (Task 215):** after `cmk register-crons`, confirm the task's action is `wscript.exe //B //Nologo "<...>-run.vbs"` (`Get-ScheduledTask cmk-daily-distill | Select -Expand Actions`) — then the overnight observation: no black window at 23:00. The shim mechanism is probe-proven (D-319); the scheduled end-to-end is yours.

---

## 5. Session 2 — recall + recall-QUALITY  ⬅️ start a NEW session

Start Session 2 as a **new chat in the SAME window** (don't cleanly close Session 1) — that's the
case Task 105 fixes: Claude Code does **not** fire SessionEnd on a new-chat-same-window, so the
`now.md` rollup has to self-heal at the new SessionStart instead.

Without re-explaining anything, ask:
*"What are my standing cross-project rules, and how is this project structured?"*
then:
*"Add a `/health` endpoint."*

- [ ] **★ D1 — recall.**
      It names your rules (uv/ruff/type-hints/layered) + the structure (port 8000, layered, Claude SDK)
      **without a re-brief**.

### ★ W1–W4 — the v0.3.0 recall ladder (run here, in Session 2)

The headline gate. Each rung exercises a different layer of the new recall stack.

- [ ] **★ W1 — the recall skill FIRES (Tasks 75.0–75.2).**
      Ask **naturally**, the way you'd actually talk — NOT a "what did we decide about X" trigger phrase (that tests string-matching, not Claude's judgment). Pick any:
      - *"remind me how this thing is laid out — I forget where the logic lives."*
      - *"wait, why did we set it up this way again?"*
      - *"before I add to this, what's the convention here?"*
      **PASS, all three:**
      1. Claude **invokes the `memory-search` skill on its own** (you'll see the skill/agent activity) — not a `Grep`/`Read` crawl of the code, and not a generic answer that ignores memory.
      2. The answer is a **curated summary with citation ids** (`P-XXXXXXXX`) — not raw file dumps.
      3. It happens **mid-session** too (the per-prompt hint keeps the awareness alive after the snapshot scrolls) — ask again, casually, ~20 turns in.
      _(The point of the oblique phrasing: real recall has to fire on how a user TALKS, not on a magic phrase. If it only fires on "what did we decide about X", the trigger is too brittle — a finding, not a pass. Pre-v0.3.0 this was D3's "~50/50, ship anyway".)_

- [ ] **★ W2 — paraphrase recall (Tasks 65 + 46).**
      In the terminal — a question with **ZERO keyword overlap** with what you said in Session 1
      (you said "uv, never pip" / "FastAPI is the delivery layer"):
      ```powershell
      cmk search "how do we manage python dependencies"     # no flags — hybrid is the default after G7
      cmk search "where does business logic belong"
      ```
      **PASS:** each finds the right fact (the uv rule; the services-layer rule). The result line says `mode=hybrid` (or semantic).
      _(Keyword-only would miss both — that's the 0.176 → 0.941 bench gap shipping.)_

- [ ] **★ W3 — transcripts record what Claude DID (Task 104.1).**
      ```powershell
      type context\transcripts\*.md | Select-String -Context 0,4 "\*\*Tools:\*\*" | Select-Object -First 3
      ```
      **PASS:** assistant turns carry a `**Tools:**` block — the commands run / files edited during Session 1,
      with truncated results. _(This is the durable record native lacks — its JSONL expires in ~30 days.)_

- [ ] **★ W4 — the raw record is searchable, as LAST RESORT (Task 104.2).**
      Pick something that happened only as an ACTION in Session 1 (a command output, an error you saw — not a stated fact):
      ```powershell
      cmk search "<that error/command fragment>" --scope transcripts
      cmk search "<the same fragment>"                       # default scope: must NOT return raw chunks
      ```
      **PASS:** the transcripts scope finds it (a `T:context/transcripts/...` hit); the **default scope stays curated** (no transcript leak).
      In chat, the skill's Step 4 reaches the same tier when curated memory has no answer.

- [ ] **D6 — SessionStart self-heal (Task 105).**
      Session 1's buffer rolled forward even though you never cleanly closed it — at Session 2's
      SessionStart the kit rolled the leftover `now.md` into a dated daily file:
      ```powershell
      dir context\sessions\today-*.md      # exists (Session 1 rolled at Session 2 start)
      type context\sessions\*.compress.log  # a roll entry; now.md is small/empty again
      ```
      _(Pre-Task-105 a never-cleanly-closed session left `now.md` growing with no `today-*.md` built.
      If you closed+reopened cleanly instead, SessionEnd already rolled it — same outcome, different trigger.)_

- [ ] **D2 — style follow-through.**
      `/health` lands as a **thin route** in `api/`, **type-hinted**, without being re-told your style.

- [ ] **★ D3 — recall FEEL (now a GATE — Task 75 shipped).**
      Watch *how* it answers your **rules**: it must **lead with memory** (the injected snapshot, `mk_search`, or the
      memory-search skill) — **never** glob/read the code to re-derive what memory already holds.
      _Decision trail: pre-v0.3.0 this was a judgment call ("~50/50, the known Task-75 gap, rec: ship anyway").
      v0.3.0 IS the Task-75 fix (authority preamble + skill + hint) — so re-deriving-from-code is now a **blocker**, not a shrug._

- [ ] **R2-quality — no hallucinated summary (Task 84).**
      Type: `context\sessions\recent.md` and `today-*.md`
      → the rolling summary describes only what the session contained (FastAPI, layered, Claude SDK, port 8000).
      **FAIL:** an invented framework (Flask/Django), wrong SDK, or a port the project never had.

- [ ] **R3-quality — config recall, not a code-read (Task 80).**
      `cmk search "port 8000"` returns a hit,
      and the "what port" answer doesn't require globbing `**/*.py`.

- [ ] **D4 — stale-thread baseline (Task 68, watch).**
      `context\MEMORY.md` "Active Threads" — are finished threads still listed as active?
      (Baseline for the v0.2.x pruning fix.)

- [ ] **D5 — importance-aware inject (Task 93, observational).**
      If a tier ever overflowed its inject budget, `context\.locks\truncation.log` shows
      `"strategy":"importance-ordered"` and the **dropped** sections are the lowest-value ones —
      never a high-trust section while a low-trust one survives.
      ```powershell
      type context\.locks\truncation.log
      ```
      _(No truncation event = the tiers fit; the ordering is suite-covered regardless.)_

---

## 6. Session 3 — the cold-open (the wedge, wow #1)  ⬅️ a BRAND-NEW project

```powershell
# A genuinely FRESH folder each run (never reuse one that already ran cmk install).
mkdir C:\Temp\cut-gate-coldopen-23; cd C:\Temp\cut-gate-coldopen-23
git init
# Set a REALISTIC-BUT-FICTIONAL git identity so a `uv init` echo tests the
# privacy SCREEN, not a real leak (and NOT example.com — that's allowlisted):
git config user.name "Alex Personname"; git config user.email "alex.personname@gmail.com"
cmk install --with-semantic; code .
```
Ask: *"Start a new Python backend for me - set up the structure."*

- [ ] **★ E1 — cold-open (the wedge).**
      It scaffolds the **layered** shape + `uv`/`ruff` tooling **without being told** —
      because the Session-1 persona injected.
      *"How does it know that?"* = the wedge.
      **This is the gate that matters most.**

- [ ] **★ E2 — the privacy screen (Task 148, the leak this incident CREATED).**
      During the session, do something that echoes the git-config identity into
      tool output — e.g. `uv init` (it reads `Alex Personname / alex.personname@gmail.com`).
      Let one more turn pass (the L3 judge runs in the detached child — the
      committed transcript lags by seconds), then check:
      ```powershell
      # PASS = the committed transcript shows «EMAIL»/«NAME», NOT the real identity:
      Select-String -Path C:\Temp\cut-gate-coldopen-23\context\transcripts\*.md `
        -Pattern "alex.personname|Alex Personname|«EMAIL»|«NAME»"
      # …and the originals survive ONLY in the gitignored recovery log:
      Get-Content C:\Temp\cut-gate-coldopen-23\context\.locks\redactions.log
      ```
      **PASS:** the committed `{date}.md` carries `«EMAIL»` (L1 masked it at capture)
      and `«NAME»` (L3 judge caught the bare name at promote); the real
      `alex.personname@gmail.com` / `Alex Personname` appear **only** in the
      gitignored `redactions.log`. The `*.live.md` buffer (unscreened) is gitignored.
      _This is the exact leak that blocked the v0.5.0 tag (D-294); E2 confirms it's closed._

- [ ] **★ E3 — the learn-loop fires automatically (v0.5.0 headline; Tasks 190–193, ADR-0017).**
      The loop is OBSERVE-ONLY in v0.5.0 — it LOGS outcome signals (doesn't yet rank).
      **★★ Automatic-path rule (D-169): assert the artifacts WITHOUT running any `cmk`
      command by hand — the SessionStart hook + a natural turn are the only triggers.**
      After the cold-open session above (which injected memory + ran in-chat searches),
      and after one turn that produced an **outcome** (a tool call that failed, or you
      corrected a recalled fact — the oracle-free failure signal), check:
      ```powershell
      $L = "C:\Temp\cut-gate-coldopen-23\context\.locks"
      # (1) RECALL-LOG — the SessionStart inject logged the snapshot's ids; an in-chat
      #     search logged its returned ids + query (NO `cmk search` run by hand):
      Get-Content "$L\recall.log" | Select-String '"source":"inject"' | Select-Object -First 1
      Get-Content "$L\recall.log" | Select-String '"source":"search"' | Select-Object -First 1
      # (2) TRUST-SIGNALS — the Stop-hook judge wrote a delta for the turn's outcome:
      Get-Content "$L\trust-signals.log" -ErrorAction SilentlyContinue | Select-Object -Last 3
      # (3) EXPECTATIONS — if any assistant turn carried a `PREDICTION: …` line, it landed PENDING:
      Get-Content "$L\expectations.log" -ErrorAction SilentlyContinue | Select-Object -Last 2
      ```
      **PASS:** `recall.log` has BOTH a `source:"inject"` line (ids match the injected
      snapshot) AND a `source:"search"` line (the in-chat query) — proving recall is
      attributed with **no manual command**; AND `trust-signals.log` carries a sane-delta
      entry from the turn's outcome (the judge fired on the Stop hook alone). A
      `judgment_<slug>.md` under `context\memory\` is a bonus if a `PREDICTION:` resolved.
      _Honest asymmetry (record it): within one session the loop reliably fires on FAILURE
      signals (failed command / correction / PREDICTION:MISS); it cannot self-confirm a
      SUCCESS within-session (success is silent — value surfaces next session on recall).
      So E3 proves the failure-signal path; the success path is a cross-session property.
      This log IS the Task-194 release-gate artifact — v0.5.1 ranking is approved only on
      real, sensible `trust-signals.log` deltas (no false-positives, no storms)._

---

## 7. Full feature sweep — every `cmk` subcommand  (~20 min, in `C:\Temp\cut-gate23`)

**Recall & index**

- [ ] **F-1**
      - `cmk search "<kw>"` finds facts
      - `cmk reindex` rebuilds, search still works

**Cross-project persona**

- [ ] **F-2**
      `cmk persona generate` → runs synthesis;
      candidates promote or land in `~\.core-memory-kit\queues\persona-review.md`.

- [ ] **★ F-3 — explicit promote (Task 76).**
      `cmk lessons promote <id>` → moves a project **fact** to the user tier at **`trust: high`** via the safe path;
      verify the bullet in `~\.core-memory-kit\LESSONS.md`; try `--to HABITS.md`.
      _Use a **fact** id — in `cmk search` output its location is a `context\memory\*.md` file (a `context\MEMORY.md:NN` row is a scratchpad **bullet**, which promote rejects with a "scratchpad bullet, not a fact" hint)._

- [ ] **★ F-3b — persona portability (Task 72).**
      `cmk persona export persona-bundle.json` → one bundle file;
      then `cmk persona import persona-bundle.json` (re-import is idempotent — backs up + reapplies);
      the export carries **no** username/secret (already sanitized), and `.locks/.index/` are NOT in the bundle.

**Lifecycle & self-curation**

- [ ] **F-4**
      - `cmk daily-distill` → consolidates daily summaries
      - `cmk weekly-curate` → rolls `today-*.md` >7d into `archive.md`

- [ ] **F-5**
      `cmk roll` → session rotation (no error on your OS).
      _(`cmk compress` requires `--lazy` in v0.1.0 — bare `cmk compress` is a v0.1.x stub.)_

- [ ] **★ RT1 — compression RETRIES a transient failure + records the retry rate (Task 161 / D-175 + 161.12 — new in v0.3.4).**
      The retry needs an INJECTED transient failure (you can't make real Haiku fail on demand). Run this probe from the repo (the build terminal), driving the REAL `compressWithRetry` with a backend that times out once then calls real Haiku:
      ```powershell
      cd C:\Projects\claude-memory-kit
      node -e "import('./packages/cli/src/compress-retry.mjs').then(async m=>{const {HaikuTimeoutError,HaikuViaAnthropicApi}=await import('./packages/cli/src/compressor.mjs');const real=new HaikuViaAnthropicApi({model:'claude-haiku-4-5-20251001'});let n=0;const flaky={modelId:()=>real.modelId(),estimatedCostPerCall:b=>real.estimatedCostPerCall(b),async compress(o){n++;if(n===1)throw new HaikuTimeoutError('injected',{timeoutMs:50000});return real.compress(o)}};let retries=0;const r=await m.compressWithRetry(flaky,{input:'## t — user\n\nadd a retry\n',instructions:'Summarize terse.',preserveCitationIds:true,maxOutputBytes:4096,timeoutMs:50000},{maxAttempts:2,baseBackoffMs:600,onRetry:()=>retries++});console.log('attempts:',n,'retries:',retries,'recovered:',!!r.outputText);console.log('isRetryable(timeout):',m.isRetryableCompressError(new HaikuTimeoutError('x',{timeoutMs:1})),'isRetryable(ENOENT):',m.isRetryableCompressError(Object.assign(new Error('x'),{code:'ENOENT'})));});"
      ```
      **PASS:** `attempts: 2 · retries: 1 · recovered: true` AND `isRetryable(timeout): true · isRetryable(ENOENT): false`. **FAIL:** `attempts: 1` (no retry) / `recovered: false` / ENOENT classified retryable. _(The `retries` count is what 161.12 writes into compress.log so a degrading-environment retry RATE is visible; a deterministic failure fails fast — no wasted retry.)_

- [ ] **F-6**
      `cmk register-crons` → registers host-scheduler jobs (then `cmk doctor` HC-6 passes); confirm no error.

**Memory management**

- [ ] **F-7**
      `cmk forget <id> --yes` → tombstones: the fact file is **moved to `archive\tombstones\<id>.md`** (body preserved — NOT hard-deleted), and its DB row is pruned.
      **Since v0.2.3:** the fact **disappears from `cmk search` immediately** — no manual `cmk reindex` (Task 110); the free-speech / two-step path is **M2**.
      **`cmk get <id>` returns `not found`** — `get` is **live-only by default** (forget prunes the row). Automatic recall never resurfaces a forgotten fact (a deleted fact must stay invisible to the agent).
      **F-7b (Task 155 / D-163) — human-only recovery:** `cmk get <id> --include-tombstoned` recovers the forgotten body + `deleted_at`/`deleted_by`, marked `tombstoned: true`. **PASS:** plain `cmk get <id>` → `not found`; `cmk get <id> --include-tombstoned` → the body returns. **The D-163 lock:** the MCP `mk_get` tool is tombstone-blind — there is NO `include_tombstoned` param on it, so the AI can never recover a forgotten fact (verified by the contract-lock test `does NOT recover a tombstoned fact (D-163)`).
      **F-7b-live (the agent-stays-blind check — run in a real Claude Code session).** After forgetting a fact (use M2's Fly.io staging fact, or any `cmk forget`-ten id), open a session and ask **naturally** — as if you genuinely forgot you forgot it. Do NOT say "the forgotten fact" or "recover X" (that tells Claude it exists):
      - *"where does our staging run again?"*
      - *"remind me what we landed on for staging."*
      **PASS (live):** Claude says it has no record / doesn't know — it does NOT surface the forgotten value (no "Fly.io"), and it does NOT secretly recover it via `mk_get`. **FAIL (live):** Claude names the forgotten fact, OR runs any tool that returns the tombstoned body — that's a D-163 violation (the agent resurfaced a fact you deleted), a hard blocker. _Behavioral directive (like W1/M2) — the human eyeballs that the forget is honored in recall, not just in the index._
      _(`--yes` is required in v0.1.0; `<id>` must be a **fact** id — see F-3.)_

- [ ] **F-8**
      `cmk trust <id> <high|medium|low>` → changes a fact's trust (and `cmk search` reflects it without a manual reindex).
      The free-speech path ("trust this" / "not important") is **M3**.

- [ ] **F-9**
      `cmk queue review` / `cmk queue conflicts` → walk pending medium-trust extracts / conflicts.

- [ ] **F-10**
      `cmk purge --hard <id>` → the explicit destructive path.
      _v0.1.x stub; expect "not yet implemented" (use `cmk forget` for normal deletion). Not a failure._

**Health & repair**

- [ ] **F-11**
      - `cmk doctor` → HC-1..HC-15 accurate (HC-8 = native bindings / npm-12 readiness, v0.3.1; HC-9 = version-drift, v0.3.4; HC-10 = compaction-liveness, v0.4.1 — SKIP when no cron registered; HC-11 = backend LLM CLI present, v0.4.5 — PASS/FAIL on the effective backend agent's CLI, never silently skipped) + the trailing **Memory health (informational)** line renders
      - `cmk repair --hooks` re-wires if settings drift
      - **`cmk repair --index` → "(index): fixed → reindex completed"** (NOT an error). _v0.3.1: this ran the REAL reindexFull which needs a db; the bug where repair passed no db (since Task 49, masked by every test mocking the reindexer) was found by THIS cut-gate probe — keep it on the real path, no injected reindexer._
      - `cmk repair --all` → all three (hooks/locks/index) report cleanly
      - **`cmk config set <key> <value>` / `get <key>` / `--show-origin <key>`** — REAL as of v0.3.1 (Task 129): `set search.default_mode hybrid` → `get` returns it → `--show-origin` shows the tier. `--local` writes the gitignored tier. _(Was a stub pre-v0.3.1; the "not yet implemented" expectation is GONE.)_

- [ ] **★ F-11b — INDEX drift is DETECTED, and a failed rebuild leaves a TRACE (Task #181 / D-152 / v0.3.1).**
      `INDEX.md` is the committed, human-readable index — a derived view of the fact files that the writer keeps current on every capture. Two guarantees this cut adds:
      - **Detection:** delete a line from `context\memory\INDEX.md` (simulate drift), then `cmk doctor` → **HC-4 FAILS** with `recoveryCommand: cmk reindex`; run `cmk reindex` → HC-4 back to PASS.
      - **Observability:** a rebuild that *fails* (vs. the happy path) now records an `index-rebuild-failed` audit entry instead of being silently swallowed — so a committed INDEX that fell behind is diagnosable, not invisible.
      ```powershell
      # Detection half (deterministic): break the INDEX, confirm HC-4 catches it, reindex heals it.
      cmk doctor | Select-String "HC-4"           # PASS first
      # (hand-remove a fact line from context\memory\INDEX.md)
      cmk doctor | Select-String "HC-4"           # now FAIL → "cmk reindex"
      cmk reindex; cmk doctor | Select-String "HC-4"   # PASS again
      ```
      **PASS:** HC-4 fails on the broken INDEX and recovers after `cmk reindex`; the fact FILES were never at risk (INDEX is derived). _(Pre-v0.3.1 a hook-killed rebuild could leave a stale committed INDEX with ZERO trace — the cut-gate finding.)_

- [ ] **★ VD1 — HC-9 detects a project scaffold behind the installed `cmk` (Task 162 / D-176 — new in v0.3.4).**
      After an update, a project's version-stamped scaffold (the CLAUDE.md `:start vX` block) lags until `cmk install` re-runs there. HC-9 is the kit telling the user. In `C:\Temp\cut-gate23`:
      ```powershell
      cmk doctor | Select-String "HC-9"            # PASS first (fresh install — marker matches the binary)
      # Simulate drift: downgrade the CLAUDE.md marker to an older version
      (Get-Content CLAUDE.md) -replace 'core-memory-kit:start v[0-9.]+','core-memory-kit:start v0.0.1' | Set-Content CLAUDE.md
      cmk doctor | Select-String "HC-9"            # now FAIL → message names v0.0.1 + the binary version
      cmk install                                  # re-stamp → marker back to current
      cmk doctor | Select-String "HC-9"            # PASS again
      ```
      **PASS:** HC-9 is `[PASS]` on the fresh install, `[FAIL]` with `→ repair: cmk install` (message names the stale v0.0.1 + the installed version) after the downgrade, and `[PASS]` again after `cmk install` re-stamps. **FAIL:** HC-9 stays pass on the downgraded marker (drift undetected) or doesn't recover after re-install. _(This is the "you forgot to re-run install in this project after updating" guard — the easily-missed per-project step.)_

**Native coexistence & import**

- [ ] **F-12**
      `cmk disable-native-memory` → writes committable `autoMemoryEnabled:false` (doctor HC-6 reflects it);
      `cmk enable-native-memory` reverses.

- [ ] **F-13**
      `cmk import-anthropic-memory` → imports existing native Auto Memory files into the kit schema.

**MCP + transcripts**

- [ ] **F-14**
      `cmk mcp serve` → stdio MCP server starts (Ctrl-C to stop);
      `mk_remember`/`mk_get`/`mk_search` respond (and report `queued` correctly, not a false `accepted`).

- [ ] **F-15**
      `cmk transcripts extract` (**no path arg**) → pulls durable facts out of your captured Claude session transcripts.
      _Heads-up: with no arg it scans your **whole** `~\.claude\projects` history (can be thousands of sessions / many MB written to `transcripts-extracted\`). Run it where you're OK with that, or skip — it's not a ★._

- [ ] **F-16 — transcript temp is gitignored (Task 115 — since v0.2.3).**
      The auto-extract write buffer (`.extract-*.tmp`) is created-then-deleted, so `git status` usually shows nothing **whether or not** the ignore works — test the rule **deterministically**:
      ```powershell
      New-Item -Force context\transcripts\.extract-test.tmp | Out-Null
      git check-ignore context\transcripts\.extract-test.tmp   # PASS = echoes the path (ignored)
      Remove-Item context\transcripts\.extract-test.tmp
      ```
      A partial buffer can never travel with `git clone`.

**The L2 ladder + lifecycle (added 2026-06-11 — these four verbs had NO check in any prior cut; surfaced by the same completeness audit that built `validate-doc-completeness.mjs`)**

- [ ] **F-17 — L2 drill-down: `get` / `timeline` / `cite` (Tasks 101/103 — the cited-recall rung).**
      Take a real fact id from `cmk search "memory" --limit 1` (the `P-…` token), then:
      ```powershell
      cmk get <id>                 # full fact: body + Why/How + provenance
      cmk timeline <id>            # the fact's history chain (creates/updates/supersedes)
      cmk cite <id>                # the citation block Claude pastes into answers
      ```
      **PASS:** all three resolve the id; `timeline` shows at least the creation event; `cite` output names the source file.

- [ ] **F-18 — `recent-activity` (the what-just-happened surface).**
      `cmk recent-activity --window 24h --limit 5` → the facts touched in this run (the B-probes you just wrote) come back newest-first.
      **PASS:** non-empty, items recognizable from this session.

- [ ] **F-19 — `uninstall` is clean + `init-user-tier` re-seeds (lifecycle, in the throwaway dir ONLY).**
      In `C:\Temp\cut-gate23` (NEVER a real project):
      ```powershell
      cmk uninstall                # removes hooks + the CLAUDE.md managed block; context/ stays (your data)
      git status                   # nothing unexpected staged; CLAUDE.md outside the markers byte-preserved
      cmk install                  # reinstalls clean over the surviving context/
      cmk init-user-tier           # idempotent on an existing user tier (no overwrite of USER.md content)
      ```
      **PASS:** uninstall removes ONLY the managed surface; reinstall + init-user-tier are idempotent (no data loss, no duplicate blocks).

---

## 8. Lighter scenarios  (~10 min)

- [ ] **L1 — plugin route (route B).**
      In a *second* empty folder, inside Claude Code:
      `/plugin marketplace add LH8PPL/core-memory-kit`
      → `/plugin install core-memory-kit`
      → `/core-memory-kit:bootstrap`
      → `/reload-plugins`.
      Scaffolds `context/`, hooks active.
      (Local variant if the marketplace lags: `claude --plugin-dir <repo>\plugin`.)

- [ ] **L2 — "remember this".**
      Say *"Remember this: the API base URL is `https://api.example.com`."*
      → `cmk search "api.example.com"` finds it.

- [ ] **★ L3 — privacy tag.**
      Say *"`<private>` my license key is ABC-123 `</private>` — now add a README."*
      → `context\MEMORY.md` does **NOT** contain `ABC-123`.

---

## 9. Portability ("another computer")

In `C:\Temp\cut-gate23`: `git add -A; git commit -m "wip"`.
Clone elsewhere (`git clone C:\Temp\cut-gate23 C:\Temp\cut-gate-clone`), open *that* in Claude Code.

- [ ] **★ H1**
      the clone already has the project memory (`context/` is committed — tenet T2).

---

## Verdict + the cut

**Cut if** every **★** passes —
`G1–G4, G2b, G5, G6, G7, R1, R2, M0, M1, M2, W1–W4, B2, B9, B3, B4, B5, B6, B7, C5, C6, FQ1, PR1–PR5, TV1–TV4, MC1, BK1–BK4, D1, D3, E1, F-3, F-11b, L3, H1`.
_(v0.3.2 cut-blockers. **DJ1–DJ3 are NOT cut-blockers this cut** — the `cmk digest`/DECISIONS.md feature is HELD for v0.3.3 until recall-complete (D-164); run the DJ probes to confirm the merged code is sound, but they don't gate the v0.3.2 tag.)_
_(v0.3.2 adds **FQ1** — FTS5 query sanitization (no crash on dots/hyphens/colons) — and **DJ1/DJ2/DJ3** — `cmk digest` + the append-only `DECISIONS.md` journal (renders, append-only/retract-in-place, decisions-only) — to the gate. 141b was rejected on perf (D-162); no storage-layer test.)_
_(v0.3.1's **C5/C6/F-11b** are now standing gates. D3's old "decide if the recall variance is acceptable" clause is GONE — v0.3.0 shipped the Task-75 fix; D3 is a hard gate now.)_
_(v0.4.3 adds **PR1–PR5** (§4d) — the persona-promotion redesign (recurrence-count bump / persona-condenses-not-strands / trust_score column migration / no-arg topic-routing / invisible-Unicode rejection). All five are CLI-deterministic. The LLM-driven layers — the promotion GATE itself (`cmk persona generate` + live Haiku), the spoken MENTION relay, and the `mk_remember` MCP write path — are flagged MANUAL in §0, not gated by PR1–PR5.)_
_(v0.4.4 adds **TV1–TV4 + MC1** (§4e) — temporal validity (Task 66: `--shape` field / `--expires` declared expiry hide-never-delete / weekly-curate expiry sweep / temporal-supersede window-close) + the memory-commit proposal (Task 150, ADR-0018: SessionStart proposes a `context/` commit, runs no git itself). **TV1/TV2/TV3 + MC1 are CLI-deterministic cut-blockers.** **TV4 has a deterministic close-mechanics leg (suite-covered) but its full sweep verdict is a live-Haiku judge** — run `cmk weekly-curate` on THIS repo's real corpus and confirm sensible verdicts with **no false SUPERSEDES**; that live leg + the 66.3 auto-extract expiry SUGGESTION (invents no unstated date) + the MC1 spoken relay are flagged MANUAL in §0.)_
_(v0.4.5 adds **BK1–BK4** (§4f) — the agent-relative backend (Task 200: the automatic engine runs through the agent's own CLI, closing the D-270 silent-no-op) + the split-brain override (Task 201). **BK1 (`cmk doctor` HC-11 present/absent), BK2 (`cmk install --backend` writes the key + fail-fast on a bad value + warns about the effective backend), BK3 (`cmk config show` reflects the override) are CLI-deterministic cut-blockers.** **BK4 — the automatic engine actually compressing through `kiro-cli`/`cursor-agent` — is a live cross-agent MANUAL flag** (needs the 2nd agent's CLI present; live-verified on the dev machine for both, D-278/D-280 — flag honestly if your machine lacks it).)_

**The W1–W4 recall ladder + D3 are the v0.3.0 headline** — the skill fires, paraphrase recall hits, the raw record is reachable, and memory-first answering is a gate. **M0–M2 stay the standing conversational gate** (the v0.2.3 headline); **B9 stays the standing rich-auto-capture gate** (the v0.2.2 headline) — if `context\memory\` has no `write_source: auto-extract` rich file, investigate before shipping.

(B8, D5, D6 are observational — they confirm the new graduation/inject/self-heal behavior when it fires,
but the code is proven by B7/B5 + the suite.)

A clean full sweep (F-1..F-15 + L1–L2) means nothing ships untested.

### ★ Pre-tag gate (do this BEFORE the tag — docs lag the code otherwise)

The tag triggers an **immutable** npm publish; whatever docs are committed at that moment ship forever. Confirm:

- [ ] **★ Doc-drift walk (the ONE rule — CLAUDE.md D-249).** This is the SAME per-change walk the self-review runs, re-confirmed for the whole release: walk the **source-of-truth table** and confirm every LIVING doc the release touched is current — especially the un-validated ones that drift silent (**`design.md`** architecture/schema, **`glossary.md`** new terms, **`memory-lifecycle-map.md`** tier behavior, **`ARCHITECTURE.md`** layer overview). _Precedent (v0.4.3): design.md + glossary + memory-lifecycle-map all shipped stale in the first pass — caught only by interrogation; this walk is what catches them without it._ The rows below are high-frequency members of that walk, called out because a stale one is immutable once tagged:
- [ ] **CHANGELOG consolidated** — `[Unreleased]` folded into `## [X.Y.Z] — <date>`; `[Unreleased]` reset; `print-release-notes.mjs <version>` parses the section; **no "in progress" left in the shipped section** (a shipped feature isn't "in progress").
- [ ] **★ READMEs reflect THIS version** — both the **root `README.md`** (status line + "What it does") **and** the **npm landing `packages/cli/README.md`** describe this version's headline capability + its new commands. _(Lesson from v0.2.0: the tag beat the README refresh, so the immutable npm 0.2.0 page shipped a stale landing page — fixed only by a 0.2.1 patch. The npm landing page is `packages/cli/README.md`, NOT the root one.)_
- [ ] **`packages/cli/package.json` version** = the version you're about to tag.
- [ ] **★ Trigger-fired walk — MINOR cuts (`X.Y.0`) only (D-267; the first step of the D-248 backlog sweep).** Before the sweep gives verdicts, walk **every named trigger** on the open tasks (`grep -n "Trigger" specs/tasks.md` + the `validate-backlog-triggers` inventory) and ask each one's checkable question: **has this condition become TRUE since the last sweep?** A trigger only works if someone checks it — a fired-but-unnoticed trigger is the "when it's ready" rot one level up (precedent: Task 196's Cursor demand-trigger had already fired before anyone noticed conversationally). **Fired → lane it or re-verdict it explicitly** (a fired trigger may never stay silently deferred); **not fired → keep**, refreshing any trigger whose condition has gone stale or unobservable. Record the walk's outcomes with the sweep's verdicts (RELEASE-PLAN + DECISION-LOG). _(Patch cuts skip this with the rest of the sweep.)_

**To publish (your outward action):**

```powershell
git tag v0.3.2
git push origin v0.3.2
```

`publish.yml` runs the suite, publishes `@lh8ppl/core-memory-kit@0.3.2` to npm with provenance,
and creates the GitHub Release from the `[0.3.2]` CHANGELOG section.

**Verify after:**
- `npm view @lh8ppl/core-memory-kit version` → `0.3.2`
- the npm page shows a **provenance** badge
- the GitHub Release matches `## [0.3.2]`

Per-finding notes go in a dated doc under [`../journey/`](../journey/), not here — this stays a clean script.
