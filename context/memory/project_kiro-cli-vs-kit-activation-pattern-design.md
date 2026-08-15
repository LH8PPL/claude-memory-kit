---
id: P-6JQMSaTX
type: project
shape: Relationship
title: 'Kiro-CLI vs. Kit: Activation Pattern Design'
created_at: 2026-07-06T17:31:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 314d81b03a49819cf2abc07a901dafd7ff8a7023eb183f3b1259c5425845f561
related: [kiro-cli-vs-kit-knowledge-extraction-architecture, kiro-agent-must-be-global-empirically-validated, kiro-cli-agent-resolution-requires-global-default]
---

- **kiro-cli's approach:** explicit `--agent kiro-self-learn` per session, no global default
- **Kit's approach:** global `chat.defaultAgent: cmk` for automatic activation
- **Underlying question:** How to activate a self-learning agent?
- **Finding:** Both patterns ship and work; manual opt-in (kiro-cli) provides explicit control; global default (kit) provides convenience

**Why:** Real-world evidence from kiro-cli on the exact D-284 activation-pattern question. Validates that both branches (manual vs. auto-activation) are legitimate.

**How to apply:** Reference when evaluating activation-model trade-offs (convenience vs. global footprint vs. explicit control).
