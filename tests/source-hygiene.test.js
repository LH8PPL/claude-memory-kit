// @doors: 2
// Door 1 N/A: no kit function is called — the subject is the repo's own
//   tracked bytes, which have no return value.
// Door 2 (State): the assertion IS state — what is physically committed in
//   the working tree. A raw NUL byte in a text file is behaviourally
//   invisible (it is a valid string character) but makes `grep` classify the
//   file as binary, so every content search silently skips it.
// Door 3 N/A: `git ls-files` is spawned to enumerate TRACKED files (so the
//   check cannot be fooled by an untracked scratch file), but it is the
//   fixture source, not the surface under test — nothing about the spawn's
//   argv/env is a contract this test defends.
// Door 3.5 N/A: no LLM spawn.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: this check emits no log of its own; its observable channel is
//   the test result.
//
// Task 264(a): a raw NUL landed in source TWICE — semantic-backend.mjs
// (found + fixed during Task 261's self-review) and graph-index.mjs (found by
// the same review, at offset 15988, shipped in PR #335). Two instances is a
// class, and the class has a deterministic shape, so it gets a check rather
// than another prose reminder. Both were correct-behaving code: a NUL used as
// a composite-key join separator, written as a literal byte instead of the
// `\u0000` escape. The behaviour is identical either way; only the escape
// keeps the file greppable.

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// DENY-list, not an allow-list (review finding, Task 264): an allow-list of
// text extensions silently under-scans — the first version missed 61 tracked
// files including the SHIPPED python package, the shell + PowerShell scripts,
// the scaffold `.template`/`.fragment` files and the codex rollout fixture,
// while its header claimed to cover "every tracked text source". Everything
// tracked is scanned EXCEPT the extensions below, so a file type nobody has
// added yet (.rs, .rb, .kt) is covered the day it lands.
//
// Why a list at all, rather than sniffing the content: the standard "is this
// binary?" heuristic IS "does it contain a NUL byte", which is the thing under
// test — sniffing would make the check vacuous. So the exclusions are named.
// `.svg` is deliberately NOT here: SVG is XML text and greppable like any
// other source. Extending this list when a genuinely-binary asset lands is the
// intended maintenance, and the failure message names the file that needs it.
const BINARY_EXTENSIONS = new Set([
  // raster + vector-binary assets
  'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'avif', 'bmp', 'pdf',
  // archives
  'zip', 'gz', 'tgz', 'bz2', 'xz', '7z', 'tar',
  // fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  // compiled / model / database artifacts
  'onnx', 'wasm', 'node', 'db', 'sqlite', 'sqlite3', 'bin',
  // platform binaries + media
  'exe', 'dll', 'so', 'dylib', 'mp3', 'mp4', 'mov', 'webm',
]);

// The memory tiers are MACHINE-WRITTEN from captured content, not hand-typed
// source (this repo dogfoods the kit — D-108). They stay IN scope, because a
// NUL in a fact file makes that fact grep-invisible exactly like a source file
// and retrievability is the tier's whole point — but the advice has to differ:
// nobody "escapes" a byte in a data file, the answer is that a capture path
// let it through. Same check, correct hint (review finding, Task 264).
const MEMORY_TIER_RE = /^(context|context\.local)\//;

function extensionOf(relPath) {
  const base = relPath.split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

// Returns null when this is not a git checkout (an extracted tarball, a
// vendored copy) — the check then SKIPS with a stated reason rather than
// erroring, because "not a git checkout" is not a hygiene failure.
function trackedFiles() {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\0').filter(Boolean);
  } catch {
    return null;
  }
}

describe('Task 264(a) — no raw NUL bytes in tracked text files', () => {
  it('every tracked non-binary file is NUL-free (a NUL makes grep treat the file as binary)', () => {
    const tracked = trackedFiles();
    if (tracked === null) {
      console.log('source-hygiene: skipped — not a git checkout (git ls-files unavailable)');
      return;
    }
    expect(tracked.length).toBeGreaterThan(0);

    const offenders = [];
    let scanned = 0;
    for (const rel of tracked) {
      if (BINARY_EXTENSIONS.has(extensionOf(rel))) continue;
      let buf;
      try {
        buf = readFileSync(join(REPO_ROOT, rel));
      } catch {
        continue; // indexed but absent mid-rebase / sparse checkout
      }
      scanned += 1;
      const at = buf.indexOf(0);
      if (at === -1) continue;
      offenders.push(
        MEMORY_TIER_RE.test(rel)
          ? `${rel} (first NUL at byte ${at}) — a memory tier is machine-written: a capture path let a raw NUL through, so screen it at the write path, do not hand-edit the tier`
          : `${rel} (first NUL at byte ${at}) — write it as the \\u0000 escape instead`,
      );
    }

    expect(scanned).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});
