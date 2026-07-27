# core-memory-kit — documentation system

This `docs/` tree captures the **full provenance** of the kit: every decision, every research input, every external source. Designed for direct ingestion into a personal knowledge base `raw/` so the reasoning behind the code is searchable forever.

> **Start at [`DOCUMENTATION-MAP.md`](DOCUMENTATION-MAP.md).** It is the registry of where every doc lives, in three zones: the **Spine** (`specs/` requirements·design·tasks — the only current state), **Product** docs (for users), and **History** (everything in this tree — the paper trail). Current project state lives ONLY in the Spine; `docs/` is history and context, never "what's true now."

## Structure

| Directory | Contains | When to read |
|---|---|---|
| [journey/](journey/) | The living paper trail: [`DECISION-LOG.md`](journey/DECISION-LOG.md) (decisions / pivots / bugs / fixes, append-only — **D-307 onward**; D-1…D-306 are the frozen [`DECISION-LOG-archive-pre-v0.5.md`](journey/DECISION-LOG-archive-pre-v0.5.md)), [`build-log.md`](journey/build-log.md) (narrative + per-PR retrospectives — **§10 onward**; chapters §0–§9 are the frozen [`build-log-archive-pre-v0.5.md`](journey/build-log-archive-pre-v0.5.md)), and the resume pointer | To understand *why/when* something was decided, or to resume work after a gap. Both archives split at the v0.5.0 boundary (Task 249) and still resolve every `D-nnn` citation |
| [adr/](adr/) | Architectural Decision Records — one self-contained ADR per significant decision, with context, alternatives, consequences, references | Before you change a design tenet, or to understand *why* something works the way it does |
| [process/](process/) | How we work — the Kiro-style spec workflow, research prompt design, conventions | Before you start a new spec cycle, propose a change to the methodology, or onboard someone |
| [research/](research/) | Outputs from research sessions — own Claude/ChatGPT Deep Research runs, manual architecture surveys, paper notes | Before you make a design decision that the research already covered |
| [sources/](sources/) | Deep-dive notes on individual external sources (articles, videos, papers) — distilled for personal-wiki ingest | When you need the substance of a source without re-reading the original |
| [SOURCES.md](SOURCES.md) | Master index of every URL, paper, repo, video, blog post we've cited | When you need a citation or want to verify a claim |
| ~~[conversation-log/](../archive/docs/conversation-log/)~~ | **RETIRED 2026-05-30** — early session narrative (2026-05-21/22 only); role taken over by `journey/` | Historical only — do not add entries |

## Reading order for a new contributor

1. [DOCUMENTATION-MAP.md](DOCUMENTATION-MAP.md) — where everything lives (the registry + the routing rules).
2. The **Spine**: [`../specs/tasks.md`](../specs/tasks.md) "Current state — what's next", then [`requirements.md`](../specs/requirements.md) + [`design.md`](../specs/design.md).
3. [README.md](../README.md) at repo root — what the kit does, how to install.
4. [ARCHITECTURE.md](../ARCHITECTURE.md) — the six-layer design.
5. [adr/README.md](adr/README.md) — decisions; skim titles to map the design surface.
6. [journey/DECISION-LOG.md](journey/DECISION-LOG.md) — recent decisions + why; [journey/build-log.md](journey/build-log.md) for the narrative.

## Discipline going forward

**Route every doc through [`DOCUMENTATION-MAP.md`](DOCUMENTATION-MAP.md) — never start a new state / plan / handoff surface.** Current project state lives only in the Spine (requirements/design/tasks). A decision is appended to [`journey/DECISION-LOG.md`](journey/DECISION-LOG.md) AND its effect lands in the Spine; an architectural decision also becomes an ADR; an external input becomes a `research/` or `sources/` note. The goal: a Claude session resuming after a long gap re-derives the full project state from the Spine alone, with the rest of `docs/` as supporting history. `scripts/validate-doc-registry.mjs` enforces that no unregistered surface can appear (our dev tooling — not shipped to kit users).

See [process/git-and-versioning.md](process/git-and-versioning.md) for the commit conventions and ADR lifecycle.

## Wiki ingestion

All files in `docs/` are written to be self-contained markdown — links are full URLs where possible, citations are inline, no editor-specific syntax. They can be copied into `/c/Projects/personal-wiki/raw/core-memory-kit/` without modification and processed through the wiki's ingest pipeline.
