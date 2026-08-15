---
id: P-A9XK7N7X
type: project
title: External Source Ingestion and Task Triage Workflow
created_at: 2026-07-01T12:32:26Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6e7a1f136dfa4ee6e35083161f8a97f08818fcd0ab41f2042fb1302d4e076dc2
related: [architecture-decisions-recorded-in-adrs, decision-log-system-for-known-limitations, scope-documentation-discipline-record-why-not-just-what]
---

The project processes external sources (repos, papers, articles) through a standardized four-outcome triage workflow:

**Outcomes:**
- **New task** — filed in `tasks.md` with version lane + trigger ID (e.g., D-248)
- **Improves existing task** — enriches entry with new info/design/source
- **Validates/contradicts decision** — checked against DECISION-LOG; contradictions surface with new evidence
- **Not applicable** — recorded as negative result (data point per adoption-verification rule)

**Infrastructure:**
- `tasks.md` — tasks with version lanes, numbered refs (D-248, Task 185, etc.)
- `DECISION-LOG` — settled decisions; revisitable only with new evidence
- `SOURCES.md` / `docs/research/` — external citations with provenance

**Process:**
User provides source + optional context (why it matters); assistant triages and reports outcome + destination. Negative results are recorded (not padding).

**Why:** This is the ingestion machinery for continuous backlog + decision integration. Future sessions benefit from knowing this structure exists and how to use it.

**How to apply:** When external sources arrive, apply the four-outcome triage. File in tasks.md, enrich existing, validate against DECISION-LOG, or record negative. Always cite in SOURCES.md for provenance.
