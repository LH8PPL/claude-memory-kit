---
id: P-2XR9VMNM
type: project
title: kiro-cli Agent Configuration and Debugging Techniques
created_at: 2026-06-24T09:37:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ed1bb01465155a494004f1ac5d271dfe69f4fb4e72effc5b6b8ca6be75e3d479
related: [kiro-cli-rejects-bom-in-agent-config-ps-convertto-json-adds, kiro-cli-agent-configuration-and-verification, d-198-fix-agentspawn-hook-now-fires]
---

**Agent location:** `~/.kiro/agents/cmk.json` (not `~/.aws`; this is the D-198 bug now caught by gate check KCG2).

**CLI validation checks (KCG3/KCG4):**
- `kiro-cli agent validate` passes
- `agent list` shows `* cmk Global` (active agent)

**Debugging techniques baked into the gate:**
- **Fire-vs-not probe:** Point a hook at a stdin-logging script to capture whether agent fire events occur; crucial for diagnosing "agent does nothing" issues.
- **BOM trap:** PowerShell `ConvertTo-Json` corrupts agent config JSON; use Node.js instead.
- **"Nothing fires" diagnostic:** Check `agent list` output; if `kiro_default` appears active, the agent is in the wrong location.

**Version gating (Task 166):** V2 fires kiro-cli agents; V3 falls back to Kiro's native prompt.

**Why:** Each check/technique corresponds to a real bug discovered this session (D-198, BOM corruption, location misdiagnosis). Baking them into the gate prevents re-discovery in future debugging.

**How to apply:** Reference gate § KCG2-4 when diagnosing kiro-cli agent issues. Use the BOM workaround when editing agent config in PowerShell.
