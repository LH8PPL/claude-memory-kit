---
id: P-MGJKS5MY
type: project
shape: State
title: Four-tier rename execution structure
created_at: 2026-07-14T12:47:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c35442314ed6564f9a579510abe031b65f13bea2249d0dc2095d86ef174f6113
related: [kit-update-workflow-npm-global-per-project-cmk-install, live-test-workflow-for-kiro-cli-project-fix, npm-pack-global-install-for-artifact-testing-0b]
---

If the decision is to rename `claude-memory-kit` to `core-memory-kit`, execution follows this order:

1. **npm package rename** — Publish `@lh8ppl/core-memory-kit` as new package; deprecate `@lh8ppl/claude-memory-kit` with npm deprecation notice. Update `packages/cli/package.json` and internal `@lh8ppl/cmk-canonicalize` references.

2. **GitHub repo rename** — Rename `LH8PPL/claude-memory-kit` → `LH8PPL/core-memory-kit`. Update manifests (`plugin.json`, `marketplace.json`) that hardcode repo URLs.

3. **Doc + code corpus** — Find-replace in 77 docs + 51 code + 4 specs + plugin/template/python, with three carve-outs (see: Text-substitution carve-outs fact).

4. **In-repo memory tier** — Sweep 160 memory facts (`context/`) that mention the project name. Mostly informational; not load-bearing.

Tiers must execute in order; tier 3 depends on tier 1 being live on npm.

**Why:** This tier structure determines the actual cost and feasibility of a rename. Each has different reversibility and risk.

**How to apply:** When v0.5.4 opens and rename is decided (via successor ADR), follow this order. Do not attempt tier 3 before tier 1 ships.
