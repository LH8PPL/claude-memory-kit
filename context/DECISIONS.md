# Decisions

> Append-only decision journal — every decision the kit captured, in order, with its why.
> Maintained by claude-memory-kit (`cmk digest`). Superseded/retracted entries stay (the trail is the point).

<!-- decision:P-ZPU3YLGH -->

## embedder ladder policy

**When:** 2026-06-10 · **Fact:** `P-ZPU3YLGH`
**Why:** MTEB rankings don't cover our short-fact corpus; the user prefers bigger-and-reliable over small-and-flaky, so the benchmark decides, not vibes (D-105)

<!-- decision:P-Aa22MJAC -->

## semantic backend: sqlite-vec primary, zvec fallback

**When:** 2026-06-10 · **Fact:** `P-Aa22MJAC`
**Why:** sqlite-vec puts vectors inside the SQLite index the kit already runs (one store, design 9.3.1 fit); zvec is embedded+Node+Windows but its bindings are only ~May-2026 old

<!-- decision:P-MHKMPLCR -->

## public-repo memory policy

**When:** 2026-06-10 · **Fact:** `P-MHKMPLCR`
**Why:** transcripts and session logs carry raw dev-conversation content (name-privacy class), so they stay machine-local here; a normal private project commits them (D-108 deviation)

<!-- decision:P-2THQQ9UU -->

## Degradation Messaging Pattern

**When:** 2026-06-10 · **Fact:** `P-2THQQ9UU`
**Why:** Users need to understand why behavior changed and what they can do. This is the UX standard for degradation in this project.

<!-- decision:P-N9BGGaK6 -->

## Transient Failure Retry Strategy

**When:** 2026-06-10 · **Fact:** `P-N9BGGaK6`
**Why:** A single transient delay can cause false negatives; 5 seconds is low-cost. Distinguishing jitter from real degradation prevents flaky CI while preserving signal for real b

<!-- decision:P-CBDN7KXQ -->

## User validates pragmatic retry-with-wait approach for transient failures ("maybe

**When:** 2026-06-10 · **Fact:** `P-CBDN7KXQ`

<!-- decision:P-QXDNaC5U -->

## v0.3.0 is BUILD-COMPLETE (2026-06-10): Tasks 46/125/124/75(all)/104(all) shipped

**When:** 2026-06-10 · **Fact:** `P-QXDNaC5U`

<!-- decision:P-MHCAaYVG -->

## Cut-Gate Testing Guide (Manual Release QA)

**When:** 2026-06-10 · **Fact:** `P-MHCAaYVG`
**Why:** Encodes hard-won lessons (D-84, v0.2.0, Task-75) into repeatable process; prevents regression and avoids known gotchas; respects user's time with clear estimates and scope boundaries.

<!-- decision:P-a5W95QXS -->

## This file (docs/process/cut-gate.md) is their manual live-test guide for release

**When:** 2026-06-10 · **Fact:** `P-a5W95QXS`

<!-- decision:P-TaHaDQV7 -->

## B5/B7 Probe Footgun — settings.json Wholesale Overwrite

**When:** 2026-06-10 · **Fact:** `P-TaHaDQV7`
**Why:** Running B5/B7 in a working directory (not throwaway) corrupts configuration.

<!-- decision:P-VNH3PTEL -->

## Task 124 — Auto-Reindex for cmk forget Command

**When:** 2026-06-10 · **Fact:** `P-VNH3PTEL`
**Why:** Eliminates manual bookkeeping in memory management workflows; reduces error surface.

<!-- decision:P-R5B4C5NR -->

## Authority Preamble Is the Key Behavioral Lever in Memory Injection

**When:** 2026-06-10 · **Fact:** `P-R5B4C5NR`

<!-- decision:P-TDMC9ZWE -->

## Convergent Design Validation — External System Mirrors Kit Architecture

**When:** 2026-06-10 · **Fact:** `P-TDMC9ZWE`
**Why:** Independent validation of the design reduces architectural risk and confirms the waterfall pattern is sound. Proof point for stakeholders and defense against mono-search proposals.

<!-- decision:P-JGNBLDR3 -->

## Embedding Model Trade-off: bge-base vs bge-m3 (Benchmarked Choice)

**When:** 2026-06-10 · **Fact:** `P-JGNBLDR3`
**Why:** Model selection must be task-specific. bge-m3 is not universally better — it underperforms on the kit's exact retrieval challenge. The benchmark (D-109) grounded this choice in data, not vibes.

<!-- decision:P-aA5S5S2U -->

## User confirmed companion project approach for Task 127 aligns with kit philosoph

**When:** 2026-06-10 · **Fact:** `P-aA5S5S2U`

<!-- decision:P-NFJFMJTT -->

## User prefers rapid execution ("do it, why wait?" and "why not just do it now?" s

**When:** 2026-06-10 · **Fact:** `P-NFJFMJTT`

<!-- decision:P-FHA3DTCB -->

## Semantic Search: Opt-In Dependency, Default-On Behavior

**When:** 2026-06-10 · **Fact:** `P-FHA3DTCB`
**Why:** Project aims to be lightweight (supporting users who only want markdown memory) while offering excellent UX to those who want semantic search. Balances these constraints via a design principle: dependency opt-in, behavior default-on.

<!-- decision:P-BDJHESCB -->

## CHANGELOG Script Assertion — Non-Unique Anchor Gotcha

**When:** 2026-06-11 · **Fact:** `P-BDJHESCB`
**Why:** Silent script failures are easy to miss in automated workflows; this is a recurring gotcha.

<!-- decision:P-CL9DBDJK -->

## Stub Command Removal — Five-Piece Pattern

**When:** 2026-06-11 · **Fact:** `P-CL9DBDJK`
**Why:** Stub deletions touch multiple locations across the codebase; recording the pattern prevents incomplete removals.

<!-- decision:P-ULTaWK4B -->

## Release Gate Structure (v0.3.0)

**When:** 2026-06-11 · **Fact:** `P-ULTaWK4B`
**Why:** D3's promotion to required blocker is a recent change; the next release cycle must respect this gate structure.

<!-- decision:P-ZQLQ65UP -->

## Session 2026-06-11 closed fully shipped: PRs #159 (sessions searchable), #160 (d

**When:** 2026-06-11 · **Fact:** `P-ZQLQ65UP`

<!-- decision:P-WK53SJZ5 -->

## Carefully reviews changes for unintended scope loss. This scrutiny identified a

**When:** 2026-06-11 · **Fact:** `P-WK53SJZ5`

<!-- decision:P-MRWY2C43 -->

## Cut Gate Must Test Full Recall Ladder

**When:** 2026-06-11 · **Fact:** `P-MRWY2C43`
**Why:** The cut-gate is the kit's comprehensive health check; every subsystem must be proven to work end-to-end. Gaps in coverage may be invisible in a summary diff.

<!-- decision:P-7L3FTZ3Y -->

## Prefers comprehensive, full end-to-end test coverage. Concerned that changes shi

**When:** 2026-06-11 · **Fact:** `P-7L3FTZ3Y`

<!-- decision:P-Pa5RBNQ4 -->

## Release Git Choreography: Memory, Release, Tag (in order)

**When:** 2026-06-11 · **Fact:** `P-Pa5RBNQ4`
**Why:** Keeps the tree clean; release commits reflect versioning, not session metadata. Memory churn is incidental to development, not part of the release artifact.

<!-- decision:P-VHMVDFZP -->

## The kit NEVER runs git on the user's behalf — settled product position, user-con

**When:** 2026-06-11 · **Fact:** `P-VHMVDFZP`
**Why:** Hooks running git would race with the user's own staging/rebases and create per-turn commit noise; on public repos, reviewing the memory diff before commit IS the privacy gate (facts about the user would otherwise publish sight-unseen). The user: 'i wouldnt want to do git commands for people automaticly.'

<!-- decision:P-VC4UGJTP -->

## Does not want Claude to automatically execute git commands; prefers explicit use

**When:** 2026-06-11 · **Fact:** `P-VC4UGJTP`

<!-- decision:P-L6J7QRDL -->

## Automation Boundary Principle for claude-memory-kit

**When:** 2026-06-11 · **Fact:** `P-L6J7QRDL`
**Why:** Every auto-committing tool eventually has the "it committed something I didn't want" problem. Memory systems have observer-effect dynamics — discussing the system changes it. The correct gate is human review before publication, not automation of the user's authorship surface.

<!-- decision:P-aLPJJGFL -->

## Separate Memory Captures from Release Commits

**When:** 2026-06-11 · **Fact:** `P-aLPJJGFL`
**Why:** Release commits should show only what went into the release — when auditing `release: vX.Y.Z` later, the commit should be uncluttered and reviewable as a pure version bump. Accumulated memory captures muddy that history.

<!-- decision:P-674Q5D5M -->

## Changes since version 0.2.3 appear to have introduced failures in memory kit

**When:** 2026-06-11 · **Fact:** `P-674Q5D5M`

<!-- decision:P-E2GNU77L -->

## Composition Bug Pattern in claude-memory-kit

**When:** 2026-06-11 · **Fact:** `P-E2GNU77L`
**Why:** Composition failures hide in unit-green suites; requires end-to-end Stop-hook chain testing (capture → detached spawn → live extraction) to surface

<!-- decision:P-L4Q72B3Y -->

## MEMORY.md scratchpad still contains only example bullets instead of populating w

**When:** 2026-06-11 · **Fact:** `P-L4Q72B3Y`

<!-- decision:P-MZDaYRWX -->

## Requesting complete re-verification: check previous test gate outputs (gate7), r

**When:** 2026-06-11 · **Fact:** `P-MZDaYRWX`

<!-- decision:P-94E7GN3T -->

## Release Cut Gate Validation Pattern

**When:** 2026-06-11 · **Fact:** `P-94E7GN3T`
**Why:** Validates memory extraction system is working before release; acts as a final quality check that automated testing otherwise misses.

<!-- decision:P-7FM6NVP4 -->

## Skill composition pattern: scaffold + allow-list must be updated together

**When:** 2026-06-11 · **Fact:** `P-7FM6NVP4`
**Why:** Second occurrence of this composition pattern (memory-write in Task 90 was the first). This repeating bug class should be prevented in future skill additions.

<!-- decision:P-GUWLUBBT -->

## Two Bugs Fixed—Validation Points for Session 1 & 2

**When:** 2026-06-11 · **Fact:** `P-GUWLUBBT`
**Why:** These were bugs causing test suite failures. The PR fixes both; Session 1 & 2 testing confirms the fixes work correctly.

<!-- decision:P-XUQK356C -->

## Post-Merge Checkout Race Condition (Kit Memory Writes)

**When:** 2026-06-11 · **Fact:** `P-XUQK356C`
**Why:** The kit maintains and actively modifies its own `context/` during operations. Merge/checkout operations can race with these writes, causing transient stale branches.

<!-- decision:P-QC26V7EB -->

## Claude Memory Kit — cmk Doctor Baseline (Pre-First-Turn)

**When:** 2026-06-11 · **Fact:** `P-QC26V7EB`
**Why:** Baseline expectations distinguish healthy early state from actual failures. Skip count acts as a maturity indicator — changing skip counts are normal and reflect the system warming up.

<!-- decision:P-69AFCHKZ -->

## Claude Memory Kit — Template File Structure in Tarball

**When:** 2026-06-11 · **Fact:** `P-69AFCHKZ`
**Why:** The template structure defines what gets installed into fresh projects. Knowing exact file count and layout helps verify pack completeness and predict post-install directory structure.

<!-- decision:P-TTL9GSJV -->

## Reliable tarball file validation with npm pack --json

**When:** 2026-06-11 · **Fact:** `P-TTL9GSJV`
**Why:** Manual `tar -tzf` verification is error-prone. Structural validators need a reliable source of truth that can be asserted at test time.

<!-- decision:P-X5VHDWAE -->

## Validator pattern: structural guards in test suite (Task 128 reference)

**When:** 2026-06-11 · **Fact:** `P-X5VHDWAE`
**Why:** Converting manual verification steps into permanent test-time guarantees catches silent failures (e.g., missing template files) early, not at user time.

<!-- decision:P-RP4BG3YM -->

## Pre-Session Verification Checklist Structure

**When:** 2026-06-11 · **Fact:** `P-RP4BG3YM`
**Why:** Multi-stage verification (file-side / in-session / live-test) catches config issues, integration problems, and artifact integrity before release.

<!-- decision:P-aN9PaSGC -->

## Validation Gate Structure (cut-gate9 Release)

**When:** 2026-06-11 · **Fact:** `P-aN9PaSGC`
**Why:** Standardized gates catch regressions; each check owns a specific concern. Automation verifies what it can; in-session UX and skip-prompt behavior require hands-on testing.

<!-- decision:P-3SFJR4LM -->

## Code Scar: Overly-Broad Injection Pattern

**When:** 2026-06-11 · **Fact:** `P-3SFJR4LM`

<!-- decision:P-MLV9MSPR -->

## poison-guard.mjs: Specific Provider Patterns Are By Design

**When:** 2026-06-11 · **Fact:** `P-MLV9MSPR`
**Why:** Threat model is accidental leakage. False positives = DoS against system's own legitimate memory content.

<!-- decision:P-7XKFaB2N -->

## Secret Leakage Defense-in-Depth Model

**When:** 2026-06-11 · **Fact:** `P-7XKFaB2N`
**Why:** No single filter is complete. Layering reduces likelihood accidental secrets reach git.

<!-- decision:P-4TSUCAM5 -->

## as long as it adds and not deminish — standing constraint on change scope

**When:** 2026-06-11 · **Fact:** `P-4TSUCAM5`

<!-- decision:P-RL2aKHKQ -->

## Prefers concise, numbered instructions without narrative explanation or backgrou

**When:** 2026-06-11 · **Fact:** `P-RL2aKHKQ`

<!-- decision:P-AFLZRQJ5 -->

## Extraction Output Truncation Bug

**When:** 2026-06-11 · **Fact:** `P-AFLZRQJ5`
**Why:** Prevents dense inference turns from poisoning the fact archive; must validate shape completeness.

<!-- decision:P-Y5U33ATF -->

## Release Gate Process (Template from v0.3.0)

**When:** 2026-06-11 · **Fact:** `P-Y5U33ATF`
**Why:** This gate sequence validates the kit works in cold-start scenarios (Session 3 ensures new users aren't surprised), the guide is accurate (F-sweep), packaging is clean (re-pack), and finally publishes. Designed and validated for v0.3.0 release.

<!-- decision:P-PSN32KXM -->

## E1 Test Scoring Criteria (Backend Code Generation)

**When:** 2026-06-11 · **Fact:** `P-PSN32KXM`
**Why:** E1 validates that memory successfully embedded the user's backend philosophy (FastAPI, type safety, testing discipline) into code generation without explicit prompting. This is the core efficacy test.

<!-- decision:P-NYDA656J -->

## FastAPI Project Scaffolding Workflow and Structure

**When:** 2026-06-11 · **Fact:** `P-NYDA656J`
**Why:** Provides repeatable, testable scaffolding with proper layering (config/routes/schemas/tests separation), async-first design, and immediate verification

<!-- decision:P-CXC5JJHU -->

## User chose REST API backend with FastAPI and no database for new project

**When:** 2026-06-11 · **Fact:** `P-CXC5JJHU`

<!-- decision:P-7HE9BCZW -->

## User uses uv for Python project initialization and dependency management

**When:** 2026-06-11 · **Fact:** `P-7HE9BCZW`

<!-- decision:P-AXBVF6WA -->

## npm pack executed successfully; @lh8ppl/claude-memory-kit v0.3.0 tarball generat

**When:** 2026-06-11 · **Fact:** `P-AXBVF6WA`

<!-- decision:P-Za6L72JM -->

## canonicalize() Super-Linear Regex Hotspot

**When:** 2026-06-11 · **Fact:** `P-Za6L72JM`
**Why:** Confirmed real pattern, but execution is too constrained for practical risk. Behavior-identical fix ensures downstream stability.

<!-- decision:P-LUGG95FY -->

## SonarCloud Hotspot Review — Mark Safe with Comment

**When:** 2026-06-11 · **Fact:** `P-LUGG95FY`
**Why:** Tool limitation requires documented workaround; risk assessment and rationale must be visible to team and future sessions

<!-- decision:P-DGN6ZNXZ -->

## v0.4 Roadmap — Kiro-First Editor Integration

**When:** 2026-06-11 · **Fact:** `P-DGN6ZNXZ`
**Why:** Clear sequencing unblocks user's own workflow first; Kiro support is critical path for v0.4 utility

<!-- decision:P-MWJCVZBH -->

## SonarQube Hotspot Review Script Filtering Logic

**When:** 2026-06-11 · **Fact:** `P-MWJCVZBH`
**Why:** Slow-regex performance is critical in files with large input scope; these require human judgment rather than automated wave-through to avoid missing real issues.

<!-- decision:P-XQ9RYXaJ -->

## Backlog for v0.3.x and v0.4

**When:** 2026-06-11 · **Fact:** `P-XQ9RYXaJ`
**Why:** These tasks emerged from the quality gate review and are ready to schedule.

<!-- decision:P-NHPPPXGD -->

## QA Verification Discipline Before Release

**When:** 2026-06-11 · **Fact:** `P-NHPPPXGD`
**Why:** Catches false positives; provides audit trail for future readers auditing why each decision was made.

<!-- decision:P-9NaMaLE6 -->

## v0.3.0 Released With Green Quality Gate

**When:** 2026-06-11 · **Fact:** `P-9NaMaLE6`
**Why:** Marks completion of the quality gate enforcement for this release; establishes clean baseline for next session.

<!-- decision:P-CW99QNUX -->

## npm v12 Breaking Change and better-sqlite3 Migration Plan

**When:** 2026-06-11 · **Fact:** `P-CW99QNUX`
**Why:** npm 12 ships next month, breaking all new users. Structural fix also eliminates known Windows pain. Time-sensitive.

<!-- decision:P-JRXWU6JP -->

## We can upgrade to latest Node version at any time — no legacy version constraint

**When:** 2026-06-11 · **Fact:** `P-JRXWU6JP`

<!-- decision:P-JN3BYXJN -->

## When asked for a review/opinion, provide that analysis only—don't autonomously w

**When:** 2026-06-11 · **Fact:** `P-JN3BYXJN`

<!-- decision:P-TCKSCKAC -->

## Core Philosophy of the Kit

**When:** 2026-06-11 · **Fact:** `P-TCKSCKAC`
**Why:** Transparency and auditability are core to kit's value proposition versus enterprise fleet systems like memclaw

<!-- decision:P-W7TSERZR -->

## Crystallization with Reviewable Proposals (Task 95)

**When:** 2026-06-11 · **Fact:** `P-W7TSERZR`
**Why:** Achieves memclaw's deduplication goal (rot elimination) while maintaining kit's transparency and audit trail

<!-- decision:P-22VAP6JX -->

## Lazy Re-Embedding on Model Upgrades

**When:** 2026-06-11 · **Fact:** `P-22VAP6JX`
**Why:** Deferral scales to large deployments; feasible once transcript chunks reach thousands

<!-- decision:P-VS9AKQ7P -->

## Memory Trust Scoring — Event-Driven Instead of Server-Side

**When:** 2026-06-11 · **Fact:** `P-VS9AKQ7P`
**Why:** Adopts memclaw's earned-trust insight without requiring server infrastructure or API costs on every write

<!-- decision:P-4aaKKRKV -->

## PII Handling — Non-Adoption of Quarantine

**When:** 2026-06-11 · **Fact:** `P-4aaKKRKV`
**Why:** Kit's memory lives in git repos — privacy (discard-on-sight) is higher priority than quarantine-for-review UX

<!-- decision:P-DW269VXT -->

## cmk Task and Decision Record Governance

**When:** 2026-06-11 · **Fact:** `P-DW269VXT`
**Why:** Codifies cmk's project management model — how work, decisions, and priorities are tracked

<!-- decision:P-GFTYR6T3 -->

## Confirmed adding 4 new task proposals to cmk backlog with minimal response "slot

**When:** 2026-06-11 · **Fact:** `P-GFTYR6T3`

<!-- decision:P-PRJ9QDGG -->

## v0.3.x Release Lane — Tasks 142–145 Priority Order

**When:** 2026-06-11 · **Fact:** `P-PRJ9QDGG`
**Why:** User confirmed slotting 4 new proposals; establishes next-phase roadmap and priorities

<!-- decision:P-2UW5RAKR -->

## PAI (Personal AI Infrastructure) Memory & Architecture Convergence

**When:** 2026-06-12 · **Fact:** `P-2UW5RAKR`
**Why:** Independent convergence strongly validates the kit's memory taxonomy and paradigm. The RELATIONSHIP category is a genuine gap—tracking collaboration evolution could inform Task 55 (meta-learning). The architectural framing clarifies the kit's unique value proposition: composability and zero-friction adoption.

<!-- decision:P-NXF3aCPB -->

## Semantic Search vs. Grep Trade-Off (D-111 Design Rationale)

**When:** 2026-06-12 · **Fact:** `P-NXF3aCPB`
**Why:** The kit's semantic-search choice diverges from PAI despite shared philosophy. The decision is data-driven (benchmarked) and intentional, not a paradigm violation. Documents why the choice was made for future reconsideration.

<!-- decision:P-NQ7WEWSJ -->

## D-111 Design as Bridge Position

**When:** 2026-06-12 · **Fact:** `P-NQ7WEWSJ`
**Why:** Independent convergence of two respected systems on opposing positions suggests both are contextually correct; the kit's D-111 is the synthesis, not a compromise

<!-- decision:P-5RYWEUQM -->

## D-121 Viewer — Reconsidered for v0.4 Design Slot

**When:** 2026-06-12 · **Fact:** `P-5RYWEUQM`
**Why:** D-121 was parked with "keep the idea" reasoning. Pulse at that scale is the strongest argument yet that this feature set has genuine demand, not just theoretical appeal.

<!-- decision:P-LUQGGBRS -->

## Task 55 Enrichment — RELATIONSHIP Memory + Learn Phase

**When:** 2026-06-12 · **Fact:** `P-LUQGGBRS`
**Why:** Three independent design systems converged on capturing task retrospectives + collaboration memory, signaling this is a genuine missing piece

<!-- decision:P-E3SWXCSY -->

## Kit Architecture — Index Routing and Fact Storage

**When:** 2026-06-12 · **Fact:** `P-E3SWXCSY`
**Why:** The pattern scales to large corpora while keeping session context tractable. Multiple independent research efforts converged on this design, validating the approach.

<!-- decision:P-MY3CHJ94 -->

## Memory Evaluation Metrics — Outcome vs. Retrieval Level

**When:** 2026-06-12 · **Fact:** `P-MY3CHJ94`
**Why:** The distinction clarifies scope — retrieval validates internal function, outcome validates user value. Different metrics answer different questions and drive different decisions.

<!-- decision:P-97GWWRNU -->

## Research Inclusion Bar for SOURCES Artifact

**When:** 2026-06-12 · **Fact:** `P-97GWWRNU`
**Why:** The SOURCES artifact must remain credible and actionable. Unverified claims dilute the research base and mislead future development decisions.

<!-- decision:P-DUZYECE4 -->

## v0.3.0 PUBLISHED 2026-06-11 (npm + GitHub Release) after the gate day: 8 bugs fo

**When:** 2026-06-12 · **Fact:** `P-DUZYECE4`

<!-- decision:P-Y5N7FSAV -->

## Auto-Compact Fidelity Loss Mid-Task

**When:** 2026-06-12 · **Fact:** `P-Y5N7FSAV`
**Why:** Fidelity loss forces the next session to re-derive missing context, negating the kit's designed benefit of seamless continuity across boundaries.

<!-- decision:P-TUJKaAQ6 -->

## Autopilot Memory Consultation Architecture

**When:** 2026-06-12 · **Fact:** `P-TUJKaAQ6`
**Why:** Autopilot work must leverage memory without explicit asking; design balances autonomous value against deliberate human control over forget/queue decisions.

<!-- decision:P-GRUJ3P7Q -->

## Memory Kit + Workflows Integration Surface

**When:** 2026-06-12 · **Fact:** `P-GRUJ3P7Q`
**Why:** Workflow agents start cold (no context on user setup/decisions); kit multiplies core utility across swarm scale.

<!-- decision:P-DC97QaDC -->

## Pre-session verification found one composition bug (memory-search allow-list omi

**When:** 2026-06-12 · **Fact:** `P-DC97QaDC`

<!-- decision:P-JU7RRUT9 -->

## Assistant overgeneralized a prior context-specific permission ("for ruflo, you d

**When:** 2026-06-12 · **Fact:** `P-JU7RRUT9`

<!-- decision:P-SKYZHH2U -->

## Autopilot memory is mixed push (SessionStart snapshot always in context) and pul

**When:** 2026-06-12 · **Fact:** `P-SKYZHH2U`

<!-- decision:P-Q4TA2SAX -->

## Prefers terse, step-by-step instructions with time estimates and optional paths

**When:** 2026-06-12 · **Fact:** `P-Q4TA2SAX`

<!-- decision:P-BJQaGQ6H -->

## Iterative, thorough research approach—adds items even near session end rather th

**When:** 2026-06-12 · **Fact:** `P-BJQaGQ6H`

<!-- decision:P-A6XDaDHA -->

## Kit Feature Gap — Chronological Decision Rendering

**When:** 2026-06-12 · **Fact:** `P-A6XDaDHA`
**Why:** That both the kit and Squad independently maintain chronological journals indicates this view type is valuable beyond individual-fact retrieval. The gap is a missed product feature—a natural extension of `cmk digest`.

<!-- decision:P-7RQTaMU4 -->

## Kit's Decision Log — Manual Maintenance Pattern

**When:** 2026-06-12 · **Fact:** `P-7RQTaMU4`
**Why:** Both the kit team and peer projects (Squad) independently maintain chronological decision journals, suggesting this narrative form provides value that individual-fact storage doesn't. The kit chose to keep D-log authoritative rather than migrate to the fact model.

<!-- decision:P-XTLTaX5C -->

## Decision-Journal View Gap — Now Task 147

**When:** 2026-06-12 · **Fact:** `P-XTLTaX5C`
**Why:** User pattern discovery — manual decision journaling across multiple teams signals a real user need the kit doesn't yet meet

<!-- decision:P-9GQSPN2C -->

## Proactively seeks good ideas and practices from peer/sibling projects to steal o

**When:** 2026-06-12 · **Fact:** `P-9GQSPN2C`

<!-- decision:P-BJ9J9GP7 -->

## Squad Sweep Complete — Seven Tasks Slotted (141–147)

**When:** 2026-06-12 · **Fact:** `P-BJ9J9GP7`
**Why:** Documents the scope and closure of a multi-session source-inventory effort; establishes what tasks are now in flight and their provenance

<!-- decision:P-F5M3VBTG -->

## User gates session close with verification question "is everything in lane? slot

**When:** 2026-06-12 · **Fact:** `P-F5M3VBTG`

<!-- decision:P-WYDCWV5H -->

## Design.md §16: Deliberate Parking Lot with Ship Triggers

**When:** 2026-06-12 · **Fact:** `P-WYDCWV5H`
**Why:** The project needs a staging area for long-term candidates without making them tasks prematurely; ship-triggers prevent ideas from rotting as stale backlog

<!-- decision:P-aUDDN4WP -->

## Task 147 design upgraded: the kit gets a STANDING committed context/DECISIONS.md

**When:** 2026-06-12 · **Fact:** `P-aUDDN4WP`
**Why:** A standing journal puts each decision line in the PR diff that captured it (reviewable), travels with git clone, and needs no tooling to read - the same reasons the build repo hand-maintains its own DECISION-LOG

<!-- decision:P-ZQV3U4BP -->

## Decision-trail rule — preserve decision history in task entries

**When:** 2026-06-12 · **Fact:** `P-ZQV3U4BP`
**Why:** Future sessions need to understand decision evolution and rationale; decision trails prevent design context loss

<!-- decision:P-N5YK2T6R -->

## decisions.md feature using standing-journal design pattern

**When:** 2026-06-12 · **Fact:** `P-N5YK2T6R`
**Why:** Kit needs structured decision capture to preserve design rationale across sessions and prevent decisions from being forgotten

<!-- decision:P-ZRQRa277 -->

## kit needs decisions.md feature

**When:** 2026-06-12 · **Fact:** `P-ZRQRa277`

<!-- decision:P-X5RWPJQY -->

## Design Lesson Numbering System (D-###) in claude-memory-kit

**When:** 2026-06-12 · **Fact:** `P-X5RWPJQY`
**Why:** Project code reviews and PR descriptions reference these patterns to justify design choices; helps understand vocabulary and decision-tracing

<!-- decision:P-AXU3YSXC -->

## PR #168 - cmk import-claude-md Command Complete

**When:** 2026-06-12 · **Fact:** `P-AXU3YSXC`
**Why:** Completed feature ready for merge; implementation demonstrates safe fact-import pattern and reuse-at-design-time principle

<!-- decision:P-CZ7WMRYM -->

## autopilot grant — v0.3.x queue (2026-06-12)

**When:** 2026-06-12 · **Fact:** `P-CZ7WMRYM`
**Why:** U-XTCFKJ4U: never generalize permissions across tasks — the grant's exact scope must be on the record so a future session neither exceeds it nor re-asks for it.

<!-- decision:P-T7ZLD7YB -->

## Autopilot standing permission for v0.3.x queue starting Task 141a

**When:** 2026-06-12 · **Fact:** `P-T7ZLD7YB`

<!-- decision:P-7FV4EYaW -->

## npm v12 Script Approval: Project vs. Global Configuration Paths

**When:** 2026-06-12 · **Fact:** `P-7FV4EYaW`
**Why:** Dual-path architecture means different remediation per install type. Verified against GitHub changelog (2026-06-09) and community discussion #198547.

<!-- decision:P-9NHZ2SV2 -->

## npm v12 Mitigation Plan (Tasks 141a–141b)

**When:** 2026-06-12 · **Fact:** `P-9NHZ2SV2`
**Why:** npm v12 lands July 2026. npm 11.16+ already emits warnings and breaks on our binding. Users will hit silent failures (install succeeds, tool crashes on first use) without mitigation.

<!-- decision:P-BDES4aW7 -->

## Install-time consent for better-sqlite3 binding (replaces error → doctor round-trip)

**When:** 2026-06-12 · **Fact:** `P-BDES4aW7`
**Why:** User objected to original UX (npm install error → doctor command → error again → discovery left to an obscure tool). This change prioritizes inline, immediate resolution at the moment of install. Their feedback shaped the design before it shipped.

<!-- decision:P-XBB4aELR -->

## Dependabot Cannot Approve allowScripts in Strict Repos

**When:** 2026-06-12 · **Fact:** `P-XBB4aELR`
**Why:** Affects approval fatigue and long-term security posture in strict-mode npm repos.

<!-- decision:P-A5QQRXMR -->

## Five-Point Stress Gate and Auto-Launch PR Workflow

**When:** 2026-06-12 · **Fact:** `P-A5QQRXMR`
**Why:** Stress gating is a quality validation before merge. The auto-launch on pass keeps the pipeline moving predictably without manual gate-watching.

<!-- decision:P-aZH2NRSE -->

## Task Pipeline Stages

**When:** 2026-06-12 · **Fact:** `P-aZH2NRSE`
**Why:** Recurring structure observed across Tasks 74, 144, 145; understanding stages helps predict throughput and identify bottlenecks

<!-- decision:P-RLKAYYRZ -->

## Stress Testing Omitted for Pure-Read CLI Changes

**When:** 2026-06-12 · **Fact:** `P-RLKAYYRZ`
**Why:** Pure-read analysis and CLI printing introduce no concurrency or spawning risks, making stress tests unnecessary and allowing them to be skipped to save CI time.

<!-- decision:P-E6J7aYH5 -->

## skill-review Imported-Facts Staleness Bug Fixed

**When:** 2026-06-12 · **Fact:** `P-E6J7aYH5`
**Why:** Correctness of the memory system depends on imported facts remaining fresh. This bug threatened that invariant.

<!-- decision:P-2aD2YHMB -->

## Modular Skill Architecture: Read/Write Separation

**When:** 2026-06-13 · **Fact:** `P-2aD2YHMB`
**Why:** Separating read from write reduces blast radius and prevents accidental memory corruption. The boundary is a first-class design principle, not an implementation detail.

<!-- decision:P-2JMVXJ3a -->

## Task 146: Concurrent Swarm Support Testing

**When:** 2026-06-13 · **Fact:** `P-2JMVXJ3a`
**Why:** The kit's strength is as a shared memory layer for many independent agents. Concurrent safety is the missing validation needed before swarm support is proven.

<!-- decision:P-REVFHLBK -->

## kit skills are modular thin-orchestrators over a deep cmk substrate

**When:** 2026-06-13 · **Fact:** `P-REVFHLBK`
**Why:** The user surfaced the mega-vs-modular / skill-scaling question (2026-06-13 whiteboard images); the answer is reusable architecture framing for Task 146 (Workflows) and for any future skill the kit scaffolds — keep skills thin, push capability into composable cmk/MCP cores.

<!-- decision:P-EBGGNUQ4 -->

## async-ifying a CLI action races its synchronous in-process test callers

**When:** 2026-06-13 · **Fact:** `P-EBGGNUQ4`
**Why:** Second instance this session of an async change creating a stress-only race (the spawn-smoke empty-output oracle was the first). The caller-map-both-ways rule (CLAUDE.md) applies to TEST callers, not just src callers — and the stress gate is the thing that catches the timing, which is exactly why it runs on memory-write-surface PRs.

<!-- decision:P-GZR7BG2Q -->

## Hardcoded Model Version in Commit Trailer Goes Stale on Model Switch

**When:** 2026-06-13 · **Fact:** `P-GZR7BG2Q`
**Why:** You work with multiple Claude models in a single session and switch between them. Static trailers mean commit metadata no longer reflects which model actually created the code.

<!-- decision:P-FZ3XFLAB -->

## CMK_DISABLE_SEMANTIC Environment Variable

**When:** 2026-06-13 · **Fact:** `P-FZ3XFLAB`
**Why:** Allows disabling expensive optional features (semantic similarity) in certain deployments or test scenarios.

<!-- decision:P-GXG7L6RH -->

## Seam-Injection Test Coverage Blindspot

**When:** 2026-06-13 · **Fact:** `P-GXG7L6RH`
**Why:** Known pattern (documented in Task-85). Prevents undetected untested code from merging.

<!-- decision:P-Q73KUNWJ -->

## Sonar 0%-New-Code Coverage Gate

**When:** 2026-06-13 · **Fact:** `P-Q73KUNWJ`
**Why:** Prevents untested code from reaching production; enforces code quality.

<!-- decision:P-UMH4G5A2 -->

## Bash tool cwd persists — cd into a workspace silently reroutes npm test

**When:** 2026-06-13 · **Fact:** `P-UMH4G5A2`
**Why:** Burned ~two cycles this session reading 6-passed and a packages/cli error path as if they were the root suite; the cause was a persisted cd from an earlier inspect command, not a real failure.

<!-- decision:P-DMPCD5F3 -->

## bash-cwd-drift creates packages/cli/context/ artifacts

**When:** 2026-06-13 · **Fact:** `P-DMPCD5F3`
**Why:** Prevents misidentification of artifacts as uncommitted work; documents a known benign quirk

<!-- decision:P-VEMJ4EVR -->

## exit-doors gate performs Task-137 validation

**When:** 2026-06-13 · **Fact:** `P-VEMJ4EVR`
**Why:** Documents validation chain; shows active error detection in prerun gating

<!-- decision:P-64FTWQKK -->

## Task 135 integrated pack-completeness validator into prerun

**When:** 2026-06-13 · **Fact:** `P-64FTWQKK`
**Why:** Documents evolution from manual to structured validation; pattern for future gating work

<!-- decision:P-BQDDQLMM -->

## Task 140 has byte-identical output hard constraint

**When:** 2026-06-13 · **Fact:** `P-BQDDQLMM`
**Why:** Any byte difference breaks downstream content-addressed systems

<!-- decision:P-4EGENKKN -->

## Task Queue Organization & Naming Convention

**When:** 2026-06-13 · **Fact:** `P-4EGENKKN`
**Why:** Task codes are used as shorthand in planning and PR context; CLI items have documentation prerequisites; queue structure clarifies what "done" means for a release

<!-- decision:P-44FARNBA -->

## Handler Test Coverage Gap: Error/Exit Branches

**When:** 2026-06-13 · **Fact:** `P-44FARNBA`
**Why:** This systematic gap risks incomplete coverage and repeated discovery cycles. Recording the pattern prevents future handler-task rework.

<!-- decision:P-VHDD6VVV -->

## Direct-to-Main Approval by Campaign Rules

**When:** 2026-06-13 · **Fact:** `P-VHDD6VVV`
**Why:** Enforces code quality gates and test verification. Committing production code directly to main breaks CI discipline and prevents the full test run from catching integration issues. Also: never commit when test failures are present.

<!-- decision:P-PBCLJ2VB -->

## Multi-Stage Quality Gates Catch Bugs Unit Tests Miss

**When:** 2026-06-13 · **Fact:** `P-PBCLJ2VB`
**Why:** Unit tests verify isolated units but don't catch async races, untested paths, integration issues, or runtime environment quirks.

<!-- decision:P-XAVLD63M -->

## Production Code Must Go Through PR/CI

**When:** 2026-06-13 · **Fact:** `P-XAVLD63M`
**Why:** PR/CI ensures code review, confirmed-green test suite before merge, and cross-platform CI validation. CI matrix catches Windows/macOS issues that local runs may miss.

<!-- decision:P-4aG26CRV -->

## npm 12 & the 141a/141b Migration Strategy

**When:** 2026-06-13 · **Fact:** `P-4aG26CRV`
**Why:** npm-12 is a hard blocker for better-sqlite3. 141b removes the problem entirely; no native deps = install anywhere, forever.

<!-- decision:P-PU4FZPZW -->

## Kit Versioning Uses Lane-Themed Releases, Not Strict Semver

**When:** 2026-06-13 · **Fact:** `P-PU4FZPZW`
**Why:** Prevents confusion between strict semver (feature = minor bump) and the kit's versioning scheme, where a minor bump signals a paradigm/capability shift, and patches are polish within that shift. Ensures settled decisions (e.g., "v0.4.0 is Kiro") don't get accidentally clobbered by sequential numbering logic.

<!-- decision:P-V77JZTJR -->

## Live validation must happen before committing major dependency migrations; don't

**When:** 2026-06-13 · **Fact:** `P-V77JZTJR`

<!-- decision:P-UKXW3FN9 -->

## v0.3.1 will release the current feature batch (live-tested first); v0.3.2 will i

**When:** 2026-06-13 · **Fact:** `P-UKXW3FN9`

<!-- decision:P-ZXaUQRaS -->

## Conditional Tech Adoption Discipline

**When:** 2026-06-13 · **Fact:** `P-ZXaUQRaS`
**Why:** Prevents trading UX/performance for technical elegance or convenience on faith. Forces explicit data-driven decisions.

<!-- decision:P-JHLNTFBM -->

## Node:sqlite Adoption Perf Gate (D-147) — Execution Plan

**When:** 2026-06-13 · **Fact:** `P-JHLNTFBM`
**Why:** User won't regress user-facing response latency for installation convenience. Perf is measured, not assumed.

<!-- decision:P-ZCRT7N2H -->

## Accepts one-time install UX friction (binding prompt); will not sacrifice perman

**When:** 2026-06-13 · **Fact:** `P-ZCRT7N2H`

<!-- decision:P-FPYJVM79 -->

## Chose "no measurable regression" for storage backend — search speed is the kit's

**When:** 2026-06-13 · **Fact:** `P-FPYJVM79`

<!-- decision:P-K4X4VRPH -->

## Perf Gate Principle — Search Speed Non-Negotiable

**When:** 2026-06-13 · **Fact:** `P-K4X4VRPH`
**Why:** User stated search is foundational to the kit's purpose; any permanent slowdown defeats the kit's value. This discipline parallels prior bake-offs (D-109 embedder choice).

<!-- decision:P-EAALA5AR -->

## v0.3.1 Cut-Gate Checklist (Additive Testing Plan)

**When:** 2026-06-13 · **Fact:** `P-EAALA5AR`
**Why:** Ensures every v0.3.x release tests standing regression checks + new-feature validation consistently. Three-part structure (CLI-driven, user-only, pre-tag) is reusable for future releases.

<!-- decision:P-XSE9J4SZ -->

## Cut-Gate Live-Test Verification Workflow

**When:** 2026-06-14 · **Fact:** `P-XSE9J4SZ`
**Why:** Live testing plus on-disk file verification surfaces boundary violations and single-point-of-enforcement failures that automated tests alone cannot detect

<!-- decision:P-SD7WDA3Z -->

## Hook-Boundary Implementation Gap (Privacy-Strip Example)

**When:** 2026-06-14 · **Fact:** `P-SD7WDA3Z`
**Why:** Single-point-of-enforcement (hook-only) misses actual file write operations; boundary violations slip through without file-verification checks

<!-- decision:P-9YGaCE66 -->

## Post-Merge Clean-Build Verification

**When:** 2026-06-14 · **Fact:** `P-9YGaCE66`
**Why:** Dev tree may have transient state; only a clean build from main branch proves the product is correct

<!-- decision:P-ZMCV7XLP -->

## RESUME v0.3.1 cut-gate — 2 bugs found+fixed, PR #179 in flight

**When:** 2026-06-14 · **Fact:** `P-ZMCV7XLP`
**Why:** Context near auto-compact mid-cut-gate; the next session must not lose where the live-test stands or re-derive the two findings.

<!-- decision:P-4HWRCJBR -->

## Sensitive Content Policy for Memory Capture System

**When:** 2026-06-14 · **Fact:** `P-4HWRCJBR`
**Why:** Ensures personal/sensitive content never silently lands in git-committed, possibly-shared files. Solves the core risk: sensitive data in a repo that might be pushed.

<!-- decision:P-VREAaST9 -->

## vitest can show a module-resolution failure (Cannot find module /@id/...) on the

**When:** 2026-06-14 · **Fact:** `P-VREAaST9`
**Why:** It LOOKS like a test failure in CI/stress, and the lazy reflex is to wave it off as 'known transient' — but that exact reflex is what hid a real CodeQL high-sev alert on this same PR #179. Never assume transient.

<!-- decision:P-4PEW73GU -->

## Cut-gate validation includes paraphrase-recall check

**When:** 2026-06-14 · **Fact:** `P-4PEW73GU`
**Why:** Ensures comprehensive semantic validation of the merged build before considering work complete.

<!-- decision:P-7Z4JAQLX -->

## Multi-layer gating before main merge

**When:** 2026-06-14 · **Fact:** `P-7Z4JAQLX`
**Why:** Catches issues at multiple points before they reach main; reduces risk of broken mainline.

<!-- decision:P-X9ZB69LH -->

## Stress runner and incremental JSON handling

**When:** 2026-06-14 · **Fact:** `P-X9ZB69LH`
**Why:** Avoids wasted debugging effort on partial/corrupt JSON; runner handles it internally.

<!-- decision:P-ZHC3BS29 -->

## Release Gating Workflow for Version Cuts

**When:** 2026-06-14 · **Fact:** `P-ZHC3BS29`
**Why:** Each gate catches different classes of bugs. Stress + CI catch logic errors; install-path tests catch deployment/integration issues that CI misses (e.g., title-truncation data-loss bugs now fixed in PR #180).

<!-- decision:P-D7aTRN9U -->

## v0.3.1 Release: Final Workflow

**When:** 2026-06-14 · **Fact:** `P-D7aTRN9U`
**Why:** This is the fully mapped workflow for v0.3.1 release; provides a template for subsequent releases and ensures no steps are skipped.

<!-- decision:P-K6GWAA44 -->

## INDEX.md is a committed human-readable artifact

**When:** 2026-06-14 · **Fact:** `P-K6GWAA44`
**Why:** INDEX is part of the project's shipped state; users rely on it staying current and human-readable

<!-- decision:P-X2ZJ6Y4J -->

## writeFact silent failure mode: reindex failure swallowing

**When:** 2026-06-14 · **Fact:** `P-X2ZJ6Y4J`
**Why:** Hidden failure mode caused INDEX corruption with no observable signal; was only discoverable via file audit

<!-- decision:P-RKHLCEET -->

## Release Documentation Convention (Bug Fixes vs Features)

**When:** 2026-06-14 · **Fact:** `P-RKHLCEET`
**Why:** Keeps release history clean and searchable; ensures README reflects actual feature set, not implementation fixes

<!-- decision:P-J7D46R62 -->

## Anti-Pattern Rejection: SessionStart Auto-Heal

**When:** 2026-06-14 · **Fact:** `P-J7D46R62`
**Why:** The incidental next-capture self-heal suffices. Hot-path cost is not justified for cosmetic drift.

<!-- decision:P-7G3GYKTM -->

## INDEX Drift Self-Heal Architecture

**When:** 2026-06-14 · **Fact:** `P-7G3GYKTM`
**Why:** The incidental next-capture self-heal is sufficient and costs nothing at runtime. SessionStart machinery would over-engineer a vanishingly rare edge case.

<!-- decision:P-CFA7ZXAa -->

## Session 1 Post-Execution Guardrails

**When:** 2026-06-14 · **Fact:** `P-CFA7ZXAa`
**Why:** Confirms Stop hook and auto-memory extraction system are functioning; validates that durable facts are captured with reasoning sections

<!-- decision:P-QCKEA5A3 -->

## Session 1 Staged Build Workflow

**When:** 2026-06-14 · **Fact:** `P-QCKEA5A3`
**Why:** Validates auto-memory extraction system (Stop hook auto-captures preferences stated naturally, without explicit "remember this" commands)

<!-- decision:P-4aRS5H6T -->

## Clean-Start Procedure for Session 1 Test

**When:** 2026-06-14 · **Fact:** `P-4aRS5H6T`
**Why:** Ensures B3/B4 cross-project persona capture can verify uv/ruff rule lands from zero; prevents pre-seeding contamination

<!-- decision:P-9VESM93S -->

## Claude Memory Kit Installation Levels

**When:** 2026-06-14 · **Fact:** `P-9VESM93S`
**Why:** Testing Session 1 validates that cross-project persona capture fires correctly; this requires a fresh project folder with zero pre-seeded facts. The global binary is stable; only the per-project scaffold is session-specific.

<!-- decision:P-CEDDPRCH -->

## Claude Code Hook Activation Requires Restart

**When:** 2026-06-14 · **Fact:** `P-CEDDPRCH`
**Why:** Claude Code loads hook configuration once at startup and does not hot-reload `.claude/settings.json` changes.

<!-- decision:P-WaCZ7REY -->

## cmk install --with-semantic Scaffolds Semantic Recall

**When:** 2026-06-14 · **Fact:** `P-WaCZ7REY`
**Why:** Semantic search adds hybrid matching (keyword + semantic) to memory recall, improving relevance of facts retrieved across sessions.

<!-- decision:P-4VT5UP5R -->

## Memory Kit Hooks Are Project-Scoped

**When:** 2026-06-14 · **Fact:** `P-4VT5UP5R`
**Why:** Hooks execute in the context of the Claude Code window that triggered them, which is tied to the open project directory. They read `.claude/settings.json` from the working directory.

<!-- decision:P-XQRM9UFY -->

## cut-gate11 Memory System Three-Tier Architecture

**When:** 2026-06-14 · **Fact:** `P-XQRM9UFY`
**Why:** Enables safe sharing of scaffold and memory across machines without leaking per-machine artifacts or raw logs

<!-- decision:P-MWQKPU54 -->

## cut-gate11 Pre-Session Verification Checklist

**When:** 2026-06-14 · **Fact:** `P-MWQKPU54`
**Why:** Documents baseline scaffold state; confirms readiness before building; catches misconfiguration early

<!-- decision:P-QZS2XMKP -->

## Memory-search skill trigger is phrasing-sensitive

**When:** 2026-06-14 · **Fact:** `P-QZS2XMKP`
**Why:** Explains variance in early test runs; clarifies this is a trigger-detection polish issue (fixable), not mechanism failure (blocker)

<!-- decision:P-JP9PYX7R -->

## Memory-Recall Fix Incomplete — Structure Questions Still Code-Crawl

**When:** 2026-06-14 · **Fact:** `P-JP9PYX7R`
**Why:** The user is systematically verifying whether a fix actually produces the intended behavior. Unit tests pass, but they verify well-formedness, not live behavior — especially important for LLM-sensitive recall.

<!-- decision:P-NU2K2NN9 -->

## Validation Pipeline for claude-memory-kit Includes Format and Privacy Gates

**When:** 2026-06-14 · **Fact:** `P-NU2K2NN9`
**Why:** Preventive gates catch issues before code review, reducing back-and-forth and avoiding silent failures (1024-char limit would cause skill to silently fail to load).

<!-- decision:P-DBTYCD5U -->

## Research-Based Claims Discipline

**When:** 2026-06-14 · **Fact:** `P-DBTYCD5U`
**Why:** Prevents unfounded claims about competitive landscape that could misdirect architecture; the kit's core value depends on understanding how others solved the same recall problem.

<!-- decision:P-DSPZ9CAW -->

## Deciding Experiment That Gates v0.3.1

**When:** 2026-06-14 · **Fact:** `P-DSPZ9CAW`
**Why:** Live re-test validates the fix against the original problem (crawling code instead of using memory). Removes doubt and gates the tag decision.

<!-- decision:P-a2BSC7NG -->

## Description Field Length — Root Cause and Fix

**When:** 2026-06-14 · **Fact:** `P-a2BSC7NG`
**Why:** Long descriptions were silently breaking the YAML structure or exceeding token/parsing limits. This was discovered by code inspection (challenge 1: "Did you check the docs?").

<!-- decision:P-M7ZYUVES -->

## v2 Skill Triggering: Semantic Intent Instead of Phrase Matching

**When:** 2026-06-14 · **Fact:** `P-M7ZYUVES`
**Why:** Phrase-matching fails for esoteric/roundabout questions; semantic intent + hint-reference generalizes across varied phrasings.

<!-- decision:P-9HK3PZVK -->

## Recall Skill Validation Contract

**When:** 2026-06-14 · **Fact:** `P-9HK3PZVK`
**Why:** The skill has two failure modes (over-fire wastes cycles, under-fire misses memory). Testing both ensures usability. Systematic eval in v0.4 is more rigorous than endless hand-trials.

<!-- decision:P-LVTJKE2B -->

## Layered Backend Architecture in Live Persona

**When:** 2026-06-14 · **Fact:** `P-LVTJKE2B`
**Why:** Architecture was described across projects (inferred vs declared) and stuck in medium-confidence queue; auto-drain moved it to live tier for consistent injection.

<!-- decision:P-M9DH6KYM -->

## Persona Auto-Drain Queue for Medium-Confidence Candidates

**When:** 2026-06-14 · **Fact:** `P-M9DH6KYM`
**Why:** The wedge test was failing because persona wasn't injecting into new projects; medium-confidence signals were stuck with no escape path.

<!-- decision:P-AaTGXLHE -->

## cmk install modes affect cold-open search behavior

**When:** 2026-06-14 · **Fact:** `P-AaTGXLHE`
**Why:** Testing fixes under different configurations than the original bug report creates false-negative risk (test appears to fail when fix is actually working)

<!-- decision:P-TCKPLP3E -->

## Cold-Start Test for Persona Architecture Transfer

**When:** 2026-06-14 · **Fact:** `P-TCKPLP3E`
**Why:** Tests whether persona facts not only transfer to new projects but are actually applied in generation. Confirms memory drainage/promotion system works end-to-end, not just at storage level.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-6LJZ69M5 -->

## SonarCloud Coverage Job Rate-Limited by HF Hub Cache Miss

**When:** 2026-06-15 · **Fact:** `P-6LJZ69M5`
**Why:** HF Hub rate-limiting on shared API keys is a hidden failure mode in CI; without caching, coverage jobs fail silently. The fix is mechanical (copy the cache step), but the root cause is non-obvious.

<!-- decision:P-ZV6DT5WA -->

## Release Merge-Gate Workflow

**When:** 2026-06-15 · **Fact:** `P-ZV6DT5WA`
**Why:** Gate checks prevent shipping broken or incomplete releases; mandatory discipline for release safety.

<!-- decision:P-SSTU3RL4 -->

## Release Gate Workflow and Final User Control

**When:** 2026-06-15 · **Fact:** `P-SSTU3RL4`
**Why:** Ensures all checks pass before any publishable artifact is created. User retains final control per D-126 (no auto-tagging from CI).

<!-- decision:P-ENQSa3T9 -->

## SonarCloud Zero-Coverage From Missing Cache Step

**When:** 2026-06-15 · **Fact:** `P-ENQSa3T9`
**Why:** Failure cascade was non-obvious and blocked the v0.3.1 gate; worth capturing for future SonarCloud troubleshooting.

<!-- decision:P-XCTDZRCH -->

## Post-Commit Validator Suite

**When:** 2026-06-15 · **Fact:** `P-XCTDZRCH`
**Why:** Catch integration bugs early: dangling references, leaks, orphaned task IDs. These are easy to miss in manual review.

<!-- decision:P-PKPUKZRH -->

## RELEASE-PLAN.md: Authoritative Task-to-Lane Map

**When:** 2026-06-15 · **Fact:** `P-PKPUKZRH`
**Why:** Prevents silent orphans. A task could appear laned in tasks.md but actually lack a version assignment, causing confusion about scope and release timing.

<!-- decision:P-DY6aUA7A -->

## Task-Lane Consistency Audit Workflow

**When:** 2026-06-15 · **Fact:** `P-DY6aUA7A`
**Why:** Tasks can acquire lane context without being formally assigned to a version, creating shadow state. A side-by-side comparison of both files catches these silently-laned-but-unassigned tasks.

<!-- decision:P-YLWTT5aG -->

## TencentDB-Agent-Memory Write/Search Implementation Comparison

**When:** 2026-06-15 · **Fact:** `P-YLWTT5aG`
**Why:** Comparative code-level review of adjacent implementation reveals convergence areas (no action) and architectural alternatives (design patterns for roadmap).

<!-- decision:P-7MXBHAWU -->

## User reviews multiple adjacent/competing projects to extract design patterns and

**When:** 2026-06-15 · **Fact:** `P-7MXBHAWU`

<!-- decision:P-GATKYaHT -->

## Task 50 Research-Revisit Gate and Multi-Agent Pattern

**When:** 2026-06-15 · **Fact:** `P-GATKYaHT`
**Why:** Leverage existing multi-agent research; avoid re-derivation. Taskmaster provides actionable blueprints before Task 50 starts.

<!-- decision:P-ZDR9EQRa -->

## v0.4.x Versioning Roadmap

**When:** 2026-06-15 · **Fact:** `P-ZDR9EQRa`
**Why:** Clarifies v0.4.0 ships infrastructure + first integration. Explains tail strategy: agents are patch-level, numbered only at ship time.

<!-- decision:P-HTZHX3F7 -->

## OpenHands Context Condenser — Applicable Compression Ideas

**When:** 2026-06-15 · **Fact:** `P-HTZHX3F7`
**Why:** Production patterns from mature agent runtime; worth evaluating for compression design

<!-- decision:P-DYa3YF7X -->

## Qdrant Vector Database — Re-rejected (ADR-0015 reaffirmed)

**When:** 2026-06-15 · **Fact:** `P-DYa3YF7X`
**Why:** Prevents future re-litigations; clarifies architectural vs technical reasons for rejection

<!-- decision:P-ZE9MW3QP -->

## Open Knowledge Format (OKF) — Design Validation and Interchange Target

**When:** 2026-06-15 · **Fact:** `P-ZE9MW3QP`
**Why:** External validation that kit's core thesis (git-native, minimal, human-readable) is correct; OKF provides a ready-made interchange standard at the team/cross-agent boundary without full redesign

<!-- decision:P-4QAAULAL -->

## Research Triage Rule — Skip Out-of-Scope Topics

**When:** 2026-06-15 · **Fact:** `P-4QAAULAL`
**Why:** Keeps research archive focused and load-bearing; prevents cluttering with unrelated material; ensures every saved memo is something a future session will actually use

<!-- decision:P-4ELVTGQB -->

## I used https://github.com/SpillwaveSolutions/project-memory before starting clau

**When:** 2026-06-15 · **Fact:** `P-4ELVTGQB`

<!-- decision:P-FaMS2LTW -->

## D-144 (housekeeping) is the post-Task-129 step in the remaining v0.3.x queue

**When:** 2026-06-15 · **Fact:** `P-FaMS2LTW`

<!-- decision:P-aRUCEJ6E -->

## FTS5 Query Sanitization (Task 153)

**When:** 2026-06-15 · **Fact:** `P-aRUCEJ6E`
**Why:** production bug affecting search UX when version strings or dotted terms appear in queries

<!-- decision:P-L5S6JJU3 -->

## v0.3.2 Release Scope Expanded

**When:** 2026-06-15 · **Fact:** `P-L5S6JJU3`
**Why:** The v0.3.2 scope expanded beyond the initial 153+152 after re-evaluation: 134 (open since v0.3.1, zero-risk add) and the gitattributes follow-up (parked from Task 139) were pulled in, plus 147 (the decisions.md the user explicitly asked for). The node:sqlite migration stays conditional because search latency is paid every query forever — we don't sacrifice the kit's core purpose for an install-time convenience.

<!-- decision:P-GWKDXJU4 -->

## Planning Docs as Standalone Commits on Main

**When:** 2026-06-15 · **Fact:** `P-GWKDXJU4`
**Why:** Maintains "single source of truth, same commit batch" discipline. Scope decisions are visible in main history and don't get tangled with task PR reviews.

<!-- decision:P-JXRTNTaG -->

## v0.3.2 Scope Locked; Strict Task-Order Discipline

**When:** 2026-06-15 · **Fact:** `P-JXRTNTaG`
**Why:** Dependencies and risk management. Spike results for 141b decide whether it ships in v0.3.2 or defers to v0.3.3.

<!-- decision:P-2Qa3JA5W -->

## FTS5 Query Sanitization — Per-Token Quoting Design

**When:** 2026-06-15 · **Fact:** `P-2Qa3JA5W`
**Why:** Per-token quoting preserves implicit-AND between words (better recall for multi-word queries like "layered architecture"), while whole-query quoting forces strict phrase matching. Grounded in SQLite FTS5 primary docs.

<!-- decision:P-CWTW7GT6 -->

## FTS5 and sqlite-vec are chosen by design per ADR-0002 and ADR-0015

**When:** 2026-06-15 · **Fact:** `P-CWTW7GT6`
**Why:** These are foundational architectural constraints. Future sessions may encounter FTS5 recall limitations or proposals to switch to a vector DB; understanding these tenets is essential to evaluating such requests.

<!-- decision:P-FZSCATHJ -->

## v0.3.2 Scope Correction Dedup

**When:** 2026-06-15 · **Fact:** `P-FZSCATHJ`
**Why:** Pulling already-shipped tasks back into a new version's scope is a real planning error — it would waste a re-implementation cycle or ship a confusing duplicate. The correction is the durable state; the earlier expanded-scope fact is now misleading and must not be the one a future session recalls.

<!-- decision:P-YEH2DCQU -->

## Node:sqlite FTS5 Module Availability Gate for Task 141b Migration

**When:** 2026-06-15 · **Fact:** `P-YEH2DCQU`
**Why:** Task 141b is conditional on three spikes. Without confirming FTS5 is available on all target platforms, the migration could pass in controlled dev/test environments but fail in production.

<!-- decision:P-LaJYSMLa -->

## Reject ponytail plugin; philosophical conflict with project design

**When:** 2026-06-15 · **Fact:** `P-LaJYSMLa`
**Why:** The kit's value derives from deliberate rigor; Ponytail optimizes in the opposite direction. Adopting it would undermine the project's architectural philosophy and create decision-making conflicts on every tool/code choice.

<!-- decision:P-HC3VHHET -->

## Kit Produces Facts, Not Views — The DECISIONS.md Gap

**When:** 2026-06-15 · **Fact:** `P-HC3VHHET`
**Why:** Clarifies Task 147 scope — DECISIONS.md is *not* redundant with existing docs; it's the *missing view* that the kit's facts should feed into. Distinction: kit = facts, DECISION-LOG/squad = views.

<!-- decision:P-FH2Q2TZ7 -->

## Append-Only Model for DECISIONS.md (Never Regenerate from Live Facts)

**When:** 2026-06-15 · **Fact:** `P-FH2Q2TZ7`
**Why:** Regenerating from live facts erases history. Superseded decisions disappear; retracted decisions are gone. This violates the decision-trail preservation rule: the journal's purpose is to show why we changed course, not rewrite history to look like current state was always obvious. Squad appends for this reason (history is the point). The kit can improve squad's model (no junk, typed facts, clear structure) while keeping the append-only virtue.

<!-- decision:P-32DWHP4G -->

## Regenerated Surfaces vs Append-Only Surfaces (Digest vs DECISIONS.md)

**When:** 2026-06-15 · **Fact:** `P-32DWHP4G`
**Why:** They answer different questions. Digest = "current knowledge" (regeneration correct, always consistent). DECISIONS = "why did we decide this" (append correct, history is the point). Regenerating DECISIONS erases context; appending digest fills it with noise.

<!-- decision:P-AYFCJ25H -->

## Unbounded Permanent Ledger vs Bounded Working Set (DECISIONS.md vs MEMORY.md)

**When:** 2026-06-15 · **Fact:** `P-AYFCJ25H`
**Why:** Working memory and decision history need opposite strategies. MEMORY is a triage queue (keep recent threads hot). DECISIONS is a permanent record (context for architectural choices). Confusing them would either lose old decisions (parking) or bloat DECISIONS with noise (bounded).

<!-- decision:P-3C9V6a76 -->

## DECISIONS.md is append-only permanent journal not regenerated

**When:** 2026-06-15 · **Fact:** `P-3C9V6a76`
**Why:** Arrived at by reasoning through what happens when a decision-fact is superseded/forgotten over time. A regenerated-from-live DECISIONS.md (my first instinct, mirroring INDEX.md) would erase superseded decisions — destroying the journal's entire value (the why-we-changed trail). The MEMORY.md parking model also must NOT apply: old decisions are the MOST valuable part of a decision log, so it's unbounded and never rolls. Append-permanent for the journal vs regenerate for the digest — the difference IS the MEMORY.md-vs-decision-log distinction. Squad appends because it has no DB; the kit appends-with-structure (links/supersession/no-junk) because it does.

<!-- decision:P-Aa22MJAC -->

## semantic backend: sqlite-vec primary, zvec fallback

**When:** 2026-06-10 · **Fact:** `P-Aa22MJAC`
**Why:** sqlite-vec puts vectors inside the SQLite index the kit already runs (one store, design 9.3.1 fit); zvec is embedded+Node+Windows but its bindings are only ~May-2026 old

<!-- decision:P-N9BGGaK6 -->

## Transient Failure Retry Strategy

**When:** 2026-06-10 · **Fact:** `P-N9BGGaK6`
**Why:** A single transient delay can cause false negatives; 5 seconds is low-cost. Distinguishing jitter from real degradation prevents flaky CI while preserving signal for real b

<!-- decision:P-QXDNaC5U -->

## v0.3.0 is BUILD-COMPLETE (2026-06-10): Tasks 46/125/124/75(all)/104(all) shipped

**When:** 2026-06-10 · **Fact:** `P-QXDNaC5U`

<!-- decision:P-MHCAaYVG -->

## Cut-Gate Testing Guide (Manual Release QA)

**When:** 2026-06-10 · **Fact:** `P-MHCAaYVG`
**Why:** Encodes hard-won lessons (D-84, v0.2.0, Task-75) into repeatable process; prevents regression and avoids known gotchas; respects user's time with clear estimates and scope boundaries.

<!-- decision:P-a5W95QXS -->

## This file (docs/process/cut-gate.md) is their manual live-test guide for release

**When:** 2026-06-10 · **Fact:** `P-a5W95QXS`

<!-- decision:P-TaHaDQV7 -->

## B5/B7 Probe Footgun — settings.json Wholesale Overwrite

**When:** 2026-06-10 · **Fact:** `P-TaHaDQV7`
**Why:** Running B5/B7 in a working directory (not throwaway) corrupts configuration.

<!-- decision:P-aA5S5S2U -->

## User confirmed companion project approach for Task 127 aligns with kit philosoph

**When:** 2026-06-10 · **Fact:** `P-aA5S5S2U`

<!-- decision:P-ULTaWK4B -->

## Release Gate Structure (v0.3.0)

**When:** 2026-06-11 · **Fact:** `P-ULTaWK4B`
**Why:** D3's promotion to required blocker is a recent change; the next release cycle must respect this gate structure.

<!-- decision:P-Pa5RBNQ4 -->

## Release Git Choreography: Memory, Release, Tag (in order)

**When:** 2026-06-11 · **Fact:** `P-Pa5RBNQ4`
**Why:** Keeps the tree clean; release commits reflect versioning, not session metadata. Memory churn is incidental to development, not part of the release artifact.

<!-- decision:P-aLPJJGFL -->

## Separate Memory Captures from Release Commits

**When:** 2026-06-11 · **Fact:** `P-aLPJJGFL`
**Why:** Release commits should show only what went into the release — when auditing `release: vX.Y.Z` later, the commit should be uncluttered and reviewable as a pure version bump. Accumulated memory captures muddy that history.

<!-- decision:P-MZDaYRWX -->

## Requesting complete re-verification: check previous test gate outputs (gate7), r

**When:** 2026-06-11 · **Fact:** `P-MZDaYRWX`

<!-- decision:P-aN9PaSGC -->

## Validation Gate Structure (cut-gate9 Release)

**When:** 2026-06-11 · **Fact:** `P-aN9PaSGC`
**Why:** Standardized gates catch regressions; each check owns a specific concern. Automation verifies what it can; in-session UX and skip-prompt behavior require hands-on testing.

<!-- decision:P-7XKFaB2N -->

## Secret Leakage Defense-in-Depth Model

**When:** 2026-06-11 · **Fact:** `P-7XKFaB2N`
**Why:** No single filter is complete. Layering reduces likelihood accidental secrets reach git.

<!-- decision:P-RL2aKHKQ -->

## Prefers concise, numbered instructions without narrative explanation or backgrou

**When:** 2026-06-11 · **Fact:** `P-RL2aKHKQ`

<!-- decision:P-Za6L72JM -->

## canonicalize() Super-Linear Regex Hotspot

**When:** 2026-06-11 · **Fact:** `P-Za6L72JM`
**Why:** Confirmed real pattern, but execution is too constrained for practical risk. Behavior-identical fix ensures downstream stability.

<!-- decision:P-XQ9RYXaJ -->

## Backlog for v0.3.x and v0.4

**When:** 2026-06-11 · **Fact:** `P-XQ9RYXaJ`
**Why:** These tasks emerged from the quality gate review and are ready to schedule.

<!-- decision:P-9NaMaLE6 -->

## v0.3.0 Released With Green Quality Gate

**When:** 2026-06-11 · **Fact:** `P-9NaMaLE6`
**Why:** Marks completion of the quality gate enforcement for this release; establishes clean baseline for next session.

<!-- decision:P-4aaKKRKV -->

## PII Handling — Non-Adoption of Quarantine

**When:** 2026-06-11 · **Fact:** `P-4aaKKRKV`
**Why:** Kit's memory lives in git repos — privacy (discard-on-sight) is higher priority than quarantine-for-review UX

<!-- decision:P-NXF3aCPB -->

## Semantic Search vs. Grep Trade-Off (D-111 Design Rationale)

**When:** 2026-06-12 · **Fact:** `P-NXF3aCPB`
**Why:** The kit's semantic-search choice diverges from PAI despite shared philosophy. The decision is data-driven (benchmarked) and intentional, not a paradigm violation. Documents why the choice was made for future reconsideration.

<!-- decision:P-TUJKaAQ6 -->

## Autopilot Memory Consultation Architecture

**When:** 2026-06-12 · **Fact:** `P-TUJKaAQ6`
**Why:** Autopilot work must leverage memory without explicit asking; design balances autonomous value against deliberate human control over forget/queue decisions.

<!-- decision:P-DC97QaDC -->

## Pre-session verification found one composition bug (memory-search allow-list omi

**When:** 2026-06-12 · **Fact:** `P-DC97QaDC`

<!-- decision:P-BJQaGQ6H -->

## Iterative, thorough research approach—adds items even near session end rather th

**When:** 2026-06-12 · **Fact:** `P-BJQaGQ6H`

<!-- decision:P-A6XDaDHA -->

## Kit Feature Gap — Chronological Decision Rendering

**When:** 2026-06-12 · **Fact:** `P-A6XDaDHA`
**Why:** That both the kit and Squad independently maintain chronological journals indicates this view type is valuable beyond individual-fact retrieval. The gap is a missed product feature—a natural extension of `cmk digest`.

<!-- decision:P-7RQTaMU4 -->

## Kit's Decision Log — Manual Maintenance Pattern

**When:** 2026-06-12 · **Fact:** `P-7RQTaMU4`
**Why:** Both the kit team and peer projects (Squad) independently maintain chronological decision journals, suggesting this narrative form provides value that individual-fact storage doesn't. The kit chose to keep D-log authoritative rather than migrate to the fact model.

<!-- decision:P-XTLTaX5C -->

## Decision-Journal View Gap — Now Task 147

**When:** 2026-06-12 · **Fact:** `P-XTLTaX5C`
**Why:** User pattern discovery — manual decision journaling across multiple teams signals a real user need the kit doesn't yet meet

<!-- decision:P-aUDDN4WP -->

## Task 147 design upgraded: the kit gets a STANDING committed context/DECISIONS.md

**When:** 2026-06-12 · **Fact:** `P-aUDDN4WP`
**Why:** A standing journal puts each decision line in the PR diff that captured it (reviewable), travels with git clone, and needs no tooling to read - the same reasons the build repo hand-maintains its own DECISION-LOG

<!-- decision:P-ZRQRa277 -->

## kit needs decisions.md feature

**When:** 2026-06-12 · **Fact:** `P-ZRQRa277`

<!-- decision:P-7FV4EYaW -->

## npm v12 Script Approval: Project vs. Global Configuration Paths

**When:** 2026-06-12 · **Fact:** `P-7FV4EYaW`
**Why:** Dual-path architecture means different remediation per install type. Verified against GitHub changelog (2026-06-09) and community discussion #198547.

<!-- decision:P-BDES4aW7 -->

## Install-time consent for better-sqlite3 binding (replaces error → doctor round-trip)

**When:** 2026-06-12 · **Fact:** `P-BDES4aW7`
**Why:** User objected to original UX (npm install error → doctor command → error again → discovery left to an obscure tool). This change prioritizes inline, immediate resolution at the moment of install. Their feedback shaped the design before it shipped.

<!-- decision:P-XBB4aELR -->

## Dependabot Cannot Approve allowScripts in Strict Repos

**When:** 2026-06-12 · **Fact:** `P-XBB4aELR`
**Why:** Affects approval fatigue and long-term security posture in strict-mode npm repos.

<!-- decision:P-aZH2NRSE -->

## Task Pipeline Stages

**When:** 2026-06-12 · **Fact:** `P-aZH2NRSE`
**Why:** Recurring structure observed across Tasks 74, 144, 145; understanding stages helps predict throughput and identify bottlenecks

<!-- decision:P-E6J7aYH5 -->

## skill-review Imported-Facts Staleness Bug Fixed

**When:** 2026-06-12 · **Fact:** `P-E6J7aYH5`
**Why:** Correctness of the memory system depends on imported facts remaining fresh. This bug threatened that invariant.

<!-- decision:P-2aD2YHMB -->

## Modular Skill Architecture: Read/Write Separation

**When:** 2026-06-13 · **Fact:** `P-2aD2YHMB`
**Why:** Separating read from write reduces blast radius and prevents accidental memory corruption. The boundary is a first-class design principle, not an implementation detail.

<!-- decision:P-2JMVXJ3a -->

## Task 146: Concurrent Swarm Support Testing

**When:** 2026-06-13 · **Fact:** `P-2JMVXJ3a`
**Why:** The kit's strength is as a shared memory layer for many independent agents. Concurrent safety is the missing validation needed before swarm support is proven.

<!-- decision:P-4aG26CRV -->

## npm 12 & the 141a/141b Migration Strategy

**When:** 2026-06-13 · **Fact:** `P-4aG26CRV`
**Why:** npm-12 is a hard blocker for better-sqlite3. 141b removes the problem entirely; no native deps = install anywhere, forever.

<!-- decision:P-ZXaUQRaS -->

## Conditional Tech Adoption Discipline

**When:** 2026-06-13 · **Fact:** `P-ZXaUQRaS`
**Why:** Prevents trading UX/performance for technical elegance or convenience on faith. Forces explicit data-driven decisions.

<!-- decision:P-9YGaCE66 -->

## Post-Merge Clean-Build Verification

**When:** 2026-06-14 · **Fact:** `P-9YGaCE66`
**Why:** Dev tree may have transient state; only a clean build from main branch proves the product is correct

<!-- decision:P-VREAaST9 -->

## vitest can show a module-resolution failure (Cannot find module /@id/...) on the

**When:** 2026-06-14 · **Fact:** `P-VREAaST9`
**Why:** It LOOKS like a test failure in CI/stress, and the lazy reflex is to wave it off as 'known transient' — but that exact reflex is what hid a real CodeQL high-sev alert on this same PR #179. Never assume transient.

<!-- decision:P-D7aTRN9U -->

## v0.3.1 Release: Final Workflow

**When:** 2026-06-14 · **Fact:** `P-D7aTRN9U`
**Why:** This is the fully mapped workflow for v0.3.1 release; provides a template for subsequent releases and ensures no steps are skipped.

<!-- decision:P-CFA7ZXAa -->

## Session 1 Post-Execution Guardrails

**When:** 2026-06-14 · **Fact:** `P-CFA7ZXAa`
**Why:** Confirms Stop hook and auto-memory extraction system are functioning; validates that durable facts are captured with reasoning sections

<!-- decision:P-4aRS5H6T -->

## Clean-Start Procedure for Session 1 Test

**When:** 2026-06-14 · **Fact:** `P-4aRS5H6T`
**Why:** Ensures B3/B4 cross-project persona capture can verify uv/ruff rule lands from zero; prevents pre-seeding contamination

<!-- decision:P-WaCZ7REY -->

## cmk install --with-semantic Scaffolds Semantic Recall

**When:** 2026-06-14 · **Fact:** `P-WaCZ7REY`
**Why:** Semantic search adds hybrid matching (keyword + semantic) to memory recall, improving relevance of facts retrieved across sessions.

<!-- decision:P-a2BSC7NG -->

## Description Field Length — Root Cause and Fix

**When:** 2026-06-14 · **Fact:** `P-a2BSC7NG`
**Why:** Long descriptions were silently breaking the YAML structure or exceeding token/parsing limits. This was discovered by code inspection (challenge 1: "Did you check the docs?").

<!-- decision:P-AaTGXLHE -->

## cmk install modes affect cold-open search behavior

**When:** 2026-06-14 · **Fact:** `P-AaTGXLHE`
**Why:** Testing fixes under different configurations than the original bug report creates false-negative risk (test appears to fail when fix is actually working)

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ENQSa3T9 -->

## SonarCloud Zero-Coverage From Missing Cache Step

**When:** 2026-06-15 · **Fact:** `P-ENQSa3T9`
**Why:** Failure cascade was non-obvious and blocked the v0.3.1 gate; worth capturing for future SonarCloud troubleshooting.

<!-- decision:P-DY6aUA7A -->

## Task-Lane Consistency Audit Workflow

**When:** 2026-06-15 · **Fact:** `P-DY6aUA7A`
**Why:** Tasks can acquire lane context without being formally assigned to a version, creating shadow state. A side-by-side comparison of both files catches these silently-laned-but-unassigned tasks.

<!-- decision:P-YLWTT5aG -->

## TencentDB-Agent-Memory Write/Search Implementation Comparison

**When:** 2026-06-15 · **Fact:** `P-YLWTT5aG`
**Why:** Comparative code-level review of adjacent implementation reveals convergence areas (no action) and architectural alternatives (design patterns for roadmap).

<!-- decision:P-GATKYaHT -->

## Task 50 Research-Revisit Gate and Multi-Agent Pattern

**When:** 2026-06-15 · **Fact:** `P-GATKYaHT`
**Why:** Leverage existing multi-agent research; avoid re-derivation. Taskmaster provides actionable blueprints before Task 50 starts.

<!-- decision:P-ZDR9EQRa -->

## v0.4.x Versioning Roadmap

**When:** 2026-06-15 · **Fact:** `P-ZDR9EQRa`
**Why:** Clarifies v0.4.0 ships infrastructure + first integration. Explains tail strategy: agents are patch-level, numbered only at ship time.

<!-- decision:P-DYa3YF7X -->

## Qdrant Vector Database — Re-rejected (ADR-0015 reaffirmed)

**When:** 2026-06-15 · **Fact:** `P-DYa3YF7X`
**Why:** Prevents future re-litigations; clarifies architectural vs technical reasons for rejection

<!-- decision:P-FaMS2LTW -->

## D-144 (housekeeping) is the post-Task-129 step in the remaining v0.3.x queue

**When:** 2026-06-15 · **Fact:** `P-FaMS2LTW`

<!-- decision:P-aRUCEJ6E -->

## FTS5 Query Sanitization (Task 153)

**When:** 2026-06-15 · **Fact:** `P-aRUCEJ6E`
**Why:** production bug affecting search UX when version strings or dotted terms appear in queries

<!-- decision:P-JXRTNTaG -->

## v0.3.2 Scope Locked; Strict Task-Order Discipline

**When:** 2026-06-15 · **Fact:** `P-JXRTNTaG`
**Why:** Dependencies and risk management. Spike results for 141b decide whether it ships in v0.3.2 or defers to v0.3.3.

<!-- decision:P-2Qa3JA5W -->

## FTS5 Query Sanitization — Per-Token Quoting Design

**When:** 2026-06-15 · **Fact:** `P-2Qa3JA5W`
**Why:** Per-token quoting preserves implicit-AND between words (better recall for multi-word queries like "layered architecture"), while whole-query quoting forces strict phrase matching. Grounded in SQLite FTS5 primary docs.

<!-- decision:P-LaJYSMLa -->

## Reject ponytail plugin; philosophical conflict with project design

**When:** 2026-06-15 · **Fact:** `P-LaJYSMLa`
**Why:** The kit's value derives from deliberate rigor; Ponytail optimizes in the opposite direction. Adopting it would undermine the project's architectural philosophy and create decision-making conflicts on every tool/code choice.

<!-- decision:P-3C9V6a76 -->

## DECISIONS.md is append-only permanent journal not regenerated

**When:** 2026-06-15 · **Fact:** `P-3C9V6a76`
**Why:** Arrived at by reasoning through what happens when a decision-fact is superseded/forgotten over time. A regenerated-from-live DECISIONS.md (my first instinct, mirroring INDEX.md) would erase superseded decisions — destroying the journal's entire value (the why-we-changed trail). The MEMORY.md parking model also must NOT apply: old decisions are the MOST valuable part of a decision log, so it's unbounded and never rolls. Append-permanent for the journal vs regenerate for the digest — the difference IS the MEMORY.md-vs-decision-log distinction. Squad appends because it has no DB; the kit appends-with-structure (links/supersession/no-junk) because it does.

<!-- decision:P-Aa22MJAC -->

## semantic backend: sqlite-vec primary, zvec fallback

**When:** 2026-06-10 · **Fact:** `P-Aa22MJAC`
**Why:** sqlite-vec puts vectors inside the SQLite index the kit already runs (one store, design 9.3.1 fit); zvec is embedded+Node+Windows but its bindings are only ~May-2026 old

<!-- decision:P-N9BGGaK6 -->

## Transient Failure Retry Strategy

**When:** 2026-06-10 · **Fact:** `P-N9BGGaK6`
**Why:** A single transient delay can cause false negatives; 5 seconds is low-cost. Distinguishing jitter from real degradation prevents flaky CI while preserving signal for real b

<!-- decision:P-QXDNaC5U -->

## v0.3.0 is BUILD-COMPLETE (2026-06-10): Tasks 46/125/124/75(all)/104(all) shipped

**When:** 2026-06-10 · **Fact:** `P-QXDNaC5U`

<!-- decision:P-MHCAaYVG -->

## Cut-Gate Testing Guide (Manual Release QA)

**When:** 2026-06-10 · **Fact:** `P-MHCAaYVG`
**Why:** Encodes hard-won lessons (D-84, v0.2.0, Task-75) into repeatable process; prevents regression and avoids known gotchas; respects user's time with clear estimates and scope boundaries.

<!-- decision:P-a5W95QXS -->

## This file (docs/process/cut-gate.md) is their manual live-test guide for release

**When:** 2026-06-10 · **Fact:** `P-a5W95QXS`

<!-- decision:P-TaHaDQV7 -->

## B5/B7 Probe Footgun — settings.json Wholesale Overwrite

**When:** 2026-06-10 · **Fact:** `P-TaHaDQV7`
**Why:** Running B5/B7 in a working directory (not throwaway) corrupts configuration.

<!-- decision:P-aA5S5S2U -->

## User confirmed companion project approach for Task 127 aligns with kit philosoph

**When:** 2026-06-10 · **Fact:** `P-aA5S5S2U`

<!-- decision:P-ULTaWK4B -->

## Release Gate Structure (v0.3.0)

**When:** 2026-06-11 · **Fact:** `P-ULTaWK4B`
**Why:** D3's promotion to required blocker is a recent change; the next release cycle must respect this gate structure.

<!-- decision:P-Pa5RBNQ4 -->

## Release Git Choreography: Memory, Release, Tag (in order)

**When:** 2026-06-11 · **Fact:** `P-Pa5RBNQ4`
**Why:** Keeps the tree clean; release commits reflect versioning, not session metadata. Memory churn is incidental to development, not part of the release artifact.

<!-- decision:P-aLPJJGFL -->

## Separate Memory Captures from Release Commits

**When:** 2026-06-11 · **Fact:** `P-aLPJJGFL`
**Why:** Release commits should show only what went into the release — when auditing `release: vX.Y.Z` later, the commit should be uncluttered and reviewable as a pure version bump. Accumulated memory captures muddy that history.

<!-- decision:P-MZDaYRWX -->

## Requesting complete re-verification: check previous test gate outputs (gate7), r

**When:** 2026-06-11 · **Fact:** `P-MZDaYRWX`

<!-- decision:P-aN9PaSGC -->

## Validation Gate Structure (cut-gate9 Release)

**When:** 2026-06-11 · **Fact:** `P-aN9PaSGC`
**Why:** Standardized gates catch regressions; each check owns a specific concern. Automation verifies what it can; in-session UX and skip-prompt behavior require hands-on testing.

<!-- decision:P-7XKFaB2N -->

## Secret Leakage Defense-in-Depth Model

**When:** 2026-06-11 · **Fact:** `P-7XKFaB2N`
**Why:** No single filter is complete. Layering reduces likelihood accidental secrets reach git.

<!-- decision:P-RL2aKHKQ -->

## Prefers concise, numbered instructions without narrative explanation or backgrou

**When:** 2026-06-11 · **Fact:** `P-RL2aKHKQ`

<!-- decision:P-Za6L72JM -->

## canonicalize() Super-Linear Regex Hotspot

**When:** 2026-06-11 · **Fact:** `P-Za6L72JM`
**Why:** Confirmed real pattern, but execution is too constrained for practical risk. Behavior-identical fix ensures downstream stability.

<!-- decision:P-XQ9RYXaJ -->

## Backlog for v0.3.x and v0.4

**When:** 2026-06-11 · **Fact:** `P-XQ9RYXaJ`
**Why:** These tasks emerged from the quality gate review and are ready to schedule.

<!-- decision:P-9NaMaLE6 -->

## v0.3.0 Released With Green Quality Gate

**When:** 2026-06-11 · **Fact:** `P-9NaMaLE6`
**Why:** Marks completion of the quality gate enforcement for this release; establishes clean baseline for next session.

<!-- decision:P-4aaKKRKV -->

## PII Handling — Non-Adoption of Quarantine

**When:** 2026-06-11 · **Fact:** `P-4aaKKRKV`
**Why:** Kit's memory lives in git repos — privacy (discard-on-sight) is higher priority than quarantine-for-review UX

<!-- decision:P-NXF3aCPB -->

## Semantic Search vs. Grep Trade-Off (D-111 Design Rationale)

**When:** 2026-06-12 · **Fact:** `P-NXF3aCPB`
**Why:** The kit's semantic-search choice diverges from PAI despite shared philosophy. The decision is data-driven (benchmarked) and intentional, not a paradigm violation. Documents why the choice was made for future reconsideration.

<!-- decision:P-TUJKaAQ6 -->

## Autopilot Memory Consultation Architecture

**When:** 2026-06-12 · **Fact:** `P-TUJKaAQ6`
**Why:** Autopilot work must leverage memory without explicit asking; design balances autonomous value against deliberate human control over forget/queue decisions.

<!-- decision:P-DC97QaDC -->

## Pre-session verification found one composition bug (memory-search allow-list omi

**When:** 2026-06-12 · **Fact:** `P-DC97QaDC`

<!-- decision:P-BJQaGQ6H -->

## Iterative, thorough research approach—adds items even near session end rather th

**When:** 2026-06-12 · **Fact:** `P-BJQaGQ6H`

<!-- decision:P-A6XDaDHA -->

## Kit Feature Gap — Chronological Decision Rendering

**When:** 2026-06-12 · **Fact:** `P-A6XDaDHA`
**Why:** That both the kit and Squad independently maintain chronological journals indicates this view type is valuable beyond individual-fact retrieval. The gap is a missed product feature—a natural extension of `cmk digest`.

<!-- decision:P-7RQTaMU4 -->

## Kit's Decision Log — Manual Maintenance Pattern

**When:** 2026-06-12 · **Fact:** `P-7RQTaMU4`
**Why:** Both the kit team and peer projects (Squad) independently maintain chronological decision journals, suggesting this narrative form provides value that individual-fact storage doesn't. The kit chose to keep D-log authoritative rather than migrate to the fact model.

<!-- decision:P-XTLTaX5C -->

## Decision-Journal View Gap — Now Task 147

**When:** 2026-06-12 · **Fact:** `P-XTLTaX5C`
**Why:** User pattern discovery — manual decision journaling across multiple teams signals a real user need the kit doesn't yet meet

<!-- decision:P-aUDDN4WP -->

## Task 147 design upgraded: the kit gets a STANDING committed context/DECISIONS.md

**When:** 2026-06-12 · **Fact:** `P-aUDDN4WP`
**Why:** A standing journal puts each decision line in the PR diff that captured it (reviewable), travels with git clone, and needs no tooling to read - the same reasons the build repo hand-maintains its own DECISION-LOG

<!-- decision:P-ZRQRa277 -->

## kit needs decisions.md feature

**When:** 2026-06-12 · **Fact:** `P-ZRQRa277`

<!-- decision:P-7FV4EYaW -->

## npm v12 Script Approval: Project vs. Global Configuration Paths

**When:** 2026-06-12 · **Fact:** `P-7FV4EYaW`
**Why:** Dual-path architecture means different remediation per install type. Verified against GitHub changelog (2026-06-09) and community discussion #198547.

<!-- decision:P-BDES4aW7 -->

## Install-time consent for better-sqlite3 binding (replaces error → doctor round-trip)

**When:** 2026-06-12 · **Fact:** `P-BDES4aW7`
**Why:** User objected to original UX (npm install error → doctor command → error again → discovery left to an obscure tool). This change prioritizes inline, immediate resolution at the moment of install. Their feedback shaped the design before it shipped.

<!-- decision:P-XBB4aELR -->

## Dependabot Cannot Approve allowScripts in Strict Repos

**When:** 2026-06-12 · **Fact:** `P-XBB4aELR`
**Why:** Affects approval fatigue and long-term security posture in strict-mode npm repos.

<!-- decision:P-aZH2NRSE -->

## Task Pipeline Stages

**When:** 2026-06-12 · **Fact:** `P-aZH2NRSE`
**Why:** Recurring structure observed across Tasks 74, 144, 145; understanding stages helps predict throughput and identify bottlenecks

<!-- decision:P-E6J7aYH5 -->

## skill-review Imported-Facts Staleness Bug Fixed

**When:** 2026-06-12 · **Fact:** `P-E6J7aYH5`
**Why:** Correctness of the memory system depends on imported facts remaining fresh. This bug threatened that invariant.

<!-- decision:P-2aD2YHMB -->

## Modular Skill Architecture: Read/Write Separation

**When:** 2026-06-13 · **Fact:** `P-2aD2YHMB`
**Why:** Separating read from write reduces blast radius and prevents accidental memory corruption. The boundary is a first-class design principle, not an implementation detail.

<!-- decision:P-2JMVXJ3a -->

## Task 146: Concurrent Swarm Support Testing

**When:** 2026-06-13 · **Fact:** `P-2JMVXJ3a`
**Why:** The kit's strength is as a shared memory layer for many independent agents. Concurrent safety is the missing validation needed before swarm support is proven.

<!-- decision:P-4aG26CRV -->

## npm 12 & the 141a/141b Migration Strategy

**When:** 2026-06-13 · **Fact:** `P-4aG26CRV`
**Why:** npm-12 is a hard blocker for better-sqlite3. 141b removes the problem entirely; no native deps = install anywhere, forever.

<!-- decision:P-ZXaUQRaS -->

## Conditional Tech Adoption Discipline

**When:** 2026-06-13 · **Fact:** `P-ZXaUQRaS`
**Why:** Prevents trading UX/performance for technical elegance or convenience on faith. Forces explicit data-driven decisions.

<!-- decision:P-9YGaCE66 -->

## Post-Merge Clean-Build Verification

**When:** 2026-06-14 · **Fact:** `P-9YGaCE66`
**Why:** Dev tree may have transient state; only a clean build from main branch proves the product is correct

<!-- decision:P-VREAaST9 -->

## vitest can show a module-resolution failure (Cannot find module /@id/...) on the

**When:** 2026-06-14 · **Fact:** `P-VREAaST9`
**Why:** It LOOKS like a test failure in CI/stress, and the lazy reflex is to wave it off as 'known transient' — but that exact reflex is what hid a real CodeQL high-sev alert on this same PR #179. Never assume transient.

<!-- decision:P-D7aTRN9U -->

## v0.3.1 Release: Final Workflow

**When:** 2026-06-14 · **Fact:** `P-D7aTRN9U`
**Why:** This is the fully mapped workflow for v0.3.1 release; provides a template for subsequent releases and ensures no steps are skipped.

<!-- decision:P-CFA7ZXAa -->

## Session 1 Post-Execution Guardrails

**When:** 2026-06-14 · **Fact:** `P-CFA7ZXAa`
**Why:** Confirms Stop hook and auto-memory extraction system are functioning; validates that durable facts are captured with reasoning sections

<!-- decision:P-4aRS5H6T -->

## Clean-Start Procedure for Session 1 Test

**When:** 2026-06-14 · **Fact:** `P-4aRS5H6T`
**Why:** Ensures B3/B4 cross-project persona capture can verify uv/ruff rule lands from zero; prevents pre-seeding contamination

<!-- decision:P-WaCZ7REY -->

## cmk install --with-semantic Scaffolds Semantic Recall

**When:** 2026-06-14 · **Fact:** `P-WaCZ7REY`
**Why:** Semantic search adds hybrid matching (keyword + semantic) to memory recall, improving relevance of facts retrieved across sessions.

<!-- decision:P-a2BSC7NG -->

## Description Field Length — Root Cause and Fix

**When:** 2026-06-14 · **Fact:** `P-a2BSC7NG`
**Why:** Long descriptions were silently breaking the YAML structure or exceeding token/parsing limits. This was discovered by code inspection (challenge 1: "Did you check the docs?").

<!-- decision:P-AaTGXLHE -->

## cmk install modes affect cold-open search behavior

**When:** 2026-06-14 · **Fact:** `P-AaTGXLHE`
**Why:** Testing fixes under different configurations than the original bug report creates false-negative risk (test appears to fail when fix is actually working)

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ENQSa3T9 -->

## SonarCloud Zero-Coverage From Missing Cache Step

**When:** 2026-06-15 · **Fact:** `P-ENQSa3T9`
**Why:** Failure cascade was non-obvious and blocked the v0.3.1 gate; worth capturing for future SonarCloud troubleshooting.

<!-- decision:P-DY6aUA7A -->

## Task-Lane Consistency Audit Workflow

**When:** 2026-06-15 · **Fact:** `P-DY6aUA7A`
**Why:** Tasks can acquire lane context without being formally assigned to a version, creating shadow state. A side-by-side comparison of both files catches these silently-laned-but-unassigned tasks.

<!-- decision:P-YLWTT5aG -->

## TencentDB-Agent-Memory Write/Search Implementation Comparison

**When:** 2026-06-15 · **Fact:** `P-YLWTT5aG`
**Why:** Comparative code-level review of adjacent implementation reveals convergence areas (no action) and architectural alternatives (design patterns for roadmap).

<!-- decision:P-GATKYaHT -->

## Task 50 Research-Revisit Gate and Multi-Agent Pattern

**When:** 2026-06-15 · **Fact:** `P-GATKYaHT`
**Why:** Leverage existing multi-agent research; avoid re-derivation. Taskmaster provides actionable blueprints before Task 50 starts.

<!-- decision:P-ZDR9EQRa -->

## v0.4.x Versioning Roadmap

**When:** 2026-06-15 · **Fact:** `P-ZDR9EQRa`
**Why:** Clarifies v0.4.0 ships infrastructure + first integration. Explains tail strategy: agents are patch-level, numbered only at ship time.

<!-- decision:P-DYa3YF7X -->

## Qdrant Vector Database — Re-rejected (ADR-0015 reaffirmed)

**When:** 2026-06-15 · **Fact:** `P-DYa3YF7X`
**Why:** Prevents future re-litigations; clarifies architectural vs technical reasons for rejection

<!-- decision:P-FaMS2LTW -->

## D-144 (housekeeping) is the post-Task-129 step in the remaining v0.3.x queue

**When:** 2026-06-15 · **Fact:** `P-FaMS2LTW`

<!-- decision:P-aRUCEJ6E -->

## FTS5 Query Sanitization (Task 153)

**When:** 2026-06-15 · **Fact:** `P-aRUCEJ6E`
**Why:** production bug affecting search UX when version strings or dotted terms appear in queries

<!-- decision:P-JXRTNTaG -->

## v0.3.2 Scope Locked; Strict Task-Order Discipline

**When:** 2026-06-15 · **Fact:** `P-JXRTNTaG`
**Why:** Dependencies and risk management. Spike results for 141b decide whether it ships in v0.3.2 or defers to v0.3.3.

<!-- decision:P-2Qa3JA5W -->

## FTS5 Query Sanitization — Per-Token Quoting Design

**When:** 2026-06-15 · **Fact:** `P-2Qa3JA5W`
**Why:** Per-token quoting preserves implicit-AND between words (better recall for multi-word queries like "layered architecture"), while whole-query quoting forces strict phrase matching. Grounded in SQLite FTS5 primary docs.

<!-- decision:P-LaJYSMLa -->

## Reject ponytail plugin; philosophical conflict with project design

**When:** 2026-06-15 · **Fact:** `P-LaJYSMLa`
**Why:** The kit's value derives from deliberate rigor; Ponytail optimizes in the opposite direction. Adopting it would undermine the project's architectural philosophy and create decision-making conflicts on every tool/code choice.

<!-- decision:P-3C9V6a76 -->

## DECISIONS.md is append-only permanent journal not regenerated

**When:** 2026-06-15 · **Fact:** `P-3C9V6a76`
**Why:** Arrived at by reasoning through what happens when a decision-fact is superseded/forgotten over time. A regenerated-from-live DECISIONS.md (my first instinct, mirroring INDEX.md) would erase superseded decisions — destroying the journal's entire value (the why-we-changed trail). The MEMORY.md parking model also must NOT apply: old decisions are the MOST valuable part of a decision log, so it's unbounded and never rolls. Append-permanent for the journal vs regenerate for the digest — the difference IS the MEMORY.md-vs-decision-log distinction. Squad appends because it has no DB; the kit appends-with-structure (links/supersession/no-junk) because it does.

<!-- decision:P-Aa22MJAC -->

## semantic backend: sqlite-vec primary, zvec fallback

**When:** 2026-06-10 · **Fact:** `P-Aa22MJAC`
**Why:** sqlite-vec puts vectors inside the SQLite index the kit already runs (one store, design 9.3.1 fit); zvec is embedded+Node+Windows but its bindings are only ~May-2026 old

<!-- decision:P-N9BGGaK6 -->

## Transient Failure Retry Strategy

**When:** 2026-06-10 · **Fact:** `P-N9BGGaK6`
**Why:** A single transient delay can cause false negatives; 5 seconds is low-cost. Distinguishing jitter from real degradation prevents flaky CI while preserving signal for real b

<!-- decision:P-QXDNaC5U -->

## v0.3.0 is BUILD-COMPLETE (2026-06-10): Tasks 46/125/124/75(all)/104(all) shipped

**When:** 2026-06-10 · **Fact:** `P-QXDNaC5U`

<!-- decision:P-MHCAaYVG -->

## Cut-Gate Testing Guide (Manual Release QA)

**When:** 2026-06-10 · **Fact:** `P-MHCAaYVG`
**Why:** Encodes hard-won lessons (D-84, v0.2.0, Task-75) into repeatable process; prevents regression and avoids known gotchas; respects user's time with clear estimates and scope boundaries.

<!-- decision:P-a5W95QXS -->

## This file (docs/process/cut-gate.md) is their manual live-test guide for release

**When:** 2026-06-10 · **Fact:** `P-a5W95QXS`

<!-- decision:P-TaHaDQV7 -->

## B5/B7 Probe Footgun — settings.json Wholesale Overwrite

**When:** 2026-06-10 · **Fact:** `P-TaHaDQV7`
**Why:** Running B5/B7 in a working directory (not throwaway) corrupts configuration.

<!-- decision:P-aA5S5S2U -->

## User confirmed companion project approach for Task 127 aligns with kit philosoph

**When:** 2026-06-10 · **Fact:** `P-aA5S5S2U`

<!-- decision:P-ULTaWK4B -->

## Release Gate Structure (v0.3.0)

**When:** 2026-06-11 · **Fact:** `P-ULTaWK4B`
**Why:** D3's promotion to required blocker is a recent change; the next release cycle must respect this gate structure.

<!-- decision:P-Pa5RBNQ4 -->

## Release Git Choreography: Memory, Release, Tag (in order)

**When:** 2026-06-11 · **Fact:** `P-Pa5RBNQ4`
**Why:** Keeps the tree clean; release commits reflect versioning, not session metadata. Memory churn is incidental to development, not part of the release artifact.

<!-- decision:P-aLPJJGFL -->

## Separate Memory Captures from Release Commits

**When:** 2026-06-11 · **Fact:** `P-aLPJJGFL`
**Why:** Release commits should show only what went into the release — when auditing `release: vX.Y.Z` later, the commit should be uncluttered and reviewable as a pure version bump. Accumulated memory captures muddy that history.

<!-- decision:P-MZDaYRWX -->

## Requesting complete re-verification: check previous test gate outputs (gate7), r

**When:** 2026-06-11 · **Fact:** `P-MZDaYRWX`

<!-- decision:P-aN9PaSGC -->

## Validation Gate Structure (cut-gate9 Release)

**When:** 2026-06-11 · **Fact:** `P-aN9PaSGC`
**Why:** Standardized gates catch regressions; each check owns a specific concern. Automation verifies what it can; in-session UX and skip-prompt behavior require hands-on testing.

<!-- decision:P-7XKFaB2N -->

## Secret Leakage Defense-in-Depth Model

**When:** 2026-06-11 · **Fact:** `P-7XKFaB2N`
**Why:** No single filter is complete. Layering reduces likelihood accidental secrets reach git.

<!-- decision:P-RL2aKHKQ -->

## Prefers concise, numbered instructions without narrative explanation or backgrou

**When:** 2026-06-11 · **Fact:** `P-RL2aKHKQ`

<!-- decision:P-Za6L72JM -->

## canonicalize() Super-Linear Regex Hotspot

**When:** 2026-06-11 · **Fact:** `P-Za6L72JM`
**Why:** Confirmed real pattern, but execution is too constrained for practical risk. Behavior-identical fix ensures downstream stability.

<!-- decision:P-XQ9RYXaJ -->

## Backlog for v0.3.x and v0.4

**When:** 2026-06-11 · **Fact:** `P-XQ9RYXaJ`
**Why:** These tasks emerged from the quality gate review and are ready to schedule.

<!-- decision:P-9NaMaLE6 -->

## v0.3.0 Released With Green Quality Gate

**When:** 2026-06-11 · **Fact:** `P-9NaMaLE6`
**Why:** Marks completion of the quality gate enforcement for this release; establishes clean baseline for next session.

<!-- decision:P-4aaKKRKV -->

## PII Handling — Non-Adoption of Quarantine

**When:** 2026-06-11 · **Fact:** `P-4aaKKRKV`
**Why:** Kit's memory lives in git repos — privacy (discard-on-sight) is higher priority than quarantine-for-review UX

<!-- decision:P-NXF3aCPB -->

## Semantic Search vs. Grep Trade-Off (D-111 Design Rationale)

**When:** 2026-06-12 · **Fact:** `P-NXF3aCPB`
**Why:** The kit's semantic-search choice diverges from PAI despite shared philosophy. The decision is data-driven (benchmarked) and intentional, not a paradigm violation. Documents why the choice was made for future reconsideration.

<!-- decision:P-TUJKaAQ6 -->

## Autopilot Memory Consultation Architecture

**When:** 2026-06-12 · **Fact:** `P-TUJKaAQ6`
**Why:** Autopilot work must leverage memory without explicit asking; design balances autonomous value against deliberate human control over forget/queue decisions.

<!-- decision:P-DC97QaDC -->

## Pre-session verification found one composition bug (memory-search allow-list omi

**When:** 2026-06-12 · **Fact:** `P-DC97QaDC`

<!-- decision:P-BJQaGQ6H -->

## Iterative, thorough research approach—adds items even near session end rather th

**When:** 2026-06-12 · **Fact:** `P-BJQaGQ6H`

<!-- decision:P-A6XDaDHA -->

## Kit Feature Gap — Chronological Decision Rendering

**When:** 2026-06-12 · **Fact:** `P-A6XDaDHA`
**Why:** That both the kit and Squad independently maintain chronological journals indicates this view type is valuable beyond individual-fact retrieval. The gap is a missed product feature—a natural extension of `cmk digest`.

<!-- decision:P-7RQTaMU4 -->

## Kit's Decision Log — Manual Maintenance Pattern

**When:** 2026-06-12 · **Fact:** `P-7RQTaMU4`
**Why:** Both the kit team and peer projects (Squad) independently maintain chronological decision journals, suggesting this narrative form provides value that individual-fact storage doesn't. The kit chose to keep D-log authoritative rather than migrate to the fact model.

<!-- decision:P-XTLTaX5C -->

## Decision-Journal View Gap — Now Task 147

**When:** 2026-06-12 · **Fact:** `P-XTLTaX5C`
**Why:** User pattern discovery — manual decision journaling across multiple teams signals a real user need the kit doesn't yet meet

<!-- decision:P-aUDDN4WP -->

## Task 147 design upgraded: the kit gets a STANDING committed context/DECISIONS.md

**When:** 2026-06-12 · **Fact:** `P-aUDDN4WP`
**Why:** A standing journal puts each decision line in the PR diff that captured it (reviewable), travels with git clone, and needs no tooling to read - the same reasons the build repo hand-maintains its own DECISION-LOG

<!-- decision:P-ZRQRa277 -->

## kit needs decisions.md feature

**When:** 2026-06-12 · **Fact:** `P-ZRQRa277`

<!-- decision:P-7FV4EYaW -->

## npm v12 Script Approval: Project vs. Global Configuration Paths

**When:** 2026-06-12 · **Fact:** `P-7FV4EYaW`
**Why:** Dual-path architecture means different remediation per install type. Verified against GitHub changelog (2026-06-09) and community discussion #198547.

<!-- decision:P-BDES4aW7 -->

## Install-time consent for better-sqlite3 binding (replaces error → doctor round-trip)

**When:** 2026-06-12 · **Fact:** `P-BDES4aW7`
**Why:** User objected to original UX (npm install error → doctor command → error again → discovery left to an obscure tool). This change prioritizes inline, immediate resolution at the moment of install. Their feedback shaped the design before it shipped.

<!-- decision:P-XBB4aELR -->

## Dependabot Cannot Approve allowScripts in Strict Repos

**When:** 2026-06-12 · **Fact:** `P-XBB4aELR`
**Why:** Affects approval fatigue and long-term security posture in strict-mode npm repos.

<!-- decision:P-aZH2NRSE -->

## Task Pipeline Stages

**When:** 2026-06-12 · **Fact:** `P-aZH2NRSE`
**Why:** Recurring structure observed across Tasks 74, 144, 145; understanding stages helps predict throughput and identify bottlenecks

<!-- decision:P-E6J7aYH5 -->

## skill-review Imported-Facts Staleness Bug Fixed

**When:** 2026-06-12 · **Fact:** `P-E6J7aYH5`
**Why:** Correctness of the memory system depends on imported facts remaining fresh. This bug threatened that invariant.

<!-- decision:P-2aD2YHMB -->

## Modular Skill Architecture: Read/Write Separation

**When:** 2026-06-13 · **Fact:** `P-2aD2YHMB`
**Why:** Separating read from write reduces blast radius and prevents accidental memory corruption. The boundary is a first-class design principle, not an implementation detail.

<!-- decision:P-2JMVXJ3a -->

## Task 146: Concurrent Swarm Support Testing

**When:** 2026-06-13 · **Fact:** `P-2JMVXJ3a`
**Why:** The kit's strength is as a shared memory layer for many independent agents. Concurrent safety is the missing validation needed before swarm support is proven.

<!-- decision:P-4aG26CRV -->

## npm 12 & the 141a/141b Migration Strategy

**When:** 2026-06-13 · **Fact:** `P-4aG26CRV`
**Why:** npm-12 is a hard blocker for better-sqlite3. 141b removes the problem entirely; no native deps = install anywhere, forever.

<!-- decision:P-ZXaUQRaS -->

## Conditional Tech Adoption Discipline

**When:** 2026-06-13 · **Fact:** `P-ZXaUQRaS`
**Why:** Prevents trading UX/performance for technical elegance or convenience on faith. Forces explicit data-driven decisions.

<!-- decision:P-9YGaCE66 -->

## Post-Merge Clean-Build Verification

**When:** 2026-06-14 · **Fact:** `P-9YGaCE66`
**Why:** Dev tree may have transient state; only a clean build from main branch proves the product is correct

<!-- decision:P-VREAaST9 -->

## vitest can show a module-resolution failure (Cannot find module /@id/...) on the

**When:** 2026-06-14 · **Fact:** `P-VREAaST9`
**Why:** It LOOKS like a test failure in CI/stress, and the lazy reflex is to wave it off as 'known transient' — but that exact reflex is what hid a real CodeQL high-sev alert on this same PR #179. Never assume transient.

<!-- decision:P-D7aTRN9U -->

## v0.3.1 Release: Final Workflow

**When:** 2026-06-14 · **Fact:** `P-D7aTRN9U`
**Why:** This is the fully mapped workflow for v0.3.1 release; provides a template for subsequent releases and ensures no steps are skipped.

<!-- decision:P-CFA7ZXAa -->

## Session 1 Post-Execution Guardrails

**When:** 2026-06-14 · **Fact:** `P-CFA7ZXAa`
**Why:** Confirms Stop hook and auto-memory extraction system are functioning; validates that durable facts are captured with reasoning sections

<!-- decision:P-4aRS5H6T -->

## Clean-Start Procedure for Session 1 Test

**When:** 2026-06-14 · **Fact:** `P-4aRS5H6T`
**Why:** Ensures B3/B4 cross-project persona capture can verify uv/ruff rule lands from zero; prevents pre-seeding contamination

<!-- decision:P-WaCZ7REY -->

## cmk install --with-semantic Scaffolds Semantic Recall

**When:** 2026-06-14 · **Fact:** `P-WaCZ7REY`
**Why:** Semantic search adds hybrid matching (keyword + semantic) to memory recall, improving relevance of facts retrieved across sessions.

<!-- decision:P-a2BSC7NG -->

## Description Field Length — Root Cause and Fix

**When:** 2026-06-14 · **Fact:** `P-a2BSC7NG`
**Why:** Long descriptions were silently breaking the YAML structure or exceeding token/parsing limits. This was discovered by code inspection (challenge 1: "Did you check the docs?").

<!-- decision:P-AaTGXLHE -->

## cmk install modes affect cold-open search behavior

**When:** 2026-06-14 · **Fact:** `P-AaTGXLHE`
**Why:** Testing fixes under different configurations than the original bug report creates false-negative risk (test appears to fail when fix is actually working)

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ENQSa3T9 -->

## SonarCloud Zero-Coverage From Missing Cache Step

**When:** 2026-06-15 · **Fact:** `P-ENQSa3T9`
**Why:** Failure cascade was non-obvious and blocked the v0.3.1 gate; worth capturing for future SonarCloud troubleshooting.

<!-- decision:P-DY6aUA7A -->

## Task-Lane Consistency Audit Workflow

**When:** 2026-06-15 · **Fact:** `P-DY6aUA7A`
**Why:** Tasks can acquire lane context without being formally assigned to a version, creating shadow state. A side-by-side comparison of both files catches these silently-laned-but-unassigned tasks.

<!-- decision:P-YLWTT5aG -->

## TencentDB-Agent-Memory Write/Search Implementation Comparison

**When:** 2026-06-15 · **Fact:** `P-YLWTT5aG`
**Why:** Comparative code-level review of adjacent implementation reveals convergence areas (no action) and architectural alternatives (design patterns for roadmap).

<!-- decision:P-GATKYaHT -->

## Task 50 Research-Revisit Gate and Multi-Agent Pattern

**When:** 2026-06-15 · **Fact:** `P-GATKYaHT`
**Why:** Leverage existing multi-agent research; avoid re-derivation. Taskmaster provides actionable blueprints before Task 50 starts.

<!-- decision:P-ZDR9EQRa -->

## v0.4.x Versioning Roadmap

**When:** 2026-06-15 · **Fact:** `P-ZDR9EQRa`
**Why:** Clarifies v0.4.0 ships infrastructure + first integration. Explains tail strategy: agents are patch-level, numbered only at ship time.

<!-- decision:P-DYa3YF7X -->

## Qdrant Vector Database — Re-rejected (ADR-0015 reaffirmed)

**When:** 2026-06-15 · **Fact:** `P-DYa3YF7X`
**Why:** Prevents future re-litigations; clarifies architectural vs technical reasons for rejection

<!-- decision:P-FaMS2LTW -->

## D-144 (housekeeping) is the post-Task-129 step in the remaining v0.3.x queue

**When:** 2026-06-15 · **Fact:** `P-FaMS2LTW`

<!-- decision:P-aRUCEJ6E -->

## FTS5 Query Sanitization (Task 153)

**When:** 2026-06-15 · **Fact:** `P-aRUCEJ6E`
**Why:** production bug affecting search UX when version strings or dotted terms appear in queries

<!-- decision:P-JXRTNTaG -->

## v0.3.2 Scope Locked; Strict Task-Order Discipline

**When:** 2026-06-15 · **Fact:** `P-JXRTNTaG`
**Why:** Dependencies and risk management. Spike results for 141b decide whether it ships in v0.3.2 or defers to v0.3.3.

<!-- decision:P-2Qa3JA5W -->

## FTS5 Query Sanitization — Per-Token Quoting Design

**When:** 2026-06-15 · **Fact:** `P-2Qa3JA5W`
**Why:** Per-token quoting preserves implicit-AND between words (better recall for multi-word queries like "layered architecture"), while whole-query quoting forces strict phrase matching. Grounded in SQLite FTS5 primary docs.

<!-- decision:P-LaJYSMLa -->

## Reject ponytail plugin; philosophical conflict with project design

**When:** 2026-06-15 · **Fact:** `P-LaJYSMLa`
**Why:** The kit's value derives from deliberate rigor; Ponytail optimizes in the opposite direction. Adopting it would undermine the project's architectural philosophy and create decision-making conflicts on every tool/code choice.

<!-- decision:P-3C9V6a76 -->

## DECISIONS.md is append-only permanent journal not regenerated

**When:** 2026-06-15 · **Fact:** `P-3C9V6a76`
**Why:** Arrived at by reasoning through what happens when a decision-fact is superseded/forgotten over time. A regenerated-from-live DECISIONS.md (my first instinct, mirroring INDEX.md) would erase superseded decisions — destroying the journal's entire value (the why-we-changed trail). The MEMORY.md parking model also must NOT apply: old decisions are the MOST valuable part of a decision log, so it's unbounded and never rolls. Append-permanent for the journal vs regenerate for the digest — the difference IS the MEMORY.md-vs-decision-log distinction. Squad appends because it has no DB; the kit appends-with-structure (links/supersession/no-junk) because it does.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-YL3LWC69 -->

## D-126 (.gitattributes CRLF prevention follow-up) is the final v0.3.x queue item

**When:** 2026-06-15 · **Fact:** `P-YL3LWC69`

<!-- decision:P-YUCE6EAH -->

## Merge workflow for this PR: squash merge + delete branch

**When:** 2026-06-15 · **Fact:** `P-YUCE6EAH`

<!-- decision:P-9SN5DHQT -->

## For v0.3.2, only proceed with node:sqlite migration (141b) if perf tests show p9

**When:** 2026-06-15 · **Fact:** `P-9SN5DHQT`

<!-- decision:P-TLTURYF7 -->

## Start v0.3.2 now and include Task 153 (FTS5 parse fix) in this release

**When:** 2026-06-15 · **Fact:** `P-TLTURYF7`

<!-- decision:P-ZVQEMWJA -->

## Confirmed proposed v0.3.2 scope is better (tasks 153, 152, 134, gitattributes, c

**When:** 2026-06-15 · **Fact:** `P-ZVQEMWJA`

<!-- decision:P-F94ZJMYV -->

## Always monitor CI without asking for permission or pausing to confirm; this is t

**When:** 2026-06-15 · **Fact:** `P-F94ZJMYV`

<!-- decision:P-TAPT7BH7 -->

## Expand condensed content to 2 lines when it feels cramped; prioritize breathing

**When:** 2026-06-15 · **Fact:** `P-TAPT7BH7`

<!-- decision:P-7Q5U4XTK -->

## Rename README section "What it does" to "Features" — clearer language for capabi

**When:** 2026-06-15 · **Fact:** `P-7Q5U4XTK`

<!-- decision:P-SC3W3ZDV -->

## Autopilot merge rules for install-surface changes

**When:** 2026-06-15 · **Fact:** `P-SC3W3ZDV`
**Why:** Future sessions need to know which changes require user approval and which proceed automatically, to avoid unintended ship-surface deployments.

<!-- decision:P-T42VTJBJ -->

## Task 141b spike results node:sqlite migration

**When:** 2026-06-15 · **Fact:** `P-T42VTJBJ`
**Why:** The three 141b gates were the precondition for the node:sqlite migration. Two pass cleanly; the perf gate is inconclusive on this hardware (noise >> the 3% bar). Cherry-picking a passing run would be the lazy-framing failure — the honest result is 'can't measure 3% here.' The decision now needs either a clean machine or a user call on other grounds.

<!-- decision:P-3U4WSVEM -->

## Autopilot Stop-Condition for Install-Surface Decisions

**When:** 2026-06-15 · **Fact:** `P-3U4WSVEM`
**Why:** Install-surface changes have high blast radius and warrant explicit user judgment.

<!-- decision:P-DSRXEXRL -->

## Task 141b Spike Results — Perf Inconclusive on Dev Machine

**When:** 2026-06-15 · **Fact:** `P-DSRXEXRL`
**Why:** Stable measurement impossible on variable dev machine. Cannot proceed without clean data (guessing or cherry-picking would be the trap).

<!-- decision:P-AE2R9TUU -->

## v0.3.2 Release Status

**When:** 2026-06-15 · **Fact:** `P-AE2R9TUU`
**Why:** v0.3.2 is release-ready without 141b. Task 141a already covers npm-12 pain. 141b ships later with stable perf data.

<!-- decision:P-PMJYQEC5 -->

## sqlite-vec Incompatibility Between better-sqlite3 and node:sqlite

**When:** 2026-06-15 · **Fact:** `P-PMJYQEC5`
**Why:** Explains why the 141b benchmark produced ±50% variance and why detecting the target 3% perf difference was impossible. Documents a hard constraint on how these libraries can be compared.

<!-- decision:P-66XJQTaM -->

## Benchmark Noise Floor on Dev Laptop

**When:** 2026-06-15 · **Fact:** `P-66XJQTaM`
**Why:** Migration 141b depends on verifying D-147. The user will not push an unverified gate; data quality is the blocker.

<!-- decision:P-5UJHaH4F -->

## Benchmark Harness Noise Floor Rule (3% RSD threshold)

**When:** 2026-06-15 · **Fact:** `P-5UJHaH4F`
**Why:** Implemented to ensure harness honesty after the user's earlier question "do you get the same results?" This prevents false verdicts on noisy hardware and makes measurement limits transparent.

<!-- decision:P-5NZCD94Q -->

## v0.3.2 Release Scope and 141b Gate

**When:** 2026-06-16 · **Fact:** `P-5NZCD94Q`
**Why:** v0.3.2 scope is locked; 141b is the sole pending decision before release can be cut

<!-- decision:P-CUV74RDV -->

## Task 141b node:sqlite migration rejected on perf

**When:** 2026-06-16 · **Fact:** `P-CUV74RDV`
**Why:** The whole migration was gated on D-147's three spikes; the perf gate is decisive. CI gave clean measurement (noise « the 3% bar) showing node:sqlite is ~10% slower on FTS5 keyword search — the hot path users pay every query. The kit's core purpose is fast local recall; a permanent 10% search regression to avoid a one-time npm-12 install prompt is the wrong trade (the user's settled principle). This closes 141b honestly on real data, not laptop noise.

<!-- decision:P-WB2VQPWN -->

## 141b Is Rejected — Decision Rationale

**When:** 2026-06-16 · **Fact:** `P-WB2VQPWN`
**Why:** Decision grounded in clean, repeatable CI data. User's persistent questioning of noisy laptop results led to escalating to CI, which provided the definitive answer.

<!-- decision:P-LF5GNVaZ -->

## CI Triggering Capability

**When:** 2026-06-16 · **Fact:** `P-LF5GNVaZ`
**Why:** Assistant was over-cautious about automation scope. This capability exists and is faster than asking user to click.

<!-- decision:P-6AW7LDQH -->

## v0.3.2 Release Scope Locked

**When:** 2026-06-16 · **Fact:** `P-6AW7LDQH`
**Why:** All planned tasks completed; 141b rejected on clean data. Release is unblocked pending manual tag push.

<!-- decision:P-B4CANFVU -->

## Cut-Gate Verification Probes

**When:** 2026-06-16 · **Fact:** `P-B4CANFVU`
**Why:** These probes verify the built artifact before publishing. Knowing their names helps locate them in the release guide.

<!-- decision:P-7T2BCHL6 -->

## Release Workflow: Commit, Cut-Gate, Tag-Push

**When:** 2026-06-16 · **Fact:** `P-7T2BCHL6`
**Why:** This is the repeatable release process. Capturing the workflow and ownership boundaries avoids re-deriving at the next release.

<!-- decision:P-AUF4MDTR -->

## Doctor Health Check Baseline (Fresh Install)

**When:** 2026-06-16 · **Fact:** `P-AUF4MDTR`
**Why:** Distinguishes expected vs. actual health issues early in setup validation.

<!-- decision:P-FGJMCQNP -->

## v0.3.2 New Validation Gates

**When:** 2026-06-16 · **Fact:** `P-FGJMCQNP`
**Why:** These are new features shipped in 0.3.2; knowing their guide locations ensures they are tested during release validation.

<!-- decision:P-6VTN4QSS -->

## Windows npm Uninstall – better_sqlite3.node Lock

**When:** 2026-06-16 · **Fact:** `P-6VTN4QSS`
**Why:** Helps distinguish a non-blocker (EPERM on .node) from actual failures during uninstall/install cycles.

<!-- decision:P-2CFEBV9Y -->

## Cut-Gate Pre-Release Validation Checklist (G0-G7)

**When:** 2026-06-16 · **Fact:** `P-2CFEBV9Y`
**Why:** These gates catch breaking changes, misconfiguration, and integration regressions before user-facing Session 1. They form the kit's cut validation checklist.

<!-- decision:P-5PC4DaJF -->

## Windows npm Uninstall EPERM With better_sqlite3

**When:** 2026-06-16 · **Fact:** `P-5PC4DaJF`
**Why:** EPERM during teardown/rebuild is a frequent false alarm on Windows. Knowing it is harmless and expected prevents misdiagnosis and unnecessary re-runs.

<!-- decision:P-6JFTXAPN -->

## G4 Gate Upgraded to Mandatory Full-Sweep

**When:** 2026-06-16 · **Fact:** `P-6JFTXAPN`
**Why:** Prevent accidentally committed secrets/paths in public release. The upgrade ensures this cannot be missed.

<!-- decision:P-DRaNKRTM -->

## Three-Tier Memory Architecture

**When:** 2026-06-16 · **Fact:** `P-DRaNKRTM`
**Why:** Understanding the tier structure is essential for correct memory placement and avoiding committed-tier leaks.

<!-- decision:P-ZFEHNQY7 -->

## First-Time MCP Server Approval in Claude Code

**When:** 2026-06-16 · **Fact:** `P-ZFEHNQY7`
**Why:** Claude Code enforces this security policy on all MCP servers defined in committed config

<!-- decision:P-UBV99YJ7 -->

## MCP Server and Settings File Organization

**When:** 2026-06-16 · **Fact:** `P-UBV99YJ7`
**Why:** Project-scoped tools must travel with `git clone` so all teammates get the same MCP servers, while user-specific customizations remain local

<!-- decision:P-aD27LQ3H -->

## journaledIds Regex Incompleteness — Unbounded DECISIONS.md Growth (DJ2)

**When:** 2026-06-16 · **Fact:** `P-aD27LQ3H`
**Why:** Regression-test gap—fixtures didn't exercise the real alphabet. Ship-blocker for v0.3.2 (digest/journaling is a headline feature). Fix lands on main before tag.

<!-- decision:P-DPLXZCXJ -->

## Capture-completeness vs capture-perception gap (persona-queue delay)

**When:** 2026-06-16 · **Fact:** `P-DPLXZCXJ`
**Why:** User's instinct about incompleteness is valid as a UX signal, but correctly identified as a promotion/visibility issue rather than a missing-facts issue.

<!-- decision:P-9HCCG4RQ -->

## Release Validation Gate Structure

**When:** 2026-06-16 · **Fact:** `P-9HCCG4RQ`
**Why:** Separates repeatable, fast validation from expensive manual review. Unblocks parallel work and provides clear visibility into validation progress.

<!-- decision:P-9PXGBNLT -->

## F-7 Spec vs Code Mismatch: Tombstone Reading in cmk get

**When:** 2026-06-16 · **Fact:** `P-9PXGBNLT`
**Why:** Future cut-gate specification updates or F-7 work could accidentally claim unimplemented behavior. The spec must reflect the intentional live-only design.

<!-- decision:P-VUC9TB6X -->

## MCP Server Staleness Workaround

**When:** 2026-06-16 · **Fact:** `P-VUC9TB6X`
**Why:** MCP servers can drift out of sync mid-session, causing queries to fail against pre-fix code even though the fix is deployed. Quick restart avoids confusion when debugging apparent regressions.

<!-- decision:P-YFUW6ABE -->

## Read Path Inconsistency — `get` Lacks Deleted_at Filter

**When:** 2026-06-16 · **Fact:** `P-YFUW6ABE`
**Why:** Flagged during fact-probing work as a gap: the CLI and MCP surfaces have different coverage, surfacing this inconsistency. If recovery features are added, this pattern should be fixed.

<!-- decision:P-MEVGaRK7 -->

## Tombstone Data Lifecycle — Forget vs. Purge

**When:** 2026-06-16 · **Fact:** `P-MEVGaRK7`
**Why:** Product decision pending on recovery surfaces. Current architecture is the constraint: data exists (kept by design), so recovery would be a read operation, not a reconstruct. This context informs scope and feasibility.

<!-- decision:P-49BQNG9V -->

## Automatic recall never reads tombstones; recovery is human-only opt-in

**When:** 2026-06-16 · **Fact:** `P-49BQNG9V`
**Why:** Memory flagged this as an unsettled gap (the journal-vs-digest visibility split was decided in D-161, but whether the snapshot injector / mk_search hard-exclude tombstoned facts was never decided). Settling it: tombstones invisible to auto-recall because confidently-wrong recall (resurfacing a deleted fact) is catastrophic for a memory product; the negative-knowledge case has a better home (retract-in-place). Distinguishes forget (delete) from supersede (evolve) cleanly.

<!-- decision:P-XZSUPBWU -->

## Auto-recall agents are blind to tombstoned facts

**When:** 2026-06-16 · **Fact:** `P-XZSUPBWU`
**Why:** An agent confidently recalling a fact the user explicitly deleted is the worst failure mode a memory product can have. Keeping tombstones invisible to agents enforces the invariant that "forget" is truly permanent from the agent's perspective.

<!-- decision:P-ZVZ5a6RK -->

## Retracts and forgets are semantically distinct

**When:** 2026-06-16 · **Fact:** `P-ZVZ5a6RK`
**Why:** These two deletion modes serve different needs. Retracts preserve the story of how decisions evolved (important for continuity). Forgets remove visibility entirely (important for cleaning up unwanted facts). Conflating them leads to either losing decision history or accidentally auto-recovering deleted facts.

<!-- decision:P-JYH2P5QC -->

## DECISIONS.md is write-only for AI recall — not in any recall directive or test

**When:** 2026-06-16 · **Fact:** `P-JYH2P5QC`
**Why:** Task 147 built DECISIONS.md as a human-readable decision journal, but the AI's recall directives were never updated to consult it, and it's not indexed for search — so the journal's unique value (decision evolution, retracted/rejected decisions) is unreachable by automatic recall. This is the same class as the tombstone gap: a surface exists but recall doesn't reach it. Surfaced by the user asking 'when I mention Kamal, where do you look, and when would you go to DECISIONS.md?' — answer: never, today.

<!-- decision:P-GHN4aLTN -->

## Task 156 DECISIONS.md recall is v0.3.3 the next version firm

**When:** 2026-06-16 · **Fact:** `P-GHN4aLTN`
**Why:** I initially slotted the DECISIONS.md-recall gap vaguely as "v0.3.3/v0.4"; the user pushed back wanting it to be the NEXT version, not punted. Firming to v0.3.3 because leaving a just-shipped headline feature (the decision journal) un-recallable by the AI across two minor versions is the wrong call — it completes v0.3.2's feature.

<!-- decision:P-FCK9J9CM -->

## RESUME v0.3.2 cut-gate in progress

**When:** 2026-06-16 · **Fact:** `P-FCK9J9CM`
**Why:** A long multi-thread cut-gate session with high context-loss risk; if it compacts or VS Code restarts, the next session needs to know exactly where the cut stands — what passed, what's left, that main is uncut, and the next outward step — without re-deriving it from scratch. This is the kit's own amnesia-prevention applied to its own release.

<!-- decision:P-9N4JG45F -->

## The journal/decision-recall feature's PRIMARY value is automatic AI recall when

**When:** 2026-06-16 · **Fact:** `P-9N4JG45F`

<!-- decision:P-H33RCKS4 -->

## Rebuild+Reinstall Before Session 2 (Release Cut Workflow)

**When:** 2026-06-16 · **Fact:** `P-H33RCKS4`
**Why:** Session 2 tests recall via `mk_search` (MCP server). Stale server = stale code = re-hitting fixed bugs. The release-cut chain is: fix → save → verify-on-current-code.

<!-- decision:P-A396Z6JP -->

## Windows DLL Lock Blocks NPM Reinstall (better_sqlite3.node)

**When:** 2026-06-16 · **Fact:** `P-A396Z6JP`
**Why:** The Node.js native module loads the DLL into the process; the file stays locked until the process exits.

<!-- decision:P-X2VUTU3Z -->

## Close VS Code to close Claude Code on cut-gate14

**When:** 2026-06-16 · **Fact:** `P-X2VUTU3Z`
**Why:** Environment-specific constraint relevant to session lifecycle and testing procedures.

<!-- decision:P-MV3GBMZ2 -->

## FQ1 (FTS5 fix) in installed 0.3.2, ready for Session 2 recall tests

**When:** 2026-06-16 · **Fact:** `P-MV3GBMZ2`
**Why:** Session 2 tests recall via `mk_search` (MCP server), which requires FQ1. Clarifies that rebuild is unnecessary for S2.

<!-- decision:P-FKVJZZQL -->

## MCP server may retain stale code in memory after package updates

**When:** 2026-06-16 · **Fact:** `P-FKVJZZQL`
**Why:** Session 2 recall tests use `mk_search` (MCP server). Stale server can error even if fixes are on disk.

<!-- decision:P-F7XQXFKL -->

## VS Code Windows Are Independent Claude Code Sessions

**When:** 2026-06-16 · **Fact:** `P-F7XQXFKL`
**Why:** Critical for parallel work and troubleshooting; prevents confusion about session/server state; allows independent problem-solving in different windows without risk to other conversations

<!-- decision:P-N9FJU9Ta -->

## Project Configuration & Tech Stack

**When:** 2026-06-16 · **Fact:** `P-N9FJU9Ta`
**Why:** Standing configuration that every session should apply consistently to maintain code quality and structure.

<!-- decision:P-JY9ZGT5C -->

## Three-Session Release Validation Methodology

**When:** 2026-06-16 · **Fact:** `P-JY9ZGT5C`
**Why:** Validates that memory recall, memory-search skill, and persona transfer are working correctly before release.

<!-- decision:P-YFBTYUPQ -->

## Session 2 recall passed; broken install root-caused + recovered

**When:** 2026-06-16 · **Fact:** `P-YFBTYUPQ`
**Why:** Session 2 is a cut-gate milestone (recall is the kit's wow). Recording that recall passed strongly even through a broken install, that the two scary-looking findings (cmk crash + DECISIONS.md dup) were both the stale-install root cause not new bugs, and how the reinstall recovered — so the cut can proceed and a future session doesn't re-investigate.

<!-- decision:P-VTLX4QYR -->

## v0.3.2 cut-gate complete E1 wedge passed ready to tag

**When:** 2026-06-16 · **Fact:** `P-VTLX4QYR`
**Why:** The cold-open (E1) is the kit's single most important gate — the wedge that justifies the whole product. It passed live with the best-case result (persona transferred to a zero-history project, even the subtle repo-exception nuance). Recording that all gates passed + the bugs the cut-gate caught means the cut decision is fully traceable and a future session knows v0.3.2 was properly gated.

<!-- decision:P-RHaM3HDa -->

## Release & Publish Workflow (Git Tag to npm)

**When:** 2026-06-16 · **Fact:** `P-RHaM3HDa`
**Why:** Repeatable, verifiable release process ensures consistency, transparency, and auditability

<!-- decision:P-AX32FX5V -->

## v0.3.2 Release Inventory & v0.3.3 Feature Queue

**When:** 2026-06-16 · **Fact:** `P-AX32FX5V`
**Why:** Clear record of what shipped vs. what's in flight; documents feature readiness gates

<!-- decision:P-9TVaG53C -->

## onnxruntime-node CI Download Flakiness

**When:** 2026-06-16 · **Fact:** `P-9TVaG53C`
**Why:** Distinguishes transient network flakes from real code/release problems; prevents false alarm investigation

<!-- decision:P-B93GXMBD -->

## v0.3.2 published to npm with provenance

**When:** 2026-06-16 · **Fact:** `P-B93GXMBD`
**Why:** Closes the v0.3.2 release loop — records what shipped, that the cut-gate caught 3 bugs, and the transient onnxruntime-node ETIMEDOUT publish failure + its retry fix (so a future cut doesn't panic when publish.yml fails on that dependency's network install).

<!-- decision:P-Q2GaW43C -->

## Cut-Gate Process Validated Release Quality

**When:** 2026-06-16 · **Fact:** `P-Q2GaW43C`
**Why:** Cut-gate is the quality checkpoint that prevents bugs from reaching users. This session proved it catches real problems—it earned its keep.

<!-- decision:P-6GK6PZ2Z -->

## node:sqlite Migration Decision

**When:** 2026-06-16 · **Fact:** `P-6GK6PZ2Z`
**Why:** Search is a critical operation; existing implementation met all requirements. The regression eliminated any benefit from the migration.

<!-- decision:P-SURaZQS4 -->

## Tombstone Auto-Recall Design Decision

**When:** 2026-06-16 · **Fact:** `P-SURaZQS4`
**Why:** Respects user intent and data integrity—deleted records should not auto-surface in the AI system.

<!-- decision:P-UCG4RKNL -->

## Two post-v0.3.2 bugs index corruption and stale snapshot for v0.3.3

**When:** 2026-06-16 · **Fact:** `P-UCG4RKNL`
**Why:** Context is about to auto-compact (2% left); these two bugs ARE the cross-session-amnesia failure the kit exists to prevent, found on the kit itself right after shipping v0.3.2. Must be durable so the next session (which may itself hit the stale snapshot) can pick up the diagnosis and fix, not re-investigate.

<!-- decision:P-T6Q2QWHE -->

## Version Snapshot in recent.md Guards Against Cross-Session Amnesia

**When:** 2026-06-16 · **Fact:** `P-T6Q2QWHE`
**Why:** New sessions load memory to understand project state. A stale version snapshot would make them think an older version is current (e.g., v0.3.1 when v0.3.2 shipped). The snapshot is a guard rail for session continuity.

<!-- decision:P-64UMEVFG -->

## User questions whether kept branches are necessary; signals active concern about

**When:** 2026-06-16 · **Fact:** `P-64UMEVFG`

<!-- decision:P-N5AC9UXY -->

## Cut-Gate Review Process

**When:** 2026-06-17 · **Fact:** `P-N5AC9UXY`
**Why:** The project distinguishes live-tested (real data) from synthetic-tested (fixtures) from untested (behavioral). Unverified items are explicitly flagged rather than claimed complete.

<!-- decision:P-RR5a6aER -->

## Testing Verification Levels

**When:** 2026-06-17 · **Fact:** `P-RR5a6aER`
**Why:** Prevents false claims of completeness. Unverified paths are flagged for cut-gate review.

<!-- decision:P-AZa9JRMS -->

## Contract-Lock Testing Pattern

**When:** 2026-06-17 · **Fact:** `P-AZa9JRMS`
**Why:** Status-code tests verify the happy/error paths but miss contract violations; contract-lock tests catch edge cases and breaches directly.

<!-- decision:P-aFKRUUYV -->

## D-163 Invariant — Agent Must Never See Forgotten Facts

**When:** 2026-06-17 · **Fact:** `P-aFKRUUYV`
**Why:** Agent leaking recovered forgotten facts would be a critical privacy breach; the invariant must be enforced by-default, not remembered.

<!-- decision:P-2QSPCZCX -->

## Five Focus Questions Code Review Framework

**When:** 2026-06-17 · **Fact:** `P-2QSPCZCX`
**Why:** These five areas are the highest-risk surface for new features — privacy leaks, path traversal, invariant violations, shape mutations, default-enabled footguns.

<!-- decision:P-4EZT6FPU -->

## Graceful Degrade on Malformed Archive Data

**When:** 2026-06-17 · **Fact:** `P-4EZT6FPU`
**Why:** Recovery happens *because* something went wrong; crashing would prevent recovery. A graceful-degrade contract should be locked by test.

<!-- decision:P-UBU2NFWX -->

## Path Traversal Protection — Anchored ID Pattern + Validate-Before-Join

**When:** 2026-06-17 · **Fact:** `P-UBU2NFWX`
**Why:** Whitelist-pattern validation before path construction is the correct defense; the ordering prevents regressions.

<!-- decision:P-GF2UaLAH -->

## Scope Documentation Discipline — Record *Why*, Not Just *What*

**When:** 2026-06-17 · **Fact:** `P-GF2UaLAH`
**Why:** Future reader (or user months later) understands the decision and won't re-open the question or accidentally build the deferred feature in ad-hoc ways.

<!-- decision:P-DYCCQG9H -->

## Release Trigger: Tag Push Publishes

**When:** 2026-06-17 · **Fact:** `P-DYCCQG9H`
**Why:** Separates user control over release timing from deterministic automation, preventing accidental early releases while keeping the publish step hands-free.

<!-- decision:P-CATHYC5L -->

## Release Workflow for claude-memory-kit

**When:** 2026-06-17 · **Fact:** `P-CATHYC5L`
**Why:** This is the established pattern for shipping claude-memory-kit releases. v0.3.3 is the current example. The tag push is the critical "outward step" where work transitions from local to external/public.

<!-- decision:P-6NLDRFYV -->

## DECISIONS.md Cut-Gate Structure (DJ1–DJ4)

**When:** 2026-06-17 · **Fact:** `P-6NLDRFYV`
**Why:** Ensures DECISIONS.md recall is reliable across the full lifecycle (create, digest, forget, recall-as-retracted). The mechanism/behavior split acknowledges what can vs cannot be auto-tested.

<!-- decision:P-XK4aDSCY -->

## DJ4 Verification Prompts (DECISIONS.md Recall Gate)

**When:** 2026-06-17 · **Fact:** `P-XK4aDSCY`
**Why:** DJ4 is a behavioral gate that cannot be auto-tested. These prompts operationalize the manual verification step, making it repeatable and executable.

<!-- decision:P-QBWYD2Q9 -->

## Behavioral Gate Standard Pattern (v0.3.3)

**When:** 2026-06-17 · **Fact:** `P-QBWYD2Q9`
**Why:** Vague gates ("ask a history question") are not executable by humans running manual pre-release verification. Every gate must be runnable by someone without deep project context.

<!-- decision:P-KQ9WE2AU -->

## v0.3.3 Release Staging State

**When:** 2026-06-17 · **Fact:** `P-KQ9WE2AU`
**Why:** Accurate pre-tagging state; unblocks final release step.

<!-- decision:P-BPSaKX7V -->

## Release Workflow with Destructive Manual Steps

**When:** 2026-06-17 · **Fact:** `P-BPSaKX7V`
**Why:** Workflow has irreversible steps; next session needs to know the release is staged but requires explicit user choice on scope before proceeding

<!-- decision:P-EYGaT423 -->

## PowerShell UTF-8 Display Artifact in cmk Cut-Gate Validation

**When:** 2026-06-17 · **Fact:** `P-EYGaT423`
**Why:** Prevents future cmk setup runs from falsely failing gate checks due to display artifacts masking correct file state on Windows

<!-- decision:P-TTKBJN2D -->

## Cut-Gate Testing Structure (Terminal vs Live-Session Gates)

**When:** 2026-06-17 · **Fact:** `P-TTKBJN2D`
**Why:** Determines what can run in CI/headless vs what needs user interaction; gate placement guides future test additions

<!-- decision:P-GZUSMZVQ -->

## PowerShell UTF-8 Encoding Fix for Cut-Gate G4 Reads

**When:** 2026-06-17 · **Fact:** `P-GZUSMZVQ`
**Why:** Get-Content on Windows console displays UTF-8 middots/emdashes as mojibake characters, causing false-positive "corruption" flags during verification

<!-- decision:P-LCZ6Q27C -->

## Version 0.3.3 Release Features and Test Coverage

**When:** 2026-06-17 · **Fact:** `P-LCZ6Q27C`
**Why:** Next session needs exact test coverage before final release; live gates are blocking for 0.3.3 tag

<!-- decision:P-AW7WKGVT -->

## Multi-Site Home-Path Slug-Leak Bug Class (v0.3.3 Cut-Blocker)

**When:** 2026-06-17 · **Fact:** `P-AW7WKGVT`
**Why:** Usernames/home paths in committed fact filenames compromise privacy—auto-extract is highest risk because it runs automatically on every conversation turn with zero user action. This is confirmed as v0.3.3 cut-blocker, not just the single-site remember-core issue.

<!-- decision:P-647JJL4R -->

## Session 2 Validation Gates (cut-gate15)

**When:** 2026-06-17 · **Fact:** `P-647JJL4R`
**Why:** Validates v0.3.3 headline features (memory-search skill auto-trigger, DECISIONS.md scope, recall directives) behaviorally; remaining gates require live Claude session to drive conversational flows.

<!-- decision:P-7KRR6B6E -->

## Memory Kit Validation Gates (D1–W4 + DJ4 Live Gate)

**When:** 2026-06-17 · **Fact:** `P-7KRR6B6E`
**Why:** Each gate tests a distinct recall layer (rule search, decision recall, paraphrase matching, decision history); passing all gates confirms end-to-end function. DJ4 specifically validates that decision-history (DECISIONS.md) recall fires in *live* sessions, not just at design time — a headline v0.3.3 feature.

<!-- decision:P-KHB93CGB -->

## DJ4 Live-Gate Test Passed (v0.3.3 Headline Feature)

**When:** 2026-06-17 · **Fact:** `P-KHB93CGB`
**Why:** DJ4 is the headline verification for v0.3.3. Confirms feature design is sound; infrastructure gotcha does not block the tag.

<!-- decision:P-UTBXMFWR -->

## June 17 11:12 Build: decisions Scope Implemented

**When:** 2026-06-17 · **Fact:** `P-UTBXMFWR`
**Why:** Distinguishes current-build capabilities from stale-process behavior when testing scope-based features.

<!-- decision:P-SZX5LG7P -->

## MCP Server Staleness Gotcha (D-80)

**When:** 2026-06-17 · **Fact:** `P-SZX5LG7P`
**Why:** Affects feature testing and verification during development, especially when iterating on schema or scope changes. First encountered during DJ4 (v0.3.3 headline feature) testing on Jun 17.

<!-- decision:P-XCN5JURQ -->

## DJ4-Live Test Prerequisites

**When:** 2026-06-18 · **Fact:** `P-XCN5JURQ`
**Why:** Without DECISIONS.md, `mk_search {scope:"decisions"}` has nothing to return; restarting picks up the current build and avoids stale-process masking; testing against a retracted decision exercises the journal's unique value over fact-based recall

<!-- decision:P-MaWYNV6F -->

## Stale MCP Process Workaround After Build Updates

**When:** 2026-06-18 · **Fact:** `P-MaWYNV6F`
**Why:** The processes are long-lived and bound to the binary they loaded with; new sessions spawn fresh processes, but old sessions continue serving the outdated version

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-3FEV3J72 -->

## Probes for honest assessment of testing coverage — what was actually live-tested

**When:** 2026-06-17 · **Fact:** `P-3FEV3J72`

<!-- decision:P-AZZD4XCF -->

## Before tagging v0.3.3, user wants comprehensive confirmation that all vague gate

**When:** 2026-06-17 · **Fact:** `P-AZZD4XCF`

<!-- decision:P-aCAV54FE -->

## Don't assume execution scope without explicit permission; user corrected "i didn

**When:** 2026-06-17 · **Fact:** `P-aCAV54FE`

<!-- decision:P-YZZWTMEP -->

## Renamed `$env:USERPROFILE\.claude-memory-kit` as backup before running destructi

**When:** 2026-06-17 · **Fact:** `P-YZZWTMEP`

<!-- decision:P-5UMXLADZ -->

## Specified clear scope boundary — execute all steps up to "## 2. Session 1," stop

**When:** 2026-06-17 · **Fact:** `P-5UMXLADZ`

<!-- decision:P-9X52U9EP -->

## Prefers centralized helpers over code duplication (affirmed for multi-site bug f

**When:** 2026-06-17 · **Fact:** `P-9X52U9EP`

<!-- decision:P-4KZ72VGV -->

## Task Done-Goal Explicitness Rule

**When:** 2026-06-18 · **Fact:** `P-4KZ72VGV`
**Why:** D-169 was missed because automatic behavior was tested, but every test ran `cmk digest` manually first — masking that the automatic hook wasn't implemented. Explicit checkboxes make gaps impossible to ignore. This rule bookends the existing "live-test every task" rule.

<!-- decision:P-6ZS6ZAL6 -->

## Test Anti-pattern — Setup Commands Masking Automation

**When:** 2026-06-18 · **Fact:** `P-6ZS6ZAL6`
**Why:** D-169: DECISIONS.md auto-population was fully tested but every test started with manual `cmk digest`. The feature worked in tests, failed in real use.

<!-- decision:P-4SVME7QG -->

## cut-guide.md should be minimal, easy to read; use for live manual testing; move

**When:** 2026-06-18 · **Fact:** `P-4SVME7QG`

<!-- decision:P-4XHUNa9W -->

## Scaffolded Skills Drift After Binary Updates Without cmk install

**When:** 2026-06-18 · **Fact:** `P-4XHUNa9W`
**Why:** Stale skills silently under-perform (don't trigger), causing the agent to bypass them and hand-solve instead. This is also a real cmk doctor gap worth addressing for all users.

<!-- decision:P-ZZNLF7US -->

## lost track of what Task 159 was doing; signals confusion promptly rather than co

**When:** 2026-06-18 · **Fact:** `P-ZZNLF7US`

<!-- decision:P-79TK4TaF -->

## Memory Kit Index File (INDEX.md) Architecture

**When:** 2026-06-18 · **Fact:** `P-79TK4TaF`
**Why:** This is the kit's internal architecture. Understanding it is key to designing efficient session-start logic (e.g., Task 159's decision journal refresh).

<!-- decision:P-6RaEC34F -->

## prioritizes finishing v0.3.3 and moving on; willing to defer semantic search to

**When:** 2026-06-18 · **Fact:** `P-6RaEC34F`

<!-- decision:P-VVUK5RU7 -->

## Task 159: Auto-Updating Decision Journal

**When:** 2026-06-18 · **Fact:** `P-VVUK5RU7`
**Why:** v0.3.3 release blocker. Manual decision logs don't scale; automation keeps the journal honest.

<!-- decision:P-PZ4LH3CW -->

## CMK Decision Trail Requires Divergence Recording

**When:** 2026-06-18 · **Fact:** `P-PZ4LH3CW`
**Why:** Traceability and informed review. Future maintainers must know both the original decision and the reasons for change; prevents the same design question from being reconsidered.

<!-- decision:P-C5SL7RaW -->

## Journal Staleness Check Uses INDEX.md Mtime Proxy

**When:** 2026-06-18 · **Fact:** `P-C5SL7RaW`
**Why:** Session-start budget is tight; INDEX.md is a required artifact maintained by kit infrastructure anyway.

<!-- decision:P-LTCCJKT9 -->

## Journal Staleness Detection Uses Separate Boolean, Not Verdict

**When:** 2026-06-18 · **Fact:** `P-LTCCJKT9`
**Why:** Single-verdict slot constraint makes shared detection impossible for independent concerns. This is a compositional invariant of the kit's architecture.

<!-- decision:P-XZLFTK2A -->

## Decision-Trail Recording Convention for Divergences

**When:** 2026-06-18 · **Fact:** `P-XZLFTK2A`
**Why:** Maintains traceability and accountability; enables future context recovery and decision history.

<!-- decision:P-754HQESG -->

## Decision-trail work (A) is non-negotiable priority—"no matter what is a must."

**When:** 2026-06-18 · **Fact:** `P-754HQESG`

<!-- decision:P-QF6B7HQW -->

## New Skills System & Auto-Invocation Gap

**When:** 2026-06-18 · **Fact:** `P-QF6B7HQW`
**Why:** Skills exist to prevent silent divergences and improve discipline, but the auto-invocation layer isn't working as designed.

<!-- decision:P-4aSAFL3J -->

## User accepts technical divergences from research/design IF they were reasoned ag

**When:** 2026-06-18 · **Fact:** `P-4aSAFL3J`

<!-- decision:P-JTWUL9ZX -->

## Don't invent new documentation structures; follow the established documentation

**When:** 2026-06-18 · **Fact:** `P-JTWUL9ZX`

<!-- decision:P-FWFK4ARZ -->

## Documentation-map Spine drifts while DECISION-LOG stays current

**When:** 2026-06-18 · **Fact:** `P-FWFK4ARZ`
**Why:** Drift occurs because releases are cut and documented elsewhere without proactively refreshing the Spine. This repeats the same error class as Task 159 triplication and cut-gate-as-journal — state in multiple places, not maintained in the designated home.

<!-- decision:P-2TSXUZHR -->

## `.claude/skills/` Gitignore Creates Broken CLAUDE.md References on Clone

**When:** 2026-06-18 · **Fact:** `P-2TSXUZHR`
**Why:** The dev-skills are durable tools referenced in a standing instruction document. When the tools are gitignored but the doc is committed, fresh clones get broken pointers silently. This is structural drift, not content drift.

<!-- decision:P-QRHBWWLH -->

## Skill Adoption Verification Standard

**When:** 2026-06-18 · **Fact:** `P-QRHBWWLH`
**Why:** Grounds tool-keeping decisions in evidence rather than theory; prevents accumulation of unused tools

<!-- decision:P-TaFGHHD9 -->

## Skills Don't Trigger From CLAUDE.md or Hooks

**When:** 2026-06-18 · **Fact:** `P-TaFGHHD9`
**Why:** It's non-obvious. Most would expect CLAUDE.md or hooks to be the invocation mechanism. Understanding the real mechanism prevents wasted attempts and false assumptions.

<!-- decision:P-V33QABGS -->

## Use the official installer (npx skills@latest add) rather than manual commands f

**When:** 2026-06-18 · **Fact:** `P-V33QABGS`

<!-- decision:P-FJZFLaP9 -->

## adopt-third-party-skills-via-installer-personal-tier

**When:** 2026-06-18 · **Fact:** `P-FJZFLaP9`
**Why:** This session botched it twice: first hand-copied 6 of a 33-skill interdependent system into the gitignored project `.claude/skills/` (missing the installer, CONTEXT.md, sibling skills, the user-invoked grill-me entry points), then I judged them worthless WITHOUT reading them. Primary-source research (Claude Code skills+hooks docs + mattpocock's writing-great-skills + README) showed the correct model: installer → personal tier → auto-discovery → author's descriptions do the triggering. The user: "dont do it manually you are suppose to use the installer" and "read the readme for fuck sake."

<!-- decision:P-MB6XBZRR -->

## Task 159 Multi-Stage Verification Gate

**When:** 2026-06-18 · **Fact:** `P-MB6XBZRR`
**Why:** Task 159 is performance-critical with subtle interactions (lazy bin + journal sync). Multi-stage gate catches issues unit tests alone miss; the I1 fix was only visible in live-test, and skill-review caught a separate issue self-review missed.

<!-- decision:P-6L5CWR9G -->

## CI Pipeline Configuration

**When:** 2026-06-18 · **Fact:** `P-6L5CWR9G`
**Why:** These define what "CI is green" means in this repo; understanding the full matrix is essential for release QA, troubleshooting, and future expansion

<!-- decision:P-3GPCJWXQ -->

## Cut-Gate Sandbox Isolation

**When:** 2026-06-18 · **Fact:** `P-3GPCJWXQ`
**Why:** Install flows write memory files. Testing against real setup risks data loss or corruption.

<!-- decision:P-YHQU4aTH -->

## Cut-Gate Test Workflow

**When:** 2026-06-18 · **Fact:** `P-YHQU4aTH`
**Why:** Established pattern used consistently across 15+ test runs; proven reliable

<!-- decision:P-4JXMa5HF -->

## cmk install --with-semantic Command

**When:** 2026-06-18 · **Fact:** `P-4JXMa5HF`
**Why:** Core setup command for semantic search with documented graceful degradation on DLL lock failure.

<!-- decision:P-MQMPUBBN -->

## Cut-Gate 16 — Setup & Terminal Tests Complete

**When:** 2026-06-18 · **Fact:** `P-MQMPUBBN`
**Why:** Clear checkpoint. Terminal half is done; prevents re-deriving setup in next session. Signals readiness for in-chat testing phase.

<!-- decision:P-WX5WPTTJ -->

## cmk-compress-session requires SessionEnd hook invocation; manual terminal runs hang

**When:** 2026-06-18 · **Fact:** `P-WX5WPTTJ`
**Why:** Manual invocation during cut-gate testing created hung node processes. Understanding the hook-based design and correct testing patterns prevents this in future work.

<!-- decision:P-32TD3JaT -->

## CMK Tool Invocation: cmk-compress-session vs cmk-compress-lazy

**When:** 2026-06-18 · **Fact:** `P-32TD3JaT`
**Why:** Manual testing of cmk-compress-session led to confusion and hung processes; understanding the tool's intended context prevents wasted debugging.

<!-- decision:P-GD3QTG9V -->

## Version 0.3.3 Release — cut-gate16 Test Session State

**When:** 2026-06-18 · **Fact:** `P-GD3QTG9V`
**Why:** Clear record of final validation state before release.

<!-- decision:P-AZKXQRHC -->

## cut-gate16 Test Workflow Phases

**When:** 2026-06-18 · **Fact:** `P-AZKXQRHC`
**Why:** The phases are a structured verification checklist for the memory kit's core functionality. Running them in-chat (not terminal) lets Claude Code exercise its memory integration directly.

<!-- decision:P-JQ76A4W6 -->

## Doc Version Strings Should Be Parameterized

**When:** 2026-06-18 · **Fact:** `P-JQ76A4W6`
**Why:** Docs go stale; the tarball example in the guide had 0.3.2 but the actual install is 0.3.3. Parameterized docs are maintenance-free.

<!-- decision:P-ZXF759KP -->

## §5 Test Scorecard — Gates W1 through D6

**When:** 2026-06-18 · **Fact:** `P-ZXF759KP`
**Why:** Tracks which parts of the kit test plan have passed, which are blocked by harness issues, and which remain.

<!-- decision:P-XVEYV7a4 -->

## D6 Fail-Safe Behavior on Compress Timeout

**When:** 2026-06-18 · **Fact:** `P-XVEYV7a4`
**Why:** D6 gate failure is acceptable because the kit does not corrupt or lose state; it degrades gracefully.

<!-- decision:P-YZHN6DP6 -->

## Nested-claude Spawn Timeout in Test Harness

**When:** 2026-06-18 · **Fact:** `P-YZHN6DP6`
**Why:** D6 gate failed with `haiku_timeout`, but the failure pattern (timing out when called from inside Claude Code) repeats across multiple test attempts. Points to harness artifact, not kit bug.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-WSD3WEUY -->

## Skills installation complete — user ran `npx skills@latest add mattpocock/skills

**When:** 2026-06-18 · **Fact:** `P-WSD3WEUY`

<!-- decision:P-PRCXC9EQ -->

## expects GitHub CI automation to run on PR/merge

**When:** 2026-06-18 · **Fact:** `P-PRCXC9EQ`

<!-- decision:P-N5NPMLYY -->

## Test prompts should use natural language with subtle behavioral triggers, not ex

**When:** 2026-06-18 · **Fact:** `P-N5NPMLYY`

<!-- decision:P-9Z63AQE7 -->

## `claude --print` Haiku Latency & Compression Timeout Margin

**When:** 2026-06-18 · **Fact:** `P-9Z63AQE7`
**Why:** The 50s timeout was calibrated against expected latency (21–50s). Actual latency has degraded significantly, causing compressions to time out and now.md to grow unbounded if failures recur across sessions.

<!-- decision:P-D6YGVW9L -->

## Compression Retry Mechanism

**When:** 2026-06-18 · **Fact:** `P-D6YGVW9L`
**Why:** If compression times out, the feature fails safely but silently — input is not lost. However, if failures are consistent (e.g., due to persistent CLI latency), now.md accumulates unbounded across sessions until a compression finally beats the timeout clock.

<!-- decision:P-RX6DWHZD -->

## System-touching features are skipped in automated verification runs

**When:** 2026-06-18 · **Fact:** `P-RX6DWHZD`
**Why:** Protects the user's real system and data from unintended side effects during automated testing.

<!-- decision:P-VZF4U3TP -->

## Tag-ready criterion: core features pass; known issues cleanly deferred

**When:** 2026-06-18 · **Fact:** `P-VZF4U3TP`
**Why:** Allows shipping working features while deferring known architectural issues to future releases without false urgency or version coupling.

<!-- decision:P-KRGYHRUX -->

## Decisions Scope Semantic Fallback Warning (Task 156 Bug)

**When:** 2026-06-18 · **Fact:** `P-KRGYHRUX`
**Why:** Headline feature (Task 156, decisions recall) works but looks broken. Cosmetic defect in flagship feature kills user confidence on first impression.

<!-- decision:P-a2QWV6V4 -->

## Decisions Scope Uses Direct File Read, Not Vector DB

**When:** 2026-06-18 · **Fact:** `P-a2QWV6V4`
**Why:** Task 156 established this design to reuse the file-read precedent and maintain the journal as a live markdown view. Semantic search requires indexed data; the journal is neither indexed nor stored as table rows.

<!-- decision:P-5M3QY5B6 -->

## v0.3.3 Bug — Semantic Backend Attempted for Keyword-Only Decisions Scope

**When:** 2026-06-18 · **Fact:** `P-5M3QY5B6`
**Why:** The default search mode is hybrid (attempts semantic first), and the code does not short-circuit for decisions scope before attempting semantic. `search.mjs:163` has explicit validation that decisions is keyword-only, but `subcommands.mjs` ignores this and tries semantic anyway, generating a false-failure warning for expected behavior.

<!-- decision:P-RRENWMU7 -->

## Fix for `--scope decisions` Warning Bug in Memory Search

**When:** 2026-06-18 · **Fact:** `P-RRENWMU7`
**Why:** This is a real CLI bug affecting the v0.3.3 cut-gate; the fix and test metrics are durable reference for similar scope-handling issues.

<!-- decision:P-497V47QC -->

## Claude Memory Kit Update Workflow
_(retracted 2026-07-15)_

**When:** 2026-06-18 · **Fact:** `P-497V47QC`
**Why:** Users need a clear process to adopt new versions; the kit has no `cmk update` wrapper command yet (v0.3.3)

<!-- decision:P-FBXSRRa9 -->

## Kit Update & Drift Detection Gaps (v0.3.4 Task)

**When:** 2026-06-18 · **Fact:** `P-FBXSRRa9`
**Why:** Basic product expectation ("how do I update?") has no answer; v0.3.3 ready to ship but these are gaps for v0.3.4

<!-- decision:P-MXZUV2UY -->

## Windows EBUSY on npm Global Update

**When:** 2026-06-18 · **Fact:** `P-MXZUV2UY`
**Why:** Real user blocker — cryptic error with no guidance if they try to update the global binary while IDE is open

<!-- decision:P-5PJXVSSG -->

## Plugin Install and Bootstrap Are Separate One-Time Steps

**When:** 2026-06-18 · **Fact:** `P-5PJXVSSG`
**Why:** Clarifies why two commands are required and prevents confusion about whether bootstrap is redundant or a plugin issue.

<!-- decision:P-7GQ4N9NJ -->

## Updating CMK Requires Re-running Bootstrap on Project Files

**When:** 2026-06-18 · **Fact:** `P-7GQ4N9NJ`
**Why:** The two-step update process (global machinery + per-project scaffold) is not obvious; users will expect a single update command to handle everything and will hit stale memory files.

<!-- decision:P-JZ3JaU7L -->

## Windows EBUSY When Updating CMK During Claude Code Runtime

**When:** 2026-06-18 · **Fact:** `P-JZ3JaU7L`
**Why:** Real blocker for Windows users. The EBUSY error is cryptic with no guidance on the cause or fix.

<!-- decision:P-5ZRXEHUW -->

## Release Gate-Test Pattern (claude-memory-kit)

**When:** 2026-06-18 · **Fact:** `P-5ZRXEHUW`
**Why:** Prevents shipping half-baked features; ensures solid user experience and builds user trust in kit quality.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-P9XLPJ2X -->

## Assistant has a pattern of running without sufficient thought/planning ("running

**When:** 2026-06-18 · **Fact:** `P-P9XLPJ2X`

<!-- decision:P-RDZ6SE7C -->

## User explicitly prefers concise responses; doesn't want walls of text

**When:** 2026-06-18 · **Fact:** `P-RDZ6SE7C`

<!-- decision:P-4D76WXZP -->

## Approved cleanup and ready to proceed to next phase (VS Code on cut-gate16)

**When:** 2026-06-18 · **Fact:** `P-4D76WXZP`

<!-- decision:P-MaPBRMaZ -->

## Installation command for this project updated to: cmk install --with-semantic

**When:** 2026-06-18 · **Fact:** `P-MaPBRMaZ`

<!-- decision:P-E4HX6VVU -->

## Corrects mechanism-only testing (bash) by steering toward behavioral testing via

**When:** 2026-06-18 · **Fact:** `P-E4HX6VVU`

<!-- decision:P-4LCSC9ZY -->

## Release verification must include testing the actual installed/packaged artifact

**When:** 2026-06-18 · **Fact:** `P-4LCSC9ZY`

<!-- decision:P-2GRPQKFa -->

## Research Documentation Convention

**When:** 2026-06-18 · **Fact:** `P-2GRPQKFa`
**Why:** Shows what was originally asked vs. what was actually researched; prevents re-checking systems; documents decision rationale and scope changes transparently

<!-- decision:P-FDATL4KY -->

## Task 161 Decision D-173 — Bound Compaction Input

**When:** 2026-06-18 · **Fact:** `P-FDATL4KY`
**Why:** 17-of-19 system convergence validates bounded-input as proven, safe path. Closes gap from design inception.

<!-- decision:P-5KXaLFDC -->

## Context Buffer Stabilization: 19 Systems Classified by Approach

**When:** 2026-06-18 · **Fact:** `P-5KXaLFDC`
**Why:** The proposed A+B+C+D exceeds what 17/19 systems do. The two most-similar systems validate A+B+C but not D. This opens a simplification fork: is full A+B+C justified, or does B+C (with defensive A) suffice?

<!-- decision:P-MYDY3DXF -->

## A+C-Core Design Pivot (Memsearch-Anchored, B Dropped)

**When:** 2026-06-18 · **Fact:** `P-MYDY3DXF`
**Why:** 19-system union was overengineered; anchoring on the two most-similar systems (memsearch + Letta) reveals the core is just input-cap + recent-window, not four mechanisms.

<!-- decision:P-BBEZ4YaD -->

## Overflow-Handling Caveat—Single Buffer vs. Memsearch's Many Files

**When:** 2026-06-18 · **Fact:** `P-BBEZ4YaD`
**Why:** A+C alone work for memsearch's shape (many files) but `now.md` is single growing buffer; trimmed overflow needs explicit handling, not just window-keep.

<!-- decision:P-M9J9M9LZ -->

## Proposed Turn-Based Memory Roll Design

**When:** 2026-06-18 · **Fact:** `P-M9J9M9LZ`
**Why:** Kit uses single-file model, unlike memsearch/Letta/MemoryOS; using existing rolling window more frequently (per turn, not per session) fits actual architecture better than borrowing cap-the-buffer pattern.

<!-- decision:P-6WEYN2TM -->

## Compression Spiral Bug at Three Identical Call Sites

**When:** 2026-06-18 · **Fact:** `P-6WEYN2TM`
**Why:** The bug is systemic at three sites, not localized to one verb. Per-verb or per-buffer fixes are incomplete; the root issue is unbound input to backend.compress.

<!-- decision:P-6M26BR9S -->

## Durable Tiers Enable Safe Buffer Trimming

**When:** 2026-06-18 · **Fact:** `P-6M26BR9S`
**Why:** When bounding input to compression, the "where does overflow go?" concern dissolves. Old content can be safely trimmed from derived buffers because it's already in the durable record.

<!-- decision:P-PAKDAWVL -->

## NOW_MD_ASSISTANT_CAP Precedent

**When:** 2026-06-18 · **Fact:** `P-PAKDAWVL`
**Why:** Shows the kit isn't starting from zero on input bounding — the precedent already exists. The solution should extend this pattern rather than invent a new mechanism.

<!-- decision:P-F9SUD9EG -->

## Prefers option 2 (bound inside CompressorBackend.compress implementation, not a

**When:** 2026-06-18 · **Fact:** `P-F9SUD9EG`

<!-- decision:P-GSRN46VV -->

## Requires overflow handling be comprehensive — don't shift problem from now.md to

**When:** 2026-06-18 · **Fact:** `P-GSRN46VV`

<!-- decision:P-DTS22L9D -->

## Wants research re-visited before final commit — pick direction, validate sources

**When:** 2026-06-18 · **Fact:** `P-DTS22L9D`

<!-- decision:P-SFaECJRK -->

## Compression Timeout Root Cause: Environmental Contention, Not Input Size

**When:** 2026-06-19 · **Fact:** `P-SFaECJRK`
**Why:** The original design premise (A+C to cap input size and prevent "compounding spiral") is falsified. Failures hit 8KB and 329-byte inputs equally. The buffer grows only because failures leave it un-drained; failures are transient/environmental, not size-induced.

<!-- decision:P-PVAPFJMR -->

## Compress Logger Observability Gap

**When:** 2026-06-19 · **Fact:** `P-PVAPFJMR`
**Why:** Without stderr/exit-code in the log, the kit can't diagnose actual failure reasons. This prevents knowing whether failures are transient (worth retrying) or deterministic (unfixable by retry).

<!-- decision:P-TASRaWE2 -->

## Structured Error Logging for Compress Failures

**When:** 2026-06-19 · **Fact:** `P-TASRaWE2`
**Why:** Observability gap prevented distinguishing transient failures (retry helps) from deterministic ones (retry re-fails). Structured logging enables data-driven retry design instead of assumptions.

<!-- decision:P-7KJS5Q7K -->

## Compression Retry Strategy for claude-memory-kit

**When:** 2026-06-19 · **Fact:** `P-7KJS5Q7K`
**Why:** Transient failures (timeouts, 5xx) are non-deterministic and retry-recoverable; deterministic failures need design fixes, not retries. The ecosystem confirms this pattern.

<!-- decision:P-6SESSZ33 -->

## SessionEnd Hook No-Retry Constraint

**When:** 2026-06-19 · **Fact:** `P-6SESSZ33`
**Why:** Protect concurrent persona call latency SLA while maintaining compression safety and reliability.

<!-- decision:P-YCA3aZYT -->

## Decision Trail and Knowledge Preservation System

**When:** 2026-06-19 · **Fact:** `P-YCA3aZYT`
**Why:** The team frequently revisits decisions (e.g., size-cap design may return if future measurements show different constraints). Recording full context prevents re-deriving analysis and makes fallback decisions safe. Builds institutional memory and supports learning.

<!-- decision:P-AV5aYUZJ -->

## Live Cut-Gate Requirement — Unit-Green ≠ Works-on-Real-Input

**When:** 2026-06-19 · **Fact:** `P-AV5aYUZJ`
**Why:** Unit mocks diverge from production behavior; transient Haiku failures are real and can only be validated by exercising the real service.

<!-- decision:P-GL7A4BXS -->

## Retry Configuration Strategy by Path

**When:** 2026-06-19 · **Fact:** `P-GL7A4BXS`
**Why:** The ceiling-free paths have time budget for retry; SessionEnd-hook is constrained and must fail fast to stay under 60s ceiling, shifting retry burden to the lazy path.

<!-- decision:P-63V2GTPD -->

## Stress Gate Requirement for Spawn-Boundary Changes

**When:** 2026-06-19 · **Fact:** `P-63V2GTPD`
**Why:** Spawn-boundary code is concurrency-sensitive and unit tests alone do not surface race conditions or transient spawn failures under load.

<!-- decision:P-F6KQVPPR -->

## Task 161.11 Retry Implementation Live Verification (Passed)

**When:** 2026-06-19 · **Fact:** `P-F6KQVPPR`
**Why:** Retry logic near spawn boundaries is high-risk; transient vs. permanent failures must be classified correctly. Windows and POSIX have different exit-code semantics. Conservative default prevents loops; logging gaps must be tracked.

<!-- decision:P-YBJRDa6H -->

## "autopilot" — user empowers assistant to decide scope for update-path documentat

**When:** 2026-06-19 · **Fact:** `P-YBJRDa6H`

<!-- decision:P-SaAAX7XL -->

## Claude-Memory-Kit Update Paths (npm vs Plugin)

**When:** 2026-06-19 · **Fact:** `P-SaAAX7XL`
**Why:** This decision point (which path to document/support) requires honest accounting of both user experiences. Both paths share the same fundamental workflow; both have identical "forgotten per-project step" failure mode.

<!-- decision:P-ZKH65YMH -->

## Known Quirks and Solutions

**When:** 2026-06-19 · **Fact:** `P-ZKH65YMH`
**Why:** These surface in real usage and block smooth UX in both paths (or are path-specific friction).

<!-- decision:P-UG3CSVUB -->

## Version Stamping and Scaffold Isolation

**When:** 2026-06-19 · **Fact:** `P-UG3CSVUB`
**Why:** This explains the silent failure: users update globally but forget per-project re-stamping, leaving mismatched versions. The separation is fundamental to the architecture.

<!-- decision:P-NDWKVJ27 -->

## User questioned whether the update task is necessary and doesn't remember the or

**When:** 2026-06-19 · **Fact:** `P-NDWKVJ27`

<!-- decision:P-DYPWAPD5 -->

## Cut-Gate Testing Practice

**When:** 2026-06-19 · **Fact:** `P-DYPWAPD5`
**Why:** Real sessions expose integration issues, edge cases, and interactions that sandbox tests cannot. Task 161's compression-retry behavior only surfaced in actual use, not in isolated test suites.

<!-- decision:P-W75PJXBP -->

## Release Process for claude-memory-kit

**When:** 2026-06-19 · **Fact:** `P-W75PJXBP`
**Why:** Ensures consistent, repeatable release process with automated publishing via GitHub Actions.

<!-- decision:P-2MSZRDP7 -->

## User chose docs+drift-check now (not defer) — clear priority decision

**When:** 2026-06-19 · **Fact:** `P-2MSZRDP7`

<!-- decision:P-LaG5aW75 -->

## Layered Backend Pattern

**When:** 2026-06-19 · **Fact:** `P-LaG5aW75`
**Why:** Separates concerns so services are testable/reusable without FastAPI; prevents architectural decay.

<!-- decision:P-KYTE5Q9V -->

## .venv Setup Requirement

**When:** 2026-06-19 · **Fact:** `P-KYTE5Q9V`
**Why:** Isolates dependencies; prevents version conflicts across projects.

<!-- decision:P-NNNBBSJZ -->

## Two Promotion Paths Route Facts Differently

**When:** 2026-06-19 · **Fact:** `P-NNNBBSJZ`
**Why:** The two capture mechanisms have different routing strategies — not a v0.3.4 code change (verified zero persona-related changes in v0.3.4), but which *mechanism fired* on that run. Auto-persona spreads; explicit-promote concentrates. This finding sharpens Task 151 for v0.4.

<!-- decision:P-J4LZZ2YG -->

## Backup Location and Naming Convention

**When:** 2026-06-19 · **Fact:** `P-J4LZZ2YG`
**Why:** Keeps versioned persona snapshots organized and easily findable during cut-gate testing and version comparisons; establishes a durable artifact location outside transient temp directories

<!-- decision:P-V9KUSZJM -->

## Fact Currency and Auto-Supersession Not Yet Implemented

**When:** 2026-06-19 · **Fact:** `P-V9KUSZJM`
**Why:** Projects evolve and generate multiple generations of design docs; the kit needs a way to surface current facts authoritatively. Task 66/95 planned for v0.4.

<!-- decision:P-WZMCCFLE -->

## Down-payment + full-redesign split pattern (D-154 precedent, v0.3.1)

**When:** 2026-06-19 · **Fact:** `P-WZMCCFLE`
**Why:** Captures urgency and ships the wedge-critical part without diluting committed minors or re-opening settled decisions.

<!-- decision:P-FG56FKV2 -->

## One-differentiator-per-minor rule (D-146)

**When:** 2026-06-19 · **Fact:** `P-FG56FKV2`
**Why:** Keeps release scope clear and focused. Violations delay both features and diffuse impact.

<!-- decision:P-JYBXNXE7 -->

## Task 151 classification and strategic weight

**When:** 2026-06-19 · **Fact:** `P-JYBXNXE7`
**Why:** Soft spots in foundational features affect downstream systems. New evidence (D-177 data) raises Task 151's importance relative to curation work.

<!-- decision:P-XXYKQaRS -->

## v0.3.5 patch vs v0.4.0 versioning logic

**When:** 2026-06-19 · **Fact:** `P-XXYKQaRS`
**Why:** Preserves single-differentiator rule, ships important fixes sooner, doesn't delay committed work.

<!-- decision:P-MSZXZ6VS -->

## Project Origin and Core Problem

**When:** 2026-06-19 · **Fact:** `P-MSZXZ6VS`
**Why:** This origin story is the foundation of all design decisions and prioritization. The kit exists to solve the user's real problem (forgetting context across sessions), not for its own sake. The video's thesis (recall reliability is the most important layer) validates why injection-layer quality is core product value.

<!-- decision:P-SPBREG3F -->

## HC-9 Drift After Claude Code Update (v0.3.4)

**When:** 2026-06-20 · **Fact:** `P-SPBREG3F`
**Why:** v0.3.4 detects when tool updates diverge the cached state and provides a simple recovery path. A future session encountering this drift needs to know it's not indicative of a real problem.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-NWG4PSPL -->

## Always create .venv for Python projects; install packages into it, not globally

**When:** 2026-06-19 · **Fact:** `P-NWG4PSPL`

<!-- decision:P-TLKQFR7Z -->

## Layered backend architecture: routes (thin, orchestrate transport only), service

**When:** 2026-06-19 · **Fact:** `P-TLKQFR7Z`

<!-- decision:P-LHNFGNQX -->

## Prefer paying architectural cost upfront to avoid maintenance friction later—"ra

**When:** 2026-06-19 · **Fact:** `P-LHNFGNQX`

<!-- decision:P-GAaL225G -->

## User's convention: claude-memory-kit backups go to ~\ (not temp directories)

**When:** 2026-06-19 · **Fact:** `P-GAaL225G`

<!-- decision:P-KQGKWQUT -->

## User reconsidering whether Task 151 (persona-redesign) should enter v0.4.0 despi

**When:** 2026-06-19 · **Fact:** `P-KQGKWQUT`

<!-- decision:P-HP6UTS9X -->

## Don't do v0.3.5 down-payment (full work/tests, no kit payoff); do full 151 redes

**When:** 2026-06-19 · **Fact:** `P-HP6UTS9X`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-F29TVCRT -->

## FQ1 test coverage gap — the cut-gate probe is CLI-only, not MCP tool (the actual

**When:** 2026-06-20 · **Fact:** `P-F29TVCRT`

<!-- decision:P-D2BR4VYX -->

## Auto-recall agents do not and should not read tombstoned facts; recovery is alwa

**When:** 2026-06-20 · **Fact:** `P-D2BR4VYX`

<!-- decision:P-K6DKFXP4 -->

## Check documentation to verify technical claims rather than reasoning through unc

**When:** 2026-06-20 · **Fact:** `P-K6DKFXP4`

<!-- decision:P-Y9DZXM3D -->

## Tasks 156 (DECISIONS.md AI-recall) and 155 (tombstone recovery flag) queued for

**When:** 2026-06-20 · **Fact:** `P-Y9DZXM3D`

<!-- decision:P-DEQV4AUL -->

## v0.3.2 ships FTS5 query fix (Task 153) + validate-index (Task 152)

**When:** 2026-06-20 · **Fact:** `P-DEQV4AUL`

<!-- decision:P-N6ZTVDUC -->

## v0.3.2 shipped to npm (@lh8ppl/claude-memory-kit@0.3.2) with SLSA provenance and

**When:** 2026-06-20 · **Fact:** `P-N6ZTVDUC`

<!-- decision:P-CLTKNaVa -->

## Memory routing gap caught — I was writing to harness slug path instead of kit's

**When:** 2026-06-20 · **Fact:** `P-CLTKNaVa`

<!-- decision:P-KKYS67aQ -->

## node:sqlite migration rejected—clean CI perf data showed 10% slower search perfo

**When:** 2026-06-20 · **Fact:** `P-KKYS67aQ`

<!-- decision:P-aG3GHZBE -->

## v0.3.3 roadmap: Task 156 (DECISIONS.md AI-recall journal completion), Task 155 (

**When:** 2026-06-20 · **Fact:** `P-aG3GHZBE`

<!-- decision:P-BFTDUAQT -->

## DECISIONS.md is the decision journal; Task 159 makes it auto-update automaticall

**When:** 2026-06-20 · **Fact:** `P-BFTDUAQT`

<!-- decision:P-94DQYLBM -->

## INDEX.md is the kit's metadata index of all 307 memory facts; touched on every f

**When:** 2026-06-20 · **Fact:** `P-94DQYLBM`

<!-- decision:P-DCP2GLQY -->

## Task 159 made two undocumented divergences from research spec: used `isJournalSt

**When:** 2026-06-20 · **Fact:** `P-DCP2GLQY`

<!-- decision:P-UY6XTETK -->

## Expects implementation choices to be traceable to (or explicitly justified again

**When:** 2026-06-20 · **Fact:** `P-UY6XTETK`

<!-- decision:P-HGAHKL9H -->

## 6 mattpocock skills (tdd, grilling, diagnosing-bugs, codebase-design, domain-mod

**When:** 2026-06-20 · **Fact:** `P-HGAHKL9H`

<!-- decision:P-WCBPVNEa -->

## Skills available but not invoked despite matching work; violates Skill agency ru

**When:** 2026-06-20 · **Fact:** `P-WCBPVNEa`

<!-- decision:P-6DNYCTB2 -->

## Code-review-excellence is pre-existing skill, not one of 6 newly adopted; produc

**When:** 2026-06-20 · **Fact:** `P-6DNYCTB2`

<!-- decision:P-A2XCSPSa -->

## CHANGELOG date for v0.3.3 is 2026-06-18

**When:** 2026-06-20 · **Fact:** `P-A2XCSPSa`

<!-- decision:P-54X6D2DM -->

## cmk-compress-session must be invoked by Claude Code at session-end, not manually

**When:** 2026-06-20 · **Fact:** `P-54X6D2DM`

<!-- decision:P-YA74AXRJ -->

## Nested-`claude` invocations from inside an active Claude Code session timeout at

**When:** 2026-06-20 · **Fact:** `P-YA74AXRJ`

<!-- decision:P-DV52LVVN -->

## D6 (now→today roll) fail-safe behavior confirmed: timeout logs cleanly, now.md i

**When:** 2026-06-20 · **Fact:** `P-DV52LVVN`

<!-- decision:P-LD7RPCTX -->

## Honest uncertainty flagging: can't be 100% sure whether compress timeout is envi

**When:** 2026-06-20 · **Fact:** `P-LD7RPCTX`

<!-- decision:P-KKALEZCP -->

## Only 2 of 19 systems (memsearch, Letta) cleanly implement A+B+C (buffer cap + de

**When:** 2026-06-20 · **Fact:** `P-KKALEZCP`

<!-- decision:P-5WHKZPR3 -->

## Kit's memory system uses a `now → today → recent → archive` rolling window; `now

**When:** 2026-06-20 · **Fact:** `P-5WHKZPR3`

<!-- decision:P-WYEEXZRN -->

## Root cause: roll mechanism fires only at SessionStart/SessionEnd, not turn bound

**When:** 2026-06-20 · **Fact:** `P-WYEEXZRN`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-4TGBBBPB -->

## 200KB input compresses in ~15s standalone (no contention); real-world failures o

**When:** 2026-06-20 · **Fact:** `P-4TGBBBPB`

<!-- decision:P-MXSa47QX -->

## User prefers memory designs tailored to kit's actual architecture over patterns

**When:** 2026-06-20 · **Fact:** `P-MXSa47QX`

<!-- decision:P-E7AL69YL -->

## observability-first approach — captures real failure data before implementing de

**When:** 2026-06-20 · **Fact:** `P-E7AL69YL`

<!-- decision:P-ZMRE4MSU -->

## Cascade-Starvation: Lazy Distill Limitation on Busy Repos

**When:** 2026-06-20 · **Fact:** `P-ZMRE4MSU`
**Why:** Known limitation (Task 105/D-75). Surfaces as unexpected staleness on high-activity projects. Lazy SessionStart fallback is insufficient as *sole* distill mechanism for hierarchical compression.

<!-- decision:P-2RaREHLR -->

## CMK Health Check Status (2026-06-20)

**When:** 2026-06-20 · **Fact:** `P-2RaREHLR`
**Why:** Captures current health state. Staleness is caused by two compounding issues: (1) cascade-starvation where stale-now verdict blocks stale-daily/weekly refresh cycles, (2) unretried haiku_timeout on weekly compression (predates v0.3.4). Cron not registered means no scheduled background distill; only lazy fallback on SessionStart. Native auto-memory running in parallel with kit layers.

<!-- decision:P-BKCWY2C6 -->

## Cron Job Registration Feature (HC-5)

**When:** 2026-06-20 · **Fact:** `P-BKCWY2C6`
**Why:** Without cron, lazy SessionStart fallback is the only automatic distill path, which starves on busy repos (cascade-starvation). Scheduled cron runs provide reliable daily/weekly cycles — the real fix for staleness on high-activity dogfood/test projects.

<!-- decision:P-BDQ7XNU5 -->

## Weekly Compression Timeout and v0.3.4 Retry Logic

**When:** 2026-06-20 · **Fact:** `P-BDQ7XNU5`
**Why:** Large compressions can timeout; v0.3.4 added retry recovery. The unretried timeout in this session predates the fix. With new install, future timeouts should auto-retry.

<!-- decision:P-ABWV2PS7 -->

## LLM Timeout Retries: Backoff Interval Strategy

**When:** 2026-06-20 · **Fact:** `P-ABWV2PS7`
**Why:** Short backoff intervals (< 1s) don't give slow LLM windows time to pass; they just hammer with back-to-back requests. Long waits (5–10s) align with field practice and let transient slowness resolve naturally.

<!-- decision:P-6U7SCR5a -->

## Register Crons for Staleness/Starvation Prevention

**When:** 2026-06-20 · **Fact:** `P-6U7SCR5a`
**Why:** Crons are the designed fix for staleness and cascade-starvation; background distill-curate cycle prevents memory degradation over time

<!-- decision:P-Ta2YJJaB -->

## Tag and Publish v0.3.5 Release

**When:** 2026-06-20 · **Fact:** `P-Ta2YJJaB`
**Why:** Release commit b4ecf78 is on main and ready; tagging is the publish gate that automates npm and GitHub release

<!-- decision:P-WQDKTWEG -->

## Close Claude Code Before Global cmk Install to Avoid EBUSY

**When:** 2026-06-20 · **Fact:** `P-WQDKTWEG`
**Why:** Claude Code's MCP processes hold file locks; npm needs exclusive DLL access during installation. DLL contention occurs on Windows.

<!-- decision:P-NZE35AKR -->

## Local Tarball Testing Path (Pre-Publish Gate)

**When:** 2026-06-20 · **Fact:** `P-NZE35AKR`
**Why:** Catches bugs before they reach npm; reduces risk of bad versions going public; aligns with established cut-gate.md pattern, proven effective for v0.3.5.

<!-- decision:P-2WWX4ZHY -->

## v0.3.5 Release Verified and Ready

**When:** 2026-06-20 · **Fact:** `P-2WWX4ZHY`
**Why:** Confirms end-to-end fix works and no blockers remain; safe to publish.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-TSBAKGD7 -->

## Expects comprehensive accounting of work—what was kept, what was superseded but

**When:** 2026-06-20 · **Fact:** `P-TSBAKGD7`

<!-- decision:P-9YCUW5QH -->

## Distill Performance Baselines (Slow vs Healthy Haiku)

**When:** 2026-06-20 · **Fact:** `P-9YCUW5QH`
**Why:** Manual distill run on 2026-06-20 took 240s and succeeded, confirming the v0.3.5 retry fix handles slow-Haiku windows where v0.3.4 would have failed entirely. This is the exact scenario the timeout/backoff tuning targets.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-XM9YAKRW -->

## httpx2 deprecation in FastAPI TestClient — need to replace httpx dependency with

**When:** 2026-06-20 · **Fact:** `P-XM9YAKRW`

<!-- decision:P-WMN3HFPF -->

## Prefer using recorded memory lookups and CLI tools (cmk search) instead of manua

**When:** 2026-06-20 · **Fact:** `P-WMN3HFPF`

<!-- decision:P-7RV4P6CR -->

## Accepted two-lever fix recommendation (120s timeout + 5s CEILING_FREE_BACKOFF_MS

**When:** 2026-06-20 · **Fact:** `P-7RV4P6CR`

<!-- decision:P-LSJG9NCK -->

## Established testing path in cut-gate.md (local tarball pack → install → verify)

**When:** 2026-06-20 · **Fact:** `P-LSJG9NCK`

<!-- decision:P-CRUFQECT -->

## Before closing VS Code to reopen, user wants everything documented in RESUME-HER

**When:** 2026-06-20 · **Fact:** `P-CRUFQECT`

<!-- decision:P-2YP75JAJ -->

## v0.3.5 verified: all 9 health checks pass; compress fix proven (recent.md 4h fre

**When:** 2026-06-20 · **Fact:** `P-2YP75JAJ`

<!-- decision:P-K4BM4YYX -->

## Project Tracking Structure

**When:** 2026-06-20 · **Fact:** `P-K4BM4YYX`
**Why:** Explicit tracking + session markers let sessions resume without re-deriving state.

<!-- decision:P-AGV23NTY -->

## Task 50 cross-agent seam: target Kiro CLI agent-hooks (agentSpawn=SessionStart-i

**When:** 2026-06-20 · **Fact:** `P-AGV23NTY`
**Why:** The kit's whole inject-at-start/capture-at-turn-end model only ports to the CLI agent-hook surface; building against the IDE surface would mean no session-start trigger + an undocumented on-disk format.

<!-- decision:P-SAX2JDHY -->

## Task 50 adapter architecture: do NOT build a uniform Installer base class across

**When:** 2026-06-20 · **Fact:** `P-SAX2JDHY`
**Why:** Full-corpus survey: only claude-mem actually multi-agent-installs and its code is bespoke-per-agent; an Installer.install() interface is a leaky abstraction whose bodies share zero code. The generalizable part is the config-write primitive, which maps to the kit's existing marker-block byte-preservation + over-mutation-guard rules.

<!-- decision:P-RT2G5VAY -->

## Task 50 highest unverified risk: Kiro transcript format is UNKNOWN. The kit's ex

**When:** 2026-06-20 · **Fact:** `P-RT2G5VAY`
**Why:** The transcript layer is the one part of the Claude-Code integration that is deeply host-coupled and was NOT verifiable from docs; it gates the capture half of the kit's model on Kiro.

<!-- decision:P-NC2URWTD -->

## Kiro transcript format RESOLVED (verified on a real Kiro install, D-180 follow-u

**When:** 2026-06-20 · **Fact:** `P-NC2URWTD`
**Why:** This was flagged as Task 50's highest unverified risk (kit hardcodes Claude-Code transcript touchpoints). Now resolved to LOW — the format is clean + parseable; only 3 per-agent params change (transcript dir, workspace->dir base64url mapping, JSON .history parse shape).

<!-- decision:P-VSTZ4B6M -->

## Decision-Trail Preservation Rule

**When:** 2026-06-20 · **Fact:** `P-VSTZ4B6M`
**Why:** Preserves decision history and makes changes traceable; enables future readers to understand the reasoning and evolution

<!-- decision:P-EJ2VUaJL -->

## Documentation Structure and Authoritative Homes

**When:** 2026-06-20 · **Fact:** `P-EJ2VUaJL`
**Why:** Distributed documentation ensures each finding type lives in its canonical location and remains discoverable for future sessions

<!-- decision:P-3H5NPLNC -->

## README/CHANGELOG Update Timing

**When:** 2026-06-20 · **Fact:** `P-3H5NPLNC`
**Why:** Prevents "lazy-framing-as-docs anti-pattern" of documenting unshipped features as if they're already live

<!-- decision:P-HVL7EQZS -->

## Kiro CLI hooks gap (D-181 follow-up, found by reading kiro.dev/docs/cli/custom-a

**When:** 2026-06-20 · **Fact:** `P-HVL7EQZS`
**Why:** The kit's whole thesis (D-85/D-164) is memory that works automatically with no manual command. A hook that only fires under a manually-selected agent fails that — the same automatic-path failure class as D-169. The hook schema itself is correct ({hooks:{agentSpawn:[{command}],stop:[{command}]}}) but the DELIVERY mechanism (custom agent) is manual-only.

<!-- decision:P-FSJ93TaZ -->

## Kiro CLI auto-loading verified (D-181 follow-up, kiro.dev/docs/cli/steering prim

**When:** 2026-06-20 · **Fact:** `P-FSJ93TaZ`
**Why:** The current Kiro profile writes a custom steering file assuming inclusion:always auto-loads it (IDE convention). The CLI docs contradict this: custom steering needs agent-resources inclusion; AGENTS.md is the auto-loaded surface. So the profile's instruction leg is wired to a file the CLI won't auto-read.

<!-- decision:P-6E53DZRM -->

## Kiro IDE vs CLI hooks (verified quote from an AWS-builders article the user foun

**When:** 2026-06-20 · **Fact:** `P-6E53DZRM`
**Why:** The user correctly called out that I was confusing Claude Code's model with Kiro's. Kiro IDE and Kiro CLI are two surfaces sharing MCP+steering but differing on hooks. Real working implementations exist (AWS bash-hooks memory, langfuse integration, AgentCore memory blog) that should be studied before designing the kit's Kiro path.

<!-- decision:P-N39ZJ69D -->

## Kiro IDE hooks are a BETTER fit for the kit than I first concluded (verified acr

**When:** 2026-06-20 · **Fact:** `P-N39ZJ69D`
**Why:** This reverses my earlier 'CLI hooks are the target' conclusion. The IDE surface has automatic turn-end + shell-command-with-context-injection — a cleaner fit for the kit's auto-memory model than CLI custom-agent hooks (manual). The cost: the .kiro.hook format is undocumented, so it must be reverse-engineered from real repos + live-verified (the §5.1 convergent-third-party rule — and here even docs fail, so REAL files are the only primary source).

<!-- decision:P-WJRUQVSW -->

## Kiro IDE .kiro.hook on-disk format VERIFIED from a real hook created in the Kiro

**When:** 2026-06-20 · **Fact:** `P-WJRUQVSW`
**Why:** The docs refused to document the .kiro.hook format (UI-first). A real file from the user's Kiro install is the only primary source — and it reveals IDE hooks ARE installable from a file, which reopens the IDE-hooks path as a real option for the kit (automatic agentStop, no default-agent needed). The when/then structure differs from the CLI agent-config hook array.

<!-- decision:P-55ZLLX6T -->

## Decision (the user, 2026-06-21): rework Kiro support PROPERLY before v0.4.0 ship

**When:** 2026-06-20 · **Fact:** `P-55ZLLX6T`
**Why:** The user chose correctness-now over ship-broken. The default-agent decision needs the 'what did others do' evidence before deciding — AgentCore (a memory system, our closest analog) sets it; the non-memory tools don't. That suggests a memory kit SHOULD set it, but it's invasive (every kiro-cli session uses cmk's agent), so present it as the AgentCore-precedented recommendation with an opt-out.

<!-- decision:P-X974ZW97 -->

## Kiro has FOUR install surfaces, not three (the user's correction 2026-06-21): HO

**When:** 2026-06-20 · **Fact:** `P-X974ZW97`
**Why:** The user corrected my mental model: Kiro = hooks + steerings + skills + MCP. I'd been mapping only 3 of 4 surfaces. Skills is a real Kiro surface the kit should consider mapping its own skills to. Steering coexistence with agents is now verified from real DesignerPunk agent files (resources re-add).

<!-- decision:P-4FLCNCaX -->

## Kiro skills map NEARLY 1:1 to Claude Code skills (verified from real files 2026-

**When:** 2026-06-20 · **Fact:** `P-4FLCNCaX`
**Why:** The user's 4-surface correction (hooks/steering/skills/mcp) surfaced skills as a leg the kit's adapter omitted. Real-file inspection shows Kiro skills ≈ Claude Code skills (SKILL.md + frontmatter), so the kit's memory skills port directly — a high-value, low-risk leg that gives the model the memory-search/memory-write capabilities on Kiro the same way as on Claude Code.

<!-- decision:P-YKG4GF25 -->

## Decision (the user, 2026-06-21): the kit's Kiro support wires ALL FOUR surfaces 

**When:** 2026-06-20 · **Fact:** `P-YKG4GF25`
**Why:** The kit's thesis is automatic, deterministic memory (D-85/D-164). A skills/steering-only recall+capture would be model-compliance-dependent (the model has to choose to call memory-write). Hooks give the same deterministic capture-at-turn-end the kit relies on for Claude Code. The user chose completeness over install-simplicity — consistent with the kit's architecture-first values (U-VMASJQ55: accept upfront cost to avoid future friction).

<!-- decision:P-P9FL3NYB -->

## Kiro install path SETTLED (D-182, 2026-06-21, from a 14-real-project survey + th

**When:** 2026-06-20 · **Fact:** `P-P9FL3NYB`
**Why:** The user's push to check 15+ real projects + clone them settled the install path with EVIDENCE (a tally) not theory, and surfaced the authoritative source (Amazon-Q Rust) that corrects the stale published JSON schema. CLI-agent-config wins because IDE hooks can't do deterministic capture (askAgent only) — the kit's whole thesis is deterministic auto-capture.

<!-- decision:P-WG6SMMV7 -->

## CORRECTION to D-182 (2026-06-21): the survey's claim 'IDE .kiro.hook is disquali

**When:** 2026-06-20 · **Fact:** `P-WG6SMMV7`
**Why:** I let the research collapse to CLI-only and disqualified the IDE on a false premise (askAgent-only). The user caught it: 'why are you only talking about kiro cli and not kiro ide?'. Most Kiro users use the IDE; it was the original v0.4 target. The user's real hook proves IDE runCommand works. 3 of 4 surfaces (MCP/steering/skills) are SHARED IDE+CLI anyway; only hooks differ, and BOTH support deterministic capture.

<!-- decision:P-F4WFAXAQ -->

## Decision (the user, 2026-06-21): the Kiro rework wires BOTH IDE + CLI hook surfa

**When:** 2026-06-20 · **Fact:** `P-F4WFAXAQ`
**Why:** The user chose complete coverage over phased. Kiro IDE is the primary surface (their main work IDE) + CLI for terminal users. Both hook surfaces support deterministic capture (the runCommand correction). Consistent with the all-4-surfaces + rework-properly decisions — architecture-first completeness (U-VMASJQ55).

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-BEWVGQJH -->

## Published v0.3.5 via git tag + push (straightforward execution of tested fix).

**When:** 2026-06-20 · **Fact:** `P-BEWVGQJH`

<!-- decision:P-N2PGMBaF -->

## CRITICAL Kiro-on-Windows hook constraint (LIVE-DISCOVERED 2026-06-21, would neve

**When:** 2026-06-21 · **Fact:** `P-N2PGMBaF`
**Why:** This is the kind of cross-platform composition failure (the kit's binding cross-platform rule) that ONLY live-testing finds — the whole reason the user pushed for live tests. A Kiro hook command that works on macOS/Linux (native bash) breaks on Windows (WSL routing + no node). The kit must emit a hook command that runs in Kiro's actual execution environment per-platform.

<!-- decision:P-AU9A6457 -->

## Kiro IDE hooks live-test WINS (2026-06-21, the user ran it in C:\Projects\Spec-D

**When:** 2026-06-21 · **Fact:** `P-AU9A6457`
**Why:** The live test the user ran validated the core IDE-hook mechanism end-to-end: hooks auto-fire on agentStop, runCommand executes, the kit's .kiro.hook format loads. Only the per-platform command form (Windows WSL) needs solving — a contained, solvable problem, not an architecture flaw. This is exactly the live verification that turns 'should work per docs' into 'verified fires'.

<!-- decision:P-3K6D62MS -->

## Windows Kiro Hooks Execute via WSL; Require cmd.exe /c Prefix

**When:** 2026-06-21 · **Fact:** `P-3K6D62MS`
**Why:** Discovered via live test on 2026-06-21 in Spec-Driven-Workshop. The probe `.kiro.hook` fired but failed with `node: not found`, surfacing the WSL layer. Static analysis alone would not have caught this cross-platform behavior.

<!-- decision:P-PM2CD6CB -->

## SOLVED — the Windows Kiro-hook command form (LIVE-VERIFIED 2026-06-21): 'cmd.exe

**When:** 2026-06-21 · **Fact:** `P-PM2CD6CB`
**Why:** This closes the only blocker found in the Kiro IDE live-test. The WSL/no-node problem (which only live-testing surfaced) is solved by cmd.exe /c forcing the Windows shell. Now the kit can emit a Kiro hook command that actually fires cmk on every platform.

<!-- decision:P-CW9CLD2a -->

## Kiro .kiro.hook path lesson (2026-06-21): paths in a .kiro.hook command string m

**When:** 2026-06-21 · **Fact:** `P-CW9CLD2a`
**Why:** A hand-written probe hook with C:\tmp\... single-backslashed broke Kiro's JSON parser. The kit must never emit a backslash path into a .kiro.hook. JSON.stringify + forward-slash paths is the safe pattern.

<!-- decision:P-CJYGTQYR -->

## Kiro hook ENVIRONMENT verified live (2026-06-21, the probe captured it before ha

**When:** 2026-06-21 · **Fact:** `P-CJYGTQYR`
**Why:** This is the load-bearing payload-shape question, answered live. Kiro's hook model (env+argv+transcript-file) is fundamentally DIFFERENT from Claude Code's (stdin JSON with assistant_response). The cmk hook bin must adapt per-agent: Claude Code reads stdin JSON; Kiro reads env+argv+transcript. Building it to expect a Kiro stdin payload would hang or capture nothing (the probe proved the hang).

<!-- decision:P-4aNa5TZB -->

## Kiro hook prior-art survey conclusion (2026-06-21, the boilerplate article + kir

**When:** 2026-06-21 · **Fact:** `P-4aNa5TZB`
**Why:** Confirms the kit is doing something novel (deterministic runCommand capture) that no published Kiro project does — they all use askAgent. So the probe is the ground truth + the kit can't lean on examples for the runCommand input model. The restart-to-activate-hooks detail is a real install-UX requirement to document.

<!-- decision:P-XaPRJFWE -->

## Kiro hook AUTHORITATIVE confirmations (2026-06-21, from the AWS builder article 

**When:** 2026-06-21 · **Fact:** `P-XaPRJFWE`
**Why:** This AWS primary-source article confirms every probe finding (USER_PROMPT env, runCommand→stdout→context, agentStop, exit-0-or-block) and surfaces a security requirement: the kit must sanitize USER_PROMPT before using it in a command. It also validates the kit's whole approach (runCommand deterministic capture is THE recommended pattern).

<!-- decision:P-RZR74Pa2 -->

## Kiro Hook Activation and Git Commit Cycle

**When:** 2026-06-21 · **Fact:** `P-RZR74Pa2`
**Why:** This is the documented Kiro lifecycle. Hooks are not hot-reloaded; the cycle is part of the system design.

<!-- decision:P-aRER5PY3 -->

## Kiro Hook Security Design is Injection-Safe

**When:** 2026-06-21 · **Fact:** `P-aRER5PY3`
**Why:** AWS's "Mastering Agent Hooks" article confirmed this approach is the authoritative best practice, not novel/risky. The security concern from the AWS article (sanitizing prompts) is already handled by the kit's existing infrastructure.

<!-- decision:P-NTDLMK74 -->

## PR-1 Task-50 Kiro Rework — Completion State (2026-06-21)

**When:** 2026-06-21 · **Fact:** `P-NTDLMK74`
**Why:** Modular approach lets each surface be verified before final orchestration. Orchestrator is the glue layer that enables the full user workflow.

<!-- decision:P-9D56CKBV -->

## PR Organization: Separate IDE (PR-1) and CLI (PR-2) Surfaces

**When:** 2026-06-21 · **Fact:** `P-9D56CKBV`
**Why:** IDE and CLI integration require different documentation and config models. Separating them maintains clear scope and prevents review confusion. IDE is now production-ready and deployable independently.

<!-- decision:P-Y7Q532UC -->

## SonarCloud as Security Gate for ReDoS Detection

**When:** 2026-06-21 · **Fact:** `P-Y7Q532UC`
**Why:** SonarCloud provides security-focused static analysis. Understanding its role and historical effectiveness (catching ReDoS) explains why it's the final merge gate.

<!-- decision:P-JHZ6ZT27 -->

## SonarCloud `then`-in-object False Positive (Schema Fields)

**When:** 2026-06-21 · **Fact:** `P-JHZ6ZT27`
**Why:** This rule fires reliably on any field named `then`. Without knowing it's a false positive in this context, developers may over-fix or be confused by the flag during CI.

<!-- decision:P-GVUWGQKL -->

## Claude Code vs Kiro Hook and Integration Differences

**When:** 2026-06-21 · **Fact:** `P-GVUWGQKL`
**Why:** Each agent has a different plugin/integration API and execution context; these differences are fundamental to how each tool works

<!-- decision:P-HFQPUGUD -->

## Shared Core + Thin Adapter Architecture Pattern

**When:** 2026-06-21 · **Fact:** `P-HFQPUGUD`
**Why:** Different agents have fundamentally different input/output contracts; the core must be shared for consistency and maintainability, but the adapters must differ

<!-- decision:P-7QBE6A6M -->

## Kiro vs Claude Code integration: the CORE is shared (verified 2026-06-21), only 

**When:** 2026-06-21 · **Fact:** `P-7QBE6A6M`
**Why:** The user asked 'isn't the kiro integration code supposed to be the same as claude code integration code?' — the answer (verified in code): YES for the core (it IS the same, reused not reimplemented), NO for the adapter (Claude Code and Kiro are different programs with different hook config/input/transcript contracts). The thin adapter is the only divergence, and every difference maps to a real tool difference.

<!-- decision:P-FA4ALL42 -->

## Plan (the user, 2026-06-21): do the manual Kiro live-capture test ONCE, after AL

**When:** 2026-06-21 · **Fact:** `P-FA4ALL42`
**Why:** The user prefers one consolidated live-test session over two. PR-1 proved the hook RUNS (cmd.exe /c cmk --version → 0.3.5); the capture-fires-end-to-end test waits until PR-2 lands so both IDE + CLI surfaces are verified together at the v0.4.0 cut.

<!-- decision:P-3Y6MCN2B -->

## Kiro CLI agent-config goes to ~/.aws/amazonq/cli-agents/ (Amazon Q's real locati

**When:** 2026-06-21 · **Fact:** `P-3Y6MCN2B`
**Why:** A user-tier write (the Kiro CLI agent at ~/.aws) needs the same sandbox-isolation as MEMORY_KIT_USER_DIR. The live-test rule (run against a sandbox that can't touch real state) caught this — the routing's undefined userTier fell through to the real home. This is the test-isolation discipline applied to a NEW user-tier location (~/.aws).

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-BK5H9TP6 -->

## Check broader product research corpus; don't rely on 2 cherry-picked exemplars

**When:** 2026-06-20 · **Fact:** `P-BK5H9TP6`

<!-- decision:P-3SJHATQG -->

## Original task iterations preserved with "decision-trail" markers when tasks rest

**When:** 2026-06-20 · **Fact:** `P-3SJHATQG`

<!-- decision:P-B7AHUBR5 -->

## Tasks must have explicit done-criteria as checkboxes defined at task START befor

**When:** 2026-06-20 · **Fact:** `P-B7AHUBR5`

<!-- decision:P-ZJZYKX6F -->

## Checks for comprehensive documentation as a quality gate (research, decisions, d

**When:** 2026-06-20 · **Fact:** `P-ZJZYKX6F`

<!-- decision:P-LZEDDB4W -->

## For multi-surface builds (like Kiro IDE/CLI): prefers sub-tasks, start with IDE

**When:** 2026-06-20 · **Fact:** `P-LZEDDB4W`

<!-- decision:P-GXB5XYKV -->

## Deferred manual live-testing until v0.4.0 code completion, rather than increment

**When:** 2026-06-21 · **Fact:** `P-GXB5XYKV`

<!-- decision:P-7T5EJATL -->

## 5× Concurrency Stress Gate as Pre-PR Verification

**When:** 2026-06-21 · **Fact:** `P-7T5EJATL`
**Why:** Concurrency bugs are hard to trigger in single runs; stress gates reliably expose them.

<!-- decision:P-PRaLBB4a -->

## Windows EPERM/Spawn-Concurrency Flake Class and Fix Pattern

**When:** 2026-06-21 · **Fact:** `P-PRaLBB4a`
**Why:** These are concurrency-class bugs that only surface under stress; the stress gate reliably flushes them before PR.

<!-- decision:P-J37A3AY6 -->

## Stress Gate Test Harness — Binding 5× Rule for Merge

**When:** 2026-06-21 · **Fact:** `P-J37A3AY6`
**Why:** The two pre-existing concurrency flakes prove why 5× is non-negotiable — they would have shipped without it.

<!-- decision:P-Z5TZW33W -->

## Flake Root Causes — Windows-EPERM / Spawn-Concurrency

**When:** 2026-06-21 · **Fact:** `P-Z5TZW33W`
**Why:** Prevents false CI negatives; establishes these as environmental quirks, not code defects.

<!-- decision:P-XT9KMHaA -->

## Kiro v0.4.0 Release — Code Complete, Pre-Release Checkpoints

**When:** 2026-06-21 · **Fact:** `P-XT9KMHaA`
**Why:** Ensures IDE and CLI surfaces work together before shipping; user's stated release requirement.

<!-- decision:P-VDNG6QTR -->

## Manual live-test required before releasing — stated as "do the manual check when

**When:** 2026-06-21 · **Fact:** `P-VDNG6QTR`

<!-- decision:P-GaPYPMLa -->

## Structure of cut-gate-kiro.md (Kiro Installation Verification Gate)

**When:** 2026-06-21 · **Fact:** `P-GaPYPMLa`
**Why:** Cut-gate docs are manual verification checklists before release; separate files avoid conditional complexity and keep IDE-specific flows self-contained and readable

<!-- decision:P-GVYE3WV9 -->

## Test-Gate Protocol — Backup Real Paths Instead of Env-Var Sandbox

**When:** 2026-06-21 · **Fact:** `P-GVYE3WV9`
**Why:** Testing real default paths catches real-world bugs that env-var sandboxing hides — the same principle as the "test real input" rule.

<!-- decision:P-W372LWJa -->

## cut-gate-backup-convention

**When:** 2026-06-21 · **Fact:** `P-W372LWJa`
**Why:** Flat backups cluttered the home dir, had no structure, and were easy to fat-finger in cleanup. Central + structured = safe to bulk-manage and AFTER-snapshots are evidence to diff against the next run.

<!-- decision:P-GWQBHT2H -->

## Release Cut Verification Checklist (claude-memory-kit)

**When:** 2026-06-21 · **Fact:** `P-GWQBHT2H`
**Why:** Prevents version-drift bugs and ensures clean release artifacts

<!-- decision:P-6X7CCNCW -->

## Release-Cut Workflow for claude-memory-kit

**When:** 2026-06-21 · **Fact:** `P-6X7CCNCW`
**Why:** This workflow is repeatable and ensures releases are clean (only version and changelog land), verified before committing, and properly tagged for automation.

<!-- decision:P-EVZ5BUYa -->

## Two-Phase Release: Commit/Gate, Then Tag/Publish

**When:** 2026-06-21 · **Fact:** `P-EVZ5BUYa`
**Why:** Safety model — allows full testing and gate checks (§0a/§0b/§0c) before npm goes live; prevents accidental releases

<!-- decision:P-MGMaR2MH -->

## npm pack + Global Install for Artifact Testing (§0b)

**When:** 2026-06-21 · **Fact:** `P-MGMaR2MH`
**Why:** Ensures the production tarball builds correctly and the global CLI binary is the new version before any integration testing.

<!-- decision:P-XULJP7RH -->

## Publish Trigger is Git Tag Push, Not Branch Commit

**When:** 2026-06-21 · **Fact:** `P-XULJP7RH`
**Why:** The safety model depends on decoupling the ordinary commit from the publish trigger. A bundled tag+push risks publishing before all gates have run.

<!-- decision:P-5SACW7MP -->

## Release Workflow Multi-Gate Process (§0a → §0c)

**When:** 2026-06-21 · **Fact:** `P-5SACW7MP`
**Why:** Separating commit and tag ensures no publish occurs until the entire gate sequence succeeds. Clear rollback point if any gate fails.

<!-- decision:P-BEVBLNaP -->

## Removes automatic destructive operations from scripts (Remove-Item) to prevent a

**When:** 2026-06-21 · **Fact:** `P-BEVBLNaP`

<!-- decision:P-L6JWNSFM -->

## Gate/Restore Logic: q_cli_default.json Presence Determines Behavior

**When:** 2026-06-21 · **Fact:** `P-L6JWNSFM`
**Why:** The capture/restore logic is conditional on pre-gate state; the guide needs users to record this fact in NOTES.md

<!-- decision:P-G92GKGUD -->

## PowerShell 5.1 `-Format o` Requirement for ISO 8601 Date Format

**When:** 2026-06-21 · **Fact:** `P-G92GKGUD`
**Why:** The gate's NOTES.md header line was failing due to this ambiguity; documented fix is now in the guide

<!-- decision:P-WSCLNW49 -->

## PowerShell Glob Behavior: Explicit Filename Required for .tgz

**When:** 2026-06-21 · **Fact:** `P-WSCLNW49`
**Why:** Real-run gotcha; scripts relying on `*.tgz` glob fail silently on Windows

<!-- decision:P-YMYUa2QG -->

## HC-1 False-FAIL on Kiro (Recursive Agent-Awareness Bug)

**When:** 2026-06-21 · **Fact:** `P-YMYUa2QG`
**Why:** Skill-review caught a real cut-blocker self-review missed. The gate's output validity depends on doctor being correct across all agent surfaces. Hidden sub-bug within a fix.

<!-- decision:P-PHDPCC2W -->

## Rebuild Artifact After Bug Fix (Without Re-cutting Release)

**When:** 2026-06-21 · **Fact:** `P-PHDPCC2W`
**Why:** Global `cmk` is the pre-fix binary. Bug fixes are content-only; version stays unchanged. The binary must be re-packed and re-installed.

<!-- decision:P-RPaCVQAN -->

## CMK Version Bumping Convention

**When:** 2026-06-21 · **Fact:** `P-RPaCVQAN`
**Why:** Version increments only for feature releases or breaking changes; bug fixes are part of the same release

<!-- decision:P-N3QLT54B -->

## Global Binary Lag After Code Merge

**When:** 2026-06-21 · **Fact:** `P-N3QLT54B`
**Why:** npm maintains a local cache of global packages; merging to main does not trigger automatic re-installation

<!-- decision:P-JZa9NZDF -->

## Rebuilding the Global CMK Binary After Code Changes

**When:** 2026-06-21 · **Fact:** `P-JZa9NZDF`
**Why:** Global npm installs are cached locally; source changes don't propagate to the installed binary

<!-- decision:P-7aNNUU4Z -->

## npm uninstall EBUSY Error with better_sqlite3.node on Rebuild

**When:** 2026-06-21 · **Fact:** `P-7aNNUU4Z`
**Why:** This is a recurring papercut during rebuilds on Windows; users will hit it unpredictably depending on what's running in their session.

<!-- decision:P-453YJ3aW -->

## BOM Handling in Config File Readers

**When:** 2026-06-21 · **Fact:** `P-453YJ3aW`
**Why:** BOM is a recurring, silent, high-impact failure in Windows; cascades across multiple subsystems causing corrupted behavior or false refusals

<!-- decision:P-a4J4QGEC -->

## Verification Gate: Two-Phase Approach

**When:** 2026-06-21 · **Fact:** `P-a4J4QGEC`
**Why:** Decouples fast scaffolding checks from slow live-environment checks; allows gate to flow while environment setup happens

<!-- decision:P-NQYBBLXL -->

## Live-test gate structure and blocker findings

**When:** 2026-06-21 · **Fact:** `P-NQYBBLXL`
**Why:** The live-test gate is the release-validation step that prevents shipping broken builds. Early phases catch input-handling bugs; later phases verify IDE/CLI integration works.

<!-- decision:P-L6DTEQRG -->

## Post-#215 merge workflow (gate continuation)

**When:** 2026-06-21 · **Fact:** `P-L6DTEQRG`
**Why:** This is the planned workflow to complete the live-test gate and verify full IDE/CLI integration before release.

<!-- decision:P-VJL254MX -->

## EBUSY Workaround for Global Package Reinstalls (Native Bindings)

**When:** 2026-06-21 · **Fact:** `P-VJL254MX`
**Why:** Windows prevents overwriting files held open by processes; native Node bindings remain locked by running interpreters even after a process "exits" if the shared object is still referenced

<!-- decision:P-ZWDH5NKZ -->

## Kiro Configuration Structure: AGENTS.md, Not .claude/

**When:** 2026-06-21 · **Fact:** `P-ZWDH5NKZ`
**Why:** claude-memory-kit was generating unnecessary `.claude/` structure for Kiro projects, which Kiro ignores. Proper setup uses AGENTS.md at root only.

<!-- decision:P-PJP9Z4B4 -->

## Install System Dual-Agent Workflows (Cases A–D)

**When:** 2026-06-21 · **Fact:** `P-PJP9Z4B4`
**Why:** These four cases define the practical multi-agent usage patterns users will encounter. The install system must support all of them cleanly without manual workarounds or file litter.

<!-- decision:P-EGMSHW6X -->

## Install System Requirements Matrix (v0.4.0+)

**When:** 2026-06-21 · **Fact:** `P-EGMSHW6X`
**Why:** The install design is additive — Claude Code and Kiro coexist on the same repo. These requirements ensure neither agent's install mutates the other's surfaces and `context/` is treated as immutable.

<!-- decision:P-QURQGMAV -->

## Conservative uninstall scope — managed surfaces only, never `context/`

**When:** 2026-06-21 · **Fact:** `P-QURQGMAV`
**Why:** Minimizes accidental data loss and respects shared-brain architecture. Symmetric design makes tool behavior predictable and safe.

<!-- decision:P-AC75HR2B -->

## Semantic config is shared agent-neutral setting in `context/settings.json`

**When:** 2026-06-21 · **Fact:** `P-AC75HR2B`
**Why:** Semantic recall is a shared-brain feature. One config, one brain, both agents benefit. Idempotent setup prevents accidental loss of capability.

<!-- decision:P-NJW35EEG -->

## Confirms preference for 2-PR approach (PR-1 IDE surfaces, then PR-2 CLI hooks se

**When:** 2026-06-21 · **Fact:** `P-NJW35EEG`

<!-- decision:P-R6WKXMBK -->

## Values code reuse; questions why Kiro integration differs from Claude Code integ

**When:** 2026-06-21 · **Fact:** `P-R6WKXMBK`

<!-- decision:P-U5NUXZAU -->

## v0.4.0 release workflow: `npm run release -- minor` (assistant runs), then user

**When:** 2026-06-21 · **Fact:** `P-U5NUXZAU`

<!-- decision:P-QXMKJZGD -->

## Separate gate files per IDE to avoid conditionals (cut-gate.md for Claude Code,

**When:** 2026-06-21 · **Fact:** `P-QXMKJZGD`

<!-- decision:P-R5DMD4JK -->

## Coverage Gate Fix Workflow

**When:** 2026-06-21 · **Fact:** `P-R5DMD4JK`
**Why:** Systematic approach that addresses missing tests rather than superficial fixes; yields complete coverage.

<!-- decision:P-VXG4XGXP -->

## Log Sink Injection Pattern Across Install/Uninstall

**When:** 2026-06-21 · **Fact:** `P-VXG4XGXP`
**Why:** Allows tests to inject custom logging; maintains behavioral consistency across related tools.

<!-- decision:P-LKBB3BNU -->

## runUninstall Branch Coverage Map

**When:** 2026-06-21 · **Fact:** `P-LKBB3BNU`
**Why:** Missing branch coverage causes gate failure; all paths must be tested for SonarCloud to pass.

<!-- decision:P-9GBJ6NUQ -->

## SonarCloud Coverage Gate Threshold

**When:** 2026-06-21 · **Fact:** `P-9GBJ6NUQ`
**Why:** Hard constraint on the release process; future PRs will fail without adequate coverage.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ZV4H36YB -->

## Rebuild Global CMK CLI Binary (Release Process)

**When:** 2026-06-22 · **Fact:** `P-ZV4H36YB`
**Why:** The installed global binary is what gate tests validate and what IDE/CLI actually invoke. This rebuild ensures all merged fixes are live before live-test sessions.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-HRFKJPPC -->

## Release script correctly bumps version (0.3.5 → 0.4.0), updates CHANGELOG.md wit

**When:** 2026-06-21 · **Fact:** `P-HRFKJPPC`

<!-- decision:P-XPE6SMR3 -->

## Context files (MEMORY.md, INDEX.md, queues/review.md) are excluded from release

**When:** 2026-06-21 · **Fact:** `P-XPE6SMR3`

<!-- decision:P-YSEUSMB4 -->

## kiro-uninstall-husk-cleanup-followup

**When:** 2026-06-22 · **Fact:** `P-YSEUSMB4`
**Why:** Found dogfooding cmk uninstall --ide kiro on the dev repo (D-189). Empty husks are ugly and could confuse a user into thinking uninstall failed.

<!-- decision:P-Pa6U2LUB -->

## Fixed bugs in task-50-kiro-console-flash branch

**When:** 2026-06-22 · **Fact:** `P-Pa6U2LUB`
**Why:** Uninstall correctness and data-loss prevention are critical; these fixes are verified and ready

<!-- decision:P-X4FPE7CK -->

## Uninstall end-to-end verification results

**When:** 2026-06-22 · **Fact:** `P-X4FPE7CK`
**Why:** Answers the open question "does uninstall actually work?" with live-verified results; D-191/B1 was a real data-loss risk

<!-- decision:P-5HMMCC3F -->

## Code-Path Divergence Pattern in V0.4.0 Bug Fixes

**When:** 2026-06-22 · **Fact:** `P-5HMMCC3F`
**Why:** Indicates asymmetric feature coverage between Code and Kiro implementations. Understanding this pattern informs test strategy and code-review focus for remaining v0.4.0 work.

<!-- decision:P-4M7YD3MK -->

## Artifact rebuild for v0.4.0

**When:** 2026-06-22 · **Fact:** `P-4M7YD3MK`
**Why:** Deploy latest cross-agent fixes (D-185–191) to the global binary before running KH/KC live tests.

<!-- decision:P-ZC7V6VV7 -->

## v0.4.0 final gate — KH/KC live hook-firing tests

**When:** 2026-06-22 · **Fact:** `P-ZC7V6VV7`
**Why:** These test whether hooks actually fire in the real IDE/CLI — cannot be unit-tested.

<!-- decision:P-UERZGMVJ -->

## No Gitignore Changes for Memory System

**When:** 2026-06-22 · **Fact:** `P-UERZGMVJ`
**Why:** User's existing backup redundancy (Google Drive sync) already provides resilience. Adding more git-level logic post-incident introduces complexity without additional safety benefit and erodes trust after a scare.

<!-- decision:P-RE6969aV -->

## Data-Loss Bug Pattern: echo && rm Laundering

**When:** 2026-06-22 · **Fact:** `P-RE6969aV`
**Why:** This specific vulnerability pattern represents a real risk the project has encountered. Future reviews should watch for it.

<!-- decision:P-MJDKT4TT -->

## Guardrail Review Process: Two-Pass + Primary-Source Verification

**When:** 2026-06-22 · **Fact:** `P-MJDKT4TT`
**Why:** The two-pass review with primary-source verification is the project's quality gate for guardrail PRs.

<!-- decision:P-2BNaJT5X -->

## v0.4.0 Remaining Work

**When:** 2026-06-22 · **Fact:** `P-2BNaJT5X`
**Why:** Scopes the remaining v0.4.0 work so future sessions know what's left before release.

<!-- decision:P-4E9E9P42 -->

## Decision Logs and Context Checkpoints

**When:** 2026-06-22 · **Fact:** `P-4E9E9P42`
**Why:** With large codebases, Claude's context is periodically compressed. Decision logs and checkpoint files provide durable recovery points outside the conversation thread.

<!-- decision:P-Ua3U9EYU -->

## Markdown Link Case Sensitivity Issue

**When:** 2026-06-22 · **Fact:** `P-Ua3U9EYU`
**Why:** Linux CI runners enforce case-sensitive path matching, unlike Windows. Documentation links must match actual path case.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-BFMAB3GZ -->

## Windows PowerShell doesn't expand `*` in npm install paths; use explicit filenam

**When:** 2026-06-21 · **Fact:** `P-BFMAB3GZ`

<!-- decision:P-7N6aAPR6 -->

## User expects documentation (guides/CLAUDE.md) to be updated with real-run gotcha

**When:** 2026-06-21 · **Fact:** `P-7N6aAPR6`

<!-- decision:P-2WR6CWJQ -->

## Expressed concern about rebuild errors ("that is alot of errors") — skeptical of

**When:** 2026-06-21 · **Fact:** `P-2WR6CWJQ`

<!-- decision:P-79C7TQYP -->

## user questions why `.claude/` folder exists on kiro-gate — signals it's unexpect

**When:** 2026-06-21 · **Fact:** `P-79C7TQYP`

<!-- decision:P-A3U2RTF9 -->

## Removed old C:\Temp\kiro-gate directory; starting fresh install for Session 1 in

**When:** 2026-06-22 · **Fact:** `P-A3U2RTF9`

<!-- decision:P-ZTPYaJGJ -->

## No gitignore or transcript-commit changes to the memory system going forward.

**When:** 2026-06-22 · **Fact:** `P-ZTPYaJGJ`

<!-- decision:P-a7Wa5MDE -->

## Memory Review Discipline Before Commit

**When:** 2026-06-22 · **Fact:** `P-a7Wa5MDE`
**Why:** Manual review gates ensure auto-extracted facts are accurate, well-formed, and reflect genuine intent — prevents stale or incorrect captures from being recorded as durable knowledge.

<!-- decision:P-a3WZNTCG -->

## Doc-Completeness Validator — Hook Behavior Coverage Gap

**When:** 2026-06-22 · **Fact:** `P-a3WZNTCG`
**Why:** The guardrail shipped in #218 as a hook behavior but was missing from README and CLI docs. The validator only checked verb and tool coverage, not hook coverage, so the gap went undetected.

<!-- decision:P-PHFV2EYC -->

## Guardrail — Hook-Based Design vs. MCP Protection

**When:** 2026-06-22 · **Fact:** `P-PHFV2EYC`
**Why:** Readers and future maintainers may conflate the two protections. Clarity on implementation and scope prevents confusion about which layer is responsible for what.

<!-- decision:P-EYMP4U6F -->

## v0.4.0 Release Workflow — Gate Testing and Tag Push

**When:** 2026-06-22 · **Fact:** `P-EYMP4U6F`
**Why:** Kiro testing needs real IDE/CLI exercise. Tag push is user-controlled public action. Clear boundaries prevent deadlock.

<!-- decision:P-NARQETJP -->

## Kiro-Gate Testing Ritual: §0b (build) → §1 (fresh install) → Session 1

**When:** 2026-06-22 · **Fact:** `P-NARQETJP`
**Why:** This is the canonical gate for verifying the published npm artifact works end-to-end in a real environment before release

<!-- decision:P-3EUEDZV2 -->

## I do not run Kiro; Claude/assistant drives live Kiro sessions in this project

**When:** 2026-06-22 · **Fact:** `P-3EUEDZV2`

<!-- decision:P-SSM3G7RN -->

## Windows NPM EBUSY on Better-SQLite3 Lock — Expected and Harmless

**When:** 2026-06-22 · **Fact:** `P-SSM3G7RN`
**Why:** Gate test (§0b line 60-62) warns of this pattern. Understanding it prevents false alarms on Windows systems and future gate runs.

<!-- decision:P-F6GJP2QT -->

## Claude-Memory-Kit: 5 Surfaces Architecture

**When:** 2026-06-22 · **Fact:** `P-F6GJP2QT`
**Why:** Kit completeness and functionality depend on all 5 surfaces being present, configured, and connected. They form the "surface layer" of validation (distinct from the "3 tiers" depth model).

<!-- decision:P-Y4SVHUKL -->

## Claude-Memory-Kit: Health Check Suite (HC-1 through HC-9)

**When:** 2026-06-22 · **Fact:** `P-Y4SVHUKL`
**Why:** Health checks surface misconfigurations, missing setup, and version skew. They gate readiness and help triage failures.

<!-- decision:P-6GYCY7TY -->

## cmk install: Scaffolding and Wiring

**When:** 2026-06-22 · **Fact:** `P-6GYCY7TY`
**Why:** `cmk install` is the initialization step that scaffolds the kit and wires all integration points. Knowing what it creates is essential for validating completeness (via `cmk doctor`) and troubleshooting wiring issues.

<!-- decision:P-KL9G3TGV -->

## 4-Stage FastAPI Build Plan with Embedded Rules

**When:** 2026-06-22 · **Fact:** `P-KL9G3TGV`
**Why:** Session 1 workflow; captures reasoning in hooks for future sessions' context.

<!-- decision:P-FCN3SZZR -->

## Kiro + CMK Setup Checklist (Pre-Session-1)

**When:** 2026-06-22 · **Fact:** `P-FCN3SZZR`
**Why:** Hooks are file-written but not loaded in IDE until restart; must restart to activate capture layer.

<!-- decision:P-N6WZLTVT -->

## Automated Capture via agentStop Hook

**When:** 2026-06-22 · **Fact:** `P-N6WZLTVT`
**Why:** Core test of automation: hook must work without polluting user utterances with memory syntax

<!-- decision:P-XaK442KW -->

## Kiro Gate Testing Workflow

**When:** 2026-06-22 · **Fact:** `P-XaK442KW`
**Why:** KH1 is the core live validation — ensures memory capture is fully automated via hooks, requiring no manual memory syntax in user utterances

<!-- decision:P-TMFHERHX -->

## User confirmed verbatim sync of gate docs (commit ea1a5a8); established standard

**When:** 2026-06-22 · **Fact:** `P-TMFHERHX`

<!-- decision:P-65NMVNVA -->

## `cmk-guard-memory` is an internal hook binary, not a hand-run command (now clari

**When:** 2026-06-22 · **Fact:** `P-65NMVNVA`

<!-- decision:P-FTBVREBE -->

## Test suite scale: full suite 2223/0 (all pass), stress gate 5/5 (all pass)

**When:** 2026-06-22 · **Fact:** `P-FTBVREBE`

<!-- decision:P-Z27PS9PP -->

## cmake/cmk doctor validation passed all 11 file/config checks; ready for Session

**When:** 2026-06-22 · **Fact:** `P-Z27PS9PP`

<!-- decision:P-7G3EZ5HM -->

## Kiro IDE must be restarted after hook + MCP write to load them; open `C:\Temp\ki

**When:** 2026-06-22 · **Fact:** `P-7G3EZ5HM`

<!-- decision:P-ECF3UXBP -->

## Kiro Hook Trust Quirks & Design Lessons (D-194)

**When:** 2026-06-22 · **Fact:** `P-ECF3UXBP`
**Why:** These quirks represent edge cases + gotchas discovered in live testing; design principles prevent future bugs and security issues.

<!-- decision:P-QB9MR3MK -->

## Kiro Hook Trust System Configuration (D-194)

**When:** 2026-06-22 · **Fact:** `P-QB9MR3MK`
**Why:** Understanding the trust mechanism is essential for configuring Kiro hooks and avoiding "Run / Reject" prompts; the design preserves user customizations and prevents accidental overwrite.

<!-- decision:P-5J3RE6YQ -->

## Post-D194 artifact update workflow for Kiro trust fix verification

**When:** 2026-06-22 · **Fact:** `P-5J3RE6YQ`
**Why:** The Kiro IDE trust system requires kiroAgent.trustedCommands to be pre-configured in .vscode/settings.json. The D-194 fix adds this during cmk install --ide kiro. Pre-D-194 artifacts cannot exercise this behavior.

<!-- decision:P-DM9VMNBE -->

## D-194 Fix Merged to Main (PR #219, commit 96f57c9)

**When:** 2026-06-22 · **Fact:** `P-DM9VMNBE`
**Why:** This fix resolves the Run/Reject blocker. Live verification (KH-trust) requires the new code on disk, not the old artifact.

<!-- decision:P-aSFM9AR2 -->

## skill-md-yaml-colon-space-bug

**When:** 2026-06-22 · **Fact:** `P-aSFM9AR2`
**Why:** Found live in the v0.4.0 cut-gate-kiro (50.M) — 7th cross-agent cut-blocker, the Claude-tolerated/Kiro-strict class. KG4 only checked that Claude-only frontmatter keys were ABSENT, never that the YAML actually parses, so the gate missed it too.

<!-- decision:P-JVBPP36Z -->

## Strict YAML Validation — validate-skill-sources.mjs Enhancement

**When:** 2026-06-23 · **Fact:** `P-JVBPP36Z`
**Why:** Previous gap masked errors for months: Claude Code accepted invalid YAML while Kiro rejected it. This caused D-195. Strict validation upstream prevents cross-tool incompatibilities.

<!-- decision:P-TEBXURXZ -->

## Global `cmk` Artifact Version and Template Sync

**When:** 2026-06-23 · **Fact:** `P-TEBXURXZ`
**Why:** The global artifact and main branch can drift, so a fresh reinstall does not guarantee you get the latest template. This sync lag is especially problematic when testing fixes in a gate or test environment.

<!-- decision:P-GATV2CKW -->

## SKILL.md Description Block Scalar Format

**When:** 2026-06-23 · **Fact:** `P-GATV2CKW`
**Why:** Block scalars are the correct YAML format for multi-line text. Using plain strings breaks strict YAML validation.

<!-- decision:P-WFF3CFAa -->

## YAML Validator Lenient Parser Blind Spot

**When:** 2026-06-23 · **Fact:** `P-WFF3CFAa`
**Why:** Custom parsers can be dangerously lenient and hide real validation bugs, especially risky for YAML where strictness matters.

<!-- decision:P-Z9KHPV72 -->

## CI Lint Check Configuration

**When:** 2026-06-23 · **Fact:** `P-Z9KHPV72`
**Why:** Previously, lint checks existed but were invisible (buried in the full test suite) and used a lenient parser. The new explicit, fast-failing CI job provides immediate feedback and makes lint failures visible in PR status checks.

<!-- decision:P-DTVMCA59 -->

## Precise, Domain-Aware Validators Over Generic Tools

**When:** 2026-06-23 · **Fact:** `P-DTVMCA59`
**Why:** Generic linters do not understand the kit's contracts (SKILL.md structure, Kiro integration); precise, custom validators catch errors that off-the-shelf tools would miss.

<!-- decision:P-WMRV9JB5 -->

## Linting Memory Files Produces Excessive Noise

**When:** 2026-06-23 · **Fact:** `P-WMRV9JB5`
**Why:** Machine-generated memory has formatting constraints different from hand-authored docs. The kit deliberately ships memory templates with formatting that linters would flag. Linting them misidentifies intentional structure as violations.

<!-- decision:P-ECVPNG2R -->

## Markdown/YAML/Spell Linting Disabled in CI by Design

**When:** 2026-06-23 · **Fact:** `P-ECVPNG2R`
**Why:** Documented architectural decision that prevents accidental reintroduction of generic linters. Explains why actionlint + ShellCheck are the right CI additions (they don't touch memory files).

<!-- decision:P-Da3BNKFC -->

## user-ci-lints-memory-files-gap

**When:** 2026-06-23 · **Fact:** `P-Da3BNKFC`
**Why:** Surfaced by the user 2026-06-23: "if our memory files can not be inspected by a linter, then whoever uses this kit is going to have the same problem... at my work CI/CD my linter doesn't do a distinction, and it will flag our files." A real adoption blocker — not hypothetical (the user's own workplace CI). Never raised/decided before (checked DECISION-LOG + research).

<!-- decision:P-9TRG76ST -->

## scratchpad-inline-html-provenance-is-the-lint-outlier

**When:** 2026-06-23 · **Fact:** `P-9TRG76ST`
**Why:** The user pushed: "it cant be that we are so stupidly unique... dont just check their lint config, check their memory output." The actual-file check (6 cloned systems in /c/tmp) proved them right and narrowed the problem: our fact files match the field; only our scratchpad inline-comment provenance diverges + trips linters (MD033 inline-HTML, MD041 first-line-not-H1, MD013 long lines).

<!-- decision:P-7NRWT77M -->

## User has realized that kit users will encounter the same linter-failure problem,

**When:** 2026-06-23 · **Fact:** `P-7NRWT77M`

<!-- decision:P-EPA4NQEK -->

## User's CI linter does not distinguish or exempt context/ files — all files are s

**When:** 2026-06-23 · **Fact:** `P-EPA4NQEK`

<!-- decision:P-H332ZKHJ -->

## memory-lint-portability-research-28-projects

**When:** 2026-06-23 · **Fact:** `P-H332ZKHJ`
**Why:** The user (correctly) pushed back that the earlier conclusion rested on only 6 repos with no web research: "did you check more than 20? deep research on the web? actual code, configs, memory files, outputs?" The full research corrected a real error (MD033 false premise) and grounded the fix in ecosystem-canonical practice + a 28-project primary-source survey.

<!-- decision:P-S43CB7UN -->

## Expects claims substantiated through source inspection (code, configs, memory fi

**When:** 2026-06-23 · **Fact:** `P-S43CB7UN`

<!-- decision:P-VDSWaMS4 -->

## Lint Exemption for Committed Memory Files

**When:** 2026-06-23 · **Fact:** `P-VDSWaMS4`
**Why:** Memory format uses inline comments for per-bullet provenance lifecycle. Markdownlint rules MD041 + MD013 flag these. Disable-directive signals "tool-managed file" (standard in ecosystem) and aligns with how other projects handle generated markdown.

<!-- decision:P-VMVAYVHJ -->

## adr-0009-inline-provenance-was-deliberate-but-lint-cost-unweighed

**When:** 2026-06-23 · **Fact:** `P-VMVAYVHJ`
**Why:** The user challenged the 'we're ahead of the field' framing as rationalization: 'this could also mean we took the wrong turn... they didn't do a convoluted way, they did it how md/yaml/json work.' Reading ADR-0009 showed the truth is BOTH: deliberate trade-off (token budget) AND a cost (lint-portability) the original decision never weighed. Honest reconciliation, not defense.

<!-- decision:P-R7YX4WLU -->

## Challenges the reasoning: "they avoid it" ≠ "we're ahead"; other systems may sim

**When:** 2026-06-23 · **Fact:** `P-R7YX4WLU`

<!-- decision:P-7PAWD7H5 -->

## Prefers solutions aligned with format/system design naturally, not workarounds f

**When:** 2026-06-23 · **Fact:** `P-7PAWD7H5`

<!-- decision:P-CAKHLMRY -->

## scratchpad-provenance-format-RESOLVED-keep-inline

**When:** 2026-06-23 · **Fact:** `P-CAKHLMRY`
**Why:** The user refused to defer the design question (rightly — deferral = it dies, like Task 150) and demanded real research over my framing: 'deep research on best practices, other projects, anything... the original thinking isn't wrong, just how we did it.' The research vindicated the original mechanism AND corrected a real error in our docs (MD033/MD041 don't fire) — so the decision is now evidence-grounded, not opinion.

<!-- decision:P-GAPEQDQ3 -->

## real-markdownlint-output-on-memory-MD007-not-MD013

**When:** 2026-06-23 · **Fact:** `P-GAPEQDQ3`
**Why:** The user insisted on checking actual outputs over theory ('check their memory output... actual code'). Running real markdownlint proved the provenance comment trips MD007 (indentation), NOT the MD013/MD033/MD041 the entire thread (and CLAUDE.md, and the research agents) assumed. Ground truth beats convergent theory.

<!-- decision:P-Q3FHXP5B -->

## Memory Format Linting Fix (MD007)

**When:** 2026-06-23 · **Fact:** `P-Q3FHXP5B`
**Why:** Original decision (ADR-0009) was made on incomplete information. Real linter output differs from theory. This fix uses linter's intended mechanism (per-directory config), not a workaround.

<!-- decision:P-9LA7PNVS -->

## User explicitly states: decide design questions now, not later. Deferral leads t

**When:** 2026-06-23 · **Fact:** `P-9LA7PNVS`

<!-- decision:P-AQEa5CEM -->

## md007-is-model-output-indent-not-provenance-format

**When:** 2026-06-23 · **Fact:** `P-AQEa5CEM`
**Why:** The user pushed back on 'just ignore all memory files = the fix'. Reading the actual MD007 lines proved the provenance format is innocent — the errors are auto-extract model output (2-space sublists, bare URLs). This reframes the fix from 'exempt our format' to 'either relax prose-rules for data files OR make the model output lint-clean'.

<!-- decision:P-BaBYLP4N -->

## Fix Auto-Extract Output Quality, Not Just Lint Config

**When:** 2026-06-23 · **Fact:** `P-BaBYLP4N`
**Why:** The memory files don't fail because of the kit format; they fail because auto-extract prose is unpolished. Fixing the tool's output quality is more principled than configuring away linter rules.

<!-- decision:P-ER7TUY96 -->

## User rejected "ignore all memory files" as a valid fix — confirms that blanket d

**When:** 2026-06-23 · **Fact:** `P-ER7TUY96`

<!-- decision:P-L6WGWP39 -->

## User wants Super-Linter run on claude-memory-kit repo with all rules ON, no supp

**When:** 2026-06-23 · **Fact:** `P-L6WGWP39`

<!-- decision:P-U2AD3CX4 -->

## Super-Linter Ground-Truth Validation

**When:** 2026-06-23 · **Fact:** `P-U2AD3CX4`
**Why:** Actual linter output is definitive; theorizing without empirical data is incomplete

<!-- decision:P-6aN7PGVG -->

## super-linter-real-run-1058-md-findings-context-included

**When:** 2026-06-23 · **Fact:** `P-6aN7PGVG`
**Why:** The user demanded I run the REAL super-linter product instead of theorizing ('why are you theorizing... you can check docs and do live checks'). The run proved: code/workflows/yaml/json are clean (actionlint etc. find nothing), but markdown has 1058 findings incl. 824 in context/ — dominated by MD022 (842) from the compact heading style in both docs and committed memory. The provenance comments are innocent; the heading/list/URL STYLE is the real lint surface.

<!-- decision:P-Y77aBUFL -->

## Super-Linter Results and `.markdownlint.json` Fix

**When:** 2026-06-23 · **Fact:** `P-Y77aBUFL`
**Why:** Real tool evidence proves memory tier markdown collides with default rules. Users get hundreds of lint warnings immediately on kit install. A shipped `.markdownlint.json` unblocks adoption.

<!-- decision:P-MY52BNZ4 -->

## lint-clean-memory-output-plan-and-progress

**When:** 2026-06-23 · **Fact:** `P-MY52BNZ4`
**Why:** The user rejected 'relax the cosmetic rules' in favor of 'just fix it — emit correct markdown, add rules to the skill so the AI writes md the right way.' Right call: fixing at source means no config to ship, no exemption to explain, and the memory is genuinely clean markdown like every other system. Captured durably because the user explicitly warned this kind of task gets deferred-and-lost (like Task 150) — it must not.

<!-- decision:P-F5LRAPF3 -->

## lint-clean-full-process-directive

**When:** 2026-06-23 · **Fact:** `P-F5LRAPF3`
**Why:** The user rejected both 'relax the rules' and a rushed multi-file patch; wants the kit's own disciplined process (plan→design→tasks→TDD→implement→test→review) on the full 38-file format-contract surface, done locally due to flaky internet.

<!-- decision:P-HVLU2aLG -->

## read-side-audit-blank-in-pair-catastrophic-search-bug

**When:** 2026-06-23 · **Fact:** `P-HVLU2aLG`
**Why:** The user demanded the FULL surface (write + read + add/update/remove). The read-side audit proved the safe fix (blank-around-headings) is safe everywhere, the dangerous changes (blank-in-bullet-pair, bullet reindent) must NEVER happen, and surfaced a pre-existing LIVE bug (search.mjs retraction detection broken since DECISIONS.md went to ##). This is the safety map the whole reformat depends on.

<!-- decision:P-TR9J39LM -->

## Stress Test Gating Rule for PR Approval

**When:** 2026-06-23 · **Fact:** `P-TR9J39LM`
**Why:** Stress testing is critical for regression prevention. The jitter exception rule prevents random failures in unrelated code paths from incorrectly blocking PRs while ensuring real regressions are caught.

<!-- decision:P-4WTWMTaK -->

## stress-flake-self-induced-load-not-regression

**When:** 2026-06-23 · **Fact:** `P-4WTWMTaK`
**Why:** During Task 164's pre-PR stress gate, two 4/5 runs with different unrelated timing tests looked alarming but were machine-load artifacts from running stress alongside other background work — not a code regression. Worth recording so a future session doesn't misread a load-flake as a real concurrency bug (or waste the two-consecutive-clears clause on the wrong failure class).

<!-- decision:P-EaGXETZL -->

## v0.4.0 Local Installation Workflow

**When:** 2026-06-23 · **Fact:** `P-EaGXETZL`
**Why:** v0.4.0 bundles all durable fixes (SKILL.md valid YAML, Kiro hooks pre-trusted, memory lint-clean). Local install confirms artifact before publishing.

<!-- decision:P-4HZAJ9X9 -->

## Backup Strategy for Kiro Gate Testing

**When:** 2026-06-23 · **Fact:** `P-4HZAJ9X9`
**Why:** The Kiro gate test requires a clean environment without existing user config, but the real config and credentials must remain restorable. This approach enables both safely.

<!-- decision:P-7MZ3G4EN -->

## §1 Gate Run Verification — Expected Health Checks and Session 1 Handoff

**When:** 2026-06-23 · **Fact:** `P-7MZ3G4EN`
**Why:** The gate run proved all three blockers are fixed and working (D-195 SKILL.md valid, D-194 trusted-commands, Task 164 memory lint-clean). Silent hook firing is the critical confirmation before Session 1 proceeds.

<!-- decision:P-EJFDYMR9 -->

## task-164-followup-claude-md-template-md022

**When:** 2026-06-23 · **Fact:** `P-EJFDYMR9`
**Why:** Found while running the regular cut-gate (cut-gate18) on the post-Task-164 artifact. Task 164.8 made the 6 MEMORY/SOUL/USER/HABITS/LESSONS/INDEX templates lint-clean but didn't include CLAUDE.md.template (a Claude-Code instruction file, not a memory tier). The regression guard (checkTemplateLintClean) also doesn't cover it.

<!-- decision:P-RBRAJMPX -->

## kiro-mcp-autoapprove-missing-cut-blocker

**When:** 2026-06-23 · **Fact:** `P-RBRAJMPX`
**Why:** Found live by the user in Kiro Session 1: hooks auto-run (D-194 works) but MCP tool calls (mk_remember etc.) still prompt Reject/Trust/Run because Kiro has a SEPARATE trust gate for MCP tools vs shell hooks. The kit never wired it. User clicked Trust manually and asked to add it to the template.

<!-- decision:P-NFH69QSF -->

## MCP Tool Auto-Approve (D-196) Merged But Requires Artifact Rebuild for Live Sessions

**When:** 2026-06-23 · **Fact:** `P-NFH69QSF`
**Why:** D-196 is the 8th cross-agent gate cut-blocker. Live session proved 4 prior fixes work. MCP-tool approval test verifies config-level fix—final piece before shipping. Deferring rebuild keeps Session 1 feedback loop tight.

<!-- decision:P-2B64YN7R -->

## resume-v0-4-0-kiro-gate-8-fixes-shipped

**When:** 2026-06-23 · **Fact:** `P-2B64YN7R`
**Why:** Context hit 2% — checkpoint so the next session resumes the v0.4.0 Kiro live-gate exactly here without re-deriving. All 8 cross-agent cut-blockers found+fixed this session are merged; only the live Kiro session + tag-push remain (both user-driven).

<!-- decision:P-FD93HDaQ -->

## kiro-live-test-session1-d194-d196-proven

**When:** 2026-06-23 · **Fact:** `P-FD93HDaQ`
**Why:** The cut-gate-kiro 50.M live test — the surfaces unit tests can't reach. Session 1 on the post-D-196 artifact proved the hooks AND the MCP tools both run prompt-free by config (no manual Trust clicks), which is the whole point of D-194+D-196. Last session M1 prompted; this session it's silent.

<!-- decision:P-V63LVV3H -->

## kiro-session1-complete-wedge-proven-live

**When:** 2026-06-23 · **Fact:** `P-V63LVV3H`
**Why:** Session 1 of the cut-gate-kiro live test (50.M). Beyond the D-194/D-196 prompt-free proofs, it proved the WEDGE (cross-project promotion via mk_lessons_promote), rich linked facts, and memory-aware conflict-detection all work in a REAL Kiro session — the deep features unit tests can't reach.

<!-- decision:P-3G3D55C9 -->

## Kiro CLI V3 Trust-Model Incompatibility (V2 Config Format)

**When:** 2026-06-23 · **Fact:** `P-3G3D55C9`
**Why:** This is a version transition issue as Kiro shipped V3 early-access mid-flight. The kit's terminal surface remains functional, but version-specific behavior requires updating config. KC1 and KC2 gate proofs confirm the kit's core injection and memory recall work; V3 CLI just needs config format migration.

<!-- decision:P-XPYaGJU4 -->

## kiro-cli-allowedtools-doc-correct-but-still-prompts

**When:** 2026-06-23 · **Fact:** `P-XPYaGJU4`
**Why:** Corrects my earlier WRONG 'V3' finding (the banner was an ad; kiro-cli is 2.8.1). The real gap: allowedTools:@cmk is doc-verified-correct format yet the MCP tool still prompts in kiro-cli, while the IDE autoApprove works. A genuine kiro-cli MCP-trust gap to diagnose, but not a v0.4.0 blocker.

<!-- decision:P-GMNRDK7C -->

## kg-guard-kiro-cli-two-gates-rm-rewritten-to-removeitem

**When:** 2026-06-23 · **Fact:** `P-GMNRDK7C`
**Why:** The live KG-guard test (D-192/193 in kiro-cli). Surfaced that (a) kiro-cli has its OWN shell-approval gate before our preToolUse guard, and (b) the model rewrites rm -rf → Remove-Item on Windows — which our guard's dual-pattern coverage already anticipates. Awaiting the post-approval result to confirm our guard fires.

<!-- decision:P-JHJXFDBJ -->

## kg-guard-FAILED-matcher-pipe-alternation-not-literal

**When:** 2026-06-23 · **Fact:** `P-JHJXFDBJ`
**Why:** The live KG-guard test FAILED — our delete-guardrail let a Remove-Item delete context/sessions in kiro-cli. Root-caused to the preToolUse matcher being a pipe-alternation ("execute_bash|executeBash|shell") when kiro-cli matchers are LITERAL strings (no alternation) — so it matched nothing and never fired. Exactly the D-193 I3 risk. A real v0.4.0 cut-blocker on a headline safety feature.

<!-- decision:P-HaQ9X72G -->

## kiro-cli PreToolUse Matcher Syntax (Literal Strings Only)

**When:** 2026-06-23 · **Fact:** `P-HaQ9X72G`
**Why:** PR #224 discovered this during guardrail testing; the bug went undetected until explicitly tested, confirming it was a critical cut-blocker.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-9UJBANXP -->

## Should run the actual tool (ground truth) FIRST, rather than theorizing beforeha

**When:** 2026-06-23 · **Fact:** `P-9UJBANXP`

<!-- decision:P-PCW3J9PX -->

## Prefers to continue pushing through complex multi-step work rather than pausing

**When:** 2026-06-23 · **Fact:** `P-PCW3J9PX`

<!-- decision:P-GZG5U2PN -->

## Standard gate procedure includes `cmk install --with-semantic` to enable semanti

**When:** 2026-06-23 · **Fact:** `P-GZG5U2PN`

<!-- decision:P-GE2TD65T -->

## User manually approved MCP tool by clicking "always add it" button (workaround f

**When:** 2026-06-23 · **Fact:** `P-GE2TD65T`

<!-- decision:P-7TMEXMA3 -->

## User is not on Kiro CLI V3; user is on kiro-cli 2.8.1 (the V3 banner was just an

**When:** 2026-06-23 · **Fact:** `P-7TMEXMA3`

<!-- decision:P-WEMBP2VE -->

## executed the permission test to validate guardrail behavior

**When:** 2026-06-23 · **Fact:** `P-WEMBP2VE`

<!-- decision:P-5GY3KT29 -->

## Expects tool recommendations backed by verification of actual tool behavior, not

**When:** 2026-06-23 · **Fact:** `P-5GY3KT29`

<!-- decision:P-Ra5D4F96 -->

## Actual linter output is MD007 (not assumed MD013/MD033/MD041); fix: committed co

**When:** 2026-06-23 · **Fact:** `P-Ra5D4F96`

<!-- decision:P-Z3BU5T69 -->

## User identified genuine cost (lint-portability) not originally weighed in inline

**When:** 2026-06-23 · **Fact:** `P-Z3BU5T69`

<!-- decision:P-53VHE5Z6 -->

## PR #224 opened with guardrail fix (matcher syntax corrected from pipe-alternatio

**When:** 2026-06-23 · **Fact:** `P-53VHE5Z6`

<!-- decision:P-AD7CZaKC -->

## Uses `failure#` naming convention for failed experiment directories — renamed ki

**When:** 2026-06-23 · **Fact:** `P-AD7CZaKC`

<!-- decision:P-C6YZVTNX -->

## Dogfood Memory Architecture — Session Recall vs. Authoritative Docs

**When:** 2026-06-23 · **Fact:** `P-C6YZVTNX`
**Why:** This separation avoids polluting the authoritative record with session scaffolding while preserving the option to capture valuable session context. Manual commits keep signal-to-noise ratio high in the repo.

<!-- decision:P-AAXE5QX3 -->

## D-197 Delete-Guardrail Matcher Fix (PR #224, Commit 0dae3f3)

**When:** 2026-06-23 · **Fact:** `P-AAXE5QX3`
**Why:** The old matcher pattern failed to consistently intercept delete commands. The wildcard matcher is more robust and catches all deletion attempts.

<!-- decision:P-CJ556YPJ -->

## D-197 End-to-End Live Re-test Workflow

**When:** 2026-06-23 · **Fact:** `P-CJ556YPJ`
**Why:** This workflow is the only proof that the guard fix works live in the real Kiro environment. Unit tests pass, but this test confirms the config, artifact, and hook integration all work end-to-end.

<!-- decision:P-G39LPLQG -->

## kg-guard-retest-failed-was-stale-artifact-not-fix

**When:** 2026-06-23 · **Fact:** `P-G39LPLQG`
**Why:** Prevents misreading the D-197 re-test: the matcher '*' fix is correct on main, but the live test ran the STALE pre-merge installed cmk (old pipe-string matcher), so it failed. Not a fix failure — a deploy gap. The live-test-current-repo-code rule applied to the install artifact.

<!-- decision:P-GHNBU9J4 -->

## Live KG-guard Config Location and Verification

**When:** 2026-06-23 · **Fact:** `P-GHNBU9J4`
**Why:** KG-guard reads this live config, not the source code. An outdated config means the test exercises old behavior even if the code was fixed.

<!-- decision:P-ESQMFH5J -->

## Testing Workflow for claude-memory-kit Fixes

**When:** 2026-06-23 · **Fact:** `P-ESQMFH5J`
**Why:** Until you rebuild the tgz after a merge, every live test runs pre-merge code. Testing against a stale global install will fail even if the fix is correct in the repository.

<!-- decision:P-KZ5YCCGB -->

## guard-code-proven-correct-ps-pipe-exit0-was-artifact

**When:** 2026-06-23 · **Fact:** `P-KZ5YCCGB`
**Why:** Corrects a scary mid-diagnosis false alarm: a PowerShell-pipe exit-0 made it look like the delete-guard logic was broken even in the current build. It is NOT — proven 3 ways (in-process block, file-redirect bin block exit 2, dev-repo guard blocking my own commands live). The live KG-guard failure was purely the stale installed artifact (old pipe-string matcher), which the merged '*' fix + a rebuild resolves.

<!-- decision:P-36CEKTXX -->

## better_sqlite3 EPERM Cleanup Warning

**When:** 2026-06-23 · **Fact:** `P-36CEKTXX`
**Why:** This warning is expected/ignorable—failure during cleanup doesn't mean the build or installation failed. Knowing this prevents unnecessary troubleshooting or reinstallation attempts in future testing cycles.

<!-- decision:P-2J2UHV2L -->

## kg-guard-still-fails-with-star-matcher-hook-not-firing-or-env-payload

**When:** 2026-06-23 · **Fact:** `P-2J2UHV2L`
**Why:** The '*' matcher fix (D-197) did NOT make KG-guard pass — matcher confirmed '*' live, bin proven to block, yet kiro-cli still deleted memory. Root cause is now genuinely uncertain between (H1) '*' not honored → use literal 'execute_bash', and (H2) kiro-cli 2.8.1 passes the payload via _HOOK_EVENT env var not stdin → our stdin-reading bin fail-opens. Must instrument to decide, not guess. The guardrail is a headline safety feature still broken in kiro-cli.

<!-- decision:P-LTKSACUC -->

## KG-guard kiro-cli failure — diagnosis plan (D-197 incomplete)

**When:** 2026-06-23 · **Fact:** `P-LTKSACUC`
**Why:** Root cause unknown; hypothesis-driven diagnosis settles the issue in one test cycle vs. continued guessing.

<!-- decision:P-YXPPE2Z7 -->

## TRUE-root-cause-kiro-cli-agent-config-wrong-location-no-hooks-fire

**When:** 2026-06-23 · **Fact:** `P-YXPPE2Z7`
**Why:** The instrumented probe proved NO hooks fire in kiro-cli, and `kiro-cli agent list` showed the active agent is the built-in 'kiro_default' from ~/.kiro/agents/ — while the kit writes q_cli_default.json to the OLD ~/.aws/amazonq/cli-agents/ location that 2.8.1 ignores. This supersedes D-197's incomplete 'matcher' root cause: the real bug is the config LOCATION + default-agent resolution, which is why the guard, agentSpawn, and stop hooks all silently never ran. A real v0.4.0 cut-blocker for the kiro-cli surface.

<!-- decision:P-EC97GY7E -->

## d198-fix-built-kiro-dir-location-open-file-uri-resolution-question

**When:** 2026-06-24 · **Fact:** `P-EC97GY7E`
**Why:** The real root-cause fix (D-198: agent config to ~/.kiro/agents/ + cli.json default registration) is built, unit-green, and SCHEMA-validated against real kiro-cli (which caught the includeMcpJson dup + the managedBy rejection). But a runtime path-resolution question remains: kiro-cli resolves file:// resources relative to the agent-file dir, which would break our project-root AGENTS.md/steering refs — must verify before claiming inject works.

<!-- decision:P-XNG4DaB2 -->

## kiro-cli-rejects-bom-in-agent-config-ps-convertto-json-adds-it

**When:** 2026-06-24 · **Fact:** `P-XNG4DaB2`
**Why:** A BOM from PowerShell ConvertTo-Json broke the live cmk agent ('invalid agent config' → fell back to kiro_default), looking like the D-198 fix failed when it hadn't. kiro-cli's own config reader is NOT BOM-tolerant (the inverse of the kit's D-187 read-tolerance). The kit writes clean UTF-8 so production is unaffected; only hand-editing via PowerShell injects the BOM.

<!-- decision:P-9DYNAHaZ -->

## Kiro-CLI Agent Configuration and Verification

**When:** 2026-06-24 · **Fact:** `P-9DYNAHaZ`
**Why:** Configuration location and verification approach are essential for kiro-cli agent setup debugging and fix validation

<!-- decision:P-WZMQDPUU -->

## D-198 Fix — agentSpawn Hook Now Fires

**When:** 2026-06-24 · **Fact:** `P-WZMQDPUU`
**Why:** Confirms the fix resolved the "agent cmk not found" issue; agent resolution now works correctly

<!-- decision:P-RVCKGMZV -->

## Hook Payload Delivery — stdin, Not Environment

**When:** 2026-06-24 · **Fact:** `P-RVCKGMZV`
**Why:** Clarifies payload delivery mechanism; guides how to capture/parse hooks in probes or guards

<!-- decision:P-BKZ97QGE -->

## d198-proven-agentspawn-fires-but-pretooluse-not-on-2.9.0-execute-command-rename

**When:** 2026-06-24 · **Fact:** `P-BKZ97QGE`
**Why:** D-198 (the location fix) is PROVEN correct — agentSpawn fires, cmk is the resolved default. But on kiro-cli 2.9.0 the shell tool was renamed execute_bash→execute_command and preToolUse did not fire even with matcher '*'; the docs still say execute_bash so they lag the binary. The guardrail leg's live status on 2.9.0 is the last open question; agentSpawn/inject/capture work.

<!-- decision:P-6JXPBCLV -->

## kiro-cli 2.9.0 Tool Renaming and preToolUse Matcher Configuration

**When:** 2026-06-24 · **Fact:** `P-6JXPBCLV`
**Why:** The hook location fix (D-198) was confirmed correct, but hooks weren't firing because the matcher didn't align with the actual 2.9.0 tool name. This explains the discrepancy between docs and runtime behavior.

<!-- decision:P-WS9FXPZK -->

## FINAL-kiro-cli-v3-redesigned-hooks-pretooluse-superseded-by-permissions-yaml

**When:** 2026-06-24 · **Fact:** `P-WS9FXPZK`
**Why:** Definitive: the kiro-cli guardrail can't work via preToolUse on 2.9.0 because V3 redesigned hooks (breaking change: standalone .kiro/hooks/*.json + PascalCase triggers + permissions.yaml for tool-blocking). Our V2 embedded preToolUse is unsupported for blocking there. BUT D-198's location fix is proven correct — agentSpawn/stop fire, so capture+inject (the core memory value) work on V3. D-198 ships; the guardrail-on-V3 is a separate follow-up.

<!-- decision:P-U5QSXFNa -->

## d198-shipped-pr225-kiro-cli-capture-inject-proven-live

**When:** 2026-06-24 · **Fact:** `P-U5QSXFNa`
**Why:** D-198 (the real root-cause fix for kiro-cli hooks not firing) is built, two-pass-reviewed, and PROVEN live (agentSpawn fires, cmk is the resolved default). Capture+inject — the core automatic-memory value — now work on kiro-cli. Shipped to PR #225. The guardrail-on-V3 gap is consciously deferred to Task 166 with Kiro's native fallback documented honestly.

<!-- decision:P-NSAE3H4P -->

## Agent capture/inject proven live across Claude Code, Kiro IDE, and kiro-cli

**When:** 2026-06-24 · **Fact:** `P-NSAE3H4P`
**Why:** Confirms core functionality works; unblocks v0.4.0 finalization after E1 (cold-open) and KU1/KU2 (uninstall flows).

<!-- decision:P-LZZa6KWT -->

## kiro-cli agent config reads from ~/.kiro/agents/ (not ~/.aws/amazonq/cli-agents/)

**When:** 2026-06-24 · **Fact:** `P-LZZa6KWT`
**Why:** Root cause of "cmk agent not firing in kiro-cli" despite D-197's logic fix being correct; explains the "dead file" symptom. Critical for debugging agent-not-found issues going forward.

<!-- decision:P-FM4YBQNC -->

## Kiro V3 hooks redesigned; first-class delete-guard fallback to shell-approval

**When:** 2026-06-24 · **Fact:** `P-FM4YBQNC`
**Why:** Breaking platform change; scopes v0.4.0 functionality and expectation. Honest limitation worth documenting rather than shipping broken behavior.

<!-- decision:P-CSJNFQaK -->

## User wants direct, hands-on verification before accepting completion — "i didnt

**When:** 2026-06-24 · **Fact:** `P-CSJNFQaK`

<!-- decision:P-2SPaSRR7 -->

## Gate Guides as Standalone Documentation Siblings

**When:** 2026-06-24 · **Fact:** `P-2SPaSRR7`
**Why:** Modularity ensures users can follow ONE gate variant without needing to understand or reference the others. Each guide is a complete, independent resource.

<!-- decision:P-2XR9VMNM -->

## kiro-cli Agent Configuration and Debugging Techniques

**When:** 2026-06-24 · **Fact:** `P-2XR9VMNM`
**Why:** Each check/technique corresponds to a real bug discovered this session (D-198, BOM corruption, location misdiagnosis). Baking them into the gate prevents re-discovery in future debugging.

<!-- decision:P-A26UKEUT -->

## Prefers gate guides as standalone siblings without cross-references between Clau

**When:** 2026-06-24 · **Fact:** `P-A26UKEUT`

<!-- decision:P-THB4NE6Z -->

## EBUSY Lock on better_sqlite3.node During Global Install

**When:** 2026-06-24 · **Fact:** `P-THB4NE6Z`
**Why:** Prior session's install "succeeded" but left stale code due to EBUSY; npm output is misleading. The verify check prevents repeating this silent failure.

<!-- decision:P-ETG53B43 -->

## npm install works with Claude Code open in this repo

**When:** 2026-06-24 · **Fact:** `P-ETG53B43`
**Why:** User feedback + repeated successful pattern validate this as safe; file-locking concerns do not apply here

<!-- decision:P-Q7YRKUF6 -->

## User always reinstalls npm while Claude Code is open; established workflow that

**When:** 2026-06-24 · **Fact:** `P-Q7YRKUF6`

<!-- decision:P-9LPPCKBT -->

## kiro-cli-hook-cmd-exe-popup-window-flash-ux-bug

**When:** 2026-06-24 · **Fact:** `P-9LPPCKBT`
**Why:** The clean gate surfaced a real UX bug: kiro-cli hooks flash a visible cmd.exe console window every fire on Windows because the command is `cmd.exe /c cmk hook`. The cmd.exe wrapper exists for the IDE's WSL hop but is shared with the CLI agent, which may not need it. Annoying for every kiro-cli user on Windows.

<!-- decision:P-G3VXJKVP -->

## User encountered annoying popup when running kiro-cli and wants it removed

**When:** 2026-06-24 · **Fact:** `P-G3VXJKVP`

<!-- decision:P-CGEE2XSH -->

## kiro-cli-popup-real-cause-cmk-is-npm-shim-not-exe-mcp-and-hook-spawns-flash

**When:** 2026-06-24 · **Fact:** `P-CGEE2XSH`
**Why:** The popup is NOT just the hook's cmd.exe/c (removing it didn't help). The real cause: cmk is an npm .ps1/.cmd shim (no native cmk.exe), so every kiro-cli launch of cmk — the MCP server AND hooks — gets shell-wrapped by Windows and flashes a console window (both cmd.exe + PowerShell). A Windows-shim interaction, needs a real fix (hidden-window shim, native exe, or a kiro-cli setting), not a config tweak.

<!-- decision:P-FK5RXGDE -->

## kiro-cli spawns MCP in cmd.exe wrapper; Claude Code spawns headless

**When:** 2026-06-24 · **Fact:** `P-FK5RXGDE`
**Why:** Understanding the spawn mechanism directs the fix strategy — it's a launcher integration problem, not an MCP problem

<!-- decision:P-44DQF4BX -->

## node-direct MCP invocation workaround — applied but unvalidated in kiro-cli UI

**When:** 2026-06-24 · **Fact:** `P-44DQF4BX`
**Why:** Attempting to eliminate the cmd.exe window on startup without modifying kiro-cli's launcher

<!-- decision:P-UAFX77EF -->

## kiro-cli-popup-fix-is-task81-node-direct-windowshide-pattern-already-in-kit

**When:** 2026-06-24 · **Fact:** `P-UAFX77EF`
**Why:** Corrects my wrong claim that Claude Code never had the popup. It DID — Task 81 fixed it with node-direct (process.execPath + .mjs path, never the cmk shim) + windowsHide. The kiro-cli MCP + hook popups are the SAME root cause (cmk is an npm shim Windows wraps in cmd.exe) and take the SAME established fix. This makes the kiro-cli popup a clean code fix following the kit's own proven pattern, not a new invention.

<!-- decision:P-GELYMC3Q -->

## kiro-cli-mcp-popup-is-6th-cross-agent-instance-mcp-command-never-node-direct

**When:** 2026-06-24 · **Fact:** `P-GELYMC3Q`
**Why:** The docs trail (Task 81 + D-190) shows the popup class was fixed twice — but only for the lazy-compress detached spawn, NEVER for the MCP server registration (still command:'cmk' in install-agent.mjs + install-kiro.mjs). Claude Code tolerates command:'cmk' (headless spawn); kiro-cli wraps it in cmd.exe → the persistent window. This is the 6th instance of the documented Claude-tolerated/Kiro-breaks cross-agent class, with the SAME established node-direct fix.

<!-- decision:P-J7QS7HRQ -->

## Fixed the same cmd.exe window issue across Claude Code CLI and MCP components, c

**When:** 2026-06-24 · **Fact:** `P-J7QS7HRQ`

<!-- decision:P-U7UUPTA2 -->

## Kiro-CLI MCP Registration Configuration Gap

**When:** 2026-06-24 · **Fact:** `P-U7UUPTA2`
**Why:** Without conversion, kiro-cli shows persistent cmd.exe window on spawn. Claude Code avoids it by spawning headless, which masks the gap in headless contexts.

<!-- decision:P-C3RVE6LD -->

## Node-Direct Process Spawning To Prevent Cmd.exe Windows

**When:** 2026-06-24 · **Fact:** `P-C3RVE6LD`
**Why:** Cmd.exe wrappers create visible persistent windows on Windows, breaking UX—especially critical for CLI tools. Claude Code success validates the approach.

<!-- decision:P-BCFL24PC -->

## Prefers direct, action-oriented responses; dislikes verbose context re-hashing—w

**When:** 2026-06-24 · **Fact:** `P-BCFL24PC`

<!-- decision:P-V2CQQLQQ -->

## FINAL-mcp-popup-is-kiro-cli-wraps-all-mcp-in-cmd-exe-not-kit-bug

**When:** 2026-06-24 · **Fact:** `P-V2CQQLQQ`
**Why:** Corrects my earlier '6th cross-agent instance / node-direct fix' framing — that was WRONG. Live proof: kiro-cli wraps EVERY stdio MCP server in cmd.exe /C (the user's mcp-remote + mcp-server-memory get it too, not just cmk), so the console window is kiro-cli's OWN launch mechanism, not controllable by the kit's command string (node-direct didn't help). It's a kiro-cli-on-Windows cosmetic affecting all MCP servers, not a kit defect — don't block v0.4.0 on it.

<!-- decision:P-XXHHNAMD -->

## AWS guardrail sample repo as reference for task 166 investigation

**When:** 2026-06-24 · **Fact:** `P-XXHHNAMD`
**Why:** The project's V3 guardrail hooks may have format issues or be broken on 2.9.0. AWS's official working example provides a baseline for comparison to identify root cause.

<!-- decision:P-ZDBaD7AT -->

## kiro-cli wraps MCP servers in cmd.exe (undocumented platform behavior)

**When:** 2026-06-24 · **Fact:** `P-ZDBaD7AT`
**Why:** Users and developers may initially interpret the cmd.exe popup as a bug or misconfiguration issue. Identifying it as inherent platform behavior prevents wasted investigation and explains why configuration-level fixes don't exist.

<!-- decision:P-GRTXENC5 -->

## CUT-BLOCKER-mcp-mk-remember-silent-dataloss-kiro-cli-claude-project-dir-only

**When:** 2026-06-24 · **Fact:** `P-GRTXENC5`
**Why:** The clean gate surfaced a SILENT DATA-LOSS bug: mk_remember in kiro-cli says 'saved' but nothing persists to the project, because the MCP server resolves projectRoot from CLAUDE_PROJECT_DIR (Claude-Code-only) and falls back to process.cwd() (kiro-cli's cwd, not the project). The 6th instance of the Claude-tolerated/Kiro-breaks cross-agent class, and the worst kind. A v0.4.0 cut-blocker — the core capture path silently fails in kiro-cli.

<!-- decision:P-RJ2QDBCQ -->

## mk-remember-kiro-cli-fix-cmk-project-dir-env-project-local-agent

**When:** 2026-06-24 · **Fact:** `P-RJ2QDBCQ`
**Why:** Confirmed the mk_remember silent-data-loss root cause (kiro launches MCP from non-project cwd; CLAUDE_PROJECT_DIR is Claude-only) and the fix direction: the agent mcpServers entry supports `env` (not cwd), and a project-local kiro agent can bake env:{CMK_PROJECT_DIR:<absPath>} which mcp serve must honor. A v0.4.0 cut-blocker — capture must persist in kiro-cli.

<!-- decision:P-WQ4TBSYG -->

## mk-remember-fix-self-review-agent-config-inline-mcp-composition-risk

**When:** 2026-06-24 · **Fact:** `P-WQ4TBSYG`
**Why:** Self-review caught that the kiro-cli agent-config has its OWN env-less inline mcpServers.cmk entry (global, can't bake a path). The docs are ambiguous on whether kiro uses the agent's entry or the project mcp.json (which has the env). So the fix is proven for the project-mcp.json path but the agent-config composition is unverified — must live-test which entry kiro launches before claiming the cut-blocker is fully closed.

<!-- decision:P-9APUUDZY -->

## kiro-cli MCP Server Source Consolidation Strategy

**When:** 2026-06-24 · **Fact:** `P-9APUUDZY`
**Why:** Ambiguous MCP source selection creates composition bugs that static tests cannot detect. Only live integration testing caught the silent data-loss risk. Consolidating eliminates ambiguity and makes the system predictable.

<!-- decision:P-YQ4CN37B -->

## Global CLI Rebuild and Reinstall Workflow

**When:** 2026-06-24 · **Fact:** `P-YQ4CN37B`
**Why:** Needed to test CLI changes without npm publish. The uninstall+install cycle ensures clean state and avoids stale cached behavior.

<!-- decision:P-WL22GQ9J -->

## kiro-cli Integration Test Gate and Reinstall

**When:** 2026-06-24 · **Fact:** `P-WL22GQ9J`
**Why:** Interactive session testing is the authoritative proof of memory persistence. Code inspection alone is insufficient.

<!-- decision:P-CGLT2JD7 -->

## Memory Persistence Validation Workflow (End-to-End)

**When:** 2026-06-24 · **Fact:** `P-CGLT2JD7`
**Why:** This workflow empirically proves memory persistence works end-to-end. It's the definitive test — if facts land in context/ after a live session, the fix is working.

<!-- decision:P-4RGSVUAN -->

## always use bare `kiro-cli` command; `chat` subcommand is default and unnecessary

**When:** 2026-06-24 · **Fact:** `P-4RGSVUAN`

<!-- decision:P-DK6C2GKG -->

## Prefer fresh, isolated test folders over reusing existing folders contaminated b

**When:** 2026-06-24 · **Fact:** `P-DK6C2GKG`

<!-- decision:P-2F6HQJHF -->

## Binary Test Outcome Framework for Feature Validation

**When:** 2026-06-24 · **Fact:** `P-2F6HQJHF`
**Why:** Binary outcomes eliminate guesswork and remove the need for follow-up debugging; each result is actionable and complete.

<!-- decision:P-4JQZL6HE -->

## MCP Server State Isolation in Testing

**When:** 2026-06-24 · **Fact:** `P-4JQZL6HE`
**Why:** Without isolation, a test result can be false-positive or false-negative due to stale env state from a prior run. Killing old servers ensures the test truly validates the current code path, not cached behavior.

<!-- decision:P-Y3LNUP3A -->

## DEFINITIVE-kiro-cli-does-not-pass-mcp-json-env-to-stdio-server

**When:** 2026-06-24 · **Fact:** `P-Y3LNUP3A`
**Why:** Exhaustively proven: kiro-cli does not deliver the mcp.json `env` field to the spawned MCP server, so CMK_PROJECT_DIR never reaches it, so mk_remember silently fails (agent says "saved", nothing persists). The kit's code fix is correct (proven by a direct env-set test that DID land) but kiro doesn't provide the lever. A kiro-cli platform bug, not a kit bug — but it breaks MCP-driven capture in kiro-cli.

<!-- decision:P-GB6HWR94 -->

## Always use uv for Python packages in this project, never pip.

**When:** 2026-06-24 · **Fact:** `P-GB6HWR94`

<!-- decision:P-67N3M6LT -->

## kiro-cli Does Not Pass MCP Environment Variables

**When:** 2026-06-24 · **Fact:** `P-67N3M6LT`
**Why:** Breaks reliable memory capture via kiro-cli; confirmed by direct testing

<!-- decision:P-RP9NNKAY -->

## kiro-cli-env-only-flows-for-registry-type-not-stdio-mcp-feed-json-proof

**When:** 2026-06-24 · **Fact:** `P-RP9NNKAY`
**Why:** kiro-cli's own changelog (feed.json) proves it: mcp.json `env` only flows to REGISTRY-TYPE MCP servers, not personal/stdio ones like ours. So CMK_PROJECT_DIR is silently dropped → mk_remember silent-data-loss. Primary-source confirmation of the kiro-cli limitation behind the cut-blocker; the kit's code fix is correct but kiro won't deliver the env to a stdio server.

<!-- decision:P-WH4B9VPD -->

## kiro-cli MCP server env passing limitation

**When:** 2026-06-24 · **Fact:** `P-WH4B9VPD`
**Why:** Root cause of MCP capture failures in kiro v0.4.0. The blocking issue is upstream in kiro-cli, not in the kit's code (which was correct).

<!-- decision:P-FFQDSQEV -->

## kiro-cli env-passing limitation

**When:** 2026-06-24 · **Fact:** `P-FFQDSQEV`
**Why:** This limitation was discovered during debugging and is documented in kiro's own changelog. It is a hard constraint of how kiro-cli routes configuration to MCP servers.

<!-- decision:P-YX5A7RWJ -->

## kiro-cli --project workaround for project-path passing

**When:** 2026-06-24 · **Fact:** `P-YX5A7RWJ`
**Why:** env is not passed to stdio servers by kiro. The --project arg was proven to work in code (suite 2268/0) and is the only lever that kiro-cli cannot drop.

<!-- decision:P-5D5PDC5E -->

## Live test workflow for kiro-cli --project fix

**When:** 2026-06-24 · **Fact:** `P-5D5PDC5E`
**Why:** This is the definitive live test to prove whether kiro-cli passes command-line args to stdio MCP servers. Designed to run after code commit.

<!-- decision:P-6WKMHaB6 -->

## User trusts assistant to take autonomous action; delegates decisively with "just

**When:** 2026-06-24 · **Fact:** `P-6WKMHaB6`

<!-- decision:P-XA74FDKH -->

## Cut-Blocker Fix: --project Routing and @claude-memory-kit Approval

**When:** 2026-06-24 · **Fact:** `P-XA74FDKH`
**Why:** These are the two-part root cause of the cut-blocker. Validation proves both are wired correctly and facts flow end-to-end. Unblocks merge.

<!-- decision:P-5SDX2A4Y -->

## kiro-cli-mcp-list-reveals-agent-server-link-broken-includemcpjson-shows-legacy

**When:** 2026-06-24 · **Fact:** `P-5SDX2A4Y`
**Why:** kiro-cli mcp list shows the cmk agent's server as [legacy] and the real attachment on kiro_default not cmk — so includeMcpJson:true (Option B) doesn't properly wire the project mcp.json server to the cmk agent, and mk_remember calls go nowhere. The server itself is correct (direct calls write); the agent→server link is broken. Likely Option B (dropping the agent's inline mcpServers) was wrong; a project-local agent with inline mcpServers may be the real fix.

<!-- decision:P-234QKaCL -->

## CONFIRMED-kiro-bugs-5873-5662-custom-agents-dont-get-mcp-tools

**When:** 2026-06-24 · **Fact:** `P-234QKaCL`
**Why:** The user's call to check upstream found the definitive root cause: kiro-cli issues #5873 + #5662 confirm custom agents (.kiro/agents/*.json) do NOT receive MCP tools — only kiro_default does — and NEITHER inline mcpServers NOR includeMcpJson works for them. So mk_remember silently fails in kiro-cli by a CONFIRMED KIRO BUG, not a kit bug, and no kit config fixes it. This kills the project-local-agent fix and settles the v0.4.0 stance.

<!-- decision:P-9TBJ9J5P -->

## chose option A — proceed with merge and documentation of the Kiro CLI limitation

**When:** 2026-06-24 · **Fact:** `P-9TBJ9J5P`

<!-- decision:P-aPAXAYVX -->

## Kiro CLI: Known Limitation — Bug #5873 Blocks Manual mk_remember

**When:** 2026-06-24 · **Fact:** `P-aPAXAYVX`
**Why:** Future sessions need to know kiro-cli's primary working feature (automatic capture) and why manual saves are unavailable, so docs reflect reality and users have clear guidance.

<!-- decision:P-GJ6NK9QE -->

## THE-FIX-use-cmk-remember-cli-not-mk-remember-mcp-in-kiro-cli

**When:** 2026-06-24 · **Fact:** `P-GJ6NK9QE`
**Why:** The user's insight cracked the cut-blocker: `cmk remember` (CLI shell command) bypasses the Kiro MCP bug (#5873) that breaks the mk_remember MCP tool. PROVEN to land in gate4. The skill already has a CLI fallback but doesn't trigger it because the MCP server looks connected (no error). So instructing Kiro to prefer the CLI `cmk remember` makes explicit capture work in kiro-cli NOW, without waiting for Kiro to fix #5873.

<!-- decision:P-3JGE7aaB -->

## cli-route-fix-prompt-vs-skill-conflict-ide-cli-share-skill

**When:** 2026-06-24 · **Fact:** `P-3JGE7aaB`
**Why:** The user asked how IDE vs cli are distinguished — surfacing that my CLI-route prompt (kiro-cli-only, correct) conflicts with the shared .kiro/skills/memory-write skill which says 'prefer MCP'. The same skill is read by the IDE (MCP works) and kiro-cli (MCP broken), so it can't simply be flipped. Must resolve whether the agent prompt outranks the skill, or make the skill agent-aware.

<!-- decision:P-UB6G75DX -->

## Kiro Bug #5873 — Explicit Tool Route Blocked

**When:** 2026-06-24 · **Fact:** `P-UB6G75DX`
**Why:** Tool is unavailable; CLI workaround is functional and documented.

<!-- decision:P-96D7W57M -->

## Kiro-CLI Memory Integration — Test Procedure

**When:** 2026-06-24 · **Fact:** `P-96D7W57M`
**Why:** Kiro bug #5873 blocks explicit tool route; CLI route is workaround. Live test confirms full integration before merge.

<!-- decision:P-DRML7RX3 -->

## v0.4.0-decision-remove-mcp-from-kiro-cli-agent-includemcpjson-false-document-gap

**When:** 2026-06-24 · **Fact:** `P-DRML7RX3`
**Why:** User chose: remove MCP from kiro-cli + document, ship v0.4.0. Hooks work in kiro-cli (automatic memory functions); both explicit-save routes (MCP #5873, CLI cmk remember cwd-flaky) are broken by kiro V3 bugs. The popup is kiro's MCP launcher. The fix: includeMcpJson:false on the kiro-cli agent stops the MCP spawn (no popup) without touching the IDE (which reads mcp.json directly + where MCP works).

<!-- decision:P-JBaZNZ95 -->

## kiro-cli Explicit Save Limitation (Known)

**When:** 2026-06-24 · **Fact:** `P-JBaZNZ95`
**Why:** Testing showed `cmk remember` facts didn't land due to kiro's shell cwd behavior — not a cmk defect, but an environment constraint.

<!-- decision:P-T5SJYZVa -->

## kiro-cli MCP Configuration — Disable to Kill Popup

**When:** 2026-06-24 · **Fact:** `P-T5SJYZVa`
**Why:** kiro-cli was spawning a non-functional MCP server, causing an annoying popup (issue #5873). Disabling MCP here removes dead weight while preserving MCP for other surfaces.

<!-- decision:P-QJLBaF99 -->

## Memory Routes by Execution Surface

**When:** 2026-06-24 · **Fact:** `P-QJLBaF99`
**Why:** Execution contexts differ in capabilities. kiro-cli cannot reliably use MCP but captures memory via shell hooks.

<!-- decision:P-H4KU6775 -->

## Disable MCP in IDE Wrappers With includeMcpJson: false

**When:** 2026-06-24 · **Fact:** `P-H4KU6775`
**Why:** Some IDEs don't support MCP or users want a minimal footprint; the fix improves UX. Memory capture still works via hooks.

<!-- decision:P-4GB6NFMA -->

## cmk-remember-needs-project-flag-cwd-unreliable-in-kiro-cli-shell

**When:** 2026-06-24 · **Fact:** `P-4GB6NFMA`
**Why:** cmk remember resolves project from process.cwd() only; kiro-cli's shell runs `cd /c/Temp/gate5 && cmk remember` unreliably (bash path + kiro terminal cwd), so the fact writes to the wrong project — "Remembered" but lost. The fix: a --project flag on cmk remember/search (like mcp serve got) + the agent prompt passing the absolute path. Popup already fixed (includeMcpJson:false); hooks work; this is the last explicit-save gap.

<!-- decision:P-C3MJVGP5 -->

## FINAL-kiro-doesnt-execute-shell-commands-for-custom-agents-explicit-memory-dead

**When:** 2026-06-24 · **Fact:** `P-C3MJVGP5`
**Why:** The user's 'did you read the code?' push led to the definitive root cause: reading subcommands.mjs:983 proved cmk remember is cwd-only (correct), and running the agent's EXACT command manually LANDED — but the session's identical command did NOTHING (0 audit, no now.md) and the model used a hallucinated tool name + fabricated '✅ Remembered'. So kiro doesn't execute shell commands for custom agents either (parallel to MCP #5873) — the model fakes it. ALL model-initiated explicit memory is dead in kiro-cli; only hooks (kiro-run, not model-run) work. No kit fix helps.

<!-- decision:P-NBWU27JQ -->

## Kiro-cli automatic memory capture works

**When:** 2026-06-24 · **Fact:** `P-NBWU27JQ`
**Why:** The whole point of the kit is "fire and forget" memory across sessions; this is the feature that matters most and the one that works

<!-- decision:P-U9SMNCL4 -->

## Kiro-cli custom agent tool limitation

**When:** 2026-06-24 · **Fact:** `P-U9SMNCL4`
**Why:** This explains why the manual "remember this" command appears to succeed but doesn't actually persist (the assistant sees a fake ✅ but nothing runs). Future sessions need to know this is by design (platform limit), not a kit defect.

<!-- decision:P-Z94F92ZE -->

## CORRECTED-cd-prefix-breaks-allowlist-kiro-4579-project-flag-is-the-fix

**When:** 2026-06-24 · **Fact:** `P-Z94F92ZE`
**Why:** The user's question (what do projects do for in-chat scripts) led to confirmed Kiro bug #4579: cd-prefixed commands break the start-anchored allowedCommands match. Our agent ran `cd ... && cmk remember`, which fails our `^cmk remember` allowlist → blocked. So commands DO work for custom agents; the cd prefix is the specific breakage — and it's FIXABLE: tell the agent to use `cmk remember --project <abs>` with NO cd. My earlier 'custom agents can't run commands / it's unfixable' conclusion was WRONG; the --project flag I was building is the correct fix.

<!-- decision:P-D6E2HXN3 -->

## Kiro #4579 Workaround: Replace `cd` with `--project` Flag

**When:** 2026-06-24 · **Fact:** `P-D6E2HXN3`
**Why:** Unblocks explicit memory save in kiro-cli custom-agent contexts (critical blocker resolved)

<!-- decision:P-E2WMaTAE -->

## TRULY-FINAL-kiro-windows-allowlist-bug-5376-7431-blocks-correct-commands-unfixable

**When:** 2026-06-24 · **Fact:** `P-E2WMaTAE`
**Why:** Evidence-complete: the agent ran the perfect command (--project, no cd, matches the allowlist) and kiro STILL blocked it (no audit, no tool_result), while the identical command lands when I run it. This is confirmed Kiro Windows allowlist bugs #5376/#7431 — kiro rejects commands that genuinely match allowedCommands. Every kit lever (MCP/CLI/--project/no-cd/allowlist) is correct; kiro blocks anyway. Not fixable from the kit. Hooks work (kiro runs them). Ship with automatic memory + documented explicit gap.

<!-- decision:P-5NAAPaWR -->

## design-correction-project-flag-is-outside-chat-not-model-in-chat-command

**When:** 2026-06-24 · **Fact:** `P-5NAAPaWR`
**Why:** The user clarified: --project is for outside-the-chat invocation (hooks/scripts), and putting it in the model's in-chat command is wrong design — it relies on the model running commands (blocked by kiro's allowlist bug) and is fragile. The right design: memory is automatic via hooks (which work); the model never runs memory commands. This sidesteps kiro's bug entirely and matches how real kiro projects (AgentCore) work.

<!-- decision:P-SLa3TB2R -->

## --project flag is supposed to run outside the chat context, not within it

**When:** 2026-06-24 · **Fact:** `P-SLa3TB2R`

<!-- decision:P-6YCQPD3K -->

## THE-ACTUAL-BUG-missing-tools-field-agent-had-no-shell-tool-enabled

**When:** 2026-06-24 · **Fact:** `P-6YCQPD3K`
**Why:** The user's reframe (cmk remember is just a tool like ls — how do you run tools in chat?) led to the real bug: our kiro-cli agent had NO `tools` field, so the custom agent had zero tools enabled and literally couldn't run shell commands — every '✅ Remembered' was the model pretending. Kiro's docs: tools is the capability set; must include 'shell' or '*'. This was never a kiro bug; we forgot to enable tools. All my 'confirmed kiro bugs' diagnoses were wrong.

<!-- decision:P-63PNEKQQ -->

## Looking for the native way to run tools (like cmk_remember) in kiro-cli chat, eq

**When:** 2026-06-24 · **Fact:** `P-63PNEKQQ`

<!-- decision:P-5CXRTFVP -->

## Questioning whether their approach is wrong, if there's a bug, or if the system

**When:** 2026-06-24 · **Fact:** `P-5CXRTFVP`

<!-- decision:P-AKRHWKJB -->

## Tool Execution in kiro-cli Requires `tools: ['*']` Config

**When:** 2026-06-24 · **Fact:** `P-AKRHWKJB`
**Why:** Tool execution was mysteriously failing (no error, just inert calls) because the permission gate was missing entirely — invisible until explicitly diagnosed

<!-- decision:P-GP54J2UE -->

## CUT-BLOCKER-CLOSED-kiro-cli-explicit-memory-works-tools-star-fix-proven

**When:** 2026-06-24 · **Fact:** `P-GP54J2UE`
**Why:** PROVEN LIVE: tools:['*'] was the fix — the model ran cmk remember and it really executed (P-DTRaa79G rich fact landed in gate7, cmk search finds it). The whole multi-hour kiro-bug saga was misdiagnosis; the agent just had no tools enabled. kiro-cli is now fully working: popup fixed, automatic + explicit memory both work. Ship v0.4.0.

<!-- decision:P-CJCM9CJM -->

## confirmed tests passed ("run all the commands nad the response looks promising")

**When:** 2026-06-24 · **Fact:** `P-CJCM9CJM`

<!-- decision:P-F2GYBEY5 -->

## Gate-Folder Testing Methodology

**When:** 2026-06-24 · **Fact:** `P-F2GYBEY5`
**Why:** Numbered gates decouple testing from active development and make regression detection obvious. The pattern is repeatable and traceable.

<!-- decision:P-UaE4C5MH -->

## Missing `tools: ['*']` Field Was the Shell Blocker

**When:** 2026-06-24 · **Fact:** `P-UaE4C5MH`
**Why:** Understanding the root cause prevents regression and explains why prior refactors stalled. The fix is minimal and isolated.

<!-- decision:P-SSULEHW2 -->

## CHECKPOINT-kiro-cli-fully-works-tools-fix-cleanup-done-ready-for-pr

**When:** 2026-06-24 · **Fact:** `P-SSULEHW2`
**Why:** Context at 2% — durable checkpoint. kiro-cli now fully works (tools:['*'] was the fix, proven live; popup fixed; explicit memory via cmk remember/search works) and the dead MCP machinery is cleaned up (committed a60b11a). All 3 agents work. Remaining: test the bare-no-project question, two-pass review, docs, correct the misdiagnosis notes, consolidate → PR → v0.4.0 tag.

<!-- decision:P-SXSPGGEC -->

## Kiro-CLI Agent `tools` Field Configuration Fix

**When:** 2026-06-24 · **Fact:** `P-SXSPGGEC`
**Why:** Agents without `tools` cannot execute tools; they can only return text and may fake success responses.

<!-- decision:P-ATGVZCWS -->

## Kiro-CLI Fully Functional State (Commit a60b11a)

**When:** 2026-06-24 · **Fact:** `P-ATGVZCWS`
**Why:** Represents the end state of a long debugging cycle; system is stable and proven.

<!-- decision:P-GLSAMG6N -->

## User principle: don't defer bugs to v0.5.0, because deferred work doesn't get re

**When:** 2026-06-24 · **Fact:** `P-GLSAMG6N`

<!-- decision:P-aPBH9EMa -->

## kiro-cli cut gate procedure

**When:** 2026-06-24 · **Fact:** `P-aPBH9EMa`
**Why:** Test leftovers (esp. `cmk.json`) mask whether the shipped code works on a genuinely fresh install; backing up first makes it safe to clean before testing

<!-- decision:P-SVXNQMZK -->

## Test artifacts can contaminate fresh-install testing

**When:** 2026-06-24 · **Fact:** `P-SVXNQMZK`
**Why:** A gate test needs to simulate a real user's first install; pre-existing config defeats that simulation

<!-- decision:P-LWJQU7a6 -->

## Cutgate Fresh Install Test Sequence

**When:** 2026-06-24 · **Fact:** `P-LWJQU7a6`
**Why:** Tests that the kit ships and installs cleanly on a fresh system without test state contamination skewing results

<!-- decision:P-XML7J7a5 -->

## Kit Shell Permission & Command Trust Boundary

**When:** 2026-06-24 · **Fact:** `P-XML7J7a5`
**Why:** Security boundary: kit commands are internal and trusted; user commands need approval. D-199 eliminated unnecessary prompts for kit's own memory operations.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-9HAX6LAX -->

## agentSpawn hook verified firing; D-198 configuration fix confirmed working; Kiro

**When:** 2026-06-24 · **Fact:** `P-9HAX6LAX`

<!-- decision:P-VRJ9JMX5 -->

## kiro-cli only passes env overrides to registry-type MCP servers, not stdio-type;

**When:** 2026-06-24 · **Fact:** `P-VRJ9JMX5`

<!-- decision:P-ZXUWSZWJ -->

## The kit's code fix is correct; the blocking issue is kiro-cli's env-passing arch

**When:** 2026-06-24 · **Fact:** `P-ZXUWSZWJ`

<!-- decision:P-A79KMP6L -->

## Only mk_remember MCP-tool calls are affected; CLI hooks (agentSpawn inject + sto

**When:** 2026-06-24 · **Fact:** `P-A79KMP6L`

<!-- decision:P-TBKTT7FS -->

## Kiro bug #5873 blocks manual `mk_remember` tool from routing to custom assistant

**When:** 2026-06-24 · **Fact:** `P-TBKTT7FS`

<!-- decision:P-H4KXTZTX -->

## Cross-Project Rules Auto-Promote at Session End (Stop Hook)

**When:** 2026-06-24 · **Fact:** `P-H4KXTZTX`
**Why:** Understanding the auto-promotion flow prevents confusion: users don't need manual promotion commands to land cross-project rules in HABITS.md. The kit handles promotion automatically at session close, reducing friction.

<!-- decision:P-A4JSRQYE -->

## Kiro IDE Hook Architecture — 10 Available, 2 Currently Used

**When:** 2026-06-25 · **Fact:** `P-A4JSRQYE`
**Why:** Kiro's full hook surface is now understood; reveals capacity for remaining features without architectural surprises.

<!-- decision:P-LUHU6TQQ -->

## Kit Status After Cut Gate — Core Merged and Proven

**When:** 2026-06-25 · **Fact:** `P-LUHU6TQQ`
**Why:** Establishes stable baseline for next phase; clarifies which core features are locked in vs. still under development.

<!-- decision:P-322V34Q2 -->

## Task 50.N Completion State — Kiro Parity Campaign

**When:** 2026-06-25 · **Fact:** `P-322V34Q2`
**Why:** Next session will resume from exact state. IDE appears structurally done but live verification is the actual done-gate. Backup location + test count critical for safety.

<!-- decision:P-PaVAMD9H -->

## Pre-gate rebuild and server shutdown sequence

**When:** 2026-06-25 · **Fact:** `P-PaVAMD9H`
**Why:** npm can silently retain old code; MCP locking prevents clean rebuilds; user state must be captured before fresh install; on-disk checks reduce manual gate work.

<!-- decision:P-9PPTD9RE -->

## Two-phase gate workflow pattern

**When:** 2026-06-25 · **Fact:** `P-9PPTD9RE`
**Why:** User system-specific actions (rebuild, local state) must be done by the user; assistant can automate the rest. Clear phase separation reduces gate failures from missed setup steps.

<!-- decision:P-ZGJTAGBD -->

## v0.4.0 cut-gate structure and coverage

**When:** 2026-06-25 · **Fact:** `P-ZGJTAGBD`
**Why:** User's installed versions determine which probes are active vs skipped. IDE v1 is not in scope yet but is explicitly documented as such.

<!-- decision:P-9TJHaTBG -->

## Gate Testing Decision — Quick vs. Comprehensive Path

**When:** 2026-06-25 · **Fact:** `P-9TJHaTBG`
**Why:** This session added v1 IDE integration; gate testing should verify it or explicitly acknowledge it unverified

<!-- decision:P-C7VPU7BC -->

## Kiro-CLI Dual-Emit Architecture

**When:** 2026-06-25 · **Fact:** `P-C7VPU7BC`
**Why:** Provides flexibility in testing; choice is scope (quick/legacy vs. comprehensive/modern), not compatibility

<!-- decision:P-7U47a2QG -->

## Kiro IDE 1.0.52 Agent Hooks v2 Format Verification Gate

**When:** 2026-06-25 · **Fact:** `P-7U47a2QG`
**Why:** The v2 label indicates format change from v1. Documentation is authoritative; format mismatches could break hook system integration.

<!-- decision:P-NSM4THF5 -->

## Kiro 1.0 Hook Format Discovery via IDE-Generated Files

**When:** 2026-06-25 · **Fact:** `P-NSM4THF5`
**Why:** Documentation may be incomplete or out of sync with actual implementation. Reading what the tool itself writes is authoritative.

<!-- decision:P-YW3DSPJ3 -->

## Kiro 1.0 v1 Hook Schema and Installation Naming

**When:** 2026-06-25 · **Fact:** `P-YW3DSPJ3`
**Why:** Live IDE 1.0 gate confirmed v1 schema guesses and caught bug #231 (installer generating wrong filenames). This ground truth will guide all v1 hook generation; backward-compat safety is now proven.

<!-- decision:P-CGX3WDW4 -->

## Gate Project Ready for KHv1-load Validation

**When:** 2026-06-25 · **Fact:** `P-CGX3WDW4`
**Why:** Confirms fresh `cmk install` produces v1 hooks that IDE auto-loads.

<!-- decision:P-9K72LLAW -->

## Kiro IDE 1.0 Hook v1 Validation Protocol

**When:** 2026-06-25 · **Fact:** `P-9K72LLAW`
**Why:** Live validation that cmk install output produces working v1 hooks auto-loaded in Kiro IDE (different from migration-script test)

<!-- decision:P-4WHH6D72 -->

## CLI Installation Verification Workflow

**When:** 2026-06-25 · **Fact:** `P-4WHH6D72`
**Why:** Global CLI must be rebuilt after changes; verification ensures fix is active before testing downstream (Kiro IDE hooks, gate projects)

<!-- decision:P-A52S4L4E -->

## Kiro Caching Behavior & Workaround

**When:** 2026-06-25 · **Fact:** `P-A52S4L4E`
**Why:** Kiro spawns hook subprocesses, so it caches the *hook definition*, not always the CLI binary. Restart flushes Kiro's internal state.

<!-- decision:P-XESLC4LQ -->

## Kiro IDE Hook Testing — Multi-Step Gate Sequence

**When:** 2026-06-25 · **Fact:** `P-XESLC4LQ`
**Why:** Hooks may appear installed but not actually execute; fresh folder + systematic verification avoids false passes from stale state

<!-- decision:P-RSXX6JWW -->

## Global Install Auto-Recreates User-Tier Directory

**When:** 2026-06-25 · **Fact:** `P-RSXX6JWW`
**Why:** Observed during post-rebuild verification; important for test design and cleanup between runs

<!-- decision:P-YZWV75GZ -->

## Memory Tier System: Project-to-Cross-Project Promotion

**When:** 2026-06-25 · **Fact:** `P-YZWV75GZ`
**Why:** Allows validated workspace facts to surface as standing rules across all future projects.

<!-- decision:P-MZMJWDC6 -->

## PRs #232–#233: Kiro IDE 1.0 Integration Complete

**When:** 2026-06-25 · **Fact:** `P-MZMJWDC6`
**Why:** IDE 1.0 changed session storage location and introduced a new permission model; these fixes align the kit.

<!-- decision:P-3JNMR9QC -->

## CMK Workspace Rename Invalidates Per-Workspace Permissions Hash

**When:** 2026-06-25 · **Fact:** `P-3JNMR9QC`
**Why:** Renaming without re-installing silently breaks the permission binding. Re-installing immediately after rename keeps the permissions hash in sync with the folder's absolute path.

<!-- decision:P-5ZSWJRRD -->

## kiro-cli V3 Delete-Guardrail (preToolUse) Known Limitation

**When:** 2026-06-25 · **Fact:** `P-5ZSWJRRD`
**Why:** Prevents shipping with an uncaught assumption that the guardrail works everywhere. Limitations must be explicit and justified.

<!-- decision:P-EDZEJ3TZ -->

## Kiro v0.4.0 Multi-Surface Trust Mechanism Architecture

**When:** 2026-06-25 · **Fact:** `P-EDZEJ3TZ`
**Why:** v0.4.0 unifies memory behavior across three implementations. Live testing confirmed they work in isolation without conflicts. An implicit assumption (that kiro-cli would use the same mechanism as Kiro IDE) was caught by testing.

<!-- decision:P-C27GVXL9 -->

## Delete-Guardrail: Memory Protection via preToolUse Hook

**When:** 2026-06-25 · **Fact:** `P-C27GVXL9`
**Why:** Motivated by D-192 incident — an accidental `rm` after a `cd` deleted a repo's session/transcript memory. The guardrail makes such unintended deletions impossible.

<!-- decision:P-JAP3QEMD -->

## kiro-cli V3 Hook Redesign: Guard Dormant, Fallback Active

**When:** 2026-06-25 · **Fact:** `P-JAP3QEMD`
**Why:** Kiro CLI V3's hook redesign is a breaking change for the kit's V2-era `preToolUse` approach, but V3's own safety prompts activate as fallback — users remain protected via a different gate.

<!-- decision:P-KWGTaLYN -->

## Frozen Decision Log Philosophy

**When:** 2026-06-25 · **Fact:** `P-KWGTaLYN`
**Why:** Decision logs and research are records of *thinking at a point in time*; rewriting them erases that history. Inline change notes in operational docs serve future readers without corrupting the audit trail.

<!-- decision:P-7USAABP2 -->

## Multi-Surface Documentation Architecture

**When:** 2026-06-25 · **Fact:** `P-7USAABP2`
**Why:** The tool supports multiple agents (Claude Code, Kiro IDE, kiro-cli), so docs must span multiple entry points and use cases. Validators prevent drift as the codebase evolves.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-VaK5DNNa -->

## The rolling session summary (recent.md) does NOT retire RESOLVED threads — a com

**When:** 2026-06-25 · **Fact:** `P-VaK5DNNa`
**Why:** A stale 'pending' line in the injected context is the cross-session-amnesia failure the kit exists to kill, applied to the kit's own session summaries. The next session reads a resolved epic as still-open.

<!-- decision:P-YCBLRF9U -->

## Memory Kit Architecture — Complementary Kit and CLAUDE.md

**When:** 2026-06-25 · **Fact:** `P-YCBLRF9U`
**Why:** This project dogfoods its own memory architecture. The dual-system design ensures facts are routed correctly (always-on enforcement vs. discoverable recall) and appropriately reinforced.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-LRC5G3V6 -->

## Clarifying scope — asking whether kiro-ide and claude-code are still pending fix

**When:** 2026-06-24 · **Fact:** `P-LRC5G3V6`

<!-- decision:P-VK9WUZX6 -->

## Kiro IDE 1.0.52 is available for Windows download (user discovered on download p

**When:** 2026-06-25 · **Fact:** `P-VK9WUZX6`

<!-- decision:P-25BQ2BVY -->

## User chose to upgrade to Kiro IDE 1.0.52; will perform upgrade, rebuild, and clo

**When:** 2026-06-25 · **Fact:** `P-25BQ2BVY`

<!-- decision:P-7BXYT6ZP -->

## Prefers clean, isolated test folders over reusing existing ones

**When:** 2026-06-25 · **Fact:** `P-7BXYT6ZP`

<!-- decision:P-DASHLKGA -->

## Always use uv for package management, never pip — stated as standing rule for al

**When:** 2026-06-25 · **Fact:** `P-DASHLKGA`

<!-- decision:P-BWHEKQ2D -->

## User set aside memory fragments across multiple test/check/version cycles and lo

**When:** 2026-06-25 · **Fact:** `P-BWHEKQ2D`

<!-- decision:P-43S5U24A -->

## Kit core legs now fully working + merged (inject, capture, auto-extract, wedge,

**When:** 2026-06-25 · **Fact:** `P-43S5U24A`

<!-- decision:P-GTCNZECK -->

## Next step is a choice: build parity legs first, or resume live cut-gate first to

**When:** 2026-06-25 · **Fact:** `P-GTCNZECK`

<!-- decision:P-PRHD66CF -->

## Discovery: Kiro IDE exposes 10 available hooks (Pre Tool Use, File Save, + 8 oth

**When:** 2026-06-25 · **Fact:** `P-PRHD66CF`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-T4X5L2LP -->

## Lazy-on-SessionStart Roll Doesn't Fire on Size-Bloated now.md

**When:** 2026-06-25 · **Fact:** `P-T4X5L2LP`
**Why:** The kit's core promise is self-refreshing snapshots. This is a gap — bloated snapshots can break the durability contract across session boundaries.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-BLSBXKGL -->

## Auto-load of .kiro/hooks/cmk.kiro.hook.json hooks is the critical verification p

**When:** 2026-06-25 · **Fact:** `P-BLSBXKGL`

<!-- decision:P-4H5WZL6N -->

## The kit dual-emits to support both IDE 0.x and 1.0+; either version can run the

**When:** 2026-06-25 · **Fact:** `P-4H5WZL6N`

<!-- decision:P-UBW47JKA -->

## Maintaining backward compatibility across Kiro IDE versions (0.x → 1.0) is value

**When:** 2026-06-25 · **Fact:** `P-UBW47JKA`

<!-- decision:P-DXZE3XDY -->

## npm pack and global install of 0.4.0 succeeded; tarball includes all required mo

**When:** 2026-06-25 · **Fact:** `P-DXZE3XDY`

<!-- decision:P-BGAC9PQX -->

## Verifies whether proper tools (cmk kit) vs shortcuts (bash) were used — indicate

**When:** 2026-06-25 · **Fact:** `P-BGAC9PQX`

<!-- decision:P-Ma5V7DXV -->

## now.md Bloat Creates Silent-Failure Trap in Lazy Roll

**When:** 2026-06-25 · **Fact:** `P-Ma5V7DXV`
**Why:** Future sessions may encounter stale injected context because the roll failed silently. Diagnosing this requires understanding the trap; recovery requires knowing about the manual command. This is critical for session health troubleshooting.

<!-- decision:P-W7B3A3FK -->

## Task 167 - Lazy Roll Robustness Extension (v0.4.x)

**When:** 2026-06-25 · **Fact:** `P-W7B3A3FK`
**Why:** Task 105 works reliably at ~10 KB scale, but fails silently at 400+ KB. Task 167 extends the mechanism to be robust at scale.

<!-- decision:P-DZDQSDQG -->

## now.md bloat root cause was cron-active short-circuit not timeout

**When:** 2026-06-25 · **Fact:** `P-DZDQSDQG`
**Why:** I first guessed "the Haiku roll timed out on 410 KB" and wrote that into the task. Reading lazy-compress.log corrected me: the roll was SKIPPED every time (cron-active, then cooldown), never attempted. A registered-but-dead cron disabled the only working compression path. This is the "did you check the primary source?" lesson applied to a root-cause claim — the log is the primary source; my recall was wrong.

<!-- decision:P-PY2TL4GZ -->

## Auto-Heal Path for v0.4.1 (Task 167) — D-169 Binding

**When:** 2026-06-25 · **Fact:** `P-PY2TL4GZ`
**Why:** User's question exposed a gap in initial 167.C spec (manual command violated D-169). Redesign ensures shipped path is automatic.

<!-- decision:P-DGBPG6PG -->

## Questioned whether fix is truly automatic and requires no user intervention.

**When:** 2026-06-25 · **Fact:** `P-DGBPG6PG`

<!-- decision:P-X362NWKX -->

## Compaction-State Module — v0.4.1 Core Architecture Refactoring

**When:** 2026-06-25 · **Fact:** `P-X362NWKX`
**Why:** Scattered state-ownership is the root cause of the bug. Architecture review and bug analysis converged on the same solution.

<!-- decision:P-46FTFCCW -->

## architecture review priorities and the persona-routing-into-151 fold

**When:** 2026-06-25 · **Fact:** `P-46FTFCCW`
**Why:** The /improve-codebase-architecture review found 6 deepening candidates. #2 (persona-routing) overlaps directly with Task 151's planned rewrite of the persona-promotion surface — doing it standalone in v0.4.1 would refactor code 151 rewrites in v0.4.2. The user agreed #1/#2/#3 are all worth doing but #2's timing must align with 151 to avoid churn.

<!-- decision:P-T4aUHMXa -->

## Values research-grounded recommendations with clear, honest attribution of sourc

**When:** 2026-06-25 · **Fact:** `P-T4aUHMXa`

<!-- decision:P-Q9MSP5YP -->

## Derive-vs-Stamp Design Rule

**When:** 2026-06-25 · **Fact:** `P-Q9MSP5YP`
**Why:** ADR-0002 prefers state encoded in artifacts; explicit markers should be minimal and justified. Reduces marker bloat and keeps artifacts as source of truth.

<!-- decision:P-SGSDY7A6 -->

## OpenWolf — Scheduled-Job Architecture Peer

**When:** 2026-06-25 · **Fact:** `P-SGSDY7A6`
**Why:** Real-world validation that heartbeat approach works at scale; confirms both architecture fit and derive-from-artifact strategy.

<!-- decision:P-7ZMV7DYS -->

## Requires design decisions to be grounded in research; pushes back on assumptions

**When:** 2026-06-25 · **Fact:** `P-7ZMV7DYS`

<!-- decision:P-U3SBN4DY -->

## Three-Tier Research Evaluation System

**When:** 2026-06-25 · **Fact:** `P-U3SBN4DY`
**Why:** Clarifies how research sources are evaluated and prevents conflating peer architecture with mechanism precedent with novelty.

<!-- decision:P-B3HBA67G -->

## EverOS comparison — same thesis opposite architecture not better

**When:** 2026-06-25 · **Fact:** `P-B3HBA67G`
**Why:** The user asked "is this better than us?" after finding EverOS. The honest answer requires separating product class from quality: EverOS is more capable as a standalone memory backend but gave up the kit's entire edge (zero-server, zero-setup, no-key, hooks-into-the-agent). Judging "better" without that distinction would be the lazy-framing class. EverOS also validates ADR-0002 by convergence and offers a reflection model worth borrowing for Task 151.

<!-- decision:P-WA6L3E4M -->

## Learn from EverOS to validate and improve kit architecture across the project.

**When:** 2026-06-25 · **Fact:** `P-WA6L3E4M`

<!-- decision:P-7KDNP4NS -->

## Reflection Model Upgrade: `deprecated_by` Frontmatter

**When:** 2026-06-25 · **Fact:** `P-7KDNP4NS`
**Why:** Task 151 (persona consolidation) needs a robust reflection strategy; EverOS's pattern is proven and more systematic.

<!-- decision:P-5NAPNM6G -->

## Zero-Server + Local-First Is the Kit's Deliberate Design

**When:** 2026-06-25 · **Fact:** `P-5NAPNM6G`
**Why:** Design choice (D-23) is validated by peer comparison. Zero-infrastructure is the kit's value prop and differentiator from peer systems.

<!-- decision:P-D6CCPVXQ -->

## npm v12 Install-Scripts Breaking Change (July 2026 Deadline)

**When:** 2026-06-25 · **Fact:** `P-D6CCPVXQ`
**Why:** npm v12 is a shipping reality; once it releases, any user installing the kit without the fix will silently fail. This is a critical production risk with an immovable deadline.

<!-- decision:P-JNYKR9YS -->

## Agent Research Resources Location

**When:** 2026-06-25 · **Fact:** `P-JNYKR9YS`
**Why:** Avoids redundant research per new agent; existing documentation is the authoritative source.

<!-- decision:P-aRHH7Va5 -->

## ADR-0002: Derive State from Artifacts, Avoid Markers

**When:** 2026-06-25 · **Fact:** `P-aRHH7Va5`
**Why:** Artifact mtimes are durable and already integrated into the system; markers add failure modes and sync risks.

<!-- decision:P-EJGWN6U5 -->

## Deep-Module Principle: Smaller Interfaces via Internal Hiding

**When:** 2026-06-25 · **Fact:** `P-EJGWN6U5`
**Why:** smaller interfaces reduce cognitive load, avoid two-writer hazards, and clarify intent; richer returns provide diagnostics without method proliferation

<!-- decision:P-YY4A9JAK -->

## Initial spec (167.C) violated D-169 (automatic-path rule) by naming manual `cmk

**When:** 2026-06-25 · **Fact:** `P-YY4A9JAK`

<!-- decision:P-YZQD9K4U -->

## Task 167 compaction-state module interface — two methods rich return

**When:** 2026-06-25 · **Fact:** `P-YZQD9K4U`
**Why:** Grilling the compaction-state deep module (architecture review #1 = Task 167.A). The fork was 2 methods vs 3 (a standalone isCronAlive). The deep-module principle + the Task 167 bug class itself (two sources of one truth disagreeing) make 2-with-a-rich-return correct: richness lives in the return value, not extra buttons, so there's exactly one place the cron-liveness rule is computed. The user needed the doctor to still get the liveness info — solved by the rich return, not a 3rd method.

<!-- decision:P-U6G6HABS -->

## Compaction Logic Redesign: 7-Question Fork Analysis

**When:** 2026-06-25 · **Fact:** `P-U6G6HABS`
**Why:** Prevents compound bloat bug while maintaining fast startup for normal cases. Synchronous drain is rare safety net, not common case.

<!-- decision:P-EJP5KTP3 -->

## Cooldown Marker Bug — Fires on Both Success and Failure

**When:** 2026-06-25 · **Fact:** `P-EJP5KTP3`
**Why:** This is the 167.F sibling bug discovered in audit. Failed calls shouldn't trigger cooldown blocking since they didn't consume resources and should be allowed to retry.

<!-- decision:P-UPJDK2UN -->

## Task 167 cooldown — success-only touch + sync-drain bypasses it

**When:** 2026-06-25 · **Fact:** `P-UPJDK2UN`
**Why:** Grilling Task 167 Q5. The cooldown today (touched on success AND failure by 5 callers) both blocks failed-call retries and could block the very stale-content heal Q4 said must happen now. Resolving with the 'we're in the memory business' principle (P-9V3K7KEA): the cooldown is a cost guard, correctness beats cost, so the urgent drain bypasses it while the opportunistic compress still respects it.

<!-- decision:P-M7CY5H6V -->

## Cut-Gate Test Pattern for Automatic Cron-Drain Healing

**When:** 2026-06-25 · **Fact:** `P-M7CY5H6V`
**Why:** The original D-169 bug shipped with green tests because every test pre-ran `cmk compress`, making the automatic path invisible to the test suite.

<!-- decision:P-7PNY7XKE -->

## Test Hierarchy for Automatic-Path Verification

**When:** 2026-06-25 · **Fact:** `P-7PNY7XKE`
**Why:** Integration bugs (mechanism works, but never triggers automatically) are invisible to unit tests alone. The D-169 root cause was exactly this gap.

<!-- decision:P-6PGKSVT3 -->

## Task 167 testing — agent-run unit + live agent-loop, user does nothing

**When:** 2026-06-25 · **Fact:** `P-6PGKSVT3`
**Why:** The user: 'cant we do an agent loop live test like cut-gate, me doing all this testing will kill me' then 'i dont even need to say go, this is part of the tests'. Correct on both: testing is the agent's job (binding rule), and the live end-to-end check IS part of 'tested' (the binding live-test-every-task rule), not an optional extra. The original bug shipped green because every test ran the compaction command first — so the live test must fire ONLY a session and forbid any manual drain call, or it masks the automatic path again.

<!-- decision:P-E9GEZARN -->

## HC-10: Proactive Dead Cron Detection (Question 7)

**When:** 2026-06-25 · **Fact:** `P-E9GEZARN`
**Why:** Catches scheduler liveness independently from bloat state. Distinguishes reactive safety (automatic heal) from proactive optimization (scheduled compaction). Single source prevents drift and future confusion about where truth lives.

<!-- decision:P-GYFDaTKF -->

## Billing Model: Subscription (No API Token Cost)

**When:** 2026-06-25 · **Fact:** `P-GYFDaTKF`
**Why:** Removes token cost as a gating factor when designing testing strategy. Tests can be gated on wall-clock time and rate-limits instead of cost.

<!-- decision:P-DDRMSBPC -->

## Task 167 — drop HC-10 doctor check, keep only the free auto log

**When:** 2026-06-25 · **Fact:** `P-DDRMSBPC`
**Why:** Grilling Task 167 Q7. I proposed a proactive cmk doctor HC-10 for dead-cron detection; the user cut it as redundant ceremony aimed at the wrong audience (only power users run doctor; the heal already fixes the real problem). Keeps 167 focused on the automatic fix that helps everyone, not an opt-in warning for the few who need it least.

<!-- decision:P-QVG7KT6J -->

## HC-10 — Compaction Liveness Diagnostic (Dev Nice-to-Have)

**When:** 2026-06-25 · **Fact:** `P-QVG7KT6J`
**Why:** User confirmed it as a nice-to-have; valuable for observability without blocking correctness flow.

<!-- decision:P-YGSF2T6T -->

## Task 167 Design Resolved — Implementation Ready

**When:** 2026-06-25 · **Fact:** `P-YGSF2T6T`
**Why:** Core design is final. Unblocks build. Future sessions need locked decisions without re-deriving.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-aa2R6AR6 -->

## Gate test for v0.4.1 must prove healing with only SessionStart (no manual comman

**When:** 2026-06-25 · **Fact:** `P-aa2R6AR6`

<!-- decision:P-7QH7CQPU -->

## Research evaluation tiers (Tier 1 = kit peers, Tier 2 = mechanism refs, Tier 3 =

**When:** 2026-06-25 · **Fact:** `P-7QH7CQPU`

<!-- decision:P-aM5ZNHVE -->

## OpenWolf independently built the exact heartbeat fix (last_heartbeat via mtimeMs

**When:** 2026-06-25 · **Fact:** `P-aM5ZNHVE`

<!-- decision:P-WYZ57UX4 -->

## Q2 design rule (GNU make §4.8): derive when product carries signal; stamp for "r

**When:** 2026-06-25 · **Fact:** `P-WYZ57UX4`

<!-- decision:P-MTVVY5FT -->

## Cron-Liveness Fix (167.A) Solves Root Problem; Sync-Drain Is Secondary

**When:** 2026-06-26 · **Fact:** `P-MTVVY5FT`
**Why:** 167.A eliminates the *cause* of the original compounding bug (dead cron blocks roll). This makes synchronous drain (insurance against mid-session compounding) redundant.

<!-- decision:P-MHHNDDZD -->

## SessionStart Hook Ceiling Constrains Synchronous Operations

**When:** 2026-06-26 · **Fact:** `P-MHHNDDZD`
**Why:** The live test (real `claude --print`, actual call latency) exposed that Q4's synchronous-drain goal cannot fit the hook ceiling. This is a hard architectural constraint determining solution viability.

<!-- decision:P-U32aXXFV -->

## Peer Systems Synchronize Consolidation on Stop Hook (Session END)

**When:** 2026-06-26 · **Fact:** `P-U32aXXFV`
**Why:** Resolves tension between Q4 ("correctness over speed") and live-test ceiling conflict. Peers validate this works; kit already has the SessionEnd infrastructure.

<!-- decision:P-A677aTMU -->

## Task 167 shipped — live test overturned the grilled Q4 sync-drain (D-208)

**When:** 2026-06-26 · **Fact:** `P-A677aTMU`
**Why:** The biggest meta-lesson of the Task 167 build: a confident 7-question grilling + a green unit suite still shipped an INFEASIBLE mechanism (synchronous SessionStart drain). Only the real claude --print live test caught it — the live-test-every-task rule + the lazy-framing rule applied to our OWN grilled decision. A grilled decision is not immune to being wrong; the live test is the primary source that can overturn it.

<!-- decision:P-P9HT6G2U -->

## 30s Hook Ceiling Constraint & Real Haiku Roll Timing

**When:** 2026-06-26 · **Fact:** `P-P9HT6G2U`
**Why:** Hard environmental constraints (hook timeouts, resource limits) emerge only during real execution, not during design phases.

<!-- decision:P-TQMDL5KK -->

## Cron-Liveness Gate by Heartbeat Age (Task 167.A)

**When:** 2026-06-26 · **Fact:** `P-TQMDL5KK`
**Why:** Existence checks don't distinguish "never ran" from "dead." Age-based gates are resilient to process death and match production anacron behavior.

<!-- decision:P-G6GWaMaZ -->

## Pre-Existing Issue Triage

**When:** 2026-06-26 · **Fact:** `P-G6GWaMaZ`
**Why:** Bundling obscures which failures the current change caused vs. which predate it. Separate filing prevents silent accumulation.

<!-- decision:P-FXY7PLY5 -->

## Two-Pass Review Catches Concurrency Bugs

**When:** 2026-06-26 · **Fact:** `P-FXY7PLY5`
**Why:** Composition-level thinking (logic flow) and code-level thinking (implementation, cleanup, concurrency) catch different bug classes.

<!-- decision:P-SEZYAQE5 -->

## Extract Shared Discovery Logic to Prevent Drift

**When:** 2026-06-26 · **Fact:** `P-SEZYAQE5`
**Why:** Prevents the two implementations from diverging over time, which introduces subtle bugs.

<!-- decision:P-5YNFGAUM -->

## Project Root Discovery Must Stop at $HOME Boundary

**When:** 2026-06-26 · **Fact:** `P-5YNFGAUM`
**Why:** This was a real footgun: project discovery should be contained within its own tree, not escape upward into unrelated user directories.

<!-- decision:P-K356XCRP -->

## Windows Short-Name Path Canonicalization in Discovery

**When:** 2026-06-26 · **Fact:** `P-K356XCRP`
**Why:** Without this, project discovery could fail intermittently depending on how cwd was specified (short vs long form), especially on Windows.

<!-- decision:P-VWaBFP75 -->

## Kit Delete-Guardrail False Positive on Commit Messages

**When:** 2026-06-26 · **Fact:** `P-VWaBFP75`
**Why:** Prioritizes safety over user friction

<!-- decision:P-Q2GEGHBU -->

## Step 0b Backup Implementation (Not Delete)

**When:** 2026-06-26 · **Fact:** `P-Q2GEGHBU`
**Why:** Implements the standing backup-not-wipe rule for the gate process (user explicitly preferred this over deletion)

<!-- decision:P-M2GBXRG3 -->

## v0.4.1 Release & Gate Workflow

**When:** 2026-06-26 · **Fact:** `P-M2GBXRG3`
**Why:** v0.4.1 introduces new now-roll and discovery gates; staged verification ensures all checks pass before publication

<!-- decision:P-U72QNAYa -->

## Gate Check G0: CLI Version Verification

**When:** 2026-06-26 · **Fact:** `P-U72QNAYa`
**Why:** Confirms the packed `.tgz` was correctly installed to the global npm scope. Failure indicates a broken install that must be fixed before proceeding.

<!-- decision:P-AMWUC52V -->

## Release Workflow: Tag Timing (After Gates)

**When:** 2026-06-26 · **Fact:** `P-AMWUC52V`
**Why:** Prevents publishing to npm/GitHub until all gates confirm the artifact is sound. Provides a natural rollback point (do not tag if gates fail).

<!-- decision:P-XHYR6U54 -->

## npm Glob Expansion Fails in PowerShell; Use Explicit Filename

**When:** 2026-06-26 · **Fact:** `P-XHYR6U54`
**Why:** This is a fundamental difference between PowerShell (which does not auto-expand globs in command arguments) and bash (which does). npm relies on the shell to expand patterns, so it receives the literal string and cannot find the file.

<!-- decision:P-9RRaRPE5 -->

## npm Uninstall EPERM Error with sqlite-vec DLL on Windows

**When:** 2026-06-26 · **Fact:** `P-9RRaRPE5`
**Why:** Native bindings (`.dll` files) on Windows remain locked if any process has loaded them. npm cannot unlink a locked file.

<!-- decision:P-U6Qa2BJZ -->

## Now-Roll Self-Heal (v0.4.1 Headline Feature)

**When:** 2026-06-26 · **Fact:** `P-U6Qa2BJZ`
**Why:** Claude releases change output format; the kit must detect and adapt automatically to avoid breaking memory extraction in live sessions

<!-- decision:P-K97X42ZV -->

## Pre-Session-1 Gate Procedure (v0.4.1)

**When:** 2026-06-26 · **Fact:** `P-K97X42ZV`
**Why:** v0.4.1 is a robustness release; these gates verify the kit's core safety, feature, and boundary guarantees before live testing

<!-- decision:P-G9KA7B72 -->

## Kit Install Pre-Configuration Expectation

**When:** 2026-06-26 · **Fact:** `P-G9KA7B72`
**Why:** The kit's design contract is zero-friction setup — once installed, tools work without friction. Prompts after install violate this and signal a broken install or incompatibility.

<!-- decision:P-RXFPBRQC -->

## Allow-list Entries Centralized in settings-hooks.mjs

**When:** 2026-06-26 · **Fact:** `P-RXFPBRQC`
**Why:** Centralization prevents drift and inconsistency between distributions, making the kit maintainable and responsive to upstream changes.

<!-- decision:P-L5LP3UW6 -->

## Claude Code 2.1.191 Requires Both Skill() Forms in Allow-list

**When:** 2026-06-26 · **Fact:** `P-L5LP3UW6`
**Why:** The kit has used only the bare form since Task 90 (byte-unchanged). Claude Code 2.1.x changed its Skill() permission matching logic, requiring the kit to track this upstream change (as it does for Kiro hook-format updates). This is a real breaking change for end-users.

<!-- decision:P-BU4L6RGR -->

## Claude Code 2.1.x needs Skill(name:*) wildcard to suppress skill prompts

**When:** 2026-06-26 · **Fact:** `P-BU4L6RGR`
**Why:** The v0.4.1 cut-gate caught the kit's prompt-free capture breaking on CC 2.1.191 — the bare Skill(memory-write) the kit shipped since Task 90 stopped working. This is upstream format drift the kit must track (like Kiro hook formats), and it's invisible to unit tests (no test drives a live CC skill-approval), so only the live gate caught it.

<!-- decision:P-NaE3TNXZ -->

## Re-Pack + Verify Workflow for Cut-Gate Testing

**When:** 2026-06-26 · **Fact:** `P-NaE3TNXZ`
**Why:** The installed global cmk version has the old code. Re-packing + reinstalling ensures the gate tests the merged fix. Deleting settings.local.json prevents manual overrides from masking the real behavior.

<!-- decision:P-FB9LL5S6 -->

## CMK Fix Verification Workflow (Fresh Folder, v0.4.1)

**When:** 2026-06-26 · **Fact:** `P-FB9LL5S6`
**Why:** The `:*` fix to the allow-list needs end-to-end verification in a clean environment.

<!-- decision:P-EEFMZVXB -->

## cmk install --with-semantic trusts npm exit code not the actual embedder import (Task 170)

**When:** 2026-06-26 · **Fact:** `P-EEFMZVXB`
**Why:** The v0.4.1 cut-gate showed --with-semantic reporting failure while semantic search actually worked. This is the D-199 class (a tool's exit/success not matching reality) and it bites real Windows users: a locked-DLL cleanup EBUSY after a successful install makes the kit silently NOT enable semantic, even though the embedder is present and functional. The user caught it by asking 'are you sure semantic is not working?'.

<!-- decision:P-JL4LU2VZ -->

## Verification Sequence for Task 169 & 170 (Fresh Folder Gate)

**When:** 2026-06-26 · **Fact:** `P-JL4LU2VZ`
**Why:** Proves 0.4.1 tarball contains both fixes live, working despite DLL lock; fresh folder isolates test from session state

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-QUD4MMJ7 -->

## Confirmed preference for 2-button design (richer return value) over 3-button app

**When:** 2026-06-25 · **Fact:** `P-QUD4MMJ7`

<!-- decision:P-K6XCJKFF -->

## HC-10 cut because it's redundant with auto-heal and only high-end users would ad

**When:** 2026-06-25 · **Fact:** `P-K6XCJKFF`

<!-- decision:P-7TCUN4G4 -->

## Will not ship a version with bugs — a stated quality mandate

**When:** 2026-06-26 · **Fact:** `P-7TCUN4G4`

<!-- decision:P-X7ESVWDL -->

## Always deploy .venv and install all Python packages into it

**When:** 2026-06-26 · **Fact:** `P-X7ESVWDL`

<!-- decision:P-W4YMBJ5Z -->

## Kit install should pre-allow memory-write skill; appearance of permission prompt

**When:** 2026-06-26 · **Fact:** `P-W4YMBJ5Z`

<!-- decision:P-aE2QMEUG -->

## User follows "new-folder rule" — each test gate gets a fresh isolated folder (pe

**When:** 2026-06-26 · **Fact:** `P-aE2QMEUG`

<!-- decision:P-KWZMaGB5 -->

## Prefers simpler, more direct explanations; proactively asks for clarification wh

**When:** 2026-06-26 · **Fact:** `P-KWZMaGB5`

<!-- decision:P-LCUA399S -->

## All 6 sub-tasks of task-167 completed; unit-tested, reviewed, skill-review caugh

**When:** 2026-06-26 · **Fact:** `P-LCUA399S`

<!-- decision:P-BCEHTFEP -->

## 0.4.1 release gate workflow is: 0a (commit/push) → 0b (pack/install) → backup →
_(retracted 2026-07-18)_

**When:** 2026-06-26 · **Fact:** `P-BCEHTFEP`

<!-- decision:P-LMNRQW2E -->

## v0.4.1 all pre-Session-1 gates PASS; headline features (now-roll self-heal, HC-1

**When:** 2026-06-26 · **Fact:** `P-LMNRQW2E`

<!-- decision:P-DPZAN24U -->

## Session 1 ready to begin in C:\Temp\cut-gate-v041 after Claude Code restart; gat

**When:** 2026-06-26 · **Fact:** `P-DPZAN24U`

<!-- decision:P-GWK57K7M -->

## Skill Permission Wildcard Syntax

**When:** 2026-06-26 · **Fact:** `P-GWK57K7M`
**Why:** The docs at code.claude.com/docs/en/permissions definitively show the space form. Using the wrong syntax could explain why permission rules appear present but still prompt.

<!-- decision:P-BWJKTNQY -->

## Workspace Trust Requirement for `.claude/skills/`

**When:** 2026-06-26 · **Fact:** `P-BWJKTNQY`
**Why:** This is a security model in Claude Code. The trust dialog gates all permission rules and skill load for untrusted folders, preventing execution of unreviewed code.

<!-- decision:P-JFS5DA2J -->

## Diagnostic Test: `:*` Allow-List vs Workspace-Trust

**When:** 2026-06-26 · **Fact:** `P-JFS5DA2J`
**Why:** Determine root cause — is the allow-list rule broken (doesn't match `:*`/bare forms) or is workspace-trust the blocking gate?

<!-- decision:P-P4JR23RD -->

## Before/After Config Diff to Reveal Tool Behavior

**When:** 2026-06-26 · **Fact:** `P-P4JR23RD`
**Why:** Tool docs are often ambiguous or outdated; the tool's actual output is authoritative.

<!-- decision:P-4UG42PaQ -->

## Two-Sub-Test Method for Isolating Skill Permission Gating

**When:** 2026-06-26 · **Fact:** `P-4UG42PaQ`
**Why:** Kit behavior depends on what Claude Code actually writes, not docs. Sub-tests isolate tool initialization from kit correctness.

<!-- decision:P-Z9LPQS3G -->

## Workspace Trust and Skill Permissions Are Independent Gates

**When:** 2026-06-26 · **Fact:** `P-Z9LPQS3G`
**Why:** Kit settings are inert until folder trust accepted; testing Skill behavior before accepting trust produces false negatives.

<!-- decision:P-TBUDHYTT -->

## Diagnostic Test Statement for Skill Capture

**When:** 2026-06-26 · **Fact:** `P-TBUDHYTT`
**Why:** Isolates skill-permission behavior from other Session 1 elements. Prevents test contamination: if prompt-free capture works for one rule, full Session 1 can proceed cleanly.

<!-- decision:P-L5WHXB9H -->

## CC 2.1.x mcp__server__* wildcard does not auto-approve MCP tools — need specific tool names

**When:** 2026-06-26 · **Fact:** `P-L5WHXB9H`
**Why:** The whole prompt-free promise broke at the v0.4.1 gate. We chased the Skill() form (Task 169) but the live ground-truth test proved the Skill allow-list was already correct — the real gap is the MCP wildcard mcp__cmk__* not suppressing per-tool prompts on CC 2.1.x. Caught only by watching what CC itself writes (the read-what-the-tool-wrote technique), not by docs (which claim the wildcard works).

<!-- decision:P-DW4Y4DLS -->

## Claude Code 2.1.x MCP Wildcard Auto-Approve Change

**When:** 2026-06-27 · **Fact:** `P-DW4Y4DLS`
**Why:** CC's upstream security tightening; explains the v0.4.1 regression and why Bug 171 happened

<!-- decision:P-DEaC6AAS -->

## Fresh Folder Verification Workflow for claude-memory-kit Releases

**When:** 2026-06-27 · **Fact:** `P-DEaC6AAS`
**Why:** End-to-end verification that all three v0.4.1 fixes work together (Skill form, npm exit, MCP wildcards). Unit tests can't catch these; only live prompts will.

<!-- decision:P-J9EDJSE7 -->

## v0.4.1 Fixed Three Prompt-Free Installation Bugs

**When:** 2026-06-27 · **Fact:** `P-J9EDJSE7`
**Why:** None of these three breaks are visible to unit tests (they require live Skill prompts or real locked-DLL installs). The cut-gate found them by live testing; they drove D-209/210/211 and Tasks 169/170/171.

<!-- decision:P-HGAQN79P -->

## SESSION CHECKPOINT v0.4.1 cut-gate — 3 fixes merged, awaiting CC update retest

**When:** 2026-06-27 · **Fact:** `P-HGAQN79P`
**Why:** Context at 0% / auto-compact imminent. The v0.4.1 gate found 3 real prompt-free/install bugs (all merged) but is NOT done: the user is about to update Claude Code, which may fix the skill/MCP prompt at the source — so we must retest on a fresh folder before deciding whether Task 171 is even needed. Durable-state-first so the next session resumes exactly here.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-YFTGDDA5 -->

## CC update does not fix MCP prompt — Task 171 validated

**When:** 2026-06-27 · **Fact:** `P-YFTGDDA5`
**Why:** The user wanted to know whether the Claude Code update alone fixes the prompt-free regression before deciding if Task 171 is load-bearing. The live test answers it definitively: it does not.

<!-- decision:P-27PL2ZB5 -->

## mk_remember links param InputValidationError (rough edge)

**When:** 2026-06-27 · **Fact:** `P-27PL2ZB5`
**Why:** A tool that rejects the model's natural input on first try and forces a retry is a UX rough edge worth fixing — even though it self-recovers, it wastes a turn and could confuse a less-capable model.

<!-- decision:P-YQX7SDVV -->

## OPEN: cmk MCP per-tool prompt — systematic investigation pending

**When:** 2026-06-27 · **Fact:** `P-YQX7SDVV`
**Why:** Two wrong theories were chased today (Task 171 allow-list; a false 'dev repo is prompt-free' reference). The corrected facts must survive the restart so the investigation resumes from verified ground truth, not from a faded or wrong assumption.

<!-- decision:P-B5XGGC3M -->

## MCP prompt = two-gate model; Gate 1 (server approval) is the untested fix

**When:** 2026-06-27 · **Fact:** `P-B5XGGC3M`
**Why:** Re-reading all five CC docs end-to-end (the user's request) revealed the prompt is a two-independent-gate model. The kit clears Gate 2 (tool allow-list) correctly but never clears Gate 1 (server approval) — which is the likely real cause, and is cleared by a settings field the kit does not currently write.

<!-- decision:P-PV532NCU -->

## SOLVED: enableAllProjectMcpServers:true = prompt-free MCP capture

**When:** 2026-06-27 · **Fact:** `P-PV532NCU`
**Why:** This is the answer to the whole-session-long prompt-free regression. Live-proven via a controlled single-variable test on a fresh folder — the kit's core promise (automatic, prompt-free capture) depends on it, and it must be the documented fix going forward, superseding the disproven Task 171 theory.

<!-- decision:P-JJRQT9V7 -->

## CONFIRMED: enabledMcpjsonServers:["cmk"] narrow form = prompt-free + safer

**When:** 2026-06-27 · **Fact:** `P-JJRQT9V7`
**Why:** Both the broad (enableAllProjectMcpServers) and narrow (enabledMcpjsonServers:[cmk]) forms tested prompt-free; the narrow form is chosen because it approves only the kit's own server, the correct security posture for a tool shipped to others.

<!-- decision:P-La4E54JK -->

## SKILL gate: docs say Skill(name *) space; kit writes Skill(name:*) colon — plus workspace-trust prereq

**When:** 2026-06-27 · **Fact:** `P-La4E54JK`
**Why:** The skill-use prompt is a distinct second gate from the MCP gate and still fires in every fresh folder. The skills doc documents a space-form prefix syntax that differs from the colon form the kit writes, AND a workspace-trust prerequisite — either or both could be the cause; it must be observed live, not guessed.

<!-- decision:P-GWVaLVBE -->

## SKILL gate is likely workspace-trust (one-time), not rule syntax — space form ruled out

**When:** 2026-06-27 · **Fact:** `P-GWVaLVBE`
**Why:** The space-form Skill rule didn't suppress the prompt, ruling out the syntax theory; the folder has no trust record, pointing at the documented workspace-trust prerequisite as the real skill-gate cause. Must confirm whether it clears after one approval.

<!-- decision:P-X6HLUKGM -->

## SKILL gate: clicking allow persists nothing → workspace-trust is the suspect, not syntax

**When:** 2026-06-27 · **Fact:** `P-X6HLUKGM`
**Why:** The skill prompt re-fires every session because clicking allow stores no approval — distinct from the MCP gate which did persist. All three Skill rule forms are present and still prompt, which per the docs points to the workspace-trust prerequisite, not rule syntax. The trust state is the one unconfirmed variable.

<!-- decision:P-LRRM4RPF -->

## SKILL prompt = model-auto-invoke confirmation, not allow-list-governed; auto-extract hook path is already prompt-free

**When:** 2026-06-27 · **Fact:** `P-LRRM4RPF`
**Why:** After ruling out every Skill rule form and confirming clicking allow persists nothing, the skill prompt is the model-invoke confirmation layer, outside permissions.allow. The kit's core automatic capture rides the Stop hook (prompt-free); only the explicit skill path shows this confirmation — which reframes whether it's even a blocker.

<!-- decision:P-MY56XZZ2 -->

## DECISIVE: automatic capture (Stop hook → headless --print → in-process writeFact) is structurally prompt-free

**When:** 2026-06-27 · **Fact:** `P-MY56XZZ2`
**Why:** This resolves whether the skill/MCP prompts threaten the kit's core promise: they do not. The default auto-extract path uses a background hook + a headless toolless claude --print + direct JS writes, none of which can show a user prompt. The prompts only affect the explicit/agentic paths.

<!-- decision:P-aDFRNUMD -->

## ROOT CAUSE: SKILL.md allowed-tools frontmatter triggers the approval prompt (changelog 3140)

**When:** 2026-06-27 · **Fact:** `P-aDFRNUMD`
**Why:** The CC changelog states skills with no additional permissions run without approval; the kit's SKILL.md declares allowed-tools (additional permissions), which forces the Use-skill approval. This is the real, primary-source-grounded cause — not rule syntax or workspace trust — and explains why every allow-list attempt failed.

<!-- decision:P-ZFY7KYAW -->

## Skill fix works (allowed-tools removed); now MCP cold-start race on first call

**When:** 2026-06-27 · **Fact:** `P-ZFY7KYAW`
**Why:** Removing allowed-tools fixed the skill prompt but surfaced an MCP cold-start race: the on-screen 'server isn't connected yet' message indicates the first mk_remember call beats the stdio server's connection on a fresh session, despite enabledMcpjsonServers being set.

<!-- decision:P-Z5NMSKZZ -->

## TENSION: skill allowed-tools pre-grants MCP tools — removing it fixes skill prompt but un-fixes MCP tools

**When:** 2026-06-27 · **Fact:** `P-Z5NMSKZZ`
**Why:** v041g/h were fully prompt-free WITH the skill's allowed-tools, which was pre-granting the MCP tools during skill execution; removing allowed-tools (to fix the skill prompt) reintroduced per-tool MCP prompts. The two prompts are coupled, so the fix must address both together, not one at a time.

<!-- decision:P-ZBS4a23S -->

## CORRECTION: per-tool MCP first-use prompt within one turn (no 2nd message); only skill allowed-tools suppresses it

**When:** 2026-06-27 · **Fact:** `P-ZBS4a23S`
**Why:** My prior note implied a second user message and a cold-start race; the user clarified no second preference was given — Claude chained mk_remember then mk_lessons_promote autonomously, and each distinct MCP tool prompts on first use. The settings.json allow-list does not suppress these; only the skill's allowed-tools grant did, for the tools it lists.

<!-- decision:P-3URUGUAa -->

## ANSWERED: MCP per-tool 'allow' does NOT persist across sessions (dev repo: 0 stored approvals despite dozens of clicks)

**When:** 2026-06-27 · **Fact:** `P-3URUGUAa`
**Why:** The user asked whether allow persists across sessions — the answer determines whether the prompt is a one-time cost or a recurring annoyance. Disk proof from the heavily-clicked dev repo shows zero persisted approvals, so it recurs every session; the settings allow-list does not suppress it, making the skill's per-run allowed-tools grant the most viable suppression for the agentic path.

<!-- decision:P-NT3M2GYT -->

## ZERO-popup route: steer capture to Bash cmk CLI (allow-listed, same safe path) not the MCP tools

**When:** 2026-06-27 · **Fact:** `P-NT3M2GYT`
**Why:** The user's actual goal is no popup at all, not one-click. The MCP per-tool popup is unsuppressable on 2.1.195, but Bash(cmk:*) is allow-listed and cmk remember writes through the identical safe path — so steering capture to the CLI instead of MCP achieves true zero-popup. The skill currently steers to MCP, which is the root of the popups.

<!-- decision:P-P49LTJYC -->

## RESOLVED: --from-file gives shell-proof AND popup-free capture — no MCP-vs-Bash trade-off

**When:** 2026-06-27 · **Fact:** `P-P49LTJYC`
**Why:** The shell-escaping concern was the only real reason to keep the popup-causing MCP path; the kit's existing --from-file path is both shell-proof (D-81-safe) and popup-free (Bash allow-listed), eliminating the trade-off and clearing the way to a fully prompt-free capture design.

<!-- decision:P-S7ML4UPH -->

## BEST FIX: PermissionRequest hook auto-approving mcp__cmk__* (keeps MCP path, narrow scope, matches existing hook pattern)

**When:** 2026-06-27 · **Fact:** `P-S7ML4UPH`
**Why:** The user proposed a PermissionRequest auto-approve hook and asked if it beats re-steering to Bash. It does: it kills the MCP popup while KEEPING the superior structured-param MCP path, persists across sessions, is narrowly scoped to the kit's own tools (not invasive), and matches the kit's existing PreToolUse hook pattern. Re-steering to Bash works but downgrades the capture path.

<!-- decision:P-4ZNAMQM9 -->

## allowed-tools history: Task 108 introduced the MCP popup; Task 69 original was Bash-CLI-only (prompt-free)

**When:** 2026-06-27 · **Fact:** `P-4ZNAMQM9`
**Why:** Tracing when allowed-tools changed shows the MCP-popup behavior is not original — Task 108 added MCP tools to the skill grant and steered toward them. The original Task 69 skill was Bash-CLI-only and prompt-free, which reframes the Bash-CLI fix as a restore rather than a downgrade and confirms where any skill edit must land (4 copies).

<!-- decision:P-6HARUCU5 -->

## Q1: popup is a CC 2.1.x change not a kit regression; Q2: allowed-tools (skill-scoped) ≠ permissions.allow (project-scoped), needn't match

**When:** 2026-06-27 · **Fact:** `P-6HARUCU5`
**Why:** The user asked whether the popup came from a kit change (it didn't — git shows months-stable config, so it's CC 2.1.x) and whether allowed-tools must match permissions.allow (it doesn't — they're different-scoped mechanisms evaluated by different machinery, which is why the skill grant suppresses the popup but the project rule doesn't).

<!-- decision:P-GSNNFRNE -->

## External proof: allowed-tools for MCP tools is a known unresolved CC bug (#17499, #18837→#14956 cluster)

**When:** 2026-06-27 · **Fact:** `P-GSNNFRNE`
**Why:** Two GitHub issues from other developers confirm auto-approving MCP tools via skill allowed-tools is a known, unresolved Claude Code problem — Anthropic explicitly left the MCP case unaddressed (#17499) and allowed-tools enforcement is a recurring bug cluster (#18837/#14956). This means the kit must not depend on that surface and should use a different documented mechanism (PermissionRequest hook or Bash CLI).

<!-- decision:P-4HQTBYFK -->

## COMPLETE design: one PermissionRequest hook (mcp__cmk__.* + Skill matchers) kills both popups, documented mechanism

**When:** 2026-06-27 · **Fact:** `P-4HQTBYFK`
**Why:** Docs confirm PermissionRequest matches any tool name including Skill, so a single hook mechanism can auto-approve both the MCP popup and the skill popup — using the documented auto-approve path, not the buggy allowed-tools surface. This is the complete zero-popup design for Task 172.

<!-- decision:P-MYNFF2PW -->

## SOLVED: PermissionRequest hook (mcp__cmk__.* + Skill) = prompt-free capture, live-proven on 2.1.195

**When:** 2026-06-27 · **Fact:** `P-MYNFF2PW`
**Why:** This is the resolution of the whole-day prompt-free hunt: the user's PermissionRequest hook idea, live-proven on a fresh folder, auto-approves both the MCP and skill popups so capture completes with no click — using the documented hook mechanism (not the buggy allowed-tools), keeping the MCP path, safely scoped, and persistent across sessions.

<!-- decision:P-BQ57723C -->

## DECISION: keep all layers (allow-list + allowed-tools) + ADD the hook — defense-in-depth, future-proof for CC bug fixes

**When:** 2026-06-27 · **Fact:** `P-BQ57723C`
**Why:** The user chose to keep every rule added (allow-list + skill allowed-tools) as harmless belt-and-suspenders that will activate natively once Claude Code fixes its known allowed-tools/wildcard bugs, and add the PermissionRequest hook as the working fix today. Additive, not subtractive — keeps the superior MCP path and future-proofs.

<!-- decision:P-YAEV66UK -->

## BLOCKER: claude.exe Windows-incompatible after CC update — live spawn-smokes + live-verify can't run here

**When:** 2026-06-27 · **Fact:** `P-YAEV66UK`
**Why:** The 4 full-suite failures are the live claude --print spawn-smokes failing because the Claude Code native binary is Windows-incompatible after today's update — not a kit bug and not jitter (suite is green skipping live Haiku; the diff doesn't touch that path). This blocks the live-Haiku gate and the final live-verify until the binary is fixed; recording it honestly rather than dismissing it.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-FTWRHF7H -->

## Claude.cmd Shim Workaround in .local/bin

**When:** 2026-06-27 · **Fact:** `P-FTWRHF7H`
**Why:** The broken @anthropic-ai/claude-code npm global install was being found by `claude.cmd` calls in tests. Uninstalling it alone would break `claude.cmd`. The shim ensures continuity without re-installing via npm.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-aPH3CKPU -->

## EBUSY on vec0.dll is cosmetic; npm install succeeds despite it (proven by `cmk -

**When:** 2026-06-26 · **Fact:** `P-aPH3CKPU`

<!-- decision:P-RUT3975R -->

## install.mjs grew from 26.9kB to 28.5kB in 0.4.1 tarball, confirming Task 170 fix

**When:** 2026-06-26 · **Fact:** `P-RUT3975R`

<!-- decision:P-VLC9D4Ya -->

## Claude Code only prompts for permissions when something triggers it (when user s

**When:** 2026-06-26 · **Fact:** `P-VLC9D4Ya`

<!-- decision:P-4T6WJBUF -->

## hadn't started `code .` yet; commands ended at `cmk install`

**When:** 2026-06-26 · **Fact:** `P-4T6WJBUF`

<!-- decision:P-MBKF3ZVK -->

## Do not ship fixes mid-diagnosis without consulting first — explore alternative s

**When:** 2026-06-27 · **Fact:** `P-MBKF3ZVK`

<!-- decision:P-DCaNUaDK -->

## Document everything exhaustively when context is near capacity to enable clean h

**When:** 2026-06-27 · **Fact:** `P-DCaNUaDK`

<!-- decision:P-J3GFMTAQ -->

## Task 172 live-verified from packed kit (no popup) — full suite + stress green — shipping

**When:** 2026-06-28 · **Fact:** `P-J3GFMTAQ`
**Why:** The prompt-free fix is proven end-to-end from the shipped artifact (packed → installed → default install auto-wires → no-click capture), with the full suite + stress green and the two-pass review complete. This closes the whole-day diagnosis and clears Task 172 to merge.

<!-- decision:P-PYaMHTAR -->

## Kit changes should be replicated to the live project after shipping in the kit (

**When:** 2026-06-28 · **Fact:** `P-PYaMHTAR`

<!-- decision:P-LLFCMSDM -->

## Do not include LICENSE/CONTRIBUTING/CHANGELOG sections in README; those have ded

**When:** 2026-06-28 · **Fact:** `P-LLFCMSDM`

<!-- decision:P-H3Ga44XJ -->

## README Structure for v0.4.1

**When:** 2026-06-28 · **Fact:** `P-H3Ga44XJ`
**Why:** README is scannable and progressive; secondary detail deferred to purpose-built docs; agent claims are explicit/verified

<!-- decision:P-aWBaP97F -->

## Secondary detail (Kiro reference) should live in separate docs (docs/KIRO.md), n

**When:** 2026-06-28 · **Fact:** `P-aWBaP97F`

<!-- decision:P-VPHZMR4X -->

## Use GFM + GitHub admonition syntax for formatting

**When:** 2026-06-28 · **Fact:** `P-VPHZMR4X`

<!-- decision:P-L3EaTHK7 -->

## Wants README structured like sinedied/tool-README repos (Azure serverless, run-o

**When:** 2026-06-28 · **Fact:** `P-L3EaTHK7`

<!-- decision:P-4MW445N2 -->

## Don't proactively restructure documentation without explicit approval; user pref

**When:** 2026-06-28 · **Fact:** `P-4MW445N2`

<!-- decision:P-PRD9U7T3 -->

## Documentation Structure & Tradeoff in claude-memory-kit

**When:** 2026-06-28 · **Fact:** `P-PRD9U7T3`
**Why:** npm landing page serves a different audience than root — people evaluating the package need enough info to decide without clicks elsewhere. Consistency vs. comprehensiveness at each landing page is a real structural tension in this project.

<!-- decision:P-NWJFG9HH -->

## npm Tarball & Doc Availability Strategy

**When:** 2026-06-28 · **Fact:** `P-NWJFG9HH`
**Why:** Balances fast npm installs (lean tarball) with a complete npm landing page for package evaluation; GitHub is the canonical deep-docs home

<!-- decision:P-CRRQ4RT2 -->

## Avoid Duplicating Authoritative Docs in Temp Locations

**When:** 2026-06-28 · **Fact:** `P-CRRQ4RT2`
**Why:** Only the authoritative doc is maintained; duplicates become stale and can mislead future sessions.

<!-- decision:P-AV4F6Sa9 -->

## User proactively checked whether newly-created checklist duplicates the authorit

**When:** 2026-06-28 · **Fact:** `P-AV4F6Sa9`

<!-- decision:P-ZB2AUXAV -->

## Claude Code `cd &&` Compound Command Prompting Edge

**When:** 2026-06-28 · **Fact:** `P-ZB2AUXAV`
**Why:** This is a documented edge case (gate doc D-80 / §16.57). It does NOT indicate a capture flow failure; gate sessions 1-2 confirmed the actual capture sequences were prompt-free. Future sessions may encounter this when running verification commands.

<!-- decision:P-G45AQZYN -->

## Session 3 (E1) Cold-Open Test Procedure

**When:** 2026-06-28 · **Fact:** `P-G45AQZYN`
**Why:** E1 is the final gate before v0.4.1 release. It validates that user preferences (layered, uv, ruff) promoted to the tool's default persona in Session 1 are correctly baked in.

<!-- decision:P-99XQ63aR -->

## v0.4.1 cut-gate FULLY PASSED — all CLI + Sessions 1-3 green, E1 wedge proven

**When:** 2026-06-28 · **Fact:** `P-99XQ63aR`
**Why:** The full v0.4.1 cut-gate passed end-to-end from the packed artifact, including the prompt-free capture headline (Task 172) holding through a real build flow and the cold-open wedge proven — the kit is verified ready to tag and publish.

<!-- decision:P-5BTBD4aX -->

## FastAPI Layered Backend Scaffold (Async PostgreSQL, SQLAlchemy 2.0)

**When:** 2026-06-28 · **Fact:** `P-5BTBD4aX`
**Why:** Validated scaffold matching user's recorded architecture preferences (thin routes → services → repos, Pydantic boundaries). Includes non-obvious patterns: flush-vs-commit in repos, expire_on_commit=False, shared SQLite fixture for request-scoped sessions in tests.

<!-- decision:P-7PX7BTVZ -->

## GitHub Repository SEO Optimization — Topics & About

**When:** 2026-06-28 · **Fact:** `P-7PX7BTVZ`
**Why:** GitHub SEO guides and community best practices confirm these optimizations improve discoverability for developers searching for memory tools, semantic search, Claude/Kiro integration, and local-first solutions.

<!-- decision:P-JCWYH36Z -->

## GitHub About/Topics Require Manual Paste

**When:** 2026-06-28 · **Fact:** `P-JCWYH36Z`
**Why:** GitHub repo metadata is only editable by the owner via the web UI. This is a permissions constraint, not a Claude limitation, but it creates a two-step workflow that's easy to overlook.

<!-- decision:P-3J72ZCKA -->

## Claude-memory-kit: GitHub About Configuration & User Tier Initialization

**When:** 2026-06-28 · **Fact:** `P-3J72ZCKA`
**Why:** Configures GitHub repo's public metadata for discoverability; initializes fresh persona tracking state for ongoing habit capture

<!-- decision:P-M5BFNR3R -->

## Two Distinct Memory-Recall Mechanisms in the Kit

**When:** 2026-06-28 · **Fact:** `P-M5BFNR3R`
**Why:** When describing or pitching the kit, conflating these mechanisms under a single "recall" concept obscures both its architecture and its value. The auto-load is often the more surprising and valuable feature.

<!-- decision:P-6MRTBLBH -->

## CLAUDE.md CI/Validator Binding Rule

**When:** 2026-06-28 · **Fact:** `P-6MRTBLBH`
**Why:** A prior publish-failure revealed CI was not checked on direct-to-main, and validators only caught the issue post-release. This rule prevents recurrence.

<!-- decision:P-aV37WG9C -->

## Dependency PR Decision Process

**When:** 2026-06-28 · **Fact:** `P-aV37WG9C`
**Why:** Merging breaking changes for currency alone wastes time and risk. The hard gate is CI green + compelling value, not "latest version."

<!-- decision:P-BYMDWX97 -->

## Security Scanning Stack

**When:** 2026-06-28 · **Fact:** `P-BYMDWX97`
**Why:** The project has comprehensive, automated security coverage. Future sessions need to know what safety gates are in place and trust them.

<!-- decision:P-3AE6UM2W -->

## CodeQL Alerts Close on Main Commit, Not NPM Release

**When:** 2026-06-28 · **Fact:** `P-3AE6UM2W`
**Why:** Clarifies the relationship between CodeQL workflow and release management; the previous entry expected alerts to auto-close but didn't explain the mechanism or its independence from npm versioning

<!-- decision:P-5AFG567T -->

## RESUME: commit the in-loop setDeep guard to main to close CodeQL #29 (v0.4.2 shipped but #29 still open)
_(retracted 2026-06-29)_

**When:** 2026-06-28 · **Fact:** `P-5AFG567T`
**Why:** Context ran out mid-decision. v0.4.2 published but CodeQL #29 (prototype-pollution) didn't actually close because the first guard was pre-loop; the corrected in-loop guard is done+tested but uncommitted. The alert closes on a main push (CodeQL re-scans main), independent of npm — so it needs only a commit to main, not a release.

<!-- decision:P-BEJQYEaZ -->

## CodeQL Alert #29 Fix—In-Loop Guard Requirement

**When:** 2026-06-28 · **Fact:** `P-BEJQYEaZ`
**Why:** Loop placement is non-obvious; shipping v0.4.2 claimed "3 alerts resolved" before CodeQL's docs were checked, leaving the actual fix incomplete. Future CodeQL alert work must consult query-help first.

<!-- decision:P-MLNREYVT -->

## PR #243—Final Checkpoint for Session Completion

**When:** 2026-06-28 · **Fact:** `P-MLNREYVT`
**Why:** Ensures continuity for next session. Clear termination condition (CodeQL re-scan closes #29).

<!-- decision:P-MNA5QMCG -->

## RESUME: PR #244 (direct === guard) to close CodeQL #37 — if it re-flags again, DISMISS as false-positive
_(retracted 2026-06-29)_

**When:** 2026-06-28 · **Fact:** `P-MNA5QMCG`
**Why:** The CodeQL prototype-pollution alert keeps re-flagging through 3 guard forms; PR #244 uses CodeQL's exact documented === pattern (highest confidence). Context ran out, so the next session must verify the merge closes it, with a clear stop-condition: dismiss as false-positive if a 4th re-flag occurs (the runtime guard is sound + tested; not exploitable).

<!-- decision:P-3WXW2EK4 -->

## CodeQL Prototype-Pollution Guard Recognition

**When:** 2026-06-28 · **Fact:** `P-3WXW2EK4`
**Why:** PR #244 uses the direct `===` form per CodeQL's documented sanitizer. Previous attempts (#29, #37) with Set-lookup caused repeated re-flagging; took 3 iterations to discover the constraint.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-FHAULU6M -->

## Current session is test/gate data only ("not really me"); proceeding with v0.4.1

**When:** 2026-06-28 · **Fact:** `P-FHAULU6M`

<!-- decision:P-Na6U7TPJ -->

## Injection (passive, session-start auto-load) and active recall (user-initiated s

**When:** 2026-06-28 · **Fact:** `P-Na6U7TPJ`

<!-- decision:P-LCYCaKMS -->

## User pushed back on dropping "relevant" from product pitch—values precision over

**When:** 2026-06-28 · **Fact:** `P-LCYCaKMS`

<!-- decision:P-M7EGA36Z -->

## Requesting documentation of current session state before auto-context-compaction

**When:** 2026-06-28 · **Fact:** `P-M7EGA36Z`

<!-- decision:P-G69aAGXa -->

## Proposing to merge PR #243 now and bundle both #29 and #151 into single v0.4.3 r

**When:** 2026-06-28 · **Fact:** `P-G69aAGXa`

<!-- decision:P-YNFFNRSC -->

## ADR-0012: Deferred Product Rename (Cross-Agent Trigger)

**When:** 2026-06-28 · **Fact:** `P-YNFFNRSC`
**Why:** Rename deliberately deferred while design matured. Trigger condition is now live; next major release is the natural rebranding moment.

<!-- decision:P-JRAF6ZV7 -->

## Borrowable Ideas from awrshift/claude-memory-kit

**When:** 2026-06-28 · **Fact:** `P-JRAF6ZV7`
**Why:** awrshift/claude-memory-kit is ahead on warmth (tour, proposal phrasing) and has one automation gap (git backfill) we lack. Comparison clarifies our strengths (rigor, automation, npm, breadth) and identifies real feature gaps.

<!-- decision:P-WML7VSB6 -->

## D-169: No Manual End-of-Day Rituals (Automation-First)

**When:** 2026-06-28 · **Fact:** `P-WML7VSB6`
**Why:** Manual rituals are fragile; design should self-correct instead of relying on users to remember to run commands.

<!-- decision:P-PU6T9CCK -->

## Already at v0.4.2; workflow uses tasks.md + decision log + version-lane

**When:** 2026-06-28 · **Fact:** `P-PU6T9CCK`

<!-- decision:P-KWQV23N7 -->

## Before implementing, will verify fit against actual tasks, version plan, and cod

**When:** 2026-06-28 · **Fact:** `P-KWQV23N7`

<!-- decision:P-XS5QEL2G -->

## Silent Auto-Drain + Optional Warmth Design Pattern

**When:** 2026-06-28 · **Fact:** `P-XS5QEL2G`
**Why:** Combines external warmth (proposing promotions) with internal automation philosophy (no manual trigger required). Tested decision: D-169 forbids manual rituals; optional mention adds transparency without gating.

<!-- decision:P-LP3NBRXa -->

## Three Borrowed Ideas Laned to Tasks + Versions

**When:** 2026-06-28 · **Fact:** `P-LP3NBRXa`
**Why:** Brainstorm comparison with awrshift/claude-memory-kit exposed three good ideas and one anti-pattern (manual `/close-day` ritual, rejected per D-169). Each idea now has a home in the roadmap.

<!-- decision:P-JKPFY539 -->

## Deep-Read Process for Evaluating Competing Projects

**When:** 2026-06-28 · **Fact:** `P-JKPFY539`
**Why:** README is marketing material. Biggest advantages are often buried in secondary docs or undocumented in code. A rigorous read surfaces true design vs pitch. Prior: the "awrshift" comparison suffered from surface-level claims.

<!-- decision:P-D3aLJF4T -->

## Read code and secondary docs (architecture, ADRs, design notes), not just README

**When:** 2026-06-28 · **Fact:** `P-D3aLJF4T`

<!-- decision:P-R3X4TBLZ -->

## Research→ADR→Build Workflow for Feature Adoption

**When:** 2026-06-28 · **Fact:** `P-R3X4TBLZ`
**Why:** Prevents premature build commitment; makes design decisions explicit; keeps research findings organized in release planning

<!-- decision:P-ZYQVKVHZ -->

## user's established practice is to run a cut-gate (full live verification) before

**When:** 2026-06-28 · **Fact:** `P-ZYQVKVHZ`

<!-- decision:P-6HFUXBJN -->

## Chose to finish the publish before updating About/topics, prioritizing critical

**When:** 2026-06-28 · **Fact:** `P-6HFUXBJN`

<!-- decision:P-BFVNEYaQ -->

## User questioned the decision to mirror npm README to root's lean structure, impl

**When:** 2026-06-28 · **Fact:** `P-BFVNEYaQ`

<!-- decision:P-BR5RAVUF -->

## CI gates merge decisions; red CI blocks merging.

**When:** 2026-06-28 · **Fact:** `P-BR5RAVUF`

<!-- decision:P-5KL5UKaE -->

## Better-sqlite3 is a native binary; test changes before merge.

**When:** 2026-06-28 · **Fact:** `P-5KL5UKaE`

<!-- decision:P-XZ469SEJ -->

## Project uses Dependabot for automated dependency bumps.

**When:** 2026-06-28 · **Fact:** `P-XZ469SEJ`

<!-- decision:P-9BPX64ZQ -->

## 13 Stuck Tasks — Categorization and Supersession Map

**When:** 2026-06-28 · **Fact:** `P-9BPX64ZQ`
**Why:** Risk of re-laning work that is already dead (superseded) or not actually needed. Group C requires investigation before committing; Groups A/B can move forward in parallel.

<!-- decision:P-7YE23aRT -->

## Concurrent-Write Race (Task 146) Severity Tied to Agent Multiplicity

**When:** 2026-06-28 · **Fact:** `P-7YE23aRT`
**Why:** Timing of 146 matters for risk/urgency. It's not needed for v0.4.0, but becomes load-bearing as agent count grows.

<!-- decision:P-MMY4ESK6 -->

## Release Laning and Task Dependencies (v0.4.4 + v0.5)

**When:** 2026-06-28 · **Fact:** `P-MMY4ESK6`
**Why:** Task assignment clarity prevents blocked work and surprises at release boundaries. Task 150 validates the principle: "design first, version second" prevents silent failures.

<!-- decision:P-XRWUWG5W -->

## SessionStart Hook Re-Injection (Accidental Mechanic, Untested)

**When:** 2026-06-28 · **Fact:** `P-XRWUWG5W`
**Why:** Re-injection is de-facto working but fragile and undocumented. Future maintainers might unknowingly break it.

<!-- decision:P-FT6QKCBS -->

## Task Gating Criteria (Decision Blockers and Gates)

**When:** 2026-06-28 · **Fact:** `P-FT6QKCBS`
**Why:** These are legitimate parked states (not forgotten). Each has a clear gate that, when crossed, unblocks the task. Makes the backlog legible.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-Ba5UKVX6 -->

## Preference for bundling related fixes into fewer releases rather than creating s

**When:** 2026-06-28 · **Fact:** `P-Ba5UKVX6`

<!-- decision:P-JHCKXJVE -->

## Three borrowed ideas now laned: Task 174 (git backfill, v0.4.x), Task 175 (/tour

**When:** 2026-06-28 · **Fact:** `P-JHCKXJVE`

<!-- decision:P-B46Y2M6S -->

## No naming collision with awrshift/claude-memory-kit; rename planned in ADR-0012

**When:** 2026-06-28 · **Fact:** `P-B46Y2M6S`

<!-- decision:P-SF3FLWM2 -->

## Will not skim the front page; will check primary sources (code/docs) before clai

**When:** 2026-06-28 · **Fact:** `P-SF3FLWM2`

<!-- decision:P-4AL3BZXW -->

## Tasks should be pinned to actual versions, not left vague or undocumented.

**When:** 2026-06-28 · **Fact:** `P-4AL3BZXW`

<!-- decision:P-P7TXKNa2 -->

## Link and Reference Triage Workflow

**When:** 2026-06-29 · **Fact:** `P-P7TXKNa2`
**Why:** External input must be evaluated systematically and logged to prevent re-examining the same idea, preserve decision reasoning, and enable audits for dropped concepts.

<!-- decision:P-WaB3AMYQ -->

## Research Base for Design Validation

**When:** 2026-06-29 · **Fact:** `P-WaB3AMYQ`
**Why:** Real-world implementations reveal hidden constraints, validate untested ideas, and prevent overconfidence. Grounding decisions in research provides justification for adoption, rejection, or deferral.

<!-- decision:P-75XLTRDa -->

## Memory-loop vision — continuous autonomous memory improvement

**When:** 2026-06-29 · **Fact:** `P-75XLTRDa`
**Why:** This frames a core architectural ambition for the kit — memory should improve autonomously between sessions, not just accumulate stale data

<!-- decision:P-PNPUTUSW -->

## Four Flavors of Memory-Improvement Systems

**When:** 2026-06-29 · **Fact:** `P-PNPUTUSW`
**Why:** Provides a framework to prioritize and sequence memory-improvement work. Task 179 will decide if these are one unified loop or separate complementary features.

<!-- decision:P-BS9S9KJ5 -->

## Hermes Is Skill-Library Curation, Not Memory Self-Improvement

**When:** 2026-06-29 · **Fact:** `P-BS9S9KJ5`
**Why:** Clarifies Hermes's scope; prevents confusion when Task 179 positions both memory improvement AND skill curation as separate but related features.

<!-- decision:P-VaVCPL2W -->

## Task 179 — Umbrella Task for Memory-Improvement Sequencing

**When:** 2026-06-29 · **Fact:** `P-VaVCPL2W`
**Why:** Consolidates scattered effort; ensures each flavor (A/B/C/D) is positioned correctly—either as a unified pipeline or as complementary features.

<!-- decision:P-AGSCLWSP -->

## Memclaw's 6 Passive Outcome Signals (3 Already Produced)

**When:** 2026-06-29 · **Fact:** `P-AGSCLWSP`
**Why:** Breaks a design blocker long-standing blocker. Passive signals are reachable without changing the core constraint.

<!-- decision:P-CBRTVKDQ -->

## Multi-Project Survey: 6 External Links + 1 Revisit Yields 10 Revisit-Notes

**When:** 2026-06-29 · **Fact:** `P-CBRTVKDQ`
**Why:** Documents ROI of multi-project external surveys and validates the discipline of re-checking live sources.

<!-- decision:P-J76QQ3KL -->

## Distinguish Code Gems From Pitch Copy

**When:** 2026-06-29 · **Fact:** `P-J76QQ3KL`
**Why:** Ensures captured knowledge is routed to the right place the first time, making it findable and actionable for its intended use (execution vs positioning).

<!-- decision:P-NKHH5BYD -->

## Pitch-Line Copy Candidates (D-224)

**When:** 2026-06-29 · **Fact:** `P-NKHH5BYD`
**Why:** Both are clean, memorable metaphors that directly explain core positioning. Worth preserving for the next README/About polish cycle.

<!-- decision:P-DUSJXHRY -->

## Article Verdict Pattern for Task Ingestion

**When:** 2026-06-29 · **Fact:** `P-DUSJXHRY`
**Why:** Ensures each ingested article's relevance, scope, and relationship to prior work are clear; enables principled decisions about what to keep, revise, or discard

<!-- decision:P-A3E5WU9F -->

## "Memory-as-Tool" Pattern — External Validation

**When:** 2026-06-29 · **Fact:** `P-A3E5WU9F`
**Why:** Our Task 149 "when-to-recall" fork (judgment-pulled vs always-search) is validated by external literature as a deliberate design pattern, suggesting the approach is sound and positions us alongside best practices.

<!-- decision:P-7NUMKYFH -->

## Post-Retrieval Filtering & Query Expansion (HyDE)

**When:** 2026-06-29 · **Fact:** `P-7NUMKYFH`
**Why:** The ML Mastery articles on context-aware search and effective context engineering document real techniques that directly address the paraphrase-recall problem (Task 65/99 already measures this gap).

<!-- decision:P-7EQa5V6Z -->

## RAPTOR — Hierarchical Summarization for Multi-Hop Reasoning

**When:** 2026-06-29 · **Fact:** `P-7EQa5V6Z`
**Why:** The "beyond vector search" ML Mastery article names the 5 next-gen RAG strategies; RAPTOR is the one genuinely new to our research (others — GraphRAG, ColBERT, HyDE, Agentic RAG — already appear in our task list).

<!-- decision:P-E3UELCGM -->

## RRF Configuration & Fusion Strategy

**When:** 2026-06-29 · **Fact:** `P-E3UELCGM`
**Why:** The ML Mastery hybrid-search tutorial encodes real implementation details that avoid subtle correctness bugs.

<!-- decision:P-AT4NHAQA -->

## Claude-Memory-Kit: Core Patent Novelty Research Queries

**When:** 2026-06-29 · **Fact:** `P-AT4NHAQA`
**Why:** Early positioning signal: determine whether ideas are Open (novel), Crowded, or Saturated in prior art.

<!-- decision:P-C2BJ2ZEZ -->

## Rust Crate Installation Workflow with C++ Dependencies on Windows

**When:** 2026-06-29 · **Fact:** `P-C2BJ2ZEZ`
**Why:** Understanding the build process and download cache behavior saves iteration time across install/reinstall cycles.

<!-- decision:P-GL75LQ73 -->

## Windows Terminal PATH Refresh After Visual Studio Build Tools Install

**When:** 2026-06-29 · **Fact:** `P-GL75LQ73`
**Why:** Windows/PowerShell-specific behavior: PATH caching requires full shell restart to load new binaries into the process environment.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-NR2KFGZM -->

## User confirms design-first approach for task 150 ("your instinct is right"); acc

**When:** 2026-06-28 · **Fact:** `P-NR2KFGZM`

<!-- decision:P-SBa6Y46Q -->

## User audits work for completeness/dropped concepts ("what about all the other id

**When:** 2026-06-29 · **Fact:** `P-SBa6Y46Q`

<!-- decision:P-X3AWXG6Z -->

## File tasks early (assign IDs, enter backlog) to track ideas and prevent loss (us

**When:** 2026-06-29 · **Fact:** `P-X3AWXG6Z`

<!-- decision:P-5SW9AKAL -->

## Brief affirmation confirms revisit-notes approach and validates instinct to re-c

**When:** 2026-06-29 · **Fact:** `P-5SW9AKAL`

<!-- decision:P-Y3B322DW -->

## Batch git commits across multiple projects/articles; wait until finishing at lea

**When:** 2026-06-29 · **Fact:** `P-Y3B322DW`

<!-- decision:P-FKL749WV -->

## Markdown/Git-Native Memory Space Now Crowded, Not Empty

**When:** 2026-06-29 · **Fact:** `P-FKL749WV`
**Why:** Refines our positioning. Differentiator is execution depth (auto-capture rigor, trust mechanisms, breadth) not novelty.

<!-- decision:P-H5HUXKX6 -->

## Patent Tool Is Too Noisy for Prior-Art Sweeps

**When:** 2026-06-29 · **Fact:** `P-H5HUXKX6`
**Why:** Time spent deep-reading 38 results × multiple queries yields diminishing returns. Better to use tool for breadth only and cherry-pick top results.

<!-- decision:P-7J94CRGR -->

## Capture Source — Agent Task-State via PostToolUse Hook

**When:** 2026-06-29 · **Fact:** `P-7J94CRGR`
**Why:** Reveals an underexplored capture channel. Task state is metadata-rich and orthogonal to user messaging; complements conversation-turn extraction.

<!-- decision:P-32Q5YHHV -->

## Concurrency Pattern — Partition-by-Writer (Tasks 146/50/148)

**When:** 2026-06-29 · **Fact:** `P-32Q5YHHV`
**Why:** Directly applicable to multi-agent scenarios (Tasks 146/50/148). Avoids distributed-systems complexity by enforcing ownership-based write safety.

<!-- decision:P-HJEBaWGL -->

## Market Finding — Git-Native Markdown Memory Space is Now Crowded

**When:** 2026-06-29 · **Fact:** `P-HJEBaWGL`
**Why:** Informs roadmap prioritization and competitive positioning. Category-first positioning no longer holds; depth and capture quality become the moat.

<!-- decision:P-47SKPKG7 -->

## Task 176 Reference — Typed Graph with Auto-Edge Maintenance on File Change

**When:** 2026-06-29 · **Fact:** `P-47SKPKG7`
**Why:** Direct reference implementation for Task 176's core requirement (auto-derive edges from markdown changes without explicit schema).

<!-- decision:P-YAQT3ER9 -->

## D-177 Self-Defeating Loop in Persona Graduation

**When:** 2026-06-29 · **Fact:** `P-YAQT3ER9`
**Why:** Known degradation causing personas to vanish; core problem Task 151 redesign addresses

<!-- decision:P-BMLU6Ga3 -->

## Task 151 Implementation Cadence

**When:** 2026-06-29 · **Fact:** `P-BMLU6Ga3`
**Why:** User review before implementation reduces rework and ensures design intent is clear

<!-- decision:P-WF2SKRFP -->

## Four-Move Redesign for D-177 (Persona Graduation Loop)

**When:** 2026-06-29 · **Fact:** `P-WF2SKRFP`
**Why:** Task 151 is fixing D-177, a self-defeating loop where high-trust persona traits are evicted due to cap overflow. The redesign is research-backed (Hermes/captain-claw precedents) and complete — all four moves are decided and grounded.

<!-- decision:P-3VGQYFZT -->

## letta memory model (code-read 2026-06-29): TWO durable tiers + a message buffer.

**When:** 2026-06-29 · **Fact:** `P-3VGQYFZT`
**Why:** Background-loop reference (Task 179) + 'core memory exempt from eviction' precedent (Task 151 Move 2). The maintainer is deciding whether to protect high-value memory from a cap-relief sweep; letta's answer is: durable tiers are never swept, only the message buffer is.

<!-- decision:P-BT9BNCQS -->

## Link-Out Convention for Design.md Evidence

**When:** 2026-06-29 · **Fact:** `P-BT9BNCQS`
**Why:** Prevents recurring mistakes of inlining large evidence blocks into the Spine, which bloats the critical design.md file. Future sessions need explicit guidance.

<!-- decision:P-M7PHRC7G -->

## ADR-0016 Clarification — Recurrence Gate vs. LLM Role

**When:** 2026-06-29 · **Fact:** `P-M7PHRC7G`
**Why:** User returned for clarification; prior explanation risked misdirecting task-151 and option choice. Corrected framing is essential for sound implementation.

<!-- decision:P-La4FVXJY -->

## Comparative Memory System Analysis — TencentDB as Counter-Example

**When:** 2026-06-29 · **Fact:** `P-La4FVXJY`
**Why:** Concrete counter-examples prevent overconfidence; TencentDB proves fragility is structural to LLM gates, not judgment rubric

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-3HD39BL2 -->

## v0.4.3 Build Checkpoint — Ready to Resume at 151.3

**When:** 2026-06-29 · **Fact:** `P-3HD39BL2`
**Why:** Clean checkpoint for next session; no re-derivation needed on resume. All context (decision, design, tests, task tracking) is locked in place.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ULVXZUXA -->

## User prefers durable written capture of research findings; signals this with "wr

**When:** 2026-06-29 · **Fact:** `P-ULVXZUXA`

<!-- decision:P-752LM39L -->

## Bridge-Study Research Question — Synthesized Trait Recurrence Signal

**When:** 2026-06-29 · **Fact:** `P-752LM39L`
**Why:** The recurrence signal is critical to the promotion gate. Current code assumes a pattern that may not match how the 5 systems actually work; bridge study avoids guessing.

<!-- decision:P-WDaaVEFF -->

## Task 151 Structure and Status (In-Progress Multi-Part Implementation)

**When:** 2026-06-29 · **Fact:** `P-WDaaVEFF`
**Why:** Tracking multi-part staged implementation; need location + scope for resume

<!-- decision:P-C72TUV9Z -->

## Resume point Task 151.3 recurrence gate

**When:** 2026-06-29 · **Fact:** `P-C72TUV9Z`

<!-- decision:P-MB6NX5EP -->

## Task 151.3 bridge answer cite-and-sum

**When:** 2026-06-29 · **Fact:** `P-MB6NX5EP`

<!-- decision:P-JBDL39TN -->

## Trait Recurrence Gating Design (151.3)

**When:** 2026-06-29 · **Fact:** `P-JBDL39TN`
**Why:** This design was the open question blocking 151.3. The 15-system study empirically validated it. Saving this prevents re-deriving the same analysis.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-FQNMDSZN -->

## Resume point Task 151.4 (Move 2 demote-not-evict)

**When:** 2026-06-30 · **Fact:** `P-FQNMDSZN`

<!-- decision:P-U3JGW7WP -->

## Memory Commit Workflow — Hygiene & Privacy Validation

**When:** 2026-06-30 · **Fact:** `P-U3JGW7WP`
**Why:** Memory system integrity requires clean signal separation, privacy assurance, and gitignore discipline.

<!-- decision:P-ZVBQV4NG -->

## Persona Tier-U Cap Relief — Condense In Place (151.4)

**When:** 2026-06-30 · **Fact:** `P-ZVBQV4NG`
**Why:** Cap overflow + invisibility at cold-open was a real bug (confirmed pre-fix). In-place condense preserves tier-U visibility.

<!-- decision:P-WG2UHVZX -->

## Resume point Task 151.7 (trust update rule)

**When:** 2026-06-30 · **Fact:** `P-WG2UHVZX`

<!-- decision:P-ZTaNPL3T -->

## Decision Logging in Task Entries

**When:** 2026-06-30 · **Fact:** `P-ZTaNPL3T`
**Why:** Preserves reasoning across sessions; prevents re-deriving the same design decision or losing dependency chains that feed into later work.

<!-- decision:P-7D2GKaBC -->

## Memory System Dogfooding — Internal Use as Test Case

**When:** 2026-06-30 · **Fact:** `P-7D2GKaBC`
**Why:** Ensures the memory system works for real workflows and scale, not just theory; dogfooding drives product design and reveals gaps.

<!-- decision:P-S2SHMDGK -->

## Research-Faithful Design in Sweep Order Implementation

**When:** 2026-06-30 · **Fact:** `P-S2SHMDGK`
**Why:** Grounding design decisions in research rather than intuition produces more robust, maintainable systems; research captures known best practices.

<!-- decision:P-SZE7EEYa -->

## Vitest Pool Corruption — Transient Load Failures

**When:** 2026-06-30 · **Fact:** `P-SZE7EEYa`
**Why:** Distinguishes transient vitest infrastructure issues from real code failures; prevents false-alarm debugging when all loads fail but no actual tests fail.

<!-- decision:P-MY66RUPW -->

## Documentation Architecture — Authoritative Files and Verification Checklist

**When:** 2026-06-30 · **Fact:** `P-MY66RUPW`
**Why:** Complete doc trail prevents shipping with missing context. CHANGELOG is particularly easy to miss when features are mostly internal mechanism, but recurrence promotion + persona persistence ARE user-visible.

<!-- decision:P-aAPTRPN4 -->

## Release Lane Independence Pattern

**When:** 2026-06-30 · **Fact:** `P-aAPTRPN4`
**Why:** Allows efficient release batching (multiple independent features per version) while maintaining clear traceability, decision ownership, and accountability per task.

<!-- decision:P-PKQY4FNJ -->

## Resume point Task 151.13 (last 151 sub-task)

**When:** 2026-06-30 · **Fact:** `P-PKQY4FNJ`

<!-- decision:P-YRNXAYa9 -->

## Resume point v0.4.3 pre-merge (code-complete)

**When:** 2026-06-30 · **Fact:** `P-YRNXAYa9`

<!-- decision:P-L3X6TPYY -->

## npm run stress — Transient Flake and Fresh-Run Workaround

**When:** 2026-06-30 · **Fact:** `P-L3X6TPYY`
**Why:** Tool quirk affecting pre-merge gate reliability; must rule out false negatives

<!-- decision:P-ZZ3GYLUY -->

## Two Minor Review Fixes (Commit 9d785d3)

**When:** 2026-06-30 · **Fact:** `P-ZZ3GYLUY`
**Why:** Resolved minor review findings; ensures consistent initialization and resource efficiency

<!-- decision:P-NLDPRW9Z -->

## Whole-Branch Architecture Verification Passed

**When:** 2026-06-30 · **Fact:** `P-NLDPRW9Z`
**Why:** Holistic coherence check required before merge to confirm integration is sound

<!-- decision:P-JHCFGZ7U -->

## Manual Verification Gates for Tasks 74 and 151

**When:** 2026-06-30 · **Fact:** `P-JHCFGZ7U`
**Why:** Features depend on runtime agent/session state that cannot be simulated. Honest caveats prevent over-claiming automation; live verification required before production.

<!-- decision:P-LLZZSBP3 -->

## Release Workflow and Commands for Production

**When:** 2026-06-30 · **Fact:** `P-LLZZSBP3`
**Why:** Multi-step release with specific tooling; npm script is canonical (prevents hand-edits). Tag push triggers automated CI. Stress test must pass 5/5 before merge.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-EM6G7Q53 -->

## Prefers to limit research scope and skip deep-reading when signal-to-noise is lo

**When:** 2026-06-29 · **Fact:** `P-EM6G7Q53`

<!-- decision:P-A6RZGSWP -->

## User confirms v0.4.3 (Task 151 persona-promotion redesign) as next release targe

**When:** 2026-06-29 · **Fact:** `P-A6RZGSWP`

<!-- decision:P-EENQ2YUU -->

## Expects complete research backing, not partial examples — flagged incomplete 2-s

**When:** 2026-06-29 · **Fact:** `P-EENQ2YUU`

<!-- decision:P-WKC2NJCT -->

## chose "two fields" for persona promotion (recurrence-heat for promotion, outcome

**When:** 2026-06-29 · **Fact:** `P-WKC2NJCT`

<!-- decision:P-X95HB2BQ -->

## User doesn't recall ADR-0016 specifics; gap in persistent context around gate/LL

**When:** 2026-06-29 · **Fact:** `P-X95HB2BQ`

<!-- decision:P-EDXCNY3L -->

## User's standing directive — document all major decisions/workflow in the Spine (

**When:** 2026-06-29 · **Fact:** `P-EDXCNY3L`

<!-- decision:P-KUF6CPPL -->

## Release Workflow with cut-gate Testing

**When:** 2026-06-30 · **Fact:** `P-KUF6CPPL`
**Why:** The cut-gate design decouples artifact testing from publishing, allowing full validation of the real, version-correct artifact before the irreversible step (tag push).

<!-- decision:P-7PPKYDGG -->

## User conceptualizes memory linking as a graph structure ("isn't this like the st

**When:** 2026-06-30 · **Fact:** `P-7PPKYDGG`

<!-- decision:P-U5HYTaHY -->

## Release Ownership Role Boundary

**When:** 2026-06-30 · **Fact:** `P-U5HYTaHY`
**Why:** Ensures transparency and user control over outward-facing actions (npm publish, GitHub Release, git tags); prevents accidental commits to wrong branch or publishing wrong version

<!-- decision:P-J2TSSZQJ -->

## Triage Workflow for New Findings

**When:** 2026-06-30 · **Fact:** `P-J2TSSZQJ`
**Why:** Keeps backlog organized and ties new discoveries to active planning; reduces "nice to do" ideas getting lost between releases

<!-- decision:P-SLYA3XLY -->

## Cut-gate v0.4.3 Verification Checks

**When:** 2026-06-30 · **Fact:** `P-SLYA3XLY`
**Why:** This is the baseline gate for v0.4.3; documents what was verified before release and establishes the pattern for future gate iterations.

<!-- decision:P-LTPJG9K5 -->

## Release Command Sequence for npm Packages

**When:** 2026-06-30 · **Fact:** `P-LTPJG9K5`
**Why:** This is the standard release workflow for claude-memory-kit; next releases (0.4.4, 0.5.0) will follow the same pattern.

<!-- decision:P-NDEA4RL4 -->

## Tool Quirks Discovered in v0.4.3 Testing

**When:** 2026-06-30 · **Fact:** `P-NDEA4RL4`
**Why:** These are non-obvious behaviors discovered under live testing; future workflows or gate checks need to account for them.

<!-- decision:P-64M9a7VM -->

## Release Testing Procedure (cut-gate.md)

**When:** 2026-06-30 · **Fact:** `P-64M9a7VM`
**Why:** Self-contained release procedure guards against publishing incomplete/untested builds; centralized source of truth for release workflow.

<!-- decision:P-DVV326E3 -->

## User-Tier Memory Backup Before Testing

**When:** 2026-06-30 · **Fact:** `P-DVV326E3`
**Why:** Test probes write to user memory; without backup, real memory state can be overwritten or corrupted during testing.

<!-- decision:P-GAAY4WKJ -->

## Release Workflow: Full Sequence for v0.4.3 and Future Cuts

**When:** 2026-06-30 · **Fact:** `P-GAAY4WKJ`
**Why:** This is the canonical release workflow. It ensures features are validated via cut-gate before any publication. The backup prevents test writes from corrupting real user memory.

<!-- decision:P-5MAE2QYJ -->

## Pre-Release CI Gate

**When:** 2026-06-30 · **Fact:** `P-5MAE2QYJ`
**Why:** Ensures code quality and documentation consistency before shipping

<!-- decision:P-A7K5HNM7 -->

## Release Workflow (npm script + git)

**When:** 2026-07-01 · **Fact:** `P-A7K5HNM7`
**Why:** Script automates CHANGELOG + version management (prevents manual errors); reverting (not force-push) is safer for pure version-bump commits on main.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-Y3P5YUE6 -->

## Gathers research from multiple sources (articles, URLs) and shares collections w

**When:** 2026-06-30 · **Fact:** `P-Y3P5YUE6`

<!-- decision:P-MJW2TBYQ -->

## Proceeding with full `patent` installation over manual registry sweep option (in

**When:** 2026-06-30 · **Fact:** `P-MJW2TBYQ`

<!-- decision:P-RHJaAYYU -->

## 151.4 shipped (8390c33); persona tier-U cap-relief bug fixed + CRLF regression-t

**When:** 2026-06-30 · **Fact:** `P-RHJaAYYU`

<!-- decision:P-QLCRTNWP -->

## Next: 151.5 (sweep order — low-trust-AND-stale first, high-trust persona never s

**When:** 2026-06-30 · **Fact:** `P-QLCRTNWP`

<!-- decision:P-W9ZULZMJ -->

## Pre-Release Testing Setup

**When:** 2026-07-01 · **Fact:** `P-W9ZULZMJ`
**Why:** Protects user data during pre-release testing and enables rollback if issues arise.

<!-- decision:P-EHXTGB2K -->

## Fresh CMK Install: Expected `cmk doctor` Baseline

**When:** 2026-07-01 · **Fact:** `P-EHXTGB2K`
**Why:** Future sessions running cut-gates or debugging health issues reference this baseline. A fresh install is healthy if it matches this pattern. HC-9 is essential for confirming v0.4.3 deployment integrity.

<!-- decision:P-FQNHPTPY -->

## Security & Data Integrity Validation Checklist

**When:** 2026-07-01 · **Fact:** `P-FQNHPTPY`
**Why:** The memory system must safely handle real credentials, workspace paths, and user data without accidental leaks or crashes in production.

<!-- decision:P-E4aYXK5P -->

## v0.4.3 Cut-Gate Multi-Phase Validation Structure

**When:** 2026-07-01 · **Fact:** `P-E4aYXK5P`
**Why:** This structured workflow ensures v0.4.3 passes both deterministic safety checks and live-session recall quality before release.

<!-- decision:P-NJHYLX3P -->

## Why LLM-Driven Gates Are Live-Test Flags, Not Assertions

**When:** 2026-07-01 · **Fact:** `P-NJHYLX3P`
**Why:** Live LLM decisions are inherently non-deterministic. The project deliberately accepts this tradeoff for the benefit of real LLM-driven classification in the promotion gate.

<!-- decision:P-7ZUCXDCQ -->

## Recurrence Mechanism: Fact Re-capture, Not Behavioral Repetition

**When:** 2026-07-01 · **Fact:** `P-7ZUCXDCQ`
**Why:** The kit's pitch—"traits you demonstrate but never declare get promoted"—could mislead users into expecting behavioral-pattern inference that doesn't exist. Recurrence counts fact re-emergence ≥3× in captures, not inferred action patterns. This gap between user intuition and actual design is meaningful to document before release.

<!-- decision:P-GL9NTCZ9 -->

## Cut-Gate Process for v0.4.3

**When:** 2026-07-01 · **Fact:** `P-GL9NTCZ9`
**Why:** Ensures discoveries made during development are captured before shipping, preventing data loss and enabling v0.4.4 planning.

<!-- decision:P-YP3XEYaP -->

## Shipping Principle: Fix Core-Promise Gaps Before Release

**When:** 2026-07-01 · **Fact:** `P-YP3XEYaP`
**Why:** Project opposes the lazy-framing move of shipping a product known to be broken against its headline claims. Honesty about capabilities vs. promises is foundational.

<!-- decision:P-XFKJ6QTV -->

## Release Triage: Broken Promises vs Future Features

**When:** 2026-07-01 · **Fact:** `P-XFKJ6QTV`
**Why:** Prevents shipping false headlines (broken core promises) while protecting against scope creep from features that look important but aren't load-bearing. A small, verified fix to an existing promise is worth doing before tag; everything else belongs in the next cycle.

<!-- decision:P-XFN5Q73F -->

## TDD Workflow for v0.4.3 Fixes (Tasks 182, 183)

**When:** 2026-07-01 · **Fact:** `P-XFN5Q73F`
**Why:** Small, verified fixes for core-promise gaps before shipping. Task 182 is load-bearing (persona search broken); 183 is cosmetic. Both high-confidence, low-risk changes.

<!-- decision:P-2KJXNF25 -->

## D-157 Rule — Version Assignment at Shipment

**When:** 2026-07-01 · **Fact:** `P-2KJXNF25`
**Why:** Pre-numbering creates false structure that misrepresents development reality and can lead to incorrect release planning.

<!-- decision:P-YT4aa3YD -->

## Deferred Task Decision Gate (Backlog Sweep Rule)

**When:** 2026-07-01 · **Fact:** `P-YT4aa3YD`
**Why:** User identified a real problem — 18+ tasks since v0.1 still unshipped because "ready" is not testable. This rule adds a forcing function: named triggers + mandatory sweep → prevents indefinite deferral.

<!-- decision:P-KaZ79ATN -->

## Task Planning & Laning Workflow

**When:** 2026-07-01 · **Fact:** `P-KaZ79ATN`
**Why:** Current state has tasks "fuzzy and in the air" without clear version placement. Explicit planning ensures a transparent, deterministic roadmap instead of deferring decisions during work.

<!-- decision:P-ULHVR7L2 -->

## Canonical Registry for Persona Search

**When:** 2026-07-01 · **Fact:** `P-ULHVR7L2`
**Why:** Hardcoding paths risks divergence when the registry changes. Using the canonical registry prevents drift.

<!-- decision:P-7W4CWPSD -->

## Release Handoff: PR Creation vs. Merge

**When:** 2026-07-01 · **Fact:** `P-7W4CWPSD`
**Why:** User retains final control over what ships to production.

<!-- decision:P-G4DGSZQC -->

## Task 185 Backlog-Triage Trigger

**When:** 2026-07-01 · **Fact:** `P-G4DGSZQC`
**Why:** Automates backlog cleanup after each release, preventing accumulation of stuck tasks.

<!-- decision:P-GJ9MU9DQ -->

## Two-Pass Review Discipline

**When:** 2026-07-01 · **Fact:** `P-GJ9MU9DQ`
**Why:** Skill-review provides a second perspective that catches issues the author's self-review misses. The discipline consistently adds value.

<!-- decision:P-5Y9QQ4GK -->

## Release Workflow — Cold-Open Testing Discipline

**When:** 2026-07-01 · **Fact:** `P-5Y9QQ4GK`
**Why:** Catches bugs that pass CI in dev repo but fail in real installs (learned from a prior release incident)

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-a4NCHA2J -->

## Commit 9d785d3 applied two minor fixes (recurrence-default consistency, per-call

**When:** 2026-06-30 · **Fact:** `P-a4NCHA2J`

<!-- decision:P-aDHF9ZDD -->

## When there's a documented procedure (like cut-gate.md), be directed to that doc

**When:** 2026-06-30 · **Fact:** `P-aDHF9ZDD`

<!-- decision:P-HMXBFF4L -->

## claude-memory-kit Fix Verification Protocol (v0.4.3)

**When:** 2026-07-01 · **Fact:** `P-HMXBFF4L`
**Why:** An earlier version of the fix passed tarball checks but would fail in real installs. This three-tier system catches boundary failures that dev-repo testing misses.

<!-- decision:P-NXDN4FPC -->

## claude-memory-kit v0.4.3 Release Workflow

**When:** 2026-07-01 · **Fact:** `P-NXDN4FPC`
**Why:** Ensures the fix is proven on the actual production commit (main) before publishing, not just in a dev branch.

<!-- decision:P-ZKaQ69MX -->

## Pre-Release Documentation Audit Checklist

**When:** 2026-07-01 · **Fact:** `P-ZKaQ69MX`
**Why:** Catches gaps before shipping. Ensures future contributors understand system design. v0.4.3 example: 182/183 indexer fix had to be documented in §9.2.3 (indexer walks scratchpads, skips seeds) to complete the record. User's checkpoint question ("all docs updated?") catches exactly this.

<!-- decision:P-3LaBFBLL -->

## v0.4.3 Release & Verification Process

**When:** 2026-07-01 · **Fact:** `P-3LaBFBLL`
**Why:** Exact commands & checks ensure npm + GitHub publish succeed cleanly before next task fires (Task 185 triage).

<!-- decision:P-FK3U45RA -->

## Project Discipline — Verify Claims by Reading Logs

**When:** 2026-07-01 · **Fact:** `P-FK3U45RA`
**Why:** Prevents false confidence and bugs masked by tool quirks. Enforces honest diagnostics instead of assuming exit codes are authoritative.

<!-- decision:P-ATGKYNMX -->

## SonarCloud TypeScript Analyzer Exit Code Quirk

**When:** 2026-07-01 · **Fact:** `P-ATGKYNMX`
**Why:** CI gates become unreliable. Green re-runs can mask real failures, creating false confidence. This issue blocked v0.4.3.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-QC2T9YUB -->

## User directive — "do everything until session 2" — confirms execution of entire

**When:** 2026-07-01 · **Fact:** `P-QC2T9YUB`

<!-- decision:P-TLKQMLUY -->

## TDD-like working pattern—stated once at start, never repeated; boundary test fir

**When:** 2026-07-01 · **Fact:** `P-TLKQMLUY`

<!-- decision:P-SFNSSGF5 -->

## "Search must find the persona" is a kit-level promise, not v0.4.3-specific — ref

**When:** 2026-07-01 · **Fact:** `P-SFNSSGF5`

<!-- decision:P-M5QH6Q2E -->

## Decisions must be explicit and timely — "when ready" is not a decision gate

**When:** 2026-07-01 · **Fact:** `P-M5QH6Q2E`

<!-- decision:P-4BBPNLMV -->

## Always verify installed files + behavioral tests, not just tarball contents — th

**When:** 2026-07-01 · **Fact:** `P-4BBPNLMV`

<!-- decision:P-XMMX2QA7 -->

## Redundant questioning (asking the same question twice) is not how they work; pre

**When:** 2026-07-01 · **Fact:** `P-XMMX2QA7`

<!-- decision:P-A9XK7N7X -->

## External Source Ingestion and Task Triage Workflow

**When:** 2026-07-01 · **Fact:** `P-A9XK7N7X`
**Why:** This is the ingestion machinery for continuous backlog + decision integration. Future sessions benefit from knowing this structure exists and how to use it.

<!-- decision:P-G9KBKA6B -->

## Retrieval Ranking Strategy — Avoid Score-Based Hot-Path Ranking

**When:** 2026-07-01 · **Fact:** `P-G9KBKA6B`
**Why:** Kit authors foresaw the risk before external evidence appeared. U-Mem confirms the risk is real. Our approach (no-score-ranking) is validated as a defensible tradeoff, not a missed optimization.

<!-- decision:P-WK73CWDH -->

## Memory Measurement Is Part of Learn-Loop

**When:** 2026-07-01 · **Fact:** `P-WK73CWDH`
**Why:** Clarifies project understanding and prevents misclassification of measurement-related tasks as standalone.

<!-- decision:P-HADBX5HC -->

## Self-cleaning/marginal-contribution should fold into learn-loop cluster (179/180

**When:** 2026-07-01 · **Fact:** `P-HADBX5HC`

<!-- decision:P-aLAMAPMa -->

## Triage Entries Must State Counter-Arguments

**When:** 2026-07-01 · **Fact:** `P-aLAMAPMa`
**Why:** Three recent task entries were filed by assuming flattering explanations instead of interrogating them. Entries filed this way rot until re-examined.

<!-- decision:P-HaQ2aESM -->

## Triage entries should state strongest COUNTER-ARGUMENT, not just the pitch — ide

**When:** 2026-07-01 · **Fact:** `P-HaQ2aESM`

<!-- decision:P-MTUDZHW4 -->

## "user-correction moment as most valuable capture signal" is a weak point

**When:** 2026-07-01 · **Fact:** `P-MTUDZHW4`

<!-- decision:P-UWXMNBBT -->

## Recurrence-ROI (Advantage-Update) Is Internal Learning Signal

**When:** 2026-07-01 · **Fact:** `P-UWXMNBBT`
**Why:** Earlier analysis confused this across three separate filings (vanity metric, self-cleaning, trust-update). User clarified it's for "kit processes" (internal learning), resolving confusion: ONE feedback signal, ONE purpose.

<!-- decision:P-LAAK3QE2 -->

## Recurrence-ROI is an internal signal for kit processes (to learn from), not a us

**When:** 2026-07-01 · **Fact:** `P-LAAK3QE2`

<!-- decision:P-UU4aaTZF -->

## The U-Mem paper describes ONE holistic closed-loop system, not nine separate ide

**When:** 2026-07-01 · **Fact:** `P-UU4aaTZF`

<!-- decision:P-VHKZAB2Y -->

## U-Mem Describes One Unified Loop, Not Nine Separate Features

**When:** 2026-07-01 · **Fact:** `P-VHKZAB2Y`
**Why:** Earlier analysis atomized the paper into 9 disconnected ideas, missing that it's a systems paper describing unified architecture. Recognizing it as one loop clarifies what the kit needs—a coherent feedback architecture, not 9 independent additions.

<!-- decision:P-D2NC3KF2 -->

## Memory Learn-Loop as Converged System

**When:** 2026-07-01 · **Fact:** `P-D2NC3KF2`
**Why:** The backlog converged here organically; U-Mem paper named it, validating what the kit was already discovering. Framing it as one system reframes Task 185 sweep: these five tasks are a cluster (build order? dependencies?) not independent line-items.

<!-- decision:P-MF5UKYKB -->

## Two-Host Kit Architecture (Proposed)

**When:** 2026-07-01 · **Fact:** `P-MF5UKYKB`
**Why:** This architecture reframes the kit from passive storage (IDE-only) to active learner (when hosted in an agent). The "missing feedback signal" problem has a natural solution in agent contexts, not in IDE contexts — which justifies two variants instead of retrofitting one.

<!-- decision:P-FRYN5A37 -->

## User wants to apply the kit in agents (Hermes/OpenClaw), expanding scope beyond

**When:** 2026-07-01 · **Fact:** `P-FRYN5A37`

<!-- decision:P-DH5MUCD6 -->

## IDE agents and autonomous agents are on a spectrum (signal richness + autonomy a

**When:** 2026-07-01 · **Fact:** `P-DH5MUCD6`

<!-- decision:P-STaW5V7W -->

## IDE-to-Autonomous Spectrum: Same Loop, Richer Signals

**When:** 2026-07-01 · **Fact:** `P-STaW5V7W`
**Why:** Claude was maintaining IDE-vs-agent as a binary to make the ADR cleaner. User correctly noted that Claude Code *is* an agent (multi-step tasks, `/goal` loops, tool calls) — the distinction was false. Collapsing it makes the ADR honest: a partial learn-loop ships today in the IDE; signal availability improves as the host becomes more agentic.

<!-- decision:P-PMXS5a3D -->

## Signal Portfolio for Learning Loop in Claude-Code IDE

**When:** 2026-07-01 · **Fact:** `P-PMXS5a3D`
**Why:** Claude claimed "nobody ships a usage signal" without verification. User pushed back ("did we actually look?") and suggested multiple signal types exist. Research shows the real design is a *portfolio* — different signals, different reliability, different availability per host.

<!-- decision:P-C34QJaNC -->

## Architectural Thesis: The Kit as Cross-Session Runtime

**When:** 2026-07-01 · **Fact:** `P-C34QJaNC`
**Why:** This is the foundational framing for the kit's architecture and the learn-loop inevitability. It explains why the loop is not optional but structurally forced. It's the thesis that will anchor the ADR and guide future work.

<!-- decision:P-QMCBCK9a -->

## Pausing work to refine the architectural thesis before proceeding; treating the

**When:** 2026-07-01 · **Fact:** `P-QMCBCK9a`

<!-- decision:P-9KJE54VZ -->

## Sessions are bounded agent runs; the kit's role is to make disconnected runs beh

**When:** 2026-07-01 · **Fact:** `P-9KJE54VZ`

<!-- decision:P-ZRCYDEGK -->

## The learning loop's feedback signal is inherently cross-session — a single sessi

**When:** 2026-07-01 · **Fact:** `P-ZRCYDEGK`

<!-- decision:P-MREYYEVK -->

## Corrects framing—even "long-running" agents work in bounded episodes (alert → re

**When:** 2026-07-01 · **Fact:** `P-MREYYEVK`

<!-- decision:P-RWG93HDR -->

## Episode-Based Architecture Principle (Refined)

**When:** 2026-07-01 · **Fact:** `P-RWG93HDR`
**Why:** Clarifies kit's abstraction level and applicability. Not special to Claude Code; works for any bounded-episode system (SRE, scheduled tasks, Hermes, OpenClaw, etc.).

<!-- decision:P-QE4SQY2F -->

## Research Scope: Outcome Signals in Memory Systems

**When:** 2026-07-01 · **Fact:** `P-QE4SQY2F`
**Why:** Outcome-signal feedback is the linchpin of the learning loop. Assistant's claim ("nobody does it") is unverified; worth checking against actual code before ADR.

<!-- decision:P-JCRBVWSE -->

## SRE Workflow as Reference Implementation

**When:** 2026-07-01 · **Fact:** `P-JCRBVWSE`
**Why:** Concrete spec for kit's interfaces (acquire, retrieve, feedback); grounds requirements in real work, not abstraction.

<!-- decision:P-XGACMWP7 -->

## Claude-Memory-Kit: Judge as the Per-Host Adapter

**When:** 2026-07-01 · **Fact:** `P-XGACMWP7`
**Why:** This corrected framing replaces "agent-specific" sloppiness. It guides ADR-0017 thesis and future host integrations (Hermes, OpenClaw); explains why the kit works host-agnostically.

<!-- decision:P-2Z9DWT4T -->

## "why are we back to 'it's agent-specific'?" — catches assistant backsliding into

**When:** 2026-07-01 · **Fact:** `P-2Z9DWT4T`

<!-- decision:P-7TYWM43U -->

## Failure Signal Asymmetry in Oracle-Free Contexts

**When:** 2026-07-01 · **Fact:** `P-7TYWM43U`
**Why:** Architectural constraint that defines what success metric the kit can truthfully claim.

<!-- decision:P-ANRGH3KV -->

## Memclaw's Oracle-Free Failure Loop (Reference Architecture)

**When:** 2026-07-01 · **Fact:** `P-ANRGH3KV`
**Why:** Proves the loop is transferable to session-host without ground-truth oracle. Only code precedent that closes contradiction→weight→ranking pipeline.

<!-- decision:P-WWZZWFQ5 -->

## Memory Systems Failure-Learning Survey (9 Systems)

**When:** 2026-07-01 · **Fact:** `P-WWZZWFQ5`
**Why:** Establishes kit's position relative to precedent and identifies the real gap (inertness, not absence of fields).

<!-- decision:P-DXX9SWFN -->

## Outcome Signal Portfolio (8 Types, 2 Transferable)

**When:** 2026-07-01 · **Fact:** `P-DXX9SWFN`
**Why:** Identifies the implementable wins and the deceptive signals to avoid.

<!-- decision:P-7X6U2YQM -->

## Systematic Literature Review Protocol (4-Phase)

**When:** 2026-07-01 · **Fact:** `P-7X6U2YQM`
**Why:** Convenience sampling masked blind spots; systematic enumeration grounds representativeness claims in actual field coverage, not selection bias.

<!-- decision:P-35SQ5FUA -->

## ADR Provisional Decision Pattern

**When:** 2026-07-01 · **Fact:** `P-35SQ5FUA`
**Why:** Allows durable recording of the decision framework while acknowledging that conclusions are data-dependent. Also satisfies the kit's strict validator (which catches dangling references before they're created).

<!-- decision:P-ZXJTUNVQ -->

## DECISION-LOG Records Validation Outcomes

**When:** 2026-07-01 · **Fact:** `P-ZXJTUNVQ`
**Why:** Separating framework (ADR) from outcomes (DECISION-LOG) allows durable decision logic while capturing the real-world validation data.

<!-- decision:P-X3CWAU33 -->

## Kit's Strict Forward-Reference Validation

**When:** 2026-07-01 · **Fact:** `P-X3CWAU33`
**Why:** The strictness is intentional — it ensures documentation consistency by immediately surfacing gaps. When the kit references an ADR in conversation, the validator catches it if that ADR doesn't exist yet.

<!-- decision:P-AHZ6X9QF -->

## Memoria learns-from-failure: wrong-feedback down-ranks (code-verified, oracle-free)

**When:** 2026-07-01 · **Fact:** `P-AHZ6X9QF`
**Why:** Fixes the untrustworthy-denominator problem in the U-Mem-driven learns-from-failure survey: Memoria was the strongest NEW candidate but code-unverified (README/DEV-article confirmed the transferable signal but never documented whether `wrong` actually decrements/down-ranks/prunes). A code read settles it as a YES with a verbatim mechanism, and the discriminator (oracle-free, user-supplied signal) makes it directly relevant to claude-memory-kit's own deferred trust_score-in-ranking question — Memoria is a working precedent for exactly the loop cmk defers: contradiction/relevance feedback that dampens AND feeds ranking.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-PZE9526G -->

## "we can change it to be more to our use case" — prefers to reframe/adapt solutio

**When:** 2026-07-01 · **Fact:** `P-PZE9526G`

<!-- decision:P-STJQXVG5 -->

## You are building ADR-0017 and will frame it as a corrected, fact-grounded decisi

**When:** 2026-07-01 · **Fact:** `P-STJQXVG5`

<!-- decision:P-XQJTLWCH -->

## You successfully challenged my "nobody ships outcome/failure signals" claim — th

**When:** 2026-07-01 · **Fact:** `P-XQJTLWCH`

<!-- decision:P-LDCZHDQH -->

## User challenges 11-system sample as insufficient without systematic enumeration

**When:** 2026-07-01 · **Fact:** `P-LDCZHDQH`

<!-- decision:P-565H3TG2 -->

## User prefers to send articles/projects in batches and explore how items connect

**When:** 2026-07-01 · **Fact:** `P-565H3TG2`

<!-- decision:P-3VNHa793 -->

## `gh pr merge` without explicit PR number defaults to current branch; must specif

**When:** 2026-07-01 · **Fact:** `P-3VNHa793`

<!-- decision:P-PCMFXEPM -->

## PR1-PR5 persona checks passed — recurrence bump, demote-not-evict, trust-score m

**When:** 2026-07-01 · **Fact:** `P-PCMFXEPM`

<!-- decision:P-PC545AJX -->

## Session 1 captured 18 rich facts with correct explicit-vs-inferred classificatio

**When:** 2026-07-01 · **Fact:** `P-PC545AJX`

<!-- decision:P-TLNYHYAQ -->

## Recurrence mechanism increments only when same canonical fact (content-hash matc

**When:** 2026-07-01 · **Fact:** `P-TLNYHYAQ`

<!-- decision:P-BX7RQAKX -->

## Security validation B3-B7, C1-C6, FQ1 passed — Poison_Guard rejects keys, home-p

**When:** 2026-07-01 · **Fact:** `P-BX7RQAKX`

<!-- decision:P-RC9DUKaY -->

## Fixes 182+183 are verified small (tier-U paths already correct, multi-section pa

**When:** 2026-07-01 · **Fact:** `P-RC9DUKaY`

<!-- decision:P-RVCAYPHC -->

## Catches when their own systems violate their stated design principles; treats do

**When:** 2026-07-01 · **Fact:** `P-RVCAYPHC`

<!-- decision:P-7JZRB4KS -->

## Prefers identifying and fixing systemic issues over applying local patches

**When:** 2026-07-01 · **Fact:** `P-7JZRB4KS`

<!-- decision:P-HSFDD2XD -->

## User-correction signal only fires on failure, systematically misses what works —

**When:** 2026-07-01 · **Fact:** `P-HSFDD2XD`

<!-- decision:P-UDVQ2MaB -->

## User probes whether RL/reward machinery can be adopted/reimagined for the kit it

**When:** 2026-07-01 · **Fact:** `P-UDVQ2MaB`

<!-- decision:P-G9DRAJS9 -->

## Questioned whether "nobody ships a usage signal" was actually verified; suggeste

**When:** 2026-07-01 · **Fact:** `P-G9DRAJS9`

<!-- decision:P-FMJCSY7Y -->

## Indicates preference for concrete workflow examples (SRE pattern) over abstract

**When:** 2026-07-01 · **Fact:** `P-FMJCSY7Y`

<!-- decision:P-G9HK4PCK -->

## Wants to understand the actual architectural difference between agent-in-IDE vs

**When:** 2026-07-01 · **Fact:** `P-G9HK4PCK`

<!-- decision:P-WQ3XTVZ7 -->

## Expect explicit flagging and justification when assistant changes plans; silent

**When:** 2026-07-01 · **Fact:** `P-WQ3XTVZ7`

<!-- decision:P-BRaLCQ7T -->

## User's timezone/account region is Asia/Jerusalem (from error message "resets 11:

**When:** 2026-07-01 · **Fact:** `P-BRaLCQ7T`

<!-- decision:P-6NWQ6U9M -->

## Verify-Then-Spend Methodology (this project)

**When:** 2026-07-01 · **Fact:** `P-6NWQ6U9M`
**Why:** Expensive runs can burn budget fast (e.g., 36 agents last instance). Filtering up-front prevents re-runs and improves signal.

<!-- decision:P-7H4BLP3N -->

## Automatic-Oracle-Free Quadrant Is the Real Design Target

**When:** 2026-07-01 · **Fact:** `P-7H4BLP3N`
**Why:** Kit has no oracle grounding (no benchmarks) and can't rely on continuous human judgment. This quadrant enables continuous failure-learning in background without either dependency. Failure signals (errors, contradictions, misses) are especially automatic to detect.

<!-- decision:P-JCRD4Z7D -->

## High-Impact Signals to Prioritize for Implementation

**When:** 2026-07-01 · **Fact:** `P-JCRD4Z7D`
**Why:** Immediate signals are oracle-free, automatic, low-cost. Heavier signals are powerful but blocked on recall-tracking. Negative-exemplar is the cheapest novel idea.

<!-- decision:P-RCFJSFHD -->

## Seven Novel Signal Types for Memory Learning (27-System Survey)

**When:** 2026-07-01 · **Fact:** `P-RCFJSFHD`
**Why:** The 27-system survey (18 wave-1 + 9 wave-2) discovered these by analyzing how systems implement learning. They expand the kit's signal portfolio beyond pairwise contradiction and tool-result feedback. Several (peer-disagreement, negative-exemplar) are oracle-free and automatic.

<!-- decision:P-XGLKUMVN -->

## Survey Scope and Classification Taxonomy

**When:** 2026-07-01 · **Fact:** `P-XGLKUMVN`
**Why:** This scope and taxonomy define what was actually measured and its limits. Benchmark-oracle systems are out-of-scope for session-host learning; "transferable" is assessed relative to CMK's constraints, not benchmarks.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-aN56GAHP -->

## User is cost-conscious by default, notices budget burn ("we blow all my token bu

**When:** 2026-07-01 · **Fact:** `P-aN56GAHP`

<!-- decision:P-TLLH95BT -->

## Design goal is automatic background signals that don't depend on human feedback

**When:** 2026-07-01 · **Fact:** `P-TLLH95BT`

<!-- decision:P-XEZZDBMD -->

## Two separate axes were being conflated: (1) oracle vs no-oracle, (2) automatic v

**When:** 2026-07-01 · **Fact:** `P-XEZZDBMD`

<!-- decision:P-RJFFUUNN -->

## Architectural Thesis: Session→Runtime→Learning→Judge

**When:** 2026-07-01 · **Fact:** `P-RJFFUUNN`
**Why:** Emerged from deliberate research and multiple verification passes. Reframes product identity and redirects priority. Validated by dogfooding—the session proved survival across boundaries (laptop close, token death, model switch) through committed files.

<!-- decision:P-ZCMaPDQ4 -->

## Token Cost Lesson: Reading vs. Thinking Efficiency

**When:** 2026-07-01 · **Fact:** `P-ZCMaPDQ4`
**Why:** Enumeration-for-completeness is seductive but low-ROI. The real work lived in conversational thinking and user-supplied corrections.

<!-- decision:P-9BDaHHAE -->

## ADR-0017 Finalization Agenda

**When:** 2026-07-01 · **Fact:** `P-9BDaHHAE`
**Why:** Survey landed twice; ADR still said "in progress." Confidence-gating is critical to coherence. Honesty-differentiator emerged only in corpus-level context. Feedback-security is an unexamined gap.

<!-- decision:P-JDP4JQ5P -->

## Corpus Re-Read Decision Audit

**When:** 2026-07-01 · **Fact:** `P-JDP4JQ5P`
**Why:** Multi-artifact projects hide insights at the intersections. The audit is replicable and produces actionable fix-lists and sequencing.

<!-- decision:P-AHQDKFSR -->

## Recurrence as System Fuel (Master Variable)

**When:** 2026-07-01 · **Fact:** `P-AHQDKFSR`
**Why:** System-level insight visible only when reading the corpus as one piece. Recognizing recurrence as fuel reframes multiple signal-selection and weighting decisions.

<!-- decision:P-X5aKHFTY -->

## 2026-07-01 Arc: Complete Output Inventory and At-Risk Layer

**When:** 2026-07-01 · **Fact:** `P-X5aKHFTY`
**Why:** The arc produced a thesis (recurrence as the fuel variable) and created multiple output layers. A future session asking "what exists from this arc" needs the complete picture, including what's at-risk. The design principle (evidence-linked claims, decision-trail preservation) makes raw-evidence preservation a design choice, not an afterthought.

<!-- decision:P-ZKSCB7A6 -->

## Kit Dogfooding: The Arc That Redefined Memory Capture Was Itself Captured

**When:** 2026-07-01 · **Fact:** `P-ZKSCB7A6`
**Why:** The kit is designed to improve its own memory practices. The fact that it captured the session that improved the kit — and that the capture is now useful to the user — proves the kit works on itself. This feedback loop is how the project self-validates.

<!-- decision:P-UKFHGaWD -->

## Raw Research Evidence: Preservation vs. Synthesis-Only Boundary

**When:** 2026-07-01 · **Fact:** `P-UKFHGaWD`
**Why:** Kit design requires decision-trail preservation and evidence-linked claims. Losing raw evidence breaks auditability — a future reader can't verify claims trace to real findings. Synthesis notes are valuable; raw evidence is the ground truth.

<!-- decision:P-LT3J2JJU -->

## Research Cycle Workflow: Enumerate → Triage → Deep-Read → Synthesize

**When:** 2026-07-01 · **Fact:** `P-LT3J2JJU`
**Why:** Research cycles are fundamental to this project's evolution (the kit improves by studying other systems). The harness is not a one-shot artifact; it's infrastructure for future cycles.

<!-- decision:P-YLDXYKFH -->

## Design Discipline — Keep Systems Whole

**When:** 2026-07-01 · **Fact:** `P-YLDXYKFH`
**Why:** The decomposition pattern — turning "design the closed loop" into "wedge tasks + ADR sketches + later decisions" — is a reflexive failure mode. It prevents the design from being reviewed, challenged, or finalized as one artifact.

<!-- decision:P-WCKMLAGA -->

## Kit Design Methodology & Current State

**When:** 2026-07-01 · **Fact:** `P-WCKMLAGA`
**Why:** Figure 2 is the integration point where the entire research effort culminates. Without it, work stays scattered (ADR sketches, backlog fragments, parts-in-a-bin). With it, design becomes one coherent machine and ADR-0017's Decision becomes finalizeable.

<!-- decision:P-3W96QBNW -->

## ADR-0017 Ready for Adoption Decision

**When:** 2026-07-01 · **Fact:** `P-3W96QBNW`
**Why:** Clears adoption gate; enables implementation phase

<!-- decision:P-9AaQMUFS -->

## D-249 Doc-Drift Walk: Structural Update Guard

**When:** 2026-07-01 · **Fact:** `P-9AaQMUFS`
**Why:** Makes doc drift visible per-commit; prevents silent rot

<!-- decision:P-AG5FYCWH -->

## Documentation Wiring: Three-Stage Prevention Pattern

**When:** 2026-07-01 · **Fact:** `P-AG5FYCWH`
**Why:** Prevents silent rot; makes doc debt visible structurally, not via memory

<!-- decision:P-XTWUFD62 -->

## Raw Research Data Preservation Decision Pending

**When:** 2026-07-01 · **Fact:** `P-XTWUFD62`
**Why:** At risk of temp-cleanup loss without explicit choice

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-KKQa4aKV -->

## Outcome learning for memory systems should not be failure-only; both success and

**When:** 2026-07-01 · **Fact:** `P-KKQa4aKV`

<!-- decision:P-RXRZF6S9 -->

## Wants composite representations (diagrams, graphs, anatomical models) that hold

**When:** 2026-07-01 · **Fact:** `P-RXRZF6S9`

<!-- decision:P-NQTS2NRN -->

## Prioritizes result outcome over token/time cost; willing to spend resources for

**When:** 2026-07-01 · **Fact:** `P-NQTS2NRN`

<!-- decision:P-KNWJBUZA -->

## Validates deliberate deferral of decisions when supported by research; does not

**When:** 2026-07-01 · **Fact:** `P-KNWJBUZA`

<!-- decision:P-UGK5BTBF -->

## Core task is superimposing U-Mem's feedback loop onto the kit, making it our own

**When:** 2026-07-01 · **Fact:** `P-UGK5BTBF`

<!-- decision:P-VKTQFKBR -->

## Deferred Task Trigger Convention

**When:** 2026-07-02 · **Fact:** `P-VKTQFKBR`
**Why:** Keeps speculative work out of the active board while ensuring deferral is visible, actionable, and not forgotten. Each condition is concrete enough to watch for.

<!-- decision:P-4LM6ZATU -->

## v0.4.4 and v0.5.0 Build Phases

**When:** 2026-07-02 · **Fact:** `P-4LM6ZATU`
**Why:** v0.5.0 is the major release carrying the adopted learn-loop design (ADR-0017). The phase sequence reflects inter-dependencies (190's recall-log data feeds 189; 191's judgment files unblock 180).

<!-- decision:P-B6UMaKWN -->

## Cross-Machine File Sorting Must Be Byte-Deterministic

**When:** 2026-07-02 · **Fact:** `P-B6UMaKWN`
**Why:** Build reproducibility and cross-machine determinism; files sorted differently per locale breaks CI/distribution

<!-- decision:P-NDFFVRaT -->

## Tests Excluded From SonarCloud Analysis

**When:** 2026-07-02 · **Fact:** `P-NDFFVRaT`
**Why:** Prevents false-positive Quality Gate failures from test fixtures designed to demonstrate defenses

<!-- decision:P-KKXDa34P -->

## Harness Support Roadmap (Task 196) and Versioning Policy

**When:** 2026-07-02 · **Fact:** `P-KKXDa34P`
**Why:** Multiple harnesses require clear roadmap and versioning to avoid ad-hoc decisions and release-pressure coupling.

<!-- decision:P-ZTU5FXK6 -->

## Kit Name Change (Task 195) — Timeline and Decision Point

**When:** 2026-07-02 · **Fact:** `P-ZTU5FXK6`
**Why:** Renaming costs grow with users; ADR defer condition is now live; decision needed at v0.4.4 cut.

<!-- decision:P-QFa7MTRG -->

## Breadth Lane Stall Root Cause (Four Consecutive Displacements)

**When:** 2026-07-02 · **Fact:** `P-QFa7MTRG`
**Why:** Understanding this as death-by-a-thousand-cuts (not a single bad decision) helps design a re-decision that sticks by accounting for how priorities actually shift, not assuming they won't.

<!-- decision:P-JFLF6J7S -->

## Three Options for v0.4.5+ (Breadth Lane Decides at v0.4.4 Cut)

**When:** 2026-07-02 · **Fact:** `P-JFLF6J7S`
**Why:** The stall had no clear signal about which adapters matter. Three options exist; the decision must be made explicitly with user input driving prioritization.

<!-- decision:P-YSZPTZVJ -->

## cmk is the established product brand in practice

**When:** 2026-07-02 · **Fact:** `P-YSZPTZVJ`
**Why:** The tool already has a practical brand identity; informs naming/branding strategy. Distinguishes "product brand" (cmk) from "package/distribution name" (claude-memory-kit).

<!-- decision:P-2663WQEX -->

## Committed Roadmap (v0.4.4–v0.5.0)

**When:** 2026-07-02 · **Fact:** `P-2663WQEX`
**Why:** User prioritized breadth (multi-harness support) over depth (learn-loop); deferred name decision until multi-harness is proven real. Validated by `validate-backlog-triggers` on each `npm test`.

<!-- decision:P-XD9BCGVB -->

## Task 195 bake-off: add Letta term-collision validation

**When:** 2026-07-02 · **Fact:** `P-XD9BCGVB`
**Why:** core-memory-kit is the leading name, but validation defers until Cursor+Codex ship. Letta's existing "core memory" term is a specific checkable constraint within that bake-off.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-U4XX9SEP -->

## "i wanted the research so the decisions will write them self" — research-first m

**When:** 2026-07-01 · **Fact:** `P-U4XX9SEP`

<!-- decision:P-NRBD56HF -->

## CLAUDE.md Checkpoint #4: Pre-commit Screening Rule

**When:** 2026-07-02 · **Fact:** `P-NRBD56HF`
**Why:** Ensures no credentials or absolute home paths are published in fact files

<!-- decision:P-4P5379aN -->

## Task 71 Pre-commit Hook (Backlog)

**When:** 2026-07-02 · **Fact:** `P-4P5379aN`
**Why:** Poison_Guard screens facts at write time, but the commit-boundary screen is hand-rolled; automating this would reduce recurring manual work

<!-- decision:P-3LVHaFAY -->

## v0.4.4 Build Order

**When:** 2026-07-02 · **Fact:** `P-3LVHaFAY`
**Why:** Confirms task sequencing and identifies that expires_at needs to be added to source as part of 66.3, not assumed to exist

<!-- decision:P-NUTKEA6V -->

## Expires_at Field — Design and External Precedent

**When:** 2026-07-02 · **Fact:** `P-NUTKEA6V`
**Why:** Expiry/TTL is well-validated across tools; the risk isn't the idea but whether it gets populated. This context justifies 66.3's population-focused design.

<!-- decision:P-HWQ9TaK9 -->

## Task 66.1 Complete — writeFact Shape Field Validation

**When:** 2026-07-02 · **Fact:** `P-HWQ9TaK9`
**Why:** Shape field is the foundation for fact classification in the writeFact slice; enables downstream features like auto-extract for ephemeral facts.

<!-- decision:P-a4CPUUQa -->

## Task 66.3 Scoped — Population + Enforcement, Both Required

**When:** 2026-07-02 · **Fact:** `P-a4CPUUQa`
**Why:** Earlier user feedback identified that expires_at (designed but unimplemented) risks becoming useless enforcement. The actual work is ensuring *something* populates the field, not building enforcement for a bare field.

<!-- decision:P-5UDDLD2V -->

## Expiry Mechanism Precedents & Anti-Patterns

**When:** 2026-07-02 · **Fact:** `P-5UDDLD2V`
**Why:** Addresses 66.3's core risk: without a validated writer path, feature stays dead (D-169 class). Precedent confirms caller-set is only working pattern; confusion between staleness/absolute breaks user intent (fact marked "expires Friday" should not auto-extend); sweep-only enforcement fails silently.

<!-- decision:P-JQ5UBKZ4 -->

## Auto-Extract Expiry — Bounded Design (Never Guesses)

**When:** 2026-07-02 · **Fact:** `P-JQ5UBKZ4`
**Why:** D-258a captures the rationale. Auto-extract is unprecedented; guessing expiry would corrupt the memory corpus. Bounding to Plan/Event facts with stated expiries ensures only facts with obvious, explicit dates are tagged.

<!-- decision:P-FCB2THCC -->

## Expires_at Enforcement — Dual-Mode (Read-Time + Sweep)

**When:** 2026-07-02 · **Fact:** `P-FCB2THCC`
**Why:** Enforcing at read-time + sweep ensures expiry is immediate (user perception) and eventual (database hygiene). Tombstone instead of hard-delete maintains audit trail per D-163.

<!-- decision:P-THHJ4TVU -->

## Task 66 Subtask Dependencies and Next Gate

**When:** 2026-07-02 · **Fact:** `P-THHJ4TVU`
**Why:** Task 66.2/66.4 cannot proceed until these design forks are resolved; contradiction-DETECTION strategy is the critical path blocker.

<!-- decision:P-UXNMS2M3 -->

## Contradiction Detection Design (D-259)

**When:** 2026-07-02 · **Fact:** `P-UXNMS2M3`
**Why:** Experiments on dogfood corpus (1,246 real facts) showed lexical similarity fails (zero pairs >0.5 score), but subject grouping + Haiku achieves perfect classification; contradictions share subjects, not words

<!-- decision:P-LGNBM7E5 -->

## FTS5 Tokenization Quirk With Version Identifiers

**When:** 2026-07-02 · **Fact:** `P-LGNBM7E5`
**Why:** Discovered during D-259 design work when building same-subject candidate search by version tokens

<!-- decision:P-ZQ6QSWTH -->

## Concurrency Flake Root Cause: Real Timeout Under Load

**When:** 2026-07-02 · **Fact:** `P-ZQ6QSWTH`
**Why:** Helps distinguish production bugs from test brittleness. The fallback behavior is correct by design; tests need injection seams to assert it reliably across load conditions.

<!-- decision:P-D6VRFY9Z -->

## Injection-Seam Pattern for Timeout-Critical Tests

**When:** 2026-07-02 · **Fact:** `P-D6VRFY9Z`
**Why:** Under concurrent load (5× suite), production timeouts can actually fire, causing tests that assume quick completion to fail. Decouples test execution speed from production timeout behavior.

<!-- decision:P-TAFZMXTD -->

## Kit Design Principle: Zero Git-Writing Code

**When:** 2026-07-02 · **Fact:** `P-TAFZMXTD`
**Why:** Prevents accidental or unintended commits; ensures user retains full control over git history; aligns with the kit's design philosophy as a passive memory layer.

<!-- decision:P-GSJ3QVL5 -->

## Standing Outward-Step Rule

**When:** 2026-07-02 · **Fact:** `P-GSJ3QVL5`
**Why:** Separates routine automation from decisions requiring human judgment; preserves user control over final release and shipping.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-LDGERRW2 -->

## Verifies that all documentation is complete after major fixes — asks "and everyt

**When:** 2026-07-02 · **Fact:** `P-LDGERRW2`

<!-- decision:P-TE9SVR6N -->

## You're challenging a silent drift: v0.4.x was supposed to be the breadth lane (a

**When:** 2026-07-02 · **Fact:** `P-TE9SVR6N`

<!-- decision:P-ZDX4QFaF -->

## Chose Option A — prioritize Cursor and Codex adapters (breadth-first) before rec

**When:** 2026-07-02 · **Fact:** `P-ZDX4QFaF`

<!-- decision:P-QLRWTVVE -->

## Deferral trigger: name re-evaluation when "really support more IDE/CLI harnesses

**When:** 2026-07-02 · **Fact:** `P-QLRWTVVE`

<!-- decision:P-R4CEEWGS -->

## Will defer full rename until multi-harness support is proven real, not just plan

**When:** 2026-07-02 · **Fact:** `P-R4CEEWGS`

<!-- decision:P-573LQS4P -->

## Requested verification that comparative research across other systems was conduc

**When:** 2026-07-02 · **Fact:** `P-573LQS4P`

<!-- decision:P-C2GVaY4G -->

## Release Gate Documentation Format in cut-gate.md

**When:** 2026-07-02 · **Fact:** `P-C2GVaY4G`
**Why:** The format is the living standard for release gates in this project. A future version gate will follow the same structure and conventions. The format ensures gates are repeatable, auditable, and clear about which checks are manual vs. deterministic.

<!-- decision:P-5PMG774Q -->

## v0.4.4 Release Gate Checks

**When:** 2026-07-02 · **Fact:** `P-5PMG774Q`
**Why:** v0.4.4 introduces temporal-validity and manual-config functionality. These gates verify the feature works and the release is safe. Some checks are deterministic and reproducible; others require live-Haiku judgment and manual verification. Recording which are manual prevents misunderstanding during the release.

<!-- decision:P-aUNXXaRE -->

## Release Cut Sequencing and Prerequisites (v0.4.4 Pattern)

**When:** 2026-07-02 · **Fact:** `P-aUNXXaRE`
**Why:** Prevents accidental double-release. Version info must be committed before pack. Doc must be pushed before sync. Guards (version check, cmk --version) verify correctness.

<!-- decision:P-UBMTG4BL -->

## Tool Quirk - cmk pack Uses Committed Tree Version

**When:** 2026-07-02 · **Fact:** `P-UBMTG4BL`
**Why:** Build tool reads committed state, not uncommitted changes. Non-obvious and can cause version mismatches if release commit has not yet reached main.

<!-- decision:P-SAGHE2A2 -->

## Release Cut: Tag Version Must Match package.json

**When:** 2026-07-02 · **Fact:** `P-SAGHE2A2`
**Why:** Accidental tag/version mismatches trigger unintended publishes to npm.

<!-- decision:P-aH493FLQ -->

## Windows npm uninstall EPERM on better_sqlite3 is Benign

**When:** 2026-07-02 · **Fact:** `P-aH493FLQ`
**Why:** Prevents false alarms during release cuts when this warning appears.

<!-- decision:P-BLUaWBJM -->

## Reset Procedure for Gate Testing (Clean-Slate Mode)

**When:** 2026-07-02 · **Fact:** `P-BLUaWBJM`
**Why:** Gate procedures (esp. B3/B4/B8) validate fresh-install behavior. Backup ensures zero data loss and easy rollback if needed.

<!-- decision:P-ENFBJUXW -->

## Claude Code 2.1.198 Permission Hook Regression

**When:** 2026-07-02 · **Fact:** `P-ENFBJUXW`
**Why:** A/B test isolated the cause (identical config, new environment). Real blocker for users on CC 2.1.198 using auto-approve hooks.

<!-- decision:P-J9UAQKSJ -->

## Regression Isolation: A/B Test Old Config in New Environment

**When:** 2026-07-02 · **Fact:** `P-J9UAQKSJ`
**Why:** Rules out variables systematically. Avoids guessing or chasing red herrings.

<!-- decision:P-CTVJRZFF -->

## System-Written Grants File as Specification

**When:** 2026-07-02 · **Fact:** `P-CTVJRZFF`
**Why:** The system documents its own requirements by what it generates. The actual file is more reliable than documentation or version notes.

<!-- decision:P-MC6M67aL -->

## User defers specification decisions to assistant expertise, asking "you think we

**When:** 2026-07-02 · **Fact:** `P-MC6M67aL`

<!-- decision:P-WK2Y9GRS -->

## Post-research: ultracode OFF, workflows OFF; model tier high (extra-high optiona

**When:** 2026-07-02 · **Fact:** `P-WK2Y9GRS`

<!-- decision:P-N9W2GW5U -->

## Verify inventory completeness before deciding on preservation; the question "did

**When:** 2026-07-02 · **Fact:** `P-N9W2GW5U`

<!-- decision:P-LLKXCXC7 -->

## The kit's four-step method: (1) who, (2) how, (3) fit-filter, (4) draw-the-machi

**When:** 2026-07-02 · **Fact:** `P-LLKXCXC7`

<!-- decision:P-RPLGFUN5 -->

## Quality Gate failed on 3 new-code issues: (1) bidirectional character in securit

**When:** 2026-07-02 · **Fact:** `P-RPLGFUN5`

<!-- decision:P-KLUC5F6U -->

## PR #247 merged with full workflow: branch → suite run (2485/2485) → two-pass rev

**When:** 2026-07-02 · **Fact:** `P-KLUC5F6U`

<!-- decision:P-6Y2YQaFL -->

## Decision-Log System for Known Limitations

**When:** 2026-07-02 · **Fact:** `P-6Y2YQaFL`
**Why:** Explicit decision logging ensures regressions are understood, non-obvious constraints are recorded for future maintainers, and stakeholders are informed about known limitations upfront.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-H53642LA -->

## Next work is bullet-provenance surface and auto-extract classification for Plan

**When:** 2026-07-02 · **Fact:** `P-H53642LA`

<!-- decision:P-VYY96VMS -->

## v0.4.4 release staged (CHANGELOG and package.json updated to 0.4.4; 2026-07-02);

**When:** 2026-07-02 · **Fact:** `P-VYY96VMS`

<!-- decision:P-a4QWW5EZ -->

## Backup location for clean-slate testing: `C:\cut-gate-backups\user-tier_2026-07-

**When:** 2026-07-02 · **Fact:** `P-a4QWW5EZ`

<!-- decision:P-CEV2W6aA -->

## Claude Code v2.1.195 changed matcher evaluation; v2.1.198 broke PermissionReques

**When:** 2026-07-02 · **Fact:** `P-CEV2W6aA`

<!-- decision:P-3VKBaPRG -->

## Kit settings.json byte-identical between v0.4.3 and v0.4.4; not the root cause

**When:** 2026-07-02 · **Fact:** `P-3VKBaPRG`

<!-- decision:P-MXH5XFAY -->

## This is a known issue that was fixed previously but has now regressed.

**When:** 2026-07-02 · **Fact:** `P-MXH5XFAY`

<!-- decision:P-K3aSP9Za -->

## D-263: Promote Path Preexistence Bug (Fixed)

**When:** 2026-07-03 · **Fact:** `P-K3aSP9Za`
**Why:** First-time users (new install) would silently lose their first cross-project rule capture. Fix ensures bootstrap path is scaffolded at first write. Critical for zero-config adoption.

<!-- decision:P-TDSSGWFK -->

## Pre-commit Hook Sanitizes Fact Files for Security

**When:** 2026-07-03 · **Fact:** `P-TDSSGWFK`
**Why:** Prevents accidental credential or identity disclosure in the codebase

<!-- decision:P-PGRTL7DZ -->

## Tarball Installation Requires Re-packing After Main Merges

**When:** 2026-07-03 · **Fact:** `P-PGRTL7DZ`
**Why:** Without re-packing, the installed tool carries stale code and does not include newly-merged fixes

<!-- decision:P-QMMLa7HT -->

## B3/B4 Wedge Test Workflow — Cross-Project Doctrine Capture Validation

**When:** 2026-07-03 · **Fact:** `P-QMMLa7HT`
**Why:** Validates that explicitly-stated cross-project rules are correctly extracted, routed to harness memory, and tagged with high confidence

<!-- decision:P-2MTSMLPQ -->

## Context Snapshot Frozen at Session Start

**When:** 2026-07-03 · **Fact:** `P-2MTSMLPQ`
**Why:** Critical for validation workflows; stale context in an ongoing session skews context-sensitive tests like B3/B4 wedge. Required for honest testing of cross-project doctrine capture.

<!-- decision:P-VVNJ2LF6 -->

## Hook Binary Spawned Fresh Each Turn

**When:** 2026-07-03 · **Fact:** `P-VVNJ2LF6`
**Why:** Enables rapid iteration on hook fixes; fixes are live in the same session window

<!-- decision:P-U5V3UFRF -->

## D-264 Fix Verification Pipeline and Pre-Merge Gates

**When:** 2026-07-03 · **Fact:** `P-U5V3UFRF`
**Why:** Ensures comprehensive testing, code review, and stress validation before merge. Sequential stress-test approach prevents test runner collision (discovered earlier this session).

<!-- decision:P-9JAFTQC4 -->

## Release Workflow After Fix Merge

**When:** 2026-07-03 · **Fact:** `P-9JAFTQC4`
**Why:** Provides a staged release workflow with a final interactive review opportunity before the irreversible tag step.

<!-- decision:P-MWVAEXPR -->

## "Tarball Artifact Must Carry Both D-263 and D-264"

**When:** 2026-07-03 · **Fact:** `P-MWVAEXPR`
**Why:** Ensures downstream installations have both fixes and maintain proper version lineage.

<!-- decision:P-M37PHCRQ -->

## Security Suppression Process

**When:** 2026-07-03 · **Fact:** `P-M37PHCRQ`
**Why:** Prevents silent suppressions from hiding new issues; keeps decisions auditable and traceable.

<!-- decision:P-BD25A9HL -->

## validate-spawn-discipline Tool

**When:** 2026-07-03 · **Fact:** `P-BD25A9HL`
**Why:** Acts as a gate for spawn-related security findings. When a suppression is scoped to reviewed sites, `validate-spawn-discipline` ensures no new spawns bypass review.

<!-- decision:P-AXLA5MXD -->

## E1 Cold-Open Test — Persona Carries Unprompted

**When:** 2026-07-03 · **Fact:** `P-AXLA5MXD`
**Why:** E1 is the core validation that persona injection works across projects; without it, the cold-open moment (unprompted conventions) fails

<!-- decision:P-FBEWVLQC -->

## SessionStart Hook Requires Reopen After Install

**When:** 2026-07-03 · **Fact:** `P-FBEWVLQC`
**Why:** D-262 lesson; prerequisite for persona injection to work, critical for E1 (cold-open) testing where persona must carry unprompted to new projects

<!-- decision:P-F9ZaGH2V -->

## E1 Cold-Open Test — Persona Wedge Successful

**When:** 2026-07-03 · **Fact:** `P-F9ZaGH2V`
**Why:** E1 validates that cross-project persona (stored in `~/.claude-memory-kit/`) persists across brand-new projects without repetition. This is the core promise the kit was built for.

<!-- decision:P-7WTLTNRS -->

## SessionStart Hook Activation — Narrow Restart Caveat

**When:** 2026-07-03 · **Fact:** `P-7WTLTNRS`
**Why:** Overgeneralized "always restart after install" becomes a nonsensical instruction in the common case (open fresh). The rule should only apply to the corner case (install into already-open window).

<!-- decision:P-SNY69CBR -->

## The kit exists because you were repeating yourself across sessions/projects — no

**When:** 2026-07-03 · **Fact:** `P-SNY69CBR`

<!-- decision:P-6FH5NUF3 -->

## Research Findings → Task Filing

**When:** 2026-07-03 · **Fact:** `P-6FH5NUF3`
**Why:** Connects discovery to execution; prevents research orphaning; maintains task-based visibility and prioritization.

<!-- decision:P-K6P2LBE3 -->

## Name-Privacy Validator Scans Only Tracked Files

**When:** 2026-07-03 · **Fact:** `P-K6P2LBE3`
**Why:** Avoids wasted CI cycles and confusing "passes locally, fails remotely" failures during context/docs commits.

<!-- decision:P-G4T9NZYP -->

## Machine-Checkable Trigger Tokens (Future Structural Enhancement)

**When:** 2026-07-03 · **Fact:** `P-G4T9NZYP`
**Why:** Manual walk is the current forcing function. Automation is a structural-graduation path if scale grows.

<!-- decision:P-CZTMNSVW -->

## Mandatory Trigger-Walk in D-248 Sweep and cut-gate Pre-Tag

**When:** 2026-07-03 · **Fact:** `P-CZTMNSVW`
**Why:** Enforces forcing function to actively monitor triggers. Prevents "lane everything" pattern (rejects fabricated commitments on conditional work; Cursor-slot precedent shows lanes slip). Enforces healthy lifecycle: trigger fires → then lane.

<!-- decision:P-X65UGWF6 -->

## resume-2026-07-03-post-v044-memora

**When:** 2026-07-03 · **Fact:** `P-X65UGWF6`
**Why:** context compact imminent; next session picks up v0.4.5 Cursor lane

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-X6MAZ45E -->

## Over-generalized instructions will be flagged as nonsensical rather than followe

**When:** 2026-07-03 · **Fact:** `P-X6MAZ45E`

<!-- decision:P-DPULJZ33 -->

## "Restart Claude Code after install" is NOT a blanket rule; only applies to a nar

**When:** 2026-07-03 · **Fact:** `P-DPULJZ33`

<!-- decision:P-JAQ5XHM6 -->

## First fix for D-264 had dead branch and toothless test bugs; caught by skill-rev

**When:** 2026-07-03 · **Fact:** `P-JAQ5XHM6`

<!-- decision:P-CTJLKF4Z -->

## v0.4.4 Published and Checkpoint Closed

**When:** 2026-07-03 · **Fact:** `P-CTJLKF4Z`
**Why:** Marks a clean, verified checkpoint for v0.4.5 work to begin from; CI is green, no regressions.

<!-- decision:P-N2L6Y425 -->

## v0.4.5 Roadmap (Task 196 Cursor Adapter + Task 198 Temporal Sweep)

**When:** 2026-07-03 · **Fact:** `P-N2L6Y425`
**Why:** Defines scope and branch strategy for the next release.

<!-- decision:P-2YFKGCRH -->

## Cursor Adapter Lifecycle Hooks for Deterministic Memory Integration

**When:** 2026-07-03 · **Fact:** `P-2YFKGCRH`
**Why:** Automatic, judgment-free memory capture/injection. Differentiates from MCP-only approaches and addresses Cursor user demand for lost native memory.

<!-- decision:P-ESFSGXU2 -->

## Cursor Memory Feature Removed in v2.1.x — Design Impact

**When:** 2026-07-03 · **Fact:** `P-ESFSGXU2`
**Why:** Architectural constraint for Task 196. Simplifies integration — no need to detect/avoid conflicts with Cursor's native memory layer. Explains user demand for the feature.

<!-- decision:P-6CMJKCTH -->

## Files-First Context Discovery — In-Repo, Versionable Memory

**When:** 2026-07-03 · **Fact:** `P-6CMJKCTH`
**Why:** Portability across agent versions/integrations. Auditability (memory in git history). Durability (survives agent crashes, switching). Differs from MCP-only or native-memory approaches.

<!-- decision:P-WL7MCJVJ -->

## Related Projects — Mimir, Memex (MCP-Only Memory Integrations)

**When:** 2026-07-03 · **Fact:** `P-WL7MCJVJ`
**Why:** Comparative reference. Mimir's linking and reinforcement patterns relevant to project's learn-loop work. Neither was in prior research base (Task 50). Illuminates what "MCP-only" costs.

<!-- decision:P-6Y9UFXB2 -->

## Section §5.1 Binding Rule — Convergence ≠ Verification

**When:** 2026-07-03 · **Fact:** `P-6Y9UFXB2`
**Why:** Prevents bugs from stale/incomplete secondary sources. Secondary research provides direction; primary sources catch recent changes and edge cases.

<!-- decision:P-KM5aH7Z7 -->

## Verified Codebase Consumers of Hook/Snapshot Fields

**When:** 2026-07-04 · **Fact:** `P-KM5aH7Z7`
**Why:** When modifying `.hookOutput` or `.snapshot` structure, all three consumers must be updated to avoid breakage. This is the complete dependency graph for these fields.

<!-- decision:P-T5PRWZEP -->

## CRLF Line-Ending Quirk in removeKitOnlyInstructionResidue

**When:** 2026-07-04 · **Fact:** `P-T5PRWZEP`
**Why:** String equality on line-ending-sensitive content; affects Windows users specifically.

<!-- decision:P-GaSTYX4A -->

## Wired-but-Dead Observe Legs – Recurring Bug Pattern

**When:** 2026-07-04 · **Fact:** `P-GaSTYX4A`
**Why:** This bug class has recurred in PR review; likely a systematic weakness in how observe legs wire into handler chains.

<!-- decision:P-6CGBTE9S -->

## Cursor Adapter Proves Generic Per-Profile Seam Works

**When:** 2026-07-04 · **Fact:** `P-6CGBTE9S`
**Why:** Generic seam is the kit's core extensibility strategy. Real-world proof validates the design.

<!-- decision:P-EAQ6ZUNV -->

## Cursor Competitive Landscape (D-268)

**When:** 2026-07-04 · **Fact:** `P-EAQ6ZUNV`
**Why:** Informs scope and positioning of Cursor adapter work.

<!-- decision:P-DT9KQG9V -->

## Hook/Inject/Capture Tests Faked Dependencies, Masking Bugs

**When:** 2026-07-04 · **Fact:** `P-DT9KQG9V`
**Why:** Mocks create false test confidence. Real bugs only surface when the full integration stack runs.

<!-- decision:P-T3YGa7ED -->

## Hook Ceiling Enforces Operation Time Caps

**When:** 2026-07-04 · **Fact:** `P-T3YGa7ED`
**Why:** Hook hard ceiling is a real operational constraint; operations that overflow it will be killed mid-flight, corrupting state. Defensive design caps at 50s to provide headroom.

<!-- decision:P-FRTKRVQS -->

## Adapter Architecture — Per-Profile Seam, Zero Bespoke Code

**When:** 2026-07-04 · **Fact:** `P-FRTKRVQS`
**Why:** Reduces maintenance burden and bug surface; each adapter is isolated. Cursor shipped zero-defect via this pattern (PR #254).

<!-- decision:P-BUXPaHHR -->

## Per-Session Temporal Sweep Timing (v0.4.5+)

**When:** 2026-07-04 · **Fact:** `P-BUXPaHHR`
**Why:** Vercel→Hetzner state-change case showed weekly-only timing was too slow; session-boundary timing catches it within one cycle.

<!-- decision:P-SL5VE39X -->

## Test Seam Blindness — Injected Fakes Mask Real-World Defaults

**When:** 2026-07-04 · **Fact:** `P-SL5VE39X`
**Why:** Test seams designed for isolation can become blindspots; test and production defaults drift unnoticed.

<!-- decision:P-NZ794RQK -->

## Minor Release Triggers Backlog Sweep

**When:** 2026-07-04 · **Fact:** `P-NZ794RQK`
**Why:** The release command has implicit side effects (backlog sweep automation); next session needs to know this is expected behavior, not a separate manual step.

<!-- decision:P-79P92Y9F -->

## IDE Binding Rules: Cursor Session Restart (D-262)

**When:** 2026-07-04 · **Fact:** `P-79P92Y9F`
**Why:** Cursor inherits VS Code's session lifecycle; older sessions won't load post-install hooks

<!-- decision:P-DN3HDK6J -->

## IDE Live-Check Verification Events (Cursor Pattern)

**When:** 2026-07-04 · **Fact:** `P-DN3HDK6J`
**Why:** Comprehensive coverage catches missing hooks (like D-269) and subtle integration bugs (like CH3 wired-but-dead)

<!-- decision:P-XLMYNCC2 -->

## Injection Verification: Validate Real Content, Not Just Hook Fire (D-269 Pattern)

**When:** 2026-07-04 · **Fact:** `P-XLMYNCC2`
**Why:** Hook execution != data integrity. Unit tests can validate hook firing but not output correctness

<!-- decision:P-5SBBBN6R -->

## Platform-Specific Cut-Gate Structure and Scope

**When:** 2026-07-04 · **Fact:** `P-5SBBBN6R`
**Why:** Kiro + Cursor precedents established this separation—surface verification can't block releases; core verification lives in base gate + test suite

<!-- decision:P-R33XHPD9 -->

## Cut-Gate Structure Convention

**When:** 2026-07-04 · **Fact:** `P-R33XHPD9`
**Why:** Ensures consistency, maintainability, and comprehensive coverage across all gate variants. Prevents scope creep or accidental omission of critical sections.

<!-- decision:P-55XE6aJA -->

## Cursor Supports Headless Agent CLI (`cursor-agent -p`)

**When:** 2026-07-04 · **Fact:** `P-55XE6aJA`
**Why:** This is a viable option for replacing the hard `claude` CLI dependency if the kit switches to per-agent backends (option c from the dependency-resolution decision).

<!-- decision:P-FJ7VQAJE -->

## Kit's Haiku Backend Has Undeclared `claude` CLI Dependency

**When:** 2026-07-04 · **Fact:** `P-FJ7VQAJE`
**Why:** This is a product-scope bug. The kit appears to support Cursor/Kiro as full agents, but has a hidden hard dependency that breaks both if Claude Code isn't installed.

<!-- decision:P-AMGLK4QZ -->

## Live-test Harness Cannot Detect Missing CLI Dependency

**When:** 2026-07-04 · **Fact:** `P-AMGLK4QZ`
**Why:** The harness was designed only for Claude Code. It can't test multi-agent scenarios where a target agent doesn't have its assumed dependencies.

<!-- decision:P-N297FN7a -->

## Kit Compatibility Requirement (Clarified)

**When:** 2026-07-04 · **Fact:** `P-N297FN7a`
**Why:** Previous misalignment — assistant treated "compatible" as "hooks wire" when user meant "user without Claude Code can actually use the kit." This is a real product requirement, not theoretical.

<!-- decision:P-3C25GB4L -->

## Cursor Agent Backend — Doc-Confirmed Feasible, Not Yet Live-Tested

**When:** 2026-07-04 · **Fact:** `P-3C25GB4L`
**Why:** Task 200 assessment of both Kiro and Cursor as backend options; can't confirm flag behavior from docs alone

<!-- decision:P-PXCAJEH4 -->

## Hook Recursion Guard — CMK_BACKEND_SPAWN Environment Variable

**When:** 2026-07-04 · **Fact:** `P-PXCAJEH4`
**Why:** Backends need to be callable from within hook execution; without guard, infinite loop occurs

<!-- decision:P-Ta2AAA4Y -->

## Kiro CLI Backend — Live Probe Confirmed Working

**When:** 2026-07-04 · **Fact:** `P-Ta2AAA4Y`
**Why:** Task 200 research confirmed Kiro viability as background LLM backend; recursion hazard was the critical unknown and is now solved

<!-- decision:P-3TFR24VQ -->

## Task 200 Build Phase — Implementation Roadmap

**When:** 2026-07-04 · **Fact:** `P-3TFR24VQ`
**Why:** Unblocks v0.4.5 release; silent no-op when backend unavailable is the core bug Task 200 fixes

<!-- decision:P-UUJWSZLW -->

## Multi-Agent LLM Invocation Research Initiative

**When:** 2026-07-05 · **Fact:** `P-UUJWSZLW`
**Why:** Findings directly inform the design of the Workflow backend selection factory and cross-OS compatibility strategy for multi-agent contexts.

<!-- decision:P-BNPFDK7V -->

## Resume Task 200 agent-relative backend

**When:** 2026-07-05 · **Fact:** `P-BNPFDK7V`

<!-- decision:P-46TWC2C2 -->

## Paper Trail Convention: Tasks.md as Single Source of Truth

**When:** 2026-07-05 · **Fact:** `P-46TWC2C2`
**Why:** The project relies on tasks.md as the canonical reference for task status; stale entries break the single-source-of-truth principle and risk decisions being missed or contradicted.

<!-- decision:P-KE5RQUKJ -->

## Resume Fact Convention: Capturing Uncommitted Code Intent

**When:** 2026-07-05 · **Fact:** `P-KE5RQUKJ`
**Why:** This allows cleanup of uncommitted work without losing the design intent, making it easy for the next session to recall what was being attempted and why it was deferred.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-XDNK47AH -->

## D-264 entry rewritten to record both the review catch and red-on-main step; illu

**When:** 2026-07-03 · **Fact:** `P-XDNK47AH`

<!-- decision:P-S99FUTTW -->

## User approves trigger-walk forcing function process ("do it, sounds like a good

**When:** 2026-07-03 · **Fact:** `P-S99FUTTW`

<!-- decision:P-RJRPEAMC -->

## when creating a cut-gate for domain-specific tools (Cursor, Kiro), build a full

**When:** 2026-07-04 · **Fact:** `P-RJRPEAMC`

<!-- decision:P-CF74L2XA -->

## Kit must work for users with ONLY Cursor or ONLY Kiro installed, without Claude

**When:** 2026-07-04 · **Fact:** `P-CF74L2XA`

<!-- decision:P-MV4B4WQP -->

## Task 196 (Cursor adapter) shipped and merged to main (PR #254); validates D-180

**When:** 2026-07-04 · **Fact:** `P-MV4B4WQP`

<!-- decision:P-9D6T5Z2U -->

## D-271 Deep Research — Headless LLM Invocation Patterns

**When:** 2026-07-05 · **Fact:** `P-9D6T5Z2U`
**Why:** The target question is the evaluation rubric for all 70 projects. Persisting it ensures consistent, repeatable research across resumptions and prevents re-deriving scope.

<!-- decision:P-YSF64NYA -->

## D-271 Multi-Wave Research Execution on Sonnet 5

**When:** 2026-07-05 · **Fact:** `P-YSF64NYA`
**Why:** User has subscription cost constraints; batching with transparency allows controlled, budget-aware progression

<!-- decision:P-2252SPZH -->

## Wants Sonnet 5 agents instead of Opus 4.8 to reduce subscription burn

**When:** 2026-07-05 · **Fact:** `P-2252SPZH`

<!-- decision:P-WCLJEVK6 -->

## Wants to work in batches with cost reporting before each wave to manage budget

**When:** 2026-07-05 · **Fact:** `P-WCLJEVK6`

<!-- decision:P-LQ7WZKHN -->

## Gate CLI-detection checks on research findings to prevent false positives

**When:** 2026-07-05 · **Fact:** `P-LQ7WZKHN`
**Why:** Unvalidated platform assumptions risk producing false positives on correct installations, blocking users with valid setups; pre-research implementation prevents encoding environment-specific assumptions as universal truth

<!-- decision:P-C42D5UT5 -->

## The CLI-missing check should be added to `cmk install` command for first-touch w

**When:** 2026-07-05 · **Fact:** `P-C42D5UT5`

<!-- decision:P-Q9FSUC96 -->

## Don't ask permission to log decisions, flip checkboxes (task tracking), or maint

**When:** 2026-07-05 · **Fact:** `P-Q9FSUC96`

<!-- decision:P-QaK2EJYP -->

## Wave-Based Agent Research for Cursor-Windows Invocation

**When:** 2026-07-05 · **Fact:** `P-QaK2EJYP`
**Why:** This is a structured research program to understand how competitor AI tools invoke headless agents on Windows, directly informing a Cursor product decision.

<!-- decision:P-MWSWK34R -->

## Args serialization guard for batch agent launches

**When:** 2026-07-05 · **Fact:** `P-MWSWK34R`
**Why:** Previous launch failed silently at script-eval due to inconsistent input format. Guard prevents eval errors and ensures agents spawn correctly.

<!-- decision:P-WFKR4FaT -->

## Agent CLI Validation Requires Exit Code Check, Not Just PATH Presence

**When:** 2026-07-05 · **Fact:** `P-WFKR4FaT`
**Why:** Silent failures (CLI present but non-functional) are worse than detection failures; exit-code validation catches misconfiguration that PATH checks miss

<!-- decision:P-6C9TDAMU -->

## Cursor Agent Automation Requires Separate CURSOR_API_KEY (No Desktop Login Reuse)

**When:** 2026-07-05 · **Fact:** `P-6C9TDAMU`
**Why:** Onboarding trap: users may assume desktop login carries over to CLI, leading to silent failures in automation

<!-- decision:P-WNQaPLZP -->

## Cursor Native Windows PowerShell Support Confirmed

**When:** 2026-07-05 · **Fact:** `P-WNQaPLZP`
**Why:** Resolves Windows-platform blocker for agent support; confirms native Windows CLI path exists and is canonical

<!-- decision:P-E6MKGTDS -->

## Two-Tier Backend Architecture for Headless LLM Invocation

**When:** 2026-07-05 · **Fact:** `P-E6MKGTDS`
**Why:** Validates kit's two-tier architecture decision; confirms this is the canonical pattern others follow, not an edge case

<!-- decision:P-JUNL3FMF -->

## cursor-agent runs natively on Windows via subscription login (no separate API ke

**When:** 2026-07-05 · **Fact:** `P-JUNL3FMF`

<!-- decision:P-SDYPaDJ9 -->

## Cursor Agent Windows Native Support — Live Validation

**When:** 2026-07-05 · **Fact:** `P-SDYPaDJ9`
**Why:** Resolves Task 200's load-bearing Cursor-Windows question. Wave 1 research (~2.26M tokens) identified native Windows exists; user's live validation now proves no second vendor/API key required. Unblocks CursorAgentBackend implementation.

<!-- decision:P-CX4MXQ4P -->

## Field Survey: Zero Multi-CLI Routing (32 projects)

**When:** 2026-07-05 · **Fact:** `P-CX4MXQ4P`
**Why:** Validates that automatic + portable (work with any agent CLI) is a genuine market gap the field hasn't solved. The field chose one property; this project insists on both.

<!-- decision:P-NKWEPT72 -->

## Auto-Detect Priority Chain (Proven from codemem)

**When:** 2026-07-05 · **Fact:** `P-NKWEPT72`
**Why:** codemem uses this ordering to handle real-world edge cases (user may have multiple CLIs, auth-state issues, no CLI at all). Proven in the field; saves re-deriving the ordering.

<!-- decision:P-K79LJQaA -->

## Cloud-API-Key Is Industry Standard; Multi-CLI Is Deliberate Differentiation

**When:** 2026-07-05 · **Fact:** `P-K79LJQaA`
**Why:** Provides strategic context for design decisions. The kit's choice to route through the user's authenticated CLI is higher-risk but higher-value (no API key management, uses existing auth). This is not a mistake; it's the deliberate differentiation that makes the kit novel.

<!-- decision:P-Q6Q5VX7Q -->

## codemem Validates Multi-CLI Auto-Detect Approach in Production

**When:** 2026-07-05 · **Fact:** `P-Q6Q5VX7Q`
**Why:** Codemem is the sole prior-art reference using subscription-reuse multi-CLI routing (vs. the industry standard of cloud-API-key). Validates the design direction and provides a concrete blueprint for selector logic and fallback ordering.

<!-- decision:P-TAE2F6J6 -->

## Field Research Phase Complete — 42 Projects, 5 Waves, ~7M Subagent Tokens

**When:** 2026-07-05 · **Fact:** `P-TAE2F6J6`
**Why:** Marks end of exploratory phase. Synthesis and recommendation are next, backed by comprehensive field evidence.

<!-- decision:P-MBNMDFSU -->

## shouldAutoSelectXSidecar() Selector Function Pattern

**When:** 2026-07-05 · **Fact:** `P-MBNMDFSU`
**Why:** Improves testability, maintainability, and code clarity. codemem uses this pattern implicitly; explicit extraction is recommended for the kit's architecture.

<!-- decision:P-6KHEFURB -->

## Task 201 — Cross-Agent CLI Selection for Memory Operations

**When:** 2026-07-05 · **Fact:** `P-6KHEFURB`
**Why:** Enables cost/role separation — premium agent for interactive work, cheaper agent for scheduled background janitor tasks. Zero-friction implementation via existing factory pattern.

<!-- decision:P-QGKURRR2 -->

## Pre-commit PII validator on context/ commits

**When:** 2026-07-05 · **Fact:** `P-QGKURRR2`
**Why:** The project repository is public. Accidental commits of personal/sensitive info are a real risk. The validator is the automated gate that stops these commits before they reach the repo. (Tested live this session: the validator caught an accidentally-written email and forced removal.)

<!-- decision:P-LXa6HBUZ -->

## cursor-agent CLI Quirks and Latency Profile

**When:** 2026-07-05 · **Fact:** `P-LXa6HBUZ`
**Why:** Live-tested against real cursor-agent; these quirks are load-bearing for Task 200's `makeBackend` design and D-278 routing decision (slow backends must use detached/ceiling-free paths, not synchronous hooks).

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-AT2QCUET -->

## Design Assets in assets/ Directory

**When:** 2026-06-16 · **Fact:** `P-AT2QCUET`
**Why:** Centralized asset location; font-independence ensures consistent rendering across platforms and social media without typeface dependencies.

<!-- decision:P-aMFDHMHA -->

## Design System Color Palette

**When:** 2026-06-16 · **Fact:** `P-aMFDHMHA`
**Why:** Colors are foundational to design consistency; required when regenerating or adjusting designs to maintain brand integrity.

<!-- decision:P-aBGaV2EM -->

## GitHub Social Preview Upload (Manual Web UI Only)

**When:** 2026-06-16 · **Fact:** `P-aBGaV2EM`
**Why:** Explains why this step cannot be automated in release workflows and must remain a manual gate step.

<!-- decision:P-FLXHT67K -->

## Use open-ended, general questions in research to avoid leading answers and surfa

**When:** 2026-07-05 · **Fact:** `P-FLXHT67K`

<!-- decision:P-M3KA2WHH -->

## Confirms D-277 decision "Warn at install + doctor, degrade to file-only" for mis

**When:** 2026-07-05 · **Fact:** `P-M3KA2WHH`

<!-- decision:P-G9TG4GGC -->

## Cost/role agent separation principle — use premium agent (Claude) for primary co

**When:** 2026-07-05 · **Fact:** `P-G9TG4GGC`

<!-- decision:P-TH4ARBRA -->

## Field-wide headless-LLM pattern confirmed across 15 projects: 4 per-agent-CLI, 2

**When:** 2026-07-05 · **Fact:** `P-TH4ARBRA`

<!-- decision:P-KXGGaQGW -->

## Kit's native-PowerShell discipline (not bash-first) is confirmed as canonical by

**When:** 2026-07-05 · **Fact:** `P-KXGGaQGW`

<!-- decision:P-5aEY9UDN -->

## Don't get stuck in autopilot/non-interactive mode that ignores user input. User

**When:** 2026-07-06 · **Fact:** `P-5aEY9UDN`

<!-- decision:P-DMSLASHK -->

## v0.4.5 Release Workflow

**When:** 2026-07-06 · **Fact:** `P-DMSLASHK`
**Why:** Separation of concerns: assistant automates release mechanics; user retains explicit control over publish trigger. Prevents accidental publishes.

<!-- decision:P-7N5XaF22 -->

## Claude-memory-kit supports 3 IDE/tool agents

**When:** 2026-07-06 · **Fact:** `P-7N5XaF22`
**Why:** The kit must provide agent-specific installation, usage, and release validation steps for each of its three agents.

<!-- decision:P-DWMSXSTF -->

## Cut-gate release validation guides (per-agent)

**When:** 2026-07-06 · **Fact:** `P-DWMSXSTF`
**Why:** Pre-release validation must verify each agent installs and runs correctly. Structural parity allows reviewers to spot gaps systematically.

<!-- decision:P-9WS2CJH7 -->

## Documentation structure and prerequisite locations

**When:** 2026-07-06 · **Fact:** `P-9WS2CJH7`
**Why:** The kit is distributed via GitHub and npm with separate audiences; each agent has different installation/setup prerequisites that must be clear at each entry point.

<!-- decision:P-FL2MY6EN -->

## Cut-Gate Backend Pattern Template (§4f)

**When:** 2026-07-06 · **Fact:** `P-FL2MY6EN`
**Why:** Structural consistency ensures maintainability and guarantees equivalent coverage across all agent guides.

<!-- decision:P-T7YJENCG -->

## Patch Release Live-Session Gate Optional

**When:** 2026-07-06 · **Fact:** `P-T7YJENCG`
**Why:** CLI and suite validation sufficient for narrowly-scoped patches

<!-- decision:P-6BNBXVHK -->

## Release Cut Workflow — Local Isolation, User Tag Push

**When:** 2026-07-06 · **Fact:** `P-6BNBXVHK`
**Why:** Real tarball testing catches issues dev repo would miss; isolation prevents accidents; user controls final tag

<!-- decision:P-KSEF6JBY -->

## v0.4.5 Release Gate Test Suite

**When:** 2026-07-06 · **Fact:** `P-KSEF6JBY`
**Why:** Each gate validates a critical path; testing on real tarball catches issues dev repo would miss

<!-- decision:P-2TUJKMP4 -->

## validate-references Requires Properly Filed Task References

**When:** 2026-07-06 · **Fact:** `P-2TUJKMP4`
**Why:** Ensures all task references are traceable; caught a dangling reference during release

<!-- decision:P-YD6SLA3Q -->

## Windows npm `EPERM` Warning on better_sqlite3.node Is Benign

**When:** 2026-07-06 · **Fact:** `P-YD6SLA3Q`
**Why:** Prevents user panic or false failure detection in future test runs; the warning can be safely ignored.

<!-- decision:P-29U75JGA -->

## Claude-Memory-Kit Gate Test Phase Structure

**When:** 2026-07-06 · **Fact:** `P-29U75JGA`
**Why:** Understanding the phase structure helps future sessions know what's been tested and at which stage; §0–§1 is pre-Session 1 (systematic verification), §2+ are live-agent (interactive).

<!-- decision:P-Q2BJCa6D -->

## CMK Install Activation and Native Memory Options

**When:** 2026-07-06 · **Fact:** `P-Q2BJCa6D`
**Why:** Users may be confused by restart requirement or uncertain whether to disable native memory; documenting these options prevents false starts and supports informed memory-architecture choices.

<!-- decision:P-65KH53NH -->

## Fresh CMK Install Health Baseline (cmk 0.4.5, --with-semantic)

**When:** 2026-07-06 · **Fact:** `P-65KH53NH`
**Why:** This is the expected healthy state for a fresh installation; useful as a reference for regression testing or comparison against later health checks.

<!-- decision:P-WPYWZW2U -->

## Gate Verification System (cut-gate20)

**When:** 2026-07-06 · **Fact:** `P-WPYWZW2U`
**Why:** Project requires reliable verification that the live Claude Code session environment is safe, captures are correct, and no sensitive data leaked.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-K9JEXEW6 -->

## RESUME v0.4.5: main is GREEN with the v0.4.5 release commit (82a0baf, package.js

**When:** 2026-07-06 · **Fact:** `P-K9JEXEW6`

<!-- decision:P-ZA7HKDWL -->

## Prefers to run interactive commands themselves; wants assistant to run all file

**When:** 2026-07-06 · **Fact:** `P-ZA7HKDWL`

<!-- decision:P-4CAKQAQ7 -->

## This gate test uses `cmk install --with-semantic`, enabling hybrid semantic sear

**When:** 2026-07-06 · **Fact:** `P-4CAKQAQ7`

<!-- decision:P-SYP79LTP -->

## CLI Fallback for MCP Tool Resolution Failures

**When:** 2026-07-06 · **Fact:** `P-SYP79LTP`
**Why:** Provides an alternative path for testers and developers when tool resolution fails. Enables forward momentum even during activation troubleshooting.

<!-- decision:P-D4BXGYX7 -->

## MCP Activation Restart Behavior

**When:** 2026-07-06 · **Fact:** `P-D4BXGYX7`
**Why:** Users and testers need to understand that one restart after install is expected and normal, and that subsequent sessions have no friction—this prevents confusion about whether the kit is broken or requires ongoing restarts.

<!-- decision:P-S4HKLYZS -->

## Claude Code MCP Deferred-Tool Race (Issue #42148)

**When:** 2026-07-06 · **Fact:** `P-S4HKLYZS`
**Why:** Explains Session-1 first-turn `mk_remember` miss; confirms fallback mitigation is working as intended, not a gate blocker

<!-- decision:P-DMEQPJEB -->

## Claude Code Deferred-Tools First-Turn Race Condition

**When:** 2026-07-06 · **Fact:** `P-DMEQPJEB`
**Why:** Not fixable server-side (no protocol mechanism to opt out of deferral). Known issue: Claude Code #42148 / #60052. Understanding the race explains why first-turn failures don't indicate broken code.

<!-- decision:P-9CRAJDZN -->

## MCP Connection Logs Location in Claude Code

**When:** 2026-07-06 · **Fact:** `P-9CRAJDZN`
**Why:** Needed to distinguish MCP server health from API-layer ToolSearch failures; logs are authoritative ground truth

<!-- decision:P-SGNV3M72 -->

## User asked to verify assistant's claims with primary evidence ("did you actually

**When:** 2026-07-06 · **Fact:** `P-SGNV3M72`

<!-- decision:P-3KQHYaa2 -->

## Asked for primary-source verification before accepting confident-but-unsourced c

**When:** 2026-07-06 · **Fact:** `P-3KQHYaa2`

<!-- decision:P-aYB2XXRD -->

## Kiro-cli Agent Resolution Requires Global Default

**When:** 2026-07-06 · **Fact:** `P-aYB2XXRD`
**Why:** Architectural constraint from kiro-cli's Amazon-Q lineage. Explains why kiro-cli cannot match Claude Code's project-local agent pattern.

<!-- decision:P-RSGPA3BJ -->

## Kiro Global Agent Config Documented (Decision D-283)

**When:** 2026-07-06 · **Fact:** `P-RSGPA3BJ`
**Why:** Undocumented architectural constraints can be misread as bugs and trigger unnecessary code changes. Documenting the rationale prevents future re-opening.

<!-- decision:P-E53ZN5BD -->

## Hook Architecture Differs Across Claude AI Products

**When:** 2026-07-06 · **Fact:** `P-E53ZN5BD`
**Why:** Explains why identical memory-kit design patterns do not work uniformly across products and forces different architectural choices per product

<!-- decision:P-SRJWSPEY -->

## Kiro CLI Requires Global chat.defaultAgent Because Hooks Are Agent-Scoped

**When:** 2026-07-06 · **Fact:** `P-SRJWSPEY`
**Why:** Explains why claude-memory-kit's Kiro implementation requires a global agent; this is a structural constraint, not a design choice

<!-- decision:P-9RFHM2Q2 -->

## Claude Code vs. Kiro Hook Architecture Difference

**When:** 2026-07-06 · **Fact:** `P-9RFHM2Q2`
**Why:** This architectural difference explains why the kit recommends different setup paths for each environment and why it cannot provide "project-local" automatic memory activation in Kiro. It is not a workaround choice but a hard constraint of Kiro's design.

<!-- decision:P-Q69MWaHS -->

## User asking "so i still dont understand what you built..." despite observing "✓

**When:** 2026-07-06 · **Fact:** `P-Q69MWaHS`

<!-- decision:P-DAHSH4G9 -->

## User tested kiro-cli headless mode with --trust-all-tools and confirmed hooks ex

**When:** 2026-07-06 · **Fact:** `P-DAHSH4G9`

<!-- decision:P-X5DANHNN -->

## Kiro Agent Configuration — Local and Global Support

**When:** 2026-07-06 · **Fact:** `P-X5DANHNN`
**Why:** Clarifies Kiro supports project-local agent configuration (previously thought global-only). Relevant to claude-memory-kit's Kiro integration and potential in-repo agent config.

<!-- decision:P-SA7QUVJZ -->

## Project-Local Agent Auto-Activation — Design Bottleneck for Kiro/CMK

**When:** 2026-07-06 · **Fact:** `P-SA7QUVJZ`
**Why:** Docs do not clarify auto-activation behavior for project-local agents. This gap blocks understanding whether Kiro can achieve full repo portability and parity with Claude Code. User is committing to empirical testing to resolve this design question.

<!-- decision:P-MXPAE3S5 -->

## User wants empirical test to determine if project-local Kiro agents auto-activat

**When:** 2026-07-06 · **Fact:** `P-MXPAE3S5`

<!-- decision:P-67AA3MCQ -->

## Kiro Agent Must Be Global (Empirically Validated)

**When:** 2026-07-06 · **Fact:** `P-67AA3MCQ`
**Why:** Permanently settles whether Kiro can match Claude Code's project-local model. Empirical evidence prevents future re-litigation of this design choice.

<!-- decision:P-59BaaLDa -->

## Kiro IDE and kiro-cli Have Different Hook Architectures

**When:** 2026-07-06 · **Fact:** `P-59BaaLDa`
**Why:** The two Kiro clients have opposite designs. Previous context (D-283/D-284) covered kiro-cli only; IDE works like other IDEs (project-level files).

<!-- decision:P-C6JYB72G -->

## v0.4.5 kiro-cli dispatch guard implementation

**When:** 2026-07-06 · **Fact:** `P-C6JYB72G`
**Why:** Dispatch path changed, so June live-test proof doesn't fully cover v0.4.5 kiro-cli. Exemplifies "unit-green ≠ works-on-real-input" principle the project warns against.

<!-- decision:P-G54J6XJT -->

## v0.4.5: Agent-Relative LLM Backend Feature

**When:** 2026-07-06 · **Fact:** `P-G54J6XJT`
**Why:** The kit's automatic features only work if an LLM backend exists. Before v0.4.5, only Claude users had one. This release unblocked Kiro and Cursor users and explains why a recursion guard exists in the hook dispatch path.

<!-- decision:P-6JQMSaTX -->

## Kiro-CLI vs. Kit: Activation Pattern Design

**When:** 2026-07-06 · **Fact:** `P-6JQMSaTX`
**Why:** Real-world evidence from kiro-cli on the exact D-284 activation-pattern question. Validates that both branches (manual vs. auto-activation) are legitimate.

<!-- decision:P-J595J32R -->

## Kiro-CLI vs. Kit: Knowledge Extraction Architecture

**When:** 2026-07-06 · **Fact:** `P-J595J32R`
**Why:** Another real-world solution to agent learning. Justifies the kit's architectural choice to separate the backend as a deliberate trade-off for async/portability.

<!-- decision:P-M4LCGCGW -->

## This project is for kiro-cli only, not IDE

**When:** 2026-07-06 · **Fact:** `P-M4LCGCGW`

<!-- decision:P-PU3PXTLS -->

## cmk Agent Config — Missing allowedTools Field

**When:** 2026-07-06 · **Fact:** `P-PU3PXTLS`
**Why:** cmk is intended to be the auto-approve agent, but missing `allowedTools` in its config would prevent MCP auto-approval. This is a configuration regression.

<!-- decision:P-GCACVQaF -->

## MCP Approval Scope is Per-Agent, Not Project-Wide

**When:** 2026-07-06 · **Fact:** `P-GCACVQaF`
**Why:** User tested and found approval prompt despite prior auto-approval setup; analysis revealed MCP trust is read per-agent config, not globally. Prompt appeared because kiro_default (the active agent at test time) didn't have `allowedTools` configured.

<!-- decision:P-CUV5VCZS -->

## Previously built MCP auto-approval expected to "always run without asking"; surp

**When:** 2026-07-06 · **Fact:** `P-CUV5VCZS`

<!-- decision:P-aQLDJM5J -->

## MCP Prompt Root Cause — Agent Config & kiro-cli Mismatch

**When:** 2026-07-06 · **Fact:** `P-aQLDJM5J`
**Why:** Clarifies why the prompt appears on kiro_default but not with global default (cmk active). Confirms it's a config gap, not a system failure.

<!-- decision:P-WXP6RC9S -->

## Project Decision-Trail Lane Preservation Habit

**When:** 2026-07-06 · **Fact:** `P-WXP6RC9S`
**Why:** Maintains full traceability of how decisions and tasks evolved; supports root-cause analysis and pattern spotting in future refactors.

<!-- decision:P-P34SFC3D -->

## Task 165(a) Root Cause Found — Advanced to Fix Lane

**When:** 2026-07-06 · **Fact:** `P-P34SFC3D`
**Why:** Upgrade from "diagnose unclear issue" to "fix known problem with multiple remediation paths". Ready to close via one of the three options.

<!-- decision:P-NWUYVLZN -->

## Multi-Gate Release Verification

**When:** 2026-07-06 · **Fact:** `P-NWUYVLZN`
**Why:** Catches integration failures that unit tests miss. Multi-agent + MCP-backend setup requires live verification to ensure safety.

<!-- decision:P-MGHR6JCA -->

## User Owns Release Tag Push

**When:** 2026-07-06 · **Fact:** `P-MGHR6JCA`
**Why:** Clear boundary between development decisions (assistant) and public commitments (user). Prevents unintended early releases.

<!-- decision:P-FDGB97F4 -->

## v0.4.6 Release Roadmap

**When:** 2026-07-06 · **Fact:** `P-FDGB97F4`
**Why:** v0.4.5 is backend-focused. kiro-cli UX fix and new agent are orthogonal changes, correctly laned for v0.4.6. Prevents scope creep and clarifies next-session priorities.

<!-- decision:P-CLSAGTMK -->

## MCP prompt gate only appears in non-default agent scenario

**When:** 2026-07-06 · **Fact:** `P-CLSAGTMK`
**Why:** Distinguishes real bugs from configuration artifacts. Clarifies why you hit the gate (engineered non-default state) but an end user won't (on cmk-default).

<!-- decision:P-a99JZQZV -->

## Task 165a is design decision linked to D-285, not mechanical fix

**When:** 2026-07-06 · **Fact:** `P-a99JZQZV`
**Why:** Clarifies that rushing implementation risks building the wrong thing. Work is properly scoped for v0.4.6 after design fork is decided, not v0.4.5.

<!-- decision:P-DQYYXF7X -->

## v0.5.0 Sprint Locked to Fable Model Availability Window

**When:** 2026-07-06 · **Fact:** `P-DQYYXF7X`
**Why:** Hard external constraint (Fable availability) drives sprint scope and prioritization. Deferring lower-priority design work keeps team on critical path to capture the feature window before model access expires.

<!-- decision:P-RYB7VEDM -->

## CMK gate test is structured in phases (§0–§1 pre-Session 1, §2 Session 1, §5 Ses

**When:** 2026-07-06 · **Fact:** `P-RYB7VEDM`

<!-- decision:P-DXYN2SZG -->

## All 7 MCP sessions in gate testing connected successfully (925-2099ms range), wi

**When:** 2026-07-06 · **Fact:** `P-DXYN2SZG`

<!-- decision:P-VKKKK7B6 -->

## MCP logs show cmk connected successfully (925ms, hasTools:true) at session start

**When:** 2026-07-06 · **Fact:** `P-VKKKK7B6`

<!-- decision:P-92XAEZGF -->

## Behavior was correct — global agent config required because `chat.defaultAgent`

**When:** 2026-07-06 · **Fact:** `P-92XAEZGF`

<!-- decision:P-9JJa3BUH -->

## Kit's specific hooks: cmk hook agentSpawn (session start), cmk hook userPromptSu

**When:** 2026-07-06 · **Fact:** `P-9JJa3BUH`

<!-- decision:P-YLJUGTVV -->

## In headless non-interactive mode, file operations rejected without --trust-all-t

**When:** 2026-07-06 · **Fact:** `P-YLJUGTVV`

<!-- decision:P-WL292XaB -->

## User fact-checks vague claims and expects precise, detailed accounting of what c

**When:** 2026-07-06 · **Fact:** `P-WL292XaB`

<!-- decision:P-56YEAKaU -->

## Binding Two-Pass Code Review Discipline

**When:** 2026-07-06 · **Fact:** `P-56YEAKaU`
**Why:** Two-pass discipline prevents silent bugs from reaching production. The rhythm slows initial merge velocity but catches critical issues that are far costlier to fix post-release.

<!-- decision:P-7D37FCUX -->

## Regression Test Pinning on Bug Fixes

**When:** 2026-07-06 · **Fact:** `P-7D37FCUX`
**Why:** Regression tests ensure the same bug does not silently return as code evolves. Critical invariant bugs are particularly important to pin because they are easy to reintroduce and hard to detect in production use.

<!-- decision:P-VNDJW7KK -->

## Release Gate Criterion: Dogfooding Signal Validation

**When:** 2026-07-07 · **Fact:** `P-VNDJW7KK`
**Why:** Empirical validation is more trustworthy than review consensus. A misfiring judge detector needs a baseline period to surface. Real-world behavior is the primary evidence.

<!-- decision:P-EQLWWGUF -->

## Staged Release: Observe-Only Then Steering Wiring

**When:** 2026-07-07 · **Fact:** `P-EQLWWGUF`
**Why:** Prevents silent steering failures on day 1. Sensors run unobserved first, creating a baseline. If judge detection misfires, the issue is visible in logs before ranking is affected. Also: task 194 is the highest-stakes surface and should not ship at fatigue peaks.

<!-- decision:P-EA7VXDTJ -->

## RESUME v0.5.0: release commit + D-291 gate PASS are on main (CI green); ONLY the

**When:** 2026-07-07 · **Fact:** `P-EA7VXDTJ`

<!-- decision:P-FHTR7MLS -->

## Release Gate: Cut-Gate Guide Must Pass Before Tagging

**When:** 2026-07-07 · **Fact:** `P-FHTR7MLS`
**Why:** User caught the skip and it matters: this discipline found six blockers this session. Releasing without verification risks broken code reaching users.

<!-- decision:P-EMNaBNWT -->

## Windows SQLite DLL Lock from Running MCP Server

**When:** 2026-07-07 · **Fact:** `P-EMNaBNWT`
**Why:** Blocks upgrade workflows silently. Surfaced when trying to verify v0.5.0; would have affected real users if code had shipped without catching this.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-3VT9YT6L -->

## EBUSY During cmk Upgrade — Stale Process Diagnosis

**When:** 2026-07-07 · **Fact:** `P-3VT9YT6L`
**Why:** These processes prevent file replacement during upgrade. Eliminating them resolves the issue.

<!-- decision:P-7H2PPU7U -->

## Hand-Written Research Note Frontmatter Requirements

**When:** 2026-07-07 · **Fact:** `P-7H2PPU7U`
**Why:** Frontmatter is required for the fact archive to properly index and retrieve notes; without it, notes remain orphaned and unsearchable.

<!-- decision:P-SLVXFQEC -->

## Proper Verb for Clearing Stale Locks

**When:** 2026-07-07 · **Fact:** `P-SLVXFQEC`
**Why:** The guardrail prevents accidental data loss and ensures consistency with kit-provided tooling.

<!-- decision:P-XEEC5ZND -->

## Standard cmk Installation Command

**When:** 2026-07-07 · **Fact:** `P-XEEC5ZND`
**Why:** This enables semantic search and is the expected form for routine repairs/installations.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-VAMNaEL5 -->

## 9gb-node-hog-haiku-print-hang-machine-freeze
_(retracted 2026-07-08)_

**When:** 2026-07-07 · **Fact:** `P-VAMNaEL5`
**Why:** The user's machine froze (9.3 GB / 100% disk) during the 0.5.0 gate-prep session; the offending process is dead so root cause can't be re-confirmed, but the reproduced `claude --print --model haiku` non-exit + three timed-out distills is the strongest-supported explanation. Capturing prevents re-deriving it and flags a real user-facing hazard.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-3EVDAURQ -->

## URGENT RESUME: the GLOBAL cmk is HALF-INSTALLED/BROKEN (ERR_MODULE_NOT_FOUND) -

**When:** 2026-07-07 · **Fact:** `P-3EVDAURQ`

<!-- decision:P-5VJJUEES -->

## v050-blocker-temporal-sweep-semantic-memory-leak

**When:** 2026-07-07 · **Fact:** `P-5VJJUEES`
**Why:** This froze the maintainer's machine twice during 0.5.0 gate-prep and is a hard blocker on the v0.5.0 tag. The root cause is a per-fact re-sync of the full semantic index in temporalSweep, only reachable in semantic/hybrid mode — which is exactly what the cut-gate + any --with-semantic user hits. Must be fixed before the gate runs (the gate itself fires SessionEnd).

<!-- decision:P-254aD3SC -->

## Test repo (1455 facts) activated semantic mode today

**When:** 2026-07-07 · **Fact:** `P-254aD3SC`
**Why:** Context for why the memory leak manifests here (scales cleanly on empty repo, unbounded on 1455 facts).

<!-- decision:P-5A4MDLD9 -->

## v0.5.0 SessionEnd temporal-sweep memory leak (semantic mode)

**When:** 2026-07-07 · **Fact:** `P-5A4MDLD9`
**Why:** Latent v0.5.0 code, gated by semantic mode. Per-fact cost was accepted in v0.4.5 assuming small fact counts.

<!-- decision:P-NQE5ULVa -->

## Critical: Order Preservation in Embedding Mapping

**When:** 2026-07-07 · **Fact:** `P-NQE5ULVa`
**Why:** Cache is sha-indexed, so bad embeddings persist across sessions and corrupt all future queries. Silent failure — no error raised, just wrong results downstream.

<!-- decision:P-JBK3XXLK -->

## Semantic Embedding Batch Configuration

**When:** 2026-07-07 · **Fact:** `P-JBK3XXLK`
**Why:** Batch limit prevents O(corpus) tensor memory blowup during fact sync. No per-item cap enforced, so pathological oversized facts can still create large tensors.

<!-- decision:P-SWHMFa4R -->

## Test Pattern: Dependency Injection to Avoid Model Load

**When:** 2026-07-07 · **Fact:** `P-SWHMFa4R`
**Why:** Model loading is slow; DI seam makes tests fast and deterministic. Call-count assertions pin leak-prevention invariant precisely (e.g., exactly 1 sync, not N).

<!-- decision:P-LNY7BYDV -->

## Transformers.js Embeddings: Empty Input Edge Case

**When:** 2026-07-07 · **Fact:** `P-LNY7BYDV`
**Why:** No upstream validation. Silent failure risk.

<!-- decision:P-G4A3M9XE -->

## Embedding Cache is Derived Index, Not Primary Memory Storage

**When:** 2026-07-07 · **Fact:** `P-G4A3M9XE`
**Why:** Clarifying this separation prevents mistaking cache loss for memory loss and explains expected performance degradation during cache rebuilds.

<!-- decision:P-4RR6HLS7 -->

## Memory Archive and Tombstone Locations and Procedures

**When:** 2026-07-07 · **Fact:** `P-4RR6HLS7`
**Why:** Archival and tombstoning structure is essential for verifying memory system integrity; knowing both locations allows auditing fact lifecycle and confirming no data loss.

<!-- decision:P-HNLZNY3L -->

## Cleanup Discipline: No Debugging Artifacts in Repo

**When:** 2026-07-07 · **Fact:** `P-HNLZNY3L`
**Why:** Keeps the repository clean and focused; prevents temporary exploration code from becoming committed artifacts.

<!-- decision:P-LMRJ7T54 -->

## Dogfood Facts Generated After Commits

**When:** 2026-07-07 · **Fact:** `P-LMRJ7T54`
**Why:** Tool design: the kit observes and reflects on its own behavior during the session. Facts are generated from responses, so they emerge *after* the initial commit.

<!-- decision:P-VMC25Z3S -->

## HC-2 Distill Freshness FAIL Self-Clears

**When:** 2026-07-07 · **Fact:** `P-VMC25Z3S`
**Why:** The check measures API response time; network fluctuations cause false negatives without indicating a real problem.

<!-- decision:P-C6QLGQA3 -->

## Repack and Reinstall Before Gating Release

**When:** 2026-07-07 · **Fact:** `P-C6QLGQA3`
**Why:** The kit's global instance is what the gate uses. Running against a pre-fix tarball causes the gate to pass broken code.

<!-- decision:P-WLS65XPS -->

## Windows DLL Lock Blocks npm Reinstall

**When:** 2026-07-07 · **Fact:** `P-WLS65XPS`
**Why:** Windows locks in-use files; npm cannot replace them while processes hold them.

<!-- decision:P-RHDTAZZL -->

## cut-gate-v050-scaffold-gitignore-transcript-leak

**When:** 2026-07-07 · **Fact:** `P-RHDTAZZL`
**Why:** A public-repo cmk user commits raw un-screened conversation (names/emails/secrets from tool output) because the scaffold gitignore protects only the .tmp/.log, not the raw transcript/session .md tiers. The dev repo fixed this for itself (D-108) but the fix never propagated to the shipped template.

<!-- decision:P-WCaNKPHM -->

## cut-gate-v050-transcript-privacy-is-task-148-trigger-fired

**When:** 2026-07-07 · **Fact:** `P-WCaNKPHM`
**Why:** My first read framed this as a scaffold-gitignore oversight and proposed gitignoring transcripts by default — WRONG per the docs: committed transcripts are an intentional differentiator, and the privacy hazard is the already-designed Task 148 whose trigger explicitly says 'privacy incident / user request → re-verdict at the v0.5.0 cut.' The cut-gate produced exactly that incident at exactly that cut. The action is a backlog re-verdict, not a gitignore change.

<!-- decision:P-KZaR4PMV -->

## task-148-v050-scope-transcript-path-not-just-fact-classifier

**When:** 2026-07-07 · **Fact:** `P-KZaR4PMV`
**Why:** The user decided to pull Task 148 into v0.5.0 to close the cold-open transcript-PII leak. But 148 as written only screens the fact-extraction path, while the leak is in the raw transcript tier written earlier by capture-turn — so building 148-as-spec would NOT fix the incident that motivated pulling it in. This must be designed (ADR) before code, and the scope is bigger than the task entry.

<!-- decision:P-FHCPRQ4Y -->

## Grill-style design decision process

**When:** 2026-07-07 · **Fact:** `P-FHCPRQ4Y`
**Why:** This accelerates decision-making and ensures all options are explored before committing.

<!-- decision:P-4QALXCYG -->

## Prior research outputs: D-218 and D-227

**When:** 2026-07-07 · **Fact:** `P-4QALXCYG`
**Why:** These form the knowledge base for Task 148 design; assistant confirmed no new deep research is needed.

<!-- decision:P-52R6DV4B -->

## Stop-hook path budget constraint

**When:** 2026-07-07 · **Fact:** `P-52R6DV4B`
**Why:** Understanding this budget is critical to choosing between fast local methods (PII regexes) vs async approaches.

<!-- decision:P-YBCB3PBC -->

## Nestwork Desensitization Approach — Benchmark Findings

**When:** 2026-07-07 · **Fact:** `P-YBCB3PBC`
**Why:** Informs cmk's PII filtering architecture. Confirms names/emails need LLM judgment (not patterns). Provides reference implementation patterns suitable for cmk's design.

<!-- decision:P-3G5KE7NV -->

## PII Detection Landscape: Regex vs LLM Trade-offs

**When:** 2026-07-07 · **Fact:** `P-3G5KE7NV`
**Why:** Informs the three-layer PII detection architecture for the pipeline.

<!-- decision:P-aGZP7NMC -->

## PII Detection Pipeline — L1/L2/L3 Layered Architecture

**When:** 2026-07-07 · **Fact:** `P-aGZP7NMC`
**Why:** Balances performance, precision (patterns first), and recall (LLM fallback).

<!-- decision:P-HCMLERAB -->

## No Prior Art — LLM-Judged Sensitivity Routing Between Tiers

**When:** 2026-07-07 · **Fact:** `P-HCMLERAB`
**Why:** Confirms Task 148 design is genuinely novel and a real differentiator

<!-- decision:P-2FUKaR2M -->

## Task 148 — Auto-Judged Privacy Layered Screen Architecture

**When:** 2026-07-07 · **Fact:** `P-2FUKaR2M`
**Why:** Novel feature (confirmed no prior art); fail-safe by construction; solves real incident

<!-- decision:P-3655aMAC -->

## 148 Privacy-Screen Corpus Triage Workflow

**When:** 2026-07-07 · **Fact:** `P-3655aMAC`
**Why:** Ensures 148 design is grounded in complete research, not sample bias. User rejected random picking in favor of systematic coverage.

<!-- decision:P-LJVBKJJK -->

## Deep-Reader Analysis Phase of Kit Design

**When:** 2026-07-07 · **Fact:** `P-LJVBKJJK`
**Why:** These are primary reference implementations; their design choices will shape the kit's architecture

<!-- decision:P-CB3DaC93 -->

## Sub-Agent Confabulation Detection in Verification

**When:** 2026-07-07 · **Fact:** `P-CB3DaC93`
**Why:** Shows real multi-agent failure mode (confabulation); independent verification catches it; directly informs the kit's own judge/verification design

<!-- decision:P-GG37266G -->

## Defense-in-Depth Scanning: Write + Read Boundaries

**When:** 2026-07-07 · **Fact:** `P-GG37266G`
**Why:** Protects against file-level tampering; relevant for memory system where files persist between sessions

<!-- decision:P-TX4R6BVW -->

## Non-Destructive Flagging with `[BLOCKED]` Placeholders

**When:** 2026-07-07 · **Fact:** `P-TX4R6BVW`
**Why:** Prevents silent data loss; maintains auditability; directly aligns with redaction-log recovery fork in design space

<!-- decision:P-QX2GMNQA -->

## Scoped Threat-Pattern Library Design

**When:** 2026-07-07 · **Fact:** `P-QX2GMNQA`
**Why:** Reference pattern for organizing threat detection across multiple boundaries; shows how to reuse patterns with scope-specific tuning

<!-- decision:P-ZD27R9NE -->

## Cold-Open-Replay Test for PII Screening

**When:** 2026-07-07 · **Fact:** `P-ZD27R9NE`
**Why:** Prevents regression; ensures fix works on real data. Catches edge cases (bidi, invisible-Unicode) unit tests miss.

<!-- decision:P-YXFREZ9E -->

## False-Positive PII Redaction Recovery Log

**When:** 2026-07-07 · **Fact:** `P-YXFREZ9E`
**Why:** Over-aggressive masks hide legitimate data. Local recovery prevents permanent loss on false positives.

<!-- decision:P-GFRV2Z9Q -->

## Metadata Column: Free-Form JSONB with PII Flags

**When:** 2026-07-07 · **Fact:** `P-GFRV2Z9Q`
**Why:** Confirmed by source inspection; flexibility supports dynamic PII tagging.

<!-- decision:P-Q7CHYKL3 -->

## Two-Layer PII Screening: L1 Sync + L3 Async Judge

**When:** 2026-07-07 · **Fact:** `P-Q7CHYKL3`
**Why:** Prevents PII in memory, audit, disk. Tier-routing quarantine (novel vs. memclaw) structurally stronger than query-time filtering. Recoverable on error.

<!-- decision:P-L7C2aAaa -->

## resume-task-148-build-paused-at-sessionend-wiring

**When:** 2026-07-08 · **Fact:** `P-L7C2aAaa`
**Why:** The user paused the session mid-build. Three commits are on the branch; the next session must pick up at the promoteOutcome reporting + full-suite run without re-deriving the plan.

<!-- decision:P-ENDELV5A -->

## Memory Auto-Injection on Session Start

**When:** 2026-07-08 · **Fact:** `P-ENDELV5A`
**Why:** Understanding this mechanism helps explain why the resume plan doesn't need to be manually re-read; the system handles handoff automatically. This is a core feature of the kit being built.

<!-- decision:P-R3CR23SR -->

## Multi-Pass Feature Workflow for Complex Work

**When:** 2026-07-08 · **Fact:** `P-R3CR23SR`
**Why:** This structured approach appears across feature development (e.g., Task 148 spans all three phases); knowing it helps organize future multi-commit work and plan the sequence of steps.

<!-- decision:P-ET5BMLP6 -->

## Uncommitted Change in docs/process/cut-gate.md

**When:** 2026-07-08 · **Fact:** `P-ET5BMLP6`
**Why:** Next session needs to know a file has pending changes and decide whether to commit or discard before continuing with the main Task 148 sequence.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-WRF66BAY -->

## Cut-gate guide should have been run for v0.4.5 and v0.5.0 on kiro and cursor bef

**When:** 2026-07-07 · **Fact:** `P-WRF66BAY`

<!-- decision:P-SaM22R7B -->

## Global cmk is broken; Windows sqlite DLL lock held by active MCP server prevents

**When:** 2026-07-07 · **Fact:** `P-SaM22R7B`

<!-- decision:P-SMMGGXQW -->

## v0.5.0 release tag is ON HOLD until cut-gate guide passes; corrects earlier stat

**When:** 2026-07-07 · **Fact:** `P-SMMGGXQW`

<!-- decision:P-YUVNCZL3 -->

## Stress Gate Required Before PR for Spawn/Hook Boundary Changes

**When:** 2026-07-08 · **Fact:** `P-YUVNCZL3`
**Why:** Spawn/hook boundary changes require empirical gate verification before PR submission

<!-- decision:P-B9NaRSCM -->

## Dogfood proof: fact-path needs the privacy screen too

**When:** 2026-07-08 · **Fact:** `P-B9NaRSCM`
**Why:** The facts DESCRIBED the v0.5.0 cold-open incident (which was about that exact name+email leaking from a uv-init git-config echo), so auto-extract captured the name+email verbatim into context/memory/*.md — committed tier. This is the precise leak class Task 148 exists to catch, occurring on the FACT/scratchpad write path, not just the transcript path. The email should have been L1-masked at the cmk-remember/auto-extract boundary; the name is L3 territory. It proves the fact path (memory-write/write-fact) genuinely needs the screen, validating 148.2's explicit-path L1 wiring — and shows the residual: L1 alone can't catch a bare name, only L3 can.

<!-- decision:P-WDSE2X3M -->

## Memory-Kit Loop System (Tasks 190–193)

**When:** 2026-07-08 · **Fact:** `P-WDSE2X3M`
**Why:** Task 192 closes the recall→outcome→feedback cycle, making memory self-improving rather than write-only. This 4-task architecture is the core self-learning system.

<!-- decision:P-YMXER72W -->

## Verify the autonomous loop, not just the human-correction path

**When:** 2026-07-08 · **Fact:** `P-YMXER72W`
**Why:** The v0.5.0 cut-gate's loop check (and the assistant's first explanation) leaned on a HUMAN-produced outcome — user correction / reversal / re-ask — to close recall→judge→feedback. But the recorded design thesis (P-TLLH95BT high) is that the loop is oracle-free AND human-optional by design: the autonomous case is the TARGET, not an edge. When the user hands the agent a task and it runs autonomously, most human-keyed signals never fire, yet the loop is supposed to still work via: tool-result/exit-code, CI, contradiction/supersession, and PREDICTION/expectation self-resolution. Three recorded hard corners make the autonomous case genuinely harder to VERIFY: (1) silent-success asymmetry — autonomous failure detection is reliable, success detection nearly impossible (P-7TYWM43U); (2) the prediction-self-resolution wedge is directionally set but mechanically undesigned (P-9BDaHHAE item 4); (3) feedback is structurally cross-session — a session can't judge its own writes; the signal arrives NEXT session (P-ZRCYDEGK high). So a cut-gate that only tests "human corrects → judge fires" leaves the design's actual target UNVERIFIED.

<!-- decision:P-5FMaTPHJ -->

## Autonomous Loop Catches Failures, Not Successes

**When:** 2026-07-08 · **Fact:** `P-5FMaTPHJ`
**Why:** Asymmetry is architectural, not a limitation: predictions and tool-resolutions fire now, but confirmation only arrives when memory is *used* later.

<!-- decision:P-4QXKKTB2 -->

## Memory Verification Spans Session Boundaries

**When:** 2026-07-08 · **Fact:** `P-4QXKKTB2`
**Why:** Cross-session model is the design intent (ADR-0017), not a fallback—it matches how knowledge validates in practice.

<!-- decision:P-M5G53Ua5 -->

## Windows EPERM in Test-150 Cleanup (Diagnosed & Fixed)

**When:** 2026-07-08 · **Fact:** `P-M5G53Ua5`
**Why:** Reproducible flaky failure with clear root cause; drain guard is an established codebase pattern for this exact scenario

<!-- decision:P-LUUUZYLT -->

## Daily-distill starvation: cron killed at 23:00 + both safety nets fail to catch it

**When:** 2026-07-08 · **Fact:** `P-LUUUZYLT`
**Why:** Diagnosed live on the dev repo 2026-07-08 (the user: "'daily distill is 5 days stale' means there's a problem, it's supposed to be automatic"). recent.md was 5 days stale despite HC-10 PASS. Evidence: (1) Get-ScheduledTaskInfo shows cmk-daily-distill LastRun updates daily but Result=3221225786 (0xC000013A = STATUS_CONTROL_C_EXIT = terminated) EVERY night, while the sibling ytslide-daily task at the same 23:00 exits 0; (2) running the EXACT cron command manually SUCCEEDS but takes 202815ms (3.4 min) — the distill logic is fine, it's just slow on 1494 facts + 6 days of today-*.md (the P-6WEYN2TM unbound-compress class); (3) task settings: WakeToRun=False, StopIfGoingOnBatteries=True → at 23:00 the machine is asleep/logging-off/on-battery and Task Scheduler kills the started-but-unfinished task. TWO real kit defects compound the environmental cause: (A) HC-10 is FALSE-GREEN — the heartbeat records at/near task START so 'compaction alive, heartbeat fresh' reports PASS while the distill DIES before completing (the D-169 false-green class — a health check green while the work fails 5 nights running); (B) the lazy SessionStart fallback (the always-on floor meant to catch a dead/failing cron, D-75) is SHADOWED by the stale-now verdict on this busy repo (cascade-starvation D-105) so it only ever does the session roll, never the daily distill. So neither the health check nor the fallback caught a 5-day automatic-distill outage. NOT the Task-167.A dead-cron-sentinel bug (that fix works — the cron fires); this is a cron-completes-the-heartbeat-but-not-the-work variant.

<!-- decision:P-X2MBMQ4R -->

## Distill Completes ~3.4 Min On 1500 Facts

**When:** 2026-07-08 · **Fact:** `P-X2MBMQ4R`
**Why:** Essential baseline for cron timeout planning and diagnosing unexpected slowness

<!-- decision:P-KW2B5Y3J -->

## HC-10 Reports Success While Cron Fails

**When:** 2026-07-08 · **Fact:** `P-KW2B5Y3J`
**Why:** Critical monitoring blind spot — health check meant to catch failures doesn't

<!-- decision:P-T9PQFN5E -->

## Nightly Cron Fails Due To WakeToRun=False

**When:** 2026-07-08 · **Fact:** `P-T9PQFN5E`
**Why:** Cascading failures — each night's cron dies, HC-10 doesn't catch it, outage accumulates

<!-- decision:P-KCFJ4GYT -->

## SessionStart Lazy Fallback Shadowed By Cascade-Starvation

**When:** 2026-07-08 · **Fact:** `P-KCFJ4GYT`
**Why:** Second safety net is broken — system has no backup when nightly cron dies

<!-- decision:P-JR5H266L -->

## Long jobs: incremental + resumable from artifacts, never all-or-nothing

**When:** 2026-07-08 · **Fact:** `P-JR5H266L`
**Why:** Surfaced diagnosing the daily-distill starvation (P-LUUUZYLT): daily-distill reads 6-7 days of today-*.md WHOLE into one backend.compress() call (3.4 min on this repo), and when the 23:00 cron gets killed mid-run it persists ZERO progress and re-does the whole (now-larger) corpus tomorrow — a starvation spiral. The user's reframe: "maybe it tries to do everything in one go... it should run as much as it can, still do SOME work, and continue from that point next time — true of ANY job/process in this kit." The kit's PRIOR answer to long-job-timeout was ONLY "bound the input" (D-173, 17/19 systems) — make each run smaller. This adds "make each run RESUMABLE" — make a killed run still move forward. The two the kit already does right prove the pattern: the Task-148 transcript-promote (byte-offset watermark + PROMOTE_MAX_FILES_PER_RUN=2, killed run resumes next turn) and lazy re-embedding (mark stale, re-embed on next retrieval). The compression jobs (daily-distill, weekly-curate, compress-session) + temporal-sweep are the all-or-nothing holdouts. Enabling insight (P-6M26BR9S): now.md/today-*.md are DERIVED buffers over the durable transcript tier, so a partial/re-run distill can NEVER corrupt — the source of truth survives. CRITICAL constraint (ADR-0002, P-aRHH7Va5): do NOT implement this with a new persistent watermark/sentinel FILE (two-writer hazard the ADR disfavors) — derive the resume point from ARTIFACT state (which days already have a summary in recent.md; mtime; content-addressed sha), the same way isJournalStale uses INDEX.md mtime. The Task-148 byte-offset .state file is the ONE sanctioned exception shape (single-writer, crash-safe marker-after) and only where an artifact-derived point isn't available.

<!-- decision:P-JGGA2CKY -->

## Distinction Between Deferred and Committed Work

**When:** 2026-07-08 · **Fact:** `P-JGGA2CKY`
**Why:** Conflating the two led to premature deferral; silent promise-breaking should not be gated.

<!-- decision:P-2SMZGDNF -->

## v0.5.1 Tasks Filed for Distill and Principle

**When:** 2026-07-08 · **Fact:** `P-2SMZGDNF`
**Why:** User's insight that "memory just works automatically" was broken by silent distill failure; the principle ensures future long jobs won't repeat it.

<!-- decision:P-355DF75F -->

## Misleading "embedder unavailable" note fires on keyword-only scopes (decisions) — cold-open false alarm

**When:** 2026-07-08 · **Fact:** `P-355DF75F`
**Why:** Surfaced live in the v0.5.0 cold-open re-test (cut-gate-coldopen-148, 2026-07-08): the agent's mk_search --scope decisions printed "this project's configured default search is semantic (hybrid), but the embedder is unavailable (unknown-scope:decisions) — keyword-only results. Suggest the user run cmk install --with-semantic to restore semantic recall." But semantic WAS working (cmk search --mode semantic returned real meaning-ranked results; settings.json has default_mode:hybrid). Root cause (mcp-server.mjs:141-149): the !prep.ok degraded-note branch treats ALL failure reasons the same, but prepareSemanticBackend (semantic-backend.mjs:197/350) returns reason='unknown-scope:<scope>' for scopes that are keyword-only BY DESIGN (decisions — Task 156) — distinct from the REAL failures 'embedder-not-installed'/'sqlite-vec-unavailable'/'embedder-disabled'. So a by-design keyword-only scope emits a "your embedder is broken, reinstall" note. This is the P-KRGYHRUX cosmetic bug (Task 156 filed the recall feature but never fixed the warning) — and it's WORSE than cosmetic because (a) it fires on the COLD-OPEN, the kit's showcase moment, giving a brand-new user a false "broken, reinstall" impression on the exact path the product is judged by, and (b) unknown-scope is indistinguishable from a genuine stale-MCP error, a diagnostic hazard. NOT a Task-148 or learn-loop issue; pre-existing since v0.3.3.

<!-- decision:P-TC9TUMaM -->

## False "Embedder Unavailable" Alert on --scope decisions

**When:** 2026-07-08 · **Fact:** `P-TC9TUMaM`
**Why:** This false alarm fires on the cold-open (showcase moment), giving new users the false impression that their setup is broken when everything actually works.

<!-- decision:P-MZ4PZMS7 -->

## v0.5.0 Release — Feature Complete, L3 Promotion Gate Pending

**When:** 2026-07-08 · **Fact:** `P-MZ4PZMS7`
**Why:** Release is one gate away from tagging. Next session needs exact status to know what remains and what's next.

<!-- decision:P-AAHW235S -->

## L3 promote 20s judge timeout starves the committed transcript on slow-Haiku (same class as D-179)

**When:** 2026-07-08 · **Fact:** `P-AAHW235S`
**Why:** Found in the v0.5.0 cold-open E2 re-test (cut-gate-coldopen-148b, 2026-07-08). The privacy screen's containment PASSED perfectly — but the committed transcript never appeared because promotePendingTranscripts kept deferring. Instrumented the real return: reason = "HaikuViaAnthropicApi: claude --print did not return within 20000ms". Same slow-Haiku window that made the extraction child take 63s and compress-session take 26s this session (the D-174/D-179 environmental-slowness class). Proven it's PURELY the budget, not a broken judge: same promote with timeoutMs:90000 succeeded — promoted all 4 turns, committed transcript landed SCREENED («USER» present, raw username count 0). So: (a) fail-closed works (deferred → everything stayed in the gitignored live buffer → nothing unscreened committed — the D-294 invariant held under a real judge timeout); BUT (b) the happy path is starved — on a slow-Haiku day the promote defers indefinitely, the committed transcript lags, and a user sees an empty committed transcript + assumes capture is broken (a bad-observability + eventual-data-completeness issue, though never a leak). This is the D-179 class exactly: PII_JUDGE_TIMEOUT_MS=20s was sized for the per-turn detached child's 25s internal budget + the 60s SessionEnd ceiling — but like the compress callers before D-179, a CEILING-FREE-ish site (the detached child, and the SessionEnd top-up which has 50s of headroom) shouldn't use a hook-tight timeout when the real claude --print takes 18-78s in a slow window.

<!-- decision:P-GMG9W7AZ -->

## Resume: fix-l3-promote-timeout WIP at 4e33935, then v0.5.0 tag

**When:** 2026-07-08 · **Fact:** `P-GMG9W7AZ`
**Why:** This is the LAST fix before the v0.5.0 tag. The v0.5.0 cut-gate cold-open (cut-gate-coldopen-148b) fully PASSED — E1 wedge exemplary, D-300 scope-note fix confirmed live, E2 privacy screen proven both halves (L1 mask + L3 promote end-to-end, committed transcript «USER»-masked with raw username count 0). The ONE finding was P-AAHW235S: the L3 judge's 20s timeout was too tight for the slow-Haiku window so the promote deferred every run (fail-closed = safe, never leaks, but the committed transcript never landed). The user chose fix-before-tag (same class + size as the D-300 showcase fix). The fix is the D-179 site-aware-timeout pattern.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-BBDSKGZY -->

## Trusts assistant to make design decisions; will accept recommendation on pipelin

**When:** 2026-07-07 · **Fact:** `P-BBDSKGZY`

<!-- decision:P-V9VD962L -->

## User checks project memory/conventions before starting new work (ran memory-sear

**When:** 2026-07-07 · **Fact:** `P-V9VD962L`

<!-- decision:P-Y6TY75E6 -->

## Prefers systematic full-corpus review + scoring over random sampling when evalua

**When:** 2026-07-07 · **Fact:** `P-Y6TY75E6`

<!-- decision:P-72TMLEAJ -->

## merge

**When:** 2026-07-08 · **Fact:** `P-72TMLEAJ`

<!-- decision:P-BDHNXTNA -->

## Merge approved and completed; main green (all CI checks, SonarCloud A/A restored

**When:** 2026-07-08 · **Fact:** `P-BDHNXTNA`

<!-- decision:P-C7VAZT7K -->

## Task 148 shipped; privacy screen feature now in codebase

**When:** 2026-07-08 · **Fact:** `P-C7VAZT7K`

<!-- decision:P-W6VHUWM7 -->

## Idiomatic Timeout Composition Pattern (50s/120s)

**When:** 2026-07-08 · **Fact:** `P-W6VHUWM7`
**Why:** This is the standing design pattern for timeout decisions; adhering to it ensures consistency and correctness across timeout-related changes.

<!-- decision:P-KF53SS2F -->

## Repack Requires cmk mcp Process Cleanup

**When:** 2026-07-08 · **Fact:** `P-KF53SS2F`
**Why:** Prior incident: a repack was attempted with mcp serve procs still active, causing install failure.

<!-- decision:P-5VGPMEJN -->

## Stress Tests Require Git Isolation (Task-150 EPERM Race)

**When:** 2026-07-08 · **Fact:** `P-5VGPMEJN`
**Why:** Prior incident: parallel git + stress caused file lock races, breaking reproducibility.

<!-- decision:P-aLLW62HD -->

## cmk install breaks itself on its own running MCP server DLL lock (Windows) — a real bug, never code-fixed

**When:** 2026-07-08 · **Fact:** `P-aLLW62HD`
**Why:** The user's catch (2026-07-08): "killing the cmk mcp serve procs first — that is a bug, no?" — Yes. Extensively documented (P-SaM22R7B, P-EMNaBNWT high-trust) but NEVER filed as a code-fix task; the recorded disposition is only "document + tell the user to manually kill cmk mcp serve before reinstall." That's a workaround, not a fix — a tool that breaks itself when you reinstall it while it's running is a defect, and the user shouldn't have to know to hand-kill processes. Nuances: (1) usually the EBUSY is COSMETIC — fires during cleanup, install still succeeds (verify by cmk --version not error count, P-aPH3CKPU high); the genuinely-broken half-install (uninstall completed, install couldn't overwrite the locked DLL) is the rarer case we hit live during v0.5.0 gate-prep. (2) The STRUCTURAL cure (better-sqlite3 → node:sqlite, Task 141b) would eliminate the whole locked-DLL class but is REJECTED (~10% slower FTS5, fails the D-147 no-perf-regression bar) — so the DLL fragility is a knowingly-accepted cost of the perf choice. The gap: even accepting the lock as an OS reality, cmk install should not leave a BROKEN global — graceful handling was floated for cmk doctor/cmk update but never scoped.

<!-- decision:P-4UGWAaVB -->

## Windows DLL Locking During cmk Reinstall

**When:** 2026-07-08 · **Fact:** `P-4UGWAaVB`
**Why:** Known bug affecting Windows workflow. Not a tag blocker but needs proper fix in v0.5.1. Future sessions need the workaround, tracking info, and awareness that this is a temporary patch, not normal procedure.

<!-- decision:P-RSLAJ6C4 -->

## D-292 resolved: all-three-agent gates block the v0.5.0 tag (compatibility claim = truth, not ceremony)

**When:** 2026-07-08 · **Fact:** `P-RSLAJ6C4`
**Why:** Memory held two contradictory recorded positions on whether platform (Kiro/Cursor) gates block the tag: P-5SBBBN6R (non-blocking — base/Claude gate owns the tag, platform gates are surface-wiring green-lights) vs P-NWUYVLZN (all-three-must-pass). D-292 (the v0.5.0 tag-hold) never resolved which model applies. The user resolved it on the CORRECT axis — not "how much verification" but TRUTH: the README + CHANGELOG claim Kiro and Cursor compatibility, so shipping v0.5.0 without verifying capture/inject actually work through Kiro's hooks + Cursor's wiring would make that compatibility claim a LIE (the lazy-framing / knowingly-false-headline class this project forbids). This matters MORE for v0.5.0 than a typical release because the privacy screen (Task 148) is NEW and touches the capture/transcript path on EVERY agent — if Kiro or Cursor wires capture differently, the screen could behave differently there, untested. Precedent that proves the gates catch real bugs: D-269 (Kiro shipped empty snapshots for two minors while unit tests passed — agent-specific wiring is exactly what unit tests can't reach).

<!-- decision:P-EA59K24G -->

## Kiro gate v0.5.0 Session 1: privacy screen + all core surfaces PASS; 3 paths need a targeted follow-up turn

**When:** 2026-07-08 · **Fact:** `P-EA59K24G`
**Why:** The v0.5.0 all-three-agent gate (D-292). Kiro Session 1 (FastAPI chat build, 4 turns) proved the CRITICAL things: (1) the CLI-deterministic half all passed (KG1 install 8 surfaces, KG1b doctor Kiro-aware 0-fail HC-1 reads "Kiro capture/inject wired via IDE hooks + CLI agent", HC-11 "runs through kiro-cli", KG2 MCP+autoApprove, KG3 steering, KG8 hybrid, KG10 AGENTS.md, KG11 trust, + the v0.5.0 privacy scaffold *.live.md/private.md/.locks gitignored); (2) LIVE: every turn fired Run Command Hook recall/capture/observe-edit (the ★★ real-input rule — hooks registered AND firing on Kiro's plumbing); steering "Included: AGENTS.md, cmk.md"; mk_remember ran inline with NO Reject/Trust/Run prompt (autoApprove works); memory-write skill loaded + wrote 4 rich facts (P-6BFKA5QW/P-EGS5VGRS/P-LC2FHMaE + philosophy); the ADR-0018 "N uncommitted files — commit?" proposal fired; (3) THE PRIVACY SCREEN WORKS ON KIRO — redactions.log shows L1:1 (email masked at capture) + L3:10 (the judge screened 10 entries and promoted them to the committed 2026-07-08.md, 11 turn headings, raw username 0) — the exact new-and-risky v0.5.0 capture-path feature fires correctly through Kiro's capture hook. What this session did NOT exercise (session shape, not bugs): E3 search-recall (recall.log has 9 source:inject but 0 source:search — the session used mk_remember + web_search, never mk_search); E3 judge trust-signals.log (ABSENT — no failing tool call, no user correction; the honest within-session failure-only asymmetry means a clean forward-progress session has nothing for the judge to dampen); E2 name-mask specifically (the fictional Alex Personname git identity IS set but uv init was never run, so the name never echoed into tool output — the email path WAS exercised).

<!-- decision:P-4VAY63ST -->

## Kiro gate contaminated by running CLI checks in a Kiro-open folder — re-run needed for B9/E3

**When:** 2026-07-08 · **Fact:** `P-4VAY63ST`
**Why:** Found during the thorough pre-S1-through-S2 file/command sweep the user requested. Evidence: context/sessions/now.md and context/transcripts/2026-07-08.live.md contain '## <ts> — assistant' headings whose BODY is this Claude conversation's text (e.g. "Kiro gate — CLI-deterministic half: PASS", "Recorded (P-EA59K24G)", the mk_remember tool-call echo) — my messages, not the Kiro session's. 0 '— user' headings at all. The extract.log shows 11 successful auto-extract runs (dur 7-18s, real kiro-cli LLM calls) ALL returning nothing_durable/obs:0 — consistent with the extractor seeing assistant-origin/contaminated content (assistant-origin candidates demote toward discarded; no USER_TURN to anchor user-stated preferences). ROOT: the Kiro IDE had C:\Temp\kiro-gate-v050 open with its hooks live while I ran the gate's CLI-deterministic checks (cmk doctor, node probes, git config) in that same folder from the dev-repo Claude session — Kiro's capture fired on that activity. This is MY test-hygiene mistake (the guide's §0 backup/isolation intent is that the folder is driven ONLY by the agent under test), NOT a proven product bug. The CLI-deterministic surface checks (KG1-KG11 + privacy scaffold) and the privacy-screen L1/L3 mechanism (redactions L1:1+L3:10, committed transcript screened) are STILL valid — they're file-state checks independent of the transcript content. What's compromised is B9 (auto-extract rich facts) + E3 (learn-loop recall/judge) which read the session's captured turns. KG11 clarification (the user's catch): trust lives in .vscode/settings.json (present, scoped), NOT .kiro/permissions.yaml (not emitted this install) — KG11 PASSES via .vscode.

<!-- decision:P-GETTJWDJ -->

## Kiro gate v0.5.0 VERDICT: PASS — the kit works on Kiro

**When:** 2026-07-08 · **Fact:** `P-GETTJWDJ`
**Why:** The user's framing clarified the gate's actual bar (2026-07-08): "we are checking that the kit works, if we have memory files then it works." The assistant had over-fixated on B9 (auto-extract vs explicit capture) + E3-judge (which didn't fire only because the clean forward-progress session had no failure/correction to judge — not a defect). Those are refinements, not "does it work" questions. What the Kiro live session PROVED: install wires all 7+ surfaces (KG1-KG11 all pass, KG11 trust via .vscode/settings.json per the user's correction, not permissions.yaml); Kiro's capture/inject/observe-edit hooks fire every turn (the ★★ real-input rule — registered AND firing); steering + the persona injected (the wedge — it applied recorded conventions unprompted); 5 fact files written via mk_remember with correct v0.5.0 schema (frontmatter + recurrence_count, write_source:user-explicit, trust:high auto, real source_sha1, rich Why/How bodies, correct feedback/project/user typing), privacy-clean (0 raw username, 0 absolute paths), INDEX.md auto-updated with all 5; MCP tools ran inline prompt-free (autoApprove); the privacy screen ran (redactions L1:1+L3:10, committed transcript screened, raw username 0). The transcript got contaminated by the assistant running CLI checks in the Kiro-open folder (P-4VAY63ST) — that blocked a clean B9/E3 read but does NOT change the verdict: memory files landed correctly = the kit works.

<!-- decision:P-TBGK35LC -->

## Kiro gate v0.5.0: COMPLETE — all 3 sessions PASS, kit works end-to-end

**When:** 2026-07-08 · **Fact:** `P-TBGK35LC`
**Why:** D-292 (the 3-agent tag gate). Kiro is now fully verified across all 3 cut-gate sessions, the same structure as the Claude gate. S1 (build FastAPI chat, C:\Temp\kiro-gate-v050): install wires all surfaces (KG1-KG11, trust via .vscode/settings.json), capture/inject/observe-edit hooks fire every turn, 5 fact files written via mk_remember with correct v0.5.0 schema + rich Why/How + privacy-clean + INDEX auto-updated, MCP prompt-free (autoApprove), privacy screen ran (redactions L1+L3, committed transcript screened). S2 (reopen Kiro same project): agentSpawn inject fired, the fresh session recalled the uv/ruff rules AND the layered project structure AND the Session-1 decisions (FastAPI 0.139.0 pin, send() AsyncGenerator, per-turn cost) with NO re-brief, then capture fired + the ADR-0018 commit-proposal. S3 (fresh folder C:\Temp\kiro-coldopen-v050, the cold-open WEDGE — the gate that matters most): asked only 'start a new Python backend', Kiro applied the ENTIRE persona unprompted — uv init + uv add (never pip), project-local .venv, uv add --dev ruff + ran ruff check --fix + format, layered app/{api,core,db,models,services}/ with thin routes + router mount + pydantic-settings config, a passing test-first health test, even pinned FastAPI 0.139.0 from S1's recorded decision. recall.log confirmed the source:inject fired (that's HOW it knew); committed transcript screened (redactions.log 2 entries). 'How does it know that?' = the wedge, proven on Kiro's hooks not just Claude's.

<!-- decision:P-LPJ7BNSB -->

## RESUME: v0.5.0 tag blocked ONLY on the Cursor gate — everything else done

**When:** 2026-07-08 · **Fact:** `P-LPJ7BNSB`
**Why:** This session took v0.5.0 from code-complete to nearly-tagged. DONE + MERGED to main: (1) D-293 memory-leak fix (PR #263); (2) Task 148 privacy screen full build + review (PR #264); (3) D-300 mk_search unknown-scope false-'embedder unavailable' note fix (PR #265); (4) D-301 L3-promote 20s→120s site-aware timeout fix (PR #266, main tip 01cbd23 + guide-sync b2d2742). Global repacked to fixed 0.5.0 (INVISIBLE_CODEPOINT_HEX + PII_JUDGE_TIMEOUT_MS=120s present). FILED for v0.5.1 (NOT tag-blocking): Task 203 (distill starvation), Task 204 (incremental-resumable principle ADR), Task 205 (cmk install self-lock on its own MCP-server DLL). D-292 RESOLVED (P-RSLAJ6C4): the tag is blocked on ALL 3 agent gates (Claude+Kiro+Cursor) because the README claims Kiro/Cursor compatibility — shipping unverified = a lie. GUIDE SYNC done (b2d2742): all 3 cut-gate guides (cut-gate.md + -kiro + -cursor) now carry E2 (privacy screen) + E3 (learn-loop) checks. GATE STATUS: Claude=PASS (Sessions 1-3 + cold-open, from earlier this session). Kiro=COMPLETE (P-TBGK35LC): S1 build+capture (5 correct rich memory files C:\Temp\kiro-gate-v050), S2 recall (reopened same folder), S3 cold-open wedge (C:\Temp\kiro-coldopen-v050, applied uv/venv/ruff/layered/test-first unprompted). Cursor=PENDING. The Kiro S1 transcript got contaminated by me running CLI checks in the Kiro-open folder (P-4VAY63ST) — lesson: assistant stays OUT of a gate folder while the agent-under-test has it open.

<!-- decision:P-FSaL7MCB -->

## Auto-extract works on Kiro (confirmed by direct probe) — the nothing_durable wall was contamination, not a bug

**When:** 2026-07-09 · **Fact:** `P-FSaL7MCB`
**Why:** The user pushed (2026-07-09): "we want everything to work on kiro like in claude code, so what doesn't work and how we fix it? ... just read the code, check files, run commands, maybe there is a bug in the automatic process in kiro." Direct diagnosis (the right move, not memory-searching): spawned the REAL KiroCliBackend with buildExtractionInstructions() against a real preference-stating turn (USER_TURN: 'always use uv never pip, .venv, ruff before commit' / ASSISTANT_TURN: ack). kiro-cli (28.6s, claude-haiku-4.5, prompt on stdin, --trust-tools=) returned PERFECTLY PARSEABLE output: 3 'TRUST_HIGH user:' lines (the exact uv/venv/ruff rules) + 3 'PERSONA CANDIDATE | target=HABITS.md ...' lines. The parser extracts all of these → auto-extract WORKS on Kiro identically to Claude. CONTROL probe: the SAME backend given an assistant-only/meta turn (like my gate-scoring prose that polluted the Kiro S1 folder) correctly returned 'SKIP — This turn is a meta-instruction about memory extraction itself... no facts about their work/setup/preferences/project conventions.' So the 11 nothing_durable runs on Kiro S1 (P-4VAY63ST) were the extractor CORRECTLY skipping my contaminated turn-files, NOT a backend/parse bug. The kiro-backend.mjs stdout cleaning (strip ANSI + leading '> ') works; the D-279/D-280 stdin-delivery fix works; the extraction prompt is NOT backend-sensitive. Nothing to fix.

<!-- decision:P-GBLJYLQ6 -->

## Avoid Test Folder Contamination During Agent Sessions

**When:** 2026-07-09 · **Fact:** `P-GBLJYLQ6`
**Why:** Previous Kiro gate rounds confused contamination artifacts with extraction system bugs.

<!-- decision:P-TXWT72PM -->

## UNVERIFIED: auto-extract has never automatically WRITTEN a fact on Kiro (0 auto-extract-sourced facts)

**When:** 2026-07-09 · **Fact:** `P-TXWT72PM`
**Why:** The user's precise challenge: "you say it works, but did it automatically run?" — exposing that my two probes (P-FSaL7MCB) proved the ENGINE works in isolation and the hook TRIGGERS, but NOT the automatic end-to-end fact-write. Evidence: C:\Temp\kiro-gate-v050 has 5 user-explicit facts (all from mk_remember the model called explicitly) and 0 auto-extract facts; C:\Temp\kiro-coldopen-v050 has 0 facts; every extract.log entry across both = nothing_durable/obs:0. So the automatic path (Kiro Stop hook → detached auto-extract child → runAutoExtract → written fact with write_source:auto-extract) has produced ZERO facts on Kiro. Two candidate causes, indistinguishable from current data: (a) auto-extract legitimately SKIPPED because in S1 the model ALSO called mk_remember on the same preferences, so the content was already explicitly saved and auto-extract dedup/skip-demoted it (assistant-origin candidates demote a trust level; if the fact already exists it's a dup) — this would mean auto-extract WORKS but had nothing new; (b) a genuine Kiro automatic-path defect. The direct probe (P-FSaL7MCB) proved the extraction LLM through kiro-cli returns TRUST_HIGH + PERSONA CANDIDATE lines for a clean preference turn — so the engine is fine — which makes (a) more likely, but it is NOT PROVEN. This is the D-169 automatic-path discipline: the load-bearing claim is 'captured automatically with no command,' and that specific claim is untested on Kiro. My earlier P-TBGK35LC 'Kiro COMPLETE' overstated this — Kiro's capture/inject/recall/wedge/privacy/explicit-write are proven; its automatic FACT EXTRACTION is not.

<!-- decision:P-MRXZDQa4 -->

## Kiro IDE transcript parser works (both turns extracted from real data) — NOT the auto-extract cause

**When:** 2026-07-09 · **Fact:** `P-MRXZDQa4`
**Why:** Diagnosing why Kiro auto-extract produced 0 write_source:auto-extract facts (P-TXWT72PM). Ruled OUT the parser: (1) parseKiroIdeV1Messages reads msg?.payload?.type and msg?.payload?.content — the CORRECT nesting for the real Kiro IDE-1.0 schema (each messages.jsonl line = {id,timestamp,payload:{type:'user'|'assistant',content}}); my earlier 'roles:undefined' scare was my throwaway script reading m.type at the TOP level, not the parser. (2) Ran the ACTUAL parser against a real ~/.kiro IDE messages.jsonl → returned userText='i have version 3.13...' (51 chars) AND assistantText (736 chars) → bi-turn extraction gets both turns. So the IDE reader is fine. The kiro-cli reader (parseKiroCliSession) IS assistant-only by design (kiro-cli stores user_prompt_length not the verbatim prompt) — that's a real limitation for kiro-CLI users but NOT what hit the IDE gate sessions. NET: the reason for 0 auto-extract facts is STILL UNPROVEN. Candidates remaining: (a) in S1 the model ALSO explicitly mk_remember'd the same preferences → auto-extract dedup/skipped them as already-saved (would mean it WORKS, just nothing new); (b) my folder contamination fed it meta-turns; (c) something in the hook→child spawn→turn-file-write chain on Kiro drops the user turn AFTER the reader (e.g. the turn-file the detached child reads gets only the assistant side). Have NOT proven which. IMPORTANT PROCESS NOTE: I thrashed — declared 'found the bug' 3x (parse-format, then payload-nesting, then CLI-user-turn-less) and was wrong each time because I tested throwaway scripts instead of the real parser against real data. The discipline: test the REAL function against REAL data before claiming a bug.

<!-- decision:P-JMZJ6ERL -->

## Kiro Auto-Extract: Trigger Works, Write Unproven

**When:** 2026-07-09 · **Fact:** `P-JMZJ6ERL`
**Why:** Last unknown before Cursor validation. Determines whether "Kiro fully green" holds for claude-memory-kit testing.

<!-- decision:P-94B7Z7SW -->

## Memory Facts Track Extraction Origin via write_source

**When:** 2026-07-09 · **Fact:** `P-94B7Z7SW`
**Why:** Essential for debugging missing or duplicate facts across IDE gates and understanding whether auto-extract silently dedups or genuinely fails.

<!-- decision:P-TQSG9PCA -->

## CONFIRMED Kiro bug: user turn never captured → auto-extract can't catch user-stated preferences (only assistant)

**When:** 2026-07-09 · **Fact:** `P-TQSG9PCA`
**Why:** Definitive clean test (2026-07-09, C:\Temp\kiro-autoextract-test, uncontaminated, user drove alone): user stated a strong extractable preference ('I always use httpx never requests, my default across all projects'). Evidence chain: (1) now.md has 0 '— user' headings, 1 '— assistant'; the httpx/preference TEXT appears 0 times in now.md — the user turn never reached what auto-extract reads; (2) live transcript has 0 user headings; (3) extract.log: 3 automatic runs (success:true, ~8s real kiro-cli LLM calls), ALL nothing_durable/obs:0/rich:0; (4) 0 write_source:auto-extract facts (the only fact is user-explicit from the model's own mk_remember call). THE LOGS pin the root cause: recall.log shows source:inject fired (UserPromptSubmit→inject works); redactions.log's ONLY source is transcript-promote — there is NO capture-prompt and NO capture-turn redaction source, meaning capture-prompt (the user-turn write) NEVER FIRED. In kiro-ide-hooks.mjs: the IDE-1.0 hooks map UserPromptSubmit→INJECT (line 125), Stop→capture-turn (line 116, assistant only), and capture-prompt is only on the LEGACY promptSubmit .kiro.hook (line 76) which IDE 1.0 doesn't fire. So on Kiro IDE, the user prompt triggers inject but NOT capture-prompt → the user turn is dropped → capture-turn's readKiroTurn gets assistant-only (or the fallback hits the user-turn-less kiro-cli reader) → now.md user-turn-less → auto-extract's BI-TURN extraction (which needs USER_TURN to identify user-stated preferences) starves → nothing_durable. This BREAKS the kit's headline 'captures automatically, prompt-free' for user preferences on Kiro. NOT contamination (clean session), NOT dedup (the preference text isn't even in now.md to dedup against), NOT the parser (parseKiroIdeV1Messages works on real data, P-MRXZDQa4). This SUPERSEDES the false P-TBGK35LC/P-GETTJWDJ 'Kiro complete' claims re: auto-extract.

<!-- decision:P-3F7L7JZ4 -->

## Kiro IDE Hook Architecture Gap: Missing Capture-Prompt on UserPromptSubmit

**When:** 2026-07-09 · **Fact:** `P-3F7L7JZ4`
**Why:** This fully explains why auto-extract never observes `write_source: auto-extract` facts; it's not that the parser fails or dedup prevents saves—the user turn is simply never captured at the hook layer.

<!-- decision:P-65N46V47 -->

## Kiro IDE v1 USER_PROMPT env var broken; read from messages.jsonl instead

**When:** 2026-07-09 · **Fact:** `P-65N46V47`
**Why:** Auto-extract is the kit's headline feature; broken on Kiro IDE 1.0. Diagnosis now sourced and confirmed. Workaround is feasible and under kit's control. Blocks shipping per D-292.

<!-- decision:P-J3T74JMN -->

## CORRECTION: Kiro capture-prompt wiring is present (not missing) — the bug is empty USER_PROMPT on IDE 1.0 v1 + silent no-op

**When:** 2026-07-09 · **Fact:** `P-J3T74JMN`
**Why:** A same-day auto-extracted fact (P-3F7L7JZ4, trust:medium) mis-diagnosed the Kiro user-turn bug as 'the capture-prompt hook is never invoked — the fix is to invoke it.' Two independent sonnet research agents (web + our own research base) both proved that WRONG: the dispatcher DOES call capturePrompt on userPromptSubmit/promptSubmit (PROMPT_CAPTURE_EVENTS set at kiro-hook-dispatch.mjs:46, called at :71-85, wired by Task 50.N.1 PR #228 shipped 2026-06-25). The stale fact likely came from reading only the IDE hook JSON's name/description ('recall') without tracing the dispatcher. The ACTUAL root cause, now authoritative: (1) env.USER_PROMPT is the DOCUMENTED Kiro IDE prompt mechanism (kiro.dev/docs/hooks/types/ 'the user prompt can be accessed via the USER_PROMPT environment variable') and the kit reads it correctly (kiro-hook-bin.mjs:67-70); (2) BUT it was only ever verified on the LEGACY 0.x .kiro.hook surface (probe P-CJYGTQYR 2026-06-21, pre-IDE-1.0) + an AWS article about the general pre-1.0 hook system + kiro-cli's stdin 'prompt' field — NEVER on Kiro IDE 1.0's v1 .json/UserPromptSubmit format; (3) on IDE 1.0 v1 it arrives EMPTY (Kiro's own open bugs #9619/#6188/#7375/#4620); (4) capture-prompt.mjs:80-82 silently no-ops (reason:'empty-prompt') with no log — the D-269 silent-empty-since-v0.4.0 class exactly. So the user turn never lands in the transcript/now.md → auto-extract's bi-turn extraction starves → nothing_durable → 0 write_source:auto-extract facts on Kiro IDE.

<!-- decision:P-ZEPMTUMP -->

## captureTurn PII masking and transcript ordering fix

**When:** 2026-07-09 · **Fact:** `P-ZEPMTUMP`
**Why:** Ensures transcript correctness and consistent PII masking in the stop-hook capture system.

<!-- decision:P-QLW579M4 -->

## D-303 blocker closing via live Kiro re-test

**When:** 2026-07-09 · **Fact:** `P-QLW579M4`
**Why:** Proves Kiro hook integration works in production before release gates.

<!-- decision:P-FJ5WFGLB -->

## D-303 Fixed: Kiro Auto-Extract USER_PROMPT Empty, Recovered from payload.user_message

**When:** 2026-07-09 · **Fact:** `P-FJ5WFGLB`
**Why:** Auto-extract broken on Kiro blocked D-303 and broke parity with Claude Code; this fix enables fact capture from Kiro sessions without manual commands

<!-- decision:P-KWQJTEFG -->

## CMK Install + Kiro Setup Commands

**When:** 2026-07-09 · **Fact:** `P-KWQJTEFG`
**Why:** The user is iterating on a D-303 proof for auto-extract; clean, reproducible gate setup saves re-discovery.

<!-- decision:P-92a5DQTJ -->

## D-303 Test Environment Confirmed Ready

**When:** 2026-07-09 · **Fact:** `P-92a5DQTJ`
**Why:** Confirms which folder to use; baseline cleanliness validates it's a fresh slate where any facts appearing after the test are unambiguously from auto-extract, not prior state.

<!-- decision:P-YE9VP2NK -->

## Kiro Gate §0c — Backup & Recovery Procedure

**When:** 2026-07-09 · **Fact:** `P-YE9VP2NK`
**Why:** The gate measures cmk in isolation; user-level artifacts must not interfere. User's real Kiro agents + settings survive via backup, enabling clean restore.

<!-- decision:P-3YVQUXTW -->

## Kiro Requires Full Restart to Load Updated Hooks

**When:** 2026-07-09 · **Fact:** `P-3YVQUXTW`
**Why:** Kiro caches hooks in memory at startup. Reload does not refresh the cache; old hooks remain active until IDE restart.

<!-- decision:P-ZWF3YFUQ -->

## Cut-Gate-Kiro Deliberately Tests Both Kiro Clients Across Three Sessions

**When:** 2026-07-09 · **Fact:** `P-ZWF3YFUQ`
**Why:** A single install wires two clients; the gate must prove both work and can share state. IDE-only testing would miss client-specific bugs.

<!-- decision:P-74QJEBLW -->

## cut-gate-kiro.md Lacks Clear Documentation of Two-Client Testing Across Sessions

**When:** 2026-07-09 · **Fact:** `P-74QJEBLW`
**Why:** Clear documentation prevents confusion and sets correct expectations for gate runners.

<!-- decision:P-QEB69SP6 -->

## Kiro Install Contains Two Independent Clients with Separate Hook Systems

**When:** 2026-07-09 · **Fact:** `P-QEB69SP6`
**Why:** Both clients are installed and available; they must be tested separately because a bug or feature that works in one may not work in the other. Default-agent resolution (D-182) is an example of a CLI-only issue.

<!-- decision:P-X4FCZQLA -->

## E2 Privacy Screen Verification Test

**When:** 2026-07-09 · **Fact:** `P-X4FCZQLA`
**Why:** E2 is a headline blocker (privacy screening). Currently proven not to break things, but not proven to actually catch identities. This test closes the gap.

<!-- decision:P-4Y3H5F77 -->

## Cursor Loads `.cursor/hooks.json` Only at App Start

**When:** 2026-07-09 · **Fact:** `P-4Y3H5F77`
**Why:** Explains why the D-262 workaround (fully quit + reopen Cursor) is necessary. Understanding the distinction between live-loaded MCP tools and startup-loaded hooks helps diagnose failures in hook integration tests.

<!-- decision:P-aB42P3SF -->

## Cursor Gate v0.5.0 Test Procedure

**When:** 2026-07-09 · **Fact:** `P-aB42P3SF`
**Why:** Isolated end-to-end test of the D-305 fix in the real Cursor environment (Cursor is the third and final gate before release). now.md is the smoking-gun proof the hook executed.

<!-- decision:P-CX4MWULJ -->

## Cursor hook debugging via environment probe

**When:** 2026-07-09 · **Fact:** `P-CX4MWULJ`
**Why:** Cursor's hook spawning behavior and environment inheritance is opaque; these cannot be reliably inferred from code inspection. The logged env dump is definitive ground truth.

<!-- decision:P-PJ5HR9aD -->

## Cursor-hook should prefer CURSOR_PROJECT_DIR environment variable for path resolution

**When:** 2026-07-09 · **Fact:** `P-PJ5HR9aD`
**Why:** Previous debugging found Windows path normalization issues with `workspace_roots`; the env var is the documented, staff-recommended workaround for this platform-specific fragility.

<!-- decision:P-9JF76SN7 -->

## Cursor Hook Probes Auto-Reload Without Restart

**When:** 2026-07-09 · **Fact:** `P-9JF76SN7`
**Why:** Enables rapid iteration when debugging hook probes — no need to close/reopen the editor between test turns.

<!-- decision:P-JVDNQPQD -->

## Cursor hooks.json Mid-Session Edits Risk File Watcher Desync

**When:** 2026-07-09 · **Fact:** `P-JVDNQPQD`
**Why:** Known Cursor limitation affecting hook configuration changes during active sessions.

<!-- decision:P-HCSNKa3W -->

## D-306 Fix: UTF-8 BOM Breaks JSON.parse in Cursor

**When:** 2026-07-09 · **Fact:** `P-HCSNKa3W`
**Why:** Real bug in Cursor Windows capture of agent interactions; now resolved and thoroughly tested before release.

<!-- decision:P-STa54X7H -->

## v0.5.0 Release Workflow: Stress → Commit → Push → PR → Merge → Repack → Gate

**When:** 2026-07-09 · **Fact:** `P-STa54X7H`
**Why:** Established workflow; mcp-serve PID kill is a non-obvious but required step to prevent repack failure or hang.

<!-- decision:P-KH4SRW5X -->

## Cursor Gate Test Path & Procedure (v0.5.0 Release)

**When:** 2026-07-09 · **Fact:** `P-KH4SRW5X`
**Why:** This is the final gate before v0.5.0 release. Windows Cursor capture bugs (D-305 path, D-306 BOM) are fixed. Claude and Kiro gates already passed.

<!-- decision:P-2VC4JB3Y -->

## Memory Commits Screened Before Release

**When:** 2026-07-10 · **Fact:** `P-2VC4JB3Y`
**Why:** Prevents orphaned uncommitted changes after release; keeps memory system trustworthy and auditable

<!-- decision:P-NRVP5a4V -->

## Release Workflow for @lh8ppl/claude-memory-kit

**When:** 2026-07-10 · **Fact:** `P-NRVP5a4V`
**Why:** Ensures releases are tested, documented, memory-synchronized, and auditable

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-NNM9F73K -->

## User prefers to file tasks/issues IMMEDIATELY when identified, because deferral

**When:** 2026-07-08 · **Fact:** `P-NNM9F73K`

<!-- decision:P-QN2BEXTP -->

## Research-Synthesis Workflow for Product Improvement

**When:** 2026-07-10 · **Fact:** `P-QN2BEXTP`
**Why:** Grounds research-informed work in product reality; ensures findings translate to concrete improvements rather than abstract exploration; maintains traceability to existing design/task structure

<!-- decision:P-MaSV2K22 -->

## Core System Concepts

**When:** 2026-07-10 · **Fact:** `P-MaSV2K22`
**Why:** These concepts define the memory system's core architecture and governance trade-offs.

<!-- decision:P-H4aHWNDE -->

## Documentation Artifacts and Structure

**When:** 2026-07-10 · **Fact:** `P-H4aHWNDE`
**Why:** Comprehensive documentation supports governance, traceability, and evidence-before-belief validation.

<!-- decision:P-7PGDAXCJ -->

## Task Filing Convention With Metadata

**When:** 2026-07-10 · **Fact:** `P-7PGDAXCJ`
**Why:** Task metadata enables dependency tracking, prioritization, and batch sequencing across releases.

<!-- decision:P-7WG4WJ4W -->

## CI Watch Rule: Specify ci.yml by Name

**When:** 2026-07-10 · **Fact:** `P-7WG4WJ4W`
**Why:** Incident D-310: watching latched onto a green CodeQL run while ci.yml was red, so main appeared green while actually broken.

<!-- decision:P-6SQ499S6 -->

## Name Guard Validator Skips Untracked Files

**When:** 2026-07-10 · **Fact:** `P-6SQ499S6`
**Why:** Incident D-310: content in an untracked wiki/raw/ path leaked through CI without being caught by the name guard.

<!-- decision:P-NVM3E45a -->

## Release Version Queue (D-309)

**When:** 2026-07-10 · **Fact:** `P-NVM3E45a`
**Why:** Pushed and decided (D-309). This is the live release plan for ticket triage and phase sequencing.

<!-- decision:P-R34LNWQ7 -->

## cmk-daily-distill Scheduled Task Window Popup at 23:00

**When:** 2026-07-10 · **Fact:** `P-R34LNWQ7`
**Why:** Next session will need to recognize this 23:00 popup as expected behavior, not a bug

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-EKWH25S2 -->

## Main CI green after D-306 merge (exit code 0); all code work verified and staged

**When:** 2026-07-09 · **Fact:** `P-EKWH25S2`

<!-- decision:P-FYaVAJQX -->

## install-agent.mjs Non-Global Regex Allows Duplicated Managed Blocks

**When:** 2026-07-10 · **Fact:** `P-FYaVAJQX`
**Why:** Future work on install/agents, managed block refresh, or block deduplication needs this context

<!-- decision:P-GLW2DFTE -->

## Linux Crontab Line Builder Has Newline-Injection Gap

**When:** 2026-07-10 · **Fact:** `P-GLW2DFTE`
**Why:** Crontab integration security and reliability depend on input sanitization

<!-- decision:P-7QA5WVBP -->

## SessionEnd Timeout Composition

**When:** 2026-07-10 · **Fact:** `P-7QA5WVBP`
**Why:** Core design parameter for concurrency/timeout safety; review-validated architecture

<!-- decision:P-39aTUWZA -->

## Expectation Resolution Gating

**When:** 2026-07-10 · **Fact:** `P-39aTUWZA`
**Why:** Real incident: login-fix correction resolved an unrelated 2-day-old deploy expectation, incorrectly locking its prediction to MISS.

<!-- decision:P-43QCZHHH -->

## Screened Writes Pattern

**When:** 2026-07-10 · **Fact:** `P-43QCZHHH`
**Why:** Real incidents: `cmk remember --title "ghp_<token>"` wrote secrets to committed frontmatter (write-fact gap); import-anthropic-memory laundered data with zero screening.

<!-- decision:P-QAV9WT2M -->

## Verified Clean Security Areas

**When:** 2026-07-10 · **Fact:** `P-QAV9WT2M`
**Why:** 6 Sonnet agents ran holistic passes (5 functional clusters + security); load-bearing findings manually re-verified.

<!-- decision:P-DHaH4YAE -->

## Full-Repo Audit Complete: 131 Tasks, 0 Fabricated Ships

**When:** 2026-07-10 · **Fact:** `P-DHaH4YAE`
**Why:** Confirms implementation fidelity and doc accuracy before major releases; surfaces process gaps and stale markers

<!-- decision:P-USDKTEB2 -->

## Release Roadmap v0.5.1–v0.5.4

**When:** 2026-07-10 · **Fact:** `P-USDKTEB2`
**Why:** Committed sequence guides release planning and task prioritization through next four releases

<!-- decision:P-K9C9UPVQ -->

## Three Security Bugs Fixed with Tests

**When:** 2026-07-10 · **Fact:** `P-K9C9UPVQ`
**Why:** Real vulnerabilities in public repo; audit found both bugs and process gaps; root cause (security-through-line) mirrors Task 216 priority

<!-- decision:P-DVF5GQLT -->

## Task Tracking: Versions + Trigger-Gated System

**When:** 2026-07-10 · **Fact:** `P-DVF5GQLT`
**Why:** Defines how work is organized and released; future sessions must understand the hybrid approach and why conditional work is trigger-gated rather than forced into versions.

<!-- decision:P-2A7SCPHW -->

## Task 205 Complete: MCP Server Install DLL Lock Fix

**When:** 2026-07-11 · **Fact:** `P-2A7SCPHW`
**Why:** Live probes caught payload issue unit tests missed; skill review caught consent-flow gap; demonstrates effectiveness of multi-layer validation before merge

<!-- decision:P-aMG64J6K -->

## Pre-roll now.md excluded from commit offers to prevent unscreened-name shipping

**When:** 2026-07-11 · **Fact:** `P-aMG64J6K`
**Why:** Guarantees personal names are privacy-screened before any commit ships; prevents accidental unscreened context leakage

<!-- decision:P-WLFMPNRB -->

## v0.5.1 autopilot resume point after Task 206 checkpoint

**When:** 2026-07-11 · **Fact:** `P-WLFMPNRB`
**Why:** Context compaction hit mid-lane; the next session must continue the v0.5.1 autopilot without re-deriving the task order, per-task discipline, or in-flight state.

<!-- decision:P-QY2AJSXD -->

## Commit-message guard rejects literal "rm -rf context/memory" strings

**When:** 2026-07-11 · **Fact:** `P-QY2AJSXD`
**Why:** Fail-safe design prioritizes preventing catastrophic harm (a destructive command succeeding) over convenience. False positives are acceptable.

<!-- decision:P-7A6KVXV4 -->

## cmk-daily-distill Scheduled Task Console Popup Issue

**When:** 2026-07-11 · **Fact:** `P-7A6KVXV4`
**Why:** Console popup disrupts nightly automation; next session needs to know the issue scope and fix approach for Task 215 execution.

<!-- decision:P-QZT9Z5DG -->

## Fable 5 classifier flags defensive security work

**When:** 2026-07-11 · **Fact:** `P-QZT9Z5DG`
**Why:** Predicting and handling model swaps in future security-heavy tasks. The swaps are not errors—they're intentional safeguards, but knowing the trigger helps avoid confusion.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-EBY9ZHYV -->

## Release gate status: Claude ✓, Kiro ✓; Cursor is the final/pending gate before v

**When:** 2026-07-09 · **Fact:** `P-EBY9ZHYV`

<!-- decision:P-PYRa4U7U -->

## v0.5.0 SHIPPED 2026-07-10 (npm @lh8ppl/claude-memory-kit@0.5.0 live + GitHub Rel

**When:** 2026-07-10 · **Fact:** `P-PYRa4U7U`

<!-- decision:P-MPH9NRWJ -->

## Project versioning should use concrete numbers, not vague placeholders like "v0.

**When:** 2026-07-10 · **Fact:** `P-MPH9NRWJ`

<!-- decision:P-2PHUTYN3 -->

## Full suite on code-review fix batch completed successfully (exit code 0)

**When:** 2026-07-10 · **Fact:** `P-2PHUTYN3`

<!-- decision:P-E3JKT3HN -->

## Stress-Gate Release Workflow

**When:** 2026-07-11 · **Fact:** `P-E3JKT3HN`
**Why:** Validates concurrency safety and robustness before changes are merged; part of the project's release quality standard

<!-- decision:P-WMPQSE4a -->

## Post-Merge Workflow Sequence

**When:** 2026-07-11 · **Fact:** `P-WMPQSE4a`
**Why:** Standard post-test deployment workflow; watching by name indicates a specific CI check to monitor before proceeding.

<!-- decision:P-GaXCFSTA -->

## Task 220 Duplicate Block Handling Design

**When:** 2026-07-11 · **Fact:** `P-GaXCFSTA`
**Why:** D-169 self-healing posture; HC-9 needs duplicate visibility; strict sequencing prevents race conditions

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ZMUTVS4A -->

## OK with compact context summaries during mid-session resumptions on long task ru

**When:** 2026-07-11 · **Fact:** `P-ZMUTVS4A`

<!-- decision:P-CSPF4GAD -->

## CLAUDE.md CI watch rule updated to specify ci.yml by name, not relying on CodeQL

**When:** 2026-07-11 · **Fact:** `P-CSPF4GAD`

<!-- decision:P-ZCCT552Q -->

## `write-fact` title screening gap; `import-anthropic-memory` zero screening; `jud

**When:** 2026-07-11 · **Fact:** `P-ZCCT552Q`

<!-- decision:P-TZ35RJDJ -->

## Multi-Layer Security Screening on Writes

**When:** 2026-07-12 · **Fact:** `P-TZ35RJDJ`
**Why:** High-stakes data mutations need layered defense against poison-pill attacks and secret leakage.

<!-- decision:P-CHPEXFAL -->

## Testing and Review Discipline

**When:** 2026-07-12 · **Fact:** `P-CHPEXFAL`
**Why:** Ensures both quality and institutional knowledge. Honest recording of failed assumptions prevents repeating mistakes and builds trust in decision records.

<!-- decision:P-KBBQKUP2 -->

## Cut-Gate Workflow Order: Cut Locally → Test → Tag

**When:** 2026-07-12 · **Fact:** `P-KBBQKUP2`
**Why:** Ensures tested artifact has correct version; prevents testing stale code or artifacts reporting wrong versions.

<!-- decision:P-PTVLaUUB -->

## Hardening Patch Release May Skip Full Cut-Gate

**When:** 2026-07-12 · **Fact:** `P-PTVLaUUB`
**Why:** Streamlines release process for low-risk patches while retaining the option to run gates for higher-risk releases.

<!-- decision:P-2WPV3AHS -->

## v0.5.1 Cut-Gate Includes Six New Probes (§4g)

**When:** 2026-07-12 · **Fact:** `P-2WPV3AHS`
**Why:** Documents v0.5.1 had targeted quality gates; useful context for understanding this release's testing approach.

<!-- decision:P-L4DK6DQW -->

## User-Tier Backup Completed for Cut-Gate §1 Prep

**When:** 2026-07-12 · **Fact:** `P-L4DK6DQW`
**Why:** Gate workflow phase §0b (artifact validation) is now complete. Backup is required because §1 (Session 1) intentionally starts from zero to test capture-from-zero behavior honestly — persona tier must not interfere with that test.

<!-- decision:P-M4XEX543 -->

## MCP Preflight — Project Install vs Global Upgrade

**When:** 2026-07-12 · **Fact:** `P-M4XEX543`
**Why:** The prompt is generic and warns about global upgrades, but during routine project scaffolding, the hazard does not exist. Answering N avoids false alarms and keeps Claude Code sessions running.

<!-- decision:P-A2UDWRDF -->

## Primary-Source Verification Protocol

**When:** 2026-07-12 · **Fact:** `P-A2UDWRDF`
**Why:** Intuition without source verification is unreliable; primary sources are ground truth. Prevents confident-but-wrong assessments.

<!-- decision:P-57TJa5ZM -->

## Task 205 Preflight UX Design Wart

**When:** 2026-07-12 · **Fact:** `P-57TJa5ZM`
**Why:** Explains the preflight's existence, why it seems noisy in practice, and clarifies the narrow real use case. Prevents future confusion if users complain the prompt is unnecessary—it's intentional but overly broad.

<!-- decision:P-AC54GXEH -->

## Claude-Memory-Kit Dogfooding Setup and Conflict Surface

**When:** 2026-07-12 · **Fact:** `P-AC54GXEH`

<!-- decision:P-NFMBCMTA -->

## Task 205 Preflight Fires on Wrong Trigger (Design Flaw)

**When:** 2026-07-12 · **Fact:** `P-NFMBCMTA`
**Why:** Found live during cut-gate: user tried to install to a temp folder while the kit was dogfooding itself. Preflight correctly warned that servers + global state = hazard, but wrongly implied *this install* caused it (it doesn't—only global upgrades do).

<!-- decision:P-3CDHRHBM -->

## Documentation Taxonomy and Update Responsibility

**When:** 2026-07-12 · **Fact:** `P-3CDHRHBM`
**Why:** Guides scope for doc updates; prevents stale/orphaned docs and keeps releases coherent

<!-- decision:P-FA4TG5JS -->

## v0.5.1 Release: PR #282 Must Merge Before Tag

**When:** 2026-07-12 · **Fact:** `P-FA4TG5JS`
**Why:** Ensures v0.5.1 release artifact includes the Task 222 fix (without merge, tag would ship older build)

<!-- decision:P-UPA7AJUK -->

## Memory System Deduplication Design

**When:** 2026-07-12 · **Fact:** `P-UPA7AJUK`
**Why:** Allows rapid, flexible capture without over-thinking what's worth saving; the system tolerates duplication as a natural side effect and resolves it later automatically.

<!-- decision:P-F6Z4YEWR -->

## Never-Hand-Edit-Memory Rule

**When:** 2026-07-12 · **Fact:** `P-F6Z4YEWR`
**Why:** Preserves the audit trail of what was auto-captured and ensures memory integrity is maintained systematically. Hand-editing would introduce inconsistency and bypass the dedup/consolidation logic.

<!-- decision:P-QH3aMMaD -->

## Dogfood Repopulates User Tier During Active Sessions

**When:** 2026-07-12 · **Fact:** `P-QH3aMMaD`
**Why:** The gate assumes persona capture from zero. Active dogfood in the working directory breaks that assumption, potentially masking persona-pipeline failures.

<!-- decision:P-4FNXP9FS -->

## Gate Preparation: Tier Backups and Dogfood Isolation

**When:** 2026-07-12 · **Fact:** `P-4FNXP9FS`
**Why:** Gate tests persona auto-fill from zero (B3/B4/B8 checks). Separate project + clean tier ensures honest test. Dogfood auto-extract is expected this session but requires isolation knowledge to avoid interference.

<!-- decision:P-2FLXAQSN -->

## cmk install output is minimal, shows only essential information

**When:** 2026-07-12 · **Fact:** `P-2FLXAQSN`
**Why:** Users need to know installation succeeded and how to activate it. Pre-emptive advisory noise doesn't help; real recovery messages surface at error time when needed.

<!-- decision:P-FTHBGA6H -->

## Release Workflow: Validation, CHANGELOG Consistency, Tag, and Publish

**When:** 2026-07-12 · **Fact:** `P-FTHBGA6H`
**Why:** Ensures release artifacts reflect the actual code and behavior; prevents tagging stale commits; avoids inconsistent documentation

<!-- decision:P-6XJBP7RE -->

## E3 Failure-Turn Testing Sequence

**When:** 2026-07-12 · **Fact:** `P-6XJBP7RE`
**Why:** E3 validates persona injection and failure-signal detection; the two-turn sequence captures both the failure outcome and the detached judge's log

<!-- decision:P-RJH3aAP7 -->

## Tight Attribution in Learn-Loop Dampening

**When:** 2026-07-12 · **Fact:** `P-RJH3aAP7`
**Why:** A pytest error unrelated to memory recall shouldn't dampen a persona fact.

<!-- decision:P-DKP76NFC -->

## Release Gate Verification Structure — 6 Sections

**When:** 2026-07-12 · **Fact:** `P-DKP76NFC`
**Why:** Systematic verification framework; v0.5.1 scope justified as hardening patch (narrow risk surface)

<!-- decision:P-M9P6R5BU -->

## v0.5.1 Release — Ready to Tag and Publish

**When:** 2026-07-12 · **Fact:** `P-M9P6R5BU`
**Why:** Pull synchronizes with upstream; omitting it would tag a stale commit missing Task 222 and CHANGELOG fixes

<!-- decision:P-UVEYS5ZL -->

## CHANGELOG [Unreleased] Auto-Reset During Release

**When:** 2026-07-12 · **Fact:** `P-UVEYS5ZL`
**Why:** Eliminates manual post-release housekeeping; ensures CHANGELOG is always ready for the next cycle.

<!-- decision:P-NG5KC7R5 -->

## Post-Release Documentation Reconciliation Workflow

**When:** 2026-07-12 · **Fact:** `P-NG5KC7R5`
**Why:** Drift between published release and documentation claims confuses users and corrupts versioning narrative. Post-release reconciliation ensures docs remain authoritative.

<!-- decision:P-FFYT6GaV -->

## Task-Boundary Memory Flush Rule

**When:** 2026-07-12 · **Fact:** `P-FFYT6GaV`
**Why:** Without periodic flushing, memory drifts from git, breaking continuity for future sessions. This project self-dogfoods its own memory system.

<!-- decision:P-FUW47LTE -->

## cmk forget as Safe Fact Removal Method

**When:** 2026-07-12 · **Fact:** `P-FUW47LTE`
**Why:** Safety and reversibility prevent loss of facts removed in error; critical for dogfood extraction cleanup

<!-- decision:P-JAKHD5X6 -->

## Dogfood Memory Contamination in v0.5.1 Release

**When:** 2026-07-12 · **Fact:** `P-JAKHD5X6`
**Why:** Recurring dogfood contamination risk; cleanup process and cmk forget safety should be documented for future sessions

<!-- decision:P-HMUEHPRH -->

## SonarCloud Misconfiguration — Scans Memory Fact Prose as Code

**When:** 2026-07-12 · **Fact:** `P-HMUEHPRH`
**Why:** Recurring false-positives in advisory checks dilute signal over time; fixing them maintains integrity.

<!-- decision:P-4VZZY6W2 -->

## SonarCloud Advisory Role in CI Gating

**When:** 2026-07-12 · **Fact:** `P-4VZZY6W2`
**Why:** v0.5.1 published successfully despite SonarCloud crash. Prevents over-investment in fixing advisory-only tooling and clarifies severity hierarchy.

<!-- decision:P-2YXUGHZJ -->

## SonarCloud Scanner Crash — Root Cause and Resolution Path
_(retracted 2026-07-18)_

**When:** 2026-07-12 · **Fact:** `P-2YXUGHZJ`
**Why:** Prevents fruitless repo-level troubleshooting. Key insight: SonarCloud crashes rooted in server settings are not fixable from the repo.

<!-- decision:P-PAL9VTVG -->

## Diagnostic Technique: Determine SonarCloud Issue Origin (Repo vs Server)

**When:** 2026-07-12 · **Fact:** `P-PAL9VTVG`
**Why:** This proves the boundary of what can be fixed repo-side, preventing wasted iteration on repo changes that cannot work. Absence of the artifact locally is definitive proof of server-side origin.

<!-- decision:P-CJFV76WH -->

## SonarCloud Automatic Analysis Must Be OFF

**When:** 2026-07-12 · **Fact:** `P-CJFV76WH`
**Why:** The project's CI workflow applies its own sonar configuration and expects Automatic Analysis to be OFF. If enabled, SonarCloud ignores the CI-provided properties and uses server-stored defaults.

<!-- decision:P-EX7TLaAG -->

## SonarCloud Server-Side Analysis Scope Cannot Be Overridden Repo-Side

**When:** 2026-07-12 · **Fact:** `P-EX7TLaAG`
**Why:** The analyzer loads both repo-config and server-config with server-config winning. Once a path is stored in Analysis Scope, it persists until manually cleared from the web UI.

<!-- decision:P-VV7LEV7M -->

## v0.5.2 Release Scope and Workflow

**When:** 2026-07-12 · **Fact:** `P-VV7LEV7M`
**Why:** One-theme batching honors differentiator rule; scope committed to source-of-truth docs; workflow prevents context-switch churn

<!-- decision:P-LQ9ZQHPZ -->

## SonarCloud Stale Source Path Requires Manual Web-UI Clear
_(retracted 2026-07-18)_

**When:** 2026-07-12 · **Fact:** `P-LQ9ZQHPZ`
**Why:** The path is no longer valid (codebase refactored) and causes red flags in the build dashboard; clearing it via web UI will resolve the flag.

<!-- decision:P-VLR6M5RU -->

## v0.5.1 Released to npm and GitHub

**When:** 2026-07-12 · **Fact:** `P-VLR6M5RU`
**Why:** v0.5.1 is in production; next session should know this milestone is shipped before starting v0.5.2.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-aCBYAKXU -->

## 5 security/reliability tasks filed (216–220): unscreened-writes helper, delete g

**When:** 2026-07-11 · **Fact:** `P-aCBYAKXU`

<!-- decision:P-ABX3UPRC -->

## Task 215's stress gate passed (exit code 0); ship pipeline is now running
_(retracted 2026-07-13)_

**When:** 2026-07-11 · **Fact:** `P-ABX3UPRC`

<!-- decision:P-WaSJZ6A2 -->

## Task 216 is next — shared `screenBeforeCommittedWrite` helper for committed-writ
_(retracted 2026-07-13)_

**When:** 2026-07-11 · **Fact:** `P-WaSJZ6A2`

<!-- decision:P-CNWXDH3N -->

## Release Plan: v0.6.0 (Day-One Memory) & v0.7.0 (Team Layer)

**When:** 2026-07-12 · **Fact:** `P-CNWXDH3N`
**Why:** User explicitly requested actual version lanes (not placeholders) for all YouTube video insights. This is the binding release roadmap.

<!-- decision:P-XVNNRDRV -->

## Name-Guard Flags Templated Patterns in Frontmatter Metadata

**When:** 2026-07-12 · **Fact:** `P-XVNNRDRV`
**Why:** Built-in guard against anti-patterns in metadata documentation; understanding this prevents merge-blocking surprises during commits.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RLE5aWN9 -->

## Demands primary-source verification (code, specs, actual behavior) before accept

**When:** 2026-07-12 · **Fact:** `P-RLE5aWN9`

<!-- decision:P-T6PYE5VP -->

## Known Environmental Artifact: Laptop Sleep During Tests

**When:** 2026-07-13 · **Fact:** `P-T6PYE5VP`
**Why:** Distinguishing environmental failures from real bugs is critical for trusting test results and avoiding unnecessary debugging.

<!-- decision:P-BQ3WWXQG -->

## Stress Gate Testing Strategy

**When:** 2026-07-13 · **Fact:** `P-BQ3WWXQG`
**Why:** Ensures high confidence in merge; environmental artifacts like laptop sleep and clock drift can produce flaky test failures that are not real bugs.

<!-- decision:P-9CY5XHM3 -->

## CMK Hook Capture Fails During Stress Gate

**When:** 2026-07-13 · **Fact:** `P-9CY5XHM3`
**Why:** A future session might encounter this hook failure and wonder if it's critical; knowing it doesn't block the gate prevents unnecessary investigation.

<!-- decision:P-CTERUG3C -->

## Kiro CLI MCP Trust Model and Kit's Workaround

**When:** 2026-07-13 · **Fact:** `P-CTERUG3C`
**Why:** Clarifies MCP prompts are Kiro behavior, not kit bug. Determines whether to pursue kit-side fixes (none available) or document limitation + user workaround.

<!-- decision:P-SCS957AT -->

## Test Seam Pattern for Timing Configs

**When:** 2026-07-13 · **Fact:** `P-SCS957AT`
**Why:** A flaky test masks real bugs. When stress-tested, Task 218's test showed 5/5 failures under full concurrency but passed in isolation. Lowering expectations defeats early detection; fix the root robustness issue instead.

<!-- decision:P-49UHTP6a -->

## Test Suite Pattern: buildMcpServer for MCP Refresh (not repeated runMcpServer)

**When:** 2026-07-13 · **Fact:** `P-49UHTP6a`
**Why:** The listener leak caused STACK_TRACE_ERRORs during fixture teardown in full-suite runs but not isolated tests; fix discovered and applied

<!-- decision:P-RA2RDYXW -->

## Research Notes Indexed via Research INDEX, Not DOCUMENTATION-MAP

**When:** 2026-07-13 · **Fact:** `P-RA2RDYXW`
**Why:** Understanding the correct documentation structure prevents confusion when adding or locating research materials; the distinction matters for validator compliance

<!-- decision:P-WG9UMC6N -->

## v0.5.2 code-complete; PR #286 pending CI merge

**When:** 2026-07-13 · **Fact:** `P-WG9UMC6N`
**Why:** Release readiness state. Future session needs to know whether #286 merged and what manual work remains for v0.5.2.

<!-- decision:P-AY4Sa7DT -->

## Retro/Build-Log Housekeeping Convention

**When:** 2026-07-13 · **Fact:** `P-AY4Sa7DT`
**Why:** Separates artifact commits from code review; ensures release notes land on the merge commit, not lost in the PR history.

<!-- decision:P-B62EQCT4 -->

## Release Process Discipline — Standard Ceremony Applied

**When:** 2026-07-13 · **Fact:** `P-B62EQCT4`
**Why:** Ensures consistency and catches unintended drift; doc-review walk particularly valuable for surfacing design boundary gaps.

<!-- decision:P-6EVUE55F -->

## Task 208 — Interactive Live-Gates Pending Token Refresh
_(retracted 2026-07-27)_

**When:** 2026-07-13 · **Fact:** `P-6EVUE55F`
**Why:** Blocks final release sign-off but not code freeze.

<!-- decision:P-4C9SFXJA -->

## v0.5.2 Release — Code-Complete, Awaiting Final CI

**When:** 2026-07-13 · **Fact:** `P-4C9SFXJA`
**Why:** Tracks readiness for npm release cutover; final step is CI confirmation.

<!-- decision:P-LNL6C3MH -->

## Post-v0.5.2 Roadmap Decision: v0.5.3 or v0.6.0

**When:** 2026-07-13 · **Fact:** `P-LNL6C3MH`
**Why:** Two prioritized initiatives; roadmap choice impacts scope and focus for next release cycle.

<!-- decision:P-6WEaBE9M -->

## v0.5.3 = learn-loop Phase 2 (the user chose queue order over v0.6.0 on 2026-07-1

**When:** 2026-07-13 · **Fact:** `P-6WEaBE9M`
**Why:** The next-version plan must survive the imminent auto-compact so the next session resumes v0.5.3 correctly without re-deriving it.

<!-- decision:P-E9QZCFSL -->

## v0.5.2 Release Complete

**When:** 2026-07-13 · **Fact:** `P-E9QZCFSL`
**Why:** Marks the baseline state for v0.5.3 work; establishes that main is clean and green

<!-- decision:P-RaVEB3SL -->

## v0.5.3 Roadmap — Learn-loop Phase 2, Confidence-Gated Search Blend First

**When:** 2026-07-13 · **Fact:** `P-RaVEB3SL`
**Why:** Plan committed to survive auto-compaction; exact resumption workflow eliminates re-derivation friction

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ESXEGLaX -->

## Kit is live (`C:\Projects\claude-memory-kit`) with active MCP servers and auto-e

**When:** 2026-07-12 · **Fact:** `P-ESXEGLaX`

<!-- decision:P-ALAUZFKJ -->

## Confirmed layered FastAPI + in-memory repositories as the backend architecture

**When:** 2026-07-12 · **Fact:** `P-ALAUZFKJ`

<!-- decision:P-TEV46Ca9 -->

## Prefers actual version lanes (v0.6.0, v0.7.0, etc.) over "future 0.5.x" placehol

**When:** 2026-07-12 · **Fact:** `P-TEV46Ca9`

<!-- decision:P-aD9MaJ4C -->

## System design tolerates near-duplicate memory captures and deduplicates in post-

**When:** 2026-07-12 · **Fact:** `P-aD9MaJ4C`

<!-- decision:P-JX6VEMJM -->

## Project enforces "never-hand-edit-memory" principle to preserve auto-capture int

**When:** 2026-07-12 · **Fact:** `P-JX6VEMJM`

<!-- decision:P-YYFNQFSP -->

## Task 218 is the last code task in v0.5.2; after stress + skill-review pass, goes

**When:** 2026-07-13 · **Fact:** `P-YYFNQFSP`

<!-- decision:P-Z7GUFTW2 -->

## No-Disclaimed-Flakes Rule

**When:** 2026-07-13 · **Fact:** `P-Z7GUFTW2`
**Why:** Prevents real bugs from hiding behind flakiness claims; maintains test suite integrity and confidence.

<!-- decision:P-UV955AFU -->

## Stress Gate Process for PR Merge

**When:** 2026-07-13 · **Fact:** `P-UV955AFU`
**Why:** Catches intermittent/flaky test failures before they enter main branch; prevents false-passing PRs from degrading branch reliability.

<!-- decision:P-MWTNJaDU -->

## Skill review found one Important issue: handleUnlink crash path under concurrent

**When:** 2026-07-13 · **Fact:** `P-MWTNJaDU`

<!-- decision:P-WUaFJWa7 -->

## Test was flaky under stress (5/5 failures full suite, isolation pass); robustifi

**When:** 2026-07-13 · **Fact:** `P-WUaFJWa7`

<!-- decision:P-X9P559YZ -->

## handleUnlink crash-guard fixed (forget test validates); re-stress verdict determ

**When:** 2026-07-13 · **Fact:** `P-X9P559YZ`

<!-- decision:P-JLPXJPZF -->

## v0.5.2 code-complete; three PRs (#284, #285, #286) merged to main

**When:** 2026-07-13 · **Fact:** `P-JLPXJPZF`

<!-- decision:P-CKKD4VRS -->

## Release command is `npm run release -- patch` → tag push → publish.yml (npm publ

**When:** 2026-07-13 · **Fact:** `P-CKKD4VRS`

<!-- decision:P-RVaUWFAL -->

## Minor-Boundary Backlog Sweep (D-248) Convention

**When:** 2026-07-14 · **Fact:** `P-RVaUWFAL`
**Why:** Deliberate governance to prevent lost work and accidental scope creep.

<!-- decision:P-GYVP2H7V -->

## v0.5.3 Release Complete — Ready for Publication

**When:** 2026-07-14 · **Fact:** `P-GYVP2H7V`
**Why:** Phase-2 completion milestone. Task 195 lane assignment is critical for v0.5.4 planning. D-248 sweep outcome is durable project state.

<!-- decision:P-DE43PUK2 -->

## Agent-neutral names persist across any rename

**When:** 2026-07-14 · **Fact:** `P-DE43PUK2`
**Why:** These are shared infrastructure for multiple agents (Claude, Cursor, Codex). Changing them breaks cross-agent portability.

<!-- decision:P-LBPZAUVF -->

## CMK search scope limitation with decision queries

**When:** 2026-07-14 · **Fact:** `P-LBPZAUVF`
**Why:** Future session might assume no name-decision history exists if relying only on search.

<!-- decision:P-ZRB94KK6 -->

## Config directory migration is critical blocker for rename

**When:** 2026-07-14 · **Fact:** `P-ZRB94KK6`
**Why:** Real users exist with committed memory. A blind text swap silently breaks their setup.

<!-- decision:P-MGJKS5MY -->

## Four-tier rename execution structure

**When:** 2026-07-14 · **Fact:** `P-MGJKS5MY`
**Why:** This tier structure determines the actual cost and feasibility of a rename. Each has different reversibility and risk.

<!-- decision:P-FF4H6LK7 -->

## Project governance — ADRs, frozen records, and two-phase rename flow

**When:** 2026-07-14 · **Fact:** `P-FF4H6LK7`
**Why:** Maintains immutable history and prevents retroactive revision.

<!-- decision:P-3644R2D4 -->

## Text-substitution carve-outs for rename

**When:** 2026-07-14 · **Fact:** `P-3644R2D4`
**Why:** Blind find-replace orphans user data, erases historical context, and breaks portability.

<!-- decision:P-K9XFPMSB -->

## js-yaml Critical Path in Memory System

**When:** 2026-07-14 · **Fact:** `P-K9XFPMSB`
**Why:** Frontmatter parsing is core to memory I/O; regressions break context persistence

<!-- decision:P-QFMMQCCa -->

## Vitest + Coverage Plugin Peer Versioning

**When:** 2026-07-14 · **Fact:** `P-QFMMQCCa`
**Why:** Misaligned versions break coverage reporting or test execution

<!-- decision:P-U7NPPSEV -->

## YAML parsing uses CORE_SCHEMA for stable, explicit coercion behavior

**When:** 2026-07-14 · **Fact:** `P-U7NPPSEV`
**Why:** Explicit, non-coercive yaml parsing prevents surprising type conversions that could break frontmatter handling or downstream logic. Conservative schema choice + comprehensive test coverage minimizes risk when updating js-yaml.

<!-- decision:P-64ZT2ZJP -->

## Cut-gate split into deterministic (CLI/install) and live (IDE) phases

**When:** 2026-07-15 · **Fact:** `P-64ZT2ZJP`
**Why:** Distinguish which gates can run in automation vs which need real IDE session; guides scope for release types

<!-- decision:P-Y46UV9AA -->

## Persona directory moved to ~/.core-memory-kit

**When:** 2026-07-15 · **Fact:** `P-Y46UV9AA`
**Why:** v0.5.4 install relocates persona files to align with new package identity

<!-- decision:P-BH25FCLN -->

## youtube-to-slide foreign-format fact file — pre-existing, not rename-related

**When:** 2026-07-15 · **Fact:** `P-BH25FCLN`
**Why:** Clarify that v0.5.4 rename is clean; this is pre-existing data quality, not caused by rebrand

<!-- decision:P-B559EHDZ -->

## Multi-Tier Backup Pattern for Release Cuts

**When:** 2026-07-15 · **Fact:** `P-B559EHDZ`
**Why:** Structural changes (path renames, tier migrations) risk persona corruption. Three tiers enable full recovery if gate validation fails.

<!-- decision:P-FJa6A2HL -->

## Post-Rename Guide Adjustment: §0 Backup Now Optional

**When:** 2026-07-15 · **Fact:** `P-FJa6A2HL`
**Why:** Path migration makes the original §0 step redundant; tier setup is already complete.

<!-- decision:P-A7R47EB6 -->

## Test Gate Folders Use Numbered Sequence

**When:** 2026-07-15 · **Fact:** `P-A7R47EB6`
**Why:** Numbered sequence avoids naming collisions and makes iteration history explicit.

<!-- decision:P-T3EUWXVJ -->

## Version 0.5.4 Tarball Ready for Gate Testing

**When:** 2026-07-15 · **Fact:** `P-T3EUWXVJ`
**Why:** Gate testing requires reproducible installation from the built tarball; avoids npm dependency before validation.

<!-- decision:P-aZD9T5XX -->

## Cut-Gate Guides Updated for v0.5.4 Rename

**When:** 2026-07-15 · **Fact:** `P-aZD9T5XX`
**Why:** Guides are user-facing verification steps and must reflect new naming for v0.5.4; uninstall-old-first is cut-specific

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-Q37ZPQJP -->

## v0.5.2 shipped — npm @lh8ppl/claude-memory-kit@0.5.2 (provenance), GitHub Releas

**When:** 2026-07-13 · **Fact:** `P-Q37ZPQJP`

<!-- decision:P-aNSaZMFH -->

## v0.5.3 full build plan saved as durable memory P-6WEaBE9M (commit dfebca5) for c

**When:** 2026-07-13 · **Fact:** `P-aNSaZMFH`

<!-- decision:P-7WV4BUX4 -->

## For Task 195, complete external rename steps (npm publish/deprecate, repo rename

**When:** 2026-07-14 · **Fact:** `P-7WV4BUX4`

<!-- decision:P-KYSNDHME -->

## run deterministic cut-gate (§0–§1) before git tag v0.5.4, not after

**When:** 2026-07-15 · **Fact:** `P-KYSNDHME`

<!-- decision:P-XVFCT3UG -->

## renamed .claude-memory-kit to .claude-memory-kit.backup for release cut

**When:** 2026-07-15 · **Fact:** `P-XVFCT3UG`

<!-- decision:P-LNMa4G5T -->

## will run section "1. Scaffold + read every file" next for cut-gate

**When:** 2026-07-15 · **Fact:** `P-LNMa4G5T`

<!-- decision:P-URJaV36K -->

## always deploy .venv and install all python packages in it

**When:** 2026-07-15 · **Fact:** `P-URJaV36K`

<!-- decision:P-CaY3MT5U -->

## FastAPI WebSocket Chat App Architecture

**When:** 2026-07-15 · **Fact:** `P-CaY3MT5U`
**Why:** Complete, minimal chat scaffold for future reference or extension (usernames, persistence, etc.)

<!-- decision:P-KKKNST9L -->

## plain HTML/JS, no framework for chat UI

**When:** 2026-07-15 · **Fact:** `P-KKKNST9L`

<!-- decision:P-X2EDL7XS -->

## Python Projects Always Use .venv

**When:** 2026-07-15 · **Fact:** `P-X2EDL7XS`
**Why:** Isolates project dependencies, prevents cross-project conflicts

<!-- decision:P-2CQGFD5P -->

## Backend scaffolding preferences are stored cross-project and automatically recal

**When:** 2026-07-15 · **Fact:** `P-2CQGFD5P`

<!-- decision:P-42T3NCLQ -->

## Python backend convention—layered architecture with `api/services/repositories/s

**When:** 2026-07-15 · **Fact:** `P-42T3NCLQ`

<!-- decision:P-SZVF4ZHC -->

## Sigstore Provenance Requires GitHub Repo-Name Match for npm Publish

**When:** 2026-07-15 · **Fact:** `P-SZVF4ZHC`
**Why:** Provenance signing validates the publish source; without repo-name identity match, sigstore cannot confirm the package originates from the correct repository.

<!-- decision:P-HaZGS5M2 -->

## Executed `git remote set-url origin https://github.com/LH8PPL/core-memory-kit.gi

**When:** 2026-07-15 · **Fact:** `P-HaZGS5M2`

<!-- decision:P-JJP9JT5F -->

## Sigstore Provenance Validation Requires Repo-Package Name Alignment

**When:** 2026-07-15 · **Fact:** `P-JJP9JT5F`
**Why:** This prevented v0.5.4 from publishing until the repo was actually renamed; retrying without fixing the root cause would fail indefinitely.

<!-- decision:P-KVCQKBYC -->

## Successfully re-ran GitHub Actions run 29412885758 with `gh run rerun` to retry

**When:** 2026-07-15 · **Fact:** `P-KVCQKBYC`

<!-- decision:P-AE6CWB57 -->

## v0.5.4 Released Under Renamed Repo Identity

**When:** 2026-07-15 · **Fact:** `P-AE6CWB57`
**Why:** Rename aligns package identity across all surfaces; release is functionally complete pending housekeeping.

<!-- decision:P-7BSXRX4F -->

## npm deprecate Wildcard Syntax Fails with E404; Use Version Ranges Instead

**When:** 2026-07-15 · **Fact:** `P-7BSXRX4F`
**Why:** The wildcard approach failed with "Not Found" error even though the package and versions exist in the registry. The version-range syntax uses a normal ranged PUT that avoids this issue.

<!-- decision:P-6BHD7RaB -->

## npm Deprecate Auth Failures Reported as E404

**When:** 2026-07-15 · **Fact:** `P-6BHD7RaB`
**Why:** Occurred during package rename; knowing the real cause (auth, not existence) saves debugging cycles.

<!-- decision:P-V56VAX43 -->

## npm 11.x `deprecate` command with version ranges fails with spurious 404

**When:** 2026-07-15 · **Fact:** `P-V56VAX43`
**Why:** Avoids wasting time diagnosing false auth/permission problems; web UI is the reliable fallback

<!-- decision:P-RFPEPQKG -->

## npm Deprecate E422 Bug with Version Ranges

**When:** 2026-07-15 · **Fact:** `P-RFPEPQKG`
**Why:** npm CLI constructs a malformed packument PUT when applying range-based deprecation, which the registry rejects with 422. This is a client-side npm 11.x bug, not an account/auth/permission issue.

<!-- decision:P-2BKSH4A9 -->

## SonarCloud Project Key Rename Coordination

**When:** 2026-07-15 · **Fact:** `P-2BKSH4A9`
**Why:** SonarCloud and local configuration must remain in sync. Pushing config before server-side key is renamed creates a gap where scans fail with 404/not-found.

<!-- decision:P-G56B545Y -->

## SonarCloud Project Key Update Procedure

**When:** 2026-07-15 · **Fact:** `P-G56B545Y`
**Why:** SonarCloud's key-matching logic: if a scan comes in with a key that doesn't exist in SonarCloud yet, it creates a new project. The UI update must establish the key FIRST.

<!-- decision:P-4DWZ7L72 -->

## SonarCloud Taint Analysis — Context Collector Crashes Not Fixable Via Rule Disabling

**When:** 2026-07-15 · **Fact:** `P-4DWZ7L72`
**Why:** SonarSource documentation + community precedent confirm this is a known limitation; prevents time wasted on configuration-based workarounds for engine-level problems

<!-- decision:P-NGCNZMFJ -->

## Canonical Agent Support List

**When:** 2026-07-15 · **Fact:** `P-NGCNZMFJ`
**Why:** v0.5.2 added Codex support to README/CLI but the GitHub About wasn't updated until now (v0.5.4+). Keeping metadata consistent prevents future support-list drift.

<!-- decision:P-4aFAT7U2 -->

## GitHub Metadata Sync Pattern

**When:** 2026-07-15 · **Fact:** `P-4aFAT7U2`
**Why:** The Codex support shipped in v0.5.2 but GitHub About wasn't updated until this session, creating false inconsistency in public-facing metadata.

<!-- decision:P-GKBBMWDZ -->

## Core-Memory-Kit Installed with Claude Code Hooks

**When:** 2026-07-15 · **Fact:** `P-GKBBMWDZ`
**Why:** Kit functionality depends on Claude Code version; after tool updates, hooks may break if versions diverge.

<!-- decision:P-7CWH42PT -->

## Kit update workflow (npm global + per-project cmk install)

**When:** 2026-07-15 · **Fact:** `P-7CWH42PT`
**Why:** The two-step is non-obvious and required; the package renamed to @lh8ppl/core-memory-kit in v0.5.4 so the old npm command is wrong

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-aATCMBPD -->

## Correction—consult primary evidence (logs, error output) before diagnosing; user

**When:** 2026-07-15 · **Fact:** `P-aATCMBPD`

<!-- decision:P-GCTUBHQA -->

## The About section was missing Codex mention; it should list all four supported a

**When:** 2026-07-15 · **Fact:** `P-GCTUBHQA`

<!-- decision:P-WG4UCG5R -->

## Dual README Files Must Stay Synchronized

**When:** 2026-07-15 · **Fact:** `P-WG4UCG5R`
**Why:** Users access the project via different entry points (root repo vs npm package); content consistency is critical

<!-- decision:P-aWPUD54M -->

## Markdownlint + GitHub Alert Callouts Workaround

**When:** 2026-07-15 · **Fact:** `P-aWPUD54M`
**Why:** markdownlint has specific style rules for blockquotes in alert contexts; bare blank lines are flagged as violations

<!-- decision:P-MJBS5JGZ -->

## Commit Guardrail Blocks Ambiguous Include/Exclude Instructions

**When:** 2026-07-15 · **Fact:** `P-MJBS5JGZ`
**Why:** Prevents silent commits with unclear intent, especially for large-scope operations like `git add -A`.

<!-- decision:P-CG74LCQU -->

## og-image.svg is fully-vectorized with no source template

**When:** 2026-07-15 · **Fact:** `P-CG74LCQU`
**Why:** Future brand updates need to know that text changes cannot be done via SVG editing; regeneration from source is the proper workflow

<!-- decision:P-6SPFPW4Z -->

## Social Card Assets Location

**When:** 2026-07-15 · **Fact:** `P-6SPFPW4Z`
**Why:** Prevents deploying stale images elsewhere; clarifies the single source of truth for social previews.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-MWQLMT7N -->

## Questioned saving procedural doc to buried session-temp path; indicates preferen

**When:** 2026-07-15 · **Fact:** `P-MWQLMT7N`

<!-- decision:P-NNQSY9HB -->

## Kit automation (hooks/skills) should handle routine tasks; manual work frustrate

**When:** 2026-07-15 · **Fact:** `P-NNQSY9HB`

<!-- decision:P-MNR7R9UW -->

## SonarCloud A3S Security-Taint Server-Side Bug Root Cause
_(retracted 2026-07-18)_

**When:** 2026-07-15 · **Fact:** `P-MNR7R9UW`
**Why:** Clarifies that the crash is third-party, not our config/code. Explains why reverting diagnostics was the right approach rather than deep-diving into our setup.

<!-- decision:P-QYG695RG -->

## `cmk install` Skips Existing Files, Cannot Repair Stale Skills

**When:** 2026-07-15 · **Fact:** `P-QYG695RG`
**Why:** Explains why assistant reached for manual `cp` instead of `cmk install`, and identifies a real mechanism gap in the kit.

<!-- decision:P-SNMWHBJT -->

## D-343 — Kit Lacks Mechanism to Repair Stale Scaffolded Skills After Update

**When:** 2026-07-15 · **Fact:** `P-SNMWHBJT`
**Why:** Without this, updates to shipped skill templates don't propagate to existing scaffolded instances. Manual intervention is required, defeating the kit's purpose.

<!-- decision:P-3KP9MTUT -->

## Project Dogfooding Principle — Use Kit's Own Mechanisms

**When:** 2026-07-15 · **Fact:** `P-3KP9MTUT`
**Why:** The project's value is that users should be able to trust the kit to manage itself. When the kit maintainer hand-edits, it signals the kit is incomplete.

<!-- decision:P-F63N9DY3 -->

## cmk install skip-existing behavior and update implications

**When:** 2026-07-15 · **Fact:** `P-F63N9DY3`
**Why:** This is the core D-343 gap. Users reasonably expect install to freshen kit-provided files, but skip-existing (meant to protect user edits) leaves obsolete scaffolds behind, creating silent divergence on update.

<!-- decision:P-T9KCDQ3U -->

## Empirical test proves cmk install skips stale skills (D-343 confirmation)

**When:** 2026-07-15 · **Fact:** `P-T9KCDQ3U`
**Why:** Upgrades the finding from "I read install.mjs line 214" to empirical ground truth. Provides concrete evidence for D-343 and justifies the need for `cmk repair --skills` or doctor-tool enhancement.

<!-- decision:P-SG2XHQNT -->

## D-343 disposition: cmk install scaffold-refresh bug → Task 230, v0.5.5

**When:** 2026-07-15 · **Fact:** `P-SG2XHQNT`
**Why:** The finding was captured by auto-extract but the DISPOSITION (Task 230 + v0.5.5 lane) lived only in tasks.md/RELEASE-PLAN, not in the kit's memory — a recall query surfaced the drift between the committed docs and the memory

<!-- decision:P-P3Ta6QVX -->

## Memory Kit's Soft Spot: Agent-Choice Default Over Recall

**When:** 2026-07-15 · **Fact:** `P-P3Ta6QVX`
**Why:** Identifies the true weakness in the memory system—it's not technical, it's behavioral. The auto-capture layer works perfectly, but optional recall creates a soft boundary that operators will bypass when faster alternatives exist.

<!-- decision:P-LB6ERVW3 -->

## Two-Pass PR Discipline

**When:** 2026-07-15 · **Fact:** `P-LB6ERVW3`
**Why:** Maintains PR quality; reduces review feedback loops and back-and-forth.

<!-- decision:P-LPXY5A7U -->

## Autopilot Grant Practice

**When:** 2026-07-15 · **Fact:** `P-LPXY5A7U`
**Why:** Merging code is a high-blast-radius decision that requires explicit user authorization. Prevents accidental deployments.

<!-- decision:P-XSa5CT53 -->

## Two-Pass Fix Discipline

**When:** 2026-07-15 · **Fact:** `P-XSa5CT53`
**Why:** Keeps PR quality high and eliminates follow-up fixes after the PR is opened.

<!-- decision:P-ZNJNM7ZC -->

## SonarCloud D-341: Known Server-Side Crash

**When:** 2026-07-15 · **Fact:** `P-ZNJNM7ZC`
**Why:** Future sessions should recognize this as expected and harmless, not a regression or blocker

<!-- decision:P-LWBE45ZK -->

## Stress Tests Skipped for Pure File-Mutation + In-Process Ops

**When:** 2026-07-15 · **Fact:** `P-LWBE45ZK`
**Why:** These operations have no async/timing surface where race conditions could hide; stress testing is not informative.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-9PR6SXW5 -->

## Dogfood DECISIONS.md committed post-merge, not with feature PR

**When:** 2026-07-16 · **Fact:** `P-9PR6SXW5`
**Why:** Separates code/feature changes from self-referential metadata

<!-- decision:P-RRA2F3PE -->

## Health Check HC-12 — Deletion cascade verification

**When:** 2026-07-16 · **Fact:** `P-RRA2F3PE`
**Why:** Part of the deletion-propagation guarantee (Task 210); HC-12 is the user-facing health check that certifies cleanup worked.

<!-- decision:P-AA5X9LGY -->

## Task 210 — Deletion-propagation guarantee, in-flight (code done, docs/review pending)

**When:** 2026-07-16 · **Fact:** `P-AA5X9LGY`
**Why:** Current work-in-progress showing typical task completion path and phase sequence.

<!-- decision:P-AAUZJ9UU -->

## Task 96 — cmk redact/purge --hard, merged PR #295

**When:** 2026-07-16 · **Fact:** `P-AAUZJ9UU`
**Why:** Reference point for completed feature; demonstrates project's multi-layer review + live-test approach catching real edge cases (secrets in filenames).

<!-- decision:P-AY6TaRLY -->

## Task completion workflow — code, test, doc, review, live-test, merge

**When:** 2026-07-16 · **Fact:** `P-AY6TaRLY`
**Why:** Project convention; defines when a task is truly complete and what gates must pass.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-JHUDTLLF -->

## When user issues directive ("commit and push everything"), execute decisively wi

**When:** 2026-07-15 · **Fact:** `P-JHUDTLLF`

<!-- decision:P-XF2TNZBM -->

## User approved pragmatic memory maintenance (fix only real issues, accept harmles

**When:** 2026-07-15 · **Fact:** `P-XF2TNZBM`

<!-- decision:P-JZ4WaJFA -->

## Prefers logical line breaks in markdown for readability; dislikes mid-phrase tex

**When:** 2026-07-15 · **Fact:** `P-JZ4WaJFA`

<!-- decision:P-ZR69HNVH -->

## Wants og-image.svg updated to remove "Claude Code" and replace with new tagline:

**When:** 2026-07-15 · **Fact:** `P-ZR69HNVH`

<!-- decision:P-9S7BADNX -->

## corrected that claim wasn't empirically tested; prefers verification by testing

**When:** 2026-07-15 · **Fact:** `P-9S7BADNX`

<!-- decision:P-BQRMQWYa -->

## User intuitively expected `cmk install` to refresh stale skills/hooks/everything

**When:** 2026-07-15 · **Fact:** `P-BQRMQWYa`

<!-- decision:P-A4GU3LYU -->

## Task 210 Completion + Autopilot Chain

**When:** 2026-07-16 · **Fact:** `P-A4GU3LYU`
**Why:** Task 210 near completion; workflow pattern (code → tests → gated-stress → autopilot → pause) is repeatable. Stress orphaning (restart-induced) is a known edge case; re-launching recovers state.

<!-- decision:P-YaPDDL5J -->

## 0.4.1 release gate workflow is: 0a (commit/push) then 0b (pack/install) then bac

**When:** 2026-07-16 · **Fact:** `P-YaPDDL5J`

<!-- decision:P-LS77BMUS -->

## Task 95 (dream re-curation) path settled 2026-07-17: ship v0.5.5 without it; the

**When:** 2026-07-17 · **Fact:** `P-LS77BMUS`
**Why:** The user chose research-review-first over building now; they hold relevant papers not yet in the research base

<!-- decision:P-AE694PBJ -->

## SonarCloud Agent-Centric Development Beta Causes Crash

**When:** 2026-07-17 · **Fact:** `P-AE694PBJ`
**Why:** Root cause identified and empirically verified; Beta rollout date correlates perfectly with crash onset; reproduced across SonarJS versions

<!-- decision:P-DZTLQFUD -->

## SonarCloud/SonarJS 13.3.0 Does Not Fix Crash

**When:** 2026-07-17 · **Fact:** `P-DZTLQFUD`
**Why:** Eliminates hypothesis that this is a known SonarJS bug; points to environmental/feature root cause instead

<!-- decision:P-HMF9AEQD -->

## SonarCloud exit-3 crash RESOLVED 2026-07-18 (D-350, overturning D-341): the trig

**When:** 2026-07-18 · **Fact:** `P-HMF9AEQD`
**Why:** The wrong server-side conclusion survived three sessions because the flag-rollout correlation was real but incomplete; the original grep missed backslash-escaped fixtures (grep BOTH path-separator forms)

<!-- decision:P-JJ4DBU9S -->

## v0.5.5 published 2026-07-18: @lh8ppl/core-memory-kit@0.5.5 on npm (latest, prove

**When:** 2026-07-18 · **Fact:** `P-JJ4DBU9S`

<!-- decision:P-GP5CEG9H -->

## Task 95 Research Review — Design Synthesis Status

**When:** 2026-07-18 · **Fact:** `P-GP5CEG9H`
**Why:** Research base now synthesized; design frame emerging and externally validated; remaining questions are more focused.

<!-- decision:P-JBTVZ9JZ -->

## User submitted first research paper for Task 95 review (Language Models Need Sle

**When:** 2026-07-18 · **Fact:** `P-JBTVZ9JZ`

<!-- decision:P-LRQ5GQU5 -->

## Task 95 design forks SETTLED 2026-07-18 (D-352): (F1) op-class split — non-destr

**When:** 2026-07-18 · **Fact:** `P-LRQ5GQU5`
**Why:** The grill ran after the 11-source research review; the user explicitly challenged whether recommendations were effort-driven — F2's answer was merits (shared-screen prevents drift), scope's answer was sequencing (self-audit builds on the proven envelope), both recorded honestly

<!-- decision:P-BDPLJ5AQ -->

## Patch Release Strategy

**When:** 2026-07-18 · **Fact:** `P-BDPLJ5AQ`
**Why:** Prevents unnecessary release churn; users only receive patches for genuine user-facing fixes. Clarifies why v0.5.6 does not pre-exist.

<!-- decision:P-LRB6JNQM -->

## Task Classification and Audit System

**When:** 2026-07-18 · **Fact:** `P-LRB6JNQM`
**Why:** The project uses mixed versioning and event-driven sequencing. Regular audits keep task-to-lane mappings and trigger states synchronized with reality.

<!-- decision:P-GKLSaB6Y -->

## Backlog Disposition Audit Results — 2026-07-18

**When:** 2026-07-18 · **Fact:** `P-GKLSaB6Y`
**Why:** Audit reveals task-drift before v0.6.0 cut. Monitoring gap allowed 11 triggers to fire unnoticed; laning drift caused stale entries to survive multiple versions. Sub-task checkbox decay in shipped parents.

<!-- decision:P-9F5aKB6J -->

## Core Memory Kit Solves Discipline, Not Storage

**When:** 2026-07-18 · **Fact:** `P-9F5aKB6J`
**Why:** User's lived experience: started with simple files + hooks + rules, found Claude Code still didn't reliably remember/act. Kit emerged to solve systematic discipline.

<!-- decision:P-MGC6MEGJ -->

## User created core-memory-kit (github.com/LH8PPL/core-memory-kit) after discoveri

**When:** 2026-07-18 · **Fact:** `P-MGC6MEGJ`

<!-- decision:P-TWBH3a93 -->

## v0.5.4 is current version; tarball at packages/cli/lh8ppl-core-memory-kit-0.5.4.

**When:** 2026-07-18 · **Fact:** `P-TWBH3a93`

<!-- decision:P-a3MV5PVK -->

## The nightly distill schtask CAN be triggered on demand: 'schtasks /Run /TN cmk-d

**When:** 2026-07-18 · **Fact:** `P-a3MV5PVK`
**Why:** Corrects a mis-captured auto-extract fact (P-G4EATW57, now tombstoned) that claimed on-demand triggering was impossible — the claim was disproven minutes later in the same session

<!-- decision:P-HQJGUaYF -->

## v0.7.0 Assignment Fork at v0.6.0 Cut

**When:** 2026-07-18 · **Fact:** `P-HQJGUaYF`
**Why:** This fork shapes the post-v0.6.0 roadmap and release priority.

<!-- decision:P-LPM24M4G -->

## Session-state 2026-07-18 (pre-compact checkpoint): v0.5.5 PUBLISHED (231/230/96/

**When:** 2026-07-18 · **Fact:** `P-LPM24M4G`

<!-- decision:P-7DQUA2NE -->

## Post-Compact Session Entry Point

**When:** 2026-07-18 · **Fact:** `P-7DQUA2NE`
**Why:** Post-compact session needs explicit, specific resumption point.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-CY2DG5ZS -->

## after rename, guide's §0 backup step can be skipped—tier setup already complete

**When:** 2026-07-18 · **Fact:** `P-CY2DG5ZS`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-LK7BAX3A -->

## mk_expand `T:` Path Redactions.log Vulnerability & Fix

**When:** 2026-07-19 · **Fact:** `P-LK7BAX3A`
**Why:** Critical security constraint; the fix was part of Task 226 completion. Future sessions need to know this path is gated.

<!-- decision:P-NBX7JNEN -->

## Stress Test Phase in Pre-Merge Workflow

**When:** 2026-07-19 · **Fact:** `P-NBX7JNEN`
**Why:** Catches concurrency-sensitive and load-sensitive flakes before merge.

<!-- decision:P-ZJJ97aRB -->

## Timing Assertion Flakiness in Concurrent Test Environments

**When:** 2026-07-19 · **Fact:** `P-ZJJ97aRB`
**Why:** Helps future sessions distinguish environmental noise from real regressions; saves debugging time.

<!-- decision:P-QKFZaQJE -->

## VBS Launcher Quirk for Hidden Scheduled Task Windows

**When:** 2026-07-19 · **Fact:** `P-QKFZaQJE`
**Why:** Visible cmd popups on schedule are disruptive; VBS wrapper is transparent to task logic but hides the UI.

<!-- decision:P-62Y6FYUW -->

## youtube-to-slide Claude Code Trust Requirement

**When:** 2026-07-19 · **Fact:** `P-62Y6FYUW`
**Why:** The permission system enforces trust boundaries for sensitive operations like memory writes; the assistant cannot modify ~/.claude.json without explicit user action.

<!-- decision:P-FR9H7HQZ -->

## youtube-to-slide Scheduled Task Shims (VBS Launchers)

**When:** 2026-07-19 · **Fact:** `P-FR9H7HQZ`
**Why:** The three youtube-to-slide memory tasks were triggering visible cmd popups on schedule; the VBS shim pattern hides the window while preserving task functionality and follows the established pattern used by the kit itself.

<!-- decision:P-NFVBC6PL -->

## youtube-to-slide Uses Core-Memory-Kit Scheduling

**When:** 2026-07-19 · **Fact:** `P-NFVBC6PL`
**Why:** Eliminates duplicate task-scheduling systems (was two separate sets), enables unified health checks via `cmk doctor`, prevents the popup/crash issues caused by overlapping definitions, simplifies ongoing maintenance

<!-- decision:P-QREFRDFY -->

## GitHub Actions Username Privacy-Mask Collision

**When:** 2026-07-19 · **Fact:** `P-QREFRDFY`
**Why:** Non-obvious behavior during CI testing; privacy mask works as designed but collides with GitHub Actions' own username convention. Future test debugging on Linux Actions may encounter this.

<!-- decision:P-HKWRGMHA -->

## youtube-to-slide Migration to core-memory-kit Complete

**When:** 2026-07-19 · **Fact:** `P-HKWRGMHA`
**Why:** Full migration of a live project's memory system onto core-memory-kit. Scale (26 facts) and techniques (semantic import, dated sessions, legacy archival) are reference patterns for future migrations.

<!-- decision:P-ZRKLT9K2 -->

## Core Memory Kit Requires VS Code Folder Trust

**When:** 2026-07-19 · **Fact:** `P-ZRKLT9K2`
**Why:** Kit's background memory jobs require write access. This was discovered during migration when permission popups appeared until trust was granted.

<!-- decision:P-RVRUBRNV -->

## Windows rmSync Cleanup Flake Workaround

**When:** 2026-07-19 · **Fact:** `P-RVRUBRNV`
**Why:** Windows CI experiences non-deterministic EPERM races during teardown; this pattern is established in the codebase and avoids deep refactoring.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-ANJ3MXFK -->

## ConnectionManager class with broadcast pattern for WebSocket message distributio

**When:** 2026-07-18 · **Fact:** `P-ANJ3MXFK`

<!-- decision:P-XPWT7NNS -->

## Clean pre-existing table-lint warnings by default

**When:** 2026-07-19 · **Fact:** `P-XPWT7NNS`
**Why:** Maintains code quality and lint cleanliness standards across the codebase

<!-- decision:P-A5BVKWZ7 -->

## Closed Products Recall Architecture Validation

**When:** 2026-07-19 · **Fact:** `P-A5BVKWZ7`
**Why:** Validates kit's current architecture aligns with production systems

<!-- decision:P-4TT7GZYA -->

## Research Task Workflow Pattern

**When:** 2026-07-19 · **Fact:** `P-4TT7GZYA`
**Why:** Established integration pattern ensuring research findings flow through clear decision points before merge

<!-- decision:P-2VNQDPBE -->

## Letta – Architectural Comparison to Core-Memory-Kit

**When:** 2026-07-19 · **Fact:** `P-2VNQDPBE`
**Why:** Closest shipped sibling in memory-hierarchy design space. Architectural contrast directly informs kit design decisions and risk assessment.

<!-- decision:P-2ZKGXSTX -->

## Letta Precedent – Evidence for Tasks 149 & 95

**When:** 2026-07-19 · **Fact:** `P-2ZKGXSTX`
**Why:** Both tasks are foundational to kit design. Letta provides shipping proof-of-concept and design precedent.

<!-- decision:P-XGX92LLV -->

## onnxruntime-node Postinstall CDN Timeout

**When:** 2026-07-19 · **Fact:** `P-XGX92LLV`
**Why:** Future sessions should recognize this as transient infrastructure noise, not a real code problem, and know to retry rather than debug the code.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-MRVTM6NW -->

## v0.5.4 published to npm as `@lh8ppl/core-memory-kit@0.5.4` with sigstore provena

**When:** 2026-07-18 · **Fact:** `P-MRVTM6NW`

<!-- decision:P-K3FN3LUJ -->

## Durable knowledge (procedures, workflows) should be saved to project-local memor

**When:** 2026-07-18 · **Fact:** `P-K3FN3LUJ`

<!-- decision:P-324UW2UP -->

## Task batch v0.5.5 contains three sequenced tasks (230 → 96 → 210); previous vers

**When:** 2026-07-18 · **Fact:** `P-324UW2UP`

<!-- decision:P-RYN7KWJJ -->

## BORROW CANDIDATE from ECC (verified in their scripts/hooks/session-start.js:651-

**When:** 2026-07-20 · **Fact:** `P-RYN7KWJJ`
**Why:** Our AUTHORITATIVE_MEMORY_PREAMBLE (inject-context.mjs:238-249) ranks injected memory ABOVE the model's own assumptions and says 'lead with memory' / 'injected memory wins' - but draws NO line between durable recorded knowledge (we decided X, the user prefers uv) and stale in-flight work state. Our own snapshots carry Active Threads bullets like 'Task 227: commit teardown fix then PR then automerge' and 'user must accept trust dialog' long after those shipped. That is the exact re-execution hazard ECC hit, and our preamble is MORE forceful than theirs was.

<!-- decision:P-W7LKGN53 -->

## BUG (live-probed 2026-07-20): concurrent scratchpad writes SILENTLY LOSE bullets

**When:** 2026-07-20 · **Fact:** `P-W7LKGN53`
**Why:** Worst failure shape: silent data loss with a success exit code. The kit's whole promise is durable memory. Any concurrent-agent scenario hits this - an ultracode/workflow fan-out where each subagent's Stop hook or mk_remember appends to one MEMORY.md, two Claude Code windows on one repo, or Claude + Kiro dual-agent (a shipped supported config). The .locks dir and lock-discipline.mjs exist to DETECT stale locks but the scratchpad write path never TAKES one.

<!-- decision:P-B3BLXE9V -->

## slugify is NOT safe to de-duplicate despite 3 same-named copies (graduation.mjs,

**When:** 2026-07-20 · **Fact:** `P-B3BLXE9V`
**Why:** A clone scanner flags slugify as a TOP candidate (3 sites, identical name) so any future dedup pass will surface it again and it looks like free cleanup. It is a data bug wearing a refactor's clothes - changing a slug function changes the filenames facts are written to.

<!-- decision:P-KJ32WCUR -->

## The fact-store walk is duplicated across 10 modules with NO shared walker: the s

**When:** 2026-07-20 · **Fact:** `P-KJ32WCUR`
**Why:** This is the exact class the CLAUDE.md shared-modules table was written for - the Layer-2 review found 4 modules reimplementing the same helpers and the drift had already produced a bug (INDEX.md unfiltered in one writer's dedup scan). Today a new skip rule (new sidecar filename, new tombstone convention, a judgment_* exclusion) must be remembered in 9 separate places.

<!-- decision:P-U5LLL2CL -->

## Auto-extract degrades to ZERO captures under heavy concurrent load in the same s

**When:** 2026-07-20 · **Fact:** `P-U5LLL2CL`
**Why:** This is a silent-degradation class, the worst shape for a memory kit: the user believes capture is automatic, the hook fires every turn, and the only evidence of total failure is a phase:extract error_category:haiku_timeout line in context/sessions/DATE.extract.log that nobody reads. On a heavy session - exactly the sessions richest in durable findings - the automatic path can contribute nothing while appearing healthy.

<!-- decision:P-WaA4WPBD -->

## Memory Capture Status Emitted at Session Start

**When:** 2026-07-20 · **Fact:** `P-WaA4WPBD`
**Why:** Provides automatic, non-disruptive visibility into a critical automatic subsystem without requiring user commands.

<!-- decision:P-995L5NHT -->

## Silent Failures Require Automatic User-Facing Surfaces

**When:** 2026-07-20 · **Fact:** `P-995L5NHT`
**Why:** Users don't proactively run diagnostics; silent failures go unnoticed if surfaced only on-demand. Automatic subsystems must have default-safe, always-on visibility.

<!-- decision:P-THKPG6TZ -->

## Auto-Extract Reliability Pattern

**When:** 2026-07-20 · **Fact:** `P-THKPG6TZ`
**Why:** Prevents false conclusions about tool failure — timeouts don't mean permanent breakage; they often resolve in the next session when system resources free up.

<!-- decision:P-MWG3J4a5 -->

## Task 186 WIP Status and Rebase Prerequisite

**When:** 2026-07-20 · **Fact:** `P-MWG3J4a5`
**Why:** The next session needs to know whether this branch is ready for work or needs preparation first.

<!-- decision:P-BFB7Y7TN -->

## v0.6.0 Release Contents

**When:** 2026-07-20 · **Fact:** `P-BFB7Y7TN`
**Why:** Clarity on what's committed, what's still in progress, and what's paused or stalled.

<!-- decision:P-H9ACD2B4 -->

## Notification Doctrine — Non-Actionable Repeating Failures

**When:** 2026-07-20 · **Fact:** `P-H9ACD2B4`
**Why:** Repeating non-actionable reports train teams to ignore notifications and degrade signal-to-noise on real incidents.

<!-- decision:P-X66TPQRV -->

## Task 242: Auto-Extract Silent Failures — Self-Heal-First Design

**When:** 2026-07-20 · **Fact:** `P-X66TPQRV`
**Why:** User correctly flagged that a repeating per-session warning about uncontrollable failures is non-actionable and burns the notification channel. The system must heal silently or the warning becomes a nag that trains users to ignore real alerts.

<!-- decision:P-96QaCC9J -->

## Memory Tiers Contain Only Mission Context

**When:** 2026-07-20 · **Fact:** `P-96QaCC9J`
**Why:** Operational noise in session memory pollutes the user's mission context every session. A failure notification in memory that loads automatically becomes a repeated nag without user action, training users to ignore that channel when it genuinely matters.

<!-- decision:P-Y723NJZC -->

## Code Audit Baseline — Memory Tiers Clean

**When:** 2026-07-20 · **Fact:** `P-Y723NJZC`
**Why:** Confirms Task 242's memory-content filter addresses a proposed risk, not an existing shipped problem. Establishes clean baseline for the kit.

<!-- decision:P-A3YUPTWL -->

## Memory Tier Boundaries — Kit Health Signals

**When:** 2026-07-20 · **Fact:** `P-A3YUPTWL`
**Why:** Keeps memory focused on user project context rather than kit-internal operations. A remembered operational notice becomes a permanent nag; operational signals belong in transient reporting channels. Prevents pollution of the tier that should carry only durable project knowledge.

<!-- decision:P-NaCR3Y9V -->

## Consolidated Doc Validator Architecture

**When:** 2026-07-20 · **Fact:** `P-NaCR3Y9V`
**Why:** D-249 required separating judgment (what to check) from machinery (how to check). This consolidation unified the judgment layer into one per-change walk while keeping overlapping machinery as four families.

<!-- decision:P-DPFVXU4E -->

## Refactor Risk Concentrates in the Glue

**When:** 2026-07-20 · **Fact:** `P-DPFVXU4E`
**Why:** Moved pieces maintain their prior invariants; new binding code must satisfy untested invariants. This is the defect class most likely to escape review.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-25JLTT5Z -->

## Research paper ingested; research note created; 10 base sources re-read; synthes

**When:** 2026-07-18 · **Fact:** `P-25JLTT5Z`

<!-- decision:P-VQKAHVV9 -->

## Wants to run distill immediately, not wait until 23:00 scheduled time.

**When:** 2026-07-18 · **Fact:** `P-VQKAHVV9`

<!-- decision:P-T5S9F5BB -->

## Release Roadmap v0.6.1 — v0.7.0 and Task 95 Timing Logic

**When:** 2026-07-20 · **Fact:** `P-T5S9F5BB`
**Why:** Task 95 is a differentiator (belongs in MINOR by D-24), but also has a hard data dependency that only real usage can satisfy. Timing prevents shipping a feature with no meaningful test data.

<!-- decision:P-QG473UUX -->

## Versioning Rule D-24 — MINOR Carries One Differentiator

**When:** 2026-07-20 · **Fact:** `P-QG473UUX`
**Why:** A headline feature buried in a patch gets no visibility (nobody reads patch release notes). Each MINOR deserves clear, focused marketing and user attention.

<!-- decision:P-CJSMVDZ3 -->

## D-249 Documentation Walk Checklist

**When:** 2026-07-20 · **Fact:** `P-CJSMVDZ3`
**Why:** Prior PR #311 claimed §7.1 docs edit that was never performed. Prevents documentation drift and the overstating-commits anti-pattern.

<!-- decision:P-KHaCEVKE -->

## v0.6.0+ Upgrade Verification Matrix

**When:** 2026-07-20 · **Fact:** `P-KHaCEVKE`
**Why:** v0.6.0 introduced new features and fixed issues; matrix catches breakage early in upgrade path.

<!-- decision:P-9YPXRSQM -->

## Stale-Replay Guard: Partial Coverage Identified

**When:** 2026-07-20 · **Fact:** `P-9YPXRSQM`
**Why:** In this project, memory is the canonical state. Working lists can rot without active verification. The current guard is a safety net for one state path but doesn't cover working lists.

<!-- decision:P-66TG4TaV -->

## Extend File Rewrite Rule to All Tools

**When:** 2026-07-20 · **Fact:** `P-66TG4TaV`
**Why:** Whole-file rewrites in any language/tool have the same risk — they can silently alter file structure (line endings, whitespace) in ways that break downstream tooling.

<!-- decision:P-GQ7BXW7B -->

## Git as Sole Evidence in Gap Cases

**When:** 2026-07-20 · **Fact:** `P-GQ7BXW7B`
**Why:** This constrains design decisions. The feature isn't "pluggable evidence sources" but "git-only reconstruction for gaps". Trying to generalize would add complexity for zero benefit.

<!-- decision:P-XGASCFaJ -->

## Line-Ending Normalization Risk in Python Rewrites

**When:** 2026-07-20 · **Fact:** `P-XGASCFaJ`
**Why:** Python's text I/O defaults may not preserve the original file's line-ending convention. In mixed-OS repos, this causes silent failures that are hard to debug.

<!-- decision:P-TM723GL7 -->

## Research Finding — No Prior Art for Session Memory Reconstruction from Git

**When:** 2026-07-20 · **Fact:** `P-TM723GL7`
**Why:** Future research should start from "this is the only published approach to date" + the caveat that Graphiti articulated the core insight earlier in house.

<!-- decision:P-LERWEE52 -->

## Task 174 Deliverable Structure

**When:** 2026-07-20 · **Fact:** `P-LERWEE52`
**Why:** Understanding the deliverable structure (what runs automatically vs manually, why git is the only source) is essential for maintenance and future iterations.

<!-- decision:P-U37YCE7G -->

## Cheap-Proxy Anti-Pattern

**When:** 2026-07-20 · **Fact:** `P-U37YCE7G`
**Why:** Led to undercounting of prior art and false confidence in incomplete scans.

<!-- decision:P-BFFBCZ2Q -->

## Prior-Art Findings Annotated on Task Entries

**When:** 2026-07-20 · **Fact:** `P-BFFBCZ2Q`
**Why:** Separate documentation doesn't reliably surface findings to decision-makers. On-task annotations prevent re-solving known problems.

<!-- decision:P-GUZB92V7 -->

## Research Corpus Structure and Cloning Strategy

**When:** 2026-07-20 · **Fact:** `P-GUZB92V7`
**Why:** Future sessions need accurate scope (101 not 14) to avoid measurement errors and ensure comprehensive prior-art coverage.

<!-- decision:P-F9PWWUYW -->

## SESSION STATE at pause (2026-07-20, pre-compact): v0.6.0 SHIPPED - published to 

**When:** 2026-07-20 · **Fact:** `P-F9PWWUYW`
**Why:** The session paused at 10 percent context before auto-compact. A post-compact session needs the resumption point without re-deriving it from git log or tasks.md.

<!-- decision:P-JVSCKCFL -->

## Proposed Task Research Triage System

**When:** 2026-07-20 · **Fact:** `P-JVSCKCFL`
**Why:** Notes decay rapidly on live projects—a May note is now ~2 months stale, making it a lead rather than ground truth. Uniform re-research on all tasks is wasteful (8 tasks have no external corpus to verify against). Targeted re-verification of copying-focused tasks catches real risks with minimal overhead.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-9JAFFKDH -->

## youtube-to-slide fully migrated onto the kit; trust-dialog step completed.

**When:** 2026-07-19 · **Fact:** `P-9JAFFKDH`

<!-- decision:P-U5PPSG7Y -->

## Users will not run doctor check commands; silent failures must surface automatic

**When:** 2026-07-20 · **Fact:** `P-U5PPSG7Y`

<!-- decision:P-26DCN2T5 -->

## Reject per-session warnings about non-actionable failures; prioritize self-heal

**When:** 2026-07-20 · **Fact:** `P-26DCN2T5`

<!-- decision:P-D6YJMV2S -->

## If problematic pattern exists, must deal with it comprehensively across all affe

**When:** 2026-07-20 · **Fact:** `P-D6YJMV2S`

<!-- decision:P-ZW2M9SW5 -->

## Concerned that research notes become stale (current note from 2026-05-22 is ~2 m

**When:** 2026-07-20 · **Fact:** `P-ZW2M9SW5`

<!-- decision:P-LQGHEXKC -->

## User approved rule commit at 9% context remaining; indicates pragmatic preferenc

**When:** 2026-07-20 · **Fact:** `P-LQGHEXKC`

<!-- decision:P-99WUZ6LJ -->

## D-375 Fresh-Look-on-Porting Validated

**When:** 2026-07-20 · **Fact:** `P-99WUZ6LJ`
**Why:** Porting without review can embed anti-patterns; fresh look catches differences in context/constraints

<!-- decision:P-YZLQUWEB -->

## Kit Guardrail Behavior — Over-Block for Safety

**When:** 2026-07-20 · **Fact:** `P-YZLQUWEB`
**Why:** Kit's stated "over-block is safe" posture is intentional design, not defect; safe to trust and respect

<!-- decision:P-W6J92CKU -->

## Self-Review Finding — now.md Unbounded Read

**When:** 2026-07-20 · **Fact:** `P-W6J92CKU`
**Why:** Catching issues before they compound; now.md can grow very large (dogfood grew to 410 KB in v0.4.0)

<!-- decision:P-BY6AWCVJ -->

## Task 235 Design — now→today Roll Trigger

**When:** 2026-07-20 · **Fact:** `P-BY6AWCVJ`
**Why:** Corrected premise ("content at risk during compaction" → "roll timing gap in marathons") shaped all decisions; this is the fix

<!-- decision:P-ZHL6MRCS -->

## Task 235 Live Validation
_(retracted 2026-07-27)_

**When:** 2026-07-20 · **Fact:** `P-ZHL6MRCS`
**Why:** Proves design meets performance constraints in production

<!-- decision:P-37MBHXA2 -->

## Task 236: Counts Family Validation

**When:** 2026-07-20 · **Fact:** `P-37MBHXA2`
**Why:** Automating count validation prevents silent documentation drift and eliminates recurring manual fix overhead. Good context locality with existing Task 186 implementation.

<!-- decision:P-KMK6PSWV -->

## Version Roadmap: v0.6.1 through v0.6.2

**When:** 2026-07-20 · **Fact:** `P-KMK6PSWV`
**Why:** Provides medium-term task sequencing; clarifies scope/priority grouping for upcoming work.

<!-- decision:P-3BTLM525 -->

## Task 236: Enumeration Anti-Pattern (Prior-Art Finding)

**When:** 2026-07-20 · **Fact:** `P-3BTLM525`
**Why:** Provides empirical justification for scanning generically rather than hand-enumerating locations.

<!-- decision:P-Y6HVD6U5 -->

## D-366 Class: Hidden Order Dependencies in Claimed-Independent Mechanisms

**When:** 2026-07-20 · **Fact:** `P-Y6HVD6U5`
**Why:** Recurring fault in this codebase: reasoning about independent components without tracing when each executes.

<!-- decision:P-7VYDGZSM -->

## Prior-Art Finding: ECC Gate Enumeration vs Generic Scan

**When:** 2026-07-20 · **Fact:** `P-7VYDGZSM`
**Why:** Prior-art triage finding that directly motivated architecture choice for Task 236.

<!-- decision:P-N5YLL25P -->

## HC-6: Native Auto Memory Runs Alongside Kit

**When:** 2026-07-20 · **Fact:** `P-N5YLL25P`
**Why:** Double layer can cause redundancy or confusion; knowing the condition and remedy helps avoid debug cycles

<!-- decision:P-X2RFWHE2 -->

## Task 242 Fallback (Timeout Self-Heal) Installed but Unproven in Production

**When:** 2026-07-20 · **Fact:** `P-X2RFWHE2`
**Why:** Need to confirm feature works before claiming it's production-ready

<!-- decision:P-3C34TVJU -->

## v0.6.0 Installed; PreCompact (Task 235) Waiting for Release

**When:** 2026-07-20 · **Fact:** `P-3C34TVJU`
**Why:** Knowing version and pending features helps plan upgrades

<!-- decision:P-EJaVPBA9 -->

## SonarCloud Quality Gate Posts as GitHub Check Runs, Not Workflows

**When:** 2026-07-20 · **Fact:** `P-EJaVPBA9`
**Why:** This session missed a SonarCloud Quality Gate failure while relying on workflow status alone

<!-- decision:P-PJB2L2JE -->

## Use Deterministic Comparators for Sorting Committed Files

**When:** 2026-07-20 · **Fact:** `P-PJB2L2JE`
**Why:** Committed files must produce identical sorted output everywhere; locale collation breaks reproducibility

<!-- decision:P-aJBM76PW -->

## main branch at fc9c816, CI green through latest push

**When:** 2026-07-20 · **Fact:** `P-aJBM76PW`

<!-- decision:P-5TPJF3RJ -->

## Task 242 solution: self-heal first (deterministic fallback, retry, backoff), not

**When:** 2026-07-20 · **Fact:** `P-5TPJF3RJ`

<!-- decision:P-KBa273UP -->

## PR #310 shipped; 3196/3196 tests green, 188 files, zero test edits beyond repoin

**When:** 2026-07-20 · **Fact:** `P-KBa273UP`

<!-- decision:P-YCRXH9HD -->

## Back-compat: legacy `<!-- validate-references: ignore -->` markers honored forev

**When:** 2026-07-20 · **Fact:** `P-YCRXH9HD`

<!-- decision:P-N5VVVCV2 -->

## Direction-2 path-harvesting bug: was pulling paths from narrative prose, would f

**When:** 2026-07-20 · **Fact:** `P-N5VVVCV2`

<!-- decision:P-G5AYFaF9 -->

## v0.6.0 installed globally and on this project; 12/12 doctor checks passed; no re

**When:** 2026-07-20 · **Fact:** `P-G5AYFaF9`

<!-- decision:P-4HURZJLF -->

## npm cleanup warning with D-302 DLL-lock is expected during global upgrade; insta

**When:** 2026-07-20 · **Fact:** `P-4HURZJLF`

<!-- decision:P-4GZGQL2G -->

## Proposes targeted three-question triage + ~60-day staleness threshold instead of

**When:** 2026-07-20 · **Fact:** `P-4GZGQL2G`

<!-- decision:P-X5RW6LBQ -->

## Kit guardrail over-blocks on safety as designed; can't distinguish commands from

**When:** 2026-07-20 · **Fact:** `P-X5RW6LBQ`

<!-- decision:P-EJY4TRLG -->

## Kit is working correctly; cmk doctor reports 12 PASS/0 FAIL with 55 observations

**When:** 2026-07-20 · **Fact:** `P-EJY4TRLG`

<!-- decision:P-SYX763T5 -->

## Workflow Green ≠ Commit Green

**When:** 2026-07-20 · **Fact:** `P-SYX763T5`
**Why:** Prevents false confidence in build/deploy readiness; assistant initially relied on workflows and missed commit-level failures.

<!-- decision:P-6QV27W3J -->

## D-24 Constraint: Patch Releases Skip D-248 Backlog Sweep

**When:** 2026-07-20 · **Fact:** `P-6QV27W3J`
**Why:** This rule shapes release-gate decisions and tells when a release path is "short" (patch) vs. requires additional review (minor/major boundaries)

<!-- decision:P-HS76QXSV -->

## Catch Task/Changelog Version Mismatches Pre-Release

**When:** 2026-07-20 · **Fact:** `P-HS76QXSV`
**Why:** User review is a safety net for high-impact issues, not a substitute for process discipline. v0.6.1 had a version mismatch caught only when the user noticed the task status.

<!-- decision:P-WKSP73MT -->

## prebuild-install Deprecation Causing npm ci Failures

**When:** 2026-07-20 · **Fact:** `P-WKSP73MT`
**Why:** Known deprecation moving toward removal. Symptom will repeat predictably until the root cause (task 141b) is addressed.

<!-- decision:P-MLBNJHWN -->

## Verify Check-Run Agent Liveness Before Status Reports

**When:** 2026-07-20 · **Fact:** `P-MLBNJHWN`
**Why:** False "running" reports can mask real failures or delay diagnosis during release verification.

<!-- decision:P-N4JDFHPV -->

## Workflow Green ≠ Release Commit Checks Green

**When:** 2026-07-20 · **Fact:** `P-N4JDFHPV`
**Why:** This divergence broke release confidence and caused a second verification pass. Workflow runs aggregate multiple check types; one check failure can be invisible at the workflow level.

<!-- decision:P-SZBGN6KF -->

## Task 141b (node:sqlite Migration) Rejected in D-162

**When:** 2026-07-21 · **Fact:** `P-SZBGN6KF`
**Why:** This decision was based on measured performance data and represents a deliberate choice to maintain SQLite with better-sqlite3 for FTS search performance

<!-- decision:P-5JA3WDAS -->

## Binding Rule – README Line for User-Facing Features

**When:** 2026-07-21 · **Fact:** `P-5JA3WDAS`
**Why:** Ensures user-facing features are discoverable; surface-level doc review catches gaps early.

<!-- decision:P-KUKaB9HF -->

## Counts Validator Scope and Intentional Exclusions

**When:** 2026-07-21 · **Fact:** `P-KUKaB9HF`
**Why:** Assistant explained this as intentional design: some validation gaps are safer left to human judgment than caught by brittle automation.

<!-- decision:P-S6VBB4JE -->

## Doc Review is PR-Body-Based; Direct Merges Bypass It

**When:** 2026-07-21 · **Fact:** `P-S6VBB4JE`
**Why:** Assistant identified direct merge as the root cause of stale docs despite binding rules.

<!-- decision:P-33VV5YY5 -->

## Research Pass Methodology (Proven Workflow)

**When:** 2026-07-21 · **Fact:** `P-33VV5YY5`
**Why:** Past research cycles (D-374, D-153) showed batch intake prevents missing items and code-level reading catches contradictions. The process balances depth and coverage.

<!-- decision:P-KFP3TJTW -->

## Three Corpus Gaps Identified in D-374 Sweep

**When:** 2026-07-21 · **Fact:** `P-KFP3TJTW`
**Why:** These gaps block multiple open tasks. Research sources touching any of these areas have immediate implementation value.

<!-- decision:P-ESHZTR53 -->

## D-153 Research Quality Discipline for Agent Reading Tasks

**When:** 2026-07-21 · **Fact:** `P-ESHZTR53`
**Why:** Research workflow requires notes that clearly distinguish source-backed facts from interpretation. Downstream synthesis tasks depend on knowing what can be cited to the original author and what is agent inference.

<!-- decision:P-KVF7CKVR -->

## Harness Args Parameter Format and Normalization

**When:** 2026-07-21 · **Fact:** `P-KVF7CKVR`
**Why:** Initial workflow run failed immediately when args normalizer was not present (harness sent string, script expected object). After fixing the normalizer, agents spawned successfully and the workflow proceeded on pace.

<!-- decision:P-MAVB6VGU -->

## Multi-Step Research Ingestion Integration Workflow

**When:** 2026-07-21 · **Fact:** `P-MAVB6VGU`
**Why:** Separates concerns — user handles access barriers (HTTP 403s), assistant ensures claims verification. Prevents attributions from being incomplete or speculative. Follow-up pass guarantees fetched pages actually verify what they were cited for.

<!-- decision:P-X2LL4KJ5 -->

## LLM Memory Spec Attribution Verification

**When:** 2026-07-21 · **Fact:** `P-X2LL4KJ5`
**Why:** Distinguishes rigorous primary-source research from laundered secondary claims; affects conclusions drawn from press articles

<!-- decision:P-ZB34KHQH -->

## local-wiki Research Verification Workflow

**When:** 2026-07-21 · **Fact:** `P-ZB34KHQH`
**Why:** Enables efficient batch verification and maintains audit trail for research credibility

<!-- decision:P-3JF5CFSL -->

## local-wiki Source Prioritization Tiers

**When:** 2026-07-21 · **Fact:** `P-3JF5CFSL`
**Why:** Allocates limited research time to high-confidence primary sources first, defers secondary coverage

<!-- decision:P-M7AUP769 -->

## Laundering Detection — Official Spec vs. Community Reimplementation

**When:** 2026-07-21 · **Fact:** `P-M7AUP769`
**Why:** Prevents building design decisions on false assumptions sourced from hobbyist guesses instead of actual official contracts.

<!-- decision:P-FQJZRA2B -->

## Research Verification Workflow — Parallel Agents & Batch Integration

**When:** 2026-07-21 · **Fact:** `P-FQJZRA2B`
**Why:** Surfaces whether design claims are officially documented, speculative, or laundered from unofficial sources — critical for validating decisions (e.g., Task 95) against actual specs.

<!-- decision:P-UB9UP3TD -->

## Fixture Time Bomb in cli-backfill Test (2026-07-21)

**When:** 2026-07-21 · **Fact:** `P-UB9UP3TD`
**Why:** Time-dependent test fixtures decay predictably and exemplify Task 236's thesis on rot. Hardcoded windows are a hazard class that requires relative dates as remedy.

<!-- decision:P-TMSFZF2V -->

## New v0.6.2 Guard Candidate – Undefended CWD-as-Root Assumption

**When:** 2026-07-21 · **Fact:** `P-TMSFZF2V`
**Why:** The exposure is real and undefended. Formalizing a guard closes the gap and prevents accidental commits of kit-specific scaffolding.

<!-- decision:P-K2C2GJYP -->

## Standing OSV Advisory Surveillance (Task 237 Lane)

**When:** 2026-07-21 · **Fact:** `P-K2C2GJYP`
**Why:** Advisory publication is asynchronous and can break main post-merge. Standing surveillance is required because one-time checks miss post-merge arrivals. This incident is hard evidence for Task 237's v0.6.2 scope.

<!-- decision:P-NB6G2FHF -->

## Task 95 Ready – §21 Design Validated Against Full Corpus

**When:** 2026-07-21 · **Fact:** `P-NB6G2FHF`
**Why:** The three research verdicts confirm §21's robustness and market readiness. No competing designs found; all observed hazards already handled.

<!-- decision:P-SK59CBTD -->

## Daily Supply-Chain Scanning Cadence

**When:** 2026-07-21 · **Fact:** `P-SK59CBTD`
**Why:** Minimize supply-chain risk exposure window.

<!-- decision:P-UMSaR3CZ -->

## Do Not Reference Unshipped Task Outputs in Config

**When:** 2026-07-21 · **Fact:** `P-UMSaR3CZ`
**Why:** Scheduled jobs run without human supervision; config errors don't surface until automation fires, by which time no PR provides context.

<!-- decision:P-4NAWVQ6M -->

## Lane Membership: "Planned Together" vs "Already There"

**When:** 2026-07-21 · **Fact:** `P-4NAWVQ6M`
**Why:** Catches inter-task dependencies and latent failures where one task assumes a peer's output exists prematurely.

<!-- decision:P-MALPGCPV -->

## npm install -g Silent Failure When Run From Repo Directory

**When:** 2026-07-21 · **Fact:** `P-MALPGCPV`
**Why:** Silent failure creates user experience bugs. Users following documentation showing repo-directory installs will silently get stale versions and encounter unexpected behavior. Undetected by standard install confirmation flows.

<!-- decision:P-K79HDTZS -->

## `npm install -g` Silent Failure From Repo Cwd

**When:** 2026-07-21 · **Fact:** `P-K79HDTZS`
**Why:** Users following install docs from their project root will silently get stale versions. This needs to be fixed before v0.6.2 release.

<!-- decision:P-ZQ93PM26 -->

## PR #315 Security Gate Defects (Task 237)

**When:** 2026-07-21 · **Fact:** `P-ZQ93PM26`
**Why:** Real security workflow failures. Empirical review (running actual code against fixtures) caught defects reasoning alone would miss. All merged in v0.6.2.

<!-- decision:P-AV5XGE69 -->

## Task 240 — Node Version Pinning Across Workflows

**When:** 2026-07-21 · **Fact:** `P-AV5XGE69`
**Why:** Silently divergent runtimes between benchmark and gates hide configuration drift and undermine benchmark numbers. Structural validation prevents future regression.

<!-- decision:P-PJ7GCV7M -->

## Validator Gap — D-nnn (Decision-Log) Citations Not Enforced

**When:** 2026-07-21 · **Fact:** `P-PJ7GCV7M`
**Why:** Discovered while writing docs: user cited D-382 in commit messages before the entry existed, and drift happened within hours. Showed that unstructured citations rot.

<!-- decision:P-E75VAaB6 -->

## v0.6.2 Release State and Task Risk Assessment

**When:** 2026-07-21 · **Fact:** `P-E75VAaB6`
**Why:** Guides next session on which work is safe vs. which must defer until fresh context available.

<!-- decision:P-E4U9NH6W -->

## validate-docs Citation Gap

**When:** 2026-07-21 · **Fact:** `P-E4U9NH6W`
**Why:** Systematic validation is core to the project's argument; this gap leaves a category of citations unguarded.

<!-- decision:P-HS3NQQGR -->

## Task 240 Resolution – Bench-Storage Allowlist Entry

**When:** 2026-07-21 · **Fact:** `P-HS3NQQGR`
**Why:** File's own header comment documented this floor but was not consulted during bulk pattern-matching sweep. D-384 lesson: bulk refactors require reading context.

<!-- decision:P-NTY7KNC7 -->

## Validator Test Coverage – TDD Conformance Gap Closed

**When:** 2026-07-21 · **Fact:** `P-NTY7KNC7`
**Why:** Project CLAUDE.md rule: "write the test first... never change the test to make it pass." Task 240 shipped untested, violating the rule.

<!-- decision:P-A3LFDBR9 -->

## "bench-storage" Allowlist Entry Is Pinned and Cannot Be Removed
_(retracted 2026-07-22)_

**When:** 2026-07-21 · **Fact:** `P-A3LFDBR9`
**Why:** Removing it would break the regression test; it is a deliberate, load-bearing constraint.

<!-- decision:P-VVZPFZ6R -->

## Task 245 Diagnosis Deferred Until Reproducible

**When:** 2026-07-21 · **Fact:** `P-VVZPFZ6R`
**Why:** Avoids designing fixes to non-existent problems; ensures effort is spent on real issues.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-aZDaSLaC -->

## Cut-Gate Must Test Published Artifact, Not Repo Code

**When:** 2026-06-18 · **Fact:** `P-aZDaSLaC`
**Why:** The cut-gate's purpose is to verify the live artifact users will receive. Testing repo code means missing bugs that only appear in the published tarball, defeating the test's entire purpose.

<!-- decision:P-6EM9G3GA -->

## Windows DLL Lock Prevents Global npm Install During Active Claude Code

**When:** 2026-06-18 · **Fact:** `P-6EM9G3GA`
**Why:** npm requires exclusive file access during install. Lingering process handles to DLLs can prevent file replacement. Forcing the install or killing processes manually risks the exact breakage this project's testing practices are designed to catch.

<!-- decision:P-ZP6SQRM5 -->

## NPM Package Contents and Documentation Strategy

**When:** 2026-06-28 · **Fact:** `P-ZP6SQRM5`
**Why:** npm tarballs should be lean; GitHub is the authoritative home. But npm README is the package landing page, so it must link to key docs and provide enough CLI reference for visitors to understand the full scope without leaving npm.

<!-- decision:P-735AX2UF -->

## Current Gate Artifact — v0.5.0 with Task-148 and SonarCloud Fixes

**When:** 2026-07-08 · **Fact:** `P-735AX2UF`
**Why:** Anchors artifact version and contents; future sessions can verify baseline without re-deriving

<!-- decision:P-C5XPPXT2 -->

## D-293 Workaround — Avoid --with-semantic on Dev Repo Large Corpus

**When:** 2026-07-08 · **Fact:** `P-C5XPPXT2`
**Why:** Prevents accidental resource exhaustion of dev environment; keeps gate work isolated and unblocking

<!-- decision:P-LPR4WSKB -->

## Gate Testing — Isolated Throwaway Folders

**When:** 2026-07-08 · **Fact:** `P-LPR4WSKB`
**Why:** Isolates test environment from dev state (uncommitted changes, corpus size, prior installs); ensures reproducible results; avoids D-293 memory issues

<!-- decision:P-NBU4E54T -->

## Add explicit timeouts to all background/foreground processes; don't wait indefin

**When:** 2026-07-20 · **Fact:** `P-NBU4E54T`

<!-- decision:P-K5ZEYQRW -->

## Confirms readiness to proceed with patch release sequence

**When:** 2026-07-20 · **Fact:** `P-K5ZEYQRW`

<!-- decision:P-VBVYMWY9 -->

## research files are saved to core-memory-kit/docs/research/, not local-wiki/raw/

**When:** 2026-07-21 · **Fact:** `P-VBVYMWY9`

<!-- decision:P-3BHCGQQT -->

## local-wiki is personal-only wiki; file placement within project is flexible

**When:** 2026-07-21 · **Fact:** `P-3BHCGQQT`

<!-- decision:P-V3DETX52 -->

## Prefers simple checklists/bullet format to markdown tables for task lists

**When:** 2026-07-21 · **Fact:** `P-V3DETX52`

<!-- decision:P-EQNQHEU9 -->

## Bench-storage.yml pins Node 20 but node:sqlite (imported at module scope, line 2

**When:** 2026-07-21 · **Fact:** `P-EQNQHEU9`

<!-- decision:P-CX2AV7CS -->

## Capture-hook bins create orphaned memory tiers due to missing root discovery

**When:** 2026-07-21 · **Fact:** `P-CX2AV7CS`
**Why:** Discovered when Task-241 staging found `context/` in `packages/cli/src/` with facts accumulated since 2026-06-18, none mirrored to root tier. The gitignore-per-path approach (`gitignore:111`, 2026-06-13) only treated the symptom at one location.

<!-- decision:P-5PK5NMX5 -->

## Orphaned memory tier at packages/cli/context/ (2026-06-18 through 2026-07-12)

**When:** 2026-07-21 · **Fact:** `P-5PK5NMX5`
**Why:** Capture-hook bins default `projectRoot: process.cwd()` without root-discovery walk, creating tiers in any subdirectory they're invoked from.

<!-- decision:P-MTZLLCQ3 -->

## User values accurate severity calibration — asked "do we have a problem RIGHT NO

**When:** 2026-07-21 · **Fact:** `P-MTZLLCQ3`

<!-- decision:P-WGWVVRCJ -->

## D-386 Documents Known SonarCloud Server-Side Failure

**When:** 2026-07-21 · **Fact:** `P-WGWVVRCJ`
**Why:** Inherited red CI status looks like a code problem to a future session. Recording D-386 prevents misdiagnosis and false investigation.

<!-- decision:P-ECJD5TDF -->

## Multi-Run CI Diagnostics Separate Code from Infrastructure Failures

**When:** 2026-07-21 · **Fact:** `P-ECJD5TDF`
**Why:** Calling a failure "transient flake" after one attempt hides infrastructure problems. Comparing multiple runs transforms an assumption into a characterized failure.

<!-- decision:P-CG4aK6TB -->

## Task 243 (2026-07-21) SUPERSEDED the bench-storage allowlist constraint: the LIT

**When:** 2026-07-21 · **Fact:** `P-CG4aK6TB`
**Why:** A stale memory saying 'do not remove this entry' would make a future session treat the now-correct empty allowlist as a regression and re-add a divergence whose reason no longer exists.

<!-- decision:P-YFTSDaCA -->

## better-sqlite3 Pinned to ^13.0.1 (Not 13.0.0)

**When:** 2026-07-21 · **Fact:** `P-YFTSDaCA`
**Why:** Avoids critical vitest incompatibility in initial 13.0.0 release.

<!-- decision:P-4D7KC5QA -->

## D-384 Regression Test Uses Conditional Composition Invariant

**When:** 2026-07-21 · **Fact:** `P-4D7KC5QA`
**Why:** Decouples test logic from a specific Node version. Relationship-based logic is robust to future floor changes.

<!-- decision:P-XYXZ55YA -->

## Major Dependency Bump Verification Strategy

**When:** 2026-07-21 · **Fact:** `P-XYXZ55YA`
**Why:** Major versions can break features silently or introduce tool noise. A/B acceptance catches tool-level changes unit tests miss.

<!-- decision:P-P4CZUCSN -->

## Node Version Floor Bumped to 22 in v0.6.2

**When:** 2026-07-21 · **Fact:** `P-P4CZUCSN`
**Why:** better-sqlite3 v13 has a hard Node 22 floor. This is a breaking change for users on Node <22.

<!-- decision:P-9VFRUHaZ -->

## Stale Memory Entries Tombstoned via `cmk remember`

**When:** 2026-07-21 · **Fact:** `P-9VFRUHaZ`
**Why:** Stale memory can block justified changes. Tombstoning marks entries as superseded and stops them being restored from old snapshots.

<!-- decision:P-PDKUW4UG -->

## Native-Binary Swap Test Uses v13 Bundled Binaries

**When:** 2026-07-21 · **Fact:** `P-PDKUW4UG`
**Why:** Validates that bundled binaries work correctly across all target platforms before shipping a native-binary version change.

<!-- decision:P-CXJVGGaR -->

## Standing Autopilot Handles Merges When Gates Pass

**When:** 2026-07-21 · **Fact:** `P-CXJVGGaR`
**Why:** Reduces toil in the final merge step; keeps PR workflow smooth and predictable.

<!-- decision:P-ZRRAMUQ9 -->

## Copy-Paste Errors Persist in Headers Across Months

**When:** 2026-07-21 · **Fact:** `P-ZRRAMUQ9`
**Why:** Single-site fixes don't scale; human review catches one instance but misses duplicates in sister files

<!-- decision:P-VHLMEE6P -->

## Node-sqlite Extension Loading Requires 22.13.0/23.5.0

**When:** 2026-07-21 · **Fact:** `P-VHLMEE6P`
**Why:** Core-memory-kit's doc-walk and validator had the version wrong in three locations; incorrect floor blocks correct binary checks

<!-- decision:P-FaACAXaZ -->

## Advisory Acceptance Policy — Dead-Code Exception Class

**When:** 2026-07-21 · **Fact:** `P-FaACAXaZ`
**Why:** Forced major bumps create tested, live breakage; accepting a vuln in provably unreachable code is lower risk when removal trigger ensures cleanup as soon as fix becomes in-range

<!-- decision:P-9K4XKJZG -->

## Task 245: Root Cause Was Registry Propagation Timing, Not Working Directory

**When:** 2026-07-21 · **Fact:** `P-9K4XKJZG`
**Why:** Distinguishing coincidence from cause prevents shipping band-aids for phantom issues. The fix doesn't prove the root cause — it makes the tool resilient to the condition.

<!-- decision:P-GCHH57SC -->

## Stress Test Suite Timing

**When:** 2026-07-21 · **Fact:** `P-GCHH57SC`
**Why:** Essential for scheduling and capacity planning during gate execution and release workflow

<!-- decision:P-96KYDaBH -->

## Vitest Output Buffering and Process Verification

**When:** 2026-07-21 · **Fact:** `P-96KYDaBH`
**Why:** Previous session reported gates "running" when both had actually died; trusting spawn output instead of inspecting process state produced false confidence

<!-- decision:P-RRNKSRGD -->

## i dont know if any of this will have it, but we need to think about adding graph

**When:** 2026-07-21 · **Fact:** `P-RRNKSRGD`

<!-- decision:P-DXPCKAUU -->

## MCP tools under-used when harness defers them - Task 233 fire-rate evidence

**When:** 2026-07-21 · **Fact:** `P-DXPCKAUU`
**Why:** The kit's model-facing design (skills, MCP tools, per-prompt hints) presumes the tools are in the agent's active tool set. A deferred-tools harness adds a load step that silently redirects the agent to shell habits — the under-fire class (D-40/D-153) at the TOOL-SELECTION layer rather than the recall layer. Without this recorded, the next fire-rate analysis would miss that harness tool-loading policy is a variable.

<!-- decision:P-297QM6EH -->

## if it's a project that we already read we need to still clone and see what chang

**When:** 2026-07-21 · **Fact:** `P-297QM6EH`

<!-- decision:P-ZSFNNKGQ -->

## Research verification process uses parallel background agents with line-item spe

**When:** 2026-07-21 · **Fact:** `P-ZSFNNKGQ`

<!-- decision:P-ZSaRDQAa -->

## "100 sessions / 200-line index / four named phases" originates from community re

**When:** 2026-07-21 · **Fact:** `P-ZSaRDQAa`

<!-- decision:P-F4ALX9JS -->

## Daily (not weekly) scanning decided because real data shows 2 advisories per 24h

**When:** 2026-07-21 · **Fact:** `P-F4ALX9JS`

<!-- decision:P-77VH6NNB -->

## Kit identity: a harness over the harness - the user's framing

**When:** 2026-07-21 · **Fact:** `P-77VH6NNB`
**Why:** Names the gap between the kit's two halves precisely: hooks COERCE (harness-grade), skills/tools HOPE (model-initiated). Every under-fire observation this week is one symptom of that asymmetry. The framing decides Task 233's direction: move recall from model-choice toward environment-shaping.

<!-- decision:P-47RHYWDa -->

## GitHub issues auto-close when supply-chain surface is clean, preventing alert fa

**When:** 2026-07-21 · **Fact:** `P-47RHYWDa`

<!-- decision:P-ZHV3V3US -->

## Task 240 (Node pinning across 8 workflows) shipped successfully, fixing silent d

**When:** 2026-07-21 · **Fact:** `P-ZHV3V3US`

<!-- decision:P-NLaBQ5KP -->

## Task 243 (better-sqlite3 v12→v13) must not re-open the settled node:sqlite rejec

**When:** 2026-07-21 · **Fact:** `P-NLaBQ5KP`

<!-- decision:P-M694W947 -->

## Validator `validate-node-pin.mjs` now has 10 test cases; was previously untested

**When:** 2026-07-21 · **Fact:** `P-M694W947`

<!-- decision:P-SaCABUM9 -->

## Stress Test Configuration & Constraints

**When:** 2026-07-22 · **Fact:** `P-SaCABUM9`
**Why:** Baseline timing and no-edit discipline prevent measurement corruption and false signals in future stress test sessions

<!-- decision:P-4VYW5YJZ -->

## v0.6.2 Release Tail Workflow

**When:** 2026-07-22 · **Fact:** `P-4VYW5YJZ`
**Why:** Sequences the final release steps; structure may apply as a template to future releases

<!-- decision:P-QaaENG7Q -->

## v0.6.2 BREAKING — Node 20 Support Dropped

**When:** 2026-07-22 · **Fact:** `P-QaaENG7Q`
**Why:** Flagged as a conscious consideration point before pushing the v0.6.2 tag.

<!-- decision:P-DQRCDVJJ -->

## Decide Cron-Reliability Backstop Strategy

**When:** 2026-07-22 · **Fact:** `P-DQRCDVJJ`
**Why:** GitHub's cron unreliability exposed in this cycle; Task 237's delivery depends on the watch running reliably.

<!-- decision:P-E4aE423K -->

## GitHub Scheduled Workflows Can Miss Runs

**When:** 2026-07-22 · **Fact:** `P-E4aE423K`
**Why:** Time-sensitive checks (dependency scanning, security advisories) must have a backstop to ensure they run even if the cron pool drops the cycle.

<!-- decision:P-EYLNZYPC -->

## Task 237 Delivery Chain: Scan → File Issue → Auto-Close

**When:** 2026-07-22 · **Fact:** `P-EYLNZYPC`
**Why:** Automation chains can silently break at any stage (scan finds nothing, issue doesn't file, auto-close doesn't trigger). Live testing before the fix merges catches these gaps.

<!-- decision:P-5CNSQWFN -->

## Decision-Log Validation Gap (D-nnn IDs)

**When:** 2026-07-22 · **Fact:** `P-5CNSQWFN`
**Why:** The validation gap allowed decision-log ID drift to go unnoticed; closing it prevents future drift

<!-- decision:P-KMUEHPBP -->

## Supply-Chain Watch Issue-Filing Fixed (Task 237)

**When:** 2026-07-22 · **Fact:** `P-KMUEHPBP`
**Why:** This was a unit-green/integration-broken gap (unit tests used pure reporter; the workflow's output wiring was never exercised until a real advisory fired)

<!-- decision:P-C9T2E2aS -->

## v0.6.2 Minor Release Gate Process (D-248/D-267 Rule)

**When:** 2026-07-22 · **Fact:** `P-C9T2E2aS`
**Why:** Minor releases with breaking changes require backlog sweep and explicit user approval at tag time

<!-- decision:P-3QUKR7HJ -->

## v0.6.2 release is gated on your approval; carries breaking Node-20-drop; follows

**When:** 2026-07-22 · **Fact:** `P-3QUKR7HJ`

<!-- decision:P-UR5Q5EAN -->

## Faithful Relocation for Memory Migration in Core-Memory-Kit

**When:** 2026-07-22 · **Fact:** `P-UR5Q5EAN`
**Why:** Timeline accuracy is essential to memory system integrity. Corrupting `created_at` dates obscures when knowledge was actually learned and breaks retrospective utility of the archive.

<!-- decision:P-UPNQSMQS -->

## Memory Safety Guard Prevents Agent Bypass Attempts

**When:** 2026-07-22 · **Fact:** `P-UPNQSMQS`
**Why:** Memory systems require strong protections against agent-initiated destructive operations. The guard correctly blocks the agent, leaving such operations to the user.

<!-- decision:P-L3PXDCSG -->

## Misplaced Memory Files Recovered to Root Context

**When:** 2026-07-22 · **Fact:** `P-L3PXDCSG`
**Why:** Task 246 recovery — ensuring memories written through capture-hooks end up in context/memory/ (root) rather than package-nested locations.

<!-- decision:P-BC7LXZSQ -->

## Task 246 Phase 2: Redirect Capture-Hook Bins to Root Resolver

**When:** 2026-07-22 · **Fact:** `P-BC7LXZSQ`
**Why:** Recovery cleaned up misplaced files, but the root cause is that capture logic directs memories to wrong locations. The fix must redirect the 8 hooks.

<!-- decision:P-BNaQHZ99 -->

## PowerShell Directory Deletion Syntax

**When:** 2026-07-22 · **Fact:** `P-BNaQHZ99`
**Why:** User's primary shell is PowerShell on Windows; bash syntax like `rm -rf` causes ParameterBindingException errors.

<!-- decision:P-W6YDZZYN -->

## design.md as Canonical Spine (D-228)

**When:** 2026-07-22 · **Fact:** `P-W6YDZZYN`
**Why:** Prevents architectural fragmentation; maintains unified source of truth.

<!-- decision:P-YUWKJ6AX -->

## Doc Archiving Task Recommendation (Post-Task-246)

**When:** 2026-07-22 · **Fact:** `P-YUWKJ6AX`
**Why:** Live docs have swollen with shipped/historical material. Archiving improves readability and reduces git-diff noise.

<!-- decision:P-FSCKAQR7 -->

## Memory Tier at ~1,949 Facts (INDEX.md Capacity)

**When:** 2026-07-22 · **Fact:** `P-FSCKAQR7`
**Why:** Memory consolidation is high-touch knowledge work, distinct from doc cleanup/archiving.

<!-- decision:P-C4RJDCAD -->

## Release Workflow — Tag Before Merging New Work

**When:** 2026-07-22 · **Fact:** `P-C4RJDCAD`
**Why:** Ensures CHANGELOG version claims match the actual tagged commits—maintaining release integrity.

<!-- decision:P-7TEaNKZY -->

## Orphaned Memory Tier Bug (246) and Recovery Strategy

**When:** 2026-07-22 · **Fact:** `P-7TEaNKZY`
**Why:** Real users running <v0.6.2 will have stray folders on disk after upgrade. Understanding the bug chain and recovery path is essential for release notes and post-upgrade support.

<!-- decision:P-YFS9URVA -->

## v0.6.2 Release Staging & Task 248 Timing Decision

**When:** 2026-07-22 · **Fact:** `P-YFS9URVA`
**Why:** v0.6.2 is the release target users upgrade TO from buggy versions; recovery in v0.6.2 is ideal UX but requires un-staging and rebuilding

<!-- decision:P-7XFB9A3T -->

## Fixes Must Be Automatic in Install/Upgrade Flow, Not Diagnostic-Tool-Based

**When:** 2026-07-22 · **Fact:** `P-7XFB9A3T`
**Why:** Aligns with kit philosophy (D-85/D-164/D-169) that the kit self-heals automatically; invisible-until-you-run-a-command fixes are design failures

<!-- decision:P-3PWCGWZH -->

## Task 248 reframed (the user's design call, 2026-07-22): the pre-existing-orphane

**When:** 2026-07-22 · **Fact:** `P-3PWCGWZH`
**Why:** The kit's philosophy (D-85/D-164/D-169) is automatic-not-manual: a fix that only surfaces when a user RUNS doctor is the invisible-until-you-run-a-command failure the kit fights. The actual repair must be automatic at the upgrade moment; doctor only backstops.

<!-- decision:P-YQGQC2a5 -->

## v0.6.2 Release Approved Before Auto-Recovery

**When:** 2026-07-22 · **Fact:** `P-YQGQC2a5`
**Why:** v0.6.2 stops new stray tier creation; recovery can wait. Deferring to v0.6.3 keeps cmk install clean and avoids rushing code late in a long, error-prone session.

<!-- decision:P-HSQMYJJT -->

## Doctor is reactive-only; memory-write/search are automatic

**When:** 2026-07-22 · **Fact:** `P-HSQMYJJT`
**Why:** Doctor is critical for health checks, but its reactive-only status leaves failures invisible to the AI and to automatic workflows.

<!-- decision:P-TPRU57DD -->

## Principle U-U5PPSG7Y recorded but unimplemented

**When:** 2026-07-22 · **Fact:** `P-TPRU57DD`
**Why:** This gap is a known design debt. It directly conflicts with an existing, documented design principle, making it clear scope for v0.6.3 work alongside the reframed task 248.

<!-- decision:P-4L9NLWUL -->

## Doctor-as-a-skill design (2026-07-22 discussion): PRIOR-ART VERDICT — no precede

**When:** 2026-07-22 · **Fact:** `P-4L9NLWUL`
**Why:** My first take (a troubleshooting skill) was half-right but cut against the kit's own recorded conviction that failures must surface via an UNPROMPTED channel, not a command/skill the AI chooses to run. The compose (status-line nudge + skill how-to) honors both, and it is the honest reconciliation — a skill alone repeats the under-fire failure the kit fights.

<!-- decision:P-6YY29BQU -->

## Doctor/health nudge — CORRECTED design (2026-07-22, supersedes the SessionStart-

**When:** 2026-07-22 · **Fact:** `P-6YY29BQU`
**Why:** The nudge must key on the ACTUAL failure event (self-cleaning) not a schedule (nags forever or goes stale). A skill alone repeats the under-fire class (D-40/D-153); the failure-driven whisper does the automatic NOTICING (honors D-169), the skill does the how-to. They compose.

<!-- decision:P-VALD4GBG -->

## Task 250 — Failure-Driven Nudge Implementation

**When:** 2026-07-22 · **Fact:** `P-VALD4GBG`
**Why:** Concrete implementation anchors; ensures future work aligns with design decision confirmed this session

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-SaYWRBVS -->

## Actionable-Failure Threshold for Whisper Triggers

**When:** 2026-07-22 · **Fact:** `P-SaYWRBVS`
**Why:** Prevents alert fatigue; aligns with user principle "never warn on non-actionable issues" and kit's fail-open posture.

<!-- decision:P-R3MK9NAL -->

## Failure-Driven Whisper + Skill Architecture with Required Amendments

**When:** 2026-07-22 · **Fact:** `P-R3MK9NAL`
**Why:** Addresses blind spot where task was "all report" without self-healing. Should be consistent with user's prior argument on Task 248. Noise threshold keeps whisper from being a nuisance.

<!-- decision:P-a66RC3LN -->

## Kit lacks skill-fire telemetry for measuring recall improvements

**When:** 2026-07-22 · **Fact:** `P-a66RC3LN`
**Why:** "Fired zero times" is anecdote, not telemetry. Can't validate a fix you can't measure.

<!-- decision:P-5XS9TMPG -->

## Memory-write under-fire is lower-priority than memory-search

**When:** 2026-07-22 · **Fact:** `P-5XS9TMPG`
**Why:** This asymmetry explains prioritization: recall work has 10x leverage. Write can afford to coast on auto-extract; search cannot.

<!-- decision:P-BGLaBTCK -->

## Task 233 (ADR-0024): Memory-search fix via evidence-bearing hints

**When:** 2026-07-22 · **Fact:** `P-BGLaBTCK`
**Why:** Addresses observed failure mode where memory-search fires zero times despite per-prompt hint. Root cause: ambient hints lack credibility; specific evidence restores model trust in memory layer.

<!-- decision:P-VQG6TZVA -->

## CI Watch Pattern — Must Await ALL Checks, Not Subset

**When:** 2026-07-22 · **Fact:** `P-VQG6TZVA`
**Why:** Sonar is a blocking check; partial watches give false "all green" signals

<!-- decision:P-59WP2aNJ -->

## Design Documentation Pattern — Durable Across Sessions

**When:** 2026-07-22 · **Fact:** `P-59WP2aNJ`
**Why:** Prevents rework and preserves reasoning behind shape decisions

<!-- decision:P-2ZJMTAYa -->

## v0.6.2 Published Release State and Contents

**When:** 2026-07-22 · **Fact:** `P-2ZJMTAYa`
**Why:** Establishes the current deployed baseline; needed for understanding what's in the wild

<!-- decision:P-76aPFZKX -->

## v0.6.3 Lane Execution Sequence — Next Session Start

**When:** 2026-07-22 · **Fact:** `P-76aPFZKX`
**Why:** 233 is foundational; 248 needs clean state to avoid interaction with prior work; sequence ensures install-flow safety

<!-- decision:P-6TKFaXTT -->

## v0.6.3 Lane PR Composition and Release Purposes

**When:** 2026-07-22 · **Fact:** `P-6TKFaXTT`
**Why:** Future sessions need the concrete lane structure and each PR's purpose to continue merge/review work

<!-- decision:P-AJY64N9L -->

## Documentation Drifts at Event Boundaries, Not PR Moments

**When:** 2026-07-22 · **Fact:** `P-AJY64N9L`
**Why:** Standard doc walks are PR-driven and catch per-change updates. Release cuts and lane decisions happen outside the PR process, leaving event-level docs unowned.

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-DaY9B4Qa -->

## Task 246 (orphaned-tier recovery, 7 stranded facts) awaits your yes before proce

**When:** 2026-07-22 · **Fact:** `P-DaY9B4Qa`

<!-- decision:P-9W7XDMCA -->

## Prefers copying memory files faithfully (preserving original metadata/timestamps

**When:** 2026-07-22 · **Fact:** `P-9W7XDMCA`

<!-- decision:P-MUBQ32A9 -->

## rejects doctor-based detection for Task 248; wants automatic recovery baked into

**When:** 2026-07-22 · **Fact:** `P-MUBQ32A9`

<!-- decision:P-4FSYPAC9 -->

## doctor should only run for specific conditions (issues in kit/memory/hooks/setti

**When:** 2026-07-22 · **Fact:** `P-4FSYPAC9`

<!-- decision:P-7Z2ANUQX -->

## prefer a skill (not hook) so the AI understands why/how to invoke doctor for kit

**When:** 2026-07-22 · **Fact:** `P-7Z2ANUQX`

<!-- decision:P-SSP653KU -->

## Agent Model Delegation for Token Cost Control

**When:** 2026-07-22 · **Fact:** `P-SSP653KU`
**Why:** Enables cost optimization while preserving orchestration quality; subagent isolation prevents context bloat

<!-- decision:P-GCQFaXGC -->

## Wants to reduce token usage by using Fable 5 as orchestrator, delegating impleme

**When:** 2026-07-22 · **Fact:** `P-GCQFaXGC`

<!-- decision:P-CQ4PVEBQ -->

## Three-Tier Model Delegation Pattern

**When:** 2026-07-22 · **Fact:** `P-CQ4PVEBQ`
**Why:** Prior shipped bugs hid in test discipline, justifying deep-reasoning (Opus) not mechanical (Sonnet) for tests. Matches model to task complexity. Reduces context bloat.

<!-- decision:P-JQ2ZNFKR -->

## Agent Binding Rules

**When:** 2026-07-22 · **Fact:** `P-JQ2ZNFKR`
**Why:** Keeps deployment, memory, and decision authority centralized; preserves audit trail.

<!-- decision:P-RN5FXKDQ -->

## Agent Definitions Committed and Pushed

**When:** 2026-07-22 · **Fact:** `P-RN5FXKDQ`

<!-- decision:P-2J4ZDGWK -->

## Gitignore Carve-out for `.claude/agents/`

**When:** 2026-07-22 · **Fact:** `P-2J4ZDGWK`
**Why:** Agent definitions are durable, project-wide policy (not per-developer), so they belong in git. Settings and scaffolding remain ignored per original design.

<!-- decision:P-GAJYHVPQ -->

## Three-Tier Agent Split Trial on Task 233

**When:** 2026-07-22 · **Fact:** `P-GAJYHVPQ`
**Why:** The split is new; real-world validation on a live task is necessary before formalizing as standing policy.

<!-- decision:P-RCETHGSN -->

## .claude/ Gitignore Strategy

**When:** 2026-07-22 · **Fact:** `P-RCETHGSN`
**Why:** Separation ensures the kit remains portable and developer-neutral (no one's personal config leaks) while versioning workflow fixtures (agent roles and split discipline) that need to be stable and shared. Agent definitions are trial infrastructure, not ephemera.

<!-- decision:P-X59WSM9D -->

## `.claude/` directory is fully gitignored in this project

**When:** 2026-07-22 · **Fact:** `P-X59WSM9D`

<!-- decision:P-EYCWXa3K -->

## OKF v0.1 (GoogleCloudPlatform/knowledge-catalog) is a vendor-neutral spec: markd

**When:** 2026-07-22 · **Fact:** `P-EYCWXa3K`
**Why:** Positions the kit within an emerging vendor-neutral ecosystem; strengthens the adoption narrative and external credibility

<!-- decision:P-G72M6QBA -->

## Kit Name-Privacy Validator for Auto-Extract

**When:** 2026-07-22 · **Fact:** `P-G72M6QBA`
**Why:** Kit memory is committed to git (possibly public). Personal/project names should not leak into public memory without user consent. This validator enforces privacy by design.

<!-- decision:P-J2DHFQSR -->

## Graph Database Rejected — Empirical Basis and DEFER Gate

**When:** 2026-07-22 · **Fact:** `P-J2DHFQSR`
**Why:** Verdict tested twice. Real practice in the field validates the rejection. Honest caveat: Task 232's scope unknown to cover all inference; requires benchmark if multi-hop need emerges in production.

<!-- decision:P-9aCLVPGM -->

## Task 232 — Rebuild Edge Table from Markdown

**When:** 2026-07-22 · **Fact:** `P-9aCLVPGM`
**Why:** Itch is not stupidity — it's accurate diagnosis of missing visibility. Kit already writes the data; 232 makes it usable. The nagging is the kit's own thesis surfacing.

<!-- decision:P-5XJB5RDS -->

## Octopoda-OS (github.com/RyjoxTechnologies/Octopoda-OS) — 'open-source memory + o

**When:** 2026-07-22 · **Fact:** `P-5XJB5RDS`
**Why:** The user asked to note it so it is not forgotten; potential prior-art for observability/health tasks (212, 250)

<!-- decision:P-MCWGF2LE -->

## D-364 Discipline for External Source Claims

**When:** 2026-07-22 · **Fact:** `P-MCWGF2LE`
**Why:** Maintains research quality and prevents adopting unproven external ideas as-is

<!-- decision:P-TV55UZNC -->

## Kit's Own Loops Are Real Detection Targets

**When:** 2026-07-22 · **Fact:** `P-TV55UZNC`
**Why:** Loop detection is not just theoretical — the kit has real problems that must be solved

<!-- decision:P-FFSJDRUR -->

## Loop-Detection Research Feeds Task 250 and Task 212

**When:** 2026-07-22 · **Fact:** `P-FFSJDRUR`
**Why:** Loop detection is a required ingredient for the whisper's failure detection and process health monitoring

<!-- decision:P-DZ7BVLGW -->

## D-364 Discipline — Code-Verified vs README-Only Research Tagging

**When:** 2026-07-22 · **Fact:** `P-DZ7BVLGW`
**Why:** Field flagships often ship less than READMEs promise. The discipline forces a distinction between documentation and code reality, preventing decisions on false assumptions.

<!-- decision:P-GWWGT2G6 -->

## Kit Missing Tool-Call Log for Full Loop-Detection Coverage

**When:** 2026-07-22 · **Fact:** `P-GWWGT2G6`
**Why:** Task 212 and Task 250 reference these detectors. Without tool-call logging, the kit can feed only "pure event log" classifiers, limiting detection scope.

<!-- decision:P-TSZAYQNU -->

## Octopoda Loop-Detection Code-Verified Findings

**When:** 2026-07-22 · **Fact:** `P-TSZAYQNU`
**Why:** Closes half the corpus gap (detection algorithms). Directly feeds Task 250 (loop-detection prior art), Task 212 (process-health metrics architecture), Task 233 (recall-nudging validation). Unvalidated quality informs risk assessment.

<!-- decision:P-692R5VaA -->

## Relevance Threshold Calibration — Octopoda's 0.80 → 0.45 Lesson

**When:** 2026-07-22 · **Fact:** `P-692R5VaA`
**Why:** Threshold tuning in retrieval systems is non-obvious. A seemingly safe (0.80) floor can be too aggressive, suppressing relevant signals. Applies to Task 233 (recall-nudging validation) and hint-injection logic.

<!-- decision:P-A64FS6AK -->

## Agent Definitions Load at Session Start, Not Invokable in That Session

**When:** 2026-07-22 · **Fact:** `P-A64FS6AK`
**Why:** Understanding agent-definition lifecycle is critical when orchestrating multi-agent workflows within a single session. This quirk would otherwise cause unexpected failures or require awkward manual workarounds.

<!-- decision:P-WAXZ3EEX -->

## Flush Memory to Main Before Creating Feature Branch

**When:** 2026-07-22 · **Fact:** `P-WAXZ3EEX`
**Why:** Feature PRs should reflect code changes only; memory updates are orthogonal and complicate review clarity. Separating them improves PR signal-to-noise.

<!-- decision:P-Z9PJXGEG -->

## Lead-Implementer Orchestration for Multi-Part Implementation Tasks

**When:** 2026-07-22 · **Fact:** `P-Z9PJXGEG`
**Why:** Separates planning (lead) from execution (implementer). Allows both to operate at their respective depths; implementer avoids context-switching; lead can think strategically without interruption.

<!-- decision:P-M4AMN9GC -->

## Hot-Path Hook Latency Anti-Pattern

**When:** 2026-07-22 · **Fact:** `P-M4AMN9GC`
**Why:** Hooks can add significant latency. When called synchronously on high-frequency paths, they compound—not just in aggregate, but in tail latencies and p99 impact.

<!-- decision:P-KBEXAa9S -->

## Relevance-Floor Calibration for FTS5 Backends

**When:** 2026-07-22 · **Fact:** `P-KBEXAa9S`
**Why:** High floors create false negatives that go unnoticed; for retrieval, false negatives are worse than false positives. Octopoda's quantified data directly applies to our recall requirements.

<!-- decision:P-CDRKH6WB -->

## §20.3 Import-Pin Constraint for Task 233

**When:** 2026-07-22 · **Fact:** `P-CDRKH6WB`
**Why:** The hint build composes three pieces (FTS5-backed hint, existence advertisement, Memora refinements). The import-pin is the one place the build could break a hidden structural requirement without obvious failure symptoms.

<!-- decision:P-DA7L5A3Q -->

## FTS5 Parser Crash History and Current Injection Surface

**When:** 2026-07-22 · **Fact:** `P-DA7L5A3Q`
**Why:** Prevents crashes and injection attacks via search queries

<!-- decision:P-DCW27YSQ -->

## Privacy Sanitization Pattern for All Prompt Handling

**When:** 2026-07-22 · **Fact:** `P-DCW27YSQ`
**Why:** Task 233 implementation logged raw prompts to disk, leaking `<private>` content (including PII/SSN). Violates the kit's privacy contract.

<!-- decision:P-XQ5439GU -->

## Two-Pass Review Discipline Validated on Critical Bugs

**When:** 2026-07-22 · **Fact:** `P-XQ5439GU`
**Why:** Confirms review overhead is justified by real-world catch rate on production-critical issues

<!-- decision:P-AJMLYMUW -->

## VS Code + Vitest + Git Bash Environment Issue

**When:** 2026-07-22 · **Fact:** `P-AJMLYMUW`
**Why:** Environment-specific issue that causes hard-to-diagnose test flakes; explicitly surfaced as worth documenting to prevent future re-diagnosis sessions

<!-- decision:P-P3BT459T -->

## Vitest workers spawned from the Claude Code Bash tool inside VS Code can fail un

**When:** 2026-07-22 · **Fact:** `P-P3BT459T`
**Why:** Prevents a future session from re-diagnosing a full-suite red as a code problem when it is shell-env poisoning

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-3RQPTZET -->

## wants Octopoda-OS captured durably ("just so i dont forget")

**When:** 2026-07-22 · **Fact:** `P-3RQPTZET`

<!-- decision:P-XWP6XLLG -->

## Approves adopting ideas from Octopoda on loop detection

**When:** 2026-07-22 · **Fact:** `P-XWP6XLLG`

<!-- decision:P-aUSPYZJR -->

## Requests immediate execution of loop research ("why not do the research now?")

**When:** 2026-07-22 · **Fact:** `P-aUSPYZJR`

<!-- decision:P-E6TXLFHN -->

## D-293: --with-semantic on large corpora caused 8.8GB memory freeze; now fixed; w

**When:** 2026-07-22 · **Fact:** `P-E6TXLFHN`

<!-- decision:P-5CR4P996 -->

## on another subject i dont know why but i always file like we are missing on the

**When:** 2026-07-22 · **Fact:** `P-5CR4P996`

<!-- decision:P-RLUYAZD2 -->

## Task 233 now dispatched to Opus implementer with complete work order; CI has cle

**When:** 2026-07-22 · **Fact:** `P-RLUYAZD2`

<!-- decision:P-TMC4EMRK -->

## UI Viewer Design Awaits v0.4 Scope Decision

**When:** 2026-07-23 · **Fact:** `P-TMC4EMRK`
**Why:** Task 254 foreclosed option 2, which may not be the user's call. Clarifies that all three paths remain open and their tradeoffs.

<!-- decision:P-FC2WQ9Ja -->

## User views Obsidian vault integration as pragmatic/simple; questions whether ela

**When:** 2026-07-23 · **Fact:** `P-FC2WQ9Ja`

<!-- decision:P-2JBFX6GP -->

## Fact-file write constraint: forward-only, no mass rewrites

**When:** 2026-07-23 · **Fact:** `P-2JBFX6GP`
**Why:** Preserve file history and avoid accidental confusion/data loss in existing user memory.

<!-- decision:P-7W7HWKDR -->

## Task 255 design grill questions queued

**When:** 2026-07-23 · **Fact:** `P-7W7HWKDR`
**Why:** Design-first approach (D-121); explicit scope decisions required before build.

<!-- decision:P-FD2CJBY3 -->

## Two-phase viewer rollout: Obsidian v0.6.3, kit viewer v0.6.4

**When:** 2026-07-23 · **Fact:** `P-FD2CJBY3`
**Why:** Cost-benefit sequencing; tests whether users actually engage with memory before custom UI investment.

<!-- decision:P-FBU44TEX -->

## Map Module Sort Determinism — localeCompare Banned, Explicit Ordering Required

**When:** 2026-07-23 · **Fact:** `P-FBU44TEX`
**Why:** The map module generates committed artifacts (`MAP.md`) that are included in version control and must be reproducible across all machines. Locale-dependent or implicit sorting causes non-deterministic output, breaking the determinism guarantee that the map depends on.

<!-- decision:P-2CXY4aaE -->

## Memory Kit Validates Itself as Dogfood Test Subject

**When:** 2026-07-23 · **Fact:** `P-2CXY4aaE`
**Why:** The kit's own memory is not just documentation—it's active validation that the system works.

<!-- decision:P-VBU4JCFX -->

## Memory System Now Obsidian-Browsable

**When:** 2026-07-23 · **Fact:** `P-VBU4JCFX`
**Why:** Enables memory discovery and navigation in future sessions without re-running builds; a durable configuration fact.

<!-- decision:P-YTB4VSD5 -->

## Task 254 Shipped — Obsidian Memory Integration (2026-07-23)

**When:** 2026-07-23 · **Fact:** `P-YTB4VSD5`
**Why:** Marks completion date and exact commits that established Obsidian browsability.

<!-- decision:P-BWAGUDTB -->

## .obsidian Folder Gitignore at Any Depth

**When:** 2026-07-23 · **Fact:** `P-BWAGUDTB`
**Why:** Obsidian creates .obsidian/ metadata folder automatically; without depth-inclusive pattern, different vault opens pollute the repo with uncommitted changes

<!-- decision:P-CU5NS2T5 -->

## Obsidian Vault Setup for Memory Kit

**When:** 2026-07-23 · **Fact:** `P-CU5NS2T5`
**Why:** User discovered repo-root approach clutters the view; separate vault isolates the memory system for clarity and intended experience

<!-- decision:P-R3CDVGU9 -->

## Graph Visualization Feedback: Edge Density is the Limiting Factor

**When:** 2026-07-23 · **Fact:** `P-R3CDVGU9`
**Why:** The user's dissatisfaction reveals a gap between expected (serendipitous connections) and actual (sparse corpus). This measurement and framework are essential for 255 grill design decisions and next-phase planning.

<!-- decision:P-RACGHUXK -->

## Graph Database Feature Purpose: Memory Lens, Not Storage

**When:** 2026-07-23 · **Fact:** `P-RACGHUXK`
**Why:** Clarifies scope: the graph is a UI/comprehension layer over memory, not an architectural storage choice. Shapes what "success" means for the feature.

<!-- decision:P-BWZ3S7U7 -->

## Project Philosophy: Niche Excellence Over Breadth

**When:** 2026-07-23 · **Fact:** `P-BWZ3S7U7`
**Why:** This is a deliberate philosophy that frames all scope and prioritization decisions. Niche depth is the strategy, not a limitation to overcome.

<!-- decision:P-U5aGG67J -->

## PII Screening Mechanism in the Kit

**When:** 2026-07-23 · **Fact:** `P-U5aGG67J`
**Why:** Personal info in committed facts travels with git clone, appears in PRs, and becomes permanently searchable; these mechanisms prevent accidental exposure

<!-- decision:P-7XCZ64La -->

## Task 255 — Viewer Design Grill

**When:** 2026-07-23 · **Fact:** `P-7XCZ64La`
**Why:** Interviewing the user before implementation prevents misalignment and costly rework.

<!-- decision:P-D5TKE5WW -->

## Task 256 Design Constraints and Incorporated Rules

**When:** 2026-07-23 · **Fact:** `P-D5TKE5WW`
**Why:** Constraints guide implementation decisions. Rules embody lessons learned this week and prevent regression to prior incidents.

<!-- decision:P-RCKKU29L -->

## Task Notification and Resumption System

**When:** 2026-07-23 · **Fact:** `P-RCKKU29L`
**Why:** Knowing how the notification system works prevents confusion when a task-id reappears; clarifies that resumption is expected and possible

<!-- decision:P-QRXGWG44 -->

## Plural Citation Extraction Gap in Corpus

**When:** 2026-07-23 · **Fact:** `P-QRXGWG44`
**Why:** Gap found by reviewer running against live corpus (not test fixtures), catching a pattern tests missed. Anchor extraction quality is the whole point of the feature.

<!-- decision:P-C2YR6DGV -->

## Post-fix Integration Workflow

**When:** 2026-07-23 · **Fact:** `P-C2YR6DGV`
**Why:** Established SOP for shipping fixes and planning the next feature cycle.

<!-- decision:P-HRTBEEW2 -->

## Validation by Independent Test Reproduction

**When:** 2026-07-23 · **Fact:** `P-HRTBEEW2`
**Why:** Reproduction catches real-world behavior that test fixtures or code review misses.

<!-- decision:P-QDU2URNU -->

## Graph Phase Complete; Two Items Remain

**When:** 2026-07-23 · **Fact:** `P-QDU2URNU`
**Why:** Marks project milestone; clarifies what remains to completion

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-RES031CG -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-RES031CG`

<!-- decision:P-QT3B3ZB7 -->

## RESUME — v0.3.1 cut-gate near-complete; PR

**When:** 2026-06-14 · **Fact:** `P-QT3B3ZB7`

<!-- decision:P-H7DV3JR9 -->

## Install-Path Review Checklist

**When:** 2026-07-25 · **Fact:** `P-H7DV3JR9`
**Why:** Install-path code is fail-open (safety-critical); a latent bug breaks recovery at the user's site. The recovery scan can warn but never destroy, must preserve byte-identity and dates/ids, and must skip collisions rather than overwrite.

<!-- decision:P-ZPEJQHPC -->

## js-yaml Can Silently Rewrite YAML Formatting

**When:** 2026-07-25 · **Fact:** `P-ZPEJQHPC`
**Why:** Caught during reviewer scrutiny of id-repair implementation; reviewer must validate with hostile YAML test cases and byte-by-byte diffs to ensure the claim holds.

<!-- decision:P-P2X5HVVK -->

## Preserve Legacy ID When Creating Derived IDs

**When:** 2026-07-25 · **Fact:** `P-P2X5HVVK`
**Why:** Enables traceability between old and new ids; user recognizes which facts were repaired. Important for audit trails and diagnosing why a fact was re-indexed.

<!-- decision:P-FZSXVBYF -->

## D-390 Multi-Agent Architecture (Active Configuration)

**When:** 2026-07-25 · **Fact:** `P-FZSXVBYF`
**Why:** Independent reviewer catches bugs invisible to implementer's own test suite. Across 5 tasks (232, 233, 254, 256, 248): found runaway rebuild, privacy leak, extraction gap, install-path data corruption. Two-pass discipline prevents issues shipping.

<!-- decision:P-VSaR2F3U -->

## BOM'd Fact Files Are Invisible to Scanning

**When:** 2026-07-25 · **Fact:** `P-VSaR2F3U`
**Why:** Architectural blindspot that affects data recovery completeness; tracked separately to avoid scope creep on install-path fixes

<!-- decision:P-APWN7UPA -->

## P-RES031CG Malformed File Recovery Plan

**When:** 2026-07-25 · **Fact:** `P-APWN7UPA`
**Why:** This file has been a recurring scan burden; real install is the corrective action that Task 248 validated

<!-- decision:P-RPWDP9MK -->

## Recurring npm-registry Timeouts in CI Workflows

**When:** 2026-07-25 · **Fact:** `P-RPWDP9MK`
**Why:** Recurring environmental issue affecting CI reliability; impacts deployment cadence

<!-- decision:P-aBK6XaJ4 -->

## brainapi2 Code-Dive Assessment and Findings

**When:** 2026-07-27 · **Fact:** `P-aBK6XaJ4`
**Why:** Most credible knowledge-graph implementation in the corpus (first with real Neo4j and typed edges). Their failures show where the field is genuinely stuck. Temporal bug is a regression-test gift for Task 66. Positioning insight: high infrastructure complexity for feature parity with simpler approach.

<!-- decision:P-BV4KNXE3 -->

## BOM-Prefixed Files and ID Generation

**When:** 2026-07-27 · **Fact:** `P-BV4KNXE3`
**Why:** BOM handling was silently destroying data; understanding the alignment strategy and heal-on-rewrite pattern prevents regression and clarifies the reference implementation relationship.

<!-- decision:P-5G3JD4V2 -->

## Reference Implementation Alignment Strategy

**When:** 2026-07-27 · **Fact:** `P-5G3JD4V2`
**Why:** This prevents silent divergence and makes the parity harness a tool for correctness, not just documentation.

<!-- decision:P-XXGTVH6K -->

## Opened entire repo root as Obsidian vault to visually explore memory system

**When:** 2026-07-23 · **Fact:** `P-XXGTVH6K`

<!-- decision:P-RXDC53YR -->

## Git Fixture Byte Normalization Verification

**When:** 2026-07-27 · **Fact:** `P-RXDC53YR`
**Why:** Fixture integrity is critical for reproducible tests; git handling can corrupt carefully-formatted or binary fixture data

<!-- decision:P-BUABTDRA -->

## Invisible Character Hazard in Documentation

**When:** 2026-07-27 · **Fact:** `P-BUABTDRA`
**Why:** Invisible characters cause subtle issues and are invisible to visual review. Byte-scanning catches them reliably.

<!-- decision:P-DUQRU7SK -->

## One-Strip-Everywhere Implementation Pattern

**When:** 2026-07-27 · **Fact:** `P-DUQRU7SK`
**Why:** Visibility of problems is better than silent failure; single-strip avoids losing problem files and enables proper error reporting

<!-- decision:P-TEMFAAJR -->

## Task 257 Data-Durability Commitments

**When:** 2026-07-27 · **Fact:** `P-TEMFAAJR`
**Why:** Captures specific contractual commitments and durability guarantees this fix establishes.

<!-- decision:P-2LSaPQNE -->

## v0.6.3 Release Plan & Task Queue

**When:** 2026-07-27 · **Fact:** `P-2LSaPQNE`
**Why:** Provides release structure and task sequencing for the current development cycle.

<!-- decision:P-2DEH535R -->

## Verification Protocol

**When:** 2026-07-27 · **Fact:** `P-2DEH535R`
**Why:** Documents QA expectations and why independent reviews often catch different issues.

<!-- decision:P-BKXE3ECQ -->

## Memory Flush Consistency Unit

**When:** 2026-07-27 · **Fact:** `P-BKXE3ECQ`
**Why:** Prior `-am` incident and today's INDEX.md half-state both show that surgical staging within `context/` breaks consistency invariants. validate-docs catches these as errors.

<!-- decision:P-2K29UJKN -->

## Durable-State-First Principle

**When:** 2026-07-27 · **Fact:** `P-2K29UJKN`
**Why:** Enables smooth pause/resume cycles without re-deriving state between sessions

<!-- decision:P-TFZDPX6J -->

## D-388 Project Discipline: Document Unreachable Code

**When:** 2026-07-27 · **Fact:** `P-TFZDPX6J`
**Why:** Applied during Task 257 coverage gate work; existing project discipline referenced as the decision principle.
