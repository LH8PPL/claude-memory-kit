---
id: P-XVB7HWGJ
type: feedback
title: Watch CI on direct-to-main pushes; run full npm test when adding/moving doc files
created_at: 2026-06-28T11:46:55Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: d3dccccccdbad8591cb2ded65e9df2ca5e02c188e3a2dc911fa4fe31676778b0
related: [user-runs-full-stack-semantic-and-crons, claude-md-ci-validator-binding-rule, kg-guard-failed-matcher-pipe-alternation-not-literal]
---

PROCESS FAILURE + LESSON (2026-06-28): the v0.4.1 publish FAILED because docs/KIRO.md (created during the README reorg) was never registered in docs/DOCUMENTATION-MAP.md — validate-doc-registry caught it at publish time. ROOT CAUSE was a process gap, not a missing test: the CI test EXISTS and worked (it failed both README-reorg commits on main at 07:05 + 07:14). The real failure: I pushed the README/KIRO.md work DIRECT-TO-MAIN (docs-only) and did NOT watch CI — main was RED for ~4 hours and I didn't notice until the tag-publish failed. Also: after the reorg I ran only validate-references + validate-doc-completeness locally, NOT the full `npm run lint` (which includes validate-doc-registry). LESSON (binding): (1) direct-to-main pushes STILL run CI — watch it, never assume docs-only is safe; main going red is a stop signal regardless of what changed. (2) When a change adds/moves/renames a doc file, run the FULL `npm test` (or at least `npm run lint`) before pushing — the doc-structure validators (doc-registry, index-completeness, references, doc-completeness) are separate checks; running a subset misses the others. (3) Creating any new docs/*.md (top level), specs/*, repo-root *.md, or docs/journey/* requires adding it to docs/DOCUMENTATION-MAP.md Registry in the SAME commit (validate-doc-registry enforces it). FIX: registered docs/KIRO.md, re-tagged v0.4.1 at the fix commit, force-pushed the tag to re-trigger publish.

**Why:** The v0.4.1 publish failed on a doc-registry validator because a new doc (docs/KIRO.md) wasn't registered and the failing CI on direct-to-main doc pushes was not watched. The test existed and worked; the gap was process — assuming docs-only direct-to-main is safe and running only a subset of validators locally.

**How to apply:** Watch CI on every push including direct-to-main docs commits; a red main is a stop signal. Run the full `npm test`/`npm run lint` (not a hand-picked subset) before pushing any change that adds, moves, or renames a doc file. Register new docs/*.md, specs/*, repo-root *.md, docs/journey/* in docs/DOCUMENTATION-MAP.md in the same commit.
