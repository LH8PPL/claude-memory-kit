---
id: P-6CGBTE9S
type: project
shape: Event
title: Cursor Adapter Proves Generic Per-Profile Seam Works
created_at: 2026-07-04T06:10:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e945bd01066cb305e146b5cccab074bcf7250e1521ab4ed0a1431cf8383ffc50
related: [adapter-architecture-per-profile-seam-zero-bespoke-code, task-196-cursor-adapter-shipped-and-merg-mv4b4wqp, index-md-is-a-committed-human-readable-artifact]
---

PR #254 shipped Cursor as first-class agent with zero bespoke code. All lifecycle legs (inject/capture/observe/compress/guard) route through single `cmk cursor-hook` dispatcher via D-180 data-not-classes pattern. This is the first non-native agent to use the generic seam and proves it works end-to-end.

**Why:** Generic seam is the kit's core extensibility strategy. Real-world proof validates the design.

**How to apply:** For new agents, reference Cursor (PR #254) as the exemplar. Use the generic seam, do not write per-agent custom wiring.
