---
id: P-CTVJRZFF
type: project
shape: Timeless
title: System-Written Grants File as Specification
created_at: 2026-07-02T19:33:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 961f433fd3cef3b93701862a007d926f662d47af5f67d564ba9f905fd748d828
related: [claude-code-2-1-198-permission-hook-regression, before-after-config-diff-to-reveal-tool-behavior, kiro-1-0-hook-format-discovery-via-ide-generated-files]
---

When Claude Code prompts instead of auto-approving (even with unchanged config), clicking "Yes" makes CC write `settings.local.json`. This file is the authoritative specification for what the new CC version expects — it documents the required matcher syntax, output fields, and exact format.

Don't guess from changelogs. Read what CC itself wrote.

**Why:** The system documents its own requirements by what it generates. The actual file is more reliable than documentation or version notes.

**How to apply:** When a new CC version rejects the old hook form, prompt user to click "Yes" once. Then read the resulting `settings.local.json` — it will show exact syntax/fields the new version requires.
