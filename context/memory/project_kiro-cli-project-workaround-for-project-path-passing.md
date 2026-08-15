---
id: P-YX5A7RWJ
type: project
title: kiro-cli --project workaround for project-path passing
created_at: 2026-06-24T15:27:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 95620d870bbf78dba6338505c8b777838a820e85e58dc22a3ab94a748049592a
related: [kiro-cli-env-passing-limitation, live-test-workflow-for-kiro-cli-project-fix, kiro-cli-mcp-server-env-passing-limitation]
---

Bake `--project <project-root>` into kiro-cli's mcp.json `args` array so the project path rides in on the command line instead of env. This works because stdio `command` + `args` universally translate to `spawn(command, args)`, bypassing kiro's env-routing limitation. Expected args: `[ 'mcp', 'serve', '--project', 'C:\\path\\to\\project' ]`.

**Why:** env is not passed to stdio servers by kiro. The --project arg was proven to work in code (suite 2268/0) and is the only lever that kiro-cli cannot drop.

**How to apply:** When installing via cmk in a fresh repo, verify args were baked by reading `.kiro/settings/mcp.json`. Test by running kiro-cli, typing a memory command, and checking that facts persist to `context/`.
