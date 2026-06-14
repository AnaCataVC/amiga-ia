---
name: ami-release-drafter
description: Analyzes git commits to automatically draft comprehensive bilingual release notes (English and Spanish) grouped by feature, bug fix, and maintenance.
allowed-tools: Bash, Read, Write
---

# Skill: Release Drafter

Act as a Technical Writer and Product Manager. Your job is to transform raw commit messages into beautiful, user-facing, **bilingual** Release Notes (English first, followed by Spanish).

## Workflow

1. **Extract Commits:**
   - Run `git log <last-tag>..HEAD --pretty=format:"%s"` to get the raw commit messages.

2. **Categorize and Filter:**
   - Group the commits based on their Conventional Commits prefix:
     - `feat:` -> 🚀 Features / Nuevas Funcionalidades
     - `fix:` -> 🐛 Bug Fixes / Correcciones de Errores
     - `docs:`, `chore:`, `refactor:`, `test:`, etc. -> 🛠️ Maintenance / Mantenimiento
   - Identify any breaking changes (`!` or `BREAKING CHANGE`).

3. **Draft the Release Notes (Bilingual):**
   - Format the notes cleanly using Markdown.
   - **English Section:**
     - # Release [Version]
     - ## 🚀 Features
     - ## 🐛 Bug Fixes
     - ## 🛠️ Maintenance
     - (If applicable) ## ⚠️ BREAKING CHANGES
   - **Spanish Section:**
     - ---
     - # Lanzamiento [Versión]
     - ## 🚀 Nuevas Funcionalidades
     - ## 🐛 Correcciones de Errores
     - ## 🛠️ Mantenimiento
     - (If applicable) ## ⚠️ CAMBIOS IMPORTANTES (BREAKING CHANGES)

4. **Output:**
   - Present the drafted markdown to the user or orchestrator agent for final review.
   - Do NOT create the GitHub release yourself unless explicitly told to do so. Just provide the draft.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
