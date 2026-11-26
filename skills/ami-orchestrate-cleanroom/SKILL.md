---
name: ami-orchestrate-cleanroom
description: Orchestrate double-blind Cleanroom TDD for well-specified features and critical modules. Clarifies edge cases, freezes a formal interface contract, dispatches isolated builder and black-box tester subagents, and arbitrates failures.
allowed-tools: Bash, Read, Grep, Glob, Agent, Write, Edit
---

# Skill: Cleanroom TDD Orchestrator

You are the Master Orchestrator and Arbiter for Double-Blind (Cleanroom) Test-Driven Development. Eliminate confirmation bias in automated testing by isolating the implementer and black-box test author behind a formal behavioral and interface contract co-designed with the user.

## Workflow

### Step 0: Cleanroom Qualification Gate
- Qualify ONLY changes whose public interface, error paths, and observable behaviors can be specified completely before writing code.
- **Reject Exploratory Work Upfront:** If the request involves open-ended exploratory design, unsettled product direction, or broad architectural discovery, do NOT force Cleanroom TDD—route to `ami-plan-feature` (`skills/ami-plan-feature/SKILL.md`) first until specifications are concrete.

### Step 1: Interactive Contract Inception & Clarification Gate
- **HARD INTERACTION PRECONDITION:** Never freeze a contract or dispatch subagents while signatures, schemas, error types, or boundary behaviors remain ambiguous.
- **Context & ADR Ingestion:** Ingest `CLAUDE.md`, `AGENTS.md`, `docs/adr/`, `docs/external-references/`, and any active feature plan (`ami-tech-lead` / `ami-plan-feature`) without re-asking settled architectural decisions.
- **Gap Detection & Signature Improvements:** Formulate targeted questions on open parameter/return types, nullability, empty collections, timeouts, concurrency, and error contracts. Proactively suggest idiomatic signatures and explicit error models before formalizing.

### Step 2: Contract Freezing & Persistence (`CONFIRMATION 1`)
- **Persistence Location (Never Stage/Commit Automatically):** Write the contract to `docs/contracts/<feature-slug>.contract.md` ONLY when the repository already tracks or explicitly accepts `docs/contracts/`; otherwise write it to an uncommitted scratchpad/temporary path outside tracked source. Never `git add` or commit contract files unless explicitly requested by the user.
- **Required Contract Schema:**
  1. **Header:** `Status: DRAFT | FROZEN | AMENDED <n>` and target repository/module scope.
  2. **Public Interfaces & Signatures:** Exact file paths, symbol names, input/return types, and error types/codes with trigger conditions.
  3. **Behaviors (`B1`, `B2`, ...):** Numbered Given-When-Then clauses observable strictly through the public interface.
  4. **Boundary & Edge Matrix:** Empty/null inputs, zero/max/max+1 bounds, invalid types, mid-operation timeouts/partial failures, and ordering/idempotency rules mapped to `B-id`s.
  5. **Prohibited Details:** Private helpers, internal algorithms, internal data layouts, log text, and internal call counts that neither worker may dictate or assert.
  6. **Prose & Docstrings to Update:** Search commit history (`git log -S`, `git log -L`) and grep for docstrings, inline comments, or docs rendered false by the behavior change (especially reversed prior decisions), recording exact file/symbol, stale claim, required claim, and authoritative code symbol for the builder.
  7. **Amendments Log:** Table (`# | Trigger | User Resolution | Sections Updated`) tracking post-freeze updates.
- **CONFIRMATION 1 - Freeze Contract:** Present the contract path and its interface/behavior/edge summary to the user and **STOP until explicitly approved**. Once approved with zero open ambiguities, mark `Status: FROZEN`.

### Step 3: Repo-Native Discovery & Double-Blind Dispatch
- **Repo-Native Agent Precedence:** Scan the repository's `.claude/agents/` and `.agents/` directories first. If a repository-native implementation agent or test-authoring agent exists, prefer it over generic `ami-cleanroom-builder` / `ami-cleanroom-tester` profiles for that role (review-only or debug-only agents do not qualify).
- **Shared Checkout & Stateless Dispatch:** Launch the builder and tester in the active checkout—**NEVER pass `isolation: worktree`** (worktrees branch from the default branch rather than `HEAD` and split implementation from tests onto separate trees).
  1. **Implementer (`ami-cleanroom-builder` or repo-native equivalent):** Receives ONLY the frozen contract path, target production path/reference patterns, and notice that the confirmation gate is cleared. Forbidden from reading or editing test files.
  2. **Black-Box Tester (`ami-cleanroom-tester` or repo-native equivalent):** Receives ONLY the frozen contract path, test directory/runner conventions, and notice that the confirmation gate is cleared. Forbidden from reading working-tree production files (`git show HEAD:<path>` allowed only for pre-existing base signatures).
- **Stateless Retries & Antigravity Runtime Note:** Every retry/resend MUST be a fresh, self-contained prompt carrying the contract path, repo path, and specific routing detail—never assume subagent memory across calls. In Google Antigravity, if named subagents run read-only, dispatch via `define_subagent(..., EnableWriteTools=true)` (Pattern A) or `TypeName: "self"` with the isolated role prompt (Pattern B).

### Step 4: Merge Boundary Audit, B-id Coverage & Falsifier Neutralization
Before accepting test results, audit both workers' outputs:
1. **File-Boundary Audit:** Run `git status --short` (and `git diff --name-only`) to confirm the builder touched ONLY production/contracted prose files and the tester touched ONLY test/fixture files. Any boundary crossover is an immediate defect to revert and re-route.
2. **Blocking Ambiguities:** Treat any contract gap or blocking question reported by either worker as a **Contract Ambiguity** (Step 5) before running arbitration cycles.
3. **B-id Traceability & Falsifier Neutralization:** Verify every contracted `B-id` and edge row is cited and present in the test tree. Execute the native test runner (`npm test`, `pytest`, `cargo test`, `go test`, `dotnet test`). Once tests pass, **temporarily neutralize each new guard/behavior change** (or revert check in a temporary copy, restoring immediately afterward) to verify the corresponding test turns red; any test that stays green is a falsifier gap routed back to the tester with its `B-id`.

### Step 5: Arbitration & Reconciliation Loop (Max 3 Cycles)
Classify every test failure strictly against the frozen contract (never worker opinion):

| Class | Signal | Arbiter Action |
|---|---|---|
| **1. Implementation Defect** | Code violates an explicit `B-id` or edge row | Resend stateless prompt to builder with failing test name and `B-id` only |
| **2. Over-Constrained Test** | Test asserts a Prohibited Detail or uncontracted assumption | Resend stateless prompt to tester with failure log and exceeded `B-id`/section |
| **3. Contract Ambiguity** | Both readings fit the contract or an edge is unspecified | Clarify with user, append **Amendments** row, update contract, resend to **both** workers |
| **4. Pre-existing / Environment** | Collection/import error outside scope, flaky infra, or same failure at `HEAD` | Verify in a detached temporary `git worktree` at `HEAD` (remove immediately after); report directly and **do NOT count as one of the 3 cycles** |

After 3 arbitration cycles with unresolved defects, **STOP** and report remaining failures with their class and `B-id`s without patching code manually.

### Step 6: Synthesis & Macro Orchestrator Return
- Report the contract path, modified production and test files, verified `B-id` coverage (including falsifier neutralization), test results, and resolved arbitration items.
- **Macro Handoff:** When invoked under `ami-tech-lead`, `ami-plan-feature`, or followed by `ami-ship-change`, return verified completion and pass ONLY the contract's Interface, Behaviors, and Edge Matrix sections as the authoritative requirement for downstream adversarial verification (excluding Amendments chatter and worker notes).

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
