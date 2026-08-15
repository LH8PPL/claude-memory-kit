---
id: P-JVSCKCFL
type: project
shape: Plan
title: Proposed Task Research Triage System
created_at: 2026-07-20T15:12:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 362069b728d70299ec5a76095880a6412721d7e1907aa052f7efda6ccbffee0a
related: [kiro-cli-popup-real-cause-cmk-is-npm-shim-not-exe-mcp-and-ho, session-state-at-pause-2026-07-20-pre-compact-v0-6-0-shipped, prior-art-research-discipline-and-filing]
---

When deciding if a task needs external research:
1. Check D-374 sweep for prior-art annotations already on the task entry
2. If notes are older than ~60 days AND task is about a live/copyable project → re-verify against current repo or web search
3. If task is in one of three corpus-gap areas → research is required:
   - Self-healing CLI repair UX
   - Command-obfuscation detection  
   - npm native-dep migration

Unconditional rule: Any task involving copying implementation details from another project always gets a fresh look at that project, regardless of note age.

For all other tasks (internal hygiene, no external copying), skip external research and note so explicitly.

**Why:** Notes decay rapidly on live projects—a May note is now ~2 months stale, making it a lead rather than ground truth. Uniform re-research on all tasks is wasteful (8 tasks have no external corpus to verify against). Targeted re-verification of copying-focused tasks catches real risks with minimal overhead.

**How to apply:** Run the three-question triage at task start. This approach is pending post-compact codification in CLAUDE.md as part of refined task research discipline.
