---
name: ami-expert-council
description: Spawns a council of specialized subagents tailored to discuss, debate, and refine a user's idea or proposed change from multiple perspectives.
allowed-tools:
  - SubagentCreation
  - AgentCommunication
---

# Instructions for ami-expert-council

This skill helps you create a specialized panel of subagents to thoroughly discuss, debate, and refine a user's idea or proposed change from multiple perspectives before committing to an implementation.

## Workflow

1. **Analyze the User's Idea:**
   - Understand the context and nature of the proposed change (e.g., UI/UX frontend overhaul, complex backend formula change, architectural refactor).

2. **Determine the Required Experts:**
   - Based on the idea, identify 2 to 4 distinct expert roles needed to provide a comprehensive debate.
   - Example (Frontend change): `ui_designer`, `ux_researcher`, `product_manager`.
   - Example (Algorithm/Formula change): `data_scientist`, `senior_backend_dev`, `domain_expert`.
   - Example (Architecture change): `software_architect`, `security_auditor`, `devops_engineer`.

3. **Instantiate the Subagents:**
   - Inform the user that you are assembling a council of experts (list their roles) to discuss the idea.
   - Using your native environment capabilities (whether API tools or configuration files), create a distinct subagent for each expert role you identified.
   - For each subagent, provide a detailed system prompt instructing them to critically evaluate the user's idea from their specific domain's perspective, identify potential pitfalls, and debate with the other experts. Emphasize that they should respond concisely and stay in character.
   - Ensure these subagents are restricted to discussion only (disable their write/execute permissions).

4. **Orchestrate the Council:**
   - Launch the subagents concurrently.
   - Provide them with the user's idea and ask for their initial assessment and concerns from their specific role's perspective. Tell them they are part of a council.

5. **Facilitate the Debate:**
   - Wait for the subagents to respond.
   - Use your native inter-agent communication capabilities to route messages between them. If subagents raise conflicting points, share one subagent's points with the others and ask for their rebuttal or agreement.
   - Keep the discussion focused and concise (1-2 rounds of debate is usually enough).

6. **Synthesize and Present to the User:**
   - Once the council has reached a consensus or clearly outlined the trade-offs, summarize the discussion for the user.
   - Present the pros, cons, and a consolidated recommendation based on the experts' feedback.
   - Ask the user how they would like to proceed based on this advice.

## Important Rules
- **Do not let the subagents converse indefinitely.** You are the facilitator and must synthesize their outputs.
- **Ensure diverse perspectives.** The experts should have distinct, sometimes opposing priorities (e.g., a PM prioritizing speed vs. an Architect prioritizing technical debt) to generate a healthy debate.
- **Communicate in the user's language.** When presenting the synthesis to the user, translate the findings into their preferred language (e.g., Spanish).
