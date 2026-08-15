---
id: P-5WCZJPM3
type: reference
title: cmk permission prompt only on cd-compound (D-80 edge)
created_at: 2026-06-16T10:08:28Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 85a15ad29d84fbc0de811c71052db7d215a23d1801c81737ac8330d6fed4109c
related: [decisions-md-is-write-only-for-ai-recall-not-in-any-recall-d, claude-code-cd-compound-command-prompting-edge, root-cause-skill-md-allowed-tools-frontmatter-triggers-the-a]
---

R2/D-80 known edge (SETTLED, not a bug): a `cmk remember` (or any `cmk`) call prompts for permission ONLY when the agent COMPOUNDS it — e.g. `cd "<absolute path>" && cmk remember ...`. Claude Code splits compounds per-subcommand; a `cd` to an absolute path doesn't qualify as read-only (only paths inside the working dir do), so the whole compound prompts. The BARE `cmk remember "..."` is allow-listed via `Bash(cmk:*)` and runs silent. Deliberately unfixed (D-80, the user 2026-06-07: "document it as an edge case we won't fix unless we have a simple solution"). RESOLVED for the primary path at D-85/Task 108b via the MCP-first surface: the memory-write skill prefers the mk_remember/mk_forget MCP TOOLS, and a tool call has no cd/compound/Bash matcher → no prompt. So the prompt is a bash-fallback edge only, NOT a regression or cut-blocker.

**Why:** This question recurs every cut-gate ("why did cmk prompt me?") and the answer lives only in design §16.57 + the decision log, not in searchable memory — so it gets re-derived each time. Making it recallable via cmk search/mk_search stops the re-litigation. It's a SETTLED edge: bare cmk = no prompt (allow-listed), cd-compound = prompt (Claude Code per-subcommand rule), MCP tools = no prompt (the resolved primary path).

**How to apply:** When a cmk command prompts during testing/use: check if it was compounded with cd or another command. If yes → known D-80 edge, expected, not a bug. If a BARE `cmk remember "..."` prompts → that WOULD be a real regression worth chasing. The fix already shipped for the main path (MCP tools via the memory-write skill); the bash-compound case stays a documented power-user edge.
