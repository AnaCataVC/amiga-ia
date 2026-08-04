# Pattern: CLI Environment Version Manifest Tracking & Retrocompatible Diagnostics

## Context & Challenge

When distributing agent skills and tool configurations via package manager setup wizards (such as `npx @anacatavc/amiga-ia-setup`), local diagnostic utilities (`doctor` commands) must evaluate the health and version synchronization of installed capabilities across diverse user host environments (e.g., Claude Code in `~/.claude/` or Antigravity in `~/.gemini/config/`). 

Engineers frequently face several diagnostic assumptions that can lead to misleading developer output:
1. **Executing CLI vs. Local Environment Ambiguity:** Assuming the package version currently running in memory during setup or diagnostics is identical to the physical file version installed on disk within target AI environment directories. When users invoke a newly downloaded CLI version via `npx` over an older installation without re-running the installation routine, diagnostic reports falsely advertise the installed skills as up-to-date.
2. **Brittle Legacy Degradation:** Hard-enforcing strict version tracking files can lead to missing file exceptions (`ENOENT`) or misreporting existing pre-manifest installations as completely uninstalled.
3. **Fragile XML Test Assertions:** Unit test suites evaluating dynamic XML catalog generators often fail when strict literal string tags (`<available_skills>`) are verified, breaking tests when root attributes or dynamic metadata (`root_dir="..."`) are introduced.

---

## The Solution Pattern: Multi-Dimensional Manifest Tracking

To decouple the executing package runtime from local filesystem installations while maintaining graceful backward compatibility, implement a structured manifest tracking architecture:

### 1. Atomic Version Manifest Injection
During wizard installation workflows, generate a small metadata manifest file (`.amiga-version.json`) deposited directly into the target environment root alongside capability directories:

```json
{
  "name": "@anacatavc/amiga-ia",
  "version": "3.3.0",
  "installedAt": "2026-08-04T19:15:00.000Z"
}
```

* **Why:** This isolates local installation state from transient runtime execution. Diagnostic utilities can now independently analyze three specific dimensions of version status:
  - **Executing CLI Package Version:** Read directly from the running `package.json`.
  - **Local Installed Environment Version:** Parsed from `~/.claude/.amiga-version.json` or `~/.gemini/config/.amiga-version.json`.
  - **Public Registry Latest Version:** Queried asynchronously from public NPM registries to report available upgrades.

### 2. Retrocompatible Fallback Inspection (Legacy Detection)
When running diagnostic audits, design filesystem discovery logic with fallback heuristics to handle older installations that were configured prior to version manifest tracking:

```javascript
function getInstalledEnvironmentStatus(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return { installed: false, version: null, status: 'Not configured / Not installed' };
  }
  const manifestPath = path.join(targetDir, '.amiga-version.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (data && data.version) {
        return { installed: true, version: data.version, status: `v${data.version}`, installedAt: data.installedAt };
      }
    } catch (e) {
      // Ignore syntax errors and drop down to heuristic check
    }
  }
  // Retrocompatibility check for pre-manifest installations
  const skillsDir = path.join(targetDir, 'skills');
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(skillsDir) || fs.existsSync(agentsDir)) {
    return { installed: true, version: 'untracked', status: 'Legacy / Untracked (installed without version manifest)' };
  }
  return { installed: false, version: null, status: 'Not configured / Not installed' };
}
```

* **Why:** By actively verifying physical capability subdirectories (`skills/`, `agents/`) when `.amiga-version.json` is missing, the diagnostic tool avoids false negative reports and instead categorizes the environment as `⚠️ Legacy / Untracked`. It then displays actionable guidance advising developers to re-run the setup wizard to synchronize version tracking cleanly.

### 3. Resilient Declarative XML Testing
When developing unit tests for universal adapters that generate XML schema representations for AI system prompts, avoid asserting strictly closed elemental tag strings:
* **Brittle Assertion:** `assert.ok(xml.includes('<available_skills>'));` — Fails when root attributes or directory scopes are added.
* **Resilient Assertion:** `assert.ok(xml.includes('<available_skills'));` or check for element attribute substrings like `name="ami-test-skill"`.
* **Why:** Verifying unclosed element prefix strings guarantees that automated test suites remain resilient against additive attribute expansion without sacrificing schema verification fidelity.

---

## Best Practice Takeaway
Always decouple package execution versions from installed environment states using declarative version manifests. Pair explicit manifest tracking with defensive filesystem fallback heuristics to ensure legacy developer installations upgrade seamlessly without disruption or confusing diagnostic output.
