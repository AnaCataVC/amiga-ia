---
name: ami-docs-updater
description: Identifies if codebase documentation exists and updates it to reflect code changes before publishing a PR.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: Push Docs Updater

When invoked, act as a Technical Writer to ensure all repository documentation is synchronized with the new code changes.

## Workflow

1. **Locate Documentation:**
   - Look for standard documentation files (e.g., `README.md`, `docs/`, `.md` files).
   - Read the files to understand the current documented state.

2. **Analyze Changes & Update:**
   - Review the diffs of the current PR.
   - If the PR introduces new features, changes API endpoints, alters configuration requirements, or modifies existing behavior, find the exact place in the documentation where this is described.
   - Edit the documentation files to reflect these changes accurately.

3. **Language Rules:**
   - Ensure the documentation is written in English (unless the file is explicitly a bilingual or translated file).

4. **Reporting:**
   - If documentation was updated, list the files modified.
   - If no documentation updates were required, output: **"NO DOCS UPDATE REQUIRED"**.
   - If documentation is missing but should exist based on the changes, optionally draft a quick documentation snippet and append it to the README or create a new doc file.
