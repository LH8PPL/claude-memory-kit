---
id: P-3G3D55C9
type: project
title: Kiro CLI V3 Trust-Model Incompatibility (V2 Config Format)
created_at: 2026-06-23T19:12:24Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 573529f36feb4ade2d3886cdb59333c2a12069abb1f6ad56aa44536e00b78482
related: [kiro-cli-allowedtools-doc-correct-but-still-prompts, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, kiro-cli-mcp-trust-model-and-kit-s-workaround]
---

Kiro CLI is in early-access V3 with a new trust model. The V2 config format (`allowedTools: @cmk` in kiro-cli-agent.mjs) works perfectly in the IDE but does not fully honor in V3 CLI — MCP tools still prompt for permission despite pre-configuration.

**Observed behavior:**
- IDE surface: Works fully (V2 config honored, no prompts)
- CLI surface (V3): Prompts for MCP tool trust even with V2 config present
- Kiro banners indicate "migration tooling… coming soon"

**Temporary workaround:** User clicks "Trust, always allow in this session" to proceed without re-prompting in CLI.

**Next step:** Investigate V3 config format at kiro.dev/docs/cli/v3/ and update kiro-cli-agent.mjs to include both V2 (backward compat) and V3 formats.

**Why:** This is a version transition issue as Kiro shipped V3 early-access mid-flight. The kit's terminal surface remains functional, but version-specific behavior requires updating config. KC1 and KC2 gate proofs confirm the kit's core injection and memory recall work; V3 CLI just needs config format migration.

**How to apply:** When updating kiro-cli-agent.mjs, support both V2 and V3 trust-config formats. Document version-specific behavior in known issues. Not a v0.4.0 blocker — IDE surface (primary) works fully.
