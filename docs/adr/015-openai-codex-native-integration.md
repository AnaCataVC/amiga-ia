# 15. OpenAI Codex Native Integration and Tri-Ecosystem Harmonization

Date: 2026-10-06

## Status

Accepted

## Context

Amiga IA was originally designed for Anthropic's Claude Code and Google's Antigravity (Gemini). The OpenAI Codex CLI has emerged as a major autonomous coding assistant platform supporting Agent Skills and custom subagents. 

However, Codex introduces distinct configuration paradigms:
1. **Custom Agent Definitions:** Codex discovers custom subagents from TOML configuration files placed in `~/.codex/agents/*.toml` containing `name`, `description`, and `developer_instructions`. It does not parse raw YAML frontmatter in Markdown agent profiles natively for custom subagent summoning.
2. **Skill Discovery:** Codex consumes standard Agent Skills (`SKILL.md`) located in `~/.agents/skills/`.
3. **Lifecycle Hooks:** Codex enforces a root-level `hooks` schema in `~/.codex/hooks.json` supporting `PreToolUse` and `PostToolUse` events that communicate via JSON payloads over stdin/stdout using the `hookSpecificOutput` envelope.

Attempting to maintain hand-crafted TOML agent duplicates in the repository would cause severe state drift, violating the Single Source of Truth invariant.

## Decision

We have established a unified build-time compilation and CLI deployment pipeline integrating OpenAI Codex as a first-class ecosystem alongside Claude Code and Antigravity:

### 1. Automated Build-Time Generation (`scripts/build-manifests.js`)
- The canonical Markdown files in `agents/*.md` remain the Single Source of Truth.
- During packaging and manifest generation (`npm run build`), `scripts/build-manifests.js` parses the YAML frontmatter of each agent and compiles native `.toml` files into `codex/agents/`.
- Prompt instructions are normalized to standard LF (`\n`) newlines to prevent Windows CRLF token fragmentation.
- Canonical skills (`skills/`) are synchronized cleanly to `codex/skills/`.

### 2. Physical Deployment & User Path Mapping (`bin/setup.js`)
- The setup wizard (`amiga-ia-setup`) installs Codex capabilities to their native discovery paths:
  - Skills are installed into `~/.agents/skills/`.
  - Subagents are installed into `~/.codex/agents/`.
- The Codex manifest generator validates skill references and writes an installation placeholder into generated TOML. During Codex installation, the setup wizard replaces it with the absolute user skills directory. This avoids relying on shell-specific `~` expansion in agent file reads.
- The diagnostic engine (`doctor`) and `hasAmigaItems` inspect both `~/.codex/agents/` and `~/.agents/skills/` to provide accurate health and version drift detection without false negatives.

### 3. Dedicated Codex Lifecycle Hooks (`hooks/scripts/ami-codex-*.js`)
- Implemented lightweight, non-blocking hook scripts adhering strictly to the Codex lifecycle schema:
  - `ami-codex-pre-tool-use.js`: Intercepts `Bash` commands to provide advisory guidance on planning commits, push verification, and PR conflict detection.
  - `ami-codex-post-tool-use.js`: Intercepts file write and edit operations to warn against leaking temporary debug statements or unhandled TODO markers.
- Configured in `~/.codex/hooks.json` using the native `hookSpecificOutput` envelope with defensive parameter extraction.

## Consequences

- **Positive:** Amiga IA achieves seamless tri-ecosystem compatibility across Claude Code, Antigravity, and OpenAI Codex from a single unified codebase; subagents remain 100% synchronized with zero manual duplication; token efficiency is preserved through clean LF normalization.
- **Negative:** Requires staging generated files in `codex/` during NPM builds; requires managing separate user-level discovery paths (`~/.agents/skills/` vs `~/.codex/agents/`).
