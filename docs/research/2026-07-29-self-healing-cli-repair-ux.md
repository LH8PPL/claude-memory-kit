---
date: 2026-07-29
topic: Self-healing / repair UX in CLI dev tools — the auto-fix / confirm / advise split, noise suppression, and agent-era precedent (Task 250 outward research)
source: Manual survey (subagent-driven, primary sources fetched 2026-07-29)
tags: [task-250, health-nudge, self-heal, doctor, prior-art, D-374-corpus-gap]
---

# Self-healing / repair UX in CLI dev tools — outward research for Task 250

**Why this note exists:** Task 250 (failure-driven health nudge + troubleshooting skill) sits in the D-374 corpus gap "self-healing CLI repair UX" — outward research was REQUIRED before designing (D-375). Detection prior art was already covered by the [Octopoda-OS code dive](2026-07-22-octopoda-os-code-dive.md) (10 deterministic loop classifiers + the pattern-aware false-positive suppressor) and is deliberately excluded here. This note covers the OTHER half: how shipped tools go from "a failure happened" to "it's fixed."

**How it was used:** this research ran DURING the 2026-07-29 Task 250 grill session and directly shaped the ratified design (D-412) — the split rule, the Warnable-shaped registry, the `TimeToVisible`-class noise gate, and the per-code repair book all trace to findings below.

## Per-tool findings

### 1. Homebrew

- **`brew doctor` is diagnose-only, by design.** Manpage: *"Check your system for potential problems. Will exit with a non-zero status if any potential problems are found."* `--list-checks` enumerates the check registry (each check is a named method on `Homebrew::Diagnostic::Checks`). No fix flag exists on doctor (`--fix` belongs to `brew style`/`brew audit`, a different surface). <https://docs.brew.sh/Manpage>, <https://docs.brew.sh/rubydoc/Homebrew/Diagnostic/Checks.html>
- **Deliberate false-positive disclaimer as noise suppression** — the Troubleshooting doc: *"If everything you use Homebrew for is working fine: please don't worry or file an issue; just ignore this."* Doctor's phrasing explicitly downgrades its own warnings to "potential." <https://docs.brew.sh/Troubleshooting>
- **The silent auto-heals live elsewhere, piggybacked on commands the user already ran:** `brew install` runs `brew update` first (auto-update, with a fast `--auto-update` mode); update *"perform[s] any necessary migrations"* (tap migrations, formula renames) silently; and *"Unless `$HOMEBREW_NO_INSTALL_CLEANUP` is set, `brew cleanup` will then be run for the installed formulae or, every 30 days, for all formulae"* (plus `HOMEBREW_CLEANUP_PERIODIC_FULL_DAYS`). Every auto behavior has an opt-out env var. <https://docs.brew.sh/Manpage>, <https://docs.brew.sh/FAQ>
- **Advise-not-autofix when the fix is expensive:** the shallow-clone case — `brew update` hard-errors and prints the exact `git fetch --unshallow` command instead of running it, explicitly because unshallowing is *"an extremely expensive operation"* (done at GitHub's request; auto-running it would hammer CI). Cost is a stated reason to demote from silent-fix to advise. <https://github.com/Homebrew/brew/issues/9420>
- Trigger model: doctor = user-run (socially mandated before filing issues); heals = piggyback on normal commands. No daemon.

### 2. `flutter doctor`

- **Diagnose + advise, never auto-fix.** Per-validator status line (`[✓]`/`[!]`/`[✗]`), and each failing validator prints the exact remediation command inline ("To resolve this, run: flutter doctor --android-licenses"). <https://docs.flutter.dev/platform-integration/android/setup>
- **The one guided fix is a subcommand, not an auto-fix:** `flutter doctor --android-licenses` walks an interactive accept flow — a confirm-class loop, isolated behind an explicit flag because it's a legal acceptance the tool can't make for you.
- Actionable-vs-informational phrasing is treated as a product surface — flutter/flutter PR #25269 exists solely to make doctor's missing-plugin messages consistent and correctly actionable across IDE contexts. <https://github.com/flutter/flutter/pull/25269>
- Code auto-repair is deliberately a separate tool (`dart fix` / Flutter fix, with dry-run → apply), not mixed into doctor. <https://docs.flutter.dev/tools/flutter-fix>

### 3. `git maintenance` / `git gc --auto` — the gold standard for silent background self-heal

<https://git-scm.com/docs/git-maintenance>, <https://git-scm.com/docs/git-gc>

- **Trigger:** two-channel — (i) piggyback: *"Some Git commands implicitly run `git gc --auto` after execution"*; (ii) schedule: `git maintenance start` registers platform-native schedulers (cron / systemd timers / launchctl / **schtasks on Windows** — the exact portfolio the kit's `register-crons` uses).
- **What makes silent safe (four stacked mechanisms):**
  1. **Only-if-needed thresholds** — every task has a `maintenance.<task>.auto` threshold (100 loose objects, 100 unreachable commits, 10 un-indexed packs…); below threshold, exit doing nothing.
  2. **Exclusive object-database lock with skip-on-contention** — if two maintenance runs collide, one *skips* rather than blocks or corrupts. Losing a run is an accepted cost.
  3. **`maintenance.autoDetach=true`** — heal in a detached background process so the foreground command never pays.
  4. **Strategy tiering** — the `incremental` strategy (default when registered) runs only cheap idempotent tasks in the background and **disables `gc`** (the expensive, semi-destructive one) entirely. Expensive repair never runs unattended.
- Everything here is silent-class — the user is never asked, never told, and nothing user-visible is ever destroyed (pruning has grace periods; reflog protects).

### 4. `npm doctor` / `pnpm doctor`

- **`npm doctor`:** connectivity ping, npm/node versions, git in PATH, cache/global-bin/node_modules permissions, and cache tarball checksum validation. Report + recommend only — *"if there are any recommended changes, it will display them"*; corruption → it tells you to run `npm cache clean -f` yourself. (The actual repair verb, `npm cache verify`, lives outside doctor.) <https://docs.npmjs.com/cli/v11/commands/npm-doctor>
- **`pnpm doctor`:** *"checks for known common issues with pnpm configuration"* — versions/install method, global bin on PATH, store/cache writability, filesystem link-strategy support, registry connectivity, plus an **offline install smoke test that exercises the resolve/store/link path end-to-end** (a live-verify inside the doctor — checks the OUTCOME, not the config; the D-298/HC-10 lesson shipped by someone else). Report only. <https://pnpm.io/cli/doctor>

### 5. rustup

- **Silent self-update piggybacked on user commands:** `rustup update` also updates rustup itself, and *"rustup will automatically update itself at the end of any toolchain installation"*; opt out per-run (`--no-self-update`) or persistently (`rustup set auto-self-update disable|check-only`). <https://rust-lang.github.io/rustup/basics.html>
- **Silent auto-install of missing state:** a `rust-toolchain.toml` makes any proxied command (`cargo build`) implicitly install the missing toolchain — self-heal of absent state, zero prompts. The transparency cost is documented in their own tracker: issue #4445 asks rustup to *say* the download is due to auto-installation, because a silent multi-hundred-MB heal with no attribution confuses users. Component auto-install has also regressed across versions (#2686, #4216) — an implicit-heal contract is easy to break silently. <https://github.com/rust-lang/rustup/issues/4445>, <https://github.com/rust-lang/rustup/issues/2686>

### 6. Tailscale Warnables — the best failure-driven-nudge design found

<https://pkg.go.dev/tailscale.com/health> (field docs quoted there), plus <https://github.com/tailscale/tailscale/pull/12406> (the migration from ad-hoc strings to structured warnings).

- **Pure failure-event model, present-only-when-broken:** a `Warnable` is registered once; code calls `SetUnhealthy(w, args)` when the condition holds and `SetHealthy(w)` when it clears. The overall state is `Warnings map[WarnableCode]UnhealthyState` — *"If a Warnable is healthy, it will not be present in this map."* **Self-clean lifecycle is structural, not a cleanup job.** Surfaced in `tailscale status` and GUIs only while unhealthy.
- **The struct is a ready-made nudge schema:** `Code` (stable id), `Title` (one line), `Text(args)` (detail generator with dynamic args), `Severity` (drives modal-vs-quiet display), `BrokenSince`, and — directly relevant — **`PrimaryAction`** on `UnhealthyState` (a suggested action attached to the warning).
- **Two structural noise suppressors:**
  - **`TimeToVisible`** — *"the Duration that the Warnable has to be in an unhealthy state before it should be surfaced… to prevent transient errors from being displayed"* (e.g. `NetworkStatusWarnable` waits 5s).
  - **`DependsOn`** — *"if any of these Warnables are unhealthy, then this Warnable is not relevant and should be considered healthy"* — cascade dedup: don't show "logged out" while "daemon down" is active.
  - Plus `ImpactsConnectivity` as a does-this-actually-hurt-you priority bit.
- **Failure mode to learn from:** Android issue #19241 — warnings *stuck after the underlying issue cleared*. A stale nudge is worse than none; the SetHealthy path needs the same test coverage as SetUnhealthy. <https://github.com/tailscale/tailscale/issues/19241>
- No public `tailscale doctor` command; there is an internal `doctor` package of deeper checks run for diagnostics/bugreport. <https://pkg.go.dev/tailscale.com/doctor>

### 7. AI-agent-era precedent (the least-covered area)

- **Claude Code `/doctor` — the first mainstream doctor that repairs, and its mechanism is "hand the report to the model."** Official docs: `/doctor` *"reports what it finds, including invalid settings files, duplicate installations, unused extensions… then proposes fixes it applies only after you confirm."* And the earlier design is even more on-point: *"Before v2.1.205, `/doctor` opened a read-only diagnostics screen and pressing `f` sent the report to Claude to fix."* The diagnostic report is literally the machine-readable repair instruction, and the model is the mechanic. CLI `claude doctor` stays read-only. MCP server failures are surfaced to the *user* via `/mcp` status — not whispered to the model. <https://code.claude.com/docs/en/debug-your-config>
- **Claude Code hooks are the documented whisper channel:** `additionalContext` — *"passes a string from your hook into Claude's context window. Claude Code wraps the string in a system reminder"*; `UserPromptSubmit`/`SessionStart` stdout *"is added as context that Claude can see and act on"*; `PostToolUse` exit-2 stderr is shown to Claude. The self-healing lint loop (write → hook runs validator → errors injected as additionalContext → agent fixes) is a documented community pattern, not a shipped default. `systemMessage` is explicitly user-facing only — the docs already draw the human-channel vs model-channel line Task 250 needs. <https://code.claude.com/docs/en/hooks>
- **Nx Self-Healing CI — the most complete auto/confirm/advise policy shipped anywhere:** trigger = CI task failure (no-op if all green). Default = **propose + human approve** (PR comment with diff + approve/reject, editor notification). **Auto-apply only when ALL of:** task matches a configured glob allowlist, AND AI confidence is high, AND the fix is *"explicitly verified"* to fix the failing task (re-run). A built-in preset auto-fixes only **deterministic** checks (`nx format:check`, `nx sync:check`, `nx conformance:check`). Guardrails: protected-branch prefixes, never-fix glob patterns (e.g. `*e2e*`), draft-PR toggle. Local agents connect over MCP to consume the failures. <https://nx.dev/docs/features/ci-features/self-healing-ci>
- **Sentry Seer — failure-event → agent fix, with an actionability threshold:** manual trigger always available; **auto-trigger only when the issue is "highly actionable with 10+ events captured and medium-or-above fixability score"** — a shipped quantitative gate on when an AI fixer may self-start. Flow: root-cause → solution → PR; can hand off to the user's own coding agent "with full context already loaded." <https://docs.sentry.io/product/ai-in-sentry/seer/autofix>
- **MCP-native repair tools exist but are embryonic:** e.g. `npm-dev-mcp`'s `auto_recover` tool — an agent-callable recovery sequence (health assess → remediate → verify, with `maxRetries`/`forceRecover` params and a JSON result of steps taken + final health). Its own docs don't define what "unhealthy" means — evidence the category exists, not that it's mature. <https://glama.ai/mcp/servers/@masamunet/npm-dev-mcp/tools/auto_recover>. The MCP spec itself has **no standard health/repair surface**; third-party guides hand-roll `/health` endpoints and the MCP Inspector is a human debugging UI. <https://mcpcat.io/guides/building-health-check-endpoint-mcp-server/>

## Synthesis

### (1) The auto-fix / confirm / advise split — the observed decision rule

| Class | When | Evidence |
| --- | --- | --- |
| **(a) Silent auto-fix** | Fix is **cheap, idempotent, reversible, and touches only tool-owned state** — AND runs piggybacked on a command the user already issued or a registered schedule. Never destroys user-authored content. | git maintenance (thresholds + lock-skip + detach + expensive-task-excluded), brew auto-update/auto-cleanup (opt-out env vars), rustup self-update + toolchain auto-install |
| **(b) One-confirmation fix** | Fix is **derivable but consequential**: legal acceptance, config rewrite, code change. Tool prepares the exact fix, human taps once. | `flutter doctor --android-licenses`; Claude `/doctor` "applies only after you confirm"; Nx default approve-in-PR flow; `dart fix --dry-run`→`--apply` |
| **(c) Advise with the exact command** | Fix is **expensive** (brew unshallow — cost is an explicitly stated reason), **outside the tool's authority** (install Android Studio), or **possibly a false positive** (all of brew doctor). | brew shallow-clone error, flutter doctor remediation lines, npm doctor recommendations |

Two cross-cutting observations:

- **Doctor commands almost never fix.** brew/flutter/npm/pnpm doctor and CLI `claude doctor` are all report-only; the heals live *elsewhere* (piggybacked in normal commands, or behind explicit repair verbs). The doctor is the map, not the mechanic. Claude Code's in-session `/doctor` is the first mainstream break from this — and it breaks it by delegating the fixing to the model with confirmation.
- **Auto-apply is earned per-fix, not per-tool.** Nx's three-condition gate (allowlisted class + confidence + verified-by-rerun) and its deterministic-checks-only preset are the most explicit statement of when confirm may collapse into silent: *deterministic fix, verified outcome*.

### (2) Noise-suppression patterns

1. **Transient gate** — Tailscale `TimeToVisible` (unhealthy for N before surfacing); same family as git's numeric `auto` thresholds (100 loose objects) and Sentry's 10-events gate. Never nudge on first occurrence (of a transient class).
2. **Cascade dedup** — Tailscale `DependsOn`: suppress downstream warnings while an upstream one is active. One root cause = one nudge.
3. **Present-only-when-broken + structural self-clean** — the Warnables state map: healthy warnings simply aren't in the map. No "resolved" residue, no cleanup pass. (And #19241 shows the stuck-warning failure mode when the clear path is under-tested.)
4. **Severity/impact bits drive display intensity** — `Severity` + `ImpactsConnectivity` decide modal vs quiet, not whether to record.
5. **Scope guards on auto-action** — Nx protected branches + never-fix globs; brew opt-out env vars per auto behavior.
6. **Self-deprecating copy** — brew doctor's "please don't worry… just ignore this": when precision is imperfect, say so in the message itself rather than suppressing.
7. **Skip-don't-queue on contention** — git's lock behavior: a missed heal run is acceptable; a pileup is not.

### (3) Directly reusable for the per-prompt whisper + troubleshooting skill

- **Copy the Warnable schema for the nudge registry.** Per health condition: stable `code`, one-line `title`, `severity`, `dependsOn`, transient-gate threshold, `brokenSince`, and **`primaryAction` = the exact `cmk` repair command**. Whispers derived from state that entries *leave* when healthy gives Task 250's self-clean lifecycle for free — and it composes with the Octopoda counting-window finding (that note's repeated-not-transient gate is the `TimeToVisible` analog).
- **The whisper channel is already documented product surface:** `UserPromptSubmit` stdout / `additionalContext` is Anthropic's sanctioned way to put "X is broken, run Y" in front of the model, wrapped as a system reminder; `systemMessage` is the separate human channel. The kit's design maps 1:1 onto shipped semantics.
- **The troubleshooting skill = Claude Code's pre-2.1.205 `f` key, productized.** Precedent says: doctor produces a structured report; the *model* consumes it and executes repairs; anything consequential is propose-then-confirm. So: whisper carries only `code + one-liner + "load the troubleshooting skill"`; the skill holds the per-code repair procedures and the (a)/(b)/(c) classification per fix.
- **Classify each cmk repair using the observed rule:** silent for idempotent kit-owned state (reindex, stale-lock sweep — the git-maintenance class, with only-if-needed thresholds and skip-on-lock); confirm for anything rewriting user memory content or config; advise-with-exact-command for expensive or outside-authority fixes (reinstall hooks, re-register crons — which are also this repo's existing autopilot stop-conditions).
- **pnpm doctor's offline-install smoke test** endorses outcome-probing inside a doctor (exercise the real write path against temp state) — aligned with the kit's live-verify direction and the D-298 lesson that heartbeat checks false-green.
- **Nx's auto-apply gate** is the template for when the *agent* may fix without asking: deterministic fix class (allowlist) + verified by re-running the failing check afterward.

### (4) Honest gaps — no prior art found

1. **No shipped tool automatically whispers its own broken state into a coding agent's per-prompt context.** Claude `/doctor` is user-initiated; hook-based self-repair loops are user-built patterns, not product defaults; Nx/Sentry are cloud/CI failure→agent pipelines, not a local CLI surfacing its own health to the agent working alongside it. Task 250's core move appears genuinely novel; the *ingredients* (Warnable schema, hooks channel, report-to-model repair) all have precedent, the *composition* does not.
2. **No cross-tool machine-readable repair-manifest convention.** Nothing like a standard doctor JSON schema with `{code, severity, repairCommand, confirmRequired}`; every tool's output is bespoke prose. MCP has no spec-level health/repair surface either.
3. **Snooze/acknowledge is essentially absent from CLI-land.** GUI monitoring products have it; no surveyed CLI doctor or nudge system offers "I know, stop telling me" (nearest: brew's per-behavior opt-out env vars, Nx never-fix globs — permanent, not temporal). The kit's design deliberately avoids snooze state (statelessness = structural self-clean), which the survey supports by absence.
4. **Nobody measures nudge efficacy** — no surveyed tool tracks whether its advice was followed or whether auto-heals correlate with reduced failure recurrence (rustup #4445 shows even *attributing* a silent heal is unsolved).

## Verification caveats

All findings are from official docs/repos fetched 2026-07-29 except: (i) flutter doctor output format (official setup docs + a flutter/flutter PR, not doctor.dart itself); (ii) Claude Code hook-injection semantics carry known open bugs (issue #19909 lists cases where `additionalContext`/`systemMessage` reportedly fail to inject on some events — **live-test the real injection before the kit depends on a specific event**, which the Task 250 done-criteria require anyway); (iii) the pre-/post-2.1.205 `/doctor` behavior split is from the current official docs page describing its own version history.
