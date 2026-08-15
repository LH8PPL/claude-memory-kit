---
id: P-7USAABP2
type: project
title: Multi-Surface Documentation Architecture
created_at: 2026-06-25T13:15:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b040b49b62960691af799baf6dcd7882f83701b8d0b0cc255468fbb9d7e75c85
related: [documentation-taxonomy-and-update-responsibility, doc-completeness-validator-hook-behavior-coverage-gap, doc-validation-system-metrics]
---

The project maintains coordinated documentation across ~10 surfaces:
- **Top-level:** README.md, CHANGELOG, DECISION-LOG, HEALTH-CHECKS.md, RESUME-HERE.md
- **Package docs:** packages/cli/README.md
- **Detailed guides:** docs/ (CLI.md, MCP.md, process/cut-gate-kiro.md)
- **Specifications:** specs/ (design.md, tasks.md)

During releases, all surfaces are updated and synchronized. Validators (checking references, doc-completeness, index accuracy) are run to ensure consistency.

**Why:** The tool supports multiple agents (Claude Code, Kiro IDE, kiro-cli), so docs must span multiple entry points and use cases. Validators prevent drift as the codebase evolves.

**How to apply:** When shipping a release, plan to touch all ~10 surfaces. After updates, run the validator suite. Treat doc sync as part of release QA.
