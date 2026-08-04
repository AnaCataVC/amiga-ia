> **Created:** 2026-06-25
> **Last Updated:** 2026-08-04

# Architecture & Distribution: Amiga IA

This document defines the official architecture and distribution model for **Amiga IA**, covering both supported AI platforms (Antigravity / Gemini and Claude Code).

> [!NOTE]
> **Architectural Decision (ADR-001):** Native plugin manifests (`plugin.json` / `.claude-plugin/plugin.json`) have been deprecated in favor of **Unified NPM Distribution (`npx @anacatavc/amiga-ia-setup`)**. See [ADR-001](../adr/001-unified-npm-distribution.md) for full details.

---

## 1. Overview

Amiga IA is distributed exclusively as an NPM package featuring an interactive setup wizard and diagnostic suite:

| Method | Mechanism | Target Environments |
|---|---|---|
| **NPM Package + CLI Wizard** | `npm install -g @anacatavc/amiga-ia` followed by `amiga-ia-setup` physically copies skills, agents, and hooks into standard assistant configuration directories. | Claude Code (`~/.claude/`) and Antigravity (`~/.gemini/config/`). |

The underlying Markdown files (`SKILL.md`, agent definitions) are loaded dynamically by each platform using **XML Lazy Loading (`universal_adapter.js`)**.

---

## 2. Antigravity (Gemini) Plugin Structure

When installed as a native plugin, the expected location is:

```
~/.gemini/config/plugins/amiga-ia/
```

### Directory Layout

```text
~/.gemini/config/plugins/amiga-ia/
├── plugin.json          # Manifest: name, version, description, skills[], agents[], hooks
├── skills/              # Skill directories, each containing a SKILL.md
│   ├── ami-commit-planner/
│   │   └── SKILL.md
│   ├── ami-quick-reviewer/
│   │   └── SKILL.md
│   └── ...
├── agents/              # Subagent definitions (.md files)
│   ├── ami-push-assistant.md
│   ├── ami-release-manager.md
│   └── ...
└── hooks.json           # Optional hooks (Antigravity uses universal Node.js scripts)
```

### Manifest (`plugin.json`)

The root `plugin.json` uses explicit `skills` and `agents` fields to declare all available resources:

```json
{
  "name": "amiga-ia",
  "version": "2.7.1",
  "description": "Universal declarative skills for agents",
  "skills": ["./skills/"],
  "agents": [
    "./agents/ami-doc-architect.md",
    "./agents/ami-expert-council.md",
    "./agents/ami-next-step-assistant.md",
    "./agents/ami-pr-publisher.md",
    "./agents/ami-pr-reviewer.md",
    "./agents/ami-push-assistant.md",
    "./agents/ami-release-manager.md",
    "./agents/ami-repo-auditor.md"
  ],
  "hooks": "./hooks.json"
}
```

> [!IMPORTANT]
> Auto-discovery of skills and agents does not work reliably in practice. This has been **verified empirically**. The explicit `skills` and `agents` arrays in `plugin.json` are required for the platform to correctly register all resources.

### Hooks Behavior

While Antigravity ignores inline bash hooks when operating in **secure mode** (its default), universal Node.js execution hooks (`hooks/scripts/*.js`) are fully supported across both Antigravity and Claude Code. Additionally, the project's security model relies on its atomic pipeline: investigate → draft a plan (`implementation_plan.md`) → require human approval → execute → document.

---

## 3. Claude Code Plugin Structure

Claude Code uses a different layout convention. The manifest lives inside a `.claude-plugin/` directory, while skills and agents remain at the repository root.

### Directory Layout

```text
<repo-root>/
├── .claude-plugin/
│   ├── plugin.json         # Manifest: name, version, description, skills[], agents[]
│   └── marketplace.json    # Marketplace registry metadata
├── skills/                 # At repo root, NOT inside .claude-plugin/
│   ├── ami-commit-planner/
│   │   └── SKILL.md
│   └── ...
├── agents/                 # At repo root, NOT inside .claude-plugin/
│   ├── ami-push-assistant.md
│   └── ...
└── hooks/
    └── hooks.json          # Hooks in separate directory, NOT inline in plugin.json
```

### Key Rules

1. **Never place skills or agents inside `.claude-plugin/`.** Only the manifest (`plugin.json`) and marketplace metadata (`marketplace.json`) belong there. Skills and agents must be at the plugin root so Claude Code can discover them.
2. **Hooks must be in `hooks/hooks.json`**, not embedded inline in `plugin.json`. Claude Code expects hooks at this specific path for native plugin installations.
3. **Use `${CLAUDE_PLUGIN_ROOT}`** for portable script paths in hook commands. This variable resolves to the plugin's installation root at runtime, ensuring hooks work regardless of where the plugin is installed on disk.

### Manifest (`.claude-plugin/plugin.json`)

```json
{
  "name": "amiga-ia",
  "version": "2.2.1",
  "description": "Universal declarative skills for agents",
  "skills": ["./skills/"],
  "agents": ["./agents/"]
}
```

### Marketplace Registry (`.claude-plugin/marketplace.json`)

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "amiga-ia",
  "description": "Amiga IA: The Declarative AI Assistant framework for Claude Code and Antigravity.",
  "owner": {
    "name": "AnaCataVC",
    "url": "https://github.com/AnaCataVC"
  },
  "plugins": [
    {
      "name": "amiga-ia",
      "description": "Universal declarative skills and agents for your AI assistant.",
      "source": "./",
      "category": "productivity"
    }
  ]
}
```

---

## 4. Multi-Engine Hooks Architecture

The repository supports distinct hook execution engines to ensure seamless guardrail enforcement across diverse operating systems and developer environments.

| File / Folder | Engine / Distribution Path | Consumed By / Description |
|---|---|---|
| `hooks.json` (repo root) | **Bash Engine (Default / POSIX)** | Standard bash-driven hooks utilizing `jq`. Merged into `~/.claude/settings.json` via the setup wizard. |
| `hooks-pwsh.json` | **PowerShell Engine (Windows / Pwsh)** | Configures lightweight parameter-driven executions (`pwsh -File ./hooks/scripts/ami-hooks.ps1 -Event PreToolUse`). Replaced legacy inline commands (ADR-004) to prevent Windows deduplication bugs and cut hook token overhead from ~200 to ~15 tokens per command. |
| `hooks/scripts/ami-hooks.ps1` | **Externalized PowerShell Runtime Script** | Unified execution script handling PowerShell event interceptions with defensive `try/catch` logic and `ConvertFrom-Json` regex fallbacks without requiring WSL or Unix binaries. |
| `hooks/scripts/ami-*.js` | **Universal Node.js Engine (Cross-Platform)** | Zero-dependency Node.js execution scripts that run reliably across Windows, macOS, and Linux without external binaries. |
| `hooks/hooks.json` | **Claude Code Native Plugin Discovery** | Claude Code auto-discovers hooks from this path at runtime when installed natively as a plugin. |

### Why Multiple Engine Files?

Different development environments present varied dependency constraints:
- **POSIX environments (macOS/Linux)** thrive on lightweight shell execution (`Bash`).
- **Windows native environments** frequently lack `bash` or `jq` in normal paths, requiring native `PowerShell` execution (`pwsh`). To prevent string-matching deduplication bugs, PowerShell execution relies on the unified external script `ami-hooks.ps1`.
- **Universal JavaScript execution** via `node` provides an absolute fallback guarantee for cross-platform workflows.

> [!WARNING]
> When modifying hook logic or definitions, always ensure operational consistency across `hooks.json`, `hooks-pwsh.json`, `hooks/scripts/` (both `.js` wrappers and `ami-hooks.ps1`), and `hooks/hooks.json` simultaneously.

---

## 5. NPM Wizard Distribution (Alternative)

The NPM wizard is the alternative to native plugin installation. It is designed for users who want full ownership and customization of their AI skills.

### Installation

```bash
npm install -g @anacatavc/amiga-ia
amiga-ia-setup
```

### How It Works

The `amiga-ia-setup` command launches an interactive CLI wizard (`bin/setup.js`) that:

1. Detects which AI platforms are available on the user's machine (Antigravity, Claude Code, or both).
2. Physically copies skill directories (`skills/*/SKILL.md`) and agent files (`agents/*.md`) into the appropriate configuration folders:
   - Antigravity: `~/.gemini/config/skills/` and `~/.gemini/config/agents/`
   - Claude Code: `~/.claude/skills/` and `~/.claude/agents/`
3. Prompts the user to interactively choose their preferred hook engine (Bash, native PowerShell, or universal Node.js scripts), and cleanly merges the selected configuration into `~/.claude/settings.json`.

### Why Physical Copy Instead of Symlinks?

The wizard uses physical file copy (not symlinks) to avoid permission issues on Windows, where creating symbolic links requires elevated privileges or developer mode to be enabled. This ensures a frictionless installation experience across all operating systems.

### Key Advantage

Once copied, the files belong to the user. They can freely edit `SKILL.md` instructions to match their team's conventions, commit the customized skills to their own repository, and version-control the AI's behavior alongside their codebase.

---

## 6. Known Constraints

| Constraint | Impact | Mitigation |
|---|---|---|
| Auto-discovery of skills/agents does not work reliably | Skills may silently fail to register if not listed explicitly | Always use explicit `skills[]` and `agents[]` arrays in `plugin.json` |
| Dual installation causes duplicate name errors | The AI platform rejects or behaves unpredictably with two skills sharing the same `ami-*` name | Users must choose either native plugin OR NPM wizard, never both |
| Version sync between manifests is manual | `.claude-plugin/plugin.json` and root `plugin.json` can drift out of sync | Manually verify both files match before each release |
| Hooks sync between files is manual | `hooks.json` (root) and `hooks/hooks.json` can diverge | Update both files simultaneously when changing hook definitions |
| Antigravity ignores inline bash hooks in secure mode | Bash-based hooks do not execute in Antigravity | Use the recommended universal Node.js hook engine during setup which works across both Claude Code and Antigravity |
