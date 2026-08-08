# Architecture

The kit solves one problem: **Claude Code starts each session with no memory of the last one.** Without a system, you re-explain context every time. With it, Claude opens each session having already loaded who you are, what you've been working on, and what the conventions are.

## The six layers

Each layer solves one specific symptom of the amnesia problem. You can install just 1-3 (zero dependencies, file ops only) or add 4-6 as needed.

**In the standard agent-memory taxonomy** (working / semantic / episodic / procedural), the layers map like this: **working** memory = the Layer-3 `MEMORY.md` scratchpad + the `now.md` buffer · **semantic** = the Layer-2 fact archive + `USER.md` · **episodic** = the Layer-4/6 session record (rolling window + transcripts) · **procedural** = the user-tier `HABITS.md`/`LESSONS.md`, the Layer-4.5 judgment records, and the scaffolded skills. See the README's "four memory types" table for the pitfalls each answers.

### Layer 1 — In-repo location

`context/` lives at the project root. Travels with `git clone`. Each project has its own — nothing crosses boundaries. Survives VS Code multi-root workspace setups where a global memory location would get confused about which project is active.

Why not `~/.claude/projects/<slug>/`? Two reasons:

1. **Cross-machine continuity**: a global path is local to one machine. Pushing `context/` to git means a new dev / new laptop is up to speed after `git clone`.
2. **Project-specific signal**: memory tuned for one project pollutes others. Per-project, in-repo enforces the separation.

### Layer 2 — Granular archive

`context/memory/` holds per-fact files: `feedback_*.md`, `project_*.md`, `user_*.md`, `reference_*.md`. Each is small, typed, and carries `**Why:**` + `**How to apply:**` lines so you can judge edge cases later.

`context/memory/INDEX.md` is a flat list of all granular files with one-line descriptions. Loaded at session start so Claude knows what exists; the underlying files are read on demand.

### Layer 3 — Bounded scratchpads

Three small files form the always-loaded snapshot:

| File | Cap | Purpose |
| --- | --- | --- |
| `context/SOUL.md` | ~1.8 KB | Project persona / disposition / norms |
| `context/USER.md` | ~1.4 KB | Stable user identity, preferences, working style |
| `context/MEMORY.md` | ~2.5 KB | Hot working state: active threads, environment notes, pending decisions |

Caps matter. Without them, MEMORY.md balloons over months until it costs more tokens to load than it saves. The weekly curator (Layer 6) keeps it pruned.

The **frozen snapshot pattern**: these files load once per session, form static context, and don't reload mid-session. This preserves Claude's prefix cache. Writes during the session persist to disk and take effect at the *next* session start.

### Layer 4 — Auto-extract + hooks + skill

**Five lifecycle hooks** wire memory in. All are PATH-resolved node bins (`cmk-*`) — no bash, so they run on Windows / macOS / Linux under any shell (the cross-OS pivot, design §5):

| Event | Hook bin | What it does |
| --- | --- | --- |
| **SessionStart** | `cmk-inject-context` | Builds the frozen snapshot (SOUL/USER/MEMORY + the latest day-session) and emits it as `additionalContext`. Also kicks off lazy-on-read compression if the buffer is stale. |
| **UserPromptSubmit** | `cmk-capture-prompt` | Records the user's prompt as extraction context for the turn. |
| **PostToolUse** (`Write\|Edit\|MultiEdit`) | `cmk-observe-edit` (async) | Notes file edits as observation signal. |
| **Stop** | `cmk-capture-turn` | After every turn: appends the transcript **and** detached-spawns auto-extract. |
| **SessionEnd** | `cmk-compress-session` | Rolls the session buffer when the window closes (so memory stays bounded even if you never cleanly close). |
| **PreCompact** | `cmk-precompact` | Rolls the buffer when the context window is about to be compacted — the only roll trigger that fires **during** a long session. Gates cheaply and hands the work to a detached worker, so a compaction never waits on memory. |
| **(nightly cron)** | `cmk-daily-distill` | Compresses the day's sessions — and **backfills days that have commits but no session log**, reconstructing them from git (Task 174). A reconstruction is marked as one; a real log is never overwritten. |

**Auto-extract** (`cmk-auto-extract`, a detached background subagent spawned by the Stop hook — it runs the LLM through the installed agent's own CLI via `makeBackend`: `claude --print` on Claude Code, `kiro-cli chat` on Kiro, `cursor-agent -p` on Cursor, `codex exec` on Codex — Task 200) reads the turn and writes durable memory with no manual flag:

- Durable project **knowledge** (setup/config, conventions, workflows, tool quirks) → a **rich Why/How fact file** (`writeFact` → `context/memory/<type>_<slug>.md`), structured + searchable.
- Lighter signals (corrections, preferences) → terse `MEMORY.md` bullets.
- Cross-project **doctrine** ("how I work everywhere") → promoted to the **user tier** that same turn (see Layer 6 / persona, and "Why per-project" below).

Because it rides the Stop hook (which reads the conversation directly), the rich tier is captured even when the model uses Claude Code's built-in memory instead of the kit's tools.

**The privacy screen (ADR-0019, v0.5.0)** sits directly on this capture path: a deterministic L1 pattern mask (emails/phones/usernames → `«EMAIL»` etc.) at write time, plus an async L3 LLM judge that screens names/sensitive content before anything lands in a *committed* tier — `<private>…</private>` remains the explicit never-persist override. Mechanism: design.md §6.10.

### Layer 4.5 — the learn-loop (v0.5.0–v0.5.3, ADR-0017)

"The kit learns from outcomes" — Phase 1 shipped four organs riding the existing hooks, no new rituals:

| Organ | What it does |
| --- | --- |
| **Recall-log** (`recall-log.mjs`) | Records WHICH memory IDs surfaced each turn (snapshot inject + every search) — the attribution primitive every outcome signal needs to find its target memory. Gitignored diagnostic, IDs only. |
| **Expectations + judgment files** (`expectations.mjs`, `judgment.mjs`) | Pre-registered predictions ("this should make the test pass") resolve into append-only `judgment_*.md` evidence logs — method-preferences are EARNED (provisional → corroborated/contested), never auto-ranked. |
| **The Stop-hook judge** (`judge-signals.mjs`) | Four deterministic outcome detectors per turn (tool-result ±, user-correction −, re-ask −, silent-success weak-+) that emit trust deltas — no LLM self-grading. |
| **The feedback-screen** (`feedback-screen.mjs`) | The loop's own Poison_Guard: rate-limits deltas per fact, burst-holds systemic events (a broken test suite can't tank every fact at once), audits every delta, floors trust at 0.05 (decay never deletes). |

Phase 2 (Task 194, v0.5.3) **closed the loop's edge**: search ranking blends in the earned trust score — confidence-gated (only past 3 applied outcome signals, the `signal_count` counter), facts only (judgments never rank), the injected snapshot untouched by scores. Its curation half: a floored-and-still-failing fact routes to the **prune-review queue** (`cmk queue prune`, never a silent delete), where it can be **converted to a retained `⚠️ AVOID` anti-pattern warning** instead of erased (`prune-queue.mjs`, `anti-pattern.mjs`). Full design: SYSTEM-MAP §6 + ADR-0017 + design §20.7.

**The `memory-write` skill** is the explicit override — it triggers on "remember this" / "from now on" / "forget X" and routes through the same safe write path (dedup, Poison_Guard, cap enforcement, audit), preferring the MCP tools when the server is connected (see below).

**MCP server** (`cmk mcp serve`, registered by `cmk install`): the kit exposes its whole memory surface as `mcp__cmk__*` tools, so Claude drives capture / recall / trust / forget / queue ops **in conversation** without you typing `cmk` — destructive ops (`mk_forget`) are two-step (preview → confirm token). A build-time guard keeps the tools at parity with the CLI verbs.

Why all of it? Each fixes a different reliability gap:

- **Without SessionStart inject**: Claude might not read the snapshot at session start. The hook makes it guaranteed.
- **Without the Stop hook**: facts get lost between turns; the user has to manually flag them.
- **Without auto-extract**: the user still has to say "remember this" every time. Auto-extract harvests proactively.
- **Without the skill / MCP tools**: writes would be ad-hoc, with duplicates and cap overruns. Both enforce structure + the safe path.

### Layer 5 — search

**5a — keyword (shipped).** SQLite + FTS5 over `context/`. `cmk search "<term>"` (and the `mk_search` MCP tool) use this by default; no setup.

**5b — semantic (SHIPPED v0.3.0 via `cmk install --with-semantic`; opt-in).** Hybrid vector + keyword over the same `context/` content: **sqlite-vec** in the existing SQLite DB + a local **bge-base** embedder (ADR-0015 — chosen on measured numbers: R@5 0.941 / paraphrase 1.000 on the Task-99 benchmark, vs 0.176 keyword-only). When enabled, hybrid (keyword ⊕ vector, reciprocal-rank fusion) becomes the default search mode; without the flag the kit stays keyword-only with zero native-model dependencies. _(This paragraph originally recorded the pre-v0.3 "deferred, backend not chosen" state — corrected 2026-07-10 (D-311) when the audit caught it describing a shipped feature as unavailable.)_

Used for **Tier 2 retrieval** — when Tier 0 (snapshot) and Tier 1 (grep INDEX.md) miss, escalate to search.

### Layer 6 — Auto-curation crons

Two scheduled jobs keep the system healthy without manual intervention (registered via `cmk register-crons`; they fall back to lazy-on-read if you skip cron):

| Job | Schedule | What |
| --- | --- | --- |
| Daily memory distillation (`cmk daily-distill`) | 23:00 daily | Extracts durable facts from today's session log into MEMORY.md. |
| Weekly memory curator (`cmk weekly-curate`) | Sun 09:00 | Prunes resolved threads, merges duplicates, drops stale entries. |

Registered via `cmk register-crons`. Translates to crontab entries (Linux), LaunchAgents (macOS), or Task Scheduler tasks (Windows). Idempotent — re-running overwrites existing entries cleanly, which also makes it the repair path when a registration's settings are wrong. On Windows the registration is two steps: the task itself, then the scheduler conditions that decide whether it ever runs (design §8.6.5). See [`packages/cli/src/register-crons.mjs`](packages/cli/src/register-crons.mjs) for the platform mapping.

### Bootstrap import (day-one memory)

`cmk import-sessions` points the acquisition machinery **backward**: existing Claude Code session history is summarized per-session into the same dated day files the live capture writes ("as if captured live"), screened before every committed write, raw-archived to a local-only floor, and indexed for search — so a fresh install starts with a populated memory instead of an empty one. `cmk install` offers it automatically when it detects history. Resumable via a committed ledger; a re-run imports only new sessions. Mechanism: design §22.

## When capture fails

Automatic extraction runs an LLM in the background, and that call can time out or error — most often on a busy machine, which is exactly when a session is producing the most worth remembering. Rather than dropping the turn, a **deterministic no-LLM fallback** keeps the durable statements from your own words, routed through the normal review queue and tagged with its own provenance. Capture degrades to partial, never to nothing. The fallback keeps *mission context only* — it never records the kit's own operational noise into your memory. See design §6.4b.

## Data flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ SESSION START                                                       │
│                                                                     │
│  SessionStart hook fires (cmk-inject-context)                       │
│       │                                                             │
│       ▼                                                             │
│  Reads context/SOUL.md, USER.md, MEMORY.md, INDEX.md,               │
│        sessions/{today}.md                                          │
│       │                                                             │
│       ▼                                                             │
│  Emits as additionalContext → Claude's context window               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ MID-SESSION (every assistant turn)                                  │
│                                                                     │
│  Claude responds                                                    │
│       │                                                             │
│       ▼                                                             │
│  Stop hook fires (cmk-capture-turn):                                │
│       ├─ Step 1: append to context/transcripts/{today}.md           │
│       └─ Step 2: spawn cmk-auto-extract (detached)                  │
│                       │                                             │
│                       ▼                                             │
│         the installed agent's CLI (claude/kiro-cli/cursor-agent/codex)    │
│              with the fact-extraction prompt (makeBackend)          │
│                       │                                             │
│                       ▼                                             │
│                  writeFact / MEMORY.md bullet / user-tier promote   │
│                       │                                             │
│                       ▼                                             │
│                  context/memory/<type>_*.md, MEMORY.md,             │
│                  ~/.core-memory-kit/ (cross-project doctrine)     │
│                  (writes take effect NEXT session — frozen snapshot)│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ASYNCHRONOUS (cron)                                                 │
│                                                                     │
│  23:00 — cmk daily-distill → MEMORY.md updated                      │
│  Sun 09:00 — cmk weekly-curate → MEMORY.md pruned                   │
└─────────────────────────────────────────────────────────────────────┘
```

## When the auto-extract decides something IS durable

Claude (in the sub-process) reads the turn and checks:

1. Did the user explicitly say "remember this", "from now on", "we decided"?
2. Was there a concrete decision worth carrying forward?
3. Did the user correct the assistant on a fact?
4. Did the assistant acknowledge a new environment fact (tool version, path) not already in MEMORY.md?
5. Did the assistant identify a durable rule with `Why:` + `How to apply:`?

If yes → routes to the right file via memory-write. If no → exits silently. Most turns end in "skip: nothing durable" and that's the correct outcome — the system should NOT save everything, only what's worth remembering.

## Why per-project, not global?

A global memory at `~/.claude/memory/` would conflate projects. The fact that you prefer terse responses in your data-science project doesn't mean you want them in your wedding-planning project. Per-project lets each project's persona stay distinct.

But genuine cross-project commonalities (you, the human, prefer X **everywhere**) do belong in one place — so the kit keeps a **third tier**: the user tier at `~/.core-memory-kit/`. When you state how you work everywhere ("I always use pnpm", "run the linter first in every project"), auto-extract promotes it to the user tier *that turn*, and every project's SessionStart snapshot loads it — so a brand-new project cold-opens already knowing your style, with no copy-paste and no per-project re-statement. The split is deliberate: project-specific facts stay in `context/` (committed, travels with the repo); cross-project doctrine lives in the user tier (machine-local, private, **never committed** — carry it across your *own* machines with `cmk persona export`/`import`). Promotion *into* a project's committed memory is the one place explicit still beats implicit — that's `cmk lessons promote`.

## What this is NOT

- **Not a wiki replacement.** Wikis are for curated human-readable knowledge. Memory is for operational state across sessions. They serve different purposes.
- **Not a chat history archive.** Transcripts are captured (Layer 4), but the memory system's value is the *distilled* durable facts, not the raw conversation.
- **Not Claude's official memory feature.** Anthropic may ship something more polished eventually. This is a community-built pattern for the gap that exists today.
