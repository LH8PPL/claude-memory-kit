---
id: P-ZWF3YFUQ
type: project
shape: State
title: Cut-Gate-Kiro Deliberately Tests Both Kiro Clients Across Three Sessions
created_at: 2026-07-09T14:52:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b308e6462fcae026816bc03cb99bf3b6ea31df26cfc36e89c1d25ea43374b514
related: [kiro-install-contains-two-independent-clients-with-separate, v0-4-0-final-gate-kh-kc-live-hook-firing-tests, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes]
---

- **§2 Session 1 (Kiro IDE)** — builds initial state; proves IDE capture hooks fire correctly
- **§5 Session 2 (kiro-cli)** — proves CLI default-agent auto-resolves, injects Session-1 memory via agentSpawn hook, captures via stop hook. This is the only place CLI-specific bugs (like D-182) are caught.
- **§6 Session 3 (cold-open, either client)** — tests wedge injection and persona injection in a fresh folder; client agnostic.
- Each session numbered 1/2/3, but the CLIENT switches in Session 2; this is intentional, not a typo.

**Why:** A single install wires two clients; the gate must prove both work and can share state. IDE-only testing would miss client-specific bugs.

**How to apply:** When running the gate, expect the client to switch to terminal in §5. Verify both clients are installed before starting. If a client is missing, mark that session "unverified — [client] not installed."
