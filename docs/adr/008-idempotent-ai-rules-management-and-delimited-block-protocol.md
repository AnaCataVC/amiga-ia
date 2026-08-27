# 8. Idempotent AI Rules Management & Delimited Block Protocol

Date: 2026-08-27

## Status

Accepted

## Context

AI coding assistants implement differing architectural models for global and project-level behavioral steering:
1. **Google Antigravity (Gemini):** Supports modular declarative rule files located in dedicated directories (`~/.gemini/config/rules/*.md` globally and `.agents/rules/*.md` locally).
2. **Anthropic Claude Code:** Utilizes a centralized instruction file (`~/.claude/CLAUDE.md` globally and `./CLAUDE.md` locally).

Distributing global behavioral rules via the setup wizard (`amiga-ia-setup`) introduced three critical requirements:
- **Shared File Integrity:** Modifying `~/.claude/CLAUDE.md` must never overwrite, clobber, or duplicate existing personal user directives.
- **Idempotency & Safe Updates:** Successive runs of the setup wizard must update managed rules in-place without appending repetitive directive blocks.
- **Context Economy & Zero-Token Opt-Out:** Users who prefer raw or unsteered assistant behavior must be able to opt out, incurring zero token consumption.

## Decision

We implemented the **Delimited HTML Comments Block Protocol** and cross-engine rules manager in `bin/setup.js`:

1. **Delimited Block Protocol:**
   - Injected markdown content is wrapped with distinct boundary identifiers:
     `<!-- AMIGA_IA_RULES_START:DO_NOT_EDIT -->` ... `<!-- AMIGA_IA_RULES_END -->`.
   - Setup uses regex replacement across normalized line breaks to update existing blocks in-place or append at EOF if absent.

2. **Atomic Temporary Writes:**
   - Markdown updates write to a hidden temporary file (`.${filename}.amiga-tmp`) before performing an atomic `fs.renameSync`, ensuring write safety.
   - An initial backup (`.amiga-backup`) is created on first modification.

3. **Surgical, Non-Destructive Uninstallation:**
   - During uninstallation, `removeMarkdownBlock()` strips only the managed block.
   - If the file contains remaining user instructions, it is saved back; if empty, it is deleted.

4. **Modular Antigravity Directory Synchronization:**
   - For Antigravity, rules are optionally copied into `~/.gemini/config/rules/` and cleaned via `cleanOrphanedFiles` / `deleteMatchingFiles`.

5. **Diagnostic Rules Verification in Doctor:**
   - Extended `runDoctor()` to verify both the `AMIGA_IA_RULES_START` tag in Claude's `CLAUDE.md` and `ami-*.md` rule files in Antigravity's rules directory as optional features.

## Consequences

- **Positive:**
  - Zero risk of clobbering personal configurations in shared configuration files.
  - Safe, idempotent re-runs across versions without duplicate prompt growth.
  - Zero token consumption for users who opt out of rules installation.
  - Clean uninstallation that preserves user customizations.
- **Negative:**
  - Requires maintaining regex boundary parsing and atomic write routines in CLI setup scripts.
