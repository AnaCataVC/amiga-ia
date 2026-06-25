> **Created:** 2026-06-25
> **Last Updated:** 2026-06-25

# Global Agents Directory Structure

## Context & Constraint
When configuring global subagents for Antigravity (Gemini), there is a strict architectural constraint regarding where the agent definition files must be placed. Global agents **cannot** be placed loosely in a root `agents/` directory inside the global configuration folder.

## Antigravity (Gemini)
To add custom agents globally, you must use the **Plugins** system. Subagents must be grouped within a specific plugin directory.

The required path structure is:
`~/.gemini/config/plugins/<plugin-name>/agents/`

### Example Hierarchy
```text
~/.gemini/config/
└── plugins/
    └── my-custom-plugin/
        ├── plugin.json       <-- Plugin configuration file
        └── agents/
            └── my_agent.md   <-- Agent definition file(s)
```

## Claude Code
In contrast, **Claude Code** natively supports placing agent definitions loosely in a global `agents` directory without requiring a plugin structure.

The valid path structure for Claude Code is simply:
`~/.claude/agents/`

## Summary of Global Customizations
- **Rules:** Appended to `~/.gemini/config/AGENTS.md`
- **Skills:** Placed in `~/.gemini/config/skills/`
- **Agents:** Grouped inside a plugin: `~/.gemini/config/plugins/<plugin-name>/agents/`

*Note: If an agent is only needed temporarily for a specific conversation, it can be created on-the-fly dynamically without needing to write physical global files using the plugin structure.*
