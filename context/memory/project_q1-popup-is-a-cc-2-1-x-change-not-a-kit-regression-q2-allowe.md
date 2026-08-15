---
id: P-6HARUCU5
type: project
title: 'Q1: popup is a CC 2.1.x change not a kit regression; Q2: allowed-tools (skill-scoped) ≠ permissions.allow (project-scoped), needn''t match'
created_at: 2026-06-27T18:06:05Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: e75c3c66aa316b6f0d92019b54eb17d2031891797594e1eab69777e740f940be
related: [tension-skill-allowed-tools-pre-grants-mcp-tools-removing-it, allowed-tools-history-task-108-introduced-the-mcp-popup-task, correction-per-tool-mcp-first-use-prompt-within-one-turn-no]
---

CLARIFIED (2026-06-27): (Q1) the MCP popup is a CLAUDE CODE change, NOT a kit regression. Git proof: the skill's allowed-tools MCP entries were added in Task 108 + last changed Task 117 (both months ago); Kiro work (D-195 etc.) was later and didn't touch popup-relevant lines; the config has been byte-stable. It "started today" with zero kit change → it's CC 2.1.x permission-matching tightening (changelog: closed permission-prompt bypass + wildcard fixes). Kit didn't regress; CC changed under it. (Q2) The skill's `allowed-tools` and settings.json `permissions.allow` are DIFFERENT mechanisms with different jobs and DO NOT need to match: allowed-tools = SKILL-SCOPED, temporary grant active only WHILE the skill runs ("grants permission for the listed tools while the skill is active, so Claude can use them without prompting" — per CC docs); permissions.allow = PROJECT-SCOPED, persistent standing rules. They overlap intentionally but aren't identical (permissions.allow has the broader Bash(cmk:*) + Skill() rules a skill can't grant itself; allowed-tools has the narrow per-skill tool set). KEY: they're evaluated by DIFFERENT machinery — the skill's allowed-tools grant ACTUALLY suppresses the MCP popup (proven in v041g/h), while permissions.allow's mcp__cmk__* does NOT on 2.1.x. So Task 171 (adding specific mcp__cmk__ names to permissions.allow) was doing NOTHING for the popup — only the allowed-tools skill grant worked. Making them "match" would not help; they serve different layers by design.

**Why:** The user asked whether the popup came from a kit change (it didn't — git shows months-stable config, so it's CC 2.1.x) and whether allowed-tools must match permissions.allow (it doesn't — they're different-scoped mechanisms evaluated by different machinery, which is why the skill grant suppresses the popup but the project rule doesn't).

**How to apply:** Explain to the user: the popup is CC's behavior change, not our regression. allowed-tools is a temporary skill-scoped grant (suppresses the popup while the skill runs); permissions.allow is persistent project rules (doesn't suppress per-tool MCP prompts on 2.1.x). They needn't match. This confirms Task 171's permissions.allow MCP entries are ineffective for the popup; the real levers are the skill allowed-tools grant, the PermissionRequest hook (testing), or steering to Bash CLI.
