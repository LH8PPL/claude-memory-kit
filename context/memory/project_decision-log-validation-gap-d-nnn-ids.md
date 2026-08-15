---
id: P-5CNSQWFN
type: project
shape: State
title: Decision-Log Validation Gap (D-nnn IDs)
created_at: 2026-07-22T08:05:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3686334f5b0a9030ffaa54807c4356fa3dabfddd9ff814dce6ff6d81248452ad
related: [validator-gap-d-nnn-decision-log-citations-not-enforced, validate-references-requires-properly-filed-task-references, validate-docs-citation-gap]
---

`validate-docs` currently verifies ADR/FR/NFR/Task/§ references but NOT `D-nnn` decision-log IDs. This session surfaced drift: D-382 cited before it existed; D-386/387/388 written in sequence without validation. A task to add D-nnn ID checking to the validator is being filed this turn.

**Why:** The validation gap allowed decision-log ID drift to go unnoticed; closing it prevents future drift

**How to apply:** When the D-nnn validator task is assigned, use this as the acceptance criteria; require all D-nnn citations to be validated against their creation date
