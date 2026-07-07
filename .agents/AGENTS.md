# Instructions for Antigravity (Gemini)

This file serves as context reference for Antigravity (Gemini) when operating in this repository.

## 🚨 Mandatory Development Rules
1. **Code Language:** All source code MUST always be written in **English**.
2. **Git History:** All commit messages MUST be written in **English** and follow the **Conventional Commits** standard (use prefixes like `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.).
3. **Documentation Language:** All repository documentation (with the explicit exception of `README.md`) MUST be written in **English**.
4. **Namespacing (`ami-` Prefix):** Any new skill or agent created MUST have the prefix `ami-` in its folder name, file name, and internal metadata (`name:`). This prevents collisions with external ecosystems and keeps the suite unified.
5. **Conversation Language:** Although code and commits must be in English, the AI MUST communicate and interact in the chat using the same language the user speaks (e.g., Spanish).
6. **Version Control (UI):** The version in `package.json` is updated automatically via GitHub Actions when making a Release. Therefore, before the user publishes a new Release, the AI MUST proactively update the version badge on the product page (`index.html`) with the target version manually (e.g., changing from v1.3.1 to v2.0.0).
7. **Git Push Strategy:** Since GitHub Actions generates automatic commits (e.g., `package.json` updates post-release), if a `git push` is rejected, the AI MUST resolve it by executing `git pull --rebase` to cleanly integrate remote changes before attempting to push again.
8. **NPM Package Stability:** Before making architectural changes (like moving hooks or modifying plugin metadata), ALWAYS verify that the changes do not break the NPM installation method (e.g., check `bin/setup.js`, `.gitignore`, and `package.json`).
9. **PR Verification:** Before creating a Pull Request or proposing its creation, the AI MUST run the `ami-pr-conflict-detector` skill (or suggest it to the user) to identify potential conflicts with other open PRs.
10. **Skill Modification Scope:** When asked to edit or modify skills in this repository, ALWAYS edit the source code located in `C:\Users\anaca\Repos\amiga-ia\skills\`. Do NOT edit the globally installed skills in `~/.gemini/config/skills/` or `~/.claude/` directly, because those changes will not be tracked by Git nor included in the NPM package releases.

## Declarative AI Environment Architecture (Agent Skills)
This repository has evolved into an ecosystem of **Skills and Agents in Markdown with XML Lazy Loading**, following the Agent Skills standard. This ensures universal portability and extreme token efficiency for Antigravity and Claude.

* **Important:** For native compatibility with Claude Code, the YAML frontmatter of all files MUST strictly use the `allowed-tools:` property to declare permissions, instead of the generic `tools:`.

* **`agents/`**: Definitions of subagents in `.md` files. They describe behavior and necessary tools in natural language.
* **`skills/`**: Skills or workflows in folders with a `SKILL.md` file. They use YAML Frontmatter for metadata and the body for detailed imperative instructions.
* **`docs/`**: Long-term memory of the agent. Architectural Decisions (ADRs), context, and project constraints persisted across sessions.
* **`adapters/`**: The universal adapter (`universal_adapter.js`) that dynamically scans directories and generates an XML index (`<available_skills>`) for the AI's System Prompt, enabling "Lazy Loading" of Markdown files when needed.

## Workflow and CLI (Antigravity)
1. **Dynamic Reading (Lazy Loading):** Antigravity and the adapter dynamically scan `skills/` and `agents/`, extracting the frontmatter to present a tool catalog to the AI.
2. **Interactive Installer (Wizard):** The project features an executable CLI (`amiga-ia-setup`) in `bin/setup.js`. This script performs a physical copy-paste of files to the `~/.gemini/config/` and `~/.claude/` folders to avoid Windows permission issues with symlinks.
3. **Native Execution:** The AI reads the XML index and uses its own file reading tool (`view_file`) to open and process `SKILL.md` only when it decides it's needed.

## Built-in Security (Planning Mode)
Antigravity ignores bash hooks when in safe mode. Its security relies on its atomic pipeline: investigate, draft a plan (`implementation_plan.md`), require human approval, execute using `task.md`, and document with `walkthrough.md`.

## Strict Hierarchy Summary
The repository is distributed as an NPM package:

```text
/
├── package.json                 ← Package registry and global command (amiga-ia-setup)
├── plugin.json                  ← Antigravity plugin manifest
├── .claude-plugin/              ← Claude Code plugin manifest
├── bin/setup.js                 ← Interactive installer (CLI wizard copy-paste)
├── adapters/                    ← Universal Adapter to compile the XML catalog
├── agent/                       ← Main entrypoint exporting libraries
├── skills/*/SKILL.md            ← Skill directories with YAML and detailed Markdown
├── agents/*.md                  ← Subagent profiles in Markdown
├── hooks.json                   ← Hooks config (used by NPM wizard for merging)
└── hooks/hooks.json             ← Hooks config (used by Claude Code plugin discovery)
```
