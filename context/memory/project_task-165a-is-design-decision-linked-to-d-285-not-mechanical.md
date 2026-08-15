---
id: P-a99JZQZV
type: project
shape: Relationship
title: Task 165a is design decision linked to D-285, not mechanical fix
created_at: 2026-07-06T19:15:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0e21f2510652a86a552aed703cf7a0cbbf1612dfa0533391d1c45c0052ab64b1
related: [mcp-prompt-gate-only-appears-in-non-default-agent-scenario, mcp-prompt-root-cause-agent-config-kiro-cli-mismatch, v0-4-6-release-roadmap]
---

The kiro-cli approval prompt (task 165a) is not a v0.4.5 bug or regression. It only appears when cmk is not the active global agent — e.g., when user removes global default and runs on kiro_default. The original symptom (mk_search prompting while cmk IS active) may already be resolved in current code.

Core design question: should non-default users get prompt-free memory? This is entangled with D-285 (whether global default should be optional). The answer determines whether this is a quick patch (option a: accept one-click trust), a project-level MCP trust key (option b), or just documentation (option c).

**Why:** Clarifies that rushing implementation risks building the wrong thing. Work is properly scoped for v0.4.6 after design fork is decided, not v0.4.5.

**How to apply:** Before any implementation, verify the original 165a symptom (mk_search prompting while cmk active) — 5-minute code check. Frame task not as "fix prompt" but as "design: is one-click trust acceptable for non-default paths?" Then implement after D-285 fork decides.
