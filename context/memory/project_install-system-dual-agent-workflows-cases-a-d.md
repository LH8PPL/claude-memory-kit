---
id: P-PJP9Z4B4
type: project
title: Install System Dual-Agent Workflows (Cases A–D)
created_at: 2026-06-21T18:04:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5078fbf31ed40241a75514961900e495d6e3658f31f11ec5f472a1333e3b8219
related: [install-system-requirements-matrix-v0-4-0, conservative-uninstall-scope-managed-surfaces-only-never-con, kit-s-haiku-backend-has-undeclared-claude-cli-dependency]
---

Four concrete use cases that define install system requirements:

**Case A: Claude Code → also Kiro (keep both)**
- Start: `cmk install` done  
- Add: `cmk install --ide kiro`  
- Result: Both `.claude/` and `.kiro/` coexist; shared `context/`; both agents work  

**Case B: Kiro → also Claude Code (keep both)**  
- Start: `cmk install --ide kiro` done  
- Add: `cmk install`  
- Result: Both configs coexist; shared `context/`; both agents work  

**Case C: Claude Code → Kiro (switch, drop Claude Code)**  
- `cmk install --ide kiro` (add Kiro)  
- Verify it works  
- `cmk uninstall` (clean Claude surface)  

**Case D: Kiro → Claude Code (switch, drop Kiro)**  
- `cmk install` (add Claude Code)  
- Verify it works  
- *(Gap: `cmk uninstall --ide kiro` currently missing)*  

Core principle: **additive + idempotent + over-mutation-safe.** Each agent's install only touches its own surfaces; never creates or clobbers the other's.

**Why:** These four cases define the practical multi-agent usage patterns users will encounter. The install system must support all of them cleanly without manual workarounds or file litter.

**How to apply:** When building or validating install logic, verify it satisfies all four cases. The discipline is: each agent only writes its own surfaces; never create or modify the other agent's files, even if absent.
