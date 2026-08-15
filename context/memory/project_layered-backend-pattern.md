---
id: P-LaG5aW75
type: project
title: Layered Backend Pattern
created_at: 2026-06-19T20:45:55Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1114353834a1e101d72b7585fb72aa9ba2f2f8fb3882cb4cf2a11650b9e199b7
related: [layered-backend-architecture-routes-thin-tlkqfr7z]
---

Route layer (HTTP/WebSocket transport only) → Service layer (lifecycle, broadcast, business logic) → Repository layer (connection store) → Schemas (Pydantic contracts). Each WS connection gets its own service instance. Service avoids deep transport leakage (accepts, sends text only).

**Why:** Separates concerns so services are testable/reusable without FastAPI; prevents architectural decay.

**How to apply:** Structure FastAPI backends: api/routes.py (thin), services/ (brain), repositories/ (data), schemas/ (boundaries). Route ≤ 30 lines; service ≤ 50 lines; repo ≤ 30 lines.
