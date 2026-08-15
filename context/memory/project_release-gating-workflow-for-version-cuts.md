---
id: P-ZHC3BS29
type: project
title: Release Gating Workflow for Version Cuts
created_at: 2026-06-14T07:10:50Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f2537724187de4a7db06d9b59d44e9ec58b3a912
related: [resume-v0-3-1-cut-gate-2-bugs-found-fixed-pr-179-in-flight, v0-3-1-release-final-workflow, pre-session-verification-checklist-structure]
---

Complete release workflow before cutting a new version:
1. **Stress testing**: PR runs 5x stress tests; monitor for failures
2. **CI verification**: All checks pass (CodeQL, etc.)
3. **Install paths verified** on clean build (both must pass):
   - Keyword install: install → doctor (HC-1–8) → remember / search / repair --index → SHA-256-on-disk validation
   - Semantic install (`--with-semantic`): embedder download/cache → HC-8 health → paraphrase recall in hybrid mode
4. **Code review & merge** (after gates 1–3 pass; don't merge until stress is 5/5)
5. **Live-session steps**: Run hooks + MCP tools (CLI-unreachable; user-performed)
6. **Release cut**: `npm run release -- patch` to cut version

**Why:** Each gate catches different classes of bugs. Stress + CI catch logic errors; install-path tests catch deployment/integration issues that CI misses (e.g., title-truncation data-loss bugs now fixed in PR #180).

**How to apply:** Follow this order strictly. Don't merge until both install paths are tested on a clean build. This is the safe path to production.
