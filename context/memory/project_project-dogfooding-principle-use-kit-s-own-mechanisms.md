---
id: P-3KP9MTUT
type: project
shape: Preference
title: Project Dogfooding Principle — Use Kit's Own Mechanisms
created_at: 2026-07-15T19:04:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cc7a7f0fa3ddbf9eae69de7c4881bea6b68dba510448a99188d94967db89409a
related: [d-343-kit-lacks-mechanism-to-repair-stale-scaffolded-skills, test-anti-pattern-setup-commands-masking-automation, cmk-install-skips-existing-files-cannot-repair-stale-skills]
---

The kit project's core philosophy is "use the kit's own mechanisms, don't hand-edit." Hand-editing (even when effective) violates this principle and is itself evidence of a missing feature.

**Why:** The project's value is that users should be able to trust the kit to manage itself. When the kit maintainer hand-edits, it signals the kit is incomplete.

**How to apply:** Before reaching for manual file operations, check whether a kit command exists. If not, treat the absence as a finding and propose the missing feature (e.g., D-343) rather than working around it.
