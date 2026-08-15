---
id: P-J9UAQKSJ
type: project
shape: Timeless
title: 'Regression Isolation: A/B Test Old Config in New Environment'
created_at: 2026-07-02T19:33:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e3b64fc771a46c03cc55453e9898bafe36ded6928e361953e0fd221a6df82906
related: [claude-code-2-1-198-permission-hook-regression, npm-pack-global-install-for-artifact-testing-0b, npm-11-x-deprecate-command-with-version-ranges-fails-with-sp]
---

To isolate whether a regression is code/config vs environment:
1. Take the old version folder (unchanged code, identical config)
2. Test it in the new environment
3. If issue reproduces → cause is environmental (CC version, session state, hook load-timing)
4. If issue doesn't reproduce → cause is in new code/config version

Example: v0.4.3 folder (byte-identical `settings.json`) prompts in CC 2.1.198 → proves cause is CC, not v0.4.4 release.

**Why:** Rules out variables systematically. Avoids guessing or chasing red herrings.

**How to apply:** Before investigating code changes, test the old folder first in the new environment. Narrows the search to environmental or code/config differences.
