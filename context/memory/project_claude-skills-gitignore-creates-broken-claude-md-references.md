---
id: P-2TSXUZHR
type: project
title: '`.claude/skills/` Gitignore Creates Broken CLAUDE.md References on Clone'
created_at: 2026-06-18T07:19:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 18208e25ae9c291bcd9269bc75487b84d661b1b594cf4f08aaaae9de21f71587
related: [adopt-third-party-skills-via-installer-personal-tier, cut-gate-v050-scaffold-gitignore-transcript-leak, modular-skill-architecture-read-write-separation]
---

- `.claude/` directory is **fully gitignored** — nothing travels with `git clone`
- CLAUDE.md (which IS committed) contains 4+ references to `.claude/skills/...` — the `tdd` pointer, `codebase-design` pointer, skill-agency table, memory-write instructions
- Kit's own skills (`memory-write`, `memory-search`) **self-heal** via `cmk install` on fresh clone
- The 6 mattpocock dev-tooling skills (`tdd`, `diagnosing-bugs`, `grilling`, `code-review-excellence`, `domain-modeling`, `prototype`) were manually copied in and do **NOT** self-heal — they're just **missing on fresh clone**
- **Result**: CLAUDE.md on a fresh machine tells the AI to invoke skills from `.claude/skills/...`, but that path doesn't exist
- Root cause: D-170 deliberately gitignored `.claude/` with policy "local per-machine, never shipped to public repo" — but this orphaned the committed instructions that reference it

**Why:** The dev-skills are durable tools referenced in a standing instruction document. When the tools are gitignored but the doc is committed, fresh clones get broken pointers silently. This is structural drift, not content drift.

**How to apply:** User decision required (policy fork): **(A)** commit dev-tooling skills (travel with clone, but publish mattpocock's content in public repo), **(B)** add automated setup step like `scripts/setup-dev-skills.mjs` (keeps skills out of git, adds manual step), or **(C)** make CLAUDE.md pointers gracefully degrade (honest but weak). This reverses D-170, so it's a deliberate choice.
