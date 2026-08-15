---
id: P-aZDaSLaC
type: project
title: Cut-Gate Must Test Published Artifact, Not Repo Code
created_at: 2026-06-18T08:38:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bc5fc1c73db8d07defb8a2adc9420709dade7d30871ae78de27acc30a3fb5b5f
related: [repack-and-reinstall-before-gating-release, global-cmk-artifact-version-and-template-sync, npm-install-g-silent-failure-when-run-from-repo-directory]
---

The cut-gate testing harness has an explicit rule: never test against the repo binary. Always test against the published, globally-installed tarball. Testing the wrong version (repo vs. published) is a known failure mode that can mask bugs.

**Why:** The cut-gate's purpose is to verify the live artifact users will receive. Testing repo code means missing bugs that only appear in the published tarball, defeating the test's entire purpose.

**How to apply:** Before running the cut-gate, ensure the global `cmk` is freshly installed from the tarball and matches the version under test. Verify with `cmk --version` and spot-check key files (e.g., confirm `isJournalStale` exists in `lazy-compress.mjs`). Never attempt to run the cut-gate against repo code or a stale global install.
