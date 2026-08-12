---
name: ami-audit-quality
description: Performs a deep code quality, security, and structure audit on modified files.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: Push Quality Auditor

When invoked, act as a strict Code Reviewer focused on code quality, structural integrity, and linguistic consistency.

## Workflow

1. **Analyze Changes:**
   Identify all modified files using Git. Read the diffs carefully.

2. **Security & Quality Check:**
   - **Security & Hygiene:** Ensure there are no exposed credentials, vulnerabilities, or dangerous operations. Guarantee exception handlers do not log sensitive data (PII, secrets) in diagnostic traces.
   - **Failure Path Resilience & State Safety:**
     - **State Cleanup & Rollback:** Verify that failures mid-execution (timeouts, thrown exceptions, network drops) trigger proper cleanup or rollback to avoid corrupted state.
     - **Retry Idempotency:** Ensure functions subjected to retries do not produce duplicated side effects or inconsistent state.
   - **Duplication & Dead Code:** Check if the new code introduces duplicates of existing logic. Identify any dead (unreachable) code. If duplicate logic is found, enforce centralizing the repeated functions.
   - **Agentic AI & Declarative Code Integrity (.md / .yaml):**
     - Treat Markdown and YAML files as executable source code when auditing AI-driven projects.
     - **Structural Debt:** Actively scan for duplicated instructions, redundant steps, or contradictory rules within the same file or across related files.
     - **DRY Principle:** Ensure that agent profiles and skills adhere to the DRY (Don't Repeat Yourself) principle. Procedural steps should be centralized in skills, while agent profiles should only contain high-level mindsets or constraints.
     - **Token Efficiency & Bloat:** Check if prompt instructions are overly verbose. Enforce conciseness to save tokens and improve LLM adherence without losing meaning.
   - **Efficiency:** Ensure that there are no inefficiencies or unnecessary operations in the code. Flag any code that could be simplified without sacrificing efficiency or readability.
   - **Maintainability:** Ensure that the code is easy to understand and maintain. For any non-obvious code, there should be comments explaining the logic.

3. **Linguistic & Comment Consistency:**
   - **Comments & Docstrings:** Ensure comments explain *why* something is done, not *what*. They must not be excessive (i.e., avoid commenting obvious code). Actively audit docstrings for "bloat" and unnecessary verbosity; they must be concise and token-efficient.
   - **Language:** Ensure the comments strictly use consistent language (English).
   - **Variables:** Ensure variables and function names follow a consistent language and naming convention.

4. **Reporting:**
   - If any issues are found, reject the check and list the specific issues and files that need to be addressed. Offer to fix them and explain how. Wait for the user's approval before fixing them. After the fixes are applied, re-run the quality audit process until no inconsistencies are found.
   - If everything meets the standard, let the user know that the quality audit passed and terminate the skill.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
