> **Created:** 2026-11-25
> **Last Updated:** 2026-11-25

# 2026 Platform & Model Evolution Audit: Antigravity, Claude Code, and OpenAI Codex vs. Amiga IA Suite

## 1. Executive Summary

By late November 2026, the three flagship autonomous coding ecosystems—**Google Antigravity (AGY)**, **Anthropic Claude Code**, and **OpenAI Codex CLI**—have undergone a fundamental architectural transformation. They have evolved from single-turn LLM wrappers into **native multi-agent engineering harnesses** with built-in progressive skill discovery, deterministic lifecycle hooks, background subagent swarms, and 1M-context reasoning models.

This audit documents the current (November 2026) state of models and native capabilities across all three platforms, and evaluates every layer of the **Amiga IA (v6.0.0)** suite (39 capabilities: 26 skills + 13 agents, plus adapters, hooks, and rules) to classify what is now **100% Redundant**, **Partially Overlapping (Requires Adaptation)**, or **High-Value Differentiator (Irreplaceable)**.

---

## 2. Frontier Model Evolution (Late 2026)

### 2.1. Google Antigravity (AGY) — The Gemini 4 Element Series
Google restructured its Gemini 4 coding and reasoning lineup in late 2026 around specialized element tiers and multi-model orchestration:
- **Gemini 4 Neon:** Default frontier "sweet-spot" model (introduced Nov 2026). Features 4 thinking effort levels (`Low` to `Extra High`), optimized for fast multi-step repository edits, STEM reasoning, and low token overhead. Primary default **Planner** in Orchestrator Mode.
- **Gemini 4 Carbon:** Heavy-duty deep reasoning model designed for long-horizon agentic coding, adversarial security/code auditing, multimodal precision, and scientific tasks (available on Google AI Pro, Ultra, and Enterprise).
- **Gemini 4 Hydrogen:** High-speed, low-latency model optimized for rapid file execution, routine searches, test runs, and robotics workflows. Serves as the primary **Executor** in Orchestrator Mode and default for Free/trial tiers.
- **Gemini 4 Argon & Gemini 3.8 Flash:** Legacy/transitional Gemini 4/3.8 iterations scheduled for retirement in favor of the Neon/Carbon/Hydrogen triad.

### 2.2. Anthropic Claude Code (v2.1.332+) — Claude 4.6 & 5.5 / Fable Lineage
- **Claude Opus 4.6 & Sonnet 4.6:** Established the 1M-token context window baseline, adaptive thinking parameters (`thinking: {type: "adaptive"}`), and computer-use / terminal-bench mastery.
- **Late-2026 Iterations (Claude 5.5 & Claude Fable):** Iterative late-2026 releases further compress multi-file refactoring latency and stabilize auto-compaction near 1M context limits without premature history loss.

### 2.3. OpenAI Codex CLI (v0.161.0+, Rust Runtime) — GPT-5.x & GPT-6 Series
- **GPT-5-Codex / GPT-5.6 Sol:** Foundational agentic software engineering models with dynamic thinking time.
- **GPT-6.1 Sol:** Default balanced model in Codex CLI v0.161.0+ for everyday multi-file engineering workflows.
- **GPT-6.1 Terra:** Specialized for multimodal visual reasoning, UI mockup diagnosis, and computer use.
- **GPT-6 Astra:** High-end reasoning model for sprawling architectural refactors and parallel subagent execution, supporting tiered `/model` reasoning flags (`low`, `medium`, `high`, `Max`, `Ultra`).

---

## 3. Platform Architecture & Native Harness Evolution

| Capability Dimension | Google Antigravity (AGY v2.34+) | Anthropic Claude Code (v2.1.332+) | OpenAI Codex CLI (v0.161.0+) |
| :--- | :--- | :--- | :--- |
| **Multi-Model & Swarm Orchestration** | **Orchestrator Mode** (pairs Planner e.g. Neon + Executor e.g. Hydrogen); native **`/swarm`** command & `swarm` tool (shared message board, roster, worktree shares); **`run_workflow`** (Python async fan-out/pipeline DSL); `/teamwork`, `/boost`, `/goal`. | **Subagents** run asynchronously in background by default; **Agent Teams** coordinate via shared task lists and peer-to-peer messaging; **Claude Ship** & **Claude Approvals** for post-PR stewardship. | Native multi-agent runtime via `.codex/agents/*.toml`; concurrent subagent delegation (`sol`, `luna`, `terra` or custom TOML profiles) with OS sandboxing (Seatbelt, Landlock). |
| **Native Progressive Skills** | Native progressive disclosure of `SKILL.md` in `.agents/skills/` and `~/.gemini/config/plugins/*/skills/`. Only `name` + `description` enter context until activated. | Native discovery of `.claude/skills/*/SKILL.md` and `~/.claude/skills/`. **New in v2.1.332:** Dynamic loading of skills directly from **MCP Servers** (`server:skill`). | Native open-standard `SKILL.md` discovery in `.agents/skills/`, `~/.agents/skills/`, and `~/.codex/skills/`. |
| **Deterministic Hooks** | `hooks.json` supporting `PreToolUse` and `PostToolUse` via universal Node.js/shell commands, plus native Terminal Sandbox & Command Allow/Denylists. | 25 lifecycle events over stdio/HTTP/MCP (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `StopFailure`, plus new **`PreSkillShellCommand`** in v2.1.332 to block inline `!` shell execution in skills). | `$CODEX_HOME/hooks.json`, `.codex/hooks.json`, or `config.toml` `[hooks]` supporting `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `PreModelRequest`, `SessionStart`, `SubagentStart`, `Stop`. |
| **Native Built-in Slash Workflows** | `/plan`, `/grill-me`, `/teamwork`, `/boost`, `/goal`, `/schedule`, `/automation` (cron sidecars), `/plugin`, `/compact`, `/learn`, `/browser`, plus built-in skills (`migrate-agent-settings`, `generative_ui`, `run-workflow`, `agy-customizations`). | `/init`, `/review`, `/compact`, `/mcp`, `/agents`, `/hooks`, `/login`, plus Claude Ship automated PR checks. | `/init` (generates `AGENTS.md`), `/model` (swaps model & reasoning effort), `/review` (automated git diff & regression review). |
| **Tool Naming Evolution (AGY Warning)** | **CRITICAL:** Modern AGY (late 2026) uses **`read_file`, `edit_file`, `write_file`, `run_command`, `manage_task`, `search_web`** (as verified in built-in `migrate-agent-settings` and live agent declarations), deprecating legacy names (`view_file`, `replace_file_content`, `multi_replace_file_content`, `write_to_file`). | `Read`, `Edit`, `MultiEdit`, `Write`, `Bash`, `Grep`, `Glob`, `WebSearch`, `WebFetch`, `Agent`. | Inherits parent runtime tools (`apply_patch`, shell execution, file read/write) governed by `sandbox_mode` (`read-only`, `workspace-write`). |

---

## 4. Amiga IA Suite Redundancy & Value Matrix

### 4.1. Category A: 100% Obsolete / Redundant Components (Candidates for Deprecation or Removal)

1. **`adapters/universal_adapter.js` (`UniversalAdapter` XML Generator)**
   - **Why it existed:** Early 2025/2026 coding assistants lacked native `SKILL.md` progressive disclosure, requiring a JavaScript adapter to scan directories and inject `<available_skills>` and `<available_agents>` XML blocks into the system prompt.
   - **Why it is redundant now:** All three platforms (AGY, Claude Code, and Codex CLI) natively implement progressive disclosure of `SKILL.md` and subagent manifests directly in their C++/Go/Rust/TypeScript harnesses. Injecting manual XML indices duplicates native system prompt catalogs and wastes tokens.
   - **Action:** Deprecate `universal_adapter.js` as a runtime prompt generator; keep `package.json` `"main"` strictly as a programmatic registry/installer API if needed.

2. **Legacy Antigravity Tool Vocabulary in `adapters/capability_translator.js` & `hooks.json`**
   - **Why it existed:** Mapped abstract tools (`Read`, `Write`, `Edit`) to early Antigravity IDE tool names (`view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`, `find_by_name`, `list_dir`, `grep_search`).
   - **Why it is outdated/redundant now:** Modern Antigravity 2.0 / CLI uses `read_file`, `write_file`, `edit_file`, `run_command`, `manage_task`, `search_web` (documented directly in AGY's built-in `migrate-agent-settings` skill: *"Read/Glob/Grep to `read_file`, Edit/MultiEdit to `edit_file`, Write to `write_file`"*). Furthermore, in AGY's `hooks.json` matcher, only matching `write_to_file|replace_file_content` misses `write_file|edit_file`!
   - **Action:** Update `capability_translator.js` and `hooks.json` matchers to include modern AGY tool names (`read_file`, `write_file`, `edit_file`) alongside legacy aliases.

3. **Manual Cross-Platform Migration Logic vs. AGY's Built-in `migrate-agent-settings` & `plugin`**
   - **Why it existed:** Users needed custom scripts to port skills/agents between Claude, Codex, and Antigravity.
   - **Why it overlaps now:** Antigravity v2.34.0+ ships a built-in `migrate-agent-settings` skill and `plugin import claude` / `plugin import gemini` CLI commands that automatically convert `.claude/`, `.codex/`, and `.cursor/` setups into `~/.gemini/config/plugins/<name>/`.
   - **Nuance for Amiga IA:** `bin/setup.js` (`amiga-ia-setup`) is still valuable as a **package manager & domain-pack installer** (installing curated Amiga IA packs across all 3 platforms simultaneously with version receipts and `--doctor`), rather than an ad-hoc user config migrator.

---

### 4.2. Category B: Partially Overlapping Components (Native Features Exist, Amiga IA Adds Domain Opinionation)

| Amiga IA Component | Native Platform Equivalent (Late 2026) | What Is Redundant | What Remains Unique in Amiga IA (Keep / Refactor) |
| :--- | :--- | :--- | :--- |
| **`ami-plan-feature`** & **`ami-tech-lead`** | **AGY:** `/plan`, `/grill-me`, `/boost`, Orchestrator Mode (Neon Planner + Hydrogen Executor).<br>**Claude:** Opus 4.6 / 5.5 Plan Mode.<br>**Codex:** High/Ultra reasoning mode. | Generic instructions telling the model "how to ask clarifying questions" or "how to break a task into steps." Models with native `/plan` and `/grill-me` already interview users and track steps natively (`update_steps`). | **Keep but slim down:** Focus strictly on **ADR traceability (`docs/adr/`)**, **external reference caching (`docs/external-references/`)**, and **architectural modularity contracts**, delegating step tracking to native platform primitives. |
| **`ami-prototype-ui`** & **`ami-ui-builder`** | **AGY:** Built-in **`generative_ui`** skill (`<agent-embed>`, CSP-allowlisted `gstatic` Tailwind, theme CSS variables `--background`, `--card`).<br>**Codex:** GPT-6.1 Terra visual mockup loop. | Explaining basic HTML5/Tailwind mockup scaffolding in AGY when the user just wants an inline interactive widget in chat. | **Harmonize:** `ami-prototype-ui` uses `https://cdn.tailwindcss.com` (which is **blocked by CSP** inside AGY's inline `<agent-embed>` iframe, though it works in standalone browser files `docs/mockups/*.html`). Refactor `ami-prototype-ui` to distinguish between **persistent repo mockups (`docs/mockups/`) with 5-State UX switcher pills** vs. **AGY inline `generative_ui` widgets**. |
| **`ami-discover-automations`** | **AGY:** Built-in **`automation`** skill (`/automation` command, creates cron `sidecar.json` in `~/.gemini/config/sidecars/`). | Discovering or creating personal assistant cron reminders/tasks (now handled natively by AGY `/automation` and `/schedule`). | **Clear Boundary:** `ami-discover-automations` audits **repository software engineering automations** (GitHub Actions CI/CD, `package.json` scripts, git hooks, BullMQ/Celery workers), whereas AGY `/automation` creates local desktop agent cron sidecars. Keep `ami-discover-automations` focused strictly on repo CI/CD & code toil. |
| **`ami-review-self-pr`**, **`ami-review-peer-pr`**, **`ami-pr-reviewer`** | **Codex:** Native `/review` command.<br>**Claude:** **Claude Ship** & PR Stewards.<br>**AGY:** Built-in `review-agent` / `ami-adversarial-verifier`. | Basic diff summarization and syntax/lint checking, which `/review` and Claude Ship do out of the box. | **High Value in Methodology:** Amiga IA's **5-Dimension `[Blind-Spot Probe]`**, **`[Falsification Check]`** (proving a bug is real before reporting to eliminate false positives), and **zero-trust fresh-context `ami-adversarial-verifier`** remain superior to generic single-pass `/review` prompts. |
| **`ami-expert-council`** & **`ami-stress-test-idea`** | **AGY:** `/swarm` (multi-agent board), `/teamwork`, `run_workflow` parallel fan-out, `/boost`.<br>**Claude:** Agent Teams. | Spawning multiple subagents just to "debate" an idea (which wastes tokens unless using native `/swarm` or `/boost`). | **Already Optimized:** Because `ami-expert-council` was redesigned as a **Single-Pass Orthogonal Evaluator** (Zero Roleplay Chatter, One-Way vs. Two-Way Door ADR triage, 5 Red-Team attack vectors), it actually *avoids* the token bloat of multi-agent debate swarms. Keep as a lightweight single-pass premortem. |
| **`ami-discover-ai-agents`** | **AGY:** `agy-customizations` & `plugin` skills.<br>**Codex:** `/init` (`AGENTS.md`).<br>**Claude:** `/init` (`CLAUDE.md`). | Basic scaffolding of a single-platform `SKILL.md` or rule file. | **Update Specs:** Its core value is **Tri-Ecosystem Cross-Compilation** (generating `.agents/`, `.claude/`, and `.codex/*.toml` simultaneously with qualification gates). However, its `references/antigravity-tools.md` must be updated to AGY's late-2026 tool names (`read_file`, `edit_file`, `write_file`). |
| **`ami-PostToolUse` Hook (`console.log` / `TODO` warning)** | Native IDE linters and platform diagnostics. | Warning on every single file edit when a `TODO` or `console.log` is written mid-development can create noisy stderr churn during iterative coding. | **`ami-PreToolUse` is Essential; `ami-PostToolUse` is Low-ROI:** `ami-pre-tool-use.js` blocks **secret leaks (API keys, tokens)** and **personal machine path leaks (`C:\Users\...`)** right on `git commit`/`git push`—a critical deterministic guardrail across all 3 platforms. Conversely, `ami-post-tool-use.js` (`TODO`/`console.log` warning on every edit) is better enforced at pre-commit/ship validation (`ami-change-validator`) rather than firing on every `edit_file` turn. |

---

### 4.3. Category C: High-Value Differentiators (Zero Native Replacement — Core Moats of Amiga IA)

1. **Double-Blind Cleanroom TDD (`ami-orchestrate-cleanroom`, `ami-cleanroom-arbiter`, `ami-cleanroom-builder`, `ami-cleanroom-tester`)**
   - **Why no model/platform replaces it:** Even Gemini 4 Carbon, Claude Opus 4.6/5.5, and GPT-6 Astra suffer from **LLM Confirmation Bias** when the same context window writes both the implementation and the unit tests (the model writes tests that mirror its own buggy assumptions).
   - **Amiga IA Moat:** Enforcing Harlan Mills' Cleanroom Software Engineering—freezing formal contracts in `docs/contracts/`, isolating the Builder from the Tester in separate subagent contexts, and adjudicating via the Arbiter—is an architectural workflow invariant that raw model intelligence cannot replace. (In AGY, leveraging `run_workflow` or `swarm` with `workspace: "share"` makes Cleanroom TDD even faster).

2. **Numbered-Gate Shipping & Zero-Duplicate-Test Governance (`ami-ship-change` [incorporating `commit-only`, `push`, and `pr` modes], `ami-change-validator`, `ami-adversarial-verifier`, `ami-detect-pr-conflicts`)**
   - **Why no platform replaces it:** While Claude Ship automates post-PR CI fixes, developers working locally across git worktrees need deterministic human-in-the-loop confirmation gates (Gate 1: Fixes, Gate 2: Commit Plan, Gate 3: Remote Sync & Push, Gate 4: PR Creation & Conflict Check) combined with fresh-context adversarial falsification.

3. **Bilingual Semantic Release & Live Registry Verification (`ami-release-manager`, `ami-prepare-release`)**
   - **Why no platform replaces it:** Atomic pre-tag version bumping, English/Spanish release notes generation (with strict Zero-Flags compliance and internal housekeeping filtering), GitHub Actions workflow watching (`gh run watch`), and live NPM/PyPI registry polling are specialized DevOps pipelines not built into base coding CLIs.

4. **UX 5-State Matrix & Design-Token Consistency Auditing (`ami-design-ux`, `ami-audit-ui-consistency`)**
   - **Why no platform replaces it:** Frontier models still default to designing only the "Happy Path" (Ideal state) and frequently invent duplicate icons or raw hex colors. Forcing explicit specification of the **5 UX States (Ideal, Empty, Loading, Error, Partial)** and auditing semantic icon/token collisions remain high-ROI domain guardrails.

5. **Persistent Repository Memory Lifecycle (`ami-manage-docs`, `ami-doc-architect`, `ami-research-context`)**
   - **Why no platform replaces it:** Platform auto-compaction (`/compact`) and session memory summarize *chat history*, not *architectural repository governance*. Maintaining sequential ADRs (`docs/adr/`), pruning obsolete docs against git diffs, and caching verified live specs in `docs/external-references/` prevent cross-session architectural drift across teams.

6. **Rigorous Data Science, Bias Auditing & SQL Execution Plan Refactoring (`ami-data-scientist`, `ami-optimize-sql`, `ami-build-dashboard`)**
   - **Why no platform replaces it:** Structured statistical profiling, look-ahead bias detection, and dialectical SQL query execution-plan refactoring provide disciplined data engineering runbooks beyond ad-hoc prompting.

---

## 5. Strategic Recommendations for Amiga IA (Next Evolution Roadmap)

1. **Modernize Antigravity Tool Vocabulary (`P0`):**
   - Update `adapters/capability_translator.js`, `hooks.json`, `bin/setup.js`, and `skills/ami-discover-ai-agents/references/antigravity-tools.md` to support Antigravity's late-2026 native tool names (`read_file`, `edit_file`, `write_file`, `run_command`, `manage_task`, `search_web`) while keeping legacy aliases (`view_file`, `replace_file_content`, `write_to_file`) for backward compatibility.
2. **Retire `adapters/universal_adapter.js` XML Prompt Injection (`P1`):**
   - Remove or deprecate `UniversalAdapter` XML generation (`<available_skills>`), relying 100% on native platform progressive disclosure across AGY, Claude Code, and Codex.
3. **Integrate AGY `run_workflow` & `/swarm` into Multi-Agent Orchestrators (`P1`):**
   - Allow `ami-orchestrate-cleanroom`, `ami-repo-auditor`, and `ami-ship-change` to optionally utilize Antigravity's `run_workflow` (`parallel()`, `pipeline()`) when running in AGY, and native background subagents / TOML profiles in Claude Code and Codex.
4. **Align `ami-prototype-ui` with AGY `generative_ui` (`P2`):**
   - Add an explicit branch in `ami-prototype-ui`: use standard standalone HTML + 5-State Switcher for repo files (`docs/mockups/*.html`), or delegate to AGY's CSP-compliant `generative_ui` template (`gstatic` Tailwind + CSS theme variables) when rendering inline chat widgets.
5. **Slim Down `ami-plan-feature` & `ami-post-tool-use.js` (`P2`):**
   - Delegate generic step-checklists and user interviewing to native `/plan` / `/grill-me` / `ask_question` primitives, keeping `ami-plan-feature` laser-focused on ADR alignment and repository boundary contracts.
   - Move noisy `TODO`/`console.log` checks from `PostToolUse` (every file edit) to pre-commit/ship validation (`ami-change-validator`), preserving `PreToolUse` strictly for high-criticality secret and path-privacy blocking.

---

## 6. Sources & Live Verification References
- **Google Antigravity Documentation & Changelog:** `https://antigravity.google/docs/changelog.md`, `https://antigravity.google/llms.txt` (Gemini 4 Neon, Carbon, Hydrogen, Argon; Orchestrator Mode; `/swarm`; `run_workflow`; v2.33 Remote SSH; v2.34 Migration Tooling).
- **Antigravity Built-in System Skills (Verified Locally):** `antigravity-guide`, `agy-customizations`, `migrate-agent-settings`, `run-workflow`, `swarm_pane`, `automation`, `generative_ui`.
- **Anthropic Claude Code Releases (v2.1.332, Nov 2026):** Claude Opus 4.6 & Sonnet 4.6 (1M context, adaptive thinking), Claude 5.5 / Fable iterations, MCP Server Skills (`server:skill`), `PreSkillShellCommand` hook event, Agent Teams, and Claude Ship / Approvals.
- **OpenAI Codex CLI Documentation (v0.161.0+, Nov 2026):** `https://developers.openai.com/codex/skills/`, `https://developers.openai.com/codex/hooks/`, `https://learn.chatgpt.com/docs/agent-configuration/subagents` (GPT-5.6 Sol, GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Astra; TOML subagents; Seatbelt/Landlock sandboxes; `/init`, `/model`, `/review`).
