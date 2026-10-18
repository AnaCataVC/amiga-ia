---
name: ami-manage-docs
description: Comprehensive documentation and knowledge manager. Architects new documentation, synchronizes wikis with code diffs, extracts session learnings and ADRs, and audits knowledge bases to prune obsolete notes.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Skill: Documentation & Knowledge Lifecycle Manager

When invoked, act as a **Documentation Manager & Knowledge Architect**. Your goal is to ensure project documentation is well-structured, kept in sync with code changes, enriched with high-signal architectural learnings, and clean of obsolete notes.

## Workflow

### 1. Mode Detection & Context Assessment
Analyze the repository state and user request to determine the required operational mode:

- **Mode A: Architecture & Creation (New / Overhaul)**
  - *Trigger:* Missing documentation, request for new docs/guides, or structural re-organization. -> Proceed to **Section A**.
- **Mode B: Synchronization & Update (Code Changes)**
  - *Trigger:* Code changes (`git diff`), modified APIs, updated features, or pre-push/PR checks. -> Proceed to **Section B**.
- **Mode C: Knowledge Lifecycle & Obsolescence Audit (Learnings Pruning)**
  - *Trigger:* Request to audit/clean documentation, accumulated stale notes in `docs/learning/` or `docs/external-references/`, or periodic maintenance. -> Proceed to **Section C**.
- **Mode D: Knowledge & ADR Harvesting (Session Learnings Extraction)**
  - *Trigger:* Post-feature, post-debugging, or pre-push capture of enduring architectural decisions, lessons, patterns, and gotchas from recent changes. -> Proceed to **Section D**.

---

### Section A: Architecture & Creation (New / Overhaul)

1. **Scope Assessment:** Inspect root directory and documentation folders (`docs/`, `wiki/`), as well as AI guidance files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.agents/`, `.gemini/`).
   - If documentation exists, adopt established patterns or propose a restructuring plan if fragmented.
   - If starting from scratch, infer layout from codebase structure and propose both human-facing documentation (`README.md`, `docs/`) and AI assistant guidance (`AGENTS.md`, `CLAUDE.md`).
2. **Alignment & Structure Proposal:**
   - Present proposed file hierarchy in chat and await explicit user approval before drafting or reorganizing files.
3. **Iterative Generation & Review:**
   - **Zero Flags Invariant (Mandatory):** Never use country flag emojis (e.g., US, UK, ES, MX) or flag graphics in documentation, `README.md`, wikis, headers, badges, or language switchers. Always use clean semantic text (`[English](#english) | [Español](#español)`) and unadorned headings (`## English`, `## Español`).
   - Write files upon approval using clean Markdown and iterate on user feedback.

---

### Section B: Synchronization & Update (Code Changes)

1. **Locate & Cross-Reference:**
   - Scan human-facing documentation (`README.md`, `docs/`) AND AI guidance documents (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.agents/`).
   - Review working tree diffs and commit history to identify modified behaviors, parameters, endpoints, architecture shifts, new skills/agents, or setup steps.
2. **Propose Updates:**
   - **CRITICAL:** Do NOT modify files immediately. Present a clear summary of proposed updates across human docs and AI guidance files in chat and request explicit approval.
3. **Apply & Report:**
   - Write changes after approval, strictly enforcing the **Zero Flags Invariant** and **Path Privacy** (never leak local user paths).
   - Report updated files, or state if no documentation changes were needed.

---

### Section C: Knowledge Lifecycle & Obsolescence Audit (Learnings Pruning)

1. **Knowledge Inventory & Inspection:**
   - Scan `docs/learning/`, `docs/external-references/`, `docs/adr/`, and `docs/architecture/` against the current codebase and active dependencies.
2. **Tri-State Classification Matrix:**
   - **Category 1 (Active / Invariant):** Active architectural invariants, non-trivial gotchas, or enduring operational constraints. Keep intact.
   - **Category 2 (Consolidate / Subsumed):** Fragmented or redundant notes that should be merged into a formal ADR (`docs/adr/`) or centralized guide.
   - **Category 3 (Obsolete / Ephemeral / Low-Value):** Ephemeral stress-test reports (`*-stress-test.md`) for completed/discarded proposals, workarounds for removed libraries, or trivial low-signal notes.
3. **Interactive Pruning Proposal:**
   - **CRITICAL:** NEVER delete or archive files automatically. Present a table (`File Path`, `Classification`, `Obsolescence Reason`, `Recommended Action`) and await explicit user approval before executing consolidations or deletions.

---

### Section D: Knowledge & ADR Harvesting (Session Learnings Extraction)

1. **Analyze Scope & Diffs:**
   - Default to analyzing unpushed changes or recent commits if no specific scope is provided. Search for complex logic, new design patterns, bug workarounds, and significant architectural decisions.
2. **Apply Longevity & Signal Gating:**
   - Filter out transient trial-and-error logs, routine syntax adjustments, or low-signal one-liners. Only preserve insights with enduring future value:
     - **Decisions:** Why a specific library, schema, or architecture was chosen over alternatives.
     - **Lessons/Gotchas:** Non-trivial bugs, subtle platform edge cases, or tricky configurations.
     - **Patterns:** Reusable architectural conventions introduced in the codebase.
3. **Deduplicate & Persist Upon Approval:**
   - Check `docs/learning/`, `docs/external-references/`, and `docs/adr/` to avoid duplicating existing records.
   - **CRITICAL:** Present extracted learnings/decisions to the user first and request explicit permission before creating files.
   - Once approved, persist architectural decisions as sequential ADRs in `docs/adr/` and high-signal technical lessons in `docs/learning/<topic-slug>.md`. If changes were trivial, report that no persistent learning record was required.

---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
