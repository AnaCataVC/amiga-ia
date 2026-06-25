> **Created:** 2026-06-25
> **Last Updated:** 2026-06-25

# Plugin Architecture: Amiga IA

This document defines the official plugin architecture for **Amiga IA**, covering both supported AI platforms (Antigravity / Gemini and Claude Code) and both distribution methods (Native Plugin and NPM Wizard).

---

## 1. Overview

Amiga IA supports two mutually exclusive distribution methods:

| Method | Mechanism | Target Users |
|---|---|---|
| **Native Plugin Install** | The AI platform's built-in plugin manager installs the plugin from a registry or marketplace. Files remain immutable and are managed by the platform. | Users who want zero-friction setup and automatic updates. |
| **NPM Package + CLI Wizard** | `npm install -g @anacatavc/amiga-ia` followed by `amiga-ia-setup` physically copies skills, agents, and hooks into the user's local configuration directories. | Users who want to customize skills, commit them to version control, or audit instructions before execution. |

Both methods deliver the same set of skills and agents but through different mechanisms. The underlying Markdown files (`SKILL.md`, agent definitions) are identical regardless of how they are installed.

> [!CAUTION]
> **Users must choose ONE installation method, not both simultaneously.** Installing via both the native plugin system and the NPM wizard will result in duplicate skill name conflicts, because both methods register the same `ami-*` prefixed skills into the AI's runtime. The platform will reject or behave unpredictably when two skills share the same `name` identifier.

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
│   ├── ami-commit-assistant.md
│   ├── ami-push-assistant.md
│   └── ...
└── hooks.json           # Optional hooks (Antigravity ignores bash hooks in secure mode)
```

### Manifest (`plugin.json`)

The root `plugin.json` uses explicit `skills` and `agents` fields to declare all available resources:

```json
{
  "name": "amiga-ia",
  "version": "2.2.1",
  "description": "Universal declarative skills for agents",
  "skills": ["./skills/"],
  "agents": [
    "agents/ami-commit-assistant.md",
    "agents/ami-next-step-assistant.md",
    "agents/ami-pr-publisher.md",
    "agents/ami-push-assistant.md",
    "agents/ami-release-manager.md"
  ],
  "hooks": "./hooks.json"
}
```

> [!IMPORTANT]
> Auto-discovery of skills and agents does not work reliably in practice. This has been **verified empirically**. The explicit `skills` and `agents` arrays in `plugin.json` are required for the platform to correctly register all resources.

### Hooks Behavior

Antigravity ignores bash hooks when operating in **secure mode** (its default). The project's security model relies on its atomic pipeline instead: investigate → draft a plan (`implementation_plan.md`) → require human approval → execute → document.

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
│   ├── ami-commit-assistant.md
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

## 4. Why Two `hooks.json` Files?

The repository contains two separate `hooks.json` files with **identical** hook definitions. This is intentional — each file serves a different distribution path.

| File | Distribution Path | Consumed By |
|---|---|---|
| `hooks.json` (repo root) | **NPM Wizard** (`bin/setup.js`) | The CLI wizard reads this file and merges the hook definitions into the user's `~/.claude/settings.json` during installation. |
| `hooks/hooks.json` | **Claude Code Native Plugin** | Claude Code auto-discovers hooks from this path when the plugin is installed via the marketplace or `claude plugin install`. |

### Why Not Just One File?

The two systems look for hooks in fundamentally different locations:

- **The NPM wizard** operates at build/install time. It reads from the repository root (`hooks.json`) and physically writes the hook definitions into the user's global Claude settings file.
- **Claude Code's plugin system** operates at runtime. It expects hooks at `hooks/hooks.json` relative to the plugin root and loads them automatically.

Because these are two distinct consumption mechanisms with different path expectations, maintaining both files is the simplest and most reliable approach. Both files **must** be kept in sync when hook definitions change.

> [!WARNING]
> When modifying hook definitions, always update **both** `hooks.json` (root) and `hooks/hooks.json` simultaneously. Forgetting one will cause inconsistent behavior depending on the user's installation method.

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
3. Reads `hooks.json` from the package root and merges hook definitions into the user's `~/.claude/settings.json`.

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
| Antigravity ignores bash hooks in secure mode | Hook-based guardrails (e.g., commit/push interception) only work in Claude Code | Antigravity relies on its built-in planning pipeline for safety instead |
