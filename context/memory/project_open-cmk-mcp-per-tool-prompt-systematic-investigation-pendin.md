---
id: P-YQX7SDVV
type: project
title: 'OPEN: cmk MCP per-tool prompt — systematic investigation pending'
created_at: 2026-06-27T13:33:16Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 65baa4e69d41f981230370b00ea5d1e27e9547060b535ca9c199343d1bfc240e
related: [mcp-prompt-two-gate-model-gate-1-server-approval-is-the-unte, cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools, cc-update-does-not-fix-mcp-prompt-task-171-validated]
---

OPEN INVESTIGATION (post-restart, systematic): the cmk MCP per-tool permission prompt ("Do you want to proceed with mcp__cmk__mk_search/mk_remember?") fires for EVERY cmk MCP tool, in EVERY folder INCLUDING this dev repo (c:/Projects/claude-memory-kit) — there is NO prompt-free reference folder. Corrected false assumption: the dev repo is NOT prompt-free; the user has to click allow there too (mk_remember "working" this session was the user clicking allow, not auto-approval). VERIFIED FACTS: (1) kit registers cmk ONLY at project scope via .mcp.json (settings-hooks.mjs:283-300), no user-scope path exists. (2) Adding the 11 specific mcp__cmk__<tool> names to settings.json permissions.allow (Task 171) does NOT suppress the prompt. (3) Adding enabledMcpjsonServers:["cmk"] to committed settings.json did NOT suppress it. (4) The dev repo has enabledMcpjsonServers:["cmk"] in settings.local.json AND hasTrustDialogAccepted:true in ~/.claude.json AND the allow-list — and STILL prompts. So none of the kit's writable settings pre-approve project-scope .mcp.json tools on this CC version. NEXT (agreed plan): user restarts machine, then re-read CC docs (permissions, settings, MCP, CHANGELOG) systematically and build an evidence table BEFORE forming a fix hypothesis. Candidate (UNVERIFIED): register cmk at --scope user.

**Why:** Two wrong theories were chased today (Task 171 allow-list; a false 'dev repo is prompt-free' reference). The corrected facts must survive the restart so the investigation resumes from verified ground truth, not from a faded or wrong assumption.

**How to apply:** After restart: do NOT jump to a fix. Re-read CC docs + changelog end-to-end, build an evidence table (what gate fires, per-tool vs per-server, per-session vs every-call, which settings file CC actually reads MCP approvals from), THEN form one hypothesis and test it before any code change. Per the user: stop running around; be systematic.
