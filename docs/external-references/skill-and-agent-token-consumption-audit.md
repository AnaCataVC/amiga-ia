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
* **Initial Baseline Static Catalog System Prompt Tax:** ~3,335 tokens per turn (loaded into Turn 0 context via legacy verbose XML indexing and metadata catalogs).

---

### A. Skill Consumption Audit (`skills/`)
Skills operate via **Lazy Loading**: only their YAML Frontmatter description is kept in the persistent system prompt tool catalog, while their Markdown body is dynamically pulled via file-reading tools (`view_file`, `Read`) only when executed.

| Skill Name | Catalog (Frontmatter Description) | Execution Body (Dynamic Load) | Total Size |
| :--- | :---: | :---: | :---: |
| **`ami-review-peer-pr`** | 83 tokens | 1,432 tokens | 1,432 tokens |
| **`ami-review-self-pr`** | 95 tokens | 1,047 tokens | 1,047 tokens |
| **`ami-tag-release`** | 45 tokens | 1,037 tokens | 1,037 tokens |
| **`ami-scan-tech-debt`** | 54 tokens | 992 tokens | 992 tokens |
| **`ami-profile-data`** | 55 tokens | 988 tokens | 988 tokens |
| **`ami-build-dashboard`** | 45 tokens | 962 tokens | 962 tokens |
| **`ami-project-architect`** | 68 tokens | 959 tokens | 959 tokens |
| **`ami-plan-commits`** | 34 tokens | 944 tokens | 944 tokens |
| **`ami-analyze-pr-comments`** | 38 tokens | 918 tokens | 918 tokens |
| **`ami-research-context`** | 40 tokens | 891 tokens | 891 tokens |
| **`ami-debug-issue`** | 70 tokens | 825 tokens | 825 tokens |
| **`ami-design-test-strategy`** | 48 tokens | 821 tokens | 821 tokens |
| **`ami-optimize-sql`** | 54 tokens | 808 tokens | 808 tokens |
| **`ami-validate-data`** | 27 tokens | 798 tokens | 798 tokens |
| **`ami-manage-docs`** | 47 tokens | 748 tokens | 748 tokens |
| **`ami-audit-quality`** | 21 tokens | 645 tokens | 645 tokens |
| **`ami-analyze-dependencies`** | 53 tokens | 617 tokens | 617 tokens |
| **`ami-draft-release`** | 54 tokens | 603 tokens | 603 tokens |
| **`ami-extract-learnings`** | 37 tokens | 587 tokens | 587 tokens |
| **`ami-detect-pr-conflicts`** | 36 tokens | 535 tokens | 535 tokens |
| **`ami-create-tests`** | 37 tokens | 435 tokens | 435 tokens |
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
* **Legacy XML System Prompt Tax:** In legacy uncompressed implementations, the compiled XML index consumed **~3,335 tokens** per turn:
  * **~1,849 tokens** attributed to raw YAML description strings and defensive metadata.
  * **~1,486 tokens (~45% of total tax)** consumed by repetitive XML boilerplate tags (`<skill>`, `<name>`, `<description>`, `<location>`) and full file system paths (`/path/to/project/skills/.../SKILL.md`).
* **Subagent Insulation:** Spawns asynchronous subagents via `invoke_subagent` using unique conversation IDs. Subagents communicate back via concise messages, insulating the primary agent from intense tool and reasoning bloat.

---

## 4. Architectural Optimization Blueprint

To optimize token efficiency without sacrificing functional capabilities, four concrete architectural refactorings were established:

### Strategy 1: Metadata Description Compression
* **The Problem:** Almost all agent descriptions contain verbose defensive instructions (e.g., *"Must be invoked via subagent whenever... NEVER execute raw release creation commands directly... do not perform inline manually..."*), consuming **~100 tokens per description**.
* **The Solution:** Because mandatory subagent delegation is already enforced globally by Rule #12 in repository configuration (`AGENTS.md` / `CLAUDE.md`), defensive repetitions inside YAML descriptions are stripped, relying strictly on global operating guardrails.

### Strategy 2: Universal Adapter Structural Optimization (Compact Catalog Schema)
* **The Problem:** Repetitive XML wrapping and full absolute paths add **~1,486 tokens** of formatting overhead per turn.
* **The Solution:** Modify `adapters/universal_adapter.js` to declare the project root path once in the wrapper tag attribute (`root_dir`) and utilize self-closing tags with relative attribute paths:
  ```xml
  <available_skills root_dir="/path/to/project/skills">
    <skill name="ami-review-peer-pr" file="ami-review-peer-pr/SKILL.md">Review PRs authored by teammates; generates criticality observations.</skill>
  </available_skills>
  ```

### Strategy 3: Subagent-Scoped Skill Execution (Context Insulation)
* **The Problem:** When the parent agent directly reads heavy skills (>1,000 tokens like `ami-review-peer-pr`), those tokens remain in the primary session history, accelerating conversational autocompaction.
* **The Solution:** Enforce strict delegation: orchestrator subagents should load complex skills inside their isolated background contexts (`invoke_subagent`). When finished, only a condensed summary message returns to the main conversation.

### Strategy 4: Progressive Disclosure for Heavy Skills (>1,000 tokens)
* **The Problem:** Skills such as `ami-review-peer-pr` (1,432 t), `ami-review-self-pr` (1,047 t), and `ami-tag-release` (1,037 t) load large reference examples instantly upon execution.
* **The Solution:** Refactor skills larger than 1,000 tokens into a tiered file hierarchy, keeping the primary `SKILL.md` slim (~300–400 tokens) while extracting extended checklists into auxiliary reference documents (`references/*.md`) loaded only when necessary.

---

## 5. Executed Optimizations & Empirical Verification (ADR-004)

Following the implementation of **ADR-004**, operational telemetry empirical audits confirmed the effectiveness of the targeted token strategies:

* **Empirical System Prompt Tax Reduction:** Combining Compact Root-Relative XML indexing (Strategy 2) with Subagent Metadata Deduplication (Strategy 1) achieved an empirical reduction of **1,211 tokens per turn (-36.3%)** in static recurring overhead—successfully dropping baseline consumption from **3,335 tokens down to 2,124 tokens/turn**.
* **Unified PowerShell Hook Footprint:** Replaced verbose inline PowerShell hook expressions in `settings.json` and `hooks-pwsh.json` with parameter invocations to an external runtime script (`hooks/scripts/ami-hooks.ps1`). This compressed hook command overhead from ~200 tokens down to **~15 tokens per hook**, while completely eliminating string-matching deduplication failures on Windows within Claude Code.
* **Performance Impact:** Removing over 1.2K redundant recurring tokens per turn substantially extends agent conversational autonomy before autocompaction thresholds trigger and measurably improves LLM time-to-first-token (TTFT) response latency across all supported inference engines.

---

## 6. Conclusion

By executing the transition from legacy verbose XML metadata to **Compressed Root-Relative Catalogs** and deploying **External Runtime Hook Invocations** (ADR-004), the `amiga-ia` suite successfully reduced its passive per-turn input token overhead by **36.3%** while maintaining instant on-demand precision access to all 27,600+ tokens of declarative system logic.
