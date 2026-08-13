---
id: P-SaAAX7XL
type: project
title: Claude-Memory-Kit Update Paths (npm vs Plugin)
created_at: 2026-06-19T14:33:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 597608ee38627d685f9f25477ab99835681a8c0d78334defc750e8ad823d35ac
related: [plugin-install-and-bootstrap-are-separate-one-time-steps, updating-cmk-requires-re-running-bootstrap-on-project-files, kit-update-workflow-npm-global-per-project-cmk-install]
---

Two parallel update workflows with identical structure:
- **npm path (Path A):** `npm install -g @latest` → `cmk install` per project → `cmk doctor` verify
- **plugin path (Path B):** `/plugin marketplace update` → `/plugin update` → `/reload-plugins` → `/claude-memory-kit:bootstrap` per project

Both paths require re-scaffolding each affected project (non-obvious pain point).

**Why:** This decision point (which path to document/support) requires honest accounting of both user experiences. Both paths share the same fundamental workflow; both have identical "forgotten per-project step" failure mode.

**How to apply:** Use this when choosing documentation scope. Remember: npm path could collapse to `cmk update` wrapper (with EBUSY guidance baked in); plugin path is constrained by Claude Code's own command set.
