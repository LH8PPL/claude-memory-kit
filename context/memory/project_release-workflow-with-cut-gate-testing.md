---
id: P-KUF6CPPL
type: project
title: Release Workflow with cut-gate Testing
created_at: 2026-06-30T15:17:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8eb58715a99ad40bae61ed2b7bbe966d2107cbdb231fa4164c27155ade2820db
related: [release-workflow-full-sequence-for-v0-4-3-and-future-cuts, release-workflow-and-commands-for-production, release-gate-workflow-and-final-user-control]
---

The release process has 5 steps with clear separation between local testing and publish triggering:
- **Step 1**: Merge branch → main (git operation only; no npm publish, no tag)
- **Step 2**: `npm run release -- minor` (local only; bumps package.json + finalizes CHANGELOG)
- **Step 3**: `git commit "release: v0.4.3"` (local commit)
- **Step 4**: `git push origin main` (normal push to main; run cut-gate test here against real 0.4.3 tarball built via `npm pack`)
- **Step 5**: `git push origin v0.4.3` (tag push = publish trigger; publishes to npm + GitHub Release)

Steps 1–4 are all local + a normal branch push (zero publish risk). Only step 5 triggers the outward publish. If a gate test fails, fix on main and re-pack — the tag is never published.

**Why:** The cut-gate design decouples artifact testing from publishing, allowing full validation of the real, version-correct artifact before the irreversible step (tag push).

**How to apply:** User executes steps 1–4 for local testing and validation. Assistant does not perform merge or tag-push (per CLAUDE.md rule). Proceed to step 5 only after validation passes.
