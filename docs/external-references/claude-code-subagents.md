> **Created:** 2026-06-26
> **Last Updated:** 2026-06-26

# Claude Code and Subagents Compatibility

> [!IMPORTANT]
> **Update (2026-07):** Claude Code now natively supports the `Agent` tool for spawning subagents (up to 5 levels deep). The `ami-expert-council` skill has been updated to reference both platforms' tools in its instructions. The core incompatibility documented below is now resolved.

## Findings regarding `define_subagent` and `invoke_subagent`

Based on official Anthropic documentation and community usage patterns, the tools `define_subagent` and `invoke_subagent` are **not** native, core features of the official Claude Code CLI out of the box.

- **Antigravity (Gemini)** natively supports the `define_subagent` and `invoke_subagent` API tools in its environment to dynamically orchestrate subagents with isolated context windows.
- **Claude Code** manages agents differently. While third-party integrations or community frameworks might map these tools to make them work, the standard, native approach in Claude Code for creating subagents is to persist them as Markdown files (with frontmatter) in `.claude/agents/*.md` or `~/.claude/agents/*.md`, and invoke them via its internal routing or the `/agents` command.

## Impact on `ami-expert-council`
The skill `ami-expert-council` explicitly instructs the AI to use the `define_subagent` and `invoke_subagent` tools. 
While this works perfectly in Antigravity, running this skill in a vanilla Claude Code environment will likely result in an error (e.g., tool not found) because Claude Code does not natively expose a tool named `define_subagent`.

To make the workflow truly 100% cross-compatible, it would require either:
1. An adapter or shim in Claude Code that provides the `define_subagent` tool natively.
2. Adapting the skill to instruct Claude Code to create physical `.md` files in `.claude/agents/` to define the subagents, instead of using a dynamic API tool call.
