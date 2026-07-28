// Stop hook real handler (Task 21, T-018). Sixth Layer 4 module.
//
// Public boundary: captureTurn({payload, projectRoot, now,
// autoExtractPath}) → result. Does two things:
//   1. Append the just-completed assistant turn to
//      <projectRoot>/context/transcripts/{YYYY-MM-DD}.md (parallel to
//      Task 19's capture-prompt, sharing the privacy sanitizer).
//   2. Spawn the auto-extract subagent (Task 23) as a DETACHED child
//      so it survives the parent's exit. The kit's hook must return
//      within ~50ms; the subagent does its work in the background.
//
// stop_hook_active guard (design §5.2.1):
//   The Stop hook can re-fire as a result of a prior Stop hook's
//   decision: "block" response, causing a loop. Anthropic's hook
//   payload carries stop_hook_active: true in those cases. When set,
//   we short-circuit: no transcript append, no spawn, no work — just
//   {action: 'noop'} and let the session close.
//
// Auto-extract subprocess (21.3 + 21.4):
//   Unix path: `node ${autoExtractPath} ${turnTempFile}` spawned with
//     detached:true + stdio:'ignore' + unref() — node's equivalent of
//     the bash `</dev/null >/dev/null 2>&1 & disown` pattern from
//     claude-remember. Works identically on Windows when the parent
//     is Git Bash because we use node's spawn, not shell &.
//   The turn text is buffered to a temp file under
//     <projectRoot>/context/transcripts/.extract-<ts>.tmp
//   so the detached child can read it without sharing stdin.
//
// Both-turns temp-file shape (design §6.4 amendment, 2026-05-26;
// DEDUP_CONTEXT added by Task 132 / D-122, 2026-06-11):
//   The temp file contains the dedup snapshot, the prior user prompt,
//   AND the just-captured assistant turn, separated by literal markers:
//     DEDUP_CONTEXT:
//     <the last now.md entry BEFORE this turn was appended — may be empty>
//
//     USER_TURN:
//     <user body>
//
//     ASSISTANT_TURN:
//     <assistant body>
//   The dedup snapshot MUST be taken before appendConversationToNowMd
//   runs: auto-extract used to re-read now.md after the append and saw
//   the current turn as "already captured" → suppressed every organic
//   extraction (the D-122 self-poisoning bug, found by cut-gate8).
//   This lets auto-extract identify candidate-origin (user-stated vs
//   assistant-inferred) and apply the demotion rule from design §6.4
//   (assistant-origin facts demote one trust level so user review is
//   required before they enter MEMORY.md). The user turn is sourced
//   by reading the most recent `## <ts> — user` entry from today's
//   transcript file — which Task 19's capture-prompt wrote just
//   before this Stop hook fired.

import {
  existsSync,
  mkdirSync,
  appendFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { sanitizePrivacyTags } from './privacy.mjs';
import { maskPii, localUsernames, resolvePrivacyScreen } from './pii-patterns.mjs';
import { appendRedactions } from './redactions-log.mjs';
import { liveTranscriptPath } from './transcript-screen.mjs';
import { extractTurnToolCalls, formatToolCalls, readTranscriptTail } from './turn-tools.mjs';
import { readLastEntryFromNowMd } from './auto-extract.mjs';
import { capturePredictions } from './expectations.mjs';
import { judgeTurn } from './judge-signals.mjs';
import { dateFromIso } from './audit-log.mjs';

// A `.extract-<ts>.tmp` turn-file lives only for the duration of one
// auto-extract run (bounded by the Stop-hook ceiling, design §8.5). The owning
// child unlinks it in its `finally`; capture-turn unlinks it here when the spawn
// fails. But a child KILLED before its finally (hook ceiling), or a Windows
// unlink refused by a scanner, leaks the temp (cut-gate7 found 2 lingering —
// D-103 finding E). This janitor sweeps any `.extract-*.tmp` older than the
// threshold — far longer than any live run, so it can't race an in-flight child.
// Best-effort: a sweep hiccup must never block the capture.
const STALE_TURN_FILE_MS = 10 * 60 * 1000; // 10 min — well beyond the hook ceiling

export function sweepStaleTurnFiles(transcriptsDir, maxAgeMs = STALE_TURN_FILE_MS, now = Date.now()) {
  let swept = 0;
  if (!existsSync(transcriptsDir)) return swept;
  let entries;
  try {
    entries = readdirSync(transcriptsDir);
  } catch {
    return swept;
  }
  for (const name of entries) {
    if (!name.startsWith('.extract-') || !name.endsWith('.tmp')) continue;
    const p = join(transcriptsDir, name);
    try {
      if (now - statSync(p).mtimeMs > maxAgeMs) {
        unlinkSync(p);
        swept += 1;
      }
    } catch {
      // best-effort: a stat/unlink failure (already gone, or briefly locked)
      // must not abort the sweep or the capture.
    }
  }
  return swept;
}

// Write a `phase: 'spawn'` NDJSON entry to `<projectRoot>/context/sessions/{date}.extract.log`
// when the auto-extract spawn fails. This closes PR-A's class-1 audit
// deferral (capture-turn Door 5 observability gap). Auto-extract's own
// in-process log entries don't carry the `phase` field (default = extract);
// the `phase: 'spawn'` discriminator lets log readers route capture-turn
// failures distinct from extract-phase failures.
function writeSpawnLogEntry({ projectRoot, ts, reason, error }) {
  const date = dateFromIso(ts);
  const logDir = join(projectRoot, 'context', 'sessions');
  const logPath = join(logDir, `${date}.extract.log`);
  try {
    if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
    const entry = {
      ts,
      phase: 'spawn',
      success: false,
      error_category: 'spawn_failed',
      reason,
      ...(error ? { error } : {}),
    };
    appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
    return { logged: true, logPath };
  } catch (logErr) {
    // Logging failure must not crash the hook — emit to stderr so it
    // surfaces in the Stop-hook stderr stream Claude Code captures.
    process.stderr.write(
      `cmk-capture-turn: failed to write spawn observability log: ${logErr?.message ?? logErr}\n`,
    );
    return { logged: false, error: logErr?.message ?? String(logErr) };
  }
}

function extractTurnText(payload) {
  // Anthropic Stop hook payload spelling has shifted across Claude Code
  // versions. Probe the documented fields in priority order.
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.assistant_message === 'string') return payload.assistant_message;
  if (typeof payload.last_assistant_message === 'string') return payload.last_assistant_message;
  if (typeof payload.response === 'string') return payload.response;
  if (typeof payload.message === 'string') return payload.message;
  return '';
}

// Scan today's transcript for the most recent `## <ts> — user` entry
// and return its body. capture-prompt (Task 19) writes these entries
// on every UserPromptSubmit; the most-recent one is by definition the
// user prompt that triggered the assistant turn we're now capturing.
// Returns '' if the transcript doesn't exist, no user entry is
// present, or any read error occurs.
function readLastUserTurnFromTranscript(transcriptPath) {
  if (!existsSync(transcriptPath)) return '';
  let text;
  try {
    text = readFileSync(transcriptPath, 'utf8');
  } catch {
    return '';
  }
  const lines = text.split(/\r?\n/);
  let lastUserHeadingIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    // Match capture-prompt's format: "## <iso-ts> — user"
    if (/^##\s+\S+\s+—\s+user\s*$/.test(lines[i])) {
      lastUserHeadingIdx = i;
      break;
    }
  }
  if (lastUserHeadingIdx === -1) return '';
  // The user body runs from the line after the heading until the next
  // `## ` heading (the just-appended assistant entry) or EOF.
  let endIdx = lines.length;
  for (let i = lastUserHeadingIdx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  const body = lines.slice(lastUserHeadingIdx + 1, endIdx);
  while (body.length > 0 && body[0].trim() === '') body.shift();
  while (body.length > 0 && body[body.length - 1].trim() === '') body.pop();
  return body.join('\n');
}

// Task 87: append the turn's CONVERSATION to the compression buffer
// (context/sessions/now.md). Before this, now.md was fed ONLY by observe-edit's
// file-write lines ("[ts] Write file=X lines=N"), so the SessionEnd compressor
// summarized a list of filenames and hallucinated content the dialogue never
// contained (live-test-6: "Flask app: app.py" — inferred a framework from a
// filename). Buffering the actual user+assistant turns here means the summary
// reflects what was DISCUSSED. Same `## <ts> — speaker` shape as the transcript
// so the compressor reads it as dialogue; now.md is truncated after each compress
// (compress-session), so this is a transient session buffer, not a second store.
// Best-effort: a now.md write failure must not abort the capture (the transcript
// is already the durable record).
// Per-turn cap on the ASSISTANT contribution to now.md (skill-review I1). compress
// returns on cooldown BEFORE truncating now.md (compress-session §8.2), and
// auto-extract refreshes the shared cooldown every turn — so during an active
// session now.md is NOT truncated and accumulates. A verbose assistant response
// (code dumps, long explanations) is far larger than the old file-write line, so
// we bound each assistant turn's footprint. The USER turn is left FULL — it's
// short and carries the standing rules/decisions we must not truncate. The
// residual many-short-turns growth is bounded by the eventual truncate +
// compress's 50s-timeout/degradation backstop; offset-based compression is the
// v0.2.x escalation if mega-sessions ever bite.
const NOW_MD_ASSISTANT_CAP = 4000;

function appendConversationToNowMd({ projectRoot, ts, userTurn, assistantTurn }) {
  const sessionsDir = join(projectRoot, 'context', 'sessions');
  const nowMdPath = join(sessionsDir, 'now.md');
  const blocks = [];
  if (userTurn && userTurn.trim() !== '') {
    blocks.push(`## ${ts} — user\n\n${userTurn}\n`);
  }
  let asst = assistantTurn ?? '';
  if (asst.length > NOW_MD_ASSISTANT_CAP) {
    asst = asst.slice(0, NOW_MD_ASSISTANT_CAP) + '\n…[assistant turn truncated for the session buffer]';
  }
  blocks.push(`## ${ts} — assistant\n\n${asst}\n`);
  try {
    if (!existsSync(sessionsDir)) mkdirSync(sessionsDir, { recursive: true });
    appendFileSync(nowMdPath, blocks.join('\n') + '\n', 'utf8');
  } catch {
    // Best-effort — the transcript is the durable record; a missing now.md
    // entry only means this turn isn't in the next session summary.
  }
}

// Assemble the both-turns temp-file body. Both turns are sanitized
// upstream — the user body is either the transcript entry (which
// capture-prompt sanitized when writing it, Claude path) or the
// payload.user_message that captureTurn sanitized + L1-masked itself
// (Kiro path, D-303); the assistant body is the now-sanitized argument.
// Markers are literal-prefix lines so auto-extract's parser can split
// cleanly.
function assembleBothTurnsBody({ userTurn, assistantTurn, dedupContext = '' }) {
  return [
    'DEDUP_CONTEXT:',
    dedupContext,
    '',
    'USER_TURN:',
    userTurn,
    '',
    'ASSISTANT_TURN:',
    assistantTurn,
  ].join('\n');
}

function defaultAutoExtractPath() {
  // Documented sibling of this script's bin wrapper. Resolved by the
  // bin wrapper (which knows CLAUDE_PLUGIN_ROOT); we use this fallback
  // only when the caller passes nothing. The path is allowed to not
  // exist — see spawn block below.
  return null;
}

/**
 * Pure spawn descriptor for the detached auto-extract child (Task 253(c),
 * mirroring inject-context's lazyCompressSpawnDescriptor). Separated so the
 * Door-3 contract — node-direct, detached, windowsHide, tmpdir cwd, root by env
 * — is unit-assertable without a real spawn.
 *
 * @param {string} autoExtractPath - absolute path to the auto-extract bin.
 * @param {string} turnFile - absolute path to the both-turns temp file.
 * @param {string} projectRoot
 */
export function autoExtractSpawnDescriptor(autoExtractPath, turnFile, projectRoot) {
  return {
    command: 'node',
    args: [autoExtractPath, turnFile],
    options: {
      detached: true,
      stdio: 'ignore',
      // Task 253(c): the OS temp dir, NEVER the project tree. This child
      // outlives the Stop hook by design, and a live process holds a handle on
      // its cwd — on Windows that blocks a later delete/move of the working
      // tree (the stale-handle race; the kit's own suites meet it as EPERM at
      // teardown). Nothing is lost: cmk-auto-extract reads its root from
      // CMK_PROJECT_DIR (below), and both argv paths are absolute.
      //
      // The guard is load-bearing, not ceremony: the child falls back to
      // `process.cwd()` when CMK_PROJECT_DIR is absent, so re-pointing cwd at
      // tmpdir WITHOUT a root to hand over would make it scaffold a memory
      // tree in the temp dir. No root → inherit, exactly as before.
      cwd: typeof projectRoot === 'string' && projectRoot !== '' ? tmpdir() : undefined,
      // Task 81: suppress the Windows console window the detached child
      // would otherwise flash. (This site spawns `node` directly already,
      // so windowsHide is effective here — unlike the legacy shell:true
      // lazy-compress spawn, which also needed the node-direct fix.)
      windowsHide: true,
      env: { ...process.env, CMK_PROJECT_DIR: projectRoot },
    },
  };
}

function spawnAutoExtract(autoExtractPath, turnFile, projectRoot) {
  if (!autoExtractPath) return { spawned: false, reason: 'no-auto-extract-path' };
  if (!existsSync(autoExtractPath)) {
    return { spawned: false, reason: 'auto-extract-missing' };
  }
  try {
    const { command, args, options } = autoExtractSpawnDescriptor(
      autoExtractPath,
      turnFile,
      projectRoot,
    );
    // spawn-discipline: ignore detached-fire-and-forget (the auto-extract child intentionally outlives this hook process — parent-side timeout is incorrect by design; the child carries its own internal timeout via auto-extract.mjs's runAutoExtract → HaikuViaAnthropicApi.compress({timeoutMs: 25_000}) chain. PR-A class-1 audit confirmed this is the correct posture; the structural gap is the spawn-failed observability surface deferred to PR-D2b / Task 23.14.3.)
    const child = spawn(command, args, options);
    child.unref();
    return { spawned: true, pid: child.pid };
  } catch (err) {
    return { spawned: false, reason: 'spawn-failed', error: err?.message ?? String(err) };
  }
}

export function captureTurn({
  payload,
  projectRoot,
  now,
  autoExtractPath,
} = {}) {
  // 1. stop_hook_active guard. Short-circuit BEFORE any disk write or
  //    spawn so a recursive Stop firing can't poison the transcript.
  if (payload?.stop_hook_active === true) {
    return { action: 'noop', reason: 'stop-hook-active', spawned: false };
  }

  const turnText = extractTurnText(payload);
  if (turnText.trim() === '') {
    return { action: 'noop', reason: 'no-turn-text', spawned: false };
  }

  // 2. Append to today's transcript (sanitized).
  const ts = now ?? new Date().toISOString();
  const date = dateFromIso(ts);
  const transcriptsDir = join(projectRoot, 'context', 'transcripts');
  const transcriptPath = join(transcriptsDir, `${date}.md`);
  if (!existsSync(transcriptsDir)) {
    mkdirSync(transcriptsDir, { recursive: true });
  }
  let sanitized = sanitizePrivacyTags(turnText);

  // Task 148.2b/148.3 (ADR-0019, design §6.10): the L1 PII mask + the
  // live-buffer split. Screen ON: the turn is masked (emails/phones/
  // usernames/home-paths) and appended to the GITIGNORED live buffer —
  // the committed transcript only ever receives the L3 judge's screened
  // output at promote time (fail-closed). Screen OFF: pre-148 behavior
  // (direct committed append, verbatim).
  const screenOn = resolvePrivacyScreen({ projectRoot }) === 'on';
  if (screenOn) {
    const m = maskPii(sanitized, { usernames: localUsernames() });
    sanitized = m.text;
    appendRedactions(projectRoot, {
      source: 'capture-turn',
      layer: 'L1',
      redactions: m.redactions,
    });
  }
  const effectiveTranscriptPath = screenOn
    ? liveTranscriptPath(projectRoot, date)
    : transcriptPath;

  // Task 191 (ADR-0017 Phase 1b) — expectation pre-registration rides THIS
  // hook (the D-169 automatic path: no new spawn, no cmk command). A turn
  // containing `PREDICTION: <specific checkable outcome>` lands as a PENDING
  // expectation that Task 192's next-turn signals resolve HIT/MISS. Runs on
  // the SANITIZED text (privacy first) and is best-effort by module contract
  // (capturePredictions never throws, never scaffolds a non-kit project).
  capturePredictions(projectRoot, { text: sanitized, session: payload?.session_id });

  // Task 104.1 (D-117) — enrich the assistant entry with the turn's TOOL
  // ACTIVITY, read from Anthropic's live session JSONL (the Stop payload's
  // transcript_path). The payload itself carries only the assistant TEXT;
  // the JSONL is the only record of tool calls/results — and it expires
  // (~30 days, machine-local), so this is the moment to extract the current
  // turn into the kit's own durable format (the L3 raw tier, design §19).
  // Best-effort by contract: a missing path, unreadable file, or shifted
  // format degrades to a text-only entry, never a capture failure. The
  // block is privacy-sanitized like everything else that reaches disk.
  // The now.md buffer + the auto-extract turn file deliberately stay
  // TEXT-ONLY (tool noise would bloat the compressor/extractor inputs).
  let toolsSection = '';
  try {
    if (typeof payload?.transcript_path === 'string' && payload.transcript_path !== '') {
      const tail = readTranscriptTail(payload.transcript_path);
      // M1 (192 review): ONE parse, two consumers — the raw calls feed the
      // judge, the formatter feeds the transcript block.
      const turnCalls = tail ? extractTurnToolCalls(tail) : null;
      const activity = turnCalls ? formatToolCalls(turnCalls) : null;
      // Task 192 (ADR-0017 Phase 1c): the Stop-hook JUDGE — deterministic
      // outcome signals (tool-result ±, re-ask −, silent-success weak-+)
      // fire HERE, on the same tail read. Best-effort by module contract
      // (judgeTurn never throws); every delta routes through the 193 screen.
      try {
        judgeTurn({
          projectRoot,
          session: payload?.session_id,
          toolCalls: turnCalls ?? [],
        });
      } catch {
        /* the judge must never break capture */
      }
      if (activity) {
        let toolText = sanitizePrivacyTags(activity);
        // 148.2b: tool output is the incident's actual vector (git-config
        // echo, ls listings) — L1-mask it like the turn text.
        if (screenOn) {
          const mt = maskPii(toolText, { usernames: localUsernames() });
          toolText = mt.text;
          appendRedactions(projectRoot, {
            source: 'capture-turn:tools',
            layer: 'L1',
            redactions: mt.redactions,
          });
        }
        toolsSection = `\n**Tools:**\n\n${toolText}\n`;
      }
    }
  } catch {
    // enrichment is best-effort; the text entry below is the durable record
  }

  // Resolve the user turn BEFORE the assistant append, so a Kiro-sourced user
  // turn can be written to the transcript-of-record in the correct order
  // (## user → ## assistant), matching the Claude path where capture-prompt
  // wrote the user entry on UserPromptSubmit before this Stop fired.
  //
  // The user turn's source, in priority order:
  //   1. payload.user_message — the Kiro Stop hook (kiro-hook-bin.mjs) reads it
  //      from Kiro's OWN transcript (readKiroTurn) and passes it here. This is
  //      the Kiro-IDE fix (P-TQSG9PCA): on Kiro IDE 1.0, capture-prompt's
  //      USER_PROMPT env var arrives EMPTY (a Kiro platform bug — GitHub
  //      #9619/#6188), so capture-prompt no-ops, NO `## — user` entry is ever
  //      written to our transcript, and the transcript scan (2) returns '' →
  //      auto-extract's bi-turn extraction starves AND the committed transcript
  //      loses every user turn. Sourcing from the payload makes the Stop hook
  //      self-sufficient regardless of whether capture-prompt succeeded.
  //      NB: this text is RAW (readKiroTurn does no privacy pass), so it must
  //      go through the SAME sanitize + L1-mask the assistant turn does below
  //      (line ~319-336) before it reaches ANY sink (the transcript, now.md,
  //      the turn-file) — otherwise a Kiro user turn with an email/phone/
  //      home-path lands unmasked. The transcript fallback (2) is ALREADY masked
  //      (capture-prompt masked it at write time), so it must NOT be re-masked.
  //   2. readLastUserTurnFromTranscript — the Claude-Code path: capture-prompt
  //      wrote the `## — user` entry on UserPromptSubmit before this Stop fired.
  const rawPayloadUserTurn =
    payload && typeof payload.user_message === 'string' && payload.user_message.trim() !== ''
      ? payload.user_message
      : '';
  let userTurn;
  let userFromPayload = false;
  if (rawPayloadUserTurn !== '') {
    userFromPayload = true;
    userTurn = sanitizePrivacyTags(rawPayloadUserTurn);
    if (screenOn) {
      const mu = maskPii(userTurn, { usernames: localUsernames() });
      userTurn = mu.text;
      appendRedactions(projectRoot, {
        source: 'capture-turn:user',
        layer: 'L1',
        redactions: mu.redactions,
      });
    }
  } else {
    userTurn = readLastUserTurnFromTranscript(effectiveTranscriptPath);
  }

  // When the user turn came from the payload (Kiro path), capture-prompt did
  // NOT write it to the transcript-of-record — write it here, BEFORE the
  // assistant entry, so the L3-promoted committed transcript reads user →
  // assistant like the Claude path. On the transcript-fallback path the entry
  // already exists (capture-prompt wrote it) — do NOT double-write it. (B1,
  // caught by the code-review pass on D-303.)
  if (userFromPayload && userTurn.trim() !== '') {
    appendFileSync(effectiveTranscriptPath, `## ${ts} — user\n\n${userTurn}\n\n`, 'utf8');
  }

  appendFileSync(
    effectiveTranscriptPath,
    `## ${ts} — assistant\n\n${sanitized}\n${toolsSection}\n`,
    'utf8',
  );

  // 3. Buffer BOTH turns to a temp file so the detached child can read
  //    them without sharing our stdin (which has already been consumed
  //    by the parent bash wrapper). Per design §6.4, auto-extract
  //    reads the user prompt + assistant response together so it can
  //    distinguish user-stated facts from assistant-inferred ones.

  // Task 132 (D-122): snapshot the dedup context BEFORE the now.md append
  // below — after the append, "the last now.md entry" IS the current turn,
  // and feeding that to auto-extract as "do not re-emit facts already
  // here" suppressed every organic extraction. Best-effort: an unreadable
  // now.md just means no dedup section this turn.
  let dedupContext = '';
  try {
    // Skill-review I1: neutralize line-start section markers INSIDE the
    // snapshot — conversation text can legitimately contain "USER_TURN:"
    // (this repo's own sessions discuss the turn-file format), and the
    // parser anchors on the first line-start marker it sees. The dedup is
    // advisory context for Haiku; a cosmetic "· " prefix is harmless.
    dedupContext = readLastEntryFromNowMd(projectRoot).replace(
      /^([ 	]*)(DEDUP_CONTEXT:|USER_TURN:|ASSISTANT_TURN:)/gm,
      '$1· $2',
    );
  } catch {
    // no dedup context — extraction still runs, worst case re-emits a dup
  }

  // Task 87: buffer the conversation into now.md so the SessionEnd compressor
  // summarizes the DIALOGUE, not observe-edit's filename log. Best-effort.
  appendConversationToNowMd({ projectRoot, ts, userTurn, assistantTurn: sanitized });

  // Janitor: clear any orphaned turn-files from a prior killed/crashed child
  // before writing this turn's (D-103 finding E). Best-effort.
  sweepStaleTurnFiles(transcriptsDir);

  const turnFile = join(transcriptsDir, `.extract-${Date.now()}.tmp`);
  try {
    writeFileSync(
      turnFile,
      assembleBothTurnsBody({ userTurn, assistantTurn: sanitized, dedupContext }),
      'utf8',
    );
  } catch (err) {
    // Continue without spawning — partial success is better than abort.
    return {
      action: 'captured',
      transcriptPath: effectiveTranscriptPath,
      spawned: false,
      reason: 'turn-file-write-failed',
      error: err?.message ?? String(err),
    };
  }

  // 4. Spawn the auto-extract child (Task 23 fills in the script body).
  const path = autoExtractPath ?? defaultAutoExtractPath();
  const spawnResult = spawnAutoExtract(path, turnFile, projectRoot);

  // 5. Door 5 (observability) — when the spawn doesn't succeed, write
  //    an NDJSON entry to extract.log with `phase: 'spawn'`. Closes PR-A
  //    class-1 audit deferral (Task 23.14.3). Successful spawns are NOT
  //    logged here because their observability is provided by auto-
  //    extract.mjs itself (the detached child writes its own entries
  //    with `phase` absent, default = 'extract').
  if (!spawnResult.spawned) {
    writeSpawnLogEntry({
      projectRoot,
      ts,
      reason: spawnResult.reason,
      error: spawnResult.error,
    });
    // NB: we do NOT unlink the turn-file here. Ownership is clean — auto-extract
    // owns deletion (its `finally`); when the spawn fails (or a child is killed
    // before its finally), the file becomes an orphan that the entry-sweep above
    // reaps once it's stale (D-103 finding E). capture-turn never deletes a file
    // it handed off, so tests can still inspect the IPC shape on the no-spawn path.
  }

  return {
    action: 'captured',
    transcriptPath: effectiveTranscriptPath,
    turnFile,
    ...spawnResult,
  };
}
