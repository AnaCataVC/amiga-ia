# Pattern: UTF-8 BOM Sanitization & Symmetrical Frontmatter Diagnostics

## Context & Challenge

In declarative AI assistant architectures (such as Agent Skills and Subagents defined in Markdown), tools and adapters rely on YAML Frontmatter blocks (e.g. bounded by `---` delimiters) to extract metadata like `name:`, `description:`, and `allowed-tools:`.

When developers create, edit, or copy markdown files across Windows environments or using certain editors/PowerShell commands (`Out-File -Encoding utf8`), files may silently acquire a **UTF-8 Byte Order Mark (BOM)** (`\uFEFF` / hex `EF BB BF`) at byte offset 0.

This introduces two distinct architectural risks:
1. **Strict Anchor Regex Breakage:** Standard regular expressions attempting to match frontmatter anchored to the start of the string (e.g., `/^---\r?\n([\s\S]*?)\r?\n---/`) will fail because `\uFEFF` precedes the first hyphen (`-`). Node.js `fs.readFileSync(file, 'utf8')` preserves `\uFEFF` as the initial character (char code 65279), leading parsers to incorrectly declare frontmatter as missing or corrupted.
2. **Asymmetrical Diagnostics Blindspots:** When local diagnostic utilities (e.g., `doctor` commands) only audit one capability subset (such as searching only for `SKILL.md` inside `skills/`), definition errors or BOM corruption inside other declarative assets (such as subagents in `agents/`) go undetected until runtime failure.

---

## Solution Patterns

### 1. Defensive BOM Sanitization in Parsers and Adapters
Never assume incoming file content is free of UTF-8 BOMs or invisible control characters. Sanitize raw strings immediately upon reading:

```javascript
// adapters/universal_adapter.js & bin/setup.js
const content = fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');
const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
```

* **Why:** This ensures full cross-platform compatibility across Windows, macOS, and Linux without forcing developers or external contributors to configure specialized editor encoding rules.

### 2. Symmetrical Declarative Asset Validation
Diagnostic health checks must comprehensively audit all declarative definitions across the entire ecosystem. If an agent ecosystem defines both Skills and Subagents, the diagnostic validator must iterate and assert integrity across both:

```javascript
// Validate both skills and agent definitions
const validateDefinitionFrontmatter = (filepath, baseDir, typeLabel) => {
  const content = fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  // Assert presence of required metadata: name, description, allowed-tools
  ...
};
```

### 3. Pre-Release Diagnostic Verification & Portability Separation
To guarantee that neither the diagnostic tool nor the core product capabilities diverge:
- **Repository-Specific Rules (`.agents/AGENTS.md`):** Mandate running repository-specific diagnostic tools (`amiga-ia-setup --doctor` / `node bin/setup.js --doctor`) during pre-flight release workflows to verify that both the diagnostic tool and the product definitions agree.
- **Universal Agent Generalization (`agents/ami-release-manager.md`):** Keep portable agent definitions domain-agnostic. Instead of hardcoding repo-specific commands, instruct the agent to inspect repository guidelines for local linting or health check scripts (`npm run lint`, project `doctor` scripts) and execute them generically.

---

## Key Takeaways
- Always strip `\uFEFF` before executing string-anchored regular expressions on user-editable markdown files.
- Keep diagnostic tools symmetrical with all declarative capabilities provided by the package.
- Separate repository-specific verification steps (in local instructions like `AGENTS.md`) from universal, domain-agnostic subagent prompts (in `agents/`).
