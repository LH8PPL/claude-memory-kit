---
id: P-EDZEJ3TZ
type: project
title: Kiro v0.4.0 Multi-Surface Trust Mechanism Architecture
created_at: 2026-06-25T12:37:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b74283ac99a260c9243c5757c3c10cfcfcdd6212516a3df553a3f4add6d5768b
related: [kiro-trusted-commands-auto-approve, v0-4-0-cut-gate-structure-and-coverage, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes]
---

Three surfaces implement v0.4.0 with distinct trust mechanisms:
- **Claude Code** — settings.json hooks
- **Kiro IDE 1.0 (1.0.52)** — per-workspace permissions.yaml (ref 50.N.5, prompt-free on skill load)
- **kiro-cli V3 (2.9.0)** — agent-config allowedCommands (ref D-199, prompt-free shell capture)

All operate the full memory loop (inject → capture → observe → explicit save → cross-project wedge) **prompt-free**, with no cmd.exe popups.

**Why:** v0.4.0 unifies memory behavior across three implementations. Live testing confirmed they work in isolation without conflicts. An implicit assumption (that kiro-cli would use the same mechanism as Kiro IDE) was caught by testing.

**How to apply:** When extending v0.4.0 or adding new surfaces, validate against all three. Document each surface's trust chain separately; they are not interchangeable.
