> **Created:** 2026-08-04
> **Last Updated:** 2026-08-04

# ADR-004: Unified PowerShell Execution Hooks and Token Tax Optimization

## Context & Problem Statement

As **Amiga IA** evolved into a cross-platform, portable AI agent suite supporting both Antigravity and Claude Code, operational monitoring uncovered significant efficiency bottlenecks and compatibility gotchas on Windows environments:

* **Claude Code Hook Deduplication Failures on Windows:** In legacy configurations, PowerShell execution hooks were defined as verbose inline shell command strings inside `settings.json` and `hooks-pwsh.json`. Because Claude Code relies on exact string-matching and escaping rules to deduplicate registered event hooks, complex inline script blocks caused deduplication failures on Windows, resulting in repeated executions and broken tool behaviors.
* **Inline Hook Prompt Bloat:** Injecting full inline PowerShell scripts into command definitions consumed approximately **~200 tokens per command**, inflating the context footprint of simple hook registrations.
* **Universal Adapter System Prompt Token Tax:** The Universal Adapter's dynamic XML skill framework generated verbose tag wrapping structures. Specifically, repeating full absolute filesystem paths inside `<location>` tags for every skill caused a severe static recurring overhead in the System Prompt (~3,335 tokens per conversational turn).
* **Defensive Metadata Inflation:** Subagent YAML frontmatter descriptions grew overly defensive and verbose, duplicating operational constraints already enforced by global project rules (`AGENTS.md`).

These combined inefficiencies created an ongoing "token tax"—slow LLM inference speeds, escalated API costs, and accelerated autocompaction cascades in deep engineering sessions.

## Decision

We have implemented a two-pronged architectural optimization strategy targeting both runtime shell execution and static System Prompt payloads:

### 1. Unified External PowerShell Execution Hooks
* **External Runtime Invocations:** Transferred all inline PowerShell event scripts into a single, unified external script located at `hooks/scripts/ami-hooks.ps1`.
* **Parameter-Driven Dispatch:** Reduced hook command definitions in `hooks-pwsh.json` and `settings.json` to concise parameter invocations (e.g., `pwsh -File ... -Event PreToolUse`).
* **Elimination of Deduplication Bugs:** Using clean, standardized file paths and argument parameters guarantees seamless string-matching deduplication within Claude Code on Windows platforms, reducing the per-command token footprint from ~200 tokens down to **~15 tokens**.

### 2. Universal Adapter XML & Metadata Compression
* **Compact XML Attributes:** Refactored Universal Adapter generation logic to replace verbose XML element wrappers (`<location>/absolute/path</location>`) with compact tag attributes (`<skill name="..." file="rel/path" />`).
* **Root-Relative Indexing:** Established a single root directory declaration in the parent container (`<available_skills root_dir="..." />`), allowing all individual skill definitions to reference purely relative filesystem paths.
* **YAML Frontmatter Deduplication:** Compressed subagent file headers by stripping redundant instructions from YAML frontmatter descriptions, relying strictly on global rules enforced via `AGENTS.md`.

## Consequences

### Positive
* **Empirical System Prompt Reduction:** Verified an immediate reduction of **1,211 tokens per turn (-36.3%)** in static System Prompt overhead, successfully dropping recurring baseline consumption from 3,335 down to 2,124 tokens/turn.
* **Zero Windows Deduplication Errors:** Fully resolves Claude Code hook registration bugs on Windows environments by eliminating complex inline shell escaping and multi-line strings.
* **Extended Conversational Autonomy:** Lower baseline token consumption directly delays context window saturation, significantly prolonging agent autonomy before autocompaction cascades occur.
* **Faster Inference Latency:** Removing over 1.2K redundant static input tokens per turn yields noticeably faster LLM time-to-first-token (TTFT) response times across all supported AI engines.

### Negative / Mitigation
* **External Script Dependency:** PowerShell hooks now rely on an external filesystem script (`hooks/scripts/ami-hooks.ps1`) rather than self-contained inline strings. This is mitigated by packaging `ami-hooks.ps1` directly in core release distributions and verifying its presence via diagnostic commands (`amiga-ia-setup doctor`).
