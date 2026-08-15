---
id: P-X5DANHNN
type: project
shape: Timeless
title: Kiro Agent Configuration — Local and Global Support
created_at: 2026-07-06T15:27:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9e038175f21c437079f54f40b3be859164f58124c26794b4cfd420e476b5a582
related: [kiro-cli-agent-resolution-requires-global-default, kiro-cli-requires-global-chat-defaultagent-because-hooks-are, kiro-global-agent-config-documented-decision-d-283]
---

Kiro supports both local (project-scoped) and global agents:
- **Local agents**: `.kiro/agents/` directory (project-specific)
- **Global agents**: user's global Kiro config
- **Precedence**: Local agents take precedence over global
- **Official docs**: https://kiro.dev/docs/cli/custom-agents/configuration-reference/

**Why:** Clarifies Kiro supports project-local agent configuration (previously thought global-only). Relevant to claude-memory-kit's Kiro integration and potential in-repo agent config.

**How to apply:** When designing Kiro tooling, remember `.kiro/agents/` is supported and precedence-preferred. Enables storing agent configs in the project repo.
