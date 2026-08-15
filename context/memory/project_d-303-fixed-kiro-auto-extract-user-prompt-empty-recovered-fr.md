---
id: P-FJ5WFGLB
type: project
shape: Event
title: 'D-303 Fixed: Kiro Auto-Extract USER_PROMPT Empty, Recovered from payload.user_message'
created_at: 2026-07-09T07:45:46Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 52015fc54e441dce914e93f8e6f37a3b758f806b7efb181d24cad3f01334cb03
related: [d-303-test-environment-confirmed-ready, captureturn-pii-masking-and-transcript-ordering-fix, task-172-live-verified-from-packed-kit-no-popup-full-suite-s]
---

- **Root cause:** Kiro IDE 1.0 USER_PROMPT hook var arrives empty → capture-prompt no-ops → auto-extract misses user turn → nothing saved
- **Fix:** captureTurn recovers user turn from `payload.user_message` (Kiro Stop hook already reads), masks it, writes transcript in user→assistant order (PR #267, commit 0335c60)
- **Review:** self-review caught PII-masking gap; code-review caught transcript data-loss bug B1; both fixed + tested
- **QA:** full suite 2829/2829, stress 5/5, all CI green
- **Deployment:** global cmk v0.5.0; required killing `cmk mcp serve` PIDs 16228, 9736 first (to clear D-302 lock)
- **Proof procedure:** live Kiro test in fresh folder — state casual preference without mk_remember, restart Kiro, new session, `cmk search` should find it with `write_source: auto-extract`

**Why:** Auto-extract broken on Kiro blocked D-303 and broke parity with Claude Code; this fix enables fact capture from Kiro sessions without manual commands

**How to apply:** Run proof test in new Kiro project. If `cmk search` returns the stated preference with write_source: auto-extract, D-303 is closed.
