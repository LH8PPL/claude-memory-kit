---
id: P-B6SU64AE
type: feedback
title: re-review post-skill-review fixes before merge (the last-edit gap)
created_at: 2026-06-26T11:39:26Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 08e58be0b70153da4fbe65e81e61a113e7ad0587cc679968ee988c6a7a11a119
related: [consult-the-user-before-shipping-a-fix-mid-live-diagnosis, stress-test-gating-rule-for-pr-approval, task-167-drop-hc-10-doctor-check-keep-only-the-free-auto-log]
---

Two-pass review process gap: when a skill-review surfaces a finding and I FIX it (especially a non-trivial refactor like extracting a shared helper), the FIX itself ships without its own skill pass — the skill reviewed the pre-fix code. Re-run the skill (or at least self-review) on the post-fix diff before merge, OR review the final diff as the last step. Happened on PR #237 (Task 168): the DRY extraction of discoverRootUpward was made after the skill pass; the post-merge review cleared it (no Blocking/Important) but the process had the hole.

**Why:** The user asked "did you run code review on ALL the code you shipped?" — and the honest answer surfaced a real process gap: the two-pass rule was followed, but fixes made IN RESPONSE to the skill-review then shipped un-re-reviewed. A non-trivial post-review change (a shared-helper extraction) is exactly where a new bug could slip in after the review that was supposed to catch it.

**How to apply:** After fixing skill-review findings, do a final pass over the LAST diff (the post-fix state) before merge — re-run the skill if the fix was non-trivial (a refactor, a new shared function, a behavior change), or at minimum a self-review walking the doors on just the delta. The review must cover the code that actually ships, not an earlier snapshot. Make 'review the final diff' the last gate, after all fixes.
