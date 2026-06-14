---
name: ami-data-validator
description: Validates structural consistency between code changes and data definitions (DB connections, queries) prior to a PR.
allowed-tools: Bash, Read, Grep
---

# Skill: Push Data Validator

When invoked, act as a Data Architect to ensure any structural changes in code don't break existing data definitions.

## Workflow

1. **Identify Data Definitions:**
   - Scan the codebase (using grep or file searches) to identify where data definitions exist (e.g., ORM models, raw SQL queries, database connection configurations, schema files).

2. **Cross-Check with PR Changes:**
   - Review the diffs of the current PR.
   - If the PR modifies a database schema, an ORM model, or a core API payload, ensure that **all related queries and connections** structurally match the new changes.
   - Ensure no columns were dropped or renamed without updating the corresponding queries.

3. **Reporting:**
   - If structural inconsistencies are found, reject the check and list the specific files and queries that need to be updated.
   - If everything matches or no data definitions were affected, output: **"DATA VALIDATION PASSED"**.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
