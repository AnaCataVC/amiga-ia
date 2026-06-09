---
name: ami-learnings-extractor
description: Analyzes recent code changes to extract architectural decisions, lessons, patterns, and surprises, documenting them for future reference.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: Push Learnings Extractor

When invoked, act as a Knowledge Manager to ensure valuable insights from the current development session are preserved.

## Workflow

1. **Analyze Changes:**
   - Review the diffs of the unpushed or recent commits.
   - Look for complex logic, new design patterns, workarounds for specific bugs, or significant architectural decisions.

2. **Extract Learnings:**
   - Synthesize the "why" behind the changes.
   - Identify:
     - **Decisions:** Why a specific library or pattern was chosen.
     - **Lessons/Gotchas:** Any bugs or tricky configurations that took time to resolve.
     - **Patterns:** New reusable patterns introduced in the code.

3. **Document:**
   - Check if there is an existing knowledge base (e.g., `docs/learning/` or `docs/ADR/`).
   - **CRITICAL:** Before creating any files, you MUST present the extracted learnings and decisions to the user in the chat and ask for explicit permission to document them.
   - Once approved, if the learning involves a significant architectural decision and `docs/ADR/` exists, create a new ADR (Architecture Decision Record) file inside `docs/ADR/` following their established format.
   - For all other approved learnings, store them as individual markdown files in `docs/learning/` using a descriptive title (e.g., `docs/learning/caching-strategy-redis.md`). Create the folder if it does not exist.

4. **Reporting:**
   - If learnings were extracted and documented, output the location of the updated file.
   - If the changes were trivial (e.g., typos, simple refactors) and no significant learnings were found, output: **"NO NEW LEARNINGS TO EXTRACT"**.
