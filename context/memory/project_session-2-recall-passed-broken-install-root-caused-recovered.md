---
id: P-YFBTYUPQ
type: project
title: Session 2 recall passed; broken install root-caused + recovered
created_at: 2026-06-16T12:25:56Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 5a74faf1bf92b9903471c5d04bbd8a3ebf4d714135d868283bffca8ff7e34ea4
related: [v0-3-2-cut-gate-complete-e1-wedge-passed-ready-to-tag, resume-v0-3-2-cut-gate-in-progress, three-session-release-validation-methodology]
---

v0.3.2 cut-gate Session-2 result (2026-06-16): RECALL PASSED STRONGLY (D1/D3/W1) — the cut-gate14 agent led with memory ("recall rather than re-derive"), fired the memory-search skill, and named ALL standing cross-project rules (uv/ruff/venv, TDD red-green, async-first, layered backend, type-hints, comments-why) + the exact project structure (layered FastAPI, ClaudeAgentService per-WS-connection, the stable-wire-contract decision, token-streaming, async-I/O policy, port 8000) WITHOUT re-reading code. The wedge works. TWO findings, both same root cause = a BROKEN/STALE global install: (1) cmk + mcp serve crashed with "Cannot find module @modelcontextprotocol/sdk" — the EBUSY-locked-DLL half-install from the earlier reinstall attempt left the MCP SDK not fully installed; (2) DECISIONS.md had duplicated entries (the OLD pre-fix DJ2 bug, frozen in the stale install — the PR#194 fix never reached it). RESOLUTION: a reinstall from the repo terminal RECOVERED despite an EBUSY warning on the temp staging copy — @modelcontextprotocol/sdk now present, the DJ2 fix (ID_PATTERN derivation) now in the install, cmk --version=0.3.2. The cut-gate14 WINDOW's running MCP server is still stale (started before the reinstall) — reload that window (Developer: Reload Window, independent of other windows per the IDE docs) to relaunch its server on the fixed cmk. Recall gates already passed regardless (agent fell back to file reads). Lesson: the Windows locked-DLL reinstall fragility is real (better-sqlite3.node) — the very thing node:sqlite would have fixed but lost on perf (D-162); a stale/half install silently serves OLD code to a whole VS Code window's session.

**Why:** Session 2 is a cut-gate milestone (recall is the kit's wow). Recording that recall passed strongly even through a broken install, that the two scary-looking findings (cmk crash + DECISIONS.md dup) were both the stale-install root cause not new bugs, and how the reinstall recovered — so the cut can proceed and a future session doesn't re-investigate.

**How to apply:** Mark Session-2 recall gates (D1/D3/W1) PASSED. To continue testing in cut-gate14: reload that window to refresh its MCP server on the fixed global cmk, then verify DECISIONS.md is idempotent (cmk digest twice, no new dup). The recall pass stands regardless of the install issue. For the locked-DLL reinstall fragility: closing the VS Code window holding the server releases the lock; the reinstall can also recover despite an EBUSY on the temp staging copy.
