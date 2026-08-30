# 9. Knowledge Lifecycle, Learnings Obsolescence Audit & Ephemeral Document Gating

Date: 2026-08-30

## Status

Accepted

## Context

As repositories evolve and autonomous subagents actively capture session learnings, external research, and adversarial reviews, documentation directories (`docs/learning/`, `docs/external-references/`, and `docs/adr/`) accumulate content over time.

Two operational challenges were identified in long-running projects:

1. **Accumulation of Ephemeral and Low-Value Artifacts:**
   - Skills like `ami-stress-test-idea` frequently produced standalone files in `docs/external-references/` for transient ideas or prototype explorations that were either implemented, refactored, or discarded shortly after.
   - Session learning extractors without longevity thresholds could record low-signal trial-and-error notes, routine syntax fixes, or temporary workarounds for deprecated third-party libraries.
2. **Lack of a Formalized Knowledge Lifecycle & Obsolescence Auditor:**
   - While `ami-doc-architect` and `ami-manage-docs` handled greenfield documentation and diff synchronization, they lacked an explicit mechanism to periodically audit repository memory, evaluate the enduring relevance of past notes, and safely prune or consolidate obsolete learnings.

## Decision

We have established the following architectural invariants across the documentation and learning suite:

1. **Persistence Gating in Adversarial Stress-Testing (`ami-stress-test-idea`):**
   - Stress-testing reports are classified as ephemeral planning inputs by default, delivered directly in the interactive planning artifact (`implementation_plan.md`) or chat.
   - Standalone files in `docs/external-references/` are ONLY generated when the adversarial analysis uncovers permanent architectural invariants, security tripwires, or enduring operational constraints that future engineers must adhere to.
   - Persisted stress tests must include structured metadata (`Created`, `Last Updated`, `Status: Active | Transient | Superseded`, `Scope`).

2. **Longevity & Quality Gating in Learnings Extraction (`ami-extract-learnings`):**
   - A longevity filter is enforced before proposing new learning files, filtering out transient trial-and-error logs, routine syntax adjustments, or low-signal one-liners.
   - Deduplication against existing knowledge base files (`docs/learning/`, `docs/external-references/`, `docs/adr/`) is mandatory before proposing new files.

3. **Knowledge Lifecycle & Obsolescence Audit (`ami-doc-architect` + Mode C in `ami-manage-docs`):**
   - `ami-doc-architect` is designated as the master orchestrator for knowledge lifecycle health.
   - `ami-manage-docs` introduces **Mode C (Knowledge Lifecycle & Obsolescence Audit)**, utilizing a Tri-State Classification Matrix:
     - **Category 1 (Active / Invariant):** Permanent constraints and active patterns (retained).
     - **Category 2 (Consolidate / Subsumed):** Fragmented notes to be merged into central ADRs or wikis.
     - **Category 3 (Obsolete / Ephemeral / Low-Value):** Superseded stress-test notes, removed third-party workarounds, or obsolete notes.
   - Pruning, archival (`docs/archive/`), or file deletion strictly requires explicit user confirmation via an interactive proposal table.

## Consequences

- **Positive:** Repository memory remains lean, high-signal, and relevant across extended project lifecycles. AI assistant context windows are protected from ingesting stale or misleading workarounds.
- **Negative:** Documentation maintenance sessions involve an extra review step when auditing accumulated files, which is mitigated by clear tri-state classification tables.
