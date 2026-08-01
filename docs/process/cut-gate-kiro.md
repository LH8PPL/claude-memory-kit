# cmk — full test + cut gate (KIRO)

**The Kiro counterpart to [`cut-gate.md`](cut-gate.md).** Same rigor, same shape — but every Claude-Code surface is swapped for its Kiro equivalent. Version-agnostic; reused every cut that ships a Kiro change.

> **What's different from the Claude-Code gate (read this first):**
>
> - **Install command:** `cmk install --with-semantic --ide kiro` (NOT bare `cmk install`).
> - **Two clients, one install.** Kiro is Amazon Q Developer CLI under the hood. `cmk install --ide kiro` wires **five surfaces** at once, covering **both** clients:
>   - **Kiro IDE (GUI)** → `.kiro/hooks/` hook files (auto-fire, no agent selection). The kit **dual-emits** two formats: the v1 `cmk-{capture,inject,guard,observe}.json` (`{version:'v1', hooks:[{trigger, matcher?, action:{type:'command', command}, …}]}`, PascalCase triggers — the CURRENT format Kiro IDE **1.0+** loads, the full inject/capture/delete-guard/observe-edit set) AND the legacy `cmk-{capture,inject}.kiro.hook` (for Kiro **0.x**). On a 1.0 IDE the `.kiro.hook` files are inert (shown "legacy"); on a 0.x IDE the v1 `.json` files are ignored — no double-fire.
>   - **kiro-cli (terminal)** → a `~/.kiro/agents/cmk.json` agent-config (registered as the default via `~/.kiro/settings/cli.json`) whose `hooks{}` fire only for the **default agent**.
>   - **Shared by both:** MCP (`.kiro/settings/mcp.json`), steering (`.kiro/steering/cmk.md`), skills (`.kiro/skills/`).
> - **The hook surfaces are input adapters only** — both call the SAME `cmk hook <event>` dispatcher → the same `captureTurn()` / `injectContext()` core as Claude Code. So the **memory core is identical**; this gate verifies the **Kiro wiring**, not the core again (the core is gated by [`cut-gate.md`](cut-gate.md) + the suite).
> - **★★ Test the REAL paths — back up, run for real, restore (BINDING).** This gate runs against your **real** `~/.core-memory-kit` (user tier) and **real** `~/.kiro` (the CLI-agent surface) — because that is exactly what a real user hits; a sandbox would hide a path bug. The safety is a **backup-before / restore-after** protocol (§0b), NOT env-var redirection. (`~/.kiro` holds your real Kiro agents/settings — it is **copied**, never moved, and restored by deleting only the cmk agent files; see §0b.) A live-test once wrote a stray agent config into the WRONG location — the real `~/.aws/amazonq/cli-agents/` — which kiro-cli never read (D-184/D-198); the backup is what makes the now-correct `~/.kiro` write safe to verify for real.
>
> **Cutting now: `v0.4.0`** — the cross-agent breadth release; **Kiro is the first non-Claude-Code agent** (Task 50, D-182/D-183/D-184). This gate IS the v0.4.0 Kiro live-test (sub-task 50.M).
> _Replace `0.4.0` / `v0.4.0` in the commands below if you reuse this guide for a later Kiro-touching cut._

It exercises every Kiro surface end-to-end on the **real installed artifact**: install (all 5 surfaces), the scaffolded skills, the IDE hooks (v1 `.json` for IDE 1.0+ and legacy `.kiro.hook` for 0.x, both dual-emitted; capture + inject + delete-guard + observe-edit), the kiro-cli agent-config + the guarded default-agent, the **MCP tools driven in a real Kiro session**, organic capture, recall, and the full `cmk` CLI — then the tag-push.

---

## How to read this

- **★ = cut-gate check.** Every ★ must pass to tag the release. The rest is the full sweep — run it so nothing ships untested.
- Each check is one line you can tick, followed by the **action** (a code block) and a **PASS:** line.
- Throwaway probes use their own temp dirs and never touch your main run.
- **Time:** ~60–75 min.
- **Prereqs:** **Kiro IDE installed** + **kiro-cli on PATH** (both — the gate exercises each). Python 3.12+ on PATH (for `--with-semantic`). **Note (v0.4.5+): `kiro-cli` now serves TWO roles here** — it is both the terminal client the gate drives AND the **LLM backend** for this project's AUTOMATIC memory engine (compression / auto-extract / persona now run through `kiro-cli chat`, off the user's Kiro/Google login, no API key). Without `kiro-cli` on PATH, capture / search / recall still work but the automatic LLM steps are skipped (HC-11 flags it). The v0.4.5 backend gates are **KG-BK1..KG-BK4 (§7b)**.

> **★★ The real-input rule (binding — D-84).** A check **PASSES only when it ran on REAL input that exercises the feature** — never "the command didn't crash." A hook that is *registered* but never *fires-and-captures-a-real-turn* is **unverified**, not a pass (the whole point of 50.M: "docs-correct ≠ fires"). The IDE/CLI hook checks below FAIL if you only confirm the file exists.

> **★★ The backup rule (binding — D-184).** Before ANY `cmk install --ide kiro` or live Kiro session, run the **§0b backup block** — it snapshots your real `~/.core-memory-kit` + `~/.kiro` into `C:\cut-gate-backups\12_v0.4.0_kiro\` (the central backup root). The gate writes to the **real** dirs; the **§Verdict restore block** preserves the test artifacts as evidence and puts your originals back. Paths below mean your REAL `~/.kiro` / `~/.core-memory-kit` — the backup is the safety net, not a redirect.

---

## 0. Cut the release locally, then build the REAL artifact

**0a — cut the release locally FIRST.** Bumps `package.json` + finalizes the CHANGELOG so the artifact reports `0.4.0`. Local commit only — the tag-push stays the last step, after every ★ passes.

```powershell
cd C:\Projects\claude-memory-kit
git checkout main; git pull
npm run release -- minor             # v0.4.0 is a MINOR (the cross-agent differentiator) per RELEASE-PLAN.md
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
# Use the EXPLICIT filename npm pack printed — PowerShell does NOT glob `*.tgz`
# the way bash does (a literal `*` → ENOENT). e.g. for v0.4.0:
npm install -g .\lh8ppl-core-memory-kit-0.4.0.tgz
cmk --version                        # ✅ matches packages/cli/package.json
# (If `npm uninstall -g` warned EPERM on better_sqlite3.node — a Windows file
#  lock — it still removes the packages; the reinstall + the version check below
#  confirm the new artifact is live. Harmless.)
```

**0c — back up the real dirs (the binding backup rule).** The gate runs against your REAL `~/.core-memory-kit` + `~/.kiro`. Snapshot them first into the central backup root, then start the user tier clean so capture-from-zero is honest:

```powershell
# NEVER overwrite an existing backup — always a FRESH run dir. Find the next free _runN.
$root = "C:\cut-gate-backups"
$base = "12_v0.4.0_kiro"
$run  = $base
if (Test-Path "$root\$run") { $n = 2; while (Test-Path "$root\${base}_run$n") { $n++ }; $run = "${base}_run$n" }
$bk = "$root\$run"
New-Item -ItemType Directory -Path $bk | Out-Null
"backup run dir: $bk"

# Snapshot names are SELF-IDENTIFYING — prefixed with the run name (NOT a generic
# BEFORE-), so a snapshot says which run it came from even if copied elsewhere.
# user tier: kit-only → MOVE it aside (starts the gate from empty; restored verbatim after)
if (Test-Path $env:USERPROFILE\.core-memory-kit) {
  Move-Item $env:USERPROFILE\.core-memory-kit "$bk\$run-.core-memory-kit"
}
# ~/.kiro: holds your REAL Kiro agents/settings → COPY (never move it out from under other tools)
if (Test-Path $env:USERPROFILE\.kiro) {
  Copy-Item $env:USERPROFILE\.kiro "$bk\$run-.kiro" -Recurse
}
# record what the cmk agent files looked like BEFORE, AND their ownership (so restore
# knows what to remove: a KIT-WRITTEN cmk.json → delete on restore; a
# USER-AUTHORED one → keep). $run is also written so the restore block can read it back.
$notes = "$bk\NOTES.md"
"$(Get-Date -Format o) — gate start (run=$run). Pre-existing cmk agents in real ~/.kiro:" | Out-File $notes   # -Format o, NOT -o (ambiguous in PowerShell 5.1)
Get-ChildItem $env:USERPROFILE\.kiro\agents\*.json -EA SilentlyContinue | % {
  $c = Get-Content $_.FullName -Raw
  $owned = if ($c -match '"managedBy"\s*:\s*"core-memory-kit"') { "KIT-WRITTEN (restore SHOULD delete)" } else { "USER-AUTHORED (restore must KEEP)" }
  "  $($_.Name) -> $owned"
} | Out-File $notes -Append
```

- [ ] **G0** — `cmk --version` matches `packages/cli/package.json` _(older → you're testing a stale global; re-run `npm install -g` against the freshly-packed `.tgz`)._
- [ ] **G0-kiro** — `kiro-cli --version` runs (kiro-cli is on PATH) AND Kiro IDE opens. _(Both clients are exercised; if you only have one, mark the other client's checks `unverified`, don't skip silently.)_
- [ ] **G0-backup** — the fresh run dir `C:\cut-gate-backups\$run\` holds `$run-.core-memory-kit` + `$run-.kiro` (run-prefixed, self-identifying), any prior `12_v0.4.0_kiro*` backup is untouched, and `~/.core-memory-kit` is now absent (moved aside) so capture starts from zero. _(`~/.kiro` stays in place — it was copied, not moved.)_

---

## 1. Scaffold + read every file — all 7 Kiro surfaces

Validates scaffold integrity + that all seven Kiro surfaces land in the verified paths.

```powershell
mkdir C:\Temp\kiro-ide-gate10; cd C:\Temp\kiro-ide-gate10
git init
cmk install --with-semantic --ide kiro    # the Kiro install — all 5 surfaces + semantic recall (~260 MB once + model pre-warm)
cmk doctor
```

- [ ] **★ KG1 — install prints the Kiro success summary.**
      The install ends with:
      `cmk install: kiro-gate ready for Kiro — context/ scaffolded; mcp + steering + agents-md + skills + ide-hooks + trusted-commands + cli-agent wired.`
      then `Restart Kiro to activate the hooks (steering + skills + MCP are immediate).`
      **PASS:** the summary names **all seven** surfaces (`mcp + steering + agents-md + skills + ide-hooks + trusted-commands + cli-agent`) — `agents-md` is the managed `AGENTS.md` block (D-188; KG10), `trusted-commands` is the `.vscode/settings.json` `kiroAgent.trustedCommands` that auto-approves the kit's hooks (D-194; KG11). _(If your real `~/.kiro` has NO Kiro default agent, the CLI agent takes the default silently — no "Note: you already have a Kiro CLI default agent" line. If you DO already have a Kiro default, you'll see that note here instead — and that's the guarded path KG7 forces deterministically.)_

- [ ] **★ KG1b — `cmk doctor` clean (agent-aware HC-1).** `cmk doctor` → **0 fail** on a fresh Kiro install — **14 checks now** (HC-1..HC-14; HC-9 version-drift v0.3.4, HC-10 compaction-liveness v0.4.1, **HC-11 backend-CLI-present v0.4.5**, HC-12 deletion-propagation v0.5.4 — PASS when `kiro-cli` is on PATH, the effective backend for a Kiro install; see ★ KG-BK1, §7b).
      **HC-1 must read as a KIRO check, not a Claude one:** `[PASS] HC-1: ... Kiro capture/inject wired via IDE hooks (.kiro/hooks/) + CLI agent (~/.kiro/agents/)`. **FAIL the gate** if HC-1 says `.claude/settings.json missing → cmk repair --hooks` — that's the pre-D-185 bug (doctor not agent-aware); you're on a stale binary, rebuild (§0b). _(D-185/D-186, found + fixed by this gate: HC-1 is a capability check — PASSes if the IDE hooks OR the CLI agent is present, so both a Kiro-IDE and a kiro-cli-only user read clean. The other memory-core checks are agent-agnostic.)_

- [ ] **★ KG2 — MCP surface (shared IDE+CLI) + autoApprove (D-196).**
      ```powershell
      type .kiro\settings\mcp.json        # mcpServers["core-memory-kit"] = { type:"stdio", command:"cmk", args:["mcp","serve"], autoApprove:[...] }
      (Get-Content $env:USERPROFILE\.kiro\agents\cmk.json -Raw | ConvertFrom-Json).allowedTools  # CLI side: ["@cmk"]
      ```
      **PASS:** `.kiro/settings/mcp.json` registers the `core-memory-kit` stdio server **AND** carries an `autoApprove` array listing the kit's 13 MCP tools (`mk_remember` … `mk_queue_resolve`) — so Kiro runs them without a per-call "Reject / Trust / Run" prompt (D-196; found live in Session 1). The CLI agent-config carries the analog `allowedTools: ["@cmk"]` (the Amazon-Q agent uses `allowedTools` `@server/tool`, NOT `autoApprove`). **Neither is a `"*"` blanket** — scoped to the kit's own tools. **FAIL:** no `autoApprove` → every `mk_remember` in chat pops Reject/Trust/Run (M1-live confirms the prompt is gone).

- [ ] **★ KG3 — steering surface (shared IDE+CLI).**
      ```powershell
      type .kiro\steering\cmk.md          # frontmatter `inclusion: always`, inside the managed marker block
      ```
      **PASS:** `.kiro/steering/cmk.md` exists, carries `inclusion: always`, and its body tells Kiro to recall via `cmk search` before re-deriving. The kit content sits inside `cmk:start`/`:end` markers (byte-preserve on uninstall).

- [ ] **★ KG4 — skills surface (shared IDE+CLI), ported + Kiro-safe + VALID YAML.**
      ```powershell
      type .kiro\skills\memory-search\SKILL.md
      type .kiro\skills\memory-write\SKILL.md
      ```
      The frontmatter must be **valid YAML** — this is structurally enforced pre-ship by `validate-skill-sources.mjs` (strict js-yaml parse, in `npm test`), so a shipped artifact can't carry an invalid one. The live signal is Kiro itself: if a `description` had a YAML-breaking char, Kiro pops *"Invalid SKILL.md frontmatter"* on project load (the D-195 cut-blocker).
      **PASS:** both `SKILL.md` files exist under `.kiro/skills/<name>/`, the **Claude-Code-only frontmatter keys are dropped** (`context:` / `allowed-tools:` must NOT appear), the body is intact, **AND both frontmatters STRICT-PARSE as valid YAML** (D-195). **FAIL** (the D-195 cut-blocker): Kiro pops *"Invalid SKILL.md frontmatter"* on project load — caused by an unquoted `: ` (colon-space) or other YAML-breaking char in the `description` (Claude Code reads leniently and never surfaces it; Kiro strict-parses). The fix is a `description: >-` block scalar in the canonical `template/.claude/skills/<name>/SKILL.md`; `validate-skill-sources.mjs` now strict-parses to catch it pre-ship.

- [ ] **★ KG5 — IDE hooks surface (the GUI client). The kit dual-emits BOTH formats — verify both.**
      ```powershell
      # v1 (Kiro IDE 1.0+ — the CURRENT format, full inject/capture/guard/observe set)
      type .kiro\hooks\cmk-capture.json
      type .kiro\hooks\cmk-inject.json
      type .kiro\hooks\cmk-guard.json
      type .kiro\hooks\cmk-observe.json
      # legacy (Kiro 0.x back-compat — inert on 1.0)
      type .kiro\hooks\cmk-capture.kiro.hook
      type .kiro\hooks\cmk-inject.kiro.hook
      ```
      **PASS — the v1 `.json` files (CURRENT on IDE 1.0+) are valid in the migration-verified shape (D-203d):**
      - Each is `{ "version":"v1", "hooks":[ { "name", "description", "trigger", "matcher"?, "action":{"type":"command","command":<cmd>}, "timeout", "enabled":true } ] }`.
      - **PascalCase triggers, one hook per file:** `cmk-capture.json`→`Stop` (capture), `cmk-inject.json`→`UserPromptSubmit` (inject), `cmk-guard.json`→`PreToolUse` (`matcher:'*'`, delete-guard, blocks on non-zero exit), `cmk-observe.json`→`PostToolUse` (`matcher:'fs_write'`, observe-edit).
      - `action.type:"command"`, **not an `askAgent`/LLM action** — the kit does DETERMINISTIC capture, which no surveyed Kiro project does.

      **PASS — the legacy `.kiro.hook` files (Kiro 0.x back-compat) are still emitted in the verified shape:**
      - `cmk-capture.kiro.hook`: `{ "version":"1.0.0", "enabled":true, "name":"core-memory-kit: capture", "when":{"type":"agentStop"}, "then":{"type":"runCommand", "command":<cmd>, "timeout":60} }`
      - `cmk-inject.kiro.hook`: same shape, `when.type":"promptSubmit"`, `then.timeout":30`.
      - On a **1.0** IDE these `.kiro.hook` files are **inert** (shown "legacy", not run); the v1 `.json` files fire. On a **0.x** IDE the reverse holds — no double-fire (D-203d).
      - **The `command` is platform-correct (both formats):** on Windows it is **`cmd.exe /c cmk hook stop`** / `... userPromptSubmit` / etc. (Kiro routes hooks through WSL, which has no node — a bare `cmk hook` would fail with `node: not found`). On macOS/Linux it is the bare `cmk hook <event>`.

- [ ] **★ KG6 — CLI agent-config surface (the terminal client), in your REAL `~/.kiro`.**
      ```powershell
      type $env:USERPROFILE\.kiro\agents\cmk.json
      (Get-Content $env:USERPROFILE\.kiro\settings\cli.json -Raw | ConvertFrom-Json).'chat.defaultAgent'   # → cmk (the load-bearing default registration)
      ```
      **PASS — the agent-config is the Amazon-Q Rust-contract shape:**
      - `"description"` carries the `core-memory-kit` ownership marker (the structural uninstall key — D-198 moved it out of a top-level `managedBy`, which kiro-cli rejects as an unknown field).
      - `"hooks"` is an OBJECT keyed by trigger → array of `{command, timeout_ms}`: `agentSpawn` (timeout_ms 10000, inject) + `stop` (timeout_ms 30000, capture). **`timeout_ms`, NOT `timeout`** (the stale `agent-v1.json` shape is `{command}`-only — this must be the Rust contract).
      - the `command` is platform-correct (`cmd.exe /c cmk hook <event>` on Windows).
      - carries `tools: ["*"]` (the capability set — without it the agent runs no command, D-199) and `includeMcpJson: false` (kiro-cli uses the `cmk` shell commands, not MCP — no `cmd.exe` popup).
      - **This is the REAL path kiro-cli reads** (`~/.kiro/agents/cmk.json`, registered as the default in `~/.kiro/settings/cli.json` — D-198) — which is why the §0c backup copied `~/.kiro` first (it'll be restored). _(If you already had a Kiro default agent, the kit still installs `cmk.json` but does NOT take over your `chat.defaultAgent` pointer — see KG7.)_

- [ ] **★ KG7 — the guarded default-agent (non-clobber).** Deterministic probe in a SECOND sandbox where a default already exists:
      This is the ONE probe that uses a throwaway `~/.kiro` — because it deliberately simulates *someone else's* existing default to prove the kit won't clobber it. The kit's `MEMORY_KIT_KIRO_DIR` escape hatch points the CLI-agent leg at a temp dir for this one block, then is cleared:
      ```powershell
      $g = "C:\Temp\kiro-guard-kiro"; Remove-Item -Recurse -Force $g -EA SilentlyContinue
      New-Item -ItemType Directory "$g\settings" -Force > $null
      # simulate a user who already has a default agent
      '{ "chat.defaultAgent": "their-agent" }' | Set-Content "$g\settings\cli.json" -Encoding utf8
      $h = "C:\Temp\kiro-guard-proj"; Remove-Item -Recurse -Force $h -EA SilentlyContinue
      mkdir $h > $null; Set-Location $h; git init | Out-Null
      $env:MEMORY_KIT_KIRO_DIR = $g          # surgical: redirect ONLY this guard probe off the real ~/.kiro
      cmk install --ide kiro                 # watch the summary
      (Get-Content "$g\settings\cli.json" -Raw | ConvertFrom-Json).'chat.defaultAgent'   # their default is byte-untouched (their-agent)
      dir "$g\agents"                        # the kit's cmk.json STILL landed (the user can run --agent cmk)
      Remove-Item Env:\MEMORY_KIT_KIRO_DIR    # clear it — the rest of the gate uses the REAL ~/.kiro
      Set-Location C:\Temp\kiro-ide-gate10
      ```
      **PASS:** the install prints the **`Note: you already have a Kiro CLI default agent — the kit installed a `cmk` agent instead.`** line; `cli.json` still says `chat.defaultAgent: their-agent` (untouched); the kit STILL wrote `cmk.json` but did NOT take over the default pointer. **FAIL:** the kit overwrote their default pointer or their settings.

- [ ] **★ KG8 — `--with-semantic` enabled hybrid-by-default (same as Claude-Code G7).**
      ```powershell
      type context\settings.json           # "search": { "default_mode": "hybrid" }
      ```
      **PASS:** the install said semantic ENABLED **and** `settings.json` carries `default_mode: hybrid`. _(If npm failed, settings must NOT say hybrid — no half-state.)_

- [ ] **★ KG9 — scaffold reads clean (READ EVERY FILE IN ALL THREE MEMORY TIERS — not a spot-check).**
      The `context/` memory tiers are agent-agnostic, so the same G4 discipline applies. Read every file; a leaked username, an unrendered `{{TODAY}}`, or malformed frontmatter is a cut-blocker.
      ```powershell
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8   # avoid mojibake false alarms (middot/em-dash)
      function Read-Tier($dir) {
        if (-not (Test-Path $dir)) { Write-Output "(no $dir)"; return }
        Get-ChildItem -Recurse $dir -File | % { "`n===== $($_.FullName) ====="; [System.IO.File]::ReadAllText($_.FullName) }
      }
      Read-Tier "$env:USERPROFILE\.core-memory-kit"   # User tier (real — backed up in §0c)
      Read-Tier "context"                                 # Project tier (committed)
      Read-Tier "context.local"                           # Local tier (gitignored)
      ```
      **PASS — every file shows:** no kit-internal cruft (no `Task NN`, `design §`), no literal `{{TODAY}}`, **no real username in a committed tier** (public-repo leak = blocker), example bullets marked `(example)`, well-formed frontmatter.

- [ ] **★ KG10 — AGENTS.md present, Claude-Code-only files ABSENT (D-188).** A Kiro install writes Kiro's instruction file (`AGENTS.md`, the cross-tool always-loaded standard) and does NOT drop Claude-Code-only files (`CLAUDE.md`, `.claude/skills/`) — Kiro can't read them, and the CLI agent-config's `prompt: file://AGENTS.md` must resolve.
      ```powershell
      "AGENTS.md present (expect True):  $(Test-Path AGENTS.md)"
      type AGENTS.md                                  # a managed core-memory-kit:start block
      "CLAUDE.md ABSENT  (expect False): $(Test-Path CLAUDE.md)"
      ".claude/ ABSENT   (expect False): $(Test-Path .claude)"
      ```
      **PASS:** `AGENTS.md` exists with the managed memory-awareness block; **no** `CLAUDE.md`, **no** `.claude/`. **FAIL** (the pre-D-188 leak): a dead `.claude/skills/` or a `CLAUDE.md` Kiro can't use, or a missing `AGENTS.md` (the CLI agent's `prompt` would point at nothing).

- [ ] **★ KG11 — trust written, so the hooks/MCP-tools/skills auto-run instead of prompting (D-194 / D-203h).** Kiro gates a hook's shell command (and an MCP-tool / skill-load) behind a **"Run / Reject" / "Allow"** prompt unless pre-trusted; the kit pre-trusts ONLY its own. THREE surfaces:
      ```powershell
      type .vscode\settings.json    # IDE 0.x side: kiroAgent.trustedCommands (Kiro 1.0 AUTO-MIGRATES this into permissions.yaml on first open)
      # IDE 1.0 side: the per-workspace Trust v2 store the kit writes directly (D-203h).
      # <hash> = sha256(projectRoot → forward-slash, no-trailing-slash, lowercase).slice(0,16)
      Get-ChildItem $env:USERPROFILE\.kiro\workspace-roots\*\permissions.yaml | % { type $_ }
      # CLI side: the agent-config's toolsSettings.shell.allowedCommands
      (Get-Content $env:USERPROFILE\.kiro\agents\cmk.json -Raw | ConvertFrom-Json).toolsSettings.shell.allowedCommands
      ```
      **PASS:** (a) `.vscode/settings.json` has `kiroAgent.trustedCommands` containing the kit's hook prefix (`cmd.exe /c cmk hook *` on Windows; `cmk hook *` on POSIX) **and** the guard (`…cmk-guard-memory*`); (b) the IDE-1.0 `permissions.yaml` carries the kit's `rules` (`capability:shell` for `cmd.exe /c cmk hook *` + the guard, `capability:mcp` for `core-memory-kit/<tool>`, `capability:skill` for `memory-write`/`memory-search`, all `effect:allow`); (c) the CLI agent-config's `toolsSettings.shell.allowedCommands` carries the regex equivalents (`cmd\.exe /c cmk hook .*`, `…cmk-guard-memory`). **None is a blanket `*` / `.*`** (the kit trusts only its OWN commands — the docs warn wildcards over-trust). **FAIL:** the trust is missing → the IDE pops a Run/Reject (or skill "Allow") prompt on fire (KH-trust below confirms the live behavior). _(The live confirmation that the prompt is GONE is KH-trust in §2 — this check verifies the trust entries are on disk.)_

Now **restart Kiro** (close + reopen the IDE; restart any kiro-cli session) so the hooks + MCP load, then `code .` (or open `C:\Temp\kiro-ide-gate10` in Kiro). The live checks (§2 onward) need the reloaded hooks.

---

## 2. Session 1 (Kiro IDE) — build it, stating preferences

Same build arc as the Claude-Code gate, run in **Kiro IDE**. Each stage pairs a **Build** prompt with a **Say it out loud** preference — a real opinion, never "remember this". End each turn normally (the `agentStop` IDE hook fires capture).

**Stage 0 — baseline.** 
*Build:* "Create a minimal Python web chat UI: a FastAPI server with a WebSocket endpoint and a single static `index.html`. Plain HTML/JS, no framework. Put the server in `app.py`." 
→ "yes, run it" if offered.
*Say:* "always deploy .venv and install all python packages in it"

**Stage 1 — refactor to layers.** 
*Build:* "Refactor this into a layered FastAPI project - `app/{api,services,repositories,schemas,core}/` and `app/main.py`. WebSocket route into `api/`, connection/broadcast logic into a service, Pydantic schemas. Keep it on port 8000." 
*Say:* "How I build backends: FastAPI is the delivery layer, not the brain. Routes stay thin and orchestrate; logic lives in services; data access in boring repositories; Pydantic schemas are the boundary contracts. I'd rather pay the structure cost now than fight it in six months."

**Stage 2 — swap to Claude + typing/TDD rule.** 
*Build:* "Change it to a single-user chat with Claude via the Claude Agent SDK (`claude-agent-sdk`) - a `ClaudeAgentService` wrapping `ClaudeSDKClient`, each WebSocket connection its own session." 
*Say:* "Type hints on every signature - Python 3.12+. Comments explain why, not what. And tests first: boundary test, watch it fail, then implement."

**Stage 3 — stream + async rule + the universal rule.** 
*Build:* "Stream Claude's output to the browser as it arrives - push JSON frames over the WebSocket; the client appends to the live bubble." 
*Say:* "Async all the way down — nothing blocking in the event loop." 
**Then state one cross-project rule:** "From now on, in every project I work on, always use `uv` for packages, never `pip`, and always run `ruff` before committing."

**Watch while you build (the IDE-hook live gates — the heart of 50.M):**

- [ ] **★ KH-trust — the IDE hooks fire WITHOUT a "Run / Reject" prompt (D-194, the live confirmation of KG11).**
      On the FIRST build turn after the restart, watch the chat: the kit's `cmk-inject` / `cmk-capture` hook commands (`cmd.exe /c cmk hook …`) must run **silently** — NO "Hook Command … Run / Reject" approval prompt. This is the live proof that `kiroAgent.trustedCommands` (KG11) auto-approves them.
      **PASS:** turns proceed and capture/inject fire (KH1/KH2) with **no per-turn Run/Reject prompt** for a `cmk hook` command. **FAIL:** Kiro pops "Hook Command … Run / Reject" for `cmd.exe /c cmk hook promptSubmit` (or `stop`) — the trust entry didn't take. _(If it fails: confirm KG11's `.vscode/settings.json` has the entry, and that you opened the SAME project folder — `trustedCommands` is workspace-scoped. A stale Kiro session from before the install won't have re-read settings; fully restart.)_

- [ ] **★ KH1 — the IDE capture hook FIRES and captures a real turn (IDE 1.0: `cmk-capture.json` trigger `Stop`; IDE 0.x: `cmk-capture.kiro.hook` trigger `agentStop`).**
      After a build turn ends in Kiro IDE, the capture hook ran `cmk hook stop` automatically. Verify the turn was captured:
      ```powershell
      type context\sessions\now.md          # the just-ended turn's content is here
      Get-ChildItem context\.locks\*.log | % { Select-String $_ -Pattern "capture|stop" } | Select-Object -First 5
      ```
      **PASS:** a real turn from this Kiro session landed in `now.md` / the capture log — with **no manual `cmk` command** run. **FAIL:** `now.md` is empty after several turns (the hook registered but never fired) — that's the 50.M blocker.

- [ ] **★ KH2 — the IDE inject hook FIRES — recall is injected (IDE 1.0: `cmk-inject.json` trigger `UserPromptSubmit`; IDE 0.x: `cmk-inject.kiro.hook` trigger `promptSubmit`).**
      Mid-session, the inject hook ran `cmk hook userPromptSubmit` (0.x: `promptSubmit`), surfacing recalled memory into Kiro's context. After a few turns, ask in Kiro IDE something memory should answer (e.g. *"what port are we on again?"*).
      **PASS:** Kiro answers from injected memory (port 8000, the layered structure) without re-reading the code — and the inject hook appears in the hook activity / `now.md` shows the recall path. **FAIL:** Kiro globs the code to re-derive what memory already holds.

- [ ] **★ KH3 — a crashed hook never breaks the Kiro session (always-exit-0).**
      The dispatcher catches every error and exits 0 (a non-zero hook exit BLOCKS the Kiro tool — AWS docs). Sanity-check the invariant deterministically:
      ```powershell
      cmd.exe /c cmk hook stop ; echo "exit=$LASTEXITCODE"          # empty/garbage stdin → still exit 0
      cmd.exe /c cmk hook totally-unknown-event ; echo "exit=$LASTEXITCODE"   # unknown event → no-op, exit 0
      ```
      **PASS:** both print `exit=0`. **FAIL:** any non-zero exit (a real Kiro session would stall on that tool).

### Kiro IDE 1.0 v1-hook probes (50.N.3 / D-203) — ⚠️ check your Kiro IDE version FIRST

> **Which format does your Kiro IDE use?** Kiro IDE **1.0+** loads the **v1** per-hook files `.kiro/hooks/cmk-{capture,inject,guard,observe}.json` and treats the legacy `cmk-*.kiro.hook` files as "legacy · Migrate" (INERT — no double-fire, verified D-203d). Kiro **0.x** loads the legacy files and ignores the v1 json. The kit writes BOTH. **The v1 SCHEMA + the `Stop` capture trigger are ground-truth-confirmed (D-203d — Kiro 1.0's own migration of our hook produced exactly our format).** **On 1.0, run KH1/KH2/KH3 + these probes against the v1 files; on 0.x, the legacy KH1/KH2 apply.**

- [ ] **★ KHv1-load — does Kiro IDE 1.0 AUTO-LOAD the installer-written v1 file?** (D-203 item 1) After `cmk install --ide kiro`, open the project in Kiro IDE 1.0 and check the **Agent Hooks panel**. **PASS:** the 4 `core-memory-kit:` hooks (recall / capture / delete-guard / observe-edit) appear ENABLED without you creating them in the GUI. **FAIL:** the panel is empty or shows them disabled/needs-create → the kit must add a post-install "reload Kiro window" step (or the GUI must import the file). _This is the load-bearing probe — if the file isn't auto-loaded, none of the IDE hooks fire._
- [ ] **★ KHv1-guard — does the IDE `PreToolUse` hook BLOCK a memory delete?** (D-203 items 2+3+M4) In the IDE chat, ask the agent to delete `context/sessions`. **PASS:** the `cmk-guard-memory` hook fires and the delete is BLOCKED (the agent reports it couldn't). **Capture three things:** (a) WHICH exit code blocked (the guard exits 2 — confirm the IDE honors non-zero / specifically 2, item 3); (b) what argv/env/stdin the `PreToolUse` command received (the path the guard inspects, item 2 — point the hook at a stdin-logging probe if needed); (c) the guard completed within its `timeout: 5` on a cold Windows `cmd.exe /c` spawn, AND what the IDE does on a guard TIMEOUT (allow vs block — M4: if it fails-CLOSED on timeout, a slow cold start would spuriously block tools; if so, raise the timeout). **FAIL:** the delete runs → the hook didn't fire, the IDE didn't pass the path, or it didn't block on the exit code.
- [ ] **★ KHv1-observe — does `PostToolUse` (matcher `fs_write`) fire observe-edit?** (D-203 item 4 + review I1) Have the agent create a >50-line file. **PASS:** `context/sessions/now.md` gets a `… file=… lines=6X` summary. **FAIL — capture the discriminating data:** if no summary, **dump the real `PostToolUse` payload** (point the hook at a stdin-logging probe) — observe-edit needs `{tool_name:'fs_write', tool_input, tool_response}`; if the IDE's `PostToolUse` carries a different shape (or the matcher token isn't `fs_write`), record the real spelling and update the bin's `KIRO_EDIT_TOOL_MAP` / the matcher. _(We deliberately use `PostToolUse`, NOT `PostFileSave` — a file-SAVE event wouldn't carry a tool_name, so observeEdit would silently noop. If `PostToolUse` doesn't fire on an agent file-write but `PostFileSave` does, that's the fallback — but it then needs a save-payload adapter in observeEdit.)_
- [ ] **★ KHv1-capture — `Stop` is CONFIRMED (D-203d); verify it FIRES.** The capture hook is `cmk-capture.json`, `trigger:"Stop"` — Kiro 1.0's OWN migration produced exactly this, so the trigger name is no longer a guess. **PASS:** capture fires at turn end (now.md grows). **FAIL:** capture never fires → the hook didn't auto-load (KHv1-load) or `Stop` needs a payload the kit doesn't read. _(Each hook is its OWN file now — a problem with one can't dark the others.)_
- [ ] **★ KHv1-inject — does `UserPromptSubmit` inject recall in the IDE?** Ask a question whose answer is in memory. **PASS:** the answer reflects injected memory without a re-brief. **FAIL:** no recall → the inject hook's stdout isn't surfaced as context (the v1 stdout→context contract differs).

> **If the v1 probes FAIL on a real Kiro IDE 1.0:** the IDE legs are "wired but the platform doesn't fire them as expected" — fall back to documenting the IDE limit honestly (like Task 165(b) originally did) and lean on the kiro-cli surface, which IS verified. Do NOT mark 50.N.3 done on green unit tests alone — these live probes are its real done-criteria (the unit tests only prove the FILE is written correctly, not that Kiro fires it).

---

## 3. Capture checks — read the files

(Agent-agnostic — the capture/extract core is shared. Same as the Claude-Code gate's §3; abbreviated here.)

```powershell
cmk search "layered"; cmk search "type hints"; cmk search "port 8000"
type context\MEMORY.md
dir context\memory; type context\memory\project_*.md
```

- [ ] **B1 — auto-capture fires.** Your decisions/prefs show up **without** "remember this".
- [ ] **★ B2 — rich capture.** Durable preferences are rich fact files (frontmatter + `**Why:**` + `**How to apply:**`), not bare one-liners.
- [ ] **★ B9 — auto-extract writes RICH project facts.** At least one `context\memory\project_*.md` carries `write_source: auto-extract` + `trust: medium` + a Why/How body — captured from the Kiro session with no `cmk remember`.
- [ ] **★ B3 — the wedge fills.** `type $env:USERPROFILE\.core-memory-kit\HABITS.md` (+ `USER.md`, `LESSONS.md`) → your cross-project style is there (real user tier; backed up in §0c).
- [ ] **★ B4 — stated rule → `trust: high`, automatically.** The uv/ruff rule landed in a user-tier scratchpad on its own: `findstr /S /C:"trust: high" $env:USERPROFILE\.core-memory-kit\*.md`.

---

## 4. Explicit capture probes — run in the build terminal

(Agent-agnostic CLI surface — identical to the Claude-Code gate. Run the standing privacy/sanitization probes; abbreviated.)

- [ ] **C1 — terse.** `cmk remember "We deploy with Kamal to Hetzner, never Vercel."` → appears in `context\MEMORY.md`.
- [ ] **C2 — rich.** `cmk remember "Reflection beats one-shot generation" --type feedback --title "reflection-loop" --why "..." --how "..."` → rich `feedback_reflection-loop.md`.
- [ ] **C3 — Poison_Guard.** `cmk remember "key sk-ant-api03-AAArealishlookinglongtokenvalue00"` → rejected (exit 2), nothing written.
- [ ] **C4 — sanitization.** `cmk remember "venv at C:\Users\<you>\proj\.venv"` → the file shows `~\…`, never your username.
- [ ] **★ C5 — `<private>` stripped on the write path.** `cmk remember "host prod-7 <private>root pw hunter2-SECRET</private>" --type project` → `Select-String context\memory\*.md,context\memory\INDEX.md -Pattern "hunter2-SECRET"` finds nothing.
- [ ] **★ FQ1 — FTS5 query sanitization.** `cmk search "v0.4"` / `cmk search "user-explicit"` / `cmk search "section:search"` → results or clean "no results", never an `FTS5 parse error`.

---

## 4b. The conversational surface — Kiro drives the MCP tools  ⬅️ the Kiro in-chat headline

The regular Kiro user **never types `cmk`** — they talk, and Kiro runs the MCP tools. Run these **in a real Kiro session** (IDE or kiro-cli), not the terminal. This is the surface the CLI suite structurally can't cover.

- [ ] **★ M0 — the MCP tools are live in Kiro.**
      In Kiro, say: *"list your cmk MCP tools."*
      → `mk_remember, mk_search, mk_get, mk_timeline, mk_cite, mk_recent_activity, mk_trust, mk_lessons_promote, mk_forget, mk_queue_list, mk_queue_resolve` (**11**).
      **PASS:** all 11 resolve. **FAIL / empty:** the MCP server didn't launch — re-check KG2 + that you restarted Kiro.

- [ ] **★ M1 — capture in chat, PROMPT-FREE (the D-196 live confirmation of KG2's autoApprove).**
      Say: *"remember our staging runs on Fly.io — because it's cheap to spin ephemeral envs up and down."*
      **PASS:** Kiro calls **`mk_remember`** (an MCP tool, not a shell command) and it runs with **NO "Reject / Trust / Run" prompt** — the `autoApprove`/`allowedTools` pre-approval (KG2/D-196) made it silent; the "because" makes it a rich fact. **FAIL:** Kiro pops a Reject/Trust/Run on the `mk_remember` call → the `autoApprove` didn't take (re-check KG2; a stale Kiro session from before the install won't have re-read `mcp.json` — fully restart).

- [ ] **★ M2 — "forget X" → two-step, then gone.**
      Say: *"actually, forget the Fly.io staging decision."*
      **PASS, in order:** (1) the first `mk_forget` returns a preview + confirm token (nothing deleted yet); (2) after you confirm, the second call tombstones it; (3) *"where does staging run?"* → gone (no Fly.io), no manual reindex.

- [ ] **M3 — "trust this / not important".** Capture two throwaway facts, then *"that one's important — keep it"* / *"eh, not important."* **PASS:** Kiro calls `mk_trust` with `high` then `low`.

---

## 5. Session 2 (kiro-cli) — the terminal client + recall  ⬅️ a NEW kiro-cli session

This is the **CLI-agent live gate** — the half KG6 only proves on disk. Start `kiro-cli` in the project with **NO `--agent` flag**, so the default-agent resolution is what's under test.

```powershell
cd C:\Temp\kiro-ide-gate10
# the CLI agent lives in your REAL ~/.kiro/agents/ (backed up in §0c)
kiro-cli chat        # NO --agent flag — cmk must resolve as the DEFAULT agent
```

Without re-explaining anything, ask: *"What are my standing cross-project rules, and how is this project structured?"* then *"Add a `/health` endpoint."*

- [ ] **★ KC1 — the default agent resolves with no `--agent` flag.**
      `kiro-cli chat` started the **cmk** agent automatically (because the kit registered `cmk` as the default in `~/.kiro/settings/cli.json`).
      **PASS:** the session runs as the cmk agent (its `agentSpawn` hook fired — see KC2); you never passed `--agent`. **FAIL:** kiro-cli starts a different/blank agent → the default-agent registration didn't take (the D-182 bug the guard exists to avoid).

- [ ] **★ KC2 — `agentSpawn` injects at session start (the SessionStart analog).**
      At kiro-cli session start, the `agentSpawn` hook ran `cmk hook agentSpawn`, injecting the memory snapshot.
      **PASS:** the very first answer (the "standing rules + structure" question) names your rules (uv/ruff/type-hints/layered) + the structure (port 8000, Claude SDK) **without a re-brief** — proof the snapshot was injected at spawn. **FAIL:** kiro-cli has no memory of Session 1 (inject didn't fire).

- [ ] **★ KC3 — `stop` captures at turn-end in kiro-cli.**
      After a kiro-cli turn, the `stop` hook ran `cmk hook stop`.
      ```powershell
      type context\sessions\now.md          # the kiro-cli turn is captured here too
      ```
      **PASS:** a kiro-cli turn landed in `now.md` / the capture log — same shared core as the IDE hook, different client. **FAIL:** kiro-cli turns aren't captured.

- [ ] **★ KC4 — MCP reachable from the kiro-cli session.**
      In the kiro-cli chat, say *"search your memory for the port we use."*
      **PASS:** the MCP `mk_search` resolves the fact (port 8000) — the `mcpServers.cmk` entry in the agent-config works from the terminal client.

- [ ] **★ KG-guard — the memory delete-guardrail BLOCKS a memory delete in kiro-cli (D-192/193; VERSION-DEPENDENT — see D-198).**
      The agent-config wires a `preToolUse` hook (matcher `*`) → `cmk-guard-memory`, which exits 2 to BLOCK a destructive command aimed at a memory path. **★ VERSION GATE (D-198, the hard-won lesson):** whether this works at all depends on the **kiro-cli version**:
      - **kiro-cli V2 (≤2.8.x):** embedded `preToolUse` fires → the guard works. Run the test below; expect BLOCKED.
      - **kiro-cli V3 (2.9+):** **`preToolUse` does NOT fire** — V3 redesigned hooks (standalone `.kiro/hooks/*.json` PascalCase + `permissions.yaml` for tool-blocking; the startup banner warns "migration tooling coming soon"). The kit's V2-style guardrail is superseded; on V3 the delete is caught by **kiro-cli's OWN shell-approval prompt** instead. **This is NOT a kit-bug FAIL on V3** — it's a documented platform shift, deferred to Task 166. Check your version (`kiro-cli --version` or the `KIRO_VERSION` env); on V3, KG-guard via our hook is **expected-not-to-fire** and the gate item is N/A until Task 166.
      **The test (V2):** in the kiro-cli chat, *"run this in the shell for me: `rm -rf context/sessions`"* (THROWAWAY project). Approve when kiro-cli prompts (its OWN shell-approval gate fires BEFORE our `preToolUse` — that prompt is NOT our guard). On Windows the model rewrites `rm -rf` → `Remove-Item -Recurse -Force` (the guard blocks both — `execute_command` + `execute_bash` are both in SHELL_TOOLS). **PASS (V2):** "BLOCKED by the core-memory-kit delete-guardrail…" surfaces, `context/sessions` survives. **FAIL (V2):** delete runs → check KC1 (is cmk the resolved-active agent? `kiro-cli agent list` should show `* cmk`) and that the live `~/.kiro/agents/cmk.json` validates (`kiro-cli agent validate --path …` — a UTF-8 BOM from a PowerShell edit makes kiro reject it).
      **★ DIAGNOSTIC (D-198, when nothing fires):** if NO hook fires (not even capture/inject), the agent config is in the WRONG place or not resolved. Verify `kiro-cli agent list` shows `* cmk Global` — if it shows `* kiro_default` instead, the kit's agent didn't register (the D-198 bug: config must be `~/.kiro/agents/cmk.json` + `~/.kiro/settings/cli.json` `chat.defaultAgent:cmk`, NOT `~/.aws/amazonq/`). A probe (point a hook at a script that logs stdin) settles fire-vs-not.
      _Also confirm a SAFE shell command still runs (ask for `ls` — must NOT be blocked)._
      _**IDE scope note:** the Kiro IDE has NO kit `preToolUse` guardrail (IDE hooks are UI-defined, "no file an installer can write") — it relies on Kiro's own native confirm-before-destructive. Don't run KG-guard in the IDE._

- [ ] **D2 — style follow-through.** `/health` lands as a thin, type-hinted route in `api/`, without being re-told your style.

---

## 6. Session 3 — the cold-open (the wedge)  ⬅️ a BRAND-NEW Kiro project

```powershell
# A genuinely FRESH folder each run (never reuse one that already ran cmk install).
mkdir C:\Temp\kiro-ide-coldopen; cd C:\Temp\kiro-ide-coldopen
git init
# Set a REALISTIC-BUT-FICTIONAL git identity so a `uv init` echo tests the
# privacy SCREEN, not a real leak (and NOT example.com — that's allowlisted):
git config user.name "Alex Personname"; git config user.email "alex.personname@gmail.com"
cmk install --with-semantic --ide kiro
```
Open in Kiro (or `kiro-cli chat`). Ask: *"Start a new Python backend for me — set up the structure."*

- [ ] **★ E1 — cold-open (the wedge).** It scaffolds the **layered** shape + `uv`/`ruff` tooling **without being told** — because the Session-1 persona (sandboxed user tier) injected. *"How does it know that?"* = the wedge. **The gate that matters most** — and it proves the persona injects through Kiro's hook, not just Claude Code's.

- [ ] **★ E2 — the privacy screen (Task 148, the leak this incident CREATED).**
      During the Kiro session, do something that echoes the git-config identity into
      tool output — e.g. `uv init` (it reads `Alex Personname / alex.personname@gmail.com`).
      Let one more turn pass (the L3 judge runs in the detached child — the
      committed transcript lags by seconds), then check:
      ```powershell
      # PASS = the committed transcript shows «EMAIL»/«NAME», NOT the real identity:
      Select-String -Path C:\Temp\kiro-ide-coldopen\context\transcripts\*.md `
        -Pattern "alex.personname|Alex Personname|«EMAIL»|«NAME»"
      # …and the originals survive ONLY in the gitignored recovery log:
      Get-Content C:\Temp\kiro-ide-coldopen\context\.locks\redactions.log
      ```
      **PASS:** the committed `{date}.md` carries `«EMAIL»` (L1 masked it at capture)
      and `«NAME»` (L3 judge caught the bare name at promote); the real
      `alex.personname@gmail.com` / `Alex Personname` appear **only** in the
      gitignored `redactions.log`. The `*.live.md` buffer (unscreened) is gitignored.
      _The capture that feeds the screen is **Kiro's** capture hook — the IDE `agentStop`/`Stop`
      hook (`cmk-capture.json`) or the kiro-cli `stop` hook — NOT Claude Code's Stop hook;
      both dispatch the SAME `cmk hook stop` → `captureTurn()` core, so the screen behaves
      identically, only the trigger differs. This is the exact leak that blocked the v0.5.0
      tag (D-294); E2 confirms it's closed on the Kiro wiring._

- [ ] **★ E3 — the learn-loop fires automatically (v0.5.0 headline; Tasks 190–193, ADR-0017).**
      The loop is OBSERVE-ONLY in v0.5.0 — it LOGS outcome signals (doesn't yet rank).
      **★★ Automatic-path rule (D-169): assert the artifacts WITHOUT running any `cmk`
      command by hand — Kiro's SessionStart-equivalent inject hook + a natural turn are the
      only triggers.**
      After the cold-open session above (which injected memory + ran in-chat searches),
      and after one turn that produced an **outcome** (a tool call that failed, or you
      corrected a recalled fact — the oracle-free failure signal), check:
      ```powershell
      $L = "C:\Temp\kiro-ide-coldopen\context\.locks"
      # (1) RECALL-LOG — Kiro's inject hook (IDE `UserPromptSubmit`/`promptSubmit`, kiro-cli
      #     `agentSpawn`) logged the snapshot's ids; an in-chat search logged its returned
      #     ids + query (NO `cmk search` run by hand):
      Get-Content "$L\recall.log" | Select-String '"source":"inject"' | Select-Object -First 1
      Get-Content "$L\recall.log" | Select-String '"source":"search"' | Select-Object -First 1
      # (2) TRUST-SIGNALS — the judge (on Kiro's capture/stop hook) wrote a delta for the turn's outcome:
      Get-Content "$L\trust-signals.log" -ErrorAction SilentlyContinue | Select-Object -Last 3
      # (3) EXPECTATIONS — if any assistant turn carried a `PREDICTION: …` line, it landed PENDING:
      Get-Content "$L\expectations.log" -ErrorAction SilentlyContinue | Select-Object -Last 2
      ```
      **PASS:** `recall.log` has BOTH a `source:"inject"` line (ids match the injected
      snapshot, written by Kiro's inject hook) AND a `source:"search"` line (the in-chat
      query) — proving recall is attributed with **no manual command**; AND
      `trust-signals.log` carries a sane-delta entry from the turn's outcome (the judge
      fired on Kiro's capture/stop hook alone). A `judgment_<slug>.md` under `context\memory\`
      is a bonus if a `PREDICTION:` resolved.
      _Honest asymmetry (record it): within one session the loop reliably fires on FAILURE
      signals (failed command / correction / PREDICTION:MISS); it cannot self-confirm a
      SUCCESS within-session (success is silent — value surfaces next session on recall).
      So E3 proves the failure-signal path; the success path is a cross-session property.
      The loop rides the SAME cores as Claude Code — only Kiro's inject/capture hooks are the
      triggers — so this log IS the Task-194 release-gate artifact: v0.5.1 ranking is approved
      only on real, sensible `trust-signals.log` deltas (no false-positives, no storms)._

---

## 7. Full feature sweep — every `cmk` subcommand  (~15 min, in `C:\Temp\kiro-ide-gate10`)

The `cmk` CLI is agent-agnostic — this sweep is identical to [`cut-gate.md`](cut-gate.md) §7. Run **F-1 … F-19** there (recall/index, persona, lifecycle, memory-management, health/repair, native-coexistence, MCP/transcripts, the L2 ladder). They are not re-listed here; nothing about them is Kiro-specific.

**The one Kiro-specific lifecycle check:**

- [ ] **★ KU1 — `cmk uninstall --ide kiro` removes ONLY our Kiro surfaces, byte-preserves the rest, never touches `context/` (D-189).**
      In `C:\Temp\kiro-ide-gate10` (NEVER a real project):
      ```powershell
      cmk uninstall --ide kiro     # the per-agent Kiro uninstall (NOT bare `cmk uninstall`, which is the Claude surface)
      dir .kiro\hooks              # ALL cmk hooks GONE — both v1 (cmk-*.json) and legacy (cmk-*.kiro.hook)
      type .kiro\settings\mcp.json # our server key gone; a sibling user server (if any) preserved
      type .kiro\steering\cmk.md   # our marker block stripped; user content outside markers byte-preserved
      type AGENTS.md               # our managed block stripped; user AGENTS.md content (if any) byte-preserved
      type .vscode\settings.json   # our kiroAgent.trustedCommands entries GONE; a user's own trusted commands + sibling settings preserved (D-194)
      dir $env:USERPROFILE\.kiro\agents   # our cmk.json GONE + our chat.defaultAgent pointer un-registered; any user-authored agent preserved
      "context/ preserved (expect True): $(Test-Path context\MEMORY.md)"
      ```
      **PASS:** uninstall removes our IDE hooks + MCP key + steering block + AGENTS.md block + skills + trusted-commands + CLI agent-config; leaves any user-authored sibling (a non-`managedBy:core-memory-kit` agent, a sibling MCP server, user steering/AGENTS.md text, the user's OWN `.vscode` trusted commands + settings) byte-untouched; AND **`context/` is preserved** (the shared brain is never deleted). **FAIL:** a user file was deleted, `context/` was touched, or a managed surface lingered.

- [ ] **★ KU2 — dual-agent coexistence (D-188).** A project can carry BOTH agents. In a throwaway project, install both and confirm neither clobbers the other; uninstall one and the other survives:
      ```powershell
      $d = "C:\Temp\kiro-dual"; Remove-Item -Recurse -Force $d -EA SilentlyContinue
      mkdir $d > $null; Set-Location $d; git init | Out-Null
      cmk install                  # Claude Code first → CLAUDE.md + .claude/skills
      cmk install --ide kiro       # add Kiro → .kiro/ + AGENTS.md, Claude surface UNTOUCHED
      "CLAUDE.md still here (True): $(Test-Path CLAUDE.md)"
      "Kiro hooks added (True):     $(Test-Path .kiro\hooks\cmk-capture.json)"   # v1 (the current IDE-1.0 format)
      cmk uninstall --ide kiro     # remove ONLY Kiro
      "Kiro gone (False):           $(Test-Path .kiro\hooks\cmk-capture.json)"
      "Claude survives (True):      $(Test-Path CLAUDE.md)"
      Set-Location C:\Temp\kiro-ide-gate10; Remove-Item -Recurse -Force $d -EA SilentlyContinue
      ```
      **PASS:** both installs coexist (the second never clobbers the first); `cmk uninstall --ide kiro` removes only the Kiro surface and leaves the Claude one. **FAIL:** the second install clobbered the first, or uninstall removed the wrong agent's files.

---

## 8. Portability

Same as the Claude-Code gate — `context/` is committed and travels with `git clone` (tenet T2). The `.kiro/` surfaces (hooks/steering/skills/mcp) are committed too, so a clone is Kiro-ready; the CLI agent-config (`~/.kiro`) is machine-local and re-created by `cmk install --ide kiro` on the new machine.

- [ ] **★ H1** — clone `C:\Temp\kiro-ide-gate10` elsewhere, open in Kiro → the project memory (`context/`) + the `.kiro/` surfaces are already there.

---

## 7b. The agent-relative backend + split-brain, Kiro edition (Task 200 + 201)  ⬅️ the v0.4.5 gates

On a Kiro install, the automatic engine runs through **`kiro-cli chat`** (off the Kiro/Google login, no API key — live-verified D-278). Since this operator HAS kiro-cli, **KG-BK4 is directly runnable here.** KG-BK1..3 are CLI-deterministic.

- [ ] **★ KG-BK1 — `cmk doctor` HC-11 (kiro-cli present).** On a fresh `--ide kiro` install, `cmk doctor` reports **14** checks and HC-11 = PASS naming `kiro-cli`. To prove the FAIL path, script `runDoctor({ projectRoot, userDir, backendCliProbe: () => ({ agent: 'kiro', bin: 'kiro-cli', present: false, reason: 'kiro-cli not found on PATH' }) })` → HC-11 = FAIL with the honest "automatic features degraded, file-only still works" message. **PASS:** 14 checks; HC-11 PASS with kiro-cli present, FAIL (naming it) when absent. **FAIL:** a wrong check count, or a silent SKIP when absent (the D-270 bug).
- [ ] **★ KG-BK2 — `cmk install --backend <agent>` (split-brain + fail-fast).** In a throwaway dir: `cmk install --ide kiro --backend claude` → `context/settings.json` carries `backend.agent: claude`, and the install line warns about the EFFECTIVE backend CLI (`claude`), not kiro-cli. `cmk install --ide kiro --backend banana` → exit 2 + supported list, **no `context/` scaffolded** (fail-fast BEFORE scaffold). **PASS:** valid override writes the key + warns about the effective CLI; a bad value fails fast with no half-install. **FAIL:** the flag is ignored, wrong CLI warned, or a typo leaves a scaffolded-but-exit-2 project.
- [ ] **★ KG-BK3 — `cmk config show`.** In the `--backend claude` project from KG-BK2: `cmk config show` names the **installed-for** agent (`kiro`), the **active backend** agent (`claude`) marked as an override, the backend-CLI presence, and the semantic mode, exiting **0**. **PASS:** the readout reflects the override, exits 0. **FAIL:** doesn't reflect the override or exits non-zero.
- [ ] **★ KG-BK4 — live kiro-cli spawn (runnable HERE).** On a default `--ide kiro` install (backend = kiro-cli), seed a session buffer, trigger a real compression (`cmk roll --scope now`), and confirm a real Markdown summary lands in `sessions/` — produced by `kiro-cli chat` (not a refusal, not empty). **Live-verified on the dev machine (D-278/D-280): `kiro-cli chat --no-interactive --model claude-haiku-4.5 --trust-tools=` with the prompt on stdin returned a correct summary, ~1–7s, 0.01 credits.** **PASS:** a real summary lands via kiro-cli. **FAIL:** a refusal, empty, or timeout.

---

## Verdict + the cut

**Cut v0.4.0 if** every **★** passes —
`KG1, KG1b, KG2, KG3, KG4, KG5, KG6, KG7, KG8, KG9, KG10, KG11, KH-trust, KH1, KH2, KH3, M0, M1, M2, KC1, KC2, KC3, KC4, KG-guard, E1, E2, E3, KU1, KU2, H1` (the Kiro surface + live gates) **and** the agent-agnostic standing gates from [`cut-gate.md`](cut-gate.md) (`B2, B9, B3, B4, C5, FQ1, F-3, F-11b` + the recall ladder where it overlaps). **For a v0.4.5+ cut also run `KG-BK1..KG-BK4` (§7b — the agent-relative backend + split-brain; KG-BK4 is runnable on this Kiro gate).**

**The 50.M live-test is KH1/KH2 (IDE hooks FIRE) + KC1/KC2/KC3 (kiro-cli default-agent + hooks FIRE).** These are the checks unit tests structurally can't reach — "the hook is written correctly" (the suite proves that) ≠ "the hook fires and captures a real turn in a real Kiro session" (only this gate proves that). The D-182 8-point checklist maps to: default resolves w/o `--agent` (KC1), inject+capture FIRE not just register (KH1/KH2/KC2/KC3), non-clobber guard (KG7), MCP reachable (KG2/KC4/M0), timeout composition (KG5/KG6 carry the `timeout`/`timeout_ms` ceilings; KH3 proves a slow/failed hook exits 0).

Record the live result (which checks passed, any findings) in **tasks.md 50.M** + a **DECISION-LOG** entry.

**Then preserve the evidence + restore your real dirs (the binding restore — mirror of §0c):**

```powershell
# Point at the run dir from §0c. Auto-pick the NEWEST 12_v0.4.0_kiro* dir (or set
# $run by hand to the exact name §0c printed if you ran more than one).
$root = "C:\cut-gate-backups"
$bk   = (Get-ChildItem $root -Directory -Filter "12_v0.4.0_kiro*" | Sort-Object LastWriteTime -Desc | Select-Object -First 1).FullName
$run  = Split-Path $bk -Leaf
"restoring from run dir: $bk"

# 1. PRESERVE the test artifacts as evidence (run-prefixed, self-identifying)
Copy-Item $env:USERPROFILE\.core-memory-kit       "$bk\$run-AFTER-.core-memory-kit" -Recurse -EA SilentlyContinue
Copy-Item C:\Temp\kiro-ide-gate10                          "$bk\$run-AFTER-test-project"       -Recurse -EA SilentlyContinue
Copy-Item $env:USERPROFILE\.kiro\agents              "$bk\$run-AFTER-kiro-agents"        -Recurse -EA SilentlyContinue
"$(Get-Date -Format o) — gate finished; artifacts copied above." | Out-File "$bk\NOTES.md" -Append   # -Format o, NOT -o (PowerShell 5.1)

# 2. RESTORE the user tier (it was MOVED aside in §0c — put the original back verbatim)
Remove-Item -Recurse -Force $env:USERPROFILE\.core-memory-kit -EA SilentlyContinue
if (Test-Path "$bk\$run-.core-memory-kit") {
  Move-Item "$bk\$run-.core-memory-kit" $env:USERPROFILE\.core-memory-kit
}

# 3. RESTORE ~/.kiro — it was COPIED (your real agents/settings were never moved), so just
#    delete ONLY the cmk files the gate added + un-register our default pointer. Leave the rest.
Remove-Item $env:USERPROFILE\.kiro\agents\cmk.json -EA SilentlyContinue   # if WE wrote it (check NOTES.md — skip if it pre-existed)
$cli = "$env:USERPROFILE\.kiro\settings\cli.json"
if (Test-Path $cli) {
  $j = Get-Content $cli -Raw | ConvertFrom-Json
  if ($j.'chat.defaultAgent' -eq 'cmk') { $j.PSObject.Properties.Remove('chat.defaultAgent'); ($j | ConvertTo-Json) | Set-Content $cli -Encoding utf8 }
}
#    (NOTES.md lists what was in ~/.kiro BEFORE — if cmk.json / a cmk default pointer pre-existed, do NOT remove them.)

# 4. clean the throwaway project dirs (NOT the backups)
Remove-Item -Recurse -Force C:\Temp\kiro-ide-gate10, C:\Temp\kiro-ide-coldopen, C:\Temp\kiro-guard-kiro, C:\Temp\kiro-guard-proj -EA SilentlyContinue
Remove-Item Env:\MEMORY_KIT_KIRO_DIR -EA SilentlyContinue   # in case the KG7 probe left it set
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

Per-finding notes go in a dated doc under [`../journey/`](../journey/), not here — this stays a clean script.
