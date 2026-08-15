---
id: P-VCL4DAKB
type: project
shape: Timeless
title: Skill Allowed-Tools Must Be Narrow and Boundary-Tested
created_at: 2026-08-01T18:25:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 712a5a57455ad4c2763ec5ddeae78227e95ad0578bde293148b401df42b812f3
related: [kit-shell-permission-command-trust-boundary, cmk-version-bumping-convention, root-cause-skill-md-allowed-tools-frontmatter-triggers-the-a]
---

Skill definitions use `allowed-tools` to restrict operations. Wildcards or overly-broad patterns (e.g., `cmk repair *`) inadvertently allow powerful operations that should require explicit user confirmation (root cause of B3). Rule: enumerate tools by name, never wildcards. Test requirement: verify both sides—allowed tools work, denied tools are blocked. Fix: narrow to `doctor`/`reindex`/`repair --index` only, with bidirectional boundary tests.

**Why:** Over-granted permissions execute powerful commands silently, violating design invariants about which operations must be interactive.

**How to apply:** List allowed tools by full name. Add tests confirming allowed tools are executable AND denied tools are blocked. Do not merge until both sides of the boundary are tested.
