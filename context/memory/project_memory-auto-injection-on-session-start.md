---
id: P-ENDELV5A
type: project
shape: Timeless
title: Memory Auto-Injection on Session Start
created_at: 2026-07-08T07:01:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 64e30ef62db63f5eed4433efae3b473547210d76647c14439794a7db10b9adfd
related: [kiro-cli-automatic-memory-capture-works, kit-name-privacy-validator-for-auto-extract, 356-dispatch-agent-killed-fix-batch-does-not-auto-start]
---

The memory system (claude-memory-kit) auto-injects saved memory entries on the next session start. This mechanism is being dogfooded in this very project — Task 148's resume plan was saved in memory `P-L7C2aAaa` and will be auto-injected when the next session begins.

**Why:** Understanding this mechanism helps explain why the resume plan doesn't need to be manually re-read; the system handles handoff automatically. This is a core feature of the kit being built.

**How to apply:** On next session, the resume memory `P-L7C2aAaa` will be available in context. Use it immediately to continue Task 148 without re-reading prior conversation.
