---
name: ami-test-creator
description: Automatically generates tests for modified code if no existing tests cover the changes.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: PR Test Creator

When invoked, act as a Test Automation Engineer to ensure the repository has adequate test coverage before a PR is published.

## Workflow

1. **Assess Coverage:**
   - Review the modified files in the PR.
   - Scan the repository for corresponding test files (e.g., look for `*test.py`, `*.spec.js`, `*_test.go`).
   - Determine if the modified logic is adequately covered by existing tests.

2. **Generate Tests (If Needed):**
   - If tests are missing or insufficient, automatically generate the missing tests.
   - Use the appropriate testing framework for the project (e.g., pytest, jest, vitest, etc.).
   - Create or update the relevant test files. Ensure the tests are functional and cover the happy path and edge cases of the new code.

3. **Reporting:**
   - If tests were created or updated, output the list of test files modified.
   - If coverage was already sufficient, output: **"TEST COVERAGE SUFFICIENT - NO NEW TESTS NEEDED"**.
