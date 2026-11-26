---
name: ami-analyze-dependencies
description: Analyzes the project's libraries and dependencies. It checks for unused dependencies, outdated versions, security vulnerabilities, and generates a structured report of the project's dependency health.
allowed-tools: Bash, Read, Grep, Glob, Agent, Write
---

# Skill: Dependency Analyzer

When invoked, act as a **Dependency Health Analyst**.

## Context-Window Protection Rule
- **Full-Repository Sweeps (Delegate to Subagent):** When auditing an entire repository or workspace for outdated packages, unused imports, and CVEs, delegate Steps 1 through 4 to a lightweight background subagent (`Agent`) that returns only the classified summary report. This keeps verbose JSON dumps and raw advisory tables (`npm audit`, `pip-audit`, `cargo audit`, `govulncheck`) out of the primary conversation context.
- **Targeted Checks (Inline Execution):** Run inline in the current session only when inspecting a single package, verifying a specific upgrade, or already executing inside an isolated worker subagent.

## Workflow

### 1. Identify the Project Ecosystem
- Scan the repository root and workspace folders for package manifests and lockfiles (e.g., `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`).
- Identify all active languages, package managers, and workspace boundaries.

### 2. Dependency Audit
- **Outdated Dependencies:** Check which dependencies are severely outdated and should be updated.
- **Unused Dependencies:** Identify dependencies that are declared in manifests but never imported, referenced, or invoked by build/runtime scripts.
- **Undeclared Dependencies (Phantom):** Detect libraries imported directly in source code that rely on transitive resolution rather than explicit declaration in the package manifest.
- **Security Vulnerabilities:** Detect packages with known CVEs or security advisories using native ecosystem audit tools.
- **Duplication/Overlap:** Flag multiple libraries solving the same problem (e.g., overlapping HTTP clients, date libraries, or utility toolkits redundant with standard library features).

### 3. Execution of Automated Tools
- Run appropriate ecosystem commands to ground your analysis (e.g., `npm outdated` and `npm audit` for Node.js; `pip-audit` and `pip check` for Python; `cargo audit` for Rust; `go list -m -u all` for Go).

### 4. Classify and Report Findings
- Compile a structured report grouped logically (`Critical Vulnerabilities`, `Outdated Packages`, `Unused Packages`, `Undeclared Packages`, `Architecture/Overlap Issues`).
- For each finding, provide the affected manifest path, version impact, and a clear recommendation (`update`, `remove`, `declare`, or `replace`).
- **CRITICAL:** Output this complete structured list of findings directly to the user in the chat interface before modifying any files.

### 5. Action Plan (Optional)
- **CONFIRMATION 1 - Apply Dependency Updates:** STOP and ask the user which recommended fixes (package upgrades, removals, phantom declarations, or vulnerability remediations) they approve applying.
- If the user approves, update the manifests and lockfiles accordingly, declaring any newly introduced library in the dependency manifest in the same change so code and dependencies remain synchronized.
- When a change introduces or upgrades a dependency, verify it locally against the physically installed version (import it and exercise the used API or run the test suite) before completing; documentation alone is insufficient.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
