---
id: P-N3QLT54B
type: project
title: Global Binary Lag After Code Merge
created_at: 2026-06-21T16:05:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4f61f1840c742f7b315bf699561838747f77760511cdf4840c8332370da4d867
related: [tarball-installation-requires-re-packing-after-main-merges, rebuilding-the-global-cmk-binary-after-code-changes, re-pack-verify-workflow-for-cut-gate-testing]
---

The global `cmk` command continues to use the old artifact after code is merged to main. Must explicitly uninstall and reinstall from the freshly-packed tarball to get the updated code.

**Why:** npm maintains a local cache of global packages; merging to main does not trigger automatic re-installation

**How to apply:** After any code merge intended for global use, always rebuild and reinstall the global package before testing
