---
id: P-MJBS5JGZ
type: project
shape: Timeless
title: Commit Guardrail Blocks Ambiguous Include/Exclude Instructions
created_at: 2026-07-15T18:12:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a6e84a24b90ca8becbd781a4f2e30ef1f4f4d5708b3c5dcb9c615ce959636f01
related: [version-snapshot-in-recent-md-guards-against-cross-session-a, kit-name-privacy-validator-for-auto-extract, kit-delete-guardrail-false-positive-on-commit-messages]
---

The project has a safety guardrail that detects and blocks commits when the instruction is ambiguous about include/exclude intent. During this session, it flagged the typo "ocluding" (ambiguous for include vs exclude) in the user's commit instruction, blocked the command execution, and rolled back any partial work. The user clarified by explicitly stating "including," and the command succeeded on retry.

**Why:** Prevents silent commits with unclear intent, especially for large-scope operations like `git add -A`.

**How to apply:** Use explicit language in commit instructions (e.g., "commit and push including the memory" or "excluding the memory"). If a command is blocked, clarify your intent using unambiguous include/exclude directives.
