---
id: P-254aD3SC
type: project
shape: State
title: Test repo (1455 facts) activated semantic mode today
created_at: 2026-07-07T14:46:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fd957aa9f9bf84ef1309b036d3f5a0132866aab1d793970873af1b220d3c37b1
related: [standard-cmk-installation-command, cli-installation-verification-workflow, research-notes-indexed-via-research-index-not-documentation]
---

This repo has 1455 facts in its index (~471 uncached for embedding). Today's `cmk install --with-semantic` switched from FTS (keyword search) to hybrid semantic search. This is the first time semantic mode has been active.

**Why:** Context for why the memory leak manifests here (scales cleanly on empty repo, unbounded on 1455 facts).

**How to apply:** Use 1455 as baseline when testing semantic features or performance; verify sublinear scaling.
