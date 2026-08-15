---
id: P-VWaBFP75
type: project
title: Kit Delete-Guardrail False Positive on Commit Messages
created_at: 2026-06-26T15:28:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 14cef78309c9589de4485a198f06b2d7422624a95e8754372e92aedfb0319bf9
related: [commit-message-guard-rejects-literal-rm-rf-context-memory-st, kit-name-privacy-validator-for-auto-extract, kit-design-principle-zero-git-writing-code]
---

Guardrail fires on commit messages containing "Remove-Item" near memory-path text, even in commits that document (not execute) destructive changes. Design is intentional: false blocks are recoverable; false allows cause data loss.

**Why:** Prioritizes safety over user friction

**How to apply:** When writing commits for memory/tier changes, avoid "Remove-Item" + memory-path combinations in the message; use synonyms or restructure message if needed.
