---
id: P-PAL9VTVG
type: project
shape: Timeless
title: 'Diagnostic Technique: Determine SonarCloud Issue Origin (Repo vs Server)'
created_at: 2026-07-12T18:46:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: af1be35137b3b2159c0f246fc3f2416c38d51cb3ac7707f47f93468f0a8079e3
related: [sonarcloud-server-side-analysis-scope-cannot-be-overridden-r, sonarcloud-project-key-rename-coordination, stress-testing-omitted-for-pure-read-cli-changes]
---

To determine whether a SonarCloud analyzer crash originates from repo-side or server-side configuration, grep the entire repository (source, config files, tests, lcov, package.json) for the artifact/path mentioned in the error. If the artifact is not found anywhere locally, the problem is server-side, and repo-side fixes cannot resolve it.

**Why:** This proves the boundary of what can be fixed repo-side, preventing wasted iteration on repo changes that cannot work. Absence of the artifact locally is definitive proof of server-side origin.

**How to apply:** When SonarCloud analyzer crashes with file/path errors, grep the entire repo for the mentioned string; absence proves server-side origin and points to SonarCloud web UI (Analysis Scope) as the fix location.
