---
id: P-HaQ9X72G
type: project
title: kiro-cli PreToolUse Matcher Syntax (Literal Strings Only)
created_at: 2026-06-23T19:56:23Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1fd51ceef2f682d208c2db5a9ee914ed4306b9c985228da9553a53de5a2f098a
related: [doc-completeness-validator-hook-behavior-coverage-gap, kg-guard-failed-matcher-pipe-alternation-not-literal, tool-execution-in-kiro-cli-requires-tools-config]
---

kiro-cli `preToolUse` hook matchers are **literal strings only** — regex and pipe-alternation syntax will silently fail.

Example:
- ❌ Broken: `'execute_bash|executeBash|shell'` (treated as literal string, matches nothing)
- ✅ Fixed: `'*'` (matches all tools)

The delete-guardrail was non-functional because its matcher used unsupported syntax.

**Why:** PR #224 discovered this during guardrail testing; the bug went undetected until explicitly tested, confirming it was a critical cut-blocker.

**How to apply:** When writing kiro-cli `preToolUse` hooks, use only literal strings or `'*'`. Do NOT use regex or pipe-alternation syntax.
