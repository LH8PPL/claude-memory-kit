---
id: P-EX7TLaAG
type: project
shape: Timeless
title: SonarCloud Server-Side Analysis Scope Cannot Be Overridden Repo-Side
created_at: 2026-07-12T18:46:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 20577c7fd0b05cb3d6a432e87a0a6f7d3f9dff8dc4f8bc39e51beeb29c2bc72a
related: [diagnostic-technique-determine-sonarcloud-issue-origin-repo, sonarcloud-automatic-analysis-must-be-off, sonarcloud-project-key-rename-coordination]
---

SonarCloud's server-side Analysis Scope settings (stored in the web UI) take precedence over and cannot be overridden by any repo-side changes—file exclusions, sonar.projectBaseDir, or properties in package.json. Stale Windows paths or file inclusions stored in Analysis Scope cause analyzer crashes and persist even after repo-side config changes.

**Why:** The analyzer loads both repo-config and server-config with server-config winning. Once a path is stored in Analysis Scope, it persists until manually cleared from the web UI.

**How to apply:** If repo-side sonarProperties changes don't resolve an analyzer crash or unexpected file scanning, check Analysis Scope in the SonarCloud web UI (Administration → Analysis Scope). Confirm server-side origin by grepping the repo; if the path/artifact isn't present locally, the fix requires the web UI.
