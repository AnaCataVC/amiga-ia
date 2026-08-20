# Adversarial Architecture & Context Deduplication in Multi-Agent Ecosystems

> **Created:** 2026-08-20  
> **Last Updated:** 2026-08-20  
> **Domain:** Multi-Agent Orchestration, Prompt Engineering, Knowledge Persistence

---

## 1. The Sycophancy Problem in AI Architecture Planning

### The Problem
Language models are instruction-tuned to be helpful and constructive. In architectural discussions, this produces an inherent blind spot: **affirmative bias**. When a user proposes an architectural pattern or tech stack, the model's natural inclination is to synthesize reasons why the solution is viable and design a plan to achieve it, glossing over operational landmines, concurrency race conditions, and hidden cloud cost multipliers.

### The Solution: Explicit Adversarial Premortem
To counteract this bias, we codified the **Premortem Analysis Pattern** into `ami-stress-test-idea` and mandated an Adversarial / Devil's Advocate persona in `ami-expert-council`.
- The reviewer begins with the axiomatic premise: *"It is 6 months in the future, and this feature suffered a catastrophic production outage. What broke?"*
- By forcing the model to explain *how* a failure happened rather than *if* it could happen, the AI bypasses polite sycophancy and isolates brittle state, unindexed queries, and single points of failure (SPOFs).

---

## 2. Token Tax Optimization: The Single-Point Ingestion Pattern

### The Problem: Multi-Agent Redundant Scans
When a master orchestrator (`ami-tech-lead`) spawns multiple subagents (e.g., in `ami-expert-council` or feature execution):
- Subagent A executes `grep_search` across `docs/` and the codebase.
- Subagent B executes `grep_search` across `docs/` and the codebase.
- Subagent C runs web search queries for documentation already stored in `docs/external-references/`.

This leads to exponential token waste and latency.

### The Solution: Prompt Context Injection
1. **Orchestrator Ingestion:** The root agent or skill scans repository memory (`docs/adr/`, `docs/learning/`, `docs/architecture/`) once at the workflow initiation.
2. **Context Injection:** When calling `invoke_subagent`, the relevant ADR constraints, target files, and research summaries are passed directly within the worker's prompt.
3. **Explicit Subagent Constraints:** Subagents are instructed to debate or build directly on the injected context, eliminating independent filesystem re-scanning.

---

## 3. Closed-Loop Documentation Architecture

Knowledge management in decentralized agent systems must be self-healing:
1. **Pre-Push Gate (`ami-push-assistant`):** Captures session learnings (`ami-extract-learnings`) and checks documentation diffs (`ami-manage-docs`) before staging commits.
2. **Pre-Release Gate (`ami-release-manager`):** Audits bilingual README tables, ADR sequential integrity, and architecture guides prior to semantic version calculation.

This closed-loop lifecycle ensures that every architectural iteration is captured in persistent memory without manual developer overhead.
