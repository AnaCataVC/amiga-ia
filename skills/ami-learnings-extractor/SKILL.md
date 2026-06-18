---
name: ami-learnings-extractor
description: Analyzes recent code changes to extract architectural decisions, lessons, patterns, and surprises, documenting them for future reference.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: Push Learnings Extractor

When invoked, act as a Knowledge Manager to ensure valuable insights from the current development session are preserved.

## Workflow

1. **Understand Context And Analyze Changes:**
   - **Determine Scope:** If the user has not specified a context (e.g., a specific commit, PR, or session), default to analyzing all unpushed changes or the most recent commit, and inform the user.
   - **Review Changes:** Extract and analyze the diffs within the determined scope.
   - **Identify Key Elements:** Actively search for complex logic, new design patterns, bug workarounds, and significant architectural decisions.

2. **Extract Learnings:**
   - Synthesize the "why" behind the changes.
   - Identify:
     - **Decisions:** Why a specific library or pattern was chosen.
     - **Lessons/Gotchas:** Any bugs or tricky configurations that took time to resolve.
     - **Patterns:** New reusable patterns introduced in the code.
   - If you are not sure about why something was implemented a specific way, ask the user to clarify before documenting it.

3. **Document:**
   - Check if there is an existing knowledge base (e.g., `docs/learning/` or `docs/ADR/`).
   - **CRITICAL:** Before creating any files, you MUST present the extracted learnings and decisions to the user in the chat and ask for explicit permission to document them.
   - Once approved, if the learning involves a significant architectural decision and `docs/ADR/` exists, create a new ADR (Architecture Decision Record) file inside `docs/ADR/` following their established format.
   - For all other approved learnings, store them as individual markdown files in `docs/learning/` using a descriptive title (e.g., `docs/learning/caching-strategy-redis.md`). Create the folder if it does not exist.

4. **Reporting:**
   - If learnings were extracted and documented, output the location of the updated file.
   - If the changes were trivial (e.g., typos, simple refactors) and no significant learnings were found, let the user know.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
