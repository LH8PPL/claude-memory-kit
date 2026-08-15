---
id: P-5SBBBN6R
type: project
shape: Timeless
title: Platform-Specific Cut-Gate Structure and Scope
created_at: 2026-07-04T07:15:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3df0798c9ed579ffee58308e5339337603542401d3e4a14d7097c6210e29c2a2
related: [claude-memory-kit-supports-3-ide-tool-agents, cut-gate-structure-convention, cmk-version-bumping-convention]
---

When creating platform-specific cut-gate guides (e.g., Cursor, Kiro):
- They verify IDE/platform **surface wiring only** — not the memory core (that's the base `cut-gate.md` + suite)
- They do **not cut the release** (do not bump version/tag; base gate owns §0)
- Platform gates run as green-light checks **before** the base gate's tag is pushed
- Registration: listed in `process/README.md` for doc-registry validation

**Why:** Kiro + Cursor precedents established this separation—surface verification can't block releases; core verification lives in base gate + test suite

**How to apply:** For new IDEs, structure cut-gate as surface-verification-only; do not include version bump or release flow
