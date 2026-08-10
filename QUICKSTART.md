# core-memory-kit — Quickstart

A 5-minute walkthrough from zero to a working kit on your first project.

## Prerequisites

- Node 22 or later (`node --version`)
- A git repo to install into (the kit's `context/` lives inside)
- **Your agent's command-line tool on PATH** — separate from the IDE:
  - **Claude Code** → `claude` (`claude --version`)
  - **Kiro** → `kiro-cli` (required even if you use the Kiro IDE)
  - **Cursor** → `cursor-agent` (Cursor's CLI, in addition to the app)
  - **Codex** → `codex` (`npm i -g @openai/codex`; required even if you use the Codex desktop app)

> The agent CLI is what the kit's **automatic** features (compression, the
> cross-project persona/wedge, auto-extract, the temporal sweep) use to run an
> LLM in the background. Without it, capture / search / recall / the delete-guard
> still work (pure files + SQLite) — but the automatic LLM steps are skipped.
> `cmk doctor` tells you if your agent's CLI is missing. See the
> [README Quickstart prerequisite note](README.md#quickstart) for the full table.

(No Python or other runtime needed — keyword search is built in; the Layer-5b semantic backend is not yet shipped.)

## 1. Install — pick ONE route

Each route is complete on its own. **Don't run both** — they wire the same hooks, so doing both would double-wire them.

### Route A — npm (recommended)

```bash
npm install -g @lh8ppl/core-memory-kit
cmk --version          # should print the current version (e.g. 0.5.x)
```

This installs the `cmk` CLI **and** the 5 lifecycle hook bins. The `cmk install` step (§2) then scaffolds `context/` **and** wires those hooks into the project's `.claude/settings.json` — making it a complete entry point. Nothing else to install.

> The bare `npm install -g` adds the CLI + installer; it's the `cmk install` *subcommand* that wires the hooks (mirroring claude-mem's library-vs-installer split). You never need a separate `/plugin` step on this route.

### Route B — Claude Code plugin marketplace

In Claude Code:

```text
/plugin marketplace add LH8PPL/core-memory-kit   # add this repo as a plugin source (once per machine)
/plugin install core-memory-kit                  # install the global machinery — hooks + skills (once per machine)
cd ~/my-project                                    # the project you want memory in — bootstrap scaffolds into the CURRENT dir
/core-memory-kit:bootstrap                        # scaffold this project's context/ memory tree (once per project)
```

Restart Claude Code afterward so the hooks load. The first two commands are **global** (per machine — the plugin sets `${CLAUDE_PLUGIN_ROOT}` and loads `plugin/hooks/hooks.json` plus the `bootstrap` / `memory-write` / `memory-search` / `troubleshooting` skills); `bootstrap` is **per project** (run it again after a `cd` in each project you want memory in). This route does **not** require the npm CLI; add it later (`npm install -g @lh8ppl/core-memory-kit`) only if you want `cmk search` / `cmk doctor` / cron.

## 2. Scaffold the kit into your project (Route A)

```bash
cd ~/my-project
cmk install
```

`cmk install` is idempotent — re-running on an existing kit-enabled project is safe. It scaffolds `context/`, updates `.gitignore`, drops the CLAUDE.md loader block, wires the hooks into `.claude/settings.json`, and **refreshes the kit's scaffolded skills to your installed version** (kit-owned files update on re-install; your memory in `context/` is never overwritten). Restart Claude Code afterward so the new hooks load. Use `cmk install --no-hooks` for a scaffold-only install (e.g. if you wire hooks another way).

What it creates:

- `context/MEMORY.md` — the bounded scratchpad (loaded at session start)
- `context/SOUL.md` — agent disposition (loaded at session start)
- `context/memory/INDEX.md` — pointer index for granular fact files
- `context/sessions/` — session log staging area (now.md, today-*.md, recent.md, archive.md)
- `context/transcripts/` — full session transcripts (Stop-hook captures)
- `context/.locks/` — kit-internal lock files + audit log

Plus `.gitignore` updates so `context.local/` and `context/.index/` (regenerable) don't get committed.

## 3. Verify the install

```bash
cmk doctor
```

You'll see something like:

```text
[FAIL] HC-1: Stop + SessionStart hooks registered
         missing hook references: SessionStart.cmk-inject-context, Stop.cmk-capture-turn, SessionEnd.cmk-compress-session, PreCompact.cmk-precompact
         → repair: cmk repair --hooks
[SKIP] HC-2: Daily distill is fresh (≤2 days)
         context/sessions/recent.md missing — distill never ran
[SKIP] HC-3: Transcripts firing (≤3 days)
         ...
```

That's expected on a fresh install — `cmk doctor` reports SKIP for the not-yet-applicable checks until you've held at least one session in Claude Code. Run the repair command for HC-1:

```bash
cmk repair --hooks
```

This writes the kit's canonical hooks into `<repo>/.claude/settings.json`. Re-run `cmk doctor` — HC-2 should now PASS.

## 4. Register the cron jobs (optional but recommended)

```bash
cmk register-crons
```

This registers two jobs with your OS scheduler:

- **daily-distill** at 23:00 daily (compresses today's sessions into a rolling window)
- **weekly-curate** on Sundays at 09:00 (archives old sessions, dedups bullets)

`--dry-run` previews the commands; `--unregister` removes both entries.

If you can't run cron (corporate Windows without Task Scheduler access, restricted CI runners), the kit falls back to lazy-on-read compression triggered by the SessionStart hook. No manual action needed — just skip this step.

## 5. Open a session in Claude Code

Open Claude Code on the project. The SessionStart hook fires; you'll see the kit's snapshot in the conversation context. Have a real conversation — make a decision, set a preference, learn something about your environment.

When you end the conversation (Stop hook fires), the auto-extract subagent reads the turn and silently writes durable facts to `context/MEMORY.md`. No manual action needed.

## 6. Open a second session — verify memory persists

Open Claude Code on the same project again. The SessionStart hook injects the updated MEMORY.md. Ask Claude something that depends on the prior session's context (e.g., "what did we decide about X yesterday?"). Claude answers from the snapshot, not from re-asking you.

## 7. Search accumulated memory

```bash
cmk search "X decision"
```

By default, this runs keyword search via SQLite + FTS5 (Layer 5a). Semantic + hybrid modes (Layer 5b) are not yet shipped:

```bash
cmk search "X decision" --mode hybrid   # errors until the Layer-5b backend ships
```

Hybrid will fuse keyword + semantic (RRF) once the Layer-5b backend lands.

## 8. Common commands

| Command | Purpose |
| --- | --- |
| `cmk tour` | A guided tour of YOUR memory — what's captured, where it lives, how to recall it |
| `cmk doctor` | Full health check (HC-1..HC-16) |
| `cmk search "<query>"` | Search memory (default keyword) |
| `cmk roll --scope now\|today\|recent` | Manually trigger compression |
| `cmk repair --hooks\|--locks\|--index\|--all` | Idempotent self-repair |
| `cmk forget <id>` | Tombstone a fact (preserves audit trail) |
| `cmk import-sessions --dry-run` | Preview bootstrapping memory from your existing Claude Code history (day one isn't empty — `cmk install` also offers this when it detects history) |
| `cmk import-anthropic-memory --dry-run` | Preview merging Anthropic's native auto-memory |

Full reference: `cmk --help`.

## 9. Updating to a new version

Updating is **two parts** on both routes: update the machinery, then re-stamp each project's scaffold. `cmk doctor`'s **HC-9** check tells you when a project is behind your installed `cmk`, so the per-project step is never silently forgotten.

**Route A — npm:**

```bash
# Windows: close Claude Code first. Its MCP servers hold native DLLs (vec0.dll,
# better_sqlite3.node) and npm can't overwrite a loaded file → EBUSY. macOS/Linux: skip.
npm install -g @lh8ppl/core-memory-kit@latest   # 1. update the global cmk CLI
cd ~/my-project
cmk install                                        # 2. re-stamp THIS project (per project)
cmk doctor                                          # 3. verify (HC-9 = pass), then restart Claude Code
```

Updating the npm package **alone** does not update a project: the committed `context/`, the CLAUDE.md managed block, the hooks, and the skills all carry a `:start vX` version marker that only `cmk install` refreshes. Run it in each project you use the kit in — `cmk doctor` (HC-9) flags any that lag.

If you forget the close-first step and the upgrade half-breaks (the symptom: any `cmk` command crashing with a module-not-found error), `cmk` now detects it and prints the exact 2-step recovery instead of a raw stack — so a broken upgrade is self-explaining and one command from fixed. (A plain project `cmk install` never trips this — only the `npm install -g` global upgrade can, and only if a kit MCP server holds the DLL lock at that moment; the servers reconnect automatically on the next tool call.)

**Route B — Claude Code plugin** (inside Claude Code):

```text
/plugin marketplace update core-memory-kit   # 1. refresh available versions
/plugin update core-memory-kit               # 2. update the plugin (new hooks + skills)
/reload-plugins                                # 3. apply it (hooks keep the OLD version until reload)
cd ~/my-project
/core-memory-kit:bootstrap                    # 4. re-scaffold THIS project (per project)
```

The kit's marketplace is third-party, so Claude Code does **not** auto-update it — you refresh manually with `/plugin marketplace update`. As on the npm route, `/plugin update` refreshes the global machinery but not a project's scaffold, so re-run `bootstrap` per project (the plugin-path equivalent of `cmk install`).

> **EBUSY on update (Windows):** if `npm install -g` fails with `EBUSY: resource busy or locked` on `vec0.dll` / `better_sqlite3.node`, Claude Code (or its MCP servers) is still running and holding those files. Close Claude Code fully and retry.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `cmk: command not found` | Global install not on PATH | `npm install -g @lh8ppl/core-memory-kit` (re-run); check `npm config get prefix` is on PATH |
| `cmk doctor` shows HC-2 FAIL after install | Settings.json missing kit hooks | `cmk repair --hooks` |
| `cmk doctor` shows HC-4 FAIL ("transcripts not firing") | Project not Claude Code's primary cwd | Reopen the project as primary cwd |
| `cmk search` returns no results | Index never built | `cmk reindex --full` |
| `cmk register-crons` errors on Windows | Task Scheduler permission denied | Run from elevated PowerShell, or use lazy-fallback (skip cron registration entirely) |
| MEMORY.md keeps growing past 2500 chars | Auto-extract not pruning | `cmk roll --scope today` to trigger consolidation |

For complex issues, see [HEALTH-CHECKS.md](HEALTH-CHECKS.md) for per-HC repair paths, and [`docs/journey/build-log.md`](docs/journey/build-log.md) for the build's accumulated lessons.

## Next steps

- Read [README.md](README.md) for the architectural overview
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for the data-flow diagram
- Read [`specs/design.md`](specs/design.md) for the full design
- (Semantic search — Layer 5b — is a future release; keyword search works today with no extra install)
