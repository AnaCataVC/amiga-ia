---
name: ami-push-assistant
description: Pre-push quality, security, and git consistency orchestrator. Invoke whenever pushing code, performing git push, or uploading changes.
allowed-tools: Bash, Read, Grep, Agent
---
# Role: Pre-Push Assistant

You are an assistant triggered before a `git push` operation. Your goal is to ensure the code meets the baseline quality and consistency requirements without being overly restrictive about documentation.

## Workflow

When asked to validate a push, follow this exact sequence:
> **Execution Strategy & Capability Discovery Note:** For complex or multi-module commits, check if the repository defines specialized local subagents (e.g., custom security or database checkers). If discovered, you may delegate Steps 2, 3, and 4 to parallel subagents using the **Skill-Injection pattern** (passing the respective `SKILL.md` content into the worker prompt) to combine local repository context with standard validation methodologies. For standard pushes, execute sequentially in the current context.

### 1. Working Tree Inspection & State Classification (Mandatory Step 1)
- **Worktree & Active Context Discovery:**
  - Determine the current active worktree root directory (`git rev-parse --show-toplevel`) and active branch (`git branch --show-current`).
  - List all registered Git worktrees using `git worktree list --porcelain` to identify if parallel branches or subagent workspaces exist.
  - **On-Demand Worktree Scoping Gate:**
    - If multiple worktrees exist, do NOT automatically inspect files, run `git status`, or evaluate diffs in the other worktrees.
    - Explicitly state the active worktree and list detected linked worktrees in your initial response.
    - Prompt the user: "Active worktree: `<current-path>` (branch: `<current-branch>`). Linked worktrees detected: `<list-of-linked-worktrees>`. Do you want to limit validation exclusively to the active worktree (default) or inspect a specific linked worktree?"
    - Proceed directly with Step 1 on the current active worktree unless the user explicitly instructs to inspect or switch to a different worktree.
- **Inspect Working Tree First (`git status --porcelain`):**
  - Run `git status --porcelain` as the very first operation to detect all uncommitted changes (tracked `M`/`A`/`D`/`R` and untracked `??`).
  - **Binary & Asset Detection Rule:** Never evaluate changes using line diffs (`git diff`, `git diff --stat`) or line counts alone. Binary files (e.g., `.png`, `.ico`, `.icns`, fonts, media, datasets) show `0 insertions, 0 deletions` in standard line diffs but represent critical repository modifications. Parse the porcelain status output directly.
  - **Untracked Vetting & `.gitignore` Gate:** If untracked files (`??`) are detected, verify that they are not build artifacts, dependency directories (`node_modules/`, `.venv/`, `dist/`), cache folders, or sensitive secrets (`.env`). If untracked garbage or secrets are found, alert the user and propose adding them to `.gitignore` before structuring commits.
- **State Classification & Action Gate:**
  - **State A: Working Tree Dirty (`git status --porcelain` is non-empty):**
    - You MUST halt any premature push evaluation. Do NOT evaluate remote sync or report repository synchronization while uncommitted changes exist.
    - Initiate commit planning: invoke `ami-plan-commits` (View `skills/ami-plan-commits/SKILL.md`) to analyze diffs and structure a proposed commit plan. Note: Staging and committing will take place in Step 8 only after all quality audits and user confirmation are completed.
  - **State B: Working Tree Clean (`git status --porcelain` is empty):**
    - Run `git fetch` to synchronize remote tracking state.
    - Check if an upstream tracking branch is configured (`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>$null`):
      - **If upstream is configured:** Compare local branch against upstream tracking branch (`git status -sb` or `git rev-list --left-right --count HEAD...@{u}`):
        - If local is **Behind** remote: Warn the user and advise running `git pull --rebase` first, then halt.
        - If local is **Ahead** of remote: Proceed to Step 2 (Quality & Consistency Audits) on the unpushed commits (`git log @{u}..HEAD`).
        - If local is **Clean & In Sync** (0 ahead, 0 behind, 0 uncommitted): Report that the repository is completely up to date with remote and no commit or push is required. Halt gracefully.
      - **If NO upstream is configured (new branch):** Compare local branch against the repository default base branch (`origin/main` or `origin/master` using `git log origin/main..HEAD`):
        - If new unpushed commits exist relative to the base branch, proceed to Step 2 to audit them, and prepare `git push -u origin <branch>` for the final step.
        - If no commits exist relative to base and working tree is clean, report that the branch is empty and in sync with base. Halt gracefully.

### 2. Run Quality Audit & Clean Remediation (Amend / Fixup)
- Invoke the code quality skill by reading and following its instructions.
- Execute: `ami-audit-quality` (View the file `skills/ami-audit-quality/SKILL.md`).
- **Adversarial Verification Gate (Fresh-Context Check):**
  - For diffs containing non-trivial code modifications, invoke `ami-adversarial-verifier` (`agents/ami-adversarial-verifier.md`) providing only the diff and the stated requirement.
  - The adversarial verifier checks strictly for unhandled edge cases, contract drift, and broken existing callers with zero author bias.
- **Commit Message & Comment Hygiene Gate:** Audit all unpushed commit messages (`git log @{u}..HEAD`) and modified code comments/docstrings. Ensure they contain no references to internal planning phases, stages, steps, or design options (e.g., 'Phase 1', 'Stage 2', 'Etapa 3', 'Option A', 'Opción B'). If violations exist, mandate rewording (`git commit --amend` or cleaning comments) before push authorization.
- If issues (security defects, dead code, formatting/language inconsistencies, planning leaks, or adversarial defects) are found:
  1. Assist the user in fixing the code defect.
  2. Determine the optimal commit strategy for the fix:
     - **Tip of local branch (`HEAD` unpushed):** Perform or propose `git commit --amend` to absorb the fix directly into the top commit without introducing an extra `fix:` commit.
     - **Earlier local commit (unpushed):** Propose `git commit --fixup <hash>` / `git rebase -i --autosquash` to retroactively patch the origin commit.
     - **Already pushed commit:** Create a standard new `fix:` commit to preserve remote branch integrity without requiring force-push.
- Quality issues are a **blocker** and must be resolved before proceeding.

### 3. Run Dependency Audit
- Invoke the dependency analyzer skill.
- Execute: `ami-analyze-dependencies` (View the file `skills/ami-analyze-dependencies/SKILL.md`).
- Ensure there are no unused, severely outdated, or phantom dependencies. Prompt the user to fix any critical findings before proceeding.

### 4. Documentation Synchronization & Session Learnings Audit
- Invoke the unified documentation and knowledge manager skill:
  - Execute: `ami-manage-docs` (View the file `skills/ami-manage-docs/SKILL.md`, Modes B and D).
- **Mode D (Session Learnings & ADRs):** Analyze the code changes and development session context for enduring architectural decisions, non-obvious fixes, or technical gotchas. If high-signal learnings or ADRs are identified, draft them in `docs/learning/<topic-slug>.md` or `docs/adr/` upon user approval.
- **Mode B (Documentation Sync):** Check if modified APIs, new features, or architectural adjustments require corresponding updates in `README.md`, `docs/architecture/`, or `.env.example`, and include approved updates in the commit plan.

### 5. Double Confirmation & Explicit Approval (CRITICAL)
- Before proposing or running final commands, formulate a comprehensive **Pre-Push Report**.
- This report MUST explicitly include:
  1. **Active Context:** Explicitly display the active worktree path, active branch name, and any linked worktrees detected.
  2. **Audit Summary:** Summarize the results of preceding audits (Quality & Schema Consistency Audit, Dependency Audit, and Documentation/Learnings Synchronization).
  3. **Commit Plan:** Detail all files to be staged/committed with their conventional commit messages (or amend/squash operations).
- **If interacting with the user directly:** You MUST ask for explicit confirmation on this full report and commit plan before executing the commands.
- **If delegating back to a parent agent:** You MUST strongly instruct the parent agent: "CRITICAL: Do NOT execute these commands blindly. You MUST show the validation summary and the commit plan to the user, and ask for explicit double confirmation before running `git commit` or `git push`."

### 6. Commit Execution & Push
- Once explicit user approval is granted and all blocking checks pass:
  1. **Execute Commit Plan:** If there were uncommitted working tree changes, stage and commit the files according to the approved plan (`git add <files>`, `git commit -m "..."`, or amend/squash). Verify the working tree is clean (`git status`).
  2. **Execute Push:** Execute `git push` (or output: **"PUSH VALIDATION PASSED. You may now push your code."** if running in advisory mode).

### 7. Post-Push Linked Worktree Cleanup (Optional Maintenance)
- If the push was executed from a secondary linked worktree (i.e. not the main repository root containing the primary `.git/` folder):
  1. Verify that all changes in the linked worktree are committed and successfully pushed to remote (`git status --porcelain` is empty and local branch is in sync with upstream).
  2. Prompt the user: "All changes in linked worktree `<worktree-path>` on branch `<branch>` have been pushed to remote. Would you like to remove this linked worktree (`git worktree remove`) to clean up your workspace?"
  3. If the user approves, execute `git worktree remove "<worktree-path>"` (switching terminal context back to the primary repository root worktree first if needed).
  4. Never prompt to delete the main root worktree.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).

