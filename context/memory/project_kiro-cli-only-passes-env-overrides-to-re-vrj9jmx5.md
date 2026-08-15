---
id: P-VRJ9JMX5
type: project
title: kiro-cli only passes env overrides to registry-type MCP servers, not stdio-type;
created_at: 2026-06-24T20:00:03Z
write_source: user-explicit
trust: high
source_file: review-promote
source_line: 1
source_sha1: 114995a3b156bf43ab3f62488d930d448b1bdf3a9ac2d99b98b0f2dc626706d4
related: [kiro-cli-env-passing-limitation, this-project-is-for-kiro-cli-only-not-id-m4lcgcgw, kiro-cli-mcp-server-env-passing-limitation]
---

kiro-cli only passes env overrides to registry-type MCP servers, not stdio-type; since your server is stdio-type (personal), CMK_PROJECT_DIR is silently dropped (verified from kiro-cli changelog)
