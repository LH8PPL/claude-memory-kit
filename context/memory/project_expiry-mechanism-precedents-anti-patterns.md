---
id: P-5UDDLD2V
type: project
title: Expiry Mechanism Precedents & Anti-Patterns
created_at: 2026-07-02T08:49:55Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 797abf4ef0eccd4f32be298f1e3a6bf94077e058737fd3b6e9750184bfdfbad3
related: [task-66-3-scoped-population-enforcement-both-required, expires-at-enforcement-dual-mode-read-time-sweep, auto-extract-expiry-bounded-design-never-guesses]
---

Comparative research across mem0, LangGraph, graphiti/Zep, letta identified:
- **Caller-set expiry is only precedented path** (mem0, graphiti set at call-time; letta has none; LangGraph uses deployment config)
- **Hide+tombstone, never hard-delete** at expiry (mem0 hides with recovery; graphiti filters from view; matches D-163 tombstone)
- **Staleness vs absolute expiry are distinct semantics**: staleness (LangGraph refresh_on_read) resets on access; absolute (this project) expires at declared time
- **Enforcement trap**: "no sweep configured = nothing expires" (LangGraph)—requires dual enforcement (read-time filter + sweep, not sweep-only)

**Why:** Addresses 66.3's core risk: without a validated writer path, feature stays dead (D-169 class). Precedent confirms caller-set is only working pattern; confusion between staleness/absolute breaks user intent (fact marked "expires Friday" should not auto-extend); sweep-only enforcement fails silently.

**How to apply:** Validate 66.3 implementation: (1) explicit caller path (flag + auto-extract for Plan/Event shapes), (2) dual enforcement (read-time filter + sweep), (3) measure field population in real cases; if none, document negative result before shipping.
