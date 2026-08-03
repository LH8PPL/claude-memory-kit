# Features — the full detail

The [README](../README.md) lists what the kit does in one line each. This file is the long form: what each capability actually does, and why it works the way it does.

> Every capability below ships in the current release. For what changed in each version, see the [CHANGELOG](../CHANGELOG.md).

## Remembering

### Remembers across sessions

A frozen snapshot of your project + persona injects once at session start, so Claude leads with what it knows instead of re-deriving it from code.

### Tells live knowledge from finished work

The injected snapshot labels its in-flight sections (`Active Threads`, `Pending Decisions`) as work-state-as-last-captured, so an agent resuming your project won't re-run a task that already shipped. Durable facts keep their full authority.

### Starts with a memory, not from zero

`cmk import-sessions` bootstraps the memory from your **existing** Claude Code history: past sessions are summarized into dated memory ("as if captured live"), screened for secrets/PII before anything lands in a committed file, and searchable immediately. `cmk install` detects existing history and offers it (one question, default-skip). Resumable — a killed run keeps its progress, and a re-run imports only new sessions.

## Capturing

### Captures automatically, prompt-free

A background pass reads each turn and saves durable facts as searchable notes. No "save" button. When you *do* say "remember this," the kit auto-approves its **own** tools and skills so the save happens with no "Allow?" prompt — nothing else is touched.

### Keeps capturing even when the extractor fails

If the background pass times out or errors, capture doesn't silently drop the turn: a deterministic no-LLM fallback keeps your durable statements, routed through the normal review queue and tagged with its own provenance so a heuristic capture is never mistaken for a real one. Memory degrades to *partial*, never to nothing.

### Fills in the days it missed, from your git history

If a session crashed, a hook misfired, or you spent the day in another tool and only committed, that day had work but no memory of it. Measured on this repo, that was **37% of working days**. The kit notices those gaps and rebuilds a short log of what you did from that day's commits — **automatically, on the nightly pass, no command to remember**. A reconstruction is marked as one rather than passed off as a captured session, and a real session log is never overwritten. `cmk backfill --dry-run` shows the gaps if you want to look first.

### Survives a long session, not just a clean exit

When the agent compacts its context mid-session (the marathon case), the kit rolls the session buffer right then. The roll previously had only two triggers, and neither fires *during* a session: a clean window-close (which a long session often never gets) and the *next* session's start (too late to help this one). Nothing was ever lost — the buffer is on disk from the first turn — but it could sit unconsolidated for days. The compaction handler gates in milliseconds and hands the work to a background pass, so your compaction never waits on memory.

## Recalling

### Recalls by meaning

Ask in your own words ("where do credentials go") and get the right fact even with zero keyword overlap. Fully local, zero API calls — **R@5 0.941 / paraphrase 1.000** ([benchmarks](../README.md#benchmarks)). And a hit isn't a dead end: `cmk expand` returns the **neighborhood** around it (the rest of its section in the source file) — the recall ladder's middle rung between a search hit and a raw-transcript drill.

### Learns how you work, everywhere

State a habit once ("always use uv, never pip") and a brand-new project cold-opens already knowing it.

### Learns from outcomes — memory that keeps working ranks higher

The kit watches what happens *after* a memory is recalled (a failing command, you correcting the agent, the same question re-asked) and adjusts each fact's utility score. Once a fact has real evidence (3+ outcome signals), search ranking blends it in: a fact that keeps failing sinks below a healthy one for the same query — automatically, no command.

A fact that's floored and *still* failing is never silently deleted: it lands in a review queue (`cmk queue prune`) where you choose — **convert** it into a `⚠️ AVOID` anti-pattern warning (kept + injected, so the mistake isn't re-derived), forget it, or vouch for it. Judgments never auto-rank, and the session-start snapshot is untouched.

The whole process is **observable**: `cmk stats memory-health` reports writes-per-search, empty-search rate, redundant writes, and snapshot pressure with week-over-week trend arrows — so you can see the memory getting healthier (or tell when it isn't).

### Stays TRUE as it ages, not just stored

Facts carry a temporal shape ("ongoing state" vs "happened once" vs "planned"), facts with a shelf life expire on their own (`--expires 2026-08-01` → hidden from recall, recoverably archived), and a weekly pass catches state changes: when a newer fact supersedes an older one ("cut-gate in progress" → "published to npm"), the old state's validity window closes so recall answers with the *current* state — history intact, and the next session opens with a one-line note of what was resolved.

History questions *reach* the history: asking "what did we use before X" or "how did Y change" automatically pulls in the expired/superseded facts a normal search hides — each **labeled** (`[superseded — kept for history]` / `[expired]` / `[retracted]`) so the agent never mistakes history for the present; current facts stay unlabeled, zero noise.

## Safety and privacy

### Stays private + bounded

Secrets are screened before **every** committed-tier write — not just the ones you type, but the LLM-written summaries, transcript promotions, and trust upgrades too — machine paths are abstracted to `~`, and rolling compression keeps memory small as history grows (and the nightly compression is resumable: if it's interrupted at 80%, it keeps the 80% and picks up where it left off, never re-doing finished work).

Because `context/` is committed to git, the kit also **screens personal/sensitive content automatically**: a deterministic pass masks emails / phone numbers / your username before anything touches disk, and an async judge catches names, addresses, and health details in prose — so a transcript lands screened, a sensitive fact routes to a gitignored local-only note, and nothing personal reaches a committed file (kill-switch: `privacy.screen: off`).

### Guards against accidental deletion

A hook **blocks** a destructive command (`rm`, `git reset --hard`, …) the moment it targets a memory path, before it runs.

## Health and recovery

### Tells you when it's broken, instead of failing quietly

Memory that silently stops saving is the one failure worth catching, and it used to look exactly like nothing happening. Now the kit records its own failures as it works, and when something is *genuinely* broken it says so on your next prompt — one line, to Claude, naming the problem and the fix.

Claude can then load a **troubleshooting skill** that holds the repair steps per failure, and repairs your memory only with your say-so (it rebuilds its own index unasked; anything touching your files or settings is proposed for you to approve).

It's quiet by design: a one-off hiccup that recovers on its own never says a word, evidence older than a week is ignored, and the moment the next run succeeds the warning disappears on its own — nothing to dismiss, nothing to reset. If capture is fully down you also get a visible heads-up, because that's the case where silence costs you sessions. `cmk doctor` reports the same thing when you go looking (HC-14).

### Rescues memory an older version stranded

Upgrading isn't only forward-looking. If a past version left an orphaned `context/` folder in a subdirectory (a real bug, fixed in v0.6.2 — automatic capture forked a second, unread copy when the agent ran from a subfolder), the next `cmk install` finds it and brings those facts back into your project's memory **with their original ids and dates intact**, skipping anything already there and never resurrecting something you forgot. The old folder is left untouched with a delete command printed for your shell — deleting memory is always your call, never the kit's.

## Seeing and sharing

### Lets you SEE your memory — `cmk view`

One command opens a browser tab on everything the kit has captured: a search box over your facts, each fact's full Why/How with its trust and where it came from, a graph where trust is the colour and supersession is the direction, the health checks, and the decision journal with retracted entries struck through.

It's **ephemeral** — it binds a free port on your own machine, serves until you press Ctrl-C, and leaves no background service running. It's **read-only, structurally**: there is no write route to attack or misclick, so changing something means copying the `cmk forget` / `cmk trust` command the page shows you and running it in your shell. And it never leaves your machine: it binds `127.0.0.1`, refuses any other address (it serves your memory with no password — so there is no "expose it" mode), and works with no network at all. The same URLs answer JSON, so it doubles as a local read API.

See also [OBSIDIAN.md](OBSIDIAN.md) — your memory tier is plain markdown, so Obsidian opens it as a vault with no export step.

### Shows you around

`cmk tour` (or `/tour` in conversation) walks you through YOUR memory: what's been captured, where it lives, how to get it back — real counts and your own fact titles, never invented examples.

### Works across your agents

The same memory brain on **Claude Code**, **[Kiro](https://kiro.dev)** (IDE + `kiro-cli`), **[Cursor](https://cursor.com)**, and **[Codex](https://developers.openai.com/codex)**. A project's `context/` is shared, so memory you build in one is there in the others. The automatic engine runs through *your* agent's own CLI (using the login you already have — no extra API key).

You can even **split the brain**: code in one agent, run the frequent background memory work through a *cheaper* one (`cmk install --backend kiro` → keep your premium subscription for coding, run the janitor LLM on `kiro-cli`). `cmk config show` tells you which agent is doing what.

### Per-project, in your repo

`context/` lives in your project and travels with `git clone`. Each project keeps its own memory. And when uncommitted memory piles up, Claude offers a **one-tap commit** — you approve, Claude runs the git command; the kit itself never touches git.

---

**Where to go next:** [QUICKSTART](../QUICKSTART.md) to install · [CLI.md](CLI.md) for every command · [ARCHITECTURE.md](../ARCHITECTURE.md) for how it fits together · [design.md](../specs/design.md) for the mechanism detail.
