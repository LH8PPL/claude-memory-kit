---
id: P-JCRBVWSE
type: project
title: SRE Workflow as Reference Implementation
created_at: 2026-07-01T15:17:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: df7b48191b46558fd68e18139398e76146963908efbc34d4c165186f1438bace
related: [episode-based-architecture-principle-refined, canonical-agent-support-list, post-215-merge-workflow-gate-continuation]
---

SRE agent operates in bounded episodes:
- Receive alert (episode trigger)
- Check application state
- Use MCP/CLI tools for investigation
- Send message to operator
- Execute remediation
- Log actions and outcomes to memory
- Next alert: query memory "seen this before?", yes/no → adjust action accordingly

This is the canonical workflow showing how memory connects discrete episodes into what appears as continuous operation. Kit must support: (1) log action+outcome, (2) retrieve similar past episodes, (3) use feedback to adjust future actions.

**Why:** Concrete spec for kit's interfaces (acquire, retrieve, feedback); grounds requirements in real work, not abstraction.

**How to apply:** When validating kit features or interfaces, test against this workflow: can the SRE agent do all steps today?
