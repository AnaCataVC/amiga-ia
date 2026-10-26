# 20. Release Necessity Gate and Non-Product Release Rejection

Date: 2026-10-26

## Status

Accepted

## Context

In modern software repositories and distributed package ecosystems, a version release signifies a deployable increment of product capability, runtime fix, or breaking interface contract.

Previously, `ami-prepare-release` and `ami-release-manager` defined a Patch bump (`0.0.x`) broadly as:
> *Patch Bump (0.0.x): If commits consist exclusively of bug fixes (`fix:`), refactoring (`refactor:`), documentation updates (`docs:`), or internal tooling chores (`chore:`).*

Under this heuristic, when repository maintainers updated documentation (`docs/`, `README.md`, ADRs), internal benchmark suites (`benchmarks/`), automated test infrastructure (`tests/`), or internal developer directives (`.agents/`, guidelines) without modifying core distributable product code (Layer 1 in Amiga IA), the release orchestrator proposed version increments and drafted release bundles.

Cutting releases for non-product modifications causes:
1. **Registry & Package Pollution:** Unnecessary version churn on package registries (such as NPM or PyPI) with zero functional impact for consumers.
2. **False Operational Signals:** Consumers and automated dependency managers (such as Renovate or Dependabot) trigger downstream updates that contain no functional changes or security fixes.
3. **SemVer Drift:** Blurs the distinction between internal repository maintenance and distributed software increments.

## Decision

We introduce an automated, multi-tiered **Release Necessity Gate** across the release lifecycle (`ami-release-manager`, `ami-prepare-release`, and `scripts/release.js`):

1. **Pre-Flight Release Necessity Audit (`ami-release-manager`):**
   - Introduces Step 2 (*Release Necessity & Product Impact Audit*) prior to version calculations or packaging.
   - Audits unreleased commits (`git log <last-tag>..HEAD --oneline`) and modified file paths (`git diff <last-tag>..HEAD --name-only`).
   - Mandates immediate release rejection if all unreleased commits consist strictly of non-product scopes:
     - Pure documentation updates (`docs:`, README revisions, catalog documentation, ADRs).
     - Internal automated test or benchmark additions (`test:`, `tests/`, `benchmarks/`).
     - Internal repository housekeeping, CI/CD pipelines, or AI prompts/directives (`chore:`, `ci:`, `.github/`, internal rules).
     - Trivial style or formatting changes (`style:`).
   - Authorizes release preparation only when changes contain new product capabilities (`feat:`), functional bug fixes (`fix:`), breaking changes (`BREAKING CHANGE` or `!`), or core codebase refactors/optimizations (`refactor:`, `perf:`) in distributable product code.

2. **Semantic Release Preparation Invariant (`ami-prepare-release`):**
   - Refines SemVer calculation rules so that pure `docs:`, `test:`, `ci:`, or internal `chore:` commits do NOT produce a patch bump and halt release preparation.
   - Enforces a domain-agnostic file diff audit to ensure that patch bumps only trigger for modifications affecting the actual distributable product codebase.

3. **Deterministic CLI Defense-in-Depth (`scripts/release.js`):**
   - Hardens the authoritative release CLI script with an automated release necessity gate.
   - Evaluates `unreleasedCommits` and `changedFiles` between the baseline Git tag and `HEAD`.
   - Rejects execution with a descriptive error if only non-product changes exist, while providing a `--force` / `-f` bypass for intentional manual exceptions.

4. **Automated Test Coverage (`tests/release_cli.test.js`):**
   - Adds unit tests for path classification (`isNonProductFile`) and necessity evaluation (`evaluateReleaseNecessity`).

## Consequences

- **Positive:**
  - **Zero Empty Releases:** Completely eliminates accidental version cuts for documentation, test updates, or internal developer chores.
  - **Semantic Fidelity:** Ensures every published tag reflects real, user-facing or runtime product evolution.
  - **Defense-in-Depth:** Protects both conversational agent orchestrations and direct terminal CLI invocations.
- **Trade-off:**
  - In exceptional situations where a maintainer must publish a release strictly for documentation or package metadata, the `--force` flag must be explicitly passed to bypass the gatekeeper.
