---
id: P-XMSVZWDD
type: reference
shape: State
title: 'ECC (affaan-m/ecc) is a harness-OS, not a memory kit: memory = LLM-generated mar'
created_at: 2026-07-20T07:31:29Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 2f9e8cc9b831a03625f19b1a4212bab2b0b64e9aeade90feea09cf27c58be04b
related: [correction-to-the-ecc-study-ecc-does-not-ship-a-re-curation]
---

ECC (affaan-m/ecc) is a harness-OS, not a memory kit: memory = LLM-generated markdown session summaries in a home-dir global sessions dir (machine-local, 7-30 day window, never committed), plus per-project instincts YAML with confidence. No durable fact store, no search (no FTS/embeddings/hybrid), no citations, no conflict queue, no tombstones. Their instinct confidence is assigned once at creation by frequency and NEVER evolves (instinct-cli.py reads/filters/sorts it 55x, writes it 0x) despite SKILL.md claiming it decreases on user correction.

**Why:** Competitive positioning for v0.6.0+: ECC is the biggest adjacent project (211K stars claimed, 278 skills, 12 harnesses) and the closest thing to a rival, but it competes on breadth (harness OS) not memory depth. Our differentiators - committed per-project fact store, hybrid search, citations, conflict/trust evolution - are unmatched there.

**How to apply:** When positioning the kit or considering feature borrows: borrow their multi-harness breadth and SLSA3/supply-chain release posture; do NOT assume their memory is ahead - it is thinner than ours. Their instinct evolution pipeline (observe to instinct to cluster to promote) is the shipped version of our Task 95 dream re-curation, worth studying for that task.
