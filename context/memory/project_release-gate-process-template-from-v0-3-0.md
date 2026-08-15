---
id: P-Y5U33ATF
type: project
title: Release Gate Process (Template from v0.3.0)
created_at: 2026-06-11T14:07:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d25545fea2e4a6fd1797294d677349799e546dfe
related: [fresh-folder-verification-workflow-for-claude-memory-kit-rel, npm-pack-global-install-for-artifact-testing-0b, e1-cold-open-test-persona-carries-unprompted]
---

Multi-stage gate before publishing:

**Gate 1: Session 3 (Cold-Open Test)**
- Create new temp dir and clean git repo (mkdir, git init)
- cmk install (fresh install into clean env)
- Open in VS Code
- Ask assistant to build any small Python thing
- Pass: assistant auto-applies conventions (uv, .venv, type hints, tests) without prompting
- Proves first-time user experience works
- ~10 min

**Gate 2: F-sweep (Guide Validation)**
- In test environment, systematically run guide §7 commands F-1 through F-19
- Tick each as you go
- Ask which were pre-covered (prior sessions may have run some)
- Validates guide accuracy end-to-end
- ~20 min

**Gate 3: Re-pack**
- git pull latest changes into main repo
- cd packages/cli, npm pack
- Uninstall old global binary, reinstall from fresh .tgz
- Ensures latest code is in the published binary
- ~3 min

**Gate 4: Tag & Publish**
- Confirm final file checks pass
- git tag v<VERSION>
- git push --tags
- Publishes the release to npm

**Why:** This gate sequence validates the kit works in cold-start scenarios (Session 3 ensures new users aren't surprised), the guide is accurate (F-sweep), packaging is clean (re-pack), and finally publishes. Designed and validated for v0.3.0 release.

**How to apply:** Use as a checklist for any future release. Each gate answers a different question: does it work for new users? is the guide right? is the binary fresh? is the publish clean?
