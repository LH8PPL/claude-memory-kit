---
id: P-AZKXQRHC
type: project
title: cut-gate16 Test Workflow Phases
created_at: 2026-06-18T13:04:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f49cfe25733247fdee6483076ce547bdbb34dfd4728ba9335a2413acd7fd700c
related: [cut-gate-test-workflow, cut-gate-16-setup-terminal-tests-complete, core-memory-kit-installed-with-claude-code-hooks]
---

The cut-gate test (in `C:\Temp\cut-gate16`) has discrete phases with abbreviations: **M0–M3 tools** (memory tool checks), **W1–W4 recall** (working memory retrieval), **DJ4-live/DJ6-live journal** (dirty journal and session journal live checks), **F-7b-live forget** (forget functionality live check). These are run in-chat in VS Code on the cut-gate16 directory, with prompts in the guide.

**Why:** The phases are a structured verification checklist for the memory kit's core functionality. Running them in-chat (not terminal) lets Claude Code exercise its memory integration directly.

**How to apply:** After starting VS Code on cut-gate16, follow the phase sequence from the guide; each phase is a natural-language prompt to run in Claude Code.
