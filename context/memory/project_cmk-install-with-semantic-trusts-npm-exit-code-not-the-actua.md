---
id: P-EEFMZVXB
type: project
title: cmk install --with-semantic trusts npm exit code not the actual embedder import (Task 170)
created_at: 2026-06-26T16:57:03Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: ce49431b39f9b57f79cfb0bcd65f1e5d42a759d866feb58e7c2fa7dc736e9cb7
related: [misleading-embedder-unavailable-note-fires-on-keyword-only-s, mcp-serve-is-long-lived-restart-after-rebuild-or-you-test-st, ebusy-lock-on-better-sqlite3-node-during-global-install]
---

BUG (v0.4.1 cut-gate, install.mjs:579): `cmk install --with-semantic` FALSELY reports 'semantic NOT enabled' and skips setting default_mode:hybrid when `npm install -g @huggingface/transformers` exits non-zero — but a non-zero exit is often a benign CLEANUP EBUSY (a locked leftover temp DLL like sharp-win32-x64/libvips-42.dll) AFTER the package actually installed successfully. Proven: the embedder imported fine + `cmk search --mode semantic` returned results despite the 'failed' message. The kit trusted npm's exit code instead of verifying the embedder actually imports (the D-199 class — verify the thing worked, not the command's exit). FIX: after the npm install, PROBE whether @huggingface/transformers imports; if it does, enable hybrid regardless of npm's exit code. Filed as Task 170.

**Why:** The v0.4.1 cut-gate showed --with-semantic reporting failure while semantic search actually worked. This is the D-199 class (a tool's exit/success not matching reality) and it bites real Windows users: a locked-DLL cleanup EBUSY after a successful install makes the kit silently NOT enable semantic, even though the embedder is present and functional. The user caught it by asking 'are you sure semantic is not working?'.

**How to apply:** In install.mjs withSemantic branch: don't bail on npm.status !== 0 alone. After the npm install attempt, probe `import('@huggingface/transformers')` (or the kit's checkEmbedderBinding) — if it imports, set default_mode:hybrid and report enabled; only report NOT enabled if the import ALSO fails. A cleanup EBUSY is not an install failure. Verify the thing worked, not the command's exit code.
