# Contract: Repository Audit & Multi-Agent Inspection Benchmark

**Contract Identifier:** `repo-audit-contract`  
**Status:** Frozen (Benchmark Baseline)  
**Scope:** Automated evaluation of multi-agent codebase auditing (`ami-repo-auditor` / `ami-audit-quality`) against static baseline inspection.

---

## 1. Overview & Evaluation Objective

This contract specifies the ground truth defect register and evaluation rubric for the repository audit benchmark. The target is a controlled synthetic codebase (`benchmarks/repo-audit/fixtures/synthetic-target/`) containing exactly **6 known injected real-world flaws** spanning security, dependency hygiene, concurrency, architecture, and code health.

The objective is to measure:
1. **Precision ($P$):** Avoidance of false alarms / hallucinated issues.
2. **Recall ($R$):** Completeness in detecting real architectural and security defects.
3. **$F_1$-Score:** Harmonic mean of precision and recall.

---

## 2. Injected Defect Ground Truth Register

| Defect ID | Category | Severity | Target File | Expected Defect Description |
|---|---|---|---|---|
| `SEC-001` | Security | Critical | `src/leaky-auth.js` | Hardcoded production API secret key in plaintext variable. |
| `DEP-001` | Dependencies | Major | `package.json` | Phantom / unused package (`phantom-unreferenced-lib`) listed in dependencies. |
| `CON-001` | Concurrency | Critical | `src/race-condition.js` | Unhandled floating Promise (missing `await`) resulting in silent unhandled rejection. |
| `ARC-001` | Architecture | Major | `src/dead-module.js` | Unreachable dead code block and unused exported legacy function. |
| `COP-001` | Complexity | Minor | `src/complex-calc.js` | Extreme cyclomatic complexity (> 15 branch points in a single un-refactored function). |
| `SEC-002` | Security | Major | `src/insecure-hash.js` | Deprecated cryptographic algorithm (`crypto.createHash('md5')`) used for password storage. |

---

## 3. Evaluation Rubric & Confusion Matrix

Each reported finding from an audit execution is categorized against the Ground Truth Register:

- **True Positive ($TP$):** The audit correctly identified an injected defect matching target file, category, and specific flaw line.
- **False Positive ($FP$):** The audit reported an issue that does not exist or flagged valid code as defective.
- **False Negative ($FN$):** An injected defect from the Ground Truth Register was missed by the audit.

### Formulas
- $\text{Precision} = \frac{TP}{TP + FP}$
- $\text{Recall} = \frac{TP}{TP + FN}$
- $F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$

---

## 4. Acceptance Criteria for Amiga IA Auditor

1. **Recall $\ge 83\%$** (Must detect at least 5 of the 6 injected flaws, with 100% detection on `Critical` flaws).
2. **Precision $\ge 85\%$** (No more than 1 false positive across clean fixture files).
3. **$F_1\text{-Score} \ge 0.85$**.
4. Output persisted as structured JSON in `benchmarks/results/repo-audit-results.json`.
