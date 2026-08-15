---
id: P-YCBLRF9U
type: project
title: Memory Kit Architecture — Complementary Kit and CLAUDE.md
created_at: 2026-06-25T13:30:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a1a403cdf150f57e620a97b2e083a9cdaf657afa21d1e3261bdbe7625ab234ae
related: [binding-rule-readme-line-for-user-facing-features, memory-tier-system-project-to-cross-project-promotion, claude-md-checkpoint-4-pre-commit-screening-rule]
---

The memory kit uses two complementary systems:
- **Kit (`cmk remember`)**: searchable, cross-session memory for facts to discover and recall
- **CLAUDE.md**: always-loaded enforcement layer for standing rules (no recall needed—enforced every session)

Both can be used together for the same topic: CLAUDE.md for must-always-enforce rules, kit for durable discoverable facts.

**Why:** This project dogfoods its own memory architecture. The dual-system design ensures facts are routed correctly (always-on enforcement vs. discoverable recall) and appropriately reinforced.

**How to apply:** When saving a fact, decide: is it a standing rule (add to CLAUDE.md) or a durable discoverable fact (save via `cmk remember` to the kit)? Route accordingly. CLAUDE.md is the binding layer for rules that must always be enforced.
