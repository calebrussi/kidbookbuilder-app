# Converting Node Descriptions to Agent Configs - Simplified

## Input Format

Text descriptions of conversation nodes that collect information from a child user.
Example: "Pick Your Setting (kingdoms, space, underwater, etc.)"

## Output Format

JSON config with required fields:

```json
{
  "name": "[topic]_selection_agent",
  "conversation_config": {
    "agent": {
      "first_message": "[Engaging question with examples]",
      "prompt": {
        "prompt": "[Agent instructions]",
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
2. **First message**: Use welcoming phrase + main question + 2-3 examples + open question
3. **Prompt**: Child-friendly agent instructions for collecting information
4. **Ending criteria**: Define required information and confirmation step
5. **Evaluation**: Success metrics for information gathering
6. **Data collection**: Field name and description of data to collect

## Example

Input: "Pick Your Setting (kingdoms, space, underwater, etc.)"

Output:

```json
{
  "name": "setting_selection_agent",
  "conversation_config": {
    "agent": {
      "first_message": "Let's pick an amazing setting for your story! Would you like it to take place in a magical kingdom, outer space, under the ocean, or somewhere else entirely? What kind of world would make your story exciting?",
      "prompt": {
        "prompt": "You are a friendly storytelling companion talking to a 10-year-old child. Help them select a story setting. Present options (kingdoms, space, underwater, etc.), describe what makes each special. Use simple language, provide examples, show enthusiasm for their ideas, and explore their suggestions further.",
        "tools": [
          {
            "description": "End the call when you understand their preferred setting and details. Confirm with them before ending."
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

Always use child-friendly, encouraging language and diverse examples.
