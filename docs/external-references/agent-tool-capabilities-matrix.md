> **Created:** 2026-10-03
> **Last Updated:** 2026-10-06

# Cross-Platform Agent Tool Capabilities Matrix: Codex, Claude Code, and Antigravity / Gemini

## 1. Overview & Context

Multi-agent workflows in Amiga IA rely on specialized subagents invoked either in Claude Code (via terminal/agent CLI) or in Google Antigravity / Gemini CLI. While both platforms discover subagents through Markdown files with YAML frontmatter (`agents/*.md`), they use fundamentally different tool ecosystems, identifiers, and permission models.

Codex uses Agent Skills-compatible `SKILL.md` folders discovered under `.agents/skills/` or `~/.agents/skills/`. Its custom subagents use standalone TOML files under `.codex/agents/` or `~/.codex/agents/`, each requiring `name`, `description`, and `developer_instructions`. The setup build step copies canonical skill directories and converts canonical Markdown agent profiles into these TOML files in a package-owned staging directory, then installs them to Codex's user-level paths. Codex custom agents inherit the parent runtime configuration; Amiga IA does not translate the source `allowed-tools` list into a Codex permission boundary.

Current references: [Codex skills](https://developers.openai.com/codex/skills/), [Codex subagents](https://developers.openai.com/codex/subagents/), and [Codex hooks](https://developers.openai.com/codex/hooks/).

If an agent requires write access (creating, editing, or replacing files), relying on platform-specific tool identifiers causes silent failures or permission denials when running on the opposite platform.

---

## 2. Tool Vocabulary Comparison

| Abstract Capability | Claude Code (`~/.claude/agents/`) | Google Antigravity / Gemini (`~/.gemini/config/agents/`) | Codex (`~/.codex/agents/*.toml`) |
| :--- | :--- | :--- | :--- |
| **Read / Inspect** | `Read`, `Grep`, `Glob` | `view_file`, `grep_search`, `find_by_name`, `list_dir` | Inherited from parent runtime |
| **Write / Create** | `Write` | `write_to_file` | Inherited from parent runtime |
| **Edit / Modify** | `Edit` | `replace_file_content`, `multi_replace_file_content` | Inherited from parent runtime |
| **Shell / Commands** | `Bash` | `run_command`, `manage_task` | Inherited from parent runtime |
| **Web Search** | `WebSearch` | `search_web` | Inherited from parent runtime |
| **Web Fetch** | `WebFetch` | `read_url_content` | Inherited from parent runtime |
| **Subagents / Orchestration** | `Agent` | `invoke_subagent`, `send_message`, `define_subagent` | Codex multi-agent runtime |

Codex subagents are invoked through the Codex multi-agent runtime using the configured custom agent `name`; the TOML profile sets its instructions and optional runtime settings. It does not use the Markdown `allowed-tools` field as a standalone tool allowlist.

---

## 3. Platform Permission & Formatting Mechanics

### Claude Code Mechanics
- **Discovery Locations:** Global `~/.claude/agents/*.md` and project `.claude/agents/*.md`.
- **Frontmatter fields:**
  - `name`: (string, required) Unique identifier.
  - `description`: (string, required) Trigger summary.
  - `tools` / `allowed-tools`: Comma-separated list or YAML array of permitted tools (`Write`, `Edit`, `Bash`, `Read`, `Grep`, `Glob`, `WebSearch`, `WebFetch`, `Agent`).
  - `disallowedTools`: Optional denylist.
  - `model`: Optional model override (e.g. `sonnet`, `haiku`, `inherit`).
- **Enforcement:** Hard OS-level permission boundary. If `Write` or `Edit` is omitted or disallowed, tool calls fail or are suppressed.
- **Strictness:** Unknown tool names may be ignored, but omitting expected names leaves the subagent strictly read-only.

### Google Antigravity / Gemini Mechanics
- **Discovery Locations:** Global `~/.gemini/config/agents/*.md`, project `.agents/agents/*/agent.md` (or `.agent/`), and built-in configurations.
- **Frontmatter fields:**
  - `name`: (string, required) Unique identifier.
  - `description`: (string, required) Trigger summary.
  - `tools` / `allowed-tools`: Comma-separated list or YAML array of tool function identifiers (`write_to_file`, `replace_file_content`, `multi_replace_file_content`, `run_command`, `manage_task`, `view_file`, `grep_search`, `find_by_name`, `list_dir`, `search_web`, `read_url_content`, `invoke_subagent`, `send_message`).
  - `model`: Optional model specification (`inherit`, `flash`, `pro`, `flash_lite`).
- **Default Permissions:** Read tools (`view_file`, `list_dir`, `grep_search`, `find_by_name`) and communication (`send_message`) are granted by default.
- **Write Permissions:** Write tools (`write_to_file`, `replace_file_content`, `multi_replace_file_content`) are gated. Unless explicitly enumerated in `tools:` / `allowed-tools:`, subagents cannot modify the filesystem.
- **Programmatic subagents:** Defined via `define_subagent` with explicit boolean flags: `enable_write_tools: true`, `enable_subagent_tools: true`, `enable_mcp_tools: true`.

---

## 4. Current Amiga IA Audit (Subagents Writing Deficit)

| Agent | Current `allowed-tools:` | Actual Needs | Missing Write Permissions |
| :--- | :--- | :--- | :--- |
| `ami-cleanroom-builder` | `Bash, Read, Grep, Write, Edit` | Write source code | Antigravity names missing |
| `ami-cleanroom-tester` | `Bash, Read, Grep, Write, Edit` | Write test code | Antigravity names missing |
| `ami-data-scientist` | `Bash, Read, Grep, Edit, Write` | Write notebooks/scripts | Antigravity names missing |
| `ami-doc-architect` | `Bash, Read, Grep, WebSearch` | Write docs, sync learnings | **Antigravity write tools missing; Codex inherits parent runtime** |
| `ami-pr-publisher` | `Bash, Read, Grep` | Write PR templates, temp logs | Missing write tools |
| `ami-release-manager` | `Bash, Read, Edit, Write` | Bump versions, changelogs | Antigravity names missing |
| `ami-tech-lead` | `Bash, Read, Grep, WebSearch, search_web, WebFetch, read_url_content, invoke_subagent, Write, Edit` | Architecture specs, plans | Antigravity write tools missing |
| `ami-repo-auditor` | `Bash, Read, Grep` | Read-only audit (optional fixes) | Strictly read-only currently |
| `ami-push-assistant` | `Bash, Read, Grep` | Pre-push checks, git status | Strictly read-only currently |
| `ami-expert-council` | `Read, Agent, define_subagent, invoke_subagent, send_message` | Discussion & consensus | Read/debate only (intended) |
| `ami-pr-reviewer` | `Bash, Read, Grep, WebSearch` | Review & report | Read-only reviewer (intended) |

---

## 5. Architectural Translation Strategy (Option B)

To guarantee portability without manual double-entry or breaking Claude Code frontmatter validation:
1. **Canonical Capabilities Mapping:** Define a canonical mapping module (`adapters/capability_translator.js`).
2. **Setup Distribution Translation:** When `bin/setup.js` copies agents to:
   - `~/.claude/agents/`: Injects or normalizes tools to Claude Code format (`Write, Edit, Bash, Read, Grep, ...`).
   - `~/.gemini/config/agents/`: Injects or normalizes tools to Antigravity format (`write_to_file, replace_file_content, multi_replace_file_content, run_command, view_file, grep_search, ...`).
3. **Repository Source Contract:** Source files in `agents/*.md` retain standard `allowed-tools:`, augmented with either abstract capability tokens (e.g. `Write`, `Edit`, `Bash`, `Read`, `Grep`, `WebSearch`, `WebFetch`, `Agent`) validated by `bin/setup.js --doctor`.
4. **Diagnostic Integrity (`--doctor`):** Enhance the doctor to audit every agent's write capability and assert that installed environments have complete platform-specific tool sets.
