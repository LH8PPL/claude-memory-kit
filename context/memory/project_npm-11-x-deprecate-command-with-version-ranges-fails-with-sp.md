---
id: P-V56VAX43
type: project
shape: Timeless
title: npm 11.x `deprecate` command with version ranges fails with spurious 404
created_at: 2026-07-15T12:22:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 63072511d736b3deaca74c03d35ed7532f22fe3db34728c1a6a0374fb7328b63
related: [npm-deprecate-e422-bug-with-version-ranges, npm-deprecate-wildcard-syntax-fails-with-e404-use-version-ra, auto-detect-priority-chain-proven-from-codemem]
---

- Running `npm deprecate @package@>=version` (or similar range syntax) returns 404 on npm 11.x
- Root cause: npm CLI bug, not auth/permissions/package state
- Workaround 1: deprecate each version individually (`@0.5.3`, `@0.5.4`, etc. one at a time)
- Workaround 2: use npmjs.com web UI (Settings → Deprecate package; server-side, bypasses broken CLI path)

**Why:** Avoids wasting time diagnosing false auth/permission problems; web UI is the reliable fallback

**How to apply:** If `npm deprecate` with ranges 404s, use npmjs.com web UI to deprecate all versions at once
