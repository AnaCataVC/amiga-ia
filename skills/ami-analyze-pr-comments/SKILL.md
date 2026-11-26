---
name: ami-analyze-pr-comments
description: Analyzes code review comments left by other developers on an active Pull Request, extracting pending tasks, verifying fixes, and drafting concise, evidence-backed threaded replies.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: PR Comment Analyzer

Optional input: a PR number or PR link. Without one, target the PR of the current branch.

When invoked, act as a **PR Comment Analyst**.

## Workflow

### 1. Identify and Prepare Target PR
- **Determine PR:** Use `pr_number` or `pr_link` if provided; otherwise inspect `gh pr status` for the active branch's PR. If none exists, halt and ask the user for a PR number.
- **Checkout Branch:** If `git branch --show-current` already matches the PR branch, skip checkout; otherwise verify the working tree is clean before switching branches so uncommitted work is never overwritten.
- **Verify Ownership:** Compare `gh pr view <target> --json author` against `gh api user --jq .login`. If the PR belongs to someone else, warn the user and request explicit confirmation before proceeding.

### 2. Extract Comments & Cross-PR References
- Query both inline review threads (`gh api repos/{owner}/{repo}/pulls/{pr}/comments`, **no leading slash**) and general PR comments (`gh api repos/{owner}/{repo}/issues/{pr}/comments`), capturing content, file/diff hunk, `comment_id`, thread resolution status, and `user.login`.
- **Cross-PR Resolution:** Inspect timeline events (`gh api repos/{owner}/{repo}/issues/{pr}/timeline --paginate` for `cross-referenced`/`connected`, unless already supplied by an orchestrator). Comments stating `"moved to #N"` or `"fixed in #N"` are closed by `#N` — record them as informational notes citing `#N`, never under Blocking or Suggestions.
- **Bot Exclusion Invariant:** Ignore automated bot accounts (`[bot]` logins, `codecov`, `vercel`, `github-actions`, `dependabot`). Never categorize bot messages as conversational feedback, draft replies to bots, or `@`-tag bot handles; treat them strictly as read-only build/test signals.
- If no human review comments exist, inform the user and stop.

### 3. Categorize Feedback
- **Load Domain Context First:** Read referenced repository/service docs before judging applicability. If a reviewer's comment relies on outdated documentation that contradicts the code, state that clearly — resolve it by fixing the doc rather than breaking the code.
- Group human comments into:
  - **Blocking:** Defects or requirements that must be resolved before merging.
  - **Suggestions:** Recommended improvements or alternatives.
  - **Questions:** Items requiring user clarification or architectural decisions.
  - **Missing context (user only):** Comments you cannot evaluate due to missing domain/external context are **never** filed as `"not applicable"`; research first, and if the gap remains, leave the thread unanswered and report what is missing to the user.

### 4. Present Action Plan & Analyze Blast Radius
- Present a structured checklist for **Blocking** and **Suggestions**, plus pending **Questions**:
  - **Adjacent Caller Invariants:** Check all callers and adjacent functions before proposing reviewer-suggested null/type/contract changes so unmentioned callers do not break.
  - **Uncommented Alternative Branches:** Check whether an issue flagged on a primary branch also affects error, fallback, or retry paths.
- Offer to **Apply Code** locally and **Draft & Submit Replies**, then **wait for user approval** and answers before editing files or posting.

### 5. Execute Fixes, Stack Sync & Submit Replies
- **Apply & Verify Changes:** Apply approved fixes locally and immediately run fast local unit tests covering touched modules. Test runs can leave build/cache files (`*.tsbuildinfo`), so stage files **explicitly by name** after reading `git status` — never `git add -A` or `git add .`.
- **Neutralization Proof for Test Claims:** Whenever a reply claims a test covers a guard or branch, temporarily neutralize that guard, observe the test fail, and restore the guard before making the claim.
- **Stacked PR Restacking:** On intermediate Stacked PR branches (`gh stack` or Graphite `gt`), remind or offer to run `gh stack sync` or `gt restack` / `gt sync` after committing.
- **GATE 1 - Push Before Reply:** Every applied fix cited in a reply MUST be committed and pushed first (running the commit and push confirmation gates in `skills/ami-ship-change/SKILL.md`) so the remote branch carries the cited commit SHA before the reply is posted. Only fixes explicitly deferred by the user (tech debt, separate PR) may be answered without pushing first.
- **Draft & Submit Replies:**
  - **Concise Technical Structure (Zero Preamble):** Every technical reply MUST state concisely **what changed, in which commit SHA, and how it was verified** — with **zero** `"thanks"`, `"great catch"`, `"good point"`, or agreement preamble.
  - **Session-Verified Evidence Only:** Back every factual claim (numbers, equivalence, `"unreachable"`, cited paths) with a command, test, or query run in this session on versioned files the reviewer can open. **Never publish a reply admitting missing context** (`"I couldn't verify this"`, `"not sure how X works"`) — leave that thread unanswered and report the gap to the user.
  - **Mandatory Reviewer Tagging & Professional Register:** Open every reply (threaded or top-level) with `@<user.login>` from the comment's `user.login` (tag thread author plus every reviewer whose suggestion was adopted; never tag bots; state who will be notified before submitting). Reply in the review's human language using a strictly formal, technical tone with zero colloquialisms or slang (never `"bro"`, `"crack"`, `"amigo"`, `"cheers mate"`, `"onda"`, `"ok compa"`).
  - **Outgoing-Text Validation Gate:** Write each draft reply to a scratchpad file and run any outgoing-text validation script or writing skill mandated by repository or parent `CLAUDE.md` / `AGENTS.md` (including any configured disclosure header rules) until it exits `0`.
  - **CONFIRMATION 1 - Submit Replies:** STOP and present every draft reply, target thread ID/venue, cited commit SHA, and `@<username>` notifications. Await explicit user approval; replies cannot be unsent.
  - **Windows-Safe Threaded Submission:** Reply directly on the inline review thread via `gh api -X POST repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies -F body=@<file>` (**no leading slash** on `repos/...` for Windows Git Bash safety, and always `-F body=@<file>`, **never inline `-f`**). If blocked by sandbox/mode, provide the exact ready-to-paste command rather than downgrading to a top-level comment. Post a top-level comment (`gh pr comment <pr> --body-file <file>`) **only** when the review sits in `issues/{pr}/comments` with no inline `comment_id`.
- **Track Progress:** Check off items from the action plan as each is completed.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
