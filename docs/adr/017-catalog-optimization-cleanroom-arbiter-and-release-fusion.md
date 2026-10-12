# 17. Catalog Optimization: Cleanroom Arbiter Promotion, Release Preparation Fusion, and Audit Specialization

Date: 2026-10-12

## Status

Accepted

## Context

As the Amiga IA ecosystem matured into a unified multi-agent suite distributed across three distinct AI assistant runtimes (Anthropic Claude Code, Google Antigravity, and OpenAI Codex), capability catalog hygiene, clear agent boundary separation, and workflow efficiency required systematic optimization:

1. **Cleanroom TDD Structural Asymmetry:** Cleanroom Test-Driven Development originally introduced `ami-cleanroom-builder` and `ami-cleanroom-tester` as autonomous worker subagents in `agents/`, but the orchestrating mediation logic resided exclusively inside `skills/ami-orchestrate-cleanroom/SKILL.md`. In multi-agent architectures, an autonomous orchestrator managing peer worker subagents across strict information isolation boundaries requires a first-class agent persona (`agents/ami-cleanroom-arbiter.md`) to be directly invokable, dispatchable, and inspectable by higher-level orchestrators like `ami-tech-lead`.
2. **Release Preparation Workflow Fragmentation:** Preparing GitHub releases previously required executing two tightly coupled skills sequentially: `ami-tag-release` (calculating the semantic version bump from git commit history) and `ami-draft-release` (authoring bilingual user-facing release notes from the identical commit range). Splitting this single release preparation phase across two separate skills caused redundant git log queries, unnecessary token expenditure, and coordination overhead for `ami-release-manager`.
3. **Redundant Technical Debt and Dependency Inspections:** During repository audits orchestrated by `ami-repo-auditor`, `skills/ami-scan-tech-debt` historically evaluated package dependencies in addition to source code debt. However, `ami-repo-auditor` already dispatches `skills/ami-analyze-dependencies` as a dedicated parallel worker for package health, CVE vulnerabilities, and unused dependencies. Running dependency audits inside `ami-scan-tech-debt` caused duplicate token consumption, redundant scans, and potential reporting drift.
4. **Data Validation Header Inconsistency:** The internal header of `skills/ami-validate-data/SKILL.md` retained legacy terminology that did not accurately reflect its modern scope covering ORM models, migrations, temporal schema compatibility, and entry-boundary data validations.
5. **Catalog Sizing and Governance:** Prior to optimization, the catalog comprised 25 declarative skills and 12 autonomous subagents. Consolidating release preparation while elevating cleanroom arbitration harmonizes the suite into a balanced architecture of 24 declarative skills and 13 autonomous agents across Claude Code, Antigravity, and Codex.

## Decision

We have executed a comprehensive catalog optimization and architectural harmonization across the repository:

### 1. Autonomous Cleanroom Arbiter Promotion (`agents/ami-cleanroom-arbiter.md`)
- Promoted cleanroom orchestration to a dedicated autonomous agent: `ami-cleanroom-arbiter`.
- Completes the formal Cleanroom TDD triad:
  - **`ami-cleanroom-arbiter` (Master Orchestrator & Arbiter):** Conducts interactive contract inception with the user, freezes formal interface and behavioral contracts in `docs/contracts/<feature-slug>.contract.md`, dispatches worker subagents under cleanroom isolation boundaries, executes native test harnesses, and adjudicates failures across Code Defects, Over-Constrained Tests, and Contract Ambiguities.
  - **`ami-cleanroom-builder` (Implementer Agent):** Authors production source code strictly against the formal contract without inspecting test files or overfitting implementations.
  - **`ami-cleanroom-tester` (Black-Box QA Agent):** Formulates comprehensive test suites exclusively from the formal contract without inspecting production implementation files.
- Retained `skills/ami-orchestrate-cleanroom` as the declarative operational procedure while establishing `ami-cleanroom-arbiter` as the first-class agent persona across Claude Code (`~/.claude/agents/`), Antigravity (`~/.gemini/config/agents/`), and OpenAI Codex (`~/.codex/agents/`).
- Standardized the handoff protocol with `ami-tech-lead` and `skills/ami-plan-feature/SKILL.md` for seamless delegation within macro implementation plans.

### 2. Unified Release Preparation Skill (`skills/ami-prepare-release/SKILL.md`)
- Fused `ami-tag-release` and `ami-draft-release` into a single, cohesive skill: `ami-prepare-release`.
- Implemented three operational modes:
  - **Mode A: Full Preparation (Default):** Computes the next semantic version tag and drafts bilingual user-facing release notes.
  - **Mode B: Tag Only:** Evaluates commit history to calculate only the target SemVer tag.
  - **Mode C: Notes Only:** Formulates only the bilingual release notes draft.
- Consolidated git inspection to a single fetch-and-log cycle, eliminating redundant execution overhead.
- Enforced strict bilingual formatting (English followed by Spanish) with Conventional Commits grouping (`BREAKING CHANGES`, `Features`, `Bug Fixes`, `Maintenance`) and zero country flags.
- Pruned deprecated `skills/ami-tag-release/` and `skills/ami-draft-release/` directories from source manifests and distribution packages.

### 3. Strict Source Code Debt Specialization in `ami-scan-tech-debt`
- Specialized `skills/ami-scan-tech-debt` exclusively on source code debt: dead code, duplicated logic, constants centralization, intention markers (TODOs/FIXMEs), type erosion, permissive contracts, and latent architectural contract drift.
- Enforced clean teamwork boundaries: when invoked by an orchestrator such as `ami-repo-auditor`, `ami-scan-tech-debt` explicitly skips dependency analysis, yielding package hygiene evaluation entirely to `skills/ami-analyze-dependencies`.
- Preserved optional fallback consultation of `skills/ami-analyze-dependencies` solely when invoked directly by the user in standalone mode without prior audit context.

### 4. Modernized Data Consistency Header in `ami-validate-data`
- Updated the primary title and role definition in `skills/ami-validate-data/SKILL.md` to `# Skill: Data & Schema Consistency Validator`.
- Aligned documentation with its verified capabilities: ORM model checks, database connection queries, temporal in-flight serialization compatibility, entry-boundary gating, and two-phase migration verification.

### 5. Catalog Architecture Harmonization (24 Skills / 13 Agents)
- Rebalanced the global capability catalog to exactly **24 Declarative Skills** and **13 Autonomous Agents**.
- Synchronized across all three supported runtime distributions:
  - **Anthropic Claude Code:** `~/.claude/skills/` (24) and `~/.claude/agents/` (13).
  - **Google Antigravity:** `~/.gemini/config/skills/` (24) and `~/.gemini/config/agents/` (13).
  - **OpenAI Codex:** `~/.agents/skills/` (24) and `~/.codex/agents/` (13 TOML manifests compiled via `scripts/build-manifests.js`).
- Synchronized capability tables and directory counts symmetrically in both `README.md` and `README.es.md`.

## Consequences

### Positive
- **Cohesive Agent Hierarchy:** Cleanroom TDD operates as a balanced triad (`ami-cleanroom-arbiter`, `ami-cleanroom-builder`, `ami-cleanroom-tester`), allowing high-level orchestrators (`ami-tech-lead`) to delegate isolated verification cycles cleanly.
- **Reduced Release Latency & Token Usage:** Combining version tagging and changelog drafting into `ami-prepare-release` cuts redundant git inspections in half.
- **Zero Redundant Audit Scans:** Demarcating code debt from dependency analysis eliminates duplicate scans during repo-wide audits by `ami-repo-auditor`.
- **Tri-Ecosystem Parity:** Exact 24/13 capability parity is deterministically maintained across Claude Code, Antigravity, and Codex.

### Considerations & Mitigations
- **Deprecated Skill Pruning:** References to `ami-tag-release` and `ami-draft-release` in documentation and setup scripts are fully transitioned to `ami-prepare-release`. The setup installer (`bin/setup.js`) safely removes legacy folders on user upgrade.
