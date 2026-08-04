> **Created:** 2026-08-04
> **Last Updated:** 2026-08-04

# Token Consumption Audit & Optimization Strategy for Agent Skills

## 1. Executive Summary & Purpose

In advanced AI agent frameworks such as **Google Antigravity (Gemini)** and **Claude Code**, cognitive architecture relies on an extensible ecosystem of **Skills** and **Subagents**. While the entire suite contains over **27,600 tokens** of specialized engineering domain instructions, loading all instructions simultaneously would severely degrade latency and exhaust token budgets.

This audit evaluates the empirical token consumption of the `amiga-ia` declarative ecosystem and establishes targeted optimization strategies to minimize both the **Static System Prompt Tax** (the every-turn catalog cost) and the **Dynamic Execution Cost** (on-demand skill invocation and subagent deployment).

---

## 2. Empirical Suite Analysis (Token Consumption Breakdown)

Token estimates are derived using an standard approximation of **~3.8 characters per token** (or ~1.3 tokens per word), consistent with modern LLM tokenization (cl100k_base / Gemini models) for technical code and Markdown formatting.

### Summary Metrics of the `amiga-ia` Suite
* **Total Skills Dynamic Codebase Pool:** 17,592 tokens across 21 skills.
* **Total Agents Dynamic Codebase Pool:** 10,072 tokens across 9 subagents.
* **Total Operational Intelligence:** ~27,664 tokens.
* **Static Catalog System Prompt Tax:** ~3,335 tokens per turn (loaded into Turn 0 context via XML indexing and metadata catalogs).

---

### A. Skill Consumption Audit (`skills/`)
Skills operate via **Lazy Loading**: only their YAML Frontmatter description is kept in the persistent system prompt tool catalog, while their Markdown body is dynamically pulled via file-reading tools (`view_file`, `Read`) only when executed.

| Skill Name | Catalog (Frontmatter Description) | Execution Body (Dynamic Load) | Total Size |
| :--- | :---: | :---: | :---: |
| **`ami-pr-peer-reviewer`** | 83 tokens | 1,432 tokens | 1,432 tokens |
| **`ami-pr-self-reviewer`** | 95 tokens | 1,047 tokens | 1,047 tokens |
| **`ami-release-tagger`** | 45 tokens | 1,037 tokens | 1,037 tokens |
| **`ami-tech-debt-scanner`** | 54 tokens | 992 tokens | 992 tokens |
| **`ami-data-profiler`** | 55 tokens | 988 tokens | 988 tokens |
| **`ami-dashboard-builder`** | 45 tokens | 962 tokens | 962 tokens |
| **`ami-project-architect`** | 68 tokens | 959 tokens | 959 tokens |
| **`ami-commit-planner`** | 34 tokens | 944 tokens | 944 tokens |
| **`ami-pr-comment-analyzer`** | 38 tokens | 918 tokens | 918 tokens |
| **`ami-context-researcher`** | 40 tokens | 891 tokens | 891 tokens |
| **`ami-methodical-debugger`** | 70 tokens | 825 tokens | 825 tokens |
| **`ami-test-strategist`** | 48 tokens | 821 tokens | 821 tokens |
| **`ami-sql-optimizer`** | 54 tokens | 808 tokens | 808 tokens |
| **`ami-data-validator`** | 27 tokens | 798 tokens | 798 tokens |
| **`ami-doc-manager`** | 47 tokens | 748 tokens | 748 tokens |
| **`ami-quality-auditor`** | 21 tokens | 645 tokens | 645 tokens |
| **`ami-dependency-analyzer`** | 53 tokens | 617 tokens | 617 tokens |
| **`ami-release-drafter`** | 54 tokens | 603 tokens | 603 tokens |
| **`ami-learnings-extractor`** | 37 tokens | 587 tokens | 587 tokens |
| **`ami-pr-conflict-detector`** | 36 tokens | 535 tokens | 535 tokens |
| **`ami-test-creator`** | 37 tokens | 435 tokens | 435 tokens |
| **TOTALS** | **1,041 tokens** | **17,592 tokens** | **17,592 tokens** |

---

### B. Subagent Consumption Audit (`agents/`)
Subagent files dictate standalone system prompts when spawned into isolated conversational threads (`invoke_subagent`). Their description resides in the parent agent's catalog to guide task delegation.

| Agent Name | Catalog (Description Tax) | Subagent System Prompt |
| :--- | :---: | :---: |
| **`ami-release-manager`** | 94 tokens | 1,638 tokens |
| **`ami-pr-reviewer`** | 101 tokens | 1,316 tokens |
| **`ami-data-scientist`** | 62 tokens | 1,305 tokens |
| **`ami-pr-publisher`** | 90 tokens | 1,266 tokens |
| **`ami-push-assistant`** | 91 tokens | 1,100 tokens |
| **`ami-next-step-assistant`** | 106 tokens | 911 tokens |
| **`ami-doc-architect`** | 103 tokens | 909 tokens |
| **`ami-repo-auditor`** | 98 tokens | 864 tokens |
| **`ami-expert-council`** | 63 tokens | 763 tokens |
| **TOTALS** | **808 tokens** | **10,072 tokens** |

---

## 3. Comparative Architecture & Mechanics (Antigravity vs. Claude Code)

### Claude Code Mechanics
* **Discovery & Permissions:** Uses `allowed-tools:` in YAML frontmatter. Skills are exposed via native plugin discovery.
* **Token Behavior:** Only the `description` metadata is injected into the primary system prompt tool definitions. When invoked, Claude executes a file read, appending the Markdown content into the ongoing chat transcript.
* **Subagent Isolation:** Subagent workflows run in separate worker processes, shielding the primary terminal context from absorbing the 800-1,600 token subagent prompts.

### Google Antigravity (Gemini) Mechanics
* **Dynamic Indexing:** Employs `adapters/universal_adapter.js` to compile an XML index (`<available_skills>` and `<available_agents>`) directly into the System Prompt.
* **XML System Prompt Tax:** In the current architecture, the compiled XML index consumes **~3,335 tokens** per turn:
  * **~1,849 tokens** are attributed to raw YAML description strings.
  * **~1,486 tokens (~45% of total tax)** are consumed by repetitive XML boilerplate tags (`<skill>`, `<name>`, `<description>`, `<location>`) and full file system paths (`/path/to/project/skills/.../SKILL.md`).
* **Subagent Insulation:** Spawns asynchronous subagents via `invoke_subagent` using unique conversation IDs. Subagents communicate back via concise messages, insulating the primary agent from intense tool and reasoning bloat.

---

## 4. Architectural Optimization Blueprint

To optimize token efficiency without sacrificing functional capabilities, four concrete architectural refactorings are recommended:

### Strategy 1: Metadata Description Compression (60% Reduction in Catalog Tax)
* **The Problem:** Almost all agent descriptions contain verbose defensive instructions (e.g., *"Must be invoked via subagent whenever... NEVER execute raw release creation commands directly... do not perform inline manually..."*), consuming **~100 tokens per description**.
* **The Solution:** Because mandatory subagent delegation is already enforced globally by Rule #12 in repository configuration (`AGENTS.md` / `CLAUDE.md`), defensive repetitions inside YAML descriptions should be stripped.
* **Implementation:** Rewrite descriptions to strictly state trigger conditions and semantic capability (e.g., *`ami-push-assistant`: Pre-push orchestrator for quality, security, and git data consistency verification.*).
* **Impact:** Reduces catalog description footprint from ~1,849 tokens to **~600 tokens** (saving **~1,250 tokens on every single turn**).

### Strategy 2: Universal Adapter Structural Optimization (Compact Catalog Schema)
* **The Problem:** Repetitive XML wrapping and full absolute paths add **~1,486 tokens** of formatting overhead per turn.
* **The Solution:** Modify `adapters/universal_adapter.js` to define the project root path once in the wrapper tag and adopt either root-relative indexing or a lightweight Markdown tabular format.
* **Example Optimization:**
  ```xml
  <available_skills root_dir="/path/to/project/skills">
    <skill name="ami-pr-peer-reviewer" file="ami-pr-peer-reviewer/SKILL.md">Review PRs authored by teammates; generates criticality observations.</skill>
    <!-- ... -->
  </available_skills>
  ```
* **Impact:** Trims structural syntax overhead by ~70%, lowering total System Prompt Tax from **3,335 tokens down to ~1,100 tokens** (saving **~2,200 tokens per turn**, or **~66,000 input tokens** over a 30-turn session).

### Strategy 3: Subagent-Scoped Skill Execution (Context Insulation)
* **The Problem:** When the parent agent directly reads heavy skills (>1,000 tokens like `ami-pr-peer-reviewer`), those tokens remain in the primary session history, accelerating conversational autocompaction.
* **The Solution:** Enforce strict delegation: orchestrator subagents (e.g., `ami-pr-reviewer`, `ami-repo-auditor`, `ami-data-scientist`) should load complex skills inside their isolated background contexts (`invoke_subagent`). When finished, only a condensed summary message returns to the main conversation.

### Strategy 4: Progressive Disclosure for Heavy Skills (>1,000 tokens)
* **The Problem:** Skills such as `ami-pr-peer-reviewer` (1,432 t), `ami-pr-self-reviewer` (1,047 t), and `ami-release-tagger` (1,037 t) load large reference examples and checklists instantly upon execution.
* **The Solution:** Refactor skills larger than 1,000 tokens into a tiered file hierarchy:
  * Keep the primary `SKILL.md` slim (~300–400 tokens) with core operational steps.
  * Extract extended checklists and rules into auxiliary reference documents (e.g., `references/security-checklist.md` or `references/tagging-rules.md`), instructing the model to load them only when specific target conditions are met.

---

## 5. Conclusion

By transitioning from verbose XML metadata to **Compressed Root-Relative Catalogs** and leveraging **Subagent-Scoped Skill Execution**, the `amiga-ia` suite can cut its passive per-turn input token overhead by approximately **~66%** while maintaining instant on-demand access to all 27,600+ tokens of declarative system logic.
