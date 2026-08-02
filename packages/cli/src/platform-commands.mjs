// platform-commands.mjs — shared helper for emitting user-facing
// shell commands that work on the user's actual shell.
//
// Why this exists
// ---------------
//
// The kit emits shell commands to users at runtime in several places
// (lock-discipline.mjs's `recoveryCommand` field is the canonical
// example; future `cmk doctor` HC-* repair output + `cmk repair`
// self-repair output + error messages all do the same). The
// user-facing shell varies by OS:
//
//   - Windows (cmd.exe / PowerShell): `Remove-Item`, `Get-ChildItem`,
//     `New-Item`, etc. POSIX commands (`rm`, `ls`, `mkdir`) DO NOT
//     work on stock cmd.exe and produce confusing errors.
//   - macOS / Linux: POSIX commands.
//   - Git Bash on Windows: POSIX commands work (it provides them).
//
// PR-B (lock-discipline.mjs) established the inline pattern:
// `process.platform === 'win32'` switches between `Remove-Item "..."`
// and `rm "..."`. PR-E (this campaign Part 7/7) generalizes that
// pattern into this shared helper so future code doesn't reinvent it,
// and so `scripts/validate-platform-commands.mjs` can mechanically
// verify every emission site uses the helper or an explicit
// suppression marker.
//
// What this module provides
// -------------------------
//
// One function per primitive command. Each takes argument(s) and
// returns a COMPLETE, copy-paste-ready shell command string in the
// user's native shell. The caller doesn't think about quoting,
// escaping, or platform differences — the helper does.
//
// Primitives currently covered:
//   - removeFile(path)   — delete a file
//   - removeDir(path)    — delete a directory recursively
//   - listDir(path)      — list directory contents
//
// What this module does NOT do
// ----------------------------
//
//   - Generate shell-script files. This is for one-liner copy-paste
//     hints to the user, not for scripting.
//   - Escape shell injection. Callers pass paths derived from kit
//     state (lock-file paths, install dirs). Untrusted user input
//     should be validated upstream.
//   - Detect Git Bash vs cmd.exe vs PowerShell on Windows. We emit
//     the PowerShell-style command on win32; Git Bash users can run
//     the POSIX command independently. The platform-detection
//     defaults to "what the user's STOCK shell expects" since that's
//     the failure mode (PR-B's `recoveryCommand` finding: a Windows
//     user pasting `rm` into cmd.exe gets a "command not found"
//     error; pasting `Remove-Item` works in both PowerShell AND
//     Git Bash IF git-bash forwards the call, but at minimum it
//     doesn't give a confusing error).
//
// Suppression
// -----------
//
// Sites that LEGITIMATELY hardcode a POSIX command (e.g., a .sh
// script that already requires bash) can suppress the
// `validate-platform-commands.mjs` check with a per-line
// `// platform-commands: ignore <reason>` marker. Use sparingly —
// the marker is for cases where a platform-specific shell is the
// contract, not an oversight.

// Note on Git Bash on Windows (per design §18.6): Git Bash reports
// `process.platform === 'win32'` (it's running under the win32 Node
// build) and accepts both POSIX `rm` AND PowerShell `Remove-Item`
// via PowerShell.exe in PATH. Emitting `Remove-Item` is therefore
// the cross-Windows-shell-compatible default — it works in stock
// PowerShell AND in Git Bash. A user on cmd.exe with neither
// PowerShell nor `rm` in PATH would have a broken Node install
// anyway, so that case is out of scope.
const IS_WINDOWS = process.platform === 'win32';

// Quote a path for the user's shell. PowerShell + cmd.exe both
// accept double-quoted paths. POSIX shells accept either; we use
// double-quotes for consistency. Paths containing literal double-
// quote characters are extremely rare in filesystem paths but would
// need additional handling — not addressed here.
function quote(path) {
  return `"${path}"`;
}

/**
 * Build a "remove this file" command in the user's native shell.
 *
 * Windows (PowerShell / cmd.exe via PowerShell-style fallback):
 *   Remove-Item "C:\path\to\file"
 *
 * POSIX (macOS / Linux / Git Bash):
 *   rm "/path/to/file"
 */
export function removeFile(path) {
  if (IS_WINDOWS) {
    return `Remove-Item ${quote(path)}`;
  }
  return `rm ${quote(path)}`;
}

/**
 * Build a "remove this directory recursively" command.
 *
 * Windows:
 *   Remove-Item -Recurse -Force "C:\path\to\dir"
 *
 * POSIX:
 *   rm -rf "/path/to/dir"
 */
export function removeDir(path) {
  if (IS_WINDOWS) {
    return `Remove-Item -Recurse -Force ${quote(path)}`;
  }
  return `rm -rf ${quote(path)}`;
}

/**
 * Build a "list directory contents" command.
 *
 * Windows:
 *   Get-ChildItem "C:\path\to\dir"
 *
 * POSIX:
 *   ls "/path/to/dir"
 */
export function listDir(path) {
  if (IS_WINDOWS) {
    return `Get-ChildItem ${quote(path)}`;
  }
  return `ls ${quote(path)}`;
}

/**
 * Build the "open this URL in the user's default browser" SPAWN descriptor
 * (Task 255 / design §24.2 — the `cmk view` launch shape follows
 * `register-crons`' platform discipline).
 *
 * This one is deliberately NOT a copy-paste string like its siblings: the kit
 * SPAWNS it rather than printing it, so it returns `{command, args}` for
 * `spawn()` instead of a shell line. It still lives here because the concern is
 * identical — "what does this primitive look like on the user's platform" — and
 * a second home for that judgement is exactly the drift the module exists to
 * prevent.
 *
 *   win32  → cmd /c start "" <url>   (`start` is a cmd builtin, not an exe;
 *                                     the empty "" is the window TITLE arg —
 *                                     without it `start` eats the URL as the
 *                                     title when it is quoted)
 *   darwin → open <url>
 *   other  → xdg-open <url>          (freedesktop; the Linux/BSD standard)
 *
 * NOT shell-escaped, and it does not need to be: `spawn` with an args array
 * never goes through a shell on POSIX, and the only caller passes a
 * kit-constructed `http://127.0.0.1:<port>/` URL — no `&`, no quotes, no
 * user-controlled bytes. A caller that ever wants to open an arbitrary URL must
 * validate it first.
 *
 * @param {string} url
 * @returns {{command: string, args: string[]}}
 */
export function openBrowserCommand(url) {
  if (IS_WINDOWS) {
    // platform-commands: ignore this IS the platform-commands helper — the
    // win32 branch of the browser-open primitive, not a hardcoded emission.
    return { command: 'cmd', args: ['/c', 'start', '', url] };
  }
  if (process.platform === 'darwin') {
    return { command: 'open', args: [url] };
  }
  return { command: 'xdg-open', args: [url] };
}

// Exported for the validator + tests to assert which platform the
// helper is currently emitting for. Useful for cross-platform CI
// matrices where the test asserts both halves.
export const PLATFORM = IS_WINDOWS ? 'win32' : 'posix';
