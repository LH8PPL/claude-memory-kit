---
id: P-VXG4XGXP
type: project
title: Log Sink Injection Pattern Across Install/Uninstall
created_at: 2026-06-21T20:13:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e1ac51ee206f941e287e4d73ad79f4f13872a27eadadcd1472385c86686a1ddb
related: [idiomatic-timeout-composition-pattern-50s-120s, coverage-gate-fix-workflow, sonarcloud-coverage-gate-threshold]
---

Both `runInstall` and `runUninstall` should honor injected log sinks for test control. This is the consistent pattern used by these paired tools.

**Why:** Allows tests to inject custom logging; maintains behavioral consistency across related tools.

**How to apply:** When modifying uninstall logic, apply the same log-sink-injection behavior already present in runInstall.
