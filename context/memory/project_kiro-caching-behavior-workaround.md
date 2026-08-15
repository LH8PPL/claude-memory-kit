---
id: P-A52S4L4E
type: project
title: Kiro Caching Behavior & Workaround
created_at: 2026-06-25T11:21:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1cac541d797b7d79eb538b83a0ad8a548fa446e211d13c85bae1230987aee45f
related: [kiro-requires-full-restart-to-load-updated-hooks, kiro-cli-explicit-save-limitation-known, cli-installation-verification-workflow]
---

Kiro IDE may cache hook commands. If a hook change doesn't take effect after rebuild:
- Global CLI rebuild alone usually suffices (hooks shell out to `cmk` fresh each time)
- If still not working, restart Kiro IDE to force hooks to reload

When hooks don't seem to be executing, restart before investigating deeper.

**Why:** Kiro spawns hook subprocesses, so it caches the *hook definition*, not always the CLI binary. Restart flushes Kiro's internal state.

**How to apply:** If a rebuilt CLI change isn't visible in Kiro hooks, try Kiro restart before troubleshooting further
