# DRY Agent-Skill Architecture & Clean Git Workflow

## Overview
This document persistence record details the architectural decisions and Git workflow patterns established for the `amiga-ia` agentic suite.

---

## 1. DRY Agent-Skill Architecture Pattern

### Problem
Previously, orchestrator subagents (e.g., `ami-commit-assistant`, `ami-release-manager`, `ami-push-assistant`, `ami-pr-publisher`) directly performed CLI checks and inspected Git state before delegating to skills that repeated the exact same inspections. Additionally, single-skill wrapper subagents introduced unnecessary layers without orchestrating multi-skill flows.

### Architectural Decision
Establish a strict **Single Source of Truth (DRY)** separation between Skills and Agents:

- **Declarative Skills (`skills/*/SKILL.md`):**
  - Hold **100% of the technical domain logic**, checks, and audits (e.g., security leak detection, working tree analysis, SemVer calculations, dependency analysis, and code quality audits).
  - Act as portable, self-contained instruction modules.

- **Orchestrator Agents (`agents/*.md`):**
  - Act as **lightweight orchestrators** that sequence execution across multiple skills.
  - Manage **human-in-the-loop safety gates** by requesting explicit user approval in the chat.
  - Execute final CLI actions (`git commit`, `git push`, `gh release`).
  - Single-skill wrapper agents (such as `ami-commit-assistant`) were consolidated directly into the underlying skill (`ami-commit-planner`) to eliminate redundant orchestration layers.

---

## 2. Clean Git History & Remediation Patterns

### Unpushed Amend & Fixup Remediation
- **HEAD Commit Fixes:** When code quality or security audits detect issues in unpushed commits at `HEAD`, fixes are absorbed using `git commit --amend` rather than creating extra `fix:` commits.
- **Earlier Unpushed Commit Fixes:** Fixes targeting older unpushed commits in the local branch use `git commit --fixup <hash>` / `git rebase -i --autosquash`.
- **Pushed Commits Protection:** Once commits are pushed to remote branches, history rewriting is strictly prohibited, defaulting to standard `fix:` commits.

### Pre-Tag Commit Rule for Releases
- All hardcoded version updates (in source code, UI config dialogs, app manifests, and documentation) MUST be committed (`chore: bump version to <tag> [skip ci]`) and pushed **BEFORE** creating the Git Tag or GitHub release. This ensures the release Tag points directly to the commit containing all updated version references across the codebase.
