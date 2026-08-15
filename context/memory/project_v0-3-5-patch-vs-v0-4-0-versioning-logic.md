---
id: P-XXYKQaRS
type: project
title: v0.3.5 patch vs v0.4.0 versioning logic
created_at: 2026-06-19T21:38:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ccf6d7840693f25f2238924ccc2d1bb088a222542c8bb142ff4a31c135cedda0
related: [kit-versioning-uses-lane-themed-releases-not-strict-semver, one-differentiator-per-minor-rule-d-146, down-payment-full-redesign-split-pattern-d-154-precedent-v0]
---

v0.3.x = within-paradigm polish and targeted fixes. v0.4.0 = single committed differentiator (Kiro cross-agent). When a task is important but doesn't warrant re-prioritizing the minor, route to v0.3.5 patch rather than folding into v0.4.0.

**Why:** Preserves single-differentiator rule, ships important fixes sooner, doesn't delay committed work.

**How to apply:** If a fix is wedge-critical but doesn't change v0.4.0's headline (Kiro), slot as v0.3.5. Fold into v0.4.0 only if it's part of the committed differentiator or you're deliberately re-opening the decision.
