---
id: P-9TVaG53C
type: project
title: onnxruntime-node CI Download Flakiness
created_at: 2026-06-16T14:04:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f1429ad4cc1721b092f664f007b735b9bacdbeca193d1b81635ec02bc795babf
related: [onnxruntime-node-postinstall-cdn-timeout, vitest-pool-corruption-transient-load-failures, v0-3-2-published-to-npm-with-provenance]
---

- The project includes `onnxruntime-node` as an optional semantic embedder dependency
- During `npm ci`, it downloads a large binary that causes timeouts on shared CI runners
- Failure mode: `ETIMEDOUT` when downloading the binary during npm install
- Known workaround: Re-run the job — almost always succeeds on retry
- Persistent failures should trigger workflow tweaks (retry logic, caching)

**Why:** Distinguishes transient network flakes from real code/release problems; prevents false alarm investigation

**How to apply:** When CI publish fails with ETIMEDOUT on onnxruntime-node, retry the job first. Only investigate deeper if retries consistently fail. If it becomes a pattern, add retry/caching to publish.yml.
