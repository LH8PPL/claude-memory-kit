---
id: P-6JFTXAPN
type: project
title: G4 Gate Upgraded to Mandatory Full-Sweep
created_at: 2026-06-16T09:16:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5b624c7ede67fe951198ce906c7800e3d21a951d720a56830118c704ab1ddbea
related: [always-check-every-memory-file-in-all-tiers-at-cut-gate, three-tier-memory-architecture, multi-tier-backup-pattern-for-release-cuts]
---

G4 gate now requires comprehensive verification across all three memory tiers (~/.claude-memory-kit, cut-gate14/context, cut-gate14/context.local). Marked as ★ cut-blocker — a failed G4 blocks release.

Checks: no username leak, no unrendered `{{TODAY}}`, examples marked `(example)`, frontmatter well-formed, no real paths in committed tier.

**Why:** Prevent accidentally committed secrets/paths in public release. The upgrade ensures this cannot be missed.

**How to apply:** When running cut-gate14, G4 will automatically sweep all three tiers. If G4 fails, audit those locations before retrying.
