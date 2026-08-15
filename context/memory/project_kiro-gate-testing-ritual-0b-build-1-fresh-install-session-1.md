---
id: P-NARQETJP
type: project
title: 'Kiro-Gate Testing Ritual: §0b (build) → §1 (fresh install) → Session 1'
created_at: 2026-06-22T18:27:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 451e9dd337247bd8a6a2f54c9b555639ad6063bd58b59552b3e76d0b0f4b0733
related: [rebuild-artifact-after-bug-fix-without-re-cutting-release, testing-workflow-for-claude-memory-kit-fixes, live-test-workflow-for-kiro-cli-project-fix]
---

**Backup first**: User creates copy (e.g., `kiro-gate` → `failer3-kiro-gate`) before starting, as evidence and recovery point.

**§0b — Build artifact** (user-run):
- Execute: `npm pack` → uninstall global `cmk` → install the `.tgz` → verify `cmk --version`
- Expected output: version `0.4.0` (or current G0 value)
- Hand off: paste `cmk --version` output to assistant

**§1 — Fresh install verification** (next session):
- Create fresh env: `C:\Temp\kiro-gate` (mkdir + git init)
- Install: `cmk install --with-semantic --ide kiro` + run `cmk doctor`
- Run all checks KG1 → KG10 (all 5 Kiro surfaces, all 3 memory tiers)
- **Use global published `cmk` CLI, NOT local dev version**

**Notes**: §1 intentionally writes to `~/.aws` (backup protects against changes). The backup copy (`failer3-kiro-gate`) stays separate; untouched during §1.

**Why:** This is the canonical gate for verifying the published npm artifact works end-to-end in a real environment before release

**How to apply:** When testing a release, follow this sequence exactly; always backup before §0b; ensure §1 uses the global (published) CLI to test actual published behavior, never the local dev version
