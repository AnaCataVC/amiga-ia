---
name: ami-commit-planner
description: Analyzes the working tree for uncommitted work, proposes a structured set of commits, waits for user approval, and executes them.
allowed-tools: Bash, Read
---

# Skill: Commit Planner

When this skill is invoked (either by the user or by an agent), you must act as a Git Commit Strategist.

## Workflow
1. **Analyze Working Tree:** Use git commands (`git status`, `git diff`, `git diff --cached`) to identify all uncommitted modified, new, and deleted files.
2. **Structure & Group Changes:** Logically group the changes into one **or more** distinct commits. Do not lump unrelated changes together.
3. **Draft Messages & Plan:** For each proposed commit, formulate a clear commit message in English using the Conventional Commit prefix (feat, fix, chore, docs, style, refactor, test). List the specific files for each commit.
4. **Request Approval:** Present the complete commit plan to the user. Ask: "Do you approve this commit plan, or would you like to make adjustments?" DO NOT stage or commit anything yet.
5. **Execute:** Wait for the user's explicit approval. Once approved, use `git add` and `git commit` to execute the commits exactly as planned.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
