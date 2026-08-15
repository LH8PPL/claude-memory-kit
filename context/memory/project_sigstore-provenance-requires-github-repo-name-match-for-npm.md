---
id: P-SZVF4ZHC
type: project
shape: Timeless
title: Sigstore Provenance Requires GitHub Repo-Name Match for npm Publish
created_at: 2026-07-15T11:51:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ad1515a24346d265f2917255a7e0310b29a1c48692ccd3b372e98fb2aad9da32
related: [sigstore-provenance-validation-requires-repo-package-name-al, sonarcloud-project-key-rename-coordination, release-workflow-tag-driven-automation-via-publish-yml]
---

GitHub Actions sigstore provenance validation blocks npm publish if the GitHub repository name doesn't match the `repository.url` in package.json. The repo name must be synchronized on GitHub before re-running the publish workflow; mismatched names prevent sigstore validation and block upload to npm.

**Why:** Provenance signing validates the publish source; without repo-name identity match, sigstore cannot confirm the package originates from the correct repository.

**How to apply:** When renaming a GitHub repo with an npm release, rename the repo on GitHub first, update local remotes, then re-run publish. Tag creation can precede the rename, but publish cannot.
