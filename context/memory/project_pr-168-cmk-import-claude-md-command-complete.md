---
id: P-AXU3YSXC
type: project
title: 'PR #168 - cmk import-claude-md Command Complete'
created_at: 2026-06-12T15:16:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: aec23b8319f4e14a5e8ee554df644e174fdcf25b
related: [design-lesson-numbering-system-d-in-claude-memory-kit]
---

**Command**: `cmk import-claude-md` parses CLAUDE.md, .cursorrules, or AGENTS.md files into typed granular facts

**Implementation**: All facts routed through `writeFact()` to reuse shared safety (Poison_Guard, home-path sanitization, dedup, INDEX reindex, audit) rather than re-implement — applying D-125 design principle

**Features**: Type inference from nearest heading; ignores code fences and managed blocks; `--dry-run` previews; `--yes` applies

**Verification**: 1756/1756 suite; 24 boundary tests; live-tested on repo's own CLAUDE.md (135 facts imported, searchable, 135/135 skipped on re-run, doctor clean); stress gate consciously not run (D-120 surface-scoped precedent, documented in PR body)

**Issues found & fixed** (6 total): slug-collision fact loss; username leak via absolute `--file` paths (D-51 class); hidden error count; dry-run audit writes (preview purity violation); read-source-failed success-shaped message. All pinned with tests.

**Status**: Ready for merge; awaiting explicit user approval ("Say 'merge it'")

**Why:** Completed feature ready for merge; implementation demonstrates safe fact-import pattern and reuse-at-design-time principle

**How to apply:** Reference when implementing similar fact import/export features; understand design-pattern routing through writeFact() for safety
