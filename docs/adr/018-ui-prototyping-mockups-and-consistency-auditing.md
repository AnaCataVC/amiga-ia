# 18. Autonomous UI Prototyping, Living Specifications, and Design Token Consistency Auditing

Date: 2026-10-18

## Status

Accepted

## Context

As the Amiga IA multi-agent ecosystem expanded, feature development workflows routinely encountered substantial friction at the presentation layer:

1. **Context Window Pollution During UI Authoring:** Crafting rich user interfaces generates extensive verbose markup, deeply nested Tailwind CSS utility classes, and inline SVG assets. Generating and refining UI layouts in the primary conversation thread saturated LLM context windows, crowding out essential domain reasoning and architectural context.
2. **Heavy Build Chain Overhead for Early Wireframes:** Rapidly iterating on UI ideas or validating visual layouts previously required spinning up complex frontend toolchains, Node.js development servers, or framework compilers. When users needed to evaluate visual workflows or screen states prior to implementation, waiting on compilation or diagnosing build errors impeded velocity.
3. **Coupled UI and Code Quality Auditing:** While `skills/ami-audit-quality` rigorously evaluated logic maintainability, DRY principles, and security boundaries, user interface consistency required an orthogonal set of visual constraints: design system token adherence, button hierarchy discipline (the single primary action invariant), comprehensive interactive states (`hover`, `focus-visible`, `disabled`), and icon family cohesion. Lacking dedicated UI quality gates led to hardcoded hexadecimal colors and fragmented interactive states leaking into production.
4. **Living Specification Drift:** Visual prototypes and wireframes were historically created in disparate external tools or transient scratchpads, leading to divergence between initial design intentions and implemented components.

## Decision

We have introduced a dedicated UI Prototyping and Consistency Architecture within the Amiga IA ecosystem:

### 1. Autonomous UI Specialist Agent (`agents/ami-ui-builder.md`)
- Introduced `ami-ui-builder` as an autonomous subagent profile across Claude Code (`~/.claude/agents/`), Google Antigravity (`~/.gemini/config/agents/`), and OpenAI Codex (`~/.codex/agents/`).
- Delegated tasks requiring screen prototyping, landing pages, or visual layouts execute in an isolated subagent context, shielding the primary interaction session from markup bloat.
- Establishes collaborative delegation handoffs with `ami-data-scientist` and `ami-build-dashboard` for executive data visualizations, and with `ami-cleanroom-builder` for front-end implementation staging.

### 2. Standalone Rapid Prototyping Skill (`skills/ami-prototype-ui/SKILL.md`)
- Generates zero-dependency, self-contained HTML5 prototypes utilizing standard Tailwind CSS via CDN.
- Prototypes are 100% portable and viewable immediately in any browser using the `file:///` protocol without running local servers, package managers, or bundlers.
- Enforces modern UI accessibility: semantic HTML landmarks (`<main>`, `<nav>`, `<aside>`), ARIA labels for icon-only buttons, keyboard tab navigation, and readable typographic hierarchies.

### 3. Living UI Specifications Directory (`docs/mockups/`)
- Formalized `docs/mockups/<feature-slug>.html` as the persistent repository directory for living interface specifications.
- Living mockups act as authoritative visual contracts: linked directly from feature implementation plans (`implementation_plan.md`) and architecture specs to align developers and AI agents on exact visual layouts and interaction states.
- Integrated into documentation lifecycle audits (`ami-manage-docs`) to ensure obsolete mockups are archived or pruned when corresponding features are decommissioned.

### 4. Dedicated UI & Design System Consistency Auditor (`skills/ami-audit-ui-consistency/SKILL.md`)
- Created a specialized audit skill covering Web (Tailwind, CSS Modules, CSS variables), Desktop (WinUI 3, WPF, MAUI XAML resources), and Mobile (Jetpack Compose, Flutter themes).
- Enforces strict design system invariants:
  - **Zero Hardcoded Colors:** Flagging hexadecimal, RGB, and HSL literals in new code as critical blocking defects.
  - **Single Primary Action Rule:** Limiting screens and dialogs to at most one prominent call-to-action button to eliminate visual competition.
  - **Interactive States Completeness:** Mandating explicit hover, focus-visible, and disabled styling.
  - **Icon Family Cohesion:** Enforcing a single icon library (e.g., Lucide SVG) with uniform dimensions and accessible labelling.
- Integrated as a dedicated quality dimension in `skills/ami-audit-quality` and pre-commit checks in `skills/ami-plan-commits`.

## Consequences

- **Positive:**
  - Preserves token capacity in primary conversation threads by offloading markup generation to background subagents.
  - Enables instant browser preview of user interface designs with zero build toolchain friction.
  - Prevents design system drift and enforces accessible, consistent design tokens across Web, Desktop, and Mobile platforms.
  - Provides living visual contracts in `docs/mockups/` that bridge planning, implementation, and documentation.
- **Negative:**
  - Standalone CDN-based prototypes serve as visual prototypes rather than production framework code (e.g. React/Vue/Svelte components), requiring a subsequent translation step during cleanroom implementation.
