---
id: P-FRTKRVQS
type: project
shape: Timeless
title: Adapter Architecture — Per-Profile Seam, Zero Bespoke Code
created_at: 2026-07-04T07:05:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: eb03fa8b6d4f9279751e8bd4f22be5181b92d15aad42c488da62487970bdb666
related: [cursor-adapter-proves-generic-per-profile-seam-works, task-196-cursor-adapter-shipped-and-merg-mv4b4wqp, claude-memory-kit-supports-3-ide-tool-agents]
---

New adapters (e.g., Cursor) ride the generic per-profile seam with zero adapter-specific code in core.

Pattern: adapters provide profile hooks; core routes through a single unified seam. No special cases in main logic.

**Why:** Reduces maintenance burden and bug surface; each adapter is isolated. Cursor shipped zero-defect via this pattern (PR #254).

**How to apply:** When adding a new agent, define its profile hooks and wire them at the seam; core routing is already generic.
