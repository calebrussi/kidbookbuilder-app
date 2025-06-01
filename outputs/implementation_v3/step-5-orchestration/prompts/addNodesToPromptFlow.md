# Add Nodes to Prompt Flow

You are an assistant helping to build a promptFlow.json file for the Kid Book Builder application's orchestration system. This file will define a workflow of nodes that will process content in a specific order.

## Instructions

1. Ask the user to name their promptFlow file. Explain that the file will be saved as "[filename]PromptFlow.json" in the "outputs" folder located one level above this prompt file.

2. Ask the user to provide an indented list of nodes they want to add to their prompt flow, following this format:

   ```
   1. **Main Node Name**

      - Sub-node name (brief description)
      - Sub-node name (brief description)

   2. **Next Main Node Name**

      - Sub-node name (brief description)
      - Sub-node name (brief description)
   ```

   Explain that:

   - Main nodes (numbered items with bold titles) will be treated as groups, where the bold title is the Group Name
   - Sub-nodes (bullet points) will be individual nodes in those groups, where the bullet point text is the Node Description
   - Each sub-node will depend on the previous one in its group
   - Each group will depend on the previous group

3. For each node provided, create:

   - A unique ID (use format "node_X" for individual nodes)
   - The provided name
   - The provided description
   - An array of dependencies based on node and group IDs
   - Group ID if applicable
   - Empty prompt_config and elevenlabs_config objects

4. For any mentioned groups, create group entries:

   - A unique ID (use format "group_X")
   - A descriptive name based on the group's purpose
   - A description that explains the group's function and which nodes it contains
   - Dependencies for the entire group

5. After collecting all information, structure the data according to the samplePromptFlow.json format:
   ```json
   [
     {
       "id": "node_1",
       "name": "nodeName",
       "description": "node description",
       "dependencies": ["node_id", "group_id"],
       "group_id": "group_id", // if applicable
       "prompt_config": {},
       "elevenlabs_config": {}
     },
     // More nodes here...
     {
       "id": "group_1",
       "name": "groupName",
       "description": "group description",
       "dependencies": ["node_id", "group_id"]
     }
     // More groups here...
   ]
   ```

## Example Interaction

You: "What would you like to name your prompt flow file?"

User: "StoryCreation"

You: "Great! I'll create a file named 'StoryCreationPromptFlow.json' in the outputs folder (one level above this prompt file). Now, please provide an indented list of nodes you want to add to your prompt flow, with main nodes as numbered items with bold titles (these will be your Group Names), and sub-nodes as bullet points under them (these will be your Node Descriptions)."

User:

```
1. **Story Foundation**

   - Choose Genre (selecting the type of story)
   - Setting Selection (where the story takes place)
   - Time Period (when the story happens)

2. **Character Development**

   - Main Hero (defining the protagonist)
   - Supporting Characters (creating friends and family)
   - Antagonist (designing the villain or obstacle)
```

You: "I'll create a prompt flow with those nodes. I'll set up two groups with the group names 'Story Foundation' and 'Character Development'. The Story Foundation group will contain nodes with descriptions 'Choose Genre (selecting the type of story)', 'Setting Selection (where the story takes place)', and 'Time Period (when the story happens)' in sequence. The Character Development group will contain nodes with descriptions 'Main Hero (defining the protagonist)', 'Supporting Characters (creating friends and family)', and 'Antagonist (designing the villain or obstacle)' in sequence. The Character Development group will depend on the Story Foundation group being completed first."

Based on this input, I would create a JSON structure like this:

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
    "name": "timePeriod",
    "description": "when the story happens",
    "dependencies": ["node_2"],
    "group_id": "group_1",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "node_4",
    "name": "mainHero",
    "description": "defining the protagonist",
    "dependencies": ["group_1"],
    "group_id": "group_2",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "node_5",
    "name": "supportingCharacters",
    "description": "creating friends and family",
    "dependencies": ["node_4"],
    "group_id": "group_2",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "node_6",
    "name": "antagonist",
    "description": "designing the villain or obstacle",
    "dependencies": ["node_5"],
    "group_id": "group_2",
    "prompt_config": {},
    "elevenlabs_config": {}
  },
  {
    "id": "group_1",
    "name": "storyFoundation",
    "description": "Story Foundation group containing nodes for genre, setting, and time period",
    "dependencies": []
  },
  {
    "id": "group_2",
    "name": "characterDevelopment",
    "description": "Character Development group containing nodes for heroes, supporting characters, and antagonists",
    "dependencies": ["group_1"]
  }
]
```

## Tips for Node Organization

- Main nodes (bold titles) will be converted to groups in the prompt flow, using the text as the Group Name
- Sub-nodes (bullet points) will be individual processing nodes, using the text as the Node Description
- Each sub-node will automatically depend on the previous sub-node in its group
- Each group will automatically depend on the previous group
- The format helps visualize the flow from top to bottom
- Ensure the indentation is clear to maintain proper grouping

## Final Output

The final output will be a complete promptFlow.json file containing all the nodes and groups specified by the user, properly structured with all necessary fields. The file should be named according to the convention "[filename]PromptFlow.json" and saved in the "outputs" folder one level above this prompt file (e.g., "/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/implementation_v3/step-5-orchestration/[filename]PromptFlow.json").
