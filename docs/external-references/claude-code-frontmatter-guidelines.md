> **Created:** 2026-06-25
> **Last Updated:** 2026-11-25

# Claude Code Compatibility: `allowed-tools` (Skills) vs `tools` (Subagents)

## Context & Decision
In **Claude Code**, YAML frontmatter keys for tool scoping differ depending on whether the Markdown file defines a **Skill** (`.claude/skills/<name>/SKILL.md`) or a **Subagent** (`.claude/agents/<name>.md`):

1. **Skills (`SKILL.md`) read `allowed-tools:`** — pre-approves/scopes tools when the skill is invoked in the session.
2. **Subagents (`agents/*.md`) read `tools:` (and optional `disallowedTools:`, `model:`)** — defines the structural tool allowlist for the isolated subagent instance. If a subagent file uses `allowed-tools:` instead of `tools:`, Claude Code ignores `allowed-tools:` and grants the subagent **every** available session tool by default, breaking least-privilege sandboxing on read-only auditors and verifiers.

To preserve a single canonical authoring format in the `amiga-ia` repository while generating strict platform-native installations:
- Repository source files (`skills/*/SKILL.md` and `agents/*.md`) declare canonical `allowed-tools:` (plus `model: sonnet | opus` on `agents/*.md`).
- During installation (`bin/setup.js` and `src/core/installer.js`), `adapters/capability_translator.js` (`translateFrontmatter`) inspects `kind: 'skill' | 'agent'`:
  - **Claude Code Skills:** emits `allowed-tools: ...`
  - **Claude Code Subagents:** emits `tools: ...` and preserves `model: sonnet | opus`
  - **Google Antigravity:** emits YAML flow sequence `tools: [...]` and normalizes Claude model tiers to `model: inherit`
  - **OpenAI Codex:** strips platform-specific tool tokens (`Skill`, Antigravity tools) in `codex/skills/` and compiles `agents/*.md` into `.codex/agents/*.toml` (`sandbox_mode = "read-only"` for read-only agents).

## Research Findings
Using the `/ami-research-context` skill, we gathered the following technical constraints regarding Claude Code's architecture:

1. **Strict YAML Frontmatter Directive:** In Claude Code, `allowed-tools` is the official property used within the YAML frontmatter of custom skills or slash commands to restrict or define the toolset available to the agent during that specific task.
2. **Syntax and Granularity:** Tools can be specified generally or with granular constraints using the `ToolName(specifier)` format. For example, `Bash(npm run *)` allows the agent to run NPM scripts but blocks other arbitrary bash commands.
3. **Distinction from Global Permissions:** `allowed-tools` in the frontmatter is distinct from the persistent Permission System found in `settings.json` (which governs global allow/deny/ask rules for all sessions). `allowed-tools` acts as a *local configuration directive* for the specific skill/agent context.
4. **Hierarchy of Priority:** Claude Code evaluates rules based on a hierarchy:
   1. CLI Flags (`--allowedTools`)
   2. Local Settings (`.claude/settings.local.json`)
   3. Project Settings (`.claude/settings.json`)
   4. User Settings (`~/.claude/settings.json`)

## Extended Research: Agents, Skills & Frontmatter Guidelines

Further research using the `/ami-research-context` skill revealed critical structural and semantic constraints for Claude Code:

### 1. Skills vs. Subagents vs. Commands
Claude Code differentiates the file structures depending on the entity's purpose:
*   **Skills:** Reusable tasks and instructions. Must be placed in `.claude/skills/<name>/SKILL.md`.
*   **Subagents:** Specialized autonomous agents. Placed directly as `.claude/agents/<name>.md`.
*   **Legacy Commands:** Simple manual slash commands placed in `.claude/commands/<name>.md`.

### 2. Mandatory YAML Fields, Description Budget & Delegation
Two fields are mandatory across both skills and subagents:
*   **`name`**: Must be formatted in kebab-case (e.g., `ami-release-manager`) matching the directory or file stem.
*   **`description`**: Critical for automatic routing and delegation.
    *   *Budget constraint:* Keep `description` single-line, `<= 50 words`, and `<= 250 characters` so Claude Code's system-prompt skill listing budget never truncates trigger phrases.
*   **`model` (Subagents):** Optional model tier (`sonnet`, `opus`, `haiku`, or `inherit`) in `.claude/agents/*.md` to route bounded validation/implementation workers to `sonnet` and deep architectural/adversarial reasoning to `opus`.

### 3. Formatting Strictness
The YAML frontmatter MUST be the very first thing in the file, enclosed within `---` markers.

## Resolution
- Canonical repository `.md` files in `agents/` and `skills/` retain `allowed-tools:` as the single source schema validated by `bin/setup.js --doctor`.
- `adapters/capability_translator.js` translates `allowed-tools:` into `tools:` specifically when installing `agents/*.md` into `~/.claude/agents/`, while keeping `allowed-tools:` for `~/.claude/skills/*/SKILL.md`.
