---
id: P-A2UDWRDF
type: project
shape: State
title: Primary-Source Verification Protocol
created_at: 2026-07-12T11:58:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 416608491675a75304f1ecbec008cb03f6d2cfa5b97ef989864828dd7d60544a
related: [task-165a-is-design-decision-linked-to-d-285-not-mechanical, design-contract-enforcement-via-tests-code, d-364-discipline-for-external-source-claims]
---

Before asserting that a task is complete or correct, or diagnosing whether behavior is a bug, verify against primary sources: code (with line numbers), task spec (exact deliverable match), and design intent. Assertions without this verification are provisional. The project refers to this principle as "did you check the primary source?"

**Why:** Intuition without source verification is unreliable; primary sources are ground truth. Prevents confident-but-wrong assessments.

**How to apply:** When evaluating task/feature status, check primary sources FIRST. Only after verification, assert conclusions.
