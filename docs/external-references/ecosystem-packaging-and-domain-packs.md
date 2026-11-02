> **Created:** 2026-11-01
> **Last Updated:** 2026-11-01
> **Status:** Active
> **Scope:** Ecosystem Packaging, In-Tree Domain Packs, and Runtime Extension Connectors

# Ecosystem Packaging, Domain Packs, and Runtime Extensions

## 1. Architectural Synthesis: In-Tree Domain Packs vs. Multi-Repo Fragmentation

During architectural stress-testing of the proposed AMIGA IA packaging strategy, two competing models were evaluated for organizing domain-specific capabilities (`data`, `ui`) alongside core software engineering capabilities (`essential`):

### Model A: Physical Multi-Repo Fragmentation (Rejected for Declarative Domain Packs)
Extracting declarative Markdown agents and skills (`ami-data-scientist`, `ami-optimize-sql`, `ami-build-dashboard`) into standalone repositories (`AnaCataVC/ami-data`, `AnaCataVC/ami-ui`) introduces disproportionate operational and runtime complexity:
- **Orphaned File Destruction Hazard:** `cleanOrphanedFiles` in `amiga-ia` prunes any `ami-*` file not present in the parent source directory. Re-running `ami install` on the parent would wipe externally installed domain packs unless complex cross-package lockfiles are maintained.
- **Custom Package Manager Overhead (YAGNI Violation):** Downloading 25 KB of Markdown files over HTTP from GitHub Releases at runtime introduces network SPOFs, corporate proxy failures, and GitHub API rate-limiting (`60 req/hr` unauthenticated), while requiring custom semver resolvers and tarball extractors.
- **Tri-Ecosystem Build Drift:** OpenAI Codex requires pre-compiled `.toml` agent profiles (`codex/agents/*.toml`) and adapted skill templates (`codex/skills/`). Splitting declarative skills across repositories duplicates the compilation pipeline and breaks single-pass CI validation (`npm test` and token-overhead benchmarks).

### Model B: Virtual In-Tree Domain Packs + External Runtime Extensions (Adopted)
All portable, declarative Agent Skills and Subagents remain physically versioned inside `@anacatavc/amiga-ia` (`skills/`, `agents/`, `codex/`), while `registry/packs.json` defines logical **Domain Packs** (`essential`, `data`, `ui`) and external **Runtime Extensions** (`claude-mods`):
- **Zero-Latency Offline Installation:** `ami add data` or `ami add ui` installs capabilities directly from the local NPM package payload in milliseconds without network requests.
- **Selective Context Window Hygiene:** Users can install only `essential` (or selectively add `data` / `ui`), keeping their active agent/skill catalog lean while preserving single-repo CI integrity.
- **True Runtime Extension Isolation (`ami-claude-mods`):** Unlike declarative Markdown skills, `ami-claude-mods` (`AnaCataVC/ami-claude-mods`) contains TypeScript/ESM plugins coupled to Claude Code's internal `EngineInterface` (`$`), reactive atoms, and terminal Ink UI surfaces (`~/.claude/mods/`). Therefore, `ami-claude-mods` legitimately resides in its own repository and is managed as an external `runtime-extension`.

---

## 2. Capability Classification & Ownership Matrix (14 Agents, 25 Skills)

Every capability in `amiga-ia` is assigned a single primary pack owner in `registry/packs.json`:

| Pack ID | Kind | Default in Wizard | Agents (14 total) | Skills (25 total) |
| :--- | :--- | :--- | :--- | :--- |
| **`essential`** | `domain-pack` (Core) | Yes (Mandatory base) | `ami-tech-lead`, `ami-expert-council`, `ami-repo-auditor`, `ami-adversarial-verifier`, `ami-pr-publisher`, `ami-pr-reviewer`, `ami-push-assistant`, `ami-release-manager`, `ami-doc-architect`, `ami-cleanroom-arbiter`, `ami-cleanroom-builder`, `ami-cleanroom-tester` (12) | `ami-architect-project`, `ami-plan-feature`, `ami-stress-test-idea`, `ami-research-context`, `ami-audit-quality`, `ami-scan-tech-debt`, `ami-analyze-dependencies`, `ami-debug-issue`, `ami-analyze-pr-comments`, `ami-detect-pr-conflicts`, `ami-plan-commits`, `ami-prepare-release`, `ami-review-peer-pr`, `ami-review-self-pr`, `ami-manage-docs`, `ami-create-tests`, `ami-design-test-strategy`, `ami-orchestrate-cleanroom`, `ami-discover-ai-agents`, `ami-discover-automations` (20) |
| **`data`** | `domain-pack` | Optional (Checked by default) | `ami-data-scientist` (1) | `ami-optimize-sql`, `ami-build-dashboard` (2) |
| **`ui`** | `domain-pack` | Optional (Checked by default) | `ami-ui-builder` (1) | `ami-design-ux`, `ami-prototype-ui`, `ami-audit-ui-consistency` (3) |
| **`claude-mods`** | `runtime-extension` | Optional (Via `ami add claude-mods` or Claude setup) | *N/A (Claude Engine ESM Mods)* | Mods: `hooks-viewer`, `undelegated-reads`, `close-checklist`, `child-sessions`, `cleanroom-guard`, `context-guard` (6 mods installed to `~/.claude/mods/`) |

---

## 3. Installation Receipts & Safe Pruning Invariant (`.amiga-version.json`)

To support selective pack installation (`ami add <pack>`, `ami remove <pack>`) and prevent `cleanOrphanedFiles` from deleting active packs or external extensions:
1. `.amiga-version.json` in each target assistant directory (`~/.claude/`, `~/.gemini/config/`, `~/.codex/`) is extended with `installedPacks: ["essential", "data", "ui"]`, `installedExtensions: {}`, and `files: []` (receipts of installed relative paths).
2. `cleanOrphanedFiles` only prunes legacy/renamed `ami-*` files that do not belong to any currently enabled pack in `installedPacks`, never touching `~/.claude/mods/`.
3. `ami add claude-mods` resolves `AnaCataVC/ami-claude-mods` (checking local sibling checkout first for offline/developer speed, or cloning/fetching the pinned tag/archive into `~/.claude/mods/`), registering the receipt in `~/.claude/.amiga-version.json`.
