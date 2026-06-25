> **Created:** 2026-06-25
> **Last Updated:** 2026-06-25

# AI Skills Distribution: Plugins vs NPM Scaffolding

This document summarizes the current industry practices and architectures for distributing AI Agent skills, specifically comparing the "Native Plugin" approach with the "NPM Package / Scaffolding" approach.

## 1. The Native Plugin Approach

### Overview
A plugin is a higher-level container that bundles multiple skills, agents, hooks, and MCP (Model Context Protocol) servers. It is typically installed via a CLI command and managed by the AI assistant's internal systems.

### Examples in the Industry
*   **Claude Code:** Uses decentralized marketplace repositories (typically hosted on GitHub) with a `marketplace.json` file. Users install plugins via `claude plugin install <plugin-name>`. The plugin sits in a hidden config folder (e.g., `.claude-plugin/plugin.json`).
*   **AutoGPT:** Utilizes a plugin ecosystem where users clone or download plugins into a specific directory to extend functionality (e.g., web browsing, Twitter integration).

### Characteristics
*   **Immutable:** Plugins are generally not meant to be edited directly by the end-user.
*   **Managed Updates:** The plugin manager (or CLI) handles updates, ensuring the user always has the latest version defined by the author.
*   **Zero-Friction Installation:** Very easy to install with a single command within the AI environment.

## 2. The NPM Package / Scaffolding Approach (The "Recipe")

### Overview
This approach treats AI skills as lightweight, portable units of domain knowledge (usually Markdown files with YAML frontmatter). Instead of a rigid plugin, the skills are distributed as an NPM package and extracted or scaffolded into the user's local project workspace (e.g., `.agents/skills/` or `.claude/skills/`).

### Why the Industry is Adopting This
The industry is increasingly moving toward NPM as the primary distribution channel for declarative AI skills due to several critical advantages:

*   **Customization and Ownership:** By extracting the files physically into the user's workspace, the user gains ownership. They can edit the `SKILL.md` to personalize the prompts, adjust instructions for their specific company guidelines, and commit these changes to their own Git repository.
*   **Preventing Knowledge Drift:** When skills are distributed via NPM, they can be versioned alongside the code they document. Running `npm update` updates both the library and the AI's instructions regarding that library.
*   **Avoiding the Split-Brain Problem:** Ensures that the AI's "knowledge" of an API or workflow is always in sync with the current version installed in the project, avoiding suggestions based on deprecated patterns.
*   **Security and Auditing:** Because the skills live as plain text in the project repository, the development team can review and audit exactly what instructions the AI is following, enhancing security before execution.

## 3. Conclusion & Best Practices

If the goal of a repository is to provide a "baseline" or a framework of declarative skills that developers should adapt to their specific needs (e.g., custom commit rules, specific architectural guidelines), the **NPM Package / Scaffolding** approach is vastly superior. It acts like an `npx create-ai-agent` tool, dropping the files into the workspace where they become mutable and version-controlled by the user.

Conversely, if the tool provides a highly complex, interconnected utility (like a specialized MCP server or a proprietary black-box agent) that should not be tampered with, the **Native Plugin** approach remains the standard.
