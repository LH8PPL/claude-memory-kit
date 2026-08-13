---
id: P-HMXBFF4L
type: project
title: claude-memory-kit Fix Verification Protocol (v0.4.3)
created_at: 2026-07-01T11:11:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 44e4fedc687b92e7cd57d2df8a415d1717da49c560f14009ba42200bf2cc2535
related: [release-workflow-cold-open-testing-discipline, claude-memory-kit-v0-4-3-release-workflow, rebuilding-the-global-cmk-binary-after-code-changes]
---

Three-tier verification for shipping fixes:
- **Tarball verification**: Confirm fix code is in the built tarball
- **Installed files verification**: Extract tarball, confirm fix code is actually in the installed `node_modules/` files (e.g., `index-rebuild.mjs` line 182 `SCRATCHPADS_BY_TIER`, `provenance.mjs` line 183 `isSeedProvenance`)
- **Behavioral verification**: Run end-to-end test in the installed version (e.g., global `cmk` search returns actual persona, not example bullets)

Only after all three pass does the fix go to production.

**Why:** An earlier version of the fix passed tarball checks but would fail in real installs. This three-tier system catches boundary failures that dev-repo testing misses.

**How to apply:** When verifying any claude-memory-kit fix before tagging, run all three checks. Do not merge PR without running at least the behavioral test in a real install.
