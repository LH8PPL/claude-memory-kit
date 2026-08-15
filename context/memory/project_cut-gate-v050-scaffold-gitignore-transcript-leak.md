---
id: P-RHDTAZZL
type: project
shape: State
title: cut-gate-v050-scaffold-gitignore-transcript-leak
created_at: 2026-07-07T19:32:42Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: e784ed1a3514fcac1d7c6bbf8d7110a1cdc1495f631b13187bc84339b89761f7
related: [cut-gate-v050-transcript-privacy-is-task-148-trigger-fired, task-148-v050-scope-transcript-path-not-just-fact-classifier, dogfood-proof-fact-path-needs-the-privacy-screen-too]
---

CUT-GATE FINDING (v0.5.0 cold-open gate, 2026-07-07): the scaffold .gitignore fragment (template/.gitignore.fragment) does NOT gitignore context/transcripts/*.md or context/sessions/now.md|today-*.md — it only ignores context/sessions/*.extract.log + context/transcripts/.extract-*.tmp. So a new user who runs 'git add -A' commits RAW un-screened transcript content. The Session-3 cold-open transcript literally captured '«NAME» / «EMAIL» (the maintainer's git-config identity)' (from uv init reading git config, echoed in tool output) into context/transcripts/2026-07-07.md, which git add -A WOULD stage. Design intent (design.md:3268) is that transcripts ARE committed by default (memory-travels-with-git). BUT D-108 (CLAUDE.md:353) gitignores transcripts/+sessions/ in the DEV repo ONLY, calling it a 'public-repo deviation (name-privacy class)'. The gap: the maintainer protected their own public repo but the scaffold ships commit-by-default to ALL users with NO warning + NO guard, so a public-repo user leaks names/emails/paths/secrets. Curated tiers (memory/ facts, MEMORY.md, USER tier) are CLEAN — the leak is only the raw transcript/session tiers. This is a cut-blocker for v0.5.0: decide install-time public-repo detection + auto-gitignore, OR a scaffold warning, OR ship the dev-repo's transcripts/+sessions/ ignore lines by default.

**Why:** A public-repo cmk user commits raw un-screened conversation (names/emails/secrets from tool output) because the scaffold gitignore protects only the .tmp/.log, not the raw transcript/session .md tiers. The dev repo fixed this for itself (D-108) but the fix never propagated to the shipped template.

**How to apply:** Before tagging v0.5.0, decide the guard: (a) cmk install detects a git remote / public repo and adds transcripts/+sessions/ to the ignore fragment; (b) a scaffold warning + doc; (c) ship the dev-repo ignore lines by default and let private-repo users opt IN to committing. Recommend (a) or (c). Curated tiers are unaffected.
