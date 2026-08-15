---
id: P-YZLQUWEB
type: project
shape: Timeless
title: Kit Guardrail Behavior — Over-Block for Safety
created_at: 2026-07-20T16:58:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 648ef38be317212747f8893340bb7b7e6b6d30067d84e7ee0ba4b00455f43caa
related: [kit-guardrail-over-blocks-on-safety-as-d-x5rw6lbq, project-dogfooding-principle-use-kit-s-own-mechanisms, commit-message-guard-rejects-literal-rm-rf-context-memory-st]
---

Guardrail can't distinguish command from documentation, so writing up an incident (describing a blocked command) triggers the block again. Both incidents treated as STOP, content rewritten rather than routed around.

**Why:** Kit's stated "over-block is safe" posture is intentional design, not defect; safe to trust and respect

**How to apply:** When blocked, investigate the trigger and rewrite; never bypass or try to confuse the guard
