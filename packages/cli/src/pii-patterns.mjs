// pii-patterns.mjs — the L1 deterministic PII pattern layer (Task 148.1,
// ADR-0019, design §6.10). Sibling to poison-guard.mjs (which REJECTS
// secrets/injection) and sanitize.mjs (which abstracts home paths): this
// module MASKS incidental PII — emails, phone numbers, the local username —
// in place, before any commit-eligible write. A name/email in tool output is
// incidental, not adversarial, so the posture is rewrite-not-reject.
//
// Contracts (locked by tests/cli-pii-patterns.test.js):
//   - findings carry category + offsets, NEVER the matched text — an audit
//     entry built from findings structurally cannot leak what it caught
//     (the memclaw discipline).
//   - redactions carry original → placeholder — the caller appends them to
//     the gitignored context/.locks/redactions.log, the ONE place originals
//     survive (the recovery surface; never committed).
//   - invisible-Unicode/bidi characters are detected on the RAW string and
//     stripped BEFORE pattern matching (the hermes ordering — normalization
//     after matching would let zero-width-split PII evade the regexes).
//   - the scan is bounded (MAX_SCAN_CHARS) — an advisory guard with a bounded
//     worst case, not archival search; the un-scanned tail passes through.
//
// The L3 half of the screen (the async Haiku judge that catches names/health
// details patterns cannot see) lives in transcript-screen.mjs; the two layers
// compose per design §6.10.

import { homedir, userInfo } from 'node:os';
import { basename, join } from 'node:path';
import { sanitizeHomePaths, escapeRegExp } from './sanitize.mjs';
import { parseJsonFile } from './read-json.mjs';
import { INVISIBLE_UNICODE_CODEPOINTS } from './poison-guard.mjs';

// Stable placeholders — «»-delimited so they read as redactions, survive
// markdown, and never collide with real content (memclaw's token style).
export const PII_PLACEHOLDERS = Object.freeze({
  EMAIL: '«EMAIL»',
  PHONE: '«PHONE»',
  USERNAME: '«USER»',
});

// Bounded worst case (hermes MAX_SCAN_CHARS): scanners are advisory guards on
// hook-adjacent paths, not archival search. Content past the bound passes
// through unscanned — documented behavior, asserted in the tests.
export const MAX_SCAN_CHARS = 65_536;

// Invisible / bidi-control codepoints — DERIVED from the canonical catalog in
// poison-guard.mjs (Task 231 skill-review finding 1: this module and the guard
// each kept their own list and drifted — the mask knew U+2062–64, the guard
// didn't, so the invisible-unicode screen was bypassable for exactly those
// three codepoints even after the screen-then-mask reorder). ONE list, owned
// by the security screen; the mask strips what the guard rejects. Codepoints
// stay written as \u-escapes in that catalog (NOT literal invisible glyphs)
// so the source is reviewable — a bidi/joined-sequence char can't hide IN the
// very defense against them (the SonarCloud bidi/joined-class finding).
const INVISIBLE_CHARS = new Set(INVISIBLE_UNICODE_CODEPOINTS.map((cp) => String.fromCodePoint(cp)));
// One alternation of individually-listed codepoints — no character-class
// ranges (a range could silently include an unintended codepoint) and no
// literal invisibles in the source. Checked via set intersection on the RAW
// string; stripped before any pattern runs.
const INVISIBLE_RE = new RegExp([...INVISIBLE_CHARS].join('|'), 'g');

// EMAIL — the standard conservative form, hardened by the Task 252 shape audit.
// Both directions matter on this module: it runs over every transcript entry and
// every prompt, so an under-match is a privacy leak and an over-match destroys
// real log/code text.
//
//   local part — `\p{L}`/`\p{N}`, NOT `[A-Za-z0-9]`. The old ASCII class plus a
//     `\b` anchor (which is ASCII-only) matched a non-ASCII address from its
//     first ASCII byte: `añez@x.com` masked to `añ«EMAIL»` and `a@münchen.de`
//     did not match at all. A PARTIAL mask is still a leak.
//   boundaries — explicit lookarounds instead of `\b`, so the local part can't
//     start mid-token and a trailing sentence period still ends the match.
//   domain labels — each pre-TLD label must contain at least one LETTER: a real
//     domain label is never all-digits, which is what `build@2.0.beta` is. The
//     label is written UNAMBIGUOUSLY — a letter-free prefix, the mandatory
//     letter, then anything — so exactly one split matches a given label. The
//     natural spelling (`[\p{L}\p{N}-]*\p{L}[\p{L}\p{N}-]*`) is ambiguous and
//     measured QUADRATIC on a long almost-matching run (3.5 ms at 2.4 KB, ~16×
//     per 4× length → ~seconds at MAX_SCAN_CHARS) on a per-turn hook path; this
//     form is flat, at the pre-252 regex's cost.
//   TLD — letters only, 2+.
const EMAIL_LOCAL = '[\\p{L}\\p{N}._%+-]+';
const EMAIL_DOMAIN = '(?:[\\p{N}-]*\\p{L}[\\p{L}\\p{N}-]*\\.)+\\p{L}{2,}';
const EMAIL_RE = new RegExp(
  `(?<![\\p{L}\\p{N}._%+-])${EMAIL_LOCAL}@${EMAIL_DOMAIN}(?![\\p{L}\\p{N}])`,
  'gu',
);
// The allowlist skips addresses that are content, not PII: masking
// `noreply@anthropic.com` in a commit trailer would damage the record for zero
// privacy gain. `git@`/`hg@` join it (Task 252): an SSH remote's service handle
// (`git@github.com:owner/repo.git`) is the SAME string for every user on earth,
// so masking it corrupts a very common log/doctor line and protects nobody —
// while a PERSONAL login in a remote (`alice.dev@myserver.example.com`) is a
// real username on a real host and still masks.
const EMAIL_ALLOWLIST_RE =
  /^(?:no-?reply@|(?:git|hg)@|.*@(?:users\.noreply\.github\.com|example\.(?:com|org|net))$)/i;
// …and an address-shaped FILENAME is not an address: `logo@2x.png`, `main@3x.svg`
// (retina/bundler asset refs) are ordinary tool output. Only extensions that are
// NOT delegated TLDs are listed — `.zip`, `.mov`, `.sh`, `.md`, `.ai`, `.io`,
// `.py` are real TLDs where a real address can live, so they are deliberately
// absent and keep masking.
const EMAIL_FILE_EXT_RE =
  /\.(?:png|jpe?g|gif|svg|webp|ico|bmp|css|scss|sass|less|js|mjs|cjs|jsx|tsx|json|jsonc|yaml|yml|toml|lock|log|txt|csv|pdf|html?|xml|exe|dll|mp4|webm|wav|woff|ttf|eot|map)$/i;
const emailIsNotPii = (m) => EMAIL_ALLOWLIST_RE.test(m) || EMAIL_FILE_EXT_RE.test(m);

// PHONE — deliberately conservative (the kit's Poison_Guard philosophy):
// require an international prefix OR separator-formatted groups, so versions
// (0.5.0), ports (8000), dates (2026-07-07), and bare digit runs never match.
//   +CC nnn nnn nnnn   |   (nnn) nnn-nnnn   |   nnn-nnn-nnnn
// Trailing lookahead rejects only a CONTINUATION (digit/hyphen) — a
// sentence-ending period after the number must not defeat the match.
// Task 252 added the two separator variants the audit found missing — both keep
// the conservative posture (a separator or a `+` prefix is still required).
// Bare E.164 (`+972541234567`) stays deliberately UNMATCHED: a `+` followed by a
// long digit run also describes an added line in a unified diff, which the
// transcript tier carries verbatim — trading a leak class for a corruption class
// is not an improvement. Documented, tested, not silent.
const PHONE_RES = [
  /(?<![\w.])\+\d{1,3}[ -]\d{1,3}[ -]?\d{2,4}[ -]\d{3,4}(?![\d-])/g, // +972 54-123-4567
  /(?<![\w.])\(\d{3}\) ?\d{3}-\d{4}(?![\d-])/g, // (555) 123-4567
  /(?<![\w.])\d{3}-\d{3}-\d{4}(?![\d-])/g, // 555-123-4567 (NOT a date: dates are nnnn-nn-nn)
  /(?<![\w.])\+\d{1,3}[ -]\d{1,3}[ -]\d{6,9}(?![\d-])/g, // +972-54-1234567 (unsplit national block)
  // 555.123.4567 (NOT an IPv4 — no 4-digit octet). Like its siblings the trailing
  // guard rejects only a DIGIT continuation: a sentence-ending period after the
  // number must not defeat the match, and the lookbehind already prevents
  // starting mid-run inside a longer dotted sequence.
  /(?<![\w.])\d{3}\.\d{3}\.\d{4}(?!\d)/g,
];

// Cheap keyword pre-filter (the gitleaks two-stage discipline): only run the
// expensive per-pattern pass when the text can possibly contain a match.
function mightContainPii(text, usernames) {
  if (text.includes('@')) return true;
  if (text.includes('+') || text.includes('(') || text.includes('-')) return true;
  // Dot-separated phone groups (555.123.4567). The pre-filter is a GATE, not a
  // hint: a pattern whose trigger character is missing here never runs at all,
  // which is how the dotted-phone form stayed unmasked in text carrying none of
  // the other signals. Any pattern added below must add its trigger here.
  if (/\d\.\d/.test(text)) return true;
  // home-path indicators (sanitizeHomePaths is case-insensitive — match that)
  const lower = text.toLowerCase();
  if (lower.includes('users') || lower.includes('/home/')) return true;
  // Case-INSENSITIVE, matching the USERNAME pattern below: a case-sensitive
  // pre-filter gated the case-insensitive mask off for exactly the text the
  // mask was widened to catch (`SOME.USER logged in` skipped the whole pass).
  for (const u of usernames) if (u && lower.includes(u.toLowerCase())) return true;
  return false;
}

/**
 * Core pass. Returns { text, findings, redactions } where findings are
 * category+offset-only (audit-safe) and redactions carry the originals
 * (for the gitignored recovery log). Offsets refer to the OUTPUT text's
 * placeholder positions — they locate the redaction, not the original.
 */
function run(text, { usernames = [], mutate }) {
  if (typeof text !== 'string') return { text, findings: [], redactions: [] };

  const findings = [];
  const redactions = [];

  // Bound the scanned region; the tail passes through untouched (documented).
  const head = text.slice(0, MAX_SCAN_CHARS);
  const tail = text.slice(MAX_SCAN_CHARS);

  // 1. Invisible-Unicode/bidi — RAW string, before any pattern (hermes order).
  let work = head;
  if ([...new Set(work)].some((ch) => INVISIBLE_CHARS.has(ch))) {
    findings.push({ category: 'INVISIBLE_UNICODE' });
    if (mutate) work = work.replace(INVISIBLE_RE, '');
  }

  if (!mightContainPii(work, usernames)) {
    return { text: mutate ? work + tail : text, findings, redactions };
  }

  const applyPattern = (re, category, placeholder, allow) => {
    work = work.replace(re, (match, ...rest) => {
      // String.replace passes (…groups, offset, string); with no capture
      // groups here, offset is the second-from-last arg.
      const offset = rest.at(-2);
      if (allow?.(match)) return match;
      findings.push({ category, start: offset, end: offset + placeholder.length });
      redactions.push({ category, placeholder, original: match });
      return mutate ? placeholder : match;
    });
  };

  // 2. EMAIL (allowlisted bot/service/example addresses + asset filenames stay).
  applyPattern(EMAIL_RE, 'EMAIL', PII_PLACEHOLDERS.EMAIL, emailIsNotPii);

  // 3. PHONE (conservative forms only).
  for (const re of PHONE_RES) applyPattern(re, 'PHONE', PII_PLACEHOLDERS.PHONE);

  // 4. HOME_PATH — delegate to the existing shared abstraction (sanitize.mjs);
  //    detect-by-diff so the finding is recorded without re-implementing it.
  if (mutate) {
    const before = work;
    work = sanitizeHomePaths(work);
    if (work !== before) findings.push({ category: 'HOME_PATH' });
  }

  // 5. USERNAME — caller-supplied local usernames (derived from homedir /
  //    os.userInfo at the call site; injected here for determinism). Exact
  //    token matches only (boundaries), min length 3 — a short or embedded
  //    match is far likelier to be a real word than the login name.
  //    Case-INSENSITIVE (Task 252), matching sanitizeHomePaths: Windows/macOS
  //    filesystems are case-insensitive, so the SAME login shows up as
  //    `some.user` in `ls` output and `Some.User` in a path — a case-sensitive
  //    pattern masked one and shipped the other. The token boundaries are
  //    unchanged, so widening the case does not widen the match.
  for (const u of usernames) {
    if (!u || u.length < 3) continue;
    const re = new RegExp(`(?<![\\w.-])${escapeRegExp(u)}(?![\\w.-])`, 'gi');
    applyPattern(re, 'USERNAME', PII_PLACEHOLDERS.USERNAME);
  }

  return { text: mutate ? work + tail : text, findings, redactions };
}

/**
 * The local usernames the USERNAME category masks — derived from the OS, not
 * guessed: the login name + the home-dir basename (they differ on some
 * setups). Best-effort: an exotic environment without either just yields [].
 * Call sites pass the result into maskPii; tests inject their own list.
 */
export function localUsernames() {
  const names = new Set();
  try {
    const u = userInfo().username;
    if (u) names.add(u);
  } catch {
    /* no user info — fine */
  }
  try {
    const b = basename(homedir());
    if (b) names.add(b);
  } catch {
    /* no homedir — fine */
  }
  return [...names];
}

/**
 * The privacy-screen kill-switch (design §6.10): context/settings.json →
 * privacy.screen, default 'on'. BOM-tolerant via parseJsonFile (the D-187
 * class). 'off' reverts every 148 surface to pre-148 behavior.
 */
export function resolvePrivacyScreen({ projectRoot }) {
  // No projectRoot (e.g. a pure user-tier write) → screen ON (safe default:
  // the U tier is shared/portable, exactly where masking matters).
  if (typeof projectRoot !== 'string' || projectRoot === '') return 'on';
  const p = join(projectRoot, 'context', 'settings.json');
  const v = parseJsonFile(p, { fallback: null })?.privacy?.screen;
  return v === 'off' ? 'off' : 'on';
}

/** Read-only scan: findings without mutation (category + offsets only). */
export function scanPii(text, opts = {}) {
  const { findings } = run(text, { ...opts, mutate: false });
  return { findings };
}

/**
 * Mask PII in place. Returns:
 *   text       — the masked string (or the input verbatim if nothing matched)
 *   findings   — [{category, start?, end?}] — NEVER carries matched text
 *   redactions — [{category, placeholder, original}] — for redactions.log ONLY
 */
export function maskPii(text, opts = {}) {
  return run(text, { ...opts, mutate: true });
}
