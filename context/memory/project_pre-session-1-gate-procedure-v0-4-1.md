---
id: P-K97X42ZV
type: project
title: Pre-Session-1 Gate Procedure (v0.4.1)
created_at: 2026-06-26T15:47:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 72849a2a31257c0d229df88d88f40f87fa550d8ece9e7a03bf0392781343d703
related: [cut-gate-pre-release-validation-checklist-g0-g7, verification-sequence-for-task-169-170-fresh-folder-gate, cmk-fix-verification-workflow-fresh-folder-v0-4-1]
---

Nine numbered gates verify the kit before Session 1:

- **G0** — version (0.4.1)
- **G1** — install + doctor (10 health checks)
- **G2** — memory-write skill safe (no Edit/Write, hand-edit gate)
- **G2b** — memory-search read-only (context:fork, no mutate)
- **G3** — slim CLAUDE.md
- **G7** — semantic recall enabled
- **NR1** — now-roll self-heal (both scenarios vs real `claude --print`)
- **NR2** — HC-10 informational (SKIP on fresh install)
- **NR3** — discovery boundary (doesn't escape ~/context)

Result: all 9 PASS on real artifact.

**Why:** v0.4.1 is a robustness release; these gates verify the kit's core safety, feature, and boundary guarantees before live testing

**How to apply:** Run gates in sequence before Session 1; if any fail, the gate name identifies the failed subsystem (e.g., NR1 fail = now-roll issue, G2 fail = memory-write security)
