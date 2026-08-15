---
id: P-PHFV2EYC
type: project
title: Guardrail — Hook-Based Design vs. MCP Protection
created_at: 2026-06-22T17:50:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 32f55bcc396ccfd621391ba128886decd852adeff8382897294342ba4d4df604
related: [doc-completeness-validator-hook-behavior-coverage-gap, kiro-cli-v3-delete-guardrail-pretooluse-known-limitation, cmk-install-auto-updates-managed-block-version-stamps]
---

The delete-guardrail is implemented as a `preToolUse` hook behavior (not an MCP tool).
- Distinct from MCP's `mk_forget` (two-step confirm for destructive ops in the MCP interface)
- Both protect against deletion, but at different layers

**Why:** Readers and future maintainers may conflate the two protections. Clarity on implementation and scope prevents confusion about which layer is responsible for what.

**How to apply:** Document the guardrail in hook-related docs (e.g., Security section, README hook-behavior subsection). Keep `mk_forget` documented in MCP.md. In code comments or docs, refer to them as distinct mechanisms when explaining deletion protection.
