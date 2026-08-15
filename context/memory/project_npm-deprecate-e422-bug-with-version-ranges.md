---
id: P-RFPEPQKG
type: project
shape: Timeless
title: npm Deprecate E422 Bug with Version Ranges
created_at: 2026-07-15T12:23:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 11f57c4c87cff9bf70dffe386794a467264eeb269288a9b496f29f65881ac630
related: [npm-11-x-deprecate-command-with-version-ranges-fails-with-sp, npm-deprecate-wildcard-syntax-fails-with-e404-use-version-ra, npm-glob-expansion-fails-in-powershell-use-explicit-filename]
---

`npm deprecate` with range selectors (e.g., `@lh8ppl/claude-memory-kit@>=0.1.0`) fails with HTTP 422 Unprocessable Entity on npm CLI 11.x. Command iterates through matching versions and prints deprecation notices, then fails on the packument PUT request.

Confirmed workarounds:
- **Use npm website**: npmjs.com → package settings → Deprecate (single form, all versions, no CLI bug)
- **Script single versions**: deprecate each version explicitly with `npm deprecate @package@X.Y.Z "message"`

**Why:** npm CLI constructs a malformed packument PUT when applying range-based deprecation, which the registry rejects with 422. This is a client-side npm 11.x bug, not an account/auth/permission issue.

**How to apply:** If npm deprecate fails with E422, use the npm website UI instead (most reliable). For CLI-only workflows, script a loop of single-version deprecations rather than using ranges.
