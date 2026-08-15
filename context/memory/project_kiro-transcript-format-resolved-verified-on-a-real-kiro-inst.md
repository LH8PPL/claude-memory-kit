---
id: P-NC2URWTD
type: project
title: Kiro transcript format RESOLVED (verified on a real Kiro install, D-180 follow-u
created_at: 2026-06-20T14:36:18Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 18268f33dea995106d04da21342f12b5d9496ccb60188331819ebcef53ccf76d
related: [task-50-highest-unverified-risk-kiro-transcript-format-is-un, kiro-hook-environment-verified-live-2026-06-21-the-probe-cap, kiro-has-four-install-surfaces-not-three-the-user-s-correcti]
---

Kiro transcript format RESOLVED (verified on a real Kiro install, D-180 follow-up): Kiro is a VS Code fork; transcripts live at %APPDATA%/Kiro/User/globalStorage/kiro.kiroagent/workspace-sessions/<base64url(workspacePath)>/. Each project dir has sessions.json (index: [{sessionId,title,dateCreated,workspaceDirectory}]) + one <sessionId>.json per chat with a .history[] array; each turn = {message:{role,content:[{type:'text',text}]}, contextItems, editorState}. Structured JSON with role+content — close to Claude Code's shape but JSON-per-session not JSONL, keyed by base64url workspace path.

**Why:** This was flagged as Task 50's highest unverified risk (kit hardcodes Claude-Code transcript touchpoints). Now resolved to LOW — the format is clean + parseable; only 3 per-agent params change (transcript dir, workspace->dir base64url mapping, JSON .history parse shape).

**How to apply:** In the Kiro adapter, set transcriptDir=globalStorage/kiro.kiroagent/workspace-sessions, workspaceKey=base64url(workspacePath), parse=JSON .history[].message{role,content[].text}. The kit's capture path must be parameterized to accept these per-agent instead of the hardcoded ~/.claude/projects/<slug>/<session>.jsonl.
