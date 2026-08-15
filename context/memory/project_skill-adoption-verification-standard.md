---
id: P-QRHBWWLH
type: project
title: Skill Adoption Verification Standard
created_at: 2026-06-18T07:23:23Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 855493c07932bf896bf967def5876f3a62f1e7ff9b85c06b580f8de05bbc5a42
related: [git-as-sole-evidence-in-gap-cases, memory-system-dogfooding-internal-use-as-test-case, architecture-decisions-recorded-in-adrs]
---

Skills are evaluated by concrete value in real work. "Producing what I would have produced anyway" doesn't count as value. By this standard, the 6 mattpocock skills produced zero concrete value this session (tdd was neutral; others unproven).

**Why:** Grounds tool-keeping decisions in evidence rather than theory; prevents accumulation of unused tools

**How to apply:** When re-evaluating skills, audit against: did it catch something real, prevent an error, or produce an insight I couldn't have alone? If not, it failed the standard.
