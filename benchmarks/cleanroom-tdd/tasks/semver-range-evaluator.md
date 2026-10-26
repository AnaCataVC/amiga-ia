# Task Specification: Semantic Version Range Evaluator

**Identifier:** `TASK-SEMVER-EVAL-001`  
**Target Class:** `SemVerRangeEvaluator`  
**Contract Baseline:** `benchmarks/contracts/cleanroom-evaluation.contract.md`

---

## 1. Description

Implement a semantic version comparator class that evaluates whether a given semantic version string satisfies a target range expression.

## 2. Interface Contract

```javascript
class SemVerRangeEvaluator {
  satisfies(version, range) {
    // Returns boolean
  }
}
```

## 3. Strict Semantic Clauses

1. **CL-001 (Type Safety):** Throws `TypeError` if either parameter is not a non-empty string.
2. **CL-002 (Exact Matches):** Matches exact triplets (e.g., `"1.2.3"` satisfies `"1.2.3"`).
3. **CL-003 (Caret `^` Zero-Major Rule):**
   - `^1.2.3` matches `>=1.2.3 <2.0.0`
   - `^0.2.3` matches `>=0.2.3 <0.3.0` (any bump in minor is breaking!)
   - `^0.0.3` matches `>=0.0.3 <0.0.4` (any bump in patch is breaking!)
4. **CL-004 (Tilde `~`):**
   - `~1.2.3` matches `>=1.2.3 <1.3.0`
5. **CL-005 (Pre-Release):**
   - Pre-release versions (`1.2.3-beta.1`) do not satisfy ranges unless the range specifies a pre-release for that exact version tuple.
6. **CL-006 (Zero Private Coupling):**
   - Only public interface `satisfies(version, range)` may be tested.
