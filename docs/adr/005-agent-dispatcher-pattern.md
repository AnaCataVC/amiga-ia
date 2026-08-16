# ADR 005: Agent Dispatcher Pattern & Noun/Verb Naming Convention

## Status
Accepted

## Context
The repository contained a mix of "Agents" and "Skills" with inconsistent naming conventions (e.g., `ami-project-architect` as a skill, `ami-next-step-assistant` as an agent). Additionally, agents were becoming monolithic, mixing domain execution logic with high-level orchestrating logic. This caused bloat in system prompts and confusion in capabilities.

## Decision
1. **Naming Convention Enforced:**
   - **Skills** MUST use Action/Verb naming (e.g., `ami-architect-project`, `ami-plan-feature`).
   - **Agents** MUST use Role/Noun naming (e.g., `ami-tech-lead`, `ami-push-assistant`).
2. **Agent-as-Dispatcher Pattern:**
   - Agents (like the new `ami-tech-lead`) will act as lightweight dispatchers. Their system prompts will only define their persona and high-level routing rules.
   - When triggered, they will use `view_file` to read the explicit, heavy markdown rules of a specific **Skill** (e.g., `ami-guide-next-step` or `ami-plan-feature`) and execute them.
   - This keeps the context window pristine, enabling extreme token efficiency and "Lazy Loading" of capabilities.

## Consequences
- **Positive:** Massive reduction in default token usage. Clearer boundaries for agent capabilities. Simpler discovery of tools.
- **Negative:** Existing users might be broken by renamed skills.
- **Mitigation:** Renamed existing files (like `ami-project-architect` -> `ami-architect-project`) but documented a deprecation grace period in `AGENTS.md` for broader changes (deferred to v4.0.0).

## Date
2026-08-11
