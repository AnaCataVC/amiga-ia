> **Created:** 2026-08-02
> **Last Updated:** 2026-08-02

# AI Assistant Session Persistence, Memory Architecture & Token Cost Optimization

## Executive Summary & Purpose

This reference document synthesizes architectural best practices and official system capabilities regarding conversational persistence, context management, and token optimization across modern agentic coding assistants—primarily **Claude Code** and **Antigravity (Gemini)**.

The research directly validates and establishes the foundation for **ADR-003**: the complete deprecation of automated `SessionStart` background hook interceptors and persistent markdown session summaries (`docs/coding-sessions/*.md`) in favor of native conversational resumption and **Lazy-Loaded Declarative Skills**.

---

## 1. Comparative Architecture: Session Management & State

Both leading AI coding assistants have evolved sophisticated native mechanisms to preserve session continuity without relying on external shell script prompt injection.

| Feature / Capability | Claude Code | Google Antigravity (Gemini) | Architectural Best Practice |
| :--- | :--- | :--- | :--- |
| **Session Resumption** | Native commands: `claude --continue` and `claude --resume <session-id>` (plus `/rename`). | Conversation IDs & chronological JSONL transcripts (`transcript.jsonl`) persisted across runs. | Rely exclusively on native CLI flags and session pickers for exact work resumption. |
| **Project Rules & Rules** | Root `CLAUDE.md` file loaded once at session boot; Auto-Memory tracking. | Declarative rule files (`rules/ami-rules.md` / AGENTS.md) and atomic planning mode. | Keep persistent core instructions in dedicated declarative root configuration files. |
| **Task State & Checkpoints** | Lightweight native task tracking and compact conversational history. | Structured **Brain Artifacts** (`task.md`, `implementation_plan.md`, `walkthrough.md`). | Delegate real-time work execution state to assistant-managed task tracking surfaces. |
| **Long-Term Knowledge** | On-demand retrieval via MCP servers or declarative skills (`SKILL.md`). | XML Lazy-Loading catalog (`<available_skills>`) read on-demand via tools (`view_file`). | **Pull-based (Lazy Loading):** AI invokes reading skills only when explicitly needed. |

### Source References:
* Claude Code Hooks & Session Architecture: [Anthropic Claude Code Hooks Reference](https://docs.anthropic.com/en/docs/claude-code/hooks)
* Claude Code Token Costs & Context Management: [Anthropic Best Practices for Context Windows](https://docs.anthropic.com/en/docs/claude-code/plugins-reference)

---

## 2. The Economics of Context Windows: "Every-Turn Token Tax"

In agentic coding models, computational pricing and inference speed scale linearly with the total volume of tokens present in the active context window. The context window includes:
1. System prompts and declarative rules (`CLAUDE.md`, rules)
2. Connected MCP tool definitions and skill catalogs
3. Accumulated conversation turns, command outputs, and file views
4. **Initial prompt injection payloads** (such as hook output)

### The Mathematical Problem with `SessionStart` Hooks
When a custom shell script (such as a legacy `SessionStart` hook) concatenates previous session markdown summaries and forces them into the initial initialization prompt, it incurs an **Every-Turn Token Tax**:
* Any token injected at Turn 0 does not simply incur a one-time charge; it is re-transmitted, re-processed, and re-billed on **every subsequent conversational turn** in that session.
* For example, injecting a 1,500-token markdown session summary into a session that runs for 40 interactive turns results in **60,000 redundant input tokens processed**, diluting budget efficiency without guaranteeing relevance to the newly requested task.

---

## 3. Technical Risks of Automated Prompt Injection: Context Rot & Compaction

Beyond pure financial and latency penalties, pushing historical logs into the initial prompt actively degrades agent reasoning accuracy:

1. **Context Rot (Stale Context Contamination):** Past session logs frequently contain stack traces of resolved bugs, deprecated refactor attempts, or outdated working assumptions. When presented in the opening prompt, LLMs frequently treat these historical logs as active project defects or regressions, causing the agent to waste time re-investigating resolved issues.
2. **Accelerated Autocompact Cascades:** Long-running coding sessions eventually hit maximum context limits, triggering automatic conversational summarization (compaction). Initial prompt bloat consumes valuable context runway upfront, accelerating the onset of autocompact cascades and causing the loss of precise recent tool outputs.

---

## 4. Conclusive Best Practice: Why Pull-Based (Lazy Loading) Succeeds

Modern engineering repositories MUST implement a separation between **transactional short-term memory** and **persistent long-term repository knowledge**:

* **Short-Term Transactional State:** Managed strictly by the native AI assistant engine (`claude --continue`, Antigravity `task.md` / `transcript.jsonl`). Zero repository file bloat, zero background bash scripts.
* **Long-Term Curated Knowledge:** Handled via declarative Markdown skills with XML index catalogs. When an agent needs domain understanding, it actively executes a pull request using specialized workflows:
  * **`ami-doc-manager`**: Keeps architectural documentation (`docs/`) synchronized with actual codebase diffs.
  * **`ami-learnings-extractor`**: Curates explicit Architecture Decision Records (`docs/adr/`) and technical patterns (`docs/learning/`), saving only high-signal architectural decisions while filtering out conversational noise.
  * **`ami-context-researcher`**: Validates live external framework docs and persists verifiable technical truth in `docs/external-references/`.
