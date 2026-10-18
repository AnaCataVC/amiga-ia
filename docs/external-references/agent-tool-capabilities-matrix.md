> **Created:** 2026-10-03
> **Last Updated:** 2026-10-12


# Cross-Platform Agent Tool Capabilities Matrix: Codex, Claude Code, and Antigravity / Gemini

## 1. Overview & Context

Multi-agent workflows in Amiga IA rely on specialized subagents invoked either in Claude Code (via terminal/agent CLI) or in Google Antigravity / Gemini CLI. While both platforms discover subagents through Markdown files with YAML frontmatter (`agents/*.md`), they use fundamentally different tool ecosystems, identifiers, and permission models.

Codex uses Agent Skills-compatible `SKILL.md` folders discovered under `.agents/skills/` or `~/.agents/skills/`. Its custom subagents use standalone TOML files under `.codex/agents/` or `~/.codex/agents/`, each requiring `name`, `description`, and `developer_instructions`. The setup build step copies canonical skill directories and converts canonical Markdown agent profiles into these TOML files in a package-owned staging directory, then installs them to Codex's user-level paths. During conversion, skill references are validated and written with an installation placeholder; the setup wizard replaces it with the absolute skills directory for that user. Builds fail when an agent references a skill absent from the distributed catalog. Codex custom agents inherit the parent runtime configuration; Amiga IA does not translate the source `allowed-tools` list into a Codex permission boundary.

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

## 4. Amiga IA Agent Capabilities Inventory (13 Agents)

### 4.1. Write-Enabled Agents (`WRITE_ENABLED_AGENTS` — 8 Agents)

| Agent | Canonical `allowed-tools:` | Orchestration (`Agent`) | Codex TOML Sandbox | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| `ami-cleanroom-arbiter` | `Bash, Read, Grep, Agent, Write, Edit` | Yes | Inherited (Workspace-Write) | Freezes contracts, dispatches builder/tester, adjudicates test runs |
| `ami-cleanroom-builder` | `Bash, Read, Grep, Write, Edit` | No (Leaf worker) | Inherited (Workspace-Write) | Implements production code strictly from frozen contract |
| `ami-cleanroom-tester` | `Bash, Read, Grep, Write, Edit` | No (Leaf worker) | Inherited (Workspace-Write) | Generates black-box test suites strictly from frozen contract |
| `ami-data-scientist` | `Bash, Read, Grep, Agent, Write, Edit` | Yes | Inherited (Workspace-Write) | Orchestrates SQL optimization, EDA profiling, and dashboard generation |
| `ami-doc-architect` | `Bash, Read, Grep, WebSearch, Agent, Write, Edit` | Yes | Inherited (Workspace-Write) | Orchestrates documentation architecture, sync, and knowledge audits |
| `ami-pr-publisher` | `Bash, Read, Grep, Agent, Write, Edit` | Yes | Inherited (Workspace-Write) | Pre-publication PR orchestration, self-review fixes, and conflict checks |
| `ami-release-manager` | `Bash, Read, Write, Edit` | No | Inherited (Workspace-Write) | Semantic version bumping, bilingual release notes, and tag publishing |
| `ami-tech-lead` | `Bash, Read, Grep, WebSearch, WebFetch, Agent, Write, Edit` | Yes | Inherited (Workspace-Write) | Master greenfield/feature architecture and planning orchestrator |

### 4.2. Read-Only Agents (`READ_ONLY_AGENTS` — 5 Agents)

| Agent | Canonical `allowed-tools:` | Orchestration (`Agent`) | Codex TOML Sandbox | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| `ami-adversarial-verifier` | `Bash, Read, Grep` | No (Leaf verifier) | `sandbox_mode = "read-only"` | Zero-trust fresh-context falsification of implementation claims |
| `ami-expert-council` | `Read, Grep, WebSearch` | No (Single-pass) | `sandbox_mode = "read-only"` | Single-pass orthogonal trade-off and adversarial premortem evaluator |
| `ami-pr-reviewer` | `Bash, Read, Grep, WebSearch, Agent` | Yes | `sandbox_mode = "read-only"` | Peer/self PR review and comment analysis orchestrator |
| `ami-push-assistant` | `Bash, Read, Grep, Agent` | Yes | `sandbox_mode = "read-only"` | Pre-push quality gate and git consistency orchestrator |
| `ami-repo-auditor` | `Bash, Read, Grep, Agent` | Yes | `sandbox_mode = "read-only"` | Repository-wide technical debt, security, and dependency audit orchestrator |

---

## 5. Architectural Translation Strategy (Option B)

To guarantee portability without manual double-entry or breaking Claude Code frontmatter validation:
1. **Canonical Capabilities Mapping:** Define a canonical mapping module (`adapters/capability_translator.js`).
2. **Setup Distribution Translation:** When `bin/setup.js` copies agents to:
   - `~/.claude/agents/`: Injects or normalizes tools to Claude Code format (`Write, Edit, Bash, Read, Grep, ...`).
   - `~/.gemini/config/agents/`: Injects or normalizes tools to Antigravity format (`write_to_file, replace_file_content, multi_replace_file_content, run_command, view_file, grep_search, ...`).
3. **Repository Source Contract:** Source files in `agents/*.md` retain standard `allowed-tools:`, augmented with either abstract capability tokens (e.g. `Write`, `Edit`, `Bash`, `Read`, `Grep`, `WebSearch`, `WebFetch`, `Agent`) validated by `bin/setup.js --doctor`.
4. **Diagnostic Integrity (`--doctor`):** Enhance the doctor to audit every agent's write capability and assert that installed environments have complete platform-specific tool sets.

## 6. Observed Runtime Behavior: Antigravity CLI `invoke_subagent` vs. Named Markdown Subagents

### 6.1. Empirical Diagnostics & Root Cause Analysis

Detailed inspection of the Antigravity CLI binary (`agy.exe` v1.3.3) and cross-session subagent execution transcripts (over 110 recorded subagent invocations) reveals the exact operational mechanics of custom subagent tool resolution:

1. **Native YAML Struct vs. Allowed-Tools Identifier:**
   - The Go runtime in `agy` maps agent frontmatter into `CustomAgentConfig` via the struct tag `Tools yaml:"tools,omitempty"`.
   - Claude Code requires `allowed-tools:`, whereas Antigravity expects `tools:`.
   - However, even when `tools: [run_command, write_to_file, ...]` is properly formatted in `~/.gemini/config/agents/*.md`, the `invoke_subagent` execution pathway in `agy` defaults named subagent types (`ami-*`) to a **read-only sandbox baseline**.

2. **Default Tool Allocations on `invoke_subagent`:**
   | Subagent Invocation Target | Tools Granted by Runtime | Capability Level |
   | :--- | :--- | :--- |
   | `TypeName: 'self'` | `run_command`, `manage_task`, `write_to_file`, `replace_file_content`, `view_file`, `grep_search`, `search_web`, `read_url_content`, `invoke_subagent`, `send_message`, MCP | Full Read/Write & Shell Execution |
   | Dynamically registered via `define_subagent(enable_write_tools=true)` | `run_command`, `manage_task`, `write_to_file`, `replace_file_content`, `view_file`, `grep_search`, `search_web`, `read_url_content`, messaging, MCP | Full Read/Write & Shell Execution |
   | Statically discovered named type (e.g. `ami-push-assistant`, `ami-release-manager`, `ami-cleanroom-builder`) | `view_file`, `search_web`, `read_url_content`, `manage_task`, `send_message`, MCP | Strictly Read-Only (no `run_command`, no write tools) |

3. **Historical Continuity (Not a Version Regression):**
   - Transcripts across sessions establish that named `ami-*` agents never had native shell or write access in `agy`.
   - Past successful executions (such as Cleanroom TDD on October 3) succeeded solely because previous sessions applied an unstated mitigation: registering dynamic execution subagents via `define_subagent` with `enable_write_tools: true`.
   - This proves the limitation is an inherent architectural constraint of the current `agy` runtime, not a breaking regression introduced in v1.3.3.

---

## 7. Dual Execution Mitigation Protocol for Antigravity

For subagents and orchestrators that strictly require shell command execution (`run_command`) or filesystem write tools (`write_to_file`, `replace_file_content`):

### Pattern A: Dynamic Subagent Definition (`define_subagent`)
Dynamically register an execution-enabled subagent before invocation:
```json
// Tool Call: define_subagent
{
  "name": "<agent-name>-writer",
  "description": "Execution-enabled instance of <agent-name>",
  "system_prompt": "<Full markdown system prompt content from agents/<agent-name>.md>",
  "enable_write_tools": true,
  "enable_subagent_tools": true,
  "enable_mcp_tools": true
}
```
Then invoke via `invoke_subagent(TypeName="<agent-name>-writer")`.

### Pattern B: Archetype Cloning (`TypeName: 'self'`)
Delegate execution to a `self` subagent clone carrying the specific orchestrator's role, invariants, and prompt:
```json
// Tool Call: invoke_subagent
{
  "Subagents": [{
    "TypeName": "self",
    "Role": "Release Manager",
    "Prompt": "<Orchestrator task instructions, referencing agents/ami-release-manager.md guidelines>",
    "Workspace": "inherit"
  }]
}
```

### Contrast with Anthropic Claude Code & OpenAI Codex
- **Claude Code:** Strictly reads `allowed-tools:` from `~/.claude/agents/*.md` and enforces an OS-level allowlist. Named subagents invoked with `TypeName: "ami-push-assistant"` directly inherit `Bash`, `Write`, and `Edit` without needing `define_subagent` or `self`.
- **OpenAI Codex:** Custom subagents in `~/.codex/agents/*.toml` inherit the parent runtime environment configuration directly.

---

## 8. Distribution Translation Standard (Antigravity Parity)

To maintain maximum schema fidelity across platforms:
1. `adapters/capability_translator.js` must translate canonical `allowed-tools:` into `tools:` for Antigravity installations, matching official documentation specifications.
2. `bin/setup.js` must register all 8 write-enabled agents (`ami-cleanroom-arbiter.md`, `ami-cleanroom-builder.md`, `ami-cleanroom-tester.md`, `ami-data-scientist.md`, `ami-doc-architect.md`, `ami-pr-publisher.md`, `ami-release-manager.md`, `ami-tech-lead.md`) in `WRITE_MANDATORY_AGENTS`, and all 8 delegating orchestrators (`ami-cleanroom-arbiter.md`, `ami-data-scientist.md`, `ami-doc-architect.md`, `ami-pr-publisher.md`, `ami-pr-reviewer.md`, `ami-push-assistant.md`, `ami-repo-auditor.md`, `ami-tech-lead.md`) in `AGENT_DELEGATION_MANDATORY_AGENTS`.

