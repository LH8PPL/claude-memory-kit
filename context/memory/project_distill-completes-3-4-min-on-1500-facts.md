---
id: P-X2MBMQ4R
type: project
shape: Timeless
title: Distill Completes ~3.4 Min On 1500 Facts
created_at: 2026-07-08T12:43:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cceabbbf6bc44ec3314f2505a235c6a5ca6bd55288977c76ea2ff85096c5cdab
related: [nightly-cron-fails-due-to-waketorun-false, stress-test-suite-timing, test-repo-1455-facts-activated-semantic-mode-today]
---

Current repo baseline: semantic distill completes in ~3.4 minutes on 1494 facts (when successful)

**Why:** Essential baseline for cron timeout planning and diagnosing unexpected slowness

**How to apply:** Set cron task timeout > 4 min; if actual time grows beyond baseline, investigate
