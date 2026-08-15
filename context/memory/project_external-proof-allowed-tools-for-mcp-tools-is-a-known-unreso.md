---
id: P-GSNNFRNE
type: project
title: 'External proof: allowed-tools for MCP tools is a known unresolved CC bug (#17499, #18837→#14956 cluster)'
created_at: 2026-06-27T18:08:28Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: b6761e0535c39ca7d89b60b1a5e31cbfec5f35aaaab43d774429aa3d384a24da
related: [complete-design-one-permissionrequest-hook-mcp-cmk-skill-mat, best-fix-permissionrequest-hook-auto-approving-mcp-cmk-keeps, q1-popup-is-a-cc-2-1-x-change-not-a-kit-regression-q2-allowe]
---

EXTERNAL CONFIRMATION — allowed-tools for MCP tools is a KNOWN, UNRESOLVED Claude Code bug (not just us). Two GitHub issues the user found: (1) anthropics/claude-code#17499 [DOCS] "Syntax for allowed-tools in skills" — a developer tried EXACTLY our pattern (MCP tool in a skill's allowed-tools to auto-approve it) and "claude STILL asks for permission before executing the tool." Anthropic's resolution clarified general syntax but EXPLICITLY left UNRESOLVED: "the specific requirement to document and provide examples for MCP tools within the allowed-tools field remains unaddressed"; the reporter's mcp__..._..._startreview attempt FAILED. So auto-approving MCP tools via skill allowed-tools is officially under-documented + unreliable. (2) anthropics/claude-code#18837 "allowed-tools in skill frontmatter not enforced" — "appears to be ignored entirely" — marked DUPLICATE of #14956 (cluster: also #13048, #16389), i.e. a RECURRING known problem that allowed-tools doesn't work reliably. STRATEGIC IMPLICATION: do NOT build the kit's fix on the skill allowed-tools MCP grant — it's a known-flaky CC surface (worked in v041g/h but is documented unreliable, and broke for us today, consistent with the 2.1.x permission tightening). Move to a DIFFERENT, documented mechanism: (a) the PermissionRequest hook (user's idea, being tested v041l — separate machinery, documented for auto-approve), or (b) the Bash-CLI route (cmk remember / --from-file, avoids MCP tools entirely, restores the original Task-69 design). This confirms the popup is a CC-side issue affecting multiple developers, not a kit regression.

**Why:** Two GitHub issues from other developers confirm auto-approving MCP tools via skill allowed-tools is a known, unresolved Claude Code problem — Anthropic explicitly left the MCP case unaddressed (#17499) and allowed-tools enforcement is a recurring bug cluster (#18837/#14956). This means the kit must not depend on that surface and should use a different documented mechanism (PermissionRequest hook or Bash CLI).

**How to apply:** Task 172: do NOT rely on skill allowed-tools for MCP auto-approve (known-flaky). Prefer the PermissionRequest hook (matcher mcp__cmk__.*, documented auto-approve machinery) — verify live in v041l. Fallback: Bash-CLI route. Reference issues #17499 and #18837/#14956 in the DECISION-LOG entry as external evidence the popup is CC-side.
