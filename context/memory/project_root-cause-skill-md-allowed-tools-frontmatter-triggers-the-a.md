---
id: P-aDFRNUMD
type: project
title: 'ROOT CAUSE: SKILL.md allowed-tools frontmatter triggers the approval prompt (changelog 3140)'
created_at: 2026-06-27T14:33:29Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: f7a80197e009afab943c424fc2a2345c49a9c640ea2f2a0414d7ce5c6d60c51e
related: [skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c, complete-design-one-permissionrequest-hook-mcp-cmk-skill-mat, skill-fix-works-allowed-tools-removed-now-mcp-cold-start-rac]
---

ROOT CAUSE FOUND for the skill prompt (CC changelog + kit SKILL.md, 2026-06-27): CC changelog line 3140 (v2.1.19): "Changed skills WITHOUT additional permissions or hooks to be allowed WITHOUT requiring approval." => a skill auto-runs prompt-free ONLY IF it declares NO additional permissions. The kit's template/.claude/skills/memory-write/SKILL.md has frontmatter `allowed-tools: mcp__cmk__mk_remember mcp__cmk__mk_forget mcp__cmk__mk_trust Bash(cmk remember *) Bash(cmk forget *) Bash(cmk trust *) Read` — THAT allowed-tools line IS "additional permissions," so CC requires approval ("Use skill /memory-write?"). This is why NO Skill() allow-list rule suppressed it (the prompt is about the skill GRANTING ITSELF TOOLS, not about running the skill; docs line 364: "a skill can grant itself broad tool access" → review/approve). THE FIX (testable): remove the allowed-tools frontmatter from the kit's SKILL.md (both memory-write and memory-search). It is REDUNDANT — the kit already allow-lists mcp__cmk__* + Bash(cmk:*) in settings.json (+ enabledMcpjsonServers:[cmk]), so the tools are already granted project-wide; the skill's own allowed-tools adds nothing but the approval prompt. Also relevant: changelog line 982 (v2.1.139) "Fixed Skill(name *) prefix wildcard" confirms space-form is the real syntax but it's moot here since the prompt isn't allow-list-governed. NEXT: test — fresh folder, SKILL.md with allowed-tools removed, confirm the skill runs prompt-free.

**Why:** The CC changelog states skills with no additional permissions run without approval; the kit's SKILL.md declares allowed-tools (additional permissions), which forces the Use-skill approval. This is the real, primary-source-grounded cause — not rule syntax or workspace trust — and explains why every allow-list attempt failed.

**How to apply:** Remove allowed-tools from template/.claude/skills/memory-write/SKILL.md (+ memory-search). It is redundant given settings.json already grants mcp__cmk__* + Bash(cmk:*) + enabledMcpjsonServers:[cmk]. Test on a fresh folder: skill should run prompt-free. Bundle with Task 172's MCP fix. Re-frame Task 169 (allow-list) as misdirected in DECISION-LOG.
