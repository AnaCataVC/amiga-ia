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
   - If no technical debt is found during your audit, you MUST simply output **"NO TECH DEBT FOUND"**. Do not list anything, and do not proceed to step 5.
   - If technical debt is found, compile all findings into a structured list.
   - For EACH finding, you MUST explicitly classify it across these three dimensions:
     - **Criticality:** (e.g., `[HIGH]`, `[MEDIUM]`, `[LOW]`)
     - **Ease of Resolution:** (e.g., `[EASY]`, `[MODERATE]`, `[HARD]`)
     - **Implementation Risk:** (e.g., `[HIGH RISK]`, `[MEDIUM RISK]`, `[LOW RISK]`)
   - Provide a clear explanation of the debt, why it is problematic, and a recommended approach to resolve it.
   - **CRITICAL:** You MUST output this complete list of findings directly to the user in the chat interface before doing anything else.

5. **Store Findings (Optional):**
   - If no technical debt was found, do NOT offer to document anything.
   - After showing the list of found debt to the user, you MUST ask for their explicit permission to save this report to the `docs/tech-debt.md` file. DO NOT create or update the file automatically.
   - If the user approves, write the complete structured list of findings into the file.
   - You MUST include the current Date and Time of the scan at the very top of the file.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
