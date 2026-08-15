---
id: P-M9DH6KYM
type: project
title: Persona Auto-Drain Queue for Medium-Confidence Candidates
created_at: 2026-06-14T19:56:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b1c28837487146f58c545761281f431de1d6ab21b1694c66a0aa5896614d7982
related: [layered-backend-architecture-in-live-persona]
---

Medium-confidence persona candidates automatically promoted on weekly curate pass via `resolvePersonaReviewQueue` wired into `autoDrainQueues`.

**Issue**: Candidates graded medium (inferred, not explicitly stated) were placed in review queue but never drained—preferences stuck and didn't inject into new projects.

**Fix** (commit b43e788):
- Implemented resolvePersonaReviewQueue → autoDrainQueues integration
- Unit + integration test (weeklyCurate → drain → persona path)
- Verified on user's real data: 6 stranded candidates promoted
- Test suite: 1900/1900 passing

**Why:** The wedge test was failing because persona wasn't injecting into new projects; medium-confidence signals were stuck with no escape path.

**How to apply:** Next cold-open should show auto-scaffolding with correct layered structure; new projects will inherit persona without explicit instruction.
