> **Created:** 2026-07-26
> **Last Updated:** 2026-07-26

# ADR-001: Unified Distribution via NPM Package CLI Wizard

## Context & Problem Statement

Previously, **Amiga IA** supported two parallel distribution models:
1. **Native Plugin Manifests (`plugin.json` / `.claude-plugin/plugin.json`):** Installed via platform-specific marketplace commands.
2. **NPM Package CLI Wizard (`npx @anacatavc/amiga-ia-setup`):** Installed via global NPM package and setup wizard.

Maintaining both distribution channels led to several critical architectural challenges:
* **Configuration Drift & Duplication:** Synchronizing metadata across `package.json`, root `plugin.json`, `.claude-plugin/plugin.json`, `hooks.json`, and `hooks/hooks.json` required complex build pipelines and increased the surface area for silent version mismatches.
* **Duplicate Skill Conflict Risk:** If a user installed Amiga IA via both the native plugin system and the NPM CLI wizard, both systems registered identical `ami-*` skills into global AI assistant paths, causing duplicate skill collisions.
* **Sandbox & Hook Asymmetry:** Native plugins had restricted access to background hooks due to assistant sandboxing, whereas the NPM CLI wizard cleanly merges background hooks (`SessionStart`, `PreToolUse`, `PostToolUse`) into `~/.claude/settings.json` with safe backups (`settings.json.amiga-backup`).

## Decision

We decisioned to **deprecate native plugin manifests (`plugin.json` and `.claude-plugin/plugin.json`)** and consolidate Amiga IA distribution **exclusively via the NPM package CLI wizard (`npx @anacatavc/amiga-ia-setup`)**.

### Key Changes:
1. **Single Source of Truth (SSOT):** `package.json` is the sole authoritative definition of package metadata, versioning, and dependencies.
2. **Streamlined Setup Wizard:** `bin/setup.js` installs skills and agents directly into standard assistant configuration paths (`~/.claude/` and `~/.gemini/config/`) and automatically cleans any legacy plugin directories (`~/.gemini/config/plugins/amiga-ia`).
3. **Diagnostic Tooling:** `amiga-ia-setup doctor` provides automated validation of skill YAML frontmatter, checks for legacy plugin conflicts, and verifies JSON syntax of hooks configuration.
4. **Declarative Antigravity Rules:** Added `rules/ami-rules.md` to establish declarative platform parity for Antigravity without depending on bash hooks in secure mode.

## Consequences

### Positive:
* Eliminates configuration drift and redundant manifest files.
* Prevents duplicate skill name collisions for users.
* Empowers developers with interactive setup and diagnostic tools (`doctor`).
* Reduces maintenance and testing overhead to a single, cross-platform CLI script (`bin/setup.js`).

### Negative:
* Users cannot use `agy plugin install` or `/plugin install` directly; they must run `npm install -g @anacatavc/amiga-ia` followed by `amiga-ia-setup`.

## Status

**Accepted** & Implemented in `v2.7.0`.
