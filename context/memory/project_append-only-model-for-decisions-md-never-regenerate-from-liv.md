---
id: P-FH2Q2TZ7
type: project
title: Append-Only Model for DECISIONS.md (Never Regenerate from Live Facts)
created_at: 2026-06-15T16:33:18Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f2a83bc62cc660a324acdb82e062042545e26185f13af5253d705a3b0ade17c2
related: [decisions-md-is-append-only-permanent-journal-not-regenerate, regenerated-surfaces-vs-append-only-surfaces-digest-vs-decis, automatic-recall-never-reads-tombstones-recovery-is-human-on]
---

DECISIONS.md must be append-only, kit-maintained, never regenerated from current live facts.
  - Decision captured → append entry (date, title, why, fact-id)
  - Decision superseded → annotate old entry in place (~~old decision~~, superseded by [new] DATE), then append new entry
  - Decision forgotten → mark retracted (retracted DATE), keep entry visible
  - Never delete; history must stay visible for context and trail preservation

**Why:** Regenerating from live facts erases history. Superseded decisions disappear; retracted decisions are gone. This violates the decision-trail preservation rule: the journal's purpose is to show why we changed course, not rewrite history to look like current state was always obvious. Squad appends for this reason (history is the point). The kit can improve squad's model (no junk, typed facts, clear structure) while keeping the append-only virtue.

**How to apply:** When capturing a decision-fact, append to DECISIONS.md. When `cmk forget`, mark retracted. For v0.3.2, support explicit signals (capture appends; forget marks retracted; explicit supersede links annotate). Defer automatic contradiction-detection to v0.4 (Task F-D).
