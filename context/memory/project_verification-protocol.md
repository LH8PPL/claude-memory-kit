---
id: P-2DEH535R
type: project
shape: Timeless
title: Verification Protocol
created_at: 2026-07-27T08:39:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ce3b5e8a0c8578ea25fcc029b963d6027dcb75e530eb6f5524ce546901226f1d
---

Tasks undergo dual independent verification: pytest suite + parity flow (Node≡Python byte-identical vectors). Both agents run the full flow independently. Test suite scope: approximately 3,588 tests per run.

**Why:** Documents QA expectations and why independent reviews often catch different issues.

**How to apply:** When a task ships, expect both agents to verify; parity flow output serves as the ultimate durability verification signal.
