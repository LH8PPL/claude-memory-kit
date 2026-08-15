---
id: P-JAP3QEMD
type: project
title: 'kiro-cli V3 Hook Redesign: Guard Dormant, Fallback Active'
created_at: 2026-06-25T12:49:55Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 66d8d9669ec743588353a50b70a004965725c7e298c30466b1dcfc9049a4814a
related: [kiro-v3-hooks-redesigned-first-class-delete-guard-fallback-t, delete-guardrail-memory-protection-via-pretooluse-hook, kiro-cli-v3-delete-guardrail-pretooluse-known-limitation]
---

**V3 hook system change:** kiro-cli V3 (2.9.0+) moved tool-blocking logic from `preToolUse`-style hooks into a `permissions.yaml`-based model. As a result:
- The kit's V2-style `preToolUse` guard does NOT fire on kiro-cli V3 (dormant/no-op)
- However, kiro-cli V3's own native "shell requires approval" prompt covers destructive commands
- Users are not unprotected; the fallback prevents silent data loss

**Task 166** (add first-class V3 guardrail support via `permissions.yaml` deny-rules) is deferred because this fallback is sufficient.

**Why:** Kiro CLI V3's hook redesign is a breaking change for the kit's V2-era `preToolUse` approach, but V3's own safety prompts activate as fallback — users remain protected via a different gate.

**How to apply:** When implementing Task 166, add a `permissions.yaml` deny-rule for memory paths. Document that on V3 during the gap, Kiro's native prompt is the gate; after Task 166, the kit owns the gate. Current: kit's guard works fully on Claude Code + Kiro IDE; on kiro-cli V3, Kiro's approval is fallback.
