---
id: P-JGNBLDR3
type: project
title: 'Embedding Model Trade-off: bge-base vs bge-m3 (Benchmarked Choice)'
created_at: 2026-06-10T20:20:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 44fe675453c5ee16dc523f8d6bee37afccd05582
related: [research-inclusion-bar-for-sources-artifact]
---

**Kit choice:** bge-base (smaller model)
**External system:** bge-m3 (larger model, no visible empirical testing)

**Kit's evidence:** D-109 benchmark tested both on short-fact retrieval (the kit's core task). bge-m3 scored worse: 0.765 mAP vs bge-base's 0.941 mAP.

**Context:** Milvus vs sqlite-vec is a genuine server-complexity trade-off; kit chose simplicity (in-process, git-native).

**Why:** Model selection must be task-specific. bge-m3 is not universally better — it underperforms on the kit's exact retrieval challenge. The benchmark (D-109) grounded this choice in data, not vibes.

**How to apply:** Before upgrading models, re-run D-109 on short-fact retrieval. Treat bge-base as the baseline. Upgrade only if benchmarks show gain on the actual use case.
