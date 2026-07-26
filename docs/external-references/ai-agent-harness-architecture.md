> **Created:** 2026-07-26
> **Last Updated:** 2026-07-26

# AI Agent Harness Architecture: Antigravity (AGY) & Claude Code

## 1. Overview: What is an AI Agent Harness?

In modern AI engineering, an **agent harness** (or **execution harness**) is the runtime control plane and scaffolding surrounding a Large Language Model (LLM). While an LLM acts as the reasoning core ("brain"), the harness provides the operational environment—including loop orchestration, tool routing, state persistence, context budgeting, and security guardrails ("hands, eyes, and safety controls").

### The Core Principle
$$\text{Autonomous Agent} = \text{LLM (Reasoning Core)} + \text{Harness (Runtime Scaffolding)}$$

Key distinctions:
* **LLM (Model):** Generates next tokens based on prompt context; stateless and probabilistic.
* **Agent Framework (e.g., LangChain, LlamaIndex):** Software library offering abstractions to build agent components.
* **Agent Harness:** The actual runtime container/infrastructure executing the agent, governing execution loops, managing turns, enforcing safety boundaries, and recovering from failures.

---

## 2. Core Architectural Components of a Harness

A formal agent harness is modeled as a 6-component tuple: $H = \{E, T, C, S, L, V\}$

1. **Execution Loop ($E$):** The primary `Observe-Think-Act` control loop governing model invocation, response parsing, tool execution, and stop-condition evaluation.
2. **Tool Registry & Execution ($T$):** The catalog registering executable functions, validating JSON schemas, managing permission prompts, and executing tool calls in sandboxed environments.
3. **Context Manager ($C$):** Handles token budgeting, message compression, system prompts, lazy-loading skills, and dynamic context assembly.
4. **State Store ($S$):** Manages session logs, workspace metadata, transcripts (`transcript.jsonl`), scratchpads, and persistent memory across steps.
5. **Lifecycle Hooks ($L$):** Triggers pre-turn/post-turn events, user intervention interception, subagent lifecycle callbacks, and error recovery/retry policies.
6. **Evaluation & Verification ($V$):** Tracing, safety checks, human-in-the-loop validation, and post-execution assertion checks.

---

## 3. Harness Architecture in Google Antigravity (AGY)

In the Google Antigravity ecosystem, **Antigravity** represents the platform/engine, while **`agy`** is the primary command-line interface.

### Architectural Highlights of the Antigravity Harness:

* **Shared Core Engine:** Built in Go, the underlying Antigravity agent harness powers multiple user surfaces consistently:
  * Antigravity CLI (`agy`)
  * Antigravity 2.0 (Desktop App)
  * Antigravity IDE & Extension Suite
  * Antigravity Python SDK
* **Turn & Loop Management:**
  * Implements an asynchronous turn-based execution loop.
  * Supports reactive wakeups (notifications from background tasks or subagents automatically wake the agent without requiring spin-lock polling loops).
* **Declarative Lazy-Loading Skills/Agents:**
  * Universal adapters scan skill manifests (`SKILL.md`) and frontmatter.
  * Inject light XML catalogs into system prompts, deferring heavy file reads until the harness or model explicitly requests the file (`view_file`).
* **Sandboxed Tool Execution & Permissions:**
  * Standardized tool call contracts (`run_command`, `replace_file_content`, `view_file`).
  * Granular permission requests (`ask_permission`) preventing unauthorized system changes.
* **Transcript & Artifact State Management:**
  * Maintains persistent, dual-layer logs (`transcript.jsonl` for compact history and `transcript_full.jsonl` for complete step telemetry).
  * Artifact storage directory per conversation (`.gemini/antigravity/brain/<conv-id>`).

---

## 4. Harness Architecture in Anthropic Claude Code

Anthropic's **Claude Code** is an agentic terminal tool serving as an operational harness designed specifically for software development tasks.

### Architectural Highlights of the Claude Code Harness:

* **Terminal-First Agentic Loop:**
  * Directly embeds in developer terminal environments, wrapping `bash`, `grep`, and file system operations into controlled tool calls.
  * Manages long-running bash processes and sub-process output streaming.
* **Subagent & Tool Isolation:**
  * Leverages isolated subagent invocation where subagents run within dedicated conversation windows and restricted tool subsets.
* **Hook Scaffolding (`hooks.json`):**
  * Defines event lifecycle listeners (e.g., pre-tool execution, post-tool execution, session start).
  * Enables guardrails, compliance checks, and external linting before tools return output to the model loop.
* **Dynamic Harness Generation:**
  * Claude Code can dynamically construct domain-specific micro-harnesses or evaluation loops to test code modifications before declaring task completion.

---

## 5. Comparative Summary: AGY vs. Claude Code Harness

| Aspect | Google Antigravity (`agy`) Harness | Anthropic Claude Code Harness |
| :--- | :--- | :--- |
| **Engine Language** | Go (high-performance shared core runner) | Node.js / TypeScript CLI runtime |
| **Multi-Surface Integration** | Powers CLI (`agy`), IDE, Desktop App, and Python SDK via a single core | Primary focus on CLI / Terminal environment |
| **Skill & Tool Loading** | XML Lazy Loading (minimal token overhead on startup) | Plugin & Frontmatter declared skills (`allowed-tools`) |
| **Event Lifecycle** | Reactive background task notifications & timer system | Event hooks (`hooks.json`) & execution interceptors |
| **State Persistence** | Structural Artifact system (`.md`) + Dual JSONL Transcripts | Session history + direct file modifications |

---

## 6. References & Further Reading

1. **Antigravity Documentation:** Google Antigravity Architecture & CLI Reference (`antigravity.google`).
2. **Anthropic Claude Code Overview:** Anthropic Engineering Agent Scaffolding (`claude.com`).
3. **Agent Harness Design Patterns:** Architectural Standards for Production AI Agents (`preprints.org`, 2026).
