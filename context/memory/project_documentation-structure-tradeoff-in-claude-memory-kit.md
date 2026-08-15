---
id: P-PRD9U7T3
type: project
title: Documentation Structure & Tradeoff in claude-memory-kit
created_at: 2026-06-28T07:09:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0d1edb97d40cf484fa0c98e9d81e008a15f2759e965ac0d1996c76e2da0cd99d
related: [npm-tarball-doc-availability-strategy, npm-package-contents-and-documentation-strategy, user-questioned-the-decision-to-mirror-n-bfvneyaq]
---

- **root README** — GitHub front door; lean, concise structure
- **npm README** — package landing page; historically comprehensive with full CLI table (all 33 commands)
- **docs/CLI.md** — authoritative reference for all CLI verbs

The active tradeoff: npm README can either (A) mirror root's lean structure (consistent everywhere, but thinner) or (B) stay comprehensive/standalone (richer for npm visitors, diverges from root). npm visitors can't easily navigate to docs/CLI.md like GitHub visitors can.

**Why:** npm landing page serves a different audience than root — people evaluating the package need enough info to decide without clicks elsewhere. Consistency vs. comprehensiveness at each landing page is a real structural tension in this project.

**How to apply:** When revising landing pages, remember: audience != GitHub viewers. Lean mirrors should restore comprehensiveness somewhere visible, or ensure adjacent reference (docs/CLI.md) is equally discoverable from that landing page.
