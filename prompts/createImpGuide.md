# Prompt: Create Implementation Guide

## Context
Based on the core functionality section of the business requirements document, create a detailed implementation guide that defines the sequence of implementations needed to build the system. The guide should emphasize isolated component development with a focus on solving technical challenges independently.

## Instructions
1. Create an implementation guide document that:
   - Outlines a phased approach to building the solution
   - Structures implementation steps in a logical sequence
   - Focuses on incremental development in isolated folders
   - Prioritizes technical discovery and problem-solving over comprehensive architecture
   - Explains that outputs will be assembled into a cohesive application later

2. Include the following general phases in the guide (modify as appropriate for the specific project):
   - Phase 1: Environment Setup & Configuration
   - Phase 2: Core Infrastructure Development
   - Phase 3: Primary Feature Implementation
   - Phase 4: Secondary Feature Implementation
   - Phase 5: Integration & System Assembly

3. For each phase:
   - List specific implementation steps
   - Provide detailed sub-tasks for each step
   - Define clear expected outcomes that determine when the phase is complete
   - Specify that each phase should be implemented in an isolated folder
   - Emphasize minimal implementation that solves the core technical challenge
   - Specify that no shared utilities should be used across phases

4. Include an expected outcomes section for each phase that:
   - Lists concrete deliverables that must be produced
   - Defines measurable success criteria
   - Specifies required documentation
   - Provides clear standards for completion

5. Include a verification process section that:
   - Structures each step as a clean, independent script
   - Configures scripts to be runnable via package.json
   - Ensures script results are persisted to disk
   - Makes scripts self-contained and runnable in isolation
   - Includes clear input/output expectations

6. Clearly state that:
   - Each phase should be completely self-contained
   - The user will explicitly confirm when a phase is complete before proceeding
   - Only the minimum code needed should be scaffolded for each phase
   - Full application structure should not be duplicated across phases

7. Format the document using Markdown with proper headings, lists, and sections

8. Save the document in the appropriate folder

## Key Requirements to Address
- Use the technologies specified in the business requirements
- Follow best practices for the chosen technology stack
- Prioritize discovery of technical solutions over comprehensive implementation
- Build incrementally with verification at each step
- Design components that can be built and tested in isolation
- Structure implementation as runnable scripts with persisted outputs
- Explain that the spirit of the implementation is to identify technical unknowns and solve difficult steps first