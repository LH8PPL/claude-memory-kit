<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/LH8PPL/core-memory-kit/main/docs/public/assets/wordmark-dark.svg">
    <img src="https://raw.githubusercontent.com/LH8PPL/core-memory-kit/main/docs/public/assets/wordmark.svg" alt="core-memory-kit" width="340">
  </picture>
</p>

<p align="center">
  <strong>Persistent, per-project memory — plain markdown, committed with your code, recalled by meaning.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lh8ppl/core-memory-kit"><img src="https://img.shields.io/npm/v/@lh8ppl/core-memory-kit?label=npm&color=blue" alt="npm"></a>
  <a href="https://github.com/LH8PPL/core-memory-kit/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-bundled%20%C2%B7%20none%20required-brightgreen" alt="Node.js bundled, none required">
  <a href="https://github.com/LH8PPL/core-memory-kit/actions/workflows/ci.yml"><img src="https://github.com/LH8PPL/core-memory-kit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows-supported-0078D6?logo=windows&logoColor=white" alt="Windows supported">
  <img src="https://img.shields.io/badge/macOS-supported-000000?logo=apple&logoColor=white" alt="macOS supported">
  <img src="https://img.shields.io/badge/Linux-supported-FCC624?logo=linux&logoColor=black" alt="Linux supported">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-supported-6E56CF" alt="Claude Code supported">
  <img src="https://img.shields.io/badge/Kiro-supported-6E56CF" alt="Kiro supported">
  <img src="https://img.shields.io/badge/Cursor-supported-6E56CF" alt="Cursor supported">
  <img src="https://img.shields.io/badge/Codex-supported-6E56CF" alt="Codex supported">
</p>

Claude forgets everything when a session ends — so every new chat you re-explain who you are, what you're building, and how you like things done. **core-memory-kit** fixes that: it quietly captures your decisions, preferences, and project context, then hands them back at the start of every session. Everything is plain text inside your project, and it travels with the code — `git clone` brings the memory along.

> [!NOTE]
> **Not a developer?**<br>
> If you can open a project in Claude Code, you're set — let Claude run the setup for you (see [Quickstart](#quickstart)).

<!-- markdownlint MD028: two separate GitHub alerts, not one split blockquote -->

> [!IMPORTANT]
> **Prerequisite — the agent's CLI must be installed (not just its IDE).** The kit's automatic features (compression, the cross-project persona/wedge, auto-extract, the temporal sweep) run an LLM through your agent's **command-line tool**, which is a **separate install from the IDE**:
>
> | Agent | The kit needs this CLI on your PATH |
> | --- | --- |
> | **Claude Code** | the `claude` CLI — required even if you use Claude inside VS Code |
> | **Kiro** | `kiro-cli` — required even if you use the Kiro IDE |
> | **Cursor** | `cursor-agent` (Cursor's CLI) — required in addition to the Cursor app; runs natively on Windows, macOS, and Linux, using your Cursor subscription login (no API key) |
> | **Codex** | the `codex` CLI (`npm i -g @openai/codex`) — required even if you use the Codex desktop app (it bundles the binary off-PATH), using your ChatGPT/Codex login (no API key) |
>
> Without the agent's CLI, capture / search / recall / the delete-guard still work (they're pure files + SQLite), but the automatic LLM steps are skipped. `cmk doctor` (HC-11) and `cmk install` both tell you if your agent's CLI is missing. You can also route the automatic engine through a *different* agent's CLI than you code in — `cmk install --backend kiro` — see `cmk config show`.

## How it feels

You open Claude Code on a project you haven't touched in weeks. Before you say anything, Claude already knows your stack, your conventions, and what you decided last time:

```
core-memory-kit: 23 fact(s) in context, 2 captured in the last 24h, 1 conflict pending · snapshot 4812 B
```

You work. It learns — automatically, no buttons. Next session, it remembers this one too.

## Features

- **Remembers across sessions** — a frozen snapshot of your project + persona injects once at session start, so Claude leads with what it knows instead of re-deriving it from code.
- **Starts with a memory, not from zero** — `cmk import-sessions` bootstraps the memory from your **existing** Claude Code history: past sessions are summarized into dated memory, screened for secrets/PII before anything lands in a committed file, and searchable immediately. `cmk install` detects existing history and offers it (one question, default-skip). Resumable — a re-run imports only new sessions.
- **Captures automatically, prompt-free** — a background pass reads each turn and saves durable facts as searchable notes. No "save" button. When you *do* say "remember this," the kit auto-approves its **own** tools and skills so the save happens with no "Allow?" prompt — nothing else is touched.
- **Keeps capturing when the extractor fails** — a timed-out or errored background pass no longer drops the turn: a deterministic no-LLM fallback keeps your durable statements, through the normal review queue and tagged with its own provenance. Partial, never nothing.
- **Fills in the days it missed, from your git history** — a crashed session, a misfired hook, or a day spent in another tool leaves commits but no memory of the work (37% of working days, measured on this repo). The nightly pass now rebuilds those days from their commits — automatically, marked as reconstructed, never overwriting a real session log. `cmk backfill --dry-run` lists the gaps.
- **Survives a long session, not just a clean exit** — when the agent compacts its context mid-session, the kit rolls the session buffer right then. The roll previously had only two triggers, neither of which fires *during* a session: a clean window-close (which a marathon session often never gets) and the *next* session's start. Nothing was ever lost — the buffer is on disk from the first turn — but it could sit unconsolidated for days. The handler gates in milliseconds and hands the work to a background pass, so a compaction never waits on memory.
- **Recalls by meaning** — ask in your own words ("where do credentials go") and get the right fact even with zero keyword overlap. Fully local, zero API calls — **R@5 0.941 / paraphrase 1.000** ([benchmarks](#benchmarks)). And a hit isn't a dead end: `cmk expand` returns the **neighborhood** around it — the recall ladder's middle rung between a search hit and a raw-transcript drill.
- **Learns how you work, everywhere** — state a habit once ("always use uv, never pip") and a brand-new project cold-opens already knowing it.
- **Learns from outcomes — memory that keeps working ranks higher** — the kit watches what happens *after* a memory is recalled (a failing command, you correcting the agent, the same question re-asked) and adjusts each fact's utility score. Once a fact has real evidence (3+ outcome signals), search ranking blends it in: a fact that keeps failing sinks below a healthy one for the same query — automatically, no command. A fact that's floored and *still* failing is never silently deleted: it lands in a review queue (`cmk queue prune`) where you choose — **convert** it into a `⚠️ AVOID` anti-pattern warning (kept + injected, so the mistake isn't re-derived), forget it, or vouch for it. Judgments never auto-rank, and the session-start snapshot is untouched. And the whole process is **observable**: `cmk stats memory-health` reports writes-per-search, empty-search rate, redundant writes, and snapshot pressure with week-over-week trend arrows — so you can see the memory getting healthier (or tell when it isn't).
- **Stays TRUE as it ages, not just stored** — facts carry a temporal shape ("ongoing state" vs "happened once" vs "planned"), facts with a shelf life expire on their own (`--expires 2026-08-01` → hidden from recall, recoverably archived), and a weekly pass catches state changes: when a newer fact supersedes an older one ("cut-gate in progress" → "published to npm"), the old state's validity window closes so recall answers with the *current* state — history intact, and the next session opens with a one-line note of what was resolved. And history questions *reach* the history: asking "what did we use before X" or "how did Y change" automatically pulls in the expired/superseded facts a normal search hides — each **labeled** (`[superseded — kept for history]` / `[expired]` / `[retracted]`) so the agent never mistakes history for the present; current facts stay unlabeled, zero noise.
- **Stays private + bounded** — secrets are screened before **every** committed-tier write — not just the ones you type, but the LLM-written summaries, transcript promotions, and trust upgrades too — machine paths are abstracted to `~`, and rolling compression keeps memory small as history grows (and the nightly compression is resumable: interrupted at 80%, it keeps the 80% and picks up where it left off). Because `context/` is committed to git, the kit also **screens personal/sensitive content automatically**: a deterministic pass masks emails / phone numbers / your username before anything touches disk, and an async judge catches names, addresses, and health details in prose — so a transcript lands screened, a sensitive fact routes to a gitignored local-only note, and nothing personal reaches a committed file (kill-switch: `privacy.screen: off`).
- **Tells you when it's broken, instead of failing quietly** — memory that silently stops saving is the one failure worth catching, and it used to look exactly like nothing happening. Now the kit records its own failures as it works, and when something is *genuinely* broken it says so on your next prompt — one line, to Claude, naming the problem and the fix. Claude can then load a **troubleshooting skill** that holds the repair steps per failure, and repairs your memory only with your say-so (it rebuilds its own index unasked; anything touching your files or settings is proposed for you to approve). It's quiet by design: a one-off hiccup that recovers on its own never says a word, evidence older than a week is ignored, and the moment the next run succeeds the warning disappears on its own — nothing to dismiss, nothing to reset. If capture is fully down you also get a visible heads-up, because that's the case where silence costs you sessions. `cmk doctor` reports the same thing when you go looking (HC-14).
- **Lets you SEE your memory — `cmk view`** — one command opens a browser tab on everything the kit has captured: a search box over your facts, each fact's full Why/How with its trust and where it came from, a graph where colour is the cluster a fact belongs to, the rim arc is its trust and an arrow points at what replaced it, the health checks, and the decision journal with retracted entries struck through. Both lists **page** (Previous / Next over a stable sort, with "showing 51–100 of 2,300" between them — real links, so a page you found is a URL you can cite), the journal is **searchable** through the same box, and every search hit shows how strong a match it is. **Ephemeral** — a free port on your own machine, serving until you press Ctrl-C, no background service left behind. **Read-only structurally** — there is no write route to attack or misclick, so changing something means copying the `cmk forget` / `cmk trust` command the page shows you. And it never leaves your machine: `127.0.0.1` only (it serves your memory with no password, so there is no "expose it" mode), fully offline. The same URLs answer JSON, so it doubles as a local read API.
- **Guards against accidental deletion** — a hook **blocks** a destructive command (`rm`, `git reset --hard`, …) the moment it targets a memory path, before it runs.
- **Rescues memory an older version stranded** — if a past version left an orphaned `context/` folder in a subdirectory (a real bug, fixed in v0.6.2), the next `cmk install` brings those facts back into your project's memory with their **original ids and dates intact**, skips anything already there, and leaves the old folder untouched with a delete command printed for your shell — deleting memory is always your call.
- **Works across your agents** — the same memory brain on **Claude Code**, **[Kiro](https://kiro.dev)** (IDE + `kiro-cli`), **[Cursor](https://cursor.com)**, and **[Codex](https://developers.openai.com/codex)**. A project's `context/` is shared, so memory you build in one is there in the others. The automatic engine (compression / auto-extract / persona / temporal sweep) runs through *your* agent's own CLI, using the login you already have — no extra API key. You can even **split the brain**: code in one agent, run the frequent background memory work through a cheaper one (`cmk install --backend kiro` → keep your premium subscription for coding, run the janitor LLM on `kiro-cli`). `cmk config show` tells you which agent is doing what.
- **One-tap memory commits** — when uncommitted memory piles up, Claude offers to commit it; you approve, Claude runs the git command; the kit itself never touches git.
- **Per-project, in your repo** — `context/` lives in your project and travels with `git clone`. Each project keeps its own memory.

## Quickstart

> [!IMPORTANT]
> Pick **one** route — both wire the same hooks and are complete on their own.

### Route A — npm (recommended)

Install the CLI once, then run `cmk install` in each project — pick your agent:

```bash
npm install -g @lh8ppl/core-memory-kit
cd ~/my-project
```

**Claude Code:**

```bash
cmk install                   # scaffold context/ + wire hooks (one step)
cmk install --with-semantic   # optional: local semantic recall (~260 MB, once)
cmk doctor                    # verify, then restart Claude Code
```

**Kiro** (IDE + `kiro-cli` — see [the Kiro guide](https://github.com/LH8PPL/core-memory-kit/blob/main/docs/KIRO.md)):

```bash
cmk install --ide kiro                   # wire Kiro end-to-end
cmk install --ide kiro --with-semantic   # …with local semantic recall
cmk doctor                                # verify, then restart Kiro
```

**Cursor:**

```bash
cmk install --ide cursor                 # wire Cursor end-to-end
cmk install --ide cursor --with-semantic # …with local semantic recall
cmk doctor                                # verify, then restart Cursor
```

**Codex:**

```bash
cmk install --ide codex                  # wire Codex end-to-end
cmk install --ide codex --with-semantic  # …with local semantic recall
cmk doctor                                # verify, then run /hooks once inside Codex to trust the kit's hooks
```

`cmk install` is the whole entry point: it scaffolds `context/`, drops the memory skills, wires the lifecycle hooks, and registers the MCP server so the agent can drive memory as tools — no `/plugin` step needed. A project can carry **both** agents — run both installs; they share one `context/`.

> [!TIP]
> Prefer not to touch the terminal? Open the project in Claude Code and say *"install core-memory-kit and set it up here."* Claude runs the commands; you just approve them. **Restart Claude Code once** afterward (`/exit`, then `claude`) so the hooks load.

### Route B — Claude Code plugin

```text
/plugin marketplace add LH8PPL/core-memory-kit   # add this repo as a plugin source (once per machine)
/plugin install core-memory-kit                  # install hooks + skills (once per machine)
cd ~/my-project
/core-memory-kit:bootstrap                        # scaffold this project's memory (once per project)
```

The plugin bundles the hooks + skills, so it's complete without the npm CLI. Add the CLI later only if you want `cmk search` / `cmk doctor` / cron.

> [!NOTE]
> **Updating** has two parts on both routes: update the machinery, then re-stamp each project (`cmk install` again, or `/core-memory-kit:bootstrap`). `cmk doctor` flags any project that's behind so you don't have to remember.

## How it works

`context/` is the source of truth — plain markdown, committed with your code. A regenerable SQLite + FTS5 index (plus an optional local embedder) powers search. Memory lives in three tiers:

| Tier | Location | Scope | What lives here |
| --- | --- | --- | --- |
| **Project** | `<repo>/context/` | committed — travels with `clone` | Decisions, conventions, file purposes |
| **Local** | `<repo>/context.local/` | gitignored, per-machine | Machine paths, local tool versions |
| **User** | `~/.core-memory-kit/` | cross-project, per-person | Persona, cross-project lessons |

Project memory follows the **repo** (teammates get it on clone). Your persona follows **you** — machine-local, never committed. Carry it between your own machines with `cmk persona export` / `import`.

Because it's plain markdown, you can **browse your memory in [Obsidian](https://obsidian.md)** — open `context/memory/` as a vault for search, backlinks, and a graph of your facts. Browsing is safe; keep writing through the kit so screening and the audit trail stay intact. See [docs/OBSIDIAN.md](https://github.com/LH8PPL/core-memory-kit/blob/main/docs/OBSIDIAN.md).

If you know the standard agent-memory taxonomy, the kit implements all four types: **working** memory = the `MEMORY.md` scratchpad + `now.md` · **semantic** = the typed fact archive (`context/memory/`) + `USER.md` · **episodic** = the rolling session window + verbatim transcripts · **procedural** = `HABITS.md`/`LESSONS.md` + judgment records + the scaffolded skills. The classic pitfalls are answered structurally: caps graduate instead of truncating, facts and events live in separate stores (non-current facts come back labeled), every fact write is validated (dedup + conflict queue + secret screen), and the distill chain keeps lessons — not replays.

## CLI

You rarely type these yourself — Claude drives the same operations as tools mid-conversation through the kit's **MCP server** (full tool reference: **[docs/MCP.md](https://github.com/LH8PPL/core-memory-kit/blob/main/docs/MCP.md)**). The commands:

| Command | Purpose |
| --- | --- |
| `cmk install [--with-semantic] [--ide claude-code\|kiro\|cursor\|codex] [--backend claude\|kiro\|cursor\|codex]` | Scaffold + wire hooks + register the MCP server (complete entry point). `--backend` runs the automatic memory through a *different* agent's CLI than you code in (split-brain) |
| `cmk uninstall [--ide claude-code\|kiro\|cursor\|codex]` | Remove one agent's wiring — conservative, never deletes `context/` |
| `cmk tour` | Walk through YOUR memory — the three tiers, what's actually been captured (real counts + your own fact titles), and how to recall it. Also `/tour` in conversation. |
| `cmk view [--no-open] [--port <n>]` | Open your memory in a browser — search, fact detail, graph, health, decisions. Read-only, loopback-only, ends with Ctrl-C |
| `cmk doctor [--repair] [--yes]` | Run HC-1..HC-16 health checks; surface a repair command per failure (HC-11 = your agent's backend LLM CLI is on PATH — honest degrade if not). `--repair` offers each fix `[y/N]`, default No — deletes and fill-in-the-blank fixes are always printed for you to run yourself, and with no terminal it prints rather than assumes |
| `cmk config get <key>` / `cmk config set <key> <value>` / `cmk config show` | Read/write project settings without hand-editing JSON. `config show` = a one-glance readout of your setup (installed-for agent, active backend agent, backend-CLI presence, semantic mode) |
| `cmk repair --hooks` / `--locks` / `--index` / `--all` | Idempotent self-repair |
| `cmk search "<query>" [--mode keyword\|semantic\|hybrid] [--scope facts\|transcripts\|decisions]` | Search memory by meaning (hybrid default after `--with-semantic`); `--scope transcripts` = raw session record; `--scope decisions` = the decision journal (history / "what did we reject") |
| `cmk remember "<fact>"` | Capture a fact explicitly (deduped, secret-screened, path-abstracted). `--from-file fact.json` for backtick/quote-heavy rich facts |
| `cmk get <id…>` / `cmk timeline <id>` / `cmk cite <id>` / `cmk recent-activity` | Read the index back — full fact bodies + provenance, context around an observation, a citation link, recent changes (the CLI side of the `mk_*` MCP read tools) |
| `cmk links <id-or-anchor> [--direction in\|out\|both] [--depth <n>]` | The relational axis — a fact's backlinks (what points AT it), out-links (`related`/`[[cross-links]]`), and full supersession chain; also accepts an anchor token (`D-361`, `ADR-0023`) → which facts cite it (`mk_links` parity) |
| `cmk forget <id>` | Tombstone a fact — gone from `cmk search` immediately (audit trail preserved) |
| `cmk redact <id> --pattern <secret>` | Compliance scrub: remove a leaked secret from the fact + every archive copy + indexes, audit kept (prints the honest git-history advisory) |
| `cmk purge --hard <id> --yes` | Irreversible whole-fact delete — no tombstone; the compliance escalation beyond `forget` |
| `cmk lessons promote <id> [--to USER.md\|HABITS.md]` | Promote one project fact to your cross-project **user tier** so it applies in **every** project |
| `cmk roll --scope now\|today\|recent` | Manually trigger a compression pipeline |
| `cmk register-crons [--dry-run] [--unregister]` | Register daily + weekly compression jobs (cron / launchd / Task Scheduler) |
| `cmk disable-native-memory` / `enable-native-memory` | Opt out of Claude Code's built-in Auto Memory so the kit is your single, lean layer |
| `cmk persona generate` · `export <file>` · `import <file>` | Synthesize your cross-project persona on demand; carry it to another of **your** machines (private — never committed) |
| `cmk import-claude-md [file]` · `import-anthropic-memory` | Seed memory from an existing `CLAUDE.md` / `.cursorrules` / `AGENTS.md`, or merge Anthropic's native auto-memory bullets (`--dry-run` previews) |

Full reference with examples: **[docs/CLI.md](https://github.com/LH8PPL/core-memory-kit/blob/main/docs/CLI.md)** or `cmk --help`.

## Working with Kiro

[Kiro](https://kiro.dev) (the AWS agentic IDE + `kiro-cli`) is a first-class target — `cmk install --ide kiro` wires it end-to-end for both the IDE and the terminal, and a project's `context/` is shared with Claude Code. The full setup, surface table, and dual-agent notes are in **[the Kiro guide](https://github.com/LH8PPL/core-memory-kit/blob/main/docs/KIRO.md)**.

## Working with Cursor

[Cursor](https://cursor.com) removed its native Memories feature (2.1.x) — static rules are its only built-in persistence. `cmk install --ide cursor` restores the full automatic loop: recalled memory injects at session start, each turn is captured, edits are observed, and the delete-guardrail screens shell commands. All hooks drive one dispatcher (`cmk cursor-hook`) wired into `.cursor/hooks.json` without touching your own hooks, plus an always-applied rule (`.cursor/rules/core-memory-kit.mdc`). Restart Cursor after install so the hooks load. The full setup, surface table, backend, and dual-agent notes are in **[the Cursor guide](https://github.com/LH8PPL/core-memory-kit/blob/main/docs/CURSOR.md)**.

## Uninstalling

`cmk uninstall` is **conservative** — it removes only the kit's managed wiring for one agent and **never deletes your `context/` memory** (your data) or anything outside the kit's markers.

**Claude Code:**

```bash
cmk uninstall              # remove the CLAUDE.md block + hooks
```

**Kiro:**

```bash
cmk uninstall --ide kiro   # remove the .kiro/ blocks + skills + IDE hooks + AGENTS.md + ~/.kiro CLI agent
```

**Cursor:**

```bash
cmk uninstall --ide cursor # remove the kit's hooks.json events + mcp.json entry + .mdc rule
```

On a dual-agent project, uninstall one and the other keeps working. To remove the memory data too, delete `context/` (and `context.local/`) yourself — the kit won't do it for you.

## Benchmarks

Recall quality is **measured, not claimed** — `npm run bench:recall` runs a LongMemEval-style harness through the kit's real write / index / search paths.

| Pipeline | R@5 | Paraphrase recall | API calls |
| --- | --- | --- | --- |
| Keyword (FTS5 one-shot) | 0.176 | 0.000 | 0 |
| Agentic keyword (iterative + LLM reformulation) | 0.529 | 0.300 | 1/query |
| **Semantic (sqlite-vec + local bge-base, the default)** | **0.941** | **1.000** | **0** |

Keyword search structurally misses natural-language questions; the embedded semantic backend closes the paraphrase gap entirely — locally, with no API calls.

## Requirements

- Node.js ≥ 22
- Claude Code (for the hook-driven auto-memory loop) — or [Kiro](https://kiro.dev), or [Cursor](https://cursor.com)
- Optional: `cmk install --with-semantic` for semantic/hybrid recall (installs the local `@huggingface/transformers` embedder, ~260 MB once — no API, no Python)

## Documentation

Full docs, architecture, and design live in the repository:
**<https://github.com/LH8PPL/core-memory-kit>**

## License

MIT © the maintainer
