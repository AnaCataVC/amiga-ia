# Declarative Security and Operational Rules for Antigravity (AGY)

This rule file provides declarative operational guardrails for Antigravity agents, establishing platform parity with Claude Code bash hooks.

---

## 1. Commit Hygiene & Formatting
- Always follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).
- Keep commit messages concise, descriptive, and exhaustive if grouping multiple logical changes.
- NEVER reference internal planning phases, stages, steps, or design options (e.g., 'Phase 1', 'Stage 2', 'Etapa 3', 'Option A', 'Opción B') in commit messages. Describe the functional capability or architectural change from an external domain perspective.
- Never commit broken code or untested JSX/TSX syntax.

## 2. Pre-Push Verification
- Run code quality checks, linter, and tests before executing `git push`.
- Run the `ami-push-assistant` agent or `ami-audit-quality` skill before pushing modifications to remote branches.

## 3. Pull Request Safety
- Run `ami-detect-pr-conflicts` before proposing or creating any Pull Request.
- Ensure branch is rebased cleanly with the primary target branch.

## 4. Code Quality, Anti-Overengineering & Clean Architecture
- **KISS & Pragmatic Simplicity (Anti-Overengineering Invariant):**
  - Always implement the simplest possible solution that solves the problem cleanly and professionally.
  - Strictly avoid premature abstractions, speculative extensibility, unnecessary factory layers, or bloated boilerplate for simple logic (YAGNI). Keep solutions lean, direct, and readable.
- **DRY & Utility Centralization:**
  - Never duplicate business logic, parsing, validation, or transformation routines across multiple files or methods.
  - Consistently extract shared functionality into project-idiomatic utility modules (e.g., `utils/`, `helpers/`) to keep the codebase maintainable and modular.
- Remove temporary debug statements (`console.log`, `debugger`, print logs) and unresolved `TODO` / `FIXME` comments before finalizing changes.
- Ensure all docstrings and code comments describe permanent system behavior, contracts, and domain rationale. NEVER include references to internal planning phases, execution stages, or decision options ('Phase 1', 'Stage 2', 'Etapa 3', 'Option A', 'Opción B') in code comments or docstrings. Internal planning details do not need to be exposed in the repository, only not referenced.

## 5. Documentation Standards & Zero Flags Policy
- Under no circumstances should country flag emojis or flag graphics be used to indicate languages in repository documentation (`README.md`, `docs/`, `wiki/`), release notes, or user interface components. Always use clean semantic text (`[English](#english) | [Español](#español)`) or ISO codes (`EN`, `ES`).
- **Path Privacy:** Never leak absolute local machine paths (`C:\Users\...` or `/home/...`) in documentation, code, or examples. Use relative paths or generic placeholders.
- **Atemporal Quality Gates (Zero Static Test Counts):** Never hardcode static numerical test counts (e.g., "suite of 57 tests", "run the 12 tests") in skills, documentation, runbooks, or verification steps. Always formulate test execution and verification dynamically (e.g., "verify that the full automated test suite passes with 100% success / zero regressions").
- **Gender Neutrality & Inclusive Phrasing:** In Spanish-language documentation, UI copy, and communications, use neutral phrasing (e.g., "te damos la bienvenida", "todo listo") and avoid gendered assumptions.

## 6. GitHub Actions CI/CD Run Verification
- Whenever an operation triggers a remote automated workflow (e.g. `git push`, `gh pr create`, `gh release create`):
- Inspect active workflow runs (`gh run list --limit 3`) and monitor execution until completion (`gh run watch <run-id>`).
- Verify that the workflow completed with `conclusion: success`.
- If a workflow run fails, inspect the failure logs (`gh run view <run-id> --log-failed`), diagnose the root cause, and report it to the user. Never declare an operation complete if its downstream CI/CD workflow failed.
 
## 7. Proactive Parallelization & Anti-Bottleneck Invariant
- **Main Thread Monopoly Prohibition:** NEVER execute intensive low-level explorations (such as binary inspection, massive log tracing, or heuristic trial-and-error probes) sequentially and blocking in the primary interaction session when collateral verifications are pending (e.g., test suites like `npm test`, validation across sibling environments like Claude Code or Codex, or staging alternative fix hypotheses).
- **Immediate Diagnostic Bifurcation:** The exact moment a problem requires deep technical investigation or reverse engineering:
  1. The agent MUST immediately dispatch a background investigation/diagnostic subagent (`self` or `research`) to perform low-level probes asynchronously.
  2. The agent MUST simultaneously dispatch required subagents for decoupled tasks (compatibility audits, linters, or regression tests).
  3. The primary thread MUST remain unblocked, responsive, and dedicated to synthesis, architectural decision-making, and user interaction.
