---
id: P-M2GBXRG3
type: project
title: v0.4.1 Release & Gate Workflow
created_at: 2026-06-26T15:28:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6c8a5ac5b45e17bde4a4a3f43001a372b7c6b5ba0cab9abe8e11b2045c60f60b
related: [release-workflow-tag-timing-after-gates, release-cut-sequencing-and-prerequisites-v0-4-4-pattern, release-cut-workflow-local-isolation-user-tag-push]
---

- Stage 1: `npm run release -- patch` → commit → push (local, not tag)
- Stage 2: `npm pack` + install tarball → verify `cmk --version` = 0.4.1
- Stage 3: Back up tier via Step 0b
- Stage 4: Run standing gates + new ★ gates (NR1: `npm run live-verify:now-roll`, NR2: HC-10 SKIP, NR3)
- Stage 5: Only after all ★ gates pass: push `v0.4.1` tag → CI publishes

**Why:** v0.4.1 introduces new now-roll and discovery gates; staged verification ensures all checks pass before publication

**How to apply:** Follow stages in order; paste results per stage for user diagnostics before moving to next stage
