---
id: P-QCKEA5A3
type: project
title: Session 1 Staged Build Workflow
created_at: 2026-06-14T09:02:08Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9b74983b86bf727efca1b654182a581ac9d953339809aa0d0a88c53ffb92638f
related: [4-stage-fastapi-build-plan-with-embedded-rules, e1-cold-open-test-persona-carries-unprompted, e1-test-scoring-criteria-backend-code-generation]
---

Four-stage test sequence in C:\Temp\cut-gate10:
  - **Stage 0:** minimal Python FastAPI WebSocket chat (app.py + index.html, no framework)
  - **Stage 1:** layered refactor (app/{api,services,repositories,schemas,core}/); user naturally states: "FastAPI is the delivery layer, not the brain. Routes stay thin; logic in services; data in repositories; Pydantic schemas are the boundary."
  - **Stage 2:** Claude Agent SDK integration; user naturally states: "Type hints on every signature, Python 3.12+. Comments explain why not what. Tests first: boundary test, watch it fail, then implement."
  - **Stage 3:** WebSocket streaming; user naturally states: "Async all the way down."

**Why:** Validates auto-memory extraction system (Stop hook auto-captures preferences stated naturally, without explicit "remember this" commands)

**How to apply:** Execute stages 0→3 sequentially in Claude Code, stating preferences aloud during each stage; system auto-captures them to context/memory/project_*.md files
