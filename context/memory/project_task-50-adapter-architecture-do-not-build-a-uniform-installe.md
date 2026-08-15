---
id: P-SAX2JDHY
type: project
title: 'Task 50 adapter architecture: do NOT build a uniform Installer base class across'
created_at: 2026-06-20T14:28:02Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 78c7c8a4361982ad2f57a51901566ef7ae080eea271d32256a9290911bd2db11
related: [cursor-adapter-proves-generic-per-profile-seam-works]
---

Task 50 adapter architecture: do NOT build a uniform Installer base class across agents (claude-mem proved it breaks when agents differ in format/mechanism). The reusable seam is a shared tested mutateAgentConfig primitive (touch-only-our-keys, refuse-to-clobber-on-parse-error, idempotent changed-boolean) + per-agent metadata as DATA not classes. No other product in our 66-note corpus solved core-identical-plus-thin-per-agent-wiring cleanly.

**Why:** Full-corpus survey: only claude-mem actually multi-agent-installs and its code is bespoke-per-agent; an Installer.install() interface is a leaky abstraction whose bodies share zero code. The generalizable part is the config-write primitive, which maps to the kit's existing marker-block byte-preservation + over-mutation-guard rules.

**How to apply:** Build mutateAgentConfig(path, format json|yaml|toml, keyPath, entry, {merge|replace}) FIRST with an over-mutation test (seed N, mutate one, assert N-1). Per-agent profiles are data records (instructionFile/mcpConfigPath/mcpFormat/mcpServersKey/hookMechanism/eventMap). Do NOT registry-ize the matrix yet (single-digit N).
