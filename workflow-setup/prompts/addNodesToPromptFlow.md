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
2. **Nodes**: Sub-nodes (bullet points) become individual nodes with camelCase names
3. **Dependencies**:
   - Each sub-node depends on the previous sub-node in its group
   - First sub-node in a group depends on the previous group
   - Groups depend on previous groups
4. **IDs**: Use "node_X" for nodes, "group_X" for groups (increment X)
5. **Names**: Convert to camelCase, extract key concept from description

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
    "name": "chooseGenre",
    "description": "selecting the type of story",
    "dependencies": [],
    "group_id": "group_1",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "node_2",
    "name": "settingSelection",
    "description": "where the story takes place",
    "dependencies": ["node_1"],
    "group_id": "group_1",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "node_3",
    "name": "mainHero",
    "description": "defining the protagonist",
    "dependencies": ["group_1"],
    "group_id": "group_2",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "node_4",
    "name": "supportingCharacters",
    "description": "creating friends and family",
    "dependencies": ["node_3"],
    "group_id": "group_2",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "group_1",
    "name": "storyFoundation",
    "description": "Story Foundation group containing nodes for genre selection and setting selection",
    "dependencies": []
  },
  {
    "id": "group_2",
    "name": "characterDevelopment",
    "description": "Character Development group containing nodes for main hero and supporting characters",
    "dependencies": ["group_1"]
  }
]
```

Always create complete JSON structures with proper dependencies and camelCase naming.
