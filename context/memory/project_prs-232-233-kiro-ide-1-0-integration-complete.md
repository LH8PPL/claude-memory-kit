---
id: P-MZMJWDC6
type: project
title: 'PRs #232–#233: Kiro IDE 1.0 Integration Complete'
created_at: 2026-06-25T12:10:11Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 71f85b937be45e66ed27a610ef567c2f1241a082003f5cdff9037d2b503ccd77
related: [kiro-v3-hooks-redesigned-first-class-delete-guard-fallback-t, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes, two-sub-test-method-for-isolating-skill-permission-gating]
---

Two fixes merged to complete Kiro IDE 1.0 support:
- **#232** — capture hook adapted to read from IDE 1.0's new session path (messages.jsonl adapter)
- **#233** — cmk install pre-writes permissions.yaml with skill/MCP/shell trust rules

Both verified end-to-end. System now works identically on three surfaces: Claude Code, kiro-cli V3, Kiro IDE 1.0.

**Why:** IDE 1.0 changed session storage location and introduced a new permission model; these fixes align the kit.

**How to apply:** If future IDE capture issues arise, reference these PRs. If a fresh install shows Allow prompts, check that cmk install correctly wrote permissions.yaml.
