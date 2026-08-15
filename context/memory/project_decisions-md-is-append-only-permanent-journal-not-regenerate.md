---
id: P-3C9V6a76
type: project
title: DECISIONS.md is append-only permanent journal not regenerated
created_at: 2026-06-15T17:32:37Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: c42451083ef19c3af4b3f4883436462029e9c46de03174acce511d24b0fd87c0
related: [append-only-model-for-decisions-md-never-regenerate-from-liv, regenerated-surfaces-vs-append-only-surfaces-digest-vs-decis, automatic-recall-never-reads-tombstones-recovery-is-human-on]
---

Task 147 DECISIONS.md architecture (settled 2026-06-15, D-161): the standing context/DECISIONS.md is APPEND-ONLY + kit-maintained, NOT regenerated-from-live-facts and NOT parked/rolled like MEMORY.md. Rationale: a decision journal's value is the permanent trail (what we decided AND what we moved away from + why). Regenerating from current live facts would silently erase superseded/forgotten decisions — rewriting history to look like the current state was always obvious (violates CLAUDE.md decision-trail-preservation). So: decision captured -> entry appended; superseded -> OLD entry annotated in place (not deleted) + new appended; forgotten -> marked retracted, not removed. Contrast with MEMORY.md (bounded hot cache -> rolls/parks to dated archives) and INDEX.md (index of what-currently-exists -> regenerated, drops deleted). cmk digest is the SEPARATE regenerated render (current-knowledge snapshot — regeneration correct there). Scope for v0.3.2: only explicit signals (capture appends, forget marks retracted, explicit supersede annotates); AUTOMATIC contradiction detection is deferred to F-D/Task 95. Steal merge=union from squad's .gitattributes so teams don't conflict on the append-only file.

**Why:** Arrived at by reasoning through what happens when a decision-fact is superseded/forgotten over time. A regenerated-from-live DECISIONS.md (my first instinct, mirroring INDEX.md) would erase superseded decisions — destroying the journal's entire value (the why-we-changed trail). The MEMORY.md parking model also must NOT apply: old decisions are the MOST valuable part of a decision log, so it's unbounded and never rolls. Append-permanent for the journal vs regenerate for the digest — the difference IS the MEMORY.md-vs-decision-log distinction. Squad appends because it has no DB; the kit appends-with-structure (links/supersession/no-junk) because it does.

**How to apply:** Build DECISIONS.md as append-only: a writer appends a Title/Why/date/fact-id entry on decision capture; supersede annotates the old entry in place + appends new; forget marks retracted (never deletes). Never regenerate it from live facts, never apply MEMORY.md rolling/parking. Keep cmk digest as a separate regenerated render. Add merge=union for DECISIONS.md to .gitattributes. Defer automatic supersession detection to F-D/Task 95.
