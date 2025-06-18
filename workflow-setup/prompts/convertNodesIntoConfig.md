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
        "prompt": # Personality
[Define identity, core traits, and role]

# Environment
[Establish communication context]

# Tone
[Specify conversational style - friendly but direct]

# Goal
[Clearly state information collection objective with structured steps]

# Guardrails
[Define conversation boundaries and how to maintain focus]

# Tools
CRITICAL: End the conversation IMMEDIATELY after collecting the required data. Do not wait for user response, do not engage further.
        "tools": [
          {
            "name": "end_call",
            "description": "End the conversation immediately after collecting [specific data point]."
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

6. **Acknowledgment Structure**: Use a simple affirmation without asking if they need anything else

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
        "prompt": "# Personality\nYou are a focused storytelling assistant with expertise in helping users select story settings. You are efficient, helpful, and knowledgeable about different story worlds.\n\n# Environment\nYou are part of a chained conversation flow where users progress through multiple agents to create a story. Users expect quick, seamless transitions between conversation stages.\n\n# Tone\nUse friendly but direct language. Keep responses concise and conversational. Include natural speech markers like brief affirmations (\"Great choice!\") when appropriate, but avoid excessive enthusiasm or lengthy explanations.\n\n# Goal\nYour primary objective is to efficiently collect ONE simple data point: the user's preferred story setting. Follow this structure:\n1. Present setting options clearly\n2. Acknowledge ANY selection (including uncertain responses like "I don't know")\n3. Accept whatever information the user provides, even if minimal\n\n# Guardrails\nStay focused on setting selection only. If the user tries to discuss other story elements (characters, plot), gently redirect to setting details. Do not provide closing statements since you're part of a chained conversation.\n\n# Tools\nCRITICAL: End the conversation IMMEDIATELY after collecting the setting preference. Do not wait for user response, do not engage further.",
        "tools": [
          {
            "name": "end_call",
            "description": "End the conversation immediately after collecting the setting preference."
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

8. **Conversation Closure**: CRITICAL - End the conversation IMMEDIATELY after collecting the required data. Do not wait for user response, do not engage further. The end_call tool must be named and described exactly as shown in the example.

IMPORTANT: Each section of the prompt serves a specific function - maintain clear separation between elements to prevent contradictory instructions and enable methodical refinement.

IMPORTANT: The EXACT phrasing in the Tools section is critical for proper agent behavior:

1. Always use the CRITICAL prefix exactly as shown
2. Always include the phrase "Do not wait for user response, do not engage further"
3. The tool must be named "end_call" with a description specific to what is being collected
4. Never add any additional instructions like "confirm with user" or "check if needed"

Example tool descriptions that work correctly:

- Name collection agent: "End the conversation immediately after collecting the user's name."
- Hobby collection agent: "End the conversation immediately after collecting the user's hobby preferences."
- Story type agent: "End the conversation immediately after collecting the user's preferred story types."
