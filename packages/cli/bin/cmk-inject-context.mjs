#!/usr/bin/env node
// SessionStart hook handler — npm-route bin (Task 49, T-037).
//
// De-plugin-ified twin of plugin/bin/cmk-inject-context.mjs (Task 18).
// This copy lives in the published @lh8ppl/core-memory-kit npm package
// (declared in package.json `bin`), so `cmk install` can wire a
// PATH-resolved `cmk-inject-context` hook command into settings.json
// WITHOUT the plugin's `${CLAUDE_PLUGIN_ROOT}` / bash dependency. The
// only difference from the plugin copy is the src module path: here it
// resolves ../src/ (bin/ → src/), not ../../packages/cli/src/.
//
// Protocol: payload arrives on stdin as JSON (drained, not consumed).
// Emit the Anthropic SessionStart hookOutput JSON on stdout. Exit 0
// unconditionally — a throwing SessionStart hook would interrupt
// session start, worse than an empty additionalContext.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const readHookStdinPath = join(__dirname, '..', 'src', 'read-hook-stdin.mjs');
const modulePath = join(__dirname, '..', 'src', 'inject-context.mjs');

// Resolve the sibling lazy-compress bin (ships in this same bin/ dir) so
// inject-context can spawn `node <path>` directly instead of the shell:true
// `.cmd` shim — the Windows console-popup fix (Task 81). Env override first;
// null in a corrupt install → graceful shell:true fallback in spawnLazyCompress.
const compressLazyPath =
  process.env.CMK_COMPRESS_LAZY_PATH ??
  (existsSync(join(__dirname, 'cmk-compress-lazy.mjs'))
    ? join(__dirname, 'cmk-compress-lazy.mjs')
    : null);

let readHookStdin;
let parseHookPayload;
let injectContext;
try {
  ({ readHookStdin, parseHookPayload } = await import(pathToFileURL(readHookStdinPath).href));
  ({ injectContext } = await import(pathToFileURL(modulePath).href));
} catch (err) {
  process.stderr.write(
    `cmk-inject-context: failed to load modules: ${err?.message ?? String(err)}\n`,
  );
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: '',
      },
    }),
  );
  process.exit(0);
}

// Drain stdin so callers blocking on EPIPE don't hang — but NOT on an
// interactive TTY (a manual run): a blocking stdin read would hang forever on a
// console that never sends EOF (Task 101; DECISION-LOG 2026-06-06).
// readHookStdin returns '' for a TTY so a manual run finishes. Task 190: the
// drained payload is now PARSED (best-effort) for session_id — the recall-log's
// session attribution. A malformed/absent payload degrades to null, never fails.
// Task 253(a): the same parse also reads `source` (startup|resume|clear|
// compact|fork per Anthropic's hook reference) — the injection-mode selector.
// Unreadable payload → source stays null → the FULL snapshot, i.e. exactly the
// pre-253 behavior. Fail-open, never a smaller injection by accident.
const hookPayloadRaw = readHookStdin({ isTTY: process.stdin.isTTY });
let sessionId = null;
let source = null;
try {
  const payload = parseHookPayload(hookPayloadRaw); // Task 207: BOM-tolerant
  sessionId = payload?.session_id ?? null;
  source = typeof payload?.source === 'string' ? payload.source : null;
} catch {
  /* not JSON (TTY run / odd caller) — no session attribution, no mode split */
}

// Task 167 NOTE (D-207, the live-test revision): an earlier design (Q4) tried a
// SYNCHRONOUS now.md drain HERE, before injectContext, to make THIS session read
// the rolled state. The live test proved that doesn't fit: a real now→today Haiku
// roll takes ~18–37s, but the SessionStart hook ceiling is 30s — so the
// synchronous drain reliably timed out and fell back to the detached path anyway.
// The research (claude-mem/mem0/Letta) confirms the event-driven peers compact at
// session END (the Stop hook, no user waiting), NOT session start. So the kit
// keeps the now→today roll on the DETACHED SessionStart path (spawned inside
// injectContext) + the SessionEnd compress-session hook — and the real fix is the
// cron-liveness gate (167.A), which stops a dead cron from suppressing that roll.
// now.md heals next session via the detached roll and never compounds.

try {
  const r = injectContext({ cwd: process.cwd(), compressLazyPath, sessionId, source });
  process.stdout.write(JSON.stringify(r.hookOutput));
  process.exit(0);
} catch (err) {
  process.stderr.write(
    `cmk-inject-context: handler failed: ${err?.message ?? String(err)}\n`,
  );
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: '',
      },
    }),
  );
  process.exit(0);
}
