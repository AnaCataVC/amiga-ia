# Antigravity Native Tool Vocabulary Reference

This reference documents the exact native tool function identifiers recognized by the Google Antigravity (AGY) runtime. When scaffolding `.agents/agents/<name>.md` or `.agents/skills/<name>/SKILL.md` for Antigravity, use these precise identifiers instead of generic or abstract terms.

## Tool Mapping Matrix

| Abstract Capability | Antigravity Native Identifiers | Notes |
|---|---|---|
| **Read / Inspect** | `view_file` | Reads file content. Read capabilities are available by default to subagents. |
| **Grep / Search** | `grep_search` | Regular expression search across file contents. |
| **Find Files** | `find_by_name` | Finds files matching glob or substring patterns. |
| **List Directory** | `list_dir` | Lists entries within a folder. |
| **Write / Create** | `write_to_file` | Creates a new file. Requires explicit tool permission. |
| **Edit / Modify** | `replace_file_content`, `multi_replace_file_content` | Edits targeted sections of existing files. |
| **Shell Commands** | `run_command`, `manage_task` | Executes terminal commands or manages background processes. |
| **Web Search** | `search_web` | Searches the web. |
| **Web Fetch** | `read_url_content` | Retrieves web page contents. |
| **Subagents** | `invoke_subagent`, `send_message`, `define_subagent` | Launches subagents or passes inter-agent messages. |

## Antigravity YAML Formatting Standard

In `.agents/agents/<name>.md`, declare tools as a YAML list or comma-separated string under `tools:`:

```markdown
---
name: <repo>-<noun>
description: <Role trigger description under 50 words>
tools:
  - view_file
  - grep_search
  - find_by_name
  - list_dir
---
```
