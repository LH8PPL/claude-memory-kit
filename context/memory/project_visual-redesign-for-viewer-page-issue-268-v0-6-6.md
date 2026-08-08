---
id: P-AB9U63CA
aliases: [P-AB9U63CA]
type: project
shape: State
title: 'Visual Redesign for Viewer Page (Issue #268, v0.6.6)'
created_at: 2026-08-05T18:22:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b2330e1c473dc10a21b44a00ada37261234632db9ae45ef7474dccf7c279eccf
---

- **What**: Redesigning the visual layer of `packages/cli/src/viewer-page.html`
- **Issue**: #268
- **Ship target**: v0.6.6 (ships alongside issue #262)
- **Direction memo**: `docs/research/2026-08-04-viewer-visual-direction-memo.md` (settled structure: rows not cards, display tier, overview, dark graph hero, 3-colour cap)
- **Status**: Handoff to design pending (previous attempts from same dev were unsatisfactory; constraints now enforceable)
- **Reference screenshots**: `C:\tmp\cmk-view-refs\after-*.png`, `claude-mem-card-variants.png`, `everos-dash.png`

**Why:** The structure and constraints are now clear and enforceable via validators, so a fresh design pass can improve the visual layer without risk of breaking the contract.

**How to apply:** When resuming this work, reference the memo for direction and check the screenshots to see current state. Handoff to design will need the files and constraints listed below.
