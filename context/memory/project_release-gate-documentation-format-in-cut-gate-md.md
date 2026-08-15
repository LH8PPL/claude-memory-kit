---
id: P-C2GVaY4G
type: project
title: Release Gate Documentation Format in cut-gate.md
created_at: 2026-07-02T18:50:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b9804f269bef906588ed37517065333ff206bc20d61116ecb49598d0035ef438
related: [cut-gate-testing-guide-manual-release-qa, cut-gate-backend-pattern-template-4f, documentation-map-spine-drifts-while-decision-log-stays-curr]
---

Per-version release gates are documented in `docs/process/cut-gate.md` with a consistent structure:
- **Cutting now** banner — identifies current version and notes any prior versions as "Prior banner" blocks per decision-trail rule
- **Also new in vX.Y.Z** summary table — lists checks (numbered TV#, MC#, etc.) with task references, what each verifies, reachability
- **Detailed gate body** — runnable probes with specific commands and expected outcomes
- **Manual flags** — explicitly marked checks that require human judgment (e.g., live-Haiku verification)
- **Final verdict checklist** — cut-blocker list; notes which gates are deterministic vs. live-Haiku/manual

Existing gate for v0.3.2 established the format; v0.4.4 follows the same pattern.

**Why:** The format is the living standard for release gates in this project. A future version gate will follow the same structure and conventions. The format ensures gates are repeatable, auditable, and clear about which checks are manual vs. deterministic.

**How to apply:** When documenting a new release gate, mirror the structure of v0.4.4's gate section: summary table → detailed probes → manual flags → verdict checklist. Reference task numbers and use the "Also new in vX.Y.Z" heading.
