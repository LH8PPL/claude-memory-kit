---
id: P-SK59CBTD
type: project
shape: Preference
title: Daily Supply-Chain Scanning Cadence
created_at: 2026-07-21T12:41:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4965e259458cc9590d1c45837af57e6e6773378e9e8be4248e0dede2c0028121
related: [daily-not-weekly-scanning-decided-becaus-f4alx9js, powershell-glob-behavior-explicit-filename-required-for-tgz, traversal-dilution-binding-design-constraint]
---

Scanners run daily (not weekly as originally proposed). Advisory velocity on this surface is 2 advisories per 24h on ~8 direct dependencies. Weekly cadence would permit up to 7 days of unknown exposure.

**Why:** Minimize supply-chain risk exposure window.

**How to apply:** When deciding scan frequency, ground the decision in recent advisory velocity from real data, not abstract SLA.
