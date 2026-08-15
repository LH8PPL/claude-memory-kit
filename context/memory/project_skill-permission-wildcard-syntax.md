---
id: P-GWK57K7M
type: project
title: Skill Permission Wildcard Syntax
created_at: 2026-06-26T20:25:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 917f18cb07caf62cf5d694288ee89806a8bbebccbb9847db88341bad2003bdfd
related: [skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, diagnostic-test-allow-list-vs-workspace-trust]
---

Claude Code documentation specifies two forms for Skill permission rules:
- Exact match: `Skill(name)` (e.g., `Skill(memory-write)`)
- Wildcard match: `Skill(name *)` with a **SPACE**, not a colon (e.g., `Skill(memory-write *)`)

The colon form `Skill(name:*)` is valid in Bash/PowerShell but NOT in Claude Code permission rules. Task 169 shipped with `Skill(memory-write:*)` (colon), which may not match correctly.

**Why:** The docs at code.claude.com/docs/en/permissions definitively show the space form. Using the wrong syntax could explain why permission rules appear present but still prompt.

**How to apply:** When fixing or writing Skill rules, use `Skill(name *)` with a space. Verify against official docs if uncertain.
