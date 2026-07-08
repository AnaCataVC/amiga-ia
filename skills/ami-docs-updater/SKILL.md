---
name: ami-docs-updater
description: Must be triggered when code changes affect documented APIs, interfaces, or public behavior. Identifies if codebase documentation exists and updates it to reflect the changes.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: Push Docs Updater

When invoked, act as a Technical Writer to ensure all repository documentation is synchronized with the new code changes.

## Workflow

1. **Locate Documentation:**
   - Scan the repository for standard documentation files (e.g., `README.md`, `docs/` directory, or other `.md` files).
   - Read the identified files to build context on the current documented state.
   - Ask the user to confirm if you have found all relevant documentation or if any specific files were missed.

2. **Analyze Changes:**
   - Review the current working tree diffs to understand the code modifications.
   - Cross-reference the code changes with the existing documentation.
   - If the changes alter behaviors, APIs, or setups described in the documentation, proceed to Step 3. If no documentation is affected, skip to Step 4.

3. **Update Documentation:**
   - **CRITICAL:** Do NOT modify files immediately. You MUST first present a summary or diff of your proposed documentation updates in the chat.
   - Request explicit approval from the user for the proposed changes.
   - Only after receiving approval, write the changes to the respective files.

4. **Reporting:**
   - **If updated:** List the specific documentation files that were modified.
   - **If unaffected:** Inform the user that the code changes did not require any documentation updates.
   - **If missing:** If new features or modules were added that lack existing documentation, ask the user if they want you to draft new documentation for them (e.g., in `README.md` or a new file).


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
