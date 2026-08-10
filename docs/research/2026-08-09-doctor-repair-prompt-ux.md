# Prompt-then-fix UX in doctor-style CLIs — the outward look for Task 47

**Date:** 2026-08-09
**Method:** manual survey via subagent, primary sources only — official docs, actual `--help` output run on this machine, and official repository source. No blog posts, no third-party summaries.
**Why:** Task 47 sits in the named corpus gap *"self-healing CLI repair UX"* ([sweep note](2026-07-20-prior-art-sweep-backlog-vs-corpus.md)), so outward research was REQUIRED before designing.
**Relationship to the existing note:** [2026-07-29-self-healing-cli-repair-ux.md](2026-07-29-self-healing-cli-repair-ux.md) answered *who may fix without asking* (the silent / confirm / advise split, which became `fixClass` in the health registry). This one answers the question that one did not reach: **once you have decided to ask, what does asking look like — and what happens when there is nobody there to answer?**

---

## 1. Every doctor in the survey is report-only

| Tool | Fixes? | The hand-off |
| --- | --- | --- |
| `brew doctor` | **No.** *"Check your system for potential problems. Will exit with a non-zero status if any potential problems are found."* | Actively de-escalates its own output: *"these warnings are just used to help the Homebrew maintainers with debugging… please don't worry or file an issue; just ignore this."* |
| `flutter doctor` | **No.** The command calls `doctor.diagnose()` and modifies nothing. | Its report line *is* the instruction: `Some Android licenses not accepted. To resolve this, run: flutter doctor --android-licenses`. The one repair affordance is a separately named flag which then **shells out** to the vendor's `sdkmanager --licenses` and pipes real stdin into it — flutter never owns the prompt. |
| `npm doctor` | **No.** *"verifies the following items in your environment, and if there are any recommended changes, it will display them."* | Repair lives in a sibling command entirely (`npm audit fix`). |

Sources: <https://docs.brew.sh/Manpage> · flutter `packages/flutter_tools/lib/src/commands/doctor.dart` + `src/android/android_workflow.dart` (master) · <https://docs.npmjs.com/cli/v11/commands/npm-doctor>

**Two also offer per-check addressability**, which is worth knowing: `brew doctor --list-checks` (*"List all audit methods, which can be run individually if provided as arguments"*) and `npm doctor [connection] [registry] [versions] [environment] [permissions] [cache]` (verified from local `--help`, npm 11).

**What we took:** `cmk doctor` stays report-only and `--repair` is opt-in. The convergence is real and a deviation has to earn itself.

**Why we deviated anyway:** brew's findings are for maintainers to read on an issue, and flutter's repair belongs to a vendor tool. The kit's recoveries are its OWN idempotent verbs (`cmk reindex`, `cmk register-crons`, `cmk repair --hooks`) — the user gains nothing from retyping a command the tool just printed and could run itself.

---

## 2. `gh` has the cleanest non-interactive contract, and it is a refusal

Verified empirically on gh 2.90.0 with stdin redirected from `/dev/null`:

```text
$ gh label delete xyz-nope < /dev/null
--yes required when not running interactively

Usage:  gh label delete <name> [flags]

Flags:
  --yes   Confirm deletion without prompting
```

Exit code **1**. It does not default to yes, and it does not default to no — it **refuses, names the flag that would have worked, and reprints usage**. `brew bundle cleanup` says the same thing from the other end: it returns 1 if the prompt *"cannot be shown."*

`gh`'s prompt API takes the default **per call site** (`Confirm(prompt string, defaultValue bool)`), and high-stakes deletions use a stronger primitive entirely — `ConfirmDeletion(requiredValue string)`, prompting *"Type %q to confirm deletion"*: type-the-name, not y/N.

Sources: local `gh --help` / `gh help exit-codes` (2.90.0) · `internal/prompter/prompter.go` (trunk) · <https://cli.github.com/manual>

**What we took:** no terminal is never an implicit yes. `cmk doctor --repair` prints the commands and names `--yes`. We print rather than refuse outright because the user asked for a diagnosis and got one — throwing the report away would be worse — and doctor's own non-zero exit already stands, so the run cannot be mistaken for success.

**The trade this avoids, stated plainly:** silent-yes is dangerous; **silent-no exits 0 while leaving the system broken**, which is this repo's own HC-10 false-green class.

**Not taken:** the type-the-name primitive. The kit's answer for irreversible actions is stronger — it does not offer them at all (see §3).

---

## 3. `--yes` is not honored where the blast radius is ambiguous — two independent tools

- **`gh repo delete`:** *"For safety, when no repository argument is provided, the `--yes` flag is ignored and you will be prompted for confirmation."* Verified non-TTY: `gh repo delete --yes` with no argument → `cannot non-interactively delete current repository. Please specify a repository or run interactively`, exit 1.
- **`apt-get -y`:** *"Automatic yes to prompts… run non-interactively"* — then: *"If an undesirable situation, such as changing a held package, trying to install an unauthenticated package or removing an essential package occurs then apt-get will abort."* It also has `--assume-no`, a symmetric opposite most tools lack.

Sources: <https://cli.github.com/manual> · <https://manpages.debian.org/trixie/apt/apt-get.8.en.html>

**What we took:** the manual class — destructive recoveries, ones carrying an unfilled `<placeholder>`, and prose instructions — stays print-only **under `--yes`** exactly as without it. This also keeps `--repair` from becoming a route around the D-192/D-193 delete-guardrail.

---

## 4. `npm audit`'s tiered ladder — considered, and REJECTED

Three rungs in one command family: `npm audit` reports; `npm audit fix` auto-applies **only** the safe subset with **no prompt at all** (*"If remediations do not require changes to the dependency ranges, then all vulnerable packages will be updated"*); anything needing a range change requires `--force`.

Source: <https://docs.npmjs.com/cli/v11/commands/npm-audit>

**Rejected for the kit.** It is the right model for a package manager and the wrong one here, for a reason specific to this change: Task 48 exists *because* the ask-before-you-change-my-machine rule had no requirement backing it for over a year. Shipping a no-prompt tier in the same change that finally writes that requirement down would be arguing both sides. Every runnable repair is offered; none is assumed.

---

## 5. `git clean -i` — the recorded upgrade path for multi-finding repair

```text
*** Commands ***
1: clean                2: filter by pattern    3: select by numbers
4: ask each             5: quit                 6: help
What now>
```

Four selection modes over one problem list; the prompt-suffix convention is load-bearing (single `>` = pick one, double `>>` = multi-select). The design point worth stealing is its documented rationale: **`-i` ignores `clean.requireForce`** *"as this mode gives its own safety protection by going interactive."* Interactivity **substitutes for** the force gate rather than stacking on it.

Source: <https://git-scm.com/docs/git-clean>

**What we took:** `--repair` interactive does not additionally demand a force flag.
**Deferred:** the numbered menu itself. Our per-item loop *is* `ask each`, and the kit's failure counts are small enough that the other three modes would be ceremony. If per-item prompting ever proves too slow, this is the proven shape — paired with per-check addressability (`--repair HC-07`), which brew and npm both support.

---

## 6. Could NOT verify from a primary source — recorded as gaps, not filled from memory

- **`rustup`'s `-y` semantics.** The official book shows `-y` only inside a shell example and never defines it.
- **A repo-wide git `--[no-]interactive` convention.** `git clean` uses `-i`; nothing verified beyond that command.
- **`npm doctor`'s exit code and output format.** Docs silent, `--help` silent.
- **The default answer (y/N vs Y/n) at gh's individual `Confirm` call sites.** The signature takes a per-call default; the call sites were not read.
- **`flutter doctor` with stdin not a TTY.** Confirmed there is *no* TTY check in the source; what actually happens (sdkmanager hangs vs exits) was not run.

---

## 7. Net effect on the build

| Decision | Source |
| --- | --- |
| `cmk doctor` stays report-only; `--repair` is opt-in | §1 convergence (brew / flutter / npm) |
| No terminal → print the commands and name `--yes`; never assume | §2 (`gh`, verified live; `brew bundle cleanup`) |
| `--yes` never covers deletes / placeholders / prose | §3 (`gh repo delete`, `apt -y`) |
| Per-repair `[y/N]`, default **No**, for everything runnable | §4 rejection of the no-prompt tier |
| Interactive mode needs no additional force flag | §5 (`git clean -i`) |
| Per-check addressability + a selection menu | §5 / §1 — deferred, shape recorded |

Landed as design §14.1, NFR-10, and D-448.
