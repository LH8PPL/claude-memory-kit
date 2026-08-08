---
id: P-PZ6QNHQA
aliases: [P-PZ6QNHQA]
type: project
shape: Timeless
title: Edge Headless Screenshot Testing Blocked (VBS Enclave Error 577)
created_at: 2026-08-05T21:27:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c6e39d7e73a41bb6827deaf33bb372c5945908a1c7555060405d59415763c8bf
---

Edge's headless mode fails on this machine due to VBS enclave restrictions. Programmatic screenshot verification is not possible.

**Why:** Cannot visually verify rendering via automation; all graph/UI changes require manual user verification

**How to apply:** Do not attempt headless screenshot tests for graph or viewer changes; design workflows that include manual verification step
