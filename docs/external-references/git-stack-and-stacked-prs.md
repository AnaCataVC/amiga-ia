> **Created:** 2026-08-03
> **Last Updated:** 2026-08-03

# Stacked Pull Requests and Git Stack Workflows

This reference document consolidates external research on **Stacked Pull Requests (Stacked PRs)** and **Git Stack** workflows, detailing core architecture, CLI tooling, developer best practices, and actionable guidelines for integrating these concepts into AI agent workflows and code review skills.

---

## 1. Core Architecture & Motivation

### What is a Stacked PR Workflow?
A **Stacked PR workflow** breaks a large, complex feature into a dependent sequence (or "stack") of small, incremental pull requests. Instead of developing a monolithic feature branch targeting `main`, each incremental step is developed in its own branch that builds directly on top of the previous layer's branch:

```text
main
 └─ feat/layer-1-database-schema  <-- (PR #1 targets main)
     └─ feat/layer-2-backend-api  <-- (PR #2 targets layer-1)
         └─ feat/layer-3-ui-components  <-- (PR #3 targets layer-2)
```

### Why Developers Use Stacking
1. **Accelerated & Higher-Quality Code Reviews:** Small, atomic PRs (< 200 lines of code) dramatically lower cognitive load for reviewers, leading to much faster review turnaround and higher defect detection rates.
2. **Unblocked Parallel Development:** Authors do not have to wait for Layer 1 to be reviewed, approved, or merged into `main` before building Layer 2. Work progresses continuously down the chain.
3. **Logical Separation of Concerns:** Encourages decomposing features along strict architectural boundaries (e.g., Data Layer $\rightarrow$ Service Layer $\rightarrow$ Presentation Layer).
4. **Targeted CI Validation:** Continuous Integration tests run specifically against the minimal diff of each layer rather than an entire monolithic feature.

---

## 2. Tooling Ecosystem & Command References

Because manual management of interdependent branch chains via standard `git rebase` or `git merge` can be tedious and prone to human error (causing "phantom merge conflicts"), developers rely on specialized CLI tools and platform extensions.

### GitHub Native Support (`gh-stack`)
GitHub provides native support for stacked PRs via an official GitHub CLI extension, offering integrated stack maps inside the GitHub Web UI and automatic cascading re-targeting when base branches are merged.

- **Installation:**
  ```powershell
  gh extension install github/gh-stack
  ```
- **Key Commands:**
  - `gh stack submit`: Pushes current changes across the stack and automatically creates or updates the linked Pull Requests with correct base references.
  - `gh stack sync`: Pulls remote changes and executes cascading rebases across the dependent branches when lower layers are modified or merged.
  - `gh stack switch / navigate`: Moves cleanly between layers in the stack without breaking branch pointers.

### Graphite (`gt`)
Graphite is a prominent third-party CLI and dashboard specifically optimized for fast stacked diffs and branch synchronization.

- **Key Commands:**
  - `gt submit --stack`: Publishes all branches in the active stack as dependent GitHub PRs.
  - `gt sync`: Syncs local branches with the remote repository, automatically deleting merged branches and rebasing remaining dependent layers onto `main`.
  - `gt modify / gt restack`: Updates an intermediate commit/branch and propagates the rebase to all descendant branches.

### Other Notable Tooling
- **`git-town`**: High-level command-line tool that syncs feature branch networks and automates PR creation.
- **`git-stack` / `ghstack`**: Community-driven utilities to manage atomic branch stacking and patch series.

---

## 3. Technical Constraints & Pitfalls

1. **Avoid Manual Git Rebasing Across Stacks:** Standard git rebasing on an intermediate branch without updating descendant branches causes branch divergence and repeated "phantom" diffs. Automated sync commands (`gh stack sync`, `gt sync`) MUST be preferred.
2. **Diff Isolation (Base Reference Tracking):** When auditing a stacked branch, comparing it against `main` will incorrectly compound all changes from parent layers. Code analysis tools must inspect diffs **exclusively against the branch's direct parent (`baseRefName`)**.
3. **Cascading Merges:** When Layer 1 merges into `main`, GitHub or stacking CLIs automatically update Layer 2's base target to `main`. Automated bots and agents must recognize base re-targeting as a standard operational pattern rather than an erratic branch change.
4. **Atomic Cohesion:** Every layer in a stack must remain syntactically valid and compiles/tests successfully on its own. A stacked layer should never introduce broken code that relies on a future layer to fix.

---

## 4. Integration Assessment for Amiga-IA PR Skills & Agents

Integrating stacked PR principles into the `amiga-ia` agent ecosystem enhances code review precision and provides smart remediation for oversized features. Below is the technical roadmap for incorporating Git Stack knowledge into the existing suite:

### 1. `ami-pr-publisher` (Master Orchestrator Agent)
- **Oversized PR Remediation (Step 1):** Currently, when a PR introduces $>500$ lines, the agent halts and asks the user to split or optimize it. With stacked PR knowledge, the agent should proactively recommend and offer to execute a **Stacked PR feature decomposition** (using `gh stack` or Graphite `gt`), organizing the monolithic diff into ordered architectural layers (e.g., `schema` $\rightarrow$ `logic` $\rightarrow$ `ui`).
- **Stack-Aware Publishing (Step 6):** Instead of defaulting solely to `gh pr create`, the agent should check for active stacking CLIs (`gh stack` or `gt`). If detected, it should recommend or execute `gh stack submit` or `gt submit --stack` and automatically append stack hierarchy metadata to the generated PR description.

### 2. `ami-detect-pr-conflicts` (Pre-PR Conflict Skill)
- **Dependency vs. Conflict Differentiation:** Currently, the detector warns whenever open PRs overlap on the same files. In a stacked architecture, child branches inherit and often expand files from parent branches. The detector must check PR base targets (`gh pr view --json baseRefName,headRefName`). If PR $B$'s base is PR $A$'s head, overlapping files must be categorized as an **Expected Stack Dependency** rather than an unwanted parallel git conflict.

### 3. `ami-review-self-pr` & `ami-review-peer-pr` (Code Review Skills)
- **Dynamic Base Branch Diffing:** In `ami-review-self-pr`, analyzing local branch changes should avoid assuming comparisons against `main` or `master`. The skill should verify the specific parent branch to audit only the incremental delta introduced by the current layer.
- **Bottom-Up Review Strategy:** In peer reviews, if a PR is identified as part of a stack, the reviewer agent should advise the human user (or coordinate subagents) to review from the foundational base layer upwards to preserve architectural context.

---

## 5. References & Documentation
- [GitHub Official Blog: Native Support for Stacked Pull Requests](https://github.blog/)
- [Graphite Documentation: Stacking Workflow & Developer Guides](https://stacking.dev/)
- [GitHub CLI Extension Registry (`gh-stack`)](https://github.com/github/gh-stack)
