# 13. Dual Review Modes & Adversarial PR Verification Architecture

Date: 2026-10-02

## Status

Accepted

## Context

As the AI code review pipeline matured in Amiga IA (`ami-pr-reviewer`, `ami-review-peer-pr`, `ami-review-self-pr`), evaluating Pull Requests exposed two persistent cognitive and operational failure modes:

1. **Complacency Bias & False Clean Approvals ("LGTM Bias"):** When reviewing self-authored code or ostensibly clean/minor diffs, LLMs default to shallow approval or trivial formatting nitpicks, missing insidious edge cases such as concurrency race conditions, unhandled boundary extremes, memory leaks, silent error swallowing, and injection vectors.
2. **Spurious Escalation & False Positives in Peer Reviews:** When reviewing teammates' code, LLMs frequently escalate isolated diff lines to `[BLOCKER]` or `[CRITICAL]` because they lack awareness of upstream perimeter guards (DTO validation, gateway middleware), strict type system invariants, framework isolation, or database constraints.
3. **Execution Rigidity vs Supply-Chain Security:** Static inspection alone cannot detect runtime test regressions or build breaks. Conversely, unconditionally running test suites on untrusted third-party code (external contributors or forks) introduces serious supply-chain attack risks in local developer environments.

## Decision

We have established a comprehensive dual-mode review and adversarial verification architecture across the PR review suite:

### 1. Dual Operational Review Modes
- **Code Review Mode (Default):** Static inspection of code logic, contracts, edge cases, error paths, and acceptance criteria. Zero execution overhead and safe for all environments.
- **Full Review Mode (Dynamic):** Comprehensive static analysis combined with stack-agnostic test runner discovery (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc.) and test suite execution.
- **Security Caution Gate:** Peer reviews in Full Review Mode mandate explicit user warning and manifest audits before executing commands on untrusted peer branches.
- **Automated Remediation Loop:** In self-reviews under Full Review Mode, test failures trigger an immediate root-cause diagnosis and local code fix proposal.

### 2. Acceptance Criteria & Context Ingestion
- Mandatory query and ingestion of PR body descriptions (`gh pr view --json title,body,labels`), extracting stated requirements, checkboxes (`- [ ]`), and linked issues into an internal traceability matrix.
- Mismatches between promised scope and delivered diffs are flagged as `[Requirement Gap]`.
- Ingestion of repository architecture documents (`README.md`, `docs/adr/`, `docs/architecture/`) to ensure alignment with repository invariants.

### 3. Adversarial Falsification Audit (`[Falsification Check]`)
- In peer reviews (`ami-review-peer-pr`), every candidate `[BLOCKER]`, `[CRITICAL]`, or `[MAJOR]` issue must undergo active falsification before publication: the reviewer attempts to prove the defect is neutralized by upstream middleware, type invariants, framework protections, database constraints, or private caller topology.
- Disproved issues are discarded; partially mitigated issues are downgraded; verified issues are published with an explicit `[Falsification Check: Verified]` rationale.

### 4. Adversarial Blind-Spot Probe (`[Blind-Spot Probe]`)
- In self-reviews (`ami-review-self-pr`), whenever preliminary analysis yields zero defects or only minor styling nitpicks, the reviewer must stress-test the diff across 5 adversarial dimensions:
  1. Concurrency & Asynchronous Timing
  2. Boundary Extremes & Zero/Null Invariants
  3. Silent Failures & Partial State Corruption
  4. Resource & Memory Lifecycles
  5. Malicious Payloads & Injection Surfaces
- The probe concludes with actionable local code fixes or an explicit `[Blind-Spot Probe: Clean]` certification.

### 5. Standardized Executive Reporting
- `ami-pr-reviewer` aggregates findings into an Executive Report categorized by: `[Blocker]`, `[Requirement Gap]`, `[Test Failure]`, `[Warning]`, `[Adversarial Audit Trail]`, and `[Suggestion]`.

## Consequences

- **Positive:** Eradicates sycophancy on clean code, slashes false positives on peer reviews, bridges static and dynamic verification safely, and guarantees that PRs satisfy all documented acceptance criteria.
- **Negative:** Full Review mode requires local toolchain availability for the target stack and adds execution time.
