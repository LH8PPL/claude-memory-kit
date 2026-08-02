---
id: P-2VYMT3TL
type: project
shape: Timeless
title: Gate Verification System Architecture
created_at: 2026-08-02T19:11:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8c7bcc6013056d56cbb9b5861fff492ddef511aaf382b3f55b178cd27a0ecc04
---

- Local gates: 3 gates that run locally (all passing on current code)
- Remote gates: CodeQL and SonarCloud (critical blocking gates; these failed in the previous cycle and cannot run in the local environment)
- Gates form a sequential chain; all must pass before merge approval
- Remote gates are the final blocking validation before release sequence triggers

**Why:** Understanding the gate chain's structure and limitations is essential for CI/release work. The inability to run CodeQL/SonarCloud locally means they're always a final remote checkpoint.

**How to apply:** When working on CI fixes or release, remember that CodeQL and SonarCloud must pass in GitHub CI. Local green gates alone are insufficient; the remote gates always run last.
