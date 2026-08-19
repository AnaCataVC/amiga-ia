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

## 4. Parameter Normalization & Protocol Compliance

### 4.1 Input Payload Normalization
Claude Code and Antigravity pass tool call payloads with different schema conventions:
- **Claude Code:** Nested under `tool_input` (e.g., `tool_input.command`, `tool_input.file_path`).
- **Antigravity:** Protojson camelCase nested under `toolCall.args` (e.g., `toolCall.args.CommandLine`, `toolCall.args.TargetFile`, `toolCall.args.AbsolutePath`).

The universal scripts normalize arguments dynamically:

```javascript
// Universal argument extraction across AI assistants
const toolArgs = input.toolCall?.args || input.tool_input || input;
const command = toolArgs.command || toolArgs.CommandLine || toolArgs.command_line || '';
const filePath = toolArgs.file_path || toolArgs.TargetFile || toolArgs.AbsolutePath || toolArgs.target_file || toolArgs.path || '';
```

### 4.2 Standard Output Protocol (Stdout JSON)
Antigravity's lifecycle runner parses standard output as structured JSON. To maintain non-blocking compliance across all assistants:
1. **Advisory Reminders & Warnings:** Printed exclusively to standard error (`console.error(...)` / `stderr`).
2. **Standard Output:** Always emits valid JSON (`{"decision":"allow"}`) in a `finally` block before exiting with code `0`:

```javascript
finally {
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}
```

### 4.3 Working Directory (CWD) & Relative Path Standards
- **Antigravity (`~/.gemini/config/hooks.json`):** Antigravity sets the hook execution working directory directly to the folder containing `hooks.json` (`~/.gemini/config/`). Therefore, hooks are configured with clean relative paths (`node ./hooks/ami-pre-tool-use.js`). This avoids Windows drive letter quote escaping bugs and keeps the installation machine-portable.
- **Claude Code (`~/.claude/settings.json`):** Claude Code executes hooks from the user's active project workspace directory, requiring resolved absolute paths.
