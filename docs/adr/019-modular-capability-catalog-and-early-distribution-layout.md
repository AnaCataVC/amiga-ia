# 19. Modular Capability Catalog and Early Distribution Layout

Date: 2026-10-25

## Status

Accepted

## Context

As **Amiga IA** matured through its architectural iterations into an expansive ecosystem of 36 distinct capabilities (14 autonomous subagents and 22 declarative skills), an independent portfolio audit identified two structural usability friction points in the repository documentation:

1. **Capability List Overload:** Displaying an uninterrupted 36-row matrix of all agents and skills in the root README created cognitive fatigue, delaying reviewers and recruiters from reaching key architectural innovations, empirical benchmark data, and developer learnings.
2. **Delayed Distribution Signal:** Positioning global installation commands (`npm install -g @anacatavc/amiga-ia`), the multi-runtime interactive CLI setup wizard, and the `doctor` diagnostics in Section 6 buried one of the strongest indicators of software engineering maturity—a published, executable package distribution—deep down the page.

We require an architectural restructuring that brings product installation to the forefront, curates the most impactful capabilities in the landing document, and preserves complete technical fidelity across dedicated catalog references.

## Decision

1. **Early Distribution Layout (Section 2):** Elevate installation, the interactive CLI wizard (`amiga-ia-setup`), and diagnostic health verification (`amiga-ia-setup doctor`) into Section 2 of `README.md` and `README.es.md`, immediately following the project description and end-to-end workflow diagram.
2. **Dedicated Capabilities Catalog (`docs/catalog.md` & `docs/catalog.es.md`):** Establish symmetric bilingual catalog documentation detailing all 36 capabilities categorized across 5 functional domains:
   - *Master Orchestrators & Code Review*
   - *Testing & Double-Blind Cleanroom TDD*
   - *Architecture, Codebase Hygiene & Knowledge Lifecycle*
   - *UI Prototyping & Consistency Auditing*
   - *Data Science & SQL Optimization*
3. **Curated Flagship Showcase (Section 5):** Retain a curated showcase in the root README presenting the primary flagship orchestrators (`ami-cleanroom-arbiter`, `ami-pr-reviewer`, `ami-repo-auditor`, `ami-tech-lead`, `ami-ui-builder`, `ami-push-assistant`) and flagship declarative skills (`ami-orchestrate-cleanroom`, `ami-review-self-pr`, `ami-audit-quality`, `ami-prototype-ui`), directing readers to `docs/catalog.md` for the exhaustive matrix.
4. **Synchronization Rule Realignment (Rule 17):** Update repository engineering directives (`AGENTS.md`) so that pre-release audits assert exact count and naming accuracy (14 agents, 22 skills) against `docs/catalog.md` and `docs/catalog.es.md`, maintaining strict documentation integrity.

## Consequences

- **Positive:** Greatly enhances portfolio readability; surfaces package distribution within the first screenful; organizes the 36 capabilities into domain-specific clusters; reduces bounce rate for technical evaluators.
- **Trade-off:** Adds an additional level of documentation hierarchy via `docs/catalog.md`, which is mitigated by clear cross-linking and automated pre-release verification scripts.
