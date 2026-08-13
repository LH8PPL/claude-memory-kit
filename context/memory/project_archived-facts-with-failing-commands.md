---
id: P-HQUS53WX
type: project
shape: State
title: Archived Facts With Failing Commands
created_at: 2026-08-02T12:56:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a636749ac88f942b4fbeb535a0c3e61297c56a9061ce85084f1c79108ec3f68a
related: [file-pointer-format-and-interpretation, d-343-kit-lacks-mechanism-to-repair-stale-scaffolded-skills, memory-system-captures-work-in-real-time]
---

Archived memory facts contained copy-able commands (`forget --yes`, etc.) that silently fail when pasted by users—fixed by marking archived facts as read-only with honest note ("archived record, no actions apply"); live facts render commands real-as-pasted (your paste is the confirmation) or visibly as templates.

**Why:** Facts can contain actionable commands; without state awareness, users paste broken commands thinking they work.

**How to apply:** When rendering facts with commands, track and display archived/live/template state; test that archived facts don't render executable commands.
