---
id: P-DUS5U4Sa
type: feedback
shape: State
title: Memory tiers carry MISSION CONTEXT ONLY - the user's project, decisions, prefere
created_at: 2026-07-20T09:49:02Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 1c7a66db03cf3cac537acb9acd312f8eb06bbb3cdaccc1a30a3c3bea7213043b
related: [memory-tiers-contain-only-mission-context, memory-tier-boundaries-kit-health-signals, a-health-check-behind-a-command-does-not-surface-a-silent-fa]
---

Memory tiers carry MISSION CONTEXT ONLY - the user's project, decisions, preferences, domain facts. The kit's own problems (tool failures, timeouts, hook errors, our debugging, retracted diagnoses, meta-commentary about kit operation) are BUILD ARTIFACTS and belong in DECISION-LOG.md and tasks.md, never in a tier that gets injected into every future session. This binds BOTH directions: the capture layer must filter kit-operational noise out of what it writes, AND the reporting layer must never route kit-health signals into additionalContext, the injected snapshot, or any memory tier - a health warning belongs on the ephemeral systemMessage display channel (shown, not remembered), if anywhere.

**Why:** The user's call, after I proposed injecting 'memory captured 0 of 6 turns yesterday' into the SessionStart surface every session: 'the session memory needs to be only for mission context and real memory, never our own kit problems and failures' and 'you proposed to put the error in the session memory every session start.' Injecting the kit's operational failure into the memory surface is the exact pollution a memory product exists to prevent - and I proposed it as a FIX.

**How to apply:** Before any write to a memory tier, ask: is this about the USER'S work, or about the KIT'S operation? Only the former belongs. Applies to auto-extract, any deterministic fallback (which is dumber than the LLM path and will hoover up whatever durable-looking prose is present - default exclude-on-doubt, since a missed capture is recoverable via retry but a poisoned tier is not), and equally to any status/health/telemetry surface that might route into additionalContext. Test with a HOSTILE fixture from a real kit-debugging transcript: assert only the genuine project fact lands and zero kit-operational observations do.
