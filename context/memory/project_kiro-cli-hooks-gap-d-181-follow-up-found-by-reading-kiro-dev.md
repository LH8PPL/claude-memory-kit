---
id: P-HVL7EQZS
type: project
title: Kiro CLI hooks gap (D-181 follow-up, found by reading kiro.dev/docs/cli/custom-a
created_at: 2026-06-20T20:16:17Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: f03d1be819a916f9e5577e3cd0ded1ff63631b0b3af50ef12812ec9e78d64de1
related: [kiro-cli-auto-loading-verified-d-181-follow-up-kiro-dev-docs, task-50-cross-agent-seam-target-kiro-cli-agent-hooks-agentsp, critical-kiro-on-windows-hook-constraint-live-discovered-202]
---

Kiro CLI hooks gap (D-181 follow-up, found by reading kiro.dev/docs/cli/custom-agents primary docs): Kiro CLI custom agents are MANUALLY SELECTED (kiro-cli --agent <name> or /agent slash command). Hooks defined in .kiro/agents/<name>.json ONLY fire when that agent is explicitly chosen — NOT automatically every session. There is NO documented default-agent mechanism (no default.json, no cli.json default setting). This BREAKS the kit's automatic-every-session model (inject-at-start/capture-at-end with no manual step). The kit's current Kiro profile writes a hooks-only .kiro/agents/cmk.json — which would require the user to run 'kiro-cli --agent cmk' every time for memory to work. MCP + steering ARE automatic (verified: .kiro/settings/mcp.json + .kiro/steering/ load by default); only the HOOKS leg has this manual-selection problem.

**Why:** The kit's whole thesis (D-85/D-164) is memory that works automatically with no manual command. A hook that only fires under a manually-selected agent fails that — the same automatic-path failure class as D-169. The hook schema itself is correct ({hooks:{agentSpawn:[{command}],stop:[{command}]}}) but the DELIVERY mechanism (custom agent) is manual-only.

**How to apply:** Before shipping Kiro hooks as automatic: find whether Kiro CLI has a built-in default agent the kit can extend, OR whether steering files can carry behavioral instructions that substitute for the capture hook, OR document honestly that Kiro hooks require --agent cmk (degraded mode). Do NOT claim Kiro memory is automatic until the hook auto-fires. MCP + steering legs are fine as-is.
