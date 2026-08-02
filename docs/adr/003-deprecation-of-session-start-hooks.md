> **Created:** 2026-08-02
> **Last Updated:** 2026-08-02

# ADR-003: Deprecation of SessionStart Hooks and Persistent Session Summaries

## Context & Problem Statement

Historically, **Amiga IA** utilized an automated background event hook (`SessionStart`) backed by the script `ami-session-start.js` to automatically search for markdown session summaries inside `docs/coding-sessions/*.md` and inject pending tasks directly into the user's initial command prompt at the beginning of every coding session.

While originally designed to prevent context loss across sessions, operational usage in complex engineering environments revealed significant inefficiencies and problems with this mechanism:
* **Token Cost Dilution & Waste:** Automatically injecting raw markdown logs into the initialization prompt consumes valuable input tokens on every turn of conversation. As session summaries grew larger, this resulted in persistent, cumulative token waste without guaranteeing relevance to the user's current task.
* **Context Rot & Noise:** Automatically forcing previous session history (including solved bug workarounds, old stack traces, or outdated assumptions) into a newly opened context window often confused AI agents or led them to re-investigate already resolved problems.
* **Redundancy with Native AI Memory:** Modern AI coding assistants natively handle state persistence far more efficiently without relying on shell interceptors. Antigravity leverages structured artifact persistence (`task.md`, `walkthrough.md`, and its session brain), while Claude Code utilizes native conversational history and lightweight state storage.
* **Storage Overhead:** Generating physical files inside `docs/coding-sessions/` added unnecessary clutter to repositories and required explicit `.gitignore` handling to avoid polluting git commits.

## Decision

We have decided to **deprecate and remove the `SessionStart` event hook** and completely decommission automated markdown session summaries (`docs/coding-sessions/`).

### Key Architectural Changes:
1. **Removal of Hook Execution:** Purged `ami-session-start.js` from `hooks/scripts/` and removed `"SessionStart"` array definitions from all engine manifests (`hooks.json`, `hooks-pwsh.json`, and `hooks/hooks.json`).
2. **Transition to Lazy-Loaded Knowledge:** Knowledge preservation transitions from automatic push-based prompt injection to **on-demand, pull-based declarative execution**. Users and subagents explicitly invoke specialized skills (`ami-learnings-extractor`, `ami-doc-manager`) only when knowledge needs to be persisted or retrieved.
3. **Automated Settings Clean-Up:** Maintained legacy hook signatures (`ami-session-start`, `docs/coding-sessions`) inside `bin/setup.js` (`mergeSettings`) so existing developer environments automatically clean-strip old hook configurations from their global `~/.claude/settings.json` file upon updating the package.
4. **Interactive Migration Advisory:** To protect against silent historical data loss, `amiga-ia-setup doctor` now actively inspects local user workspaces. If a legacy `docs/coding-sessions/` directory is found on disk, it outputs an interactive advisory tip recommending the execution of knowledge extraction skills before safely deleting the directory.
5. **UI & Catalog Consistency:** Removed the `Session Context Restore` capability card from product showcase surfaces (`index.html`) and updated feature descriptions to focus on declarative architecture documentation and learning extraction.

## Consequences

### Positive
* **Zero Token Cost at Session Start:** Eliminates initial prompt bloat, directly reducing token usage and prompt processing latency at the beginning of every AI conversation.
* **Cleaner Repository Footprint:** Eliminates the proliferation of loose temporary session log files in developer repositories.
* **Higher Context Quality:** Prevents "context rot" by ensuring only intentionally documented Architecture Decision Records (`docs/adr/`) and curated learnings (`docs/learning/`) form the persistent engineering memory of the repository.
* **Backward-Compatible Clean Up:** Existing installations seamlessly shed obsolete configurations without manual configuration tweaking.

### Negative / Mitigation
* **Manual Trigger for Knowledge Capture:** Developers must intentionally invoke `/ami-learnings-extractor` or rely on subagent end-of-task reviews rather than relying on silent background scripting. This is mitigated by clear user documentation and guidance from orchestrator agents like `ami-next-step-assistant`.
