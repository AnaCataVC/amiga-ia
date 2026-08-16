# Architecture Specification: Universal Adapter & Dynamic XML Catalog

This document details the design, token economics, and implementation mechanics of the **Universal Adapter (`adapters/universal_adapter.js`)** in Amiga IA.

---

## 1. Purpose & Motivation

In conversational AI coding environments (Antigravity and Claude Code), injecting monolithic prompt instructions or entire Markdown skill documents directly into the initial System Prompt creates severe token bloat and recurring inference overhead on every interaction turn.

The Universal Adapter provides a **Declarative XML Lazy-Loading Index**:
1. It dynamically scans the repository's `skills/` and `agents/` directories.
2. It parses YAML frontmatter to extract only essential metadata (`name`, `description`).
3. It compiles an ultra-compact XML catalog (`<available_skills>`) that is injected into the AI's System Prompt.
4. The AI uses its native file-reading tool (`view_file` or `Read`) to load the complete `SKILL.md` or `agents/*.md` on demand only when needed.

---

## 2. Dynamic XML Catalog Format

Per **ADR-004**, the Universal Adapter utilizes a root-relative, attribute-driven schema to minimize token overhead:

```xml
<available_skills>
  <skill name="ami-plan-commits" path="skills/ami-plan-commits/SKILL.md">Analyzes the working tree, performs security/leak audits, plans Conventional Commits, and executes git transactions.</skill>
  <skill name="ami-manage-docs" path="skills/ami-manage-docs/SKILL.md">Comprehensive documentation manager. Detects whether to architect new docs from scratch or synchronize existing wikis with code diffs.</skill>
  <agent name="ami-tech-lead" path="agents/ami-tech-lead.md">Master Project Planning & Architecture Orchestrator. Invoke for greenfield architecture setup, project health evaluation, and feature planning.</agent>
</available_skills>
```

### Key Schema Optimizations
- **Attribute Encoding:** Uses `name="..."` and `path="..."` attributes instead of nested child tags (such as `<name>`, `<path>`), reducing token footprint by ~36%.
- **Root-Relative Paths:** Generates clean relative paths (`skills/ami-.../SKILL.md`, `agents/ami-....md`) avoiding absolute machine-dependent paths.
- **UTF-8 BOM Sanitization:** Automatically strips byte-order marks (`\uFEFF`) to prevent XML parser errors and JSON serialization corruption on Windows systems.

---

## 3. Execution Lifecycle

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Dynamic Catalog Generation (Startup / Turn Start)        │
│    adapters/universal_adapter.js scans skills/ & agents/     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. System Prompt Injection                                  │
│    Injects compact <available_skills> XML into AI context   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Intent Detection & Lazy Loading                          │
│    AI matches user intent -> reads specific SKILL.md        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Execution & Reporting                                    │
│    AI executes imperative steps defined in SKILL.md         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. API Reference (`adapters/universal_adapter.js`)

| Function | Returns | Description |
|---|---|---|
| `generateSkillsXml(skillsDir, repoRoot)` | `string` | Scans `skillsDir`, parses `SKILL.md` frontmatter, and formats `<skill>` entries. |
| `generateAgentsXml(agentsDir, repoRoot)` | `string` | Scans `agentsDir`, parses `.md` frontmatter, and formats `<agent>` entries. |
| `compileSystemPrompt(options)` | `string` | Merges base rules, operational guidelines, skills XML, and agent XML into a unified prompt block. |
