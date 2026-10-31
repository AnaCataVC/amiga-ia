> **Created:** 2026-06-25
> **Last Updated:** 2026-10-30

# Plugin Architecture Audit & UI Specification: Amiga IA

This document provides a comparative analysis of plugin and skill packaging across **Google Antigravity**, **Anthropic Claude Code**, and **OpenAI Codex**, detailing manifest schemas, UI presentation mechanics, and architectural trade-offs.

---

## 1. Google Antigravity — Plugin Architecture & UI Presentation

### 1.1. Directory Structure

A complete Antigravity plugin bundle resides in `~/.gemini/config/plugins/<plugin-name>/` (or workspace `.agents/plugins/<plugin-name>/`):

```text
plugins/<plugin-name>/
├── plugin.json          # Required: Plugin manifest (JSONC supported)
├── README.md            # User-facing documentation rendered in the "Overview" tab
├── assets/              # Visual assets
│   └── icon.png         # Plugin icon / avatar (or logo.svg)
├── skills/              # Bundled skills (auto-discovered SKILL.md files)
│   └── <skill-name>/
│       └── SKILL.md
├── agents/              # Bundled custom subagent profiles (*.md)
│   └── <agent-name>.md
├── rules/               # Plugin-scoped rules (always active when plugin is enabled)
│   └── AGENTS.md
├── hooks.json           # Optional: Lifecycle hooks scoped to the plugin
└── mcp_config.json      # Optional: MCP servers exposed by the plugin
```

### 1.2. UI Presentation Mechanics

When a user inspects a plugin in the Antigravity UI (Customizations / Plugins view):

| UI Element | Source in Plugin Bundle | Fallback Behavior if Missing |
| :--- | :--- | :--- |
| **Plugin Avatar / Icon** | `logo` property in `plugin.json` (e.g. `"assets/icon.png"`) | Renders a generic solid-color rounded square with the first letter of the plugin name (e.g., "A"). |
| **Plugin Title** | `displayName` in `plugin.json` | Falls back to `name`. |
| **Plugin Subtitle** | `description` in `plugin.json` | Left blank. |
| **Overview Tab** | **`README.md`** at the root of the plugin directory | **Completely blank / empty container** (matches the reported issue). |
| **Suggested Prompts** | `suggestedPrompts` array in `plugin.json` (max 3) | No starter prompt pills rendered. |
| **Skills & Agents Tabs** | Subdirectories `skills/` and `agents/` inside the plugin | The Language Server reports empty collections for unbundled items. |
| **Author & Links** | `author`, `homepage`, `repository` in `plugin.json` | Omitted from metadata card. |

### 1.3. Manifest Schema (`plugin.json`)

```json
{
  "name": "amiga-ia",
  "displayName": "Amiga IA",
  "version": "5.8.0",
  "description": "Amiga IA Universal Agent Skills & Subagents for Antigravity, Claude Code, and Codex",
  "logo": "assets/icon.png",
  "suggestedPrompts": [
    "Review uncommitted changes and organize conventional commits with ami-plan-commits",
    "Architect and plan a new feature with interactive guidance using ami-plan-feature",
    "Run double-blind cleanroom TDD with ami-orchestrate-cleanroom"
  ],
  "author": {
    "name": "Ana Catalina",
    "url": "https://ana-catalina.com"
  },
  "homepage": "https://amiga-ia.ana-catalina.com",
  "repository": "https://github.com/AnaCataVC/amiga-ia",
  "license": "MIT",
  "keywords": [
    "skills",
    "agents",
    "orchestrator",
    "git",
    "cleanroom",
    "antigravity"
  ]
}
```

---

## 2. Cross-Ecosystem Comparison: Should Amiga IA Install as Plugins in Claude Code or Codex?

### 2.1. Anthropic Claude Code

Claude Code supports two distribution models:
1. **Loose Global Customizations (Current Amiga IA implementation):**
   - Skills copied to `~/.claude/skills/<skill>/SKILL.md`
   - Agents copied to `~/.claude/agents/<agent>.md`
   - Rules merged into `~/.claude/CLAUDE.md`
   - Hooks merged into `~/.claude/settings.json`
2. **Claude Code Plugin Bundle (`.claude-plugin/plugin.json`):**
   - Plugin root containing `.claude-plugin/plugin.json`, `skills/`, `agents/`, `hooks/hooks.json`.
   - Installed via `/plugin install <plugin>` or `/plugin marketplace add <repo>`.

#### Trade-Off Analysis:
- **Pros of Claude Plugin:**
  - **Lifecycle Isolation:** Hooks are declared in `hooks/hooks.json` inside the plugin. They are activated and deactivated with the plugin, completely eliminating the need to merge/modify the user's personal `~/.claude/settings.json`.
  - **Single Toggle:** The user can enable or disable the entire suite with `/plugin disable amiga-ia`.
- **Cons / Risks of Claude Plugin:**
  - Requires Claude Code versions that support the plugin engine.
  - Adding a custom plugin from a local path or private registry requires extra user interaction or a registered marketplace manifest.
- **Verdict for Claude Code:** **Maintain dual readiness.** Keep the direct `amiga-ia-setup` file-based installation as the primary zero-dependency method for local developers, while maintaining `.claude-plugin/plugin.json` in the repository so users can optionally install it as a native Claude Code plugin.

---

### 2.2. OpenAI Codex

OpenAI Codex relies on the **Agent Skills open standard** (`SKILL.md` format) and standard home directory paths:
1. **Canonical Structure:**
   - Skills: `$CODEX_HOME/skills/` (or `~/.agents/skills/` - the cross-agent standard).
   - Agent profiles: `~/.codex/agents/*.toml` or prompt instructions.
   - Hooks: `~/.codex/hooks.json`.
   - Behavioral directives: `~/.codex/AGENTS.md`.
2. **Codex Plugins:**
   - Codex includes a `/plugins` manager, primarily intended for external service integrations, credentials, and MCP connectors.

#### Trade-Off Analysis:
- Codex already discovers skills from the universal `~/.agents/skills/` directory (Agent Skills specification).
- Wrapping skills in a proprietary `~/.codex/plugins/` structure provides no functional advantage over `~/.agents/skills/`, and sacrifices cross-agent interoperability (e.g. tools like Cursor or Codex reading the shared `~/.agents/skills/`).
- **Verdict for Codex:** **Keep current Agent Skills standard.** Retaining skills in `~/.agents/skills/` and agent profiles in `~/.codex/agents/` aligns with the open specification established across the ecosystem.

---

## 3. Ecosystem Architecture Matrix

| Platform | Recommended Distribution Format | Primary Directory | Plugin Manifest | Rich UI Supported |
| :--- | :--- | :--- | :--- | :--- |
| **Google Antigravity** | Native Plugin Bundle | `~/.gemini/config/plugins/amiga-ia/` | `plugin.json` | Yes (Overview tab via `README.md`, icon via `logo`, starter prompts via `suggestedPrompts`) |
| **Claude Code** | Hybrid: Loose Skills + Plugin-Ready | `~/.claude/skills/` & `~/.claude/agents/` | `.claude-plugin/plugin.json` | Basic CLI plugin manager (`/plugin`) |
| **OpenAI Codex** | Open Agent Skills Standard | `~/.agents/skills/` & `~/.codex/agents/` | `config.toml` | Terminal command interface (`/plugins`) |

---

## 4. Key Takeaways & Recommendations for Amiga IA

1. **Populate Antigravity Plugin UI Assets:**
   - Add `README.md` inside `plugins/amiga-ia/` during setup or build. This will instantly fill the empty "Overview" tab in the Antigravity UI with a rich presentation of capabilities, subagents, and workflows.
   - Bundle `icon.png` inside `plugins/amiga-ia/assets/icon.png` and reference it via `"logo": "assets/icon.png"` in `plugin.json` to replace the default letter "A".
   - Enrich `plugin.json` with `suggestedPrompts`, `author`, `homepage`, `repository`, and `keywords`.
2. **Bundle Skills inside the Antigravity Plugin:**
   - Mirror or copy `skills/` into `~/.gemini/config/plugins/amiga-ia/skills/` so that Antigravity's plugin inspector attributes the 23 skills directly to the Amiga IA plugin.
3. **Claude Code & Codex Strategy:**
   - Do not force pure plugin encapsulation on Claude Code and Codex yet. The loose standard (`~/.claude/skills/` and `~/.agents/skills/`) offers maximum portability, immediate execution, and zero marketplace friction.
