---
id: P-73UETUP4
type: feedback
shape: State
title: 'When an automatic path fails, build a FALLBACK MECHANIC that keeps it working - '
created_at: 2026-07-20T09:44:16Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 16d2057769ed8b8ab2e1942e78cf5e3999b9de0af3bfe88c2ce13099676b5913
related: [a-health-check-behind-a-command-does-not-surface-a-silent-fa, task-242-auto-extract-silent-failures-self-heal-first-design, notification-doctrine-non-actionable-repeating-failures]
---

When an automatic path fails, build a FALLBACK MECHANIC that keeps it working - do not build a recurring warning that reports the failure to the user. A per-session message about a problem the user can neither cause nor cure is a nag: silence plus guilt. It also burns the one notification channel we have (the SessionStart systemMessage), training people to tune out the line we will need later for something actionable. Notify only ONCE, on a state change, only after self-heal has genuinely given up, and only when a real user action exists.

**Why:** The user's two-step catch on Task 242: first 'a user will never run a doctor check' (a signal behind a command surfaces nothing), then 'if this goes every session and then what?' (a signal the user cannot act on is worse than silence). Their framing of the right answer: 'if it starved there is a fallback mechanic to deal with it.' I had made the REPORT load-bearing and the REPAIR secondary - inverted.

**How to apply:** For any automatic-path failure, build in this order: (1) degrade gracefully - a deterministic no-LLM or cheaper path so the capability never reaches zero; (2) resume - retry the failed unit on a later quiet pass, since the input is usually still banked (ADR-0020 resumable-not-all-or-nothing); (3) back off - stop burning the full budget per attempt once N consecutive failures prove the resource is starved, because the burn is itself part of the load problem; (4) notify LAST, once, on transition, only if 1-3 gave up. Test notification RESTRAINT in both directions - healthy and already-reported must both produce a byte-unchanged line - or a test asserting 'the warning appears' will re-introduce the nag.
