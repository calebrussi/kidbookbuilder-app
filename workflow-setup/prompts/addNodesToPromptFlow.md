# Add Nodes to Prompt Flow - Simplified

## Input Format

Indented list of workflow nodes following this format:

```
1. **Main Node Name**
   - Sub-node name (brief description)
   - Sub-node name (brief description)

2. **Next Main Node Name**
   - Sub-node name (brief description)
   - Sub-node name (brief description)
```

## Output Format

JSON array of nodes and groups with required fields:

```json
[
  {
    "id": "node_X",
    "name": "[camelCase name]",
    "description": "[node description]",
    "dependencies": ["[dependent_node_or_group_id]"],
    "group_id": "group_X",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "group_X",
    "name": "[camelCase group name]",
    "description": "[group description and contained nodes]",
    "dependencies": ["[dependent_group_id]"]
  }
]
```

## Processing Rules

1. **Groups**: Main nodes (numbered, bold) become groups with camelCase names
2. **Nodes**: Each main node (numbered, bold) becomes ONE single node that handles all its bullet points
3. **Dependencies**:
   - Each node depends on the previous node
   - Groups depend on previous groups
4. **IDs**: Use "node_X" for nodes, "group_X" for groups (increment X)
5. **Names**: Convert to camelCase, extract key concept from main node title
6. **Description**: Combine all bullet points into a single description for the node

## Example

Input:

```
1. **Story Foundation**
   - Choose Genre (selecting the type of story)
   - Setting Selection (where the story takes place)

2. **Character Development**
   - Main Hero (defining the protagonist)
   - Supporting Characters (creating friends and family)
```

Output:

```json
[
  {
    "id": "node_1",
    "name": "storyFoundation",
    "description": "Story Foundation section covering genre selection and setting selection",
    "dependencies": [],
    "group_id": "group_1",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "node_2",
    "name": "characterDevelopment",
    "description": "Character Development section covering main hero definition and supporting characters creation",
    "dependencies": ["node_1"],
    "group_id": "group_2",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "group_1",
    "name": "storyFoundation",
    "description": "Story Foundation group containing the story foundation node",
    "dependencies": []
  },
  {
    "id": "group_2",
    "name": "characterDevelopment",
    "description": "Character Development group containing the character development node",
    "dependencies": ["group_1"]
  }
]
```

Always create complete JSON structures with proper dependencies and camelCase naming.
