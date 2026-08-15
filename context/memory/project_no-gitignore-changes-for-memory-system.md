---
id: P-UERZGMVJ
type: project
title: No Gitignore Changes for Memory System
created_at: 2026-06-22T13:38:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0b115af42f6915f73c516eed1066118f834fb47aff3f86096568f5b586ee258c
related: [cut-gate-sandbox-isolation, fact-file-write-constraint-forward-only-no-mass-rewrites, commit-guardrail-blocks-ambiguous-include-exclude-instructio]
---

User explicitly does not want gitignore modifications, transcript-commit, or related git filtering changes to the memory system going forward. This decision follows a data-loss scare that was resolved by discovering off-machine backup (Google Drive sync) was the real safety net.

**Why:** User's existing backup redundancy (Google Drive sync) already provides resilience. Adding more git-level logic post-incident introduces complexity without additional safety benefit and erodes trust after a scare.

**How to apply:** Do not propose or implement gitignore, transcript-commit, or git-filtering changes in this project's memory system. If memory safety concerns arise, suggest only truly defensive measures (e.g., delete guardrails via hooks, which operate outside git).
