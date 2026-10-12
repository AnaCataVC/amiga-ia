# 16. Tri-Ecosystem End-to-End Installation Testing & Codex Path Resolution Architecture

Date: 2026-10-12

## Status

Accepted

## Context

Amiga IA distributes agent capabilities and skills across three distinct AI assistant runtimes:
1. **Anthropic Claude Code (`~/.claude/`):** Consumes skills via `~/.claude/skills/`, subagents via `~/.claude/agents/`, project directives via `~/.claude/CLAUDE.md`, and hooks merged into `~/.claude/settings.json`. Expects PascalCase `allowed-tools:` permissions (`Read`, `Write`, `Edit`, `Bash`, `Agent`).
2. **Google Antigravity (`~/.gemini/config/`):** Consumes skills via `~/.gemini/config/skills/`, subagents via `~/.gemini/config/agents/`, rules via `~/.gemini/config/rules/`, and hooks via `~/.gemini/config/hooks.json`. Expects snake_case tool permissions (`view_file`, `write_to_file`, `replace_file_content`, `run_command`).
3. **OpenAI Codex (`~/.codex/` and `~/.agents/skills/`):** Consumes skills via standard Agent Skills directory `~/.agents/skills/`, custom subagents via native TOML configurations in `~/.codex/agents/`, and lifecycle hooks via `~/.codex/hooks.json`. Enforces execution sandboxing via `sandbox_mode = "read-only"` for read-only agents while omitting the directive for write-enabled agents.

During cross-ecosystem testing and audit cycles, three architectural vulnerabilities were identified:
1. **Unresolved Placeholder Leaks in Codex Skill Markdown:** In Codex, cross-referencing between skills requires absolute filesystem paths pointing to the target skill's `SKILL.md` file. In canonical templates, these paths are parameterized using the placeholder `__AMIGA_CODEX_SKILLS_DIR__`. While the distribution engine previously expanded this token inside `.toml` agent manifests, it bypassed markdown files (`.md`) during recursive copy. Consequently, installed skill documentation contained unexpanded raw placeholder tokens, breaking dynamic tool and skill navigation.
2. **Option Parameter Dropping in Recursive Directory Traversal:** In `bin/setup.js`, recursive calls inside `copyRecursiveSync` did not consistently forward the `options` dictionary (specifically `codexUserSkillsDir`) across nested directory levels, causing intermittent errors during deeply nested file copies.
3. **Platform-Specific Phrasing Leaks in Core Skills:** Core skills (such as `skills/ami-plan-feature/SKILL.md`) contained subtle runtime-specific terminology (e.g., phrasing tied to specific interactive artifact mechanisms rather than generic markdown artifacts), degrading portable execution in non-interactive or alternative runtimes.
4. **Lack of Isolated End-to-End Installation Regression Tests:** Existing automated tests asserted static capability translations and schema validations in isolation, but lacked end-to-end integration tests that simulate realistic filesystem installations, temporary home directories, tool leakage boundaries, and path resolution across all three runtimes simultaneously.

## Decision

We have established a comprehensive Tri-Ecosystem installation architecture and verification protocol:

### 1. Universal Codex Path Interpolation (`bin/setup.js`)
- Extended `copyRecursiveSync` to interpolate `__AMIGA_CODEX_SKILLS_DIR__` across all markdown files (`.md`) when targeting the `codex` environment, ensuring all skill cross-references resolve to the physical destination directory (`~/.agents/skills/`).
- Added strict precondition validation: the `codex` target requires `options.codexUserSkillsDir` to be passed, throwing an explicit error if missing.
- Ensured `options` is uniformly propagated down every recursive invocation of `copyRecursiveSync`.
- Ensured JSON-escaped string formatting for TOML manifests (`escapedSkillsDir = JSON.stringify(options.codexUserSkillsDir).slice(1, -1)`) while using standard path formatting for markdown files.

### 2. Platform-Neutral Core Skill Standardization
- Standardized implementation plan guidance in `skills/ami-plan-feature/SKILL.md` to reference the canonical `implementation_plan.md` format instead of runtime-specific interactive artifact terminology.
- Synchronized the compiled Codex skill artifact in `codex/skills/ami-plan-feature/SKILL.md` to reflect identical neutral planning specifications.

### 3. Isolated Tri-Ecosystem End-to-End Test Suite (`tests/install_e2e.test.js`)
Implemented a dedicated, self-contained end-to-end test suite using the native `node:test` runner that validates the physical installation pipeline for all three target ecosystems in isolated temporary directories (`os.tmpdir()`):
- **Claude Code E2E Suite:**
  - Installs skills, subagents, rules block into `CLAUDE.md`, and hooks into `settings.json`.
  - Asserts that no Antigravity snake_case tools (`write_to_file`, `replace_file_content`, `run_command`, etc.) leak into Claude frontmatter `allowed-tools:`.
  - Asserts zero unmigrated `.gemini/agents/` references in installed files.
  - Verifies that Claude hooks configure absolute script paths for execution reliability.
- **Google Antigravity E2E Suite:**
  - Installs skills, subagents, rules into `rules/`, and hooks into `hooks.json`.
  - Asserts that no Claude PascalCase tools (`Bash`, `Read`, `Write`, `Edit`, `Agent`) leak into Antigravity frontmatter `allowed-tools:`.
  - Verifies that Antigravity hooks configure relative script paths (`hooks/ami-pre-tool-use.js`).
- **OpenAI Codex E2E Suite:**
  - Simulates an adversarial user profile directory path containing spaces and special characters (`amiga-e2e-$special user-codex-`).
  - Asserts that exactly 0 occurrences of `__AMIGA_CODEX_SKILLS_DIR__` remain across all installed `.md` and `.toml` files.
  - Executes regex validation against every referenced skill path to verify that the target `SKILL.md` physically exists on disk at the resolved destination path.
  - Asserts that read-only subagents (`ami-repo-auditor`, `ami-pr-reviewer`, `ami-push-assistant`, `ami-expert-council`) strictly declare `sandbox_mode = "read-only"`.
  - Asserts that write-enabled subagents (`ami-cleanroom-builder`, `ami-cleanroom-tester`, `ami-data-scientist`, `ami-doc-architect`, `ami-pr-publisher`, `ami-release-manager`, `ami-tech-lead`) do not declare `sandbox_mode = "read-only"`.
  - Validates `hooks.json` syntax and lifecycle trigger registration (`PreToolUse` and `PostToolUse`).

## Consequences

### Positive
- **Guaranteed Portability:** Developers installing Amiga IA on Claude Code, Antigravity, or Codex receive fully verified, runtime-compatible configurations without manual path tweaking.
- **Zero Placeholder Breakage:** Skill cross-references in Codex resolve deterministically across all environments, including user directories with special characters or spaces.
- **Regression Immunity:** The E2E test suite acts as an automated regression shield in CI (`npm test`), preventing tool vocabulary contamination and path corruption.

### Considerations & Mitigations
- **Test Execution Isolation:** E2E tests create and destroy sandboxed temporary directories under `os.tmpdir()` to prevent any contamination of actual developer configuration directories (`~/.claude`, `~/.gemini`, `~/.codex`).
