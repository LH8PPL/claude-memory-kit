---
id: P-T3EUWXVJ
type: project
shape: State
title: Version 0.5.4 Tarball Ready for Gate Testing
created_at: 2026-07-15T07:03:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e3b652a1894399d62dedf126129002a20cb2ccbe7663eefb28f7b49a3eb0b19e
related: [global-cli-rebuild-and-reinstall-workflow, rebuilding-the-global-cmk-binary-after-code-changes, test-gate-folders-use-numbered-sequence]
---

Package version: **0.5.4** (current)
Tarball location: `packages/cli/lh8ppl-core-memory-kit-0.5.4.tgz`
Used for cut-gate test projects (e.g., `C:\Temp\cut-gate23`) before npm publish.

**Why:** Gate testing requires reproducible installation from the built tarball; avoids npm dependency before validation.

**How to apply:** Point test-project installs to this tarball. After all gate sections pass, publish to npm and tag the main branch.
