# Architecture Specification: CLI Setup Wizard & Diagnostic Engine (`doctor`)

This document details the architecture and operational mechanics of the Amiga IA CLI Setup Wizard (`bin/setup.js` / `amiga-ia-setup`).

---

## 1. Architecture & Responsibilities

The CLI Setup Wizard is an interactive, zero-dependency Node.js tool responsible for:
1. **Target Environment Auto-Detection:** Detecting whether Claude Code (`~/.claude/`), Antigravity (`~/.gemini/config/`), or both are installed.
2. **Physical Capability Deployment:** Copying declarative skills (`skills/`), subagents (`agents/`), and rules (`rules/`) into standard local AI configuration directories.
3. **Settings Merging & Rollback Safety:** Merging hook configurations into `~/.claude/settings.json` while generating an automated rollback backup (`settings.json.amiga-backup`).
4. **Version Manifest Tracking:** Writing `.amiga-version.json` in installed directories to accurately track installed versions and prevent drift.
5. **System Diagnostic Engine (`doctor`):** Auditing installed packages, checking NPM registry for updates, verifying YAML frontmatter validity, and detecting legacy plugin conflicts.
6. **Namespace-Protected Safe Uninstallation:** Selectively removing only `ami-`-prefixed skills and agents during uninstallation without touching personal user files.

---

## 2. CLI Execution Modes

| Command | Mode | Description |
|---|---|---|
| `amiga-ia-setup` (or `node bin/setup.js`) | **Interactive Wizard** | Presents an interactive menu to install, configure hook engines, update, or uninstall Amiga IA. |
| `amiga-ia-setup doctor` (or `node bin/setup.js --doctor`) | **Diagnostic Engine** | Runs automated health checks across packages, frontmatter syntax, settings JSON, and NPM update status. |
| `amiga-ia-setup --uninstall` | **Non-Interactive Uninstallation** | Cleans up `ami-` files and restores user settings without interactive prompts. |

---

## 3. Safe Installation & Uninstallation Model

### 3.1 Physical Copy vs. Symlinks
To avoid Windows permission issues (where creating symbolic links requires elevated Administrator privileges or Windows Developer Mode), the wizard uses physical recursive copies (`copyRecursiveSync`).

### 3.2 Namespace Protection (`ami-` prefix)
To prevent accidental deletion of user-authored skills or agents during updates and uninstalls:
- Only directories in `skills/` starting with `ami-` are cleaned up or overwritten.
- Only `.md` files in `agents/` starting with `ami-` are cleaned up or overwritten.
- Custom non-prefixed skills (e.g., `skills/my-custom-skill/`) remain completely untouched.

---

## 4. Version Manifest Tracking (`.amiga-version.json`)

Whenever Amiga IA is installed or updated, the wizard writes a version manifest:

```json
{
  "version": "4.1.2",
  "installedAt": "2026-08-16T10:41:00.000Z",
  "package": "@anacatavc/amiga-ia"
}
```

This manifest allows the `doctor` command to accurately report installed versions and detect when local environments need updating after an `npm update -g @anacatavc/amiga-ia`.
