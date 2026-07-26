> **Created:** 2026-07-26
> **Last Updated:** 2026-07-26

# Skill vs. Agent Conventions (Claude Code & Antigravity)

This reference documents the official conventions and design patterns determining when a capability should be implemented as a **Skill** vs. an **Agent (Subagent)** in Claude Code and Antigravity (AGY).

---

## 🎯 Summary Rule of Thumb

> **"Skills are what the AI knows (procedural recipes loaded on-demand), while Agents are what the AI does (isolated execution in a separate context window)."**

---

## 📊 Comparison Matrix

| Feature | **Skill (`skills/*/SKILL.md`)** | **Agent / Subagent (`agents/*.md`)** |
| :--- | :--- | :--- |
| **Primary Purpose** | Encoded procedural expertise, recipes, and checklists. | Bounded worker/executor for complex or multi-step tasks. |
| **Context Window** | Loads directly into the **current conversation window**. | Spawns in an **isolated sub-conversation context window**. |
| **Tool Capabilities** | Extends available prompt instructions; uses parent agent's tools. | Can be equipped with custom tool subsets, independent prompts, and models. |
| **Lifecycle** | Lazy-loaded dynamically on-demand when relevant. | Launched for a specific, bounded objective and terminates upon completion. |
| **User Interaction** | Directly interacts with the user in the main chat. | Communicates asynchronously or returns a final report to parent/user. |

---

## 🛠️ When to Create a Skill

Create a **Skill** when the goal is to define **procedural knowledge, guidelines, or repeatable recipes** that guide how the AI should evaluate or manipulate code in the current session.

### Ideal Use Cases:
1. **Coding Standards & Checklists:** Enforcing specific team conventions, linters, or formatting rules (e.g., `ami-quality-auditor`).
2. **Step-by-Step Guidance Recipes:** Guiding the AI through multi-file edits or specific patterns (e.g., `ami-commit-planner`, `ami-doc-manager`).
3. **Data & Schema Validations:** Checking structural alignment between database definitions and code (e.g., `ami-data-validator`).
4. **Context Extractor & Research:** Gathering and persisting external notes (e.g., `ami-context-researcher`, `ami-learnings-extractor`).

### Why use a Skill:
- **Token Efficiency:** The prompt body of a skill is only loaded into the AI's context when triggered, avoiding context bloat.
- **Direct Interaction:** Allows fluid step-by-step dialogue and immediate feedback with the user in the main chat.

---

## 🤖 When to Create an Agent (Subagent)

Create an **Agent** when a workflow requires **multi-skill orchestration, isolated context execution, or heavy background processing**.

### Ideal Use Cases:
1. **Multi-Skill Pipeline Orchestrators:** Workflows that coordinate multiple distinct skills in sequence (e.g., `ami-push-assistant` running quality + dependencies + data validation, or `ami-release-manager` managing version tagging + changelog drafting + GitHub publishing).
2. **Context-Heavy Explorations & Researches:** Tasks requiring hundreds of search/read steps that would contaminate or overflow the main conversation context (e.g., codebase-wide architectural refactoring, deep dependency audits).
3. **Isolated Parallel Workers:** Spawning multiple concurrent subagents to debate ideas or execute independent sub-tasks (e.g., `ami-expert-council`).

### Why use an Agent:
- **Context Isolation:** Keeps high-volume intermediate command outputs out of the main user chat.
- **Multi-Skill Orchestration:** Acts as a master coordinator that knows *which* skills to invoke and in what order.

---

## 🚫 Anti-Patterns to Avoid

1. **Single-Skill Wrapper Agents:** Creating an agent whose *only* instruction is to invoke a single skill without adding any orchestration, sub-context isolation, or multi-skill pipeline value (e.g., the obsolete `ami-commit-assistant`). Fusing the wrapper into the skill is vastly superior.
2. **Over-Fragmenting Skills:** Creating micro-skills for basic 1-step actions that belong in a single comprehensive skill (e.g., having separate `doc-architect` and `doc-updater` skills instead of a unified `ami-doc-manager`).
3. **Duplicating Checks in Agent and Skill:** Having the orchestrator agent perform manual CLI checks before invoking a skill that performs the exact same checks. The skill MUST remain the single source of truth for domain logic.

---

## 🌐 Platform Conventions Summary

- **Antigravity (Gemini):** Uses native dynamic subagent invocation (`invoke_subagent`) and declarative skill XML indexing via universal adapters (`adapters/universal_adapter.js`).
- **Claude Code:** Uses `.claude-plugin/plugin.json` for plugin manifests, `.claude/agents/*.md` for agent profiles, and `SKILL.md` frontmatter for skills.
