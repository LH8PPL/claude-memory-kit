---
id: P-RCETHGSN
type: project
shape: State
title: .claude/ Gitignore Strategy
created_at: 2026-07-22T16:07:36Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c44b47d3f10d39b5c06635853428a480e2285761a9e7e5b324dd20cadeff3579
related: [gitignore-carve-out-for-claude-agents, agent-neutral-names-persist-across-any-rename, claude-skills-gitignore-creates-broken-claude-md-references]
---

`.claude/` is fully gitignored at the repo root because it is "per-developer, not part of the kit" — each developer has personal settings, commands, and scaffolded skills.

**Exception:** `.claude/agents/` is re-included (carve-out in `.gitignore`) and committed to version control. This directory holds versioned, shared agent role definitions: `implementer.md`, `mechanic.md`, `reviewer.md`.

**Stays ignored:** settings, scaffolded skills, commands in other `.claude/` subdirectories. The original gitignore reason is preserved per the decision-trail rule (D-390).

**Why:** Separation ensures the kit remains portable and developer-neutral (no one's personal config leaks) while versioning workflow fixtures (agent roles and split discipline) that need to be stable and shared. Agent definitions are trial infrastructure, not ephemera.

**How to apply:** When adding something to `.claude/`: ask whether it's a shared workflow role or a developer personal preference. Shared → `.claude/agents/`, commit it, ensure it has role-scoped bindings and honest-work discipline. Personal → stay in `.claude/`, stay gitignored. Always preserve the `.claude/agents/` carve-out in `.gitignore` and the rationale in its comment.
