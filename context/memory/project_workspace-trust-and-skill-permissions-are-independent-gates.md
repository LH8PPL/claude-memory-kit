---
id: P-Z9LPQS3G
type: project
title: Workspace Trust and Skill Permissions Are Independent Gates
created_at: 2026-06-26T20:30:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e15952fecea538f050c0e98a506ce835dad6978eadf8a3127af9126e15f9c3c8
related: [workspace-trust-requirement-for-claude-skills, fresh-folder-verification-workflow-for-claude-memory-kit-rel, two-sub-test-method-for-isolating-skill-permission-gating]
---

When testing Skill() permissions in a new folder, expect TWO independent dialogs: **(1) Workspace-trust** ("Trust this workspace?") — prerequisite for ANY settings.json rules to take effect; **(2) Skill prompt** ("Use skill X?") — feature-specific gating. Accept trust first, then proceed with Skill testing. Conflating them masks real behavior.

**Why:** Kit settings are inert until folder trust accepted; testing Skill behavior before accepting trust produces false negatives.

**How to apply:** In future Claude Code tests, accept workspace-trust before interpreting any setting-related prompts or behavior.
