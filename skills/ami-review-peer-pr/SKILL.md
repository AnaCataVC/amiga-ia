---
name: ami-review-peer-pr
description: Use ONLY when reviewing Pull Requests authored by OTHER PEOPLE (peer review). It focuses on generating code review observations with criticality levels and drafting review comments for teammates. If reviewing your OWN Pull Request or branch to apply local fixes before publishing, use ami-review-self-pr instead.
allowed-tools: Bash, Read, Grep
---

# Skill: PR Peer Reviewer

When invoked, act as a **PR Peer Reviewer**.

## Workflow

### 1. Context and Validation
- Identify the Pull Request to be reviewed.
- Verify that you are in the correct local repository. **CRITICAL:** You MUST check out the PR's branch locally using `gh pr checkout <number>` BEFORE performing any analysis. If you do not check out the PR's branch, you will analyze the wrong code.
- Identify the author of the PR. **CRITICAL:** The PR must belong to someone else. The author must NOT be the user currently invoking this skill. If you detect that the user is reviewing their own PR, branch, or code, **IMMEDIATELY STOP**, explain the difference between both skills, and recommend switching to **`ami-review-self-pr`** (which is explicitly designed to audit your own work and apply concrete fixes directly to your files instead of just leaving comments). Offer to execute `ami-review-self-pr` right away.

### 2. Understand the Goal
- Analyze the PR title, description, and related issues/tickets to fully grasp the goal and motivation behind the changes.
- Read available documentation in the repository (e.g., `README.md` and any other relevant `.md` docs) to gain context on the affected components.

### 3. Inspect Existing Reviews & Discussions
- Before analyzing the code deeply or formulating any judgment, inspect all existing peer reviews, approvals, change requests, and discussion comments on the PR:
  - Query existing review statuses and conversation threads via GitHub CLI:
    ```bash
    gh pr view <number> --json reviews,comments,reviewRequests
    ```
  - Fetch detailed inline code comments and threads:
    ```bash
    gh api repos/:owner/:repo/pulls/<number>/comments
    ```
- **Analyze Existing Peer Feedback:**
  - What have other reviewers (engineers, codeowners, automated bots) already flagged, requested, approved, or questioned?
  - Has the PR author already responded, provided context, or committed fixes addressing those concerns?
  - Are there unresolved debates, pending architectural questions, or contentious design choices?
- **Deduplication & Consensus Rules:**
  - **Avoid Redundancy:** Do NOT duplicate comments or re-flag issues already raised by other reviewers, unless explicitly corroborating an unaddressed `[BLOCKER]` / `[CRITICAL]` flaw or offering a concrete missing code solution.
  - **Factor Consensus into Verdict:** Incorporate the state of prior discussions into your assessment (e.g., verify if changes requested in earlier reviews were genuinely resolved in the latest commits).

### 4. Clarification and Interactive QA
- Before analyzing the code deeply, determine if you fully understand the PR's intent and architectural context.
- If there is any ambiguity or missing context, **ASK THE USER**. Ask as many questions as needed to ensure you completely understand the context, domain, and objective of the PR before proceeding. Wait for their answers.

### 5. Strict Code Analysis & Stack-Aware Evaluation
- Once all questions are answered and the context is clear, review the PR diff.
- **Stacked PR Awareness:** Check if the PR is an intermediate or top layer in a **Stacked PRs** sequence (by checking `baseRefName`).
  - If reviewing multiple dependent PRs in a stack, advise reviewing from the bottom up (foundational base PR first) to maintain structural context.
  - Ensure diff analysis is isolated **exclusively against the PR's direct parent branch (`baseRefName`)**, evaluating only incremental layer deltas without compounding changes from earlier layers.
- Observe **ONLY** the code that is introduced (added) or removed (deleted) in the PR. Avoid commenting on pre-existing code that is out of scope, unless it directly interacts with the new changes in a problematic way.
- Analyze the changes for code quality, potential bugs, edge cases, security, performance, and best practices.
- **Validate every path, not just the happy path.** Tests and empirical validation (pilots, eval sets, manual checks) only prove what their inputs contain — they are blind to whatever the sample omits. So reason beyond them:
  - **All execution paths.** Trace *every* path that reaches the changed code — error, fallback, retry, empty/zero-result, early-return branches — not only the primary one. Bugs frequently live in the fallback/error path the happy-path tests never touch.
  - **Data-flow of each input.** For every value the new code consumes: where does it originate? Does it survive a re-request/retry? Which pre-existing validation runs *before* the change, and does it therefore only guard the original or first element (e.g. `results[0]`) and not the candidate the new code selects? The bug is often the interaction between new code and a guard that no longer covers it.
  - **Future callers & de-facto vs enforced gating.** Ask "who else could trigger this tomorrow?" A behavior that is safe today only because a single caller feeds it (one country, one flag, one payload shape) is *de-facto* gated, not enforced in code. If the change alters returned data/state, require explicit opt-in per case rather than silent activation-by-payload.

### 6. Generate Quality Observations and Recommendation
- Output a comprehensive list of observations based on your analysis.
- For every observation, you MUST indicate its criticality level (e.g., `[BLOCKER]`, `[CRITICAL]`, `[MAJOR]`, `[MINOR]`, `[NITPICK]`).
- Provide clear reasoning for your observations and, when applicable, suggest code snippets or alternative approaches to resolve the issue.
- **Recommendation:** Based on your findings, clearly recommend to the user what the final verdict should be ("Approve", "Comment", or "Request Changes") and justify your recommendation.

### 7. Publishing the Review
- Wait for the user to confirm their final decision regarding the verdict.
- **CRITICAL:** Before preparing the final comments, **ASK THE USER** to confirm the desired **tone** (e.g., formal, friendly, constructive) and **language** (e.g., English, Spanish) for the actual PR comments.
- Once they decide on the verdict, tone, and language, **OFFER** to automatically upload the review directly to the PR (e.g., using GitHub CLI `gh pr review`).
- Give them the option to publish the issues found as **inline comments** on the specific lines of code, and/or leave a **global comment** detailing the verdict.

#### Pre-Publish Freshness Gate (Concurrency & Drift Check)
- **CRITICAL:** Before executing any remote review command (`gh pr review` or posting comments), perform an immediate live freshness check to prevent posting outdated feedback:
  1. **Check for Code Drift / New Commits:**
     - Query the remote PR head commit and fetch remote updates:
       ```bash
       gh pr view <number> --json headRefOid,updatedAt
       git fetch origin <pr-branch>
       ```
     - Compare the latest remote `headRefOid` against the commit SHA analyzed locally.
     - If new commits or a force-push occurred while drafting the review:
       - **HALT immediately.** Inform the user: "New commits have been pushed by the author since the review began (HEAD moved to `<new-sha>`)."
       - Diff the newly introduced changes against the analyzed commit:
         ```bash
         git diff <analyzed-sha>..<new-sha>
         ```
       - Check if the author's new commits already resolved your drafted observations, or introduced new defects.
       - Update your drafted comments accordingly and re-confirm the verdict with the user before publishing.
  2. **Check for Concurrent Peer Feedback / New Comments:**
     - Re-query latest PR reviews and comments:
       ```bash
       gh pr view <number> --json reviews,comments
       ```
     - Check if any new reviews (approvals, change requests) or comments were posted by teammates while your review was being prepared.
     - If new peer feedback arrived:
       - Inform the user of the new comments or status changes.
       - Check if the new feedback overlaps with or contradicts your drafted review.
       - Adjust your drafted comments with the user's approval.
  3. **Publish Execution:**
     - Only after verifying code freshness and confirming there are no conflicting concurrent updates, draft the comments according to the chosen tone and language, and execute the commands to publish the review.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
