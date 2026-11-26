---
name: ami-review-self-pr
description: Reviews YOUR OWN Pull Requests, local branches, or uncommitted changes before publishing. Proactively finds semantic flaws, verifies test neutralization, and applies concrete fixes locally. For peer PRs, use ami-review-peer-pr.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: PR Self-Reviewer

When invoked, act as a stringent Senior Engineer reviewing the user's **own** work. Unlike peer reviews, your primary goal is to uncover semantic flaws and **fix them locally** before anyone else reviews the code.

- **Never bypass hooks:** Never run `git commit` or `git push` with `--no-verify`; fix the root cause.
- **Repo-provided reviewers:** If the target repository ships its own reviewer agent (e.g., under `.claude/agents/` or `.agents/`), run the review through it so repository-specific blocking gates are enforced.
- **Division of labor:** Delegate mechanical checks (formatting, lint, unused imports, static types) to automated validation tooling; focus manual audit attention on semantic integrity, contracts, concurrent state, and failure resilience.

## Workflow

1. **Context Identification, Authorship, Worktree & Dynamic Diffing:**
   - **Orchestrator Fast-Path:** When an orchestrator (`ami-ship-change`, `ami-pr-reviewer`) passes an explicit target (PR, branch, or `<base>..HEAD` + working tree) or invokes **Findings-only mode**, do **not** prompt the user for target or review mode. Ask for a target only when invoked standalone without one.
   - **CRITICAL AUTHORSHIP CHECK:** Compare `gh pr view <target> --json author` against `gh api user --jq .login` (never assume from branch names). Uncommitted or unpushed local work with no PR belongs to the user by definition. If the PR belongs to another developer, **IMMEDIATELY STOP**, explain the distinction, and offer to invoke **`ami-review-peer-pr`**.
   - **Scratch Worktree Isolation:** If the PR branch is not the active checkout, inspect and fix inside a scratch worktree (`git worktree prune`, then `git -c core.longpaths=true worktree add --detach <scratch-wt> origin/<branch>`; use a short path on Windows `MAX_PATH` limits). Never switch branches in the main clone, and always tear down the worktree (`git worktree remove` + `git worktree prune`, deleting directory junctions safely first) on completion or abort.
   - **Stack-Aware & Stale-Base Three-Way Diffing:**
     - Detect Stacked PR chains (`baseRefName` via `gh pr view` or `gh stack` / Graphite `gt`) and diff strictly against the direct parent (`baseRefName`) to avoid re-reviewing lower stack layers.
     - **Stale-Base Guard:** When `<base>` has advanced past the branch point (`git merge-base --is-ancestor <base> <head>` fails), two-tree `git diff <base> <head>` misreports base-only commits as deletions. Inspect `git merge-tree --write-tree --messages <base> <head>` (diffing `<base>:<file> <tree>:<file>` for auto-merged files, or using `git diff <base>...<head>`) so base-only changes are never misattributed as regressions.
   - **PR Body, Cross-References & Pre-Review Comments Gate:**
     - On an active PR, read `gh pr view <target> --json title,body,milestone,comments,reviews` and timeline cross-references (`gh api repos/{owner}/{repo}/issues/{n}/timeline --paginate`, no leading slash). Map `- [ ]` / `- [x]` promises against the diff to flag `[Requirement Gap]`. Author-declared exclusions/debt are not findings unless governed repo claims ("does not touch X") contradict touched files. Pass the PR body to any delegated subagent.
     - Read `README.md`, `CLAUDE.md` / `AGENTS.md`, `docs/adr/`, and `docs/architecture/`.
     - **Existing Comments Gate:** Skip on local branches with no PR. On an active PR with unresolved, non-outdated human reviewer comments or change requests, run **`ami-analyze-pr-comments`** first to resolve external feedback, then audit the updated diff.
   - **Review Mode Selection (Standalone Only):** Default to `Code Review Mode` (static semantic analysis + targeted guard neutralization) and mention that `Full Review Mode` (full test/build suite execution) is available on request.

2. **Strict Semantic Self-Audit & Active Test Neutralization:**
   - **Active Test Neutralization (Mandatory for New Guards/Branches):**
     - A test counts only if it fails when its guard is neutralized; coincidental fixtures (same-length IDs, permissive fakes) do not count.
     - For every new guard, branch, or rule: find test files referencing it (`git grep -l <symbol> -- tests`; zero matches means it survives automatically and is a finding). In an isolated scratch worktree (`git -c core.longpaths=true worktree add --detach <wt> HEAD`), physically neutralize the guard, run **only** those covering test files, restore/remove the worktree cleanly, and report every surviving guard whose tests stayed green. When PR CI is already green, do not re-run the full unchanged suite until new local fixes are applied.
   - **Committed Measurements:** Baselines or metric reports committed in the diff must be regenerable by committed tooling and isolate the PR's own effect.
   - **Path, External-Input & Seam Tracing:**
     - **All execution paths & input data-flow:** Trace error, fallback, retry, empty/zero-result, and early-return paths. Check where each input originates, whether it survives retries, and whether pre-existing guards only validated `results[0]` rather than newly selected candidates.
     - **Untrusted external responses:** Check fields read from external HTTP/queue/file payloads for missing, `null`, empty, `0`, negative, and `NaN` before overwriting owned state (silent primitive defaults do not make values valid).
     - **Producer-consumer seams & rolling compatibility:** Verify at least one test crosses real producer/consumer boundaries rather than asserting isolated mocks. Check dual-phase backward compatibility for schema, ORM, or payload renames/removals.
     - **Future callers:** Require explicit opt-in gating rather than silent payload-shape activation.
   - **Failure Resilience, State Safety & Debuggability:**
     - **Cleanup & atomicity:** Mid-loop or mid-execution exceptions must not leave partial state mutations without rollback (compute everything first, apply at the end).
     - **Idempotency & model-controlled input:** Retries must not duplicate side effects. Validate LLM/tool arguments against contract patterns before URL/path interpolation, cap payload sizes with existing constants, and never echo raw upstream error bodies to models.
     - **Silent defaults:** Every `catch` must log entity identifiers (no PII/secrets) or state why it suppresses; every fallback fabricating a default or disabling behavior must log or alert.
   - **Semantic Drift, Per-Environment Config Matrix & Over-Engineering:**
     - Check duplicated predicates, partial gate alignment (verify **every** condition of a gate AND trace read-visibility scope per role whenever write safety depends on reading state back), stale identifier names, clause-by-clause contract/docstring drift, sibling flows (delete orphaned helpers and their dead tests), and recent `origin/main` history on edited prompts/docs.
     - **Per-Environment Config Matrix:** Whenever `.env.*`, `values-*.yaml`, or per-environment manifests/secrets change, render a side-by-side `key x environment -> value` table across environments. Flag identical values that must differ per environment (IDs, URLs, hosts, buckets, tenants) unless explicitly intended, question keys missing in sibling environments, and state **where the running service actually reads that key** (runtime env, secret mount, or build-time file).
     - **Over-Engineering:** Delete single-implementation interfaces, unused config knobs, or helpers already covered by stdlib/installed packages (trust-boundary validation and security are never "extra").

3. **Adversarial Blind-Spot Probe (`[Blind-Spot Probe]`):**
   - **Trigger:** Run whenever Step 2 finds zero defects or only `[MINOR]`/`[NITPICK]` items.
   - Probe 5 dimensions: (1) **Concurrency & Async Timing** (races, unawaited tasks, missing cancellation, stale closures), (2) **Boundary Extremes & Zero/Null Invariants** (`[]`, `""`, `0`, negatives, `MAX_SAFE_INTEGER`, `?.` masking broken upstream state), (3) **Silent Failures & Partial State Corruption**, (4) **Resource & Memory Lifecycles** (handles, streams, timers, listeners, unbounded caches), and (5) **Malicious Payloads & Injection Surfaces** (`../`, prototype pollution, ReDoS).
   - Promote uncovered defects to Step 4, or record `[Blind-Spot Probe: Clean]`.

4. **Concrete Code Suggestions (KISS & DRY):**
   - Anchor every finding to an inspected `file:line` with its verification target (`<file:line@ref>`, `origin/<base>`, or `unverified` — settle `unverified` items before editing).
   - Provide exact, minimal code replacements (extracting repeated logic into shared `utils/` or `helpers/`) as a numbered list.

5. **Proactive Implementation & Capped Verification Loop (Max 3 Rounds):**
   - **Findings-only mode:** When invoked by an orchestrator (`ami-ship-change`, `ami-pr-reviewer`), **stop after Step 4** — return anchored findings with no edits, no prompts, and no suite execution.
   - Ask the user: `"Would you like me to apply these fixes directly to the files?"` On approval, apply exact fixes locally.
   - **Re-review & Dynamic Checks (Max 3 Rounds):** Applied fixes are new code — re-read modified files for naming drift, duplicated predicates, and error paths, and run repository checks/tests (in `Full Review Mode`, discover stack manifests and diagnose whether test failures stem from new logic or stale assertions before proposing fixes). Cap post-fix verification/remediation at **3 rounds**; if round 3 still fails, stop and report the failing check.
   - Standalone runs never commit or push directly; offer `ami-ship-change` (which skips redundant self-review on the validated `HEAD`) and tear down any scratch worktree.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
