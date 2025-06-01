# Create New Update Document

## Purpose

This document provides instructions for creating new update prompt documents in this folder. Each update document serves as a comprehensive guide for applying specific changes to an existing codebase by executing the prompt in a new chat session.

## Update Document Structure

Based on the existing update documents in this folder, follow this standardized structure when creating new update prompts:

### 1. Document Header

````markdown
# Update - [Descriptive Name]

## How to Use This Document

This document provides a comprehensive guide for [brief description of what the update does].

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/[update-filename].md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```
````

---

````

### 2. Prerequisites Section
```markdown
## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- `[file path 1]`
- `[file path 2]`
- `[additional files as needed]`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---
````

### 3. Task Overview

```markdown
## Task Overview

[Clear, concise description of what this update accomplishes]

---
```

### 4. Implementation Steps

```markdown
## Implementation Steps

### 1. [Step Name]

**Instructions:**

1. [Detailed step-by-step instructions]
2. [Include specific technical details]
3. [Provide context for decisions]

**Key Data Points:**

- [Important information to reference]
- [Configuration details]
- [File locations]

### 2. [Next Step Name]

**Instructions:**
[Continue with detailed steps...]
```

### 5. Files to Modify Section

```markdown
## Files to Modify

- `[file path]` - [Description of changes]
- `[file path]` - [Description of changes]

## Reference Sources

- `[file path]` - [Description of what this file provides]
- `[file path]` - [Additional reference information]

---
```

### 6. Validation Steps

```markdown
## Validation Steps

After implementation:

1. [Verification step 1]
2. [Verification step 2]
3. [Testing requirements]
4. [Success criteria]

---
```

### 7. Notes Section

```markdown
## Notes

- **Important consideration 1**: [Details]
- **Important consideration 2**: [Details]
- [Additional technical notes]
- [Best practices to follow]
```

## Instructions for Creating Updates

When building out update prompt instructions:

1. **Use a numbering sequence for each update** - Number each distinct update/change within the document
2. **Listen for specific changes and contexts** - Only capture the updates explicitly provided
3. **Don't add additional context** - Focus only on the changes requested
4. **Ensure required files are specified** - Always identify which files need to be attached to the chat context
5. **Write for execution in a new chat** - The document should be completely self-contained
6. **Follow the standardized structure** - Use the sections outlined above consistently
7. **Be specific about file paths** - Use absolute paths when possible
8. **Include validation steps** - Always provide ways to verify the changes worked
9. **Document the completion process** - Include the file movement to `applied` folder

## File Naming Convention

Name update files using this pattern:

- `update-[DescriptiveName].md` (e.g., `update-AgentIdWorkflowMapping.md`)
- Use PascalCase for the descriptive name
- Keep names concise but clear

## Ready to Begin

When you're ready to create a new update document, provide:

1. The specific changes/updates you want to capture
2. The context and files involved
3. Any special requirements or considerations

The update document will be built incrementally based on your input, following the structure outlined above.
