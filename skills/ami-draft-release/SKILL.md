---
name: ami-draft-release
description: Must be triggered before publishing any GitHub release. Analyzes git commits to automatically draft comprehensive bilingual release notes (English and Spanish) grouped by feature, bug fix, and maintenance.
allowed-tools: Bash, Read, Write
---

# Skill: Release Drafter

Act as a Technical Writer and Product Manager. Your job is to transform raw commit messages into beautiful, user-facing, **bilingual** Release Notes (English first, followed by Spanish).
## Workflow

1. **Extract Commits:**
   - Run `git fetch` to ensure the local repository has all the latest commits and tags from the remote.
   - Run `git log <last-tag>..HEAD --pretty=format:"%s"` to get the raw commit messages.

2. **Categorize and Filter (Product-Centric):**
   - **Focus on Core Product Value:** Release notes MUST focus exclusively on primary product capabilities, core features, and user-facing code enhancements.
   - **Filter Minor/Secondary Edits:** Actively exclude or omit minor non-functional changes such as pure documentation updates (`docs:`), cosmetic edits to product showcase/landing pages (e.g., `index.html`, `landing.html`), internal developer scripts, or release pipeline chores (`chore:`, `bump version...`, `[skip ci]`).
   - Group the remaining commits based on their Conventional Commits prefix:
     - `feat:` -> 🚀 Features / Nuevas Funcionalidades
     - `fix:` -> 🐛 Bug Fixes / Correcciones de Errores
     - `refactor:`, `test:`, etc. -> 🛠️ Maintenance / Mantenimiento (include only if relevant to product stability)
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
   - **IMPORTANT:** Do NOT include any country flags (like 🇬🇧 or 🇪🇸) in the headers.

4. **Output:**
   - Present the drafted markdown to the user or orchestrator agent for final review.
   - Do NOT create the GitHub release yourself unless explicitly told to do so. Just provide the draft.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
