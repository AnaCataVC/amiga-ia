# Contract: Codex Semantic Compiler & Runtime Neutralization

**Contract Identifier:** `codex-semantic-compiler`  
**Status:** Frozen (Cleanroom Double-Blind Baseline)  
**Date:** 2026-10-11  
**Scope:** Canonical Source Neutralization, Semantic Manifest Build Engine, Capability Translator, and Hygiene Test Suite

---

## 1. Overview & Objectives

This contract establishes the formal behavioral and interface requirements for achieving true tri-ecosystem compatibility across OpenAI Codex, Anthropic Claude Code, and Google Antigravity from a Single Source of Truth (SSOT).

The system consists of:
1. **Canonical Source Neutralization:** Eliminating platform-specific tool identifiers from `skills/*/SKILL.md` and `agents/*.md`.
2. **Capability Translator Upgrade:** Explicitly supporting `'codex'` and eliminating silent fallbacks.
3. **Semantic Build Manifest Engine:** Robust YAML frontmatter parsing, cross-skill path resolution, and native TOML configuration emission (`sandbox_mode = "read-only"`).
4. **Automated Hygiene Test Suite:** A comprehensive test module (`tests/codex_hygiene.test.js`) asserting zero foreign tool leaks, schema compliance, and path resolution.

---

## 2. Public Interfaces & Signatures

### 2.1 Capability Translator (`adapters/capability_translator.js`)

#### `translateTools(tools, platform)`
- **Parameters:**
  - `tools`: `string | string[]` — Comma-separated string or array of tool tokens.
  - `platform`: `'claude' | 'antigravity' | 'gemini' | 'codex'` — Target runtime.
- **Return Value:**
  - `string[]` — Array of unique, deduplicated tool names appropriate for the target platform.
- **Behavior:**
  - For `platform === 'claude'`: returns Claude PascalCase tool names (`Read`, `Write`, `Edit`, `Bash`, `Agent`, `WebSearch`, `WebFetch`).
  - For `platform === 'antigravity'` or `'gemini'`: returns Antigravity snake_case tool names (`view_file`, `write_to_file`, `replace_file_content`, `run_command`, `invoke_subagent`, `search_web`, `read_url_content`).
  - For `platform === 'codex'`: returns clean abstract capability tokens (`Read`, `Write`, `Edit`, `Bash`, `Agent`, `WebSearch`, `WebFetch`) and MUST NOT return any Antigravity-specific identifiers (`write_to_file`, `replace_file_content`, `invoke_subagent`, `view_file`, `grep_search`).
  - For any unsupported platform string (e.g., `'unsupported'`, `'unknown'`): MUST throw an `Error` with message matching `/unsupported platform/i`.

#### `translateFrontmatter(markdownContent, platform)`
- **Parameters:**
  - `markdownContent`: `string` — Full content of a markdown file with YAML frontmatter.
  - `platform`: `'claude' | 'antigravity' | 'gemini' | 'codex'`
- **Return Value:**
  - `string` — Markdown content with translated `allowed-tools` or `tools` in frontmatter.

---

### 2.2 Semantic Manifest Engine (`scripts/build-manifests.js`)

#### `resolveCodexSkillReferences(instructions, skillNames, sourceFile)`
- **Parameters:**
  - `instructions`: `string` — Instructional markdown prose.
  - `skillNames`: `Set<string>` — Set of valid existing skill directory names (`ami-*`).
  - `sourceFile`: `string` — Relative path or file name for error reporting.
- **Return Value:**
  - `string` — Normalized text with normalized LF (`\n`) where references matching `(?:~\/\.agents\/skills\/|skills\/)(ami-[a-z0-9-]+)\/SKILL\.md` are replaced with `__AMIGA_CODEX_SKILLS_DIR__/$1/SKILL.md`.
- **Error Condition:**
  - If a referenced skill name does not exist in `skillNames`, throws an `Error` indicating the missing skill reference.

#### `buildManifests()`
- **Behavior:**
  - Reads canonical skills from `skills/` and canonical agents from `agents/`.
  - Normalizes line endings to LF (`\n`).
  - Compiles agent files to `codex/agents/*.toml`.
  - Copies and processes skills to `codex/skills/`, applying `resolveCodexSkillReferences` to skill markdown bodies.
  - Emits native TOML properties in `codex/agents/*.toml`:
    - `name = <string>`
    - `description = <string>`
    - `developer_instructions = <string>`
    - `sandbox_mode = "read-only"` MUST be emitted for the following read-only agent roles:
      - `ami-repo-auditor`
      - `ami-pr-reviewer`
      - `ami-push-assistant`
      - `ami-expert-council`
    - `sandbox_mode` MUST NOT be emitted for agents that require file modification capabilities:
      - `ami-cleanroom-builder`
      - `ami-cleanroom-tester`
      - `ami-data-scientist`
      - `ami-doc-architect`
      - `ami-pr-publisher`
      - `ami-release-manager`
      - `ami-tech-lead`

---

## 3. Canonical Source Invariants (`skills/` and `agents/`)

### 3.1 Prohibited Tool Function Names
Canonical instructions in `skills/*/SKILL.md` and `agents/*.md` MUST NOT contain the following proprietary tool identifiers in their operational instructions:
- `write_to_file`
- `replace_file_content`
- `multi_replace_file_content`
- `view_file`
- `grep_search`
- `find_by_name`
- `list_dir`
- `invoke_subagent`
- `ask_question`

### 3.2 Abstract Capability Phrasing
- File creation and edits: MUST be expressed in terms of system outcomes (e.g., *"Persist findings to `docs/...`"*, *"Create the contract file at `docs/contracts/...`"*).
- File inspection: MUST be expressed neutrally (e.g., *"Inspect the codebase touchpoints and existing interfaces"*).
- Questions and interviews: MUST be expressed neutrally (e.g., *"Formulate targeted clarifying questions in the user's language"*).
- Delegation: MUST be expressed through named agent routing (e.g., *"Spawn or delegate to the `ami-cleanroom-builder` subagent"*), with an explicit direct-execution fallback (e.g., *"If multi-agent delegation is not supported by the environment, execute the steps directly"*).

---

## 4. Behavioral Acceptance Criteria

### Scenario 1: Clean Platform Translation
- **Given** a tool list `['Bash', 'Read', 'Grep', 'Write', 'Edit', 'Agent']`
- **When** calling `translateTools(tools, 'codex')`
- **Then** the output contains abstract capability tokens without any Antigravity-specific tool function identifiers (`write_to_file`, `replace_file_content`, `invoke_subagent`).

### Scenario 2: Rejection of Invalid Platform Target
- **Given** an unsupported platform string `'unknown-platform'`
- **When** calling `translateTools(tools, 'unknown-platform')`
- **Then** the function throws an `Error` indicating the platform is unsupported.

### Scenario 3: Complete Zero-Tool Leakage in Generated Codex Directory
- **Given** `buildManifests()` has executed
- **When** scanning all files recursively under `codex/skills/` and `codex/agents/`
- **Then** ZERO occurrences of the following strings are found:
  `write_to_file`, `replace_file_content`, `multi_replace_file_content`, `view_file`, `grep_search`, `find_by_name`, `list_dir`, `invoke_subagent`, `ask_question`.

### Scenario 4: Read-Only Sandbox Enforcement in Codex Agents
- **Given** the generated agent files in `codex/agents/`
- **When** inspecting `ami-repo-auditor.toml`, `ami-pr-reviewer.toml`, `ami-push-assistant.toml`, and `ami-expert-council.toml`
- **Then** each file contains `sandbox_mode = "read-only"`.

### Scenario 5: Write-Enabled Agents Retain Sandbox Inheritance
- **Given** the generated agent files in `codex/agents/`
- **When** inspecting `ami-cleanroom-builder.toml`, `ami-cleanroom-tester.toml`, `ami-data-scientist.toml`, `ami-doc-architect.toml`, `ami-pr-publisher.toml`, `ami-release-manager.toml`, and `ami-tech-lead.toml`
- **Then** none of these files contain `sandbox_mode = "read-only"`.

### Scenario 6: Skill Path Placeholders in Skill Bodies
- **Given** canonical skills referencing other skills via `skills/ami-*/SKILL.md`
- **When** inspecting the compiled files in `codex/skills/`
- **Then** all such occurrences are replaced with `__AMIGA_CODEX_SKILLS_DIR__/<skill-name>/SKILL.md`.

### Scenario 7: TOML Syntax Validity
- **Given** all 11 compiled `.toml` files in `codex/agents/`
- **When** validated against standard TOML structure (valid key-value pairs, valid multi-line string escaping, no unescaped control characters)
- **Then** all files parse successfully without errors.

---

## 5. Non-Functional & Quality Constraints

1. **Token Efficiency:** Maintain clean LF (`\n`) newlines. No Windows CRLF (`\r\n`) token inflation in generated TOML.
2. **Zero Dependency Bloat:** Do not add heavy external npm packages to `package.json` for basic parsing.
3. **Repository Rules Compliance:**
   - Commit messages MUST adhere to Conventional Commits in English.
   - All source code and documentation MUST be in English.
   - Zero country flag emojis.
   - Zero leaked local computer paths.
