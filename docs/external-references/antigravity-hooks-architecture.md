> **Created:** 2026-08-03
> **Last Updated:** 2026-08-03

# Google Antigravity Hooks Architecture: Beyond Bash

This document outlines how Google Antigravity supports execution hooks across its platform surfaces (CLI, IDE, Plugins, and Python SDK), specifically addressing alternative execution engines to traditional Bash scripts.

## 1. Context and Problem Statement

When operating in **secure mode** (the default running mode for safe agent interaction and planning), Antigravity ignores inline Bash hooks (e.g., legacy scripts using `shell: "bash"` and relying on unix piping/`jq`). Historically, this led to the assumption that Antigravity does not support runtime hooks at all, prompting installers to skip copying `hooks.json` and relying solely on its atomic planning pipeline (`implementation_plan.md` → user approval → execution).

However, Antigravity has a comprehensive extensibility model that natively supports deterministic runtime guardrails via universal command scripts (Node.js/Python) in plugins and programmatic Python callbacks in the SDK.

---

## 2. CLI and Plugin Hooks (`hooks.json`)

Within Antigravity plugins (manifested by `plugin.json` and loaded into `~/.gemini/antigravity-cli/plugins/<plugin_name>/` or workspace configurations), hooks can be declared in a `hooks.json` file. 

Instead of relying on shell-specific piping (`cat` or Bash commands), Antigravity's plugin engine accepts cross-platform execution commands under the `"command"` field.

### Example: Node.js / Python Hook Schema in `hooks.json`

```json
{
  "safety-gate": {
    "PreToolUse": [
      {
        "matcher": "run_command|Edit|Write",
        "hooks": [
          {
            "command": "node ./scripts/ami-pre-tool-use.js"
          }
        ]
      }
    ]
  }
}
```

### Key Differences from Legacy Bash Hooks:
1. **Runtime Agnostic:** By specifying an executable runtime like `node` or `python` in the `"command"` parameter, the hook executes robustly across Windows, macOS, and Linux without triggering Bash security blocks.
2. **Lifecycle Events:** Supported trigger events include `PreInvocation`, `PostInvocation`, `PreToolUse`, `PostToolUse`, and `Stop`.
3. **Structured Communication:** Just as in universal Node.js hooks for other platforms, the event payload is streamed as JSON via standard input (`stdin`), and execution proceeds or terminates based on standard exit codes and standard error (`stderr`) feedback to the agent model.

---

## 3. Programmatic Hooks in the Antigravity Python SDK

For programmatic workflows and agent leasing via the public Antigravity Python SDK, hooks are implemented natively as **Python callbacks** rather than subprocess commands. This avoids arbitrary command execution entirely and integrates directly into the execution loop.

### Strict Hook Taxonomy

Antigravity classifies programmatic SDK hooks into three distinct structural categories:

1. **Inspect Hooks (Read-Only, Non-Blocking):**
   - **Purpose:** Observability, logging, metrics, and telemetry.
   - **Behavior:** Receives immutable event data after an operation occurs. Cannot modify payload or block agent execution.
   - **Example:** `PostToolCallHook`, `PostInvocationInspectHook`.

2. **Decide Hooks (Read-Only, Blocking):**
   - **Purpose:** Policy enforcement, permissions, and guardrails.
   - **Behavior:** Evaluates proposed tool executions or invocations and returns an explicit decision (`Allow`, `Deny`, or user prompt required) before execution occurs.
   - **Example:** `PreToolCallDecideHook`.

3. **Transform Hooks (Modifying, Blocking):**
   - **Purpose:** Data sanitization, dynamic prompt optimization, context compression, or automated error recovery.
   - **Behavior:** Intercepts data structures (such as tool inputs, prompt payloads, or tool execution errors), modifies them, and injects the transformed data back into the agent's context window.
   - **Example:** `OnToolErrorHook`, `OnInteractionHook`.

### TOCTOU Prevention & Execution Order
To prevent **Time-of-Check to Time-of-Use (TOCTOU)** security vulnerabilities, Antigravity strictly enforces hook execution sequencing:
1. **Decide Hooks** evaluate the exact proposal first.
2. If allowed, **Transform Hooks** apply necessary mutations (or recovery mechanisms upon execution failure).
3. Finally, **Inspect Hooks** execute asynchronously after the operation completes.

---

## 4. Architectural Takeaways for Amiga IA

1. **Universal Node.js Hooks Work for Antigravity Plugins:** The cross-platform Node.js hook scripts (`ami-pre-tool-use.js` and `ami-post-tool-use.js`) developed for Claude Code can be leveraged for Antigravity by mapping them cleanly in a plugin's `hooks.json` using the `"command": "node ..."` syntax.
2. **Setup Wizard Upgrade Path:** Currently, `bin/setup.js` skips installing hooks for Antigravity with the informational message that Bash hooks are ignored in secure mode. In future milestones, the installer can be enhanced to install universal Node.js hooks for Antigravity plugins as well.
3. **Declarative Rules Remain Primary Guardrails:** In addition to execution hooks, Antigravity heavily leverages persistent Markdown rules (in `.agents/rules/` and global configurations) to deterministically steer agent behaviors and workflow adherence.

---

## 5. Source References

- [Google Antigravity Official Documentation — Hooks](https://antigravity.google/docs/hooks)
- [Google Antigravity Official Documentation — Plugins](https://antigravity.google/docs/plugins)
- [Google Antigravity Python SDK Repository](https://github.com/google-antigravity/antigravity-sdk-python)
- [Amiga IA: Universal Node.js Hooks Guide](./claude-code-nodejs-hooks.md)
