---
id: P-7GQ4N9NJ
type: project
title: Updating CMK Requires Re-running Bootstrap on Project Files
created_at: 2026-06-18T18:55:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 74de0f363fb251a07127efe54e2eb348db3254a413fa032329ae37b948830119
related: [plugin-install-and-bootstrap-are-separate-one-time-steps, kit-update-workflow-npm-global-per-project-cmk-install, gate-check-g0-cli-version-verification]
---

Updating the global machinery (npm, plugin, or future `/plugin update`) does NOT re-scaffold existing projects' memory files. Users must re-run `bootstrap` in each project after updating to refresh the project scaffold. The plugin update path itself is currently unverified (Task 162 flags it as an open question).

**Why:** The two-step update process (global machinery + per-project scaffold) is not obvious; users will expect a single update command to handle everything and will hit stale memory files.

**How to apply:** In update docs, note that `cmk update` (or equivalent) must be followed by re-running `bootstrap` in each project. Document the npm path fully; verify and document the plugin update path (Task 162).
