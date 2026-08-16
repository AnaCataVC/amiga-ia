# Pattern: Cross-Platform CLI Wizard & Multi-Shell Hook Architecture

## Context & Challenge

Distributing AI agent frameworks, declarative skills, and lifecycle execution hooks to developer workstations involves managing heterogeneous operating systems and terminal runtime environments:
1. **Operating System Divergence:** Developers run across Windows (PowerShell 5.1/7+, CMD, Git Bash), macOS (Zsh, Bash), and Linux (Bash, Zsh, Fish). Each platform features distinct path separators (`\` vs `/`), home directory resolutions (`USERPROFILE` vs `HOME`), and permission models.
2. **Symlink Privilege Restrictions on Windows:** Creating symbolic links on Windows requires either elevated administrative privileges (UAC elevation) or explicit Developer Mode activation. Relying on symlinks for installing AI configuration folders causes frequent `EPERM` (operation not permitted) errors during automated setup.
3. **Shell Execution Nuances & Command Chaining:** Command chaining syntax (`&&`, `;`), parameter passing conventions, and escaping rules differ significantly between POSIX shells and PowerShell. Executing inline hook scripts across different shells frequently leads to syntax errors and broken tool interception hooks.
4. **Hook Engine Incompatibilities:** Background event hooks (e.g., pre-tool reminders or post-edit verification) configured for Bash fail on Windows machines lacking a configured Bash binary in `$PATH`, while PowerShell hooks fail in standard macOS/Linux environments.

---

## The Solution Pattern: Universal Cross-Platform Architecture

To ensure seamless installation and runtime reliability across all host environments without sacrificing platform-specific optimizations, implement a four-pillar cross-platform architecture:

### 1. Pure Node.js Interactive Wizard Core
The setup wizard (`bin/setup.js`) is implemented entirely in Node.js, utilizing cross-platform terminal interface libraries (`@clack/prompts`, `picocolors`) and standard runtime modules:
* **Path Normalization:** Resolves paths dynamically using `path.join()`, `path.resolve()`, and `os.homedir()`.
* **Zero Shell Dependency for Setup:** The installation process executes entirely within Node.js filesystem APIs (`fs.copyFileSync`, `fs.mkdirSync`, `fs.rmSync`), avoiding shell-spawned subcommands during capability provisioning.

```javascript
const homeDir = os.homedir();
const claudeDir = path.join(homeDir, '.claude');
const geminiDir = path.join(homeDir, '.gemini', 'config');
```

### 2. Physical Copy Strategy vs. Symbolic Links
Rather than creating symbolic links, the CLI wizard physically copies skill directories (`skills/*/SKILL.md`), agent definitions (`agents/*.md`), and rules (`rules/*.md`) directly into user configuration targets (`~/.claude/` and `~/.gemini/config/`):
* **Frictionless Windows Compatibility:** Eliminates `EPERM` errors on Windows by operating purely on user-owned configuration folders without requiring elevated privileges.
* **User Ownership & Customization:** Placing physical copies into standard user paths enables developers to customize prompt instructions, add team-specific conventions, and version-control their modified skills within their own repositories.
* **Orphan Cleanup Logic:** The wizard implements recursive orphan detection (`cleanOrphanedFiles`) that removes obsolete Amiga capabilities (`ami-*`) while strictly preserving personal user-defined skills and agents.

### 3. Three-Tier Multi-Engine Hook Strategy
To accommodate diverse runtime requirements and developer preferences, background lifecycle hooks are structured into three distinct engines:

```
                          ┌────────────────────────┐
                          │ Setup Wizard Engine    │
                          │ Selection Prompt       │
                          └──────────┬─────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Node.js Engine   │       │ PowerShell Engine│       │ Bash Engine      │
│ (Universal)      │       │ (Windows Native) │       │ (POSIX / Unix)   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ `node script.js` │       │ `pwsh -File ...` │       │ `bash script.sh` │
│ Works on any OS  │       │ Tailored for Win │       │ Tailored for Mac │
│ with Node.js     │       │ without WSL      │       │ and Linux        │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

1. **Universal Node.js Engine (Recommended Default):**
   - Implemented as zero-dependency Node.js scripts (`hooks/scripts/ami-pre-tool-use.js`, `ami-post-tool-use.js`).
   - Invoked via standard `node "path/to/script.js"`.
   - Guaranteed identical runtime behavior across Windows PowerShell, CMD, Git Bash, macOS, and Linux without shell-specific dependencies.
2. **Native PowerShell Engine:**
   - Implemented as a dedicated script (`hooks/scripts/ami-hooks.ps1`) executed with `-NoProfile -ExecutionPolicy Bypass`.
   - Tailored for native Windows environments utilizing PowerShell argument parsing and defensive error handling.
3. **Native POSIX Bash Engine:**
   - Implemented as a dedicated shell script (`hooks/scripts/ami-hooks.sh`).
   - Tailored for native Unix, macOS, and Linux terminal environments using standard POSIX parameter dispatch.

### 4. Context-Aware Platform Diagnostics (`amiga-ia-setup doctor`)
The diagnostic utility dynamically inspects the host platform (`os.platform()`) and evaluates whether configured hooks match the active OS environment:
* **Windows Detection:** Checks whether Bash hooks are registered on Windows, advising the user to switch to Node.js or PowerShell if Git Bash is not configured.
* **POSIX Detection:** Checks whether PowerShell hooks are registered on Unix/macOS, advising the user to switch to Node.js or Bash.
* **Syntax & Health Audits:** Verifies JSON validity in configuration files (`~/.claude/settings.json`, `~/.gemini/config/hooks.json`) and warns of corrupted or untracked environments.

---

## Best Practice Takeaways

1. **Default to Universal Runtimes for Tooling:** Build CLI installers and default hook runtimes on ubiquitous runtimes like Node.js to achieve cross-platform parity before offering shell-specific optimizations.
2. **Prefer Physical File Provisioning over Symlinks for User-Facing Extensions:** Avoid privilege elevation traps on Windows by performing physical file copies, paired with prefix-aware orphan cleanup (`ami-*`) to prevent leaving stale artifacts.
3. **Pair Multi-Engine Support with Diagnostic Validation:** When offering platform-specific options (PowerShell vs. Bash), provide automated diagnostic health checks (`doctor`) to detect cross-platform configuration mismatches before they cause runtime failures.
