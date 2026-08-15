---
id: P-CJFV76WH
type: project
shape: State
title: SonarCloud Automatic Analysis Must Be OFF
created_at: 2026-07-12T18:46:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 028128948d4e28358e7a10159f1fc5da24f836063843e37018bc4acc66a6dfb4
related: [sonarcloud-server-side-analysis-scope-cannot-be-overridden-r, sonarcloud-project-key-rename-coordination, mcp-configuration-includes-redundant-memory-server]
---

The SonarCloud CI integration requires Automatic Analysis to be disabled. If enabled, it runs with stale server-side stored configuration instead of the CI-provided sonarProperties.

**Why:** The project's CI workflow applies its own sonar configuration and expects Automatic Analysis to be OFF. If enabled, SonarCloud ignores the CI-provided properties and uses server-stored defaults.

**How to apply:** Check SonarCloud dashboard: Administration → Analysis Method. If Automatic Analysis is ON, turn it OFF.
