---
name: ami-session-summarizer
description: Summarizes the current AI coding session by reading the transcript and generating a structured Markdown report saved to docs/coding-sessions/.
allowed-tools: Bash, Read, Write, Grep
---

# Skill: Session Summarizer

When this skill is invoked (either by the user or by an agent), you must act as a Session Historian.

## Workflow

1. **Ensure Output Directory:**
   - Check if `docs/coding-sessions/` exists in the current project root.
   - If it does NOT exist:
     - Ask the user: "The folder `docs/coding-sessions/` doesn't exist yet. Would you like me to create it and add it to `.gitignore`?"
     - If approved, create the directory and append `docs/coding-sessions/` to the project's `.gitignore` file (create it if it doesn't exist).
   - If it already exists, proceed directly.

2. **Analyze Session Context:**
   - Review your own conversation history and context window.
   - You do NOT need to manually read or parse JSONL transcript files from the disk. Your internal memory of the ongoing conversation is sufficient.
   - Identify the key user prompts, the actions you performed, the files you modified, and the decisions made during the current session.
   - Check if you left some tasks pending or not completed during the session. If yes, include them in the summary.

3. **Synthesize Summary:**
   - Generate a structured Markdown document with the following format. Use the current date and time for the timestamp.

   ```markdown
   # Session Summary — YYYY-MM-DD HH:MM

   **Date:** YYYY-MM-DD HH:MM (timezone)

   ## Session Goal
   Brief description of what the user was trying to accomplish.

   ## Decisions Made
   - Bullet list of architectural, design, or technical decisions taken during the session.

   ## Files Changed
   - `path/to/file.ext` — Brief description of what changed
   - `path/to/new-file.ext` — [NEW] Brief description

   ## Pending Tasks
   - Any tasks that were mentioned but not completed.
   - Follow-up items the user or agent noted for later.

   ## Learnings
   - Patterns discovered, gotchas encountered, or knowledge gained.
   - Workarounds that were needed and why.
   ```

4. **Save:**
   - Generate the filename using the format: `YYYY-MM-DD_HH-MM_<short-slug>.md` where `<short-slug>` is a 2-4 word kebab-case summary of the session goal (e.g., `2026-06-17_09-00_session-summarizer-skill.md`).
   - Write the file to `docs/coding-sessions/`.

5. **Report:**
   - Output the full path of the saved file.
   - Show a brief 2-3 line summary of the session to the user.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
