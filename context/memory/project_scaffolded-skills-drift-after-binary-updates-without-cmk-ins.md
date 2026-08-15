---
id: P-4XHUNa9W
type: project
title: Scaffolded Skills Drift After Binary Updates Without cmk install
created_at: 2026-06-18T06:42:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a9e215f8f73e5bd97db6b05cf280a93771e6c6365516af0ecf9b918be9d6f5df
related: [d-343-kit-lacks-mechanism-to-repair-stale-scaffolded-skills, hc-9-drift-after-claude-code-update-v0-3-4, cmk-install-skips-existing-files-cannot-repair-stale-skills]
---

- **What:** In dogfood repo, both memory-write and memory-search skills drifted from templates: memory-write's SKILL.md was missing entirely; memory-search's SKILL.md was stale (missing `decisions`-scope, weaker trigger descriptions).
- **Root cause:** `cmk install` last run before recent skill template updates shipped; scaffolded skills never refreshed, leaving dogfood install stale.
- **Kit tooling gap:** `cmk doctor` has no health check to detect when installed skills are out of sync with their templates.

**Why:** Stale skills silently under-perform (don't trigger), causing the agent to bypass them and hand-solve instead. This is also a real cmk doctor gap worth addressing for all users.

**How to apply:** In future dogfood sessions, if a skill isn't activating as expected, check whether it has drifted from template. After updating the kit binary, rerun `cmk install` to refresh all scaffolded artifacts. Document as a cmk doctor health-check candidate.
