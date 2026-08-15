---
id: P-T9KCDQ3U
type: project
shape: Event
title: Empirical test proves cmk install skips stale skills (D-343 confirmation)
created_at: 2026-07-15T19:07:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ae33890c628c5f2f8989298b5ac2c2c0a9a9ee76f4b9fb54fb8d8bdc553726fc
related: [cmk-install-skips-existing-files-cannot-repair-stale-skills, cmk-install-skip-existing-behavior-and-update-implications, npm-pack-global-install-for-artifact-testing-0b]
---

Test executed via test-install-refresh.mjs:
1. Scaffolded a skill with known name/marker
2. Staleified it (renamed 2 refs, injected marker string, simulated stale state)
3. Ran `cmk install` (update-in-place scenario)
4. Observed result: old-name refs count = 2 (unchanged), stale marker still present
5. **Conclusion: `cmk install` left stale file completely untouched**

**Why:** Upgrades the finding from "I read install.mjs line 214" to empirical ground truth. Provides concrete evidence for D-343 and justifies the need for `cmk repair --skills` or doctor-tool enhancement.

**How to apply:** Keep the test file and result as reference when implementing skill refresh/repair. The staleify–reinstall–observe pattern is reusable for validating any future fix.
