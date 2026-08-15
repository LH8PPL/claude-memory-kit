---
id: P-GZR7BG2Q
type: project
title: Hardcoded Model Version in Commit Trailer Goes Stale on Model Switch
created_at: 2026-06-13T08:01:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: aae87962252dfd3a1241070a467cd40155b37e94
related: [version-snapshot-in-recent-md-guards-against-cross-session-a, paper-trail-convention-tasks-md-as-single-source-of-truth, cmk-install-skips-existing-files-cannot-repair-stale-skills]
---

The CLAUDE.md commit-trailer rule currently contains a hardcoded model identifier (`Co-Authored-By: Claude Fable 5`). When you switch between Claude models mid-session via `/model` commands, this trailer does not update and becomes inaccurate on commits created after the model change. This occurred on commits earlier in this session after switching to Opus.

**Why:** You work with multiple Claude models in a single session and switch between them. Static trailers mean commit metadata no longer reflects which model actually created the code.

**How to apply:** For the next session, decide whether to either (a) accept the trailer as a project-level marker ("Claude Code co-authored") rather than per-commit model truth, OR (b) update CLAUDE.md to use a model-neutral form (e.g., `Co-Authored-By: Claude <noreply@anthropic.com>`) that won't become stale when models switch.
