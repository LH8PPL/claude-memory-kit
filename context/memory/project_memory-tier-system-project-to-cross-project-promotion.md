---
id: P-YZWV75GZ
type: project
title: 'Memory Tier System: Project-to-Cross-Project Promotion'
created_at: 2026-06-25T12:10:11Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a788348d1c775c8d0c6ec5a98419e3c42b8931f9fa45933e2156fae5bc1d53f4
related: [memory-kit-architecture-complementary-kit-and-claude-md, b3-b4-wedge-test-workflow-cross-project-doctrine-capture-val, always-use-venv-for-python-package-installs]
---

Workspace-level facts (tier 'P') captured via memory-write skill can be promoted to cross-project scope via `cmk lessons promote <id>` or the mk_lessons_promote tool.

Target: LESSONS.md section "Cross-Project Lessons" for standing rules.

**Why:** Allows validated workspace facts to surface as standing rules across all future projects.

**How to apply:** After memory-write captures a workspace fact, promote it via mk_lessons_promote if it applies to all projects (e.g., "always use uv not pip").
