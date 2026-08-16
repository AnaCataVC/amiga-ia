# Pattern: Atomic Commit Boundaries Across Distribution & Internal Tooling Layers

## Context & Challenge

In open-source and modular AI tooling repositories that are distributed as packages (e.g., via NPM or CLI wizards), developers and AI coding assistants frequently modify multiple types of files in a single session:
1. **Core Product Capabilities:** The actual portable tools, skills (`skills/*/SKILL.md`), and subagents (`agents/*.md`) that end-users install and consume.
2. **Distribution & Packaging Infrastructure:** Setup CLI wizards (`bin/setup.js`), dependency manifests, and plugin descriptors.
3. **Internal Repository Directives & Guidelines:** Files exclusively meant for AI agents operating inside the local repository (e.g., `.agents/AGENTS.md`, `.claude/`, `.gemini/`, `.cursor/` workspace settings).
4. **Persistent Project Memory & Documentation:** Architectural Decision Records (`docs/adr/`), learning notes (`docs/learning/`), and root `README.md`.

When changes across these distinct layers are lumped into a single monolithic commit, several problems arise:
- **Changelog Noise & Obfuscation:** Release notes generators and downstream consumers cannot cleanly isolate product feature changes from internal developer instructions.
- **Git History Pollution:** Reverting or cherry-picking internal repository guidance inadvertently rolls back core library features, and vice versa.
- **Package Boundary Violations:** AI assistants can lose clarity on which files belong in the distributed product versus which files are internal meta-instructions.

---

## The Solution Pattern: Layer-Aware Commit Boundaries

Establish strict layer boundaries for staging and committing changes:

### 1. Define Clear Distribution Layers
Explicitly document the architectural layers of the workspace:
- **Layer 1 (Distributed Product Capabilities):** Portable, domain-agnostic skills, agent prompts, and runtime adapters that are bundled in the package release.
- **Layer 2 (Distribution Engine):** Package manager manifests and setup scripts.
- **Layer 3 (Internal Repository AI Guidelines):** Developer workflows, repository-specific pre-flight checks, and agent guidelines (`.agents/AGENTS.md`, `.claude/`) that are excluded from package distribution.
- **Layer 4 (Documentation & Knowledge Base):** Project documentation, ADRs, and persistent AI learning logs.

### 2. Multi-Commit Staging Policy
Never commit Layer 1 product enhancements together with Layer 3/4 internal directives or standalone docs. Split them into clean, atomic Conventional Commits:

```bash
# Commit 1: Core Product Enhancement (Layer 1)
git add skills/ami-plan-commits/SKILL.md agents/ami-release-manager.md
git commit -m "feat(core): generalize ami-release-manager and add distribution layer grouping to ami-plan-commits"

# Commit 2: Internal Guidelines & Documentation (Layers 3 & 4)
git add .agents/AGENTS.md docs/README.md docs/learning/
git commit -m "docs: add repository layering guidelines, pre-release doctor audit, and distribution learnings"
```

### 3. Embed Layer Awareness into Commit Planning Skills
Equip the repository's commit planning skills (`ami-plan-commits`) to automatically inspect file paths and propose groupings based on distribution scope.

---

## Key Takeaways
- Always separate distributed product code from internal AI guidelines and documentation in git history.
- Use Conventional Commit scopes (`feat(core):`, `docs:`, `chore:`) to clearly reflect distribution boundaries.
- Keep portable skills and agents clean of repo-specific internal instructions.
