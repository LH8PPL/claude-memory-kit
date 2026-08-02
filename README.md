<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/public/assets/wordmark-dark.svg">
    <img src="docs/public/assets/wordmark.svg" alt="core-memory-kit" width="340">
  </picture>
</p>

<p align="center">
  <strong>Persistent, per-project memory — plain markdown, committed with your code, recalled by meaning.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lh8ppl/core-memory-kit"><img src="https://img.shields.io/npm/v/@lh8ppl/core-memory-kit?label=npm&color=blue" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow" alt="License: MIT"></a>
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

## How it feels

You open Claude Code on a project you haven't touched in weeks. Before you say anything, Claude already knows your stack, your conventions, and what you decided last time:

```
core-memory-kit: 23 fact(s) in context, 2 captured in the last 24h, 1 conflict pending · snapshot 4812 B
```

You work. It learns — automatically, no buttons. Next session, it remembers this one too.

## Features

- **Remembers across sessions** — a frozen snapshot of your project + persona injects once at session start, so Claude leads with what it knows instead of re-deriving it from code.
- **Tells live knowledge from finished work** — the injected snapshot labels its in-flight sections (`Active Threads`, `Pending Decisions`) as work-state-as-last-captured, so an agent resuming your project won't re-run a task that already shipped. Durable facts keep their full authority.
- **Starts with a memory, not from zero** — `cmk import-sessions` bootstraps the memory from your **existing** Claude Code history: past sessions are summarized into dated memory ("as if captured live"), screened for secrets/PII before anything lands in a committed file, and searchable immediately. `cmk install` detects existing history and offers it (one question, default-skip). Resumable — a killed run keeps its progress, and a re-run imports only new sessions.
- **Captures automatically, prompt-free** — a background pass reads each turn and saves durable facts as searchable notes. No "save" button. When you *do* say "remember this," the kit auto-approves its **own** tools and skills so the save happens with no "Allow?" prompt — nothing else is touched.
- **Keeps capturing even when the extractor fails** — if the background pass times out or errors, capture doesn't silently drop the turn: a deterministic no-LLM fallback keeps your durable statements, routed through the normal review queue and tagged with its own provenance so a heuristic capture is never mistaken for a real one. Memory degrades to *partial*, never to nothing.
- **Fills in the days it missed, from your git history** — if a session crashed, a hook misfired, or you spent the day in another tool and only committed, that day had work but no memory of it. Measured on this repo, that was **37% of working days**. The kit now notices those gaps and rebuilds a short log of what you did from that day's commits — **automatically, on the nightly pass, no command to remember**. A reconstruction is marked as one rather than passed off as a captured session, and a real session log is never overwritten. `cmk backfill --dry-run` shows the gaps if you want to look first.
- **Survives a long session, not just a clean exit** — when the agent compacts its context mid-session (the marathon case), the kit rolls the session buffer right then. Until now the roll had only two triggers, and neither fires *during* a session: a clean window-close (which a long session often never gets) and the *next* session's start (too late to help this one). Nothing was ever lost — the buffer is on disk from the first turn — but it could sit unconsolidated for days. The compaction handler gates in milliseconds and hands the work to a background pass, so your compaction never waits on memory.
- **Recalls by meaning** — ask in your own words ("where do credentials go") and get the right fact even with zero keyword overlap. Fully local, zero API calls — **R@5 0.941 / paraphrase 1.000** ([benchmarks](#benchmarks)). And a hit isn't a dead end: `cmk expand` returns the **neighborhood** around it (the rest of its section in the source file) — the recall ladder's middle rung between a search hit and a raw-transcript drill.
- **Learns how you work, everywhere** — state a habit once ("always use uv, never pip") and a brand-new project cold-opens already knowing it.
- **Learns from outcomes — memory that keeps working ranks higher** — the kit watches what happens *after* a memory is recalled (a failing command, you correcting the agent, the same question re-asked) and adjusts each fact's utility score. Once a fact has real evidence (3+ outcome signals), search ranking blends it in: a fact that keeps failing sinks below a healthy one for the same query — automatically, no command. A fact that's floored and *still* failing is never silently deleted: it lands in a review queue (`cmk queue prune`) where you choose — **convert** it into a `⚠️ AVOID` anti-pattern warning (kept + injected, so the mistake isn't re-derived), forget it, or vouch for it. Judgments never auto-rank, and the session-start snapshot is untouched. And the whole process is **observable**: `cmk stats memory-health` reports writes-per-search, empty-search rate, redundant writes, and snapshot pressure with week-over-week trend arrows — so you can see the memory getting healthier (or tell when it isn't).
- **Stays TRUE as it ages, not just stored** — facts carry a temporal shape ("ongoing state" vs "happened once" vs "planned"), facts with a shelf life expire on their own (`--expires 2026-08-01` → hidden from recall, recoverably archived), and a weekly pass catches state changes: when a newer fact supersedes an older one ("cut-gate in progress" → "published to npm"), the old state's validity window closes so recall answers with the *current* state — history intact, and the next session opens with a one-line note of what was resolved. And history questions *reach* the history: asking "what did we use before X" or "how did Y change" automatically pulls in the expired/superseded facts a normal search hides — each **labeled** (`[superseded — kept for history]` / `[expired]` / `[retracted]`) so the agent never mistakes history for the present; current facts stay unlabeled, zero noise.
- **Stays private + bounded** — secrets are screened before **every** committed-tier write — not just the ones you type, but the LLM-written summaries, transcript promotions, and trust upgrades too — machine paths are abstracted to `~`, and rolling compression keeps memory small as history grows (and the nightly compression is resumable: if it's interrupted at 80%, it keeps the 80% and picks up where it left off, never re-doing finished work). Because `context/` is committed to git, the kit also **screens personal/sensitive content automatically**: a deterministic pass masks emails / phone numbers / your username before anything touches disk, and an async judge catches names, addresses, and health details in prose — so a transcript lands screened, a sensitive fact routes to a gitignored local-only note, and nothing personal reaches a committed file (kill-switch: `privacy.screen: off`).
- **Tells you when it's broken, instead of failing quietly** — memory that silently stops saving is the one failure worth catching, and it used to look exactly like nothing happening. Now the kit records its own failures as it works, and when something is *genuinely* broken it says so on your next prompt — one line, to Claude, naming the problem and the fix. Claude can then load a **troubleshooting skill** that holds the repair steps per failure, and repairs your memory only with your say-so (it rebuilds its own index unasked; anything touching your files or settings is proposed for you to approve). It's quiet by design: a one-off hiccup that recovers on its own never says a word, evidence older than a week is ignored, and the moment the next run succeeds the warning disappears on its own — nothing to dismiss, nothing to reset. If capture is fully down you also get a visible heads-up, because that's the case where silence costs you sessions. `cmk doctor` reports the same thing when you go looking (HC-14).
- **Guards against accidental deletion** — a hook **blocks** a destructive command (`rm`, `git reset --hard`, …) the moment it targets a memory path, before it runs.
- **Rescues memory an older version stranded** — upgrading isn't only forward-looking. If a past version left an orphaned `context/` folder in a subdirectory (a real bug, fixed in v0.6.2 — automatic capture forked a second, unread copy when the agent ran from a subfolder), the next `cmk install` finds it and brings those facts back into your project's memory **with their original ids and dates intact**, skipping anything already there and never resurrecting something you forgot. The old folder is left untouched with a delete command printed for your shell — deleting memory is always your call, never the kit's.
- **Works across your agents** — the same memory brain on **Claude Code**, **[Kiro](https://kiro.dev)** (IDE + `kiro-cli`), **[Cursor](https://cursor.com)**, and **[Codex](https://developers.openai.com/codex)**. A project's `context/` is shared, so memory you build in one is there in the others. The automatic engine runs through *your* agent's own CLI (using the login you already have — no extra API key). You can even **split the brain**: code in one agent, run the frequent background memory work through a *cheaper* one (`cmk install --backend kiro` → keep your premium subscription for coding, run the janitor LLM on `kiro-cli`). `cmk config show` tells you which agent is doing what.
- **Per-project, in your repo** — `context/` lives in your project and travels with `git clone`. Each project keeps its own memory. And when uncommitted memory piles up, Claude offers a **one-tap commit** — you approve, Claude runs the git command; the kit itself never touches git.
- **Lets you SEE your memory — `cmk view`** — one command opens a browser tab on everything the kit has captured: a search box over your facts, each fact's full Why/How with its trust and where it came from, a graph where trust is the colour and supersession is the direction, the health checks, and the decision journal with retracted entries struck through. It's **ephemeral** — it binds a free port on your own machine, serves until you press Ctrl-C, and leaves no background service running. It's **read-only, structurally**: there is no write route to attack or misclick, so changing something means copying the `cmk forget` / `cmk trust` command the page shows you and running it in your shell. And it never leaves your machine: it binds `127.0.0.1`, refuses any other address (it serves your memory with no password — so there is no "expose it" mode), and works with no network at all. The same URLs answer JSON, so it doubles as a local read API.
- **Shows you around** — `cmk tour` (or `/tour` in conversation) walks you through YOUR memory: what's been captured, where it lives, how to get it back — real counts and your own fact titles, never invented examples.

## Quickstart

> [!IMPORTANT]
> **Prerequisite — the agent's CLI must be installed (not just its IDE).** The kit's automatic features (compression, the cross-project persona/wedge, auto-extract, the temporal sweep) run an LLM through your agent's **command-line tool**, which is a **separate install from the IDE**:
>
> | Agent | The kit needs this CLI on your PATH |
> | --- | --- |
> | **Claude Code** | the `claude` CLI — required even if you use Claude inside VS Code |
> | **Kiro** | `kiro-cli` — required even if you use the Kiro IDE |
> | **Cursor** | `cursor-agent` (Cursor's CLI) — required in addition to the Cursor app; runs natively on **Windows, macOS, and Linux** (install: `curl https://cursor.com/install -fsS \| bash`, or on Windows `irm 'https://cursor.com/install?win32=true' \| iex`), using your Cursor subscription login (no API key) |
> | **Codex** | the `codex` CLI (`npm i -g @openai/codex`) — required even if you use the Codex desktop app (it bundles the binary off-PATH), using your ChatGPT/Codex login (no API key) |
>
> Without the agent's CLI, capture / search / recall / the delete-guard still work (they're pure files + SQLite), but the automatic LLM steps are skipped. `cmk doctor` tells you if your agent's CLI is missing.
>
> **Pick one install route below** — both wire the same hooks and are complete on their own.

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

**Kiro** (IDE + `kiro-cli` — see [docs/KIRO.md](docs/KIRO.md)):

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

Full walkthrough: **[QUICKSTART.md](QUICKSTART.md)**. Both routes are verified on Windows / macOS / Linux in CI.

> [!NOTE]
> **Updating** has two parts on both routes: update the machinery, then re-stamp each project (`cmk install` again, or `/core-memory-kit:bootstrap`). `cmk doctor` flags any project that's behind so you don't have to remember. Full steps in [QUICKSTART.md](QUICKSTART.md).

## How it works

`context/` is the source of truth — plain markdown, committed with your code. A regenerable SQLite + FTS5 index (plus an optional local embedder) powers search. Memory lives in three tiers:

| Tier | Location | Scope | What lives here |
| --- | --- | --- | --- |
| **Project** | `<repo>/context/` | committed — travels with `clone` | Decisions, conventions, file purposes |
| **Local** | `<repo>/context.local/` | gitignored, per-machine | Machine paths, local tool versions |
| **User** | `~/.core-memory-kit/` | cross-project, per-person | Persona, cross-project lessons |

Project memory follows the **repo** (teammates get it on clone). Your persona follows **you** — machine-local, never committed, so your working style never leaks to everyone who clones. Carry it between your own machines with `cmk persona export` / `import`.

The kit is built in six layers (in-repo storage → granular archive → bounded scratchpads → auto-extract hooks → search → compression). See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the breakdown + data-flow diagram, [`specs/design.md`](specs/design.md) for the full design, and [`specs/glossary.md`](specs/glossary.md) for terminology.

### Browse it in Obsidian

Your memory is plain markdown, so [Obsidian](https://obsidian.md) opens `context/memory/` as a vault — search, backlinks, and a graph view of your facts, no export step. Browsing is free and safe; keep *writing* through the kit (`cmk remember` / your agent) so secret-screening, path-abstraction, and the audit trail stay intact. Walkthrough: **[docs/OBSIDIAN.md](docs/OBSIDIAN.md)**.

### The four memory types, in kit terms

If you know the standard agent-memory taxonomy (working / semantic / episodic / procedural), the kit implements all four:

| Memory type | What it holds | Where the kit keeps it |
| --- | --- | --- |
| **Working** | the current session's live state | `MEMORY.md` scratchpad + `sessions/now.md` (bounded, cap-managed) |
| **Semantic** | durable facts — decisions, preferences, config | the fact archive `context/memory/` + `USER.md` (typed, with Why/How) |
| **Episodic** | what happened, when | the rolling session window (`today-*` → `recent` → `archive`) + verbatim transcripts |
| **Procedural** | how to work — habits, lessons, judgment | `HABITS.md` / `LESSONS.md` + judgment records + the scaffolded skills |

And the taxonomy's classic pitfalls each have a built-in answer: *re-asking* (over-trimmed working memory) → load-caps with **graduation, not truncation**; *contradictory retrieval* (facts and events in one undifferentiated store) → facts and session logs are **separate stores**, and non-current facts come back labeled (`[superseded]` / `[expired]`); *corrupted semantic memory* (no write-time validation) → every write passes **dedup + the conflict queue + the Poison_Guard screen**; *procedural memory that never improves* (storing replays, not lessons) → the distill chain keeps **lessons**, and the learn-loop scores what keeps working.

## CLI

You rarely type these yourself — Claude drives the same operations as tools mid-conversation through the kit's MCP server (see **[docs/MCP.md](docs/MCP.md)**). The most-used commands:

| Command | Purpose |
| --- | --- |
| `cmk install [--with-semantic] [--ide claude-code\|kiro\|cursor\|codex]` | Scaffold + wire hooks + register the MCP server (complete entry point) |
| `cmk uninstall [--ide claude-code\|kiro\|cursor\|codex]` | Remove one agent's wiring — conservative, never deletes `context/` |
| `cmk search "<query>" [--mode keyword\|semantic\|hybrid] [--scope facts\|transcripts\|decisions]` | Search memory by meaning; `--scope decisions` recalls how a decision evolved |
| `cmk links <id-or-anchor> [--direction in\|out] [--depth <n>]` | The relational axis — a fact's backlinks (what points AT it), out-links, and full supersession chain (what replaced what); pass an anchor like `D-361` or `ADR-0023` to see which facts cite it |
| `cmk remember "<fact>"` | Capture a fact explicitly (deduped, secret-screened, path-abstracted) |
| `cmk forget <id>` | Tombstone a fact (audit trail preserved) |
| `cmk redact <id> --pattern <secret>` | Compliance scrub: remove a leaked secret from the fact + every archive copy + indexes, audit kept (prints the honest git-history advisory) |
| `cmk purge --hard <id> --yes` | Irreversible whole-fact delete — no tombstone; the compliance escalation beyond `forget` |
| `cmk lessons promote <id>` | Carry one project fact into your cross-project user tier |
| `cmk view [--no-open] [--port <n>]` | Open your memory in a browser — search, fact detail, graph, health, decisions. Read-only, loopback-only, ends with Ctrl-C |
| `cmk doctor` | Run health checks; surface a repair command per failure |

There's more — `cmk register-crons`, `cmk config`, `cmk persona generate/export/import`, `cmk repair`, and the rest. Full reference: **[docs/CLI.md](docs/CLI.md)** or `cmk --help`.

## Working with Kiro

[Kiro](https://kiro.dev) (the AWS agentic IDE + `kiro-cli`) is a first-class target — `cmk install --ide kiro` wires it end-to-end for both the IDE and the terminal, and a project's `context/` is shared with Claude Code. The full setup, surface table, and dual-agent notes are in **[docs/KIRO.md](docs/KIRO.md)**.

## Working with Cursor

[Cursor](https://cursor.com) removed its native Memories feature (2.1.x) — static rules are its only built-in persistence. `cmk install --ide cursor` restores the full automatic loop: recalled memory injects at session start (`sessionStart` → `additional_context`), each turn is captured at `afterAgentResponse`, edits are observed, the delete-guardrail screens shell commands (`beforeShellExecution`), and an always-applied rule (`.cursor/rules/core-memory-kit.mdc`) points the agent at the recall surface. All hooks drive one dispatcher (`cmk cursor-hook`) and are wired into `.cursor/hooks.json` without touching your own hooks. Restart Cursor after install so the hooks load. The full setup, surface table, backend, and dual-agent notes are in **[docs/CURSOR.md](docs/CURSOR.md)**.

## Working with Codex

[Codex](https://developers.openai.com/codex) gets the same automatic loop via its first-class hooks system: `cmk install --ide codex` wires `.codex/hooks.json` (`SessionStart` recall-inject, `UserPromptSubmit` prompt-capture, `Stop` turn-capture read from the session's rollout file, `PostToolUse` edit-observation, `PreToolUse` delete-guardrail), registers the MCP server through Codex's own `codex mcp add` (your `config.toml` is never hand-edited), and drops a managed `AGENTS.md` block. All hooks drive one dispatcher (`cmk codex-hook`). **One-time step:** Codex hash-trusts hooks — run `/hooks` once inside Codex and trust the kit's entries, or the hooks stay silent. The background LLM work runs through `codex exec` (read-only sandbox, your existing ChatGPT/Codex login). Full setup + notes: **[docs/CODEX.md](docs/CODEX.md)**.

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

**Codex:**

```bash
cmk uninstall --ide codex  # remove the kit's hooks.json events + the AGENTS.md block + codex mcp remove
```

On a dual-agent project, uninstall one and the other keeps working. To remove the memory data too, delete `context/` (and `context.local/`) yourself — the kit won't do it for you.

## Benchmarks

Recall quality is **measured, not claimed** — `npm run bench:recall` runs a LongMemEval-style harness through the kit's real write / index / search paths.

| Pipeline | R@5 | Paraphrase recall | API calls |
| --- | --- | --- | --- |
| Keyword (FTS5 one-shot) | 0.176 | 0.000 | 0 |
| Agentic keyword (iterative + LLM reformulation) | 0.529 | 0.300 | 1/query |
| **Semantic (sqlite-vec + local bge-base, the default)** | **0.941** | **1.000** | **0** |

Keyword search structurally misses natural-language questions; the embedded semantic backend closes the paraphrase gap entirely — locally, with no API calls. The model was picked by a measured ladder (the 5×-heavier bge-m3 scored *worse* on short facts): [ADR-0015](docs/adr/0015-semantic-backend-sqlite-vec-plus-local-onnx-embedder.md).

## Security

Every push and PR runs secret scanning (`gitleaks` + GitGuardian), CVE / supply-chain checks (`osv-scanner` + `npm audit` + Dependabot), and SAST (`CodeQL`). Releases publish from CI on a `v*` tag with a **signed npm provenance attestation**. Threat model + disclosure policy: [`SECURITY.md`](SECURITY.md).

```bash
npm view @lh8ppl/core-memory-kit dist.attestations   # verify what you install
```

The **delete-guardrail** (`cmk-guard-memory`) is a `PreToolUse` hook that blocks a destructive command aimed at a memory path before it runs, on both agents. It's **fail-open** (a broken guard never wedges your session) and intentionally broad — a false block is recoverable; a false allow is the data loss it prevents.

> [!NOTE]
> **npm 12 (July 2026)** skips dependency install scripts by default, which can block the native build `better-sqlite3` needs. `cmk install` detects this and offers to fix it inline — or install with `--allow-scripts=better-sqlite3` up front.

## FAQ

<details>
<summary><b>Does this send my code or memory anywhere?</b></summary>

No silent network calls. Your memory is plain markdown stored locally in your repo. The only outbound requests are the Haiku compression / auto-extract calls the kit makes on your behalf (documented), and nothing leaves unless you commit and push it yourself.
</details>

<details>
<summary><b>How is this different from Anthropic's native auto-memory?</b></summary>

They converge on the same granular `<type>_<slug>.md` pattern. The kit adds a three-tier *committed* scope (memory travels with `git clone`), content-addressed citation IDs, a trust hierarchy + conflict queues, provenance on every fact, search, and an MCP server. It also *coexists* with native auto-memory and can import its bullets via `cmk import-anthropic-memory`.
</details>

<details>
<summary><b>How is it different from claude-mem?</b></summary>

claude-mem is global, OS-level memory in an opaque SQLite store. The kit is per-project intent stored as readable markdown committed to your repo — project-scoped + git-portable vs. global + opaque. Both are defensible; pick what fits.
</details>

<details>
<summary><b>What if I can't run cron / a scheduler?</b></summary>

Compression falls back to lazy-on-read at session start, so memory stays bounded without any scheduler. Cron just makes it proactive instead of on-demand.
</details>

<details>
<summary><b>Is my memory portable to a new machine or teammate?</b></summary>

Project memory (`context/`) follows the **repo** — `git clone` brings it, and teammates get it. Your persona (the user tier) follows **you**: machine-local and never committed. Carry it across your own machines with `cmk persona export` / `import` — the bundle is already path-sanitized and secret-screened. Teammates never share a persona; each keeps their own.
</details>

## Health checks

`cmk doctor` runs fourteen checks (HC-1..HC-14), each PASS / WARN / FAIL / SKIP with a repair command — including **HC-9** (flags a project whose scaffold is behind your installed `cmk` — and warns when your installed `cmk` is itself behind the published version), **HC-10** (an informational heads-up if optional scheduled compaction stops firing; memory self-heals each session regardless), **HC-11** (whether your agent's own CLI — `claude` / `kiro-cli` / `cursor-agent` / `codex`, the one that runs the automatic memory engine — is on your PATH; if it's missing, the file-only features keep working and only the automatic LLM steps wait), **HC-13** (an advisory heads-up if an orphaned `context/` folder is sitting in a subdirectory — `cmk install` rescues anything still stranded in it), and **HC-14** (an advisory heads-up if the kit's own health log has active warnings — surfaces the failure codes so you can act on them). Details + recovery paths: **[HEALTH-CHECKS.md](HEALTH-CHECKS.md)**.

## Acknowledgments

See [`docs/SOURCES.md`](docs/SOURCES.md) for the complete index of cited sources and inspirations.
