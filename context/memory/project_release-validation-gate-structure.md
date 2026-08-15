---
id: P-9HCCG4RQ
type: project
title: Release Validation Gate Structure
created_at: 2026-06-16T10:56:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f07d7b076c041f51bec8d63194a8b4d881c08b8ffde98b16f90e73ee29fba53d
related: [multi-pass-feature-workflow-for-complex-work, verification-gate-two-phase-approach, v0-4-5-release-workflow]
---

claude-memory-kit releases follow a two-phase validation workflow:
- **Phase 1: Automatable tests** — run multiple test suites (§4: core functionality; §7: extended coverage)
- **Phase 2: Manual in-chat checks** — user review of checks requiring judgment (M0–M3, W1, D-recall, E1 cold-open, R1)

Process: automatable → fix failures → rebuild/re-verify → continue automatable → surface manual checks for user review.

**Why:** Separates repeatable, fast validation from expensive manual review. Unblocks parallel work and provides clear visibility into validation progress.

**How to apply:** Use this two-phase structure for v0.3.3 and future releases. Update test inventories per release. Maintain "automatable first" pattern so user review happens only when needed.
