---
id: P-3YVQUXTW
type: project
shape: Timeless
title: Kiro Requires Full Restart to Load Updated Hooks
created_at: 2026-07-09T10:08:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 136b2ec796a1ff25ec45bee311b007970b7b9b7e40549c33ed909e59e55a8815
related: [stale-mcp-process-workaround-after-build-updates, claude-code-hook-activation-requires-restart, mcp-server-may-retain-stale-code-in-memory-after-package-upd]
---

When Kiro hooks are updated or repacked (e.g., v0.5.0 binary with fixes), a full restart (close + reopen the IDE) is required to load the new hooks. A reload is insufficient and will retain stale hooks from memory.

**Why:** Kiro caches hooks in memory at startup. Reload does not refresh the cache; old hooks remain active until IDE restart.

**How to apply:** After updating Kiro's binary or hooks, always close and reopen the IDE before running builds/tests. Reload is not adequate.
