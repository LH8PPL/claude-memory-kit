---
id: P-4JXMa5HF
type: project
title: cmk install --with-semantic Command
created_at: 2026-06-18T11:42:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a68a0b0b0875552505125a791e2589e3d1d9c7f989dc60a9e3378593617eb44e
related: [cmk-install-with-semantic-scaffolds-semantic-recall, cmk-install-activation-and-native-memory-options, test-repo-1455-facts-activated-semantic-mode-today]
---

`cmk install --with-semantic` enables semantic search in a project.

Run from project folder. Scaffolds:
- `context/` directory structure
- Git hooks
- MCP server registration
- Local embedder (~260 MB)
- Search mode: hybrid (semantic + keyword)
- Pre-warms embedding model

Caveat: downloads @huggingface/transformers (pulls libvips/sharp native libs). DLL file locks may block installation, but kit gracefully falls back to keyword-only search.

**Why:** Core setup command for semantic search with documented graceful degradation on DLL lock failure.

**How to apply:** Use to enable semantic search. If blocked by DLL locks, keyword search continues working.
