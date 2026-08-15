---
id: P-NHPPPXGD
type: project
title: QA Verification Discipline Before Release
created_at: 2026-06-11T21:47:04Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f7c5d00e6a6b5f4670877e38cc98a7b76aa7c00f
related: [review-based-decision-correction, architecture-decisions-recorded-in-adrs, sonarcloud-hotspot-review-mark-safe-with-comment]
---

Before shipping, each finding is: (1) verified for authenticity ("is this real?"), (2) marked SAFE with justification or queued for fix, (3) logged in decision record (e.g., D-128). No release ships until all findings triaged.

**Why:** Catches false positives; provides audit trail for future readers auditing why each decision was made.

**How to apply:** Apply to all future releases. Every finding gets a written justification; every decision gets documented.
