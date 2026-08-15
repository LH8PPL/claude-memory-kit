---
id: P-MBNMDFSU
type: project
shape: Timeless
title: shouldAutoSelectXSidecar() Selector Function Pattern
created_at: 2026-07-05T16:48:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: de084c309981b562425e4f449a614b1cba1c73bd8fa4b43b67a64b4cfb47c4be
related: [auto-detect-priority-chain-proven-from-codemem, kiro-cli-env-passing-limitation]
---

Isolate environment probing (PATH checks, env var reads, file existence) into a pure selector function, separate from routing/invocation logic. This makes routing unit-testable without filesystem side effects and clarifies the separation between "what's available" and "what we choose to use."

**Why:** Improves testability, maintainability, and code clarity. codemem uses this pattern implicitly; explicit extraction is recommended for the kit's architecture.

**How to apply:** Create a selector function; have makeBackend call it and route based on its result. Unit tests can mock the selector without touching the filesystem.
