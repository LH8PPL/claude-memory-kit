---
id: P-SGSDY7A6
type: project
title: OpenWolf — Scheduled-Job Architecture Peer
created_at: 2026-06-25T19:35:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4876eccc37c6d502d9f34673ccebfda4745f1a9a4880393d7405bce4ca45c2fe
related: [openwolf-independently-built-the-exact-h-am5znhve, kiro-cli-vs-kit-knowledge-extraction-architecture, kiro-cli-vs-kit-activation-pattern-design]
---

OpenWolf is the only peer sharing the kit's architecture (scheduled job + liveness check) and independently implemented the exact heartbeat fix (last_heartbeat via statSync().mtimeMs). Also has file-index and token-ledger patterns worth deeper exploration later.

**Why:** Real-world validation that heartbeat approach works at scale; confirms both architecture fit and derive-from-artifact strategy.

**How to apply:** Reference OpenWolf when grounding cron-liveness decisions. Flag for deeper dive into file-index and token-ledger patterns for future optimization.
