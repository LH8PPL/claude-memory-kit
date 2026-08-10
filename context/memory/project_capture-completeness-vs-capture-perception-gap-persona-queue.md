---
id: P-DPLXZCXJ
type: project
title: Capture-completeness vs capture-perception gap (persona-queue delay)
created_at: 2026-06-16T10:24:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 700719e541fc9aa8b38839aefce1c7c910d238fcbb202f9955df71bf9e3fc251
related: [d-408-housekeeping-supersedes-d-395, project-dogfooding-principle-use-kit-s-own-mechanisms, memory-review-discipline-before-commit]
---

Complete fact extraction (19 facts + 4 promotions, zero drops) can still *feel* incomplete when cross-project traits are queued in the persona-review system awaiting promotion. With 6 traits parked, the visible persona appears thinner than the work warrants—creating a real product-feel gap ("there should be more") despite comprehensive capture. This is the D-154 queue-drain design working correctly, not a capture failure.

**Why:** User's instinct about incompleteness is valid as a UX signal, but correctly identified as a promotion/visibility issue rather than a missing-facts issue.

**How to apply:** When reviewing capture completeness, check both facts-in-system and facts-in-visible-persona. Queue delays are expected; thinness may reflect pending promotion, not extraction failure.
