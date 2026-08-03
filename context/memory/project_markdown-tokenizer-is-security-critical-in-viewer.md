---
id: P-ZDAQQ9MY
aliases: [P-ZDAQQ9MY]
type: project
shape: Timeless
title: Markdown Tokenizer is Security-Critical in Viewer
created_at: 2026-08-03T17:29:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4e0f685d50438e913164127e7bd09d68459399741bc68d69a42e7b0ce6254346
---

The viewer's markdown tokenizer processes untrusted data (fact body content) and sits at the XSS threat boundary. Any changes to tokenizer behavior or output require security review in the reviewer pass. This is a poisoned-memory → XSS risk path and is the riskiest component of viewer work.

**Why:** Untrusted user/system data flows through the tokenizer; a vulnerability here could leak or corrupt the viewer's rendered output.

**How to apply:** When planning viewer or tokenizer changes, flag this for review and ensure XSS validation is run.
