> **Created:** 2026-08-27
> **Last Updated:** 2026-08-27

# AI Assistant Rules & Instructions Architecture Reference

Comparison and exact specifications for global and project-level rules in **Google Antigravity (Gemini)** and **Anthropic Claude Code**.

---

## 1. Antigravity / Gemini Configuration Architecture

### Global Level (Machine-wide)
- **Primary Configuration Directory:** `~/.gemini/config/`
- **Global Rules Directory:** `~/.gemini/config/rules/`
  - Any `.md` files placed here (e.g. `ami-rules.md`, `subagent_verification.md`, `ui-caching.md`) are automatically loaded across all workspaces and conversations.
- **Global Root Directive Files:** `~/.gemini/config/AGENTS.md` / `~/.gemini/config/GEMINI.md`

### Project / Workspace Level (Repository-specific)
- **Hierarchical Directory Rules:** `GEMINI.md` or `AGENTS.md` placed in the project root or any subdirectory.
- **Dedicated Project Customization Folder:** `.agents/` (or `.agent/`, `_agents/`, `_agent/`) at repository root.
  - `.agents/rules/*.md`: Modular rule files.
  - `.agents/AGENTS.md`: Main repo-level instructions.
- **Discovery Behavior:** The agent walks from the current working directory up to the repository root (`.git`), discovering and loading rules hierarchically with automatic deduplication.

---

## 2. Claude Code Configuration Architecture

### Global Level (Machine-wide)
- **Global Memory / Instructions File:** `~/.claude/CLAUDE.md`
  - Applies personal preferences, global conventions, and instructions to every project executed on the local machine.
- **Global Configuration Directory:** `~/.claude/` (contains `settings.json`, `skills/`, `agents/`, `hooks/`).

### Project / Workspace Level (Repository-specific)
- **Project Root Memory:** `./CLAUDE.md` or `.claude/CLAUDE.md`
  - Committed to version control for team-wide sharing.
- **Subdirectory Memory:** `CLAUDE.md` files placed in nested subdirectories (loaded on-demand as context narrows).
- **Modular Project Rules:** `.claude/rules/*.md`
  - Allows organizing rules into dedicated markdown files instead of a single monolithic `CLAUDE.md`.
- **Local Gitignored Overrides:** `CLAUDE.local.md`
  - Local overrides not committed to Git.

---

## 3. Comparative Summary Table

| Scope | Antigravity / Gemini | Claude Code |
| :--- | :--- | :--- |
| **Global File** | `~/.gemini/config/AGENTS.md` / `GEMINI.md` | `~/.claude/CLAUDE.md` |
| **Global Rules Folder** | `~/.gemini/config/rules/*.md` | `~/.claude/rules/*.md` *(or global `CLAUDE.md`)* |
| **Project Root File** | `AGENTS.md` / `GEMINI.md` | `CLAUDE.md` / `.claude/CLAUDE.md` |
| **Project Rules Folder** | `.agents/rules/*.md` | `.claude/rules/*.md` |
| **Local Private Overrides** | Project-specific untracked files | `CLAUDE.local.md` |
