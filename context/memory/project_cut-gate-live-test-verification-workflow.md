---
id: P-XSE9J4SZ
type: project
title: Cut-Gate Live-Test Verification Workflow
created_at: 2026-06-14T04:18:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0682d6b919a7f17268846b382d2c34f494ab2781
related: [hook-boundary-implementation-gap-privacy-strip-example, live-cut-gate-requirement-unit-green-works-on-real-input, claude-memory-kit-fix-verification-protocol-v0-4-3]
---

- Live-test phase before tagging discovers real bugs that automated test suites miss (e.g., 1857+ tests did not catch `cmk repair --index` seam-injection or `<private>` leaking to files)
- Fixes validated with TDD + file-content verification + live-proof + skill-review validation
- File-creation verification is critical—`<private>` leak surfaced on-disk, not in code review

**Why:** Live testing plus on-disk file verification surfaces boundary violations and single-point-of-enforcement failures that automated tests alone cannot detect

**How to apply:** For any future cut-gate, include live-test phase before tagging; always verify created files match expected content and do not contain unintended markers
