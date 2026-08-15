---
id: P-FGJMCQNP
type: project
title: v0.3.2 New Validation Gates
created_at: 2026-06-16T09:06:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 843bcf0c52b0a1189170ea8101d36f2831191399384c74636a86665e1eae61b9
related: [cut-gate-verification-probes, cut-gate-pre-release-validation-checklist-g0-g7, task-planning-laning-workflow]
---

v0.3.2 introduces two new validation gate categories:
- **FQ1** (FTS5 fix) — located in §4 of the cut-gate guide
- **DJ1, DJ2, DJ3** (digest + DECISIONS.md) — located in §4c of the cut-gate guide

These gates must be verified during the release cut-gate process.

**Why:** These are new features shipped in 0.3.2; knowing their guide locations ensures they are tested during release validation.

**How to apply:** As you proceed through §4 and §4c, explicitly check for FQ1 and the DJ gates. They are part of the expected "all green" outcome.
