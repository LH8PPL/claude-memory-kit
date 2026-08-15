---
id: P-WMRV9JB5
type: project
title: Linting Memory Files Produces Excessive Noise
created_at: 2026-06-23T06:12:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 541e2b02abfb683eb4202a7891a6c8b945887cf2ffa48e81f552c10054c64414
related: [markdown-yaml-spell-linting-disabled-in-ci-by-design, sensitive-content-policy-for-memory-capture-system]
---

The 597 memory files in `context/` use intentional non-standard markdown formatting (HTML comments, example bullets, no heading hierarchy) that is appropriate for memory storage but would be flagged as violations by markdownlint/codespell/yamllint.

**Problem:** These linters would treat machine-generated memory as documentation and flag it heavily, producing signal-killing noise.

**Solution:** Exclude `context/`, `template/`, and transcript directories from linting, or skip markdown/spell linters entirely.

**Safe additions:** actionlint (workflows only) and ShellCheck (shell scripts only) never touch memory files—pure signal, no memory-file contact.

**Why:** Machine-generated memory has formatting constraints different from hand-authored docs. The kit deliberately ships memory templates with formatting that linters would flag. Linting them misidentifies intentional structure as violations.

**How to apply:** When adding linters, check which file types each touches. For this project, favor actionlint + ShellCheck (no memory contact) over markdownlint + codespell (heavy memory-file noise). If linting markdown, update .markdownlintignore or .codespellignore to exclude context/ and template/.
