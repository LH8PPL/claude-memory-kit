---
id: P-L49CVMaT
type: project
shape: Timeless
title: 'Release Workflow: 250-Disposition Grill-Gate'
created_at: 2026-07-28T08:27:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e44d64e5462dde6e1cb08b760ddfd95031654b4dca05c0c8f2fb66484bff082b
---

The release cut-prep workflow includes a 250-disposition stage controlled by grill-gating. By default, 250 automatically moves to the next lane. However, you can halt/examine it by "grilling" it first—an optional review checkpoint that gates progress if needed.

The full release sequence: merge → CHANGELOG finalization (via release mechanic) → 250 disposition (grill-gated) → tag push (staged).

**Why:** Staged release process with optional review gate; allows intentional checkpoints without blocking automatic forward movement when review isn't needed.

**How to apply:** When preparing releases, remember 250 will move forward automatically unless you explicitly grill (examine/hold) it. Use this when release review is required.
