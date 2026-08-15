---
id: P-C5XPPXT2
type: project
shape: Timeless
title: D-293 Workaround — Avoid --with-semantic on Dev Repo Large Corpus
created_at: 2026-07-08T12:17:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7859b4e8596cc1274f2d6fab5f2e5569019538919413d7d929b14f719e18b734
related: [gate-testing-isolated-throwaway-folders, d-293-with-semantic-on-large-corpora-cau-e6txlfhn, cut-gate-sandbox-isolation]
---

Prior incident (D-293): running `cmk install --with-semantic` on this dev repo's large corpus triggered an 8.8GB memory freeze. Issue is now fixed, but the workaround remains: never re-run --with-semantic on this dev repo. Refresh the global artifact in a separate clean folder instead; gate tests run in yet another set of fresh folders.

**Why:** Prevents accidental resource exhaustion of dev environment; keeps gate work isolated and unblocking

**How to apply:** To refresh global: create new folder, `git init`, `cmk install --with-semantic`. To run gate: create another folder, init, run tests. Never mix or run `--with-semantic` on dev repo itself.
