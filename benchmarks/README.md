# Amiga IA — Agentic Benchmark Suite

Empirical, deterministic evaluation suite designed to validate the architectural claims of **Amiga IA** through reproducible benchmarks.

---

## 1. Overview & Philosophy

In Agentic AI engineering, architectural claims (e.g., token efficiency, confirmation bias elimination, defect detection resilience) must be substantiated with reproducible empirical evidence rather than theoretical assumptions.

This benchmark suite addresses the core evaluation criteria of modern AI engineering:
1. **Token Efficiency & Context Compression (ADR-004):** Measures system prompt overhead reduction via root-relative attribute XML schemas.
2. **Defect Detection & Precision/Recall:** Audits a controlled synthetic codebase containing 6 known injected flaws across security, dependencies, concurrency, and architecture.
3. **Double-Blind Cleanroom TDD (ADR-012, ADR-017):** Demonstrates how isolated implementer and tester subagents mediated by an objective arbiter eliminate LLM confirmation bias and test overfitting compared to single-agent workflows.

---

## 2. Benchmark Directory Structure

```text
benchmarks/
├── README.md                            # Suite documentation and reproduction guide
├── run-all.js                           # Master runner orchestrating all benchmarks
├── contracts/                           # Frozen evaluation contracts
│   ├── cleanroom-evaluation.contract.md # Cleanroom evaluation contract & task specification
│   └── repo-audit.contract.md           # Repository defect register & rubric
├── token-overhead/                      # Experiment A: System prompt context compression
│   ├── fixtures/
│   │   ├── legacy-verbose-catalog.xml   # Pre-ADR-004 verbose XML with absolute paths
│   │   └── compact-catalog.xml          # Compact root-relative attribute catalog
│   └── measure-token-overhead.js        # Deterministic BPE token counter
├── repo-audit/                          # Experiment B: Multi-agent defect detection
│   ├── fixtures/synthetic-target/       # Controlled codebase with 6 injected flaws
│   ├── ground-truth.json                # Expected defects register
│   └── evaluate-repo-audit.js           # Confusion matrix & precision/recall evaluator
├── cleanroom-tdd/                       # Experiment C: Double-Blind Cleanroom vs Single-Agent TDD
│   ├── tasks/
│   │   └── semver-range-evaluator.md    # Strict boundary contract
│   ├── harnesses/
│   │   ├── single-agent-sim.js          # Single-agent workflow with confirmation bias
│   │   └── cleanroom-sim.js             # Cleanroom Triad (Builder, Tester, Arbiter)
│   └── evaluate-cleanroom.js            # Confirmation bias & defect escape evaluator
└── results/
    ├── summary.json                     # Aggregated numerical metrics
    ├── token-overhead-results.json      # Raw token overhead benchmark output
    ├── repo-audit-results.json          # Precision/Recall confusion matrix
    ├── cleanroom-results.json           # Cleanroom vs Single-Agent comparison
    └── BENCHMARK_REPORT.md              # Publication-grade empirical report
```

---

## 3. The Experiments

### Experiment A: System Prompt Token Overhead
- **Target:** Validates `ADR-004` (Unified PowerShell Hooks and Token Tax Optimization).
- **Metric:** Compares the legacy nested XML format (with verbose element wrappers and absolute paths) against the compact attribute format.
- **Result:** **-44.75% context reduction (-2,973 tokens saved per turn)** on current catalog size, well exceeding the historical 36.3% baseline threshold.

### Experiment B: Repository Defect Detection
- **Target:** Validates `ami-repo-auditor` and `ami-audit-quality`.
- **Metric:** Evaluates detection accuracy on 6 injected defects (`SEC-001`, `DEP-001`, `CON-001`, `ARC-001`, `COP-001`, `SEC-002`) and ensures zero false positives on sound code (`clean-service.js`).
- **Result:** **100% Precision, 100% Recall, $F_1 = 1.00$**.

### Experiment C: Cleanroom TDD vs Single-Agent TDD
- **Target:** Validates `ADR-012` and `ADR-017`.
- **Metric:** Compares a single agent (which encodes flawed zero-major semver boundaries into biased tests, leaking bugs) against the Cleanroom Triad (where isolated black-box testing detects defects and the Arbiter orchestrates contract realignment).
- **Result:** **0% confirmation bias, 0% escaped defects** in Cleanroom vs 33.3% biased assertions and 100% bug escape in single-agent authoring.

---

## 4. How to Reproduce

All evaluations are 100% deterministic, offline, and run using standard Node.js without external API keys or cloud dependencies:

```bash
# Execute the entire benchmark suite and generate BENCHMARK_REPORT.md
npm run benchmark

# Execute individual benchmarks
npm run benchmark:tokens
npm run benchmark:audit
npm run benchmark:cleanroom
```
