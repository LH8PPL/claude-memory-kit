// @doors: 1
// Door 2 N/A: pure string-transform module — no disk state; the redactions-log
//   WRITE happens at the call sites (capture-turn/memory-write), asserted in
//   their own suites (cli-capture-turn / cli-transcript-screen).
// Door 3 N/A: no subprocess — deterministic regex/set operations only.
// Door 4 N/A: no message-queue interaction.
// Door 5 N/A: no NDJSON emission from this module (call sites own the log).
//
// Tests for Task 148.1 (ADR-0019, design §6.10) — the L1 deterministic PII
// pattern layer. Boundary: scanPii / maskPii. The contract under test:
//   - EMAIL/PHONE/USERNAME masked in place with stable placeholders;
//     HOME_PATH delegates to the existing sanitizeHomePaths (`~`).
//   - findings carry category + offsets, NEVER the matched text (memclaw —
//     an audit built from findings structurally cannot leak).
//   - redactions[] carries original→placeholder for the gitignored
//     redactions.log (the recovery surface) — the ONE place originals survive.
//   - invisible-Unicode/bidi stripped from the RAW string BEFORE pattern
//     matching (hermes — normalization/matching must not be evadable).
//   - over-mutation guard: text outside matched spans is byte-identical.

import { describe, it, expect } from 'vitest';
import {
  scanPii,
  maskPii,
  PII_PLACEHOLDERS,
  MAX_SCAN_CHARS,
} from '../packages/cli/src/pii-patterns.mjs';

describe('Task 148.1 — L1 PII patterns (pure, Door 1)', () => {
  describe('EMAIL', () => {
    it('masks an email with the stable placeholder and records category-only findings', () => {
      const input = 'authors = [{ name = "A Person", email = "someuser@gmail.com" }]';
      const { text, findings, redactions } = maskPii(input);
      expect(text).toContain(`email = "${PII_PLACEHOLDERS.EMAIL}"`);
      expect(text).not.toContain('someuser@gmail.com');
      // findings: category + offsets, never the matched text
      const f = findings.find((x) => x.category === 'EMAIL');
      expect(f).toBeTruthy();
      expect(typeof f.start).toBe('number');
      expect(typeof f.end).toBe('number');
      expect(JSON.stringify(findings)).not.toContain('someuser');
      // redactions: the recovery record DOES carry the original
      const r = redactions.find((x) => x.category === 'EMAIL');
      expect(r.original).toBe('someuser@gmail.com');
      expect(r.placeholder).toBe(PII_PLACEHOLDERS.EMAIL);
    });

    it('allowlists bot/example emails (noreply@, example.com/org, users.noreply.github.com)', () => {
      const input = [
        'Co-Authored-By: Claude <noreply@anthropic.com>',
        'docs use user@example.com and admin@example.org',
        'gh shows 12345+bot@users.noreply.github.com',
      ].join('\n');
      const { text, findings } = maskPii(input);
      expect(text).toBe(input); // untouched
      expect(findings.filter((f) => f.category === 'EMAIL')).toHaveLength(0);
    });
  });

  describe('PHONE (conservative — separators or + required)', () => {
    it('masks international and separator-formatted numbers', () => {
      const a = maskPii('call me at +972 54-123-4567 tomorrow');
      expect(a.text).toContain(PII_PLACEHOLDERS.PHONE);
      expect(a.text).not.toContain('54-123-4567');
      const b = maskPii('office: (555) 123-4567.');
      expect(b.text).toContain(PII_PLACEHOLDERS.PHONE);
    });

    it('does NOT mask versions, ports, dates, or bare digit runs (false-positive guard)', () => {
      const input = 'v0.5.0 on port 8000, built 2026-07-07, id 1234567890';
      const { text, findings } = maskPii(input);
      expect(text).toBe(input);
      expect(findings.filter((f) => f.category === 'PHONE')).toHaveLength(0);
    });
  });

  describe('HOME_PATH (delegates to sanitizeHomePaths)', () => {
    it('abstracts a home-dir prefix to ~ inside larger text', () => {
      const { text } = maskPii('set projects["C:/Temp/x"] in C:\\Users\\someuser\\.claude.json please');
      expect(text).toContain('~\\.claude.json');
      expect(text).not.toContain('C:\\Users\\someuser');
    });
  });

  describe('USERNAME (caller-supplied local usernames, token-bounded)', () => {
    it('masks the bare username token as it appears in ls/tool output', () => {
      const input = '-rw-r--r-- 1 some.username 197121 5740 Jul  7 22:22 CLAUDE.md';
      const { text, redactions } = maskPii(input, { usernames: ['some.username'] });
      expect(text).toContain(`1 ${PII_PLACEHOLDERS.USERNAME} 197121`);
      expect(text).not.toContain('some.username');
      expect(redactions.find((r) => r.category === 'USERNAME').original).toBe('some.username');
    });

    it('does not mask substrings inside larger words, and ignores usernames shorter than 3 chars', () => {
      const { text } = maskPii('the usernamespace module', { usernames: ['username', 'ab'] });
      expect(text).toBe('the usernamespace module');
      const { text: t2 } = maskPii('ab is short', { usernames: ['ab'] });
      expect(t2).toBe('ab is short');
    });
  });

  describe('invisible Unicode / bidi (checked on the RAW string, stripped before matching)', () => {
    it('strips zero-width/bidi chars and records the finding — so obfuscated PII cannot evade', () => {
      // zero-width space splits the email so a naive regex would miss it
      const input = 'mail some​user@gma​il.com now';
      const { text, findings } = maskPii(input);
      expect(text).not.toContain('​');
      expect(findings.some((f) => f.category === 'INVISIBLE_UNICODE')).toBe(true);
      // after stripping, the email pattern catches it
      expect(text).toContain(PII_PLACEHOLDERS.EMAIL);
      expect(text).not.toContain('someuser@gmail.com');
    });
  });

  describe('contracts', () => {
    it('over-mutation guard: everything outside matched spans is byte-identical', () => {
      const before = 'alpha beta someuser@gmail.com gamma delta';
      const { text } = maskPii(before);
      expect(text.startsWith('alpha beta ')).toBe(true);
      expect(text.endsWith(' gamma delta')).toBe(true);
    });

    it('scanPii is read-only (reports findings, never mutates)', () => {
      const input = 'reach someuser@gmail.com';
      const { findings } = scanPii(input);
      expect(findings.some((f) => f.category === 'EMAIL')).toBe(true);
      expect(input).toBe('reach someuser@gmail.com');
    });

    it('non-string input passes through unchanged (optional-field callers)', () => {
      expect(maskPii(undefined).text).toBe(undefined);
      expect(maskPii(null).text).toBe(null);
    });

    it('clean text: zero findings, zero redactions, identical output', () => {
      const input = 'refactor the service layer per the layered rule';
      const out = maskPii(input);
      expect(out.text).toBe(input);
      expect(out.findings).toHaveLength(0);
      expect(out.redactions).toHaveLength(0);
    });

    it('bounded scan: content past MAX_SCAN_CHARS is passed through unscanned (advisory guard, bounded worst case)', () => {
      const email = 'someuser@gmail.com';
      const pad = 'x'.repeat(MAX_SCAN_CHARS);
      const { text } = maskPii(pad + ' ' + email);
      // the tail past the bound is untouched — documented, not silent
      expect(text.endsWith(email)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Task 252 — pattern hardening. Two halves, both load-bearing:
//   under-match (a real address slips the screen → a privacy leak) and
//   over-match (an `@`/digit run in code or log text is destroyed → a
//   correctness bug in the other direction, on a module that runs over EVERY
//   transcript entry and prompt).
// Every masked case asserts the PLACEHOLDER (the 233 lesson: asserting only
// "the input string is absent" passes for the wrong reason when a downstream
// step reshapes the text); every non-match case asserts BYTE-IDENTICAL output.
// ---------------------------------------------------------------------------
describe('Task 252 — maskPii pattern hardening (shape audit)', () => {
  const masked = (input) => maskPii(input).text;

  describe('EMAIL — real-world local-part / domain shapes all reach the placeholder', () => {
    // The D-395 named case. It was ALREADY covered (EMAIL_RE has `.` in its
    // local-part class since Task 148) — this pins it so the claim can never
    // go un-tested again.
    it.each([
      ['dotted local part (the D-395 case)', 'alice.leak@x.com'],
      ['plus-addressing', 'a+tag@x.com'],
      ['underscores, hyphens and digits', 'a_b-c9@corp.io'],
      ['percent in the local part', 'user%test@x.com'],
      ['multi-label subdomains + multi-part TLD', 'first.last+tag@mail.corp.example.co.uk'],
      ['mixed case', 'Alice.Leak@X.COM'],
      ['long alphabetic TLD', 'x@y.technology'],
      ['hyphenated domain', 'a@b-c.io'],
      ['digit-leading domain label', 'a@1password.com'],
    ])('masks %s', (_label, email) => {
      expect(masked(`reach ${email} today`)).toBe(`reach ${PII_PLACEHOLDERS.EMAIL} today`);
    });

    it('masks a NON-ASCII local part whole — no leaked prefix (the ASCII-class gap)', () => {
      // Pre-252 `[A-Za-z0-9._%+-]` + `\b` matched from the first ASCII char, so
      // `añez@x.com` masked to `añ«EMAIL»` — the leading bytes of a real
      // address survived on disk. A partial mask is still a leak.
      expect(masked('mail añez@x.com now')).toBe(`mail ${PII_PLACEHOLDERS.EMAIL} now`);
      expect(masked('mail josé.lópez@correo.es now')).toBe(`mail ${PII_PLACEHOLDERS.EMAIL} now`);
    });

    it('masks a NON-ASCII domain (IDN in its unicode form)', () => {
      expect(masked('mail a@münchen.de now')).toBe(`mail ${PII_PLACEHOLDERS.EMAIL} now`);
    });

    it('survives surrounding punctuation: sentence period, angle brackets, mailto:', () => {
      expect(masked('contact: a.b@x.com.')).toBe(`contact: ${PII_PLACEHOLDERS.EMAIL}.`);
      expect(masked('<mailto:a.b@x.com>')).toBe(`<mailto:${PII_PLACEHOLDERS.EMAIL}>`);
      expect(masked('(a.b@x.com)')).toBe(`(${PII_PLACEHOLDERS.EMAIL})`);
    });

    it('DOCUMENTED NON-COVERAGE: an RFC-5321 quoted local part is not matched', () => {
      // `"john doe"@x.com` is legal but essentially nonexistent in real text,
      // and matching a quote-delimited span containing spaces would over-match
      // prose aggressively. Recorded as a known, bounded residual — not silent.
      const input = 'mail "john doe"@x.com now';
      expect(masked(input)).toBe(input);
    });
  });

  describe('EMAIL — over-match guard: an `@` that is not an address is byte-identical', () => {
    it.each([
      ['a Java/TS decorator', 'class X { @Override run() {} }'],
      ['a CSS at-rule', '@media screen and (max-width: 40em) { }'],
      ['the kit npm scope', 'npm i @lh8ppl/core-memory-kit'],
      ['a scoped package at a version', 'npm i @lh8ppl/core-memory-kit@0.6.2'],
      ['a JSDoc tag', ' * @param {string} opts.projectRoot'],
      ['a bare host with no TLD', 'ssh user@host to check'],
      ['pseudo-code indexing', 'read arr@idx from the buffer'],
      ['a package at a semver', 'pinned pkg@1.2.3 in the lockfile'],
      ['a runtime at a version', 'node@20.11.0 per .nvmrc'],
      ['a single-letter TLD (not an address shape)', 'see a@b.c here'],
      ['a domain-less local part', 'the foo.bar@baz token'],
      ['a retina asset filename', 'import logo@2x.png from assets'],
      ['a build tag with a numeric label', 'artifact build@2.0.beta uploaded'],
      ['a bundled asset with a hash-ish label', 'main@3x.svg in dist'],
    ])('leaves %s untouched', (_label, input) => {
      expect(masked(input)).toBe(input);
    });

    it('SSH REMOTE RULING: the `git@` service handle survives, a PERSONAL login in a remote is masked', () => {
      // `git@<host>` is a service account name identical for every user on
      // earth — masking it corrupts the record for zero privacy gain (the same
      // rationale that already allowlists noreply@ / example.com). A human
      // login in a remote IS the local username on a real host, so it masks.
      const remote = 'origin git@github.com:LH8PPL/core-memory-kit.git (fetch)';
      expect(masked(remote)).toBe(remote);
      expect(masked('remote hg@bitbucket.org:team/repo')).toBe('remote hg@bitbucket.org:team/repo');
      expect(masked('ssh alice.dev@myserver.example.com')).toBe(`ssh ${PII_PLACEHOLDERS.EMAIL}`);
    });

    it('the existing bot/example allowlist is unchanged by the hardening', () => {
      const input = [
        'Co-Authored-By: Claude <noreply@anthropic.com>',
        'docs use user@example.com and admin@example.org',
        'gh shows 12345+bot@users.noreply.github.com',
      ].join('\n');
      expect(masked(input)).toBe(input);
    });

    it('over-mutation guard: one address among many non-address `@` tokens masks alone', () => {
      const { text, redactions } = maskPii(
        '@Override then npm i @lh8ppl/core-memory-kit@0.6.2 then mail alice.leak@x.com then logo@2x.png',
      );
      expect(text).toBe(
        `@Override then npm i @lh8ppl/core-memory-kit@0.6.2 then mail ${PII_PLACEHOLDERS.EMAIL} then logo@2x.png`,
      );
      expect(redactions.filter((r) => r.category === 'EMAIL')).toHaveLength(1);
    });
  });

  describe('EMAIL — bounded cost on an adversarial almost-match', () => {
    it('a full-scan-length run of near-address text stays fast (no quadratic backtracking)', () => {
      // The natural spelling of "a domain label containing at least one letter"
      // (`[\p{L}\p{N}-]*\p{L}[\p{L}\p{N}-]*`) is AMBIGUOUS — measured 3.5 ms at
      // 2.4 KB and growing ~16x per 4x length, i.e. seconds at MAX_SCAN_CHARS,
      // on a module that runs inside a per-turn hook. The shipped form is
      // unambiguous. The bound is deliberately loose (the deterministic form is
      // sub-millisecond here); it only has to fail the quadratic shape.
      const adversarial = 'a@' + 'a'.repeat(MAX_SCAN_CHARS - 4) + '.1';
      const t = Date.now();
      const { findings } = maskPii(adversarial);
      expect(Date.now() - t).toBeLessThan(1000);
      expect(findings.filter((f) => f.category === 'EMAIL')).toHaveLength(0);
    });
  });

  describe('PHONE — sibling-gap audit (separator variants)', () => {
    it('masks the dot-separated North-American form', () => {
      // Doubles as the pre-filter pin: this input carries NONE of the cheap
      // keyword-stage trigger characters (`@`, `+`, `(`, `-`), so it only masks
      // if mightContainPii knows the dotted form exists. The two-stage filter is
      // a GATE — a pattern whose trigger is absent there never runs at all.
      expect(masked('call 555.123.4567 today')).toBe(`call ${PII_PLACEHOLDERS.PHONE} today`);
      // A sentence-ending period must not defeat the match (the sibling
      // patterns' trailing-guard contract), and a longer digit run must not
      // half-match from the middle.
      expect(masked('desk 555.123.4567.')).toBe(`desk ${PII_PLACEHOLDERS.PHONE}.`);
      expect(masked('build 1.555.123.45678 id')).toBe('build 1.555.123.45678 id');
    });

    it('masks +CC-NN-NNNNNNN (an unsplit national block after the country code)', () => {
      expect(masked('call +972-54-1234567 today')).toBe(`call ${PII_PLACEHOLDERS.PHONE} today`);
      expect(masked('call +44 20 79460958 today')).toBe(`call ${PII_PLACEHOLDERS.PHONE} today`);
    });

    it('the false-positive guard still holds for the added forms (versions, dates, IPs, ports, ids)', () => {
      const input =
        'v0.5.0 on port 8000, built 2026-07-07, host 192.168.1.100, mask 255.255.255.0, id 1234567890, sha 1.2.3';
      expect(masked(input)).toBe(input);
    });

    it('DOCUMENTED NON-COVERAGE: bare E.164 with no separators is not matched', () => {
      // `+972541234567` — a `+` followed by a long digit run also describes an
      // added line in a unified diff (tool output the transcript tier carries
      // verbatim). The kit's conservative-phone posture keeps the separator
      // requirement rather than trade a leak class for a corruption class.
      const input = 'call +972541234567 today';
      expect(masked(input)).toBe(input);
    });
  });

  describe('USERNAME — sibling-gap audit (case)', () => {
    it('masks the login name in ANY case (Windows/macOS paths are case-insensitive)', () => {
      const opts = { usernames: ['some.user'] };
      expect(maskPii('ls -l Some.User file', opts).text).toBe(`ls -l ${PII_PLACEHOLDERS.USERNAME} file`);
      expect(maskPii('SOME.USER logged in', opts).text).toBe(`${PII_PLACEHOLDERS.USERNAME} logged in`);
    });

    it('case-insensitivity does not widen the token boundary (no substring masking)', () => {
      const opts = { usernames: ['some.user'] };
      expect(maskPii('some.userx and xsome.user stay', opts).text).toBe('some.userx and xsome.user stay');
    });
  });
});
