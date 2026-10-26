# Contract: Double-Blind Cleanroom TDD vs Single-Agent Benchmark

**Contract Identifier:** `cleanroom-evaluation-contract`  
**Status:** Frozen (Benchmark Baseline)  
**Scope:** Automated comparative evaluation of Single-Agent vs Cleanroom TDD isolation boundaries on a fixed specification.

---

## 1. Overview & Evaluation Objective

This contract defines the benchmark evaluating how **Cleanroom TDD** (`ami-cleanroom-arbiter` coordinating isolated `ami-cleanroom-builder` and `ami-cleanroom-tester`) resolves systemic **confirmation bias** and **test overfitting** compared to standard **Single-Agent TDD** (a single model context generating both code and test suites).

### Core Hypotheses Under Evaluation
1. **Confirmation Bias Elimination:** When an implementation contains subtle edge-case flaws, a single agent authoring both code and tests will encode the flaw into its assertions. Cleanroom isolation detects these defects because the tester constructs assertions exclusively from the specification.
2. **Over-Constrained Test Prevention:** Single agents frequently couple tests to private variables and internal structures. Cleanroom testers test purely against public contracts.
3. **Arbitration Convergence:** An objective Arbiter using contract clauses adjudicates failures into:
   - *Code Defect* (Implementation fails contract requirement)
   - *Test Realignment* (Test asserts uncontracted assumption)
   - *Contract Ambiguity* (Specification lacks formal determinism)

---

## 2. Target Domain Task: Semantic Version Range Evaluator (`SemVerRangeEvaluator`)

The benchmark task consists of implementing a semantic version range evaluator adhering to the following formal interface and behavioral requirements:

### 2.1 Public Signature
```javascript
class SemVerRangeEvaluator {
  /**
   * Evaluates whether a semantic version satisfies a range expression.
   * @param {string} version - Semantic version string (e.g., "1.2.3", "2.0.0-alpha.1").
   * @param {string} range - Range expression (e.g., "^1.2.0", "~1.2.3", ">=1.0.0 <2.0.0").
   * @returns {boolean} True if version satisfies range, false otherwise.
   * @throws {TypeError} If version or range are not non-empty strings.
   * @throws {RangeError} If version format is invalid SemVer.
   */
  satisfies(version, range);
}
```

### 2.2 Formal Invariant Clauses
- **Clause CL-001 (Type Validation):** Must throw `TypeError` if `version` or `range` is not a non-empty string.
- **Clause CL-002 (Exact Version Matching):** Exact version strings (e.g. `"1.2.3"`) match only identical versions.
- **Clause CL-003 (Caret Range `^`):**
  - For `^1.2.3`: allows `>=1.2.3 <2.0.0`.
  - For `^0.2.3`: allows `>=0.2.3 <0.3.0` (zero major treats minor as breaking).
  - For `^0.0.3`: allows `>=0.0.3 <0.0.4` (zero major/minor treats patch as breaking).
- **Clause CL-004 (Tilde Range `~`):**
  - For `~1.2.3`: allows `>=1.2.3 <1.3.0`.
- **Clause CL-005 (Pre-Release Isolation):**
  - Pre-release versions (e.g. `"1.2.3-alpha"`) MUST NOT satisfy normal ranges (`^1.2.0`, `>=1.0.0`) unless the range comparator explicitly specifies a pre-release tag for that specific tuple.
- **Clause CL-006 (Zero Private Coupling):**
  - Test suites must NOT assert internal helper names, private regex patterns, or AST representations. Verification must proceed strictly via `satisfies(version, range)`.

---

## 3. Evaluation Metrics

1. **Defect Detection Rate ($DDR$):**
   $$DDR = \frac{\text{Contract-Violating Edge Cases Detected}}{\text{Total Injected Edge Cases}} \times 100\%$$
2. **Confirmation Bias Rate ($CBR$):**
   $$CBR = \frac{\text{Flawed Behaviors Silently Passed as Valid Tests}}{\text{Total Authored Tests}} \times 100\%$$
3. **Over-Constrained Test Rate ($OTR$):**
   $$OTR = \frac{\text{Tests Asserting Private/Uncontracted Internals}}{\text{Total Authored Tests}} \times 100\%$$
4. **Arbitration Convergence Iterations ($ACI$):**
   Number of arbitration loops required for code and tests to reach 100% mutual contract compliance.

---

## 4. Execution Protocol

- All evaluations run in isolated sandboxed contexts with zero state leakage.
- Output metrics are written to `benchmarks/results/cleanroom-results.json`.
