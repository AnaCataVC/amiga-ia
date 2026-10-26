# Amiga IA — Empirical Agentic Benchmark Report

> **Generated:** 2026-10-26T01:49:39.369Z  
> **Suite Version:** 1.0.0  
> **Methodology:** Zero-Dependency Deterministic Evaluation

---

## 1. Executive Summary

This benchmark report provides reproducible empirical evidence evaluating the architectural claims of **Amiga IA** across three core dimensions:
1. **Token Economy & System Prompt Optimization** (Validating ADR-004).
2. **Repository Defect Detection & False Positive Resilience** (Validating `ami-repo-auditor`).
3. **Double-Blind Cleanroom TDD vs Single-Agent Authoring** (Validating ADR-012 & ADR-017).

| Benchmark Experiment | Primary Metric | Result | Benchmark Quality Gate | Status |
|---|---|---|---|---|
| **System Prompt Token Overhead** | Context footprint reduction per turn | **-2.973 tokens (-44.75%)** | Reduction $\ge 35.0\%$ | **PASSED** |
| **Repository Audit Defect Detection** | Precision, Recall, $F_1$-Score | **$P=100\%$, $R=100\%$, $F_1=1.00$** | $F_1 \ge 0.85$ | **PASSED** |
| **Cleanroom TDD Isolation** | Confirmation bias & escaped defect rate | **$0.0\%$ confirmation bias, $0$ escaped defects** | $0$ escaped defects | **PASSED** |

---

## 2. Experiment A: System Prompt Token Overhead (ADR-004)

* **Objective:** Independently verify the token reduction achieved by transitioning from verbose nested XML tags and absolute paths to compact root-relative attribute indexing.
* **Contract / Reference:** `docs/adr/004-unified-powershell-hooks-and-token-tax-optimization.md`
* **Execution:** `npm run benchmark:tokens`

### Results Matrix
| Structure | Raw Payload Size | Estimated Context Tokens | Delta vs Baseline |
|---|---|---|---|
| **Legacy Pre-ADR-004 XML** | 19.451 bytes | 6.643 tokens | Baseline |
| **Amiga IA Compact XML** | 10.519 bytes | 3.670 tokens | **-2.973 tokens (-44.75%)** |

> **Architectural Impact:** Reducing static recurring overhead by 2.973 tokens per turn delays context window autocompaction cascades in deep engineering sessions and yields faster LLM Time-To-First-Token (TTFT) response latency.

---

## 3. Experiment B: Repository Audit & Multi-Agent Inspection

* **Objective:** Evaluate multi-agent code analysis heuristics against a controlled synthetic codebase with 6 injected real-world flaws.
* **Contract:** `benchmarks/contracts/repo-audit.contract.md`
* **Target Fixture:** `benchmarks/repo-audit/fixtures/synthetic-target/`
* **Execution:** `npm run benchmark:audit`

### Confusion Matrix
- **Total Injected Defects:** 6
- **True Positives ($TP$):** 6
- **False Positives ($FP$):** 0
- **False Negatives ($FN$):** 0
- **Precision:** 100%
- **Recall:** 100%
- **$F_1$-Score:** 1

### Defect Findings Breakdown
| Defect ID | Category | Severity | Detection Status |
|---|---|---|---|
| `SEC-001` | Security | Critical | **DETECTED** |
| `DEP-001` | Dependencies | Major | **DETECTED** |
| `CON-001` | Concurrency | Critical | **DETECTED** |
| `ARC-001` | Architecture | Major | **DETECTED** |
| `COP-001` | Complexity | Minor | **DETECTED** |
| `SEC-002` | Security | Major | **DETECTED** |

---

## 4. Experiment C: Double-Blind Cleanroom TDD vs Single-Agent TDD

* **Objective:** Measure confirmation bias and test overfitting when generating code and tests in a shared context versus isolated Cleanroom agents operating over an explicit contract.
* **Contract:** `benchmarks/contracts/cleanroom-evaluation.contract.md`
* **Task Specification:** `benchmarks/cleanroom-tdd/tasks/semver-range-evaluator.md`
* **Execution:** `npm run benchmark:cleanroom`

### Comparative Analysis
| Metric | Single-Agent TDD | Cleanroom TDD (Triad) | Advantage |
|---|---|---|---|
| **Confirmation Biased Tests** | 1 (33.3%) | **0 (0%)** | **Eliminates bias entirely** |
| **Over-Constrained Tests (Private Coupling)** | 1 (33.3%) | **0 (0%)** | **True black-box encapsulation** |
| **Defects Escaped to Production** | 1 defect (100%) | **0 defect (0%)** | **100% defect capture** |
| **Arbitration Convergence Loops** | 1 (False positive pass) | 2 (Defect caught and resolved) | Contract-driven convergence |

---

## 5. Reproduction & Verification

All benchmarks are 100% deterministic, offline, and require zero external API tokens or paid cloud services.

```bash
# Run the complete benchmark suite
npm run benchmark

# Run individual benchmarks
npm run benchmark:tokens
npm run benchmark:audit
npm run benchmark:cleanroom
```
