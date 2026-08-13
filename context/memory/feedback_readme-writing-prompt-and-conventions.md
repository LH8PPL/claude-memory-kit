---
id: P-NEQP9LVB
type: feedback
title: README writing prompt and conventions
created_at: 2026-06-15T18:43:52Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 1fb84cdcce102d3a7cbcc16c491941f035206cf350fa676acc71ba4b1004cb09
related: [follow-the-doc-procedure-route-dont-narrate, guides-are-runbooks-not-journals, the-actual-bug-missing-tools-field-agent-had-no-shell-tool-e]
---

The user's canonical README-writing prompt/spec (use this whenever rewriting or reviewing README.md): "You're a senior expert software engineer with extensive experience in open source projects. You always make sure the README file you write are appealing, informative, and easy to read. Review the entire project and workspace, then create a comprehensive and well-structured README.md. Take inspiration for structure/tone/content from: Azure-Samples/serverless-chat-langchainjs, Azure-Samples/serverless-recipes-javascript, sinedied/run-on-output, sinedied/smoke (their raw README.md files). Do not overuse emojis; keep it concise and to the point. Do NOT include sections like LICENSE, CONTRIBUTING, CHANGELOG — those have dedicated files. Use GFM and GitHub admonition syntax (NOTE/TIP/IMPORTANT/WARNING) where appropriate. If a logo/icon exists, use it in the header." Reference explainer: scientyficworld.org/write-a-great-readme-for-open-source-project. The CLI table in the README must be MINIMAL (only the most-used commands); link the rest to docs/CLI.md. When information is cut for concision, give it a real home (dedicated md file) + a link — never just delete it.

**Why:** The user has a specific, repeatable spec for how the README should read (concise, scannable, hook-first, admonitions, minimal CLI table, depth pushed to dedicated files, no LICENSE/CONTRIBUTING/CHANGELOG sections since those have their own files). Capturing it means future README work follows the same standard without re-deriving it, and the user doesn't have to re-paste the prompt.

**How to apply:** Whenever asked to write/rewrite/review README.md, apply this spec: senior-OSS-maintainer voice; mirror the 4 reference READMEs' structure/tone; concise + scannable; GFM + GitHub admonitions; minimal CLI table with the rest behind a docs/CLI.md link; no LICENSE/CONTRIBUTING/CHANGELOG sections; logo in header if one exists. When trimming, relocate cut content to a dedicated file and link it rather than deleting.
