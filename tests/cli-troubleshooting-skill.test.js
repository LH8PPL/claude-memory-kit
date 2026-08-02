// @doors: 1, 2
// Door 3 N/A: no subprocess — the skill's contract is its file content plus
//   what `install()` copies; the validator-binary spawn is covered in
//   cli-skill-scaffold.test.js.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: skill scaffolding emits no NDJSON; install reports created/skipped
//   through its result object (Door 1) and the file tree (Door 2).

// Tests for Task 250 (D-412 point 5) — the troubleshooting skill.
//
// The third scaffolded skill, and the only one whose subject is the KIT ITSELF
// rather than the user's memory. That makes its safety contract the sharpest of
// the three: it is the one skill that will actually be asked to RUN repairs, so
// "which repairs may it run unasked" is a live question, not a theoretical one.
//
// The load-bearing assertions here are the ones that tie the PROSE to the CODE:
// every registry failure code must have a section, and every section must name
// the fix class and repair command the registry declares. A repair book that
// drifts from the registry producing the whisper is worse than no book — the
// whisper would name a code the skill cannot look up, or the skill would run a
// repair at an authority the registry never granted.

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { install } from '../packages/cli/src/install.mjs';
import { HEALTH_CODES, HEALTH_REGISTRY } from '../packages/cli/src/health-log.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CANONICAL = join(REPO_ROOT, 'template', '.claude', 'skills', 'troubleshooting', 'SKILL.md');
const MIRROR = join(REPO_ROOT, 'plugin', 'skills', 'troubleshooting', 'SKILL.md');

function sha(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const data = yaml.load(m[1]);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

const text = readFileSync(CANONICAL, 'utf8');
const fm = frontmatter(text);
const body = text.slice(text.indexOf('---', 4));

/** The prose block for one failure code, up to the next heading. */
function sectionFor(code) {
  const start = body.indexOf('### `' + code + '`');
  if (start === -1) return '';
  const ends = [body.indexOf('\n### ', start + 1), body.indexOf('\n## ', start + 1)].filter((n) => n > -1);
  return body.slice(start, ends.length ? Math.min(...ends) : undefined);
}

describe('the troubleshooting skill — frontmatter + trigger surface', () => {
  it('has name + an auto-invoke description within the Agent-Skills limits', () => {
    expect(fm.name).toBe('troubleshooting');
    const d = fm.description ?? '';
    expect(d.length, 'description MUST be <= 1024 chars (silent non-load over it)').toBeLessThanOrEqual(1024);
    expect(d, 'third-person only (it is injected into a system prompt)').not.toMatch(/\b(you|your|I can|I will)\b/i);
    expect(d, 'no XML angle brackets').not.toMatch(/<[a-z/]/i);
  });

  it('fires on the WHISPER — the line that points at it', () => {
    // Without this the composition is broken end-to-end: the whisper names the
    // skill, and the skill has to recognise the whisper.
    const d = fm.description ?? '';
    expect(d).toContain('core-memory-kit');
    expect(d.toLowerCase()).toMatch(/whisper|⚠/);
  });

  it('fires on SYMPTOMS phrased as a user would phrase them, not on a code list', () => {
    const d = (fm.description ?? '').toLowerCase();
    expect(d).toMatch(/not being saved|nothing was remembered|erroring/);
    expect(d).toMatch(/however they phrase it|illustrative|not a checklist/);
  });

  it('scopes itself away from recall so it does not swallow memory-search questions', () => {
    const d = (fm.description ?? '').toLowerCase();
    expect(d).toMatch(/not the content|memory-search/);
  });

  it('runs forked so a noisy diagnostic never pollutes the main context', () => {
    expect(fm.context).toBe('fork');
  });
});

describe('the troubleshooting skill — the safety contract', () => {
  const tools = fm['allowed-tools'] ?? '';

  it('grants diagnosis and the kit-owned rebuild', () => {
    expect(tools).toMatch(/Bash\(cmk doctor/);
    expect(tools).toMatch(/Bash\(cmk reindex/);
  });

  it('CANNOT mutate memory content, and carries no Edit/Write', () => {
    // The worst a mis-fire can do is rebuild a derived view.
    expect(tools).not.toMatch(/mk_remember|mk_forget|mk_trust/);
    expect(tools).not.toMatch(/cmk remember|cmk forget|cmk trust/);
    expect(tools).not.toMatch(/\bEdit\b|\bWrite\b/);
  });

  // Review finding B3: the grant list was `Bash(cmk repair *)`, which includes
  // `--hooks` (rewrites settings.json) and `--format` (migrates COMMITTED
  // memory markdown) — both confirm-class, both claimed absent by design §23.5.
  // The claim was false and the "cannot mutate" test above did not catch it,
  // because it only looked for `cmk remember`-shaped verbs. These two tests pin
  // the boundary in BOTH directions so a widened grant fails the suite.
  it('grants EXACTLY the diagnosis + silent-fix surface, and nothing else (positive list)', () => {
    const granted = tools.trim().split(/\s+(?=Bash\(|mcp__)/).map((t) => t.trim()).filter(Boolean);
    expect(granted.sort()).toEqual(
      [
        'Bash(cmk doctor)',
        'Bash(cmk doctor *)',
        'Bash(cmk reindex)',
        'Bash(cmk reindex *)',
        'Bash(cmk search *)',
        'mcp__cmk__mk_search',
      ].sort(),
    );
  });

  it('grants NO form of cmk repair or cmk install — the confirm-class fixes stay propose-only', () => {
    // `cmk repair --index` alone would be safe, but a Bash() pattern is a
    // PREFIX match: `Bash(cmk repair --index*)` also admits
    // `cmk repair --index --hooks`, which rewrites settings.json. The pattern
    // language cannot express "this flag and no other", so repair is ungranted
    // entirely rather than granted with a hole in it.
    expect(tools).not.toMatch(/Bash\(cmk repair/);
    expect(tools).not.toMatch(/Bash\(cmk install/);
    expect(tools).not.toMatch(/--hooks/);
    expect(tools).not.toMatch(/--format/);
    expect(tools).not.toMatch(/--all/);
  });

  it('tells the reader the boundary is enforced, so an ungranted command reads as intent', () => {
    expect(body.toLowerCase()).toMatch(/deliberately ungranted|enforced, not just asked for/);
  });

  it('forbids hand-editing the memory tiers as a repair', () => {
    expect(body.toLowerCase()).toMatch(/never hand-edit/);
  });

  it('uses no dev-repo internal paths and forward slashes only', () => {
    expect(text).not.toMatch(/packages\/cli\/src/);
    expect(text).not.toMatch(/context\\/);
  });
});

describe('the troubleshooting skill — the confirm-first discipline (ADR-0018)', () => {
  it('states the rule BEFORE the first repair instruction', () => {
    const rule = body.search(/never run a fix that touches the user'?s own state without asking/i);
    expect(rule, 'the confirm-first rule must be present').toBeGreaterThan(-1);
    // Ordering IS the contract — a reader who stops early must still have read it.
    expect(rule).toBeLessThan(body.search(/### `agent-cli-missing`/));
  });

  it('names and distinguishes all three fix classes', () => {
    const lower = body.toLowerCase();
    for (const cls of ['silent', 'confirm', 'advise']) {
      expect(lower, `fix class '${cls}' is never explained`).toContain(cls);
    }
  });

  it('defaults an UNKNOWN failure to the cautious end (D-412 point 1)', () => {
    expect(body.toLowerCase()).toMatch(/unsure.*advise|unknown failure never earns silent/s);
  });
});

describe('the troubleshooting skill — the repair book tracks the registry', () => {
  it('carries one keyed section per failure code, so every whisper resolves', () => {
    for (const code of Object.values(HEALTH_CODES)) {
      expect(body, `no repair-book section for '${code}'`).toContain('### `' + code + '`');
    }
  });

  it('each section declares the SAME fix class the registry declares', () => {
    for (const w of Object.values(HEALTH_REGISTRY)) {
      const section = sectionFor(w.code).toLowerCase();
      expect(section, `${w.code}: section names no fix class`).toMatch(
        new RegExp(`fix class:\\s*\\*{0,2}${w.fixClass}`, 'i'),
      );
    }
  });

  it('each section names the registry primaryAction as its command', () => {
    for (const w of Object.values(HEALTH_REGISTRY)) {
      expect(sectionFor(w.code), `${w.code}: section names no repair command`).toContain(w.primaryAction);
    }
  });

  it('index-drift is the ONLY code the skill may fix without asking', () => {
    const silent = Object.values(HEALTH_REGISTRY)
      .filter((w) => w.fixClass === 'silent')
      .map((w) => w.code);
    expect(silent).toEqual(['index-drift']);
    expect(sectionFor('index-drift').toLowerCase()).toMatch(/without asking|just run it/);
  });

  it('the memory-off codes tell the user what still works while capture is down', () => {
    // The honest half: "capture is off" must not read as "you have lost
    // everything", and there IS a working manual path.
    for (const w of Object.values(HEALTH_REGISTRY).filter((x) => x.severity === 'memory-off')) {
      expect(sectionFor(w.code).toLowerCase()).toMatch(/cmk remember|fallback|still land|not total/);
    }
  });
});

describe('the troubleshooting skill — doctor is the fallback, never the fix', () => {
  it('keeps a nothing-above-matched section', () => {
    expect(body).toMatch(/nothing above matched/i);
  });

  it('says plainly that doctor diagnoses rather than repairs', () => {
    expect(body).toMatch(/doctor repairs nothing by itself|this is the diagnosis, not the fix/i);
  });

  it('refuses to invent a repair when doctor is clean', () => {
    expect(body.toLowerCase()).toMatch(/rather than inventing a repair|say so plainly/);
  });

  it('points recall and capture questions at the other two skills', () => {
    expect(body).toMatch(/what this skill does not cover/i);
    expect(body).toMatch(/memory-search/);
    expect(body).toMatch(/memory-write/);
  });
});

describe('the troubleshooting skill scaffolds + mirrors like the other two', () => {
  it('the plugin mirror is byte-identical to the canonical source', () => {
    expect(existsSync(MIRROR)).toBe(true);
    expect(sha(MIRROR)).toBe(sha(CANONICAL));
  });

  it('cmk install scaffolds it into <project>/.claude/skills/ (Door 2)', async () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'cmk-trouble-scaffold-'));
    try {
      const projectRoot = join(sandbox, 'proj');
      mkdirSync(projectRoot, { recursive: true });
      const result = await install({ projectRoot, userTier: join(sandbox, 'user') });
      expect(result.errors).toEqual([]);
      const target = join(projectRoot, '.claude', 'skills', 'troubleshooting', 'SKILL.md');
      expect(existsSync(target)).toBe(true);
      expect(sha(target)).toBe(sha(CANONICAL));
    } finally {
      rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });

  it('OVER-MUTATION GUARD: adding it left the other two skills scaffolding unchanged', async () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'cmk-trouble-siblings-'));
    try {
      const projectRoot = join(sandbox, 'proj');
      mkdirSync(projectRoot, { recursive: true });
      await install({ projectRoot, userTier: join(sandbox, 'user') });
      for (const name of ['memory-write', 'memory-search']) {
        const target = join(projectRoot, '.claude', 'skills', name, 'SKILL.md');
        expect(existsSync(target), `${name} must still scaffold`).toBe(true);
        expect(sha(target)).toBe(sha(join(REPO_ROOT, 'template', '.claude', 'skills', name, 'SKILL.md')));
      }
    } finally {
      rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });
});
