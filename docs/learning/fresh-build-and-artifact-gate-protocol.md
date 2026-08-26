# Pattern: Fresh Build and Artifact Gate Protocol for Compiled Releases

## Context & Problem

In software projects that compile or package binary artifacts (e.g., Android APKs, Desktop Companion ZIPs, Electron installers, Rust/Go binaries), automated release orchestrators or subagents can suffer from **Stale Artifact Bypass**:
1. An existing pre-compiled binary matching the target version name is found in a repository folder (e.g., `apk/`, `dist/`, or a showcase folder).
2. The orchestrator mistakenly assumes the binary is already compiled and up-to-date for the current session.
3. The build pipeline (`assembleRelease`, `distZip`, `cargo build --release`, `npm run build`) is bypassed.
4. An outdated binary is published to GitHub Releases and public download mirrors, causing temporal inversion and breaking end-user functionality.

---

## The Solution: Multi-Step Fresh Build & Artifact Gate

To prevent stale binary releases across any technology stack, the release orchestrator (`ami-release-manager`) enforces a rigorous 8-step verification gate:

### 1. Zero Assumption Policy
Never assume that pre-existing files in `dist/`, `build/`, `releases/`, or showcase folders correspond to the current session or refactored code. Pre-existing binaries MUST be treated as stale/invalid.

### 2. Pre-Build Output Purge
Purge all previous build outputs prior to starting compilation (e.g., `./gradlew clean`, `cargo clean`, `dotnet clean`, or deleting previous files from `dist/` and `releases/`).

### 3. Record Compilation Epoch
Record the build start timestamp (`build_start_time`) immediately before initiating the build process.

### 4. Execute Full Clean Compilation Pipeline
Run the authoritative compilation and packaging commands for all target platforms declared by the project (e.g., `./gradlew assembleRelease`, `./gradlew distZip`, `cargo build --release`, `npm run build`, `dotnet publish -c Release`).

### 5. Fail-Hard Verification
Check command exit status. If any build command fails (non-zero exit code) or missing environment toolchains occur, **HALT THE RELEASE IMMEDIATELY**. Never fallback to stale disk binaries on compilation failure.

### 6. Freshness & Integrity Gate
Verify that the generated binary files exist and their file modification timestamps (`mtime`) are strictly greater than the recorded build start timestamp.

### 7. Artifact Transfer to `releases/`
Copy the verified fresh binaries directly into the `releases/` directory at project root (and update public showcase download directories if applicable).

### 8. Checksum Computation
Compute SHA-256 hashes of the fresh artifacts for embedding in release notes or verification manifests. Attach ONLY verified fresh binaries from `releases/` to the release.
