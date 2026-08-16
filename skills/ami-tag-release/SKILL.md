---
name: ami-tag-release
description: Must be triggered before any release or version bump. Analyzes git commits since the last tag and determines the next semantic version. Handles stable, QA, and RC tags.
allowed-tools: Bash, Read
---

# Skill: Release Tagger

Act as a Version Control Manager. Your job is to determine the next correct version tag based on Semantic Versioning (SemVer) and Conventional Commits.

## Workflow

1. **Find the Last Tag, Versioning Docs, and Tagging System:**
   - First, run `git fetch` to ensure the local repository has all the latest commits and tags from the remote.
   - **Inspect Repository Versioning Documentation:** Actively scan the repository for versioning guidelines or release policies (e.g., `VERSIONING.md`, `docs/versioning.md`, `.agents/AGENTS.md`, `CONTRIBUTING.md`, or versioning sections in `README.md`). If present, read and strictly adhere to the repository's documented versioning rules and conventions.
   - Check if the workspace uses a specific tagging rule (e.g., tags with the `QA-YYYYMMDD-NN` format). You can do this by running `git tag --list` and looking at the pattern of recent tags, or reading project configuration. Do NOT blindly propose SemVer (`vX.Y.Z`) if the project strictly enforces a date-based QA tag format.
   - Run `git describe --tags --abbrev=0` to find the latest tag. If no tag exists, assume the baseline is `v0.0.0`.
   - Explicitly check if the repository uses a different tagging convention (e.g., tags without the `v` prefix like `1.2.3`, or prefixed with package names like `backend-v1.0.0`).
   - If a different system is found, adapt to it. Otherwise, use the standard `vX.Y.Z` defined here.
   - **Current Tag Verification:** Compare the commit hash of the latest tag (`git rev-list -n 1 <last-tag>`) with the commit hash of `HEAD` (`git rev-parse HEAD`). If they are identical (meaning the tag was already created manually for the current commit but the release hasn't been published), suggest reusing the current tag as-is instead of calculating a bump.

2. **Analyze Commits Since Last Tag:**
   - Run `git log <last-tag>..HEAD --oneline` (if hashes differ; otherwise analyze the commit history leading to the current tag).
   - **No New Changes Check:** If `git log <last-tag>..HEAD` returns empty (meaning no new commits have been made since the last tag), report **NO_NEW_CHANGES** and advise that a new release cannot be generated without unreleased commits.
   - Evaluate the actual semantic impact on the primary product:
     - **Major Bump (x.0.0):** If any commit contains a `!` (e.g., `feat!:`) or `BREAKING CHANGE:` introducing breaking changes to public APIs, contracts, or primary product interfaces.
     - **Minor Bump (0.x.0):** If there are new product features, new capabilities, or functional additions (`feat:`) that maintain backward compatibility.
     - **Patch Bump (0.0.x):** If the changes consist exclusively of bug fixes (`fix:`), refactoring (`refactor:`), documentation updates (`docs:`), or internal tooling chores (`chore:`).

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
