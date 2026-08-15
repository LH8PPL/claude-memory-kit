---
id: P-NQE5ULVa
type: project
shape: Timeless
title: 'Critical: Order Preservation in Embedding Mapping'
created_at: 2026-07-07T15:37:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c7a8cb3dd65b51a8db176c4706938febb81b2819f60e275a5ee9ce47f366e77a
related: [transformers-js-embeddings-empty-input-edge-case]
---

When batching embeddings, output vector order must exactly match input body order. If extractor() returns fewer vectors than inputs, the tail mapping silently shifts — later plans get wrong embeddings in the durable content-addressed cache.

**Why:** Cache is sha-indexed, so bad embeddings persist across sessions and corrupt all future queries. Silent failure — no error raised, just wrong results downstream.

**How to apply:** Always assert output_vectors.length ≡ input_bodies.length before mapping. Fail-closed ({ok:false, reason:...}) rather than silently corrupting cache. Test with spy-extractor that varies output length.
