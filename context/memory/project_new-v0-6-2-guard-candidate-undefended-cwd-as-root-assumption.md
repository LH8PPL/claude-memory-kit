---
id: P-TMSFZF2V
type: project
shape: State
title: New v0.6.2 Guard Candidate – Undefended CWD-as-Root Assumption
created_at: 2026-07-21T12:20:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e29a7bc9055e34b7216fb8d220ec85a7dd2bf53f5bc05ba0bda58e9822e37abd
related: [pre-commit-pii-validator-on-context-commits, core-memory-kit-dogfoods-its-own-memory-system, project-dogfooding-principle-use-kit-s-own-mechanisms]
---

The kit treats any cwd as a potential project root and scaffolds memory tiers accordingly. This exposes artifact classes that standard .gitignore patterns don't cover (e.g., agent-scaffolded memory, stray `.core-memory-kit/` directories). A name guard caught a stray artifact before this session.

**Why:** The exposure is real and undefended. Formalizing a guard closes the gap and prevents accidental commits of kit-specific scaffolding.

**How to apply:** For v0.6.2, design a guard that detects and rejects kit-scaffolded artifact names (`.core-memory-kit/`, `.agents/`, etc.) to prevent false positives when the kit runs in non-project directories.
