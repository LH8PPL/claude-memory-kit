# `cmk` CLI reference

Complete reference for the `cmk` command (installed by `npm install -g @lh8ppl/core-memory-kit`). Run `cmk --help` or `cmk <command> --help` for the live version.

Most commands operate on the **project tier** (`<repo>/context/`) by default, using the current working directory as the project root.

---

## Setup & lifecycle

### `cmk install [--force] [--no-hooks] [--with-semantic | --no-semantic] [--ide <agent>] [--backend <agent>]`

Scaffold the kit into the current project: creates the 3-tier `context/` layout, injects `.gitignore` entries, drops the managed CLAUDE.md block, and **wires the lifecycle hooks** into `.claude/settings.json` (the memory hooks + a `PreToolUse` **delete-guardrail** + a `PermissionRequest` **auto-approver** that keeps the kit's own tools/skills prompt-free, below). Idempotent — re-running is safe: **kit-owned files (the scaffolded `.claude/skills/` + `.claude/commands/`) refresh to your installed version** (reported, never silent — Task 230), while **your memory (`context/`, `context.local/`, the user tier) is never overwritten**. Restart Claude Code afterward so hooks load.
- `--force` — allow downgrading an existing newer-version CLAUDE.md block.
- `--no-hooks` — scaffold only; don't touch `.claude/settings.json`.
- `--with-semantic` — install the optional local embedder (`npm install -g @huggingface/transformers`, ~260 MB once), pre-warm the model, and set `search.default_mode: hybrid` for this project — bare `cmk search` then recalls by meaning, no flags. `--no-semantic` pins keyword-only.
- `--ide <agent>` — target an agent other than Claude Code (default `claude-code`). `--ide kiro` wires Kiro for **both** the IDE (GUI) and the `kiro-cli` terminal: MCP (`.kiro/settings/mcp.json`, with `autoApprove`), steering (`.kiro/steering/cmk.md`), the memory skills (`.kiro/skills/`), **automatic IDE hooks** (`.kiro/hooks/cmk-{capture,inject,guard,observe}.json` — the Kiro IDE 1.0 v1 format: `Stop` capture + `UserPromptSubmit` recall + `PreToolUse` delete-guard + `PostToolUse` edit-observation — plus legacy `cmk-{capture,inject}.kiro.hook` for older Kiro), a **CLI agent-config** (`~/.kiro/agents/cmk.json` + a `chat.defaultAgent` pointer in `~/.kiro/settings/cli.json`) carrying `agentSpawn`/`userPromptSubmit`/`postToolUse`/`stop`/`preToolUse` hooks, registered as the default agent (guarded — never clobbers an existing default; installs a named `cmk` agent + a notice instead), **trusted-commands** (`kiroAgent.trustedCommands` in `.vscode/settings.json` on the IDE side, the agent-config's `toolsSettings.shell.allowedCommands` on the CLI side, both scoped to the kit's commands only), and on **Kiro IDE 1.0+** a per-workspace **`permissions.yaml`** (`~/.kiro/workspace-roots/<hash>/`) that pre-trusts the kit's hooks, MCP tools, and skills so even the first skill-load runs with no Allow prompt. Both hook surfaces drive the same `cmk hook` dispatcher. Restart Kiro to activate the hooks. `--ide cursor` wires **Cursor**: MCP (`.cursor/mcp.json`), hooks (`.cursor/hooks.json` — `sessionStart` recall + `beforeSubmitPrompt` prompt-capture + `afterAgentResponse` turn-capture + `afterFileEdit` edit-observation + `sessionEnd` compress + `beforeShellExecution` delete-guard, all driving the `cmk cursor-hook` dispatcher), and an always-applied rule (`.cursor/rules/core-memory-kit.mdc`). Restart Cursor to activate. `--ide codex` wires **Codex**: hooks (`.codex/hooks.json` — `SessionStart` recall + `UserPromptSubmit` prompt-capture + `Stop` turn-capture (read from the session's rollout file) + `PostToolUse` edit-observation + `PreToolUse` delete-guard, all driving the `cmk codex-hook` dispatcher), MCP registered via Codex's own `codex mcp add` (the kit never hand-edits your `config.toml`; if the codex CLI is off-PATH — the Desktop-app bundle — the install prints the one-liner to run yourself), and a managed `AGENTS.md` block. **One-time step:** run `/hooks` inside Codex once to trust the kit's hooks (Codex skips untrusted hooks). See [CODEX.md](CODEX.md). `--ide agents-md` emits a managed `AGENTS.md` block for tools that read it.
- `--backend <agent>` — **split-brain backend**: route the AUTOMATIC memory (compression / extraction / persona) through a DIFFERENT agent's CLI than the one you code in — `claude` | `kiro` | `cursor` | `codex`. E.g. `cmk install --backend kiro` while coding in Claude runs the frequent background "janitor" LLM on cheaper `kiro-cli`, keeping your premium subscription for actual coding. Sets the `backend.agent` config key (identical to `cmk config set backend.agent <agent>`); omit it to follow `--ide`. Verify with `cmk config show`.
```bash
cd ~/my-project && cmk install
cmk install --with-semantic # + local semantic recall, hybrid by default
cmk install --backend kiro  # code here, run automatic memory on kiro-cli
cmk install --no-hooks      # scaffold-only
cmk install --ide kiro      # wire Kiro (IDE + kiro-cli) instead of Claude Code
cmk install --ide cursor    # wire Cursor instead of Claude Code
cmk install --ide codex     # wire Codex instead of Claude Code
```

**Memory auto-recovery (v0.6.3).** Every `cmk install` — first run or upgrade — also **rescues memory an older version stranded**. Two classes, both automatic, both zero-LLM:

- **Orphaned `context/` folders.** Before v0.6.2 the capture hooks resolved the project root as the agent's raw working directory, so running your agent from a subdirectory forked a second, unread `context/` tier there and wrote real facts into it. Install now scans below the project root (depth-bounded, `node_modules`/dot-dirs/build trees pruned) for such folders — identified by **live state**, so a template scaffold is never touched — and copies their fact files into this project's tier **byte-identically: ids and `created_at` dates are preserved exactly**, so recovered memory keeps its real history. Anything already present here is **skipped, never overwritten**, and a fact you previously `cmk forget`-ed is never resurrected. Non-fact leftovers (`MEMORY.md` bullets, session logs, queue entries) are reported and left for you to review, never auto-merged. The old folder is **left exactly as it was** with a copy-paste delete command printed for your shell — the kit never deletes a memory path. Re-running install is a silent no-op; `cmk doctor` **HC-13** keeps naming the folder until you remove it.
- **Fact files with a missing or invalid id.** A legacy fact whose frontmatter lacks a valid citation id is invisible to recall and gets re-scanned on every session start. Because the kit's ids are content-addressed, install recomputes the id from the file's own body and writes it back (every other byte preserved; a replaced id is kept as `legacy_id`). A file too damaged to repair is **quarantined** into `context/memory/archive/quarantine/` with its bytes intact and reported — never deleted, never silently dropped.

The whole pass is **fail-open**: if anything goes wrong it prints one note and the install completes exactly as it otherwise would.

**Memory delete-guardrail.** Beyond the 5 memory hooks, `cmk install` also wires a `PreToolUse` hook (`cmk-guard-memory`) on both agents — Claude Code (matcher `Bash|PowerShell`) and Kiro (`execute_bash`). It inspects every shell command the agent is about to run and **blocks it** (the tool never executes) when it's a destructive command (`rm`, `Remove-Item`, `del`, `git clean`, `git reset --hard`, `find … -delete`, `truncate`, `>`-truncate) aimed at a memory path (`context/`, the `~/.core-memory-kit` persona tier, `MEMORY.md` / `DECISIONS.md`). It's **fail-open** (a broken guard never wedges the session) and intentionally broad (a false block is recoverable by rephrasing; a false allow is the data loss it prevents). `cmk-guard-memory` is an internal hook bin, not a command you run by hand.

### `cmk uninstall [--ide <agent>]`

Remove one agent's kit-managed wiring. **Conservative** — preserves everything outside the kit's markers and **never deletes `context/`** (your memory data).
- (no flag) → removes the **Claude Code** surface: the managed `CLAUDE.md` block (+ hooks).
- `--ide kiro` → removes the **Kiro** surface: the `.kiro/` managed blocks (MCP entry, steering), the `AGENTS.md` managed block, the `.kiro/skills/` + `.kiro/hooks/` files, the kit's `kiroAgent.trustedCommands` entries in `.vscode/settings.json` (your own trusted commands are preserved), the kit's rules in the Kiro IDE 1.0 per-workspace `~/.kiro/workspace-roots/<hash>/permissions.yaml` (your own rules preserved), and the guarded `~/.kiro/agents/cmk.json` CLI agent.
- `--ide cursor` → removes the **Cursor** surface: the kit's events in `.cursor/hooks.json` (your own hooks preserved), the `core-memory-kit` entry in `.cursor/mcp.json` (sibling servers preserved), and the managed block in `.cursor/rules/core-memory-kit.mdc`.
- `--ide codex` → removes the **Codex** surface: the kit's events in `.codex/hooks.json` (your own hooks preserved), the `core-memory-kit` MCP entry via `codex mcp remove` (only when the project shows a kit install — a clean project is a quiet no-op), and the managed `AGENTS.md` block.
- On a dual-agent project, uninstalling one agent leaves the other (and the shared `context/`) working. To remove the memory data, delete `context/` yourself.

### `cmk hook`

`cmk hook <agentSpawn|promptSubmit|stop>` — the **Kiro** hook entrypoint, called by Kiro's IDE + CLI hooks (not by users). `agentSpawn`/`promptSubmit` inject recalled memory into the agent's context; `stop` captures the turn from Kiro's transcript. Always exits 0 so a hook failure never breaks the Kiro session. Wired automatically by `cmk install --ide kiro`.

### `cmk cursor-hook`

The **Cursor** hook entrypoint, called by `.cursor/hooks.json` (not by users). Reads Cursor's JSON payload on stdin and routes on its `hook_event_name`: `sessionStart` injects recalled memory (`additional_context`), `beforeSubmitPrompt` captures the prompt, `afterAgentResponse` captures the turn, `afterFileEdit` records the edit observation, `sessionEnd` runs the compress+persona tasks, `beforeShellExecution` is the memory delete-guardrail (denies via the JSON `permission` field). Always exits 0 so a hook failure never blocks a prompt or shell command. Wired automatically by `cmk install --ide cursor`.

### `cmk codex-hook`

The **Codex** hook entrypoint, called by `.codex/hooks.json` (not by users). Reads Codex's JSON payload on stdin and routes on its `hook_event_name`: `SessionStart` injects recalled memory (`hookSpecificOutput.additionalContext`), `UserPromptSubmit` captures the prompt, `Stop` captures the turn (read from the payload's `transcript_path` rollout file), `PostToolUse` records the edit observation, `PreToolUse` is the memory delete-guardrail (denies via `hookSpecificOutput.permissionDecision`). Always exits 0 so a hook failure never blocks a prompt or tool call. Wired automatically by `cmk install --ide codex` (one-time `/hooks` trust inside Codex required).

### `cmk init-user-tier`

Scaffold the cross-project user tier at `~/.core-memory-kit/` (honors `$MEMORY_KIT_USER_DIR`). Use on a new machine.

### `cmk tour`

**Narrate this project's memory** — a warm, honest walkthrough of what's actually on disk: the three tiers + precedence, what's been captured (real counts + a few of YOUR fact titles — never invented examples), how recall works (`search` scopes, `expand`, the injected snapshot), and next steps. Degrades gracefully on a fresh install (teaches the structure + how it fills). **Tour EXPLAINS; `cmk doctor` CHECKS** — they're siblings, not substitutes. In conversation: the `/tour` slash command (scaffolded into `.claude/commands/` by `cmk install`; Kiro gets a manual-inclusion `tour.md` steering file) runs the same core.

---

## Capture

### `cmk remember <text…> [flags]`

Explicitly capture a durable fact. Routes through the kit's safe write path — **Poison_Guard** (rejects secrets), **home-path abstraction** (`C:\Users\you\…` → `~\…` so a committed fact never leaks your username), **dedup**, and correct provenance. This is the safe alternative to hand-writing files under `context/memory/` (which bypasses all of the above).

**Terse form** (no rich flags) → a one-line bullet in the project `MEMORY.md` (the layer recalled at session start):
- `--trust high|medium|low` — default `high`.
- `--section <name>` — MEMORY.md section, default `Active Threads`.
- `--tier P` — writes the project tier (default). `U`/`L` are **captured to P with a note** (not a direct write target yet); promote a fact (`cmk lessons promote <id>`) to make it cross-project. For machine-only paths, edit `context.local/machine-paths.md` directly.

**Rich form** (any of the flags below) → a granular **fact file** under `context/memory/` with full rationale:
- `--why <text>` — the rationale (becomes the **Why:** block).
- `--how <text>` — how to apply it (becomes the **How to apply:** block).
- `--type feedback|project|reference|user` — fact type, default `feedback`.
- `--title <text>` — a short title (also the fact-file slug).
- `--links <a,b>` — related fact names for `[[cross-links]]`.
- `--shape State|Event|Plan|Relationship|Preference|Absence|Timeless` — what KIND of truth the fact asserts, default `State` (Task 66.1).
- `--expires <date>` — a declared validity end (ISO date/datetime, e.g. `2026-08-01`): after it the fact **hides from search** and the weekly sweep **tombstones** it (recoverable; never hard-deleted) (Task 66.3).
- `--from-file <path>` / `--json` — read the whole fact as a JSON object from a file / stdin (shell-safe for backtick/quote-heavy rationale). JSON keys: `text` (required), `why`, `how`, `type`, `title`, `links`, `shape`, `expires`.

```bash
cmk remember "We deploy with Kamal to Hetzner; never to Vercel."
cmk remember "Prefers terse responses, no preamble." --trust high
cmk remember "Demo to the team is on Friday" --shape Plan --expires 2026-07-04
```
Most capture is automatic (the Stop hook extracts facts each turn) — use `cmk remember` when you want an explicit, immediate write.

---

## Inspect & search

### `cmk search <query…> [flags]`

Search accumulated memory.
- `--mode keyword|semantic|hybrid` — the project default is `keyword`, or `hybrid` after `cmk install --with-semantic` (the `search.default_mode` setting). Semantic/hybrid need the optional local embedder; explicitly requesting them without it exits 2 with the install hint, while a configured default degrades gracefully to keyword.
- `--scope facts|transcripts|decisions` — `facts` (default) searches curated memory; `transcripts` searches the raw session record (verbatim transcripts + compressed session summaries) — the last-resort recall tier; hits are `T:<file>:<line>` locations, and fact-only filters (tier/trust/since) don't apply. `decisions` searches the append-only decision journal (`context/DECISIONS.md`) — use it for decision **history / evolution / "what did we reject"** queries; it returns superseded + retracted decisions the live fact store no longer carries (keyword-only; fact-only filters don't apply).
- `--min-trust low|medium|high` · `--tier U|P|L` · `--since <ISO date>` · `--limit <n>` (default 20) · `--include-tombstoned`.
- `--include-expired` — include facts past their declared `expires_at` (hidden from results by default; hidden ≠ deleted — the human-only recovery opt-in, symmetric with tombstones) (Task 66.3).
- `--source <origin>` — a recall-origin telemetry tag (e.g. `skill`) recorded in the recall log so the kit can measure how often each surface drives a search — the `memory-search` skill passes `--source skill` on its first ladder step, making the skill fire-rate measurable (Task 233, ADR-0024). Ordinary user searches omit it; it never changes results.
- **Output columns (Task 227):** `id  tier/trust  date  file:line  snippet` — every hit carries its citation **date** (facts: creation date; session-record hits: the day-file's date) so answers can say "decided 2026-06-20"; `—` = undated (consolidated files like `recent.md`, whose sections carry their own date headings). Result rows from `mk_search` carry the same `date` + `heading` fields.
- **State labels (Task 209, automatic — no flag):** a non-current fact prints its temporal state ahead of the snippet — `[superseded — kept for history]` / `[expired]` / `[retracted]` — and a one-line reading instruction follows the results whenever a labeled row is present. Unlabeled = current. Zero noise when everything is current.
- **Query state-view gate (Task 211, automatic — no flag):** a history/transition question ("what did we use *before* X", "how did Y *change*") is detected by a rule-based classifier and automatically reaches the history — expired facts included, superseded ones listed first (historical view), all labeled. A plain or "current" question behaves exactly as before. `--state-view current|historical|transition|neutral` exists only as an override; when the gate fired, a `state view: …` note follows the results.
```bash
cmk search "postgres"
cmk search "deploy steps" --min-trust high --tier P --limit 5
```

### `cmk get <ids…>`

Fetch full observation bodies + provenance by citation ID (parity with the `mk_get` MCP tool). Takes one or more ids from `cmk search` output. **Live facts only by default** — a forgotten (tombstoned) id returns `not found`. After `cmk forget`, the fact's body persists on disk in `context/memory/archive/tombstones/<id>.md` (the durable recovery artifact). Automatic recall never resurfaces a forgotten fact by design — forgetting it makes it invisible to the agent, not re-asserted from memory.

- `--include-tombstoned` — **human-only recovery opt-in.** On a live miss, also reads the tombstone archive and returns the forgotten fact's body + deletion provenance (`deleted_at` / `deleted_by`), marked `tombstoned: true`. This flag exists ONLY on the CLI; the `mk_get` MCP tool is tombstone-blind, so the AI can never recover a fact you forgot (D-163). A live fact always wins — recovery is a miss-only fallback.

```bash
cmk get P-S79MJHFN
cmk get P-S79MJHFN P-QT4CMNXH      # batch
cmk get P-S79MJHFN --include-tombstoned   # recover a forgotten fact (human-only)
```

### `cmk timeline <anchor> [--before <n>] [--after <n>]`

Sequential context around an anchor observation — what was captured before and after it, by creation time (`mk_timeline` parity).
- `--before <n>` / `--after <n>` — observations on each side (default 5 each).
```bash
cmk timeline P-S79MJHFN --before 3 --after 3
```

### `cmk expand <hit-id>`

Expand a recall hit to its **source-file neighborhood** — the enclosing heading section around the hit (sibling bullets, the surrounding day-file entry), bounded to a per-expand cap, never the whole file (`mk_expand` parity). Takes either hit-id shape a search returns: a citation ID (`P-XXXXXXXX`) or a transcript-chunk id (`T:<file>:<line>`). **The recall ladder's middle rung**: search → **expand** → transcript drill — stop at the shallowest rung that answers; expand answers "what surrounds this hit" at a fraction of a transcript drill's tokens. (`cmk timeline` is the other context axis — chronological neighbors rather than file neighbors.)

### `cmk links <id-or-anchor> [--depth <n>] [--direction in|out|both]`

Traverse a fact's **relations** — the relational adjacency axis (`mk_links` parity), the fourth beside `expand` (source-file), `timeline` (time), and `--scope decisions` (evolution). Answers the graph-only shapes flat search can't:

- **Backlinks** — "what points AT this fact" (the `in` direction). Not a similarity question; the referencing facts may share no vocabulary.
- **Supersession chain** — "what replaced what, in order" (walked in both directions over `superseded_by`, returned oldest→newest).
- **Out-links** — the fact's own `related:` + `[[cross-links]]` (the `out` direction).
- **What cites an anchor** — pass an **anchor token** (`D-nnn`, `Task nnn`, `ADR-nnnn`, `FR-nn`, `NFR-nn`) instead of a fact id and `links` returns the facts that cite it (its citers, as backlinks). An anchor is a graph sink, so `out` is empty.

A fact's own anchor citations show up in its **out-links** here (`--direction out` lists the `anchor:` nodes it cites, `type: cites`) — `links` is the graph surface. This is deliberately *not* mirrored in `cmk get`'s `related` list, which stays the clean fact-content surface (`related`/`[[cross-links]]` only). Anchor citations are graph structure, not fact metadata.

The graph is built at reindex from the markdown the kit already writes (`related:` frontmatter, `[[slug]]` body wikilinks, the `superseded_by` chain, and body **anchor citations** — Task 256) into a rebuildable `edges` table — zero LLM, rebuilt byte-stable exactly like the FTS index.

- `--depth <n>` — hops to traverse for links/backlinks (default 1).
- `--direction in|out|both` — `in` = backlinks, `out` = references, `both` (default).

```bash
cmk links P-S79MJHFN                      # backlinks + out-links + supersession chain
cmk links P-S79MJHFN --direction in       # only what points AT this fact
cmk links P-S79MJHFN --depth 2            # two hops out
cmk links D-361                           # which facts cite decision D-361
cmk links ADR-0023                        # which facts cite ADR-0023
```

### `cmk cite <id>`

Render the canonical Markdown citation link for an observation (`mk_cite` parity) — paste-ready provenance for docs/PRs.

### `cmk recent-activity [--window 1h|24h|7d] [--limit <n>]`

List recently added observations within a time window (`mk_recent_activity` parity; default window 24h, limit 20). The "what did the kit capture lately?" view.

### `cmk digest`

Print a readable digest of everything in memory (facts grouped by type, with trust + date), AND sync `context/DECISIONS.md` — the **append-only decision journal**. Two surfaces, two lifecycles:
- The **digest** is a *regenerated* snapshot of current knowledge (printed to stdout) — like a rebuilt index, it reflects only what exists now.
- **`context/DECISIONS.md`** is a *committed, append-only* chronological log of every decision (`type: project` facts) and its **Why**. Unlike the digest it is **never regenerated and never rolls**: a superseded or forgotten decision stays in the file, annotated `_(retracted …)_` in place — because the value of a decision log is the trail (what you decided *and* what you moved away from). It travels with `git clone` and shows up in the PR diff that captured the decision.
```bash
cmk digest
```

### `cmk view [--port <n>] [--host <host>] [--no-open] [--project <dir>]`

**Open your memory in a browser — read-only.** One command starts a small local server, opens a tab, and serves five views over what the kit has captured: a **search-first landing page** with a pinned health line and your newest facts (trust · date · source badges), **fact detail** (the body, its Why/How, trust and its history, the fact's edges, and copy-able `cmk forget` / `cmk trust` commands), the **graph** (trust as colour, supersession as direction, doc anchors as hubs), **health** (the `cmk doctor` checks plus any active warnings), and the **decision journal** (chronological, with retracted entries struck through). All three tiers appear, badged `P` / `L` / `U`.

- **Ephemeral, not a daemon.** It binds a free port, serves until you press Ctrl-C, and leaves nothing running. Re-run it whenever you want it.
- **Loopback only, and this is not configurable.** The viewer serves your memory — including the user tier — over plain HTTP with no authentication, so it binds `127.0.0.1` and refuses anything else, and it rejects requests that arrive under someone else's hostname. There is no auth mode to turn on.
- **Read-only structurally.** No write route exists — not disabled, absent. Anything other than `GET`/`HEAD` gets `405`. To change memory, copy the `cmk forget` / `cmk trust` command the fact page shows you and run it in your shell (`cmk view` never edits anything).
- **JSON on the same routes.** Every view answers HTML or JSON: `/facts`, `/facts.json`, `/api/facts`, or `Accept: application/json`. So the viewer doubles as a local read API (`/api/facts?q=&tier=`, `/api/fact/:id`, `/api/graph`, `/api/health`, `/api/decisions`).
- **Manual refresh, honest labels.** Each view says when its data was read; the Refresh button re-reads. Live auto-refresh is deliberately not in this version.
- **Needs a kit project.** Run it somewhere with no `context/MEMORY.md` and it explains and exits — it will never scaffold memory for you.

```bash
cmk view                 # pick a free port, open the browser
cmk view --no-open       # just print the URL (CI, remote shells, tmux)
cmk view --port 7777     # pin the port
```

### `cmk doctor [--repair] [--yes]`

Run the health checks (HC-1..HC-15); reports PASS/WARN/FAIL/SKIP with a repair command per failure (WARN is advisory — the command is shown but the exit code is untouched). HC-8 (npm 12 readiness) verifies the native bindings load and emits the exact `--allow-scripts` remediation when npm blocked an install script. **HC-5 (cron registration)** asks the host scheduler what is actually registered rather than reading back the kit's own sentinel — it FAILS with `cmk register-crons` when a scheduled job's command no longer exists on disk (a global reinstall or a package rename strands it, and the job then fails silently every night), and WARNs on Windows when a task carries the pre-v0.6.6 battery/idle flags that stop it running unplugged. HC-9 flags project-scaffold version drift after a global update — and WARNs when the installed `cmk` itself is behind the npm registry's published `latest` (Task 245: the silent-upgrade-failure class; skipped offline/CI, opt out with `CMK_SKIP_UPDATE_CHECK=1`); HC-10 is an informational scheduled-compaction-liveness heads-up; **HC-11 (backend LLM CLI present)** checks that the CLI of the agent this project runs its automatic engine on (`claude` / `kiro-cli` / `cursor-agent`) is on your PATH — when it's missing, it FAILS with an honest "automatic features degraded, file-only still works" message (never a silent no-op); **HC-12 (deletion propagation)** verifies every tombstoned fact is actually gone from the derived surfaces (the search index + distilled summaries) and names any survivor's exact location — SKIPs as *vacuous* when nothing has been forgotten yet; **HC-15 (semantic vector mapping)** verifies that each fact's stored embedding really is its own — a mis-filed vector makes semantic search return confident, well-scored answers about the wrong facts, and no other check would see it (FAILs with the count and `cmk reindex --full`; SKIPs when semantic search isn't in use). The report ends with an informational **memory-health section** (content quality: fact count + trust distribution, old-and-untouched facts, possible duplicate pairs, pending queue items) — read-only, never affects the exit code.
```bash
cmk doctor
cmk doctor --repair          # offer to run each failed check's fix, one at a time
cmk doctor --repair --yes    # apply them without prompting (scripts / CI)
```

**`--repair`** (Task 47) walks the failures *after* printing the report and offers each one's recovery command — showing the check's own problem line, the exact command, and a `[y/N]` whose default is **No**. It reports each result honestly and separately: applied · failed · declined · left for you. It never claims the check now passes — the checks ran *before* the repairs, so it tells you to re-run `cmk doctor` to confirm.

Three rules bound what it will actually execute:

- **It never runs a destructive or incomplete recovery.** A fix that deletes something (`Remove-Item` on a stale lock), one that still contains a `<placeholder>` you have to fill in, or one that is an instruction rather than a command, is **always printed for you to run yourself** — with the reason why — including under `--yes`.
- **No terminal is never an implicit yes.** Piped or in CI, it prints the commands and names `--yes`; it does not prompt, and it does not assume.
- **Only recognised commands run at all.** The kit's own verbs and the `npm install -g …` line HC-8 emits are executed; anything else is print-only by default, so a recovery a future check invents is never run before someone has decided it should be.

Repairs run the *same* `cmk` you invoked, not whatever is on your PATH — the point is to avoid repairing with the stale global binary HC-9 exists to warn about. Every offer, answer and result is appended to `context/.locks/doctor-repair.log` as NDJSON, including the ones nobody ran.

### `cmk reindex [--boot|--full]`

Rebuild the SQLite/FTS5 search cache (regenerable; never source of truth).
- `--boot` — incremental (changed files only, **and prunes removed files**) · `--full` — drop + rebuild.
- **Rarely needed by hand.** Every read path (`cmk search` / `get` / `timeline` / `cite` / `recent-activity`) reindexes incrementally before reading, and `cmk forget` reindexes in-band — so captures, edits, and deletions all show up in search automatically (Task 110). Reach for this only to force a `--full` rebuild after manual surgery on the markdown.
- Also regenerates the tier's `INDEX.md` pointer index and its `MAP.md` Obsidian vault map (both derived, byte-stable, never source of truth). See **[docs/OBSIDIAN.md](OBSIDIAN.md)** for browsing memory in Obsidian.

### `cmk config get <key>` · `cmk config set <key> <value> [--local]` · `cmk config show` · `cmk config --show-origin <key>`

Read/write kit settings (`context/settings.json`) without hand-editing JSON. Keys are dotted paths (e.g. `search.default_mode`). `get` resolves across tiers (local > project > user) and prints the winning value; `set` writes the project tier by default, or the gitignored local tier with `--local`, preserving every sibling key; `--show-origin` lists every tier that defines the key, marking the winner and the shadowed (the "where did this come from?" surface — the direnv lesson). `true`/`false`/numbers are coerced; everything else stays a string. A key set in no tier exits 2.

**`cmk config show`** — a one-glance INFORMATIONAL readout of this project's memory setup (distinct from `cmk doctor`, which is a health/pass-fail check): the agent you installed for, the **active backend agent** that runs your automatic memory (and whether it's a `--backend`/`backend.agent` override that differs from the installed-for agent), whether that backend CLI is on your PATH, and the semantic-search mode. This is what makes the split-brain backend override legible — without it, "which agent runs my automatic memory" is invisible. Read-only; never a non-zero exit.

---

## Maintenance & repair

### `cmk autolink [--apply] [--max <n>] [--tier <P|L|U>] [--semantic]`

**Put `related:` edges on facts that have none.** Each unlinked fact is scored against your corpus and gains up to 3 `related:` edges, which `cmk links`, `cmk expand` and the viewer's graph all walk. This verb is the way linking is meant to be used: deliberate, inspectable, and needing no configuration. (The same scoring can also run automatically at capture time, but that is **off by default** — see the note at the end.)

- **A bare `cmk autolink` is a DRY RUN and never modifies your memory** — writing takes an explicit `--apply`. The dry run reports the band distribution and a sample of the edges it would add, and touches none of your memory — no fact file is edited, no resume marker is recorded, no audit entry is written. (It may compute and cache the threshold in the rebuildable search index, which is derived state, not memory.)
- **Three bands, one of which is not a link.** A candidate that scores like a *near-duplicate* is not auto-linked: merging two facts is a human call, so at capture time it becomes a proposal in `cmk queue conflicts` instead. A backfill never queues — both facts already exist and were both accepted, often months apart.
- **The threshold is derived from *your* corpus**, not a constant copied from someone else's. It is the 99th percentile of your own facts' random-pair similarity, recomputed on every `cmk reindex --full`. On a corpus too small or too uniform to separate signal from noise, it links nothing and says so.
- **Bounded and resumable** (ADR-0020): each run considers `--max` facts (default 250) and persists each one before moving on, so a killed run keeps everything it finished and a re-run continues where it stopped. Re-running a finished corpus is a no-op.
- **Never touches a fact that already has links** — a hand-placed edge is a decision, not a gap.
- Links never cross tiers, so a committed project fact can never point at a machine-local one.
- `--semantic` scores with the local embedder instead of word overlap (needs the optional embedder from `cmk install --with-semantic`).

**The automatic half is OFF by default**, and deliberately so: measured on our own relational benchmark, edges placed at capture time recovered none of the recall that hand-placed edges do, and linking adds ~2.8 s to every capture on a 2,260-fact corpus. Turn it on with `cmk config set memory.link_facts true` (or `CMK_LINK_FACTS=1` for one command) if you want it; this verb needs no flag.

### `cmk backfill [--dry-run] [--days <n>] [--max <n>]`

**Reconstruct the session logs for days you worked but the kit didn't record.** If a session crashes, the Stop hook misfires, or you spend a day in another tool and only commit, that day has commits in git but no entry in `context/sessions/` — a silent hole in your memory timeline. This finds those days and rebuilds a short work log for each from that day's commit messages and diffs.

- **Normally you never run this** — the daily distill cron sweeps for gaps automatically. The verb is the manual "fill it now" override.
- Every reconstruction is **marked as reconstructed**, not passed off as a captured session — it's derived from git, so it knows only what the commits show.
- **A real session log is never overwritten.** Real always beats reconstructed.
- Idempotent and bounded: re-running won't duplicate a day, and each run does a few days at most so a long-neglected repo can't stall the cron.
- `--dry-run` lists the gap days and writes nothing · `--days <n>` how far back to look (default 14) · `--max <n>` days per run (default 3).

### `cmk repair [--hooks|--locks|--index|--all]`

Idempotent self-repair (default `--all` if no flag).
- `--hooks` — re-merge the kit hooks into `.claude/settings.json` (fixes HC-2).
- `--locks` — clear stale locks (>1h). `--index` — `reindex --full`.
```bash
cmk repair --hooks
cmk repair --all
```

### `cmk register-crons [--dry-run] [--unregister]`

Register the daily-distill + weekly-curate jobs with the host scheduler (Linux crontab / macOS launchd / Windows Task Scheduler). Optional — without it, Layer 6 falls back to lazy-on-read compression.

Idempotent, and **re-running it repairs an existing registration**. On Windows the jobs are registered so they run on a laptop: allowed to start on battery, not killed when you unplug, and not killed when you come back to the keyboard — plus the existing catch-up and wake-for-the-run flags. Registrations made before v0.6.6 carry the opposite of the first three, so **if you registered crons on an earlier version, run this again**.

`--dry-run` prints exactly what would be registered — on Windows that is both the `schtasks /Create` line and the settings command — and changes nothing on disk or in the scheduler.

---

## Compression (normally automatic)

### `cmk roll [--scope now|today|recent]`

Manually trigger a compression pass. `now` = compress-session (default), `today` = daily-distill, `recent` = weekly-curate.

### `cmk daily-distill` · `cmk weekly-curate`

Run one pipeline pass directly (these are what the scheduler invokes; humans normally use `cmk register-crons` or `cmk roll`). `daily-distill` consolidates the day's session buffers into `today-{date}.md`; `weekly-curate` archives `today-*.md` older than 7 days into `archive.md`, dedups bullets, and rebuilds `recent.md`. The weekly pass also runs the kit's maintenance sweeps (Task 66, v0.4.4): the **expiry sweep** (facts past their declared `expires_at` are tombstoned — recoverable, never hard-deleted) and the **temporal sweep** (same-subject facts judged in one batched Haiku call; a newer "current state" fact closes the older one's validity window, so stale states stop surfacing — the next session start mentions what was resolved).

### `cmk compress --lazy`

The lazy-on-read fallback for no-cron environments: checks staleness and delegates to daily-distill / weekly-curate as needed. Typically invoked detached from the SessionStart hook — not by hand. (Bare `cmk compress` without `--lazy` is a stub.)

These also ship as standalone bins for the scheduler: `cmk-daily-distill`, `cmk-weekly-curate`, `cmk-compress-lazy` (invoked by cron; not typically by hand).

---

## Memory management

### `cmk trust <id> <low|medium|high>`

Override an observation's trust level. IDs come from `cmk search` (e.g. `P-S79MJHFN`).

### `cmk forget <id-or-query> [--yes] [--reason <text>] [--deleted-by <enum>]`

Tombstone a fact (preserves an audit trail). `--yes` required. **Disappears from `cmk search` immediately** — forget reindexes in-band, so no manual `cmk reindex` (Task 110). The content stays recoverable by a human via `cmk get <id> --include-tombstoned` (reads the tombstone archive) — never by the AI (D-163). Claude can also do this in conversation via the `mk_forget` tool.
```bash
cmk forget P-S79MJHFN --yes --reason "superseded"
```

### `cmk redact <id> --pattern <text> [--reason <text>] [--project <dir>]`

The compliance scrub (Task 96, ADR-0022): remove a leaked secret/PII span from **every app-layer copy of a fact** — the live file (or its tombstoned/superseded archive copy), the dual-written scratchpad bullet (per-tier, incl. the local `private.md`), the committed `DECISIONS.md` journal entry, the INDEX + search index — replacing each occurrence with `[redacted: <reason> <date>]`. When the secret was in the **title**, the fact's *filename* (title-derived slug) carries it too — the live file is renamed to the scrubbed title's slug, and slug residues are scrubbed from the audit log (JSON-aware, so quoted/escaped forms are caught). The fact itself survives; a secret-free audit entry records the redaction. Idempotent, per-fact (occurrences of the same pattern in *other* facts, journal entries, or scratchpad lines are reported, never silently scrubbed). CLI-only — deliberately not an MCP tool.

- `--pattern <text>` — the literal secret text to scrub (treated as a literal, never a regex).
- `--reason <text>` — recorded in the marker + audit entry (default: `compliance`).

**Git history is not touched** — on the committed project tier the command prints the honest advisory: rotate the secret first (history copies in clones/forks/CI caches are compromised regardless), then the span-level `git filter-repo --replace-text` recipe if your team decides to redact history as a documented one-time operation (see [SECURITY.md](../SECURITY.md)). The kit never runs it for you. On the user/local tiers (not committed) a shorter rotate-anyway note prints instead.

### `cmk purge --hard <id> --yes [--project <dir>]`

The **irreversible** whole-fact delete (Task 96, ADR-0022): removes the fact from live + every archive copy (tombstones, superseded) + scratchpad bullets + its `DECISIONS.md` journal entry + indexes, keeping **no tombstone** — the compliance escalation beyond `cmk forget` (which tombstones recoverably). Requires BOTH `--hard` and `--yes`; explicit-human-only, never an MCP tool (§6.5). A secret-free audit entry survives (removed filenames are scrubbed from historical audit entries — a secret-titled fact's filename is itself a leak); the git-history advisory prints path-scoped to exactly the purged file(s).

### `cmk lessons promote <id> [--to <file>] [--section <name>]`

Promote a project-tier fact to the cross-project user tier. By default the fact is **topic-routed by content** — an identity/preference lands in `USER.md`, a working-style rule in `HABITS.md`, a cross-project lesson in `LESSONS.md` — so promotes spread across the persona instead of piling into one section. (Offline + deterministic; no LLM call.)

- `--to <USER.md|HABITS.md|LESSONS.md>` — force the target file (overrides the router).
- `--section <name>` — force the landing section. With `--to`, it's that file's section; **without `--to`, the section applies to the routed file** (so an unusual `--section X` with no `--to` can create section `X` inside whichever file the content routes to).

### `cmk persona generate`

Synthesize your **cross-project doctrine** ("how you work everywhere") from this project's captured facts right now, instead of waiting for the weekly pass: high-confidence doctrine auto-promotes into the user tier (`~/.core-memory-kit/`), and lower-confidence candidates are saved to `queues/persona-review.md`. A manual trigger for the pipeline `weekly-curate` runs automatically.

### `cmk persona export <file>` · `cmk persona import <file>`

Carry your cross-project persona across **your own machines**. Two scopes, two transports: *project* memory follows the repo (committed git), but your *persona* (the user tier) follows the **human** — it's machine-local and deliberately kept out of any project, so committing your working-style never leaks it to teammates.

- **`export <file>`** bundles the user tier (the `USER`/`HABITS`/`LESSONS` scratchpads + the `fragments/` fact store + `settings.json` + `queues/`) into one OS-agnostic JSON file. Runtime state (`.locks/`, the `.index/` cache) is never bundled, and the content is already home-path-sanitized + secret-screened at capture time, so the bundle carries no machine paths or usernames.
- **`import <file>`** applies a bundle to this machine's user tier. It **overwrites** (the explicit primitive has no merge), but it backs up any file it replaces to `.import-backups/<timestamp>/` first and is **transactional** — a mid-import failure rolls back fully, never leaving a half-applied persona. It then rebuilds the user-tier search index.

Carry the file via your own private channel (USB / a private git repo / Dropbox). A seamless auto-syncing variant (`cmk persona sync <your-private-git-url>`) is planned. Honors `MEMORY_KIT_USER_DIR` if you point the user tier at a synced folder.

### `cmk stats memory-health [--window <days>]`

The memory PROCESS behavioral dashboard (Task 212 — AutoMem's indicator set). Aggregates logs the kit already writes (recall.log / audit.log / truncation.log) into five metrics with trend arrows vs the prior window: **writes-per-search** (falling = healthier consult-before-write), **empty-search rate** (with the recovered-by-retry split), **redundant-write rate** (writes that later dedup-merged / conflict-queued / superseded), **repeated identical searches** (the "stuck" signal), and **snapshot cap pressure** (truncations + dropped sections). REPORT-ONLY — no thresholds, no pass/fail, no exit-code effect (observe before alarming); these are also the tuning numbers for the outcome-learning search blend. `--window 7|30` (default 7). Content quality (stale facts, duplicates, pending queues) lives in `cmk doctor`, not here.

### `cmk queue review` · `cmk queue conflicts` · `cmk queue prune`

Walk pending items interactively. `review` = medium-trust auto-extracts (promote/discard/skip). `conflicts` = contradictions vs. existing high-trust facts (keep-old/keep-new/merge-both/skip). `prune` = **survival-gate candidates** (Task 194): facts whose evolved `trust_score` sat at the floor and *still* took a failing outcome signal — the learn-loop's "this memory keeps not working" verdict, surfaced for YOUR decision, never auto-deleted. Options: `convert` (retain it as a typed **anti-pattern** — reframed `⚠️ AVOID …`, kept searchable + injected as a warning), `forget` (tombstone through the safe path), `keep` (you vouch for it — dismissed, never re-asked), `skip`. Candidates arrive automatically (no command needed); this verb is only the resolution step.

---

## Import & transcripts

### `cmk import-sessions [flags]`

**Bootstrap the memory from your EXISTING Claude Code history** — so day one isn't empty (the v0.6.0 headline). Discovers past sessions under `~/.claude/projects/<slug>/`, summarizes each one through your agent backend into the kit's dated day-file shape ("as if captured live"), and lands them in `context/sessions/` — searchable immediately via `cmk search`. Every imported write is **screened** (secret screen + PII mask + a privacy instruction in the summarize call) before anything touches a committed tier; raw extracted transcripts archive to the local-only `context/transcripts/imported/` floor for deep recall.

- `--slug <slug>` · `--all-projects` · `--since <YYYY-MM-DD>` · `--max <n>` (default 50 newest) · `--all` (no cap) · `--dry-run` (preview + cost heads-up) · `--yes` (skip the confirmation; required non-interactively).
- **Resumable + idempotent**: each session persists as it completes; the committed `context/sessions/imported-sessions.md` ledger is the resume point, so a killed run keeps its progress and a re-run imports only NEW sessions. With a partial import (`--max`), each re-run progressively backfills the next N newest not-yet-imported sessions; a fully-imported corpus is a no-op.
- `cmk install` detects existing history and offers this automatically (one question, default-skip).

### `cmk import-anthropic-memory [--dry-run] [--yes]`

Merge useful bullets from Anthropic's native auto-memory into the project MEMORY.md. `--dry-run` previews; `--yes` applies.

### `cmk import-claude-md [file] [--dry-run] [--yes]`

Onboard from the rules file you already own: parse an existing `CLAUDE.md` (default), `.cursorrules`, `AGENTS.md`, or any rules file into **typed granular facts** (`user` / `feedback` / `project` / `reference`, inferred from the nearest heading). Every candidate goes through the kit's safe write path — Poison_Guard secret screening, home-path sanitization, dedup against existing memory — and lands with `write_source: imported`, `trust: medium`, and real `source_file` / `source_line` provenance. Code fences and the kit's own managed CLAUDE.md block are never imported. `--dry-run` previews the typed proposals; apply requires explicit `--yes`.

### `cmk disable-native-memory` · `cmk enable-native-memory`

Opt this project out of (or back into) Claude Code's **native** Auto Memory. `disable` writes `autoMemoryEnabled: false` into the committable `.claude/settings.json` (travels with `git clone`) so only the kit's memory runs — avoids the context bloat of both layers injecting at session start. The kit coexists with native memory by default; this is the one-command opt-out (ADR-0011). `enable` reverses it.

### `cmk transcripts extract [flags]`

Extract clean markdown transcripts from `~/.claude/projects/<slug>/<uuid>.jsonl`.
- `--session <uuid-suffix>` · `--slug <slug>` · `--since <YYYY-MM-DD>` · `--output <dir>` · `--include-thinking`.

---

## Advanced

### `cmk mcp serve`

Run the MCP server over stdio (invoked by Claude Code, not by humans) — exposes memory as the **12** `mcp__cmk__*` tools: read — `mk_search`, `mk_get`, `mk_timeline`, `mk_expand`, `mk_cite`, `mk_recent_activity`; write/mutate — `mk_remember`, `mk_trust`, `mk_lessons_promote`, `mk_forget`, `mk_queue_list`, `mk_queue_resolve`. See [`MCP.md`](MCP.md) for the full reference.

### `cmk version` / `cmk --version`

Print the installed kit version.

---

## Hook bins (not run by hand)

`cmk-inject-context` (SessionStart), `cmk-capture-prompt` (UserPromptSubmit), `cmk-observe-edit` (PostToolUse), `cmk-capture-turn` (Stop), `cmk-compress-session` (SessionEnd) — wired into `.claude/settings.json` by `cmk install`; Claude Code invokes them automatically.
