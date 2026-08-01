---
name: troubleshooting
description: >-
  Diagnoses and repairs core-memory-kit itself when the memory system is broken
  — the per-failure-code repair book. Fire whenever a
  "⚠ [core-memory-kit]" whisper appears on the prompt (it names the failure and
  points here), or when the user reports a kit symptom however they phrase it:
  memory is not being saved, nothing was remembered from last session, the
  session-start snapshot did not appear, a cmk command or an mk_ tool is
  erroring, search returns nothing it should have found, or "is my memory even
  working?". Also fire when the user asks to run or interpret cmk doctor. This
  skill covers the KIT's own health only — not the content of what was
  remembered (use memory-search for recall) and not general shell debugging.
context: fork
allowed-tools: Bash(cmk doctor) Bash(cmk doctor *) Bash(cmk reindex) Bash(cmk reindex *) Bash(cmk search *) mcp__cmk__mk_search
---

# Repairing the memory kit

Something in core-memory-kit is failing. Diagnose it, then repair what you are
allowed to repair and PROPOSE the rest.

## The one rule that outranks everything below

**Never run a fix that touches the user's own state without asking first.**

Each failure code below carries a **fix class**, and it is binding:

| Fix class | What you may do |
| --- | --- |
| **silent** | Just run it. Kit-owned, idempotent, reversible — it rebuilds a derived view and destroys nothing. Say afterwards what you ran, in one line. |
| **confirm** | Prepare the exact command, show it, and **wait for the user to approve** before running it. Anything that rewrites memory content, settings, or install state is this class. |
| **advise** | Do **not** run it. Print the command and what it will do. This is for fixes that are expensive, or outside the kit's authority (installing someone's CLI, changing their PATH). |

When you are unsure which class a failure belongs to, treat it as **advise**.
An unknown failure never earns silent repair.

This is enforced, not just asked for: the only repair commands granted to this
skill are `cmk doctor`, `cmk reindex`, and read-only lookups. **`cmk install`
and every form of `cmk repair` are deliberately ungranted** — where a section
below tells you to propose one, you propose it and the user runs it. If a
command you need is not available to you, that is the boundary working, not a
misconfiguration to route around.

The kit's memory tiers are only ever written through the kit's own commands.
Never hand-edit a file under the memory directories to "fix" anything — that
bypasses the safety screens and is itself a failure mode.

## Step 1 — read the evidence before running anything

The whisper on the prompt already names the failure code. If you need more:

- `cmk doctor` — the full health audit. Every check reports PASS / WARN / FAIL /
  SKIP with a repair command. **This is the diagnosis, not the fix**; doctor
  repairs nothing by itself.
- `context/.locks/health.log` — the kit's own append-only failure log, one JSON
  object per line: `{ts, class, outcome, detail}`. Read the tail. A `fail`
  followed by a later `ok` for the same class means the problem already cleared.

Two things worth knowing before you interpret it:

- A **single** failure of a flaky class is not a problem. The whisper only
  fires after two consecutive failures with no success between (or one, for
  failures that cannot recover on their own). If you are reading the log by
  hand, apply the same standard.
- Evidence older than **7 days** is stale and does not count.

## Step 2 — look up the failure code

### `agent-cli-missing` — the backend CLI could not be launched

**Severity: memory capture is OFF. Fix class: advise.**

The kit runs its background extraction through the agent's own CLI
(`claude`, `kiro-cli`, `cursor-agent`, or `codex`). The launch failed with
"no such file" — the binary is not on PATH, or the installed shim is broken.

- **Diagnose:** `cmk doctor` — check **HC-11**, which names the expected binary
  and reports whether it actually runs.
- **Fix (do not run it — tell the user):** install or repair that CLI so it is
  on PATH, then confirm with `<the-cli> --version` in a new shell. On Windows a
  common cause is a shim that resolves on PATH but errors when executed.
- **Confirm it cleared:** the next captured turn appends an `ok` and the whisper
  disappears on its own. Nothing needs to be reset.

While this is active, **nothing is being captured automatically.** If the user
is mid-session with something worth keeping, offer to save it explicitly with
`cmk remember` (that path does not need the backend CLI).

### `extract-failing` — auto-extract keeps failing

**Severity: memory capture is OFF. Fix class: advise.**

The backend CLI launched but the extraction call keeps failing — a timeout, a
rate limit, an API error, or the extraction child never being spawned at all.

- **Diagnose:** `cmk doctor` first (**HC-11** confirms the backend CLI runs at
  all), then read the `detail` on the health log lines. `haiku_timeout` means
  the call was killed for taking too long; `haiku_failed` means it exited
  unhealthy; `auto-extract-missing` / `no-auto-extract-path` mean the extraction
  script itself was not found, which is an install problem.
- **Fix, by detail:**
  - `haiku_timeout` / `haiku_failed` repeated — usually the backend, not the
    kit. Check the CLI works interactively and that any API credentials are
    valid. **Advise only.**
  - `auto-extract-missing` / `no-auto-extract-path` — the install is
    incomplete. Propose `cmk install` (re-running it refreshes kit-owned
    scaffolding). **Confirm first** — it touches install state.
- Capture is **not** total: the kit falls back to a deterministic
  no-LLM extraction on failure, so some facts still land. Do not tell the user
  everything was lost — check with `cmk search` before claiming that.

### `inject-failing` — the session-start snapshot is failing

**Severity: degraded. Fix class: advise.**

Either the snapshot build threw, or the background compression it triggers
could not be started. Memory is still being written; it may not be getting
*read back* at session start.

- **Diagnose:** `cmk doctor` (**HC-1** hook registration, **HC-3** transcript
  freshness). Then start a fresh session and check whether the memory snapshot
  appears at all.
- **Fix:** if hooks are unregistered or drifted, propose `cmk repair --hooks`.
  **Confirm first** — it rewrites the agent's settings file.
- If the snapshot appears but is empty, this is not the right code — the memory
  is empty rather than broken. Check with `cmk search`.

### `precompact-failing` — the pre-compaction capture keeps failing

**Severity: degraded. Fix class: advise.**

The kit banks the session buffer just before the agent compacts its context.
When this fails repeatedly, work done in long sessions can be summarized away
before it is ever saved.

- **Diagnose:** `cmk doctor`, plus `context/.locks/precompact.log` for the
  per-run record. This class shares a root cause with the backend CLI — if
  `agent-cli-missing` is also active, fix that first and this one clears with it.
- **Fix:** same as `extract-failing`. **Advise**, unless the detail points at an
  incomplete install.

### `index-drift` — the memory INDEX is behind the fact archive

**Severity: advisory. Fix class: SILENT — you may just run it.**

A fact was written but the index rebuild that follows it failed, so recent
facts may not be findable by search yet. Nothing is lost; the index is a
derived view and rebuilding it is safe and repeatable.

- **Fix:** run `cmk reindex`. Then say, in one line, that you rebuilt the index.
- **Confirm it cleared:** `cmk doctor` **HC-4** reports INDEX consistency, and
  **HC-14** stops listing `index-drift`. Any successful rebuild — `cmk reindex`,
  `cmk repair --index`, or the one that follows the next captured fact —
  records the success that clears the warning, so running the fix above is
  genuinely enough. You do not have to do anything else to dismiss it.

This is the one code on this page you fix without asking.

### `mcp-tool-failing` — the memory tools keep erroring

**Severity: degraded. Fix class: advise.**

The `mk_*` tools are throwing rather than returning results. Note that a tool
answering "not found" or rejecting a write is **not** this — that is the tool
working correctly. This code means the handler itself broke.

- **Diagnose:** `cmk doctor`. Then try the equivalent CLI verb (`cmk search`,
  `cmk get`) — if the CLI works and only the tools fail, the MCP server process
  is the problem, not the memory.
- **Fix:** restart the agent so the MCP server is re-launched. If it persists,
  propose `cmk install` to re-register the server. **Confirm first.**
- **Meanwhile the CLI verbs are a complete fallback** — recall and capture both
  work without the tools. Say so; the user has not lost access to their memory.

## Step 3 — nothing above matched

Run `cmk doctor` and work its output top-down. It reports one line per check
with a repair command attached to each failure. Apply the same discipline:

- a check whose repair only rebuilds a derived view (`cmk reindex`) → run it;
- a check whose repair rewrites settings or install state (`cmk repair --hooks`,
  `cmk install`) → **propose it and wait**;
- a check whose repair is outside the kit (install a CLI, change PATH) →
  **advise only**.

A WARN is advisory and does not need fixing to keep working. Only FAIL means
something is actually broken.

If doctor is clean and the symptom is real, say so plainly rather than
inventing a repair — a wrong fix applied to a healthy memory system is worse
than the symptom. Report what you checked, what passed, and what you could not
explain.

## What this skill does not cover

- **Finding what was remembered** — that is the `memory-search` skill.
- **Saving something** — that is the `memory-write` skill.
- **General debugging of the user's project.** This skill is scoped to the
  kit's own failure codes.
