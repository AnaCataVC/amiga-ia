# 6. Adversarial Review & Context Deduplication Architecture

Date: 2026-08-20

## Status

Accepted

## Context

As the Amiga IA ecosystem expanded with specialized subagent orchestrators (`ami-tech-lead`, `ami-expert-council`, `ami-push-assistant`, `ami-release-manager`) and rich markdown skills, two architectural challenges emerged:

1. **Affirmative Bias in LLM Planning:** When planning features or architectural shifts, LLMs naturally lean towards agreeable consensus (*sycophancy / affirmative bias*). They focus on proving why an idea will work rather than methodically attempting to break assumptions, uncover single points of failure (SPOFs), or expose cost/concurrency explosions.
2. **Context Redundancy & Token Waste:** In multi-agent pipelines, orchestrators frequently delegated tasks to subagents without transferring pre-ingested context. Consequently, each subagent repeated redundant filesystem searches (`grep_search`, `list_dir`) and re-executed duplicate web searches for references already saved in `docs/external-references/`.
3. **Documentation Lifecycle Drift:** Without active verification gates during `git push` and GitHub release workflows, documentation (`README.md`, ADRs, architecture guides) could drift out of synchronization with codebase capabilities.

## Decision

We have established three foundational architectural invariants across the suite:

1. **Adversarial Architecture & Stress-Testing (`ami-stress-test-idea` + Red Team in `ami-expert-council`):**
   - Implemented the `ami-stress-test-idea` skill based on structured **Premortem Analysis** across 5 attack vectors: Operational Failures, Concurrency & SPOFs, Cost/Resource Explosions, Security/Abuse Vectors, and Developer Friction.
   - Enforced that for any high-impact architectural change or new dependency adoption in `ami-expert-council`, **at least one instantiated expert MUST act as a dedicated Adversarial Red Team Auditor (Devil's Advocate)** to systematically attack affirmative assumptions.

2. **Single-Point Ingestion & Context Injection (DRY):**
   - Orchestrators (`ami-tech-lead`, `ami-plan-feature`, `ami-architect-project`) ingest repository memory (`docs/adr/`, `docs/learning/`, `docs/architecture/`) once per workflow.
   - Before executing live searches, agents check `docs/external-references/` for existing, up-to-date benchmarks.
   - When spawning worker subagents, orchestrators inject the relevant ADR constraints and research summaries directly into the subagents' system prompts, strictly prohibiting subagents from repeating independent filesystem scans.

3. **Closed-Loop Documentation & Learning Synchronization:**
   - Updated `ami-push-assistant` (Steps 5 & 6) to actively extract session learnings into `docs/learning/` or `docs/adr/` and verify documentation synchronization in the pre-push report.
   - Updated `ami-release-manager` (Step 1) to mandate a pre-release documentation audit (`ami-manage-docs`) ensuring total consistency across `README.md` tables, ADRs, and architecture guides prior to tagging.

## Consequences

- **Positive:** Plans are rigorously stress-tested before code generation, token consumption in multi-agent workflows is drastically reduced through prompt context injection, and repository documentation remains permanently synchronized with codebase reality.
- **Negative:** Architectural debates require explicit framing to prevent subagents from getting trapped in adversarial deadlock, which is mitigated by timeboxing debates to 1-2 structured rounds under the facilitator agent.
