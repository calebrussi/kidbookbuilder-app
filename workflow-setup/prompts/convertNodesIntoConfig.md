# Converting Node Descriptions to Agent Configs - Simplified

## Input Format

Text descriptions of conversation nodes that collect information from a child user.
Example: "Pick Your Setting (kingdoms, space, underwater, etc.)"

## Output Format

JSON config with required fields:

```json
{
  "name": "[topic]_selection_agent",
  "agent": {
    "first_message": "[Engaging question with examples]"
  },
  "prompt": {
    "prompt": "[Agent instructions]",
    "tools": {
      "description": "[When to end conversation]"
    }
  },
  "platform_settings": {
    "evaluation": {
      "criteria": [
        {
          "id": "[topic_id]",
          "name": "[topic_name]",
          "type": "prompt",
          "conversation_goal_prompt": "[Success criteria]"
        }
      ]
    },
    "data_collection": {
      "[topic_field]": {
        "type": "string",
        "description": "[Data to collect]"
      }
    }
  }
}
```

## Quick Guide

1. **Topic**: Extract main subject (e.g., "setting") for agent name
2. **First message**: Direct question + 2-3 examples only. Do NOT include phrases like "or if you want to share something fun" or similar open-ended additions
3. **Prompt**: Efficient, child-friendly agent instructions focused on quick data collection
4. **Ending criteria**: Define required information without confirmation (agents are chained)
5. **Evaluation**: Success metrics for information gathering
6. **Data collection**: Field name and description of data to collect

## Example

Input: "Pick Your Setting (kingdoms, space, underwater, etc.)"

Output:

```json
{
  "name": "setting_selection_agent",
  "agent": {
    "first_message": "What setting would you like for your story? We have magical kingdoms, outer space, or underwater worlds."
  },
  "prompt": {
    "prompt": "You are a focused storytelling assistant talking to a 10-year-old child. Your job is to quickly collect their story setting preference. Present options (kingdoms, space, underwater, etc.) efficiently. Be friendly but direct. Get their choice and any important details as quickly as possible. Do not be chatty or use excessive enthusiasm. Since you're part of a chained conversation, do not provide closing statements or goodbyes.",
    "tools": {
      "description": "End the call immediately when you have their preferred setting and key details. Do not confirm or say goodbye since this is part of a chained conversation."
    }
  },
  "platform_settings": {
    "evaluation": {
      "criteria": [
        {
          "id": "setting_choice",
          "name": "setting_choice",
          "type": "prompt",
          "conversation_goal_prompt": "Check if we gathered: preferred setting, specific details, and elements they're excited about"
        }
      ]
    },
    "data_collection": {
      "setting_preferences": {
        "type": "string",
        "description": "Collect: preferred setting, specific details, and elements they're excited about"
      }
    }
  }
}
```

Always use child-friendly but efficient language. Focus on quick data extraction. Avoid excessive enthusiasm or lengthy explanations. No closing statements since agents are chained together.

IMPORTANT: Do not include phrases like "or if you want to share something fun about..." or similar open-ended additions - keep it direct and focused.
