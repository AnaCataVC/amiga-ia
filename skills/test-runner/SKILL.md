---
name: test-runner
description: Finds and executes the test suite for the current project to ensure no regressions before opening a Pull Request.
allowed-tools: Bash, Read, Grep
---

# Skill: PR Test Runner

When invoked, act as a QA Engineer ensuring all unit, integration, and standard tests pass before allowing a PR.

## Workflow

1. **Identify Test Framework:**
   - Scan the repository for common test configurations (e.g., `package.json` for npm test, `pytest.ini` or `tests/` for Python, `go.mod` for Go, etc.).

2. **Execute Tests:**
   - Run the appropriate test command for the project (e.g., `npm test`, `pytest`, `go test ./...`, etc.).
   - Wait for the results.

3. **Reporting:**
   - If tests fail, output the error logs, reject the check, and prompt the user to fix the tests before opening the PR.
   - If tests pass successfully, output: **"TEST SUITE PASSED"**.
   - If no tests are found in the repository, output a warning recommending the addition of tests, but do not block the PR (unless strict coverage rules are specified in the repo).
