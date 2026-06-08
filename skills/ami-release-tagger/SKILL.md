---
name: ami-release-tagger
description: Analyzes git commits since the last tag and determines the next semantic version. Handles stable, QA, and RC tags.
allowed-tools: Bash, Read
---

# Skill: Release Tagger

Act as a Version Control Manager. Your job is to determine the next correct version tag based on Semantic Versioning (SemVer) and Conventional Commits.

## Workflow

1. **Find the Last Tag:**
   - Run `git describe --tags --abbrev=0` to find the latest tag. If no tag exists, assume the baseline is `v0.0.0`.

2. **Analyze Commits Since Last Tag:**
   - Run `git log <last-tag>..HEAD --oneline`.
   - Scan the commit messages:
     - **Major Bump (x.0.0):** If any commit contains a `!` (e.g., `feat!:`) or `BREAKING CHANGE:`.
     - **Minor Bump (0.x.0):** If no major changes, but there is at least one `feat:`.
     - **Patch Bump (0.0.x):** If there are only `fix:`, `docs:`, `chore:`, `refactor:`, etc.

3. **Determine the Base Version:**
   - Calculate the next logical SemVer base version (e.g., from `v1.2.3` to `v1.3.0` if a minor bump).

4. **Apply Tag Modifiers (If Requested):**
   - The user or the orchestrator agent will specify if this is a `qa`, `rc`, or `stable` release.
   - **QA/RC format:** Append `-qa.YYYYMMDD.n` or `-rc.YYYYMMDD.n`.
     - Determine the current date (e.g., `20260607`).
     - Look at existing tags for today to determine `n` (the increment starting at `1`). 
     - Example: If `v1.3.0-qa.20260607.1` exists, the next is `v1.3.0-qa.20260607.2`.
   - **Stable format:** Just the base version (e.g., `v1.3.0`).

5. **Output:**
   - Present the calculated Next Tag to the user clearly.
   - Example: **Recommended Next Tag: v1.3.0**
