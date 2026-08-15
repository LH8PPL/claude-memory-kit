---
id: P-9K4XKJZG
type: project
shape: Timeless
title: 'Task 245: Root Cause Was Registry Propagation Timing, Not Working Directory'
created_at: 2026-07-21T19:27:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bf7b97ef771115dda466767e860da0e75a7170a459cc3856a39a75317325e758
related: [bash-tool-cwd-persists-cd-into-a-workspace-silently-reroutes, cmk-permission-prompt-only-on-cd-compound-d-80-edge]
---

**Initial diagnosis:** Working directory change (from `/c/Projects` to `/c/Temp`) appeared to enable upgrade success.

**Actual root cause:** Registry propagation timing at the npm CDN edge. If `@latest` still resolved to 0.6.0 when the first upgrade ran, npm exits 0 ("up to date") and the binary stays put. The second retry from `/c/Temp` succeeded only because enough time had passed for the registry to propagate.

**Why it looked like causation:** Coincidence masquerades as cause. The cwd change was innocent; the real driver was elapsed time.

**Ship decision:** The fix is cause-independent. `cmk doctor` now detects when the binary lags `@latest` and prompts verification with `cmk version`, making the tooling robust regardless of silent no-op upgrades.

**Why:** Distinguishing coincidence from cause prevents shipping band-aids for phantom issues. The fix doesn't prove the root cause — it makes the tool resilient to the condition.

**How to apply:** When troubleshooting "it worked when I changed X" scenarios, use A/B testing (same action in different context) to isolate whether X caused the fix or just happened to coincide with it.
