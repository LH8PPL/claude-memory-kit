---
id: P-NFMBCMTA
type: project
shape: Absence
title: Task 205 Preflight Fires on Wrong Trigger (Design Flaw)
created_at: 2026-07-12T12:01:50Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 64e0a9deacf0255841b8265e51d1f1def703262858a96e8deaf30781945476c5
related: [claude-memory-kit-dogfooding-setup-and-conflict-surface, task-205-preflight-ux-design-wart, mcp-preflight-project-install-vs-global-upgrade]
---

The MCP-server-stop preflight (Task 205) fires on *every* interactive `cmk install`, but the actual hazard—DLL locking from `npm install -g` upgrades—is a *different* command the kit cannot hook. Result: the prompt's correct answer is always N on normal project installs (friction ~95% of the time), while the real hazard (upgrade + live servers) goes unguarded by this mechanism.

**Narrow scenario where it's useful:** user about to globally upgrade while servers are already running. Real, but rare.

**Why this is a design flaw:** the warning is correct about the existence of a hazard, incorrect about which command causes it. Prompting for N on safe operations is UX antipattern.

**Why:** Found live during cut-gate: user tried to install to a temp folder while the kit was dogfooding itself. Preflight correctly warned that servers + global state = hazard, but wrongly implied *this install* caused it (it doesn't—only global upgrades do).

**How to apply:** File a D-302 follow-up: narrow the trigger to re-install-over-existing-global scenarios (detect if one already exists), move the check to `cmk doctor` (one-time advisory), or gate it only when upgrade context is detectable. This is a design issue cut-gates surface that automated suites structurally cannot see.
