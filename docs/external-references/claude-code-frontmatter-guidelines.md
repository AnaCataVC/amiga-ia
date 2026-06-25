> **Created:** 2026-06-25
> **Last Updated:** 2026-06-25

# Claude Code Compatibility: `allowed-tools` vs `tools`

## Context & Decision
During the development of Agent Skills (Markdown definitions for subagents and skills), we initially used the generic YAML frontmatter property `tools:` to define what tools an agent had access to.

However, we discovered that this causes compatibility issues when these skills are loaded natively by **Claude Code**. To ensure universal portability and adhere to the principle of least privilege, we made the architectural decision to strictly use `allowed-tools:`.

## Research Findings
Using the `/ami-context-researcher` skill, we gathered the following technical constraints regarding Claude Code's architecture:

1. **Strict YAML Frontmatter Directive:** In Claude Code, `allowed-tools` is the official property used within the YAML frontmatter of custom skills or slash commands to restrict or define the toolset available to the agent during that specific task.
2. **Syntax and Granularity:** Tools can be specified generally or with granular constraints using the `ToolName(specifier)` format. For example, `Bash(npm run *)` allows the agent to run NPM scripts but blocks other arbitrary bash commands.
3. **Distinction from Global Permissions:** `allowed-tools` in the frontmatter is distinct from the persistent Permission System found in `settings.json` (which governs global allow/deny/ask rules for all sessions). `allowed-tools` acts as a *local configuration directive* for the specific skill/agent context.
4. **Hierarchy of Priority:** Claude Code evaluates rules based on a hierarchy:
   1. CLI Flags (`--allowedTools`)
   2. Local Settings (`.claude/settings.local.json`)
   3. Project Settings (`.claude/settings.json`)
   4. User Settings (`~/.claude/settings.json`)

## Extended Research: Agents, Skills & Frontmatter Guidelines

Further research using the `/ami-context-researcher` skill revealed critical structural and semantic constraints for Claude Code:

### 1. Skills vs. Subagents vs. Commands
Claude Code differentiates the file structures depending on the entity's purpose:
*   **Skills:** Reusable tasks and instructions. Must be placed in `.claude/skills/<name>/SKILL.md`.
*   **Subagents:** Specialized autonomous agents. Placed directly as `.claude/agents/<name>.md`.
*   **Legacy Commands:** Simple manual slash commands placed in `.claude/commands/<name>.md`.

### 2. Mandatory YAML Fields & Delegation
While `allowed-tools` controls permissions, two other fields are strictly mandatory for Claude Code to function properly:
*   **`name`**: Must be formatted in kebab-case (e.g., `ami-release-manager`) without spaces or special characters.
*   **`description`**: This is **critical for delegation**. Claude Code uses semantic search over these descriptions to decide *when* to autonomously spawn a subagent or trigger a skill. 
    *   *Gotcha:* The description should ideally be a single line to prevent YAML parsing errors, and must be highly actionable (e.g., "Analyzes open pull requests for conflicts").

### 3. Formatting Strictness
The YAML frontmatter MUST be the very first thing in the file, enclosed perfectly within `---` markers. If Claude Code fails to detect a skill, it is almost always due to malformed YAML (like multi-line descriptions breaking the parser).

## Resolution
- All existing `.md` files in `agents/` and `skills/` have been updated to replace `tools:` with `allowed-tools:`.
- `GEMINI.md` was updated with a mandatory development rule to enforce this standard for all future agents created in this repository.
