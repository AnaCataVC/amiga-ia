> **Created:** 2026-08-01
> **Last Updated:** 2026-08-01

# Claude Code Hooks: Node.js Implementation Guide

This document details how to implement cross-platform Claude Code hooks using Node.js instead of shell-specific scripts (like Bash or PowerShell). This is the officially recommended pattern for ensuring hooks work reliably across macOS, Linux, and Windows.

## 1. How Node.js Hooks Work

Claude Code triggers hooks deterministically during its lifecycle (e.g., `PreToolUse`, `PostToolUse`).
- **Input:** Claude Code pipes event context as a JSON string into the script's Standard Input (`stdin`).
- **Output:** The script communicates back by writing to `stdout` (captured for context) or `stderr` (for error messages/reasons).
- **Control Flow:** The script's exit code determines what Claude Code does next.

### Exit Codes

- `0` (Success): Allows the action to proceed.
- `2` (Block/Error): Acts as a hard block (especially in `PreToolUse`). Claude Code will stop the action and feed the `stderr` output back to the model so it knows why it was blocked.
- Any other non-zero code is treated as a generic failure but may not explicitly block in the same predictable way as `2`.

## 2. File Structure

Node.js hook scripts are typically placed in the `.claude/hooks/` directory at the project root (for repository-specific hooks) or in `~/.claude/hooks/` (for global hooks).

**Example Structure:**
```
.claude/
├── settings.json
└── hooks/
    ├── pre-commit.js
    └── pre-bash.js
```

## 3. Configuration in `settings.json`

To register a Node.js hook, use the `command` field in `settings.json`. You can invoke the `node` executable directly and pass the path to your script.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/pre-bash.js"
          }
        ]
      }
    ]
  }
}
```

> **Note:** For global hooks (`~/.claude/settings.json`), use absolute paths or environment variables like `${CLAUDE_PROJECT_DIR}` to resolve paths robustly.

## 4. Reading `stdin` in Node.js

Unlike Bash which can use `cat`, Node.js must buffer and assemble chunks from `process.stdin` before parsing the JSON.

**Official Recommended Pattern:**

```javascript
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const command = input.tool_input?.command || "";

    // Example validation logic
    if (command.includes("rm -rf")) {
      console.error("Destructive commands are not allowed.");
      process.exit(2); // Block execution
    }

    process.exit(0); // Allow execution
  } catch (err) {
    console.error("Failed to parse hook input");
    process.exit(1);
  }
});
```

## 5. Gotchas & Best Practices

- **Path Resolution:** If running globally (`~/.claude/settings.json`), use absolute paths or environment variables like `${CLAUDE_PROJECT_DIR}` in the `command` field to avoid "Command not found" errors (e.g., `"command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/script.js"`).
- **Synchronous Execution:** Hooks block the agent's loop while running. Keep Node.js scripts fast to avoid adding latency to Claude Code's responses.
- **Dependencies:** Avoid using external NPM packages (`require('some-package')`) in global hooks unless they are bundled, as the node environment may not have them installed globally. Stick to built-in Node.js modules like `fs`, `path`, and `child_process`.
- **Cross-Platform Paths:** Use `path.join()` and `path.resolve()` instead of hardcoded path separators.

## 6. Comparison: Shell vs Node.js Hooks

| Aspect | Shell (Bash/PowerShell) | Node.js |
|--------|------------------------|---------|
| Cross-platform | ❌ Shell-specific | ✅ Universal |
| stdin reading | `cat` / `[Console]::In.ReadToEnd()` | `process.stdin` chunks |
| JSON parsing | `jq` / `ConvertFrom-Json` | `JSON.parse()` (built-in) |
| Dependencies | Shell must be installed | Node.js must be installed |
| Maintenance | 2 variants to maintain | 1 codebase |
| File overhead | Inline in settings.json | External .js files |

## 7. Source References

- [Anthropic Claude Code Documentation — Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Claude Code GitHub Examples](https://github.com/anthropics/claude-code)
