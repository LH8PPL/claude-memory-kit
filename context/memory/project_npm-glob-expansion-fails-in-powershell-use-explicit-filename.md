---
id: P-XHYR6U54
type: project
title: npm Glob Expansion Fails in PowerShell; Use Explicit Filename
created_at: 2026-06-26T15:37:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 55c35423dc021bca8d826cdfd20989129480b68948160130527c587dd32143ef
related: [v0-4-0-local-installation-workflow, rebuild-global-cmk-cli-binary-release-process, powershell-glob-behavior-explicit-filename-required-for-tgz]
---

On Windows PowerShell, `npm install -g .\pattern-*.tgz` fails with ENOENT because npm does not expand glob patterns. PowerShell passes the literal string `.\lh8ppl-claude-memory-kit-*.tgz` to npm instead of the resolved filename.

**Workaround:** Use the explicit filename instead:
```powershell
npm install -g ./lh8ppl-claude-memory-kit-0.4.1.tgz
```

**Why:** This is a fundamental difference between PowerShell (which does not auto-expand globs in command arguments) and bash (which does). npm relies on the shell to expand patterns, so it receives the literal string and cannot find the file.

**How to apply:** In release scripts or CI that targets Windows, always use explicit filenames for npm install -g, or wrap the glob in a more portable pattern (e.g., using Node's glob module or a loop).
