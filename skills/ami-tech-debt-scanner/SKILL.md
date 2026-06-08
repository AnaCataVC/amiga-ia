---
name: ami-tech-debt-scanner
description: Analyzes the repository for technical debt, including outdated dependencies, dead code, duplication, and architectural inconsistencies. Provides a classified report based on criticality, effort, and risk.
---

Follow these instructions to scan a repository for technical debt:

1. **Understand the Repository Context:**
   - Begin by reading the `README.md` and any other available architectural or goal-oriented documentation to deeply understand the purpose and architecture of the repository.
   - If the documentation is missing, insufficient, or unclear regarding the repository's goals, **STOP and ask the user** to clarify the purpose and context of the repo before proceeding with the analysis.

2. **Dependency Analysis:**
   - Inspect the package management files (e.g., `package.json`, `requirements.txt`, etc.).
   - Identify libraries and dependencies that appear to be significantly outdated, unmaintained, or deprecated.

3. **Code Quality and Architecture Audit:**
   - Scan the codebase to identify:
     - **Dead code:** Unused variables, functions, components, or files.
     - **Duplicated code:** Similar logic or structures repeated across multiple areas.
     - **Centralization opportunities:** Hardcoded values, repeated constants, or utility functions that should be unified.
     - **Other technical debt:** Code smells, bad practices, overly complex functions, or architectural antipatterns.

4. **Classify and Report Findings:**
   - Compile all findings into a structured list.
   - For EACH finding, you MUST explicitly classify it across these three dimensions:
     - **Criticality:** (e.g., `[HIGH]`, `[MEDIUM]`, `[LOW]`)
     - **Ease of Resolution:** (e.g., `[EASY]`, `[MODERATE]`, `[HARD]`)
     - **Implementation Risk:** (e.g., `[HIGH RISK]`, `[MEDIUM RISK]`, `[LOW RISK]`)
   - Provide a clear explanation of the debt, why it is problematic, and a recommended approach to resolve it.
