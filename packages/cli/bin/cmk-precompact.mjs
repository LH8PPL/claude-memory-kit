#!/usr/bin/env node
// PreCompact hook handler — npm-route bin (Task 235).
//
// Fires when Claude Code is about to compact the context window. Its ONLY job
// is to decide cheaply whether a now→today roll is worth doing and, if so, hand
// it to a DETACHED worker — then return immediately.
//
// THE NEVER-BLOCK CONTRACT (primary-source verified 2026-07-20,
// code.claude.com/docs/en/hooks): a PreCompact hook can block compaction with
// `{"decision":"block"}` or exit 2. The kit must NEVER do either — blocking a
// user's compaction to bank memory would hold their session hostage. This bin
// emits no `decision` on any path and always exits 0.
//
// Protocol: drain stdin (the payload carries {trigger, session_id,
// transcript_path, cwd}), resolve the project root, gate, maybe spawn, emit
// {"continue": true}, exit 0.

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

function emitContinue() {
  // No `decision` field — this is what "allow the compaction" looks like.
  process.stdout.write('{"continue": true}');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readHookStdinPath = join(__dirname, '..', 'src', 'read-hook-stdin.mjs');
const precompactModulePath = join(__dirname, '..', 'src', 'precompact.mjs');
const tierPathsPath = join(__dirname, '..', 'src', 'tier-paths.mjs');
const workerPath = join(__dirname, 'cmk-precompact-worker.mjs');

let readHookStdin;
let shouldPreCompact;
let appendPreCompactLog;
let precompactWorkerSpawnDescriptor;
let resolveHookProjectRoot;
try {
  ({ readHookStdin } = await import(pathToFileURL(readHookStdinPath).href));
  ({ shouldPreCompact, appendPreCompactLog, precompactWorkerSpawnDescriptor } = await import(pathToFileURL(precompactModulePath).href));
  ({ resolveHookProjectRoot } = await import(pathToFileURL(tierPathsPath).href));
} catch (err) {
  process.stderr.write(`cmk-precompact: failed to load modules: ${err?.message ?? err}\n`);
  emitContinue();
  process.exit(0);
}

// Drain the payload so Claude Code's pipe closes cleanly — but NOT on an
// interactive TTY (a manual run), where a blocking read never sees EOF
// (Task 100/101; DECISION-LOG 2026-06-06).
const raw = readHookStdin({ isTTY: process.stdin.isTTY });

let trigger = 'auto';
let payloadCwd = null;
try {
  const input = JSON.parse(raw);
  if (input && typeof input === 'object') {
    if (input.trigger === 'manual' || input.trigger === 'auto') trigger = input.trigger;
    if (typeof input.cwd === 'string' && input.cwd.length > 0) payloadCwd = input.cwd;
  }
} catch {
  // Garbage or empty payload — proceed with defaults. A malformed payload must
  // never cost the user their compaction.
}

// Task 246: resolve the REAL project root, never a bare cwd. PreCompact is a
// Claude-Code hook fired with the same subdirectory cwd that forked the stray
// tiers, and it writes a `.locks/` dir unconditionally — so it forked strays
// too. Seed the walk with the payload's cwd (Claude Code populates it), then
// let the resolver prefer CLAUDE_PROJECT_DIR / CMK_PROJECT_DIR and walk up to
// the nearest context/. The detached worker inherits the resolved root via
// CMK_PROJECT_DIR below.
const projectRoot = resolveHookProjectRoot({ cwd: payloadCwd ?? process.cwd() });

try {
  const gate = shouldPreCompact({ projectRoot });
  let spawned = false;
  let spawnError;

  if (gate.run) {
    if (!existsSync(workerPath)) {
      spawnError = 'worker-missing';
    } else {
      try {
        // Detached fire-and-forget: the roll outlives this hook by design, so
        // the user waits on nothing. Same posture as capture-turn →
        // auto-extract. windowsHide suppresses the console flash (Task 81); the
        // cwd is pinned to tmpdir (Task 253c) so the outliving child never
        // holds a handle on the working tree. Shape lives in precompact.mjs —
        // ONE descriptor, shared with the plugin twin.
        const { command, args, options } = precompactWorkerSpawnDescriptor({
          workerPath,
          projectRoot,
          trigger,
        });
        // spawn-discipline: ignore detached-fire-and-forget (the worker intentionally outlives this hook; it carries its own bounded timeout via runPreCompact → compressSession's CEILING_FREE_TIMEOUT_MS)
        const child = spawn(command, args, options);
        child.unref();
        spawned = true;
      } catch (err) {
        spawnError = err?.message ?? String(err);
      }
    }
  }

  // Door 5: the compaction event is ALWAYS recorded, spawn or no spawn. A
  // compaction that banked nothing must still be diagnosable — the "silent
  // no-op" is exactly what makes a capture gap invisible for weeks (D-369).
  appendPreCompactLog({
    projectRoot,
    entry: {
      ts: new Date().toISOString(),
      scope: 'precompact-hook',
      trigger,
      spawned,
      reason: gate.reason,
      ...(spawnError ? { spawn_error: spawnError } : {}),
    },
  });
} catch (err) {
  // Defensive backstop — nothing in the body may reach the user as a failure.
  process.stderr.write(`cmk-precompact: unexpected error: ${err?.message ?? err}\n`);
}

emitContinue();
process.exit(0);
