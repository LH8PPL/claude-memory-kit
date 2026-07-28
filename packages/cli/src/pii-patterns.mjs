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
//   local part — `\p{L}`/`\p{M}`/`\p{N}`, NOT `[A-Za-z0-9]`. The old ASCII class
//     plus a `\b` anchor (which is ASCII-only) matched a non-ASCII address from
//     its first ASCII byte: `añez@x.com` masked to `añ«EMAIL»` and
//     `a@münchen.de` did not match at all. A PARTIAL mask is still a leak.
//   `\p{M}` (combining marks) is REQUIRED, not decorative: `\p{L}` matches the
//     PRECOMPOSED `ñ` (NFC) but a DECOMPOSED one (NFD — `n` + U+0303) is a
//     letter followed by a mark, and macOS hands out NFD filenames, so `ls` /
//     `git` output pasted into a transcript carries it. Without `\p{M}` the NFD
//     form reproduced the exact half-mask this task exists to close.
//   boundaries — explicit lookarounds instead of `\b`, so the local part can't
//     start mid-token and a trailing sentence period still ends the match. They
//     carry `\p{M}` too, or a decomposed character straddling the boundary
//     re-opens the same partial match.
//   domain labels — each pre-TLD label must contain at least one LETTER: a real
//     domain label is never all-digits, which is what `build@2.0.beta` is. The
//     label is written UNAMBIGUOUSLY — a letter-free prefix, the mandatory
//     letter, then anything — so exactly one split matches a given label. The
//     natural spelling (`[\p{L}\p{N}-]*\p{L}[\p{L}\p{N}-]*`) is ambiguous and
//     measured QUADRATIC on a long almost-matching run (3.5 ms at 2.4 KB, ~16×
//     per 4× length → ~seconds at MAX_SCAN_CHARS) on a per-turn hook path; this
//     form is flat, at the pre-252 regex's cost. (Marks are excluded from the
//     letter-free PREFIX class, which is what keeps the split unambiguous.)
//   TLD — a letter followed by letters/marks, so a decomposed TLD still ends the
//     address.
// Fragments are written with String.raw so the pattern reads as the pattern —
// `\p{L}`, not `\\p{L}`. Double-escaping a regex built as a string is a known
// legibility trap (it is why the ambiguous-label spelling below took a second
// read to spot); the compiled `.source` is unchanged either way.
const EMAIL_LOCAL = String.raw`[\p{L}\p{M}\p{N}._%+-]+`;
const EMAIL_DOMAIN = String.raw`(?:[\p{N}-]*\p{L}[\p{L}\p{M}\p{N}-]*\.)+\p{L}[\p{L}\p{M}]+`;
// The boundaries: no `\b` (ASCII-only) — an explicit character-class lookaround
// on each side, marks included, so a decomposed character straddling the edge
// cannot re-open the partial match this task closed.
const EMAIL_LEFT_EDGE = String.raw`(?<![\p{L}\p{M}\p{N}._%+-])`;
const EMAIL_RIGHT_EDGE = String.raw`(?![\p{L}\p{M}\p{N}])`;
const EMAIL_RE = new RegExp(
  `${EMAIL_LEFT_EDGE}${EMAIL_LOCAL}@${EMAIL_DOMAIN}${EMAIL_RIGHT_EDGE}`,
  'gu',
);
// The same shape, FULLY anchored — used to ask "is this whole token an address?"
// when deciding whether a file-extension-suffixed match is a filename or a real
// address wearing one (see isAssetFilename).
const EMAIL_WHOLE_RE = new RegExp(`^${EMAIL_LOCAL}@${EMAIL_DOMAIN}$`, 'u');
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
// Kept as a LIST rather than one long alternation literal: the literal form was
// a single 37-branch expression (unreadable, and flagged for regex complexity),
// while the list groups the extensions by kind and makes an addition a one-word
// diff. The compiled pattern is byte-identical — the order is the join order.
const EMAIL_FILE_EXTS = [
  'png', 'jpe?g', 'gif', 'svg', 'webp', 'ico', 'bmp', // images
  'css', 'scss', 'sass', 'less', // styles
  'js', 'mjs', 'cjs', 'jsx', 'tsx', // scripts
  'json', 'jsonc', 'yaml', 'yml', 'toml', 'lock', // data + config
  'log', 'txt', 'csv', 'pdf', 'html?', 'xml', // text + docs
  'exe', 'dll', 'mp4', 'webm', 'wav', 'woff', 'ttf', 'eot', 'map', // binaries, media, fonts
];
const EMAIL_FILE_EXT_RE = new RegExp(String.raw`\.(?:${EMAIL_FILE_EXTS.join('|')})$`, 'i');
/**
 * Is this match an asset FILENAME rather than an address?
 *
 * Ending in a listed extension is NOT sufficient — that test alone exempted a
 * REAL address wearing a file extension (`exports/john.doe@corp.com.csv`, an
 * ordinary export path), which masked before this task and would have leaked
 * after it. Strip the trailing extension(s) and ask whether what remains is
 * still a whole address: `logo@2x.png` → `logo@2x` (no dotted domain) is a
 * filename; `john.doe@corp.com.csv` → `john.doe@corp.com` is an address and
 * must mask. Only extensions that are NOT delegated TLDs are ever stripped, so
 * a real address's own TLD can never be eaten by this loop.
 */
function isAssetFilename(m) {
  let stem = m;
  while (EMAIL_FILE_EXT_RE.test(stem)) stem = stem.replace(EMAIL_FILE_EXT_RE, '');
  return stem !== m && !EMAIL_WHOLE_RE.test(stem);
}
const emailIsNotPii = (m) => EMAIL_ALLOWLIST_RE.test(m) || isAssetFilename(m);

// PHONE — deliberately conservative (the kit's Poison_Guard philosophy):
// require an international prefix OR separator-formatted groups, so versions
// (0.5.0), ports (8000), dates (2026-07-07), and bare digit runs never match.
//   +CC nnn nnn nnnn   |   (nnn) nnn-nnnn   |   nnn-nnn-nnnn
// Trailing lookahead rejects only a CONTINUATION (digit/hyphen) — a
// sentence-ending period after the number must not defeat the match.
// Task 252 added the two separator variants the audit found missing — both keep
// the conservative posture (a separator or a `+` prefix is still required).
//
// NAMED RESIDUALS (both directions, stated rather than assumed):
//   - Bare E.164 (`+972541234567`) stays deliberately UNMATCHED: a `+` before a
//     long digit run also describes an added line in a unified diff, which the
//     transcript tier carries verbatim. A leak class traded for a corruption
//     class is not an improvement.
//   - A STANDALONE 3-3-4 dotted triple (`100.200.3000`) and a `+NNN NNN NNNNNNN`
//     triple in diff-shaped text DO mask. These are shape-identical to the real
//     phone forms — there is no discriminating signal, so the trade is accepted
//     in the masking (safe) direction and pinned by tests so it stays visible.
//     What IS fixable — and fixed — is half-matching the head of a LONGER dotted
//     run; the trailing guards below reject a dotted-digit continuation.
const PHONE_RES = [
  /(?<![\w.])\+\d{1,3}[ -]\d{1,3}[ -]?\d{2,4}[ -]\d{3,4}(?![\d-])/g, // +972 54-123-4567
  /(?<![\w.])\(\d{3}\) ?\d{3}-\d{4}(?![\d-])/g, // (555) 123-4567
  /(?<![\w.])\d{3}-\d{3}-\d{4}(?![\d-])/g, // 555-123-4567 (NOT a date: dates are nnnn-nn-nn)
  // +972-54-1234567 (unsplit national block). `(?!\.\d)` joins the sibling
  // `(?![\d-])` guard so the head of a longer dotted run is not half-matched.
  /(?<![\w.])\+\d{1,3}[ -]\d{1,3}[ -]\d{6,9}(?![\d-])(?!\.\d)/g,
  // 555.123.4567 (NOT an IPv4 — no 4-digit octet). The trailing guard matches
  // its siblings' `(?![\d-])` — a sentence-ending period must not defeat the
  // match — plus `(?!\.\d)` so `100.200.3000.4000` is not half-matched from its
  // head; the lookbehind already prevents starting mid-run.
  /(?<![\w.])\d{3}\.\d{3}\.\d{4}(?![\d-])(?!\.\d)/g,
];

// The pattern REGISTRY — the single list `run()` walks, each entry carrying the
// BARE text it must match. `tests/cli-pii-patterns.test.js` loops the exported
// samples and asserts every one of them masks on its own, which makes two
// otherwise-silent failure modes self-detecting:
//   - a pattern added without a sample fails the loop (no entry to assert), and
//   - a pattern whose trigger character is missing from mightContainPii's cheap
//     pre-filter fails too — the sample is BARE, so the pre-filter is the only
//     thing between it and the pattern. That gate silently disabled the dotted
//     phone form during this task's build; the loop test is the guard that turns
//     the next such landmine into a red suite instead of a shipped no-op.
const PII_PATTERNS = [
  {
    category: 'EMAIL',
    placeholder: PII_PLACEHOLDERS.EMAIL,
    re: EMAIL_RE,
    allow: emailIsNotPii,
    sample: 'someuser@gmail.com',
  },
  ...PHONE_RES.map((re, i) => ({
    category: 'PHONE',
    placeholder: PII_PLACEHOLDERS.PHONE,
    re,
    sample: ['+972 54-123-4567', '(555) 123-4567', '555-123-4567', '+972-54-1234567', '555.123.4567'][i],
  })),
];

/**
 * `[{category, sample}]` derived from the live registry — the test loop's input.
 * Derived, not hand-listed, so it cannot drift from what `run()` actually walks.
 * (Only `{category, sample}` escapes: a `/g` RegExp carries `lastIndex` state
 * and must not be shared outside the module.)
 */
export const PII_PATTERN_SAMPLES = Object.freeze(
  PII_PATTERNS.map(({ category, sample }) => Object.freeze({ category, sample })),
);

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

  // 2-3. EMAIL then PHONE, from the ONE registry (each entry has a sample the
  //      test loop asserts against — see PII_PATTERNS).
  for (const p of PII_PATTERNS) applyPattern(p.re, p.category, p.placeholder, p.allow);

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
    const re = new RegExp(String.raw`(?<![\w.-])${escapeRegExp(u)}(?![\w.-])`, 'gi');
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
