---
id: P-6E53DZRM
type: project
title: Kiro IDE vs CLI hooks (verified quote from an AWS-builders article the user foun
created_at: 2026-06-20T20:48:47Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: eee9bb4286452bb6638040844b5ce3cf748ba227404ce4094890aeb78a97cb43
related: [kiro-has-four-install-surfaces-not-three-the-user-s-correcti, kiro-ide-hooks-are-a-better-fit-for-the-kit-than-i-first-con, decision-the-user-2026-06-21-rework-kiro-support-properly-be]
---

Kiro IDE vs CLI hooks (verified quote from an AWS-builders article the user found): 'The Kiro CLI has its own hook system, configured in the agent configuration file. The event types are similar (agentSpawn, userPromptSubmit, preToolUse, postToolUse, stop), but the configuration is done in JSON instead of natural language. The steering files and MCP servers are SHARED between the IDE and CLI.' So: MCP + steering are shared IDE/CLI; hooks differ (IDE=natural-language UI, CLI=JSON in agent config). This refines D-181: the kit must NOT conflate Kiro IDE and Kiro CLI — they share some files, differ on others. The kit may need a DIFFERENT install path for Kiro than for Claude Code (not a thin profile on the same seam) — Kiro is similar-but-not-same.

**Why:** The user correctly called out that I was confusing Claude Code's model with Kiro's. Kiro IDE and Kiro CLI are two surfaces sharing MCP+steering but differing on hooks. Real working implementations exist (AWS bash-hooks memory, langfuse integration, AgentCore memory blog) that should be studied before designing the kit's Kiro path.

**How to apply:** Deep-research the real Kiro memory implementations (dev.to bash-hooks article, langfuse/kiro-cli, aws-samples prompts repo, AgentCore memory blog) + re-examine whether Kiro needs its own install path distinct from the claude-code seam. Do NOT assume Claude-Code parity. Sources: https://dev.to/aws-builders/building-persistent-memory-for-kiro-with-bash-hooks-4gm8 ; https://langfuse.com/integrations/developer-tools/kiro-cli ; https://github.com/aws-samples/sample-kiro-cli-prompts-for-product-teams ; https://aws.amazon.com/blogs/machine-learning/extending-conversational-memory-in-kiro-cli-using-amazon-bedrock-agentcore-memory/
