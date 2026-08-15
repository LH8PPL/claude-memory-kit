---
id: P-G56B545Y
type: project
shape: Timeless
title: SonarCloud Project Key Update Procedure
created_at: 2026-07-15T12:26:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8e960573c704d3fcf9188539e1237361ab87071a3d74e51e69858c3251e11820
related: [sonarcloud-project-key-rename-coordination, npm-pack-global-install-for-artifact-testing-0b, testing-workflow-for-claude-memory-kit-fixes]
---

**Before any SonarCloud key change, use this exact sequence to avoid creating duplicate projects:**

1. Go to SonarCloud → project → Administration → Update Key
2. In the "Project Key" field, change the key (e.g., from `LH8PPL_claude-memory-kit` to `LH8PPL_core-memory-kit`)
3. Click the **Update** button to confirm in the UI
4. Wait for confirmation that the change is live in SonarCloud
5. Only then: update `sonar-project.properties` line 1 to the new key value
6. Commit and push the config change

**Critical:** If step 5–6 happens BEFORE step 1–3, the next SonarCloud scan will create a NEW duplicate project (new history, lost settings) instead of migrating. This is irreversible without SonarCloud support.

**Why:** SonarCloud's key-matching logic: if a scan comes in with a key that doesn't exist in SonarCloud yet, it creates a new project. The UI update must establish the key FIRST.

**How to apply:** Always SonarCloud UI → confirm → THEN config file → push. For this project (2026-07-15), change the key from `LH8PPL_claude-memory-kit` to `LH8PPL_core-memory-kit`.
