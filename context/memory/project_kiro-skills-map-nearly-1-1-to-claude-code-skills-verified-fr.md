---
id: P-4FLCNCaX
type: project
title: Kiro skills map NEARLY 1:1 to Claude Code skills (verified from real files 2026-
created_at: 2026-06-20T21:13:48Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 368bae0a5279122b098b34b9acd90e43b2301e6998a698f03a1e12a66be29457
related: [kiro-has-four-install-surfaces-not-three-the-user-s-correcti, decision-the-user-2026-06-21-the-kit-s-kiro-support-wires-al, correction-to-d-182-2026-06-21-the-survey-s-claim-ide-kiro-h]
---

Kiro skills map NEARLY 1:1 to Claude Code skills (verified from real files 2026-06-21). Both use <skill-name>/SKILL.md with YAML frontmatter (name, description, + body 'You are...'/'Use this skill when'). Kiro skills live at .kiro/skills/<name>/SKILL.md (project, seen in 3fn/DesignerPunk) + ~/.kiro/skills/<name>/SKILL.md (user, seen in the user's own install: python-pro, systematic-debugging, etc — mattpocock-style). The kit's own skills (template/.claude/skills/memory-search + memory-write, also SKILL.md + frontmatter) would PORT DIRECTLY — main diff is the Claude-Code-specific frontmatter fields (context:fork, allowed-tools: mcp__cmk__* Bash(cmk *)) which need translating/dropping for Kiro. Kiro frontmatter seen: name/description/risk/source/date_added. This is the CLEANEST of Kiro's 4 surfaces to install — just copy a SKILL.md dir, no default-agent/hook-format ambiguity.

**Why:** The user's 4-surface correction (hooks/steering/skills/mcp) surfaced skills as a leg the kit's adapter omitted. Real-file inspection shows Kiro skills ≈ Claude Code skills (SKILL.md + frontmatter), so the kit's memory skills port directly — a high-value, low-risk leg that gives the model the memory-search/memory-write capabilities on Kiro the same way as on Claude Code.

**How to apply:** Kiro adapter skills leg: copy the kit's memory-search + memory-write SKILL.md dirs to .kiro/skills/<name>/ (project) or ~/.kiro/skills/<name>/ (user), translating the frontmatter (drop/convert Claude-specific context:fork + allowed-tools; keep name+description; the cmk MCP tools are available via the MCP leg). Verify Kiro reads .kiro/skills automatically + the exact frontmatter it honors before shipping.
