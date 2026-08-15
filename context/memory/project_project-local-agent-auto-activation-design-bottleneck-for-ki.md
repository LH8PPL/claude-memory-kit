---
id: P-SA7QUVJZ
type: project
shape: State
title: Project-Local Agent Auto-Activation — Design Bottleneck for Kiro/CMK
created_at: 2026-07-06T15:29:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 085ca5f66265a58b0b90bb4df1f703d0551d4faaa457ef7c5fb8580d6d629ab5
related: [kiro-agent-must-be-global-empirically-validated, kiro-cli-requires-global-chat-defaultagent-because-hooks-are, kiro-cli-agent-resolution-requires-global-default]
---

**Open Question:** Does project-local `.kiro/agents/cmk.json` auto-activate (hooks fire) when user runs `kiro-cli` with NO global `chat.defaultAgent`?

**Current State:**
- Agent FILES can be project-local in `.kiro/agents/` (documented; precedence over global)
- Activation currently requires global `chat.defaultAgent: cmk` (forced global)

**Impact:**
- If YES (auto-activates) → achieve Claude-Code parity: fully repo-portable, no ~/.kiro global footprint
- If NO → design constraint: activation stays global; agent file can still move local (smaller improvement)

**Test Approach:** 5-case empirical matrix with sentinel hooks in project-local agent config; headless `kiro-cli chat --no-interactive` runs with varying (global default, local agent, explicit flag) combos. **Case A (no global + local agent present + no flag) is linchpin:**—if hooks fire, auto-activation confirmed.

**Why:** Docs do not clarify auto-activation behavior for project-local agents. This gap blocks understanding whether Kiro can achieve full repo portability and parity with Claude Code. User is committing to empirical testing to resolve this design question.

**How to apply:** Run the 5-case test matrix. **Case A hooks fire** = auto-activation works = proceed to implementation task for project-local agent deployment. **Case A no hooks fire** = design constraint confirmed = document activation requirement; pursue smaller agent-file cleanup separately.
