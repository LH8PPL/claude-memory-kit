---
id: P-KL9G3TGV
type: project
title: 4-Stage FastAPI Build Plan with Embedded Rules
created_at: 2026-06-22T18:38:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c5dc149e757861c3f6e3e61f773dc6aa21446f6f1f3afbe88902c15c5a838b4d
related: [session-1-staged-build-workflow, kiro-gate-testing-workflow, e1-cold-open-test-persona-carries-unprompted]
---

- **Stage 0**: Minimal FastAPI + WebSocket + `index.html` in `app.py`
- **Stage 1**: Refactor to layered `app/{api,services,repositories,schemas,core}/` → state rule: "FastAPI is delivery not brain"
- **Stage 2**: Swap to Claude Agent SDK → state rule: Type-hints + TDD (test-first)
- **Stage 3**: Stream output + async support → state rule: async-first + cross-project rule (uv/ruff)

Each stage includes "Say the rule out loud" to trigger IDE capture.

**Why:** Session 1 workflow; captures reasoning in hooks for future sessions' context.

**How to apply:** Follow stages 0→3 in order, stating each rule out loud after implementation. IDE capture will record in `context\sessions\{date}.md`.
