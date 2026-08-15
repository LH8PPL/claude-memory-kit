---
id: P-BDES4aW7
type: project
title: Install-time consent for better-sqlite3 binding (replaces error → doctor round-trip)
created_at: 2026-06-12T19:45:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 563bb42e1953626eed786d48d1833906e45cd7e3
related: [fresh-cmk-install-health-baseline-cmk-0-4-5-with-semantic, cmk-install-auto-updates-managed-block-version-stamps, windows-npm-eperm-warning-on-better-sqlite3-node-is-benign]
---

When native binding is unavailable (npm 12), the install flow now uses inline consent:
- User runs `cmk install`
- Tool detects missing binding, prompts: "Fix it now by running `npm install -g ... --allow-scripts=better-sqlite3`?" [Y/n]
- Y runs it, re-checks, confirms success
- One step, immediate resolution — no second command or doctor round-trip

The supporting pieces:
- `--with-semantic` passes the allow flag transparently on npm ≥ 11.16
- README documents the one-liner for npm-12 users to avoid the broken state
- Doctor (HC-8) is now a backstop (for after-the-fact breakage like Node upgrades), not the discovery mechanism

Shipped in PR #169 (merged).

**Why:** User objected to original UX (npm install error → doctor command → error again → discovery left to an obscure tool). This change prioritizes inline, immediate resolution at the moment of install. Their feedback shaped the design before it shipped.

**How to apply:** Reference this pattern when discussing onboarding UX, install flows, or the doctor command's current role as a backstop-only check.
