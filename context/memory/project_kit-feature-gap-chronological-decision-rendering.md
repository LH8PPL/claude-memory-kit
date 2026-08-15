---
id: P-A6XDaDHA
type: project
title: Kit Feature Gap — Chronological Decision Rendering
created_at: 2026-06-12T12:19:55Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 838b933822c7f1dcbf6d5f4e015815e5c33d2414
related: [decision-journal-view-gap-now-task-147, kit-s-decision-log-manual-maintenance-pattern, kit-produces-facts-not-views-the-decisions-md-gap]
---

The kit auto-captures decisions via `cmk remember --why --how` and stores them as individual facts, but lacks a view rendering them chronologically ("show me this project's decisions in order, with their whys"). The team works around this by manually maintaining DECISION-LOG.md. Squad's `decisions.md` natively provides chronological rendering.

**Why:** That both the kit and Squad independently maintain chronological journals indicates this view type is valuable beyond individual-fact retrieval. The gap is a missed product feature—a natural extension of `cmk digest`.

**How to apply:** If implementing a decision-journal view, choose between: (a) auto-generating from facts, (b) maintaining alongside facts (like D-log), or (c) hybrid. Reference D-log and Squad as case studies.
