---
id: P-CJSMVDZ3
type: project
shape: Timeless
title: D-249 Documentation Walk Checklist
created_at: 2026-07-20T12:46:29Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 856ec8b3e2084aa716706c4410fb50c03bab7f9582a0f32e1573447cc1439c09
related: [documentation-drifts-at-event-boundaries-not-pr-moments, documentation-taxonomy-and-update-responsibility, multi-surface-documentation-architecture]
---

When closing a PR, verify these doc areas match the code changes:
- design.md (specific sections: §6.4b extraction fallback, §7.1.4 stale-replay guard)
- glossary (new terms introduced)
- ARCHITECTURE ("When capture fails" scenarios)
- memory-lifecycle-map (routing points, write-path variants)
- docs/CLAUDE-CODE.md (slash surfaces like /tour)
- README (≥2 bullets)
- npm README (≥2 bullets)

**N/A zones** (skip unless version-specific):
- MCP.md (CLI-only by design)
- Cursor/Codex (no slash surface)
- HEALTH-CHECKS (version-specific only)

**Why:** Prior PR #311 claimed §7.1 docs edit that was never performed. Prevents documentation drift and the overstating-commits anti-pattern.

**How to apply:** Run D-249 walk before merging. Treat as a checklist, not a spot-check.
