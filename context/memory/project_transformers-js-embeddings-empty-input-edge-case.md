---
id: P-LNY7BYDV
type: project
shape: Timeless
title: 'Transformers.js Embeddings: Empty Input Edge Case'
created_at: 2026-07-07T15:37:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4a06983a7fb27cc6386cc2159bf18627753028a71b81a6ccea2e4caf08ddc3cc
related: [critical-order-preservation-in-embedding-mapping]
---

Mean-pooling over empty token sequences produces NaN/degenerate vectors. Empty or whitespace-only bodies reach embedder unfiltered. Content-addressed cache means corrupt embeddings persist.

**Why:** No upstream validation. Silent failure risk.

**How to apply:** Consider skipping or truncating empty bodies before embedding. When debugging embedding anomalies, check for empty inputs.
