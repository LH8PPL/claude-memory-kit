#!/usr/bin/env node
// UserPromptSubmit hook handler — npm-route bin (Task 49, T-037).
//
// De-plugin-ified twin of plugin/bin/cmk-capture-prompt.mjs (Task 19).
// Ships in the @lh8ppl/core-memory-kit npm package so `cmk install`
// can wire a PATH-resolved `cmk-capture-prompt` command. Only the src
// module path differs from the plugin copy (../src/ vs ../../packages/cli/src/).
//
// Protocol: payload arrives on stdin as JSON ({prompt, session_id, ...}).
// Sanitize <private> blocks, preserve <retain> tags, append to the daily
// transcript, emit {"continue": true}. Always exit 0 — a hook that errors
// would interrupt the user mid-prompt.

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function emitContinue() {
  process.stdout.write('{"continue": true}');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const readHookStdinPath = join(__dirname, '..', 'src', 'read-hook-stdin.mjs');
const modulePath = join(__dirname, '..', 'src', 'capture-prompt.mjs');
const tierPathsPath = join(__dirname, '..', 'src', 'tier-paths.mjs');

let readHookStdin;
let parseHookPayload;
let capturePrompt;
let buildPromptHookOutput;
let resolveHookProjectRoot;
try {
  ({ readHookStdin, parseHookPayload } = await import(pathToFileURL(readHookStdinPath).href));
  ({ capturePrompt, buildPromptHookOutput } = await import(pathToFileURL(modulePath).href));
  ({ resolveHookProjectRoot } = await import(pathToFileURL(tierPathsPath).href));
} catch (err) {
  process.stderr.write(
    `cmk-capture-prompt: failed to load modules: ${err?.message ?? err}\n`,
  );
  emitContinue();
  process.exit(0);
}

// Drain the hook payload — but NOT on an interactive TTY (a manual run):
// a blocking stdin read would hang forever on a console that never sends EOF, before
// any body runs (Task 101; DECISION-LOG 2026-06-06). readHookStdin returns ''
// for a TTY so a manual invocation finishes instead of hanging.
const rawInput = readHookStdin({ isTTY: process.stdin.isTTY });

let payload;
try {
  payload = parseHookPayload(rawInput); // Task 207: BOM-tolerant (D-306 generalized)
} catch (err) {
  process.stderr.write(
    `cmk-capture-prompt: failed to parse stdin JSON: ${err?.message ?? err}\n`,
  );
  emitContinue();
  process.exit(0);
}

// Task 246: resolve the REAL project root once (CLAUDE_PROJECT_DIR /
// CMK_PROJECT_DIR → walk up to the nearest context/ → cwd), never bare cwd —
// a subdirectory cwd used to fork a stray, unread memory tier. Both the capture
// and the hint below share this one resolution.
const projectRoot = resolveHookProjectRoot();

try {
  capturePrompt({ payload, projectRoot });
} catch (err) {
  process.stderr.write(
    `cmk-capture-prompt: handler failed: ${err?.message ?? err}\n`,
  );
}

// Task 75.2 — emit the "memory available" recall nudge as additionalContext
// (the MODEL-facing UserPromptSubmit field per Anthropic's hooks doc;
// systemMessage is user-display). Task 250 (D-412) folds the failure-driven
// health whisper into the SAME string, and adds the human-facing
// `systemMessage` line at severity memory-off only. Best-effort: neither may
// ever break the capture protocol.
try {
  const { additionalContext, systemMessage } = buildPromptHookOutput({
    projectRoot,
    prompt: payload?.prompt,
    sessionId: payload?.session_id,
  });
  if (additionalContext || systemMessage) {
    const out = { continue: true };
    if (additionalContext) {
      out.hookSpecificOutput = { hookEventName: 'UserPromptSubmit', additionalContext };
    }
    // `systemMessage` is a UNIVERSAL hook output field (verified against
    // code.claude.com/docs/en/hooks, 2026-08-01: "Warning message shown to the
    // user"), so it rides as a SIBLING of hookSpecificOutput — never nested
    // inside it, which would put a human-facing string in the model's context.
    if (systemMessage) out.systemMessage = systemMessage;
    process.stdout.write(JSON.stringify(out));
    process.exit(0);
  }
} catch (err) {
  process.stderr.write(`cmk-capture-prompt: hint failed: ${err?.message ?? err}\n`);
}

emitContinue();
process.exit(0);
