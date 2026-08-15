---
id: P-ENJNBQ7N
type: reference
shape: State
title: 'CORRECTION to the ECC study: ECC does NOT ship a re-curation engine. Their insti'
created_at: 2026-07-20T07:37:28Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: cd17bc0f9237507dbccc39a0511f83f143b04659e3cfae48544da1d653ad7a3b
related: [ecc-affaan-m-ecc-is-a-harness-os-not-a-memory-kit-memory-llm, production-code-changes-need-a-pr-never-direct-to-main, memory-tiers-carry-mission-context-only-the-user-s-project-d]
---

CORRECTION to the ECC study: ECC does NOT ship a re-curation engine. Their instinct pipeline ships the GENERATION half only (observations to LLM observer to instinct YAML to /evolve cluster to /promote global). The re-curation half is absent: confidence never updates from outcomes, skill_runs records success/failure and nothing reads it back, and observations.archive is DELETED on a 30-day timer rather than distilled. Every ECC retention mechanism is time-based expiry (30-day session prune, 30-day observation purge, 10MB rotation); nothing graduates, condenses, or is cited. Task 95's hard part is unbuilt there too.

**Why:** I initially claimed their pipeline was the shipped version of our Task 95 dream re-curation engine, decided from their SKILL.md architecture diagram rather than verified in code - the exact docs-claim-vs-code-ships error the verification rule exists to prevent, made while auditing them for that same error. The user challenged the claim and was right.

**How to apply:** When citing ECC as prior art for Task 95, cite it ONLY for the generation half (instinct extraction, clustering, project-to-global promotion with a 2-project + 0.8-confidence gate). Do NOT cite it as precedent for outcome-driven re-scoring or re-curation - that is still unbuilt in the field, which means Task 95 and our Task 194 survival gate remain genuine differentiators, not catch-up work.
