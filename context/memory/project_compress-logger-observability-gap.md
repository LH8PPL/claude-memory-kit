---
id: P-PVAPFJMR
type: project
title: Compress Logger Observability Gap
created_at: 2026-06-19T05:25:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 89be480d500ad099028ef07dbfb211b49d0df388fb94454d7f08cc33a3b8d33d
related: [live-cut-gate-requirement-unit-green-works-on-real-input, sonarcloud-then-in-object-false-positive-schema-fields, vitest-pool-corruption-transient-load-failures]
---

When compression fails, the kit's logger discards subprocess stderr and exit code. The compressor captures these details (compressor.mjs:285-296) at runtime but compress.log stores only error_category (e.g., "compress_failed"), not the actual reason.
- Failure modes can't be diagnosed (transient vs. deterministic unknown)
- Blocks retry logic design (can't know what we're retrying or why)
- Prior failures lost to investigation (forced guessing instead of data)

**Why:** Without stderr/exit-code in the log, the kit can't diagnose actual failure reasons. This prevents knowing whether failures are transient (worth retrying) or deterministic (unfixable by retry).

**How to apply:** Capture stderr and exit-code into compress.log as a prerequisite before designing retry behavior.
