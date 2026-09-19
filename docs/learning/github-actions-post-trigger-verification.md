# GitHub Actions Post-Trigger Verification and Remote Publish Gates

## Context & Problem
During the release lifecycle of `@anacatavc/amiga-ia@4.6.1`, local git operations (`git push`, `gh release create`, and `gh release view`) succeeded smoothly. However, the downstream automated GitHub Actions workflow triggered by the release event (`Release & Publish` on NPM) failed due to an expired NPM authentication token (`NPM_TOKEN`).

Prior to this incident, release and push orchestration subagents verified success solely up to the execution of the CLI command (`gh release create` / `gh release view`), leaving triggered downstream CI/CD workflows unmonitored. This created a false sense of completion while automated distribution pipelines were actively failing in the background.

## Root Cause
CLI release tools (`gh release create`) create the release object and git tag on GitHub immediately, but decoupled asynchronous workflows (such as NPM package publishing, Docker builds, PyPI uploads, or Vercel production deployments) run downstream in GitHub Actions runners. A successful release object does not guarantee successful package artifact publication or registry distribution.

## Directives & Architecture Patterns
1. **Mandatory Downstream Inspection:**
   Whenever a remote trigger occurs (`git push`, `gh pr create`, `gh pr merge`, or `gh release create`), agents must query active workflow runs:
   ```powershell
   gh run list --limit 3
   ```
2. **Watch to Completion:**
   Agents must watch the triggered run until completion:
   ```powershell
   gh run watch <run-id>
   ```
3. **Fail-Hard Diagnostic Gate:**
   If a workflow run fails:
   - Extract the failure logs immediately: `gh run view <run-id> --log-failed`.
   - Diagnose root cause (expired secrets, token permissions, build defects).
   - Inform the user with actionable remediation steps.
   - **Invariable:** NEVER declare a release or push deployment as completed while its corresponding GitHub Actions workflow is failing.
