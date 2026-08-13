---
id: P-YNFFNRSC
type: project
title: 'ADR-0012: Deferred Product Rename (Cross-Agent Trigger)'
created_at: 2026-06-28T18:15:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 13b1e53daf7e79b67886fde8e0eaf5843fa197dcd6b1d62a42804aa949bb385a
related: [kit-name-change-task-195-timeline-and-decision-point, kit-s-haiku-backend-has-undeclared-claude-cli-dependency, agent-neutral-names-persist-across-any-rename]
---

- **Decision**: Ship v0.1.0 under `@lh8ppl` scope; defer cross-agent product name to v0.2.
- **Trigger condition**: Cross-agent support shipping (rename to umbrella name or keep `claude-memory-kit` as adapter).
- **Status (2026-06-28)**: Trigger has fired — Kiro shipped in v0.4.
- **Two paths**: (a) umbrella rename to agent-neutral name (`agent-memory-kit`, `mnemo`, `recall`); (b) keep `claude-memory-kit` as Claude-Code adapter.
- **Invariant**: `cmk` CLI command survives either path.
- **Name collision**: awrshift/claude-memory-kit exists (Python product) — adds urgency but doesn't change decision.

**Why:** Rename deliberately deferred while design matured. Trigger condition is now live; next major release is the natural rebranding moment.

**How to apply:** When planning next major-version release, reference ADR-0012 and choose between paths. Collision adds timeline pressure.
