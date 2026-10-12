> **Created:** 2026-10-12
> **Last Updated:** 2026-10-12

# Upstream Issue Report: Antigravity CLI `invoke_subagent` Drops Declared Tools for Custom Named Subagents

## Summary
In Google Antigravity CLI (`agy` v1.3.3 and prior), invoking custom subagents discovered from Markdown definitions (`~/.gemini/config/agents/<name>.md` or `.agents/agents/<name>.md`) via `invoke_subagent(TypeName="<name>")` always instantiates the subagent with default read-only capabilities. Declared command execution (`run_command`, `manage_task`) and file-writing tools (`write_to_file`, `replace_file_content`) specified in the YAML frontmatter under `tools:` or `allowed-tools:` are omitted at runtime.

As a result, custom named subagents intended for CI/CD operations, Git lifecycle management, automated testing, or code implementation cannot execute shell commands or write files unless they are either dynamically registered via `define_subagent(enable_write_tools=true)` or invoked via `TypeName: "self"`.

---

## Environment
- **Product:** Google Antigravity CLI (`agy`)
- **Version:** v1.3.3 (Go runtime)
- **OS:** Windows 11 / Multi-platform

---

## Steps to Reproduce

1. Define a custom subagent in `~/.gemini/config/agents/code-builder.md`:
   ```markdown
   ---
   name: code-builder
   description: Feature builder that compiles code and runs tests.
   tools:
     - run_command
     - manage_task
     - write_to_file
     - replace_file_content
     - view_file
   mainAgent: false
   subagent: true
   ---

   # Role: Code Builder
   You are an automated builder. Run commands to build the project.
   ```

2. Start an `agy` session.
3. In the conversation, the model or user invokes the subagent:
   ```json
   {
     "Subagents": [{
       "TypeName": "code-builder",
       "Role": "Code Builder",
       "Prompt": "Run npm test and report results."
     }]
   }
   ```
4. Inspect the subagent's active tool declarations or observe its execution.

---

## Expected Behavior
The subagent `code-builder` should have access to `run_command`, `manage_task`, `write_to_file`, and `replace_file_content` as declared in its frontmatter `tools:`.

---

## Actual Behavior
The subagent receives only the read-only baseline:
- `view_file`
- `search_web`
- `read_url_content`
- `manage_task`
- `send_message`

Tools `run_command`, `write_to_file`, and `replace_file_content` are completely omitted. When instructed to execute shell commands or write code, the subagent reports that it lacks the necessary tool capabilities or merely outputs text without execution.

---

## Key Diagnostic Findings
1. **Dynamic Registration Parity:**
   When the identical instructions and permissions are passed via `define_subagent(name="code-builder-dynamic", enable_write_tools=true, ...)`, the instantiated subagent receives the full toolset including `run_command` and `write_to_file`.
2. **Archetype Clone Parity:**
   When invoking with `TypeName: "self"`, the subagent inherits full parent capabilities including `run_command`.
3. **Root Cause:**
   The internal subagent loader (`adjustCustomAgentConfigForSubagent` / `deriveSubagentTools`) appears to map static Markdown profiles to a standard read-only tool template rather than transferring the unmarshaled `Tools` slice into the subagent's execution manifest.

---

## Workaround
1. Programmatically register an execution-enabled clone via `define_subagent` setting `enable_write_tools: true`.
2. Or invoke `TypeName: "self"` passing the subagent's prompt and role in the invocation payload.
