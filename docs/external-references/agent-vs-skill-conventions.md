> **Created:** 2026-07-26
> **Last Updated:** 2026-08-02

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
1. **Coding Standards & Checklists:** Enforcing specific team conventions, linters, or formatting rules (e.g., `ami-audit-quality`).
2. **Step-by-Step Guidance Recipes:** Guiding the AI through multi-file edits or specific patterns (e.g., `ami-plan-commits`, `ami-manage-docs`).
3. **Data & Schema Validations:** Checking structural alignment between database definitions and code (e.g., `ami-validate-data`).
4. **Context Extractor & Research:** Gathering and persisting external notes (e.g., `ami-research-context`, `ami-extract-learnings`).

### Why use a Skill:
- **Token Efficiency:** The prompt body of a skill is only loaded into the AI's context when triggered, avoiding context bloat.
- **Direct Interaction:** Allows fluid step-by-step dialogue and immediate feedback with the user in the main chat.

---

## 🤖 When to Create an Agent (Subagent)

Create an **Agent** when a workflow requires **multi-skill orchestration, isolated context execution, or heavy background processing**.

### Ideal Use Cases:
1. **Multi-Skill Pipeline & Review Orchestrators:** Workflows that coordinate multiple distinct skills in sequence or in parallel (e.g., `ami-pr-reviewer` orchestrating peer/self review analysis across subagents, `ami-doc-architect` coordinating documentation + deep research + learnings extraction, `ami-repo-auditor` running technical debt + dependencies + quality audits, or `ami-release-manager` managing release lifecycles).
2. **Context-Heavy Explorations & Researches:** Tasks requiring hundreds of search/read steps that would contaminate or overflow the main conversation context (e.g., repository-wide health monitoring via `ami-repo-auditor`, codebase historical context gathering via `ami-doc-architect`).
3. **Isolated Parallel Workers:** Spawning multiple concurrent subagents to debate ideas or execute independent sub-tasks (e.g., `ami-expert-council`).

### Why use an Agent:
- **Context Isolation:** Keeps high-volume intermediate command outputs out of the main user chat.
- **Multi-Skill Orchestration:** Acts as a master coordinator that knows *which* skills to invoke and in what order.

---

## 🏗️ Orchestrating Subagents & Capability Discovery

To maintain architectural purity while maximizing performance, follow these standardized orchestration patterns:

### 1. Pure Skill Boundaries (No Embedded Subagent Spawning)
Skills (`skills/*/SKILL.md`) represent declarative procedural knowledge and MUST NOT contain hardcoded commands to summon subagents (e.g., `invoke_subagent`, `Agent`, `define_subagent`). Keeping skills free of execution control logic ensures they remain lightweight, domain-agnostic, and compatible with human-in-the-loop chat interactions without token overhead.

### 2. Capability Discovery (Prioritizing Local Repository Agents)
When working within advanced corporate or multi-module repositories that define custom local subagents (e.g., in `.github/agents/` or `.gemini/agents/`), Orchestrator Agents (such as `ami-pr-reviewer` or `ami-pr-publisher`) should actively discover and prioritize invoking those custom agents. This ensures local business logic, internal database models, and organizational security policies are respected.

### 3. The Skill-Injection Pattern
When an Orchestrator Agent fans out parallel review checks to subagents (whether discovered repository custom roles or standard background evaluation workers), it delegates tasks via **Skill-Injection**. The orchestrator passes the contents or file reference of the relevant `SKILL.md` directly into the worker subagent's initialization prompt (e.g., injecting `ami-audit-quality` into a repository security worker).

### 4. Complexity Gating (Token & Latency Thresholds)
Orchestrators must apply conditional gating before invoking subagents:
- **Small Tasks (< 200 lines / < 3 files):** Execute required review skills sequentially within the primary agent context window to minimize latency and token consumption.
- **Large Tasks (≥ 200–500 lines or multi-module diffs):** Fork parallel read-only worker subagents by injecting specialized skills across isolated context windows, mitigating attention decay and accelerating review turnaround.

---

## 🚫 Anti-Patterns to Avoid

1. **Single-Skill Wrapper Agents:** Creating an agent whose *only* instruction is to invoke a single skill without adding any orchestration, sub-context isolation, or multi-skill pipeline value (e.g., the obsolete `ami-commit-assistant`). Fusing the wrapper into the skill is vastly superior. In contrast, multi-skill orchestrator agents like `ami-doc-architect` and `ami-repo-auditor` represent best practices because they integrate triads of complementary skills, isolate high-volume file readings into worker context windows, and apply threshold-gated parallel fan-out.
2. **Over-Fragmenting Skills:** Creating micro-skills for basic 1-step actions that belong in a single comprehensive skill (e.g., having separate `doc-architect` and `doc-updater` skills instead of a unified `ami-manage-docs`).
3. **Duplicating Checks in Agent and Skill:** Having the orchestrator agent perform manual CLI checks before invoking a skill that performs the exact same checks. The skill MUST remain the single source of truth for domain logic.

---

## 🌐 Platform Conventions Summary

- **Antigravity (Gemini):** Uses native dynamic subagent invocation (`invoke_subagent`) and declarative skill XML indexing via universal adapters (`adapters/universal_adapter.js`).
- **Claude Code:** Uses `.claude-plugin/plugin.json` for plugin manifests, `.claude/agents/*.md` for agent profiles, and `SKILL.md` frontmatter for skills.
