---
id: P-X7Y2QXH4
type: project
shape: Event
title: 'Research Complete: Self-healing CLI Repair UX (Task 250)'
created_at: 2026-08-01T12:39:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 11e1614f70bd5cc184b2eb0fe9710d6e07ab251914570180a46769f953f819b5
related: [q1-refined-auto-fix-vs-whisper-boundary-cmk-doctor]
---

Outward research on auto-fix / confirm / advise patterns across shipped CLI tools completed. Findings: git (skip-on-contention, cheap idempotent ops), Claude Code (/doctor: confirm-once), npm/brew/flutter (report-only), Nx CI (auto-apply earned per-fix-class only when verified by re-run), Tailscale Warnables (self-cleaning map with TimeToVisible, DependsOn suppression, attached repair commands). Octopoda deliberately excluded per prior note.

**Why:** Directly informs Q1 sharpening. Tailscale's Warnables pattern is production-ready for cmk's nudge registry.

**How to apply:** Findings will be filed as dated research note + SOURCES entries during build phase. Reference when designing cmk doctor's health-check repair registry.
