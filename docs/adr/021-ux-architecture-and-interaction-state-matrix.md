# 21. UX Architecture, Heuristics, and Interaction State Completeness

Date: 2026-10-27

## Status

Accepted

## Context

Following the adoption of ADR 018, Amiga IA gained autonomous UI prototyping (`ami-prototype-ui`), subagent execution (`ami-ui-builder`), and design system token auditing (`ami-audit-ui-consistency`). While these tools established disciplined visual layouts, zero-build HTML5 mockups, and token consistency, presentation-layer development routinely encountered friction upstream of styling:

1. **Happy Path Bias & State Voids:** Prototyping workflows primarily modeled the ideal, fully populated screen state. Production implementations frequently lacked interaction specifications for edge states: empty states (first-time onboarding vs. zero search results), loading skeletons (preventing cumulative layout shifts), partial connectivity degradation, and actionable error recovery.
2. **Cognitive Load & Information Architecture Gaps:** Complex features lacked structured progressive disclosure guidelines, leading to crowded interfaces that violated fundamental laws of UX (such as Hick's Law and Miller's Law).
3. **Microcopy Ambiguity & Data Leakage Risks:** Button microcopy routinely defaulted to vague labels ("Submit", "OK"), while error feedback risked leaking internal backend architecture (database errors, table names, stack traces) under the guise of detailed error reporting.
4. **Disjointed Hand-offs:** Front-end implementers (`ami-cleanroom-builder`) had to invent state transitions and error copy on the fly during code generation because no formal interaction contract existed between feature planning (`ami-plan-feature`) and visual mockups.

## Decision

We introduce a dedicated **UX Architecture and Interaction State Completeness** specification within the Amiga IA ecosystem:

### 1. Declarative UX Skill (`skills/ami-design-ux/SKILL.md`)
- Establishes a formal workflow for user intent decoding, mental model alignment, progressive disclosure, and cognitive friction reduction.
- Incorporates Jakob Nielsen's 10 Usability Heuristics and core Laws of UX (Hick, Fitts, Miller, Peak-End Rule, Doherty Threshold).
- Provides a **Fast-Path Tier** for routine CRUD views to prevent analysis paralysis, while reserving deep cognitive mapping for multi-step workflows.

### 2. The 5 Essential UX States Matrix
Mandates that all interactive user interfaces explicitly define five canonical operational states:
1. **Ideal / Populated:** Standard operating state with loaded data.
2. **Empty State:** Guided empty state with an empathetic illustration/icon and an actionable CTA escape path.
3. **Loading & Transition:** Layout-matched skeleton loaders preventing layout shifts (CLS), with progressive feedback for requests exceeding 2 seconds.
4. **Error & Recovery:** Enforcing the **Zero Information Leakage Invariant**—human-empathic, solution-oriented copy with clear recovery actions (retry, check network) while strictly abstracting away internal backend details.
5. **Partial / Degraded:** Graceful degradation indicators for offline modes and local session draft recovery.

### 3. Living UX Specifications Directory (`docs/ux/`)
- Formalized `docs/ux/<feature-slug>.md` as the authoritative living repository contract for interaction models, state matrices, and microcopy tables.
- Linked directly from feature plans (`implementation_plan.md`) and consumed by `ami-prototype-ui` and `ami-cleanroom-builder`.

### 4. Interactive State Switcher in Visual Prototypes
- Enhanced `skills/ami-prototype-ui/SKILL.md` and `agents/ami-ui-builder.md` to ingest `docs/ux/<feature-slug>.md`.
- HTML5 mockups incorporate lightweight interactive state toggles (state pills) toggling visibility classes (`hidden`/`block`) to allow instant browser evaluation of all five states without inflating DOM markup or CSS overhead.

## Consequences

- **Positive:**
  - Provides a definitive upstream interaction contract that bridges feature logic (`ami-plan-feature`) with visual mockups (`ami-prototype-ui`) and implementation (`ami-cleanroom-builder`).
  - Eliminates guesswork around empty, loading, and error states before front-end code is written.
  - Enforces actionable microcopy and protects application security by prohibiting internal data leakage in user error messages.
- **Negative:**
  - Adds an explicit interaction design step to the feature lifecycle for user-facing components, mitigated by the Fast-Path tier for simple screens.
