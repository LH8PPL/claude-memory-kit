// @doors: 1, 2
// Door 3 N/A: structural assertions read repo security-config files; no subprocess spawn.
// Door 4 N/A: no NDJSON observability.
// Door 5 N/A: no message-queue.

// Tests for Task 53 — package security hardening (T-041).
// Asserts the security posture is wired structurally: the CI scanners
// exist + parse + carry their load-bearing refs, the provenance publish
// workflow is shaped correctly, Dependabot is configured, SECURITY.md
// documents the threat model + disclosure, and both packages carry a
// `bugs` URL. ("Gate actually bites" is proven by the scan workflows
// running on the PR itself; this file pins that the gates EXIST + are
// well-formed, so they can't silently disappear.)
//
// Boundary discipline: assert presence + the specific tokens that make
// each gate functional (the `uses:` refs, the provenance flag, the
// audit-level, the OIDC permission) — NOT the full YAML byte-shape,
// which is allowed to evolve.

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const wf = (name) => join(REPO_ROOT, '.github', 'workflows', name);
const read = (p) => readFileSync(p, 'utf8');

describe('Task 53 — security workflows exist + parse', () => {
  for (const name of ['security.yml', 'codeql.yml', 'publish.yml']) {
    it(`${name} exists and is valid YAML`, () => {
      const p = wf(name);
      expect(existsSync(p), `${name} missing`).toBe(true);
      expect(() => yaml.load(read(p))).not.toThrow();
    });
  }

  it('.github/dependabot.yml exists, valid YAML, npm ecosystem', () => {
    const p = join(REPO_ROOT, '.github', 'dependabot.yml');
    expect(existsSync(p)).toBe(true);
    const doc = yaml.load(read(p));
    expect(doc.version).toBe(2);
    const ecosystems = (doc.updates ?? []).map((u) => u['package-ecosystem']);
    expect(ecosystems).toContain('npm');
  });
});

describe('Task 53 — security.yml gates (secrets + CVEs)', () => {
  let text;
  it('loads', () => {
    text = read(wf('security.yml'));
    expect(text.length).toBeGreaterThan(0);
  });

  it('runs gitleaks secret scanning', () => {
    text = read(wf('security.yml'));
    expect(text).toMatch(/gitleaks\/gitleaks-action@/);
  });

  it('.gitleaks.toml exists + allowlists the deliberate test fixtures', () => {
    // Load-bearing: without this allowlist, gitleaks flags the poison-guard
    // fixtures (ghp_1234…, AWS example key) and reds every PR.
    const p = join(REPO_ROOT, '.gitleaks.toml');
    expect(existsSync(p)).toBe(true);
    const toml = read(p);
    expect(toml).toMatch(/allowlist/);
    expect(toml).toMatch(/poison-guard/);
  });

  it('runs osv-scanner for CVEs (OSV.dev DB)', () => {
    text = read(wf('security.yml'));
    expect(text).toMatch(/google\/osv-scanner-action/);
  });

  it('hard-gates on npm audit high/critical', () => {
    text = read(wf('security.yml'));
    expect(text).toMatch(/npm audit[^\n]*--audit-level[= ](high|critical)/);
  });

  it('triggers on push and pull_request', () => {
    const doc = yaml.load(read(wf('security.yml')));
    // YAML parses the `on:` key as boolean true in some loaders; read raw.
    const raw = read(wf('security.yml'));
    expect(raw).toMatch(/pull_request:/);
    expect(raw).toMatch(/push:/);
    expect(doc).toBeTruthy();
  });
});

describe('Task 53 — codeql.yml (SAST)', () => {
  it('uses the CodeQL action (init + analyze) for JavaScript', () => {
    const text = read(wf('codeql.yml'));
    expect(text).toMatch(/github\/codeql-action\/init@/);
    expect(text).toMatch(/github\/codeql-action\/analyze@/);
    expect(text).toMatch(/javascript/i);
  });
});

describe('Task 53 — publish.yml (CI provenance publish)', () => {
  let text;
  let doc;
  it('loads + parses', () => {
    text = read(wf('publish.yml'));
    doc = yaml.load(text);
    expect(doc).toBeTruthy();
  });

  it('triggers on v* tags', () => {
    text = read(wf('publish.yml'));
    expect(text).toMatch(/tags:/);
    expect(text).toMatch(/['"]?v\*/);
  });

  it('grants id-token: write (OIDC for provenance)', () => {
    text = read(wf('publish.yml'));
    expect(text).toMatch(/id-token:\s*write/);
  });

  it('publishes with --provenance', () => {
    text = read(wf('publish.yml'));
    expect(text).toMatch(/npm publish[^\n]*--provenance/);
  });

  it('authenticates via the NPM_TOKEN secret (not a hardcoded token)', () => {
    text = read(wf('publish.yml'));
    expect(text).toMatch(/NODE_AUTH_TOKEN/);
    expect(text).toMatch(/secrets\.NPM_TOKEN/);
    // never a literal token
    expect(text).not.toMatch(/npm_[A-Za-z0-9]{20,}/);
  });

  it('runs the test suite before publishing (gate)', () => {
    text = read(wf('publish.yml'));
    expect(text).toMatch(/npm (test|ci)/);
  });
});

describe('Task 53 — SECURITY.md threat model + disclosure', () => {
  let text;
  it('exists with substantive content', () => {
    const p = join(REPO_ROOT, 'SECURITY.md');
    expect(existsSync(p)).toBe(true);
    text = read(p);
    expect(text.length).toBeGreaterThan(500);
  });

  it('documents a responsible-disclosure contact', () => {
    text = read(join(REPO_ROOT, 'SECURITY.md'));
    expect(text).toMatch(/report|disclos/i);
    expect(text).toMatch(/@/); // a contact email/handle
  });

  it('names the kit-specific threat surfaces + mitigations', () => {
    text = read(join(REPO_ROOT, 'SECURITY.md'));
    expect(text).toMatch(/hook|subprocess|auto-extract/i);
    expect(text).toMatch(/poison/i); // the poison-guard mitigation
  });
});

describe('Task 53 — package.json bugs URL (both packages)', () => {
  for (const rel of ['packages/cli/package.json', 'packages/canonicalize/package.json']) {
    it(`${rel} carries a bugs URL`, () => {
      const pkg = JSON.parse(read(join(REPO_ROOT, rel)));
      const bugs = typeof pkg.bugs === 'string' ? pkg.bugs : pkg.bugs?.url;
      expect(bugs, `${rel} missing bugs`).toBeTruthy();
      expect(bugs).toMatch(/github\.com\/LH8PPL\/core-memory-kit/);
    });
  }
});

// ---------------------------------------------------------------------------
// Task 266 — dependency-advisory maintenance CADENCE.
//
// The measured picture (not the one the task was filed on): between
// 2026-08-03 and 08-08, five advisories fired and Dependabot's SECURITY
// updates caught every one — transitives included — within ~60 s of each
// alert. Detection was never the gap. The gap was FAN-OUT: five advisories
// became separate PRs spread over two days, so they got re-fixed by hand
// (PR #343) while Dependabot's own fix PRs (#340, #341) sat open unnoticed.
//
// These assertions pin the two halves of the fix:
//   1. grouping, so a multi-advisory day costs ONE review;
//   2. the two documented PRECONDITIONS for grouped security updates, whose
//      absence turns the grouping into a SILENT no-op — the same failure
//      shape as a `labels:` block naming labels that don't exist.
// And that the runbook exists where a contributor with a red gate will look.
const loadNpmUpdate = () => {
  const doc = yaml.load(read(join(REPO_ROOT, '.github', 'dependabot.yml')));
  const npm = (doc.updates ?? []).find((u) => u['package-ecosystem'] === 'npm');
  expect(npm, 'no npm update block in dependabot.yml').toBeTruthy();
  return npm;
};

// A group that selects nothing matches nothing. GitHub requires at least one
// selector key; assert we always carry one rather than trusting the shape.
const selectorsOf = (group) =>
  ['patterns', 'dependency-type', 'update-types'].filter((k) => group[k] !== undefined);

describe('Task 266 — advisories arrive grouped, not fanned out', () => {
  it('npm SECURITY updates are grouped into one PR', () => {
    const groups = Object.values(loadNpmUpdate().groups ?? {});
    const security = groups.filter((g) => g['applies-to'] === 'security-updates');
    expect(security.length, 'no npm group with applies-to: security-updates').toBeGreaterThan(0);
    for (const g of security) {
      expect(selectorsOf(g).length, 'security group selects nothing').toBeGreaterThan(0);
    }
  });

  it('npm routine VERSION updates are grouped too (a quiet week is one PR)', () => {
    const groups = Object.values(loadNpmUpdate().groups ?? {});
    // `applies-to` defaults to version-updates when omitted (GitHub's default).
    const version = groups.filter((g) => (g['applies-to'] ?? 'version-updates') === 'version-updates');
    expect(version.length, 'no npm group for version updates').toBeGreaterThan(0);
    for (const g of version) {
      expect(selectorsOf(g).length, 'version group selects nothing').toBeGreaterThan(0);
    }
  });

  it('the github-actions ecosystem is grouped as well', () => {
    const doc = yaml.load(read(join(REPO_ROOT, '.github', 'dependabot.yml')));
    const actions = (doc.updates ?? []).find((u) => u['package-ecosystem'] === 'github-actions');
    expect(actions, 'no github-actions update block').toBeTruthy();
    expect(Object.keys(actions.groups ?? {}).length).toBeGreaterThan(0);
  });

  // The silent-no-op guard. GitHub: "the `directory` must be the path to the
  // manifest files ... and you should not specify a `target-branch`." Break
  // either and grouped security updates stop applying with ZERO signal — the
  // PRs simply go back to arriving one-per-advisory.
  it('holds both documented preconditions for grouped security updates', () => {
    const npm = loadNpmUpdate();
    const dir = npm.directory ?? (npm.directories ?? [])[0];
    expect(dir, 'npm directory must be the manifest path').toBe('/');
    expect(
      npm['target-branch'],
      'a target-branch silently disables grouped security updates',
    ).toBeUndefined();
  });
});

describe('Task 266 — the advisory runbook is where a red gate sends you', () => {
  it('SECURITY.md carries the runbook and its three routes', () => {
    const text = read(join(REPO_ROOT, 'SECURITY.md'));
    expect(text).toMatch(/When an advisory fires/i);
    // Route 1 — look for the fix PR Dependabot has probably already opened.
    expect(text).toMatch(/gh pr list[^\n]*dependabot/i);
    // Route 2 — a fix that exists lands lock-only, in its own PR.
    expect(text).toMatch(/package-lock\.json/);
    // Route 3 — a no-fix advisory goes to the exception registry, never to a
    // loosened gate.
    expect(text).toMatch(/osv-scanner\.toml/);
  });

  it('CONTRIBUTING points a contributor with a red gate at the runbook', () => {
    // Deliberately NOT a bare /SECURITY\.md/ match — CONTRIBUTING already
    // links that file for disclosure, so such a test would pass vacuously.
    expect(read(join(REPO_ROOT, 'CONTRIBUTING.md'))).toMatch(/advisory fires/i);
  });

  it('the osv-scanner exception registry points back at the runbook', () => {
    expect(read(join(REPO_ROOT, 'osv-scanner.toml'))).toMatch(/advisory fires/i);
  });
});
