# Amiga IA: Authoritative Codex Compatibility Diagnostic and Action Plan

**Repository:** [AnaCataVC/amiga-ia](https://github.com/AnaCataVC/amiga-ia)  
**Audited Baseline:** `main` at commit `fdf7cd7` (v5.0.2)  
**Scope:** Tri-Ecosystem Harmonization (OpenAI Codex, Anthropic Claude Code, Google Antigravity)  
**Status:** Authoritative Tri-Ecosystem Technical Reference  
**Supersedes:** `codex-diagnostico-plan-accion.md` (v1 draft by Codex) and `codex-diagnostico-plan-accion_v2.md` (v2 draft by Claude Code)

---

## 1. Executive Summary & Tri-Ecosystem Triangulation

Amiga IA was designed to provide declarative AI agent skills across three primary autonomous coding platforms: **Anthropic Claude Code**, **Google Antigravity**, and **OpenAI Codex**. The repository maintains canonical sources in `skills/` and `agents/`, build-time manifest generation in `scripts/build-manifests.js`, a distribution setup wizard in `bin/setup.js`, and dedicated lifecycle hooks.

However, a deep technical audit across all three platform runtimes reveals an underlying architectural mismatch: **Amiga IA currently treats Codex as a downstream file-copying target rather than a first-class compiled runtime.**

While `scripts/build-manifests.js` generates TOML agent files and copies skills to `codex/skills/`, the pipeline does not perform semantic translation or runtime validation:

1. **Foreign Tool Imperatives:** Canonical skill instructions authored with Antigravity and Claude Code tool names are copied verbatim into Codex artifacts, leaving 20 occurrences of foreign tool functions across 9 files (e.g., `invoke_subagent`, `write_to_file`, `view_file`, `grep_search`).
2. **Subagent Orchestration Void:** Skills instruct the model to execute programmatic function calls via `invoke_subagent`, a tool that does not exist in OpenAI Codex CLI. Codex handles delegation through runtime prompt routing and custom agent name discovery.
3. **Broken Skill Cross-References in Skill Bodies:** While agent profiles have their skill paths rewritten to the user installation directory placeholder (`__AMIGA_CODEX_SKILLS_DIR__`), skill bodies copied to `codex/skills/` retain unrewritten relative paths (`skills/ami-*/SKILL.md`), which fail to resolve when installed globally into `~/.agents/skills/`.
4. **Underutilized Native Codex Capabilities:** While ADR-015 accepted that Codex subagents inherit permission and sandbox modes from the parent session, the manifest generator completely omits native optional TOML controls (`sandbox_mode = "read-only"`, `model`, `model_reasoning_effort`). Read-only audit agents (`ami-repo-auditor`, `ami-pr-reviewer`, `ami-push-assistant`) have no technical write barrier on Codex.
5. **Brittle Frontmatter Parsing:** `scripts/build-manifests.js` parses YAML frontmatter using a naive single-line regular expression, risking silent corruption if agent metadata includes multi-line descriptions or YAML arrays.
6. **Empirical Hook Uncertainty:** Codex lifecycle hooks in `bin/setup.js` register matchers for `'Edit|Write'`, but the actual tool event names emitted by Codex CLI during file modifications have not been verified empirically against runtime payloads.
7. **CI Drift Vulnerability:** Generated artifacts in `codex/` are tracked in Git, but the GitHub Actions CI pipeline only executes unit tests without asserting that the generated tree is clean (`git diff --exit-code`).

### Diagnosis in One Sentence
Amiga IA distributes syntactically valid Codex files, but lacks **runtime-neutral canonical authoring** and a **true per-platform semantic compilation pipeline**, leaving generated Codex instructions dependent on foreign tools and broken file paths.

---

## 2. Tri-Ecosystem Reconciliation Matrix

This section reconciles the preliminary findings from the Codex audit (v1), the empirical corrections from Claude Code (v2), and the architectural insights from Antigravity:

| ID | Issue & Area | Codex Audit (v1) | Claude Code Verification (v2) | Antigravity Unified Synthesis |
|---|---|---|---|---|
| **C1** | **Permission & Sandbox Mapping** (H-04) | Claimed missing `allowed-tools` translation was an unnoticed regression. | Clarified that ADR-015 deliberately accepted parent inheritance. Noted missing optional TOML fields (`sandbox_mode`, `model`). | **Confirmed & Actionable:** ADR-015's inheritance model is valid, but omitting `sandbox_mode = "read-only"` leaves read-only agents without technical guardrails. Manifest generator must emit native TOML configuration per agent role. |
| **C2** | **Global Rules Distribution** (H-02, H-03) | Claimed `AGENTS.md` and heavy global rules are distributed to all Codex users. | Proved that `AGENTS.md` is excluded from npm packaging (`package.json`), and `setup.js` does not install global rules for Codex. | **Scope Clarified:** Global rules affect only contributors working inside this repository. However, it reveals an opposite gap: Codex users receive zero behavioral rules, whereas Claude and Antigravity receive managed rule files. |
| **C3** | **Skill Path Rewriting** (H-05) | Stated that the generator translates paths incompletely. | Differentiated agents from skills: agent profiles are validated and rewritten to placeholders; skill bodies are copied verbatim. | **Root Cause Isolated:** `scripts/build-manifests.js` runs `resolveCodexSkillReferences` exclusively on agent files. Skill-to-skill references in `skills/ami-*/SKILL.md` remain broken in Codex. |
| **C4** | **Capability Translator Invocation** (H-06) | Implied `translateTools` in `capability_translator.js` was actively breaking Codex builds. | Showed `translateTools` is never called on the Codex build path. Defaulting to Antigravity is a latent bug, not an active regression. | **Latent Trap Identified:** If `capability_translator.js` is naively hooked into the Codex path without a dedicated target, its silent fallback will inject Antigravity tool names into Codex artifacts. |
| **C5** | **Tool Name Dependencies** (H-01) | Treated all tool mentions as hard execution blockers. | Separated illustrative mentions from hard imperatives. Quantified 20 occurrences across 9 files in `codex/`. | **Architectural Solution:** The root cause is that canonical sources in `skills/` were authored with runtime bias. Canonical sources must be refactored to runtime-neutral capability language. |
| **C6** | **Artifact Drift in CI** (H-08) | Hypothesized that generated files could diverge from source. | Verified that current committed files match generation, but CI has no drift guard. | **CI Gap Confirmed:** CI runs `npm test` but does not run `npm run build` with `git diff --exit-code`. Drift is unguarded. |
| **C7** | **Lifecycle Hooks Reliability** (H-10) | Assumed setup, merge, and rollback were unhandled. | Showed atomic temp writes, backup creation, and doctor checks exist. Noted runtime matcher `'Edit\|Write'` is unverified. | **Empirical Validation Required:** Node.js hook logic is tested, but Codex CLI internal tool names emitted during file edits must be verified with real payloads. |
| **C8** | **Documentation Currency** (Ref) | Cited legacy OpenAI developer URLs. | Identified that Codex subagent docs redirect (308) to `learn.chatgpt.com`. | **Documentation Updated:** Verified and pinned active OpenAI Codex documentation endpoints. |
| **C9** | **Documentation Language** (Repo Policy) | v1 was drafted in Spanish. | v2 translated to English per repository rule 3. | **Standard Enforced:** Technical documentation in `docs/` is maintained in English. User communication remains in Spanish. |

---

## 3. Current Architecture & Distribution Pipeline

Amiga IA follows an automated distribution pipeline designed to maintain a Single Source of Truth:

```
[Canonical Sources]
├── skills/*/SKILL.md (Markdown + YAML Frontmatter)
├── agents/*.md (Markdown + YAML Frontmatter)
├── rules/*.md (Behavioral Rules)
└── hooks/scripts/*.js (Cross-Platform Node.js Hooks)
         │
         ├── [npm run build: scripts/build-manifests.js]
         │    ├── Syncs hooks.json -> hooks/hooks.json
         │    ├── Copies skills/ -> codex/skills/ (Verbatim copy)
         │    └── Compiles agents/*.md -> codex/agents/*.toml (Name, Description, Instructions)
         │
         └── [npm install -g @anacatavc/amiga-ia -> bin/setup.js]
              ├── Claude Code:
              │    ├── ~/.claude/skills/ (Frontmatter translated to Claude vocabulary)
              │    ├── ~/.claude/agents/ (Frontmatter translated to Claude vocabulary)
              │    ├── ~/.claude/CLAUDE.md (Behavioral rules block merged)
              │    └── ~/.claude/settings.json (Hooks merged)
              ├── Google Antigravity:
              │    ├── ~/.gemini/config/skills/ (Frontmatter translated to Antigravity vocabulary)
              │    ├── ~/.gemini/config/agents/ (Frontmatter translated to Antigravity vocabulary)
              │    ├── ~/.gemini/config/rules/ (Declarative rules copied)
              │    └── ~/.gemini/config/hooks.json (Hooks merged)
              └── OpenAI Codex:
                   ├── ~/.agents/skills/ (Copied from codex/skills/ with ZERO translation)
                   ├── ~/.codex/agents/*.toml (Placeholder replaced with absolute skills path)
                   ├── ~/.codex/hooks.json (Advisory hooks merged)
                   └── Global Rules: NONE INSTALLED
```

### Pipeline Failure Modes
1. **The Copy Blindspot:** `syncAmigaDirectory` copies `skills/` to `codex/skills/` using raw filesystem copy (`fs.cpSync`). Neither frontmatter nor markdown bodies receive transformation.
2. **The YAML Regex Blindspot:** `scripts/build-manifests.js` parses frontmatter using `line.match(/^([\w-]+):\s*(.*)$/)`. Complex YAML structures (arrays, multiline scalars, nested keys) are silently dropped or mangled.
3. **The Target Blindspot:** `adapters/capability_translator.js` defines:
   ```javascript
   const targetPlatform = platform === 'claude' ? 'claude' : 'antigravity';
   ```
   Passing `'codex'` routes directly to Antigravity.

---

## 4. Exhaustive Defect & Risk Catalog

### H-01: Foreign Tool Imperatives Leaked into Canonical & Codex Skills
- **Severity:** Critical (Blocks reliable flow execution in Codex)
- **Status:** Verified Defect on disk.
- **Evidence:** 20 occurrences across 9 files in `codex/`:
  - `codex/skills/ami-plan-feature/SKILL.md`:
    - Line 4: `allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, search_web, read_url_content, invoke_subagent, ask_question`
    - Line 18: `Formulate targeted, concise questions using ask_question...`
    - Line 30: `ALWAYS persist findings to docs/external-references/<topic-slug>.md using write_to_file.`
    - Line 34: `Review relevant ADRs in docs/adr/ and architecture guides using view_file.`
    - Line 35: `Investigate touchpoints, models, and interfaces using grep_search, find_by_name, and view_file.`
    - Line 61: `delegate them to specialized subagents using invoke_subagent.`
  - `codex/skills/ami-architect-project/SKILL.md` (Line 27): `using write_to_file.`
  - `codex/skills/ami-orchestrate-cleanroom/SKILL.md` (Line 4 & 21): `allowed-tools` contains `invoke_subagent`, `ask_question`.
  - `codex/agents/*.toml`: Instructions in `ami-tech-lead.toml`, `ami-expert-council.toml`, `ami-release-manager.toml`, and `ami-pr-reviewer.toml` reference Antigravity functions.
- **Root Cause:** Canonical files in `skills/` and `agents/` were written with Antigravity tool names, and the build pipeline performs no sanitization or adaptation.
- **Impact:** Codex CLI does not register tools named `write_to_file`, `view_file`, or `invoke_subagent`. The model may attempt non-existent tool calls, hallucinatory fallbacks, or abort the workflow.
- **Remediation:** Refactor canonical skill prose into runtime-neutral capability expressions ("Persist findings to `docs/...`", "Inspect codebase touchpoints using file search tools", "Interview user for clarification").

---

### H-02: Subagent Delegation Model Discrepancy (`invoke_subagent`)
- **Severity:** Critical (Orchestrator skills fail to spawn subagents)
- **Status:** Architectural Mismatch.
- **Evidence:** `ami-plan-feature`, `ami-tech-lead`, and `ami-expert-council` mandate calling `invoke_subagent`.
- **Root Cause:** Claude Code summons subagents via the `Agent` tool or conversational prompt routing. Antigravity summons subagents via the programmatic `invoke_subagent` tool function. OpenAI Codex summons custom subagents through its multi-agent runtime when addressed by their configured `name` (discovered from `~/.codex/agents/*.toml`), without any programmatic tool call.
- **Impact:** Models running in Codex stall attempting to invoke a non-existent `invoke_subagent` tool or skip delegation entirely.
- **Remediation:** Define an abstract delegation contract. In Codex artifacts, express delegation as explicit natural language delegation requests addressing the subagent by `name` (e.g., "Spawn the `ami-tech-lead` subagent with the following objective..."). Always provide a direct-execution fallback for environments where multi-agent spawning is unavailable.

---

### H-03: Scope Ambiguity in Behavioral Rules & Platform Asymmetry
- **Severity:** Medium (Contributor friction vs. consumer rules vacuum)
- **Status:** Architectural Asymmetry.
- **Evidence:**
  - `AGENTS.md` contains strict rules (Rule 13 mandates `invoke_subagent`; Rule 15 mandates repo doctor; Rule 16 enforces architectural layering).
  - `package.json` excludes `AGENTS.md` and `rules/` from being distributed to Codex users.
  - `bin/setup.js` installs behavioral rules into `~/.claude/CLAUDE.md` and `~/.gemini/config/rules/`, but leaves Codex with zero global rules.
- **Root Cause:** Historical evolution: `AGENTS.md` was intended as repo-local contributor rules, but Claude and Antigravity also received user-level rules. Codex was left without a rules integration path.
- **Impact:** Contributors using Codex in this repository inherit Antigravity-specific rules from `AGENTS.md`. Conversely, end users installing Amiga IA on Codex get no behavioral rules or safety guardrails.
- **Remediation:**
  1. Audit `AGENTS.md` to ensure local repository rules do not mandate tools unavailable in Codex.
  2. Decide whether to distribute an Amiga IA behavioral rules block for Codex (e.g., via documentation or setup instructions).

---

### H-04: Agent TOML Configuration Gaps & Unused Native Controls
- **Severity:** Medium (Missing security boundaries and model tuning)
- **Status:** Verified Defect / Feature Gap.
- **Evidence:** `scripts/build-manifests.js` generates TOML containing only `name`, `description`, and `developer_instructions`:
  ```javascript
  const toml = `name = ${JSON.stringify(metadata.name)}\ndescription = ${JSON.stringify(metadata.description)}\ndeveloper_instructions = ${JSON.stringify(instructions)}\n`;
  ```
- **Root Cause:** The generator assumes Codex subagents only need instructions. It ignores supported TOML configuration keys:
  - `sandbox_mode = "read-only"`
  - `model`
  - `model_reasoning_effort = "high" | "medium" | "low"`
- **Impact:** Read-only audit agents (`ami-repo-auditor`, `ami-pr-reviewer`, `ami-push-assistant`, `ami-expert-council`) have no technical write restriction in Codex. If prompted or misled, they can perform write operations that are strictly prohibited in Claude Code and Antigravity.
- **Remediation:**
  - Add explicit role metadata in `agents/*.md` (e.g., `read-only: true`, `reasoning-effort: high`).
  - Update `build-manifests.js` to emit `sandbox_mode = "read-only"` for read-only agents and configure reasoning effort where appropriate.

---

### H-05: Skill Body Path References Remain Unresolved
- **Severity:** High (Broken skill cross-references after installation)
- **Status:** Verified Defect.
- **Evidence:**
  - `skills/ami-plan-feature/SKILL.md` references `skills/ami-architect-project/SKILL.md`.
  - `skills/ami-guide-next-step/SKILL.md` references multiple skills by relative paths.
  - `build-manifests.js` resolves `skills/ami-*/SKILL.md` to `__AMIGA_CODEX_SKILLS_DIR__` **only** inside agent instructions, but does not process skill files.
- **Root Cause:** `syncAmigaDirectory` copies `skills/` to `codex/skills/` without running reference replacement.
- **Impact:** When a user executes `ami-plan-feature` in an external project, references to `skills/ami-architect-project/SKILL.md` fail because skills are located in `~/.agents/skills/ami-*/SKILL.md`.
- **Remediation:** Extend placeholder replacement to skill markdown bodies or normalize cross-skill references to symbolic skill names (e.g., "activate the `ami-architect-project` skill") rather than relative filesystem paths.

---

### H-06: Latent Target Void in `capability_translator.js`
- **Severity:** Low today, Critical upon integration.
- **Status:** Latent Code Defect.
- **Evidence:** `adapters/capability_translator.js` line 143:
  ```javascript
  const targetPlatform = platform === 'claude' ? 'claude' : 'antigravity';
  ```
- **Root Cause:** The module was authored before Codex support was introduced and hardcodes a binary fallback.
- **Impact:** Calling `translateTools(tools, 'codex')` silently produces Antigravity tools (`write_to_file`, `replace_file_content`, `run_command`).
- **Remediation:** Add `'codex'` as an explicit platform target. If tool lists are passed for Codex, strip platform-specific identifiers, map abstract capabilities, or return native equivalents. Throw an error for unsupported platform targets instead of falling back silently.

---

### H-07: Test Suite Verifies Static Existence Rather than Behavioral Execution
- **Severity:** High (False confidence in broken artifacts)
- **Status:** Verified Testing Gap.
- **Evidence:** `tests/manifests.test.js` only asserts:
  - `assert.strictEqual(codexAgents.length, 11)`
  - `assert.strictEqual(codexSkills.length, 25)`
  - `assert.ok(content.includes('name = "ami-'))`
- **Root Cause:** Tests check file counts and field presence, not content hygiene or executability.
- **Impact:** All 57 tests pass while 20 occurrences of foreign tool names remain in `codex/`.
- **Remediation:**
  - Add static linting assertions: reject foreign tool names (`invoke_subagent`, `write_to_file`, etc.) in `codex/` artifacts.
  - Validate that all TOML files parse with a standards-compliant TOML parser.
  - Implement behavioral reference tasks on a pinned Codex environment.

---

### H-08: Unguarded Artifact Drift Between Sources and `codex/` in CI
- **Severity:** Medium (Silent desynchronization on pull requests)
- **Status:** Verified CI Gap.
- **Evidence:** `.github/workflows/ci.yml` runs only `npm test`. It does not execute `npm run build` or verify Git tree cleanliness.
- **Root Cause:** No post-build diff check in CI.
- **Impact:** A contributor can modify `skills/` or `agents/` and commit without running `npm run build`. The PR passes CI, but published Codex artifacts become stale.
- **Remediation:** Add a build step and `git diff --exit-code` check to `.github/workflows/ci.yml`.

---

### H-09: Distribution Scope & Packaging Contract Clarity
- **Severity:** Low (Architectural hygiene)
- **Status:** Documented Design Decision.
- **Evidence:** `package.json` distributes `codex/`, `skills/`, `agents/`, `rules/`, `hooks/`, but excludes `AGENTS.md` and `docs/`.
- **Root Cause:** Intentional packaging design, but undocumented in developer guides.
- **Impact:** Confusion among contributors regarding whether rules in `AGENTS.md` are global or repository-local.
- **Remediation:** Formally document in `AGENTS.md` and `docs/architecture/` that `AGENTS.md` is strictly repository-local.

---

### H-10: Hook Event Matcher Empirical Validity & Runtime Integration
- **Severity:** Medium (Hooks may silently fail to trigger in Codex)
- **Status:** Empirical Uncertainty.
- **Evidence:** In `bin/setup.js`:
  ```javascript
  PreToolUse: [{ matcher: '^Bash$', hooks: [...] }],
  PostToolUse: [{ matcher: 'Edit|Write', hooks: [...] }]
  ```
- **Root Cause:** Codex CLI lifecycle hooks use the `hookSpecificOutput` envelope over stdio, but the tool event names emitted when Codex edits files (e.g., in sandbox environments) have not been captured and verified.
- **Impact:** If Codex CLI emits `apply_patch`, `patch`, or `write_file` instead of `Edit|Write`, the PostToolUse advisory hook never executes.
- **Remediation:** Execute empirical tests against a live Codex session with a diagnostic hook that logs all incoming event payloads to a temporary file. Adjust regex matchers to reflect verified runtime tool names.

---

## 5. Target Architecture: Semantic Compilation Pipeline

Rather than maintaining duplicate, handwritten versions across three ecosystems, Amiga IA will implement a **Semantic Compilation Pipeline** anchored by neutral canonical sources:

```
+-------------------------------------------------------------+
|               Canonical Source Files (SSOT)                 |
|  - skills/*/SKILL.md (Abstract Capability Prose)            |
|  - agents/*.md (Role Contracts + Standard Frontmatter)       |
+-------------------------------------------------------------+
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   [Claude Adapter]   [Antigravity Adapter] [Codex Compiler]
            │                  │                  │
    Injects Claude      Injects Antigravity   - Strips foreign tools
    tool allowlists     tool functions        - Resolves skill placeholders
    (Read, Edit, ...)   (view_file, ...)      - Emits native TOML settings
                                                (sandbox_mode = "read-only")
                                              - Compiles delegation prose
                                              - Validates clean output
            │                  │                  │
            ▼                  ▼                  ▼
      ~/.claude/         ~/.gemini/config/     ~/.agents/skills/
                                               ~/.codex/agents/*.toml
```

### Architectural Principles

1. **Neutral Canonical Phrasing:** Canonical skill and agent markdown MUST NOT mention runtime-specific tool functions (`write_to_file`, `replace_file_content`, `view_file`, `invoke_subagent`). Instructions must use runtime-neutral capability language:
   - *Instead of:* "Persist findings using `write_to_file`"
   - *Use:* "Persist findings to `docs/external-references/<topic-slug>.md`"
   - *Instead of:* "Delegate to `ami-tech-lead` using `invoke_subagent`"
   - *Use:* "Delegate feature planning to the `ami-tech-lead` subagent"
2. **Intermediate Capability Abstraction (ICA):** Frontmatter declarations in `agents/*.md` use abstract capability tokens (`Read`, `Write`, `Edit`, `Bash`, `Search`, `Fetch`, `Agent`). The platform adapters translate these tokens into runtime-specific permission sets upon installation.
3. **Robust Frontmatter Parsing:** Replace line-based regular expressions in `scripts/build-manifests.js` with a reliable YAML parser that handles multiline descriptions, comments, and array structures cleanly.
4. **Native Codex TOML Generation:**
   - Map `read-only` agent roles to `sandbox_mode = "read-only"`.
   - Map high-complexity reasoning agents to `model_reasoning_effort = "high"`.
   - Embed source hash and compiler version in TOML comments for traceability.
5. **Cross-Skill Reference Resolution:** Rewrite relative skill paths (`skills/ami-*/SKILL.md`) in both agent instructions and skill markdown bodies to portable paths or symbolic skill identifiers.

---

## 6. Phased Action Plan

### Stage 0: Pinned Baseline & Environment Freeze
1. Record audited commit baseline (`fdf7cd7` on `main`).
2. Pin Node.js version (`>= 22.0.0`) and verify all 57 existing tests pass.
3. Establish a baseline snapshot of generated `codex/` directory.
4. Pin the reference OpenAI Codex CLI version used for empirical validation.

### Stage 1: Tool & Reference Inventory
1. Scan all files in `skills/`, `agents/`, `rules/`, and `codex/` for platform-specific tool identifiers.
2. Generate an audit report categorizing every tool occurrence:
   - *Category A (Hard Imperative):* Imperative tool calls in instructions that block execution if missing.
   - *Category B (Illustrative Alternative):* Mentions provided as examples alongside native alternatives.
   - *Category C (Metadata Field):* Tool names inside frontmatter `allowed-tools`.
3. Track all skill-to-skill relative filesystem paths.

### Stage 2: Neutralize Canonical Source Prose
1. Refactor `skills/ami-plan-feature/SKILL.md`:
   - Replace `write_to_file` with capability prose.
   - Replace `view_file`, `grep_search`, `find_by_name` with standard codebase inspection instructions.
   - Replace `invoke_subagent` with abstract delegation instructions.
2. Refactor `skills/ami-architect-project/SKILL.md` and `skills/ami-orchestrate-cleanroom/SKILL.md`.
3. Refactor agent profiles in `agents/*.md` (`ami-tech-lead`, `ami-expert-council`, `ami-pr-reviewer`, `ami-release-manager`).

### Stage 3: Upgrade Build Engine (`build-manifests.js`)
1. Integrate robust YAML frontmatter parsing.
2. Extend `resolveCodexSkillReferences` to process both agent profiles and skill markdown bodies.
3. Update TOML compilation to emit native configuration:
   - Emit `sandbox_mode = "read-only"` for audit/review agents.
   - Emit `model_reasoning_effort` where appropriate.
4. Update `adapters/capability_translator.js` to explicitly handle `'codex'` and throw on unknown platform targets.

### Stage 4: Vertical Slice Pilot (`ami-plan-feature` & `ami-tech-lead`)
1. Recompile `ami-plan-feature` and `ami-tech-lead.toml`.
2. Inspect generated Codex files to ensure zero foreign tool identifiers remain.
3. Validate in a live Codex CLI session:
   - Test A: Planning a complex feature requiring delegation to `ami-tech-lead`.
   - Test B: Executing a small task directly without triggering unnecessary subagents.
4. Verify that file writing and codebase mapping execute cleanly without errors.

### Stage 5: Static, Integration & Empirical Validation
1. **Static Validation:**
   - Implement `tests/codex_hygiene.test.js`: Assert that zero forbidden tool names (`invoke_subagent`, `write_to_file`, `replace_file_content`, `view_file`, etc.) exist in `codex/`.
   - Assert all generated `.toml` files parse with standard TOML parsing libraries.
2. **Integration Validation:**
   - Execute clean install via `node bin/setup.js` for Codex.
   - Verify file permissions, paths, and hook registrations in `~/.agents/` and `~/.codex/`.
3. **Empirical Hook Validation:**
   - Execute file edits in a live Codex session with a diagnostic hook.
   - Verify incoming tool event names and adjust `PostToolUse` matchers in `bin/setup.js`.

### Stage 6: CI Hardening & Drift Prevention
1. Update `.github/workflows/ci.yml`:
   - Add `npm run build`.
   - Add `git diff --exit-code` check to fail builds if generated files drift from sources.
   - Run `npm test` including new hygiene tests.

### Stage 7: Documentation & Release
1. Update `docs/architecture/` and ADR-015 to document the semantic compilation pipeline and TOML configuration strategy.
2. Synchronize bilingual `README.md` and `README.es.md` if any user-facing installation parameters change.
3. Run `bin/setup.js --doctor` to verify diagnostic passes with zero warnings.

---

## 8. Prioritized Execution Matrix

| ID | Action Item | Priority | Dependencies | Success Criterion |
|---|---|---|---|---|
| **A1** | **Inventory Tool Mentions** | **P0** | None | Full catalog of tool references across canonical sources |
| **A2** | **Refactor Canonical Prose to Neutral Language** | **P0** | A1 | Zero foreign tool names in `skills/` instructions |
| **A3** | **Abstract Subagent Delegation Instructions** | **P0** | A1 | Delegation expressed via named subagent routing and direct fallback |
| **A4** | **Upgrade `build-manifests.js` & YAML Parsing** | **P0** | A2, A3 | Robust YAML parsing; skill paths resolved in skill bodies |
| **A5** | **CI Drift Guard (`git diff --exit-code`)** | **P1** | None | CI fails if `codex/` diverges from source generation |
| **A6** | **Static Hygiene Test Suite** | **P1** | A4 | Automated test asserts zero foreign tools in `codex/` |
| **A7** | **Emit Native Codex TOML Settings** | **P1** | A4 | `sandbox_mode = "read-only"` emitted for read-only agents |
| **A8** | **Explicit Codex Handling in `capability_translator`** | **P1** | A4 | No silent fallback to Antigravity; invalid platforms throw |
| **A9** | **Empirical Codex Hook Matcher Verification** | **P2** | None | Actual Codex CLI tool event names captured and matched |
| **A10** | **Setup Wizard & Doctor Enhancements** | **P2** | A7, A9 | Doctor verifies Codex TOML validity and hook configuration |
| **A11** | **Architecture Documentation Sync** | **P2** | All | ADR-015 and architecture guides reflect compiled pipeline |

*Priority Levels:*  
- **P0:** Critical blocker; directly causes broken workflows or missing capabilities in Codex.  
- **P1:** Quality, consistency, and automated prevention of regressions.  
- **P2:** Operational polish, empirical hook tuning, and documentation.

---

## 9. Authoritative Definition of Done (DoD)

The Codex compatibility integration is complete when all of the following conditions are satisfied:

- [ ] Canonical skill bodies (`skills/*/SKILL.md`) are completely free of platform-specific tool identifiers (`write_to_file`, `replace_file_content`, `view_file`, `invoke_subagent`).
- [ ] Generated Codex artifacts (`codex/skills/` and `codex/agents/*.toml`) contain zero occurrences of foreign tool functions.
- [ ] Subagent delegation is specified using named subagent runtime routing with a clear direct-execution fallback.
- [ ] Relative cross-skill references (`skills/ami-*/SKILL.md`) in skill bodies are fully resolved to portable paths or symbolic identifiers.
- [ ] `scripts/build-manifests.js` uses a robust YAML frontmatter parser and emits native TOML settings (`sandbox_mode = "read-only"`) for appropriate agent profiles.
- [ ] `adapters/capability_translator.js` explicitly defines the `'codex'` target and throws an error on unknown platforms.
- [ ] Automated tests in `tests/` verify:
  - Zero foreign tool names in `codex/`.
  - Valid syntax for all generated TOML files.
  - Full content equality between build output and committed files.
- [ ] GitHub Actions CI runs `npm run build` followed by `git diff --exit-code` and passes on all supported platforms.
- [ ] Codex lifecycle hooks in `bin/setup.js` use event matchers verified against real Codex CLI event payloads.
- [ ] `amiga-ia-setup --doctor` validates Codex agent and skill installations without warnings or errors.

---

## 10. Implementation Guidelines: Do's and Don'ts

### What to Do
- **Do:** Express instructions in terms of user intent and system outcomes ("Persist the plan to disk", "Search the codebase for models").
- **Do:** Run `node scripts/build-manifests.js` after every modification to canonical sources and verify changes with `git diff`.
- **Do:** Use standard YAML parsing libraries to parse frontmatter safely.
- **Do:** Test both complex multi-agent workflows and trivial single-step tasks to ensure procedures do not overcomplicate simple work.
- **Do:** Keep technical documentation in English while interacting with users in Spanish.

### What NOT to Do
- **Do NOT:** Perform blind string replacement of `invoke_subagent` without adapting the procedural delegation semantics.
- **Do NOT:** Hand-edit files in `codex/skills/` or `codex/agents/` — they are compiled artifacts owned by the build pipeline.
- **Do NOT:** Assume TOML is valid simply because a regex created it — validate against standard TOML parsers.
- **Do NOT:** Silently fall back to another platform's configuration when encountering an unmapped capability.
- **Do NOT:** Ship country flags in documentation or user interfaces (Zero Flags Rule).
- **Do NOT:** Leak absolute local user paths (`C:\Users\...`) into code, documentation, or commit messages.

---

## 11. Repository References

- **Package Entrypoint & Manifest:** `package.json`
- **Contributor Instructions:** `AGENTS.md`
- **Manifest Compiler:** `scripts/build-manifests.js`
- **Setup & Installation Wizard:** `bin/setup.js`
- **Capability Translator:** `adapters/capability_translator.js`
- **Architectural Decision Records:** `docs/adr/015-openai-codex-native-integration.md`
- **Capabilities Matrix:** `docs/external-references/agent-tool-capabilities-matrix.md`
- **Manifest Tests:** `tests/manifests.test.js`
- **Hook Unit Tests:** `tests/hooks_universal.test.js`

---

## 12. External Specifications & Live Verification Invariants

The following official documentation endpoints must be verified periodically to maintain alignment with evolving platform standards:

- **OpenAI Codex Subagents:** [learn.chatgpt.com/docs/agent-configuration/subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) *(Custom agent TOML structure, runtime configuration inheritance, sandbox modes)*
- **OpenAI Codex Skills:** [developers.openai.com/codex/skills/](https://developers.openai.com/codex/skills/) *(Agent Skills format and discovery mechanisms)*
- **OpenAI Codex Hooks:** [developers.openai.com/codex/hooks/](https://developers.openai.com/codex/hooks/) *(PreToolUse and PostToolUse event schemas and envelopes)*
- **Anthropic Claude Code:** [docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code) *(Agent frontmatter and permissions)*
- **Google Antigravity:** Internal specifications and [antigravity.google](https://antigravity.google) *(Customizations and tool calling conventions)*
