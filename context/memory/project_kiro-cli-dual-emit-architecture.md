---
id: P-C7VPU7BC
type: project
title: Kiro-CLI Dual-Emit Architecture
created_at: 2026-06-25T08:48:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 65ae8b363f388c889ffa3afdf090871dd3cc9be0cd6226b39cb0693586f5ef20
related: [v0-4-0-cut-gate-structure-and-coverage, the-kit-dual-emits-to-support-both-ide-0-4h5wzl6n, kiro-1-0-v1-hook-schema-and-installation-naming]
---

The kit dual-emits and supports both IDE 0.x (legacy) and 1.0+ (v1 format). Either version runs the gate with different probe sets:
- IDE 0.x: KH1/KH2 legacy capture+inject probes
- IDE 1.0+: KHv1-* modern probes (delete-guard, observe-edit, auto-load, Stop trigger)

**Why:** Provides flexibility in testing; choice is scope (quick/legacy vs. comprehensive/modern), not compatibility

**How to apply:** When choosing test environment, remember both are valid; decide based on verification scope needed
