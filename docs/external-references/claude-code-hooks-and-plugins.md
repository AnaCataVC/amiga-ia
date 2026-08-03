> **Created:** 2026-07-23
> **Last Updated:** 2026-07-23

# Claude Code Hooks & Plugins — Reference for amiga-ia

## 1. Claude Code Hooks Architecture

Source: https://docs.anthropic.com/en/docs/claude-code/hooks

### Hook Locations (scope determines where hooks are defined)

| Location | Scope | Shareable |
|---|---|---|
| `~/.claude/settings.json` | All projects | No |
| `.claude/settings.json` | Single project | Yes (committed) |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Plugin `hooks/hooks.json` | When plugin is enabled | Yes (bundled) |
| Skill/agent frontmatter | While component is active | Yes |

### Key Schema Rules

- Hooks live inside a `"hooks"` key in `settings.json`
- Structure: `hooks -> EventName -> [MatcherGroup] -> hooks -> [HookHandler]`
- Supported events: `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, etc.
- Matchers: string or regex (e.g., `"Bash"`, `"Edit|Write"`, `"mcp__memory__.*"`)
- Hook types: `command`, `http`, `mcp_tool`, `prompt`, `agent`

### Deduplication (CRITICAL for amiga-ia)

> "All matching hooks run in parallel, and identical handlers are deduplicated automatically. Command hooks are deduplicated by command string and args, and HTTP hooks are deduplicated by URL."

This means Claude Code deduplicates **by exact `command` string**. If the command text changes between versions (e.g., from using `$CLAUDE_TOOL_ARGS` to `jq`), the dedup fails and both versions accumulate.

---

## 2. Claude Code Plugin Hooks

Source: https://docs.anthropic.com/en/docs/claude-code/plugins-reference

### Plugin Hook Location

- **File**: `hooks/hooks.json` in plugin root, or inline in `plugin.json`
- **Manifest field**: `"hooks": "./config/hooks.json"` (string, array, or inline object)

### Key Difference from settings.json hooks

When hooks are bundled **inside a plugin**, they are:
- Automatically loaded when the plugin is enabled
- Scoped to the plugin (no manual merge into `settings.json`)
- NOT merged into `~/.claude/settings.json` — they are separate

This means: **Plugin hooks do NOT need the `mergeSettings()` function in `setup.js`**. The `hooks/hooks.json` file in the plugin directory is read directly by Claude Code.

### Implication for amiga-ia

The current `setup.js` does TWO things for Claude Code:
1. Copies skills and agents to `~/.claude/skills/` and `~/.claude/agents/`
2. **Merges** hooks from `hooks.json` into `~/.claude/settings.json`

But this is the OLD approach. The modern Claude Code plugin system reads `hooks/hooks.json` from the plugin directory directly. The merge approach is fragile and causes the accumulation bug.

**Recommendation**: Consider migrating to the Claude Code plugin system (`.claude-plugin/plugin.json`) which would eliminate the need for manual hook merging entirely.

---

## 3. Antigravity Plugin Architecture

Source: Web search + actual installed files

### Plugin Location

- `~/.gemini/config/plugins/<plugin_name>/`
- Must contain `plugin.json` manifest

### Current amiga-ia plugin.json

```json
{
  "name": "amiga-ia",
  "version": "2.5.1",
  "description": "Universal declarative skills for agents",
  "skills": ["./skills/"],
  "agents": [...],
  "hooks": "./hooks.json"   // <-- References hooks.json
}
```

### Antigravity Hooks Architecture (Resolved)

Historically, the `setup.js` installer skipped hook installation for Antigravity because inline bash scripts are ignored in secure mode. 

**Current Solution**:
The setup wizard (`bin/setup.js`) now natively supports interactive installation of **Universal Node.js Hooks** for Antigravity:
1. ✅ Copies skills, agents, and rules directly to `~/.gemini/config/`
2. ✅ Prompts to install cross-platform Node.js hook scripts (`ami-pre-tool-use.js`, `ami-post-tool-use.js`) into `~/.gemini/config/hooks/`
3. ✅ Merges universal hook matchers (supporting Antigravity parameters like `CommandLine`, `TargetFile`, and `run_command`) into `~/.gemini/config/hooks.json`

### How Antigravity Handles Hooks

According to documentation and architectural testing:
- Antigravity reads global workspace hooks from `~/.gemini/config/hooks.json`
- While inline Bash commands are ignored in secure/safe mode, commands utilizing standard execution runtimes like `node` are fully supported
- Universal matchers trigger cleanly across both Claude Code and Antigravity tools

---

## 4. Summary of Bugs & Resolutions

| Bug / Challenge | Affects | Status / Root Cause | Resolution |
|---|---|---|---|
| Hook accumulation (7 hooks instead of 3) | Claude Code | Resolved | `mergeSettings()` cleans obsolete/duplicate Amiga IA hooks automatically |
| `precheck.ps1` lost on invalid JSON | Claude Code | Resolved | Aborts merge safely to preserve user configuration |
| `hooks.json` not installed for Antigravity | Antigravity | Resolved | Interactive wizard offers installing universal Node.js hooks directly into `~/.gemini/config/hooks.json` |
| Bash hooks ignored in secure mode | Antigravity | Resolved | Switched to cross-platform Node.js script execution which bypasses shell script restrictions |
