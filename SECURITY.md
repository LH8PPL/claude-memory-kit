# Security Policy

`core-memory-kit` runs inside your Claude Code sessions: it registers lifecycle **hooks**, **spawns subprocesses** (`claude --print`, the `cmk-*` bins), and **auto-extracts conversation content into files that get committed to git**. That makes its security posture matter more than a typical CLI's. This document describes the threat surfaces, what mitigates them, and how to report a vulnerability.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through **GitHub private vulnerability reporting**: the repo's **Security** tab → **Report a vulnerability** (Security Advisories). The report stays private — visible only to the maintainer — until a fix is coordinated, and the channel supports collaborating on the patch, issuing a CVE, and crediting you as the reporter.

Please include repro steps and the affected version. We aim to acknowledge within a few days and to ship a fix or mitigation before any public disclosure.

## Supported versions

The kit is pre-1.0. Security fixes target the **latest published** `0.2.x` release. Older versions are not back-patched.

## Threat surfaces & mitigations

| Surface | Risk | Mitigation |
| --- | --- | --- |
| **Hook execution** — `cmk-*` hooks run on every session/turn | A malicious or corrupted hook command runs in your shell | Hooks are PATH-resolved bare bin names (no `eval`, no shell interpolation of untrusted input). `cmk install` writes only the kit's known commands; `cmk doctor` (HC-2) verifies them. The plugin route ships the same bins under `${CLAUDE_PLUGIN_ROOT}`. |
| **Subprocess spawn** — auto-extract / compression spawn `claude --print` | Hang, resource leak, or an unbounded child | Every spawn site carries an enforced `timeoutMs` + cleanup (enforced by `scripts/validate-spawn-discipline.mjs`); detached children are bounded; the outer hook ceiling composes with inner timeouts (design §8.5). |
| **Auto-extract → committed files** — durable memory lands in `context/` (git-tracked) | A secret or injected instruction spoken in conversation gets written + committed | **Poison-guard** regex catalog (PG-001…PG-013) screens every auto-extract write for secrets + prompt-injection before it lands (NFR-9). `<private>` blocks are excluded from capture; `<retain>` forces keep. |
| **LLM-summary / promotion side doors** — Haiku-summarized output (`recent.md` / `archive.md`), transcript promotion, the persona-review queue, and trust increases reach durable tiers WITHOUT the direct write path | A secret pasted in conversation survives summarization or promotion **verbatim** into a git-committed file; a borderline fact gets its trust raised past the screen | Every such site calls the shared `screenBeforeCommittedWrite()` (Task 216, D-320): curate/distill screen INPUT (pre-Haiku, so a poisoned source costs regex, not a nightly bill) AND output; a poisoned transcript batch is **withheld** (content-free marker, secrets-only scope — a verbatim record is never injected into context); a trust INCREASE re-screens the content against the CURRENT catalog before it is blessed upward. Every rejection is logged redacted. Design §6.7.1. |
| **Memory poisoning** — crafted text tries to plant false "facts" or instructions | Future sessions load attacker-controlled context | Trust hierarchy (high/medium/low) with conflict + review queues; medium-trust auto-extracts route to `queues/review.md` for human promotion; provenance frontmatter on every observation for audit. |
| **MCP server** — the model drives memory ops as auto-invoked tools (`mcp__cmk__*`) | The model silently writes, or destructively tombstones, memory without the user seeing it | **Stdio-only, local** (no network listener, no auth surface to attack). Writes run the **same Poison_Guard + dedup + audit** path as the CLI. **Destructive ops are two-step**: `mk_forget` first returns a preview + a confirm token; nothing is tombstoned until a second call echoes that token — so an auto-invoking model can't silently delete. A build-time parity guard keeps the tool surface identical to the audited CLI verbs. |
| **Temporal-sweep judge** (v0.4.4) — fact bodies flow into a weekly Haiku prompt that classifies same-subject pairs | A poisoned fact body tries to steer a verdict (smuggled "PAIR N: SUPERSEDES" text) so a live fact's validity window closes | Blast radius bounded by CODE: pairing is same-subject-search only, the close DIRECTION is timestamp-decided (never the LLM), a close is archive-recoverable + audited + announced at next session start, verdict parsing is first-match-wins, and bodies are delimited as DATA with an explicit ignore-directives instruction. Poison_Guard screens the write path upstream. Design §16.18. |
| **Memory viewer** (v0.6.4) — `cmk view` serves your memory over local HTTP, including the cross-project user tier | A local listener with no auth is reachable by anything on the machine — or, via **DNS rebinding**, by a web page you happen to have open | **Loopback-only bind, refused rather than flagged**: a non-loopback `--host` is rejected with the reason stated (there is no auth mode — the hermes hardening precedent), so there is no "expose it" path to misconfigure. A **`Host:`-header guard** rejects (403) any request that did not arrive as a loopback host, which is what closes the rebinding hole a loopback bind alone leaves open. **Read-only structurally**: no mutating route is mounted (not disabled — absent, ADR-0018), so anything but `GET`/`HEAD` is 405 before routing; no route maps a path segment onto a filesystem path, so traversal is unreachable rather than filtered. **XSS**: the page renders untrusted content (fact bodies, FTS snippets, health messages) and the defense is that it never parses HTML — every write goes through `textContent`/`createElement`, enforced by a test that fails on any `innerHTML`-class sink appearing in the page. The CSP is a *second* line and a different guarantee: `default-src 'none'` makes the page provably offline (no external origin is loadable, so the viewer cannot become an egress path), and `frame-ancestors 'none'` is listed explicitly because that directive does **not** inherit from `default-src` — without it another origin could frame and clickjack the page. Every response also carries `X-Content-Type-Options: nosniff`. **Ephemeral**: it exits with Ctrl-C, so there is no long-lived listener to forget about. Design §24.1.1. |
| **Network** — the kit could exfiltrate memory | Silent data egress | **No silent network calls** (NFR-5): the only outbound calls are the documented Haiku compression/extraction requests. Markdown is the source of truth; indexes are local-only. |
| **Supply chain** — a dependency ships a CVE | Vulnerable code reaches users | See "Automated scanning" below. |

## Leaked-secret runbook (`cmk redact` — ADR-0022)

If a secret or PII landed in a memory fact (e.g. it predates the write-path screens), the remediation order is:

1. **Rotate the secret first.** `context/` is git-committed — every clone, fork, and CI cache that ever pulled the repo may hold the old commits. A rotated secret is dead wherever it leaked; no scrub substitutes for rotation.
2. **`cmk redact <id> --pattern "<the secret>" --reason "<why>"`** — scrubs the span from the live fact, every tombstone/superseded archive copy, the scratchpad bullet, and the search indexes, replacing it with `[redacted: reason date]`. A title-borne secret contaminates the fact's *filename* too (it's a slug of the title) — redact renames the file to the scrubbed title's slug and scrubs slug residues from the local audit log. The fact and a secret-free audit entry survive. Per-fact by design: occurrences in *other* facts are reported so you can redact them by id. (`cmk purge --hard <id> --yes` is the escalation: the whole fact gone irreversibly, no tombstone.)
3. **Optionally, purge git history — a deliberate one-time team operation the kit never runs for you.** Coordinate with everyone who has a clone (history rewrite = every clone must re-clone), then (two steps — works in every shell, PowerShell included):

   ```bash
   # step 1: write the replacement rule to a file (one rule per line)
   echo 'THE-LEAKED-SECRET==>[redacted]' > expressions.txt
   # step 2: rewrite history, then force-push
   git filter-repo --replace-text expressions.txt --force
   git push --force-with-lease
   ```

   `--replace-text` scrubs the span across history while keeping the files — the right tool after a *redact* (the fact survives). After a *purge*, use `--path <the exact purged file> --invert-paths` to drop that file from history — path-scoped to the purged file(s) the CLI printed, never the whole `context/` tier (that would erase the entire memory history). This cannot reach forks or caches you don't control — which is why step 1 comes first.

The `redact`/`purge` verbs are **CLI-only, never MCP tools** — the destructive/compliance path stays explicit-human (design §6.5).

## Automated scanning (CI)

Every push + PR runs (see `.github/workflows/`):

- **Secrets** — `gitleaks` (full-history) + the GitGuardian app on the repo.
- **Known CVEs / supply chain** — `osv-scanner` (OSV.dev DB → Security tab) + `npm audit --audit-level=high` (**hard gate** on high/critical) + **Dependabot** (weekly update PRs for npm + GitHub Actions).
- **SAST** — `CodeQL` (JavaScript) on the kit's own source.

### The standing watch (Task 237)

The push/PR gates above only run **when someone pushes** — so an advisory published *after* the last PR reaches nobody until the next one. That is not hypothetical: on **2026-07-21** two advisories (`body-parser` GHSA-v422-hmwv-36x6, `protobufjs` GHSA-j3f2-48v5-ccww) were published overnight and were caught only because an unrelated commit happened to be pushed that afternoon.

So the same two scanners also run **daily on a schedule** (and on demand via `workflow_dispatch`). When they find something high/critical, the watch **opens a GitHub issue** — a failed check on a scheduled run notifies nobody, since there is no PR to annotate. A re-run updates that one issue rather than filing a new one each morning, and the issue is **closed automatically** when the dependency surface goes clean again.

> **This delivery was broken from the day it shipped and was repaired in Task 266.** Every scheduled run that actually *found* something died at the final step with `could not add label: 'security' not found` (2026-08-04, 08-05, 08-07) — the repo had no such label, so findings were detected, formatted into an issue body, and then thrown away. The watch now creates the label if it is missing. Recorded rather than quietly fixed, because for that period this section described a signal that did not exist — and class (ii) advisories below had **nothing** watching them.

**What the watch covers, honestly:** *published* advisories in the npm and OSV databases. It does **not** detect zero-days, typosquatted packages, or a compromised-but-not-yet-reported version — it is a latency fix for known advisories, not a guarantee against unknown ones. We deliberately do **not** maintain a hand-curated blocklist of known-compromised `package@version` pairs: such a list rots the moment it stops being tended, and a stale security list is worse than none because it reads as coverage.

### When an advisory fires (the runbook)

Advisories reaching this repo fall into **two classes**, and only one of them is Dependabot's to catch. Knowing which one you're looking at decides your next move.

**Class (i) — Dependabot raises an alert.** Security updates are enabled here and are alert-driven, ignoring the weekly schedule and exempt from the open-PR limit. For **npm specifically** they reach *transitive* dependencies too: a security update may bump a parent to get at a vulnerable sub-dependency. At its best this is fast — one observed alert was answered by a fix PR **within a minute**. But **an alert does not guarantee a PR**: of five recent alerts, three produced none, including a High. Multiple advisories now arrive as **one grouped PR** (`.github/dependabot.yml`).

**Class (ii) — no alert, ever.** `postcss` and `fast-uri` have **zero** Dependabot alerts in this repo's entire history. Nothing in `dependabot.yml` can help them: they are visible only to **osv-scanner**, which scans the whole lockfile against OSV.dev — a broader database than GitHub's advisories. For this class there is genuinely nothing watching except the **daily scheduled scan**, which files an issue. Expect to meet these on a red PR gate.

So there are two failure modes, not one: **paying the fix twice** (hand-rolling a bump while Dependabot's PR for the same advisory sits open — that cost 31.7 h and 17.0 h of open, unnoticed PRs in August), and **nobody watching at all** (class ii).

**When a security gate goes red on your PR:**

1. **Look before you fix.** For a class-(i) advisory the fix probably already exists:

   ```bash
   gh pr list --state open --author app/dependabot
   ```

   If a Dependabot PR covers it — merge that, then rebase yours. Do not hand-roll a second one. If there's no such PR, you are likely in class (ii) — go to step 3.

   Maintainers can also read the alert record directly; it needs **write access**, so this returns `403` for outside contributors, who should use the advisory link in the failing scan's output instead:

   ```bash
   # repo-relative: works from a clone, no hardcoded slug
   gh api "repos/{owner}/{repo}/dependabot/alerts?state=open"
   ```

   Note `state=all` is **not** a valid filter — it returns nothing rather than erroring. Query `open` / `fixed` / `dismissed` / `auto_dismissed` separately.

2. **Keep the advisory out of your feature PR.** A dependency fix lands as **its own PR**, so a feature PR keeps a zero-dependency diff and its claims stay checkable. Rebase once the fix is on `main`.

3. **Stay lock-only when the range allows.** If the fixed version already satisfies the declared range, only `package-lock.json` changes:

   ```bash
   npm audit fix --package-lock-only
   git diff --stat package.json   # expect: no change
   ```

   A `package.json` edit means the fix is outside the range — that is a real decision (a bump across a range boundary), not a lockfile refresh, and it says so in the PR body.

4. **No fix available?** It goes in [`osv-scanner.toml`](osv-scanner.toml), never into a loosened gate. An entry must carry **both**: a **reachability argument** (why the kit structurally never executes the vulnerable path) **and** a **checkable removal trigger** (the concrete condition, with the command that tests it). If you can't write both, it doesn't belong there — fix it or block on it.

**Never:** raise `--audit-level`, add `continue-on-error` to a scanner, or add an `IgnoredVulns` entry with a reason but no removal trigger. A gate that stops biting reads as coverage while providing none — the same reason we don't keep a hand-curated blocklist.

### Accepted, non-shipping findings

`npm audit` currently reports a small number of **moderate** advisories confined to the **dev/test toolchain** (`vitest` / `vite` / `esbuild`). These packages are **devDependencies — they are never published** in the npm tarball (the `files` whitelist ships only `bin/`, `src/`, `template/`, `README.md`). They do not reach a user's machine and so are not gated on; Dependabot tracks them for routine cleanup.

### Accepted, shipped-but-unreachable findings

One narrower class also exists, held to a stricter bar (each entry in [`osv-scanner.toml`](osv-scanner.toml) must state a reachability argument **and** a checkable removal trigger): a **shipped** dependency whose vulnerable code path the kit structurally never executes, with **no fix available inside the dependent's admitted version range**. Currently one entry: `@hono/node-server` (via the MCP SDK) has a Moderate Windows path-traversal in its HTTP **static-file serving** — the kit's MCP server is **stdio-only** and never starts an HTTP listener, and the fix exists only in a major outside the SDK's range. It is removed the day the SDK admits the fixed major. The sibling advisory from the same disclosure (`hono`) *was* fixable in-range and was **updated, not accepted**.

## Publishing integrity

Releases are published from CI (`.github/workflows/publish.yml`) on a `v*` tag, with a **signed npm provenance attestation** (GitHub OIDC) — proving each tarball was built from this repository at a specific commit. The publish credential is a **least-privilege granular npm token** stored only as the encrypted `NPM_TOKEN` GitHub Actions secret — never on a contributor's disk.

## Verifying what you install

```bash
npm view @lh8ppl/core-memory-kit dist.attestations   # provenance present
npm pack @lh8ppl/core-memory-kit --dry-run           # inspect tarball contents
```
