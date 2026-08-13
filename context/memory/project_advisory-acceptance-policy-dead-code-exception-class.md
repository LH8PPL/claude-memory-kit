---
id: P-FaACAXaZ
type: project
shape: State
title: Advisory Acceptance Policy — Dead-Code Exception Class
created_at: 2026-07-21T18:51:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 04bc1662da562adc49eb6a137cc813ecef77f69e97d8f512a5c3e3c6eecd95dc
related: [live-test-workflow-for-kiro-cli-project-fix]
---

- **Default behavior**: when a dependency advisory publishes and fix is available within SDK's declared range, apply it (e.g., hono 4.12.31)
- **Exception class**: accept unpatched advisory if ALL criteria met:
  1. Code containing vuln is structurally unreachable (static inspection + use-case review)
  2. Fix only exists outside declared range (would require major version bump)
  3. Has **checkable removal trigger** — documented condition to clean it up later
- **Governance**: exceptions listed in SECURITY.md alongside dev-only exemptions; config file header explicitly names rule ("shipped-dep advisories will still fail the scan — the gate stays real")
- **Example**: @hono/node-server Windows HTTP vuln — unreachable (kit is stdio-only); removal trigger: "remove when `npm view @modelcontextprotocol/sdk dependencies` shows `@hono/node-server>=2.0.5`"

**Why:** Forced major bumps create tested, live breakage; accepting a vuln in provably unreachable code is lower risk when removal trigger ensures cleanup as soon as fix becomes in-range

**How to apply:** When advisory fails CI, check: is code reachable? Is fix in range? If no + no, apply exception class with documented, verifiable removal trigger
