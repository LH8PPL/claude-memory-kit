---
id: P-RRQC9T4C
aliases: [P-RRQC9T4C]
type: project
shape: State
title: core-memory-kit v0.6.4 Installed; Dual Memory Layers Active
created_at: 2026-08-03T12:52:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 56544c0c1e52056a0226425b1737a55c75e8015ffadc24bcc38b5a11ea6aa2be
related: [hc-6-native-auto-memory-runs-alongside-kit, fresh-cmk-install-health-baseline-cmk-0-4-5-with-semantic, fresh-cmk-install-expected-cmk-doctor-baseline]
---

- **Global install**: v0.6.1 → v0.6.4 (upgrade confirmed and verified)
- **Health status**: 14/14 checks pass (HC-9 scaffold/cmk match, HC-13 no stray context/ folders, HC-14 health whisper live)
- **Memory layer stack**: Anthropic's native Auto Memory still active alongside kit (dual-layer, last touched June 18)
- **Consolidation option**: `cmk disable-native-memory` available if single-layer desired (not yet applied)

**Why:** Project was dogfooding v0.6.1 globally while 0.6.2–0.6.4 were built locally. This upgrade closes the gap and makes the dual-layer state explicit going forward.

**How to apply:** Future sessions should expect both memory layers injecting at session start. If dual layer causes issues or noise, `cmk disable-native-memory` can consolidate to one layer.
