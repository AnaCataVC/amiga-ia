# Documentation & Context

This directory stores long-term persistent context, architectural decision records (ADRs), internal system architecture specifications, and AI developer learnings for **Amiga IA**.

Agents should read from this folder to understand project constraints, and write to it when making significant design decisions or gathering new insights to maintain persistent memory across sessions.

---

## 📂 Directory Structure & Table of Contents

| Directory / File | Purpose & Contents |
|---|---|
| **[`contributing.md`](contributing.md)** | **Contributor Guidelines:** Core instructions, repository setup, coding style, and workflow for developers and AI agents adding new skills or agents. |
| **[`adr/`](adr/)** | **Architectural Decision Records (ADRs):** Sequential logs documenting significant technical and architectural choices made throughout project evolution. <br> <ul><li>[`001-unified-npm-distribution.md`](adr/001-unified-npm-distribution.md)</li><li>[`002-multi-skill-subagent-orchestration.md`](adr/002-multi-skill-subagent-orchestration.md)</li><li>[`003-deprecation-of-session-start-hooks.md`](adr/003-deprecation-of-session-start-hooks.md)</li><li>[`004-unified-powershell-hooks-and-token-tax-optimization.md`](adr/004-unified-powershell-hooks-and-token-tax-optimization.md)</li></ul> |
| **[`architecture/`](architecture/)** | **System Architecture & Design Specs:** Detailed technical architecture specifications for plugin integration, distribution models, and hook engines. <br> <ul><li>[`plugin-architecture.md`](architecture/plugin-architecture.md)</li></ul> |
| **[`external-references/`](external-references/)** | **External Research & Audits:** Third-party guidelines, platform specifications (Claude Code / Antigravity), and technical audits used as reference material during agent execution. |
| **[`learning/`](learning/)** | **Persistent AI Memory & Learnings:** Knowledge repository where the AI preserves patterns, architectural takeaways, and structural lessons across coding sessions. <br> <ul><li>[`ai-context-token-optimization-and-hook-deduplication.md`](learning/ai-context-token-optimization-and-hook-deduplication.md)</li><li>[`dry-agent-skill-architecture.md`](learning/dry-agent-skill-architecture.md)</li><li>[`graceful-feature-deprecation-advisories.md`](learning/graceful-feature-deprecation-advisories.md)</li></ul> |

---

## 🛠️ Guidelines for Agents & Contributors

1. **New Architecture Decisions:** Whenever making major system modifications or protocol updates, create a new sequential ADR inside `adr/` following standard MADR format (e.g., `002-feature-name.md`).
2. **Technical Specs:** Place in-depth subsystem design documents in `architecture/`.
3. **External Articles & Research:** Persist raw findings or third-party behavioral notes inside `external-references/`.
4. **No Absolute Paths:** NEVER include local file system paths (e.g., `C:\Users\...` or `/home/...`) in markdown documentation. Always use relative markdown links.
5. **English Only:** All source documentation within `docs/` MUST be written in English.
