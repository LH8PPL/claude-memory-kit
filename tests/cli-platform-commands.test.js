// @doors: 1
// Door 2 N/A: platform-commands.mjs is a pure string-builder; no disk write.
// Door 3 N/A: no subprocess spawn happens HERE — the helper only DESCRIBES commands (copy-paste strings, plus openBrowserCommand's {command,args} descriptor). The spawn itself lives in viewer.mjs and is asserted there.
// Door 4 N/A: no message-queue interaction.
// Door 5 N/A: no NDJSON observability.
//
// Unit tests for packages/cli/src/platform-commands.mjs.
//
// Cross-platform discipline (PR-E, design §18): every user-facing
// shell command emission must work on the user's native shell. The
// helper provides one function per primitive, returning the right
// command per OS. Tests assert the platform-conditional output
// matches the expected shape.

import { describe, it, expect } from 'vitest';
import {
  removeFile,
  removeDir,
  listDir,
  openBrowserCommand,
  PLATFORM,
} from '../packages/cli/src/platform-commands.mjs';

describe('platform-commands helper', () => {
  describe('PLATFORM constant', () => {
    it('matches the current process platform', () => {
      const expected = process.platform === 'win32' ? 'win32' : 'posix';
      expect(PLATFORM).toBe(expected);
    });
  });

  describe('removeFile(path)', () => {
    it('returns the correct command for the current platform', () => {
      const result = removeFile('/path/to/file.lock');
      if (PLATFORM === 'win32') {
        expect(result).toBe('Remove-Item "/path/to/file.lock"');
      } else {
        expect(result).toBe('rm "/path/to/file.lock"');
      }
    });

    it('quotes paths with spaces', () => {
      const result = removeFile('/Users/Joe Smith/file.lock');
      expect(result).toContain('"/Users/Joe Smith/file.lock"');
    });

    it('quotes Windows-style paths', () => {
      const result = removeFile('C:\\Users\\Joe\\.locks\\auto-extract.lock');
      expect(result).toContain('"C:\\Users\\Joe\\.locks\\auto-extract.lock"');
    });
  });

  describe('removeDir(path)', () => {
    it('returns the recursive-force form for the current platform', () => {
      const result = removeDir('/path/to/dir');
      if (PLATFORM === 'win32') {
        expect(result).toBe('Remove-Item -Recurse -Force "/path/to/dir"');
      } else {
        expect(result).toBe('rm -rf "/path/to/dir"');
      }
    });
  });

  describe('listDir(path)', () => {
    it('returns the directory-listing command for the current platform', () => {
      const result = listDir('/path/to/dir');
      if (PLATFORM === 'win32') {
        expect(result).toBe('Get-ChildItem "/path/to/dir"');
      } else {
        expect(result).toBe('ls "/path/to/dir"');
      }
    });
  });

  describe('shape invariants', () => {
    it('all helpers produce non-empty strings on the current platform', () => {
      expect(removeFile('a').length).toBeGreaterThan(0);
      expect(removeDir('a').length).toBeGreaterThan(0);
      expect(listDir('a').length).toBeGreaterThan(0);
    });

    it('all helpers return double-quoted path arguments', () => {
      expect(removeFile('a')).toMatch(/"a"$/);
      expect(removeDir('a')).toMatch(/"a"$/);
      expect(listDir('a')).toMatch(/"a"$/);
    });
  });

  // Task 255 — the browser-open primitive (design §24.2). Unlike its siblings
  // this one is SPAWNED, not printed, so it returns a {command,args} descriptor.
  describe('openBrowserCommand', () => {
    const url = 'http://127.0.0.1:54321/';

    it('emits the current platform\'s opener with the URL as the last arg', () => {
      const { command, args } = openBrowserCommand(url);
      expect(typeof command).toBe('string');
      expect(command.length).toBeGreaterThan(0);
      expect(Array.isArray(args)).toBe(true);
      expect(args.at(-1)).toBe(url);

      if (PLATFORM === 'win32') {
        // `start` is a cmd BUILTIN — it must be invoked through cmd /c, and the
        // empty title arg is required or `start` eats a quoted URL as the title.
        expect(command).toBe('cmd');
        expect(args).toEqual(['/c', 'start', '', url]);
      } else if (process.platform === 'darwin') {
        expect(command).toBe('open');
        expect(args).toEqual([url]);
      } else {
        expect(command).toBe('xdg-open');
        expect(args).toEqual([url]);
      }
    });

    it('never returns a shell string — the URL stays an argv element', () => {
      const { command, args } = openBrowserCommand(url);
      // If the URL were concatenated into `command`, a URL with a shell
      // metacharacter would become injectable. Keeping it in argv is the guard.
      expect(command).not.toContain(url);
      expect(args.filter((a) => a === url)).toHaveLength(1);
    });
  });
});
