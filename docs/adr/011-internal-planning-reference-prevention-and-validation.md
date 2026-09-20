# 11. Internal Planning Reference Prevention and Validation

Date: 2026-09-20

## Status

Accepted

## Context

During iterative development, feature orchestration, and AI-assisted implementation sessions, developers and Large Language Models frequently structure work around intermediate scaffolding: "Phase 1: Setup", "Stage 2: Core Logic", "Etapa 3: Pruebas", "Option A vs Option B", "Step 2 of plan".

When these temporal labels leak into permanent artifacts (commit messages, module/class docstrings, and inline code comments), they introduce technical and organizational friction:

1. **Context Decay & Meaningless Semantics:** A docstring or comment stating `// Implemented in Phase 2` or `# Option B was selected` becomes incomprehensible once the project moves forward, as the conversational scratchpad or planning dialogue is not part of the repository.
2. **Polluted Git History:** Conventional Commits require clear architectural or functional intent (`feat(auth): implement token rotation`), whereas planning markers (`feat: implement Phase 2 auth`) obscure what actually changed.
3. **Conversational Scaffolding Residue:** Docstrings and code comments should describe invariant behaviors, contracts, inputs, and side effects—not the task checklist sequence of how the developer wrote them.

Furthermore, an adversarial stress-test (`/ami-stress-test-idea`) demonstrated that enforcing this validation via low-level runtime hooks (`PreToolUse`/`PostToolUse`) introduces severe operational risks: tool execution halts from deserialization errors, latency from repeated `git diff` process spawning on micro-edits, false alarms on domain terms, and multi-shell maintenance fragility.

## Decision

We establish an architectural invariant prohibiting ephemeral internal planning references across three core repository vectors:
1. **Commit Messages:** Subject lines, commit bodies, and trailers.
2. **Docstrings:** Module, class, function, and interface docstrings.
3. **Code Comments:** Single-line (`//`, `#`, `--`) and multi-line (`/* ... */`, `<!-- ... -->`, `"""`, `'''`) comments.

Internal planning details do not need to be exposed in the repository, only not referenced in permanent codebase artifacts.

### 1. Target Detection Semantics

Enforcement targets internal milestone sequencing and design option decisions in both English and Spanish:
- **Phases / Fases:** `Phase 1`, `Phase 2`, `Fase 1`, `Fase 2`, `Phase-1`, `Fase 3`
- **Stages / Etapas:** `Stage 1`, `Stage 2`, `Etapa 1`, `Etapa 2`, `Stage-A`
- **Options / Opciones:** `Option A`, `Option B`, `Opción A`, `Opción B`, `Option 1`
- **Scaffolding Steps:** `Step 1 of plan`, `Paso 2 del plan`, `Step 3: migration`

### 2. Multi-Tier Enforcement Architecture (Without Runtime Hook Fragility)

Rather than risking runtime hook fragility, enforcement is structured across natural workflow boundaries:

1. **Tier 1: Declarative AI Directives (Generation Time):**
   - Enforced in `AGENTS.md` (Rule 22) and `rules/ami-rules.md` (Sections 1 and 4).
   - The AI assistant is instructed at system prompt level to formulate commit messages, docstrings, and code comments strictly from a permanent domain perspective, never leaking conversational task checklists or phase labels.

2. **Tier 2: Commit Planning Gate (`ami-plan-commits`):**
   - The commit strategist skill actively verifies that all drafted conventional commit messages describe standalone technical intent and contain zero internal planning references before proposing them to the user.

3. **Tier 3: Quality Review Gate (`ami-audit-quality`):**
   - The code reviewer skill actively audits modified comments and docstrings, rejecting any line referencing internal planning phases or options and requiring rewording to focus on technical rationale.

4. **Tier 4: Pre-Push Gate (`ami-push-assistant`):**
   - The pre-push orchestrator audits unpushed commits (`git log @{u}..HEAD`) and working tree diffs. If any planning reference is detected, it mandates amending commits or cleaning comments before authorizing `git push`.

5. **Tier 5: Contributor Documentation (`docs/contributing.md`):**
   - Explicit negative and positive examples for commit messages and comments, along with a dedicated verification item in the Pull Request Checklist.

## Consequences

- **Positive:** Guarantees clean, timeless codebases; eliminates ephemeral project management clutter; ensures Git history reflects pure semantic domain changes; avoids all runtime hook execution risks and process latency.
- **Negative:** Requires contributors and reviewers to remain mindful of phrasing comments in terms of domain behavior rather than development sequence.
