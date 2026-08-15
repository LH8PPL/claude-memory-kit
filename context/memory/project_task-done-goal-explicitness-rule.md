---
id: P-4KZ72VGV
type: project
title: Task Done-Goal Explicitness Rule
created_at: 2026-06-18T05:33:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bde34bfb9c296f4fbbb3da13562e36734e374214b926be1e7bca3ec0cb999c9a
related: [test-anti-pattern-setup-commands-masking-automation, a-health-check-behind-a-command-does-not-surface-a-silent-fa, task-laning-strategy-and-trigger-discipline]
---

Every task must state its done-goals as explicit checkboxes or a `Done when:` list.
  
  For "automatic" features (no manual command required): at least one criterion must explicitly assert the automatic path — e.g., ☐ X happens with no `cmk <cmd>` run by hand.
  
  Red-flag heuristic for tests: if a test runs a setup command before asserting, it may be masking the automatic path. Ask: does a real user run this, or does a hook?

**Why:** D-169 was missed because automatic behavior was tested, but every test ran `cmk digest` manually first — masking that the automatic hook wasn't implemented. Explicit checkboxes make gaps impossible to ignore. This rule bookends the existing "live-test every task" rule.

**How to apply:** Write task done-criteria as checkboxes. For "automatic" features, include ☐ X happens with no manual setup command. Flag tests that run setup commands with: "Is this supposed to be automatic? Where's the hook?"
