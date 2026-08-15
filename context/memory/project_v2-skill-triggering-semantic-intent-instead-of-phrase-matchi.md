---
id: P-M7ZYUVES
type: project
title: 'v2 Skill Triggering: Semantic Intent Instead of Phrase Matching'
created_at: 2026-06-14T15:42:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0a48b356018f6cf628b6daebe0fcf33e3137cffdf2fe184b0e5c77eadd05acc5
related: [b3-b4-wedge-test-workflow-cross-project-doctrine-capture-val]
---

- v1 used brittle phrase-matching; v2 shifts to semantic intent matching (grounded in research: Anthropic's skill-creator + 9 cloned memory repos)
- v2 skill description: leads with general principle ("Fire whenever the answer might be something the project already established, however the question is phrased") + oblique example + hint-reference
- Key pattern from memsearch: skill description should explicitly reference the `[claude-memory-kit] Memory available` hint that appears per-turn; this link was missing in v1
- Deployed in cut-gate11 branch

**Why:** Phrase-matching fails for esoteric/roundabout questions; semantic intent + hint-reference generalizes across varied phrasings.

**How to apply:** Validate with deliberately oblique questions (e.g., "Why is everything so spread out?", "How come the route files barely have anything in them?"). Track whether memory-search fires for non-precise questions. Test in cut-gate11 after restarting Claude Code.
