# Working with Kiro

[Kiro](https://kiro.dev) (the AWS agentic IDE + `kiro-cli`, built on Amazon Q) is a first-class target for core-memory-kit. The memory core — store, search, compression, the three-tier model — is identical to the Claude Code experience; only the per-agent wiring differs. One command wires Kiro for **both** the IDE and the terminal.

```bash
cd ~/my-project
cmk install --with-semantic --ide kiro   # wire Kiro (IDE + kiro-cli) in this project
cmk doctor                                # verify, then RESTART Kiro so the hooks load
```

A Kiro install wires MCP, steering, an `AGENTS.md` instruction file, the memory skills, the IDE + CLI hooks, and the per-agent trust so everything runs prompt-free. It does **not** write Claude-Code-only files (`CLAUDE.md`, `.claude/skills/`) — Kiro reads `AGENTS.md` + steering instead.

The full memory loop — inject, capture, edit-observation, explicit save, and cross-project promotion — is live-proven on **Kiro IDE 1.0** and **kiro-cli V3**.

> **Kiro IDE 1.0 note (why capture reads the transcript, not the prompt hook).** On Kiro IDE 1.0 the `USER_PROMPT` hook variable arrives empty (a Kiro-side regression — their open issues [#9619](https://github.com/kirodotdev/Kiro/issues/9619) / [#6188](https://github.com/kirodotdev/Kiro/issues/6188)), so the kit does **not** rely on it to capture your turn. The turn-end (`Stop`) hook recovers your prompt directly from Kiro's own session transcript, which is reliable — so automatic fact-extraction sees what you *say*, not only what the assistant does. You don't need to do anything; this is just why the capture path looks the way it does.

## What `--ide kiro` writes

| Surface | Location | For |
| --- | --- | --- |
| **MCP server** | `.kiro/settings/mcp.json` (with `autoApprove`) | the **IDE** — drives memory as tools (`mk_remember` etc.), pre-approved so they run prompt-free |
| **Steering** | `.kiro/steering/cmk.md` (`inclusion: always`) | both — memory-awareness in context |
| **Tour** | `.kiro/steering/tour.md` (`inclusion: manual` — surfaces as an on-demand slash command) | both — the `cmk tour` onboarding walkthrough, in-conversation (Task 175) |
| **AGENTS.md** | `<repo>/AGENTS.md` | both — Kiro's always-loaded instruction file |
| **Skills** | `.kiro/skills/memory-search` + `memory-write` + `troubleshooting` | both |
| **IDE hooks** | `.kiro/hooks/cmk-{capture,inject,guard,observe}.json` (Kiro IDE 1.0+ v1 format) + legacy `cmk-{capture,inject}.kiro.hook` (older Kiro) | the **GUI** — recall + capture + a delete-guard (`PreToolUse`) + large-edit observation (`PostToolUse`) |
| **CLI agent** | `~/.kiro/agents/cmk.json` + a `chat.defaultAgent` pointer in `~/.kiro/settings/cli.json` | **`kiro-cli`** — `agentSpawn`/`stop`/`userPromptSubmit`/`postToolUse` hooks (auto inject + capture + prompt-capture + large-edit observation) + the `cmk remember`/`cmk search` shell commands for explicit memory (`tools: ['*']` enables them; no MCP, so no console-window popup) |
| **Trusted commands** | `.vscode/settings.json` (`kiroAgent.trustedCommands`) + the CLI agent's `allowedCommands` (`cmk hook *`, `cmk-guard-memory`, `cmk remember`, `cmk search`) | both — auto-approve the kit's commands (no per-turn "Run / Reject") |
| **Auto-approved MCP tools** | `autoApprove` in `mcp.json` | the **IDE** — the kit's 12 memory tools run without a per-call "Reject / Trust / Run" (kiro-cli uses the shell commands instead) |
| **Workspace permissions** (Kiro IDE 1.0+) | `~/.kiro/workspace-roots/<hash>/permissions.yaml` | the **IDE 1.0** — pre-trusts the kit's hooks, 13 MCP tools, and its three skills so even the first "Load skill: memory-write" runs with **no Allow prompt** (Kiro 1.0's per-workspace trust store) |

## Notes

- **Restart Kiro** to activate the hooks; steering / skills / MCP are immediate.
- The kit **pre-trusts only its own hook commands** (`cmk hook *`, `cmk-guard-memory`) so they run silently — Kiro normally asks you to approve each hook command, which would prompt every turn. Your own trusted commands are preserved; the kit never adds a blanket wildcard.
- The CLI agent registers as Kiro's **default agent** so its hooks auto-fire — but **guarded**: if you already have a default agent, the kit installs a named `cmk` agent instead and prints how to opt in (`kiro-cli agent set-default cmk`, or trust the kit's tools for a session with `/tools trust @cmk`).
- **The one-time "Trust?" prompt on kiro-cli (only if you kept your own default agent).** When the `cmk` agent is active (the default case), explicit memory runs through pre-trusted `cmk` *shell commands* — no prompt. But if you kept your **own** default agent, an explicit MCP save (`mk_remember`) may ask you to approve it **once per session**. This is **intended Kiro CLI behavior, not a kit bug**: kiro-cli deliberately ignores `mcp.json`'s `autoApprove` (that field is IDE-only — [Kiro issue #4672](https://github.com/kirodotdev/Kiro/issues/4672)), and there is no way to pre-trust tools for a *built-in default* agent you didn't author ([#4384](https://github.com/kirodotdev/Kiro/issues/4384)). Automatic **capture** is unaffected — it always fires. To make explicit saves prompt-free too: run `kiro-cli agent set-default cmk` (or `/tools trust @cmk` per session), or just click **"Trust, always allow in this session"** the first time.
- A Kiro install does **not** write Claude-Code-only files (`CLAUDE.md`, `.claude/skills/`) — Kiro reads `AGENTS.md` + steering instead.
- The hook command is platform-correct (`cmd.exe /c cmk hook …` on Windows, where Kiro routes hooks through WSL).

## kiro-cli as the automatic-memory backend (v0.4.5+)

Beyond wiring the hooks, `kiro-cli` is also the **LLM backend** for a Kiro project's automatic memory. The kit's automatic features — compression, auto-extract, the cross-project persona/wedge, the temporal sweep, daily/weekly distillation — need to run an LLM in the background, and on a Kiro install they run it through **`kiro-cli chat`**, using your existing Kiro/Google login (**no API key, no Claude Code required**). This is what makes the kit work for a Kiro-only user.

- **Prerequisite:** `kiro-cli` must be on your PATH (it's a separate install from the Kiro IDE). Without it, capture / search / recall / the delete-guard still work (they're pure files + SQLite), but the automatic LLM steps are skipped. **`cmk doctor` (HC-11)** and **`cmk install`** both tell you if it's missing.
- **Split-brain (run the memory on a *different* agent than you code in):** if you code in Kiro but want the frequent background memory work to run through a different CLI you have — or vice versa — set it at install (`cmk install --ide kiro --backend cursor`) or after (`cmk config set backend.agent cursor`). Both write the same `backend.agent` key.
- **See what's active:** `cmk config show` prints your installed-for agent, the active backend agent (and whether it's an override), the backend-CLI presence, and the semantic mode.

Cross-agent siblings: **[Cursor](CURSOR.md)** · **[Claude Code](CLAUDE-CODE.md)** · **[Codex](CODEX.md)**.

## Using both Claude Code and Kiro on the same repo

The installs are additive — run both (`cmk install` and `cmk install --ide kiro`), in any order. Each writes only its own wiring and never clobbers the other's; they share one `context/` memory brain. `--with-semantic` set by either is preserved by the other.

## Uninstalling Kiro

```bash
cmk uninstall --ide kiro   # remove the Kiro surface (.kiro/ blocks + skills + IDE hooks + AGENTS.md block + the ~/.kiro CLI agent + the kit's permissions.yaml rules)
```

On a dual-agent project, uninstall one agent and the other keeps working — the shared `context/` is untouched either way.
