# Amiga IA — Full Capabilities Catalog

[English](catalog.md) | [Español](catalog.es.md)

Complete specification and functional matrix of all **38 autonomous agents (14) and declarative skills (24)** included in the Amiga IA ecosystem. All capabilities strictly adhere to the `ami-` namespace prefix.

---

## 1. Master Orchestrators & Code Review

Autonomous subagents and skills that coordinate multi-threaded workflows, perform deep Pull Request inspections, and conduct adversarial falsification audits.

| Component | Type | Responsibility & Capabilities |
|---|---|---|
| **`ami-tech-lead`** | Agent | Master Project Planning & Architecture Orchestrator. Evaluates repository health, scopes features, coordinates architectural blueprints, and enforces modular contracts. |
| **`ami-pr-reviewer`** | Agent | Master orchestrator agent that evaluates existing Pull Requests via dual review modes (static Code Review vs dynamic Full Review with test execution), repository context ingestion, and adversarial verification trails. |
| **`ami-adversarial-verifier`** | Agent | Fresh-context reviewer given only the diff and requirement, seeking evidence-based defects to eliminate confirmation bias. |
| **`ami-pr-publisher`** | Agent | Master orchestrator agent that performs a comprehensive review, summary drafting, and conflict audit on Pull Requests before publishing. |
| **`ami-push-assistant`** | Agent | Pre-push orchestrator that conducts baseline quality checks, scans for leaked API secrets/tokens, and verifies test suites prior to pushing to remote remotes. |
| **`ami-expert-council`** | Agent | Spawns a council of specialized subagents tailored to debate, stress-test, and refine architectural proposals from orthogonal perspectives in a single pass. |
| **`ami-review-self-pr`** | Skill | Operates as a stringent Senior Engineer reviewing local work-in-progress code, applying 5-dimension blind-spot probes (`[Blind-Spot Probe]`) and local remediation loops. |
| **`ami-review-peer-pr`** | Skill | Conducts peer reviews on teammate Pull Requests with acceptance criteria traceability and adversarial falsification checks (`[Falsification Check]`) to eliminate false alarms. |
| **`ami-analyze-pr-comments`** | Skill | Analyzes code review observations left by teammates on active PRs, organizing action items and formulating accurate replies. |
| **`ami-detect-pr-conflicts`** | Skill | Proactively detects overlapping commit histories and potential merge conflicts across active branches before PR publication. |
| **`ami-plan-commits`** | Skill | Analyzes the git working tree, performs security/leak audits, plans Conventional Commits, and safely executes staged git operations. |

---

## 2. Testing & Double-Blind Cleanroom TDD

Components implementing Harlan Mills' Cleanroom Software Engineering isolation principles, eliminating LLM confirmation bias and test overfitting.

| Component | Type | Responsibility & Capabilities |
|---|---|---|
| **`ami-cleanroom-arbiter`** | Agent | Master Cleanroom TDD Arbiter. Freezes formal interface contracts (`docs/contracts/`), dispatches isolated builder and tester subagents, executes test harnesses, and adjudicates failures. |
| **`ami-cleanroom-builder`** | Agent | Feature implementer for Cleanroom TDD. Writes production code strictly from formal interface contracts without viewing test implementations. |
| **`ami-cleanroom-tester`** | Agent | Independent black-box QA and test architect for Cleanroom TDD. Generates comprehensive boundary test suites strictly from contracts, completely isolated from production code. |
| **`ami-orchestrate-cleanroom`** | Skill | Double-Blind Cleanroom orchestration workflow. Interactively clarifies specifications, freezes formal contracts, dispatches isolated agents, and coordinates arbitration cycles. |
| **`ami-design-test-strategy`** | Skill | Formulates comprehensive QA test strategies, pyramid distributions (Unit, Integration, E2E), mocking boundaries, and CI quality gates prior to writing code. |
| **`ami-create-tests`** | Skill | Generates focused unit and regression test suites tailored to newly modified code lacking test coverage. |

---

## 3. Architecture, Codebase Hygiene & Knowledge Lifecycle

Tools for inspecting technical debt, managing architectural decision records (ADRs), conducting dependency audits, and maintaining long-term repository documentation.

| Component | Type | Responsibility & Capabilities |
|---|---|---|
| **`ami-repo-auditor`** | Agent | Master audit orchestrator that evaluates codebase technical debt, dependency hygiene, and security vulnerabilities across modules concurrently. |
| **`ami-doc-architect`** | Agent | Master documentation orchestrator. Coordinates greenfield docs generation, obsolescence audits, context research, and session learnings extraction. |
| **`ami-release-manager`** | Agent | Central orchestrator agent that automates version tag calculation, bilingual semantic changelog drafting, and GitHub release publication. |
| **`ami-discover-automations`** | Skill | Scans repositories for active CI/CD pipelines, package scripts, domain jobs, and discovers high-ROI automation opportunities from manual toil. |
| **`ami-audit-quality`** | Skill | Conducts deep inspections on modified code for maintainability, modular design best practices, security flaws, data schema consistency, and structural soundness. |
| **`ami-scan-tech-debt`** | Skill | Scans repositories for technical debt, obsolete imports, duplicated logic, dead code, and pending comments (TODOs/FIXMEs). |
| **`ami-analyze-dependencies`** | Skill | Audits project library health, detecting unused, outdated, vulnerable, or phantom dependencies in package manifests. |
| **`ami-manage-docs`** | Skill | Comprehensive documentation manager. Architects new documentation, synchronizes wikis with code diffs, harvests session learnings, and prunes obsolete notes. |
| **`ami-research-context`** | Skill | Actively researches up-to-date external documentation and benchmarks, persisting findings into `docs/external-references/` to prevent context degradation. |
| **`ami-prepare-release`** | Skill | Calculates semantic version tags and drafts bilingual release notes from git history in an atomic pre-tag workflow. |
| **`ami-debug-issue`** | Skill | Performs an evidence-based debugging procedure, systematically isolating root causes without guesswork and writing regression tests. |
| **`ami-architect-project`** | Skill | Interactively scaffolds initial project architectures, technology stacks, directory hierarchies, and bilingual starter documentation. |
| **`ami-plan-feature`** | Skill | Interactive feature planning workflow. Clarifies ambiguities and proposes architectural alternatives with the user before investigating context and drafting plans. |
| **`ami-stress-test-idea`** | Skill | Conducts adversarial premortem analysis on architectural proposals, exposing single points of failure (SPOFs), race conditions, and cost explosions. |

---

## 4. UX Architecture, UI Prototyping & Consistency Auditing

Specialized agents and declarative workflows for living interface specifications, mockup scaffolding, and design system token auditing.

| Component | Type | Responsibility & Capabilities |
|---|---|---|
| **`ami-ui-builder`** | Agent | Master UI, UX, and prototype specialist. Builds interactive HTML5/Tailwind mockups, standalone prototypes, and living visual documentation without polluting the primary context window. |
| **`ami-prototype-ui`** | Skill | Scaffolds self-contained, interactive HTML5 and Tailwind CSS UI mockups, screen prototypes, and visual specifications (`docs/mockups/`) for rapid feature validation. |
| **`ami-design-ux`** | Skill | Master UX architect. Designs user journeys, mental models, interaction ergonomics, usability heuristics, UX state matrices (the 5 states), and actionable microcopy (`docs/ux/`). |
| **`ami-audit-ui-consistency`** | Skill | Audits UI code and assets across web, desktop, and mobile platforms for design system token compliance, button hierarchy, interactive states, and zero icon duplication or semantic collisions. |

---

## 5. Data Science & SQL Optimization

Analytical agents and skills for query optimization, data profiling, and executive dashboard construction.

| Component | Type | Responsibility & Capabilities |
|---|---|---|
| **`ami-data-scientist`** | Agent | Master orchestrator agent for Data & SQL. Coordinates exploratory data analysis, bias auditing, database query optimizations, and executive dashboards. |
| **`ami-optimize-sql`** | Skill | Writes and refactors SQL across major database engines, eliminates query anti-patterns, recommends indexing strategies, and refactors complex joins into clean CTEs. |
| **`ami-build-dashboard`** | Skill | Builds interactive web dashboards and publication-quality Python visualizations from analytical datasets and KPIs. |
