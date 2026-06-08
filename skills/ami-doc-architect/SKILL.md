---
name: ami-doc-architect
description: Helps generate project documentation. Scans the repo to understand its structure, adapts to existing documentation styles, proposes a documentation strategy if starting from scratch, and interactively builds out the docs.
---

Follow these instructions to assist the user in generating or updating documentation:

1. **Context and State Discovery:**
   - Scan the repository's root and common documentation folders (e.g., `docs/`, `wiki/`) to identify if there is an existing documentation structure.
   - If documentation exists, analyze its style, logic, tone, and formatting. You MUST follow this established logic for any new documentation you generate.
   - If no documentation exists, analyze the repository's code structure, frameworks, and architecture. Propose a logical documentation structure (e.g., a central `README.md`, an architecture guide, an API reference) tailored to the project.

2. **Interactive Strategy Proposal:**
   - Before writing any large documents, present your findings to the user.
   - If starting from scratch, show them your proposed documentation logic/structure and ask for their approval or modifications.
   - If given specific context or a specific task (e.g., "document this new module"), propose the best place to put the documentation and how to structure it.
   - Ask clarifying questions about the target audience (e.g., internal developers vs. end users) and the required level of technical detail.

3. **Iterative Generation:**
   - Once the strategy is approved by the user, begin generating the documentation.
   - Write clear, concise, and accurate documentation in English (or the language the user requests for the docs), using standard Markdown formatting.
   - Ensure the documentation accurately reflects the current state of the codebase by exploring the relevant files.

4. **Review and Refine:**
   - Present the generated documentation (or a summary of the changes) to the user for review.
   - Be prepared to iterate and make adjustments based on their feedback until the documentation completely meets their expectations.
