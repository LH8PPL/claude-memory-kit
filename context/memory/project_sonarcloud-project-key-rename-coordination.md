---
id: P-2BKSH4A9
type: project
shape: Timeless
title: SonarCloud Project Key Rename Coordination
created_at: 2026-07-15T12:23:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f5a11ebf6896f663a42d10b26617b2692e52c378152169773e66650b842b0594
related: [sonarcloud-project-key-update-procedure, sonarcloud-automatic-analysis-must-be-off, sigstore-provenance-requires-github-repo-name-match-for-npm]
---

When renaming a GitHub repository, the SonarCloud project key must be updated in a coordinated sequence to avoid CI failures. **Sequence** (do not reverse): (1) Rename the key in SonarCloud dashboard (Administration → Update Key), confirm it exists; (2) Update sonar-project.properties in the repo to match; (3) Commit and merge. If config is committed before the server-side key exists, scans fail because the client targets a non-existent project key.

**Why:** SonarCloud and local configuration must remain in sync. Pushing config before server-side key is renamed creates a gap where scans fail with 404/not-found.

**How to apply:** Before committing sonar-project.properties changes, verify the new key exists and is active on SonarCloud's dashboard. Always perform server-side rename first.
