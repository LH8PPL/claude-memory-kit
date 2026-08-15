---
id: P-DN3HDK6J
type: project
shape: Timeless
title: IDE Live-Check Verification Events (Cursor Pattern)
created_at: 2026-07-04T07:15:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 45a1e713862f13640557224ef47a9b91b0185ad719e13793b52369d95537b458
related: [cut-gate-kiro-deliberately-tests-both-kiro-clients-across-th, injection-verification-validate-real-content-not-just-hook-f, hook-inject-capture-tests-faked-dependencies-masking-bugs]
---

Platform-specific IDE gates verify these hook + integration surfaces:
- **Hooks:** CH1 (capture-turn), CH1b (capture-prompt), CH2 (inject), CH3 (observe-edit), CH4 (fail-open)
- **Integrations:** M0–M2 (MCP in chat), W1–W3 (recall), E1 (cold-open session wedge)

**Why:** Comprehensive coverage catches missing hooks (like D-269) and subtle integration bugs (like CH3 wired-but-dead)

**How to apply:** When testing a new IDE, verify all hook events fire and integrations surface data in live checks; document each assertion
