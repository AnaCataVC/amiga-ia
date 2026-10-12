# Pattern: Tri-Ecosystem E2E Installation Testing & Cross-Platform Path Interpolation

## Context & Challenge

Distributing a unified suite of AI skills, subagents, and lifecycle hooks across three divergent AI assistant ecosystems presents unique structural and platform challenges:
- **Anthropic Claude Code:** Expects PascalCase tool names in markdown YAML frontmatter (`allowed-tools: Bash, Read, Write`), absolute hook script execution paths in `~/.claude/settings.json`, and centralized behavioral rules merged into `~/.claude/CLAUDE.md`.
- **Google Antigravity:** Expects snake_case tool identifiers (`view_file`, `write_to_file`, `run_command`), relative hook script paths in `~/.gemini/config/hooks.json`, and individual rule files in `~/.gemini/config/rules/`.
- **OpenAI Codex:** Expects standard Agent Skills directories in `~/.agents/skills/`, TOML-based subagent configurations in `~/.codex/agents/` with sandbox toggles (`sandbox_mode = "read-only"`), and absolute cross-skill references inside both Markdown instructions and TOML files.

During distribution, two distinct failure modes often arise in complex directory trees:
1. **Asymmetric Placeholder Expansion:** Token placeholders (such as `__AMIGA_CODEX_SKILLS_DIR__`) intended for dynamic expansion during installation may be processed for manifest formats (e.g., `.toml`) but inadvertently skipped for documentation files (`.md`), leaving broken paths in runtime skill prompts.
2. **Path Encoding & Special Character Vulnerabilities:** User profile directories frequently contain spaces (e.g. `/home/user with spaces/` or `C:\Users\User Name\`) or characters parsed by shells and templating engines (e.g. `$`). Unescaped path interpolation in manifests or regex replacement functions can corrupt file paths.

---

## Solution Patterns

### 1. Universal Filetype Placeholder Expansion
When packaging cross-assistant assets, parameter replacement must be applied symmetrically across both configuration files and documentation:

```javascript
// bin/setup.js
if (dest.endsWith('.md')) {
  let content = fs.readFileSync(src, 'utf8');
  if (targetEnv === 'codex') {
    if (!options.codexUserSkillsDir) {
      throw new Error('Codex skills directory is required to install skills.');
    }
    content = content.replace(/__AMIGA_CODEX_SKILLS_DIR__/g, () => options.codexUserSkillsDir);
  }
  fs.writeFileSync(dest, content);
} else if (targetEnv === 'codex' && dest.endsWith('.toml')) {
  if (!options.codexUserSkillsDir) {
    throw new Error('Codex skills directory is required to install agent profiles.');
  }
  const escapedSkillsDir = JSON.stringify(options.codexUserSkillsDir).slice(1, -1);
  const content = fs.readFileSync(src, 'utf8').replace(/__AMIGA_CODEX_SKILLS_DIR__/g, () => escapedSkillsDir);
  fs.writeFileSync(dest, content);
}
```

*Note on Replacer Functions:* Always pass a replacer callback `() => replacement` to `String.prototype.replace(regex, ...)` instead of a raw replacement string. In JavaScript, raw replacement strings treat dollar signs (`$$`, `$&`, `$'`, `$1`) as special pattern substitutions, which corrupts paths when the user's directory name contains `$` signs.

### 2. Comprehensive Options Threading in Recursive Traversal
When a copy or transform function takes contextual options, ensure those options are explicitly propagated to every recursive child invocation:

```javascript
function copyRecursiveSync(src, dest, targetEnv = null, options = {}) {
  if (isDirectory) {
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
        targetEnv,
        options // Explicit propagation down the entire directory tree
      );
    });
  }
  // ...
}
```

### 3. Isolated End-to-End Multi-Ecosystem Test Harness
Unit tests that only test translator functions cannot catch filesystem-level issues or path edge cases. The solution is an end-to-end integration test suite (`tests/install_e2e.test.js`) executed in ephemeral temp directories:
- **Sandbox Isolation:** Create temporary root directories via `fs.mkdtempSync(path.join(os.tmpdir(), ...))` and clean them up after assertions run (`fs.rmSync(tmpHome, { recursive: true, force: true })`).
- **Adversarial Directory Naming:** Intentionally include spaces and special characters (e.g. `amiga-e2e-$special user-codex-`) in the test harness home path.
- **Vocabulary Boundary Assertions:** Explicitly verify that no Claude tool identifiers exist in Antigravity definitions, and no Antigravity snake_case tool identifiers exist in Claude definitions.
- **Physical Link Resolvability:** Parse every generated path pattern (`/(?:[A-Za-z]:[\\/]|(?:\/[^/\s]+)+[\\/])(ami-[a-z0-9-]+)[\\/]SKILL\.md/g`) and verify with `fs.existsSync()` that the referenced destination file physically exists.

---

## Key Takeaways
- Use replacer functions in `String.prototype.replace()` when inserting filesystem paths to prevent special character corruption (`$` substitution patterns).
- Treat documentation files (`.md`) as executable configuration assets when they embed cross-skill path references.
- Always propagate options through recursive file operations.
- Test installation pipelines end-to-end in isolated temporary directories using adversarial path fixtures before releasing new package versions.
