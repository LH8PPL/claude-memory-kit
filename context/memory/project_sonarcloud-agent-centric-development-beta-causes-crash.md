---
id: P-AE694PBJ
type: project
shape: State
title: SonarCloud Agent-Centric Development Beta Causes Crash
created_at: 2026-07-17T15:38:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 009af6aab84ba3a6d0ce8fe390e95106580c2367a97203c0112fc472abbc7d0c
related: [sonarcloud-sonarjs-13-3-0-does-not-fix-crash, sonarcloud-project-key-update-procedure, missing-tools-field-was-the-shell-blocker]
---

SonarCloud's "Agent-Centric Development" beta feature is the root cause of the opendir crash.
- Beta rolled out 2026-07-11, exact timing match to crash start
- Feature is toggleable: SonarCloud → Organization Admin → Agent-Centric Development
- Workaround: disable beta in org settings, rerun scan
- Secondary check: clear stale paths in project settings containing `C:/proj`

**Why:** Root cause identified and empirically verified; Beta rollout date correlates perfectly with crash onset; reproduced across SonarJS versions

**How to apply:** If SonarCloud scans crash next session, first step is disabling Agent-Centric Development beta in org settings; escalate with this evidence trail if workaround fails
