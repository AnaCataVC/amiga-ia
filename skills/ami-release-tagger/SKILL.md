---
name: ami-release-tagger
description: Analyzes git commits since the last tag and determines the next semantic version. Handles stable, QA, and RC tags.
allowed-tools: Bash, Read
---

# Skill: Release Tagger

Act as a Version Control Manager. Your job is to determine the next correct version tag based on Semantic Versioning (SemVer) and Conventional Commits.

## Workflow

1. **Find the Last Tag and Tagging System:**
   - Run `git describe --tags --abbrev=0` to find the latest tag. If no tag exists, assume the baseline is `v0.0.0`.
   - Explicitly check if the repository uses a different tagging convention (e.g., tags without the `v` prefix like `1.2.3`, or prefixed with package names like `backend-v1.0.0`).
   - If a different system is found, adapt to it. Otherwise, use the standard `vX.Y.Z` defined here.
   - **Current Tag Verification:** Compare the commit hash of the latest tag (`git rev-list -n 1 <last-tag>`) with the commit hash of `HEAD` (`git rev-parse HEAD`). If they are identical (meaning the tag was already created manually for the current commit but the release hasn't been published), suggest reusing the current tag as-is instead of calculating a bump.

2. **Analyze Commits Since Last Tag:**
   - Run `git log <last-tag>..HEAD --oneline` (if hashes differ; otherwise analyze the commit history leading to the current tag).
   - Evaluate the actual impact of the changes semantically rather than blindly following commit prefixes:
     - **Major Bump (x.0.0):** If any commit contains a `!` (e.g., `feat!:`) or `BREAKING CHANGE:` introducing breaking changes to public APIs, skills, or main interfaces.
     - **Minor Bump (0.x.0):** If there are new features or major additions (e.g., a completely new skill or agent) that do not break backward compatibility.
       - *Note:* If a commit is prefixed with `feat:` but actually represents a minor internal developer flow improvement, hook configuration, or refactoring, do NOT perform a Minor bump. Keep it as a Patch bump.
     - **Patch Bump (0.0.x):** If the changes consist only of bug fixes (`fix:`), updates to existing documentation (`docs:`), tool configuration chores (`chore:`), minor refactorings (`refactor:`), or support script tweaks.

3. **Determine the Base Version:**
   - Calculate the next logical SemVer base version based on the semantic analysis above. If the current tag is verified to target `HEAD` and represents the correct version, use the current tag as the base version.

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


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
