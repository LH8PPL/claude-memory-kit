---
id: P-SVXNQMZK
type: project
title: Test artifacts can contaminate fresh-install testing
created_at: 2026-06-24T20:10:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 97b4be414d28e7f8ee8ee0fe06a86ff1c919c866e5e88798ef55a11367e8fb34
related: [kiro-cli-cut-gate-procedure, cutgate-fresh-install-test-sequence, backup-strategy-for-kiro-gate-testing]
---

The `cmk.json` file and `chat.defaultAgent: cmk` config pointer left in `~/.kiro` after testing are NOT user files — they were created during development. When present during a "fresh install" gate test, they mask whether the shipped code actually works on a clean system.

**Why:** A gate test needs to simulate a real user's first install; pre-existing config defeats that simulation

**How to apply:** Before running a fresh-install gate, remove development artifacts; the backup (step 1 of the gate) makes this safe to do
