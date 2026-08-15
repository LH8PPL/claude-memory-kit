---
id: P-BYMDWX97
type: project
title: Security Scanning Stack
created_at: 2026-06-28T12:30:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 48d5651a36da12d60771e6368e6a6df9d1aa699f9fcbfd53f0c7db1b33b8bf99
related: [sonarcloud-as-security-gate-for-redos-detection, node-version-floor-bumped-to-22-in-v0-6-2, ci-pipeline-configuration]
---

- **CodeQL** — static analysis (SAST)
- **osv-scanner + npm audit** — dependency scanning with hard gate on high/critical vulnerabilities
- **gitleaks + GitGuardian** — secrets detection
- **SonarCloud** — hotspot analysis
- **Dependabot** — automated dependency updates including security bumps
- **Signed npm provenance** on publish

A real CVE blocks the CI build—this isn't theater.

**Why:** The project has comprehensive, automated security coverage. Future sessions need to know what safety gates are in place and trust them.

**How to apply:** When reviewing security PRs or handling dependencies, use this stack as the single source of truth. Treat CI passing as the hard gate for merge decisions.
