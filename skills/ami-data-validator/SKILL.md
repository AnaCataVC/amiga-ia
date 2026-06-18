---
name: ami-data-validator
description: Validates structural consistency between code changes and data definitions (DB connections, queries).
allowed-tools: Bash, Read, Grep
---

# Skill: Push Data Validator

When invoked, act as a Data Architect to ensure any structural changes in code don't break existing data definitions.

## Workflow

1. **Identify Data Definitions:**
   - Scan the codebase (using grep or file searches) to identify where data definitions exist (e.g., ORM models, raw SQL queries, database connection configurations, schema files).
   - Search for any related documentation (e.g., `docs/` or `.md` files) to understand the data model and its intended usage.

2. **Cross-Check with PR Changes:**
   - **Review Diffs:** Analyze the diffs of the current PR to identify any modifications to data definitions (e.g., database schemas, ORM models, core API payloads).
   - **Validate Consistency:** For any modified data definition, ensure that **all related queries, connections, and usages** structurally match the new changes.
   - **Verify Deprecations:** Explicitly confirm that no columns or fields were dropped/renamed without corresponding updates in all associated queries.
   - **Check Documentation:** If you found documentation in the previous step, ensure that it is up-to-date with the changes. 

3. **Reporting & Resolution:**
   - **If structural inconsistencies are found:** 
     - Clearly explain the problem to the user, listing the specific files and queries that require updates.
     - Offer to automatically fix the inconsistencies, using the context gained from the previous steps. If unsure about the correct fix, ask the user for clarification and show the relevant diffs.
     - **NEVER** apply changes without explicit user approval. 
     - Upon user approval, apply the fixes and re-run the validation process to guarantee no new inconsistencies were introduced. If new inconsistencies are found, repeat the process until no inconsistencies are found.
   - **If everything matches (No inconsistencies):** 
     - Inform the user that the data validation passed successfully. Provide a brief summary of the files and queries that were validated against the changes.
   - **If no data definitions were affected:** 
     - Inform the user that the changes do not impact data structures and validation is not required.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
