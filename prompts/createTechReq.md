# Technical Requirements Document Generator

## Overview
This template guides you (the AI assistant) in creating technical requirements based on the business requirements document (`busReq.md`). The output will be saved in `reqs/techReq.md` relative to the project root.

## Process Instructions for AI
1. Create or update the file `reqs/techReq.md`
2. Read the business requirements thoroughly, if there is no business requirements given, ask the user to provide them
3. For each step:
   - Ask the user the driving question in the md file
   - Complete the specified analysis tasks, based on the business requirements
   - Document findings using the format specified below
   - Keep responses extremely concise, short and focused
   - Process one step at a time, waiting for explicit confirmation before proceeding
   - Maintain the step-by-step structure in the output document

## Document Sections

### Step 1: Core Workflow
"What does a typical user session look like?"
- Map workflow to technical components
- Define data models
- Outline system architecture

### Step 2: Integration Needs
"What external services are needed?"
- List required integrations
- Define API requirements
- Specify security needs

### Step 3: Technical Foundation
"What are the main technical priorities?"
- Define core architecture
- Specify infrastructure
- Design key systems

## Document Format
```
# Project Name: Technical Requirements

## Step [N]: [Section Name]

### User Response
[Key points from user's answer]

### Technical Requirements
[Requirements based on response]

### Implementation Notes
[Key technical decisions]
```

---
Guidelines:
1. Let user's response guide the technical analysis
2. Focus on critical requirements first
3. Consider scalability and maintenance