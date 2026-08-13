---
id: P-MAJYMMHV
type: feedback
title: research-project selection criteria — declare the bucket
created_at: 2026-06-25T15:33:17Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 8a67998aba7dff9b2e5707b65779841502e33501cee5d1a4470a019043f2a126
related: [three-tier-research-evaluation-system, prior-art-research-discipline-and-filing, scratchpad-inline-html-provenance-is-the-lint-outlier]
---

Research-project selection criteria (state it up front when researching): prefer (1) projects already in our research collection (docs/research/INDEX.md — claude-mem, claude-remember, mem0, Letta, Graphiti, MemPalace, Taskmaster, OpenHands, etc., already vetted as adjacent), then (2) canonical primary-source references for the specific mechanism (e.g. logrotate/anacron/systemd/Postgres-autovacuum for the scheduled-job problem — cited as mechanism refs, not cloned as peers), then (3) new finds. NOT random projects. Declare which bucket each candidate is in and why.

**Why:** The user asked "when you research, is it from projects like ours, ones we already found similar, or random? what's the criteria?" — a real gap: I was mixing our-collection peers + canonical mechanism refs + new finds without stating which was which. Naming the bucket makes the research auditable and keeps it anchored to vetted-adjacent projects rather than drifting to random ones.

**How to apply:** At the start of any research sweep, declare: "cloning from our collection (X,Y,Z — already vetted adjacent) + canonical mechanism refs (A,B — primary source for this problem, not peers) + new candidates (W — because reason)." Tier-1 (our collection) is the gold standard for 'is this relevant to the kit'; tier-2 is for the general mechanism; tier-3 finds get added to docs/research/INDEX.md once vetted.
