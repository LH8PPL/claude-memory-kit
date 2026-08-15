---
id: P-CX4MWULJ
type: project
shape: Timeless
title: Cursor hook debugging via environment probe
created_at: 2026-07-09T17:34:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 899be1214839ef33a07da0d62e54b1611a072bebc559fee73e707e60842c0be5
related: [mcp-server-state-isolation-in-testing, kiro-cli-integration-test-gate-and-reinstall, reliable-tarball-file-validation-with-npm-pack-json]
---

When debugging Cursor integration issues (e.g., hook invocation, environment inheritance), write a probe that logs:
- `process.cwd()` — working directory at hook invocation
- All `CMK_*` and `MEMORY_KIT_*` environment variables
- Relevant state files (e.g., gate-now.md, hook output)

Deploy the probe as the cursor-hook code, run one test turn in Cursor, then inspect the env dump to verify assumptions about environment inheritance.

**Why:** Cursor's hook spawning behavior and environment inheritance is opaque; these cannot be reliably inferred from code inspection. The logged env dump is definitive ground truth.

**How to apply:** When debugging cursor integration, prefer probe-based investigation (hypothesis → write probe → test in Cursor → inspect env dump) over code inspection alone.
