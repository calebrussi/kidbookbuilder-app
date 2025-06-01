# Code Changes Documentation

## Task Instructions

For this task, [SOURCE_FOLDER] was duplicated to [TARGET_FOLDER], and then updates were applied to [TARGET_FOLDER].

Create a snapshot document called [FEATURE_NAME]-changes.md that captures all the changes made in [TARGET_FOLDER] compared to [SOURCE_FOLDER]. Organize these changes by the specific update prompts or features that were implemented. Save this document in the outputs/web-app/v4/snapshots folder.

**Important**: Attach the original update prompts used for the transformation as references. These should be included either as quotes at the beginning of each update section or referenced as separate files. The prompts provide crucial context for understanding the intent behind the implementation changes.

The goal of this snapshot document is to apply it in a new chat as a prompt instruction to a cloned version of [SOURCE_FOLDER] and exactly recreate the current state of [TARGET_FOLDER].

## Documentation Structure

Follow this exact structure for your documentation:

1. **Title**: Start with a clear title: "[FEATURE_NAME] Changes Snapshot"
2. **Introduction**: Provide a brief overview of what the document contains
3. **Files Changed Summary**:
   - List all **New Files Created** with brief descriptions
   - List all **Files Modified** with bullet points detailing the key changes in each file
4. **Update Sections**: For each logical update/feature:
   - Include a heading describing the update (e.g., "WebSocket Integration")
   - Group related changes together under subsections
   - For each file changed, include:
     - Filepath with heading
     - Code snippets showing the most important changes
     - Brief explanations of what the code does

## Content Requirements

1. **Be extremely detailed** in documenting all differences between the implementations.
2. **Use exact code snippets** for all critical implementation details, not pseudocode.
3. **Include every file that was modified** or created.
4. **Group related changes** into logical update sections.
5. **Provide context** for why changes were made when it's clear from the implementation.
6. **Be extremely accurate** in all update details.
7. **Do not make assumptions** about implementation details not visible in the code.
8. Document both the interface and implementation changes.
9. **Do not make up any information** or make any assumptions about the implementation.
10. **Be extremely detailed** in documenting the differences.

## Format Requirements

1. Use proper Markdown formatting throughout the document.
2. Use code blocks with appropriate language syntax highlighting.
3. Use nested bullet points for hierarchical information.
4. Include file paths in code block comments or inline code formatting.
5. Format the document to be easily readable and navigable.
6. Organize changes logically by feature or update prompt.

## Example Structure

````
# [FEATURE_NAME] Changes Snapshot

This document provides a comprehensive overview of all changes applied to the `[SOURCE_FOLDER]` folder to create the current state of the `[TARGET_FOLDER]` folder. These changes were implemented according to several update prompts detailed below.

## Files Changed Summary

Below is a summary of all files that were modified or created as part of the [FEATURE_NAME] implementation:

### New Files Created

1. `[file/path]` - [brief description]
2. `[file/path]` - [brief description]

### Files Modified

1. `[file/path]`

   - [change description]
   - [change description]

## Update 1: [FEATURE NAME]

**Original Update Prompt:**
```
[Include the original update prompt text here that led to this feature implementation]
```

This update introduced [brief description of what was accomplished].

### 1. [Component/File Changed]

**[Action] file: `[file/path]`**

```[language]
[code snippet]
````

[Brief explanation of what the code does]

```

The final document should serve as a comprehensive reference that could be reconstructed in a new chat to exactly reproduce the same implementation in another project.
```
