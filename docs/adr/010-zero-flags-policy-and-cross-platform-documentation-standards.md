# 10. Zero Flags Policy & Cross-Platform Repository Documentation Standards

Date: 2026-09-05

## Status

Accepted

## Context

When generating or synchronizing repository documentation (`README.md`, bilingual documentation, release notes, changelogs, tables of contents, and UI navigation links), Large Language Models (LLMs) exhibit a strong pre-trained bias toward injecting country flag emojis (such as `US`, `UK`, `ES`, `MX`, etc.) adjacent to language labels or within section headings.

This practice introduces multiple technical, semantic, and platform compatibility failures:

1. **Semantic Inaccuracy and Cultural Exclusion:** Flags represent political states and sovereign territories, NOT languages. A language such as Spanish is spoken across 20+ sovereign nations, and English is used globally across dozens of countries. Associating a single national flag with a global language introduces regional bias and geographic inaccuracy.
2. **Broken Rendering and Unicode Degradation on Windows:** In Windows environments (PowerShell, CMD, terminal emulators, XAML/WPF controls, and various Markdown renderers), Unicode Regional Indicator Symbols (flag sequences) fail to render as color graphics. Instead, they decompose into pairs of isolated letters (e.g. `[U][S]`, `[E][S]`), monochrome silhouettes, or unprintable tofu rectangles (`[?]`).
3. **Anchor Link Breakage:** Markdown parsers slugify emoji sequences unpredictably, turning clean fragment identifiers (e.g. `#english`) into unstable dashed slugs (e.g. `#-english`), which breaks cross-language anchor navigation when emojis are stripped or normalized.

## Decision

We have established the **Zero Flags Policy** as an architectural invariant across the Amiga IA ecosystem:

1. **Mandatory Zero Flags Rule in Prompts and Directives:**
   - Enforced in `AGENTS.md` (Rule 20), prohibiting country flag emojis or flag graphics across all documentation, release notes, changelogs, badges, and user interfaces.
   - Incorporated into `ami-doc-architect` (Review & Publish quality gate), `ami-manage-docs` (Sections A and B invariants), `ami-architect-project` (Phase 5 README scaffolding), and `ami-release-manager` (Release notes drafter verification).
   - Documented in declarative rules (`rules/ami-rules.md` and `rules/documentation_standards.md`).

2. **Standardized Semantic Navigation & HTML Anchors:**
   - Bilingual language switchers must strictly use clean semantic text links:
     `[English](#english) | [Español](#español)` or `[English](README.md) | [Español](README.es.md)`
   - Section headers must use clean unadorned headings with explicit HTML anchors:
     `<a name="english"></a>`
     `## English`
   - In-app UI and web interfaces must use native language names or neutral internationalization icons (e.g., globe), never flags.

3. **Strict Prompt Hygiene (Parity with Rule 18):**
   - In keeping with Rule 18 (No Emojis in Agent/Skill Prompts), prompt definitions and skill files reference flag restrictions using text labels (e.g., `[Flag]`, `(e.g., US, UK, ES, MX)`) rather than literal emoji pictographs, ensuring zero token fragmentation and clean test passes.

## Consequences

- **Positive:** Guarantees 100% clean rendering across all operating systems, consoles, and desktop UI engines. Eradicates regional bias in internationalization and stabilizes GitHub/GitLab anchor navigation.
- **Negative:** None. Pure engineering hygiene and semantic correctness.
