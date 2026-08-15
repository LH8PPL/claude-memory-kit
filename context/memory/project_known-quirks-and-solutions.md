---
id: P-ZKH65YMH
type: project
title: Known Quirks and Solutions
created_at: 2026-06-19T14:33:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d55d1a5add0be28aff6a89fb478e200ca4248c95b88ee65c440689664685641e
related: [version-stamping-and-scaffold-isolation, windows-ebusy-when-updating-cmk-during-claude-code-runtime, claude-memory-kit-update-paths-npm-vs-plugin]
---

**Windows EBUSY:** npm can't overwrite DLLs when loaded. Workaround: close Claude Code before updating.
**Marketplace refresh:** Claude Code plugin marketplace has auto-update OFF — requires manual `/plugin marketplace update`.
**Silent failure:** forgetting per-project re-scaffold. Solution: drift-check in `cmk doctor` flags version mismatches.

**Why:** These surface in real usage and block smooth UX in both paths (or are path-specific friction).

**How to apply:** Document Windows EBUSY upfront in npm guide. Add drift-check to `cmk doctor`. Clarify marketplace refresh in plugin guide.
