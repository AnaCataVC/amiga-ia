# Contributing to Amiga IA

Thank you for your interest in contributing to **Amiga IA**! This guide will walk you through the project structure, explain how things work under the hood, and help you get up and running quickly.

Amiga IA is an NPM package that distributes declarative AI skills and agents for **Antigravity (Gemini)** and **Claude Code**. Contributions — whether new skills, bug fixes, or documentation improvements — are all welcome.

---

## 1. Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)

### Setup

```bash
git clone https://github.com/AnaCataVC/amiga-ia.git
cd amiga-ia
npm install
```

### Project Structure

```text
amiga-ia/
├── skills/*/SKILL.md              # Declarative skill definitions (one per directory)
├── agents/*.md                    # Subagent profiles (Markdown with YAML frontmatter)
├── adapters/universal_adapter.js  # Generates XML catalog for AI lazy loading
├── bin/setup.js                   # Interactive CLI wizard for installation
├── plugin.json                    # Antigravity plugin manifest
├── .claude-plugin/                # Claude Code plugin manifest
├── hooks.json                     # Hooks for the NPM wizard installation method
├── hooks/hooks.json               # Hooks for the Claude Code plugin installation method
├── docs/                          # Long-term memory, ADRs, and project documentation
└── package.json                   # NPM package definition
```

- **`skills/`** — Each subdirectory contains a `SKILL.md` file that defines a single skill using YAML frontmatter and imperative Markdown instructions.
- **`agents/`** — Each `.md` file defines a subagent's persona, rules, and workflow.
- **`adapters/universal_adapter.js`** — Scans skills/agents and builds an XML index injected into the AI's system prompt.
- **`bin/setup.js`** — The `amiga-ia-setup` CLI command that physically copies files to the user's local AI configuration folders.
- **`plugin.json`** — The Antigravity plugin manifest listing skills, agents, and hooks.
- **`.claude-plugin/`** — The Claude Code plugin manifest for native plugin discovery.
- **`hooks.json`** — Hook definitions used when installing via the NPM wizard method.
- **`hooks/hooks.json`** — Hook definitions used when installing via the Claude Code plugin method.

---

## 2. Creating a New Skill

### Naming Convention

All skills **must** use the `ami-` prefix in their folder name. For example, if you are creating a skill called "my-skill", the directory should be `skills/ami-my-skill/`.

### File Structure

Create a new directory with a `SKILL.md` file inside:

```text
skills/ami-my-skill/
└── SKILL.md
```

### SKILL.md Format

The file must start with a YAML frontmatter block, followed by the skill's instructions in Markdown:

```markdown
---
name: ami-my-skill
description: A brief description of what this skill does.
allowed-tools: Bash, Read, Grep
---

# Skill: My Skill

When this skill is invoked, you must...

## Workflow

1. **Step One:** Do this.
2. **Step Two:** Then do that.
3. **Report:** Output the results.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
```

### Key Rules

| Field | Required | Notes |
|-------|----------|-------|
| `name` | ✅ | Must match the directory name and use the `ami-` prefix. |
| `description` | ✅ | A concise, single-line description of the skill's purpose. |
| `allowed-tools` | ✅ | Declares tool permissions. Use `allowed-tools`, **not** `tools`, to ensure native compatibility with Claude Code. |

> [!IMPORTANT]
> Every skill file **must** end with the language rule block:
> ```
> ---
> **Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
> ```

---

## 3. Creating a New Agent

### Naming Convention

Like skills, all agents **must** use the `ami-` prefix in their filename. For example: `agents/ami-my-agent.md`.

### Agent File Format

Agent files follow the same YAML frontmatter pattern as skills:

```markdown
---
name: ami-my-agent
description: A brief description of what this agent does.
allowed-tools: Bash, Read, Grep
---

# Role: My Agent

You are a specialized sub-agent responsible for...

## Core Rules

1. **Rule One:** ...
2. **Rule Two:** ...

## Workflow

1. **Step One:** ...
2. **Step Two:** ...

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
```

### Registering the Agent

> [!WARNING]
> Auto-discovery does **not** work for agents. You must manually register the agent in the root `plugin.json` file by adding its path to the `agents` array:

```json
{
  "agents": [
    "agents/ami-commit-assistant.md",
    "agents/ami-my-agent.md"
  ]
}
```

If you skip this step, the agent will exist in the repository but will not be discovered by Antigravity.

---

## 4. How the Universal Adapter Works

The file `adapters/universal_adapter.js` is the bridge between the Markdown-based skill/agent definitions and the AI runtime.

### What It Does

1. **Scans directories** — It recursively walks `skills/` and `agents/`, looking for `SKILL.md` and `.md` files.
2. **Extracts frontmatter** — For each file found, it parses the YAML frontmatter to extract the `name` and `description` fields.
3. **Generates an XML index** — It compiles all discovered skills and agents into an `<available_skills>` XML block.
4. **Injects into the system prompt** — The XML block is injected into the AI's system prompt at startup.

### Lazy Loading

The AI does **not** read the full contents of every skill at startup. Instead, it receives only the lightweight XML index. When the AI decides it needs a particular skill, it uses its native file-reading tool to open and process the full `SKILL.md` on demand. This keeps the system prompt small and token-efficient.

```text
Startup:   AI receives XML index → sees skill names + descriptions
On demand: AI reads full SKILL.md → follows imperative instructions
```

---

## 5. How the CLI Wizard Works

The `bin/setup.js` script (exposed as the `amiga-ia-setup` command) is an interactive CLI wizard that copies skills and agents from the NPM package to the user's local AI configuration folders.

### Installation Targets

#### Claude Code

- **Skills** → `~/.claude/skills/`
- **Agents** → `~/.claude/agents/`
- **Hooks** → Optionally merges hook definitions into `~/.claude/settings.json`

#### Antigravity (Gemini)

- **Skills** → `~/.gemini/config/skills/`
- **Plugin** → Creates the plugin directory at `~/.gemini/config/plugins/amiga-ia/`

### How It Works

1. The wizard prompts the user to select their target platform (Claude, Antigravity, or both).
2. It physically copies all skill directories and agent files to the appropriate local paths.
3. It cleans up orphaned files from previous installations (only `ami-`-prefixed files are removed — personal files are preserved).

### Uninstall

The wizard includes an uninstall option that **safely removes only `ami-`-prefixed files** from the target directories. Any custom skills or agents the user has created locally (without the `ami-` prefix) are left untouched.

---

## 6. Testing Changes Locally

Before submitting a PR, you should test your changes locally to ensure everything works.

### Option A: Run the CLI Wizard from your local copy

If you have the repository cloned locally, you can run the setup script directly:

```bash
node bin/setup.js
```

This will copy your local (modified) skills and agents to your AI configuration folders, just like the published package would.

### Option B: Manual copy

You can also manually copy individual files to test specific changes:

```bash
# Example: Copy a single skill to Antigravity's config
cp -r skills/ami-my-skill ~/.gemini/config/skills/

# Example: Copy a single agent to Claude's config
cp agents/ami-my-agent.md ~/.claude/agents/
```

### Verifying

After copying, start a new AI session (Antigravity or Claude Code) and confirm that:

- Your new skill/agent appears in the available tools catalog.
- The AI can invoke and execute the skill correctly.
- The YAML frontmatter is parsed without errors.

---

## 7. Commit and PR Guidelines

### Commit Messages

All commit messages **must** be written in **English** and follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

| Prefix | Use case |
|--------|----------|
| `feat:` | New feature (e.g., a new skill or agent) |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `chore:` | Build, CI, or repo maintenance |
| `refactor:` | Code refactoring without behavior changes |
| `style:` | Formatting, whitespace, etc. |
| `test:` | Adding or updating tests |

**Examples:**

```
feat: add ami-changelog-generator skill
fix: correct frontmatter parsing in universal adapter
docs: update contributing guide with CLI wizard section
chore: bump tailwindcss to v3.5
```

### Code Language

All source code, variable names, function names, comments, and docstrings **must** be written in **English**. No exceptions.

### The `ami-` Prefix

Every new skill or agent **must** use the `ami-` prefix in its folder/file name and in its YAML `name` field. This prevents namespace collisions with external ecosystems and keeps the suite unified.

### Pull Request Checklist

Before opening a PR, make sure you have:

- [ ] Used the `ami-` prefix for any new skill or agent.
- [ ] Included proper YAML frontmatter (`name`, `description`, `allowed-tools`).
- [ ] Added the language rule block at the end of the file.
- [ ] Registered new agents in `plugin.json` (skills are auto-discovered).
- [ ] Tested locally with `node bin/setup.js` or manual copy.
- [ ] Written commit messages in English using Conventional Commits.
- [ ] Ensured all code and comments are in English.

---

> [!TIP]
> If you are unsure about anything, look at existing skills (e.g., `skills/ami-quick-reviewer/SKILL.md`) and agents (e.g., `agents/ami-commit-assistant.md`) for reference. They are great templates to follow.
