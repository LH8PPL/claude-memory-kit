---
id: P-MLV9MSPR
type: project
title: 'poison-guard.mjs: Specific Provider Patterns Are By Design'
created_at: 2026-06-11T13:00:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 59a66149423a19a8da5cc88946eb39f4536a6453
related: [defense-in-depth-scanning-write-read-boundaries]
---

File at packages/cli/src/poison-guard.mjs uses two-part system:
- Line 74: `secret_generic_credential` catches labeled secrets (`api_key=...`, `secret: ...`, etc with 20+ chars), regardless of provider
- Provider-specific patterns match bare keys by format (AWS `AKIA…`, GitHub `ghp_…`, Anthropic `sk-ant-…`, Slack `xoxb-…`)

This is correct by design: generic high-entropy matching would false-positive on legitimate content (git SHAs, sha1: lines, base32 fact IDs) and block legitimate writes. Industry standard (gitleaks) uses ~170 provider-specific rules; specific catalogs are how secret scanning works.

**Why:** Threat model is accidental leakage. False positives = DoS against system's own legitimate memory content.

**How to apply:** When extending, add provider-specific prefixes (e.g., Stripe `sk_live_`, Google `AIza`, GitLab `glpat-`, npm `npm_`). Never generic high-entropy regex. Test against realistic kit content to catch false positives.
