---
id: P-BY6AWCVJ
type: project
shape: State
title: Task 235 Design — now→today Roll Trigger
created_at: 2026-07-20T16:58:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7d0d76d38764d84db726c7863bb32ce740e2306797fa257c19f03d94d864a559
related: [peer-systems-synchronize-consolidation-on-stop-hook-session]
---

**Real gap:** marathons never get SessionEnd; lazy roll only fires at next session start. PreCompact is the only reliable in-session trigger.

**Solution:** Reuse shipped `compressSession` on PreCompact hook. **Explicitly NOT `runLazyCompress`** — its `cron-active` gate means 2pm compaction on cron-registered repos would silently do nothing.

**Hook contract:** Exit 0 always, no blocking despite capability (blocking holds session hostage), emit no decision. Work goes to detached worker so compaction never waits.

**Why:** Corrected premise ("content at risk during compaction" → "roll timing gap in marathons") shaped all decisions; this is the fix

**How to apply:** Apply PreCompact pattern for any in-session buffering that needs triggering independent of SessionEnd
