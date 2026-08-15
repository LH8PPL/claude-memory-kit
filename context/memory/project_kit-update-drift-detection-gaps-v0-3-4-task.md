---
id: P-FBXSRRa9
type: project
title: Kit Update & Drift Detection Gaps (v0.3.4 Task)
created_at: 2026-06-18T18:44:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 521aab2342c5b5bc8ecddd37c933c18b0318742bfdfc213b443d6b0f8133ae1d
related: [kit-update-workflow-npm-global-per-project-cmk-install, plugin-install-and-bootstrap-are-separate-one-time-steps, version-stamping-and-scaffold-isolation]
---

- No documentation of update process in README/QUICKSTART
- No `cmk update` command wrapping the two-step workflow
- `cmk doctor` has zero version-drift detection (doesn't warn if global is older than project block, or if newer version on npm exists)
- Windows EBUSY gotcha undocumented

**Why:** Basic product expectation ("how do I update?") has no answer; v0.3.3 ready to ship but these are gaps for v0.3.4

**How to apply:** File as task for v0.3.4; minimum is README documentation + `cmk doctor` line; better is full `cmk update` command + drift checks
