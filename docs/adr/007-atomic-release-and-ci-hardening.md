# 7. Atomic Release Lifecycle & CI/CD Ghost Commit Elimination

Date: 2026-08-23

## Status

Accepted

## Context

Previously, the release pipeline in `amiga-ia` relied on a post-tag automated bump executed by a GitHub Action (`.github/workflows/release.yml`). In that workflow:
1. The developer or agent created a Git Tag (e.g., `v1.2.0`) and published a GitHub Release.
2. The GitHub Action triggered on `release: [published]`, ran `npm version <tag>` inside the runner, committed `package.json` with `github-actions[bot]`, and pushed directly to `main` with `[skip ci]`.
3. The Action then published the package to the NPM registry.

An adversarial architecture review (`ami-expert-council`) revealed critical vulnerabilities and operational friction in this model:
1. **Temporal Inversion & Source-of-Truth Inconsistency:** The Git Tag pointed to commit `N` (where `package.json` had the old version `1.1.0`), while commit `N+1` (created by the CI bot) had version `1.2.0`. Checking out `v1.2.0` yielded an outdated `package.json`.
2. **Local Repository Drift & Ghost Commits:** The automated push to `main` by GitHub Actions left local developer clones 1 commit behind (`behind origin/main by 1 commit`), causing git push rejections (`fetch first`) and requiring mandatory `git pull --rebase` workarounds.
3. **Race Conditions & Fragility:** Concurrent pushes to `main` during CI execution resulted in push collisions that aborted the workflow before `npm publish` could execute.
4. **Governance Incompatibility:** If branch protection rules were enabled on `main`, automated pushes by default bot tokens would fail with `403 Protected Branch`.

## Decision

We adopted an **Atomic Pre-Tag Release Architecture (Cognitive-Deterministic Hybrid)**:

1. **Local Atomic Version Preparation (`ami-release-manager`):**
   - The AI agent / release orchestrator updates `package.json`, source code version constants, and showcase UI badges in `index.html` locally *before* creating the Git tag.
   - All version changes are committed in a single atomic commit: `chore(release): bump version to vX.Y.Z [skip ci]` and pushed to `main`.
   - The Git Tag `vX.Y.Z` and GitHub Release are created pointing directly to this release commit.

2. **Streamlined & Secure CI/CD Pipeline (`release.yml`):**
   - Removed `npm version` bump and `git push` steps from `.github/workflows/release.yml`.
   - The CI workflow is strictly dedicated to non-mutating, idempotent operations: clean environment setup (`setup-node`), dependency installation (`npm ci`), and secure package publication (`npm publish` with isolated `NPM_TOKEN`).
   - The CI runner never writes or pushes back to `main`.

3. **Repository Directives & Rule Cleanup (`AGENTS.md`):**
   - Updated repository rules to state that releases are 100% atomic pre-tag operations.
   - Eliminated reliance on post-release rebase workarounds.

## Consequences

- **Positive:**
  - **100% Atomic Git Tags:** Every tag strictly references the exact commit where all version manifests (`package.json`, badges, docs) reflect the released version.
  - **Zero Local Drift / No Ghost Commits:** Local workspaces remain fully synchronized with remote `main` post-release.
  - **Zero-Trust Secret Isolation:** Deployment tokens (`NPM_TOKEN`) remain securely isolated in GitHub Actions, while versioning decisions remain cognitive and human-approved.
  - **Full Compatibility with Branch Protection:** CI does not require bypass permissions on `main`.
- **Negative:**
  - Requires the local release agent (`ami-release-manager`) or developer to commit `package.json` before tagging, rather than relying on a CI script to mutate it.
