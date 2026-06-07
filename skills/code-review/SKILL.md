---
name: code-review
description: Performs a static analysis of modified or untracked files before a commit to ensure code quality and English-only rules.
allowed-tools: Bash, Read, Grep
---

# Skill: Code Review

When this skill is invoked, you must act as a strict Code Reviewer. 

## Workflow
1. **Identify Changes:** Use git commands (or standard file listing if it's not a git repo yet) to identify files that are about to be committed.
2. **Analyze Content:** Read the files and ensure:
   - **Language Rule:** All code, comments, and internal logic MUST be in English. (Exceptions: bilingual documentation files like README.md).
   - **Quality:** Ensure there are no leftover debug statements, hardcoded secrets, or obvious logic flaws.
3. **Report:** 
   - If you find issues, list them clearly and reject the review.
   - If everything is perfect, you MUST output the exact phrase: **"LGTM - Ready to commit"**.
