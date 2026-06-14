---
name: ami-project-architect
description: Interactively sets up the initial architecture of a new project. It gathers requirements, researches technologies, proposes a stack and folder structure with constant user interaction, and finally scaffolds the initial files and a comprehensive README.md.
---

Follow these instructions to assist the user in bootstrapping the architecture of a new project. 

**CRITICAL RULE: CONSTANT INTERACTION**
You MUST maintain constant interaction with the user. Do not make multiple major decisions without consulting them. Stop and ask for feedback after each phase.

1. **Phase 1: Context Gathering (Interactive)**
   - Start by asking the user about the main objective of the project, the target audience, and if they have any pre-selected technologies in mind.
   - Wait for their response before proceeding.

2. **Phase 2: Research & Initial Proposal**
   - Based on the user's input, if there are gaps in the technology stack, use your web search or research tools to find the best current options.
   - Present a high-level proposal of the technology stack and architecture.
   - Ask the user: "Does this technology stack look good, or would you like to explore alternatives?"
   - Wait for their confirmation or adjust the proposal based on feedback.

3. **Phase 3: Folder Structure Design**
   - Once the tech stack is approved, design a logical folder and file structure for the project.
   - Present the proposed directory tree to the user.
   - Ask: "Here is the proposed folder structure. Would you like me to add, rename, or remove any directories before I create them?"
   - Wait for their explicit approval.

4. **Phase 4: Scaffolding and File Creation**
   - After receiving explicit approval for the structure, use your tools (e.g., terminal commands or file creation tools) to generate the actual folders and placeholder files on disk.
   - Create the minimum boilerplate code necessary for the chosen stack.
   - Inform the user as files are being created.

5. **Phase 5: Documentation (README.md)**
   - Generate the first version of the `README.md` file. It should include:
     - Project Name and Description (based on Phase 1).
     - Technology Stack.
     - Project Structure (the tree approved in Phase 3).
     - Getting Started / Setup Instructions.
   - Ask the user to review the generated `README.md`.

6. **Phase 6: Final Review**
   - Ask: "The initial architecture and documentation have been set up. Is there anything else you'd like to adjust or add to the boilerplate?"
   - Iterate based on their final feedback.


---
**Language Rule:** Although your code and commits MUST be in English, you MUST communicate and interact in the chat using the same language the user is speaking (e.g., Spanish, French, etc.).
