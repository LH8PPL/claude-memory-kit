---
id: P-7YSaPD3V
type: project
shape: Preference
title: Diagnose CI Failures Before Rerunning
created_at: 2026-08-02T18:26:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fabb0cc6e35205f23258c89ba6a63c2a132dcf03c6e65f299cb9224aa330bd78
---

Team discipline: always read logs to confirm a red check is transient (network blip, registry issue) before rerunning, so real failures never get waved off as noise.

**Why:** Prevents false negatives—a real bug should never hide under assumption of transience. Protects signal integrity.

**How to apply:** When triaging failures and proposing auto-retry mechanisms, recognize that retries should handle the transient class (failures after 3 retries are real signals worth human attention), not eliminate human diagnosis.
