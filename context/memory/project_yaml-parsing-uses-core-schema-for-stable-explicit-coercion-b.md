---
id: P-U7NPPSEV
type: project
shape: State
title: YAML parsing uses CORE_SCHEMA for stable, explicit coercion behavior
created_at: 2026-07-14T18:42:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 022826bfcaee71777d641f4ec4058d679db1a81e16da2d8979c6a27732144eda
related: [vitest-pool-corruption-transient-load-failures]
---

- **Tool**: js-yaml 4.3.0 (minor upgrade from 4.2.0)
- **API**: `yaml.load` / `yaml.dump` with `CORE_SCHEMA` (js-yaml's most conservative schema)
- **Behavior**: avoids implicit Date/timestamp coercion; ensures explicit, predictable round-trip behavior
- **Stability**: CORE_SCHEMA semantics stable across the 4.x line
- **Test coverage**: frontmatter round-trip verified in cli-write-fact, cli-frontmatter suites (all passing)

**Why:** Explicit, non-coercive yaml parsing prevents surprising type conversions that could break frontmatter handling or downstream logic. Conservative schema choice + comprehensive test coverage minimizes risk when updating js-yaml.

**How to apply:** When modifying yaml parsing or upgrading js-yaml, maintain CORE_SCHEMA. Ensure frontmatter round-trip tests remain green. Treat CORE_SCHEMA and the explicit load/dump API as the stable boundary.
