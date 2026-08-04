# Health checks

The yes/no checks `cmk doctor` runs against the kit installation. Most have a self-repair path; HC-10 is informational (the kit self-heals automatically — no repair needed). (The two memsearch checks — formerly HC-1 "installed" + HC-7 "reachable" — were removed in Task 120: the kit ships keyword-only and the Layer-5b semantic backend is not yet shipped; the backend choice is deferred per design §9.3.1.)

| ID | Check | How to verify |
| --- | --- | --- |
| HC-1 | Stop + SessionStart hooks registered (**agent-aware**, D-185/186) | **Claude Code:** `.claude/settings.json` has `cmk-inject-context` in SessionStart, `cmk-capture-turn` in Stop, `cmk-compress-session` in SessionEnd (structural walk, not substring match). **Kiro:** PASSes if the IDE hooks (`.kiro/hooks/`) OR the CLI agent (`~/.kiro/agents/cmk.json`) are present — a Kiro-IDE-only or kiro-cli-only user reads clean. **Cursor:** `.cursor/hooks.json` carries `cmk cursor-hook` on sessionStart + afterAgentResponse. **Codex:** `.codex/hooks.json` carries `cmk codex-hook` on SessionStart + Stop (matcher-group aware; the pass message reminds about the one-time /hooks trust). It's a capability check (is capture/inject wired for *this* agent), not a Claude-only file check. |
| HC-2 | Daily distill is fresh (≤ 2 days) | `context/sessions/recent.md` mtime is within 2 days of `now` |
| HC-3 | Transcripts are firing (≤ 3 days) | At least one `context/transcripts/*.md` has mtime within 3 days |
| HC-4 | INDEX.md matches `context/memory/` | `[PUL]-XXXXXXXX.md` filenames in INDEX = fact files on disk (excluding INDEX itself) |
| HC-5 | Cron jobs registered with host scheduler | `context/.locks/cron-registered` sentinel exists (written by `cmk register-crons`) |
| HC-6 | Native Anthropic Auto Memory status detected | Inspect `~/.claude/projects/<slug>/memory/`; write single-line JSON snapshot to `context/.locks/native-memory-status.log`. Non-fatal informational. |
| HC-7 | No stale lock files | `detectStaleLocks(projectRoot, {userDir})` from [packages/cli/src/lock-discipline.mjs](packages/cli/src/lock-discipline.mjs) returns no entries with `stale: true` |
| HC-8 | Native bindings present (npm 12 readiness) | `require('better-sqlite3')` loads its `.node` binding; when `search.default_mode` is `hybrid`/`semantic`, the embedder import is probed too (distinguishing not-installed from installed-but-binding-broken). Fails with the exact `--allow-scripts` remediation when npm 12 blocked the install script (Task 141a, D-129) |
| HC-9 | Project scaffold version matches the installed `cmk` | Compares the project's CLAUDE.md managed-block `:start vX` marker against the installed binary version (`getKitVersion()`). FAILs with `cmk install` when the binary is newer (you updated the global package but didn't re-stamp this project — Task 162, D-176), when CLAUDE.md carries DUPLICATE managed blocks (a copy-paste / kept-both-sides merge; `cmk install` folds them into one — Task 220, D-322), OR when a KIT-OWNED scaffold file (`.claude/skills/*`) differs from this version's template (content-compare — the marker alone can't see a stale skill; `cmk install` refreshes kit files, never your memory — Task 230, D-343); PASSes on match or a benign downgrade; SKIPs when the project has no managed block. **Also WARNs (never fails) when the installed binary itself is behind the npm registry's published `latest`** (Task 245, D-382/D-388 — the silent-upgrade-failure class: a quiet `npm i -g` that leaves the old version in place keeps every other check green, because they all compare against the installed binary). Soft by design: a plain registry GET with a 2.5 s timeout, skipped under CI / `CMK_SKIP_UPDATE_CHECK=1`, silent on any network failure |
| HC-10 | Scheduled compaction is alive (informational) | Reads `isCompactionNeeded()` (`compaction-state.mjs`, Task 167): flags a **registered cron that looks dead** (the `cron-heartbeat` stamp older than ~2× the cron interval), a **stale `today-*.md`** (older than the latest session), or a **non-draining `now.md`**. **Informational, NOT a chore** — memory still self-heals automatically every session (the lazy roll is the floor); a dead cron is a degraded optimization, not data loss. Never prescribes a manual command. SKIPs when no cron is registered (the default — the lazy roll covers it) |
| HC-11 | Backend LLM CLI is available | Probes the CLI of the agent this project runs its automatic engine on (`agentCliOnPath` in `agent-cli.mjs`, Task 200) — `claude` / `kiro-cli` / `cursor-agent` / `codex`, resolved by `resolveBackendAgent` (install kind or the `backend.agent` override). An **exit-code `--version` probe** (not mere presence — a broken Windows shim resolves but errors, D-274). **FAILS with an honest degrade** when the CLI is absent: capture / search / recall / the delete-guard keep working (files + SQLite), only the automatic LLM steps (compression / auto-extract / persona) wait until you install it — never a silent no-op (the D-270 bug this closes) |
| HC-12 | Tombstoned facts cascaded out of derived surfaces | `checkDeletionPropagation()` (`deletion-propagation.mjs`, Task 210 / D-308): for each **tombstoned** fact, verifies its content is verifiably gone from every derived surface — the SQLite/FTS index (a row must not outlive the tombstone) and the distilled summaries (`recent.md` / `archive.md` / the banked `today-*.distilled.md` artifacts — NOT the raw `today-*.md` session buffers, which no scrub reaches and which age out via the roll), matched on the fact's distinctive content + its citation id (a `[redacted: …]` marker is never a needle — batch-scrub boilerplate). **FAILS** naming the exact surviving file + fact id (a forgotten fact still living in a summary distilled *before* the forget); surface-aware recovery — `cmk reindex` for an index survival, `cmk redact`/a re-distill for a summary survival. **SKIPs as explicitly vacuous** when nothing has been forgotten yet (the Always-On survey's AOEP negative-invariant: a no-deletion system must not read as "verified"). The forward path is closed at write time — `daily-distill` span-replaces already-tombstoned content (at bank AND at assembly) before writing a new summary — so this check reports the *legacy* survivals a scrub still needs |
| HC-13 | No stray memory tiers below the project root (advisory) | `scanStrayTiers()` ([packages/cli/src/memory-recovery.mjs](packages/cli/src/memory-recovery.mjs), Task 248): a pruned, depth-4 walk below the project root for `context/` / `context.local/` dirs carrying **live** state (a fact file, a populated INDEX.md, a non-empty `sessions/now.md`, or another populated surface — a template scaffold has none of these and is never flagged). A pre-v0.6.2 capture bug (D-389) forked such a tier whenever the agent's cwd was a subdirectory. **WARNs, never FAILs** — nothing is broken: the stray is frozen, its facts were already relocated by `cmk install`, and what remains is a folder to delete. This check is the **backstop, not the fix** (P-3PWCGWZH): recovery happens automatically in the install flow, and install stays silent on re-runs, so the standing "this folder can go" reminder lives here. Recovery hint is `cmk install`; the **kit never deletes a memory path** (ADR-0018 / D-193) |
| HC-14 | Active kit health warnings (advisory) | `hc14HealthWarnings` (`activeWarnings()` in [packages/cli/src/health-log.mjs](packages/cli/src/health-log.mjs), Task 250): reads the kit's own health log and reports any active failure codes still carrying a warning. **WARNs, never FAILs** — advisory only; passes as "No active kit health warnings" when the log is clean. **SKIPs when the health log itself cannot be read** (unreadable, or something other than a file at that path) — an unrun check must never read as "verified", the AOEP negative-invariant HC-12 applies to deletions; the log's own reader is fail-open by design for the per-prompt hot path, which is right there and would be a false green here. A repair hint is shown only when it is a real next step (`cmk reindex`); when the code's action is `cmk doctor` — the command you just ran — none is printed and the message points at the `troubleshooting` skill instead |
| HC-15 | Semantic vectors match their own facts | `hc15VectorMapping` (`verifyVectorMapping()` in [packages/cli/src/semantic-backend.mjs](packages/cli/src/semantic-backend.mjs), Task 261 / D-421): samples up to 50 live facts, re-derives `sha256(model
body)` from each body, and **byte-compares the content-addressed cache entry against the vector physically stored in that fact's vec slot** — deliberately independent of the kit's own `vec_map` bookkeeping, so an error in the map is caught too. Cheap by design: no embedder is loaded and no model call is made (one indexed lookup + one blob compare per row), so it can run on every `cmk doctor`. **FAILS** with the mismatch count and the offending fact ids, recovery `cmk reindex --full` (which rebuilds the mapping offline — the embedding cache is content-addressed, so nothing is re-embedded). **SKIPs** when there is nothing to audit: no index, no semantic layer (the embedder is optional), or nothing mapped yet. A body not yet embedded under the current model is reported as `unverifiable`, never as corruption |

**Severity on a fresh project:** HC-2, HC-3, and HC-5 report **SKIP**, not FAIL, when there's simply nothing to check yet — no distill built (HC-2), no Claude Code session captured here yet (HC-3), or cron not registered (HC-5, which is *optional*: the kit falls back to lazy-on-read compression). A clean install therefore reads `pass · 0 fail · skip` and `cmk doctor` exits `0`. These flip to **FAIL** only on a genuine problem: a *stale* distill (recent.md exists but > 2 days old), or transcripts that exist but stopped firing (> 3 days).

## Self-repair

When a check fails, route to its repair step. **Never run install commands silently** — always ASK the user first.

### HC-1 — Stop hook not registered

Repair: run **`cmk repair --hooks`** — it idempotently merges the kit's canonical hooks block into `.claude/settings.json`, preserving any of your own hooks and other keys. (`cmk install` writes the same block; repair is the targeted re-apply.) After repairing, restart Claude Code.

The block uses PATH-resolved bare bin names (shell form), which resolve the `npm install -g @lh8ppl/core-memory-kit` global shims on every OS:

```json
"hooks": {
  "SessionStart":     [ { "hooks": [ { "type": "command", "command": "cmk-inject-context",   "timeout": 30 } ] } ],
  "UserPromptSubmit": [ { "hooks": [ { "type": "command", "command": "cmk-capture-prompt",    "timeout": 10 } ] } ],
  "PostToolUse":      [ { "matcher": "Write|Edit|MultiEdit", "hooks": [ { "type": "command", "command": "cmk-observe-edit", "async": true, "timeout": 120 } ] } ],
  "Stop":             [ { "hooks": [ { "type": "command", "command": "cmk-capture-turn",      "timeout": 30 } ] } ],
  "SessionEnd":       [ { "hooks": [ { "type": "command", "command": "cmk-compress-session",  "timeout": 60 } ] } ],
  "PreCompact":       [ { "hooks": [ { "type": "command", "command": "cmk-precompact",        "timeout": 10 } ] } ]
}
```

(If you installed via the `/plugin` marketplace route instead, the hooks come from the plugin's own `hooks.json` using `${CLAUDE_PLUGIN_ROOT}` — you don't wire settings.json yourself on that route.) Preserve any existing `permissions` allowlist.

### HC-2 — Distill timestamp stale

The daily-distill cron is either not running or not updating the timestamp. Steps:

1. Run `cmk daily-distill` manually. If it succeeds, the timestamp updates and HC-2 goes green.
2. If it fails (Claude auth issue, allowlist too narrow), add a "Pending Decision" entry to MEMORY.md describing the failure.
3. Check `schtasks /query /tn cmk-daily-distill` (Windows) or `crontab -l` (Unix) to confirm the job is registered.

### HC-3 — Transcripts not firing

**First check the root cause**: Claude Code's Stop hook fires only when this project is the **primary** working directory. If you opened Claude Code in a different project and this one is an added/additional directory, the hook in this project's `.claude/settings.json` doesn't activate.

Fix: open Claude Code with this project as primary (File → Open Folder, not "Add to Workspace").

If primary AND still failing:
1. Verify Node is installed: `node --version`.
2. Test the hook in isolation:
   ```bash
   echo '{"stop_reason":"end_turn","response":"test"}' | node .claude/hooks/transcript-capture.js
   ```
   Should exit 0 and (since "test" is < 100 chars) skip the auto-extract.
3. Re-register the hook entry in `.claude/settings.json`.

### HC-4 — INDEX.md out of sync

Add missing files to INDEX.md, or remove stale entries. Each line is:

```
- [type] [Title](filename.md) — short hook
```

Where type is one of `user`, `feedback`, `project`, `reference`.

### HC-5 — Cron jobs missing

Re-run the registration command (idempotent — registers both daily-distill at 23:00 and weekly-curate at Sun 09:00):

```bash
cmk register-crons
```

To see what it WOULD do without changing anything: `cmk register-crons --dry-run`.

To remove both entries: `cmk register-crons --unregister`.

(HC-6 native-memory detection and HC-7 stale-lock detection are informational / self-evident from the `cmk doctor` output and need no manual repair recipe.)

### HC-8 — Native binding missing (npm 12 blocked the install script)

npm 12 (~July 2026) turns dependency install scripts **off by default**, including the implicit node-gyp build that `better-sqlite3`'s binding needs — a fresh `npm install -g` then looks installed but search/reindex crash at first use. `cmk install` detects this up front and offers to fix it inline; HC-8 is the backstop. Repair (the global `allow-scripts` config — the project-level `npm approve-scripts` allowlist does not apply to `-g` installs):

```bash
npm install -g @lh8ppl/core-memory-kit --allow-scripts=better-sqlite3
```

Set-and-forget alternative (one-time, machine-level — also covers future reinstalls and npx; per the npm maintainers in the v12 community discussion):

```bash
npm config set allow-scripts=better-sqlite3 --location=user
```

Note npm 12's default is **soft mode**: the unapproved script *skips with a warning and the install succeeds* — which is exactly why the breakage is easy to miss and `cmk install` probes for it. (`strict-allow-scripts=true` turns it into a hard install failure.)

For the optional semantic embedder (only checked when this project defaults to hybrid/semantic search):

```bash
npm install -g @huggingface/transformers --allow-scripts=onnxruntime-node
```

(`cmk install --with-semantic` passes that flag itself on npm ≥ 11.16.)

### HC-9 — Project scaffold behind the installed `cmk` (re-stamp after an update)

After you update the global package (`npm install -g @lh8ppl/core-memory-kit@latest`), each project's version-stamped scaffold — the CLAUDE.md managed block, the hooks, the skills — stays at the old version until `cmk install` re-runs *there*. HC-9 catches the easily-forgotten per-project step.

HC-9 also covers the OTHER direction (Task 245): when the **installed binary is behind the published `latest`**, it WARNs with the upgrade command — and tells you to verify with `cmk version` afterwards, because the observed failure class (D-382) is precisely an upgrade that quietly did nothing. Offline or CI? The registry probe is skipped silently; being unreachable is never a finding. Opt out with `CMK_SKIP_UPDATE_CHECK=1`. Repair (in the project HC-9 flagged):

```bash
cmk install
```

Then restart Claude Code so the refreshed hooks + MCP server load. (Full update flow for both the npm and plugin routes: [QUICKSTART.md §9](QUICKSTART.md).)

### HC-10 — Scheduled compaction looks dead (informational, no action needed)

This check does NOT require a fix — your memory still self-heals automatically every session (the SessionStart lazy roll is the floor; Task 167). It surfaces that your *optional* scheduled cleanup (`cmk register-crons`) isn't actually firing — usually because the machine is asleep at the scheduled time, or the OS scheduler didn't register the catch-up flag.

If you want the nightly schedule working (a latency optimization, not required):

1. Re-register: `cmk register-crons` (idempotent; on v0.4.1+ it sets the OS catch-up flag so a missed run runs on wake).
2. Or just ignore it — the lazy roll covers compaction on every session start regardless.

HC-10 never asks you to run a manual compaction; that path is automatic.

### HC-11 — Backend LLM CLI not on PATH (automatic features degraded, file-only still works)

The kit's automatic features (compression, auto-extract, the cross-project persona/wedge, the temporal sweep, daily/weekly distillation) run an LLM in the background — through **your agent's own command-line tool**, which is a separate install from the IDE. HC-11 checks that CLI is on your PATH:

- **Claude Code** → `claude`
- **Kiro** → `kiro-cli` (required even if you use the Kiro IDE)
- **Cursor** → `cursor-agent` (Cursor's CLI, in addition to the app)
- **Codex** → `codex` (`npm i -g @openai/codex`; the desktop app bundles it off-PATH)

If it's missing, HC-11 FAILS — but this is an **honest degrade, not a breakage**: capture, search, recall, and the delete-guardrail keep working (they're pure files + SQLite); only the automatic LLM steps wait until the CLI is present. Repair: install your agent's CLI (see the [README Prerequisite note](README.md#quickstart) for the per-agent install line), then re-run `cmk doctor`. `cmk install` also gives this heads-up at install time.

### HC-12 — A forgotten fact still lives in a derived surface

Forgetting a fact tombstones it and drops its index row — but a summary distilled *before* the forget (`recent.md`, `archive.md`, a `today-*.md`) may still repeat the deleted content. HC-12 verifies the retraction actually **cascaded** through every derived surface (the Always-On agents survey's least-implemented invariant: "deletion is a cascade through the derivation graph, not a single operation").

- **FAIL** names the exact surviving file + the fact id. Fix by surface:
  1. **Index survival** (a row outlived the tombstone) → `cmk reindex` rebuilds it clean.
  2. **Summary survival** (a stale distilled summary carries the content) → `cmk redact <id> --pattern "<the leaked text>"` scrubs that line, or let the next distill cycle re-write the summary (the forward path already excludes tombstoned content at write time, so new summaries won't reintroduce it).
- **SKIP** means nothing has been forgotten yet — labeled *vacuous* on purpose, so an empty history never reads as a silent pass.

### HC-13 — A stray `context/` folder is sitting in a subdirectory (advisory)

Before v0.6.2, the kit's capture hooks resolved the project root as the agent's raw working directory. If your agent ever ran with its cwd set to a subdirectory (a package folder in a monorepo, say), the automatic capture created a **second, unread `context/` tier there** and quietly wrote real facts into it. v0.6.2 fixed the cause; this check finds what the old bug left behind.

- **WARN**, never FAIL — nothing is broken. The stray tier is frozen (nothing is being added to it, nothing is being lost), and `cmk install` has already relocated any facts still stranded there.
- **Repair: run `cmk install`.** It copies every stranded fact into this project's tier **byte-identically** — ids and `created_at` dates are preserved exactly, so your memory keeps its real history — skipping anything that already exists here (nothing is ever overwritten, and a fact you deliberately forgot is never resurrected). Non-fact leftovers (`MEMORY.md` bullets, session logs, queue entries) are counted in the report and **left for you to review**, never auto-merged.
- **Then delete the folder yourself.** The kit does not delete memory paths — ever (ADR-0018 / D-193). `cmk install` prints the exact delete command for your shell; this check keeps naming the folder until it's gone.

### HC-14 — Active kit health warnings (advisory)

HC-14 reports failure codes the kit **recorded about itself** — it probes nothing. The other health checks inspect CONFIGURATION (are the hooks wired, is the INDEX consistent); this one reads OUTCOMES: the kit's background operations write down whether they succeeded as they run, and HC-14 surfaces the ones whose failures are still active (repeated recently enough and not since cleared by a success). Repair path depends on the code:

- Load the **`troubleshooting`** skill for the per-code repair book (`.claude/skills/troubleshooting/SKILL.md`) — it maps each failure code to its fix.
- **`cmk reindex`** is the one self-applied fix for index-drift codes.
- Everything else is **propose-or-advise only** — HC-14 never runs a repair itself, it names the code and points at the fix.

**SKIP means the check could not run**, not that everything is fine: the health log was unreadable, or something other than a file sits at `context/.locks/health.log`. Nothing is wrong with your memory *as far as this check knows* — but it did not verify anything, and it says so rather than passing. (The whisper's own reader treats the same condition as "no evidence" and stays quiet; that asymmetry is deliberate — a broken diagnostic must not nag on the hot path, and must not report a clean bill of health in a diagnostic report.)

### HC-15 — Semantic vectors match their own facts

**What can go wrong that nothing else would notice.** The vector index stores embeddings in a table addressed by a plain integer row number, so a separate mapping records which fact each row belongs to. If that mapping ever drifts out of step with the facts, **nothing breaks loudly**: semantic search still returns five results, still scores them 0.85+, still answers instantly — the facts are simply the wrong ones. This happened for real (D-421): a rebuild re-numbered the fact rows without re-numbering the vectors, and 15% of one corpus ended up holding an unrelated fact's embedding. A search for *"never overwrite backup directories"* returned five confident facts about gate tests, tombstones and release workflow. It was found by a person spot-checking results, not by any automated gate — which is exactly why this check exists.

**How it verifies.** It re-derives each sampled fact's content hash from the fact's own body, looks up the vector that hash is cached under, and compares it byte-for-byte with the vector actually sitting in that fact's slot. It trusts none of the kit's bookkeeping to answer the question — the fact's text is the reference.

**Repair:** `cmk reindex --full` (also reachable as `cmk repair --index`). It rebuilds the vector mapping from scratch **offline and fast** — the embedding cache is keyed by content, so nothing is re-computed and no model is loaded. As of v0.6.5 the kit also repairs this silently on its own: an index written under the old, broken scheme is rebuilt the first time semantic search runs, without you doing anything.

**SKIP means there is nothing to audit** — no search index yet, or semantic search isn't in use on this project (the embedder is optional; keyword search never has this failure mode).

## When recall goes wrong — the three-level diagnostic (not an HC; a checklist)

_A-TMA's bank/retrieval/QA failure decoupling (arXiv 2607.01935), folded in per Task 209 — when "the AI answered from stale/wrong memory," find WHICH level failed before reaching for a fix:_

1. **Bank** — *was the truth ever written/marked?* Check the fact exists (`cmk search`, `cmk get <id>`) and that a replaced fact is actually MARKED (`superseded_by` / a closed validity window / a tombstone). A missing mark is a write-side gap (the temporal sweep / `cmk forget` territory) — no retrieval fix can help.
2. **Retrieval** — *did search surface the state the question asked for?* The recall-log (`context/.locks/recall.log`) shows exactly which ids each query surfaced. A current-state question drowning in old facts, or a history question that can't reach superseded ones (they need `--include-expired` or the archive), is a retrieval-side gap.
3. **QA** — *did the model read the surfaced evidence correctly?* Since Task 209, non-current facts arrive LABELED (`[superseded — kept for history]` / `[expired]` / `[retracted]`) with a one-line instruction, so identical evidence no longer flips answers on ambiguity (A-TMA Case Study 1). If a labeled result was still misread, the failure is prompt-side, not memory-side.

The levels fail independently — fixing the wrong one (e.g. re-tuning retrieval when the bank never marked the supersession) burns effort with zero effect.

## Adding new health checks

When the system grows, add a new HC by:

1. Adding the check function + the `runDoctor` wiring in [`packages/cli/src/doctor.mjs`](packages/cli/src/doctor.mjs) (tests in `tests/cli-doctor.test.js` pin count + order).
2. Adding a row to the table here, plus a self-repair section when the repair isn't self-evident.
3. Updating the design table in `specs/design.md` §14 and the README health-checks table / count lines (pinned by `tests/docs-structure.test.js`).

(Original instructions pointed at `template/context/SETUP.md` + `template/CLAUDE.md.template`; the current template no longer enumerates HCs — the scaffolded CLAUDE.md block describes `cmk doctor` generically, so per-HC docs live only in the three spots above. Noted 2026-06-12, Task 141a.)
