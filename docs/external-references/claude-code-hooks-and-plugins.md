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

### CRITICAL FINDING: Hooks NOT Copied for Antigravity

The `setup.js` installer, when configuring Antigravity (option `a` or `b`):
1. ✅ Copies `plugin.json` to `~/.gemini/config/plugins/amiga-ia/`
2. ✅ Copies agents to `~/.gemini/config/plugins/amiga-ia/agents/`
3. ✅ Copies skills to `~/.gemini/config/skills/`
4. ❌ Does **NOT** copy `hooks.json` to the plugin directory

The `plugin.json` declares `"hooks": "./hooks.json"` but no `hooks.json` exists at `~/.gemini/config/plugins/amiga-ia/hooks.json`.

**Result**: Antigravity silently ignores the hooks reference because the file doesn't exist. This is a **silent failure** — no error is shown.

### How Antigravity Handles Plugin Hooks

According to documentation:
- Antigravity reads `hooks.json` from the plugin directory
- It does NOT merge them into any global `settings.json`
- Hooks are scoped to the plugin and active only when the plugin is enabled
- The system prompt confirms: "Antigravity ignores bash hooks in secure mode"

**Important**: Even if `hooks.json` were copied, Antigravity ignores bash hooks when running in secure/safe mode. The hooks in amiga-ia use `shell: "bash"` and rely on `jq` for parsing — these would likely be ignored by Antigravity regardless.

---

## 4. Summary of Bugs Found

| Bug | Affects | Root Cause |
|---|---|---|
| Hook accumulation (7 hooks instead of 3) | Claude Code | `mergeSettings()` deduplicates by exact command string; version changes create "new" hooks |
| `precheck.ps1` lost | Claude Code | JSON parse failure causes `mergeSettings()` to overwrite with empty object |
| `hooks.json` not installed for Antigravity | Antigravity | `setup.js` copies `plugin.json` but not `hooks.json` to the plugin directory |
| Hooks ignored in secure mode | Antigravity | Architectural — bash hooks don't run in Antigravity's secure mode |
