# Pattern: Graceful Feature Deprecation & Knowledge Migration via Advisory Prompts

## Context & Challenge

When removing or deprecating legacy developer tools and background features—especially features where users historically generated local data files on disk (such as `*_session-summary.md` inside `docs/coding-sessions/`)—engineers face an architectural tension:
1. **Aggressive Cleanup Risk:** Hard-deleting legacy directories or silently dropping them from automated setup logic risks causing data loss or abruptly abandoning user notes and pending task logs.
2. **Passive Neglect Risk:** Simply ignoring legacy directories or removing code references leaves obsolete files taking up disk space and cluttering project hierarchies indefinitely.

## The Solution Pattern: Silent Purging + Active Diagnostic Advisories

To execute an elegant, user-friendly deprecation of historical features across heterogeneous development environments, implement a dual-layer strategy:

### 1. Automated Idempotent Configuration Purging (Silent Clean-Up)
When removing background hook interceptors or plugins, retain their distinct identifier signatures (e.g., `'ami-session-start'`, `'docs/coding-sessions'`) inside your CLI wizard's merging algorithms (`bin/setup.js`).
* **Why:** When developers update their global package version and re-run installation wizards, the installation script actively matches those legacy signatures inside existing user configuration files (such as `~/.claude/settings.json` or `~/.gemini/config/`) and safely cleans them out without throwing errors or requiring tedious manual pruning by the user.

### 2. Interactive Filesystem Detection (Active Advisory Tip)
Instead of forcing automatic file deletions or abandoning user data, extend diagnostic tools (`amiga-ia-setup doctor` or health check commands) with intelligent disk inspection.
* **Implementation:** During system diagnostics and post-install hooks, check if the obsolete folder exists in the current project workspace:
  ```javascript
  const sessionsDir = path.resolve('docs', 'coding-sessions');
  if (fs.existsSync(sessionsDir)) {
    console.log('  💡 ADVISORY: Found legacy docs/coding-sessions/ directory.');
    console.log('     Recommendation: Extract any valuable architectural insights or pending tasks using ami-extract-learnings and ami-manage-docs skills, and then delete docs/coding-sessions/ to save tokens and keep your repository clean.');
  }
  ```
* **Why:** This empowers the user with an actionable, intelligent remediation path. It bridges the old architecture with modern capabilities by explicitly directing developers to invoke knowledge extraction workflows (`ami-extract-learnings`, `ami-manage-docs`) to synthesize remaining historical context into long-term records (ADRs or wikis) before deleting the leftover folder.

## Best Practice Takeaway

Never leave users to guess how to handle deprecated artifacts. Combine **autosecret configuration self-healing** with **educational diagnostic guidance** to preserve engineering trust and project cleanliness.
