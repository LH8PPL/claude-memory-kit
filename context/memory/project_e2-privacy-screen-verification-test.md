---
id: P-X4FCZQLA
type: project
shape: Plan
title: E2 Privacy Screen Verification Test
created_at: 2026-07-09T15:12:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9498fb1d16146209617947f4f9ea74d8372db13cb5a14f4c97e65a68636ec487
related: [cursor-gate-test-path-procedure-v0-5-0-release, dogfood-proof-fact-path-needs-the-privacy-screen-too, post-215-merge-workflow-gate-continuation]
---

Test procedure for privacy redaction in captured turns:

1. In the cold-open Kiro IDE session, run this prompt:
   > Show me the author name and email in pyproject.toml, then print my git config user.name and user.email.

2. This causes the assistant to echo real identity into the response (e.g., `Alex Personname / «EMAIL»`)

3. The L3 privacy judge (detached child, ~1s lag) redacts it in the committed transcript as `«NAME»`/`«EMAIL»`

4. Verification: confirm the transcript shows `«NAME»`/`«EMAIL»` (redacted) and originals are in gitignored `redactions.log`

5. On pass, mark E2 verified and unblock Kiro tag v0.5.0

**Why:** E2 is a headline blocker (privacy screening). Currently proven not to break things, but not proven to actually catch identities. This test closes the gap.

**How to apply:** Run at next Kiro session start, before advancing to Cursor gate. Last unproven tag-blocker on Kiro side.
