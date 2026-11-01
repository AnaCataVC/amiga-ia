# Amiga IA CLI (`ami`) — User & Installation Guide

[English](cli-installation-guide.md) | [Español](cli-installation-guide.es.md)

`ami` (also available via `amiga-ia-setup`) is the official command-line interface for **Amiga IA (`@anacatavc/amiga-ia`)**. It manages the installation, diagnosis, domain packs, receipts, and platform runtime extensions across **Anthropic Claude Code**, **Google Antigravity**, and **OpenAI Codex**.

---

## 1. Installation

Install `@anacatavc/amiga-ia` globally via the NPM package registry:

```bash
npm install -g @anacatavc/amiga-ia
```

Verify your installation:

```bash
ami --version       # or: node bin/setup.js
ami list            # displays the ecosystem catalog and local assistant status
```

> [!NOTE]
> `ami` and `amiga-ia-setup` point to the exact same CLI binary. You can use whichever command fits your workflow.

---

## 2. Command Reference

| Command | Alias | Description |
| :--- | :--- | :--- |
| `ami` | `amiga-ia-setup` | Opens the interactive setup wizard menu. |
| `ami install` | - | Interactive assistant and pack configuration wizard. |
| `ami list` | `ami ls` | Lists all Domain Packs (`essential`, `data`, `ui`), runtime extensions, capabilities, and installed assistants. |
| `ami add <target>` | - | Activates an in-tree Domain Pack (`data`, `ui`) or installs an external Runtime Extension (`claude-mods`). |
| `ami remove <target>`| `ami rm <target>`| Deactivates an optional Domain Pack (`data`, `ui`) or removes a Runtime Extension (`claude-mods`). |
| `ami doctor` | `ami --doctor` | Audits system health, version manifests, YAML frontmatter integrity, hooks, rules, and runtime extensions. |
| `ami uninstall` | `ami u` | Cleanly purges Amiga IA capabilities, rules, and hook configurations from all assistants. |

---

## 3. Domain Packs & Runtime Extensions

Amiga IA organizes its **39 capabilities** (14 subagents and 25 declarative skills) and external platform mods into logical packages defined in `registry/packs.json`:

```text
AMIGA IA Ecosystem
│
├── In-Tree Domain Packs (Portable, Declarative Markdown Skills & Agents)
│   ├── essential   (Core baseline: 12 agents, 20 skills — mandatory)
│   ├── data        (Analytics & SQL: ami-data-scientist, ami-optimize-sql, ami-build-dashboard)
│   └── ui          (UI/UX: ami-ui-builder, ami-design-ux, ami-prototype-ui, ami-audit-ui-consistency)
│
└── Runtime Extensions (Platform-Specific Host Plugins)
    └── claude-mods (6 TypeScript/ESM mods for Claude Code CLI)
```

### Managing Domain Packs (`ami add` / `ami remove`)

Domain Packs are packaged directly inside `@anacatavc/amiga-ia`. Activating or removing them is **instantaneous, 100% offline, and requires zero network downloads**:

```bash
# Activate the Data & Analytics pack across installed assistants:
ami add data

# Activate the UI & UX Engineering pack:
ami add ui

# Deactivate an optional pack:
ami remove data
```

> [!IMPORTANT]
> The `essential` pack provides foundational software engineering, testing, git hygiene, and cleanroom capabilities. It cannot be removed individually; use `ami uninstall` if you wish to detach Amiga IA completely.

### Managing Claude Code Runtime Extensions (`ami add claude-mods`)

`claude-mods` connects Amiga IA to **`AnaCataVC/ami-claude-mods`**, installing 6 production-grade mods into `~/.claude/mods/`:
* `hooks-viewer`: Side pane inspector for loaded hooks and active plugins.
* `undelegated-reads`: Circuit breaker enforcing subagent exploration delegation.
* `close-checklist`: Pre-exit safety inspector checking uncommitted git changes and containers.
* `child-sessions`: Interactive subagent inbox above prompt.
* `cleanroom-guard`: Host-level isolation for double-blind cleanroom TDD.
* `context-guard`: Workspace-specific GitHub account and Kubernetes profile alignment.

```bash
# Install all 6 Claude Code mods into ~/.claude/mods/:
ami add claude-mods

# Remove the mods from ~/.claude/mods/:
ami remove claude-mods
```

---

## 4. Diagnostic & Health Verification (`ami doctor`)

Run `ami doctor` to verify configuration integrity at any time:

```bash
ami doctor
```

The diagnostic tool asserts:
1. **Version Parity:** Asserts that all installed environments match the executing package version.
2. **Registry Updates:** Checks NPM registry for newer package releases.
3. **Plugin Integrity (Antigravity):** Confirms `~/.gemini/config/plugins/amiga-ia` manifests, assets, and icons exist.
4. **Frontmatter Integrity:** Scans all 25 skills and 14 subagents to assert standard YAML metadata (`name:`, `description:`, `allowed-tools:`, write permissions, and subagent delegation).
5. **Hooks Syntax & Safety:** Validates `settings.json` and `hooks.json` syntax across platforms, alerting on shell mismatches (e.g. bash hooks on Windows).
6. **Rules Ingestion:** Checks delimited blocks in `CLAUDE.md`, `AGENTS.md`, and `rules/ami-rules.md`.
7. **Runtime Extensions (Claude Code):** Audits installed mods in `~/.claude/mods/`.

---

## 5. Uninstallation

To cleanly detach Amiga IA from your development workstation:

```bash
# 1. Remove all copied capabilities, rules, and hook injections:
ami uninstall

# 2. Purge the global CLI package:
npm uninstall -g @anacatavc/amiga-ia
```
