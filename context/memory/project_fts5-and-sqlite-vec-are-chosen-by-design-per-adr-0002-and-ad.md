---
id: P-CWTW7GT6
type: project
title: FTS5 and sqlite-vec are chosen by design per ADR-0002 and ADR-0015
created_at: 2026-06-15T12:19:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 35ce7271ad03a80aa5643056cdffe65b062fd45eaee4864810a04f97604782ad
related: [everos-comparison-same-thesis-opposite-architecture-not-bett, cmk-install-activation-and-native-memory-options, kiro-cli-auto-loading-verified-d-181-follow-up-kiro-dev-docs]
---

The kit's architecture (FTS5 keyword search + sqlite-vec semantic search) stems from two non-negotiable tenets:

**ADR-0002 — Markdown is truth.** FTS5 is a regenerable cache, never authoritative. Memory files are plain-text markdown that users can read, edit, and merge in git. This rejects opaque vector DBs (Chroma, Milvus, used by other projects like claude-mem, memsearch) which don't diff or merge. The trade-off: hand-editability over semantic-recall-at-scale.

**ADR-0015 — Local-first, no server.** Instead of server-backed vector DBs, the kit uses sqlite-vec (~300 KB) embedded in the same better-sqlite3 file, with a local ONNX embedder. One store, no server, vectors remain regenerable. FTS5 keyword search is always available as the default when the optional embedder is not installed.

**Why:** These are foundational architectural constraints. Future sessions may encounter FTS5 recall limitations or proposals to switch to a vector DB; understanding these tenets is essential to evaluating such requests.

**How to apply:** Before proposing a change to search or indexing architecture, consult ADR-0002 (markdown-as-truth) and ADR-0015 (local-first, sqlite-vec). Flag any change that would violate these tenets.
