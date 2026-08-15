---
id: P-5ZSWJRRD
type: project
title: kiro-cli V3 Delete-Guardrail (preToolUse) Known Limitation
created_at: 2026-06-25T12:37:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4b614402e537472e4b04175ebe0cc6562777b6bcbacc4b259f543ea15b05548e
related: [kiro-v3-hooks-redesigned-first-class-delete-guard-fallback-t, kiro-cli-v3-hook-redesign-guard-dormant-fallback-active, guardrail-hook-based-design-vs-mcp-protection]
---

The V3 `preToolUse` delete-guardrail hook does not fire on kiro-cli V3. This is a documented limitation in v0.4.0, not a regression. V3 redesigned the hook layer (Task 166); kiro-cli's built-in shell-approval mechanism covers destructive operations instead.

**Why:** Prevents shipping with an uncaught assumption that the guardrail works everywhere. Limitations must be explicit and justified.

**How to apply:** Document in v0.4.0 release notes. Link to Task 166 redesign. When Task 166 ships, revisit whether the gap can be bridged.
