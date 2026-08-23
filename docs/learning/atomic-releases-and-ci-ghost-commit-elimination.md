# Technical Learning: Atomic Releases & CI Ghost Commit Elimination

## Overview

In automated CI/CD and AI-assisted workflows, designing release lifecycles requires balancing **cognitive decisions** (semantic version calculation, documentation auditing, changelog curation) with **deterministic execution** (testing, secret isolation, package registry publication).

This learning records the structural anti-patterns identified during the adversarial audit of `amiga-ia`'s release architecture and the resulting hybrid pattern implemented to resolve them.

---

## The Anti-Pattern: Post-Release CI Mutation & Ghost Commits

### The Flow
1. Developer/Agent cuts a Git tag (`v1.2.0`) and publishes a release via `gh release create`.
2. A CI job triggers `on: release [published]`.
3. Inside the CI runner, `npm version` updates `package.json` and a bot pushes a commit (`chore: bump version [skip ci]`) directly back to `main`.
4. The CI job runs `npm publish`.

### Root-Cause Analysis of Failure Modes

1. **Temporal Inversion & Dirty Tags:**
   - In Git, a Tag is an immutable pointer to a specific commit SHA.
   - When the tag is created *prior* to bumping `package.json`, the tagged commit contains outdated version metadata. Anyone cloning or inspecting `v1.2.0` receives a repository state that claims to be `v1.1.0`.

2. **Ghost Commits & Developer Workspace Drift:**
   - Because the CI bot pushes directly to remote `main`, the local developer workspace becomes instantly outdated (`Your branch is behind 'origin/main' by 1 commit`).
   - Subsequent local work results in rejected pushes (`fetch first`), necessitating artificial rebases or fetch checks.

3. **Concurrency Collisions & Incomplete Releases:**
   - If concurrent changes or PR merges occur between the release tag creation and the CI bot commit, the CI `git push` fails.
   - Because the job aborts on git push failure, `npm publish` never runs, resulting in a **ghost/broken release** (Tag exists on GitHub, but package is missing on NPM).

4. **Branch Protection Vulnerability:**
   - Direct bot pushes violate modern Git branch governance (`Require a pull request before merging`, signed commits, status checks), causing CI failures when governance rules are tightened.

---

## The Solution: Cognitive-Deterministic Hybrid Architecture

To eliminate all 4 failure modes without adding heavy external tooling dependencies, responsibilities are cleanly partitioned:

```mermaid
flowchart TD
    subgraph Cognitive Layer (Local AI / Developer)
        A[Audit Docs & Diagnostics] --> B[Calculate SemVer from Commits]
        B --> C[Human Approval Gate]
        C --> D[Update package.json, Badges, Constants]
        D --> E[Single Atomic Commit: chore(release): vX.Y.Z]
        E --> F[Push Commit & Create Git Tag pointing to this commit]
    end

    subgraph Deterministic Layer (GitHub Actions CI/CD)
        F -- on: release published --> G[Clean Runner Environment]
        G --> H[npm ci]
        H --> I[npm publish with NPM_TOKEN]
    end
```

### Key Rules for the Pattern
1. **Never mutate repository history from release publishing workflows in CI.**
2. **Every Git Tag MUST point to an already-versioned commit** where all manifests (`package.json`, `index.html`, etc.) are in absolute sync.
3. **Keep deployment credentials (`NPM_TOKEN`, PyPI tokens) strictly inside CI runners** (Zero-Trust).
4. **Use AI agents for cognitive synthesis (Changelog, ADRs, Health checks)** and CI for isolated, deterministic publication.
