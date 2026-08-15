---
id: P-TaFGHHD9
type: project
title: Skills Don't Trigger From CLAUDE.md or Hooks
created_at: 2026-06-18T07:39:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: be22a89f16dc9b081efe3245bf64ca7ec63c786165bf19b7094ad59928a9d644
related: [adopt-third-party-skills-via-installer-personal-tier, kiro-has-four-install-surfaces-not-three-the-user-s-correcti, cmk-tool-invocation-cmk-compress-session-vs-cmk-compress-laz]
---

Skills are NOT invoked by CLAUDE.md references or hook `additionalContext` injections. The actual mechanism:

- **CLAUDE.md:** Can name a skill for semantic reinforcement, but it's a soft suggestion (text the model reads), not a control.
- **Hooks:** Can inject `additionalContext` to nudge ("consider this skill"), but cannot invoke. Model decides.
- **Real trigger:** Skill's own `description` field + auto-discovery from `~/.claude/skills/`.

**Why:** It's non-obvious. Most would expect CLAUDE.md or hooks to be the invocation mechanism. Understanding the real mechanism prevents wasted attempts and false assumptions.

**How to apply:** Don't try to invoke skills via CLAUDE.md or hook text. Diagnose failures: (1) Is it installed to `~/.claude/skills/`? (2) Does its description match the context? Trust auto-discovery and description.
