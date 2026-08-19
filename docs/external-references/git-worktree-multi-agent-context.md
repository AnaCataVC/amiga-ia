> **Created:** 2026-08-19
> **Last Updated:** 2026-08-19

# Git Worktree Multi-Agent Context & Workspace Transparency

## 1. Overview & Problem Definition
Modern agentic AI coding assistants (such as Google Antigravity and Anthropic Claude Code) frequently leverage multi-agent architectures where subagents operate concurrently. To prevent file write collisions, context contamination, and git index locking across concurrent subagent tasks, agent runtimes and developers use **Git Worktrees** (`git worktree`) or isolated branched workspaces (`Workspace: 'share'` / `Workspace: 'branch'` / `claude --worktree`).

However, in conversational chat interfaces and CLI tools, the active working directory (`Cwd`) of an agent may become disconnected from the user's intended worktree. When an agent or user triggers lifecycle workflows (such as pre-push validation via `ami-push-assistant` or PR preparation via `ami-pr-publisher`), running standard commands like `git status` or `git diff` only inspects the current directory's worktree. 

If changes reside in another linked worktree or if the agent is inspecting a clean main worktree while work happened in a feature worktree:
1. `git status` reports `nothing to commit, working tree clean`.
2. The AI assistant assumes no uncommitted work exists and fails to stage or commit the changes.
3. The UI provides zero transparency regarding *which* worktree or branch is being inspected, leaving the user confused.

---

## 2. Technical Mechanisms of Git Worktrees

### 2.1 Anatomy of a Worktree
A Git repository with worktrees contains:
- **Main Worktree:** The primary repository directory containing the primary `.git/` directory.
- **Linked Worktrees:** Separate filesystem directories checking out different branches simultaneously, sharing the exact same object database (`.git/objects/`) and remote tracking refs, but having their own private `HEAD`, `index`, and working files.
- **Administrative Metadata:** Stored in `<main-repo>/.git/worktrees/<worktree-name>/`.

### 2.2 Worktree Discovery & Inspection APIs

| Command | Purpose | Output Format |
| :--- | :--- | :--- |
| `git worktree list` | Lists all active worktrees, branch names, and commit hashes. | Standard human-readable tabular output. |
| `git worktree list --porcelain` | Machine-readable list of all worktrees, worktree paths, HEAD commits, and branches. | Structured key-value blocks (e.g. `worktree <path>`, `HEAD <sha>`, `branch <ref>`). |
| `git rev-parse --show-toplevel` | Returns the root directory of the current active worktree. | Absolute or normalized path. |
| `git branch --show-current` | Returns the current checked-out branch in the active worktree. | Branch name string. |
| `git -C "<path>" status --short` | Queries the status of a specific worktree without changing the shell's global working directory. | Porcelained short status. |

---

## 3. Worktree Traversal & Status Extraction

To achieve complete transparency and prevent silent omissions, agents must execute a worktree cross-audit before declaring a repository clean:

### 3.1 Worktree Cross-Audit Pattern (PowerShell & Cross-Platform)
```powershell
# 1. Identify current active context
$currentRoot = git rev-parse --show-toplevel 2>$null
$currentBranch = git branch --show-current 2>$null

# 2. Enumerate all registered worktrees
git worktree list --porcelain
```

When parsing porcelain output:
```text
worktree /path/to/main
HEAD 89d72216...
branch refs/heads/main

worktree /path/to/feature-tree
HEAD a1b2c3d4...
branch refs/heads/feat/user-auth
```

### 3.2 Detecting Pending Changes Across All Worktrees
```bash
# In shell scripts or agent routines:
git worktree list --porcelain | grep '^worktree' | cut -d ' ' -f 2- | while read -r wt_path; do
    dirty=$(git -C "$wt_path" status --short)
    if [ -n "$dirty" ]; then
        echo "Worktree $wt_path has uncommitted changes:"
        echo "$dirty"
    fi
done
```

---

## 4. Agent Operational Directives & UI Transparency

To eliminate confusion in Antigravity and Claude Code:

1. **Explicit Context Declaration in Reports:**
   Every git lifecycle agent (`ami-push-assistant`, `ami-plan-commits`, `ami-pr-publisher`, `ami-release-manager`) must explicitly declare the active context in the output header:
   ```markdown
   - **Active Worktree:** `C:/path/to/repo`
   - **Active Branch:** `main`
   - **Registered Worktrees:** 2 worktrees found (`main`, `feat/auth`)
   ```

2. **Cross-Worktree Warning & Remediation:**
   If `git status` in the current worktree is clean, but another worktree has dirty changes or unpushed commits:
   - The agent MUST NOT simply say "Working tree clean, nothing to commit".
   - The agent MUST explicitly alert the user:
     > ⚠️ **Notice:** Current worktree (`<current-path>`) is clean. However, uncommitted changes were detected in linked worktree: `<other-path>` (branch: `<other-branch>`).
   - The agent must ask the user whether they want to switch to the linked worktree or proceed with the current one.

3. **Guaranteed Execution of Approved Commits:**
   Once uncommitted changes in the target worktree are planned and approved by the user, the agent MUST explicitly execute the commit commands (`git add`, `git commit`) before attempting to push or publish.

---

## 5. References
- [Git Documentation: git-worktree](https://git-scm.com/docs/git-worktree)
- [Antigravity Subagent Workspace Architecture & Inheritance](file:///c:/Users/anaca/Repos/amiga-ia/docs/architecture/universal-adapter.md)
- [Multi-Agent Isolation & Parallel Execution Patterns](https://nimbalyst.com)
