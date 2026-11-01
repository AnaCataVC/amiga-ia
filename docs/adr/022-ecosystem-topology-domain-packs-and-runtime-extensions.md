# 22. Ecosystem Topology, In-Tree Domain Packs, and Runtime Extensions

Date: 2026-11-01

## Status

Accepted

## Context

As **Amiga IA (`@anacatavc/amiga-ia`)** matured into a flagship multi-agent software engineering suite comprising 14 autonomous subagents and 25 declarative skills across Google Antigravity, Anthropic Claude Code, and OpenAI Codex, architectural planning examined whether to decompose specialized capabilities (`data`, `ui`, `cleanroom`, `research`) into separate physical GitHub repositories.

An adversarial stress-test evaluated physical multi-repo fragmentation versus virtual in-tree domain packs:
1. **Physical Repository Fragmentation Hazard:** Decomposing declarative skills into external repositories (`AnaCataVC/ami-data`, `AnaCataVC/ami-ui`) introduces custom package manager overhead (HTTP fetchers, GitHub API rate limits, custom SemVer solvers) to manage fewer than 25 KB of Markdown files. Furthermore, it risks orphaned file deletion hazards during parent re-installs, breaks offline installation guarantees, and duplicates the compilation pipeline for OpenAI Codex (`codex/agents/*.toml` and `codex/skills/`).
2. **True Runtime Extension Boundary:** In contrast to portable declarative Markdown skills, `ami-claude-mods` (`AnaCataVC/ami-claude-mods`) contains TypeScript/ESM extensions tightly coupled to Claude Code's internal `EngineInterface` (`$`), reactive state atoms, and terminal Ink UI components installed to `~/.claude/mods/`. It possesses a genuinely independent runtime lifecycle and test framework (`claude-code/testing`).

A formal architectural topology is required to govern packaging, CLI ergonomics, capability ownership, and repository creation rules.

## Decision

1. **Parent Repository as Ecosystem Core & Distribution (`amiga-ia`):**
   - `@anacatavc/amiga-ia` remains the parent repository, root npm package, and home of the **Essential Pack** (architecture, planning, code quality, git hygiene, automated testing, double-blind cleanroom TDD, and meta-tooling).
2. **Ergonomic CLI Binary (`ami`):**
   - Introduce `ami` as the primary CLI command alongside `amiga-ia-setup` for backward compatibility.
   - Provide clean subcommands: `ami install`, `ami list`, `ami add <pack|ext>`, `ami remove <pack|ext>`, `ami doctor`, and `ami uninstall`.
3. **Virtual In-Tree Domain Packs (`registry/packs.json`):**
   - Rather than creating fragile micro-repositories, domain-specific capabilities are logically grouped into in-tree Domain Packs inside `@anacatavc/amiga-ia`:
     - **`essential` (12 agents, 20 skills):** Core engineering primitives.
     - **`data` (1 agent, 2 skills):** `ami-data-scientist`, `ami-optimize-sql`, `ami-build-dashboard`.
     - **`ui` (1 agent, 3 skills):** `ami-ui-builder`, `ami-design-ux`, `ami-prototype-ui`, `ami-audit-ui-consistency`.
   - Capabilities remain physically versioned in `skills/`, `agents/`, and `codex/`, preserving 100% offline installation and zero compilation drift for Codex.
4. **External Runtime Extensions (`claude-mods`):**
   - `ami-claude-mods` resides in its own repository (`AnaCataVC/ami-claude-mods`) and is recognized as a platform-specific `runtime-extension`.
   - Supported via `ami add claude-mods` and `ami remove claude-mods`, installing/removing the 6 mods into `~/.claude/mods/` with local sibling auto-resolution for instant development.
5. **Installation Receipts (`.amiga-version.json`):**
   - Environment manifests in `~/.claude/`, `~/.gemini/config/`, and `~/.codex/` track `installedPacks`, `installedExtensions`, and relative files, allowing surgical addition and removal without deleting user-created tools.
6. **Formal Repository Creation Rule (Anti-Micro-Repo Invariant):**
   - A capability does NOT receive its own repository merely because it represents a category.
   - Dedicated repositories are permitted ONLY when:
     - It represents a technical runtime extension coupled to host engine internals (e.g. `ami-claude-mods`).
     - It possesses heavy non-portable native binaries, Python environments, or independent server daemons (>15 skills) that would unjustifiably inflate the core npm distribution.
     - Never create: `ami-git`, `ami-release`, `ami-quality`, `ami-docs`, `ami-testing`, `ami-agents`, or `ami-skills`.

## Consequences

- **Positive:**
  - Preserves single-pass CI/CD, atomic pre-tag versioning, and zero-network offline installation.
  - Users can selectively enable or disable `data` and `ui` capabilities without managing separate git clones or npm packages.
  - Adds ergonomic `ami` CLI commands (`install`, `list`, `add`, `remove`, `doctor`).
  - Seamlessly bridges `amiga-ia` with `ami-claude-mods` via declarative receipts and doctor diagnostics.
- **Trade-off:**
  - Requires maintaining `registry/packs.json` synchronized with all skills and agents, enforced automatically via `tests/manifests.test.js`.
