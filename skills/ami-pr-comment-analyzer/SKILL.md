---
name: ami-pr-comment-analyzer
description: Analyzes code review comments left by other developers on an active Pull Request, extracting pending tasks, suggestions, and offering to reply.
params:
  pr_number: (Optional) The PR number to review. 
  pr_link: (Optional) The PR link to review.
---

## Workflow

1. **Identify and Prepare Target PR:**
   - **Determine PR:** If `pr_number` or `pr_link` is provided, use it as the target. If not, use the GitHub CLI (e.g., `gh pr status`) to find the active PR for the current branch. If no PR is associated with the current branch, halt and ask the user to provide a PR number.
   - **Checkout Branch:** Ensure the local workspace is on the correct branch for the target PR. Use `gh pr checkout <target>` to safely switch to the PR's branch and pull the latest changes.
   - **Verify Ownership:** Check the PR author. If the author does not appear to match the current user, warn them and ask for explicit confirmation before proceeding (since this skill is primarily designed for authors addressing their own reviews).

2. **Extract Comments:**
   - Use GitHub CLI or API to extract all review comments from the target PR.
   - If there are no comments, let the user know and terminate the skill.

3. **Categorize Feedback:**
   - Group the comments into three distinct categories:
     - **Blocking:** Issues that must be resolved before merging.
     - **Suggestions:** Recommended improvements or alternatives.
     - **Questions:** Items requiring user clarification or input.

4. **Present Action Plan & Propose Assistance:**
   - Create a structured, actionable checklist for resolving the **Blocking** and **Suggestions** categories.
   - For **Questions**, clearly list the items needing the user's answers or input.
   - Propose how you can assist with the resolution:
     - **Apply Code:** Offer to automatically apply any suggested code snippets or fixes to the local repository.
     - **Reply:** Offer to draft and submit replies to the comments.
   - **Wait for the user's input**, approval of the proposed actions, and answers to any pending questions before proceeding.

5. **Execute Actions:**
   - **Apply Changes:** Modify the local files to apply the approved code suggestions and fixes.
   - **Draft & Submit Replies:** Draft replies based on the applied fixes and the user's answers. If requested, present the drafts for review, or submit them directly using the GitHub CLI/API.
   - **Track Progress:** Check off items from the action plan as they are completed.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
