# Learning: Cross-Platform Git Hooks in Claude / Antigravity

**Date:** 2026-06-07

## Context
When creating automated workflows that intercept Git operations (like `git commit`, `git push`, and `gh pr create`), we initially used PowerShell inline scripts within the JSON configuration.

## Decision & Lesson
We learned that relying on `$env:CLAUDE_TOOL_ARGS` within an inline PowerShell script causes two issues:
1. **Platform Dependence:** It locks the repository configuration strictly to Windows. Developers on Mac, Linux, or using WSL/Git Bash cannot trigger these hooks natively.
2. **Escaping Complexity:** Handling complex quotes and JSON escaping for inline PowerShell is brittle.

**Solution implemented:**
We refactored the hooks to use POSIX-compliant `bash` inline syntax:
```json
"command": "if echo \"$CLAUDE_TOOL_ARGS\" | grep -qE 'git[[:space:]]+commit'; then echo '...'; exit 2; fi"
```
This guarantees cross-platform compatibility out of the box, as macOS/Linux use bash natively, and Windows environments for these AI tools (like Git Bash) support `bash` natively as well. It also eliminates the need to maintain separate physical script files just for simple validations.
