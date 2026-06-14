---
name: ami-pr-peer-reviewer
description: Assists in reviewing Pull Requests from other people. Understands the PR goal, reads available documentation, asks the user clarifying questions, focuses solely on modified code, and outputs quality observations with criticality levels.
---

Follow these steps precisely to review a Pull Request:

1. **Context and Validation:**
   - Identify the Pull Request to be reviewed.
   - Verify that you are in the correct local repository and branch corresponding to the PR or its base.
   - Identify the author of the PR. **CRITICAL:** The author must NOT be the user currently invoking this skill. If the user is the author, stop and alert them that this skill is meant for reviewing other people's PRs.

2. **Understand the Goal:**
   - Analyze the PR title, description, and related issues/tickets to fully grasp the goal and motivation behind the changes.
   - Read available documentation in the repository (e.g., `README.md` and any other relevant `.md` docs) to gain context on the affected components.

3. **Clarification and Interactive QA:**
   - Before analyzing the code deeply, determine if you fully understand the PR's intent and architectural context.
   - If there is any ambiguity or missing context, **ASK THE USER**. Ask as many questions as needed to ensure you completely understand the context, domain, and objective of the PR before proceeding. Wait for their answers.

4. **Strict Code Analysis:**
   - Once all questions are answered and the context is clear, review the PR diff.
   - Observe **ONLY** the code that is introduced (added) or removed (deleted) in the PR. Avoid commenting on pre-existing code that is out of scope, unless it directly interacts with the new changes in a problematic way.
   - Analyze the changes for code quality, potential bugs, edge cases, security, performance, and best practices.

5. **Generate Quality Observations:**
   - Output a comprehensive list of observations based on your analysis.
   - For every observation, you MUST indicate its criticality level (e.g., `[BLOCKER]`, `[CRITICAL]`, `[MAJOR]`, `[MINOR]`, `[NITPICK]`).
   - Provide clear reasoning for your observations and, when applicable, suggest code snippets or alternative approaches to resolve the issue.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
