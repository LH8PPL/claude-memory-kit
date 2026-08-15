---
id: P-N39ZJ69D
type: project
title: Kiro IDE hooks are a BETTER fit for the kit than I first concluded (verified acr
created_at: 2026-06-20T20:54:34Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: dae5f2e324f0d8fbde3c438cebe35189b595661f72c0b993d9f072ba67db0772
related: [kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook, correction-to-d-182-2026-06-21-the-survey-s-claim-ide-kiro-h, kiro-has-four-install-surfaces-not-three-the-user-s-correcti]
---

Kiro IDE hooks are a BETTER fit for the kit than I first concluded (verified across kiro.dev/docs/hooks/types + /actions + /examples). IDE hooks: (1) have AUTOMATIC triggers incl. 'Agent Stop' (fires when agent finishes a turn = capture-at-turn-end) + 'Prompt Submit' (= inject-on-prompt) — NO agent selection needed, unlike CLI custom-agent hooks; (2) support a 'Shell Command action' that runs an arbitrary local CLI and ADDS ITS STDOUT TO THE AGENT'S CONTEXT (exactly what cmk-inject-context needs) + has / variables; (3) timeout configurable (default 60s). NO session-start trigger (only Prompt Submit). THE BLOCKER: kiro.dev deliberately does NOT document the on-disk .kiro.hook file format — hooks are a UI-created artifact ('describe in natural language or fill out a form'). So an INSTALLER must reverse the format from REAL committed .kiro.hook files (e.g. awsdataarchitect/kiro-best-practices, aws-samples repos), not docs. Per D-180 a real file is JSON: {enabled,name,description,version:'1',when:{type:'fileEdited',patterns:[]},then:{type:'askAgent',prompt}}.

**Why:** This reverses my earlier 'CLI hooks are the target' conclusion. The IDE surface has automatic turn-end + shell-command-with-context-injection — a cleaner fit for the kit's auto-memory model than CLI custom-agent hooks (manual). The cost: the .kiro.hook format is undocumented, so it must be reverse-engineered from real repos + live-verified (the §5.1 convergent-third-party rule — and here even docs fail, so REAL files are the only primary source).

**How to apply:** For the kit's Kiro support, evaluate the IDE-hooks path: write .kiro/hooks/*.kiro.hook files (format from real repos) with Agent-Stop→shell-command(cmk capture) + Prompt-Submit→shell-command(cmk inject). MCP+steering shared with CLI. BUT: format is undocumented → MUST live-verify by creating a hook in the real Kiro UI + inspecting the emitted file before shipping. The CLI path (custom-agent hooks) remains manual-only. Decide IDE-path vs CLI-path vs both as the Kiro install target.
