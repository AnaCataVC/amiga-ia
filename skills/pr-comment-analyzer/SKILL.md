---
name: pr-comment-analyzer
description: Analyzes code review comments left by other developers on an active Pull Request, extracting pending tasks, suggestions, and offering to reply.
params:
  pr_number: (Optional) The PR number to review. If not provided, it will analyze the PR associated with the current branch.
---

1. **Verify Author:** Verify that the author of the PR matches the current user invoking the skill.
2. **Verify Context:** Verify that we are operating in the correct local repository and branch corresponding to the PR.
3. **Extract Comments:** Use GitHub CLI (`gh pr view --comments`) or API to extract the review comments.
4. **Categorize:** Group the feedback into: Blocking (Requested Changes), Suggestions, and Open Questions.
5. **Action Plan:** Generate an actionable checklist to resolve the comments.
6. **Apply Code:** Offer the user the option to automatically apply any suggested code snippets to the local repository.
7. **Reply:** Offer the user the option to draft and submit replies to the comments directly from the terminal.
