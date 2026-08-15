---
id: P-E4aYXK5P
type: project
title: v0.4.3 Cut-Gate Multi-Phase Validation Structure
created_at: 2026-07-01T07:32:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3f6ef81771b1a09278df94ea1f5ace4523c7c35d2c8a992fcd4692c6ef619b91
related: [claude-memory-kit-gate-test-phase-structure, release-workflow-full-sequence-for-v0-4-3-and-future-cuts, v0-3-1-cut-gate-checklist-additive-testing-plan]
---

Release validation has these sequential phases:
  - **§0-1 Scaffold:** G0-G7 checks — version match, install, doctor, skills, semantic, file safety, MCP
  - **§2 Session 1 Capture:** Collect 18 rich facts, verify explicit-vs-inferred classification
  - **§3 Capture Validation:** B3-B7 — wedge fills, graduation fire (reactive + proactive)
  - **§4 Explicit Checks:** C1-C6 + FQ1 — Poison_Guard (API key rejection), home-path sanitization, Unicode safety, FTS5 robustness
  - **§4d Persona Headline:** PR1-PR5 — recurrence bump, demote-not-evict (Hole B), trust_score migration, topic-routing (Hole C), invisible-Unicode block
  - **Sessions 2-3:** Live user-driven validation (W1-W4 recall quality, brand-new-project cold-open test)
  - **Final Steps:** LLM-driven persona promotion via `cmk persona generate`, README/CHANGELOG/version verification, `v0.4.3` tag + publish

**Why:** This structured workflow ensures v0.4.3 passes both deterministic safety checks and live-session recall quality before release.

**How to apply:** Reference this when running future cuts; sections 0-4 are automatable and runnable in any environment, but Sessions 2-3 and final steps require live user interaction and cannot be scripted.
