---
id: P-XESLC4LQ
type: project
title: Kiro IDE Hook Testing — Multi-Step Gate Sequence
created_at: 2026-06-25T11:21:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 91bf3601f4f2a1f6bd098f6489cd4c247428fefaddbfa0744efc167ec67310fb
related: [memory-persistence-validation-workflow-end-to-end, claude-memory-kit-installation-levels, post-d194-artifact-update-workflow-for-kiro-trust-fix-verifi]
---

To test Kiro IDE 1.0 hook capture (e.g., readKiroIdeV1Turn):
1. **Rebuild global CLI** (installs the fix)
2. **Create fresh gate folder** with `cmk install --ide kiro`
3. **Verify in Kiro IDE 1.0** that 4 v1 hooks + surfaces are present
4. **Open folder in Kiro** (restart so hooks load fresh)
5. **Send a turn** (e.g., build prompt + preference); let it complete
6. **Check now.md** for captured turn (proof capture is working)
7. **Auto-extract spawns** (memory-extraction agent processes the captured turn)

This end-to-end sequence validates hook installation and capture pipeline.

**Why:** Hooks may appear installed but not actually execute; fresh folder + systematic verification avoids false passes from stale state

**How to apply:** When testing or verifying Kiro IDE integration, use this full sequence. Avoid reusing old gate folders (they may have cached state)
