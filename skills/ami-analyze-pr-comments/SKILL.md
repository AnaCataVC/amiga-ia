---
name: ami-analyze-pr-comments
description: Analyzes code review comments left by other developers on an active Pull Request, extracting pending tasks, suggestions, and offering to reply.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: PR Comment Analyzer

Optional input: a PR number or PR link. Without one, target the PR of the current branch.

When invoked, act as a **PR Comment Analyst**.

## Workflow

### 1. Identify and Prepare Target PR
- **Determine PR:** If `pr_number` or `pr_link` is provided, use it as the target. If not, use the GitHub CLI (e.g., `gh pr status`) to find the active PR for the current branch. If no PR is associated with the current branch, halt and ask the user to provide a PR number.
- **Checkout Branch:** Ensure the local workspace is on the correct branch for the target PR. If the current local branch (`git branch --show-current`) already matches the target PR branch, avoid redundant checkouts. If switching branches is required, verify that the working tree is clean first to prevent overwriting uncommitted work.
- **Verify Ownership:** Check the PR author. If the author does not appear to match the current user, warn them and ask for explicit confirmation before proceeding (since this skill is primarily designed for authors addressing their own reviews).

### 2. Extract Comments
- Use GitHub CLI or API to extract all review comments from the target PR, capturing comment content, location (file and diff hunk), thread IDs, resolution status, and the reviewer's username (`author.login`).
- **Bot Exclusion Invariant:** Automatically identify and ignore automated bot comments (e.g., accounts ending with `[bot]`, `codecov`, `vercel`, `github-actions`, `dependabot`). Do NOT draft replies to bots and NEVER tag a bot handle (`@...[bot]`). Treat automated bot reports strictly as read-only build/test signals if relevant, never as conversational review feedback.
- **Cross-PR comments:** a comment saying "this moved to #N" or "fixed in #N" is closed by another PR, not a pending task. Record it as an informational note citing #N, never under Blocking or Suggestions.
- If there are no human comments, let the user know and terminate the skill.

### 3. Categorize Feedback
- **Load domain context before judging applicability:** a reviewer's comment often rests on context from another repository or service docs you have not read; read them first. If that documentation contradicts the code, say so — a comment based on an outdated doc is resolved by fixing the doc, not the code.
- Group the comments into these categories:
  - **Blocking:** Issues that must be resolved before merging.
  - **Suggestions:** Recommended improvements or alternatives.
  - **Questions:** Items requiring user clarification or input.
  - **Missing context (user only):** a comment you cannot judge for lack of context is not "not applicable" — filing it there silently drops something that may break downstream. Look the context up first; if the gap remains, leave the thread unanswered and tell the user what is missing.

### 4. Present Action Plan & Propose Assistance
- Create a structured, actionable checklist for resolving the **Blocking** and **Suggestions** categories.
- **Analyze Suggestion Blast Radius:**
  - **Adjacent Caller Invariants:** Before proposing or applying a fix suggested by a reviewer (e.g., handling nulls or altering return types), analyze adjacent callers and functions to ensure the fix does not break unmentioned contracts.
  - **Uncommented Alternative Branches:** Check if reviewer comments on primary branches reveal issues that also impact error, fallback, or retry branches that were not explicitly cited.
- For **Questions**, clearly list the items needing the user's answers or input.
- Propose how you can assist with the resolution:
  - **Apply Code:** Offer to automatically apply any suggested code snippets or fixes to the local repository.
  - **Reply:** Offer to draft and submit replies to the comments.
- **Wait for the user's input**, approval of the proposed actions, and answers to any pending questions before proceeding.

### 5. Execute Actions & Stack Synchronization
- **Apply Changes:** Modify the local files to apply the approved code suggestions and fixes.
- **Run the cheap tests right away:** if the repo has a fast unit test suite with no external services covering the touched modules, run it after applying the fix instead of deferring to push-time hooks. Test runs leave artifacts (build info, caches), so stage files by name after reading `git status`, never `git add -A` or `git add .`.
- **Stacked PR Restacking:** If the current branch is an intermediate layer in a **Stacked PRs** hierarchy (e.g., managed via `gh stack` or Graphite `gt`), remind the user (or offer) to execute the appropriate stack resync command (`gh stack sync` or `gt restack` / `gt sync`) after committing fixes, ensuring clean cascading rebases across dependent upper layers without introducing phantom conflicts.
- **Push before reply:** a reply describing a fix is a claim about the remote branch. Every applied fix cited in a reply must be committed and pushed before the reply is submitted; only fixes the user explicitly deferred (tech debt, a separate PR) may be answered without a preceding push.
- **Draft & Submit Replies:**
  - Draft replies based on the applied fixes and the user's answers.
  - **Evidence-backed claims:** every factual claim in a reply (a number, an equivalence, "unreachable", "same mechanism as X") comes from a command, test or query run this session, never from memory; every file cited must be versioned where the reviewer can open it.
  - **Never publish a reply admitting you did not understand the context** ("I couldn't verify this", "not sure how X works"). Leave that thread unanswered and report the gap to the user instead.
  - **Mandatory Reviewer Tagging:** Explicitly tag the human reviewer being answered at the beginning of each reply using their GitHub handle (e.g., `@<username>`), taken from the comment's own `user.login` — never guessed from a display name. State who each reply will notify before submitting.
  - **Multi-Reviewer Thread Invariant:** If multiple human reviewers participated in the same thread, tag the original thread author and any reviewer whose specific suggestion was adopted (e.g., `@reviewerA @reviewerB`). Never tag bot accounts.
  - **Professional Tone Invariant (Anti-Colloquialism Policy):** All drafted replies MUST maintain a strictly professional, respectful, concise, and technical tone in any human language (English, Spanish, etc.). Strictly avoid informal colloquialisms, slang, casual greetings, or casual fillers (e.g., do not use terms like "bro", "crack", "amigo", "cheers mate", "onda", "genial crack", "ok compa", or similar informal phrasing), regardless of whether the reviewer phrased their comment informally.
  - **Language Alignment:** Reply in the same human language (e.g., Spanish if the review was conducted in Spanish, English if in English), while strictly maintaining the professional technical register specified above.
  - **CONFIRMATION 1 - Submit replies:** STOP and present every draft reply, its target thread, and who it will notify to the user. Await explicit approval. Replies cannot be unsent.
  - **Post threaded, not top-level:** reply on the review comment's thread (e.g. `POST repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies`, body read from a file). If the call is blocked, hand the user a ready-to-paste command rather than downgrading to a top-level comment. Exception: a review left as a plain issue comment has no thread, so a top-level comment is the correct venue.
- **Track Progress:** Check off items from the action plan as they are completed.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
