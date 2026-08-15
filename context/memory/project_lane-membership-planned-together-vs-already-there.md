---
id: P-4NAWVQ6M
type: project
shape: Timeless
title: 'Lane Membership: "Planned Together" vs "Already There"'
created_at: 2026-07-21T12:41:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ae352e95cf47a4fcf22553866d011f054c43f76a529a3fe3c6b760a68cd010d7
related: [do-not-reference-unshipped-task-outputs-in-config, native-binary-swap-test-uses-v13-bundled-binaries]
---

Same-delivery tasks depend on peers' *planned* outputs before they are *live*. Task 237 (shipped) initially referenced Task 240's deliverable (`.nvmrc` pin, unshipped, same lane). The latent bug was caught because the job was drafted against intended deliverables. This is the caller-map discipline applied across task boundaries.

**Why:** Catches inter-task dependencies and latent failures where one task assumes a peer's output exists prematurely.

**How to apply:** For same-lane tasks, check dependencies, reference only currently-committed values, and document which peer owns each structural change. Let the owning task sweep all references when it ships.
