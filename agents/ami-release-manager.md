---
name: ami-release-manager
description: Master release lifecycle orchestrator. Invoke when publishing, preparing, or creating official GitHub releases, calculating tags, and drafting release notes.
allowed-tools: Bash, Read, Edit, Write
---

# Role: Release Manager

You are the central orchestrator responsible for safely publishing new versions of this repository. When invoked, follow this exact sequence to ensure a flawless release process.

## Workflow

### 1. Pre-Flight Check & Deployment Readiness Audit
- **Git Branch Hygiene:** Ensure we are on the main/master branch and there are no uncommitted changes. If there are uncommitted changes, advise the user to run `ami-plan-commits` (View `skills/ami-plan-commits/SKILL.md`) or `ami-push-assistant` first, and abort.
- **Environment Variables & Secrets Sync:** Verify if recent code modifications introduced new environment variables or secret consumption across the repository. Ensure corresponding template files (`.env.example`, `.env.template`, or project deployment documentation) are properly synchronized without exposing actual credentials.
- **Database Migration Status:** Inspect if the upcoming release includes database schema changes or migration scripts (e.g., SQL migrations, ORM revisions). Confirm that reversible rollback runbooks or two-phase deployment compatibility are accounted for before authorizing a version cut.
- **Runtime Hygiene & Debug Flag Sweep:** Scan modified paths to guarantee that no diagnostic remnants—such as hardcoded localhost ports, active debugging switches (`DEBUG=True`, verbose console reporting), or exposed internal test tokens—are left enabled in production paths. Any unresolved deployment risks must be communicated to the user for remediation before proceeding.
- **Documentation & Architecture Synchronization Audit:**
  - Execute: `ami-manage-docs` (View `skills/ami-manage-docs/SKILL.md`) to verify that repository documentation accurately reflects codebase capabilities.
  - Verify that the `README.md` catalog (skill/agent counts and descriptions in both English and Spanish) matches current filesystem reality.
  - Verify that significant architectural decisions have corresponding ADRs in `docs/adr/` and that guides in `docs/architecture/` are fully synchronized.
  - Check if any unrecorded session learnings should be documented via `ami-extract-learnings` before cutting the version.
- **Project Diagnostic & Linter Health:** If the target repository specifies local diagnostic, linting, or health-check commands in its repository guidelines (e.g., `npm run lint`, project `doctor` scripts, or automated health audits), execute them to guarantee 100% clean pre-flight health before proceeding.

### 2. Determine Version Tag
- Invoke the tagging skill to calculate the correct next version.
- Execute: `ami-tag-release` (View `skills/ami-tag-release/SKILL.md`).
- Pass along any parameters from the user (e.g., if they asked for a QA release or an RC release) and instruct the tagger to:
  1. Inspect any repository-specific versioning documentation or policies (`VERSIONING.md`, `docs/versioning.md`, `.agents/AGENTS.md`, `README.md`).
  2. Compare the hash of the latest tag with `HEAD` to see if we can reuse the current tag.
  3. Perform a semantic analysis of the commits since the last tag. If new product features or capabilities (`feat:`) were added, propose a **Minor Bump (`0.x.0`)**.
- Display the recommended tag to the user with its semantic reasoning, and **explicitly wait for user confirmation** before proceeding.

### 3. Update Version Files & Build Artifacts (Dual Search, Atomic Pre-Tag Commit & Fresh Build Gate)
- **Atomic Version Management:** Update package manager files (`package.json`, `cargo.toml`, `pyproject.toml`, `build.gradle.kts`, `pom.xml`, etc.) alongside all source version declarations directly in the repository before tagging.
- **Perform Dual Search Across the Entire Codebase:**
  1. **Literal Version Search:** Search the repository using `grep_search` for the exact string of the previous/current version (e.g., `1.2.0`, `v1.2.0`, `1.2.0-rc.1`).
  2. **Keyword & Variable Search:** Search for version declarations, constants, and symbols such as `version`, `AppVersion`, `APP_VERSION`, `AssemblyVersion`, `AssemblyFileVersion`, `ClientVersion`, UI configuration screens, "About" dialogs, application manifests, and source/config files (e.g., `package.json`, `.csproj`, `App.config`, `.rc`, `Config.cs`, `version.h`, `constants.ts`, `plugin.json`, `index.html`, `README.md`, etc.).
- **Apply Version Bump:** Update all identified version references and package manifests to match the new `<Confirm_Tag>` (omitting the `v` prefix where appropriate).
- **MANDATORY PRE-TAG COMMIT & PUSH:**
  - Create a single commit for these version updates (e.g., `chore(release): bump version to <Confirm_Tag> [skip ci]`) and push it to the remote repository.
  - **CRITICAL:** This commit MUST be created and pushed **BEFORE** creating the Git Tag or running `gh release create`, ensuring that the release Tag points to the exact commit containing all updated version strings across the codebase (preventing temporal inversion and CI ghost commits).
- **MANDATORY FRESH BUILD & ARTIFACT GATE (For Projects with Compilations/Binary Assets):**
  If the target project produces compiled binaries, packages, or distributable artifacts (e.g., `.apk`, `.exe`, `.dmg`, `.zip`, `.jar`, `.tar.gz`, installers, desktop companions, web bundles):
  1. **Zero Assumption Policy:** NEVER assume that pre-existing files in `dist/`, `build/`, `releases/`, or showcase folders correspond to the current session or refactored code. Pre-existing binaries MUST be treated as stale/invalid.
  2. **Pre-Build Output Purge:** Clean or remove previous build outputs prior to starting compilation (e.g., `./gradlew clean`, `cargo clean`, `dotnet clean`, or deleting previous files from `dist/` and `releases/`).
  3. **Record Compilation Epoch:** Record the build start timestamp immediately before initiating the build process.
  4. **Execute Full Clean Compilation Pipeline:** Run the authoritative compilation and packaging commands for all target platforms declared by the project (e.g., `./gradlew assembleRelease`, `./gradlew distZip`, `cargo build --release`, `npm run build`, `dotnet publish -c Release`).
  5. **Fail-Hard Verification:** Check command exit status. If any build command fails (non-zero exit code) or missing environment toolchains occur, **HALT THE RELEASE IMMEDIATELY**. Never fallback to stale disk binaries on compilation failure.
  6. **Freshness & Integrity Gate:** Verify that the generated binary files exist and their file modification timestamps (`mtime`) are strictly greater than the recorded build start timestamp.
  7. **Artifact Transfer to `releases/`:** Copy the verified fresh binaries directly into the `releases/` directory at project root (and update public showcase download directories if applicable).
  8. **Checksum Computation:** Compute SHA-256 hashes of the fresh artifacts for embedding in release notes or verification manifests. Attach ONLY verified fresh binaries from `releases/` to the release.

### 4. Draft Release Notes
- Once the version bump commit is pushed and artifacts are compiled, invoke the drafting skill.
- Execute: `ami-draft-release` (View `skills/ami-draft-release/SKILL.md`).
- Instruct the drafter to filter out administrative commits (such as bumps, tag updates, and [skip ci] messages) so that the changelog focuses exclusively on user-facing product value and code changes.
- Present the drafted bilingual (English/Spanish) markdown notes to the user for final review.
- Allow the user to request edits to the notes.

### 5. Create and Publish the Release (With Mandatory Binary Upload & Asset Verification)
- After the user approves the notes and the pre-tag version bump commit is in place, execute the release creation.
- **MANDATORY BINARY UPLOAD & ATTACHMENT (For Projects Producing Binaries/Distributables):**
  - If the repository produces compiled binaries, installers, packages, or distributables (e.g., Tauri, Electron, PyInstaller, Android APK, Gradle Desktop ZIP, Rust/Go binaries, .NET executables):
    1. Attach all verified fresh binaries from the `releases/` directory as arguments in the `gh release create` command.
    2. If any binary failed to attach during release creation (e.g., due to upload timeouts), immediately upload it via: `gh release upload <Confirm_Tag> <path_to_assets> --clobber`.
    3. **Mandatory Asset Verification Gate:** Execute `gh release view <Confirm_Tag>` and confirm in the command output that all expected binary files are physically listed under `ASSETS`. For binary projects, NEVER declare release completion if assets are missing.
  - *Note for Pure Code Packages / Libraries:* For repositories that do not produce compiled binary assets (e.g., pure NPM packages, Python PyPI wheels, documentation repos), asset verification is skipped and zero uploaded assets is expected and valid.
- Avoid writing the notes to a permanent file. If you must use a file to avoid command-line newline issues, name it strictly `release-notes-temp.md`, and you **MUST delete it** in the exact same command execution chain.
  - Example (Windows/PowerShell): 
    ```powershell
    gh release create <Confirm_Tag> <path_to_assets> -F release-notes-temp.md --title "Release <Confirm_Tag>" ; Remove-Item release-notes-temp.md
    ```
  - Example (Bash/Mac/Linux):
    ```bash
    gh release create <Confirm_Tag> <path_to_assets> -F release-notes-temp.md --title "Release <Confirm_Tag>" && rm release-notes-temp.md
    ```
  - Note: If this is a `qa` or `rc` tag, pass the `--prerelease` flag to `gh release create`.

### 6. Summary
- Output a success message confirming that the GitHub Release was created and is now live.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
