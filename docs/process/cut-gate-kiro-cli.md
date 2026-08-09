# cmk — full test + cut gate (KIRO-CLI / terminal)

**The kiro-cli counterpart to [`cut-gate.md`](cut-gate.md) and [`cut-gate-kiro.md`](cut-gate-kiro.md).** Same rigor, same shape — but scoped to the **`kiro-cli` terminal client only** (Amazon Q Developer CLI). The Kiro IDE (GUI) surfaces are gated by `cut-gate-kiro.md`; this gate is for the terminal, which has its OWN install path, its OWN failure modes, and a hard **version dependence** (V2 vs V3) the IDE gate can't reach. Standalone — run it end-to-end without cross-referencing the other guides.

> **Why a separate CLI gate (read this first):**
>
> kiro-cli is NOT the IDE. It resolves its config from a **different place**, fires hooks via a **different mechanism**, and its **hook contract changed in V3 (2.9+)**. This whole surface broke once because the kit wrote the agent config to the WRONG directory (`~/.aws/amazonq/cli-agents/` — D-198) and kiro-cli never loaded it. The terminal needs its own checks:
>
> - **Install command:** `cmk install --with-semantic --ide kiro` (same one-step install as the IDE — it wires the CLI surfaces too).
> - **Where the CLI surfaces live (the load-bearing correction — D-198):**
>   - **Agent config** → `~/.kiro/agents/cmk.json` (NOT `~/.aws/amazonq/cli-agents/`). Carries `tools: ['*']` (the capability set — enables the shell tool), `hooks{agentSpawn, stop, preToolUse}`, `toolsSettings.shell.allowedCommands` (pre-trusts `cmk hook`/`cmk-guard-memory`/`cmk remember`/`cmk search`), and `includeMcpJson: false` (no MCP — kiro-cli uses the shell commands, which also avoids the Windows console-window popup).
>   - **Default-agent registration** → `~/.kiro/settings/cli.json` `{"chat.defaultAgent":"cmk"}`. **This is the load-bearing step** — without it, the built-in `kiro_default` runs and NO kit hook fires.
>   - **MCP** (shared with the IDE) → the project's `.kiro/settings/mcp.json`.
> - **The hooks are input adapters only** — they call the SAME `cmk hook <event>` dispatcher → the same `captureTurn()` / `injectContext()` core as Claude Code + the IDE. The memory core is identical; this gate verifies the **kiro-cli wiring**, not the core (the suite + `cut-gate.md` gate the core).
> - **★★ VERSION GATE (D-198 — the hard-won lesson).** kiro-cli's behavior depends on its major version. Check it FIRST (`kiro-cli --version`):
>   - **V2 (≤2.8.x):** embedded `agentSpawn` / `stop` / `preToolUse` all fire. The full guardrail works.
>   - **V3 (2.9+):** `agentSpawn` / `stop` STILL fire (capture + inject work), but **`preToolUse` does NOT** — V3 redesigned hooks (standalone `.kiro/hooks/*.json` PascalCase + `permissions.yaml` for tool-blocking). The delete-guardrail via our hook is **expected-not-to-fire on V3**; kiro-cli's own shell-approval prompt covers destructive commands there. First-class V3 support is **Task 166**.
> - **★★ Test the REAL paths — back up, run for real, restore (BINDING).** This gate runs against your **real** `~/.core-memory-kit` (user tier) and **real** `~/.kiro` (the CLI-agent surface), because that is exactly what a real user hits. The safety is a **backup-before / restore-after** protocol (§0c), NOT env-var redirection.
>
> **Cutting now: `v0.4.0`** — Kiro is the first non-Claude-Code agent (Task 50). _Replace `0.4.0` / `v0.4.0` below if you reuse this guide for a later kiro-cli-touching cut._

---

## How to read this

- **★ = cut-gate check.** Every ★ must pass to tag the release. The rest is the full sweep — run it so nothing ships untested.
- Each check is one line you can tick, followed by the **action** (a code block) and a **PASS:** line.
- Throwaway probes use their own temp dirs and never touch your main run.
- **Time:** ~45–60 min.
- **Prereqs:** **kiro-cli on PATH** (`kiro-cli --version` runs). Python 3.12+ on PATH (for `--with-semantic`). **Note (v0.4.5+): `kiro-cli` is now ALSO the LLM backend** for this project's AUTOMATIC memory engine — compression / auto-extract / persona run through `kiro-cli chat` (off the Kiro/Google login, no API key). So on a kiro-cli install it plays two roles: the terminal client this gate drives AND the automatic-memory backend. Without it on PATH, the automatic LLM steps are skipped (HC-11 flags it). The v0.4.5 backend gates are **KCG-BK1..KCG-BK4 (§7b)**.

> **★★ The real-input rule (binding — D-84).** A check **PASSES only when it ran on REAL input that exercises the feature** — never "the command didn't crash." A hook that is *registered* but never *fires-and-captures-a-real-turn* is **unverified**, not a pass. The hook checks below FAIL if you only confirm the file exists.

> **★★ The backup rule (binding — D-184).** Before ANY `cmk install --ide kiro` or live kiro-cli session, run the **§0c backup block** — it snapshots your real `~/.core-memory-kit` + `~/.kiro` into `C:\cut-gate-backups\`. The gate writes to the **real** dirs; the **§Verdict restore block** preserves the test artifacts as evidence and puts your originals back.

> **★★ The BOM trap (binding — D-198).** When you hand-edit a kiro-cli agent config for diagnostics, use **Node** (`node -e "...fs.writeFileSync(...,'utf8')"`), **never** PowerShell `ConvertTo-Json | Set-Content`. PowerShell adds a UTF-8 BOM; kiro-cli's agent loader REJECTS a BOM'd config (`invalid: expected value at line 1 column 1`) and silently falls back to `kiro_default` — which looks exactly like "the kit broke" when it didn't. The kit's own installer writes clean BOM-less UTF-8; only hand-edits inject the BOM. First byte `123` (`{`) = clean; `239` = BOM.

---

## 0. Cut the release locally, then build the REAL artifact

**0a — cut the release locally FIRST.** Bumps `package.json` + finalizes the CHANGELOG so the artifact reports `0.4.0`. Local commit only — the tag-push stays the last step, after every ★ passes.

```powershell
cd C:\Projects\claude-memory-kit
git checkout main; git pull
npm run release -- minor             # v0.4.0 is a MINOR (the cross-agent differentiator)
git diff                             # review: ONLY the version bump + CHANGELOG consolidation
git add CHANGELOG.md packages\cli\package.json
git commit -m "release: v0.4.0"      # local release commit — do NOT tag yet
git push origin main
```

**0b — build + install the real artifact.**

```powershell
cd C:\Projects\claude-memory-kit\packages\cli
npm pack                             # → lh8ppl-core-memory-kit-<version>.tgz
npm uninstall -g @lh8ppl/core-memory-kit
# Use the EXPLICIT filename npm pack printed — PowerShell does NOT glob `*.tgz`.
npm install -g .\lh8ppl-core-memory-kit-0.4.0.tgz
cmk --version                        # ✅ matches packages/cli/package.json
# (If `npm uninstall -g` / install warned EPERM on better_sqlite3.node — a Windows
#  file lock because Claude Code/Kiro hold the native DLL — CLOSE those apps first,
#  then re-run. The version check confirms the new artifact is live.)
```

**0c — back up the real dirs (the binding backup rule).** The gate runs against your REAL `~/.core-memory-kit` + `~/.kiro`. Snapshot them first into a FRESH run dir, then start the user tier clean so capture-from-zero is honest:

```powershell
# NEVER overwrite an existing backup — always a FRESH run dir. Find the next free _runN.
$root = "C:\cut-gate-backups"
$base = "kiro-cli_v0.4.0"
$run  = $base
if (Test-Path "$root\$run") { $n = 2; while (Test-Path "$root\${base}_run$n") { $n++ }; $run = "${base}_run$n" }
$bk = "$root\$run"
New-Item -ItemType Directory -Path $bk | Out-Null
"backup run dir: $bk"

# user tier (kit-only) → MOVE it aside (starts the gate from empty; restored verbatim after)
if (Test-Path $env:USERPROFILE\.core-memory-kit) {
  Move-Item $env:USERPROFILE\.core-memory-kit "$bk\$run-.core-memory-kit"
}
# ~/.kiro: holds your real Kiro agents/settings/extensions → COPY (never move it out
# from under Kiro), then the restore deletes only the cmk files the gate added.
if (Test-Path $env:USERPROFILE\.kiro) {
  Copy-Item $env:USERPROFILE\.kiro "$bk\$run-.kiro" -Recurse
}
# record the cmk agent + default-pointer BEFORE, so restore knows what to remove
$notes = "$bk\NOTES.md"
"$(Get-Date -Format o) — kiro-cli gate start (run=$run)." | Out-File $notes   # -Format o, NOT -o
"  cmk agent present before: $(Test-Path $env:USERPROFILE\.kiro\agents\cmk.json)" | Out-File $notes -Append
if (Test-Path $env:USERPROFILE\.kiro\settings\cli.json) {
  "  chat.defaultAgent before: $((Get-Content $env:USERPROFILE\.kiro\settings\cli.json -Raw | ConvertFrom-Json).'chat.defaultAgent')" | Out-File $notes -Append
}
```

- [ ] **G0** — `cmk --version` matches `packages/cli/package.json` _(older → you're testing a stale global; re-run `npm install -g` against the freshly-packed `.tgz`)._
- [ ] **G0-cli** — `kiro-cli --version` runs (kiro-cli is on PATH). **Record the major version** — it decides the KG-guard expectation (V2 fires, V3 falls back). _(`KIRO_VERSION` env inside a session also reports it.)_
- [ ] **G0-backup** — the fresh run dir `C:\cut-gate-backups\$run\` holds `$run-.core-memory-kit` + `$run-.kiro`, any prior backup is untouched, and `~/.core-memory-kit` is now absent (moved aside) so capture starts from zero. _(`~/.kiro` stays in place — it was copied, not moved.)_

---

## 1. Scaffold + read every CLI surface

```powershell
mkdir C:\Temp\kiro-cli-gate9; cd C:\Temp\kiro-cli-gate9
git init
cmk install --with-semantic --ide kiro
cmk doctor
```

- [ ] **★ KCG1 — install prints the Kiro success summary.** The `cmk install --ide kiro` output names the wired surfaces (mcp + steering + agents-md + skills + ide-hooks + trusted-commands + **cli-agent**). **PASS:** `cli-agent` is in the list. **FAIL:** the CLI agent leg didn't wire.

- [ ] **★ KCG1b — `cmk doctor` clean (agent-aware HC-1).** `cmk doctor` → **0 fail** on a fresh install — **16 checks now** (HC-1..HC-16; HC-9 version-drift, HC-10 compaction-liveness, **HC-11 backend-CLI-present v0.4.5** — PASS when `kiro-cli` is on PATH, the effective backend for a kiro-cli install; see ★ KCG-BK1, §7b). HC-1 must PASS naming the CLI-agent surface (`~/.kiro/agents/cmk.json`) — not false-fail on a missing `.claude/settings.json`.

- [ ] **★ KCG2 — the agent config landed in the RIGHT place (D-198).** This is THE check D-198 exists for.
      ```powershell
      "agent at ~/.kiro/agents/cmk.json (expect True): $(Test-Path $env:USERPROFILE\.kiro\agents\cmk.json)"
      "NOT at the old ~/.aws location (expect False):   $(Test-Path $env:USERPROFILE\.aws\amazonq\cli-agents\cmk.json)"
      $s = Get-Content $env:USERPROFILE\.kiro\settings\cli.json -Raw | ConvertFrom-Json
      "chat.defaultAgent (expect cmk): $($s.'chat.defaultAgent')"
      ```
      **PASS:** the agent is at `~/.kiro/agents/cmk.json`, the default pointer in `~/.kiro/settings/cli.json` names `cmk`, and nothing landed in `~/.aws`. **FAIL:** the config is in `~/.aws` (the D-198 bug — kiro-cli won't load it) or the default pointer is missing.

- [ ] **★ KCG3 — kiro-cli VALIDATES our agent (the strict loader).**
      ```powershell
      kiro-cli agent validate --path $env:USERPROFILE\.kiro\agents\cmk.json
      ```
      **PASS:** no error (valid). **FAIL:** a schema error — e.g. `unknown field managedBy` (an invalid top-level field; ownership marker must live in `description`), `duplicate field includeMcpJson` (it and `useLegacyMcpJson` are the same setting — keep only one), or `expected value at line 1 column 1` (a UTF-8 BOM — see the BOM trap).

- [ ] **★ KCG4 — `kiro-cli agent list` resolves cmk as the DEFAULT.**
      ```powershell
      cd C:\Temp\kiro-cli-gate9
      kiro-cli agent list
      ```
      **PASS:** the active marker `*` is on **`cmk`** (shown `Global`), e.g. `* cmk    Global    core-memory-kit …`. **FAIL:** `*` is on `kiro_default` (built-in) → the kit's default registration didn't take; nothing will fire.

- [ ] **★ KCG5 — the agent carries all three hooks + MCP + trust, in the right shape.**
      ```powershell
      $j = Get-Content $env:USERPROFILE\.kiro\agents\cmk.json -Raw | ConvertFrom-Json
      "agentSpawn: $($j.hooks.agentSpawn[0].command)"     # cmd.exe /c cmk hook agentSpawn (Windows)
      "stop:       $($j.hooks.stop[0].command)"           # cmd.exe /c cmk hook stop
      "preToolUse: $($j.hooks.preToolUse[0].command)  matcher=$($j.hooks.preToolUse[0].matcher)"
      "tools: $($j.tools -join ',')"                       # *  (the capability set — REQUIRED, or the agent runs nothing)
      "includeMcpJson: $($j.includeMcpJson)"               # False  (kiro-cli uses shell commands, not MCP — no popup)
      "allowedCommands: $($j.toolsSettings.shell.allowedCommands -join ' | ')"
      ```
      **PASS:** `agentSpawn`/`stop` call `cmk hook <event>` (platform-correct `cmd.exe /c` on Windows); `preToolUse` calls `cmk-guard-memory` with `matcher: "*"`; **`tools` is `["*"]`** (the capability set — without it a custom agent can run no command); **`includeMcpJson` is `false`** (the kiro-cli agent loads no MCP server — explicit memory uses the `cmk remember`/`cmk search` shell commands, and there's no `cmd.exe` console popup); `allowedCommands` is scoped to the kit's commands incl. `^cmk remember .*` + `^cmk search .*` (start-anchored, never `.*`). **FAIL:** a missing `tools` field (the agent will "say saved" but nothing runs), a missing hook, wrong field name (`timeout` instead of `timeout_ms`), or a blanket-wildcard trust.

- [ ] **★ KCG6 — `--with-semantic` enabled.** `cmk doctor` HC-6 reports the semantic backend live (hybrid-by-default), or SKIP if the model isn't pre-warmed yet. _(Same shared-core behavior as every agent; `--with-semantic` is agent-agnostic.)_

- [ ] **★ KCG7 — the guarded default (non-clobber).** Deterministic probe in a SANDBOX where a FOREIGN default already exists:
      ```powershell
      $d = "C:\Temp\kiro-cli-guard"; Remove-Item -Recurse -Force $d -EA SilentlyContinue
      New-Item -ItemType Directory "$d\settings" -Force | Out-Null
      Set-Content "$d\settings\cli.json" '{"chat.defaultAgent":"their-agent"}' -Encoding utf8   # a pre-existing FOREIGN default
      $env:MEMORY_KIT_KIRO_DIR = $d
      cmk install --ide kiro | Out-Null
      "our agent still installed (True): $(Test-Path $d\agents\cmk.json)"
      "their default untouched (their-agent): $((Get-Content $d\settings\cli.json -Raw | ConvertFrom-Json).'chat.defaultAgent')"
      Remove-Item Env:\MEMORY_KIT_KIRO_DIR
      Remove-Item -Recurse -Force $d
      ```
      **PASS:** the cmk agent file STILL installs (the user can run `kiro-cli --agent cmk`), but the kit did NOT overwrite a foreign `chat.defaultAgent` — it left `their-agent` intact. **FAIL:** the kit clobbered the user's default pointer.

- [ ] **★ KCG8 — scaffold reads clean (READ EVERY FILE IN ALL THREE MEMORY TIERS).** Open and read `context\MEMORY.md`, `context\SOUL.md`, `context\USER.md`, every `context\memory\*.md` + `INDEX.md`, the user tier (`~\.core-memory-kit\*.md`). **PASS:** no kit-internal cruft (no `Task NN` / `design §` / literal `{{TODAY}}`), no real username in a committed tier, example bullets marked `(example)`, well-formed frontmatter. **FAIL:** any leak/placeholder/cruft.

---

## 2. Session 1 (kiro-cli) — build it, stating preferences  ⬅️ a real `kiro-cli`

Start kiro-cli in the project with **NO `--agent` flag**, so the default-agent resolution is what's under test. (Bare `kiro-cli` opens the chat — `chat` is the default subcommand; `kiro-cli chat` is the same thing.)

```powershell
cd C:\Temp\kiro-cli-gate9
kiro-cli        # NO --agent flag — cmk must resolve as the DEFAULT agent
```

Build a small app, **stating durable preferences as you go** (these are what memory must capture + later recall). Suggested arc (any real build works):

1. *"Create a minimal Python web chat: a FastAPI server with a WebSocket endpoint and a single static index.html. Put the server in app.py."*
2. *"Always use a project-local .venv and install all Python packages into it."*  ← a durable preference
3. *"How I build backends: FastAPI is the delivery layer, not the brain. Thin routes, logic in services, data access in repositories, Pydantic schemas as contracts."*  ← a durable preference
4. *"Type hints on every signature, Python 3.12+. Comments explain why, not what. Tests first — boundary test, watch it fail, then implement."*  ← durable
5. *"From now on, in every project I work on, always use uv for packages, never pip, and always run ruff before committing."*  ← a CROSS-PROJECT rule (the wedge)

- [ ] **★ KC1 — the default agent resolves with no `--agent` flag.** The bottom-of-prompt agent label reads **`cmk`** (not `kiro_default`); the session runs as the cmk agent. **PASS:** you never passed `--agent` and cmk is active. **FAIL:** a different/blank agent → the default registration didn't take (re-check KCG4).

- [ ] **★ KC2 — `agentSpawn` injects at session start (the SessionStart analog).** On a SECOND kiro-cli session (open it again after stating the prefs), ask *"What are my standing cross-project rules, and how is this project structured?"* **PASS:** the answer names your rules (uv/ruff, .venv, layered, typed/TDD, async) + the project structure **without a re-brief** — proof the snapshot was injected at spawn. **FAIL:** kiro-cli has no memory of Session 1 (inject didn't fire — re-check KCG4 + KCG3 for a BOM).

- [ ] **★ KC3 — `stop` captures at turn-end in kiro-cli.**
      ```powershell
      type C:\Temp\kiro-cli-gate9\context\sessions\now.md     # a kiro-cli turn is captured here
      ```
      **PASS:** a kiro-cli turn landed in `now.md` / the capture log — same shared core as the IDE, different client. **FAIL:** kiro-cli turns aren't captured.

- [ ] **★ KC4 — explicit recall from the kiro-cli session (the `cmk search` shell path).** In the chat, say *"search your memory for the port we use."* **PASS:** the agent runs `cmk search "<topic>" --project "<abs path>"` (a pre-trusted shell command — NOT an MCP tool; kiro-cli uses `tools: ['*']` + the shell commands, not MCP) and answers from the result. **FAIL:** the agent prepends `cd` (→ approval prompt), tries an MCP `mk_search` (the agent has `includeMcpJson: false` — there is none), or "answers" with no real shell call.

- [ ] **★ M1 — explicit capture in chat, PROMPT-FREE (the shell-command path).** kiro-cli does NOT use MCP tools (its agent sets `includeMcpJson: false`) — explicit capture goes through the kit's **`cmk remember`** SHELL command, which the model can run because the agent has `tools: ['*']` (the capability set; without it a custom agent runs *nothing*). When you state a durable preference, the agent runs `cmk remember "<fact>" --project "<abs path>"` (NO `cd` prefix — a `cd …` prefix makes the command start with `cd`, which fails the start-anchored `^cmk remember` trust match → an approval prompt). **PASS:** the agent's `cmk remember …` runs SILENTLY (pre-trusted) and prints `saved … [P-XXXXXXXX]`; the fact lands in `context\memory\` (verify on disk: a new `user_*.md` + an `audit.log` entry). **FAIL:** the agent prepends `cd` (→ "shell requires approval"), or the agent "says saved" with no real shell output (→ the `tools` field is missing, so nothing ran), or nothing lands on disk.

- [ ] **★ M-wedge — cross-project promotion fires (shell-command path).** When you state the *"in every project"* uv/ruff rule, the agent recognizes it as cross-project: it runs `cmk remember "<rule>"` then `cmk lessons promote <id>` → the rule lands in the **user tier** (`HABITS.md`). **PASS:** `type $env:USERPROFILE\.core-memory-kit\HABITS.md` shows the uv/ruff rule (with Why/How). **FAIL:** the rule stayed project-only. _(If the agent is unsure of the id, it can `cmk search` first — both are pre-trusted.)_

---

## 3. Capture checks — read the files

```powershell
cd C:\Temp\kiro-cli-gate9
```

- [ ] **B1 — auto-capture fires.** Your decisions/prefs show up **without** "remember this".
- [ ] **★ B2 — rich capture.** Durable preferences are rich fact files (frontmatter + `**Why:**` + `**How to apply:**`), not bare one-liners. `dir context\memory\user_*.md` → read one; confirm the Why/How body.
- [ ] **★ B9 — auto-extract writes RICH project facts.** At least one `context\memory\*.md` carries `write_source: auto-extract` + a Why/How body — captured from the kiro-cli session with no `cmk remember`.
- [ ] **★ B3 — the wedge fills (user tier).** `type $env:USERPROFILE\.core-memory-kit\HABITS.md` (+ `USER.md`, `LESSONS.md`) → your cross-project style is there (real user tier; backed up in §0c).
- [ ] **★ B4 — stated rule → `trust: high`, automatically.** `findstr /S /C:"trust: high" context\memory\*.md` → a user-stated rule landed at high trust on its own.

---

## 4. Explicit capture probes — run in the build terminal

```powershell
cd C:\Temp\kiro-cli-gate9
```

- [ ] **C1 — terse.** `cmk remember "We deploy with Kamal to Hetzner, never Vercel."` → appears in `context\MEMORY.md`.
- [ ] **C2 — rich.** `cmk remember "Reflection beats one-shot generation" --type feedback --title "reflection-loop" --why "..." --how "..."` → rich `feedback_reflection-loop.md`.
- [ ] **C3 — Poison_Guard.** `cmk remember "key sk-ant-api03-AAArealishlookinglongtokenvalue00"` → rejected (exit 2), nothing written.
- [ ] **C4 — sanitization.** `cmk remember "venv at C:\Users\<you>\proj\.venv"` → the written file shows `~\…`, never your username.
- [ ] **★ C5 — `<private>` stripped on the write path.** `cmk remember "host prod-7 <private>root pw hunter2-SECRET</private>" --type project` → `Select-String context\memory\*.md,context\MEMORY.md -Pattern "hunter2-SECRET"` finds nothing.
- [ ] **★ FQ1 — FTS5 query sanitization.** `cmk search "v0.4"` / `cmk search "user-explicit"` → results or clean "no results", never an `FTS5 parse error`.

---

## 5. The delete-guardrail (KG-guard) — version-dependent  ⬅️ the kiro-cli safety check

The agent wires a `preToolUse` hook (matcher `*`) → `cmk-guard-memory`, which exits 2 to BLOCK a destructive command aimed at a memory path. **Whether it fires depends on the kiro-cli version (from G0-cli):**

- **V2 (≤2.8.x):** run the test; expect BLOCKED.
- **V3 (2.9+):** `preToolUse` does NOT fire (V3 hook redesign). Our guardrail is N/A; kiro-cli's own shell-approval prompt covers the delete. Mark KG-guard **N/A (V3 — Task 166)**, NOT a fail.

- [ ] **★ KG-guard (V2 only) — the delete-guardrail BLOCKS a memory delete.** In the kiro-cli (THROWAWAY project), *"run this in the shell for me: `rm -rf context/sessions`"*. Approve when kiro-cli prompts (its OWN shell-approval gate fires BEFORE our `preToolUse` — that prompt is NOT our guard). On Windows the model rewrites `rm -rf` → `Remove-Item -Recurse -Force` (the guard blocks both — `execute_command` + `execute_bash` are both in SHELL_TOOLS). **PASS:** "BLOCKED by the core-memory-kit delete-guardrail…" surfaces, `context\sessions` survives. Also confirm a SAFE `ls` is NOT blocked. **FAIL:** the delete runs (on V2) → re-check KC1 + a config BOM.
- [ ] **★ KG-guard-V3 — on V3, the guard is N/A but the native gate covers it.** On a V3 kiro-cli, ask for the same delete. **PASS:** kiro-cli's OWN "shell requires approval" prompt appears (you are never silently unprotected); the kit's guardrail not firing is expected (Task 166). **FAIL:** the delete runs with NO prompt at all (then even Kiro's native gate is off — a Kiro config issue, not the kit).

- [ ] **★ KG-observe (50.N.2) — the `postToolUse` STDIN + `fs_write` payload-shape assumption (paired with KG-guard).** Both the delete-guard (`preToolUse`) AND observe-edit (`postToolUse`) read a piped-and-closed STDIN payload `{tool_name, tool_input, tool_response}` — this one live run verifies that shared assumption (and that Kiro's real `fs_write` payload matches the kit's probe fields). In the kiro-cli (THROWAWAY project), ask the model to *"create a Python file app.py with 60 lines of code."* **PASS:** after the turn, `context/sessions/now.md` carries a `… Write file=…app.py lines=6X` summary line (the `postToolUse` hook fired, stdin delivered, `fs_write`→Write mapped, observeEdit recorded it). Also confirm a SMALL edit (<50 lines) leaves NO summary. **FAIL (the B1 hang):** the turn STALLS ~10s on each file write (the `postToolUse` hook is blocking on a stdin that Kiro didn't pipe/close) → then observe-edit is NOT viable on kiro-cli and must fall back to the `stop`-hook transcript read (file edits are still captured via the transcript, just not as a discrete edit-observation). **FAIL (shape):** no stall, but `now.md` gets no summary even on a big edit → Kiro's `fs_write` payload nests the content/path differently than the kit's probes (`tool_response.{content,output,text}` / `tool_input.{file_path,filePath,path}`); capture the real payload via the kg-probe below and add the real field spelling to `observe-edit.mjs`. _Until this passes live, observe-edit on kiro-cli is "structurally wired, live-unverified" (50.N.2)._

**★ DIAGNOSTIC — when NOTHING fires (not even capture/inject):** the agent config is in the wrong place or not resolved. (1) `kiro-cli agent list` → expect `* cmk Global`; if it's `* kiro_default`, the default registration didn't take (KCG4). (2) `kiro-cli agent validate --path ~/.kiro/agents/cmk.json` → a BOM or schema error makes kiro silently fall back. (3) **The probe technique:** temporarily point a hook's `command` at a script that logs stdin + exits 0, run a turn, read the log — this settles "did the hook fire?" definitively, separate from "did the guard block?".

```js
// kg-probe.mjs — point a hook at this to prove fire-vs-not. ALWAYS exits 0.
import { appendFileSync, readFileSync } from 'node:fs';
let stdin = ''; try { stdin = readFileSync(0, 'utf8'); } catch {}
appendFileSync('C:\\tmp\\kg-probe.log', `FIRED argv=${JSON.stringify(process.argv)}\nSTDIN=${stdin || '<empty>'}\n===\n`);
process.exit(0);
```
Wire it with **Node** (never PowerShell — BOM): `node -e "const fs=require('fs');const f=process.env.USERPROFILE+'\\.kiro\\agents\\cmk.json';const j=JSON.parse(fs.readFileSync(f,'utf8'));j.hooks.agentSpawn[0].command='node C:\\tmp\\kg-probe.mjs';fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n','utf8')"`. Restart kiro-cli, run a turn, `type C:\tmp\kg-probe.log`. **Restore the real command afterward** by re-running `cmk install --ide kiro` (or `installKiroCliAgent({})` from the build).

---

## 6. Session 3 — the cold-open (the wedge)  ⬅️ a BRAND-NEW project

```powershell
mkdir C:\Temp\kiro-cli-coldopen; cd C:\Temp\kiro-cli-coldopen
git init; cmk install --with-semantic --ide kiro
kiro-cli
```
Ask: *"Start a new Python backend for me — set up the structure."*

- [ ] **★ E1 — cold-open (the wedge).** It scaffolds the **layered** shape + `uv`/`ruff` tooling **without being told** — because the Session-1 persona (the user tier, filled by the wedge) injected at `agentSpawn`. *"How does it know that?"* = the wedge. **The gate that matters most** — it proves the persona injects through kiro-cli's hook in a brand-new project.

---

## 7. Full feature sweep — every `cmk` subcommand

The `cmk` CLI is agent-agnostic — run **F-1 … F-19** (recall/index, persona, lifecycle, memory-management, health/repair, native-coexistence, MCP/transcripts, the L2 ladder) as a sweep. They are not Kiro-specific; this gate's job is the kiro-cli wiring above.

**The kiro-cli-specific lifecycle check:**

- [ ] **★ KU1 — `cmk uninstall --ide kiro` removes ONLY our kiro-cli + Kiro surfaces, byte-preserves the rest, never touches `context/`.**
      In `C:\Temp\kiro-cli-gate9` (NEVER a real project):
      ```powershell
      cmk uninstall --ide kiro
      "cmk agent gone (False):        $(Test-Path $env:USERPROFILE\.kiro\agents\cmk.json)"
      $s = Get-Content $env:USERPROFILE\.kiro\settings\cli.json -Raw | ConvertFrom-Json
      "default pointer gone (blank):  '$($s.'chat.defaultAgent')'"     # our pointer removed; cli.json + sibling keys preserved
      type .kiro\settings\mcp.json   # our server key gone; a sibling user server (if any) preserved
      "context/ preserved (True):     $(Test-Path context\MEMORY.md)"
      ```
      **PASS:** uninstall removes `~/.kiro/agents/cmk.json` + un-registers our `chat.defaultAgent` pointer (leaving `cli.json` + any sibling keys byte-untouched) + strips the project `.kiro/` managed surfaces; AND **`context/` is preserved**. **FAIL:** a user file/sibling key was deleted, `context/` was touched, or a managed surface lingered.

- [ ] **★ KU2 — uninstall NEVER deletes a foreign `cmk.json` (the rmSync safety, D-198).** In a sandbox, write a user-owned `cmk.json` WITHOUT our `[core-memory-kit]` marker, then uninstall:
      ```powershell
      $d = "C:\Temp\kiro-cli-foreign"; Remove-Item -Recurse -Force $d -EA SilentlyContinue
      New-Item -ItemType Directory "$d\agents" -Force | Out-Null
      Set-Content "$d\agents\cmk.json" '{"name":"cmk","description":"my own agent","mine":true}' -Encoding utf8
      $env:MEMORY_KIT_KIRO_DIR = $d
      cmk uninstall --ide kiro | Out-Null
      "foreign cmk.json survived (True): $(Test-Path $d\agents\cmk.json)"
      Remove-Item Env:\MEMORY_KIT_KIRO_DIR; Remove-Item -Recurse -Force $d
      ```
      **PASS:** the foreign `cmk.json` (no marker) is byte-untouched — uninstall keys on our `[core-memory-kit]` marker, never blindly deletes the filename. **FAIL:** a user's own agent was deleted.

---

## 8. Portability

`context/` is committed and travels with `git clone` (tenet T2). The project `.kiro/` surfaces (steering/skills/mcp) are committed too. The CLI agent-config (`~/.kiro/agents/cmk.json` + the `cli.json` pointer) is machine-local and re-created by `cmk install --ide kiro` on the new machine.

- [ ] **★ H1** — clone `C:\Temp\kiro-cli-gate9` elsewhere, run `cmk install --ide kiro` + `kiro-cli` → the project memory (`context/`) is already there and the CLI agent re-registers.

---

## 7b. The agent-relative backend + split-brain, kiro-cli edition (Task 200 + 201)  ⬅️ the v0.4.5 gates

On a kiro-cli install, the automatic engine runs through **`kiro-cli chat`** — the SAME binary this gate already drives, now doing double duty as the LLM backend (off the Kiro/Google login, no API key — live-verified D-278). KCG-BK4 is directly runnable here.

- [ ] **★ KCG-BK1 — `cmk doctor` HC-11 (kiro-cli present).** On a fresh install, `cmk doctor` reports **15** checks and HC-11 = PASS naming `kiro-cli`. FAIL path (scripted `backendCliProbe` returning `present:false`) → HC-11 FAIL with the honest "automatic features degraded, file-only still works" message. **PASS:** 15 checks; HC-11 PASS/FAIL on kiro-cli presence. **FAIL:** a wrong check count or a silent SKIP (the D-270 bug).
- [ ] **★ KCG-BK2 — `cmk install --backend <agent>` (split-brain + fail-fast).** `cmk install --ide kiro --backend claude` → `context/settings.json` carries `backend.agent: claude`, install warns about the EFFECTIVE backend (`claude`), not kiro-cli. `cmk install --ide kiro --backend banana` → exit 2 + supported list, no `context/` scaffolded (fail-fast). **PASS/FAIL** as canonical §4f BK2.
- [ ] **★ KCG-BK3 — `cmk config show`.** In the `--backend claude` project: names installed-for `kiro`, active backend `claude` (override), CLI presence, semantic mode; exits **0**.
- [ ] **★ KCG-BK4 — live kiro-cli spawn (runnable HERE).** Default kiro-cli install (backend = kiro-cli), seed a session buffer, `cmk roll --scope now` → a real Markdown summary lands in `sessions/`, produced by `kiro-cli chat` (prompt on stdin, D-280). **Live-verified on the dev machine (D-278): 0.01 credits, ~1–7s, no refusal.** **FAIL:** refusal / empty / timeout.

---

## Verdict + the cut

**Cut v0.4.0 (kiro-cli surface) if** every **★** passes —
`KCG1, KCG1b, KCG2, KCG3, KCG4, KCG5, KCG6, KCG7, KCG8, KC1, KC2, KC3, KC4, M1, M-wedge, B2, B9, B3, B4, C5, FQ1, KG-guard (V2) / KG-guard-V3 (V3), KG-observe (50.N.2), E1, KU1, KU2, H1`. **For a v0.4.5+ cut also run `KCG-BK1..KCG-BK4` (§7b — the agent-relative backend + split-brain; KCG-BK4 runs kiro-cli as the live backend).**

**The headline live-test is KC1/KC2/KC3 (default-agent resolves + agentSpawn/stop FIRE) + M1/M-wedge (MCP capture + cross-project promotion).** These are the checks unit tests structurally can't reach — "the agent config is written correctly" (the suite proves that) ≠ "kiro-cli loads it, resolves it as default, and its hooks fire in a real terminal session" (only this gate proves that). KG-guard is **version-gated** (V2 fires; V3 falls back to Kiro's native prompt — Task 166).

Record the live result (which checks passed, the kiro-cli version, any findings) in **tasks.md 50.M** + a **DECISION-LOG** entry.

**Then preserve the evidence + restore your real dirs (the binding restore — mirror of §0c):**

```powershell
# Point at the run dir from §0c. Auto-pick the NEWEST kiro-cli_v0.4.0* dir.
$root = "C:\cut-gate-backups"
$bk   = (Get-ChildItem $root -Directory -Filter "kiro-cli_v0.4.0*" | Sort-Object LastWriteTime -Desc | Select-Object -First 1).FullName
$run  = Split-Path $bk -Leaf
"restoring from run dir: $bk"

# 1. PRESERVE the test artifacts as evidence (run-prefixed, self-identifying)
Copy-Item $env:USERPROFILE\.core-memory-kit  "$bk\$run-AFTER-.core-memory-kit" -Recurse -EA SilentlyContinue
Copy-Item C:\Temp\kiro-cli-gate9                "$bk\$run-AFTER-test-project"       -Recurse -EA SilentlyContinue
Copy-Item $env:USERPROFILE\.kiro\agents        "$bk\$run-AFTER-kiro-agents"        -Recurse -EA SilentlyContinue
"$(Get-Date -Format o) — kiro-cli gate finished; artifacts copied above." | Out-File "$bk\NOTES.md" -Append

# 2. RESTORE the user tier (it was MOVED aside in §0c — put the original back verbatim)
Remove-Item -Recurse -Force $env:USERPROFILE\.core-memory-kit -EA SilentlyContinue
if (Test-Path "$bk\$run-.core-memory-kit") {
  Move-Item "$bk\$run-.core-memory-kit" $env:USERPROFILE\.core-memory-kit
}

# 3. RESTORE ~/.kiro — it was COPIED. Remove ONLY the cmk files the gate added
#    (per NOTES.md: if cmk.json / the cmk default pointer pre-existed, do NOT remove them).
Remove-Item $env:USERPROFILE\.kiro\agents\cmk.json -EA SilentlyContinue   # if WE wrote it (check NOTES.md)
$cli = "$env:USERPROFILE\.kiro\settings\cli.json"
if (Test-Path $cli) {
  $j = Get-Content $cli -Raw | ConvertFrom-Json
  if ($j.'chat.defaultAgent' -eq 'cmk') { $j.PSObject.Properties.Remove('chat.defaultAgent'); ($j | ConvertTo-Json) | Set-Content $cli -Encoding utf8 }
}

# 4. clean the throwaway project dirs (NOT the backups)
Remove-Item -Recurse -Force C:\Temp\kiro-cli-gate9, C:\Temp\kiro-cli-coldopen, C:\Temp\kiro-cli-guard, C:\Temp\kiro-cli-foreign -EA SilentlyContinue
Remove-Item Env:\MEMORY_KIT_KIRO_DIR -EA SilentlyContinue
```

### ★ Pre-tag gate (BEFORE the tag — docs lag the code otherwise)

- [ ] **CHANGELOG consolidated** — `[Unreleased]` → `## [0.4.0] — <date>`; `print-release-notes.mjs 0.4.0` parses the section.
- [ ] **★ READMEs reflect v0.4.0** — both root `README.md` + npm landing `packages/cli/README.md` describe the cross-agent/Kiro headline + `--ide kiro`.
- [ ] **`packages/cli/package.json` version** = `0.4.0`.

**To publish (your outward action):**

```powershell
git tag v0.4.0
git push origin v0.4.0
```

`publish.yml` runs the suite, publishes `@lh8ppl/core-memory-kit@0.4.0` to npm with provenance, and creates the GitHub Release from the `[0.4.0]` CHANGELOG section.

**Verify after:** `npm view @lh8ppl/core-memory-kit version` → `0.4.0`; the npm page shows a provenance badge; the GitHub Release matches `## [0.4.0]`.
