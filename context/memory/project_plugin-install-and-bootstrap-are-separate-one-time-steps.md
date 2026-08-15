---
id: P-5PJXVSSG
type: project
title: Plugin Install and Bootstrap Are Separate One-Time Steps
created_at: 2026-06-18T18:55:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b63aabbf1dcacd25607c3304b0b6a747991bf69e92e1faa67e56b4c858551fe3
related: [updating-cmk-requires-re-running-bootstrap-on-project-files, claude-memory-kit-update-paths-npm-vs-plugin, kit-update-workflow-npm-global-per-project-cmk-install]
---

`/plugin install` provides the global machinery (hooks + skills) once per Claude Code instance. `bootstrap` scaffolds the per-project memory files (`context/` directory) once per project. These are distinct architectural concerns (verified in ADR-0005 + bootstrap skill docs). The plugin-path equivalent of `cmk install` (npm) is the two-step dance: npm install + per-project bootstrap.

**Why:** Clarifies why two commands are required and prevents confusion about whether bootstrap is redundant or a plugin issue.

**How to apply:** Document both as distinct required steps in the README/QUICKSTART. Emphasize that either path (npm or plugin) requires both machinery setup AND per-project scaffolding.
