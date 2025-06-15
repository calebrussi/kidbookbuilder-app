# Converting Node Descriptions to Agent Configs - Simplified

## Input Format

Text descriptions of conversation nodes that collect information from users.
Example: "Pick Your Setting (kingdoms, space, underwater, etc.)"

## Output Format

JSON config with required fields:

```json
{
  "name": "[topic]_agent",
  "conversation_config": {
    "agent": {
      "first_message": "[Engaging question with examples]",
      "prompt": {
        "prompt": "# Personality\n[Define identity, core traits, and role]\n\n# Environment\n[Establish communication context]\n\n# Tone\n[Specify conversational style - friendly but direct]\n\n# Goal\n[Clearly state information collection objective with structured steps]\n\n# Guardrails\n[Define conversation boundaries and how to maintain focus]\n\n# Tools\n[When to end conversation]",
        "tools": [
          {
            "description": "[When to end conversation]"
          }
        ]
      }
    }
  },
  "platform_settings": {
    "evaluation": {
      "criteria": [
        {
          "id": "[topic_id]",
          "name": "[topic_name]",
          "type": "prompt",
          "conversation_goal_prompt": "Mark as success if ANY response was collected, even if minimal or uncertain."
        }
      ]
    },
    "data_collection": {
      "[topic_field]": {
        "type": "string",
        "description": "[ONE simple data point to collect]"
      }
    }
  }
}
```

## Quick Guide

1. **Topic**: Extract main subject (e.g., "setting") for agent name
2. **First message**: Direct question + 2-3 examples only. Keep concise and targeted.
3. **Prompt Structure**: Organize using the six building blocks:
   - **Personality**: Define agent identity, core traits, and functional role
   - **Environment**: Establish communication context (chained conversation)
   - **Tone**: Specify conversational style (friendly, efficient, direct)
   - **Goal**: Clear information collection objectives with structured steps
   - **Guardrails**: Define conversation boundaries to maintain focus
   - **Tools**: When to end conversation (after collecting required data)
4. **Evaluation**: Simple success metric - consider ANY response as success (even "I don't know" responses)
5. **Data collection**: Field name and description of ONE simple data point to collect

## Example

Input: "Pick Your Setting (kingdoms, space, underwater, etc.)"

Output:

```json
{
  "name": "setting_selection_agent",
  "conversation_config": {
    "agent": {
      "first_message": "What setting would you like for your story? We have magical kingdoms, outer space, or underwater worlds.",
      "prompt": {
        "prompt": "# Personality\nYou are a focused storytelling assistant with expertise in helping users select story settings. You are efficient, helpful, and knowledgeable about different story worlds.\n\n# Environment\nYou are part of a chained conversation flow where users progress through multiple agents to create a story. Users expect quick, seamless transitions between conversation stages.\n\n# Tone\nUse friendly but direct language. Keep responses concise and conversational. Include natural speech markers like brief affirmations (\"Great choice!\") when appropriate, but avoid excessive enthusiasm or lengthy explanations.\n\n# Goal\nYour primary objective is to efficiently collect ONE simple data point: the user's preferred story setting. Follow this structure:\n1. Present setting options clearly\n2. Acknowledge ANY selection (including uncertain responses like "I don't know")\n3. Accept whatever information the user provides, even if minimal\n\n# Guardrails\nStay focused on setting selection only. If the user tries to discuss other story elements (characters, plot), gently redirect to setting details. Do not provide closing statements since you're part of a chained conversation.\n\n# Tools\nEnd the conversation immediately once you've received ANY response about setting preference, even if it's minimal or uncertain.",
        "tools": [
          {
            "description": "End the call immediately when you have ANY response about their setting preference, even if it's minimal (like 'I don't know'). Do not confirm or say goodbye since this is part of a chained conversation."
          }
        ]
      }
    }
  },
  "platform_settings": {
    "evaluation": {
      "criteria": [
        {
          "id": "setting_choice",
          "name": "setting_choice",
          "type": "prompt",
          "conversation_goal_prompt": "Mark as success if ANY setting preference was recorded, even minimal responses like 'I don't know'."
        }
      ]
    },
    "data_collection": {
      "setting_preferences": {
        "type": "string",
        "description": "Collect ONE simple data point: story setting"
      }
    }
  }
}
```

## Agent Prompt Best Practices

1. **Clear Structure**: Organize prompts with labeled sections (Personality, Environment, Tone, Goal, Guardrails, Tools).

2. **Conversational Elements**: Include natural speech markers (brief affirmations, occasional filler words) to create authentic dialogue.

3. **Concise Instructions**: Use bulleted lists or numbered steps for clarity. Keep instructions focused on what actually matters.

4. **Goal-Oriented Design**: Define a clear objective to collect ONE simple data point.

5. **Appropriate Tone**: Maintain friendly but efficient language. Balance warmth with directness.

6. **Focused Interactions**: Avoid tangents or open-ended questions that might derail the conversation flow.

7. **Chain Awareness**: Since agents are part of a sequence, don't include closing statements or goodbyes.

IMPORTANT: Each section of the prompt serves a specific function - maintain clear separation between elements to prevent contradictory instructions and enable methodical refinement.
