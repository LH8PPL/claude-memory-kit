---
id: P-5WHKZPR3
type: project
title: Kit's memory system uses a `now → today → recent → archive` rolling window; `now
created_at: 2026-06-20T07:19:00Z
write_source: user-explicit
trust: high
source_file: review-promote
source_line: 1
source_sha1: 7c12783c35d5698e649038731dadbacc2958f80366edbab2828814966e4f4e89
related: [root-cause-roll-mechanism-fires-only-at-wyeexzrn]
---

Kit's memory system uses a `now → today → recent → archive` rolling window; `now.md` grows unbounded within a session due to roll firing at session boundaries only (causes 470KB+ buffers).
