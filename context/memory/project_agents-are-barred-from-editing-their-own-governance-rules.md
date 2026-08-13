---
id: P-W72YU36T
aliases: [P-W72YU36T]
type: project
shape: Timeless
title: Agents Are Barred from Editing Their Own Governance Rules
created_at: 2026-08-10T09:51:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9db6282552e731b61f7c88f59651ea12ce26e5cdf948638d4d1106e39abfe02f
related: [memory-kit-architecture-complementary-kit-and-claude-md, github-about-topics-require-manual-paste, skills-don-t-trigger-from-claude-md-or-hooks]
---

The kit enforces that agents cannot edit CLAUDE.md (the rulebook governing agent behavior). Governance rules must be applied by elevated agent or human authority. This prevents agents from circumventing their own constraints.

**Why:** Self-modification would undermine the constraint system. This is a foundational safety pattern.

**How to apply:** When implementing new governance rules, expect the implementing agent may need elevation or handoff to human/elevated agent for CLAUDE.md edits.
