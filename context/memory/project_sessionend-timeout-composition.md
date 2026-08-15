---
id: P-7QA5WVBP
type: project
shape: State
title: SessionEnd Timeout Composition
created_at: 2026-07-10T20:36:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f0815b9bc259eec28f1c9ee2ccac4424eeaf253060ae6ccf862f7a9c370cce57
related: [idiomatic-timeout-composition-pattern-50s-120s]
---

`autoPersona` default timeout is 50_000 and correctly composes with 60s ceiling across four concurrent SessionEnd Haiku calls. Timeout-composition discipline verified at all sites; recursion guard correct everywhere needed.

**Why:** Core design parameter for concurrency/timeout safety; review-validated architecture

**How to apply:** Reference when reviewing or modifying hooks/session timeout-related code
