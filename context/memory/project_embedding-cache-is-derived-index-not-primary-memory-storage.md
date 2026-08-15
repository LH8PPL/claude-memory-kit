---
id: P-G4A3M9XE
type: project
shape: Timeless
title: Embedding Cache is Derived Index, Not Primary Memory Storage
created_at: 2026-07-07T18:06:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: da3ba604723214081caa9ae59b17864066d1916a6997ce264199a73f524b4178
related: [version-snapshot-in-recent-md-guards-against-cross-session-a, pre-commit-hook-sanitizes-fact-files-for-security, minor-release-triggers-backlog-sweep]
---

The embedding_cache stores vector representations of fact file bodies (used for semantic search), NOT the facts themselves. Fact files are stored independently in context/memory/. When cache is wiped (e.g., during leak reproduction), the 1451+ fact files survive completely intact; only cached vectors need recomputing. Cache rebuilds automatically on next semantic search/sweep with expected slowness on first query.

**Why:** Clarifying this separation prevents mistaking cache loss for memory loss and explains expected performance degradation during cache rebuilds.

**How to apply:** If a session experiences slow semantic search after cache clear, know it is normal and self-healing. Cache loss does NOT mean data loss.
