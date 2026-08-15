---
id: P-9D6T5Z2U
type: project
shape: Plan
title: D-271 Deep Research — Headless LLM Invocation Patterns
created_at: 2026-07-05T13:51:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 471bf1d51dd81416e208e08317186b95baadac34a351936d02afaf1c84da579a
related: [multi-agent-llm-invocation-research-initiative, resume-task-200-agent-relative-backend, wave-based-agent-research-for-cursor-windows-invocation]
---

**Goal**: Systematic sweep across ~70 cross-agent projects to understand how they invoke LLMs in automated/headless contexts.

**Target Research Question**:
When a project needs an LLM in automated/headless context, does it (a) require per-agent CLI, (b) call cloud API with key, (c) invoke agent's own headless mode, or (d) something else—and how does it handle Windows specifically?

**Scope**: Multi-agent installers (claude-mem, Taskmaster, mimir, memex, EverOS) as entry points; expanding to ~70 projects across Windows/Mac/Linux.

**Pending Decision**: Execution method—
- Option 1: Workflow/fan-out (parallel, higher token cost)
- Option 2: Sequential/methodical (cheaper, starting with multi-agent tools)

**Why:** The target question is the evaluation rubric for all 70 projects. Persisting it ensures consistent, repeatable research across resumptions and prevents re-deriving scope.

**How to apply:** When D-271 resumes, reference this target question as the evaluation standard for each project. Apply the chosen execution method consistently.
