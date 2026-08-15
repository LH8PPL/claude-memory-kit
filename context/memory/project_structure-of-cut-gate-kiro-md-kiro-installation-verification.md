---
id: P-GaPYPMLa
type: project
title: Structure of cut-gate-kiro.md (Kiro Installation Verification Gate)
created_at: 2026-06-21T14:09:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5d2e770391998f5b0bcf79c26ead1cd77050a5750a154c1e0e18f6e666c50528
related: [cut-gate-release-validation-guides-per-agent, cut-gate-backend-pattern-template-4f, claude-memory-kit-supports-3-ide-tool-agents]
---

cut-gate-kiro.md mirrors cut-gate.md with these documented changes:
  - **§0 Build + install**: Same as cut-gate.md (unchanged)
  - **§1 Scaffold + read**: Two specific changes:
    - 2.a: Create new temp project (C:\Temp\kiro-gate instead of C:\Temp\claude-code-gate)
    - 2.b: Run `cmk install --with-semantic --ide kiro` instead of `cmk install --with-semantic`
  - Remaining sections mirror with Kiro surfaces substituted (IDE .kiro.hook files, Amazon-Q CLI agent-config, MCP/steering/skills)

**Why:** Cut-gate docs are manual verification checklists before release; separate files avoid conditional complexity and keep IDE-specific flows self-contained and readable

**How to apply:** Use cut-gate-kiro.md as template for future Kiro gates; maintain parallel structure with cut-gate.md but substitute IDE-specific paths, commands, and verification surfaces
