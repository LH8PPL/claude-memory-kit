---
id: P-4aaKKRKV
type: project
title: PII Handling — Non-Adoption of Quarantine
created_at: 2026-06-11T22:15:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 598d2b440a7da95eb605b8da208853d18d664b95
related: [core-philosophy-of-the-kit, index-md-is-a-committed-human-readable-artifact, kiro-cli-env-passing-limitation]
---

Poison_Guard rejects detected PII and persists nothing (redacted log line only). Do **not** build a PII quarantine storage like memclaw.

**Why:** Kit's memory lives in git repos — privacy (discard-on-sight) is higher priority than quarantine-for-review UX

**How to apply:** Keep Poison_Guard's reject-and-discard approach; do not add quarantine table or review facility
