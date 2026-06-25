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
   
*The frontmatter configuration (`allowed-tools`) integrates into this hierarchy to sandbox the execution of specific Markdown commands.*

## Resolution
- All existing `.md` files in `agents/` and `skills/` have been updated to replace `tools:` with `allowed-tools:`.
- `GEMINI.md` was updated with a mandatory development rule to enforce this standard for all future agents created in this repository.
