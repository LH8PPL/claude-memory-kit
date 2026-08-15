---
id: P-6BHD7RaB
type: project
shape: Timeless
title: npm Deprecate Auth Failures Reported as E404
created_at: 2026-07-15T12:19:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dc37f9796d89628e00e1ac5e1bcb5fd458fdacdb9d0a1dbb25a466effcbc3694
related: [sigstore-provenance-validation-requires-repo-package-name-al, npm-test-fragility-under-load, better-sqlite3-eperm-cleanup-warning]
---

`npm deprecate` reports authentication failures (missing/invalid `~/.npmrc` token or not logged in) as E404 ("Not Found") instead of E401 ("Unauthorized").

npm prints local `npm notice deprecating...` lines, then the registry PUT fails on auth, yielding a confusing E404.

**Fix:** Run `npm login` or ensure `~/.npmrc` has valid `//registry.npmjs.org/:_authToken=...`.

**Why:** Occurred during package rename; knowing the real cause (auth, not existence) saves debugging cycles.

**How to apply:** If `npm deprecate` fails with E404, check npm auth first.
