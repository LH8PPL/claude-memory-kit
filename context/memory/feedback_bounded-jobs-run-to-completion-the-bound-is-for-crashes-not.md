---
id: P-PM6WN3N3
aliases: [P-PM6WN3N3]
type: feedback
shape: Timeless
title: Bounded jobs run to completion — the bound is for crashes, not users
created_at: 2026-08-10T10:54:51Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 269e0a853939d2fc1082923e032625c5e69805a6a40f09136c29b34c7aecec5d
related: [long-jobs-incremental-resumable-from-artifacts-never-all-or, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre, when-an-automatic-path-fails-build-a-fallback-mechanic-that]
---

Resumability is a recovery property, never a UX: a bounded/batched long job must loop its own batches to completion on ONE user invocation (each batch still durable-as-it-lands, still safe under Ctrl-C), and must trigger its own follow-up plumbing (index sync etc.) — the user is never the loop driver and never needs to know the internal steps. The 2026-08-10 precedent: `cmk autolink --apply` stopped after one 250-fact batch, printed "1,895 remain — re-run to continue", and then needed a manual `cmk reindex --boot`; the user's verdict was "that is stupid, what would a real user do?" — and they were right: ADR-0020's killed-at-80%-loses-nothing property had leaked into the interface as stops-early-on-purpose.

**Why:** ADR-0020 makes long jobs incremental and resumable so a killed run loses nothing. That is an internal guarantee about failure, not a license to make a healthy run stop early and hand the loop to the human. "Automatic means automatic" is the kit's own thesis; a command that asks to be re-run 8 times violates it exactly the way a memory system that asks to be manually curated would.

**How to apply:** When building or reviewing any bounded/batched command (backfill, migration, sweep, distill): the DEFAULT invocation loops batches to completion with per-batch progress and an aggregated summary; an explicit --max/--batch flag is the opt-in for bounded slices; any follow-up step the feature needs (reindex, cache refresh) is triggered by the command itself, with the final output stating what happened rather than what to run next. Interruption handling stays: durable per batch, honest resume message on the next run.
