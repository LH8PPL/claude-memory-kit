---
id: P-KMUEHPBP
type: project
shape: State
title: Supply-Chain Watch Issue-Filing Fixed (Task 237)
created_at: 2026-07-22T08:05:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 12d3d81d6edec6277607caeee63528371c80744f0168f13909bdd741b174bc21
related: [d-293-workaround-avoid-with-semantic-on-dev-repo-large-corpu, task-245-diagnosis-deferred-until-reproducible, ci-watch-rule-specify-ci-yml-by-name]
---

The supply-chain watch's issue-filing workflow had output wiring omitted: it wired `shouldAlert` and `scanStatus` to the output but never included `title`, causing crashes on the first real advisory fire. Fixed in Task 237. The fix is on branch; awaiting CI re-run to confirm it now files issues correctly on real findings.

**Why:** This was a unit-green/integration-broken gap (unit tests used pure reporter; the workflow's output wiring was never exercised until a real advisory fired)

**How to apply:** Monitor CI re-run result; if the supply-chain watch issues file correctly, confirm the fix is working
