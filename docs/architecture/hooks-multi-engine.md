# Architecture Specification: Multi-Engine Guardrail Hooks

This document details the multi-shell hooks architecture and runtime security guardrails in **Amiga IA**.

---

## 1. Overview & Objectives

Hooks in Amiga IA act as non-blocking guardrails that provide real-time advisory guidance, protect sensitive files, and enforce best practices before and after tool executions (such as running shell commands or modifying code files).

### Core Design Goals
- **Multi-Platform Support:** Native execution across Windows (PowerShell), macOS/Linux (POSIX Bash), and Universal Node.js environments.
- **Zero Token Waste:** Lightweight parameter-based dispatch via external runtime scripts instead of embedding large inline shell scripts in settings files (ADR-004).
- **Non-Blocking Safety:** Hooks execute defensively and always return `exit 0` to ensure that an advisory script failure never halts the user's coding session.

---

## 2. Supported Hook Engines

| Engine | Primary Entrypoint | Invocation Pattern | Best Suited For |
|---|---|---|---|
| **Universal Node.js** | `hooks/scripts/ami-pre-tool-use.js`<br>`hooks/scripts/ami-post-tool-use.js` | `node /path/to/ami-pre-tool-use.js` | Cross-platform setups, default for modern environments. Supports Antigravity and Claude Code. |
| **PowerShell (Windows)** | `hooks/scripts/ami-hooks.ps1` | `pwsh -File /path/to/ami-hooks.ps1 -Event PreToolUse` | Windows environments without Node.js global binaries in path. |
| **Bash (POSIX)** | `hooks/scripts/ami-hooks.sh` | `bash /path/to/ami-hooks.sh -e PreToolUse` | Linux/macOS environments using native POSIX shell. |

---

## 3. Event Interceptions & Behaviors

### 3.1 `PreToolUse` (Pre-Execution Interception)
- **Git Push Protection:** When a `git push` command is detected, the hook outputs an advisory to ensure the user runs pre-push checks or delegates to `ami-push-assistant`.
- **Release Verification:** Detects `gh release create` and reminds the user to invoke `ami-release-manager` to calculate tags and draft changelogs.
- **Dependency Modification:** Detects `npm install` or `pip install` commands and advises verifying dependency integrity.

### 3.2 `PostToolUse` (Post-Execution Validation)
- **Debug Artifact Inspection:** Inspects modified code files for leftover `console.log`, `debugger;`, `print()`, or breakpoint statements.
- **Syntax & Lint Sanity:** Verifies that no syntax errors were introduced during code writes.

---

## 4. Parameter Normalization between Claude Code and Antigravity

Claude Code and Antigravity pass tool call payloads with different schema conventions (e.g., `command` vs `CommandLine`, `target_file` vs `TargetFile`).

The universal scripts normalize arguments dynamically:

```javascript
// Example parameter resolution in ami-pre-tool-use.js
const commandLine = payload.command || payload.CommandLine || payload.command_line || "";
const targetFile = payload.file_path || payload.TargetFile || payload.target_file || "";
```

This guarantees seamless compatibility regardless of which AI assistant triggers the hook.
