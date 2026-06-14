---
name: ami-pr-conflict-detector
description: Analyzes other open Pull Requests in the repository to alert if there are parallel PRs that might conflict with the current changes.
allowed-tools: Bash, Read, Grep
---

# Skill: PR Conflict Detector

When invoked, act as a Repository Coordinator to identify potential conflicts with parallel work streams.

## Workflow

1. **Fetch Open PRs:**
   - Use GitHub CLI (e.g., `gh pr list --state open`) or git commands to identify other open Pull Requests or active remote branches.

2. **Analyze File Overlaps:**
   - For each open PR, use `gh pr view <PR_NUMBER> --json files` or similar git commands to see which files they modify.
   - Compare the list of files modified in the other open PRs with the files modified in the current local PR.

3. **Determine Conflicts:**
   - If there is no overlap in files, or no other open PRs exist, output: **"NO PARALLEL CONFLICTS DETECTED"**.
   - If there is an overlap (the same files are being modified in other open PRs), alert the user.
   - Attempt to analyze if the overlapping modifications will cause a direct git merge conflict or a logical conflict.

4. **Reporting:**
   - Provide a clear warning listing the parallel PRs (PR number and Title) that touch the same files.
   - Ask the user to coordinate with the authors of those PRs or to review them before proceeding.
   - Reject the check if severe conflicts are highly probable, otherwise allow the user to acknowledge the warning and proceed.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
