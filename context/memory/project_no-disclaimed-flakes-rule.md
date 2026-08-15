---
id: P-Z7GUFTW2
type: project
shape: State
title: No-Disclaimed-Flakes Rule
created_at: 2026-07-13T15:22:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2325b6af0bc03e8ef90201ee99de2f5307e3d2a4cf2dc39fbb19baf1cf6292ca
related: [stress-gate-process-for-pr-merge, cmk-hook-capture-fails-during-stress-gate, cut-gate-process-validated-release-quality]
---

Never dismiss a test failure as "flaky" without investigation. Every failing test must be root-caused. Intermittent test behavior indicates an underlying bug or environment issue, not a valid reason to ignore the failure.

**Why:** Prevents real bugs from hiding behind flakiness claims; maintains test suite integrity and confidence.

**How to apply:** When a test fails (stress gate or otherwise), always investigate. Document the root cause. Do not skip investigation.
