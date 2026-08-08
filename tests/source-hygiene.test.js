// @doors: 2
// Door 1 N/A: no kit function is called — the subject is the repo's own
//   tracked source bytes, which have no return value.
// Door 2 (State): the assertion IS state — what is physically committed in
//   the working tree. A raw NUL byte in a .mjs/.js file is behaviourally
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

// Text sources only. Binary fixtures (.onnx, .png, .db) legitimately contain
// NUL bytes and are not in scope.
const TEXT_SOURCE_RE = /\.(mjs|cjs|js|ts|json|md|yml|yaml)$/i;

function trackedTextSources() {
  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.split('\0').filter((p) => p && TEXT_SOURCE_RE.test(p));
}

describe('Task 264(a) — no raw NUL bytes in tracked text sources', () => {
  it('every tracked text source is NUL-free (a NUL makes grep treat the file as binary)', () => {
    const offenders = [];
    for (const rel of trackedTextSources()) {
      let buf;
      try {
        buf = readFileSync(join(REPO_ROOT, rel));
      } catch {
        continue; // deleted-but-still-indexed during a rebase, etc.
      }
      const at = buf.indexOf(0);
      if (at !== -1) {
        offenders.push(`${rel} (first NUL at byte ${at}) — write it as the \\u0000 escape instead`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
