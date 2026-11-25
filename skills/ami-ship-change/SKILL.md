---
name: ami-ship-change
description: Main-session git and release-shipping orchestrator supporting commit-only, push, and pr modes. Plans structured Conventional Commits, coordinates parallel validation/review, adversarial verification, remote push, and Pull Request creation with numbered confirmation gates.
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, Agent
---
# Skill: Ship Change & Commit Orchestrator

You are the main-session orchestrator for staging and committing local changes (`commit-only` mode) or shipping changes end-to-end to remote branches and Pull Requests (`push` and `pr` modes). Running this workflow in the main session eliminates nested subagents while keeping read-only verification isolated.

**Core Invariants:**
- Never bypass Git hooks (`--no-verify`).
- Never run `git commit`, `git commit --amend`, `git rebase`, `git push`, or `gh pr create` without explicit user confirmation at each numbered gate.
- Never duplicate tests already executed and passed (exit code 0) by `ami-change-validator` unless files were modified afterward.

## Workflow

### 0. Mode Selection, Worktree Discovery & Repository Policy Gate
- **Determine Execution Mode:**
  1. **`commit-only` (Fast Local Commit Mode):** Selected when the user asks to plan, group, stage, or create local commits without pushing or opening a PR. **Fast-Path Rule:** In `commit-only` mode, skip Steps 1, 2, and 3 (do not spawn validation/review subagents unless requested) and proceed directly to **Step 4 (Commit Strategy, Security Vetting & Confirmation)**.
  2. **`push` (Standard Shipping Mode):** Selected when the user wants to validate, review, commit, and push changes to a remote branch. Executes Steps 1 through 5.
  3. **`pr` (Pull Request Mode):** Selected when the user wants to open or update a Pull Request. Executes Steps 1 through 6.
- **Inspect Worktree & Branch State:**
  - Run `git rev-parse --show-toplevel`, `git branch --show-current`, `git worktree list --porcelain`, and `git status --porcelain`.
  - If multiple linked worktrees exist, check whether pending uncommitted changes reside in another worktree (`git -C "<path>" status --short`) and confirm which worktree to target.
  - **Binary & Asset Recognition Rule:** Never assume `0 insertions, 0 deletions` means "no changes". Inspect all status flags (`M`, `??`, `A`, `D`) for binary assets (`.ico`, `.png`, `.icns`, fonts, media, datasets) as well as text files.
  - Determine the target base branch (e.g., `origin/main` or configured PR base) and commit/diff range (`git log '@{u}..HEAD'` or `git log -n 5 --oneline`).
- **Read-Only / No-Commit Repo Policy:** If repository rules forbid automated commits or pushes in the current workspace, run validation and review only, print the exact ready-to-paste `git` / `gh` commands, and stop.

### 1. Parallel Validation & Self-Review (Main-Session Fan-Out — `push` & `pr` Modes)
Launch these read-only subagents **in parallel** from the main session:
1. **`ami-change-validator`:** Run in `standard` mode (or `pr` mode if operating in `pr` mode).
2. **`ami-pr-reviewer`:** Run in **Self-Review / Findings-only mode** over the full change range (committed unpushed changes + working tree WIP), without requiring an existing PR.

Wait for both subagents to complete and consolidate their blockers, warnings, and findings.

### 2. Findings Review & Approved Fixes (Max 3 Rounds — `push` & `pr` Modes)
- Present all blockers and review findings to the user clearly, anchored to `file:line`.
- If there are no findings and all validation checks passed, proceed to Step 3.
- **CONFIRMATION 1 - Apply Fixes:** Ask the user if they want to apply fixes for the reported findings.
  - Only upon approval, apply the fixes in the working tree (in the main session, or via a platform-native write-capable worker if the fixes span >3 files or require heavy test iteration).
  - **Strict Boundary:** Never run `git commit` or `git push` during this remediation loop.
  - Re-verify modified files and affected checks. Repeat at most **3 rounds**; if blockers remain after 3 rounds, stop and escalate to the user.

### 3. Adversarial Verification Gate (`push` & `pr` Modes)
- On the final post-fix diff (skipping only if the diff is trivial documentation/formatting with zero logic changes), launch **`ami-adversarial-verifier`** from the main session, passing only the final diff and the stated requirement.
- If confirmed defects are returned, present them to the user and resolve them before proceeding.

### 4. Commit Strategy, Security Vetting & Confirmation (`commit-only`, `push`, and `pr` Modes)
If uncommitted changes (WIP and/or applied fixes) or unpushed local commits requiring consolidation exist:
1. **Security, Data Leak & Untracked File Vetting:**
   - Scan all untracked files (`??`) against common exclusion patterns: build directories (`dist/`, `build/`, `out/`), package/virtual environments (`node_modules/`, `.venv/`), temporary caches, logs, and sensitive environment files (`.env`, `.env.local`). If untracked build artifacts or private files are detected, **ABORT** staging, alert the user, and propose updating `.gitignore` first.
   - **UI Mockups & Scratch Asset Vetting:** If untracked mockups exist outside `docs/mockups/` (e.g., in `<scratch>/` or workspace root), ask the user whether to formalize them under `docs/mockups/<feature-slug>.html` as living visual specifications or delete them before committing.
   - Actively scan all diffs and uncommitted files to ensure no sensitive credentials (API keys, tokens, passwords, private keys, PII) or personal local machine paths are staged. If any leak is detected, abort immediately and refuse to commit.
2. **Structure & Group Changes (Logical Commit Strategy):**
   Analyze all modifications and group them into logical, distinct commits rather than a monolithic dump:
   - **Amend Strategy:** If uncommitted work consists of minor fixes or additions to the most recent **unpushed** commit, propose `git commit --amend`. **Authorship Invariant:** NEVER amend a commit authored by someone else (`git log -1 --format="%ae"` vs current user) or already pushed to a shared remote; use a new `fix:` commit instead.
   - **Fixup & Squash Strategy:** If fixes target an earlier **unpushed** local commit authored by the current user, propose `git commit --fixup <hash>` or squashing fragmented WIP commits into a clean logical unit.
   - **By Conventional Commit Type & Architectural Layer:** Separate features (`feat:`), fixes (`fix:`), refactors (`refactor:`), tests (`test:`), docs (`docs:`), and chores (`chore:`). Approved mockups in `docs/mockups/*.html` must be committed as `docs(mockups): add interactive UI mockup for <feature>`.
   - **By Distribution & Package Scope (Product vs. Internal/Docs):** Separate distributed product/package code (`feat:`, `fix:`) from repository-internal AI instructions (`.agents/`, `.claude/`, `.gemini/`), setup tooling, and standalone documentation (`docs:`).
3. **Draft Commit Messages:**
   - Write clear, concise commit messages in English using Conventional Commits prefixes, explaining *why* the change was made, not just *what* changed.
   - **Internal Planning Reference Prohibition:** Commit messages (and any comment or docstring in the diff) MUST NEVER reference internal execution phases, stages, steps, or design options (e.g., 'Phase 1', 'Stage 2', 'Etapa 3', 'Option A', 'Opción B', 'Step 2 of plan'). Describe changes strictly from an architectural, domain, and functional perspective.
4. **CONFIRMATION 2 - Execute Commit:**
   - Present the active worktree path, branch, security audit status, and exact commit plan (files + Conventional Commit messages + any amend/squash operation).
   - Execute `git add` / `git commit` only after explicit user approval, then show `git log -n 5 --oneline`.
   - **Stop Condition for `commit-only` Mode:** If running in `commit-only` mode, stop here after reporting the created commits.

### 5. Push Confirmation (`push` & `pr` Modes)
- Run `git fetch` and verify remote sync:
  - If an upstream tracking branch exists (`git rev-parse --abbrev-ref --symbolic-full-name '@{u}'`, non-zero exit means no upstream), verify `git merge-base --is-ancestor '@{u}' HEAD` so remote commits are not overwritten. If local is behind or diverged, advise `git pull --rebase` and halt.
  - If no upstream exists, prepare `git push -u origin <branch>`.
- **CONFIRMATION 3 - Execute Push:** Present the exact `git push` command and target remote branch. Execute only after explicit user approval.

### 6. Pull Request Creation (`pr` Mode)
- If the user requested a Pull Request (or `pr` mode was selected):
  - Review the `ami-change-validator` `pr` mode output: diff size/stack check (>500 lines warning), open PR conflicts, documentation sync status, and the polished PR description.
  - **CONFIRMATION 4 - Create PR:** Present the PR title, base branch, and full body description. Execute `gh pr create` (or `gh stack submit` / `gt submit --stack` for stacked PRs) from the main session only after explicit user approval.
- **Post-Push Cleanup:** If operating in a secondary linked worktree that is now clean and synced, offer `git worktree remove` as an optional cleanup step.

---
**Language Rule:** Although code, commits, and PR descriptions MUST be in English (unless the repo specifies otherwise), communicate with the user in their language.
