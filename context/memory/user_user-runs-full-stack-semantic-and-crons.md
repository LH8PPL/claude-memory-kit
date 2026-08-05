---
id: P-WT94TJSD
type: user
shape: State
title: user-runs-full-stack-semantic-and-crons
created_at: 2026-08-05T12:50:04Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 71682ca4daee34cc2035895773e36bb71fc2be685df6b1796bfe1e7db7db4902
related: [user-runs-full-stack-semantic-always]
---

The user runs the FULL stack on their projects: semantic search (`cmk install --with-semantic`) AND the scheduled crons (`cmk register-crons`) are both installed and running. Never assume otherwise.

**Why:** On 2026-08-05 the assistant made THREE false claims about the user's environment in one session — (1) described the cron scheduler flags before reading them, (2) said semantic "was never installed" after checking the wrong directory, (3) said the user "didn't run the --with-semantic / register-crons opt-in". All three were wrong: the index holds 2,321 real embeddings and the crons are registered and ran successfully. A fact already existed — user-runs-full-stack-semantic-always — and the assistant recalled past it.

**How to apply:** Before ANY claim about the user's installed state, config, or what they have/haven't run, CHECK it against the primary source (read the actual file / registry / index) AND consult recalled memory first — the same "did you check the primary source?" discipline the project binds for library claims, applied to claims about the user. Default assumption: the user has semantic + crons on.
