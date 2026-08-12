# Declarative Security and Operational Rules for Antigravity (AGY)

This rule file provides declarative operational guardrails for Antigravity agents, establishing platform parity with Claude Code bash hooks.

---

## 1. Commit Hygiene & Formatting
- Always follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).
- Keep commit messages concise, descriptive, and exhaustive if grouping multiple logical changes.
- Never commit broken code or untested JSX/TSX syntax.

## 2. Pre-Push Verification
- Run code quality checks, linter, and tests before executing `git push`.
- Run the `ami-push-assistant` agent or `ami-audit-quality` skill before pushing modifications to remote branches.

## 3. Pull Request Safety
- Run `ami-detect-pr-conflicts` before proposing or creating any Pull Request.
- Ensure branch is rebased cleanly with the primary target branch.

## 4. Code Quality & Debug Leak Prevention
- Remove temporary debug statements (`console.log`, `debugger`, print logs) and unresolved `TODO` / `FIXME` comments before finalizing changes.
