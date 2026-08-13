---
id: P-ZB2AUXAV
type: project
title: Claude Code `cd &&` Compound Command Prompting Edge
created_at: 2026-06-28T10:45:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 91f0c752959c710c9f62413ee8c3ec8cc221fd87208fa5bb25d07227481a2f1a
related: [cmk-permission-prompt-only-on-cd-compound-d-80-edge, bash-tool-cwd-persists-cd-into-a-workspace-silently-reroutes, diagnostic-test-statement-for-skill-capture]
---

Claude Code evaluates bash commands per-subcommand. When a compound command starts with `cd <absolute-path> &&`, the `cd` operation itself isn't auto-approved (absolute-path `cd` is not allow-listed), causing the entire compound to prompt for permission—even if the trailing command (e.g., `cmk search`) is normally allow-listed.

**Why:** This is a documented edge case (gate doc D-80 / §16.57). It does NOT indicate a capture flow failure; gate sessions 1-2 confirmed the actual capture sequences were prompt-free. Future sessions may encounter this when running verification commands.

**How to apply:** If verification commands prompt unexpectedly, click Yes to proceed—the operation succeeds regardless. To avoid the prompt, run commands from the project directory and omit the `cd <path> &&` prefix.
