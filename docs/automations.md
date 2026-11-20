# Repository Automations Inventory

This document catalogs the automated pipelines, build scripts, git hooks, and lifecycle guardrails in `amiga-ia`.

## 1. Existing Automations Inventory

| Component / Path | Category | Status | Notes |
|---|---|---|---|
| `.github/workflows/ci.yml` | CI/CD | Healthy | Matrix (`ubuntu-latest`, `windows-latest`), Node `22.x` with npm cache, runs `npm run build`, drift check (`git diff --exit-code codex/ hooks/hooks.json`), `npm run check:docs`, `node bin/setup.js --doctor`, and `npm test`. |
| `.github/workflows/release.yml` | CI/CD | Healthy | Triggers on `release: [published]`, publishes `@anacatavc/amiga-ia` to NPM with OIDC provenance (`npm publish --provenance --access public`). |
| `package.json` | Build/Dev | Healthy | Defines `build`, `check:docs`, `prepack`, `test`, `benchmark*`, `prepublishOnly`, and `release`. |
| `scripts/build-manifests.js` | Build/Dev | Healthy | Syncs `hooks.json` to `hooks/hooks.json` and compiles `codex/` skills and `.toml` agents from canonical `skills/` and `agents/`. |
| `scripts/check-catalog-sync.js` | Build/Dev | Healthy | Validates exact skill and agent names and counts across `docs/catalog.md`, `docs/catalog.es.md`, `README.md`, `README.es.md`, and `registry/packs.json`. |
| `scripts/release.js` | Build/Dev | Healthy | Enforces `evaluateReleaseNecessity`, SemVer validation, GitHub account verification (`AnaCataVC`), and release tagging. |
| `.githooks/pre-push` | Git Hook | Healthy | Runs `npm run build`, `npm run check:docs`, and `npm test` prior to pushing. |
| `hooks.json` / `hooks-pwsh.json` | Domain/Job | Healthy | Cross-platform `PreToolUse` and `PostToolUse` lifecycle hooks backed by `hooks/scripts/`. |

## 2. Enabling Local Git Hooks

To activate the repository-managed `pre-push` hook locally:

```bash
git config core.hooksPath .githooks
```

On Unix/macOS, ensure executable permissions if needed:

```bash
chmod +x .githooks/pre-push
```
