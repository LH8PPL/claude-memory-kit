---
id: P-L5LP3UW6
type: project
title: Claude Code 2.1.191 Requires Both Skill() Forms in Allow-list
created_at: 2026-06-26T16:10:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 25d78ad2190ad8716aeb1acf49adf5b4afba650c25e8d240a2e875be79bc7a0a
related: [claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, allow-list-entries-centralized-in-settings-hooks-mjs, cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools]
---

Claude Code 2.1.191 (and later) now requires BOTH `Skill(memory-write)` (bare form) AND `Skill(memory-write:*)` (wildcard form) in the allow-list to suppress permission prompts. Prior versions accepted the bare form alone. Without the wildcard form, prompts re-appear on the next tool call.

**Why:** The kit has used only the bare form since Task 90 (byte-unchanged). Claude Code 2.1.x changed its Skill() permission matching logic, requiring the kit to track this upstream change (as it does for Kiro hook-format updates). This is a real breaking change for end-users.

**How to apply:** When emitting allow-list entries for skill-based tools, always emit both forms. The fix is in `settings-hooks.mjs` KIT_ALLOW (the sole write-site for allow-list — both npm and plugin distributions funnel through it). Verify with install-hooks tests (27 tests) and install tests (32 tests).
