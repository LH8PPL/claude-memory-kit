# Working with Claude Code

[Claude Code](https://claude.com/claude-code) is the kit's default agent — a plain `cmk install` (no `--ide`) wires it. The memory core — store, search, compression, the three-tier model — is the same across every agent; this doc covers the Claude-Code-specific wiring and its backend.

```bash
cd ~/my-project
cmk install --with-semantic   # wire Claude Code in this project (the default)
cmk doctor                    # verify, then RESTART Claude Code so the hooks load
```

A Claude Code install scaffolds the 3-tier `context/` layout, injects `.gitignore` entries, drops the managed `CLAUDE.md` block, installs the memory skills, wires the lifecycle hooks + the delete-guardrail into `.claude/settings.json`, and registers the MCP server. It's the complete entry point — no separate `/plugin` step needed.

## What `cmk install` writes

| Surface | Location | For |
| --- | --- | --- |
| **CLAUDE.md block** | `<repo>/CLAUDE.md` (managed marker block) | memory-awareness — loaded into Claude's context each session |
| **Skills** | `.claude/skills/memory-search` + `memory-write` + `troubleshooting` | the on-demand recall + capture + failure-code repair procedures |
| **MCP server** | `.claude/settings.json` (`mcp__cmk__*`) | drives memory as tools (`mk_remember` etc.) |
| **Lifecycle hooks** | `.claude/settings.json` | the automatic loop: `SessionStart` inject, `Stop`/`SessionEnd` capture + compress, `PreCompact` compaction-boundary roll, `UserPromptSubmit` prompt-capture, `PostToolUse` edit-observation |
| **Delete-guardrail** | a `PreToolUse` hook (`cmk-guard-memory`, matcher `Bash\|PowerShell`) | blocks a destructive shell command aimed at a memory path (fail-open) |
| **Permission auto-approver** | a `PermissionRequest` hook | keeps the kit's own tools/skills prompt-free (no per-turn "Allow?") |
| **.gitignore entries** | `<repo>/.gitignore` | the gitignored tiers (`context.local/`, `context/sessions\|transcripts\|.index\|.locks`) |

## Notes

- **Restart Claude Code** after install so the hooks load. `cmk install` is idempotent — re-running refreshes the hooks and the kit's scaffolded skills to your installed version (Task 230); your memory (`context/`, `context.local/`, the user tier) is never overwritten.
- Two install routes: the **npm CLI** (`npm install -g @lh8ppl/core-memory-kit` then `cmk install`) or the **Claude Code plugin marketplace** (`/plugin marketplace add LH8PPL/core-memory-kit` → `/plugin install` → `/core-memory-kit:bootstrap`). Pick one — both wire the same hooks.
- The kit **coexists** with Claude Code's native Auto Memory by default; `cmk doctor` (HC-6) surfaces a one-command opt-out (`cmk disable-native-memory`) if you want the kit to be the sole layer.

## The `claude` CLI as the automatic-memory backend (v0.4.5+)

The kit's automatic features — compression, auto-extract, the cross-project persona/wedge, the temporal sweep, daily/weekly distillation — run an LLM in the background. On a Claude Code install they run it through the **`claude` CLI** (`claude --print`), using your existing Claude subscription (**no separate API key**).

- **Prerequisite:** the `claude` CLI must be on your PATH — it's a **separate install from using Claude inside VS Code** (the IDE extension is not the CLI). Without it, capture / search / recall / the delete-guard still work (pure files + SQLite), but the automatic LLM steps are skipped. **`cmk doctor` (HC-11)** and **`cmk install`** both tell you if it's missing.
- **Split-brain (run the memory on a *different* agent than you code in):** code in Claude but route the frequent background memory work through a cheaper CLI you have — e.g. `cmk install --backend kiro` runs the automatic memory on `kiro-cli`'s Haiku (its Google login) while you keep your premium Claude subscription for actual coding. Set it at install (`cmk install --backend kiro`) or after (`cmk config set backend.agent kiro`). Both write the same `backend.agent` key.
- **See what's active:** `cmk config show` prints your installed-for agent, the active backend agent (and whether it's an override), the backend-CLI presence, and the semantic mode.

Cross-agent siblings: **[Kiro](KIRO.md)** · **[Cursor](CURSOR.md)** · **[Codex](CODEX.md)**.

## Using Claude Code alongside another agent on the same repo

The installs are additive — run both (`cmk install` and, e.g., `cmk install --ide kiro`), in any order. Each writes only its own wiring and never clobbers the other's; they share one `context/` memory brain.

## Uninstalling

```bash
cmk uninstall   # remove the Claude Code surface (the managed CLAUDE.md block); never deletes context/
```

On a dual-agent project, uninstall one agent and the other keeps working — the shared `context/` is untouched either way.

## Slash commands

`cmk install` scaffolds `.claude/commands/tour.md`, so **`/tour`** walks you through your own memory in conversation — the same narration as `cmk tour` (tiers, real counts, your own fact titles, how recall works). It is a kit-owned file: it refreshes with the kit on re-install and `cmk doctor` (HC-9) flags it if it drifts.
