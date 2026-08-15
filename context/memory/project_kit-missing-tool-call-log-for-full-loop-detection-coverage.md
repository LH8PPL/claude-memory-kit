---
id: P-GWWGT2G6
type: project
shape: State
title: Kit Missing Tool-Call Log for Full Loop-Detection Coverage
created_at: 2026-07-22T17:04:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f9992e6c6d40732403c533957bd38de5c722b3c20060a5067ecb3154247690b2
related: [octopoda-loop-detection-code-verified-findings, loop-detection-research-feeds-task-250-and-task-212]
---

Kit writes audit.log, extract.log, and DECISIONS.md, which feed most of Octopoda's classifiers. Retry/nondeterminism detectors need a **tool-call log** (individual tool invocations, retries, outcomes) not yet implemented.

**Why:** Task 212 and Task 250 reference these detectors. Without tool-call logging, the kit can feed only "pure event log" classifiers, limiting detection scope.

**How to apply:** If implementing Task 212's full classifier suite, prioritize adding tool-call logging based on impact to Task 250's failure-detection requirements.
