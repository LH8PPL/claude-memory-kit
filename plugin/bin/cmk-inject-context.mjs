#!/usr/bin/env node
// SessionStart hook real handler (Task 18). node-only since Task 62: hooks.json invokes this directly via
// node "${CLAUDE_PLUGIN_ROOT}/bin/cmk-inject-context.mjs" (no bash wrapper).
//
// Protocol: payload arrives on stdin as JSON (we drain it but don't
// currently consume any fields). Emit the Anthropic SessionStart
// hookOutput JSON shape on stdout. Exit 0 unconditionally — a hook
// that throws would interrupt session start, which is worse than
// emitting an empty additionalContext.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In the kit's dev layout, this script lives at
//   <repo>/plugin/bin/cmk-inject-context.mjs
// and the injectContext implementation is at
//   <repo>/packages/cli/src/inject-context.mjs
// — two levels up + into packages/. When the plugin is published, the
// packages/ tree will need to be bundled/published alongside; that
// wiring is a release-engineering question, not a Task-18 question.
const readHookStdinPath = join(
  __dirname,
  '..',
  '..',
  'packages',
  'cli',
  'src',
  'read-hook-stdin.mjs',
);
const modulePath = join(
  __dirname,
  '..',
  '..',
  'packages',
  'cli',
  'src',
  'inject-context.mjs',
);

// Resolve cmk-compress-lazy.mjs (npm bin, two levels up + into packages/cli/bin)
// so inject-context spawns `node <path>` directly instead of the shell:true
// `.cmd` shim — the Windows console-popup fix (Task 81). Env override first;
// null → graceful shell:true fallback in spawnLazyCompress.
const compressLazyPath =
  process.env.CMK_COMPRESS_LAZY_PATH ??
  (existsSync(join(__dirname, '..', '..', 'packages', 'cli', 'bin', 'cmk-compress-lazy.mjs'))
    ? join(__dirname, '..', '..', 'packages', 'cli', 'bin', 'cmk-compress-lazy.mjs')
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
// Unreadable payload → source stays null → the FULL snapshot (pre-253
// behavior). Fail-open: never a smaller injection by accident.
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
