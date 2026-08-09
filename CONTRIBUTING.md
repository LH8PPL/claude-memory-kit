# Contributing to core-memory-kit

Thanks for your interest in improving the kit itself (as opposed to installing it in your own project). This guide covers the development workflow, testing, and the conventions the codebase follows.

## Getting started

```bash
git clone https://github.com/LH8PPL/core-memory-kit.git
cd core-memory-kit
npm install
npm test          # full suite — should be green before you start
```

Node ≥ 22 is required. **CI pins the exact major in [`.nvmrc`](.nvmrc)** — `nvm use` / `fnm use` picks it up, so your local Node matches every gate. (`engines.node: '>=22'` in `packages/cli/package.json` is a separate, deliberately looser thing: the floor a USER's machine must meet. Do not conflate them — narrowing it narrows what we support.) The kit is verified on Windows, macOS, and Linux in CI, so changes must work cross-platform.

## Running tests

Tests are wired through npm scripts.

> [!IMPORTANT]
> **Do not invoke `vitest` (or `npx vitest`) directly.** The npm scripts handle Windows `.cmd` shim resolution and suppress the cmd.exe popup that bare `npx` invocations cause. Always go through the scripts below.

| Script | When to use |
| --- | --- |
| `npm test` | One full-suite run: ~1,900 tests + 19 structural validators (run as a prerun). Live-Haiku spawn-smokes run by default — they need `claude` on PATH and skip gracefully if it's absent. |
| `npm run test:file -- <path>` | Iterate on a single test file. Add `-t "test name"` after the path to target one test. Skips the slow prerun. |
| `npm run test:watch` | Interactive vitest watcher. |
| `npm run stress` | 5× full suite. The gate before opening any PR that touches a spawn boundary, hook handler, or detached child (where concurrency flakes hide). |
| `npm run lint:test-ids` / `npm run validate:template` | Run an individual prerun validator on its own. |

The full test discipline — real-binary spawn smokes, the stress-run gate, and the five-exit-doors framework — is documented in [`specs/design.md` §17](specs/design.md).

## Conventions

- **Test-driven.** Write the failing test first, then the code. Don't change a test to make it pass — fix the code (unless the test is genuinely wrong, in which case say so and explain why).
- **Structural validators over prose rules.** When a rule has a deterministic shape, it gets a `scripts/validate-*.mjs` validator wired into `npm test` rather than living only as a guideline. See the validators table in [`CLAUDE.md`](CLAUDE.md).
- **Document user-facing capabilities in the same PR** that ships them — update the README capability surface and `CHANGELOG.md` under `[Unreleased]`.
- **One PR per task**, squash-merged. PR titles use `[N] <description>`.

The full engineering discipline, architecture rules, and decision history live in [`CLAUDE.md`](CLAUDE.md), [`specs/design.md`](specs/design.md), and [`docs/journey/DECISION-LOG.md`](docs/journey/DECISION-LOG.md).

## CI

Every push and PR runs the full suite plus a cross-OS install matrix (Windows / macOS / Linux), coverage thresholds, and the security stack (secret scanning, CVE / supply-chain checks, SAST). See [`.github/workflows/`](.github/workflows/).

**If a security gate goes red on your PR and the dependency isn't one you touched**, a new advisory landed under you — it happens, and it isn't yours to absorb. Don't bump anything inside your feature branch: follow the runbook in [`SECURITY.md`](SECURITY.md#when-an-advisory-fires-the-runbook) ("When an advisory fires"). The short version is *look first* — Dependabot has usually already opened the fix PR.

## Releasing

Releases are cut by the maintainer via `npm run release -- <patch|minor|major>` and published from CI on a `v*` tag with a signed npm provenance attestation. You don't need to touch versioning in a feature PR — just add your entry to `CHANGELOG.md` under `## [Unreleased]`.

## Reporting issues

Bugs and feature requests are welcome via [GitHub Issues](https://github.com/LH8PPL/core-memory-kit/issues). For security vulnerabilities, follow the disclosure policy in [`SECURITY.md`](SECURITY.md) — please don't open a public issue for those.
