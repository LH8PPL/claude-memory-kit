---
id: P-A64FS6AK
type: project
shape: Timeless
title: Agent Definitions Load at Session Start, Not Invokable in That Session
created_at: 2026-07-22T17:52:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: da54ecaec64f9875da748516274f869a29f0bf81aad2cca34495df29cd70b25b
related: [kiro-cli-agent-tools-field-configuration-fix, context-snapshot-frozen-at-session-start, kiro-cli-hooks-gap-d-181-follow-up-found-by-reading-kiro-dev]
---

When `.claude/agents/` definitions are created or updated in a session, they are loaded at session start. However, the *same* session cannot invoke them by name — named references to agent definitions only work in *subsequent* sessions.

Workaround: In the session where agents are defined/updated, inline the agent rules explicitly (model pinning, role rules, instructions) rather than referencing by name. Subsequent sessions can use named invocation.

**Why:** Understanding agent-definition lifecycle is critical when orchestrating multi-agent workflows within a single session. This quirk would otherwise cause unexpected failures or require awkward manual workarounds.

**How to apply:** When spinning up a new multi-agent feature in one session, do not rely on named agent invocation; inlinethe agent configuration directly. In the next session, named invocation is available and works as expected.
