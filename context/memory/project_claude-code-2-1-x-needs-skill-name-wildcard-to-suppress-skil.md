---
id: P-BU4L6RGR
type: project
title: Claude Code 2.1.x needs Skill(name:*) wildcard to suppress skill prompts
created_at: 2026-06-26T16:30:12Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 7ca1eea30399ca287298abd05e70d46acf7d1823853f9f4877c692e6081bb217
related: [claude-code-2-1-191-requires-both-skill-forms-in-allow-list, cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools, skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c]
---

Claude Code 2.1.x changed skill-permission matching: the bare Skill(<name>) allow-list rule alone NO LONGER suppresses the "Use skill?" approval prompt — it now ALSO needs the Skill(<name>:*) wildcard form. Ground truth: when a user clicks "allow for this project", Claude Code itself writes BOTH Skill(memory-write) AND Skill(memory-write:*) into settings.local.json. The kit (settings-hooks.mjs KIT_ALLOW) now writes both forms for memory-write + memory-search. settings.json is still honored (permissions merge across settings.json + settings.local.json). The Skill() permission syntax is UNDOCUMENTED in the CC docs (a confirmed gap) — CC's own write-behavior is the spec.

**Why:** The v0.4.1 cut-gate caught the kit's prompt-free capture breaking on CC 2.1.191 — the bare Skill(memory-write) the kit shipped since Task 90 stopped working. This is upstream format drift the kit must track (like Kiro hook formats), and it's invisible to unit tests (no test drives a live CC skill-approval), so only the live gate caught it.

**How to apply:** When allow-listing a skill for Claude Code, write BOTH Skill(<name>) AND Skill(<name>:*). If a 'Use skill?' prompt appears despite an allow entry, check whether CC wrote a settings.local.json with the :* form (that's the tell). The Skill() syntax is undocumented, so verify against what CC writes itself, not the docs. Re-check this on future CC version bumps — skill-permission matching has changed before and may again.
