---
name: push-quality-auditor
description: Performs a deep code quality, security, and structure audit on modified files prior to publishing a PR.
allowed-tools: Bash, Read, Grep
---

# Skill: Push Quality Auditor

When invoked, act as a strict Code Reviewer focused on code quality, structural integrity, and linguistic consistency.

## Workflow

1. **Analyze Changes:**
   Identify all modified files using Git. Read the diffs carefully.

2. **Security & Quality Check:**
   - **Security:** Ensure there are no exposed credentials, vulnerabilities, or dangerous operations.
   - **Duplication & Dead Code:** Check if the new code introduces duplicates of existing logic. Identify any dead (unreachable) code. If duplicate logic is found, enforce centralizing the repeated functions.

3. **Linguistic & Comment Consistency:**
   - **Comments:** Ensure comments explain *why* something is done, not *what*. The comments should not be excessive (i.e., avoid commenting obvious code).
   - **Language:** Ensure the comments strictly use consistent language (English).
   - **Variables:** Ensure variables and function names follow a consistent language and naming convention.

4. **Reporting:**
   - If any issues are found, reject the check and list the specific issues and files that need to be addressed.
   - If everything meets the standard, output: **"QUALITY AUDIT PASSED"**.
