# 12. Double-Blind (Cleanroom) TDD Multi-Agent Orchestration

Date: 2026-09-29

## Status

Accepted

## Context

In AI-assisted software development, automated test generation suffers from a critical systemic vulnerability: **confirmation bias**.

When an LLM generates tests after inspecting the source code (or when the same model authors both the implementation and the tests in a single context window), it tends to validate *how the code is written* rather than *what the specification requires*. If the implementation contains logical flaws, missing boundary checks, or incorrect default returns, the test suite frequently encodes those defects as expected behaviors (e.g., asserting `expect(result).toBe(0)` when a domain error should have been raised).

Historically, software engineering resolved this dilemma through **Cleanroom Software Engineering** (Harlan Mills, IBM) and **Clean Room Reverse Engineering** (Phoenix Technologies, 1984):
1. **Information Isolation:** A "Chinese wall" isolates engineers writing the implementation from those testing or specifying it.
2. **Contract-First Verification:** Testing is strictly black-box, constructed exclusively against formal specifications, public interfaces, and acceptance criteria.

We require a standardized, multi-agent architecture in `amiga-ia` that prevents confirmation bias by coordinating an Implementer Agent and a Test Generator Agent through an isolated contract boundary and an automated arbitration loop.

## Decision

We introduce a first-class Cleanroom TDD orchestration framework within `amiga-ia`, comprising three decoupled components:

1. **`ami-orchestrate-cleanroom` (Orchestration Skill):**
   - Freezes an explicit, formal contract under `docs/contracts/<feature-slug>.contract.md` containing public types, signatures, Given-When-Then scenarios, invariants, and edge cases (with zero private implementation details).
   - Dispatches worker subagents under cleanroom isolation boundaries.
   - Executes the project's native test harness (`npm test`, `pytest`, `cargo test`, etc.).
   - Acts as an impartial Arbiter when tests fail, categorizing root causes as Implementation Defects, Over-Constrained Tests, or Contract Ambiguities.

2. **`ami-cleanroom-builder` (Implementer Agent):**
   - Responsible strictly for authoring production source code (`src/`, `lib/`).
   - Bound to the contract specification; prohibited from reading test suites or overfitting implementations to test assertions.

3. **`ami-cleanroom-tester` (Black-Box Test Architect Agent):**
   - Responsible for generating comprehensive test suites (`tests/`, `spec/`).
   - Operates in strict cleanroom isolation: forbidden from reading or inspecting production implementation files.
   - Formulates boundary, happy-path, negative, and idempotency tests based solely on the formal contract.

### The Arbitration Protocol

When tests fail during the convergence harness:
- **Case 1 (Code Defect):** Production code breaks a clear clause of the contract. The Arbiter dispatches `ami-cleanroom-builder` with the failed contract section to fix the code.
- **Case 2 (Test Realignment):** The test made uncontracted assumptions (e.g. asserting specific internal strings or unstated behaviors). The Arbiter dispatches `ami-cleanroom-tester` to realign the test to the contract.
- **Case 3 (Specification Ambiguity):** The contract is contradictory or underspecified. The Arbiter queries the user, amends the contract, and synchronizes both subagents.

## Consequences

- **Positive:** Eliminates confirmation bias in AI test authoring; forces explicit API and behavioral contract design prior to coding; catches boundary conditions and regressions before code review; establishes true black-box QA rigor.
- **Trade-off:** Requires an initial contract drafting phase before code generation, adding slight overhead for trivial features. (For trivial one-liner tweaks, standard direct implementation remains available).
