---
date: 2026-08-02
topic: Memory/knowledge viewers, code-level survey (Task 255 outward research — claude-mem, PAI/Pulse, hermes-agent, datasette, mdserve)
source: Manual survey (subagent-driven; targeted source-file fetches, not full clones — working files under C:\tmp\viewer-research\, disposable)
tags: [task-255, viewer, cmk-view, prior-art, D-121, D-397, D-414]
---

# Task 255 outward research — shipped memory/knowledge viewers, code-level survey

**Why this note exists:** Task 255 (the kit's own memory viewer) copies shapes from claude-mem's shipped viewer and Pulse — the unconditional prior-art rule requires a FRESH look at those projects at build time; the recorded notes (2026-06-12) were dated snapshots. This survey ran DURING the 2026-08-02 grill and directly shaped the ratified design (design §24, D-414): the ephemeral-vs-resident lifecycle split, the API-first routes, the read-only answer to the delete demand, and the zero-dep feasibility all trace to findings below.

**Method honesty:** targeted fetches of the load-bearing source files (claude-mem's viewer components + server routes + build script + full repo tree; hermes's memory/dashboard CLI sources + tree; PAI's system doc + Observability package manifest), not full clones. Depth was sufficient for the grill's delivery-shape decisions; the build-time deep-read of claude-mem specifically (SSE handling, port-conflict behavior) should use a full shallow clone per the D-153 convention.

## 1. thedotmack/claude-mem — the big precedent (89,285★ at read time; 77k★ in our June note)

**Delivery shape:** localhost HTTP server — but NOT ephemeral: the viewer is served at `/` by the always-on **worker service** (Bun-managed Express daemon, default port 37777). README: "Web Viewer UI — Real-time memory stream at the worker URL printed on startup."

**Stack + the packaging trick:** React 19 + TS in source, but `scripts/build-viewer.js` runs esbuild → ONE minified IIFE bundle + a static `viewer.html`, shipped prebuilt in the npm package; `ViewerRoutes.ts` reads the HTML into a Buffer at boot and serves bytes. Consumer-facing runtime UI deps ≈ zero. Viewer source ≈ 28 TS/TSX files, ~3.2k LOC (App/Feed/ObservationCard/Header/modals + hooks incl. `useSSE`).

**What it shows:** reverse-chron feed of observations / session summaries / user prompts, project-filter dropdown (**no search box — while the API has full search**), infinite scroll, live updates via SSE (`/stream`, plain `text/event-stream` — no websocket lib).

**Read-only?** The current UI has no delete control (grepped the fetched components) — but the worker API is NOT read-only: unauthenticated localhost `DELETE /api/observation/:id` etc., `POST /api/settings`. History: viewer delete shipped (#1393, #1985), disappeared in a UI overhaul (#1671), and **#2925 "delete memories from the viewer" is open again** — the single most recurring user demand.

**Cautionary tales (issues):** #232 "Web Viewer UI never turns off" (resident-daemon annoyance); #2552/#2989 viewer broke when a second runtime forgot to mount its routes (viewer coupled to an evolving daemon); #3457 settings-write from the viewer bricked with the reason hidden (writable settings = new failure surface); #3377 per-project stats requested; #266 auth added only after network exposure.

**Most-stealable idea:** the prebuilt-single-bundle pattern — one static HTML + one JS file served as cached bytes by the process that owns the DB; zero runtime UI deps.

<https://github.com/thedotmack/claude-mem> — `src/ui/viewer/`, `src/services/worker/http/routes/ViewerRoutes.ts`, `scripts/build-viewer.js`

## 2. "Pulse" = danielmiessler/PAI's dashboard (17,123★ now; our note's 15.8k★ project — disambiguated from glieai/pulse-ai, 7★)

**Delivery shape:** always-on local daemon (ONE Bun process under launchd, port 31337); the "Observatory" dashboard is a **Next.js 15** SPA (React 19, d3, recharts, framer-motion, radix, tailwind) — the maximal end of the stack spectrum, macOS-centric.

**Memory-relevant:** 31 modules, most explicitly "read-only surface… holds zero data — parses the source files on every request" over markdown/JSONL — including a Memory module and UserIndex ("walks the `USER/` tree, parses frontmatter + body of every `.md`; `fs.watch` live refresh").

**The write surface (anti-pattern check):** the Algorithm module DOES edit files from the UI, with a serious safety model — fixed server-side whitelist keyed by id (client paths never accepted), every edit git-committed in the file's real repo, mtime-conflict → 409, versioned files immutable by construction. That is the COST of write from a viewer — strong validation of our read-only settled decision.

**Most-stealable idea:** **TabFreshness** — every tab declares where its data comes from and how stale it is. Adopted into §24 as the per-view freshness label.

<https://github.com/danielmiessler/PAI> — `LifeOS/install/LIFEOS/DOCUMENTATION/Pulse/PulseSystem.md`, `PULSE/Observability/`

## 3. NousResearch/hermes-agent (223,980★)

**No dedicated memory viewer.** Built-in memory = two files; CLI surface is config-only (`hermes memory setup|status|off|reset`); `hermes dashboard` is the agent CHAT SPA, closest memory access is a generic workspace file browser. Takeaway: even at 224k★, the field's biggest agent treats memory viewing as "open the markdown file" — **a purpose-built viewer over markdown memory is still differentiating.** Their June-2026 hardening is worth copying: a non-loopback bind ALWAYS requires auth; the old `--insecure` bypass made a no-op.

<https://github.com/NousResearch/hermes-agent> — `hermes_cli/subcommands/memory.py`, `subcommands/dashboard.py`

## 4. Zero-config gold standards

- **Datasette:** `datasette db.db` → localhost, `-o` auto-opens, **opens the DB read-only by default**, every table gets browse/filter UI + a parallel `.json` endpoint on the same routes. The pleasantness formula adopted wholesale into §24: one command, read-only default, HTML+JSON same routes, ephemeral lifecycle. <https://docs.datasette.io/en/stable/getting_started.html>
- **mdserve** (Rust single binary; `mdserve docs/`, `--open`, WebSocket live-reload, read-only, zero-config) + family (`npx mdts`, markserv). <https://github.com/jfernandez/mdserve>

## Synthesis

**(a) Convergent delivery shape:** localhost HTTP server serving a static/bundled page from the process that owns the data — nobody ships Electron or static-site exports. The REAL split is lifecycle: resident daemon (claude-mem, Pulse — both accrue complaints) vs ephemeral on-demand (datasette, mdserve). For a kit whose truth is files+SQLite already on disk, ephemeral avoids the entire daemon complaint class. **Ratified into §24.1.**

**(b) Dep-weight spectrum:** everything the kit's viewer needs is reachable with node stdlib + vanilla JS — `node:http` routes, SSE is plain `text/event-stream` writes when Task 259 lands, search via existing better-sqlite3 FTS, one committed static HTML file. claude-mem needed React for a settings-writing multi-modal feed; a read-only feed + search does not.

**(c) Absences users complain about:** (1) delete/manage from the viewer — the recurring demand; our answer is copy-the-command (§24.1.3); (2) per-project stats; (3) **search in the UI** — claude-mem's gap, our landing feature; (4) auth when exposed beyond loopback — we refuse non-loopback instead; (5) lifecycle control — solved by being ephemeral.

**(d) Honest gaps:** code + issues read, nothing run live; claude-mem's delete history inferred from issues + component grep, not a commit trace; PAI's tab inventory from module docs, not the Next.js pages; datasette from one stable-docs page. Working files disposable under `C:\tmp\viewer-research\`.
