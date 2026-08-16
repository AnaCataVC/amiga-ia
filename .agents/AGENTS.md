# Instructions for Antigravity (Gemini)

This file serves as context reference for Antigravity (Gemini) when operating in this repository.

## 🚨 Mandatory Development Rules
1. **Code Language:** All source code MUST always be written in **English**.
2. **Git History:** All commit messages MUST be written in **English** and follow the **Conventional Commits** standard (use prefixes like `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.).
3. **Documentation Language:** All repository documentation (with the explicit exception of `README.md`) MUST be written in **English**.
4. **Namespacing (`ami-` Prefix):** Any new skill or agent created MUST have the prefix `ami-` in its folder name, file name, and internal metadata (`name:`). This prevents collisions with external ecosystems and keeps the suite unified.
5. **Naming Convention (Actions vs Roles):** Skills MUST be named as Actions/Verbs (e.g., `ami-plan-feature`). Agents MUST be named as Roles/Nouns (e.g., `ami-tech-lead`). *Note: Older components not following this convention are considered deprecated and will be renamed in the next Major Release (v4.0.0).*
6. **Conversation Language:** Although code and commits must be in English, the AI MUST communicate and interact in the chat using the same language the user speaks (e.g., Spanish).
7. **Generalization Principle (Portability):** All skills, subagents, and workflows MUST be written in a generalized, domain-agnostic manner so they remain fully portable across any repository or project stack. Specific file names, framework conventions, repository-specific diagnostic tools (like this repository's setup doctor), or product pages (e.g., `index.html`, `README.md`) MUST only be cited as illustrative examples, never as hardcoded operational assumptions within portable skills or agents.
8. **Version Control & UI Badges:** In this repository, adding or fusing skills/agents represents a new product capability and constitutes a **Minor Bump (`0.x.0`)**. Before publishing a new Release, the AI MUST proactively update any version badges on product/showcase pages (e.g., `index.html`) to the target version manually (e.g., `v2.5.3` -> `v2.6.0`). Automated pipeline actions handle package manager files (`package.json`) post-release.
9. **Repository Rebase & Automation Strategy:** In this specific repository (`amiga-ia`), GitHub Actions generates automatic commits (e.g., `package.json` updates post-release). When preparing to push, never do a blind rebase; always inspect the remote branch first (via `git fetch` and checking `origin/main`). Once verified that remote diffs correspond to expected automated commits, execute `git pull --rebase` to cleanly integrate them before pushing.
10. **NPM Package Stability:** Before making architectural changes (like moving hooks or modifying plugin metadata), ALWAYS verify that the changes do not break the NPM installation method (e.g., check `bin/setup.js`, `.gitignore`, and `package.json`).
11. **PR Verification:** Before creating a Pull Request or proposing its creation, the AI MUST run the `ami-detect-pr-conflicts` skill (or suggest it to the user) to identify potential conflicts with other open PRs.
12. **Skill Modification Scope:** When asked to edit or modify skills in this repository, ALWAYS edit the source code located in the repository's `./skills/` directory. Do NOT edit the globally installed skills in `~/.gemini/config/skills/` or `~/.claude/` directly, because those changes will not be tracked by Git nor included in the NPM package releases.
13. **Mandatory Subagent Delegation Policy:** Whenever a user request triggers a lifecycle or complex domain workflow covered by an existing orchestrator subagent (such as `ami-push-assistant`, `ami-release-manager`, `ami-pr-publisher`, or `ami-data-scientist`), the AI MUST delegate the task strictly via the `invoke_subagent` tool. NEVER bypass them by executing raw git/GitHub CLI lifecycle commands directly (`git push`, `gh release create`, `gh PR create`, etc.), never bypass `ami-data-scientist` when performing deep SQL query optimizations or dataset profiling, and never perform their multi-step orchestrations inline manually.
14. **Release Notes Product Scope:** The landing page showcase (`index.html`) is promotional material and not part of the distributed product package. When drafting Release Notes (`ami-draft-release` / `ami-release-manager`), changelogs MUST strictly focus on core product value (skills, agent orchestrators, hooks, security, package stability, and CLI tools), omitting promotional website or showcase UI tweaks.
15. **Mandatory Pre-Release Diagnostic Audit (`doctor` in this repo):** Before cutting or preparing any Release in this repository (`amiga-ia`), the AI MUST run the repository's diagnostic tool (`node bin/setup.js --doctor` or `amiga-ia-setup --doctor`). This verifies frontmatter integrity across all skills and agents, checks for legacy plugin conflicts, and validates hooks configuration. If any diagnostic issues or gaps are discovered, the AI and user must resolve them (determining whether the doctor or the product definitions need adjustment) before authorizing the release.
16. **Repository Layering & Commit Separation:** When preparing commits, the AI MUST strictly respect the 4 architectural layers of this repository:
    - **Layer 1 (Core Distributed Product - NPM Package):** `skills/`, `agents/`, `adapters/`, `hooks/scripts/`, `agent/`.
    - **Layer 2 (Distribution & Setup Engine):** `bin/setup.js`, `package.json`, plugin manifests (`plugin.json`, `.claude-plugin/`).
    - **Layer 3 (Internal Repository AI Directives & Guidelines):** `.agents/AGENTS.md`, local workspace settings (`.claude/`, `.gemini/`) - *not packaged in NPM releases*.
    - **Layer 4 (Persistent Project Memory & Documentation):** `docs/` (`adr/`, `learning/`, `architecture/`), `README.md`.
    Commits MUST NEVER conflate Layer 1 (user-facing product capabilities) with Layer 3/4 (internal repository instructions and standalone documentation) in a single commit.
17. **Mandatory Documentation Synchronization on Release:** Before cutting, preparing, or publishing any Release in this repository, the AI MUST audit and synchronize Layer 4 documentation with the actual codebase state. This specifically requires:
    - Verifying that all skills in `skills/` and agents in `agents/` are listed and accurately described in both the English and Spanish tables in `README.md` with exact naming and count accuracy (Section 5 and Section 6.1).
    - Ensuring any architectural shifts or capability modifications are documented in `docs/adr/` (with sequential numbering and zero ID collisions) and reflected in `docs/architecture/`.
    - Checking `docs/contributing.md` and `docs/README.md` to ensure developer setup instructions, CLI setup wizard mechanics, hooks architecture, and repository layout match current reality.



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
While Antigravity ignores inline bash hooks in safe/secure mode, it actively supports universal Node.js execution hooks configured via `hooks.json`. Furthermore, its security relies on its atomic pipeline: investigate, draft a plan (`implementation_plan.md`), require human approval, execute using `task.md`, and document with `walkthrough.md`.

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
├── hooks/scripts/*.js           ← Universal cross-platform Node.js hook scripts
├── hooks.json                   ← Hooks config (Bash engine, used by NPM wizard for merging)
├── hooks-pwsh.json              ← Hooks config (PowerShell engine, used by NPM wizard for merging)
└── hooks/hooks.json             ← Hooks config (used by Claude Code plugin discovery)
```
