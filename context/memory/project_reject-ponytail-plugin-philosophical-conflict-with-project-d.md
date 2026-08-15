---
id: P-LaJYSMLa
type: project
title: Reject ponytail plugin; philosophical conflict with project design
created_at: 2026-06-15T15:07:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 44e18c79eb51ae2f38d989590310c0aea9f601f75c2b40107e55d6d0c0dcf82f
related: [kiro-configuration-structure-agents-md-not-claude, zero-server-local-first-is-the-kit-s-deliberate-design, two-tier-backend-architecture-for-headless-llm-invocation]
---

This project deliberately prioritizes rigor and architecture-first foundations over minimal code. The CLAUDE.md explicitly encodes "no over-engineering" and "rigor-first, ~50 dev-days, foundations before MVP" as load-bearing rules. The kit's discipline includes: shared-module architecture, five-exit-door testing, two-pass reviews, validators-for-every-prose-rule. Ponytail's "minimal-first" philosophy (skip it if a one-liner works, does it need to exist?) would create direct friction with these design principles. Ponytail better fits greenfield or personal projects without an established CLAUDE.md guardrail.

**Why:** The kit's value derives from deliberate rigor; Ponytail optimizes in the opposite direction. Adopting it would undermine the project's architectural philosophy and create decision-making conflicts on every tool/code choice.

**How to apply:** When evaluating external tools or plugins for this repo, weight alignment with rigor-first, architecture-first design as primary filter. Ponytail is not adopted here. Future tooling evaluations should reference this precedent and reasoning.
