---
id: P-a3WZNTCG
type: project
title: Doc-Completeness Validator — Hook Behavior Coverage Gap
created_at: 2026-06-22T17:50:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9f2219dc5afa3a9081082e0be0d0a96bf046488b272dfec110b6a04d1e2f835c
related: [guardrail-hook-based-design-vs-mcp-protection, kiro-cli-pretooluse-matcher-syntax-literal-strings-only, multi-surface-documentation-architecture]
---

The `validate-doc-completeness` validator checks CLI verbs and MCP tools only.
- Hook behaviors (e.g., `preToolUse`, `postToolUse`) are not validated
- Requires manual doc review for hook-based features

**Why:** The guardrail shipped in #218 as a hook behavior but was missing from README and CLI docs. The validator only checked verb and tool coverage, not hook coverage, so the gap went undetected.

**How to apply:** When adding hook-based features, manually verify documentation completeness across README.md, docs/CLI.md, and docs/ — do not assume the validator will catch all surfaces.
