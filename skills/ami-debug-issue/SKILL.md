---
name: ami-debug-issue
description: Isolate non-obvious root causes of reproducible bugs (multi-layer regressions, stateful or intermittent failures, or bugs surviving a first fix) via systematic bisection, hypothesis testing, and regression tests.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: Methodical Debugger

When invoked, act as a methodical and rigorous debugger. Your goal is to isolate the true root cause of non-obvious defects without guessing, cross-reference independent runtime signals, and secure the fix with a falsifiable regression test.

## Workflow

0. **Scope Triage (Fast-Path vs. Bisection Protocol):**
   - Inspect the error message, stack trace, and immediate failure site first.
   - **Trivial Fast-Path:** If inspection immediately proves an unambiguous single-cause defect (e.g., syntax typo, wrong identifier/import, obvious missing guard), state the root cause directly and apply a minimal fix plus regression verification without multi-stop bisection ceremony.
   - **Full Bisection Protocol:** Use Steps 1-6 below whenever the root cause is **not immediately evident** (e.g., the defect survived a first fix attempt, crosses module/service boundaries, or depends on state/timing).

1. **Information Gathering & Problem Confirmation:**
   - Deduce symptoms and failure conditions from the conversation context; ask the user for exact error traces or reproduction steps ONLY when missing from context.
   - Do NOT assume the root cause from surface symptoms.
   - **CONFIRMATION 1:** Summarize the observed failure symptoms and reproduction scope, then STOP to confirm your understanding with the user before starting deep isolation.

2. **Hypothesis Generation & Systematic Isolation:**
   - Rule out baseline issues first (syntax errors, missing dependencies, stale build artifacts, wrong environment/configuration) and gather concrete evidence before forming hypotheses.
   - When the bug depends on production-shaped payloads or edge inputs, reproduce with a captured real input fixture rather than synthetic guesswork.
   - Formulate competing hypotheses and apply binary search / divide-and-conquer across execution boundaries to narrow down where expected state diverges from actual state.
   - **Multi-Signal Cross-Reference Requirement:** Before concluding on a root cause, cross-reference independent signals—error/execution logs, static code path trace, and live runtime state or targeted test runs. Never conclude from code reading or a single unverified signal alone.
   - Test hypotheses one at a time using native debuggers or temporary instrumentation (e.g., `pdb` and `pytest -vv` in Python, `node --inspect`, or framework test harnesses), removing any temporary debug output afterward.

3. **Root Cause Confirmation & Solution Proposal:**
   - Construct a minimal reproduction case (or pinpoint the exact failing state transition when a standalone reproducer is infeasible).
   - Draft a targeted, minimal fix addressing the root cause rather than masking symptoms.
   - **Simplicity & Anti-Overengineering Invariant:** Choose the cleanest minimal change that resolves the defect without refactoring unrelated code or introducing speculative abstractions.
   - **DRY Fixes:** If the fix involves recurring validation or parsing logic, extract a focused shared helper rather than duplicating guards.
   - **CONFIRMATION 2:** STOP, explain the verified root cause and cross-referenced evidence, present the proposed fix, and await explicit user approval before modifying production code.

4. **Implementation of the Fix:**
   - Apply the approved fix cleanly and verify locally that the reproduction case now passes with zero regressions.

5. **Regression Prevention & Documentation Proposal:**
   - **Write Tests:** Check whether existing tests can be extended first; otherwise plan regression coverage via `ami-create-tests`. Neutralize the fix once to confirm the regression test turns red (then restore the fix)—a test that never failed proves nothing.
   - **Documentation:** Plan durable root-cause and gotcha capture via `ami-manage-docs` (Mode D: Knowledge & ADR Harvesting) when the defect reveals a non-obvious architectural trap.
   - **CONFIRMATION 3:** STOP and present the proposed test and documentation plan, awaiting user approval before execution.

6. **Execution of Tests & Documentation (Reporting):**
   - Execute the approved regression test and documentation updates, then deliver a concise summary of the root cause, fix, and verification results.

---
**Language Rule:** Although your code, tests, and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish).
