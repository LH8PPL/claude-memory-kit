# Requirements — core-memory-kit v0.1.0

**Status**: Draft for review · **Author**: Claude (Opus 4.7) + the maintainer · **Date**: 2026-05-21

> **Merged 2026-05-31:** T7/T8, US-14/15/16, FR-28/29/30/31, NFR-9, OS-9..13, and OQ-8 are now defined IN THIS FILE. They were approved 2026-05-22 but had lived (unmerged) in `requirements-revisions-proposed.md` for 9 days — a single-source-of-truth gap healed by the documentation-governance restructure. `requirements-revisions-proposed.md` is now a superseded historical record (the original research-driven proposal); this file is the sole authoritative requirements source.

---

## 1. Introduction

### 1.1 The problem

Claude Code starts every session with no memory of the last one. Without a system in place, the user must re-explain context — who they are, what they've been working on, what the project conventions are — at the start of every conversation. Over months, this re-explanation cost becomes significant and demoralizing.

This kit installs a persistent, in-repo memory layer that survives across sessions, machines, and `git clone`s. The user opens Claude Code, makes a request, and Claude already knows the answers to who/what/why without being told.

### 1.2 What v0.0.1 already does (baseline)

- Per-project, in-repo `context/` directory (committed to git).
- Three bounded scratchpads: `SOUL.md` (project persona), `USER.md` (user profile), `MEMORY.md` (working state).
- Granular per-fact archive at `context/memory/<type>_<slug>.md` with `INDEX.md`.
- Two Claude Code hooks: `PreToolUse` (frozen-snapshot injection) and `Stop` (transcript capture + spawn auto-extract).
- `memory-write` skill that auto-triggers on phrases ("remember this", "from now on", "forget about").
- Optional Layer 5b (an embedded semantic backend) for semantic recall — deferred, not yet shipped (design §9.3.1).
- Optional Layer 6 (cron jobs) for daily distill / nightly index / weekly curate.

### 1.3 What v0.1.0 must add

The competitive landscape (see [docs/SOURCES.md](../docs/SOURCES.md)) shows two systems with patterns worth folding in:

- **claude-mem** (thedotmack/claude-mem, 77k stars): six lifecycle hooks, AI-compressed observations, citation IDs, MCP server, web viewer, `<private>` tags.
- **claude-remember** (Digital-Process-Tools/claude-remember): rolling-window compression hierarchy (`now → today → recent → archive`).

v0.1.0 absorbs the patterns from both that are compatible with our markdown-first, in-repo design — and **adds a cross-project user tier** that v0.0.1 lacks entirely.

### 1.4 Design tenets (non-negotiable)

These constrain every decision below. If a requirement violates a tenet, the tenet wins.

| Tenet | Why |
| --- | --- |
| **T1**: Markdown is the source of truth. Everything else (SQLite, vector indexes) is regenerable cache. | A user must be able to open `MEMORY.md` in VS Code, edit a typo, and have the system respect it. Opaque storage breaks this. |
| **T2**: Per-project memory lives in `<repo>/context/` and is committed to git. | Memory must travel with `git clone`. A new dev / new laptop is up-to-speed after one clone, no export/import. |
| **T3**: Cross-project user-tier memory lives in `~/.core-memory-kit/` and is global. | Some facts (your name, your role, your habits) are about *you*, not any one project. Forcing them into every project is silly. |
| **T4**: Capture is mostly automatic. User-explicit triggers ("remember this") still work but are not required for the system to be useful. | The third strike on "make it automatic" — The user has been clear this is a hard requirement. |
| **T5**: Silent by default. No "I've saved that to memory" announcements unless the user explicitly asked. | Auto-capture should be invisible. Announcing breaks the illusion. |
| **T6**: Claude Code first. Other agents (Codex, Gemini, Hermes, Copilot) are explicitly out of scope for v0.1.0. | Don't try to be claude-mem's cross-agent surface. We can revisit in v0.2 if it matters. |
| **T7**: Raw evidentiary archive is preserved indefinitely. Compressed summaries are derivative and lossy; the source transcripts are authoritative. | True Memory (arXiv) argues "extraction at ingest is the wrong primitive." Our rolling-window pattern keeps raw `transcripts/` AND compressed summaries: the compressed layer is searchable cache, the raw layer is the audit trail. |
| **T8**: Every observation carries provenance. Source file, source line, source SHA, write source (user-explicit / auto-extracted / compressed-from-summary), and trust level are required frontmatter, not optional. | Graphiti's episodes, Nautilus Compass's Merkle log, and MemLineage all point to provenance becoming an architectural requirement. Our citation IDs give a unique anchor; provenance fields make each observation auditable. |

---

## 2. User stories

Format: `As a <role>, I want <capability>, so that <value>`. Each story has functional requirements (FR-*) attached in Section 3.

### US-1 — Cross-session continuity for project context

> As a developer working on a project across multiple Claude Code sessions, I want Claude to know the current project's state at the start of every session — what we've been working on, what tools we use, what's still open — so that I don't have to re-explain the project's context every time I open Claude Code.

Maps to: FR-1, FR-2, FR-3, FR-7, FR-12.

### US-2 — Cross-project continuity for user identity

> As a developer who is the same person across multiple projects, I want my universal identity (name, role, preferences, working style) to be known to Claude regardless of which project I'm in — so that I don't have to repeat "I'm the user, I prefer terse responses, I work on Windows" in every project's USER.md.

Maps to: FR-4, FR-7, FR-13.

### US-3 — Project-specific overrides of global facts

> As a developer whose projects sometimes have project-specific conventions that override my global preferences, I want the project tier to override the user tier when they conflict — so that working in a Rust-shop project doesn't bring along my global "I prefer Python" preference.

Maps to: FR-7, FR-13.

### US-4 — Machine-specific overrides without committing them

> As a developer working on the same project from multiple machines, I want machine-specific paths and overrides (where Tesseract is installed, which Python version is active) to NOT be committed to git but to still load automatically — so that my work laptop's paths don't conflict with my desktop's paths.

Maps to: FR-5, FR-7.

### US-5 — Automatic capture of durable facts without manual flagging

> As a developer who corrects Claude or makes a decision mid-conversation, I want those corrections and decisions to be saved automatically — so that I don't have to remind Claude to "save this to memory" every time something important happens.

Maps to: FR-8, FR-9, FR-14.

### US-6 — Manual capture when I do want to flag something

> As a developer who occasionally wants to explicitly mark something as worth remembering, I want a phrase trigger ("remember this", "from now on", "forget about") that saves silently with the right structure — so that I can override the auto-capture when I want to.

Maps to: FR-10, FR-11.

### US-7 — Sensitive content exclusion

> As a developer who sometimes works with secrets, tokens, or private information, I want a way to mark content as no-capture (`<private>` tags) — so that sensitive content doesn't end up in committed memory files.

Maps to: FR-15.

### US-8 — Force-retain critical content

> As a developer who knows something is durable but the auto-extractor might miss it, I want a way to mark content as force-retain (`<retain>` tags) — so that critical facts don't get filtered out by the conservative auto-extractor.

Maps to: FR-16.

### US-9 — Traceability via citation IDs

> As a developer reviewing what Claude knows, I want every memory entry to have a stable ID so Claude can cite "see fact M-1042" when reasoning — so that I can audit where Claude's claims come from.

Maps to: FR-17.

### US-10 — Fast search across all memory

> As a developer with months of accumulated memory, I want fast keyword search AND semantic search across project memory, user memory, sessions, and transcripts — so that I can find a half-remembered fact in seconds without scrolling.

Maps to: FR-18, FR-19, FR-20.

### US-11 — Auto-curation to keep scratchpads clean

> As a developer who accumulates memory over time, I want a rolling-window compression hierarchy (today's session → today summary → this week → archive) that keeps MEMORY.md bounded — so that the scratchpad stays fast to load and doesn't grow unbounded.

Maps to: FR-21, FR-22, FR-23.

### US-12 — Cross-machine setup from a fresh clone

> As a developer setting up a new laptop or onboarding a teammate to my project, I want `git clone` + a single bootstrap command to fully install the memory system on Windows, macOS, or Linux — so that setup is a one-liner regardless of OS.

Maps to: FR-24, FR-25, FR-26.

### US-13 — Survives Claude Code "primary cwd" quirk

> As a developer who sometimes opens projects as added/additional directories in VS Code workspaces, I want the memory system to either (a) work in additional-cwd mode OR (b) give a clear error telling me to reopen as primary — so that I'm not silently running with broken hooks.

Maps to: FR-25.

### US-14 — Raw evidence preservation

> As a developer who needs to verify a memory entry months later, I want the raw transcript that produced the observation to remain searchable and intact, even after it has been summarized into the rolling-window archive — so that I can audit "is this auto-extract correct?" against the original conversation.

Maps to: T7, FR-19, FR-28.

### US-15 — Observation provenance audit

> As a developer reviewing what Claude knows, I want every memory bullet to record (a) where it came from (file:line), (b) who wrote it (user vs auto-extract vs compressor), and (c) when — so that I can distinguish "user explicitly said this" from "model summarized this from a long conversation."

Maps to: T8, FR-29.

### US-16 — AI-side position consistency

> As a developer who has long technical discussions with Claude across many sessions, I want Claude to remember the positions IT took ("X is the right approach", "doing Y is a mistake") and to notice when a new session is about to contradict an earlier stated position — so that Claude stays consistent with its own advice, and when it does change its mind it says so explicitly and explains why, instead of silently flip-flopping.

Maps to: T7, T8, FR-29, FR-31. _(Phase 3 — the v0.2 heart; see [`tasks.md`](tasks.md) Tasks 57–59.)_

---

## 3. Functional requirements

Format: each FR is **testable**. Acceptance criteria use EARS-style: "When [trigger], the system shall [behavior]."

### 3.1 Storage and structure

**FR-1 — Project tier directory layout**
The kit shall scaffold the following directory structure into a target project on bootstrap, never overwriting existing files:

```text
<repo>/context/
├── SOUL.md           (≤ 1,800 chars)
├── MEMORY.md         (≤ 2,500 chars)
├── memory/
│   ├── INDEX.md
│   └── <type>_<slug>.md  (per-fact, no size cap)
├── sessions/
│   ├── now.md        (current session, replaced each session)
│   ├── today-{YYYY-MM-DD}.md   (Haiku-compressed daily summary)
│   ├── recent.md     (rolling 7-day consolidation, replaced)
│   └── archive.md    (older history, append-only)
└── transcripts/{YYYY-MM-DD}.md  (verbatim capture, append-only)
```

Acceptance: When bootstrap runs in a project with no `context/` directory, the system shall create the structure above. When bootstrap runs in a project with an existing `context/`, the system shall skip every existing file and create only missing ones.

**FR-2 — Project tier is committed to git**
The `<repo>/context/` directory shall be designed to live inside the project repo. The kit shall NOT add `context/` to `.gitignore`.

Acceptance: When the user runs `git status` after bootstrap, all `context/` files shall be untracked (ready to commit).

**FR-3 — Bounded scratchpads enforce caps at write time**
The `memory-write` skill shall enforce the documented char caps on `SOUL.md` (1,800), `USER.md` (1,375), `MEMORY.md` (2,500) at write time. When a write would exceed the cap, the skill shall consolidate existing entries first.

Acceptance: When the skill is invoked to add content to a file already at 95% of cap, the skill shall consolidate (merge similar bullets, drop stale entries older than 14 days with no current reference) BEFORE writing the new content.

**FR-4 — User tier directory layout**
The kit shall support a global user tier at `~/.core-memory-kit/` (Windows: `%USERPROFILE%\.core-memory-kit\`) with this layout:

```text
~/.core-memory-kit/
├── USER.md           (≤ 1,375 chars, global user identity)
├── HABITS.md         (≤ 1,800 chars, cross-project working style)
└── fragments/
    ├── INDEX.md
    └── <type>_<slug>.md
```

Acceptance: When the user runs `core-memory-kit init-user`, the system shall create `~/.core-memory-kit/` with the layout above. When the directory already exists, the command shall be a no-op for existing files.

**FR-5 — Local tier directory layout**
The kit shall support a per-project + per-machine local tier at `<repo>/context.local/`, automatically added to `.gitignore`:

```text
<repo>/context.local/
├── machine-paths.md   (≤ 1,000 chars, absolute paths for this machine)
└── overrides.md       (≤ 1,000 chars, machine-specific overrides)
```

Acceptance: When bootstrap runs, the system shall create `<repo>/context.local/` AND add `context.local/` to `<repo>/.gitignore` if not already present.

**FR-6 — Markdown is the source of truth**
All durable storage shall be human-readable markdown files. The system shall NOT use SQLite, vector DBs, or other opaque formats as the source of truth. (Indexes and caches built FROM markdown are allowed; see FR-18.)

Acceptance: When the user opens any memory file in a text editor and makes a manual edit, the system shall preserve that edit on the next session (no auto-overwrite that loses manual edits).

### 3.2 Snapshot injection (session start)

**FR-7 — Three-tier frozen snapshot injection**
At session start, the system shall inject memory in this priority order via the SessionStart hook (with PreToolUse as a fallback):

1. **Local tier** (highest priority — overrides everything): `<repo>/context.local/*.md`
2. **Project tier** (middle priority): `<repo>/context/SOUL.md`, `MEMORY.md`, `memory/INDEX.md`, latest `sessions/today-*.md`, `sessions/now.md` (if any)
3. **User tier** (lowest priority — defaults): `~/.core-memory-kit/USER.md`, `HABITS.md`, `fragments/INDEX.md`

When the same key/topic conflicts between tiers, higher-priority tier wins. Total injection budget: ≤ 10 KB to preserve prefix-cache.

Acceptance: When a session starts in a project that has bootstrapped all three tiers, Claude shall report (when asked) facts from all three tiers in its known-context. When a fact is in BOTH project tier and user tier with different values, Claude shall use the project tier value.

**FR-8 — Snapshot fires once per session**
The SessionStart hook shall fire exactly once per Claude Code session. Subsequent tool calls in the same session shall NOT re-inject the snapshot. A `/tmp/cmk-{project-slug}-session-{sid}` flag file shall guard re-firing.

Acceptance: When a session has 50 tool calls, the SessionStart hook shall have produced log output exactly once.

### 3.3 Hook coverage

**FR-9 — Six lifecycle hooks**
The kit shall register the following Claude Code hooks:

| Hook | Purpose |
| --- | --- |
| SessionStart | Inject the three-tier frozen snapshot (FR-7) |
| UserPromptSubmit | Capture the user's prompt to `transcripts/{today}.md` and tag intent (question / decision / correction) |
| PreToolUse | (Fallback for FR-7 if SessionStart didn't fire) |
| PostToolUse | If tool output > 50 lines, append summary to `sessions/now.md` |
| Stop | Append turn to `transcripts/{today}.md` + spawn auto-extract |
| SessionEnd | Compress `sessions/now.md` → `sessions/today-{date}.md` via Haiku |

Acceptance: When the user runs a session with at least one tool call, the system shall produce log entries from every hook except SessionEnd (which only fires on session close).

**FR-10 — Auto-extract on Stop**
The Stop hook shall spawn `auto-extract-memory.sh` in the background. The script shall invoke `claude --print` with a focused fact-extraction prompt that decides whether the turn contains anything durable. If yes, the script shall use the `memory-write` skill to save it.

Acceptance: When a turn contains the phrase "let's standardize on Python 3.13," the auto-extract shall save a corresponding bullet to MEMORY.md within 60s. When a turn contains only conversational chatter, the auto-extract shall log "skip: nothing durable" and write nothing.

**FR-11 — User-explicit memory-write skill**
The kit shall ship a `memory-write` skill that auto-triggers on phrases: "remember this", "remember that", "note this", "note that", "save this", "save that", "update memory", "forget about", "from now on", "going forward", "i prefer", "we decided", "we agreed".

Acceptance: When the user says "remember that we use uv, not pip," the skill shall save a corresponding bullet to MEMORY.md within the same turn (synchronous, not background).

### 3.4 Tags

**FR-12 — `<private>` tag exclusion**
Content wrapped in `<private>...</private>` tags in any user prompt or assistant turn shall NOT be captured to any memory file (sessions, transcripts, MEMORY.md, etc.). The tags themselves and their contents shall be stripped before any write.

Acceptance: When the user types `<private>my API key is sk-abc</private>` in a prompt, the resulting `transcripts/{today}.md` shall contain neither the tag nor "sk-abc" — instead, a placeholder `[private content redacted]` shall appear.

**FR-13 — `<retain>` tag force-keep**
Content wrapped in `<retain>...</retain>` tags shall be force-saved to MEMORY.md regardless of the auto-extractor's heuristics, even if the content wouldn't otherwise pass the "durable fact" filter.

Acceptance: When the user types `<retain>random note: blue cabinet</retain>`, the corresponding bullet shall appear in MEMORY.md after the turn even though "blue cabinet" doesn't match any durable-fact pattern.

### 3.5 Citation IDs

**FR-14 — Stable observation IDs**
Every captured fact (in MEMORY.md, USER.md, granular files, today summaries) shall carry a stable observation ID of the form `M-{6-char-base32}` (e.g., `M-7K2X9Q`). IDs shall be generated once at write time and never change.

Acceptance: When a bullet `- (M-7K2X9Q) milvus pinned at v2.6.16` exists in MEMORY.md and the file is curated (e.g., weekly curator merges nearby bullets), the merged bullet shall preserve the original ID. When two facts are merged, both IDs shall be preserved in the merged bullet.

**FR-15 — Claude can cite observation IDs**
When Claude references a memory fact in its response, it shall be able to cite the observation ID (e.g., "per M-7K2X9Q, we're on v2.6.16"). The system shall expose a `get-observation` tool (via MCP, FR-29) that returns the full text and source file for a given ID.

Acceptance: When Claude says "per M-7K2X9Q, we're on v2.6.16" and the user invokes `get-observation M-7K2X9Q`, the tool shall return the bullet text, file path, and line number.

### 3.6 Search

**FR-16 — Two-mode search interface**
The kit shall expose a unified search command `cmk search "query"` that runs:

1. **Keyword search** (FTS5 over a regenerable SQLite index built from markdown).
2. **Semantic search** (the Layer-5b embedded vector backend over the same content — not yet shipped; the backend choice is deferred per design §9.3.1).

Results from both modes shall be merged with a configurable weighting (default 0.5 keyword, 0.5 semantic).

Acceptance: When the user runs `cmk search "milvus version"`, the system shall return relevant bullets from MEMORY.md (and other files) regardless of whether the query exactly matches the bullet text. Both keyword and semantic hits shall appear in the results.

**FR-17 — Search index is regenerable**
The SQLite index shall live at `<repo>/context/.index/memory.db` and shall be in `.gitignore`. The kit shall ship `cmk reindex` that rebuilds the index from markdown in O(n) over file count.

Acceptance: When the user deletes `context/.index/`, running `cmk reindex` shall rebuild it in under 5 seconds for ≤ 1,000 markdown files. When markdown content changes, `cmk reindex` shall detect changed files via hash and only re-index those.

**FR-18 — Semantic search is optional**
The kit shall function without semantic search (Layer 5b). When the semantic backend is unavailable (it is not yet shipped), `cmk search` in the default keyword mode shall return only keyword results and shall NOT error; `--mode=semantic` / `--mode=hybrid` shall return a clear "not yet shipped" error (exit 2).

Acceptance: When the semantic backend is unavailable, `cmk search "foo"` (default keyword mode) shall still return FTS5 results from the SQLite index.

### 3.7 Compression and curation

**FR-19 — Rolling-window compression**
A scheduled job (cron / Task Scheduler) shall implement a four-layer rolling-window compression:

1. `sessions/now.md` — current session, appended live by hooks.
2. `sessions/today-{date}.md` — at SessionEnd, Haiku compresses `now.md` into a daily summary, then truncates `now.md`.
3. `sessions/recent.md` — daily cron consolidates the last 7 `today-*.md` into a rolling 7-day view.
4. `sessions/archive.md` — weekly cron moves `today-*.md` older than 7 days into the archive (append-only).

Acceptance: When 8 days have passed since bootstrap, `sessions/today-*.md` shall contain ≤ 7 files. Older entries shall appear in `archive.md`. `recent.md` shall summarize all 7.

**FR-20 — Compression uses Haiku for cost**
Compression operations (today summary, recent rollup) shall use `claude-haiku-4-5` via `claude --print --model haiku` for cost efficiency. The compression prompt shall enforce structure: section headings preserved, bullets de-duplicated, citations retained.

Acceptance: When `sessions/now.md` is 5 KB and gets compressed to `today-{date}.md`, the resulting file shall be ≤ 1 KB AND shall preserve all observation IDs that appeared in the source.

**FR-21 — Curator preserves citations**
The weekly curator (FR-19) shall NEVER drop or change observation IDs. When merging bullets, both IDs shall be preserved (e.g., `- (M-7K2X9Q, M-3L8N1P) milvus pinned at v2.6.16 (woodpecker WAL needs manual flush)`).

Acceptance: When the curator merges two bullets with IDs M-A and M-B, the merged bullet shall contain both IDs in the format above.

### 3.8 Setup and portability

> **Superseded 2026-06-08 (decision-trail):** FR-22/FR-23 originally specified `install.sh` + `install.ps1` shell installers. Those were early-architecture artifacts, **retired** in favor of the single Node-based `cmk install` (the `npx`/`npm` path below), which scaffolds + wires hooks + registers the MCP server cross-OS (CI-verified). The shell scripts + per-OS `INSTALL-*.md` guides were deleted; see [ADR-0005](../docs/adr/0005-three-install-paths.md) (Status: Superseded). The original FR text is preserved below for the paper trail; the **live** requirement is the `cmk install` line only.

**FR-22 — One-command bootstrap on each OS**
The kit shall provide:

- ~~`install.sh` (Bash, works on macOS / Linux / Git Bash on Windows).~~ _(retired 2026-06-08)_
- ~~`install.ps1` (PowerShell, native Windows).~~ _(retired 2026-06-08)_
- `cmk install` (Node-based universal installer; `npm install -g @lh8ppl/core-memory-kit` then `cmk install`) — **the sole installer**.

Each shall scaffold the project tier into the current directory.

Acceptance: When the user runs `bash install.sh` from a project root, the system shall complete bootstrap in under 10 seconds with zero errors on a machine where prerequisites are met.

**FR-23 — Dependency check at install time**
The installers shall check for prerequisites (Node ≥ 18, Python ≥ 3.10, optionally Docker) and report clearly what's missing. The check shall NOT install missing prerequisites silently — The user must approve each install.

Acceptance: When `install.sh` runs on a machine without Node, the script shall print `"ERROR: Node >= 18 required, install via <OS-specific command>"` and exit non-zero.

**FR-24 — Cross-OS test matrix**
The kit shall ship CI configuration that runs install + smoke test on Windows, macOS, Linux for every PR.

Acceptance: When a PR is opened, GitHub Actions shall run the install script on all three OSes and verify a `cmk health` command passes.

### 3.9 Claude Code primary-cwd handling

**FR-25 — Detect non-primary cwd and warn**
When the kit is loaded as a non-primary working directory in Claude Code, the bootstrap shall NOT silently fail. Either:

1. The hooks shall fire from the additional cwd (preferred — if Claude Code supports it by v0.1.0 release date).
2. A startup check shall detect non-primary and print a clear warning to the session: "core-memory-kit hooks won't fire when this project is loaded as an additional cwd. Reopen as primary."

Acceptance: When a user opens project A as primary and project B (with the kit installed) as additional in a VS Code workspace, project B's `context/sessions/now.md` shall either receive captures OR Claude shall emit a warning in its first response that the hooks aren't firing.

### 3.10 MCP server (optional)

**FR-26 — MCP server exposes memory as tools**
The kit shall include an optional MCP server exposing these tools:

- `search-memory(query, mode=keyword|semantic|hybrid, top_k=5)` — search across all tiers.
- `get-observation(id)` — retrieve full text + source for a citation ID.
- `list-pending-decisions()` — return MEMORY.md "Pending Decisions" section.
- `list-active-threads()` — return MEMORY.md "Active Threads" section.
- `get-soul()` — return SOUL.md.
- `recent-sessions(n=5)` — return last N today-*.md summaries.

Server is opt-in; bootstrap shall NOT enable it by default.

Acceptance: When the user enables the MCP server and invokes `search-memory("milvus")` via MCP, the tool shall return relevant memory entries with their observation IDs.

### 3.11 Web viewer (optional)

**FR-27 — Lightweight static markdown viewer**
The kit shall ship `cmk view` that starts a local static HTTP server (default port 37778, avoiding claude-mem's 37777) rendering all of `context/` and `~/.core-memory-kit/` as a navigable markdown wiki. No JavaScript required; pure server-rendered HTML.

Acceptance: When the user runs `cmk view`, a browser at `http://localhost:37778` shall display a directory listing and clicking any `.md` file shall render its content with syntax highlighting.

### 3.12 Raw retention, provenance & trust-aware search

**FR-28 — Raw transcripts are append-only, never compressed away**
The kit shall preserve `context/transcripts/{YYYY-MM-DD}.md` files **indefinitely** unless the user explicitly deletes them. Compressed summaries (`today-*.md`, `recent.md`, `archive.md`) are derivatives; they do not replace the source transcripts. A future `cmk transcripts gc --before <date>` command may allow age-based deletion, but `cmk` itself shall never delete transcripts automatically.

Acceptance: When 6 months have passed since a transcript was created, the file shall still exist in `context/transcripts/`. Compressed summaries shall reference back to the source transcripts they were derived from via the citation IDs in their frontmatter.

**FR-29 — Observation provenance frontmatter**
Every memory bullet (in `MEMORY.md`, `USER.md`, granular `memory/<type>_*.md` files) shall carry frontmatter or inline metadata with these required fields: `id` (citation ID, FR-14), `source_file`, `source_line`, `source_sha1`, `write_source` (`user-explicit` | `auto-extract` | `compressor` | `manual-edit`), `trust` (`high` | `medium` | `low`), and `created_at`. `write_source: user-explicit` is high trust; `auto-extract` is medium; `compressor` is medium-low; `manual-edit` is high (user hand-edited the markdown directly).

Acceptance: When `cmk get-observation <id>` is invoked, the response shall include all six provenance fields. When the source file is modified after capture, `source_sha1` allows detection that the original context has drifted.

**FR-30 — Trust-aware search**
Search results from `cmk search` and the MCP `mk_search` tool shall include trust level in the returned metadata. Future versions may weight scoring by trust; v0.1 reports trust but does not weight.

Acceptance: When the user runs `cmk search "milvus"`, each returned hit shall include `trust:` alongside the bullet text and citation ID.

### 3.13 AI-side position consistency (Phase 3 — reserved)

**FR-31 — AI-side position capture, recall, and reconciliation** _(reserved for Phase 3; full acceptance criteria land when Phase 3 starts — see [`tasks.md`](tasks.md) Tasks 57–59 and the proposed user story US-16)_

The kit shall treat Claude's own stated positions as first-class, contradiction-checkable memory:

- **Capture** — durable positions Claude states ("I recommend X", "X is a mistake", "don't Y") are persisted as `type: decision` fact files (project tier, `write_source: auto-extract` → trust medium, with source-transcript citation + timestamp). `<private>` stripped at capture (NFR-6).
- **Recall** — recent decision-facts are injected at SessionStart as a compact "recent decisions" digest, within the snapshot budget (NFR-2), so a fresh session has Claude's current positions in context.
- **Reconcile** — when a new position contradicts an existing decision-fact, the change is recorded as temporal supersession (old validity window closed, new opened, `superseded_by` linked) rather than silently overwritten; the digest surfaces the current position AND flags the reversal, citing the raw transcript (per T7: the raw transcript is authoritative, the decision-fact derivative).

_This is the only Phase-3 requirement reserved ahead of its detailed spec._

---

## 4. Non-functional requirements

### NFR-1 — Performance budgets

EARS-form (per Kiro spec convergence: more precise + testable than v0.0.1 prose):

- **WHEN** the SessionStart hook fires, **THE** Memory_System **SHALL** assemble and inject the Context_Payload (≤ 10 KB) **within 500 ms** for projects with up to 1,000 fact files.
- **WHEN** the Stop hook fires, **THE** Memory_System **SHALL** spawn the detached auto-extract subprocess **within 50 ms** (the extract itself may take seconds, but the hook must not block).
- **WHEN** `cmk search` is invoked in keyword mode, **THE** Memory_System **SHALL** return results **within 100 ms** for corpora up to 10,000 observations.
- **WHEN** `cmk search` is invoked in semantic or hybrid mode (Layer 5 installed), **THE** Memory_System **SHALL** return results **within 1,000 ms** for the same corpora.
- **WHEN** the user runs `bash install.sh` on a machine where prereqs are met, **THE** installer **SHALL** complete scaffolding **within 10 seconds**.
- **WHEN** the `cmk reindex --boot` command runs, **THE** Memory_System **SHALL** complete the full rebuild **within 30 seconds** for corpora up to 1,000 fact files.
- **WHEN** the `mk_get`, `mk_search`, `mk_recent_activity`, or `mk_cite` MCP tools are invoked, **THE** MCP server **SHALL** respond **within 200 ms** for corpora up to 10,000 observations.

Cumulative budget for session start (snapshot injection + cold filesystem reads + cache validation): **< 500 ms p95**.

#### Scope clarification (2026-05-26 amendment, per live-test scenario 7)

The 500 ms budget on the SessionStart bullet — and equivalent budgets on other hook entries — applies to **the kit's in-process work**: `injectContext()` for SessionStart, `capturePrompt()` for UserPromptSubmit, `captureTurn()` for Stop, `observeEdit()` for PostToolUse. Measured at the module's public boundary, from invocation to return.

**Bash + node + module-loading cold-start is hosting overhead OUTSIDE this budget.** Live-test scenario 7 (see [`docs/journey/2026-05-26-live-test-findings-scenarios-3-7.md`](../docs/journey/2026-05-26-live-test-findings-scenarios-3-7.md)) measured ~1480 ms of hosting overhead on Windows for the SessionStart hook — variable bash startup (~50-200 ms) + node cold-start (~100-300 ms) + ES-module import-resolution (~50-200 ms) + JSON serialization. None of that is kit code; the kit's `injectContext()` consistently completes under 500 ms (pinned by unit test `completes within the 500ms NFR-1 budget on a small fixture`).

The **30-second hook timeout** (design §5.1) is the production-tolerance envelope that absorbs hosting overhead. NFR-1's 500 ms applies to the kit's contract; the 30 s applies to the operating envelope.

**NFR-2 — Token budget for snapshot**
The three-tier snapshot shall total ≤ 10 KB injected at session start. This is roughly 2,500 tokens — small enough to preserve prefix-cache, large enough to carry meaningful context.

**NFR-3 — OS support**
First-class: Windows 10/11, macOS 14+, Ubuntu 22.04+. Best-effort: other Linux distros, WSL.

**NFR-4 — Storage growth**
After 90 days of daily use, total `context/` size shall remain under 50 MB (excluding `transcripts/`, which can be large). The rolling-window compression (FR-19) enforces this.

### NFR-5 — No silent network calls

The kit shall NOT make any network calls except those explicitly initiated by:

1. `claude --print` invocations (which hit Anthropic's API).

(The deferred Layer-5b semantic backend will embed locally — no network — when it ships; design §9.3.1.)

All other operations shall be local-only.

### NFR-6 — Security

- `<private>` tag content shall NEVER be written to disk.
- `context.local/` shall be in `.gitignore` automatically.
- The MCP server (FR-26) shall bind to `127.0.0.1` only, never 0.0.0.0.
- The web viewer (FR-27) shall bind to `127.0.0.1` only.

**NFR-7 — Backwards compatibility within v0.x**
Within the v0.x series, the kit shall preserve compatibility for files created by an older v0.x — no destructive migrations required between v0.1 and v0.2. (A migration script may be PROVIDED, but the system shall still read old-format files.)

### NFR-8 — Documentation completeness

The kit shall ship:

- `README.md` — overview and three install paths.
- `ARCHITECTURE.md` — six-layer design.
- `HEALTH-CHECKS.md` — HC-1..HC-N with self-repair.
- `INSTALL-{windows,macos,linux}.md` — per-OS guides.
- `specs/{requirements,design,tasks}.md` — this spec set.
- `CHANGELOG.md` — semver-tracked changes from v0.0.1 onward.

### NFR-9 — Memory poisoning defense (baseline)

The kit shall implement v0.1 baseline defenses against memory poisoning, recognizing this is a known attack class (A-MemGuard, MemLineage research):

- `<private>` tags strip content before any write (NFR-6).
- Auto-extract is **conservative** — designed to produce frequent "skip: nothing durable" outcomes (FR-10).
- Provenance fields (FR-29) let users audit `write_source: auto-extract` entries.
- A future `cmk verify` command (v0.2+) may consensus-validate observations against multiple sessions before promoting to durable; not required for v0.1.

Acceptance: When an auto-extracted observation has `write_source: auto-extract` AND `trust: low`, the user shall be able to filter it out of search results with `cmk search --min-trust medium`.

### NFR-10 — Consent gate for system-level installs

_Added 2026-08-09 (Task 48). Until then this rule lived in [`design.md`](design.md) §14 as an **unsourced assertion**, having been mis-cited as NFR-9 (which is memory-poisoning defence — a different rule entirely). Task 37's review flagged the drift in 2026-05-28; it took a task that actually needed the rule to give it a number._

**The kit shall NEVER invoke a system-level install command — `pip install`, `npm install`, `winget install`, `brew install`, or any equivalent that changes software on the user's machine — without explicit user consent.**

Consent is satisfied by **exactly one** of:

1. **Install-time opt-in via a flag the user typed** — e.g. `cmk install --with-semantic`.
2. **Runtime consent via an interactive prompt** — e.g. `cmk doctor --repair`'s per-repair `[y/N]`, whose default is No.
3. **An explicit non-interactive consent flag the user typed** — e.g. `cmk doctor --repair --yes`, which is consent given in advance for that invocation.

**A missing terminal is not consent.** When stdin is not a TTY and no consent flag was passed, the kit shall print the command for the user to run and shall NOT execute it. It shall neither assume yes (dangerous) nor exit silently as though healthy (the false-green class NFR-10's own health checks exist to prevent) — it shall name the flag that would have granted consent.

**Consent is per-command, not per-session.** Consent granted for one install does not extend to another, and a consent flag does not extend to commands outside the kit's declared executable set.

EARS-form:

- **WHEN** a health check's recovery requires a system-level install, **THE** Memory_System **SHALL** surface the command and **SHALL NOT** execute it until one of the three consent channels above is satisfied.
- **WHEN** stdin is not an interactive terminal **AND** no explicit consent flag was passed, **THE** Memory_System **SHALL** print the command, name the flag that grants consent, and take no action.
- **WHEN** a recovery would delete or overwrite user data, **THE** Memory_System **SHALL** print it for manual execution **regardless** of any consent flag.

Acceptance: `cmk doctor --repair` on a project whose HC-8 fails prompts before running `npm install -g …`; the same command with stdin redirected from a non-terminal prints the command, names `--yes`, and installs nothing.

Enforced structurally by [`scripts/validate-install-consent.mjs`](../scripts/validate-install-consent.mjs) — the set of production modules that may spawn an installer is a declared allowlist, checked both directions, so a new spawn site fails the suite until someone states which consent channel gates it.

_Implemented by: `cmk doctor --repair` (Task 47, [`doctor-repair.mjs`](../packages/cli/src/doctor-repair.mjs)) · `cmk install --with-semantic` (Task 120) · HC-8's `requiresInstall` surfacing (Task 141a)._

---

## 5. Out of scope (explicit non-goals for v0.1.0)

The following are deferred to v0.2 or later:

- **OS-1**: Multi-agent support (Codex, Gemini, Hermes, Copilot). Claude Code only in v0.1.
- **OS-2**: Companion skills (make-plan, pathfinder, weekly-digests, knowledge-agent, etc.). These are valuable but a separate package. v0.1 ships memory-write and bootstrap only.
- **OS-3**: Web viewer with rich UI. v0.1 ships a minimal static viewer; rich UI (search, browse by date, observation graph) is v0.2.
- **OS-4**: Profile separation within a single project (work-mode vs personal-mode SOUL.md). Single mode per project in v0.1.
- **OS-5**: E2E test infrastructure with Docker. Unit tests only in v0.1.
- **OS-6**: Multilingual support / translation cache.
- **OS-7**: ~~Replacement of `memsearch` + `Milvus` with a different vector backend. We continue to use memsearch.~~ _(Superseded — the `memsearch` + `Milvus` pick was reconsidered (design §9.3.1; `sqlite-vec` leading) and its premature scaffolding **removed in Task 120**. The Layer-5b backend choice is now an open, deferred decision, not committed to memsearch.)_
- **OS-8**: Public marketplace distribution. v0.1 stays in a private GitHub repo. v0.2 may publish to npm + the Claude Code plugins marketplace.
- **OS-9**: Session-state virtualization (Claude Code CMV style snapshot/branch/trim primitives). Rolling-window compression covers most of the use case for v0.1; CMV-style versioning is v0.2+.
- **OS-10**: Structural code memory subsystem (Codebase-Memory style Tree-Sitter knowledge graph via MCP). Project-fact memory is in scope; code-structure memory is a separate concern, possible v0.2+ as a sister package.
- **OS-11**: Tamper-evident Merkle-chained audit log of memory mutations (Nautilus Compass style). Append-only `transcripts/` + content-addressed IDs (FR-14) gives most of the audit value for v0.1; cryptographic chaining is v0.2+.
- **OS-12**: Cross-LLM portable memory (Supermemory MCP style). Our markdown format is portable, but explicit adapters for Codex / Gemini / etc. are deferred to v0.2+ (consistent with T6, OS-1).
- **OS-13**: Memory operation policies via RL (Agentic Memory research direction). Far-frontier; not v0.1.

---

## 6. Resolved questions (decisions for v0.1.0)

Resolved by the user 2026-05-21 after reviewing my recommendations. Locked unless research (in progress) surfaces a meaningfully better option.

### OQ-1 — User tier directory name: **RESOLVED → `~/.core-memory-kit/`**

Keep the current name for v0.1. **Future-rename trigger**: if we add cross-agent support (Codex, Gemini, Hermes, Copilot) in v0.2+, rename the package and user-tier directory to `ai-agent-memory-kit` (or similar agent-neutral name). The Claude-specific name is acceptable while we ship Claude-only.

### OQ-2 — Bootstrap UX: **RESOLVED → all three**

Ship: `bash install.sh` (offline-capable), `pwsh install.ps1` (Windows-native), `npx core-memory-kit install` (cross-OS one-liner), AND a Claude Code plugin slash command (`/core-memory-kit:bootstrap`). Each serves a different audience.

### OQ-3 — SessionStart hook handling: **RESOLVED → SessionStart with PreToolUse fallback**

Use `SessionStart` as the primary snapshot-injection hook. If `SessionStart` doesn't fire for any reason (older Claude Code version, hook misconfigured, user disabled), `PreToolUse` catches up at the first tool call. Both fire at most once per session thanks to the `/tmp` flag.

What other systems do (for context): claude-mem and claude-remember both depend on SessionStart being available. Our fallback is defense in depth — costs ~5 extra lines.

### OQ-4 — Citation ID scope: **RESOLVED → namespaced (`U-`, `P-`, `L-` prefixes + 6-char base32)**

Example IDs: `U-7K2X9Q`, `P-3L8N1P`, `L-9M2X4R`. Tier prefix tells you at a glance where the fact lives. Base32 (no ambiguous chars like 0/O, 1/l) keeps IDs readable when spoken aloud or pasted into URLs.

Revisit if research surfaces a meaningfully better scheme (e.g., content-addressable hashes that give stable dedup across merges).

### OQ-5 — `<private>` tag handling: **RESOLVED → strip + `[redacted]` placeholder**

When `<private>...</private>` content appears in any turn, the tag and its content are stripped at the hook level. The turn still appears in `transcripts/{today}.md` (preserving conversational flow), but where the private content was, the file shows `[private content redacted]`. Sensitive content NEVER touches disk in cleartext anywhere.

Origin: pattern borrowed from claude-mem. Anthropic's official Memory tool docs explicitly recommend stripping sensitive info from memory files. Two-tag system: `<private>` (exclude) + `<retain>` (force-keep). No additional tags in v0.1 — more tags is feature creep until we have real-world evidence we need them.

### OQ-6 — Unified `cmk` CLI: **RESOLVED → yes**

Ship a `cmk` Node binary that proxies to the underlying scripts (`cmk search`, `cmk reindex`, `cmk health`, `cmk view`, `cmk install-user-tier`, etc.). Single discoverable entry point. Matches the pattern claude-mem uses.

### OQ-7 — Scheduler backend: **RESOLVED → cron / schtasks only for v0.1**

Windows: Task Scheduler via `schtasks`. macOS/Linux: `crontab`. User works on both Windows AND macOS/Linux, so both must work; both already do via `register-crons.py`.

`launchd` (macOS-native) and `systemd timers` (Linux-server-native) are deferred to v0.2 as enhancements. Cron works fine for desktop/dev use.

### OQ-8 — How aggressive should auto-extract be?: **RESOLVED → conservative**

Auto-extract is designed to fail-closed: most turns produce `skip: nothing durable`. Aggressive extraction (à la Mem0) risks accumulating memory that wasn't actually decided. Conservative extraction trusts the rolling-window compressor to re-surface latent decisions when they actually become load-bearing — consistent with the True Memory paper's "prefer retrieval-over-preserved-events over write-time extraction" argument. We extract sparingly; we preserve transcripts indefinitely (T7); the retrieval path can always find what we didn't pre-extract.

---

## 7. Review checklist

Before approving this requirements doc, verify each:

- [ ] T1-T8 design tenets are correct and complete.
- [ ] US-1 through US-16 cover the user needs the user actually has.
- [ ] No FR violates any tenet.
- [ ] FR-28/29/30 (raw retention, provenance, trust-aware search) + FR-31 (AI-side position consistency, reserved) match the design intent.
- [ ] NFR-9 (memory poisoning defense baseline) is appropriate scope.
- [ ] OQ-1 through OQ-8 are resolved with concrete answers.
- [ ] OS-1 through OS-13 (deferred features) are correctly deferred — nothing important got deferred by accident.
- [ ] NFRs are realistic (performance budgets achievable, OS support feasible).

---

## 8. Approval

When this document is approved, write `design.md` next. Until approved, `design.md` shall NOT be written.

**User**: approved by: __________  date: __________
**Author (Claude)**: drafted 2026-05-21
