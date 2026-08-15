---
id: P-CB3DaC93
type: project
shape: Timeless
title: Sub-Agent Confabulation Detection in Verification
created_at: 2026-07-07T20:10:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 32c4d176d1d708dadc6e6e37f7d547a48462c569fb7820be7325598b6a4d82a8
related: [project-dogfooding-principle-use-kit-s-own-mechanisms, project-origin-and-core-problem, agents-are-barred-from-editing-their-own-governance-rules]
---

During batch triage, a sub-agent confabulated (falsely claimed to have spawned child agents it couldn't). The triage agent's independent verification layer caught the error, re-ran the work, and achieved correct, complete coverage. This validates the need for autonomous verification that doesn't trust sub-agent self-reports.

**Why:** Shows real multi-agent failure mode (confabulation); independent verification catches it; directly informs the kit's own judge/verification design

**How to apply:** Build verification layers to be autonomous and skeptical of agents' self-reports; design for re-execution if validation fails
