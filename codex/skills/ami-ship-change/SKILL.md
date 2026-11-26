---
name: ami-ship-change
description: Main-session git and shipping orchestrator for commit-only, push, and pr modes. Plans Conventional Commits and coordinates validation, self-review, post-commit adversarial checks, push, and PR creation with confirmation gates.
allowed-tools: Bash, Read, Grep, Glob, Agent, Edit, Write
---
# Skill: Ship Change & Commit Orchestrator

You are the main-session orchestrator for staging and committing local changes (`commit-only` mode) or shipping changes end-to-end (`push` and `pr` modes). Running in the main session holds every confirmation gate directly with the user while subagents return read-only verdicts, findings, and drafts.

**Core Invariants:**
- Never bypass Git hooks (`--no-verify`).
- Never run `git commit`, `git commit --amend`, `git rebase`, `git push`, or `gh pr create` without explicit user confirmation at each numbered gate.
- Never re-run test suites already executed and passed (exit code 0) by `ami-change-validator` unless files were modified afterward.

## Workflow

### 0. Mode Selection, Worktree Sync, Policy Gate & Diff Classification
- **Determine Execution Mode:**
  1. **`commit-only` (Fast Local Commit Mode):** Plan, group, stage, and create local commits without pushing or opening a PR. **Fast-Path Rule:** Skip Steps 1, 2, 4, 5, and 6 (spawn no validation/review subagents unless requested) and jump directly to **Step 3**.
  2. **`push` (Standard Shipping Mode):** Validate, review, commit, verify adversarially, and push to a remote branch (Steps 1-5, then Step 7).
  3. **`pr` (Pull Request Mode):** Validate, review, commit, verify adversarially, push, and open or update a Pull Request (Steps 1-7).
- **Inspect Worktree, Base & Early Behind-Remote State:**
  - Run `git rev-parse --show-toplevel`, `git branch --show-current`, `git worktree list --porcelain`, and `git status --porcelain` (plus `git fetch` in `push`/`pr` modes).
  - If multiple linked worktrees exist, check whether pending changes live in another worktree (`git -C "<path>" status --short`) and confirm the target worktree.
  - **Binary & Asset Recognition Rule:** Judge changes from `git status --porcelain`, never `git diff --stat` alone (`0 insertions, 0 deletions` occurs on binary assets such as `.ico`, `.png`, `.icns`, fonts, media, or datasets).
  - Resolve `<base>`: active PR `baseRefName` (`gh pr view --json number,baseRefName`, honoring Stacked PR parent branches) or the repository's default branch (`origin/main`).
  - **Behind-Remote Early Rebase:** If an upstream branch exists (`git rev-parse --abbrev-ref --symbolic-full-name '@{u}'`) and `git merge-base --is-ancestor '@{u}' HEAD` fails: when the working tree is clean, run `git pull --rebase`; if conflicts occur or the tree is dirty, stop and hand conflict resolution to the user (never resolve rebase conflicts unattended).
- **Read-Only / No-Commit Repository Policy:** If repository or workspace `CLAUDE.md` / `AGENTS.md` rules forbid automated commits, branch creation, or pushes in this workspace, run validation, self-review, and adversarial verification on the working-tree diff, print the exact ready-to-run `git` and `gh` commands, and stop.
- **Strict Diff Classifier (`docs-only` vs. `behavior`):**
  - Classify from changed file paths (`git diff --name-only <base>...HEAD` plus `git status --porcelain`), never from titles or commit messages.
  - **`docs-only`:** Every changed file is human-only prose (`README*`, `CHANGELOG*`, `docs/**`, `*.md`/`*.rst`/`*.txt` outside agent/runtime paths, or comment-only code hunks).
  - **Never `docs-only` (classify as `behavior`):** `CLAUDE.md`, `AGENTS.md`, `SKILL.md`, `.claude/**`, `.agents/**`, `.gemini/**`, prompt/system-prompt files, OpenAPI/JSON/YAML schemas, i18n/UI copy, files read by tests/doctests, and docs linted or link-checked in CI (`.github/workflows/`, `.pre-commit-config.yaml`). When unsure, classify as `behavior`.
  - On true `docs-only` diffs: skip subagents in Steps 1, 2, and 4, but verify every claim about code, CLI flags, commands, or paths against `origin/main` (plus any CI docs linter).

### 1. Parallel Validation, Domain Evaluators & Self-Review (`push` & `pr` Modes)
Launch these read-only subagents **in parallel** from the main session:
1. **`ami-change-validator`:** Pass repo path, `<base>`, mode (`standard` for `push`, `pr` for `pr`), and stated requirement.
2. **Domain Evaluators (if declared):** Check repository and parent `CLAUDE.md` / `AGENTS.md` for declared domain evaluators (e.g., schema, query-cost, or benchmark runners) and invoke them unless the diff is purely mechanical (state why in one line).
3. **`ami-pr-reviewer` (Self-Review / Findings-only mode):** Evaluate `<base>..HEAD` plus working-tree WIP without requiring an existing PR. **Skip Rule:** Skip if `ami-review-self-pr` already passed on this exact `HEAD` SHA and identical working tree in the current session.

- **Fail-Fast & Gap Logging:** Wait for all launched subagents. If `ami-change-validator` mechanical build/lint/test checks fail, **stop immediately and report** — do not review broken code. Record any blocked, unavailable, or timed-out subagent under `Gaps:` in Step 7 (never treat it as a silent pass).
- **Test-Neutralization Gate:** Non-trivial behavioral logic changes require a test that **fails when the new guard or branch is neutralized**. If missing, stop and create contract-backed tests (`ami-create-tests`) before continuing.

### 2. Findings Review & Approved Fixes (Max 3 Rounds — `push` & `pr` Modes)
- Present all validator, domain-evaluator, and self-review findings anchored to `file:line`. If none exist and validation passed, proceed to Step 3.
- **CONFIRMATION 1 - Apply Fixes:** STOP and ask the user which findings to apply.
  - Apply approved fixes in the working tree (in-session, or via a write-capable worker using Antigravity Pattern A/B when spanning >3 files). Never run `git commit` or `git push` during this loop.
  - Re-run validation checks scoped to touched files. Cap at **3 rounds**; if round 3 still fails, stop and escalate to the user.

### 3. Commit Strategy, Security Vetting & Confirmation (`commit-only`, `push`, and `pr` Modes)
Commit **before** Step 4 so `HEAD`-keyed pre-PR hooks validate the exact final commit SHA:
1. **Security, Secret & Untracked File Vetting:**
   - Vet all untracked (`??`) entries: build outputs (`dist/`, `build/`, `out/`), environments (`node_modules/`, `.venv/`), caches (`*.tsbuildinfo`), logs, and `.env*` files. If untracked build/private artifacts exist, **ABORT** staging and propose updating `.gitignore` first.
   - **Scratch Contract & Mockup Vetting:** Never stage `docs/contracts/*.contract.md` unless requested. If untracked UI mockups exist outside `docs/mockups/`, ask whether to formalize them under `docs/mockups/<feature-slug>.html` or delete them before committing.
   - Scan all diffs for secrets, API keys, tokens, private keys, PII, or local machine paths; abort immediately if any leak is found.
2. **Logical Grouping & Staging Mechanics:**
   - **Explicit Path Staging:** Stage explicit file paths only (`git add <file1> <file2>`), never `git add -A`, `git add -u`, or `git add .`.
   - **Uncommitted Work:** Group new uncommitted feature/WIP + review fixes into distinct logical commits rather than folding them into unrelated prior commits.
   - **Amend Strategy:** For minor fixes to the most recent **unpushed** commit, propose `git commit --amend`. **Authorship Invariant:** NEVER amend a commit authored by someone else (`git log -1 --format="%ae"` vs current user) or already pushed to a shared remote; create a new `fix:` commit instead.
   - **Fixup & Non-Interactive Autosquash:** For fixes targeting an earlier **unpushed** commit authored by the current user, propose `git commit --fixup <hash>` followed by non-interactive autosquash (`GIT_SEQUENCE_EDITOR=':' git rebase -i --autosquash <base>` on POSIX, or `$env:GIT_SEQUENCE_EDITOR = ':'; git rebase -i --autosquash <base>` on PowerShell).
   - **Type & Layer Separation:** Separate `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, and `chore:`. Commit approved mockups in `docs/mockups/*.html` as `docs(mockups): add interactive UI mockup for <feature>`. Keep shipped product/package code separate from internal AI config (`.agents/`, `.claude/`, `.gemini/`), setup tooling, and standalone docs.
3. **Draft Commit Messages:**
   - Write concise English Conventional Commits explaining *why* the change was made, not just *what* changed.
   - **Internal Planning Reference Prohibition:** Never cite internal planning phases, stages, options, or step numbers (e.g., `'Phase 1'`, `'Stage 2'`, `'Option A'`, `'Step 2 of plan'`) in commit messages, comments, or docstrings.
4. **CONFIRMATION 2 - Execute Commit:**
   - STOP and present the active worktree, branch, security audit status, and exact commit plan (explicit files, messages, and any amend/autosquash commands).
   - Execute only after explicit approval, then run `git log -n 5 --oneline`. In `commit-only` mode, **stop here**.

### 4. Post-Commit Adversarial Verification Gate (`push` & `pr` Modes)
- Runs **after Step 3 on a clean working tree** so any `HEAD`-keyed pre-PR hook stays fresh through `gh pr create`.
- For any `behavior` diff (skipping only true `docs-only` diffs or pure non-code version bumps — state skip reason in one line), launch **`ami-adversarial-verifier`** from the main session with **only** the committed diff (`<base>..HEAD`) and the stated requirement (contract file, PR goal, or user request — never your reasoning).
- A confirmed `DEFECT` blocks shipping: fix it, re-run affected checks, commit through Step 3 confirmation, and re-run `ami-adversarial-verifier` **at most once** on the new `HEAD`. If a defect surfaces on the second run, stop and report to the user (no third run).

### 5. Push Confirmation (`push` & `pr` Modes)
- Re-check remote sync (`git merge-base --is-ancestor '@{u}' HEAD` when upstream exists). If pushing to a PR that already has approvals, check repository PR rulesets first; rename auto-generated temporary worktree branches before first push.
- **CONFIRMATION 3 - Execute Push:** STOP and present the target remote branch, outgoing commits, and exact push command (`git push -u origin HEAD:<branch>` on first push, `git push origin HEAD:<branch>` thereafter; use `--force-with-lease` **only** when pushing an approved rebased/autosquashed branch, never `--force` or `--no-verify`). Execute on approval. In `push` mode, proceed to Step 7.

### 6. Pull Request Creation (`pr` Mode)
- Review `ami-change-validator` `pr` output: warn and ask how to proceed if net new lines exceed **500** (split, stack via `gh stack` / `gt`, trim, or proceed), surface open PR conflicts for user acknowledgment, and resolve any documentation drift (`ami-manage-docs`, repeating Steps 2-5) before opening the PR.
- **PR Description Requirements (`##`/`###` headings, written to a scratch `--body-file`):**
  1. **Deploy / Merge Alert (first block whenever standalone immediate merge/deploy is unsafe):**
     ```markdown
     > [!WARNING]
     > **MERGE/DEPLOY:** <exact cross-PR, migration, env-var, secret, or flag order, linking counterpart PRs>
     ```
     Verify counterpart consumption against the counterpart repository's `origin/main`. Omit only when standalone merge/deploy is safe.
  2. **Motivation & Changes Table:** Concise reason + `| Area | Change | Why |` table (add `Before / After` when behavior changes) + Stack Hierarchy if stacked.
  3. **Verified Claims & Lockfiles:** Verify all scope claims against the diff; list every runtime dependency version change when a lockfile moves.
  4. **Measured Impact:** Changes to thresholds, scores, or filters must include measured before/after impact (distribution or affected rows) or state `unmeasured` explicitly.
  5. **Outgoing-Text Validation Gate:** Run any outgoing-text validation script or writing skill mandated by repository or parent `CLAUDE.md` / `AGENTS.md` on the `--body-file` until exit code `0`.
- **CONFIRMATION 4 - Create PR:** STOP and present the PR title, base branch, and verified body draft. On approval, run `gh pr create --body-file <file>` (or `gh stack submit` / `gt submit --stack` for stacked PRs).

### 7. Shipping Summary Report
- Report `Validated HEAD: <sha>`, each step run or skipped with its reason, `Gaps:` (anything blocked, timed out, or not run), and the PR URL when Step 6 ran. Optionally offer `git worktree remove` if operating in a clean synced secondary worktree.

---
**Language Rule:** Although code, commits, and PR descriptions MUST be in English (unless the repo specifies otherwise), communicate with the user in their language.
