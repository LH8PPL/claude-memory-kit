# DOCUMENTATION-MAP — the three files that matter, and everything that orbits them

> **The kernel:** only **three files carry the project's current truth** — [`requirements.md`](../specs/requirements.md) (WHAT) · [`design.md`](../specs/design.md) (HOW) · [`tasks.md`](../specs/tasks.md) (PLAN + what's-next). Everything else **orbits** them as either *product docs* (for users) or *history* (the paper trail). This map exists because, across the build, documentation was repeatedly written to a new or different file under pressure instead of its home — spawning ~7 overlapping state surfaces (see [build-log](journey/build-log.md)). The cure is one map + a validator, so consistency survives a context-compact without relying on Claude's memory (the thing that fails at every compact).
>
> Binding rule lives in [`CLAUDE.md`](../CLAUDE.md) ("Documentation routing"). This file is the registry it points to. **Read this + the three spine files at session start.**

## The one rule

**Before writing documentation, find its home below. Do not create a new file or repurpose an old one.** Current state lives ONLY in the Spine (the three). Everything else is product or history and is **never authoritative for "what is true now."** **A decision isn't done until its effect lands in the Spine** — the DECISION-LOG records the *why/when*, but the *effect* (a changed requirement, design, or task) must land in requirements/design/tasks, or it isn't real. If you're tempted to start a new plan / findings / handoff / roadmap file: **stop** — it routes into the Spine. New files get created only by adding them to the Registry below in the same change (the validator enforces this).

## The cold-restart test

A session that has lost all memory must be able to read **only the three spine files** and know the whole project *and the next action*. If `tasks.md` alone can't answer "what's next," the Spine has leaked state into an orbit file — fix that, don't add another surface.

---

## Zone 1 — The Spine (current state; read first; cold-restart-sufficient)

| Concern — "where does X go?" | File |
| --- | --- |
| WHAT must ship — requirements (FR / NFR / US) | [`specs/requirements.md`](../specs/requirements.md) |
| HOW it works — architecture, schemas, validators, forward-compat candidates (§16) | [`specs/design.md`](../specs/design.md) |
| WHERE memory can be lost/duplicated/blocked — intent-vs-code per lifecycle edge | [`specs/memory-lifecycle-map.md`](../specs/memory-lifecycle-map.md) — Spine support (pins design.md intent against code reality) |
| The PLAN — task state, what's-next, the phase roadmap | [`specs/tasks.md`](../specs/tasks.md) |
| Domain terms (glossary wins when docs disagree) | [`specs/glossary.md`](../specs/glossary.md) — Spine support |

`requirements-revisions-proposed.md` was a 2026-05-22 staging file; its approved content was merged into `requirements.md` (2026-05-31) and it now lives at [`archive/specs/v0.1.0/requirements-revisions-proposed.md`](../archive/specs/v0.1.0/requirements-revisions-proposed.md) as a superseded historical record. `requirements.md` is the sole requirements source.

## Zone 2 — Product docs (for users of the kit; active; kept current per docs-in-PR)

| File | Job |
| --- | --- |
| [`README.md`](../README.md) | Repo front door + npm landing summary. |
| [`packages/cli/README.md`](../packages/cli/README.md) | npm package landing page. |
| [`QUICKSTART.md`](../QUICKSTART.md) | 5-minute zero-to-working. |
| [`ARCHITECTURE.md`](../ARCHITECTURE.md) | Six-layer design, for users. |
| [`docs/SYSTEM-MAP.md`](SYSTEM-MAP.md) | The **systemic** view — the kit as ONE system: whole + parts + the relationships/edges between them (what ARCHITECTURE.md/design.md decompose away). Holds the learn-loop anatomy + the honestly-drawn unsolved region. Companion to ADR-0017. |
| [`docs/CLI.md`](CLI.md) | Full `cmk` command reference. |
| [`docs/OBSIDIAN.md`](OBSIDIAN.md) | How to browse your memory tier as an Obsidian vault (the companion to the kit's own viewer). |
| [`CHANGELOG.md`](../CHANGELOG.md) | Per-release "what shipped" (cut via `npm run release`). |
| [`docs/RELEASE-PLAN.md`](RELEASE-PLAN.md) | Forward complement to CHANGELOG: which version each task ships in (release lanes + the one-differentiator-per-minor rule). |
| [`SECURITY.md`](../SECURITY.md) | Threat model + disclosure contact. |
| [`HEALTH-CHECKS.md`](../HEALTH-CHECKS.md) | HC-* diagnostics + self-repair. |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Dev setup, test workflow, and conventions for contributing to the kit itself. |

## Zone 3 — History / paper trail (append-only; explains the Spine; NEVER current state)

| Location | Job |
| --- | --- |
| [`docs/journey/DECISION-LOG.md`](journey/DECISION-LOG.md) | Chronological decisions / pivots / issues / bugs / fixes (why & when). Append-only. Holds **D-307 onward**. |
| [`docs/journey/DECISION-LOG-archive-pre-v0.5.md`](journey/DECISION-LOG-archive-pre-v0.5.md) | **D-1 … D-306** — every decision before the v0.5.0 cut, relocated 2026-07-28 (Task 249), byte-identical. Frozen; still a `D-nnn` anchor source (`validate-docs` globs `DECISION-LOG*.md`). |
| [`docs/journey/build-log.md`](journey/build-log.md) | Full narrative + per-PR retrospectives + meta-lessons. Holds **§10 onward** (the version arcs) + §11 "How to extend". |
| [`docs/journey/build-log-archive-pre-v0.5.md`](journey/build-log-archive-pre-v0.5.md) | **Chapters §0–§9** — research → spec → every per-task retrospective through Task 108, relocated 2026-07-28 (Task 249), byte-identical. Frozen. |
| [`specs/tasks-archive.md`](../specs/tasks-archive.md) | The **full entry text of every completed task**, relocated out of `tasks.md` 2026-07-28 (Task 249), byte-identical + in order. Frozen; `tasks.md` keeps a one-line pointer per shipped task, so the Task-id sequence and `Task N` citations still resolve from the live file. |
| [`docs/journey/v0.2.0-live-test-findings.md`](journey/v0.2.0-live-test-findings.md) | v0.2.0 self-test findings (F1 capture-richness regression, F2 section-promotion) + Task 63/64 fix specs. Was the v0.2.0 release gate — **closed** (v0.2.0 shipped); now history. |
| `docs/journey/` dated findings & test docs | Session artifacts (history). See Registry. |
| [`docs/adr/`](adr/) | Architectural Decision Records — deep "why," append-only, superseded-never-deleted. Index: [`adr/README.md`](adr/README.md). |
| [`docs/research/`](research/) | Dated research notes + competitor spec dumps. Inputs to the Spine, not part of it. Index: [`research/INDEX.md`](research/INDEX.md). |
| [`docs/sources/`](sources/) | Deep-dive notes on external sources. Index: [`sources/README.md`](sources/README.md). |
| [`docs/process/`](process/) | How we work (repeated practices). Index: [`process/README.md`](process/README.md). |
| [`docs/SOURCES.md`](SOURCES.md) | Master flat citation index + verification status. |
| [`docs/README.md`](README.md) | Orientation for the `docs/` tree. |
| [`archive/docs/conversation-log/`](../archive/docs/conversation-log/) | **RETIRED + ARCHIVED** narrative (2026-05-21/22). Do not add. |

**Session handoff — pointers only, no state** (their state lives in `tasks.md`):
[`RESUME-HERE.md`](../RESUME-HERE.md) (repo-root current breadcrumb — the latest "pick up here" pointer, refreshed at session boundaries) · [`docs/journey/RESUME-HERE-2026-05-28.md`](journey/RESUME-HERE-2026-05-28.md) · [`docs/BOOTSTRAP.md`](BOOTSTRAP.md). _(The PHASE-3-PLAN husk was folded into `tasks.md` and archived at `archive/docs/journey/PHASE-3-PLAN.md`.)_

### Zone 4 — `archive/` (frozen; superseded/retired; never current state, never ref-validated)

Holds docs that are genuinely done and were cited as provenance but are no longer live: `archive/docs/conversation-log/` (retired), `archive/specs/v0.1.0/requirements-revisions-proposed.md` (merged into requirements.md), `archive/docs/journey/PHASE-3-PLAN.md` (husk, folded into tasks.md). Inbound citations point here; the files themselves are excluded from the `references` family of `validate-docs` (see its SKIP set).

### Not policed by the registry validator

`template/`, `plugin/`, `packages/**` (the npm READMEs excepted, listed above), `python/`, `node_modules/`, `.claude/`, `archive/` — these are the **shipped kit, third-party, or frozen history**, not our live working documentation.

---

## Routing table — "I want to record X, where does it go?"

| You want to record… | Put it in… |
| --- | --- |
| A decision / pivot / issue / bug / fix | [`DECISION-LOG.md`](journey/DECISION-LOG.md) (append) + its *effect* in the Spine + an [ADR](adr/) if architectural |
| A task, sub-task, what's-next, a phase/roadmap change | [`tasks.md`](../specs/tasks.md) |
| A new requirement (FR/NFR/US) | [`requirements.md`](../specs/requirements.md) |
| A design / architecture / schema detail or deferred candidate | [`design.md`](../specs/design.md) — the **canonical mechanism + schema** only. **NEVER create a standalone `docs/design/` file** (it violates the design.md-is-Spine kernel — D-228). When a design rests on heavy evidence (a cross-system code study, a benchmark), the design.md section holds the HOW and **links OUT**: deep evidence → a `docs/research/` note; the architectural choice → an [ADR](adr/). design.md is large (~3,200 lines) — link-out evidence, don't inline it. |
| A stable rule / working-style / discipline | [`CLAUDE.md`](../CLAUDE.md) (rules only) |
| Per-PR narrative, retrospective, meta-lesson | [`build-log.md`](journey/build-log.md) |
| A research finding | a dated note in [`docs/research/`](research/) **+ update [`research/INDEX.md`](research/INDEX.md)** |
| A deep-dive on an external source | [`docs/sources/`](sources/) **+ update [`SOURCES.md`](SOURCES.md)** |
| A user-facing capability (CLI/flag/behavior) | [`README.md`](../README.md) + [`packages/cli/README.md`](../packages/cli/README.md) + [`CHANGELOG.md`](../CHANGELOG.md) (same PR) |
| "Where do I resume next session?" | [`RESUME-HERE-2026-05-28.md`](journey/RESUME-HERE-2026-05-28.md) — a **pointer** to here + the Spine; no state |
| Tempted to make a NEW kind of doc? | **Stop.** It goes above. If it genuinely doesn't, add it to the Registry here in the same change. |

---

## Enforcement (dev-process only — not part of the shipped kit)

[`scripts/validate-docs.mjs`](../scripts/validate-docs.mjs) (the `registry` family — run it alone with `--only registry`), wired into `npm test`, **fails the build if any working-doc markdown file in a high-risk zone (`specs/`, `docs/` top level, `docs/journey/`, repo-root `*.md`) is not listed in the Registry below — and, since Task 186, also if a Registry entry names a file that no longer exists (both directions)** — i.e., a new rogue surface cannot appear without being registered here. Bulk history dirs (`docs/research/`, `docs/sources/`, `docs/process/`, `docs/adr/`, `docs/conversation-log/`, `archive/`) are registered by zone. This is the across-compaction guarantee: it does not rely on Claude remembering the rule. It is a tool for *our* work — users of the kit never run it and it ships nothing.

When you add a doc, add its path to the Registry in the same commit, or the build goes red.

---

## Registry (machine-checked — every high-risk working-doc file)

> The validator checks each file under the high-risk zones appears here. Bulk history dirs are zone-registered (above) and not listed file-by-file.

**Repo-root guides + rules:**
`README.md` · `QUICKSTART.md` · `ARCHITECTURE.md` · `CHANGELOG.md` · `SECURITY.md` · `HEALTH-CHECKS.md` · `CLAUDE.md`

**Spine (`specs/`):**
`specs/requirements.md` · `specs/design.md` · `specs/tasks.md` · `specs/glossary.md` · `specs/tasks-archive.md` (**frozen record**, not Spine — the completed-task entries relocated out of `specs/tasks.md` by Task 249)

**`docs/` top level:**
`docs/DOCUMENTATION-MAP.md` · `docs/README.md` · `docs/SOURCES.md` · `docs/BOOTSTRAP.md` · `docs/CLI.md` · `docs/MCP.md` · `docs/KIRO.md` · `docs/CURSOR.md` · `docs/CODEX.md` · `docs/CLAUDE-CODE.md` · `docs/OBSIDIAN.md`

**`docs/journey/`:**
`docs/journey/DECISION-LOG.md` · `docs/journey/DECISION-LOG-archive-pre-v0.5.md` · `docs/journey/build-log.md` · `docs/journey/build-log-archive-pre-v0.5.md` · `docs/journey/RESUME-HERE-2026-05-28.md` · `docs/journey/v0.1.0-live-test.md` · `docs/journey/v0.1.0-requirements-coverage.md` · `docs/journey/v0.1.1-self-test-findings.md` · `docs/journey/v0.2.0-live-test-findings.md` · `docs/journey/v0.3.3-live-test-findings.md` · `docs/journey/2026-05-26-live-test-findings.md` · `docs/journey/2026-05-26-live-test-findings-scenarios-3-7.md` · `docs/journey/2026-05-26-snapshot-cap-coordination.md` · `docs/journey/2026-05-26-user-tier-cap-fix.md` (the phase-3 plan is archived → `archive/docs/journey/PHASE-3-PLAN.md`)

**`docs/journey/live-test-runs/`** — per-run `npm run live-test` findings, one TIMESTAMPED file per run (a run-to-run trail to spot drift/regressions). A SUBDIR, so the registry validator (which scans `docs/journey/` non-recursively) does not police it file-by-file — no per-run registration needed.

_Reclassified 2026-05-31 (out of the high-risk journey zone into bulk-registered zones): the live-test **scripts** `docs/process/v0.1.1-self-test-guide.md` + `docs/process/v0.1.1-scenario-test.md` (reusable methodology → `process/`); the cold-start A/B `docs/research/2026-05-23-bootstrap-test.md` (research → `research/`)._
