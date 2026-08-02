> **Created:** 2026-08-02
> **Last Updated:** 2026-08-02

# ADR-002: Multi-Skill Subagent Orchestration & Pure Skill Boundaries

## Context & Problem Statement

As **Amiga IA** evolved into an extensive ecosystem of 17 declarative skills and multiple automated workflows, executing high-volume analytical workloads—such as repository-wide technical debt audits, multi-module documentation synchronization, and large Pull Request code reviews—directly within a sequential, single-agent conversation loop presented serious friction:
* **Context Window Pollution:** Extensive filesystem reads and sequential bash CLI outputs cluttered the primary interactive chat window with verbose logging, diluting user conversation history.
* **Attention Decay:** Attempting complex, multi-step analytical checks across dozens of files sequentially caused LLM context exhaustion and degraded instructional focus over long sessions.
* **The Skill-Subagent Dilema:** Embedding explicit subagent invocation instructions directly within declarative Skills (`skills/*/SKILL.md`) degraded real-time interactive user dialogue for quick, single-file checks and coupled domain recipes to platform-specific subagent spawning APIs.

We required an architectural paradigm that enables parallel execution and background context window isolation for heavy workloads while retaining lightweight, real-time interactivity for conversational tasks.

## Decision

We decided to establish a strict division of labor between **Declarative Procedural Skills** and **Multi-Skill Orchestrator Agents**, governed by four core operational principles:

### 1. Pure Skill Boundaries (No Embedded Subagent Spawning)
Skills (`skills/*/SKILL.md`) serve exclusively as declarative procedural knowledge recipes and single sources of truth for domain logic. They MUST NOT embed hardcoded instructions to invoke subagents (`invoke_subagent`, `define_subagent`, or background worker forks). Keeping skills devoid of orchestration logic preserves their domain agility, low token consumption, and seamless compatibility with interactive, step-by-step chat workflows.

### 2. Capability Discovery (Local Repository Prioritization)
Orchestrator Agents (`agents/*.md`) MUST conduct proactive workspace inspection (scanning directories like `.github/agents/` or `.gemini/agents/`) prior to spawning generalist subagents. When repository-defined domain workers (e.g., custom enterprise security or database review agents) exist, the orchestrator delegates tasks directly to them, ensuring organizational engineering protocols and internal business constraints are respected.

### 3. The Skill-Injection Pattern
Instead of skills invoking subagents, Orchestrator Agents deploy concurrent background workers via **Skill-Injection**. The orchestrator passes the contents or file paths of one or more relevant `SKILL.md` procedural recipes directly into an isolated subagent worker's initial prompt (e.g., injecting `ami-tech-debt-scanner`, `ami-dependency-analyzer`, and `ami-quality-auditor` into parallel worker subagents across distinct repository modules).

### 4. Complexity Gating
Orchestrators apply conditional execution thresholds based on task footprint:
- **Sequential Chat Mode (< 200 lines or localized single-file checks):** Execute required skills directly inside the active chat conversation window to minimize token overhead and latency.
- **Parallel Subagent Fan-Out (≥ 200–500 lines or multi-module sweeps):** Fork concurrent read-only background worker subagents across segmented modules, providing total context window isolation and accelerating analytical turnaround.

## Consequences

### Positive:
* **Zero Chat Contamination:** High-volume file explorations and multi-step audits complete silently inside isolated background worker windows, delivering clean executive summaries directly to the user chat.
* **Maximized Code Reuse:** A single declarative skill definition (`SKILL.md`) operates unmodified across both rapid interactive dialogues and parallelized background subagent swarms.
* **Elimination of Single-Skill Wrapper Anti-Patterns:** Fusing related skills into cohesive triads under powerful master orchestrators (e.g., `ami-doc-architect`, `ami-repo-auditor`, and `ami-pr-reviewer`) provides genuine architectural leverage rather than superficial 1:1 wrapper redirection.

### Negative:
* **Dual Design Discipline:** Maintainers must mentally separate procedural task recipes (written in `skills/`) from parallelization and delegation topologies (written in `agents/`).

## Status

**Accepted** & Implemented in `v2.9.0`.
