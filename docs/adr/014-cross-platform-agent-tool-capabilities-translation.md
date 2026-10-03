# 14. Cross-Platform Agent Tool Capabilities Translation Architecture

Date: 2026-10-03

## Status

Accepted

## Context

Amiga IA subagents (`agents/*.md`) operate across two major AI development runtimes:
1. **Claude Code (`~/.claude/agents/`):** Relies on PascalCase tool names declared in frontmatter `allowed-tools:` (`Write`, `Edit`, `Bash`, `Read`, `Grep`, `Glob`, `WebSearch`, `WebFetch`, `Agent`). Missing `Write` or `Edit` enforces a strict operating-system-level sandbox that prevents subagents from creating or modifying files.
2. **Google Antigravity / Gemini CLI (`~/.gemini/config/agents/`):** Discovers subagents via YAML frontmatter with snake_case function identifiers (`write_to_file`, `replace_file_content`, `multi_replace_file_content`, `run_command`, `manage_task`, `view_file`, `grep_search`, `find_by_name`, `list_dir`, `search_web`, `read_url_content`, `invoke_subagent`, `send_message`). Subagents receive read-only tools by default; omitting explicit write tool declarations silences file writing capabilities.

Previous agent definitions listed only Claude Code tool identifiers or mixed platform-specific names inconsistently. Furthermore, critical modifying orchestrators such as `ami-doc-architect` lacked write capabilities entirely, leading to silent permission failures when attempting to generate or synchronize documentation.

## Decision

We have established a canonical capability mapping and distribution-time translation architecture across the repository:

### 1. Canonical Capability Mapping Module (`adapters/capability_translator.js`)
- Houses the canonical mapping between abstract capability tokens and platform-native tool sets:
  - `Read` maps to `['Read']` in Claude and `['view_file']` in Antigravity.
  - `Write` maps to `['Write']` in Claude and `['write_to_file']` in Antigravity.
  - `Edit` maps to `['Edit']` in Claude and `['replace_file_content', 'multi_replace_file_content']` in Antigravity.
  - `Bash` maps to `['Bash']` in Claude and `['run_command', 'manage_task']` in Antigravity.
  - `WebSearch` maps to `['WebSearch']` in Claude and `['search_web']` in Antigravity.
  - `WebFetch` maps to `['WebFetch']` in Claude and `['read_url_content']` in Antigravity.
  - `Agent` maps to `['Agent']` in Claude and `['invoke_subagent', 'send_message', 'define_subagent']` in Antigravity.
- Implements passthrough preservation for custom, MCP, or unknown tools.
- Provides bidirectional translation (`translateTools`), frontmatter transformation (`translateFrontmatter`), and write capability auditing (`hasWriteCapabilities`).

### 2. Standardized Source Subagents (`agents/*.md`)
- All source subagents in the repository use clean, standard tokens in `allowed-tools:`.
- `ami-doc-architect.md` is upgraded with `Write, Edit` to enable autonomous documentation generation and synchronization.
- `ami-tech-lead.md` is normalized to standard tokens without cross-platform mixing.

### 3. Distribution-Time Platform Translation (`bin/setup.js`)
- `copyRecursiveSync` intercepts markdown files and applies platform-specific translation dynamically:
  - When copying to `~/.claude/agents/`: Produces clean Claude Code tools (`Write, Edit, Bash, Read...`).
  - When copying to `~/.gemini/config/agents/`: Produces clean Antigravity tools (`write_to_file, replace_file_content, multi_replace_file_content, run_command, manage_task, view_file...`).

### 4. Diagnostic Pre-Release Enforcement (`setup.js --doctor`)
- The repository diagnostic tool actively enforces that all subagents with file modification responsibilities (`ami-cleanroom-builder`, `ami-cleanroom-tester`, `ami-data-scientist`, `ami-doc-architect`, `ami-release-manager`, `ami-tech-lead`) explicitly possess write/edit capabilities in their source definitions.

## Consequences

- **Positive:** Guarantees subagents have correct write tools on both Claude Code and Google Antigravity without manual double-entry or noisy cross-platform strings; preserves 100% native compatibility and security sandboxing on both platforms; catches permission regressions automatically during pre-release doctor audits.
- **Negative:** Introduces a translation step during setup file copying; requires new subagent authors to declare standard canonical capabilities.
