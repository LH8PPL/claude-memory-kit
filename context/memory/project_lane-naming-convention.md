---
id: P-aL9aSS6L
aliases: [P-aL9aSS6L]
type: project
shape: Timeless
title: Lane Naming Convention
created_at: 2026-08-07T20:17:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 63815cc05b3a0c998da931e344123902f41f623431b46fa48f3f5a06ce6bdb6d
---

A lane without a digit is not a lane. Lanes must carry numeric identifiers (e.g., "v0.6.6" is valid; "candidate" or "v0.7" without a cut number creates ambiguity). Without concrete naming, lanes decay into the same rot as unnoticed fired triggers.

**Why:** D-431: a fuzzy lane caused tasks 47 + 48 to sit unfixed for three weeks because their target was ambiguously named. Concrete naming ("v0.6.6") grounds actual commitment.

**How to apply:** When assigning or referring to lanes in RELEASE-PLAN, ensure each carries a full version identifier (major.minor.patch). If a lane is vague, re-clarify and re-name before relying on it.
