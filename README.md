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

- **Remembers across sessions** — a frozen snapshot injects at session start, so Claude leads with what it knows.
- **Captures automatically** — a background pass saves durable facts from each turn. No save button, no prompt.
- **Recalls by meaning** — ask in your own words; no keyword overlap needed. Fully local, zero API calls.
- **Learns how you work** — state a habit once, and every new project cold-opens knowing it.
- **Learns from outcomes** — facts that keep failing sink in ranking; you decide whether to keep or prune.
- **Links related facts** — `cmk autolink` proposes up to 3 `related:` edges per fact; opt-in write-time linking does it as you capture.
- **Stays true as it ages** — facts expire, supersede, and keep their history labelled rather than lost.
- **Stays private** — secrets, personal data and machine paths are screened before every committed write.
- **Guards your memory** — destructive commands aimed at a memory path are blocked before they run.
- **Tells you when it is broken** — a real failure surfaces on your next prompt, naming the fix.
- **Lets you SEE your memory** — `cmk view` opens a read-only browser view: search, graph, health, decisions.
- **Works across your agents** — Claude Code, [Kiro](https://kiro.dev), [Cursor](https://cursor.com) and [Codex](https://developers.openai.com/codex) share one project memory.
- **Per-project, in your repo** — `context/` lives in your project and travels with `git clone`.

**[Full feature detail →](docs/FEATURES.md)** — what each one actually does, and why it works that way.

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

`cmk doctor` runs sixteen checks (HC-1..HC-16), each PASS / WARN / FAIL / SKIP with a repair command — including **HC-9** (flags a project whose scaffold is behind your installed `cmk` — and warns when your installed `cmk` is itself behind the published version), **HC-10** (an informational heads-up if optional scheduled compaction stops firing; memory self-heals each session regardless), **HC-11** (whether your agent's own CLI — `claude` / `kiro-cli` / `cursor-agent` / `codex`, the one that runs the automatic memory engine — is on your PATH; if it's missing, the file-only features keep working and only the automatic LLM steps wait), **HC-13** (an advisory heads-up if an orphaned `context/` folder is sitting in a subdirectory — `cmk install` rescues anything still stranded in it), **HC-14** (an advisory heads-up if the kit's own health log has active warnings — surfaces the failure codes so you can act on them), **HC-15** (verifies each fact's semantic vector really is its own — a mis-filed vector makes search return confident answers about the wrong facts, with nothing else to notice it), and **HC-16** (catches a fact that is safely on disk but can never be indexed — so it is invisible to search, the viewer and the graph, with a count off by one as the only clue). Details + recovery paths: **[HEALTH-CHECKS.md](HEALTH-CHECKS.md)**.

## Acknowledgments

See [`docs/SOURCES.md`](docs/SOURCES.md) for the complete index of cited sources and inspirations.
