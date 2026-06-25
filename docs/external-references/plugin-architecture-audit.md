> **Created:** 2026-06-25
> **Last Updated:** 2026-06-25

# Plugin Architecture Audit: Amiga IA

This document compares the current Amiga IA plugin structure against the official specifications for both **Antigravity (Gemini)** and **Claude Code**.

## 1. Antigravity (Gemini) — Official Plugin Specification

### Expected Structure
```text
plugins/<plugin-name>/
├── plugin.json          # Required: minimal manifest (name, description)
├── hooks.json           # Optional
├── mcp_config.json      # Optional
├── skills/              # Optional: auto-discovered SKILL.md files
│   └── <skill-name>/
│       └── SKILL.md
├── agents/              # Optional: subagent templates
└── rules/               # Optional: markdown rules
```

### Key Rules
- `plugin.json` is a **minimal manifest**: only `name` and `description` are needed. It does NOT list individual skills or agents — those are **auto-discovered** from subdirectories.
- Plugins are placed in `~/.gemini/config/plugins/<plugin-name>/`.
- Skills, agents, rules, and hooks are discovered automatically from their respective directories.

### Current Amiga IA Status (Root `plugin.json`)
```json
{
  "name": "amiga-ia",
  "version": "2.2.1",
  "description": "Universal declarative skills for agents",
  "skills": ["./skills/"],
  "agents": ["agents/ami-commit-assistant.md", ...],
  "hooks": "./hooks.json"
}
```

### Issues Found
1. **No issues.** The explicit `skills` and `agents` fields are required because auto-discovery does not work reliably in practice (verified empirically). The current structure is correct.

---

## 2. Claude Code — Official Plugin Specification

### Expected Structure
```text
plugin-root/
├── .claude-plugin/
│   └── plugin.json       # Required: plugin metadata (name, version, description)
├── skills/               # Auto-discovered (MUST be at plugin root, NOT inside .claude-plugin/)
├── agents/               # Auto-discovered
├── hooks/
│   └── hooks.json        # Hooks config (MUST be in hooks/ folder at plugin root)
├── commands/             # Optional: slash commands
├── .mcp.json             # Optional
└── README.md
```

### Key Rules
- `plugin.json` goes INSIDE `.claude-plugin/` — only the manifest belongs there.
- Skills, agents, commands MUST be at the plugin root, NOT inside `.claude-plugin/`.
- Hooks MUST be in a `hooks/hooks.json` file at the plugin root, NOT embedded inline in plugin.json.
- Claude Code auto-discovers skills, agents, and commands from standard directories.
- Use `${CLAUDE_PLUGIN_ROOT}` for portable script paths.

### Current Amiga IA Status (`.claude-plugin/plugin.json`)
```json
{
  "name": "amiga-ia",
  "version": "2.1.0",
  "description": "Universal declarative skills for agents",
  "skills": ["./skills/"],
  "agents": ["./agents/"],
  "hooks": { ... inline hooks ... }
}
```

### Issues Found (and Fixed)
1. **~~Version mismatch:~~** ✅ FIXED — Updated from `2.1.0` to `2.2.1` to match root `plugin.json`.
2. **~~Hooks embedded inline:~~** ✅ FIXED — Removed inline hooks from `.claude-plugin/plugin.json`. Created `hooks/hooks.json` at the plugin root per the Claude Code specification.
3. **Explicit fields are correct:** The `skills` and `agents` fields are required because auto-discovery does not work reliably in practice (verified empirically).

---

## 3. Summary Table

| Aspect | Antigravity | Claude Code | Status |
|---|---|---|---|
| Manifest location | `plugin.json` at root | `.claude-plugin/plugin.json` | ✅ Correct |
| Skills auto-discovery | Yes, from `skills/` subdir | Yes, from `skills/` at plugin root | ✅ Correct |
| Agents auto-discovery | Yes, from `agents/` subdir | Yes, from `agents/` at plugin root | ✅ Correct |
| Hooks location | `hooks.json` at plugin root | `hooks/hooks.json` at plugin root | ⚠️ Claude: inline hooks may not load |
| Version sync | N/A | `2.2.1` vs `2.1.0` | ❌ Out of sync |
| Extra fields in manifest | Ignored, harmless | Ignored, harmless | ⚠️ Unnecessary maintenance |

## 4. Sources
- Antigravity Plugin Docs: https://antigravity.google (official specification)
- Claude Code Plugin Docs: https://claude.com (official specification)
- Claude Plugin Hub: https://claudepluginhub.com
